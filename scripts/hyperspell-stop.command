#!/bin/zsh
# Stops the HyperSpell server.
if pkill -f "node serve.js"; then
  echo "🧙 HyperSpell server stopped. Until next time."
  osascript -e 'display notification "Server stopped" with title "HyperSpell"' 2>/dev/null
else
  echo "No HyperSpell server was running."
fi
sleep 2
