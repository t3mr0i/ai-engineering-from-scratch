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
# would need revisiting together.
node site/build.js
mkdir -p site/phases
rsync -a --prune-empty-dirs \
  --include='*/' \
  --include='docs/en.md' \
  --include='docs/de.md' \
  --include='quiz.json' \
  --include='code/main.py' \
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
