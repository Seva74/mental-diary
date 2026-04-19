# Repository Guidelines

## Project Structure & Module Organization
This repository is a small monorepo. `apps/api` contains the Express + TypeScript backend, including domain logic, infrastructure adapters, local ML assessment, and Jest tests in `apps/api/tests`. `apps/web` contains the Vite/React frontend. Shared repo-level files include `docker-compose.yml`, `.env.example`, `package.json`, `README.md`, and the design reference `mental-diary-desktop.html`.

## Build, Test, and Development Commands
- `npm install` — install workspace dependencies for the Node apps.
- `npm run dev:api` — run the API locally with `tsx watch`.
- `npm run dev:web` — run the frontend locally with Vite.
- `npm run test` — run the API Jest suite.
- `npm run build` — build both API and web workspaces.
- `docker compose up --build` — start Postgres, API, and web services together.

## Coding Style & Naming Conventions
Use TypeScript for both backend and frontend code. Follow the existing formatting and keep changes small and focused. Use `camelCase` for variables/functions, `PascalCase` for React components and classes, and `kebab-case` for commit scopes. Prefer explicit types, ASCII text in code unless the file already contains localized text, and preserve the current style of nearby code.

## Testing Guidelines
Backend tests use Jest with files named `*.test.ts` under `apps/api/tests`. Add or update tests for every behavior change in API routes, analysis logic, or persistence. Run `npm run test` before committing. For type safety, also run `node .\node_modules\typescript\bin\tsc -p apps\api\tsconfig.json --noEmit` and the equivalent command for `apps/web`.

## Commit & Pull Request Guidelines
Use short Conventional Commit style messages as seen in history: `feat: ...`, `build: ...`. Keep each commit focused and runnable; this repository is developed with short trunk-based increments. PRs should include: what changed, why it changed, test/build results, config changes, and screenshots for UI updates.

## Security & Configuration Tips
Do not commit secrets. Use `.env` for local values and keep `.env.example` updated when adding config. The actual runtime environment keys today include `DATABASE_URL`, `FRONTEND_ORIGIN`, `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `SUPPORT_PROVIDER`, `SUPPORT_API_URL`, `SUPPORT_TIMEOUT_MS`, `VITE_API_BASE_URL`, `VITE_API_TARGET`, and `API_TARGET`.
