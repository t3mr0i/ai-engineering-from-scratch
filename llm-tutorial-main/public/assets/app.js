/* ===========================================================================
   Understanding LLMs – app logic (vanilla JS, no build step).
   Drives navigation, mini-games, quiz and the personal evaluation.
   =========================================================================== */
(function () {
  "use strict";

  var D = window.APP_DATA;
  var T = window.APP_I18N || {};        // UI string pack (see lang/ui.<lang>.json)
  var LANG = window.APP_LANG || "en";   // active language
  var APP = document.getElementById("app");
  var STORE_KEY = "llmgame_v1";
  var EGG_CODE = T.egg_code;             // 🥚 secret code for the easter egg (admin prize)

  // Fill {placeholder} tokens in a UI string. Values are inserted verbatim, so
  // escape any user/content text with esc() before passing it in.
  function fmt(str, params) {
    return String(str == null ? "" : str).replace(/\{(\w+)\}/g, function (_, k) {
      return params && params[k] != null ? params[k] : "";
    });
  }
  // Wrap a string in the language's decorative quotes.
  function qt(s) { return (T.quote_open || '"') + s + (T.quote_close || '"'); }

  // ---- Flow: linear sequence of all steps ----
  var flow = [{ v: "cover" }];
  D.chapters.forEach(function (c, i) {
    flow.push({ v: "lecture", i: i }); // explain …
    flow.push({ v: "game", i: i });    // … then try it out
  });
  flow.push({ v: "quizIntro" });
  D.quiz.forEach(function (q, i) { flow.push({ v: "quiz", i: i }); });
  flow.push({ v: "results" });

  // ---- State (with localStorage persistence) ----
  var state = load() || { pos: 0, quiz: {}, doneChapters: {} };
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }
  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; } }
  function reset() { state = { pos: 0, quiz: {}, doneChapters: {} }; save(); render(); }

  var overlay = null; // 'glossary' | null

  // Switch language: persist the choice in a cookie and reload so the server
  // renders the matching content + UI pack (English is the default).
  function setLang(l) {
    document.cookie = "lang=" + l + "; path=/; max-age=31536000; samesite=lax";
    location.reload();
  }

  // =========================================================================
  // JOURNEY MODE (synchronized multiplayer game)
  // SYNC == null  → solo mode: the app behaves exactly as before.
  // =========================================================================
  var SYNC = window.APP_SYNC || null;
  var syncMode = !!SYNC;
  // If the user deliberately chose to "go solo", this session stays in solo
  // mode – even if a journey is currently running.
  if (state && state.preferSolo) { syncMode = false; SYNC = null; }
  var adminView = null;   // null | 'login' | 'console'
  var adminData = null;   // last admin_console state
  var adminCohort = null; // selected cohort: 'solo' | '<journeyId>' | null (=default)
  var pollTimer = null, adminTimer = null, adminTick = null, adminDataAt = 0;

  function joined() { return !!(SYNC && SYNC.player); }
  function jStatus() { return SYNC && SYNC.journey ? SYNC.journey.status : null; }
  function jUnlocked() { return SYNC && SYNC.journey ? SYNC.journey.unlocked : 0; }

  // Small JSON API call. Always returns an object (never throws).
  function api(action, payload, method) {
    return fetch("api?action=" + action, {
      method: method || "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : null,
      credentials: "same-origin",
    })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .catch(function () { return { ok: false, error: "network" }; });
  }

  // Adopt the response from join/state. Journey end → back to solo mode.
  function applySync(res) {
    if (!res || res.mode !== "journey") {
      syncMode = false; SYNC = null; stopPolling();
      return;
    }
    SYNC = { journey: res.journey, player: res.player, players: res.players };
    syncMode = true;
  }

  // Highest reachable flow position in journey mode (server-side lock).
  // Chapter i: lecture = 1+2i, game = 2+2i. Quiz/results only once all unlocked.
  function maxPos() {
    if (!syncMode || jStatus() !== "live") return flow.length - 1;
    var last = D.chapters.length - 1;
    if (jUnlocked() >= last) return flow.length - 1;
    return 2 + 2 * jUnlocked();
  }

  // Furthest point the player had already reached in THIS journey.
  // This way, stepping the unlock back never locks anyone out of content they
  // have already seen. Bound to a foreign/no journey → no advance.
  function reachedPos() {
    var jid = SYNC && SYNC.journey ? SYNC.journey.id : null;
    if (!jid || state.reachedJid !== jid) return 0;
    return state.reached || 0;
  }
  // Remembers the furthest point reached (only in live mode, per journey).
  // Only ever called with legitimate, already-unlocked positions.
  function bumpReached() {
    if (!syncMode || !SYNC || !SYNC.journey || jStatus() !== "live") return;
    var jid = SYNC.journey.id;
    if (state.reachedJid !== jid) { state.reachedJid = jid; state.reached = 0; }
    if ((state.pos || 0) > (state.reached || 0)) state.reached = state.pos;
  }
  // Actual ceiling for the player: the global unlock OR the point already
  // reached (whichever is further). This keeps already-seen content reachable
  // even when the host steps the unlock back.
  function navCap() {
    return Math.max(maxPos(), reachedPos());
  }

  // Is the player at their current frontier – the furthest point reached, with
  // still-locked content beyond it? Then "Continue" leads nowhere until the
  // host unlocks the next chapter. Already-seen pages (before this frontier)
  // stay free when paging back and forth.
  function atLockedFrontier() {
    return syncMode && jStatus() === "live" && state.pos >= navCap() && navCap() < flow.length - 1;
  }

  // Flow position → chapter index (for the progress report to the dashboard).
  function posToChapter(pos) {
    var s = flow[pos];
    if (s && (s.v === "lecture" || s.v === "game")) return s.i;
    return pos === 0 ? 0 : D.chapters.length; // quiz/results = "done"
  }
  // Reports progress to the dashboard – in journey mode as a journey player,
  // otherwise as a solo player (so admins also see users without a journey).
  // Before the first step (cover) no solo profile is created.
  function reportPos() {
    var chapter = posToChapter(state.pos);
    if (syncMode) {
      if (joined()) api("pos", { chapter: chapter });
    } else if (state.pos > 0) {
      api("solo", { chapter: chapter });
    }
  }

  // ---- Polling: pick up status changes & unlocks in the background ----
  // 8s: matches the backend's Edge Config unlock-propagation window (≤10s), so
  // polling faster would only add store reads without seeing changes any sooner.
  function startPolling() { if (!pollTimer) pollTimer = setInterval(poll, 8000); }
  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }
  function poll() {
    api("state").then(function (res) {
      if (!res || !res.ok) return;
      var prevStatus = jStatus();
      var prevUnlock = jUnlocked();
      var wasMode = syncMode;
      applySync(res);
      // Admin console open? Keep its state fresh, but do NOT paint over the
      // player view – otherwise the background poll throws the admin back into
      // the lobby every few seconds. The console has its own refresh
      // (adminTimer); closeAdmin() re-renders on close.
      if (adminView) return;
      if (!syncMode) { if (wasMode) render(); return; } // journey ended → solo

      if (prevStatus === "lobby" && jStatus() === "live") {
        if (state.pos === 0) { state.pos = 1; } // start: into the first lecture
        bumpReached(); save();
        render();
        return;
      }
      if (jUnlocked() > prevUnlock) {
        toast(fmt(T.chapter_unlocked, { n: jUnlocked() + 1 }));
        refreshLockedNext(); // release the locked "Continue" now
      }
      if (joined() && jStatus() === "lobby") renderLobby(); // keep player count fresh
    });
  }

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("show"); }, 10);
    setTimeout(function () { t.classList.remove("show"); }, 3200);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 3600);
  }

  // ---- Easter-egg reveal (shared by the temperature game & the results) ----
  function showEggReveal() {
    var ov = document.createElement("div");
    ov.className = "egg-ov";
    ov.innerHTML =
      '<div class="egg-card">' +
        '<div class="egg-emoji">🦜</div>' +
        '<div class="h2">' + esc(T.egg_title) + '</div>' +
        '<p class="muted">' + esc(T.egg_body) + '</p>' +
        '<div class="egg-code">' + esc(T.egg_codeword_label) + '<b>' + esc(EGG_CODE) + '</b></div>' +
        '<p class="muted small">' + esc(T.egg_tell_admins) + '</p>' +
        '<button class="btn" id="eggClose">' + esc(T.egg_close_btn) + '</button>' +
      "</div>";
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
    q("#eggClose", ov).onclick = function () { ov.remove(); };
  }

  // ---- Helpers ----
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function q(sel, root) { return (root || APP).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || APP).querySelectorAll(sel)); }
  function catOf(id) { return D.categories[id] || { label: id, color: "#6366f1" }; }
  function glById(id) { return D.glossary.find(function (g) { return g.id === id; }); }

  // ---- Cross-references in the glossary -------------------------------------
  // Detects mentions of other glossary terms inside a definition and makes them
  // clickable, so you can jump from one unclear term to the next.
  // Specific/compound terms before general ones; acronyms are case-sensitive so
  // they don't match inside other words.
  var GL_ALIASES = D.glossaryAliases || [];

  // Definition -> HTML with clickable cross-references (first match per term,
  // no self-reference, no overlaps).
  function linkifyDef(def, selfId) {
    var hits = [];
    GL_ALIASES.forEach(function (a) {
      if (a.id === selfId || !glById(a.id)) return;
      var re = new RegExp(a.re, a.flags || "");
      var m = re.exec(def);
      if (m) hits.push({ start: m.index, end: m.index + m[0].length, id: a.id, text: m[0] });
    });
    hits.sort(function (x, y) { return x.start - y.start || y.end - x.end; });
    var out = "", pos = 0, lastEnd = -1;
    hits.forEach(function (h) {
      if (h.start < lastEnd) return; // overlap -> skip
      out += esc(def.slice(pos, h.start)) +
        '<span class="gl-link" data-g="' + h.id + '">' + esc(h.text) + "</span>";
      pos = h.end; lastEnd = h.end;
    });
    return out + esc(def.slice(pos));
  }

  // Wires every [data-g] element in a container to the term popup.
  function wireGlLinks(rootEl, onJump) {
    if (!rootEl) return;
    qa("[data-g]", rootEl).forEach(function (el) {
      var t = glById(el.getAttribute("data-g"));
      if (!t) return;
      el.classList.add("gl-link");
      el.onclick = function (e) { if (e) e.stopPropagation(); (onJump || showTerm)(t); };
    });
  }
  function go(delta) { state.pos = Math.max(0, Math.min(navCap(), state.pos + delta)); bumpReached(); save(); reportPos(); render(); window.scrollTo(0, 0); }
  function goTo(pos) { state.pos = Math.max(0, Math.min(navCap(), pos)); bumpReached(); save(); reportPos(); render(); window.scrollTo(0, 0); }

  // "Continue" button for lecture/game. At the locked journey frontier it is
  // disabled and shows that we're waiting for the host.
  function nextBtnHtml(label) {
    return atLockedFrontier()
      ? '<button class="btn" id="nextBtn" disabled>' + esc(T.wait_unlock) + '</button>'
      : '<button class="btn" id="nextBtn">' + label + "</button>";
  }
  function wireNext() {
    var n = q("#nextBtn");
    if (n && !n.disabled) n.onclick = function () { go(1); };
  }
  // After an unlock, release the locked "Continue" button – without remounting
  // the page (and a possibly running mini-game). Only on lecture/game pages, so
  // e.g. the quiz button stays untouched.
  function refreshLockedNext() {
    var step = flow[state.pos];
    if (!step || (step.v !== "game" && step.v !== "lecture")) return;
    var n = q("#nextBtn");
    if (n && n.disabled && !atLockedFrontier()) {
      n.disabled = false;
      n.textContent = T.next;
      n.onclick = function () { go(1); };
    }
  }

  // =========================================================================
  // RENDER
  // =========================================================================
  // Reserves exactly as much space at the bottom as the (possibly multi-line)
  // fixed action bar is tall – otherwise content disappears behind it. On the
  // desktop the bar is sticky (in flow) → no extra padding needed.
  function fitActionbar() {
    // The action bar is now a normal flex child (app shell, no more
    // position:fixed) – no space needs to be reserved. Remove any old padding.
    APP.style.paddingBottom = "";
  }

  function render() {
    paintScreen();
    if (window.requestAnimationFrame) requestAnimationFrame(fitActionbar);
    else fitActionbar();
  }

  function paintScreen() {
    if (adminView) return renderAdmin();
    if (overlay === "glossary") return renderGlossary();
    // Journey mode: lobby waiting screen while the session hasn't started yet.
    if (syncMode && joined() && jStatus() === "lobby") return renderLobby();
    // Safety net: never stay beyond your own frontier. That is
    // max(unlock, already-reached) – stepping the unlock back never pulls
    // anyone out of already-seen content.
    if (syncMode && jStatus() === "live" && state.pos > navCap()) {
      state.pos = navCap(); save();
    }
    var step = flow[state.pos];
    if (step.v === "cover") return renderCover();
    if (step.v === "lecture") return renderLecture(D.chapters[step.i]);
    if (step.v === "game") return renderGame(D.chapters[step.i]);
    if (step.v === "quizIntro") return renderQuizIntro();
    if (step.v === "quiz") return renderQuiz(step.i);
    if (step.v === "results") return renderResults();
  }

  function topbar(showProgress) {
    var total = flow.length - 1;
    var pct = Math.round((state.pos / total) * 100);
    return (
      '<div class="topbar">' +
        '<div class="brand">' + T.brand + " <small>· " + esc(D.meta.duration) + "</small></div>" +
        '<div class="spacer"></div>' +
        '<button class="iconbtn" id="glossaryBtn">' + esc(T.glossary_btn) + "</button>" +
      "</div>" +
      (showProgress ? '<div class="progress"><span style="width:' + pct + '%"></span></div>' : "")
    );
  }

  function actionbar(html, cls) {
    return '<div class="actionbar"><div class="inner' + (cls ? " " + cls : "") + '">' + html + "</div></div>";
  }

  function wireCommon() {
    var gb = q("#glossaryBtn");
    if (gb) gb.onclick = function () { overlay = "glossary"; render(); };
  }

  // Small language switcher (cookie-based; a click reloads into that language).
  function langPicker() {
    return '<div class="lang-picker">' +
      '<span class="lang-cap">' + esc(T.lang_caption) + "</span>" +
      '<button class="lang-btn' + (LANG === "en" ? " on" : "") + '" data-lang="en">' + esc(T.lang_en_label) + "</button>" +
      '<button class="lang-btn' + (LANG === "de" ? " on" : "") + '" data-lang="de">' + esc(T.lang_de_label) + "</button>" +
      "</div>";
  }
  function wireLangPicker(root) {
    qa(".lang-btn", root || APP).forEach(function (b) {
      b.onclick = function () { var l = b.getAttribute("data-lang"); if (l !== LANG) setLang(l); };
    });
  }

  // ---- COVER ----
  function renderCover() {
    APP.innerHTML =
      topbar(false) +
      '<div class="content cover fadein">' +
        '<div class="hero-emoji">🧠✨</div>' +
        '<h1 class="h1 center">' + esc(D.meta.title) + "</h1>" +
        '<p class="lead center">' + esc(D.meta.subtitle) + "</p>" +
        '<div class="badge-row">' +
          '<span class="badge">⏱️ ' + esc(D.meta.duration) + "</span>" +
          '<span class="badge">🎮 ' + fmt(T.cover_minigames, { n: D.chapters.length }) + "</span>" +
          '<span class="badge">📚 ' + fmt(T.cover_terms, { n: D.glossary.length }) + "</span>" +
        "</div>" +
        '<div class="qrwrap">' +
          '<div class="qrbox" id="qrbox"></div>' +
          '<div class="muted small center">' + esc(T.cover_scan) + "</div>" +
        "</div>" +
        '<p class="muted small center">' + esc(T.cover_intro) + "</p>" +
        (syncMode ? '<p class="sync-note center">' + esc(T.cover_sync_note) + "</p>" : "") +
        langPicker() +
      "</div>" +
      actionbar(coverCta(), "stack");
    wireCommon();
    wireLangPicker();
    var jb = q("#joinBtn"); if (jb) jb.onclick = doJoin;
    var sb = q("#startBtn"); if (sb) sb.onclick = function () { go(1); };
    var solo = q("#soloBtn"); if (solo) solo.onclick = startSolo;
    q("#adminBtn").onclick = openAdmin;
    renderQR(q("#qrbox"), window.APP_URL);
  }

  // Go through this session solo even though a journey is running (no force).
  function startSolo() {
    state.preferSolo = true; save();
    syncMode = false; SYNC = null; stopPolling();
    go(1);
  }

  // Main action(s) on the cover – journey first, solo + admin subtly below.
  function coverCta() {
    var primary, solo = "";
    if (!syncMode) {
      primary = '<button class="btn" id="startBtn">' + esc(T.cta_start) + "</button>";
    } else if (!joined()) {
      primary = '<button class="btn" id="joinBtn">' + esc(T.cta_join) + "</button>";
      solo = '<button class="btn ghost" id="soloBtn">' + esc(T.cta_solo) + "</button>";
    } else {
      primary = '<button class="btn" id="startBtn">' + esc(T.next) + "</button>";
    }
    return primary + '<hr class="cta-sep">' + solo + '<button class="btn ghost" id="adminBtn">' + esc(T.admin_btn) + "</button>";
  }

  // Join a running session (random identity from the server).
  function doJoin() {
    var b = q("#joinBtn"); if (b) { b.disabled = true; b.textContent = T.joining; }
    api("join").then(function (res) {
      if (res && res.ok && res.mode === "journey") {
        applySync(res); startPolling(); render();
      } else {
        if (b) { b.disabled = false; b.textContent = T.cta_join; }
        toast(T.join_failed + (res && res.error ? " (" + res.error + ")" : ""));
      }
    });
  }

  // ---- LOBBY (player waits for the start) ----
  function renderLobby() {
    var p = SYNC.player, count = SYNC.players || 1;
    APP.innerHTML =
      topbar(false) +
      '<div class="content cover fadein center">' +
        '<div class="hero-emoji">⏳</div>' +
        '<h1 class="h1 center">' + esc(T.lobby_title) + "</h1>" +
        '<p class="lead center">' + esc(T.lobby_you_are) + "</p>" +
        '<div class="identity">🧑‍🚀 ' + esc(p.name) + "</div>" +
        (p.approved
          ? '<p class="muted center">' + esc(T.lobby_wait_approved) + "</p>"
          : '<p class="muted center">' + esc(T.lobby_wait_unapproved) + "</p>") +
        '<div class="lobby-count"><span class="pulse"></span>' +
          fmt(count === 1 ? T.lobby_count_one : T.lobby_count_many, { n: count }) + "</div>" +
      "</div>" +
      actionbar('<button class="btn ghost" id="adminBtn">' + esc(T.admin_btn) + "</button>");
    wireCommon();
    q("#adminBtn").onclick = openAdmin;
  }

  // =========================================================================
  // ADMIN CONSOLE (best used on desktop)
  // =========================================================================
  function openAdmin() {
    adminView = "login"; render();
    api("admin_me").then(function (r) { if (r && r.ok && r.admin) loadConsole(); });
  }
  function closeAdmin() {
    adminView = null; adminData = null;
    if (adminTimer) { clearInterval(adminTimer); adminTimer = null; }
    if (adminTick) { clearInterval(adminTick); adminTick = null; }
    render();
  }
  function consoleUrl() {
    return "admin_console" + (adminCohort ? "&journey=" + encodeURIComponent(adminCohort) : "");
  }

  function loadConsole() {
    api(consoleUrl()).then(function (r) {
      if (!r || !r.ok) { adminView = "login"; render(); return; }
      adminData = r; adminCohort = r.selected; adminDataAt = Date.now(); adminView = "console"; render();
      // Background refresh – but only repaint when something actually changed
      // and nobody is typing. Otherwise the page flickers and inputs (e.g. the
      // journey name) are lost.
      if (!adminTimer) adminTimer = setInterval(function () {
        api(consoleUrl()).then(function (rr) {
          if (!rr || !rr.ok || adminView !== "console") return;
          var changed = consoleSig(rr) !== consoleSig(adminData);
          adminData = rr; adminCohort = rr.selected; adminDataAt = Date.now();
          var el = document.activeElement;
          var typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
          if (changed && !typing) render();
        });
      }, 8000);
      // Per-second ticker for the live timers (without a full repaint).
      if (!adminTick) adminTick = setInterval(tickAdminTimer, 1000);
    });
  }

  // Compact signature of the console state, to avoid unnecessary repaints.
  function consoleSig(d) {
    if (!d) return "";
    var j = d.journey;
    var base = (d.selected || "") + "/" + (j ? j.id + "|" + j.status + "|" + j.unlocked : "none");
    var co = (d.cohorts || []).map(function (c) {
      return c.key + c.status + c.total + c.online;
    }).join(",");
    var ppl = (d.players || []).map(function (p) {
      return p.name + (p.online ? 1 : 0) + p.chapter + (p.approved ? 1 : 0);
    }).join(",");
    return base + "@" + co + "#" + ppl;
  }

  // Duration in seconds → "M:SS" or "Hh MMm".
  function fmtDur(s) {
    s = Math.max(0, s | 0);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    if (h) return h + "h " + (m < 10 ? "0" : "") + m + "m";
    return m + ":" + (ss < 10 ? "0" : "") + ss;
  }
  // Keeps the live timers in the admin dashboard ticking every second without
  // re-rendering (the server value is re-based on every poll).
  function tickAdminTimer() {
    if (adminView !== "console" || !adminData || !adminData.timing) return;
    var add = Math.floor((Date.now() - adminDataAt) / 1000);
    var tm = adminData.timing;
    var te = document.getElementById("admTimer");
    if (te && tm.elapsed != null) te.textContent = fmt(T.adm_running_since, { dur: fmtDur(tm.elapsed + add) });
    var su = document.getElementById("admSinceUnlock");
    if (su && tm.sinceUnlock != null) su.textContent = fmt(T.adm_since_free, { dur: fmtDur(tm.sinceUnlock + add) });
  }

  function renderAdmin() {
    if (adminView === "console") return renderAdminConsole();
    return renderAdminLogin();
  }

  function renderAdminLogin() {
    APP.innerHTML =
      topbar(false) +
      '<div class="content fadein admin-login">' +
        '<h2 class="h2">' + esc(T.admin_login_title) + "</h2>" +
        '<p class="muted small">' + esc(T.admin_login_sub) + "</p>" +
        '<input class="adm-in" id="admUser" placeholder="' + esc(T.admin_user_ph) + '" autocomplete="username">' +
        '<input class="adm-in" id="admPass" type="password" placeholder="' + esc(T.admin_pass_ph) + '" autocomplete="current-password">' +
        '<div id="admErr" class="cl-feedback no" style="display:none"></div>' +
      "</div>" +
      actionbar('<button class="btn secondary" id="admBack">' + esc(T.back) + '</button><button class="btn" id="admGo">' + esc(T.admin_signin) + "</button>");
    wireCommon();
    q("#admBack").onclick = closeAdmin;
    var submit = function () {
      var u = q("#admUser").value.trim(), pw = q("#admPass").value;
      var btn = q("#admGo"); btn.disabled = true; btn.textContent = "…";
      api("admin_login", { username: u, password: pw }).then(function (r) {
        if (r && r.ok) { loadConsole(); }
        else { var e = q("#admErr"); e.style.display = "block"; e.textContent = T.admin_login_failed; btn.disabled = false; btn.textContent = T.admin_signin; }
      });
    };
    q("#admGo").onclick = submit;
    q("#admPass").onkeydown = function (e) { if (e.key === "Enter") submit(); };
  }

  // Status badge for a cohort (solo/journey).
  function cohortBadge(status) { return (T.cohort_badge && T.cohort_badge[status]) || status; }

  function renderAdminConsole() {
    var d = adminData || {};
    var tm = d.timing || null;
    var chapters = d.chapters || D.chapters.length;
    var cohorts = d.cohorts || [];
    var sel = d.selected;
    var j = d.journey;                 // journey meta of the selection (null for solo)
    var canControl = d.controls === "active";
    var hasActive = cohorts.some(function (c) { return c.status === "lobby" || c.status === "live"; });

    // --- Switcher across all cohorts ---
    var tabs = cohorts.map(function (c) {
      return '<button class="cohort-tab' + (c.key === sel ? " on" : "") + '" data-key="' + esc(c.key) + '">' +
        '<span class="ct-name">' + esc(c.name || T.journey_default_name) + "</span>" +
        '<span class="ct-meta"><span class="ct-badge s-' + c.status + '">' + esc(cohortBadge(c.status)) + "</span>" +
        " · " + c.online + "/" + c.total + "</span></button>";
    }).join("");
    var switcher =
      '<div class="cohort-switch">' + tabs +
        (hasActive ? "" : '<button class="cohort-tab new" id="jNew">' + esc(T.new_journey_btn) + "</button>") +
      "</div>";

    // --- Header + controls of the selection ---
    var players = d.players || [];
    var online = players.filter(function (p) { return p.online; }).length;
    var headName = j ? (j.name || T.journey_default_name) : T.no_journey;
    var headStatus = j ? j.status : "solo";

    var controls = "";
    if (j && canControl && j.status === "lobby") {
      controls =
        '<p class="muted small">' + T.adm_lobby_status + "</p>" +
        '<button class="btn" id="jStart">' + esc(T.adm_start_game) + "</button>" +
        '<button class="btn danger ghost" id="jDelete" data-id="' + j.id + '" style="margin-top:6px">' + esc(T.adm_cancel_lobby) + "</button>";
    } else if (j && canControl && j.status === "live") {
      var pills = "";
      for (var i = 0; i < chapters; i++) {
        var cnt = tm && tm.dist && tm.dist[i] ? tm.dist[i] : 0;
        pills += '<button class="unlock-pill' + (i <= j.unlocked ? " on" : "") + '" data-ch="' + i + '">' + (i + 1) +
          (cnt ? '<span class="pill-badge">' + cnt + "</span>" : "") + "</button>";
      }
      var frontier = "";
      if (tm) {
        var doneTxt = tm.frontierTotal ? fmt(T.adm_frontier_done, { done: tm.frontierDone, total: tm.frontierTotal }) : T.adm_frontier_none;
        var sinceTxt = tm.sinceUnlock != null ? ' · <span id="admSinceUnlock">' + fmt(T.adm_since_free, { dur: fmtDur(tm.sinceUnlock) }) + "</span>" : "";
        frontier = '<p class="muted small frontier-info">' + fmt(T.chapter_n, { n: j.unlocked + 1 }) + sinceTxt + " · " + doneTxt + "</p>";
        if (tm.frontierTotal && (tm.frontierDone / tm.frontierTotal) >= 0.7 && j.unlocked < chapters - 1) {
          frontier += '<p class="unlock-nudge">' + fmt(T.adm_nudge, { n: j.unlocked + 2 }) + "</p>";
        }
      }
      controls =
        '<p class="muted small">' + fmt(T.adm_unlocked_upto, { n: j.unlocked + 1 }) + "</p>" +
        '<div class="unlock-row">' + pills + "</div>" + frontier +
        '<button class="btn danger ghost" id="jArchive" style="margin-top:6px">' + esc(T.adm_end_journey) + "</button>";
    } else if (j) {
      controls = '<p class="muted small">' + fmt(T.adm_viewonly, { status: cohortBadge(j.status).toLowerCase() }) + "</p>" +
        '<button class="btn danger ghost" id="jDelete" data-id="' + j.id + '">' + esc(T.adm_delete_journey) + "</button>";
    } else {
      controls = '<p class="muted small">' + esc(T.adm_solo_desc) + "</p>";
    }

    // --- Player table ---
    var rows = players.length
      ? players.map(function (p) {
          var ch = p.chapter >= chapters ? T.adm_done_check : fmt(T.chapter_n, { n: p.chapter + 1 });
          return '<tr class="' + (p.online ? "on" : "off") + '">' +
            '<td>' + (p.online ? "🟢" : "⚪") + " " + esc(p.name) + "</td>" +
            '<td>' + (p.approved ? esc(ch) : "<em>" + esc(T.adm_awaiting_approval) + "</em>") + "</td></tr>";
        }).join("")
      : '<tr><td colspan="2" class="muted">' + esc(T.adm_nobody_here) + "</td></tr>";

    var body =
      '<div class="card admin-card">' +
        '<div class="admin-head"><div><div class="h2" style="margin:0">' + esc(headName) +
          ' <span class="ct-badge s-' + headStatus + '">' + esc(cohortBadge(headStatus)) + "</span></div>" +
          '<div class="muted small">' + fmt(T.adm_online_total, { online: online, total: players.length }) + "</div>" +
          (tm && tm.elapsed != null && headStatus === "live" ? '<div class="adm-timer" id="admTimer">' + fmt(T.adm_running_since, { dur: fmtDur(tm.elapsed) }) + "</div>" : "") +
          "</div></div>" +
        controls +
      "</div>" +
      '<div class="card admin-card"><table class="admin-table"><thead><tr><th>' + esc(T.adm_th_person) + "</th><th>" + esc(T.adm_th_progress) + "</th></tr></thead><tbody>" + rows + "</tbody></table></div>";

    // Input row for a new journey (only if none is active).
    var createBox = hasActive ? "" :
      '<div class="card admin-card" id="createBox" style="display:none">' +
        '<input class="adm-in" id="jName" placeholder="' + esc(T.journey_name_ph) + '">' +
        '<button class="btn" id="jCreate" style="margin-top:10px">' + esc(T.journey_create_btn) + "</button>" +
      "</div>";

    APP.innerHTML =
      topbar(false) +
      '<div class="content fadein admin-console">' +
        '<div class="admin-bar"><h2 class="h2" style="margin:0">' + esc(T.admin_dashboard_title) + "</h2>" +
          '<button class="iconbtn" id="admLogout">' + esc(T.admin_logout) + "</button></div>" +
        '<p class="muted small mobile-hint">' + esc(T.admin_desktop_hint) + "</p>" +
        switcher + createBox + body +
      "</div>" +
      actionbar('<button class="btn secondary" id="admClose">' + esc(T.back_to_app) + "</button>");
    wireCommon();
    q("#admClose").onclick = closeAdmin;
    q("#admLogout").onclick = function () { api("admin_logout").then(closeAdmin); };

    // Switch cohort.
    qa(".cohort-tab[data-key]").forEach(function (t) {
      t.onclick = function () { adminCohort = t.getAttribute("data-key"); loadConsole(); };
    });
    var nw = q("#jNew"); if (nw) nw.onclick = function () { var b = q("#createBox"); if (b) b.style.display = "block"; var nm = q("#jName"); if (nm) nm.focus(); };
    var c = q("#jCreate"); if (c) c.onclick = function () { adminCohort = null; api("admin_create", { name: q("#jName").value.trim() }).then(loadConsole); };
    var s = q("#jStart"); if (s) s.onclick = function () { api("admin_start").then(loadConsole); };
    var a = q("#jArchive"); if (a) a.onclick = function () { if (confirm(T.confirm_end_journey)) { adminCohort = null; api("admin_archive").then(loadConsole); } };
    var del = q("#jDelete"); if (del) del.onclick = function () {
      var msg = j && j.status === "lobby" ? T.confirm_cancel_lobby : T.confirm_delete_journey;
      if (confirm(msg)) { adminCohort = null; api("admin_delete", { id: del.getAttribute("data-id") }).then(loadConsole); }
    };
    qa(".unlock-pill").forEach(function (pill) {
      pill.onclick = function () { api("admin_unlock", { chapter: parseInt(pill.getAttribute("data-ch"), 10) }).then(loadConsole); };
    });
  }

  function renderQR(box, text) {
    if (!box || typeof QRCode === "undefined") return;
    box.innerHTML = "";
    try {
      new QRCode(box, { text: text, width: 168, height: 168, colorDark: "#0b1020", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M });
    } catch (e) {
      box.innerHTML = '<div class="small" style="color:#0b1020;padding:8px">' + esc(text) + "</div>";
    }
  }

  // ---- LECTURE PAGE (explanation, no game) ----
  function renderLecture(ch) {
    var c = catOf(ch.cat);
    maybeAiConsent();     // one-time opt-in gate — nothing downloads without it
    maybeStartAiLoad(ch); // preload the on-device model in the home stretch (never on the cover)
    APP.innerHTML =
      topbar(true) +
      '<div class="content fadein">' +
        '<div class="kicker"><span class="dot" style="background:' + c.color + '"></span>' + esc(c.label) + "</div>" +
        '<h2 class="h2">' + esc(ch.title) + "</h2>" +
        '<div class="lecture-body" id="chIntro">' + ch.lecture + "</div>" +
      "</div>" +
      actionbar(
        '<button class="btn secondary" id="backBtn">' + esc(T.back) + "</button>" +
        nextBtnHtml((T.game_cta && T.game_cta[ch.game]) || T.next)
      );
    wireCommon();
    q("#backBtn").onclick = function () { go(-1); };
    wireNext();

    // Make terms inline-clickable (marked in the text via data-g).
    var introEl = q("#chIntro");
    var links = qa("[data-g]", introEl);
    wireGlLinks(introEl, showTerm);
    // One-time hint that the underlined terms are tappable.
    if (links.length && !state.seenGlHint) {
      var firstNext = q(".lecture-next", introEl);
      (firstNext || introEl).insertAdjacentHTML("beforebegin",
        '<p class="gl-hint muted small">' + T.gl_hint + "</p>");
      state.seenGlHint = true; save();
    }
  }

  // ---- GAME PAGE (mini-game for the chapter) ----
  function renderGame(ch) {
    var c = catOf(ch.cat);
    maybeStartAiLoad(ch); // trigger preload on game pages too (self-guarded)
    var done = !!state.doneChapters[ch.id];
    APP.innerHTML =
      topbar(true) +
      '<div class="content fadein">' +
        '<div class="game-head"><span class="dot" style="background:' + c.color + '"></span>' + esc(ch.title) + "</div>" +
        '<div class="game card" id="game"></div>' +
        '<div id="takeawayWrap">' + (done ? takeawayHtml(ch) : "") + "</div>" +
      "</div>" +
      actionbar(
        '<button class="btn secondary" id="backBtn">' + esc(T.back) + "</button>" +
        nextBtnHtml(T.next)
      );
    wireCommon();
    q("#backBtn").onclick = function () { go(-1); };
    wireNext();

    // Mount the game
    var onComplete = function () {
      if (state.doneChapters[ch.id]) return;
      state.doneChapters[ch.id] = true; save();
      var w = q("#takeawayWrap");
      if (w && !w.innerHTML) { w.innerHTML = takeawayHtml(ch); var t = q(".takeaway", w); if (t) t.classList.add("pop"); }
    };
    mountGame(q("#game"), ch, onComplete);
  }

  function takeawayHtml(ch) {
    return '<div class="takeaway"><div class="lbl">' + esc(T.takeaway_label) + '</div><p>' + esc(ch.takeaway) + "</p></div>";
  }

  // ---- Term popups as a growing list ----------------------------------------
  // Clicking a cross-reference appends another panel at the bottom; the list
  // grows upward and becomes scrollable. The close button always sits below the
  // most recently opened panel and closes the entire list.
  var termOverlay = null;
  var termSheet = null;

  function closeTermStack() {
    if (termOverlay) termOverlay.remove();
    termOverlay = null; termSheet = null;
  }

  function pushTerm(t) {
    if (!termOverlay) {
      termOverlay = document.createElement("div");
      termOverlay.className = "term-stack";
      termOverlay.onclick = function (e) { if (e.target === termOverlay) closeTermStack(); };
      termSheet = document.createElement("div");
      termSheet.className = "term-sheet";
      termSheet.onclick = function (e) { e.stopPropagation(); };
      termOverlay.appendChild(termSheet);
      document.body.appendChild(termOverlay);
    }
    var foot = termSheet.querySelector(".term-foot");
    if (foot) foot.remove(); // close button moves below the new panel

    // Remove an existing panel for the same term -> it slides to the end
    // instead of doubling up; keeps the list shorter.
    var dup = termSheet.querySelector('.term-panel[data-term="' + t.id + '"]');
    if (dup) dup.remove();

    var c = catOf(t.cat);
    var panel = document.createElement("div");
    panel.className = "term-panel";
    panel.setAttribute("data-term", t.id);
    panel.innerHTML =
      '<div class="kicker"><span class="dot" style="background:' + c.color + '"></span>' + esc(c.label) + "</div>" +
      '<div class="h2">' + esc(t.term) + "</div>" +
      '<p class="muted" style="font-size:15.5px;margin:0">' + linkifyDef(t.def, t.id) + "</p>";
    termSheet.appendChild(panel);
    wireGlLinks(panel, pushTerm); // cross-references append another panel

    foot = document.createElement("div");
    foot.className = "term-foot";
    foot.innerHTML = '<button class="btn secondary closeT">' + esc(T.close_btn) + "</button>";
    foot.querySelector(".closeT").onclick = function (e) { e.stopPropagation(); closeTermStack(); };
    termSheet.appendChild(foot);

    termSheet.scrollTop = termSheet.scrollHeight; // newest panel into view
  }

  // Opened from outside (glossary list, lecture text) -> fresh list.
  function showTerm(t) { closeTermStack(); pushTerm(t); }

  // =========================================================================
  // GLOSSARY (overlay)
  // =========================================================================
  function renderGlossary() {
    var cats = Object.keys(D.categories);
    var pills = '<button class="cat-pill active" data-cat="all">' + esc(T.glossary_all) + "</button>" +
      cats.map(function (k) { return '<button class="cat-pill" data-cat="' + k + '">' + esc(D.categories[k].label) + "</button>"; }).join("");
    APP.innerHTML =
      topbar(false) +
      '<div class="content fadein">' +
        '<h2 class="h2">' + esc(T.glossary_title) + "</h2>" +
        '<p class="muted small">' + fmt(T.glossary_sub, { n: D.glossary.length }) + "</p>" +
        '<div class="cat-filter">' + pills + "</div>" +
        '<div class="glossary-list" id="glist"></div>' +
      "</div>" +
      actionbar('<button class="btn" id="closeGl">' + esc(T.close_btn) + "</button>");
    q("#closeGl").onclick = function () { overlay = null; render(); };
    // The glossary button in the topbar closes this here too
    var gb = q("#glossaryBtn"); if (gb) gb.onclick = function () { overlay = null; render(); };

    var listEl = q("#glist");
    function draw(cat) {
      listEl.innerHTML = "";
      D.glossary.filter(function (g) { return cat === "all" || g.cat === cat; }).forEach(function (g) {
        var c = catOf(g.cat);
        var item = document.createElement("div");
        item.className = "card gl-item";
        item.style.borderLeftColor = c.color;
        item.innerHTML =
          '<span class="gl-cat">' + esc(c.label) + "</span>" +
          '<div class="gl-term">' + esc(g.term) + "</div>" +
          '<div class="gl-def">' + linkifyDef(g.def, g.id) + "</div>";
        listEl.appendChild(item);
      });
      wireGlLinks(listEl, showTerm);
    }
    draw("all");
    qa(".cat-pill").forEach(function (p) {
      p.onclick = function () {
        qa(".cat-pill").forEach(function (x) { x.classList.remove("active"); });
        p.classList.add("active");
        draw(p.getAttribute("data-cat"));
      };
    });
  }

  // =========================================================================
  // MINI-GAMES
  // =========================================================================
  function mountGame(root, ch, onComplete) {
    var g = ch.game;
    if (g === "predict") return gamePredict(root, ch.gameData, onComplete);
    if (g === "tokenizer") return gameTokenizer(root, ch.gameData, onComplete);
    if (g === "pipeline") return gamePipeline(root, ch.gameData, onComplete);
    if (g === "temperature") return gameTemperature(root, ch.gameData, onComplete);
    if (g === "context") return gameContext(root, ch.gameData, onComplete);
    if (g === "match") return gameMatch(root, ch.gameData, onComplete);
    if (g === "agent") return gameAgent(root, ch.gameData, onComplete);
    if (g === "classify") return gameClassify(root, ch.gameData, onComplete);
    if (g === "embedding") return gameEmbedding(root, ch.gameData, onComplete);
    if (g === "semanticsearch") return gameSemanticSearch(root, ch.gameData, onComplete);
    if (g === "attention") return gameAttention(root, ch.gameData, onComplete);
    if (g === "promptlab") return gamePromptlab(root, ch.gameData, onComplete);
    if (g === "rag") return gameRag(root, ch.gameData, onComplete);
    if (g === "cost") return gameCost(root, ch.gameData, onComplete);
    if (g === "injection") return gameInjection(root, ch.gameData, onComplete);
    if (g === "ondevice") return gameOnDevice(root, ch.gameData, onComplete);
    root.innerHTML = '<p class="muted">…</p>';
  }

  // --- 1) PREDICT: guess the next word ---
  function gamePredict(root, gd, onComplete) {
    var r = 0;
    function draw() {
      var round = gd.rounds[r];
      var best = round.options.reduce(function (a, b) { return b.p > a.p ? b : a; });
      root.innerHTML =
        '<p class="hint">' + fmt(T.predict_hint, { r: r + 1, total: gd.rounds.length }) + "</p>" +
        '<div class="predict-sentence">' + esc(round.sentence.replace("___", "")) + '<span class="blank">?</span></div>' +
        '<div id="opts"></div>' +
        '<div id="pfeedback" class="muted small"></div>';
      var opts = q("#opts", root);
      round.options.forEach(function (o) {
        var b = document.createElement("button");
        b.className = "opt";
        b.innerHTML = '<span class="bar"></span><span class="lbl">' + esc(o.word) + '</span><span class="pct"></span>';
        b.onclick = function () { answer(o, b, best, round); };
        opts.appendChild(b);
      });
    }
    function answer(chosen, btn, best, round) {
      qa(".opt", root).forEach(function (b, idx) {
        var o = round.options[idx];
        b.onclick = null;
        b.querySelector(".bar").style.width = Math.round(o.p * 100) + "%";
        b.querySelector(".pct").textContent = Math.round(o.p * 100) + "%";
        if (o === best) b.classList.add("correct");
        else b.classList.add("dim");
        if (b === btn && o !== best) b.classList.add("wrong");
      });
      var fb = q("#pfeedback", root);
      fb.innerHTML = chosen === best
        ? T.predict_correct
        : fmt(T.predict_wrong, { chosen: qt(esc(chosen.word)), best: qt(esc(best.word)) });
      if (r < gd.rounds.length - 1) {
        // Intermediate round: button leads to the next round.
        fb.insertAdjacentHTML("afterend", '<button class="btn" style="margin-top:12px" id="pnext">' + esc(T.predict_next) + "</button>");
        q("#pnext", root).onclick = function () { r++; draw(); };
      } else {
        // Last round done: complete the chapter (the takeaway appears).
        // Continue via the "Continue →" button of the action bar – no dead,
        // self-disabling button anymore.
        onComplete();
      }
    }
    draw();
  }

  // --- 2) TOKENIZER ---
  function gameTokenizer(root, gd, onComplete) {
    var colors = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
    root.innerHTML =
      '<p class="hint">' + esc(T.tok_hint) + "</p>" +
      '<textarea class="tok-input" id="tokIn" rows="2"></textarea>' +
      '<div class="samplebtns" id="samples"></div>' +
      '<div class="tok-out" id="tokOut"></div>' +
      '<div class="tok-note muted small">' + esc(T.tok_note) + "</div>" +
      '<div class="tok-meta"><div class="stat"><b id="tokN">0</b>' + esc(T.tok_tokens) + '</div><div class="stat"><b id="charN">0</b>' + esc(T.tok_chars) + '</div><div class="stat"><b id="ratio">–</b>' + esc(T.tok_ratio) + "</div></div>";
    var input = q("#tokIn", root);
    gd.samples.forEach(function (s) {
      var b = document.createElement("button");
      b.className = "chip"; b.textContent = qt(s.slice(0, 22) + (s.length > 22 ? "…" : ""));
      b.onclick = function () { input.value = s; update(); };
      q("#samples", root).appendChild(b);
    });
    // Real GPT tokenizer (cl100k_base) if the vendored lib is loaded – else a
    // coarse heuristic as a fallback. So count & split are "real".
    var TKZ = window.GPTTokenizer_cl100k_base || null;
    function tokenize(text) {
      if (TKZ && text) {
        try { return TKZ.encode(text).map(function (id) { return TKZ.decode([id]); }); }
        catch (e) { /* fallback below */ }
      }
      var tokens = [];
      var re = /(\s*)(\p{L}+|\p{N}+|[^\s\p{L}\p{N}]+)/gu;
      var m;
      while ((m = re.exec(text)) !== null) {
        var lead = m[1], word = m[2];
        if (/^\p{L}+$/u.test(word) && word.length > 4) {
          for (var i = 0; i < word.length; i += 4) {
            tokens.push((i === 0 ? lead : "") + word.slice(i, i + 4));
          }
        } else if (/^[^\s\p{L}\p{N}]+$/u.test(word) && word.length > 1) {
          word.split("").forEach(function (ch, i) { tokens.push((i === 0 ? lead : "") + ch); });
        } else {
          tokens.push(lead + word);
        }
      }
      return tokens;
    }
    function update() {
      var text = input.value;
      var toks = tokenize(text);
      var out = q("#tokOut", root);
      out.innerHTML = "";
      toks.forEach(function (t, i) {
        var span = document.createElement("span");
        span.className = "tok";
        var col = colors[i % colors.length];
        span.style.background = col + "33";
        span.style.color = "#fff";
        span.style.border = "1px solid " + col + "88";
        span.textContent = t.replace(/ /g, "·");
        out.appendChild(span);
      });
      q("#tokN", root).textContent = toks.length;
      q("#charN", root).textContent = text.length;
      q("#ratio", root).textContent = toks.length ? (text.length / toks.length).toFixed(1) : "–";
      if (toks.length > 0) onComplete();
    }
    input.addEventListener("input", update);
    input.value = gd.samples[0];
    update();
  }

  // --- 3) PIPELINE ---
  function gamePipeline(root, gd, onComplete) {
    function shell() {
      root.innerHTML =
        '<p class="hint">' + esc(T.pipe_hint) + "</p>" +
        '<div class="pipe" id="pipe"></div>';
      var pipe = q("#pipe", root);
      gd.stages.forEach(function (s, i) {
        if (i > 0) pipe.insertAdjacentHTML("beforeend", '<div class="pipe-arrow">▼</div>');
        var d = document.createElement("div");
        d.className = "pipe-stage"; d.setAttribute("data-i", i);
        d.innerHTML = '<div class="num">' + (i + 1) + '</div><div><div class="t">' + esc(s.label) + '</div><div class="d">' + esc(s.desc) + "</div></div>";
        pipe.appendChild(d);
      });
    }
    // Runs as an endless loop as soon as the chapter opens. So nobody misses
    // the animation, even while still reading the intro text.
    function play() {
      var stages = qa(".pipe-stage", root);
      if (!stages.length) return;
      var completed = false;
      function run() {
        if (!document.body.contains(root)) return; // chapter left → stop the loop
        stages.forEach(function (s) { s.classList.remove("active", "done"); });
        var i = 0;
        (function step() {
          if (!document.body.contains(root)) return;
          if (i > 0) { stages[i - 1].classList.remove("active"); stages[i - 1].classList.add("done"); }
          if (i >= stages.length) {
            if (!completed) { completed = true; onComplete(); }
            setTimeout(run, 1400); // short pause, then start over
            return;
          }
          stages[i].classList.add("active");
          i++;
          setTimeout(step, 850);
        })();
      }
      run();
    }
    shell();
    play();
  }

  // --- 4) TEMPERATURE ---
  function gameTemperature(root, gd, onComplete) {
    var maxReroll = 0; // 🥚 easter-egg counter: rerolls at (near) maximum temperature
    root.innerHTML =
      '<p class="hint">' + esc(gd.prompt) + "</p>" +
      '<div class="temp-row"><label>🌡️ Temperature</label><span class="temp-val" id="tval">0.70</span></div>' +
      '<input type="range" id="trange" min="0.05" max="1.5" step="0.05" value="0.7">' +
      '<div class="temp-labels"><span>' + esc(T.temp_factual) + "</span><span>" + esc(T.temp_creative) + "</span></div>" +
      '<div class="dist" id="dist"></div>' +
      '<div class="temp-sample" id="tsample"></div>' +
      '<button class="btn secondary" id="reroll" style="margin-top:12px">' + esc(T.temp_generate) + "</button>";
    var range = q("#trange", root);
    function dist(T2) {
      var w = gd.options.map(function (o) { return Math.pow(o.base, 1 / Math.max(0.05, T2)); });
      var sum = w.reduce(function (a, b) { return a + b; }, 0);
      return w.map(function (x) { return x / sum; });
    }
    function draw() {
      var tv = parseFloat(range.value);
      q("#tval", root).textContent = tv.toFixed(2);
      var p = dist(tv);
      var dEl = q("#dist", root); dEl.innerHTML = "";
      gd.options.forEach(function (o, i) {
        dEl.insertAdjacentHTML("beforeend",
          '<div class="dist-row"><span class="w">' + esc(o.word) + '</span>' +
          '<span class="track"><span class="fill" style="width:' + (p[i] * 100).toFixed(0) + '%"></span></span>' +
          '<span class="p">' + (p[i] * 100).toFixed(0) + "%</span></div>");
      });
    }
    function sample() {
      var tv = parseFloat(range.value);
      // 🥚 Easter egg: at maximum temperature even the most unlikely gets a chance.
      if (tv >= 1.45) {
        maxReroll++;
        if (!state.eggFound && (maxReroll >= 7 || Math.random() < 0.04)) { triggerEgg(); return; }
      } else { maxReroll = 0; }
      var p = dist(tv), x = Math.random(), acc = 0, pick = gd.options[0].word;
      for (var i = 0; i < p.length; i++) { acc += p[i]; if (x <= acc) { pick = gd.options[i].word; break; } }
      q("#tsample", root).innerHTML = fmt(T.temp_sample, { story: esc(T.temp_story), pick: esc(pick) });
      onComplete();
    }
    function triggerEgg() {
      state.eggFound = true; save();
      q("#tsample", root).innerHTML = fmt(T.temp_egg, { story: esc(T.temp_story) });
      showEggReveal();
      onComplete();
    }
    range.addEventListener("input", draw);
    q("#reroll", root).onclick = sample;
    draw(); sample();
  }

  // --- 5) CONTEXT WINDOW ---
  function gameContext(root, gd, onComplete) {
    var sent = [];   // current messages in the window
    var idx = 0;
    var droppedOnce = false;
    root.innerHTML =
      '<p class="hint">' + fmt(T.ctx_hint, { n: gd.windowSize }) + "</p>" +
      '<div class="ctx-win" id="win"><span class="cap">' + esc(T.ctx_window) + "</span></div>" +
      '<div class="ctx-dropped" id="dropped"></div>' +
      '<button class="btn secondary" id="sendMsg" style="margin-top:12px">' + esc(T.ctx_send) + "</button>";
    var win = q("#win", root);
    win.insertAdjacentHTML("beforeend", '<div class="ctx-msg sys">' + esc(gd.system) + "</div>");
    function add() {
      var text = gd.messages[idx % gd.messages.length]; idx++;
      var d = document.createElement("div"); d.className = "ctx-msg"; d.textContent = "🧑 " + text;
      win.appendChild(d); sent.push(d);
      if (sent.length > gd.windowSize) {
        var old = sent.shift();
        old.classList.add("dropping");
        q("#dropped", root).textContent = fmt(T.ctx_dropped, { msg: qt(old.textContent.replace("🧑 ", "")) });
        droppedOnce = true;
        setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 480);
        onComplete();
      }
    }
    q("#sendMsg", root).onclick = add;
  }

  // --- 6) MATCH (technique ↔ example) ---
  function gameMatch(root, gd, onComplete) {
    var pairs = gd.pairs;
    var labels = pairs.map(function (p) { return p.left; });
    var answered = 0;
    root.innerHTML = '<p class="hint">' + esc(T.match_hint) + '</p><div class="match-cols" id="mc"></div>';
    var mc = q("#mc", root);
    pairs.forEach(function (pair) {
      var card = document.createElement("div"); card.className = "match-card";
      card.innerHTML = '<div class="ml">' + qt(esc(pair.right)) + '</div><div class="match-opts"></div>';
      var opts = card.querySelector(".match-opts");
      shuffle(labels.slice()).forEach(function (lab) {
        var b = document.createElement("button"); b.className = "match-opt"; b.textContent = lab;
        b.onclick = function () {
          qa(".match-opt", card).forEach(function (x) { x.onclick = null; });
          if (lab === pair.left) { b.classList.add("correct"); }
          else {
            b.classList.add("wrong");
            qa(".match-opt", card).forEach(function (x) { if (x.textContent === pair.left) x.classList.add("correct"); else if (x !== b) x.classList.add("dim"); });
          }
          answered++; if (answered >= pairs.length) onComplete();
        };
        opts.appendChild(b);
      });
      mc.appendChild(card);
    });
  }

  // --- 7) AGENT (put in order) ---
  function gameAgent(root, gd, onComplete) {
    var picked = []; // chosen order (indices of the original steps)
    var shuffled = shuffle(gd.steps.map(function (s, i) { return i; }));
    var checked = false;
    root.innerHTML =
      '<p class="hint">' + esc(T.agent_hint) + "</p>" +
      '<div class="agent-list" id="al"></div>' +
      '<div id="afbwrap"></div>' +
      '<button class="btn" id="checkA" style="margin-top:10px;display:none">' + esc(T.check_btn) + "</button>" +
      '<button class="btn ghost" id="resetA" style="margin-top:8px">' + esc(T.reset_btn) + "</button>";
    var al = q("#al", root);
    function draw() {
      al.innerHTML = "";
      shuffled.forEach(function (origIdx) {
        var s = gd.steps[origIdx];
        var pi = picked.indexOf(origIdx);
        var d = document.createElement("div"); d.className = "agent-step" + (pi >= 0 ? " picked" : "");
        d.innerHTML = '<div class="pick">' + (pi >= 0 ? pi + 1 : "") + '</div><div><div class="t">' + esc(s.label) + '</div><div class="d">' + esc(s.desc) + "</div></div>";
        if (!checked) d.onclick = function () {
          var idx = picked.indexOf(origIdx);
          if (idx >= 0) picked.splice(idx, 1); // remove → later picks move up
          else picked.push(origIdx);           // append at the end
          draw();
        };
        al.appendChild(d);
      });
      q("#checkA", root).style.display = (!checked && picked.length === gd.steps.length) ? "block" : "none";
    }
    function check() {
      checked = true;
      var ok = picked.every(function (origIdx, pos) { return gd.steps[origIdx].order === pos + 1; });
      draw();
      qa(".agent-step", al).forEach(function (el, vi) {
        var origIdx = shuffled[vi]; var pos = picked.indexOf(origIdx);
        if (gd.steps[origIdx].order === pos + 1) el.classList.add("correct"); else el.classList.add("wrong");
      });
      q("#afbwrap", root).innerHTML = '<div class="cl-feedback ' + (ok ? "ok" : "no") + '">' + (ok ? T.agent_ok : T.agent_no) + "</div>";
      onComplete();
    }
    q("#checkA", root).onclick = check;
    q("#resetA", root).onclick = function () { picked = []; checked = false; q("#afbwrap", root).innerHTML = ""; shuffled = shuffle(gd.steps.map(function (s, i) { return i; })); draw(); };
    draw();
  }

  // --- 8) REVEAL (trust vs. caution – reveal instead of quiz) ---
  // Deliberately no right/wrong: tap, reveal the assessment, read on.
  // So the chapter doesn't feel like a quiz brought forward.
  function gameClassify(root, gd, onComplete) {
    root.innerHTML =
      '<p class="hint">' + esc(T.classify_hint) + "</p>" +
      '<div class="reveal-list" id="rl"></div>';
    var listEl = q("#rl", root);
    var revealed = 0;
    gd.items.forEach(function (item) {
      var card = document.createElement("button");
      card.className = "reveal-card";
      card.innerHTML =
        '<div class="rv-text">' + esc(item.text) + "</div>" +
        '<div class="rv-hint muted small">' + esc(T.classify_tap) + "</div>" +
        '<div class="rv-body">' +
          '<span class="rv-badge ' + (item.risk ? "warn" : "ok") + '">' +
            (item.risk ? esc(T.classify_check) : esc(T.classify_trust)) + "</span>" +
          '<span class="rv-why">' + esc(item.why) + "</span>" +
        "</div>";
      card.onclick = function () {
        if (card.classList.contains("open")) return;
        card.classList.add("open", item.risk ? "is-warn" : "is-ok");
        revealed++;
        if (revealed >= gd.items.length) onComplete();
      };
      listEl.appendChild(card);
    });
  }

  // =========================================================================
  // MINI-GAMES – expansion (60-minute version)
  // Maps and charts are drawn as plain SVG/DOM — no charting library needed.
  // =========================================================================
  var SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(name, attrs) { var e = document.createElementNS(SVGNS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function dist2(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }

  // Deterministic "display vector" from position + word:
  // nearby words → similar numbers (exactly the chapter's message).
  function dispVec(word, x, y) {
    var seed = 0; for (var i = 0; i < word.length; i++) seed = (seed * 31 + word.charCodeAt(i)) >>> 0;
    var v = [];
    for (var d = 0; d < 8; d++) {
      var a = Math.sin((x * 3.1 + 0.7) * (d + 1)) * 0.55 + Math.cos((y * 2.7 + 0.3) * (d + 1)) * 0.4;
      var jit = (((seed >> (d % 16)) & 0xff) / 255 - 0.5) * 0.16;
      v.push(Math.max(-0.99, Math.min(0.99, a + jit)));
    }
    return v;
  }

  // --- EMBEDDING: words as points on a meaning map ---
  function gameEmbedding(root, gd, onComplete) {
    var W = 320, H = 230, pad = 26;
    var words = gd.words.map(function (w) { return { w: w.w, x: w.x, y: w.y }; });
    var target = words.filter(function (w) { return w.w === gd.target; })[0] || words[0];
    var nearest = null, best = 1e9;
    words.forEach(function (w) { if (w === target) return; var d = dist2(w, target); if (d < best) { best = d; nearest = w; } });
    var solved = false;

    root.innerHTML =
      '<p class="hint">' + esc(gd.question) + "</p>" +
      '<div class="emap-wrap"><svg class="emap" viewBox="0 0 ' + W + ' ' + H + '" width="100%"></svg></div>' +
      '<div class="emap-panel" id="evec"></div>' +
      '<div id="efb" class="cl-feedback" style="display:none"></div>';

    var svg = q(".emap", root);
    var sx = function (x) { return pad + x * (W - 2 * pad); };
    var sy = function (y) { return H - pad - y * (H - 2 * pad); };

    function vecBars(vec) {
      return '<div class="vecbars">' + vec.map(function (n) {
        var h = Math.round((n + 1) / 2 * 100);
        return '<span class="vb"><span style="height:' + h + '%;background:' + (n >= 0 ? "var(--accent-2)" : "var(--bad)") + '"></span></span>';
      }).join("") + '</div>';
    }
    function showVec(w) {
      q("#evec", root).innerHTML = '<div class="evec-word">' + esc(w.w) + "</div>" + vecBars(dispVec(w.w, w.x, w.y)) +
        '<div class="muted small">' + esc(T.emb_caption) + "</div>";
    }
    function pick(w, node) {
      showVec(w);
      qa(".emap-dot", svg).forEach(function (d) { d.classList.remove("sel"); });
      if (node) node.classList.add("sel");
      if (w !== target && !solved) {
        var fb = q("#efb", root); fb.style.display = "block";
        if (w === nearest) {
          solved = true; fb.className = "cl-feedback ok";
          fb.innerHTML = fmt(T.emb_correct, { w: qt(esc(w.w)), target: qt(esc(target.w)) });
          if (node) node.classList.add("near");
          onComplete();
        } else {
          fb.className = "cl-feedback no";
          fb.innerHTML = fmt(T.emb_close, { target: qt(esc(target.w)) });
        }
      }
    }

    words.forEach(function (w) {
      var cx = sx(w.x), cy = sy(w.y), left = w.x > 0.6;
      var dot = svgEl("circle", { cx: cx, cy: cy, r: 7, class: "emap-dot" + (w === target ? " target" : "") });
      var lab = svgEl("text", { x: left ? cx - 11 : cx + 11, y: cy + 4, class: "emap-label", "text-anchor": left ? "end" : "start" });
      lab.textContent = w.w;
      dot.addEventListener("click", function () { pick(w, dot); });
      lab.addEventListener("click", function () { pick(w, dot); });
      svg.appendChild(dot); svg.appendChild(lab);
    });
    svg.insertBefore(svgEl("circle", { cx: sx(target.x), cy: sy(target.y), r: 13, class: "emap-ring" }), svg.firstChild);
    showVec(target);
  }

  // --- SEMANTIC SEARCH: find the nearest neighbors to a question ---
  function gameSemanticSearch(root, gd, onComplete) {
    var W = 320, H = 200, pad = 22, k = gd.k || 3;
    var docs = gd.docs.map(function (d, i) { return { i: i, t: d.t, x: d.x, y: d.y }; });
    var query = null, picks = [], revealed = false;
    root.innerHTML =
      '<p class="hint">' + fmt(T.ss_hint, { k: k }) + "</p>" +
      '<div class="ss-queries" id="ssq"></div>' +
      '<div id="sshint" class="ss-hint small" style="display:none;margin:-2px 0 8px"></div>' +
      '<div class="emap-wrap"><svg class="emap" viewBox="0 0 ' + W + ' ' + H + '" width="100%"></svg></div>' +
      '<div class="ss-legend" id="ssleg"></div>' +
      '<div id="sscount" class="muted small" style="margin-top:8px"></div>' +
      '<button class="btn secondary" id="ssReveal" style="margin-top:10px;display:none">' + esc(T.ss_reveal) + "</button>" +
      '<div id="ssfb" class="cl-feedback" style="margin-top:10px;display:none"></div>';
    var svg = q(".emap", root);
    var sx = function (x) { return pad + x * (W - 2 * pad); };
    var sy = function (y) { return H - pad - y * (H - 2 * pad); };
    // While guessing, the map points stay anonymous (no numbers, not clickable):
    // so you can't read the answer straight off the position. Selection happens
    // via the text list, guessing is by meaning. Only on reveal does each point
    // get its number (matching the list) – then it gives nothing away but helps
    // find each list entry on the map.
    function draw() {
      svg.innerHTML = "";
      if (query) svg.appendChild(svgEl("circle", { cx: sx(query.x), cy: sy(query.y), r: 9, class: "ss-query" }));
      docs.forEach(function (d) {
        var dot = svgEl("circle", { cx: sx(d.x), cy: sy(d.y), r: 8, class: "emap-dot" });
        dot.setAttribute("data-i", d.i);
        svg.appendChild(dot);
        if (revealed) {
          var num = svgEl("text", { x: sx(d.x), y: sy(d.y) + 3.5, class: "ss-num" });
          num.textContent = d.i + 1;
          svg.appendChild(num);
        }
      });
    }
    function legend() {
      var leg = q("#ssleg", root); leg.innerHTML = ""; leg.classList.remove("revealed");
      docs.forEach(function (d) {
        var row = document.createElement("button"); row.className = "ss-legrow"; row.setAttribute("data-i", d.i);
        row.innerHTML = '<span class="ss-pick"></span><span class="ss-legtxt">' + esc(d.t) + '</span><span class="ss-legnum">' + (d.i + 1) + '</span>';
        row.onclick = function () { toggle(d); };
        leg.appendChild(row);
      });
      sync();
    }
    function sync() { qa(".ss-legrow", root).forEach(function (r) { r.classList.toggle("on", picks.indexOf(+r.getAttribute("data-i")) >= 0); }); }
    function toggle(d) {
      if (revealed) return;
      if (!query) { needQueryHint(); return; }
      var idx = picks.indexOf(d.i);
      if (idx >= 0) picks.splice(idx, 1); else if (picks.length < k) picks.push(d.i);
      sync();
      q("#sscount", root).textContent = fmt(T.ss_count, { n: picks.length, k: k });
      q("#ssReveal", root).style.display = picks.length === k ? "block" : "none";
    }
    // Answer before the question? Instead of silence, a gentle hint right under
    // the chips plus a short wiggle: without a chosen question there are no
    // "nearest" points.
    function needQueryHint() {
      var h = q("#sshint", root); h.style.display = "block";
      h.textContent = T.ss_need_query;
      var chips = q("#ssq", root); chips.classList.remove("nudge"); void chips.offsetWidth; chips.classList.add("nudge");
    }
    function reveal() {
      revealed = true;
      var sorted = docs.slice().sort(function (a, b) { return dist2(a, query) - dist2(b, query); });
      var top = sorted.slice(0, k).map(function (d) { return d.i; });
      var wrong = picks.filter(function (i) { return top.indexOf(i) < 0; });
      draw();
      top.forEach(function (i) { var d = docs[i]; svg.insertBefore(svgEl("line", { x1: sx(query.x), y1: sy(query.y), x2: sx(d.x), y2: sy(d.y), class: "emap-link" }), svg.firstChild); });
      qa(".emap-dot", svg).forEach(function (node) {
        var i = +node.getAttribute("data-i");
        if (top.indexOf(i) >= 0) node.classList.add("near");
        else if (wrong.indexOf(i) >= 0) node.classList.add("wrong");
      });
      qa(".ss-legrow", root).forEach(function (r) {
        var i = +r.getAttribute("data-i");
        r.classList.remove("on");
        if (top.indexOf(i) >= 0) r.classList.add("near");
        else if (wrong.indexOf(i) >= 0) r.classList.add("wrong");
      });
      q("#ssleg", root).classList.add("revealed");
      var hit = picks.filter(function (i) { return top.indexOf(i) >= 0; }).length;
      var fb = q("#ssfb", root); fb.style.display = "block"; fb.className = "cl-feedback " + (hit >= 2 ? "ok" : "no");
      fb.innerHTML = fmt(T.ss_result, { hit: hit, k: k, list: top.map(function (i) { return qt(esc(docs[i].t)); }).join(", ") });
      q("#ssReveal", root).style.display = "none";
      onComplete();
    }
    gd.queries.forEach(function (qy) {
      var b = document.createElement("button"); b.className = "chip"; b.textContent = qt(qy.q);
      b.onclick = function () { query = qy; picks = []; revealed = false; qa("#ssq .chip", root).forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); q("#ssfb", root).style.display = "none"; draw(); legend(); q("#sshint", root).style.display = "none"; q("#sscount", root).textContent = fmt(T.ss_count, { n: 0, k: k }); q("#ssReveal", root).style.display = "none"; };
      q("#ssq", root).appendChild(b);
    });
    q("#ssReveal", root).onclick = reveal;
    draw(); legend();
  }

  // --- ATTENTION: what a word "looks at" (heatmap) ---
  function gameAttention(root, gd, onComplete) {
    var si = 0, done = false;
    function draw() {
      var s = gd.sentences[si];
      var tabs = gd.sentences.length > 1 ? '<div class="attn-tabs">' + gd.sentences.map(function (_, i) {
        return '<button class="attn-tab' + (i === si ? " on" : "") + '" data-i="' + i + '">' + fmt(T.attn_sentence, { n: i + 1 }) + "</button>";
      }).join("") + '</div>' : "";
      root.innerHTML =
        '<p class="hint">' + esc(T.attn_hint) + "</p>" +
        tabs + '<div class="attn-sent" id="asent"></div><div id="anote" class="attn-note muted small"></div>';
      var sent = q("#asent", root);
      s.tokens.forEach(function (tok, i) {
        var sp = document.createElement("span");
        sp.className = "attn-tok" + (i === s.focus ? " focus" : "");
        sp.textContent = tok; sp.setAttribute("data-i", i);
        if (i === s.focus) sp.addEventListener("click", function () { reveal(s); });
        sent.appendChild(sp);
      });
      qa(".attn-tab", root).forEach(function (t) { t.onclick = function () { si = +t.getAttribute("data-i"); draw(); }; });
    }
    function reveal(s) {
      var max = Math.max.apply(null, s.weights);
      qa(".attn-tok", root).forEach(function (sp, i) {
        if (i === s.focus) return;
        var w = s.weights[i] || 0;
        sp.style.background = "rgba(34,211,238," + (0.06 + 0.62 * w).toFixed(3) + ")";
        if (w >= max - 0.001) sp.classList.add("attn-top");
      });
      q("#anote", root).innerHTML = "💡 " + esc(s.note);
      if (!done) { done = true; onComplete(); }
    }
    draw();
  }

  // --- PROMPT LAB: toggle building blocks, quality rises ---
  function gamePromptlab(root, gd, onComplete) {
    var sel = {}, done = false, goal = gd.goal || 60;
    root.innerHTML =
      '<p class="hint">' + esc(gd.task) + "</p>" +
      '<div class="plab-blocks" id="pblocks"></div>' +
      '<div class="plab-meter"><div class="pm-top"><span>' + esc(T.plab_quality) + '</span><span id="pmval">0%</span></div>' +
      '<div class="pm-track"><span id="pmfill" class="pm-fill"></span></div></div>' +
      '<div class="plab-preview" id="pprev"></div>' +
      '<div id="pverdict" class="muted small"></div>';
    gd.blocks.forEach(function (b) {
      var btn = document.createElement("button"); btn.className = "plab-block";
      btn.innerHTML = '<span class="pb-lbl">' + esc(b.label) + '</span><span class="pb-txt">' + esc(b.text) + '</span>';
      btn.onclick = function () { sel[b.key] = !sel[b.key]; btn.classList.toggle("on", sel[b.key]); update(); };
      q("#pblocks", root).appendChild(btn);
    });
    function update() {
      var score = 0, parts = [gd.base];
      gd.blocks.forEach(function (b) { if (sel[b.key]) { score += b.points; parts.push(b.text); } });
      score = Math.min(100, score);
      q("#pmval", root).textContent = score + "%";
      q("#pmfill", root).style.width = score + "%";
      q("#pprev", root).innerHTML = '<div class="pp-lbl">' + esc(T.plab_your_prompt) + "</div>" + esc(parts.join(" "));
      q("#pverdict", root).innerHTML = score >= goal
        ? T.plab_v_high
        : score >= 30 ? T.plab_v_mid
          : T.plab_v_low;
      if (score >= goal && !done) { done = true; onComplete(); }
    }
    update();
  }

  // --- RAG: search, then answer (animated steps) ---
  function gameRag(root, gd, onComplete) {
    var topK = gd.topK || 2;
    root.innerHTML =
      '<p class="hint">' + esc(T.rag_question_label) + "</p>" +
      '<div class="rag-q">❓ ' + esc(gd.query) + "</div>" +
      '<div class="rag-steps" id="rsteps"></div>' +
      '<button class="btn" id="ragGo" style="margin-top:12px">' + esc(T.rag_start) + "</button>";
    var steps = q("#rsteps", root);
    function row(html) { var d = document.createElement("div"); d.className = "rag-step"; d.innerHTML = html; steps.appendChild(d); return d; }
    function run() {
      var btn = q("#ragGo", root); btn.disabled = true; steps.innerHTML = "";
      var sorted = gd.kb.slice().sort(function (a, b) { return b.sim - a.sim; });
      var top = sorted.slice(0, topK);
      var seq = [
        function () { row('<div class="rs-h">' + esc(T.rag_s1_h) + '</div><div class="muted small">' + esc(T.rag_s1_d) + "</div>"); },
        function () {
          var html = '<div class="rs-h">' + esc(T.rag_s2_h) + '</div><div class="rag-kb">';
          gd.kb.forEach(function (d) {
            html += '<div class="rag-doc' + (top.indexOf(d) >= 0 ? " hit" : "") + '"><span class="rd-t">' + esc(d.t) + '</span>' +
              '<span class="rd-bar"><span style="width:' + Math.round(d.sim * 100) + '%"></span></span></div>';
          });
          row(html + '</div>');
        },
        function () { row('<div class="rs-h">' + esc(T.rag_s3_h) + '</div><div class="rag-prompt">' + esc(T.rag_s3_d) + "<br>" + top.map(function (d) { return "• " + esc(d.t); }).join("<br>") + "</div>"); },
        function () {
          row('<div class="rs-h">' + esc(T.rag_s4_h) + '</div><div class="rag-ans bad">' + esc(T.rag_without) + esc(gd.withoutRag) + '</div><div class="rag-ans good">' + esc(T.rag_with) + esc(gd.withRag) + "</div>");
          btn.disabled = false; btn.textContent = T.rag_again; onComplete();
        }
      ];
      var i = 0; (function next() { if (i >= seq.length) return; seq[i](); i++; setTimeout(next, 760); })();
    }
    q("#ragGo", root).onclick = run;
  }

  // --- COST: token calculator with sliders ---
  function gameCost(root, gd, onComplete) {
    var d = gd.defaults, models = gd.models, mi = 0, done = false;
    function slider(lbl, id, min, max, step, val) {
      return '<div class="cost-row"><label>' + lbl + '</label><span class="cost-val" id="' + id + 'v">' + val + '</span>' +
        '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></div>';
    }
    root.innerHTML =
      '<p class="hint">' + esc(T.cost_hint) + '<span class="muted">' + esc(gd.note) + "</span></p>" +
      '<div class="cost-models" id="cmodels"></div>' +
      slider(esc(T.cost_in), "cin", 50, 4000, 50, d.in) +
      slider(esc(T.cost_out), "cout", 50, 4000, 50, d.out) +
      slider(esc(T.cost_calls), "ccalls", 10, 20000, 10, d.calls) +
      '<div class="cost-out"><div class="co-box"><span id="coDay">–</span><small>' + esc(T.cost_per_day) + '</small></div>' +
      '<div class="co-box"><span id="coMonth">–</span><small>' + esc(T.cost_per_month) + "</small></div></div>" +
      '<div id="coNote" class="muted small"></div>';
    models.forEach(function (m, i) {
      var b = document.createElement("button"); b.className = "cost-model" + (i === 0 ? " on" : ""); b.textContent = m.name;
      b.onclick = function () { mi = i; qa(".cost-model", root).forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); calc(); };
      q("#cmodels", root).appendChild(b);
    });
    function v(id) { return +q("#" + id, root).value; }
    function fmtEur(x) {
      var opt = x < 10 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 };
      return x.toLocaleString(T.locale || "en-US", opt) + " €";
    }
    function calc() {
      var inT = v("cin"), outT = v("cout"), calls = v("ccalls"), m = models[mi];
      q("#cinv", root).textContent = inT; q("#coutv", root).textContent = outT; q("#ccallsv", root).textContent = calls;
      var perCall = (inT / 1e6 * m.in) + (outT / 1e6 * m.out), day = perCall * calls;
      q("#coDay", root).textContent = fmtEur(day); q("#coMonth", root).textContent = fmtEur(day * 30);
      q("#coNote", root).innerHTML = inT > 1500 ? T.cost_note : "";
      if (!done) { done = true; onComplete(); }
    }
    ["cin", "cout", "ccalls"].forEach(function (id) { q("#" + id, root).addEventListener("input", calc); });
    calc();
  }

  // --- PROMPT INJECTION: find the dangerous line ---
  function gameInjection(root, gd, onComplete) {
    var done = false;
    root.innerHTML = '<p class="hint">' + esc(gd.intro) + '</p><div class="inj-doc" id="idoc"></div>' +
      '<div id="ifb" class="cl-feedback" style="display:none"></div>';
    var doc = q("#idoc", root);
    gd.lines.forEach(function (ln) {
      var b = document.createElement("button"); b.className = "inj-line"; b.textContent = ln.t;
      b.onclick = function () { pick(ln, b); };
      doc.appendChild(b);
    });
    function pick(ln, b) {
      var fb = q("#ifb", root); fb.style.display = "block";
      if (ln.bad) {
        b.classList.add("bad"); done = true; fb.className = "cl-feedback ok";
        fb.innerHTML = esc(T.inj_found) + esc(gd.why);
        qa(".inj-line", root).forEach(function (x) { x.onclick = null; });
        onComplete();
      } else if (!done) {
        b.classList.add("safe-miss");
        fb.className = "cl-feedback no"; fb.innerHTML = esc(T.inj_harmless);
      }
    }
  }

  // ---- Online/offline awareness (journey sync: pauses counting when offline) ----
  var offlineBanner = null;
  function setOnline(on) {
    if (on) {
      if (offlineBanner) { offlineBanner.remove(); offlineBanner = null; }
      if (syncMode) { poll(); reportPos(); } // catch up unlocks/status immediately
    } else if (syncMode && !offlineBanner) {
      offlineBanner = document.createElement("div");
      offlineBanner.className = "offline-banner";
      offlineBanner.textContent = T.offline_banner;
      document.body.appendChild(offlineBanner);
    }
  }

  // =========================================================================
  // ON-DEVICE "TEXT MAGICIAN" — opt-in, loads LFM2.5-350M (English) on demand.
  // English only: small models are far stronger in English than German. Loads
  // at THIS chapter when the user taps the button (never auto/at start), so a
  // memory-reload can't auto-retry into a crash loop. If it can't load, we fall
  // back to a static example (graceful). Model picked empirically (modellab2).
  // =========================================================================
  var aiState = { status: "idle", progress: 0, engine: null, tf: null, err: null, observer: null };
  var AI_MODEL = "LiquidAI/LFM2.5-350M-ONNX";
  function notifyAi() { if (typeof aiState.observer === "function") aiState.observer(); }

  // ---- One-time on-device AI consent dialog ("at the start" of the lectures).
  // The model NEVER downloads until the user opts in here (or taps the load
  // button in the on-device chapter). Shown once, while aiOptIn is still unset.
  var aiConsentEl = null;
  function closeConsent() { if (aiConsentEl) { aiConsentEl.remove(); aiConsentEl = null; } }
  function showAiConsent() {
    if (aiConsentEl) return;
    aiConsentEl = document.createElement("div");
    aiConsentEl.className = "ai-consent";
    aiConsentEl.innerHTML =
      '<div class="aic-card">' +
        '<div class="aic-emoji">🤖</div>' +
        '<div class="h2">' + esc(T.aic_title) + "</div>" +
        '<p class="muted">' + T.aic_body + "</p>" +
        '<div class="aic-btns"><button class="btn" id="aicYes">' + esc(T.aic_yes) + "</button>" +
          '<button class="btn secondary" id="aicNo">' + esc(T.aic_no) + "</button></div>" +
      "</div>";
    document.body.appendChild(aiConsentEl);
    q("#aicYes", aiConsentEl).onclick = function () { state.aiOptIn = true; save(); closeConsent(); loadAiModel(); };
    q("#aicNo", aiConsentEl).onclick = function () { state.aiOptIn = false; save(); closeConsent(); };
  }
  function maybeAiConsent() {
    if (state.aiOptIn === undefined && !aiConsentEl) showAiConsent();
  }

  // Preloads the model in the background so it's ready in the final chapter –
  // but only in the home stretch (≤ 3 chapters before the demo). This saves
  // bandwidth for everyone who doesn't get that far, and finishes in time when
  // you arrive. At most ONCE per session (status guard) and never on the cover
  // (renderCover never calls this). LFM2.5-350M is small and doesn't crash → no
  // reload loop.
  function maybeStartAiLoad(ch) {
    if (state.aiOptIn !== true) return;  // strictly opt-in: no download without consent
    if (aiState.status !== "idle") return;
    var chs = D.chapters, od = -1, ci = -1, i;
    for (i = 0; i < chs.length; i++) {
      if (chs[i].id === "ondevice") od = i;
      if (ch && chs[i].id === ch.id) ci = i;
    }
    if (od < 0) return;                          // no demo chapter → nothing to preload
    if (ch && ci > -1 && ci < od - 3) return;    // still too early in the course
    loadAiModel();
  }

  // Best-effort self-heal: discard half-loaded/broken model caches so a retry
  // reloads cleanly from the hub.
  function purgeAiCache() {
    try {
      if (window.caches && caches.keys) {
        caches.keys().then(function (names) {
          names.forEach(function (n) { if (/transformers|onnx|huggingface|hf-/i.test(n)) caches.delete(n); });
        });
      }
    } catch (e) { /* never mind */ }
  }

  function ensureTransformers() {
    if (aiState.tf) return Promise.resolve(aiState.tf);
    return import("https://esm.sh/@huggingface/transformers@4").then(function (mod) { aiState.tf = mod; return mod; });
  }

  function loadAiModel() {
    if (aiState.status === "loading" || aiState.status === "ready") return;
    aiState.status = "loading"; aiState.progress = 0; aiState.err = null; notifyAi();
    ensureTransformers().then(function (tf) {
      var device = (typeof navigator !== "undefined" && navigator.gpu) ? "webgpu" : "wasm";
      // Aggregate progress across all files by bytes.
      var files = {};
      var prog = function (p) {
        if (!p || !p.file || !(p.total > 0)) return;
        files[p.file] = { loaded: p.loaded || 0, total: p.total };
        var L = 0, TT = 0; for (var k in files) { L += files[k].loaded; TT += files[k].total; }
        if (TT > 0) { aiState.progress = Math.min(99, Math.round(L / TT * 100)); notifyAi(); }
      };
      return tf.pipeline("text-generation", AI_MODEL, { dtype: "q4", device: device, progress_callback: prog });
    }).then(function (gen) {
      aiState.engine = gen; aiState.status = "ready"; aiState.progress = 100; notifyAi();
    }).catch(function (e) {
      aiState.status = "error"; aiState.err = String((e && e.message) || e); purgeAiCache(); notifyAi();
    });
  }

  function gameOnDevice(root, gd, onComplete) {
    function staticExample() {
      var ex = gd.example;
      return '<div class="mag-static"><div class="ms-h">' + esc(T.mag_static_h) + "</div>" +
        '<div class="ms-in">' + qt(esc(ex.input)) + "</div>" +
        ex.out.map(function (o) { return '<div class="ms-row"><span class="ms-lbl">' + esc(o.label) + '</span><span>' + esc(o.text) + '</span></div>'; }).join("") +
        '</div>';
    }
    function staticOnly() { root.innerHTML = '<p class="hint">' + esc(T.mag_static_intro) + "</p>" + staticExample(); onComplete(); }
    function renderMagician() {
      root.innerHTML =
        '<p class="hint">' + T.mag_hint + "</p>" +
        '<textarea class="tok-input" id="magIn" rows="2"></textarea>' +
        '<div class="mag-presets" id="magP"></div>' +
        '<div class="mag-out-wrap"><div class="mag-out" id="magOut"></div><div class="mag-meta" id="magMeta"></div></div>' +
        '<div class="mag-note muted small">' + esc(T.mag_airplane) + "</div>";
      var inp = q("#magIn", root); inp.value = gd.sample || "";
      var busy = false;
      gd.presets.forEach(function (p) {
        var b = document.createElement("button"); b.className = "mag-preset"; b.textContent = p.label;
        b.onclick = function () { gen(p); };
        q("#magP", root).appendChild(b);
      });
      function gen(p) {
        if (busy) return;
        var text = (inp.value || "").trim(); if (!text) { inp.focus(); return; }
        busy = true; qa(".mag-preset", root).forEach(function (x) { x.disabled = true; });
        var out = q("#magOut", root); out.textContent = ""; out.classList.add("streaming");
        q("#magMeta", root).textContent = T.mag_thinking;
        var tf = aiState.tf, t0 = (window.performance ? performance.now() : Date.now()), ntok = 0;
        var streamer = new tf.TextStreamer(aiState.engine.tokenizer, {
          skip_prompt: true, skip_special_tokens: true,
          callback_function: function (txt) { out.textContent += txt; ntok++; }
        });
        aiState.engine([{ role: "user", content: p.instr + "\n\n\"" + text + "\"" }],
          { max_new_tokens: 48, do_sample: true, temperature: 0.7, top_p: 0.9, streamer: streamer }
        ).then(function () {
          var secs = ((window.performance ? performance.now() : Date.now()) - t0) / 1000;
          out.classList.remove("streaming");
          q("#magMeta", root).innerHTML = fmt(T.mag_meta, { n: (secs > 0 ? Math.round(ntok / secs) : 0) });
          busy = false; qa(".mag-preset", root).forEach(function (x) { x.disabled = false; });
          onComplete();
        }).catch(function () {
          out.classList.remove("streaming"); out.textContent = T.mag_gen_error;
          q("#magMeta", root).textContent = ""; busy = false; qa(".mag-preset", root).forEach(function (x) { x.disabled = false; });
        });
      }
    }
    function paint() {
      if (!document.body.contains(root)) { aiState.observer = null; return; }
      if (aiState.status === "ready") return renderMagician();
      if (aiState.status === "loading") {
        root.innerHTML =
          '<div class="mag-load"><div class="hero-emoji">🤖</div>' +
          '<p class="hint">' + fmt(T.mag_loading, { n: aiState.progress }) + "</p>" +
          '<div class="pm-track"><span class="pm-fill" style="width:' + aiState.progress + '%"></span></div>' +
          '<button class="btn secondary" id="magSkip" style="margin-top:12px">' + esc(T.mag_skip) + "</button></div>" +
          staticExample();
        q("#magSkip", root).onclick = staticOnly;
        return;
      }
      if (aiState.status === "error") {
        root.innerHTML = '<p class="hint">' + esc(T.mag_load_error) + "</p>" +
          '<button class="btn secondary" id="magRetry" style="margin-bottom:12px">' + esc(T.mag_retry) + "</button>" + staticExample();
        var rb = q("#magRetry", root); if (rb) rb.onclick = function () { aiState.status = "idle"; loadAiModel(); paint(); };
        onComplete(); return;
      }
      // idle — opt-in: only load on tap (no background/auto loading).
      root.innerHTML =
        '<p class="hint">' + esc(T.mag_idle) + "</p>" +
        '<button class="btn" id="magLoad">' + esc(T.mag_load_btn) + "</button>" + staticExample();
      q("#magLoad", root).onclick = function () { state.aiOptIn = true; save(); loadAiModel(); paint(); };
    }
    aiState.observer = paint;
    maybeStartAiLoad(); // landed here directly (no preload ran)? → load now
    paint();
  }

  // =========================================================================
  // QUIZ
  // =========================================================================
  function renderQuizIntro() {
    APP.innerHTML =
      topbar(true) +
      '<div class="content fadein center">' +
        '<div class="emoji-big">📝</div>' +
        '<h2 class="h2">' + esc(T.quiz_intro_title) + "</h2>" +
        '<p class="lead">' + fmt(T.quiz_intro_lead, { n: D.quiz.length }) + "</p>" +
        '<p class="muted small">' + esc(T.quiz_intro_sub) + "</p>" +
      "</div>" +
      actionbar('<button class="btn secondary" id="backBtn">' + esc(T.back) + '</button><button class="btn" id="nextBtn">' + esc(T.quiz_start_btn) + "</button>");
    wireCommon();
    q("#backBtn").onclick = function () { go(-1); };
    q("#nextBtn").onclick = function () { go(1); };
  }

  function renderQuiz(i) {
    var item = D.quiz[i];
    var prev = state.quiz[i]; // {chosen, correct}
    APP.innerHTML =
      topbar(true) +
      '<div class="content fadein">' +
        '<div class="quiz-count">' + fmt(T.quiz_count, { n: i + 1, total: D.quiz.length }) + "</div>" +
        '<div class="quiz-q">' + esc(item.q) + "</div>" +
        '<div id="qopts"></div>' +
        '<div id="qexpl"></div>' +
      "</div>" +
      actionbar(
        '<button class="btn secondary" id="backBtn">' + esc(T.back) + "</button>" +
        '<button class="btn" id="nextBtn" ' + (prev == null ? "disabled" : "") + ">" + (i < D.quiz.length - 1 ? esc(T.next) : esc(T.quiz_results_btn)) + "</button>"
      );
    wireCommon();
    q("#backBtn").onclick = function () { go(-1); };
    q("#nextBtn").onclick = function () { go(1); };

    var opts = q("#qopts");
    item.options.forEach(function (opt, oi) {
      var b = document.createElement("button");
      b.className = "opt";
      b.innerHTML = '<span class="lbl">' + esc(opt) + "</span>";
      b.onclick = function () { choose(oi); };
      opts.appendChild(b);
    });
    if (prev != null) reveal(prev);

    function choose(oi) {
      if (state.quiz[i] != null) return;
      state.quiz[i] = oi; save();
      reveal(oi);
      q("#nextBtn").disabled = false;
    }
    function reveal(chosen) {
      qa(".opt", opts).forEach(function (b, oi) {
        b.onclick = null;
        if (oi === item.correct) b.classList.add("correct");
        else if (oi === chosen) b.classList.add("wrong");
        else b.classList.add("dim");
      });
      var ok = chosen === item.correct;
      q("#qexpl").innerHTML = '<div class="quiz-expl ' + (ok ? "ok" : "no") + '">' + (ok ? esc(T.quiz_correct) : esc(T.quiz_wrong)) + esc(item.expl) + "</div>";
    }
  }

  // =========================================================================
  // RESULTS + REFLECTION
  // =========================================================================
  function renderResults() {
    var total = D.quiz.length, correct = 0;
    var byCat = {}; // cat -> {c, t}
    D.quiz.forEach(function (item, i) {
      var cat = item.cat;
      byCat[cat] = byCat[cat] || { c: 0, t: 0 };
      byCat[cat].t++;
      var ans = state.quiz[i];
      if (ans === item.correct) { correct++; byCat[cat].c++; }
    });
    var pct = Math.round((correct / total) * 100);
    var weak = Object.keys(byCat).filter(function (k) { return byCat[k].c < byCat[k].t; });

    var headline = pct >= 80 ? T.res_h_high : pct >= 50 ? T.res_h_mid : T.res_h_low;
    var sub = weak.length === 0 ? T.res_sub_perfect : T.res_sub_weak;

    var catBars = Object.keys(byCat).map(function (k) {
      var c = catOf(k), b = byCat[k], p = Math.round((b.c / b.t) * 100);
      return '<div class="cat-bar"><div class="top"><span>' + esc(c.label) + '</span><span class="muted">' + b.c + "/" + b.t + "</span></div>" +
        '<div class="track"><span class="fill" style="width:' + p + "%;background:" + c.color + '"></span></div></div>';
    }).join("");

    // Reflection cards: weak areas first, otherwise all.
    var reflCats = weak.length ? weak : Object.keys(D.reflection);
    var reflCards = reflCats.map(function (k) {
      var r = D.reflection[k]; if (!r) return "";
      var c = catOf(k);
      return '<div class="card refl-card" style="border-left-color:' + c.color + '">' +
        '<div class="kicker"><span class="dot" style="background:' + c.color + '"></span>' + esc(c.label) + "</div>" +
        '<div class="ah">💡 ' + esc(r.aha) + "</div>" +
        '<div class="fr"><b>' + esc(T.res_discuss) + "</b> " + esc(r.frage) + "</div></div>";
    }).join("");

    // "Consolation prize"/takeaway – always shown, motivates a replay.
    var o = D.outro || {};
    var prizeCard =
      '<div class="card prize-card">' +
        '<div class="kicker"><span class="dot" style="background:var(--accent-2)"></span>' + esc(T.res_takeaway_title) + "</div>" +
        (o.prize ? '<p class="prize-main">' + o.prize + "</p>" : "") +
        (weak.length && o.lowscore ? '<p class="muted small">' + o.lowscore + "</p>" : "") +
        (o.replay ? '<p class="muted small prize-replay">' + o.replay + "</p>" : "") +
      "</div>";
    // Egg collectible: found → celebration; else subtle in the background (tappable).
    var eggHtml = state.eggFound
      ? '<div class="card egg-found">' +
          '<div class="egg-found-emoji">🦜</div>' +
          '<div class="ef-title">' + esc(T.egg_found_title) + "</div>" +
          '<div class="egg-code">' + esc(T.egg_codeword_label) + "<b>" + esc(EGG_CODE) + "</b></div>" +
          '<div class="muted small">' + T.egg_found_hint + "</div>" +
        "</div>"
      : '<svg class="hidden-egg" id="hiddenEgg" viewBox="0 0 120 150" width="120" height="150" aria-hidden="true">' +
          '<path d="M60 18 C80 18 98 48 98 82 C98 112 82 134 60 134 C38 134 22 112 22 82 C22 48 40 18 60 18 Z" fill="#c7cbff"/></svg>' +
        '<div class="egg-teaser" id="eggTeaser">' + (o.teaser || "") + "</div>";

    APP.innerHTML =
      topbar(true) +
      '<div class="content fadein center results">' +
        '<div class="emoji-big">🏁</div>' +
        '<h2 class="h2">' + headline + "</h2>" +
        '<div class="score-ring"><div class="num">' + pct + '%<small> ' + esc(T.res_correct_label) + '</small></div></div>' +
        '<p class="muted">' + fmt(T.res_score, { correct: correct, total: total }) + "</p>" +
        '<p class="lead" style="text-align:center">' + esc(sub) + "</p>" +
        prizeCard +
        '<hr class="divider">' +
        '<h2 class="h2" style="text-align:left">' + esc(T.res_profile) + "</h2>" +
        '<div class="cat-bars">' + catBars + "</div>" +
        '<hr class="divider">' +
        '<h2 class="h2" style="text-align:left">' + esc(T.res_reflection_title) + "</h2>" +
        '<p class="muted small" style="text-align:left">' + (weak.length ? esc(T.res_reflection_weak) : esc(T.res_reflection_all)) + "</p>" +
        '<div style="text-align:left">' + reflCards + "</div>" +
        eggHtml +
      "</div>" +
      actionbar('<button class="btn secondary" id="againBtn">' + esc(T.res_again) + '</button><button class="btn" id="glBtn">' + esc(T.glossary_btn) + "</button>");
    wireCommon();
    q("#againBtn").onclick = function () { if (confirm(T.confirm_reset)) reset(); };
    q("#glBtn").onclick = function () { overlay = "glossary"; render(); };
    // Hidden egg: tapping (mobile) reveals the teaser – no hover needed.
    var egg = q("#hiddenEgg");
    if (egg) egg.onclick = function () {
      egg.classList.add("revealed");
      var t = q("#eggTeaser"); if (t) t.classList.add("show");
    };
  }

  // ---- util ----
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ---- start ----
  if (syncMode) {
    // In journey mode: start background polling for status/unlocks.
    startPolling();
  }
  // Airplane-mode/network awareness: pauses counting in the journey when offline.
  window.addEventListener("online", function () { setOnline(true); });
  window.addEventListener("offline", function () { setOnline(false); });
  // Re-reserve the action bar height on rotation/resize.
  window.addEventListener("resize", fitActionbar);
  reportPos(); // reports journey or solo progress (self-gated)
  render();
})();
