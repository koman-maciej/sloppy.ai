# ── Stage 1: deps ──────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# ── Stage 2: runtime ───────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
