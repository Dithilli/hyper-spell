# HyperSpell game server — the whole game in one container (v9: the sim runs
# server-side, so this box IS the match).
#
#   docker build -t hyperspell-game .
#   docker run -p 8787:8787 -e GAME_KEY=somesecret hyperspell-game
#
# Telemetry (balance logs) lands in /app/server/telemetry — mount a volume
# there if you want it to survive restarts:
#   docker run -p 8787:8787 -v hyperspell-telemetry:/app/server/telemetry hyperspell-game
FROM node:22-alpine

WORKDIR /app

# server deps first so code-only changes don't bust the npm layer
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci --omit=dev --no-audit --no-fund

COPY . .

ENV PORT=8787
EXPOSE 8787

# run as the stock non-root user; telemetry dir must be writable by it
RUN mkdir -p server/telemetry && chown -R node:node /app
USER node

CMD ["node", "server/serve.js"]
