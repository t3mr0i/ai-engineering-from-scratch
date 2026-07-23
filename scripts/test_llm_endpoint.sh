#!/usr/bin/env bash
# Quick test for an OpenAI-compatible LLM endpoint.
#
# Probiert vier Auth-Varianten + einen CORS-Preflight + listet, was funktioniert.
# Macht KEINEN Inhalt-Call (nur 1-Token-Ping), kostet effektiv nichts.
#
# Usage:
#   ./scripts/test_llm_endpoint.sh \
#       https://gateway.lhind.ai/v1 \
#       "sk-xf-...." \
#       azure/gpt-5.4-mini
#
# Or set via env vars:
#   LLM_URL=... LLM_KEY=... LLM_MODEL=... ./scripts/test_llm_endpoint.sh

set -u

URL="${1:-${LLM_URL:-}}"
KEY="${2:-${LLM_KEY:-}}"
MODEL="${3:-${LLM_MODEL:-azure/gpt-5.4-mini}}"

if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "usage: $0 <endpoint-url> <api-key> [model]"
  echo "  oder LLM_URL=, LLM_KEY=, LLM_MODEL= als env vars"
  exit 1
fi

URL="${URL%/}"        # trailing slash kappen
KEY_PREVIEW="${KEY:0:6}...${KEY: -4}"

# colors (works in iTerm/Terminal)
G='\033[0;32m'; R='\033[0;31m'; Y='\033[0;33m'; B='\033[0;34m'; N='\033[0m'

echo "================================================================"
echo "  LLM endpoint test"
echo "================================================================"
echo "  URL    : $URL"
echo "  Key    : $KEY_PREVIEW (${#KEY} chars)"
echo "  Model  : $MODEL"
echo

# 1) DNS / reachability
echo "── 1. DNS ──"
host "$(echo "$URL" | awk -F/ '{print $3}')" 2>&1 | head -3
echo

PAYLOAD='{"model":"'"$MODEL"'","messages":[{"role":"user","content":"Reply with exactly: OK"}],"max_completion_tokens":20}'

# 2) CORS pre-flight (whether the endpoint can be hit from a browser)
echo "── 2. CORS preflight (browser-compat) ──"
CORS_HEADERS=$(curl -sSI --max-time 12 \
  -X OPTIONS "$URL/chat/completions" \
  -H "Origin: http://localhost:4173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization,api-key" 2>&1)
echo "$CORS_HEADERS" | head -8
if echo "$CORS_HEADERS" | grep -qi "access-control-allow-origin"; then
  printf "  ${G}✓${N}  CORS unterstützt → Browser darf den Endpoint aufrufen\n"
else
  printf "  ${R}✗${N}  KEIN CORS → Notebook im Browser scheitert, du brauchst einen Proxy\n"
fi
echo

# 3-6) Try four auth styles
try_auth () {
  local LABEL="$1"
  local HEADER="$2"
  echo "── ${LABEL} ──"
  local OUT HTTP
  OUT=$(curl -sS -w "\n__HTTP=%{http_code}" --max-time 20 \
    -X POST "$URL/chat/completions" \
    -H "content-type: application/json" \
    -H "$HEADER" \
    -d "$PAYLOAD" 2>&1)
  HTTP=$(echo "$OUT" | sed -n 's/__HTTP=//p' | tail -1)
  BODY=$(echo "$OUT" | sed '/__HTTP=/d' | head -c 400)
  echo "  HTTP $HTTP"
  echo "  body: $BODY"
  case "$HTTP" in
    200) printf "  ${G}✓ WORKS${N} — use this auth header in the notebook\n" ;;
    401|403) printf "  ${R}✗ rejected${N}\n" ;;
    404)     printf "  ${Y}? path or model unknown${N}\n" ;;
    *)       printf "  ${Y}? unexpected HTTP $HTTP${N}\n" ;;
  esac
  echo
}

try_auth "3. Authorization: Bearer (OpenAI-style)"      "Authorization: Bearer $KEY"
try_auth "4. api-key header (Azure-style)"              "api-key: $KEY"
try_auth "5. Ocp-Apim-Subscription-Key (APIM-style)"    "Ocp-Apim-Subscription-Key: $KEY"
try_auth "6. x-api-key (Anthropic-style — long shot)"   "x-api-key: $KEY"

echo "================================================================"
echo "  Diagnose"
echo "================================================================"
echo "  - HTTP 200 in einem der vier Tests = Setup funktioniert"
echo "  - 401 in allen vier Tests = Key wahrscheinlich abgelaufen / falsch"
echo "  - 404 bei /chat/completions = falscher Pfad oder Modell-Name"
echo "  - kein CORS-Header in Test 2 = du brauchst den lokalen Proxy für Browser"
echo
