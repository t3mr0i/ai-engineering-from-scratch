#!/usr/bin/env sh
# Lokaler Server für die Lesson-Site + LRN Course Cockpit.
#
# Solange dieses Skript läuft, ist die App erreichbar.
# Mit Ctrl+C beenden -> App geht offline.
#
#   ./serve.sh           # Standard-Port 4173
#   ./serve.sh 8080      # eigener Port
#
# Web-Root ist das Repo-Root: dadurch sind /site/* UND /phases/* erreichbar,
# genau wie nach dem Deploy-Staging.

set -e

PORT="${1:-4173}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT"

URL="http://localhost:${PORT}/site/lrn/?level=5&profile=tc"

echo "──────────────────────────────────────────────"
echo "  LRN Course Cockpit läuft"
echo ""
echo "  $URL"
echo ""
echo "  Web-Root: $ROOT"
echo "  Beenden:  Ctrl+C  (danach offline)"
echo "──────────────────────────────────────────────"

# Browser automatisch öffnen (nur macOS; still ignorieren falls nicht vorhanden).
command -v open >/dev/null 2>&1 && open "$URL" || true

# Vordergrund-Server. Hält das Skript am Leben; Ctrl+C stoppt beides.
exec python3 -m http.server "$PORT" --bind 127.0.0.1
