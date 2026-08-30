/**
 * PAN learner assistant — a curriculum-grounded chat surface for the LRN
 * catalog. Learner context stays deliberately small and is sent only when the
 * learner submits a message. Conversation history is stored in this browser.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.PANAssistant = api;
    if (root.document) api.init();
  }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  var STORAGE_KEY = "aifs:pan:v1";
  var PLAN_KEY = "aifs:personal-plan:v1";
  var COCKPIT_KEY = "lhind:lrn-cockpit:v3";
  var ASSESSMENT_KEY = "aifs:assessment";
  var MAX_STORED_MESSAGES = 16;
  var activeController = null;
  var launcher = null;
  var shell = null;
  var panel = null;
  var messageList = null;
  var emptyState = null;
  var form = null;
  var input = null;
  var sendButton = null;
  var cancelButton = null;
  var statusNode = null;
  var previousFocus = null;
  var messages = [];

  var COPY = {
    en: {
      open: "Open PAN learning assistant",
      eyebrow: "Curriculum-grounded",
      title: "PAN",
      subtitle: "Your learning assistant",
      close: "Close PAN",
      clear: "Clear conversation",
      introTitle: "Learn with the catalog, not around it.",
      intro: "PAN uses only approved learning content and the context you choose to share when you send a message.",
      next: "What should I learn next?",
      explain: "Explain this page",
      practice: "Check my understanding",
      plan: "Build my learning plan",
      placeholder: "Ask about this lesson, a concept, or your next step…",
      send: "Send",
      cancel: "Cancel",
      privacy: "Your chat stays in this browser. Only the current request and a compact learning context are sent to the internal AI gateway.",
      thinking: "PAN is checking approved curriculum sources…",
      ready: "PAN is ready.",
      sources: "Sources",
      trace: "How this answer was prepared",
      sourceUnavailable: "Source unavailable",
      error: "PAN could not answer right now. Your local learning plan and progress are unaffected.",
      retry: "Try again",
      clearConfirm: "Clear this browser's PAN conversation?",
      openAction: "Open recommendation",
      planPrompt: "Build a realistic learning plan for my goal. Explain the priorities and use only courses in the catalog.",
      nextPrompt: "What is the single best next learning step for me? Consider my role, progress, assessment gaps, and saved plan.",
      explainPrompt: "Explain the current page in plain language. Start with the core idea, then ask one short diagnostic question.",
      practicePrompt: "Check my understanding of the current page. Ask one question at a time and give hints before revealing an explanation."
    },
    de: {
      open: "PAN-Lernhilfe öffnen",
      eyebrow: "Curriculum-basiert",
      title: "PAN",
      subtitle: "Deine Lernhilfe",
      close: "PAN schließen",
      clear: "Unterhaltung löschen",
      introTitle: "Mit dem Katalog lernen – nicht daran vorbei.",
      intro: "PAN nutzt nur freigegebene Lerninhalte und den Kontext, den du beim Absenden einer Nachricht teilst.",
      next: "Was soll ich als Nächstes lernen?",
      explain: "Diese Seite erklären",
      practice: "Mein Verständnis prüfen",
      plan: "Meinen Lernplan bauen",
      placeholder: "Frage zu dieser Lektion, einem Begriff oder deinem nächsten Schritt …",
      send: "Senden",
      cancel: "Abbrechen",
      privacy: "Dein Chat bleibt in diesem Browser. Nur die aktuelle Anfrage und ein kompakter Lernkontext gehen an das interne KI-Gateway.",
      thinking: "PAN prüft freigegebene Curriculum-Quellen …",
      ready: "PAN ist bereit.",
      sources: "Quellen",
      trace: "So wurde die Antwort vorbereitet",
      sourceUnavailable: "Quelle nicht verfügbar",
      error: "PAN kann gerade nicht antworten. Dein lokaler Lernplan und Fortschritt bleiben unverändert.",
      retry: "Erneut versuchen",
      clearConfirm: "PAN-Unterhaltung in diesem Browser löschen?",
      openAction: "Empfehlung öffnen",
      planPrompt: "Baue einen realistischen Lernplan für mein Ziel. Erkläre die Prioritäten und verwende nur Kurse aus dem Katalog.",
      nextPrompt: "Was ist der beste einzelne nächste Lernschritt für mich? Berücksichtige Rolle, Fortschritt, Assessment-Lücken und meinen gespeicherten Plan.",
      explainPrompt: "Erkläre die aktuelle Seite verständlich. Beginne mit der Kernidee und stelle danach eine kurze Diagnosefrage.",
      practicePrompt: "Prüfe mein Verständnis der aktuellen Seite. Stelle immer nur eine Frage und gib Hinweise, bevor du eine Erklärung nennst."
    }
  };

  function locale() {
    var value = root.SiteLang && typeof root.SiteLang.get === "function" ? root.SiteLang.get() : "en";
    return value === "de" ? "de" : "en";
  }

  function t(key) {
    var lang = locale();
    return (COPY[lang] && COPY[lang][key]) || COPY.en[key] || key;
  }

  function readJson(key, fallback) {
    try {
      var value = JSON.parse(root.localStorage.getItem(key));
      return value && typeof value === "object" ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function bounded(value, max) {
    return String(value == null ? "" : value).trim().slice(0, max);
  }

  function safeHref(value, locationLike) {
    var href = bounded(value, 800);
    if (!href || /^(?:javascript|data|vbscript):/i.test(href)) return "";
    var locationValue = locationLike || root.location || { origin: "http://local", href: "http://local/index.html" };
    try {
      var parsed = new URL(href, locationValue.href || locationValue.origin);
      if (parsed.origin !== locationValue.origin) return "";
      if (!/(?:^|\/)(?:index|lesson|assessment|skills|prereqs)\.html$/.test(parsed.pathname) &&
          !/(?:^|\/)lrn\/(?:course|path)\.html$/.test(parsed.pathname)) return "";
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (_) {
      return "";
    }
  }

  function lessonPathsForCourse(courseId) {
    var map = root.LrnCurriculumMap && root.LrnCurriculumMap.courseMaps;
    var units = map && map[courseId];
    if (!Array.isArray(units)) return [];
    var seen = {};
    return units.flatMap(function (unit) { return unit.lessons || []; }).map(function (lesson) {
      return lesson && lesson.path;
    }).filter(function (path) {
      if (!path || seen[path]) return false;
      seen[path] = true;
      return true;
    });
  }

  function courseProgressSnapshot() {
    var data = root.LrnData || {};
    var progress = root.AIFSProgress && typeof root.AIFSProgress.getState === "function"
      ? root.AIFSProgress.getState()
      : { lessons: {} };
    var lessons = progress.lessons || {};
    var completedCourseIds = [];
    var inProgressCourseIds = [];
    (data.courses || []).forEach(function (course) {
      var paths = lessonPathsForCourse(course.id);
      if (!paths.length) return;
      var completed = paths.filter(function (path) { return lessons[path] && lessons[path].completedAt; }).length;
      var touched = paths.some(function (path) {
        var state = lessons[path];
        return state && (state.visitedAt || state.readPct || state.completedAt || Object.keys(state.answers || {}).length);
      });
      if (completed === paths.length) completedCourseIds.push(course.id);
      else if (touched) inProgressCourseIds.push(course.id);
    });
    return { completedCourseIds: completedCourseIds, inProgressCourseIds: inProgressCourseIds };
  }

  function assessmentGaps(profileId) {
    var data = root.LrnData || {};
    var assessment = readJson(ASSESSMENT_KEY, {});
    var role = (data.roles || []).find(function (item) {
      return item.id === profileId || item.label === assessment.role;
    });
    if (!role) return [];
    var order = { None: 0, Basic: 1, Acquire: 1, Advanced: 2, Deepen: 2, Expert: 3, Create: 3 };
    return (data.capabilities || []).map(function (capability) {
      var target = capability.targets && (capability.targets[role.id] || capability.targets.all);
      var current = assessment.ratings && assessment.ratings[capability.id];
      var gap = Math.max(0, (order[target] || 0) - (order[current] || 0));
      return gap ? {
        capabilityId: String(capability.id),
        title: bounded(capability.title, 180),
        currentLevel: current || "None",
        targetLevel: target,
        gap: gap
      } : null;
    }).filter(Boolean).slice(0, 12);
  }

  function currentContext() {
    var path = (root.location && root.location.pathname) || "";
    var params = new URLSearchParams((root.location && root.location.search) || "");
    return {
      currentCourseId: /\/lrn\/course\.html$/.test(path) ? bounded(params.get("id"), 80) : "",
      currentLessonPath: /\/lesson\.html$/.test(path) ? bounded(params.get("path"), 260) : ""
    };
  }

  function collectLearnerSnapshot() {
    var cockpit = readJson(COCKPIT_KEY, {});
    var plan = readJson(PLAN_KEY, {});
    var progress = courseProgressSnapshot();
    var context = currentContext();
    var profileId = bounded(cockpit.profileId || plan.profileId, 40);
    return {
      profileId: profileId,
      currentLevel: Number(cockpit.externalLevel || plan.currentLevel || 1),
      goal: bounded(plan.goal, 500),
      completedCourses: progress.completedCourseIds.slice(0, 60),
      inProgressCourses: progress.inProgressCourseIds.slice(0, 60),
      assessmentGaps: assessmentGaps(profileId),
      currentCourseId: context.currentCourseId,
      currentLessonPath: context.currentLessonPath,
      plannedCourses: Array.isArray(plan.steps) ? plan.steps.map(function (step) { return step.courseId; }).filter(Boolean).slice(0, 20) : []
    };
  }

  function loadMessages() {
    var record = readJson(STORAGE_KEY, { messages: [] });
    if (!Array.isArray(record.messages)) return [];
    return record.messages.slice(-MAX_STORED_MESSAGES).map(function (message) {
      return {
        role: message && message.role === "user" ? "user" : "assistant",
        content: bounded(message && message.content, 12000),
        sources: Array.isArray(message && message.sources) ? message.sources.slice(0, 4) : [],
        followUps: Array.isArray(message && message.followUps) ? message.followUps.slice(0, 3) : [],
        nextAction: message && message.nextAction || null,
        toolTrace: Array.isArray(message && message.toolTrace) ? message.toolTrace.slice(0, 6) : [],
        failed: Boolean(message && message.failed)
      };
    }).filter(function (message) { return message.content; });
  }

  function saveMessages() {
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, messages: messages.slice(-MAX_STORED_MESSAGES), updatedAt: Date.now() }));
    } catch (_) {}
  }

  function el(tag, className, text) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function icon(name) {
    var node = el("i", "ph-light ph-" + name);
    node.setAttribute("aria-hidden", "true");
    return node;
  }

  function setStatus(text) {
    if (statusNode) statusNode.textContent = text;
  }

  function renderSource(source) {
    var item = el("li", "pan-source");
    var href = safeHref(source && source.href);
    var label = bounded(source && (source.title || source.label), 240) || t("sourceUnavailable");
    if (href) {
      var link = el("a", "pan-source__link", label);
      link.href = href;
      link.appendChild(icon("arrow-up-right"));
      item.appendChild(link);
    } else item.textContent = label;
    if (source && source.detail) item.appendChild(el("small", "pan-source__detail", bounded(source.detail, 400)));
    return item;
  }

  function renderMessage(message, index) {
    var article = el("article", "pan-message pan-message--" + message.role + (message.failed ? " pan-message--error" : ""));
    article.dataset.messageIndex = String(index);
    var label = el("p", "pan-message__label", message.role === "user" ? (locale() === "de" ? "Du" : "You") : "PAN");
    article.appendChild(label);
    bounded(message.content, 12000).split(/\n{2,}/).forEach(function (paragraph) {
      article.appendChild(el("p", "pan-message__copy", paragraph));
    });

    if (message.sources && message.sources.length) {
      var details = el("details", "pan-evidence");
      var summary = el("summary", "pan-evidence__summary");
      summary.append(icon("book-open"), root.document.createTextNode(t("sources") + " · " + message.sources.length));
      details.appendChild(summary);
      var list = el("ul", "pan-sources");
      message.sources.forEach(function (source) { list.appendChild(renderSource(source)); });
      details.appendChild(list);
      article.appendChild(details);
    }

    if (message.nextAction) {
      var actionHref = safeHref(message.nextAction.href);
      if (actionHref || message.nextAction.type === "open-plan-builder") {
        var action = el(actionHref ? "a" : "button", "pan-message__action");
        if (actionHref) action.href = actionHref;
        else action.type = "button";
        action.append(icon("arrow-right"), root.document.createTextNode(bounded(message.nextAction.label, 120) || t("openAction")));
        if (!actionHref) action.addEventListener("click", openPlanBuilder);
        article.appendChild(action);
      }
    }

    if (message.followUps && message.followUps.length) {
      var follow = el("div", "pan-followups");
      message.followUps.forEach(function (prompt) {
        var button = el("button", "pan-followup", bounded(prompt, 240));
        button.type = "button";
        button.addEventListener("click", function () { sendMessage(button.textContent); });
        follow.appendChild(button);
      });
      article.appendChild(follow);
    }

    if (message.toolTrace && message.toolTrace.length) {
      var trace = el("details", "pan-trace");
      trace.appendChild(el("summary", "pan-trace__summary", t("trace")));
      var traceList = el("ul", "pan-trace__list");
      message.toolTrace.forEach(function (entry) {
        traceList.appendChild(el("li", "", bounded((entry && entry.detail) || entry, 240)));
      });
      trace.appendChild(traceList);
      article.appendChild(trace);
    }
    return article;
  }

  function renderMessages() {
    if (!messageList || !emptyState) return;
    messageList.textContent = "";
    emptyState.hidden = messages.length > 0;
    messages.forEach(function (message, index) { messageList.appendChild(renderMessage(message, index)); });
    messageList.scrollTop = messageList.scrollHeight;
  }

  function setBusy(busy) {
    if (!form) return;
    form.setAttribute("aria-busy", String(busy));
    input.disabled = busy;
    sendButton.hidden = busy;
    cancelButton.hidden = !busy;
    if (busy) setStatus(t("thinking"));
  }

  function responseObject(payload) {
    if (payload && payload.response && typeof payload.response === "object") return payload.response;
    if (payload && payload.result && typeof payload.result === "object") return payload.result;
    return payload || {};
  }

  async function sendMessage(value) {
    var text = bounded(value == null && input ? input.value : value, 4000);
    if (!text || activeController) return;
    messages.push({ role: "user", content: text });
    saveMessages();
    if (input) input.value = "";
    renderMessages();
    setBusy(true);
    activeController = new AbortController();
    try {
      var history = messages.slice(0, -1).slice(-8).map(function (message) {
        return { role: message.role, content: bounded(message.content, 3000) };
      });
      var response = await root.fetch("/api/lrn/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, locale: locale(), history: history, learner: collectLearnerSnapshot() }),
        signal: activeController.signal
      });
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        var reason = payload && payload.error && payload.error.message;
        throw new Error(bounded(reason, 500) || "request failed");
      }
      var result = responseObject(payload);
      messages.push({
        role: "assistant",
        content: bounded(result.answer, 12000) || t("error"),
        sources: Array.isArray(result.sources) ? result.sources.slice(0, 4) : [],
        followUps: Array.isArray(result.followUps) ? result.followUps.slice(0, 3) : [],
        nextAction: result.nextAction || null,
        toolTrace: Array.isArray(result.toolTrace) ? result.toolTrace.slice(0, 6) : []
      });
      setStatus(t("ready"));
    } catch (error) {
      if (error && error.name === "AbortError") setStatus(t("ready"));
      else {
        messages.push({ role: "assistant", content: t("error"), failed: true });
        setStatus(t("error"));
      }
    } finally {
      activeController = null;
      setBusy(false);
      saveMessages();
      renderMessages();
      if (input && !input.disabled) input.focus();
    }
  }

  function quickAction(key) {
    if (key === "plan") return openPlanBuilder();
    sendMessage(t(key + "Prompt"));
  }

  function indexHref() {
    var path = (root.location && root.location.pathname) || "";
    return /\/lrn\//.test(path) ? "../index.html#personalPlan" : "index.html#personalPlan";
  }

  function openPlanBuilder() {
    close();
    if (root.AIFSPersonalPlan && typeof root.AIFSPersonalPlan.open === "function") {
      root.AIFSPersonalPlan.open();
      return;
    }
    root.location.href = indexHref();
  }

  function close() {
    if (!shell || shell.hidden) return;
    shell.classList.remove("is-open");
    shell.setAttribute("aria-hidden", "true");
    root.document.body.classList.remove("pan-is-open");
    root.setTimeout(function () { shell.hidden = true; }, 240);
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }

  function open() {
    if (!shell) return;
    previousFocus = root.document.activeElement;
    shell.hidden = false;
    shell.setAttribute("aria-hidden", "false");
    root.document.body.classList.add("pan-is-open");
    root.requestAnimationFrame(function () { shell.classList.add("is-open"); });
    renderMessages();
    setStatus(t("ready"));
    root.setTimeout(function () { if (input) input.focus(); }, 30);
  }

  function clearConversation() {
    if (!root.confirm(t("clearConfirm"))) return;
    messages = [];
    saveMessages();
    renderMessages();
    setStatus(t("ready"));
  }

  function trapFocus(event) {
    if (event.key === "Escape") return close();
    if (event.key !== "Tab" || !panel) return;
    var focusable = Array.prototype.slice.call(panel.querySelectorAll("a[href],button:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex='-1'])"));
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && root.document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && root.document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function createQuickAction(key, iconName) {
    var button = el("button", "pan-quick-action");
    button.type = "button";
    button.dataset.action = key;
    button.append(icon(iconName), root.document.createTextNode(t(key)));
    button.addEventListener("click", function () { quickAction(key); });
    return button;
  }

  function buildUi() {
    var nav = root.document.querySelector(".nav-edge");
    if (!nav || root.document.getElementById("panLauncher")) return;
    launcher = el("button", "pan-nav-trigger");
    launcher.id = "panLauncher";
    launcher.type = "button";
    launcher.setAttribute("aria-haspopup", "dialog");
    launcher.setAttribute("aria-controls", "panPanel");
    launcher.setAttribute("aria-label", t("open"));
    launcher.title = t("open");
    launcher.append(icon("compass"), el("span", "pan-nav-trigger__label", "PAN"));
    var insertBefore = nav.querySelector("#darkModeToggle, .notes-link, .nav-settings");
    nav.insertBefore(launcher, insertBefore || null);
    launcher.addEventListener("click", open);

    shell = el("div", "pan-shell");
    shell.hidden = true;
    shell.id = "panShell";
    shell.setAttribute("aria-hidden", "true");
    var scrim = el("button", "pan-scrim");
    scrim.type = "button";
    scrim.tabIndex = -1;
    scrim.setAttribute("aria-label", t("close"));
    scrim.addEventListener("click", close);

    panel = el("aside", "pan-panel");
    panel.id = "panPanel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "panTitle");

    var header = el("header", "pan-panel__header");
    var heading = el("div", "pan-panel__heading");
    heading.append(el("p", "pan-panel__eyebrow", t("eyebrow")));
    var headingLine = el("div", "pan-panel__title-line");
    var title = el("h2", "", t("title"));
    title.id = "panTitle";
    headingLine.append(title, el("span", "pan-panel__subtitle", t("subtitle")));
    heading.appendChild(headingLine);
    var headerActions = el("div", "pan-panel__header-actions");
    var clear = el("button", "pan-icon-button");
    clear.type = "button";
    clear.title = t("clear");
    clear.setAttribute("aria-label", t("clear"));
    clear.appendChild(icon("trash"));
    clear.addEventListener("click", clearConversation);
    var closeButton = el("button", "pan-icon-button");
    closeButton.type = "button";
    closeButton.title = t("close");
    closeButton.setAttribute("aria-label", t("close"));
    closeButton.appendChild(icon("x"));
    closeButton.addEventListener("click", close);
    headerActions.append(clear, closeButton);
    header.append(heading, headerActions);

    var body = el("div", "pan-panel__body");
    emptyState = el("section", "pan-empty");
    emptyState.append(icon("compass"), el("h3", "", t("introTitle")), el("p", "", t("intro")));
    var quickActions = el("div", "pan-quick-actions");
    quickActions.append(
      createQuickAction("next", "arrow-right"),
      createQuickAction("explain", "book-open-text"),
      createQuickAction("practice", "question"),
      createQuickAction("plan", "path")
    );
    emptyState.appendChild(quickActions);
    messageList = el("div", "pan-messages");
    messageList.setAttribute("aria-live", "polite");
    body.append(emptyState, messageList);

    var footer = el("footer", "pan-panel__footer");
    form = el("form", "pan-compose");
    input = el("textarea", "pan-compose__input");
    input.rows = 2;
    input.maxLength = 4000;
    input.placeholder = t("placeholder");
    input.setAttribute("aria-label", t("placeholder"));
    sendButton = el("button", "pan-compose__send");
    sendButton.type = "submit";
    sendButton.append(icon("paper-plane-tilt"), el("span", "", t("send")));
    cancelButton = el("button", "pan-compose__cancel", t("cancel"));
    cancelButton.type = "button";
    cancelButton.hidden = true;
    cancelButton.addEventListener("click", function () { if (activeController) activeController.abort(); });
    form.append(input, sendButton, cancelButton);
    form.addEventListener("submit", function (event) { event.preventDefault(); sendMessage(); });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); form.requestSubmit(); }
    });
    statusNode = el("p", "pan-status");
    statusNode.setAttribute("role", "status");
    var privacy = el("p", "pan-privacy", t("privacy"));
    footer.append(form, statusNode, privacy);

    panel.append(header, body, footer);
    panel.addEventListener("keydown", trapFocus);
    shell.append(scrim, panel);
    root.document.body.appendChild(shell);
  }

  function renderLocale() {
    if (!root.document || !launcher || !shell) return;
    var wasOpen = !shell.hidden;
    launcher.remove();
    shell.remove();
    launcher = null;
    shell = null;
    panel = null;
    messageList = null;
    emptyState = null;
    form = null;
    input = null;
    sendButton = null;
    cancelButton = null;
    statusNode = null;
    root.document.body.classList.remove("pan-is-open");
    buildUi();
    renderMessages();
    if (wasOpen) open();
  }

  function init() {
    if (!root.document) return;
    function run() {
      messages = loadMessages();
      buildUi();
      renderMessages();
      root.document.addEventListener("sitelang:change", renderLocale);
      if ((root.location && root.location.hash) === "#pan") open();
    }
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", run, { once: true });
    else run();
  }

  return {
    init: init,
    open: open,
    close: close,
    sendMessage: sendMessage,
    safeHref: safeHref,
    collectLearnerSnapshot: collectLearnerSnapshot,
    courseProgressSnapshot: courseProgressSnapshot
  };
});
