FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

WORKDIR /app

COPY services/ml/pyproject.toml ./pyproject.toml
COPY services/ml/uv.lock ./uv.lock
RUN uv sync --frozen --no-dev

COPY services/ml/app ./app
COPY services/ml/data ./data

ENV PORT=8000

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
