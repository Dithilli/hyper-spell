#!/bin/zsh
# 🧙 HyperSpell launcher — double-click to put a game up.
# Starts the game server (the match runs ON the server now), copies a
# ready-to-paste invite to the clipboard, and opens the game in your browser.
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
Type your wizard name, click PLAY ONLINE, then enter the session code I'm about to paste."
printf '%s' "$INVITE" | pbcopy

osascript -e 'display notification "Invite copied — paste it in Slack" with title "HyperSpell server is up" sound name "Glass"' 2>/dev/null
[ -z "$HS_NO_OPEN" ] && open "http://localhost:$PORT"

clear
echo ""
echo "  🧙 HYPERSPELL is live"
echo ""
echo "  You:          http://localhost:$PORT   (opening now — PLAY ONLINE, then START A SESSION)"
echo "  Players:      $URL"
echo ""
echo "  ✉️  The invite is on your clipboard — just paste it in Slack."
echo "  🔑 Then START A SESSION and hit COPY THE INVITE LINK: that link carries"
echo "     the code, so anyone who clicks it is one name away from playing."
echo "  📜 Server log: /tmp/hyperspell-server.log"
echo ""
echo "  You can close this window — the server keeps running."
echo "  Double-click 'Stop HyperSpell' when the session is over."
echo ""
