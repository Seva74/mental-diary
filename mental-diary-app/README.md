# Mental Diary

Исполняемый прототип Mental Diary для фаз 2-3.

## Что уже работает

- ВИ1: ежедневная запись настроения, событий, энергии, сна и стресса.
- ВИ2: аналитика тенденций и динамика состояния.
- ВИ3: рекомендации с AI-адаптером и fallback-логикой.
- ВИ4: план поддержки и безопасные действия.
- ВИ5: форум как прототипный модуль.
- ВИ6: блог как прототипный модуль.
- Офлайн-сценарий для записей: если API недоступен, запись сохраняется локально и может быть синхронизирована позже.
- Светлая и темная тема с нормальными дизайн-токенами.
- Отдельный backend-контракт для интеграций AI и support-модуля: `GET /api/system/meta`.
- Главная панель с трендами, sparkline-графиками, next-step карточкой и системным статусом.
- Шапка с состоянием офлайн-синхронизации и кнопкой быстрой отправки черновиков.
- Быстрая навигация по разделам через `Alt+1-6`.
- Дневник с живым предпросмотром записи перед сохранением.

## Архитектура

- `apps/api` - Express API, доменная логика, хранилище, AI-адаптер, support-gateway и AI-stubs.
- `apps/web` - React UI, разложенный на hooks, views, components и layout.
- `docker-compose.yml` - единый запуск API, web и PostgreSQL.

### Основные точки интеграции для backend

- AI адаптер: `apps/api/src/infrastructure/aiAdapter.ts`
- AI провайдеры и точка расширения: `apps/api/src/infrastructure/aiProviders.ts`
- Контракт интеграций: `GET /api/system/meta`
- Support gateway: `apps/api/src/infrastructure/supportGateway.ts`
- Аналитика: `apps/api/src/domain/analysis.ts`
- Рекомендации: `apps/api/src/domain/recommendations.ts`

## Запуск через Docker

```bash
cd mental-diary-app
docker compose up --build
```

Доступ:
- Web UI: http://localhost:8080
- API: http://localhost:3001
- Health: http://localhost:3001/health
- System meta: http://localhost:3001/api/system/meta

## Локальный запуск

```bash
cd mental-diary-app
npm install
npm run dev:api
npm run dev:web
```

## Проверка качества

```bash
cd mental-diary-app
npm run test
npm run build
```

## Переменные окружения

Скопируйте `.env.example` в `.env` при необходимости.

- `DATABASE_URL` - строка подключения PostgreSQL.
- `AI_PROVIDER` - `openai`, `huggingface` или `fallback`.
- `OPENAI_API_KEY`, `OPENAI_MODEL` - параметры OpenAI.
- `HF_TOKEN`, `HF_MODEL` - параметры Hugging Face.
- `SUPPORT_PROVIDER` - `local` или `remote`.
- `SUPPORT_API_URL` - внешний сервис support-подсказок.
- `SUPPORT_TIMEOUT_MS` - таймаут внешнего запроса.

## Текущие ограничения

- Авторизация и разграничение данных по пользователям еще не введены. Сейчас используется демо-сценарий и общий прототипный контур.
- Внешний AI-сервис пока подключается через fallback-заглушку, но backend-контракт уже подготовлен.
- Support-модуль сейчас работает как безопасный локальный план действий и может позже переключиться на внешний контент API.

## Структура web

- `apps/web/src/components` - layout и общие элементы.
- `apps/web/src/hooks` - загрузка данных, тема, офлайн-очередь.
- `apps/web/src/views` - экраны приложения.
- `apps/web/src/lib` - общие утилиты.

## Быстрые действия

- `Alt+1` - главная.
- `Alt+2` - дневник.
- `Alt+3` - аналитика.
- `Alt+4` - поддержка.
- `Alt+5` - форум.
- `Alt+6` - блог.

## Что дальше

Следующий логичный шаг - добавить базовую авторизацию и привязку данных к пользователю, чтобы окончательно закрыть фазовый gap по multi-user сценарию.
