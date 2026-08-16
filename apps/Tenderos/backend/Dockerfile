FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/Tenderos/backend ./apps/Tenderos/backend
RUN pnpm install --frozen-lockfile && pnpm --filter tenderos-backend build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/packages ./packages
COPY --from=build --chown=app:app /app/apps/Tenderos/backend ./apps/Tenderos/backend
USER app
WORKDIR /app/apps/Tenderos/backend
EXPOSE 4300
CMD ["node", "dist/index.js"]
