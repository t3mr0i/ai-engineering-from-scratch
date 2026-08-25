// TypeScript companion for phases/00-setup-and-tooling/04-apis-and-keys/docs/en.md.
// Builds the same Messages-shaped request with a deterministic local fixture.
// Network access requires LIVE=1, ANTHROPIC_API_KEY, and ANTHROPIC_MODEL; MOCK=1 always wins.
// Uses Node's standard library and global fetch, with no SDK dependency.
// Reference: https://docs.anthropic.com/en/api/messages.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

type MessagesRequest = {
  model: string;
  max_tokens: number;
  messages: { role: "user" | "assistant"; content: string }[];
};

type MessagesResponse = {
  content: { type: string; text: string }[];
  usage: { input_tokens: number; output_tokens: number };
};

// .env loader. Same shape every framework follows; we skip a dep to stay
// portable. KEY=VALUE per line, # comments, optional surrounding quotes.
function loadDotenv(path: string): Record<string, string> {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return {};
  }
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function mergeEnv(): NodeJS.ProcessEnv {
  // process.env wins so users can override the file without editing it.
  const fromFile = loadDotenv(resolve(process.cwd(), ".env"));
  return { ...fromFile, ...process.env };
}

// Fixture matches the real /v1/messages response shape, so the surrounding
// code is identical whether MOCK=1 or not.
const MOCK_RESPONSE: MessagesResponse = {
  content: [
    {
      type: "text",
      text: "A neural network is a stack of differentiable functions that learns patterns by adjusting weights against a loss signal.",
    },
  ],
  usage: { input_tokens: 12, output_tokens: 28 },
};

async function callMessages(
  apiKey: string,
  request: MessagesRequest,
  liveEnabled: boolean,
): Promise<MessagesResponse> {
  if (!liveEnabled || !apiKey || request.model === "lesson-fixture") {
    return MOCK_RESPONSE;
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(request),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`anthropic ${resp.status}: ${body.slice(0, 200)}`);
  }
  return (await resp.json()) as MessagesResponse;
}

async function main(): Promise<number> {
  const env = mergeEnv();
  const apiKey = env.ANTHROPIC_API_KEY ?? "";
  const liveEnabled = env.LIVE === "1";
  const liveModel = env.ANTHROPIC_MODEL?.trim() ?? "";
  const usingMock =
    env.MOCK === "1" || !liveEnabled || !apiKey || !liveModel || liveModel === "lesson-fixture";

  process.stdout.write("=== API Calls ===\n\n");
  process.stdout.write(
    usingMock
      ? "Mode: MOCK (no network). Set LIVE=1, ANTHROPIC_API_KEY, and ANTHROPIC_MODEL for a live call.\n\n"
      : "Mode: LIVE.\n\n",
  );

  const request: MessagesRequest = {
    model: usingMock ? "lesson-fixture" : liveModel,
    max_tokens: 256,
    messages: [{ role: "user", content: "What is a neural network in one sentence?" }],
  };

  try {
    const response = await callMessages(apiKey, request, !usingMock);
    const text = response.content[0]?.text ?? "";
    process.stdout.write(`response: ${text}\n`);
    process.stdout.write(
      `tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out\n`,
    );
    return 0;
  } catch (err) {
    process.stderr.write(`request failed: ${(err as Error).message}\n`);
    return 1;
  }
}

main().then((code) => process.exit(code));
