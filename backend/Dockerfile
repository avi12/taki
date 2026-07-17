FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile

COPY shared ./shared
COPY backend ./backend

RUN pnpm --filter @taki/shared build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter taki-backend build
RUN pnpm --filter taki-backend deploy --prod /deploy

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /deploy/package.json ./
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/server.js"]
