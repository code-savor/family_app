# --- Builder Stage ---
FROM python:3.12-slim AS builder

# uv 설치 (의존성 설치 속도 향상)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# 의존성 파일만 먼저 복사 (레이어 캐시 활용)
COPY pyproject.toml .

# 의존성 설치 (개발 의존성 제외)
RUN uv pip install --system --no-cache -e .

# --- Runtime Stage ---
FROM python:3.12-slim AS runtime

WORKDIR /app

# 빌더에서 설치된 패키지 복사
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn

# 소스 코드 복사 (alembic은 현재 미사용, src만 복사)
COPY src/ ./src/

# 데이터 디렉토리 생성 (SQLite 볼륨 마운트 포인트)
RUN mkdir -p /app/data

# 비루트 사용자로 실행 (보안)
RUN useradd -r -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
