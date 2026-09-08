/**
 * LLM gateway proxy for notebooks — legacy Azure Static Web Apps managed
 * function. Canonical implementation: server/server.js handleLlmProxy
 * (OpenShift + local dev via serve.sh). Uses LLM_GATEWAY_KEY server-side when
 * configured; the current internal gateway also accepts trusted requests
 * without that optional credential. Kept independent of the ase_gate cookie.
 *
 * The rate limiter is in-memory per function instance, so it caps per
 * instance, not globally, under Functions' Consumption plan scale-out —
 * weaker than a shared store, but still real backpressure on the shared
 * gateway budget.
 */

const LLM_GATEWAY_URL = 'https://gateway.lhind.ai/v1/chat/completions';
const PRIMARY_MODEL = 'azure/gpt-5.6-luna';
const FALLBACK_MODEL = 'azure/gpt-5.4-mini';
const LLM_RATE_LIMIT_PER_MIN = 20;
const MAX_BODY_BYTES = 1_000_000;

const rateState = new Map();

function clientIp(req) {
  const xff = req.headers && req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}

function rateLimited(ip) {
  const now = Date.now();
  const entry = rateState.get(ip);
  if (!entry || now - entry.windowStart > 60000) {
    rateState.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > LLM_RATE_LIMIT_PER_MIN;
}

module.exports = async function (context, req) {
  const key = process.env.LLM_GATEWAY_KEY;
  if (rateLimited(clientIp(req))) {
    context.res = { status: 429, body: { error: { message: 'rate limit exceeded, try again shortly' } } };
    return;
  }

  const raw = req.rawBody || JSON.stringify(req.body || {});
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
    context.res = { status: 413, body: { error: { message: 'request too large' } } };
    return;
  }

  try {
    const headers = { 'content-type': 'application/json' };
    if (key) headers.Authorization = `Bearer ${key}`;
    let upstream = await fetch(LLM_GATEWAY_URL, {
      method: 'POST',
      headers,
      body: raw,
    });
    let text = await upstream.text();
    let requestedModel = '';
    let parsedBody;
    try {
      parsedBody = JSON.parse(raw);
      requestedModel = parsedBody && parsedBody.model;
    } catch (_) {}
    if (requestedModel === PRIMARY_MODEL && upstream.status >= 500) {
      upstream = await fetch(LLM_GATEWAY_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...parsedBody, model: FALLBACK_MODEL }),
      });
      text = await upstream.text();
    }
    context.res = {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
      body: text,
    };
  } catch (err) {
    context.res = { status: 502, body: { error: { message: 'upstream request failed' } } };
  }
};
