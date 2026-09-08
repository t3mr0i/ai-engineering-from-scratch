const assert = require('node:assert/strict');
const test = require('node:test');

const handleLlm = require('./index.js');

function request(model = 'azure/gpt-5.4-mini') {
  return {
    headers: { 'x-forwarded-for': '203.0.113.10' },
    body: {
      model,
      messages: [{ role: 'user', content: 'Reply with OK' }],
      max_completion_tokens: 16,
    },
  };
}

test('forwards to the LHIND gateway when no gateway key is configured', async (t) => {
  const previousFetch = global.fetch;
  const previousKey = process.env.LLM_GATEWAY_KEY;
  t.after(() => {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.LLM_GATEWAY_KEY;
    else process.env.LLM_GATEWAY_KEY = previousKey;
  });

  delete process.env.LLM_GATEWAY_KEY;
  let upstreamRequest;
  global.fetch = async (url, options) => {
    upstreamRequest = { url, options };
    return { status: 200, text: async () => '{"choices":[]}' };
  };

  const context = {};
  await handleLlm(context, request());

  assert.equal(context.res.status, 200);
  assert.equal(upstreamRequest.url, 'https://gateway.lhind.ai/v1/chat/completions');
  assert.equal(upstreamRequest.options.headers.Authorization, undefined);
});

test('adds the server-side gateway key when one is configured', async (t) => {
  const previousFetch = global.fetch;
  const previousKey = process.env.LLM_GATEWAY_KEY;
  t.after(() => {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.LLM_GATEWAY_KEY;
    else process.env.LLM_GATEWAY_KEY = previousKey;
  });

  process.env.LLM_GATEWAY_KEY = 'server-secret';
  let upstreamHeaders;
  global.fetch = async (_url, options) => {
    upstreamHeaders = options.headers;
    return { status: 200, text: async () => '{"choices":[]}' };
  };

  const context = {};
  await handleLlm(context, request());

  assert.equal(context.res.status, 200);
  assert.equal(upstreamHeaders.Authorization, 'Bearer server-secret');
});

test('falls back only when the Luna deployment has an upstream server error', async (t) => {
  const previousFetch = global.fetch;
  const previousKey = process.env.LLM_GATEWAY_KEY;
  t.after(() => {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.LLM_GATEWAY_KEY;
    else process.env.LLM_GATEWAY_KEY = previousKey;
  });

  delete process.env.LLM_GATEWAY_KEY;
  const models = [];
  global.fetch = async (_url, options) => {
    const model = JSON.parse(options.body).model;
    models.push(model);
    if (model === 'azure/gpt-5.6-luna') {
      return { status: 500, text: async () => '{"error":{"message":"upstream unavailable"}}' };
    }
    return { status: 200, text: async () => '{"choices":[{"message":{"content":"OK"}}]}' };
  };

  const context = {};
  await handleLlm(context, request('azure/gpt-5.6-luna'));

  assert.deepEqual(models, ['azure/gpt-5.6-luna', 'azure/gpt-5.4-mini']);
  assert.equal(context.res.status, 200);
});
