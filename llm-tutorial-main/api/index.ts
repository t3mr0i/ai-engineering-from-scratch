/**
 * HTTP entry point for the JSON API (`/api?action=…`).
 * Thin wrapper: builds the request context, calls apiDispatch(), writes the
 * result + any Set-Cookie headers. All logic lives in lib/api.ts.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiDispatch } from "../lib/api.js";
import { createStore } from "../lib/store.js";
import { first, makeCtx } from "../lib/http.js";

// Created once per warm instance (does not connect until a method is called).
const store = createStore();

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const action = first(req.query.action as string | string[] | undefined);
  const { ctx, cookies } = makeCtx(req);

  // Request body as an object (JSON or already-parsed form).
  let input: Record<string, any> = {};
  if (req.body && typeof req.body === "object") {
    input = req.body as Record<string, any>;
  } else if (typeof req.body === "string" && req.body) {
    try {
      const j = JSON.parse(req.body);
      if (j && typeof j === "object") input = j;
    } catch {
      /* ignore malformed body */
    }
  }

  let result;
  try {
    result = await apiDispatch(store, action, input, ctx);
  } catch (e) {
    console.error(`api [${action}]:`, e);
    result = { code: 500, body: { ok: false, error: "server" } };
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (cookies.length) res.setHeader("Set-Cookie", cookies);
  res.status(result.code).send(JSON.stringify(result.body));
}
