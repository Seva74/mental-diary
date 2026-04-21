# Сверка реализации с фазами 1 и 2

Документ фиксирует текущее соответствие реализации (`mental-diary-app`) требованиям фазовых артефактов.

## 1) Архитектурно значимые ВИ (ядро)

- ВИ1 Ввод ежедневной записи: реализован.
  - API: `POST /api/entries`
  - UI: экран `Дневник`
  - Альтернативный сценарий офлайн: реализован через локальную очередь и ручную синхронизацию.
- ВИ2 Анализ тенденций: реализован.
  - API: `GET /api/analysis`, `GET /api/dashboard`
  - Логика анализа: `apps/api/src/domain/analysis.ts`
- ВИ3 Генерация рекомендаций: реализован.
  - AI adapter + fallback: `apps/api/src/infrastructure/aiAdapter.ts`
  - OpenAI/OpenRouter provider chain + local fallback
  - API: `GET /api/recommendations`
- ВИ4 План поддержки и безопасные действия: реализован.
  - Support gateway + fallback: `apps/api/src/infrastructure/supportGateway.ts`
  - API: `GET /api/support`, также включено в `GET /api/dashboard`

## 2) Неприоритетные ВИ

- ВИ5 Форум: реализован как рабочий прототип.
- ВИ6 Блог: реализован как рабочий прототип.

## 3) Слои архитектуры (phase2)

- presentation: `apps/web`
- application: `apps/api/src/app.ts`, `apps/api/src/services/*`
- domain: `apps/api/src/domain/*`
- infrastructure: `apps/api/src/infrastructure/*`
- machine learning: `apps/api/src/ml/*`

## 4) Внешние системы и fallback (phase2)

- AI сервис: OpenAI/OpenRouter через адаптер + fallback.
- Support-модуль: remote provider через gateway + локальный fallback.

## 5) NFR и текущее покрытие

- Производительность/надежность: базовое покрытие, включая fallback и ошибки 4xx/5xx.
- Удобство и доступность: адаптивный интерфейс, светлая/темная тема.
- Тестируемость: unit/integration тесты API (Jest).
- Docker/deploy: compose конфигурация, web+api+db.

## 6) Что еще остается техническим долгом

Ниже пункты, которые в фазовых документах зафиксированы как целевые, но в прототипе пока частично/упрощенно:

- Полноценные password-based аккаунты и роли: не реализованы, используется гостевой session-based режим.
- Полноценная роль администратора: не реализована, есть только пользовательские сценарии.
- Реальная интеграция с внешним support-контентом: есть интерфейс и remote gateway, но по умолчанию используется локальный fallback.
- Полная безопасность production-уровня (JWT, GDPR-процедуры, audit): частично, не полный production контур.

## 7) Рекомендация по фазе 3

Для устранения противоречий с фазовыми требованиями в следующем шаге приоритетно реализовать:

1. Если нужен полноценный multi-user сценарий, добавить signup/login + JWT + роли поверх текущих guest-сессий.
2. Персонификацию данных forum/entries при переходе к пользовательским аккаунтам.
3. Контур ролей (`user`, `admin`) хотя бы в минимальном API виде.
4. Подключение реального provider для support-контента с контрактными тестами.
