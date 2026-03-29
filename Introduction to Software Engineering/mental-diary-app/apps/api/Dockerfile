FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json jest.config.cjs ./
COPY src ./src
COPY tests ./tests

RUN npm run build

FROM node:22-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]