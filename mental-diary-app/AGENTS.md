# Repository Guidelines

## Project Structure & Module Organization
This repository is a small monorepo. `apps/api` contains the Express + TypeScript backend, including domain logic, infrastructure adapters, and Jest tests in `apps/api/tests`. `apps/web` contains the Vite/React frontend. `services/ml` contains the Python ML service built with FastAPI and managed with `uv`. Shared repo-level files include `docker-compose.yml`, `.env.example`, and workspace `package.json`.

## Build, Test, and Development Commands
- `npm install` — install workspace dependencies for the Node apps.
- `npm run dev:api` — run the API locally with `tsx watch`.
- `npm run dev:web` — run the frontend locally with Vite.
- `npm run test` — run the API Jest suite.
- `npm run build` — build both API and web workspaces.
- `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000` — run the ML service from `services/ml`.
- `uv lock` — refresh the Python lockfile after changing ML dependencies.
- `docker compose up --build` — start Postgres, API, web, and ML services together.

## Coding Style & Naming Conventions
Use TypeScript for Node and frontend code, Python for `services/ml`. Follow existing formatting: 2-space indentation is not used here; keep 2? No, use the repository’s current style of 2? Actually code uses 2 spaces in TS? Use 2? Wait, existing TS uses 2 spaces? It uses 2. Keep that. Use `camelCase` for variables/functions, `PascalCase` for React components and classes, and `kebab-case` for commit scopes. Prefer small modules with explicit types. Use ASCII unless the file already contains localized text.

## Testing Guidelines
Backend tests use Jest with files named `*.test.ts` under `apps/api/tests`. Add or update tests for every behavior change in API routes, analysis logic, or persistence. Run `npm run test` before committing. For type safety, also run `node .\node_modules\typescript\bin\tsc -p apps\api\tsconfig.json --noEmit` and the equivalent command for `apps/web`.

## Commit & Pull Request Guidelines
Use short Conventional Commit style messages as seen in history: `feat: ...`, `build: ...`. Keep each commit focused and runnable; this repository is developed with short trunk-based increments. PRs should include: what changed, why it changed, test/build results, config changes, and screenshots for UI updates.

## Security & Configuration Tips
Do not commit secrets. Use `.env` for local values and keep `.env.example` updated when adding config. ML/backend integration depends on `ML_PROVIDER`, `ML_SERVICE_URL`, and model-version variables; document any new environment keys in both `README.md` and `.env.example`.
