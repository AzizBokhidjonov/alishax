# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_API_PROXY_TARGET=https://api.alishaxkids.uz
ARG VITE_LANDING_TENANT_CODE=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_API_PROXY_TARGET=$VITE_API_PROXY_TARGET \
    VITE_LANDING_TENANT_CODE=$VITE_LANDING_TENANT_CODE \
    NITRO_PRESET=node-server
RUN npm run check

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
