#!/usr/bin/env sh
# Lokaler Server für die Site — Webroot ist site/, exakt wie Azure.
#
# Solange dieses Skript läuft, ist die App erreichbar.
# Mit Ctrl+C beenden -> App geht offline.
#
#   ./serve.sh           # Standard-Port 4173
#   ./serve.sh 8080      # eigener Port
#
# Webroot ist site/ — identisch zum Azure-Deploy (gitlab-ci deployt ./site).
# Lokal erreichbare URLs entsprechen damit 1:1 den Live-URLs (/, /catalog.html, …).
# Vorab läuft build.js (data.js/sitemap/llms.txt) und phases/ wird nach
# site/phases/ gestaged, genau wie in der CI, damit Lesson-Content lädt.

set -e

PORT="${1:-4173}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT"

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
  --include='quiz.json' \
  --include='code/main.py' \
  --include='assets/*' \
  --exclude='*' \
  phases/ site/phases/

# This local server can't run the Azure Function (/api/content) — lesson.html
# falls back to fetching straight from site/phases/ on localhost (see the
# IS_LOCAL_DEV check in lesson.html, same precedent as gate-guard.js). The
# deployed site does NOT ship site/phases/ — see .github/workflows/azure-
# static-web-apps.yml, which stages this same selection into
# api/content/_data/ instead so the gated function can serve it.
# Staged here too (same selection) only so `func start`/SWA-CLI-based local
# testing of api/content itself has real files to read; the plain
# python3 http.server below never touches this directory.
mkdir -p api/content/_data
rsync -a --prune-empty-dirs \
  --include='*/' \
  --include='docs/en.md' \
  --include='quiz.json' \
  --include='code/main.py' \
  --include='assets/*' \
  --exclude='*' \
  phases/ api/content/_data/phases/

URL="http://localhost:${PORT}/"

echo "──────────────────────────────────────────────"
echo "  LHIND AI Lernkatalog läuft"
echo ""
echo "  $URL"
echo ""
echo "  Webroot: $ROOT/site  (wie Azure)"
echo "  Beenden:  Ctrl+C  (danach offline)"
echo "──────────────────────────────────────────────"

# Browser automatisch öffnen (nur macOS; still ignorieren falls nicht vorhanden).
command -v open >/dev/null 2>&1 && open "$URL" || true

# Vordergrund-Server aus site/. Hält das Skript am Leben; Ctrl+C stoppt beides.
cd site
exec python3 -m http.server "$PORT" --bind 127.0.0.1
