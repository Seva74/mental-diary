FROM node:22-slim AS build

WORKDIR /app

COPY apps/web/package*.json ./
RUN npm install

COPY tsconfig.base.json /tsconfig.base.json
COPY apps/web/tsconfig.json ./tsconfig.json
COPY apps/web/vite.config.ts ./vite.config.ts
COPY apps/web/index.html ./index.html
COPY apps/web/src ./src
COPY apps/web/server.mjs ./server.mjs

ARG VITE_API_BASE_URL=http://localhost:3001/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM node:22-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV API_TARGET=http://api:3001

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.mjs ./server.mjs

EXPOSE 80

CMD ["node", "server.mjs"]