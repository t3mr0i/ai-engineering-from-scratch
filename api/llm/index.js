/**
 * LLM gateway proxy for notebooks — Azure Static Web Apps counterpart to
 * server/server.js's handleLlmProxy (see B31: this route existed only in
 * the OpenShift/dev server, so it 404'd on the SWA deployment regardless
 * of what the dev server could do). Injects LLM_GATEWAY_KEY server-side so
 * it never reaches the browser; kept independent of the ase_gate cookie,
 * same as the OpenShift version.
 *
 * The rate limiter is in-memory per function instance, so it caps per
 * instance, not globally, under Functions' Consumption plan scale-out —
 * weaker than a shared store, but still real backpressure on the shared
 * gateway budget.
 */

const LLM_GATEWAY_URL = 'https://gateway.lhind.ai/v1/chat/completions';
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
  if (!key) {
    context.res = { status: 500, body: { error: { message: 'LLM gateway not configured' } } };
    return;
  }

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
    const upstream = await fetch(LLM_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: raw,
    });
    const text = await upstream.text();
    context.res = {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
      body: text,
    };
  } catch (err) {
    context.res = { status: 502, body: { error: { message: 'upstream request failed' } } };
  }
};
