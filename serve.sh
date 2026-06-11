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

# Build + Lesson-Content-Staging wie in .gitlab-ci.yml
node site/build.js
mkdir -p site/phases
rsync -a --prune-empty-dirs \
  --include='*/' \
  --include='docs/en.md' \
  --include='quiz.json' \
  --include='code/main.py' \
  --exclude='*' \
  phases/ site/phases/

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
