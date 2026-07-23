#!/bin/bash
# Ship the current working tree to the game instance and (re)start the service.
# First deploy and every update use the same command:
#   ./deploy/push.sh <instance-ip>
set -euo pipefail

IP=${1:?usage: push.sh <instance-ip>}
KEY_FILE="$HOME/.ssh/hyperspell-game.pem"
SSH=(ssh -i "$KEY_FILE" -o StrictHostKeyChecking=accept-new "ubuntu@$IP")
REPO="$(cd "$(dirname "$0")/.." && pwd)"

# stage under ubuntu's home, then sync into /opt as root (app user owns /opt tree)
rsync -az --delete -e "ssh -i $KEY_FILE -o StrictHostKeyChecking=accept-new" \
  --exclude .git --exclude node_modules --exclude 'server/telemetry' \
  "$REPO/" "ubuntu@$IP:/tmp/hyperspell-stage/"

"${SSH[@]}" sudo bash -s <<'REMOTE'
set -euo pipefail
rsync -a --delete --exclude telemetry /tmp/hyperspell-stage/ /opt/hyperspell/
mkdir -p /opt/hyperspell/server/telemetry
cd /opt/hyperspell/server && npm install --omit=dev --no-audit --no-fund
chown -R hyperspell:hyperspell /opt/hyperspell
systemctl restart hyperspell-game
sleep 1
systemctl --no-pager --lines=5 status hyperspell-game
REMOTE

KEY=$("${SSH[@]}" "sudo grep ^GAME_KEY= /etc/hyperspell-game.env | cut -d= -f2")
echo
echo "  deployed. invite the team with:"
echo "    https://${IP//./-}.sslip.io/?key=$KEY"
