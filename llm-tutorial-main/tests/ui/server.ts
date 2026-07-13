/**
 * Minimal local server for the UI tests (and offline local dev): mounts the
 * same render + api function handlers behind a plain Node HTTP server and serves
 * the static assets. Run with tsx. Uses the file-backed store (LOCAL_STORE_DIR)
 * so `render` and `api` share state without any cloud dependency.
 *
 *   LOCAL_STORE_DIR=… ADMIN_USERNAME=… ADMIN_PASSWORD_HASH=… SESSION_SECRET=… \
 *     PORT=8799 npx tsx tests/ui/server.ts
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import renderHandler from "../../api/render.js";
import apiHandler from "../../api/index.js";

const PORT = Number(process.env.PORT || 8799);
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const PUBLIC = join(ROOT, "public");

const CONTENT_TYPE: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

/** Adapt a Node response to the tiny VercelResponse surface the handlers use. */
function adaptRes(res: http.ServerResponse): any {
  const r = res as any;
  r.status = (code: number) => {
    res.statusCode = code;
    return r;
  };
  r.send = (body: string) => res.end(body);
  return r;
}

async function readBody(req: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (query[k] = v));

  // Static assets.
  if (url.pathname.startsWith("/assets/")) {
    try {
      const buf = await readFile(join(PUBLIC, url.pathname));
      res.setHeader("Content-Type", CONTENT_TYPE[extname(url.pathname)] || "application/octet-stream");
      res.end(buf);
    } catch {
      res.statusCode = 404;
      res.end("not found");
    }
    return;
  }

  const vreq: any = { headers: req.headers, query, url: req.url, body: undefined };
  if (url.pathname === "/api") {
    vreq.body = await readBody(req);
    await apiHandler(vreq, adaptRes(res));
    return;
  }
  if (url.pathname === "/" || url.pathname === "") {
    await renderHandler(vreq, adaptRes(res));
    return;
  }
  res.statusCode = 404;
  res.end("not found");
});

server.listen(PORT, () => {
  console.log(`local server on http://127.0.0.1:${PORT}`);
});
