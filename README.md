# HYPERSPELL

wizards · physics · violence — a couch/LAN party brawler. Last wizard standing wins the round, first to N rounds wins the match. 2–8 players, ~104 spells, ~104 maps.

## Play locally (couch)

Open `index.html` in a browser. Press **E**, **Enter**, or any gamepad button to join; **Space** to fight; **1–9** sets the win target.

## Play over the network

```
cd server && npm install && node serve.js
```

- Host: open `http://localhost:8787` → **HOST ONLINE** (this machine runs the sim — pick the one with the best CPU and connection)
- Players on the same LAN: open `http://<your-ip>:8787` (printed at server startup) → **JOIN GAME**

## Play over Tailscale (remote players)

No config needed — the server listens on all interfaces and the client picks `ws://`/`wss://` automatically. On the machine running `node serve.js`:

1. Make sure it's on the tailnet, then either:
   - **Simplest:** share `http://<machine-name>.<tailnet>.ts.net:8787` (or its Tailscale IP from `tailscale ip -4`) with the team, or
   - **Cleaner URL + TLS:** run `tailscale serve --bg 8787` and share `https://<machine-name>.<tailnet>.ts.net`.
2. Everyone joining must be on the tailnet (invite them first). To open it to people outside the tailnet, use `tailscale funnel 8787` instead — that exposes it to the public internet.
3. Host clicks **HOST ONLINE** on the serving machine; everyone else opens the URL, clicks **JOIN GAME**, and presses E / clicks to grab a slot. LAN and tailnet players can mix — same server, same room, 8 players max.

Latency note: the netcode is host-authoritative with no client prediction, so remote players feel their own wizard react one round-trip late. Direct tailnet connections (5–30ms) feel fine; if `tailscale ping <host-machine>` says "via DERP", that player's traffic is being relayed and will feel mushy — fixing their NAT/firewall usually restores a direct path.

## Docs

- `docs/MULTIPLAYER.md` — online multiplayer planning notes
