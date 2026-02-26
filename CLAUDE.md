# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

"밥먹자" — 10명 이하 가족 전용 폐쇄형 앱. 밥 먹자 브로드캐스트 + 응답 기능.

- **백엔드**: FastAPI (Python 3.12), aiosqlite, JWT, bcrypt
- **프론트**: Expo SDK 54, Expo Router, Zustand, Axios
- **DB**: SQLite (WAL 모드)
- **배포**: Docker on Synology NAS DS423+

## 명령어

### 백엔드

```bash
# 개발 서버 시작 (hot reload)
cd backend && .venv/bin/python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# 전체 테스트 실행
cd backend && .venv/bin/python -m pytest tests/ -v

# 특정 테스트 실행
cd backend && .venv/bin/python -m pytest tests/identity/test_identity_api.py::test_create_family -v

# 의존성 설치 (uv 사용)
cd backend && uv pip install -e ".[dev]"
```

### 프론트엔드

```bash
# 의존성 설치 (--legacy-peer-deps 필수)
cd mobile && npm install --legacy-peer-deps

# Expo 개발 서버 시작
cd mobile && npm start

# 플랫폼별 실행
cd mobile && npm run ios
cd mobile && npm run android
```

### Docker

```bash
# 빌드 및 실행
cd backend && docker-compose up --build
```

## 아키텍처

### 백엔드 구조 (DDD + Layered)

```
backend/src/
├── main.py           # FastAPI 앱 + lifespan (DB init, event handler 등록)
├── config.py         # 환경변수 로딩 (JWT_SECRET_KEY, DB_PATH, APP_ENV)
├── shared/           # 공유 커널
│   ├── domain/       # AggregateRoot, DomainEvent 기반 클래스
│   ├── infrastructure/   # DB(aiosqlite), EventBus(인메모리)
│   └── api/          # JWT 의존성, 에러 핸들러
├── identity/         # 인증 컨텍스트 (Family, Member, InviteLink)
├── meal_call/        # 밥먹자 컨텍스트 (MealCall, MenuItem, MealResponse)
└── notification/     # 알림 컨텍스트 (DeviceRegistration, ExPo Push)
```

각 컨텍스트는 `api/ → application/ → domain/ → infrastructure/` 레이어로 구성됨.

### 프론트엔드 구조

```
mobile/
├── app/              # Expo Router 파일 기반 라우팅
│   ├── (auth)/       # 비인증 화면 (login, create-family, join)
│   ├── (main)/       # 인증 필요 화면 (home, history, settings)
│   └── invite/[token].tsx  # 초대 딥링크 핸들러
└── src/
    ├── domains/      # auth, meal-call (Zustand 스토어 + API + 훅)
    ├── lib/          # axios 클라이언트(JWT 자동 첨부), 알림, 스토리지
    ├── components/   # UI 컴포넌트 (meal-call/, ui/, layout/)
    └── theme/        # 디자인 토큰 (colors, spacing, typography)
```

### 핵심 설계 결정

- **JWT**: access 24h, refresh 90d. `SecureStore`에 저장, axios interceptor로 자동 갱신
- **PIN**: 4자리, bcrypt 해싱
- **실시간 동기화**: WebSocket 없이 10초 폴링
- **이벤트 버스**: 인메모리 (단일 프로세스). `meal_call` 이벤트 → `notification` 핸들러
- **SQLite WAL 모드** + `PRAGMA foreign_keys=ON`

## 환경변수

백엔드 `.env` (`.env.example` 참고):
- `JWT_SECRET_KEY` — 32자 이상 시크릿 (운영 필수)
- `DB_PATH` — SQLite 파일 경로 (기본: `backend/data/family_app.db`)
- `APP_ENV` — `development` 또는 `production`

프론트엔드 `.env`:
- `EXPO_PUBLIC_API_URL` — 백엔드 URL (기본: `http://localhost:8000`)

## 테스트

- `tests/conftest.py`: 각 테스트마다 임시 SQLite DB 생성, `DB_PATH` 환경변수 패치
- `pytest-asyncio` 사용, `asyncio_mode = "auto"` 설정됨
- 현재 12/12 테스트 통과

## API 엔드포인트 요약

| 컨텍스트 | 주요 엔드포인트 |
|---------|----------------|
| Identity | `POST /api/v1/families`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST/GET /api/v1/invite/{token}` |
| Meal Call | `POST /api/v1/meal-calls`, `GET /api/v1/meal-calls/active`, `POST /api/v1/meal-calls/{id}/respond` |
| Notification | `POST /api/v1/devices` |
| Health | `GET /health` |

## Python 환경

- `uv` 사용 (`/opt/homebrew/bin/uv`)
- Python 3.12 (Docker)/3.14 (로컬)
- 가상환경: `backend/.venv/`
- 직접 실행 시 `backend/.venv/bin/python` 사용
