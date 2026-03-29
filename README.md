# Mental Diary Prototype (Phase 2)

Исполняемый эволюционный прототип для сдачи фазы 2 по проекту Mental Diary.

## Что покрыто из ВИ

- ВИ1: ввод ежедневной записи
- ВИ2: просмотр аналитики и динамики
- ВИ3: получение рекомендаций (AI + fallback)
- ВИ4: подбор специалистов по риск-профилю
- ВИ5: форум как прототипный модуль
- ВИ6: блог как прототипный модуль

Дополнительно:
- ВИ4 работает через шлюз подбора специалистов с поддержкой внешнего провайдера и локального fallback.
- Для AI и сервиса специалистов реализована отказоустойчивая ветка fallback без срыва сценария.
- Для ВИ1 добавлен офлайн-сценарий: при недоступном API запись сохраняется локально и синхронизируется позже.
- Для NFR доступности добавлен переключатель светлой и темной темы в веб-интерфейсе.

ВИ1-ВИ4 реализованы как ядро. ВИ5-ВИ6 добавлены как рабочие прототипы, что соответствует вашей фазе 2.

## Реализованный стек

- Frontend: React + TypeScript
- Backend: Node.js + Express
- Data layer: PostgreSQL (с in-memory fallback, если БД недоступна)
- AI integration: адаптер OpenAI / Hugging Face + fallback-логика
- Testing: Jest + базовые сценарные API тесты
- Build/deploy: Docker, Docker Compose, GitHub Actions

## Архитектурные слои

- presentation: web UI
- application: API-роуты и orchestration
- domain: анализ, правила рекомендаций, риск-профили
- infrastructure: хранилище (PostgreSQL/memory), AI-адаптер

На уровне интеграций:
- `AiAdapter` изолирует работу с OpenAI/Hugging Face и fallback-режим.
- `SpecialistGateway` изолирует внешний сервис специалистов и локальный fallback.

## Запуск через Docker (рекомендуется)

Это полностью контейнерный запуск: на хосте нужен только Docker Desktop.

```bash
cd mental-diary-app
docker compose up --build
```

Доступ:
- Web UI: http://localhost:8080
- API: http://localhost:3001

В контейнерном режиме frontend использует same-origin вызовы `/api` через встроенный Node reverse-proxy к API-контейнеру.

## Локальный запуск через Node (опционально)

Нужен для быстрой разработки, отладки и запуска тестов без пересборки контейнеров.

```bash
cd mental-diary-app
npm install
npm run dev:api
npm run dev:web
```

## Переменные окружения

Скопируйте `.env.example` в `.env` при необходимости:

- `DATABASE_URL` - строка подключения PostgreSQL
- `AI_PROVIDER` - `openai`, `huggingface` или `fallback`
- `OPENAI_API_KEY`, `HF_TOKEN` - ключи внешних провайдеров
- `SPECIALIST_PROVIDER` - `local` или `remote`
- `SPECIALIST_API_URL` - URL внешнего сервиса специалистов (при `SPECIALIST_PROVIDER=remote`)
- `SPECIALIST_TIMEOUT_MS` - timeout запроса к сервису специалистов в миллисекундах

Если ключи не заданы, сервис автоматически использует fallback-ветку рекомендаций.

## Что такое `.github/workflows/ci.yml` и нужен ли он

Файл `.github/workflows/ci.yml` - это pipeline для GitHub Actions.

Он нужен, чтобы автоматически:
- ставить зависимости,
- запускать тесты,
- проверять сборку.

Для локального запуска он не обязателен. Для командной разработки и проверки качества перед merge - очень полезен.
