/**
 * JSON API for journey mode.
 *
 * All logic lives in apiDispatch() and returns { code, body } — so it is called
 * directly in tests (no HTTP). The HTTP entry point is api/index.ts.
 *
 *   Player:  join, state, pos, solo
 *   Admin:   admin_login, admin_logout, admin_me, admin_console,
 *            admin_create, admin_start, admin_unlock, admin_archive, admin_delete
 */
import bcrypt from "bcryptjs";
import type { ApiResult, Ctx, JourneyRecord, PlayerRecord, Store } from "./types.js";
import {
  activeJourneyFull,
  chapterCount,
  clientState,
  HEARTBEAT_SECONDS,
  isOnline,
  iso,
  newJourneyId,
  newToken,
  projectionOf,
  randomName,
  secsSince,
  soloCohortName,
} from "./sync.js";

const ok = (body: Record<string, any>, code = 200): ApiResult => ({ code, body });

function intInput(v: unknown): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? "0"), 10);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/** Should we rewrite last_seen? Throttled to once per HEARTBEAT_SECONDS. */
function heartbeatDue(lastSeen: string | null, nowMs: number): boolean {
  if (!lastSeen) return true;
  const t = Date.parse(lastSeen);
  return Number.isNaN(t) || nowMs - t >= HEARTBEAT_SECONDS * 1000;
}

export async function apiDispatch(
  store: Store,
  action: string,
  input: Record<string, any>,
  ctx: Ctx,
): Promise<ApiResult> {
  switch (action) {
    // ---- Player ----------------------------------------------------------

    case "join": {
      const j = await store.getActiveProjection();
      if (!j) return ok({ ok: false, error: "no-active-journey" }, 409);

      let token = ctx.playerToken;
      const player = token ? await store.getPlayer(token) : null;
      if (!player || player.journey_id !== j.id) {
        token = newToken();
        await store.putPlayer({
          journey_id: j.id,
          token,
          name: randomName(ctx.lang),
          approved: j.status === "lobby",
          current_chapter: 0,
          joined_at: iso(ctx.now),
          last_seen: iso(ctx.now),
        });
        ctx.setPlayerToken(token);
      }
      return ok({ ok: true, ...(await clientState(store, token)) });
    }

    case "state": {
      const token = ctx.playerToken;
      if (token) {
        const player = await store.getPlayer(token);
        if (player && heartbeatDue(player.last_seen, ctx.now)) {
          player.last_seen = iso(ctx.now);
          await store.putPlayer(player);
        }
      }
      return ok({ ok: true, ...(await clientState(store, token)) });
    }

    case "pos": {
      const token = ctx.playerToken;
      const chapter = Math.max(0, intInput(input.chapter));
      if (token) {
        const player = await store.getPlayer(token);
        if (player && (player.current_chapter !== chapter || heartbeatDue(player.last_seen, ctx.now))) {
          player.current_chapter = chapter;
          player.last_seen = iso(ctx.now);
          await store.putPlayer(player);
        }
      }
      return ok({ ok: true });
    }

    // Solo progress (no active journey): creates/updates a journey-less player.
    case "solo": {
      if (await store.getActiveProjection()) {
        return ok({ ok: true, mode: "journey-active" });
      }
      const chapter = Math.max(0, intInput(input.chapter));
      let token = ctx.playerToken;
      const player = token ? await store.getPlayer(token) : null;
      if (!player || player.journey_id !== null) {
        token = newToken();
        await store.putPlayer({
          journey_id: null,
          token,
          name: randomName(ctx.lang),
          approved: true,
          current_chapter: chapter,
          joined_at: iso(ctx.now),
          last_seen: iso(ctx.now),
        });
        ctx.setPlayerToken(token);
      } else {
        player.current_chapter = chapter;
        player.last_seen = iso(ctx.now);
        await store.putPlayer(player);
      }
      return ok({ ok: true });
    }

    // ---- Admin -----------------------------------------------------------

    case "admin_login": {
      const user = String(input.username ?? "").trim();
      const pass = String(input.password ?? "");
      const admin = ctx.admins.find((a) => a.username === user);
      if (!admin || !admin.password_hash || !bcrypt.compareSync(pass, admin.password_hash)) {
        return ok({ ok: false, error: "invalid-credentials" }, 401);
      }
      ctx.login(admin.username);
      return ok({ ok: true, admin: { username: admin.username } });
    }

    case "admin_logout": {
      ctx.logout();
      return ok({ ok: true });
    }

    case "admin_me": {
      return ok({ ok: true, admin: ctx.admin ? { username: ctx.admin } : null });
    }

    case "admin_console": {
      if (!ctx.admin) return ok({ ok: false, error: "unauthorized" }, 401);
      return ok(await adminConsole(store, ctx));
    }

    case "admin_create": {
      if (!ctx.admin) return ok({ ok: false, error: "unauthorized" }, 401);
      if (await activeJourneyFull(store)) {
        return ok({ ok: false, error: "journey-already-active" }, 409);
      }
      const name = String(input.name ?? "").trim() || "Journey";
      const j: JourneyRecord = {
        id: newJourneyId(),
        name,
        status: "lobby",
        unlocked_chapter: 0,
        created_at: iso(ctx.now),
        started_at: null,
        unlocked_at: null,
      };
      await store.putJourney(j);
      await store.setActiveProjection(projectionOf(j));
      return ok({ ok: true });
    }

    case "admin_start": {
      if (!ctx.admin) return ok({ ok: false, error: "unauthorized" }, 401);
      const j = await activeJourneyFull(store);
      if (!j) return ok({ ok: false, error: "no-active-journey" }, 409);
      j.status = "live";
      j.started_at = iso(ctx.now);
      j.unlocked_at = iso(ctx.now);
      await store.putJourney(j);
      await store.setActiveProjection(projectionOf(j));
      return ok({ ok: true });
    }

    case "admin_unlock": {
      if (!ctx.admin) return ok({ ok: false, error: "unauthorized" }, 401);
      const j = await activeJourneyFull(store);
      if (!j) return ok({ ok: false, error: "no-active-journey" }, 409);
      const max = Math.max(0, chapterCount() - 1);
      const chapter = Math.min(max, Math.max(0, intInput(input.chapter)));
      j.unlocked_chapter = chapter;
      j.unlocked_at = iso(ctx.now);
      await store.putJourney(j);
      await store.setActiveProjection(projectionOf(j));
      return ok({ ok: true, unlocked: chapter });
    }

    case "admin_archive": {
      if (!ctx.admin) return ok({ ok: false, error: "unauthorized" }, 401);
      const j = await activeJourneyFull(store);
      if (j) {
        j.status = "archived";
        await store.putJourney(j);
        await store.setActiveProjection(null);
      }
      return ok({ ok: true });
    }

    // Delete a lobby ("cancel") or archived ("delete past") journey + its
    // players. A live journey is protected — it must be archived first.
    case "admin_delete": {
      if (!ctx.admin) return ok({ ok: false, error: "unauthorized" }, 401);
      const id = input.id == null ? "" : String(input.id);
      if (id === "" || id === "0") return ok({ ok: false, error: "no-journey" }, 400);
      const row = await store.getJourney(id);
      if (!row) return ok({ ok: false, error: "not-found" }, 404);
      if (row.status === "live") return ok({ ok: false, error: "journey-live" }, 409);

      const players = await store.listPlayers();
      for (const p of players) {
        if (p.journey_id === id) await store.deletePlayer(p.token);
      }
      await store.deleteJourney(id);
      const proj = await store.getActiveProjection();
      if (proj && proj.id === id) await store.setActiveProjection(null);
      return ok({ ok: true });
    }

    default:
      return ok({ ok: false, error: "unknown-action" }, 404);
  }
}

/** All cohorts (solo + every journey) + players of the selection. */
async function adminConsole(store: Store, ctx: Ctx): Promise<Record<string, any>> {
  const now = ctx.now;
  const players = await store.listPlayers();
  const journeys = (await store.listJourneys()).sort((a, b) =>
    a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : b.id.localeCompare(a.id),
  );
  const active = await activeJourneyFull(store);

  // Cohorts: solo first, then journeys newest-first.
  const soloPlayers = players.filter((p) => p.journey_id === null);
  const cohorts: Record<string, any>[] = [
    {
      key: "solo",
      name: soloCohortName(ctx.lang),
      status: "solo",
      total: soloPlayers.length,
      online: soloPlayers.filter((p) => isOnline(p.last_seen, now)).length,
    },
  ];
  for (const j of journeys) {
    const jp = players.filter((p) => p.journey_id === j.id);
    cohorts.push({
      key: j.id,
      name: j.name,
      status: j.status,
      unlocked: j.unlocked_chapter,
      total: jp.length,
      online: jp.filter((p) => isOnline(p.last_seen, now)).length,
    });
  }

  let sel = String(ctx.query.journey ?? "");
  if (sel === "") sel = active ? active.id : "solo";

  let journeyMeta: Record<string, any> | null = null;
  let controls = "readonly";
  let row: JourneyRecord | null = null;
  let selected: PlayerRecord[];
  if (sel === "solo") {
    selected = soloPlayers;
  } else {
    row = await store.getJourney(sel);
    if (row) {
      journeyMeta = { id: row.id, name: row.name, status: row.status, unlocked: row.unlocked_chapter };
      if (active && active.id === sel) controls = "active";
    }
    selected = players.filter((p) => p.journey_id === sel);
  }

  selected.sort((a, b) =>
    a.joined_at < b.joined_at ? -1 : a.joined_at > b.joined_at ? 1 : a.token.localeCompare(b.token),
  );
  const playerList = selected.map((p) => ({
    name: p.name,
    approved: p.approved,
    chapter: p.current_chapter,
    online: isOnline(p.last_seen, now),
  }));

  // Timing/pacing for the selected journey (driver-neutral, UTC).
  let timing: Record<string, any> | null = null;
  if (journeyMeta && row) {
    const chCount = chapterCount();
    const dist = new Array(Math.max(1, chCount)).fill(0);
    let done = 0;
    let fTotal = 0;
    let fDone = 0;
    const unlocked = journeyMeta.unlocked;
    for (const p of playerList) {
      if (!p.approved) continue;
      fTotal++;
      const ch = p.chapter;
      if (ch >= chCount) done++;
      else if (ch >= 0) dist[ch]++;
      if (ch > unlocked) fDone++;
    }
    timing = {
      elapsed: secsSince(row.started_at, now),
      sinceUnlock: secsSince(row.unlocked_at, now),
      dist,
      done,
      frontierDone: fDone,
      frontierTotal: fTotal,
    };
  }

  return {
    ok: true,
    chapters: chapterCount(),
    cohorts,
    selected: sel,
    journey: journeyMeta,
    controls,
    players: playerList,
    timing,
  };
}
