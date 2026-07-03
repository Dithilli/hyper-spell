#!/bin/zsh
# 🧙 HyperSpell launcher — double-click to host a game.
# Starts the server (if it isn't already up), copies a ready-to-paste invite
# to the clipboard, and opens the host window in your browser.
GAME_DIR="${HS_GAME_DIR:-$HOME/dev/hyper-spell}"
PORT=8787

cd "$GAME_DIR/server" || { echo "Can't find $GAME_DIR/server"; exit 1; }

if ! lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  [ -d node_modules ] || npm install --silent
  nohup node serve.js > /tmp/hyperspell-server.log 2>&1 &
  sleep 1
fi

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
URL="http://$IP:$PORT"

INVITE="🧙 HYPERSPELL time! Join the fight: $URL
(type it WITH the http:// — Chrome gets weird otherwise)
Click JOIN GAME, type your wizard name, then press E to grab a slot."
printf '%s' "$INVITE" | pbcopy

osascript -e 'display notification "Invite copied — paste it in Slack" with title "HyperSpell server is up" sound name "Glass"' 2>/dev/null
[ -z "$HS_NO_OPEN" ] && open "http://localhost:$PORT"

clear
echo ""
echo "  🧙 HYPERSPELL is live"
echo ""
echo "  Host (you):   http://localhost:$PORT   (opening now — click HOST ONLINE)"
echo "  Players:      $URL"
echo ""
echo "  ✉️  The invite is on your clipboard — just paste it in Slack."
echo "  📜 Server log: /tmp/hyperspell-server.log"
echo ""
echo "  You can close this window — the server keeps running."
echo "  Double-click 'Stop HyperSpell' when the session is over."
echo ""
