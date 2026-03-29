FROM node:22-slim AS build

WORKDIR /app

COPY apps/api/package*.json ./
RUN npm install

COPY tsconfig.base.json /tsconfig.base.json
COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/jest.config.cjs ./jest.config.cjs
COPY apps/api/src ./src
COPY apps/api/tests ./tests

RUN npm run build

FROM node:22-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY apps/api/package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/src/index.js"]