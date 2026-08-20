FROM node:24-bookworm-slim
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/publisher-connector/package.json apps/publisher-connector/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/domain/package.json packages/domain/package.json
RUN pnpm install --frozen-lockfile --filter @geov4/publisher-connector...
COPY apps/publisher-connector apps/publisher-connector
WORKDIR /app/apps/publisher-connector
EXPOSE 3200
CMD ["node", "src/server.mjs"]
