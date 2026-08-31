#!/usr/bin/env sh
# Lokaler Server für die Site und ihre APIs.
#
# Solange dieses Skript läuft, ist die App erreichbar.
# Mit Ctrl+C beenden -> App geht offline.
#
#   ./serve.sh           # Standard-Port 4173
#   ./serve.sh 8080      # eigener Port
#
# Webroot ist site/ — identisch zum OpenShift-Container.
# Lokal erreichbare URLs entsprechen damit 1:1 den Live-URLs (/, /catalog.html, …).
# Vorab läuft build.js (data.js/sitemap/llms.txt) und phases/ wird nach
# site/phases/ gestaged, genau wie in der CI, damit Lesson-Content lädt.

set -e

LOCAL_SERVER_PORT="${1:-4173}"
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Fail before rebuilding or opening the browser when another process still owns
# the requested port. This commonly happens when an older static dev server is
# left running and would otherwise keep serving misleading API 404 responses.
if ! node -e '
  const net = require("node:net");
  const probe = net.createServer();
  probe.once("error", () => process.exit(1));
  probe.listen(Number(process.argv[1]), "127.0.0.1", () => probe.close());
' "$LOCAL_SERVER_PORT"; then
  echo "Fehler: Port $LOCAL_SERVER_PORT ist bereits belegt." >&2
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$LOCAL_SERVER_PORT" -sTCP:LISTEN >&2 || true
  fi
  echo "Beende den angezeigten Prozess oder starte mit: ./serve.sh 4174" >&2
  exit 1
fi

cd "$REPO_ROOT"

# Build + Lesson-Content-Staging — same file selection as
# openshift/Dockerfile's build stage (the .gitlab-ci.yml deploy_azure job
# this used to mirror was removed when Azure was decommissioned; keep this
# script and the Dockerfile in sync instead). The assets/ include was
# missing here too until this fix — lesson markdown images 404'd both
# locally and in the deployed container.
# NOTE: `assets/*` (one path segment), not `assets/**` — this box's rsync
# is openrsync (macOS/BSD, protocol 29), and its `**` does not match across
# the phase/lesson directory boundary the way GNU rsync's does (verified:
# `assets/**` silently staged zero files from more than one level up,
# `assets/*` staged all of them). `assets/*` only reaches directly-inside
# files, which matches every current lesson (298 assets/ dirs, each with
# exactly one flat .svg file, no subdirectories) — if a lesson ever nests
# assets in a subfolder, both this pattern and the site's image resolver
# would need revisiting together. `outputs/*` intentionally stages direct
# lesson artifacts only; the lesson reader exposes those as internal previews.
node site/build.js
mkdir -p site/phases
rsync -a --prune-empty-dirs \
  --include='*/' \
  --include='docs/en.md' \
  --include='docs/de.md' \
  --include='quiz.json' \
  --include='code/main.py' \
  --include='outputs/*' \
  --include='assets/*' \
  --exclude='*' \
  phases/ site/phases/

# Keep the managed-function fixture current for optional Azure Functions tests.
# The local Node server itself reads the staged files from site/phases/ above.
mkdir -p api/content/_data
rsync -a --prune-empty-dirs \
  --include='*/' \
  --include='docs/en.md' \
  --include='docs/de.md' \
  --include='quiz.json' \
  --include='code/main.py' \
  --include='outputs/*' \
  --include='assets/*' \
  --exclude='*' \
  phases/ api/content/_data/phases/

LOCAL_SERVER_URL="http://localhost:${LOCAL_SERVER_PORT}/"

echo "──────────────────────────────────────────────"
echo "  LHIND AI Lernkatalog läuft"
echo ""
echo "  $LOCAL_SERVER_URL"
echo ""
echo "  Webroot: $REPO_ROOT/site"
echo "  Admin:   lokaler Publisher-Modus aktiv"
echo "  Beenden:  Ctrl+C  (danach offline)"
echo "──────────────────────────────────────────────"

# Browser automatisch öffnen (nur macOS; still ignorieren falls nicht vorhanden).
if [ "${LOCAL_SERVER_NO_OPEN:-}" != "1" ] && command -v open >/dev/null 2>&1; then
  open "$LOCAL_SERVER_URL" || true
fi

# Der Node-Server liefert Site und /api/admin/* aus einem Prozess. Der explizite
# Dev-Modus vergibt lokal Publisher-Rechte; 127.0.0.1 verhindert LAN-Zugriff.
PORT="$LOCAL_SERVER_PORT" \
WEB_ROOT="$REPO_ROOT/site" \
BIND_HOST="127.0.0.1" \
GATE_DISABLED="true" \
ADMIN_DEV_MODE=true \
exec node "$REPO_ROOT/server/server.js"
