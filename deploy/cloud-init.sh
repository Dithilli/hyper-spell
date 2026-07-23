#!/bin/bash
# cloud-init user-data for the HyperSpell game instance (Ubuntu 24.04 arm64).
# Run automatically on first boot by provision.sh — idempotence not required.
# Leaves the box ready for the first `push.sh`: runtime installed, service
# enabled (but not started — there's no code yet), Caddy serving TLS.
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nodejs npm debian-keyring debian-archive-keyring apt-transport-https curl

# Caddy — official repo (auto-TLS reverse proxy for Option B)
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
  > /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

# app user + tree (push.sh rsyncs the repo into /opt/hyperspell as this user)
useradd --system --create-home --shell /usr/sbin/nologin hyperspell || true
mkdir -p /opt/hyperspell
chown -R hyperspell:hyperspell /opt/hyperspell

# game key: generated once here, read by the service; push.sh prints the
# invite URL. Rotate by editing this file and `systemctl restart hyperspell-game`.
if [ ! -f /etc/hyperspell-game.env ]; then
  printf 'PORT=8787\nGAME_KEY=%s\n' "$(openssl rand -hex 8)" > /etc/hyperspell-game.env
  chmod 640 /etc/hyperspell-game.env
  chgrp hyperspell /etc/hyperspell-game.env
fi

# systemd unit (kept in sync with deploy/hyperspell-game.service)
cat > /etc/systemd/system/hyperspell-game.service <<'UNIT'
[Unit]
Description=HyperSpell game server (static host + WebSocket relay)
After=network.target

[Service]
Type=simple
User=hyperspell
WorkingDirectory=/opt/hyperspell/server
EnvironmentFile=/etc/hyperspell-game.env
ExecStart=/usr/bin/node serve.js
Restart=always
RestartSec=2
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/hyperspell/server/telemetry
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable hyperspell-game   # started by the first push.sh, once code exists

# Caddy: TLS for <public-ip-with-dashes>.sslip.io — no DNS setup needed.
# IMDSv2 (token) flow to read our own public IP.
TOK=$(curl -sX PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')
IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOK" http://169.254.169.254/latest/meta-data/public-ipv4)
GAME_HOST="${IP//./-}.sslip.io"
printf '%s {\n\treverse_proxy 127.0.0.1:8787\n\tencode zstd gzip\n}\n' "$GAME_HOST" > /etc/caddy/Caddyfile
systemctl restart caddy
