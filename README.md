# 밥먹자 🍚

가족끼리만 쓰는 폐쇄형 식사 알림 앱. "밥 먹자"를 누르면 가족 전원에게 푸시 알림이 가고, 각자 응답을 남긴다.

---

## 목차

1. [요구사항](#요구사항)
2. [구현 기능](#구현-기능)
3. [아키텍처](#아키텍처)
4. [서비스 토폴로지](#서비스-토폴로지)
5. [구동 방법](#구동-방법)
6. [환경변수 레퍼런스](#환경변수-레퍼런스)

---

## 요구사항

### 핵심 제약

| 항목 | 내용 |
|------|------|
| 대상 | 가족 10명 이하 (폐쇄형, 공개 가입 없음) |
| 가입 방식 | 가족 생성 → 초대 링크(딥링크)로만 합류 |
| 인증 방식 | 닉네임 + 4자리 PIN (비밀번호 없음) |
| 실시간성 | 즉각성보다 단순함 우선 (WebSocket 불필요) |
| 배포 환경 | 가정 내 Synology NAS (인터넷 노출 최소화) |

### 기능 요구사항

**R1. 가족 관리**
- 가족 그룹을 생성하고 고유 ID를 부여한다
- 구성원은 초대 링크를 통해서만 가입할 수 있다
- 초대 링크는 만료 시간과 최대 사용 횟수를 설정할 수 있다
- 가족 내 닉네임은 중복될 수 없다

**R2. 인증**
- 가족 ID + 닉네임 + PIN으로 로그인한다
- Access Token(24h) + Refresh Token(90d) 방식으로 세션을 유지한다
- 앱 재시작 시 저장된 토큰으로 자동 로그인한다

**R3. 밥먹자 (식사 알림)**
- 구성원 중 누구든 "밥먹자"를 생성할 수 있다
- 생성 시 메뉴 항목을 선택하고 메시지를 첨부할 수 있다
- 가족 전원에게 즉시 푸시 알림이 발송된다
- 가족 내 동시에 활성 중인 밥먹자는 하나뿐이다
- 미응답 구성원에게 재알림을 보낼 수 있다
- 밥먹자를 완료 처리할 수 있다

**R4. 응답**
- YES / NO / LATER 세 가지로 응답한다
- 커스텀 메시지를 함께 남길 수 있다
- 각 구성원의 응답 상태가 실시간(폴링)으로 갱신된다
- 응답은 한 번만 가능하다 (수정 불가)

**R5. 메뉴 관리**
- 가족별 메뉴 항목을 등록·조회할 수 있다
- 메뉴에는 이름, 이모지 아이콘, 카테고리를 지정한다

**R6. 푸시 알림**
- 앱 설치 후 Expo Push Token을 서버에 등록한다
- 밥먹자 생성 및 재알림 이벤트에 반응하여 알림이 발송된다
- 앱이 포그라운드 상태일 때도 알림을 표시한다
- 알림 탭 시 해당 밥먹자 화면으로 이동한다

**R7. 히스토리 & 설정**
- 완료된 밥먹자 목록을 조회할 수 있다
- 로그아웃 및 기기 알림 해제를 할 수 있다

---

## 구현 기능

### 백엔드 API

| 컨텍스트 | 엔드포인트 | 설명 |
|---------|-----------|------|
| **Identity** | `POST /api/v1/families` | 가족 생성 + 오너 등록 |
| | `GET /api/v1/families/{id}` | 가족 정보 + 구성원 목록 |
| | `GET /api/v1/families/{id}/members` | 구성원 목록 |
| | `POST /api/v1/families/{id}/invite-links` | 초대 링크 생성 |
| | `GET /api/v1/invite/{token}` | 초대 링크 유효성 확인 |
| | `POST /api/v1/invite/{token}/join` | 초대 링크로 가입 |
| | `POST /api/v1/auth/login` | 로그인 |
| | `POST /api/v1/auth/refresh` | Access Token 갱신 |
| **Meal Call** | `POST /api/v1/meal-calls` | 밥먹자 생성 |
| | `GET /api/v1/meal-calls/active` | 활성 밥먹자 조회 |
| | `GET /api/v1/meal-calls/{id}` | 밥먹자 상세 조회 |
| | `POST /api/v1/meal-calls/{id}/respond` | 응답 (YES/NO/LATER) |
| | `POST /api/v1/meal-calls/{id}/remind` | 미응답자 재알림 |
| | `PUT /api/v1/meal-calls/{id}/complete` | 완료 처리 |
| | `GET /api/v1/menus` | 메뉴 목록 조회 |
| | `POST /api/v1/menus` | 메뉴 항목 등록 |
| **Notification** | `POST /api/v1/devices` | 푸시 토큰 등록 |
| | `DELETE /api/v1/devices` | 푸시 토큰 해제 |
| **Health** | `GET /health` | 헬스체크 |

### 모바일 화면

| 화면 | 경로 | 기능 |
|------|------|------|
| 로그인 | `/(auth)/login` | 가족 ID → 닉네임 → PIN 3단계 입력 |
| 가족 생성 | `/(auth)/create-family` | 가족 이름 + 오너 닉네임 + PIN |
| 초대 가입 | `/(auth)/join` | 딥링크 수신 후 닉네임 + PIN |
| 홈 | `/(main)/(home)` | 활성 밥먹자 카드, 10초 폴링 |
| 밥먹자 생성 | `/(main)/(home)/meal-call/create` | 메뉴 선택 + 메시지 입력 |
| 밥먹자 상세 | `/(main)/(home)/meal-call/[id]` | 응답 현황, 재알림, 완료 |
| 히스토리 | `/(main)/(history)` | 완료된 밥먹자 목록 |
| 설정 | `/(main)/(settings)` | 로그아웃, 알림 해제 |
| 초대 딥링크 | `/invite/[token]` | `babmeokja://invite/{token}` 처리 |

---

## 아키텍처

### 전체 구조

```
family_app/
├── backend/          # FastAPI 서버
└── mobile/           # Expo React Native 앱
```

### 백엔드 (DDD + Layered Architecture)

도메인을 3개의 Bounded Context로 분리하고, 각 컨텍스트는 동일한 레이어 구조를 따른다.

```
src/
├── main.py                     # 앱 진입점, lifespan(DB init + 이벤트 핸들러 등록)
├── config.py                   # 환경변수
├── shared/                     # 공유 커널
│   ├── domain/                 # AggregateRoot, DomainEvent 기반 클래스
│   ├── infrastructure/
│   │   ├── database.py         # aiosqlite, WAL 모드, 스키마 초기화
│   │   └── event_bus.py        # 인메모리 이벤트 버스 (subscribe/publish)
│   └── api/
│       ├── dependencies.py     # JWT → CurrentUser 의존성
│       └── error_handlers.py   # 도메인 예외 → HTTP 응답 변환
│
├── identity/                   # 인증 & 접근 제어 컨텍스트
│   ├── api/                    # Router, Request/Response 스키마
│   ├── application/            # Commands, CommandHandlers, DTOs
│   ├── domain/                 # Family(Aggregate), Member(Entity), InviteLink(VO)
│   └── infrastructure/         # SqliteFamilyRepository, JwtService, PinHasher
│
├── meal_call/                  # 밥먹자 컨텍스트
│   ├── api/                    # Router, 스키마
│   ├── application/            # Commands, CommandHandlers
│   ├── domain/                 # MealCall(Aggregate), MenuItem, MealResponse, Events
│   └── infrastructure/         # SqliteMealCallRepository, SqliteMenuItemRepository
│
└── notification/               # 알림 컨텍스트
    ├── api/                    # Router
    ├── application/
    │   ├── commands.py
    │   └── event_handlers.py   # MealCallCreated/ReminderRequested 이벤트 처리
    ├── domain/                 # DeviceRegistration
    └── infrastructure/         # SqliteDeviceRepository, ExpoPushService
```

#### 컨텍스트 간 통신

컨텍스트 간 직접 의존 없이 인메모리 이벤트 버스를 통해 통신한다.

```
meal_call 컨텍스트                     notification 컨텍스트
─────────────────                     ──────────────────────
MealCall.create()                      MealCallNotificationHandler
  └─ 도메인 이벤트 발행                      ├─ on_meal_call_created()
      MealCallCreated ──[EventBus]──▶       └─ on_reminder_requested()
      ReminderRequested                          └─ ExpoPushService
                                                     └─ Expo Push API
```

#### 데이터베이스 스키마

```
families ──< members ──< device_registrations
    │
    ├──< invite_links
    │
    ├──< menu_items
    │
    └──< meal_calls ──< meal_call_menus >── menu_items
              └──< meal_responses
```

### 프론트엔드 (Expo + Zustand)

```
mobile/
├── app/                        # Expo Router: 디렉토리 구조 = 라우트 구조
│   ├── _layout.tsx             # 루트 레이아웃: 세션 복원, 알림 핸들러 등록
│   ├── index.tsx               # 인증 상태에 따라 (auth) 또는 (main)으로 리다이렉트
│   ├── (auth)/                 # 비인증 화면 그룹
│   ├── (main)/                 # 인증 필요 화면 그룹 (탭 네비게이션)
│   └── invite/[token].tsx      # 딥링크 초대 핸들러
│
└── src/
    ├── domains/
    │   ├── auth/               # Zustand 스토어, API 호출, 타입, 커스텀 훅
    │   └── meal-call/          # Zustand 스토어, API 호출, 타입, 커스텀 훅
    ├── lib/
    │   ├── api/
    │   │   ├── client.ts       # Axios + JWT 자동 첨부 + 401 시 토큰 갱신 재시도
    │   │   └── endpoints.ts    # API 엔드포인트 상수
    │   ├── notifications/
    │   │   ├── setup.ts        # 포그라운드 핸들러 설정, Expo 푸시 토큰 등록
    │   │   └── handlers.ts     # 알림 탭 → 화면 이동, 포그라운드 수신 처리
    │   └── storage/
    │       └── secure.ts       # expo-secure-store 래퍼 (토큰 저장/조회/삭제)
    ├── components/
    │   ├── meal-call/          # MealCallCard, MenuSelector, QuickResponseButton,
    │   │                       # ResponseStatusList, ElapsedTimer
    │   └── ui/                 # Button, Card, PinInput, ScreenContainer
    └── theme/                  # 색상, 간격, 타이포그래피 토큰
```

#### 상태 관리 (Zustand)

```
AuthStore                         MealCallStore
─────────────────────────         ─────────────────────────────
isAuthenticated                   activeMealCall
member (id, nickname, familyId)   history
accessToken / refreshToken        isPolling (10초 인터벌)
─────────────────────────         ─────────────────────────────
restoreSession()                  fetchActive()
login() / logout()                createMealCall()
                                  respond()
                                  remind() / complete()
```

#### 인증 흐름

```
앱 시작
  └─ restoreSession(): SecureStore에서 토큰 로드
       ├─ 토큰 있음 → isAuthenticated = true → /(main)/(home)
       └─ 토큰 없음 → /(auth)/login

API 요청
  └─ Axios 요청 인터셉터: Authorization: Bearer {accessToken}
       └─ 401 응답
            ├─ Refresh Token으로 새 AccessToken 발급
            ├─ 대기 중인 요청 재시도
            └─ Refresh 실패 → SecureStore 초기화 → 로그인 화면
```

---

## 서비스 토폴로지

### 운영 환경

```
인터넷
  │
  ▼
공유기 (포트포워딩: 8000 → NAS:8000)
  │
  ▼
Synology NAS DS423+
  ├── Docker Engine
  │   └── family-app-backend 컨테이너
  │       ├── FastAPI + uvicorn (:8000)
  │       └── SQLite DB (/app/data/family_app.db)
  │           └── 볼륨 마운트 ↔ NAS ./backend/data/
  └── 파일시스템: 데이터 영속화
```

### 전체 통신 흐름

```
┌──────────────────────────────────────────────────┐
│              모바일 클라이언트                     │
│         iOS / Android (Expo SDK 54)               │
│                                                    │
│  ┌──────────────┐     ┌────────────────────────┐  │
│  │  앱 화면      │     │   expo-notifications    │  │
│  │ (Expo Router) │     │    (푸시 수신/탭 핸들)  │  │
│  └──────┬───────┘     └───────────┬────────────┘  │
│         │ HTTP/REST               │ APNs / FCM     │
└─────────┼─────────────────────────┼────────────────┘
          │                         │
          ▼                         │
┌─────────────────────┐             │
│  NAS (Docker)        │             │
│                      │             │
│  FastAPI :8000       │             │
│  ┌─────────────────┐ │             │
│  │ identity        │ │             │
│  │ meal_call       │ │             │
│  │ notification  ──┼─┼──▶  Expo Push Notification
│  └────────┬────────┘ │             Service (cloud)
│           │           │             │
│       SQLite DB       │             │ APNs / FCM
│       (WAL 모드)      │             ▼
│                       │   iOS / Android OS → 알림 표시
└───────────────────────┘
```

### 컴포넌트별 역할

| 컴포넌트 | 기술 | 역할 |
|---------|------|------|
| **모바일 앱** | Expo SDK 54 (React Native) | UI, 상태 관리, 10초 폴링 |
| **백엔드 API** | FastAPI + uvicorn | REST API, JWT 인증, 비즈니스 로직 |
| **데이터베이스** | SQLite (aiosqlite, WAL) | 영속 데이터 저장 |
| **이벤트 버스** | 인메모리 PubSub | 컨텍스트 간 비동기 통신 |
| **푸시 서비스** | Expo Push API | iOS(APNs) / Android(FCM) 알림 발송 |
| **컨테이너 런타임** | Docker on Synology NAS | 백엔드 배포 및 데이터 영속화 |

### 딥링크 초대 흐름

```
① 오너   POST /api/v1/families/{id}/invite-links
         → 응답: babmeokja://invite/{token}

② 링크 공유 (카카오톡, 문자 등)

③ 수신자 링크 탭
         → iOS/Android OS가 앱 실행
         → Expo Router: /invite/[token].tsx 처리
         → GET /api/v1/invite/{token}  (유효성 확인)
         → /(auth)/join 화면으로 이동

④ 닉네임 + PIN 입력
         → POST /api/v1/invite/{token}/join
         → Access/Refresh Token 발급 → 홈 화면
```

---

## 구동 방법

### 사전 준비

- Python 3.12+, [`uv`](https://docs.astral.sh/uv/) 패키지 매니저
- Node.js 18+, npm
- Docker & Docker Compose (운영 배포 시)
- iOS Simulator(macOS + Xcode) 또는 Android Emulator, 또는 실기기 + Expo Go

---

### 백엔드 개발 서버

```bash
cd backend

# 1. 의존성 설치
uv pip install -e ".[dev]"

# 2. 환경변수 설정
cp .env.example .env
# .env 파일에서 JWT_SECRET_KEY 수정 (32자 이상 랜덤 문자열)

# 3. 서버 실행
.venv/bin/python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

- 헬스체크: `http://localhost:8000/health`
- API 문서 (Swagger): `http://localhost:8000/docs`

---

### 백엔드 테스트

```bash
cd backend

# 전체 테스트 (12개)
.venv/bin/python -m pytest tests/ -v

# 컨텍스트별 실행
.venv/bin/python -m pytest tests/identity/ -v
.venv/bin/python -m pytest tests/meal_call/ -v

# 단일 테스트
.venv/bin/python -m pytest tests/identity/test_identity_api.py::test_create_family -v
```

---

### 모바일 앱 개발

```bash
cd mobile

# 1. 의존성 설치 (peer dependency 충돌로 --legacy-peer-deps 필수)
npm install --legacy-peer-deps

# 2. 환경변수 설정
echo "EXPO_PUBLIC_API_URL=http://localhost:8000" > .env
# 실기기 테스트 시: http://{로컬_IP}:8000

# 3. Expo 개발 서버 시작
npm start

# 플랫폼별 실행
npm run ios        # macOS + Xcode 필요
npm run android    # Android SDK 필요
```

---

### Docker 배포 (NAS 운영 환경)

```bash
cd backend

# 1. 환경변수 설정
cp .env.example .env
# JWT_SECRET_KEY를 32자 이상 랜덤 문자열로 변경
# 생성 예시: openssl rand -hex 32

# 2. 빌드 및 백그라운드 실행
docker-compose up --build -d

# 3. 상태 확인
docker-compose ps
docker-compose logs -f backend

# 4. 헬스체크
curl http://localhost:8000/health
```

SQLite 데이터는 `backend/data/family_app.db`에 저장되며 컨테이너 볼륨으로 마운트된다. NAS 공유 폴더 경로로 변경하려면 `docker-compose.yml`의 `volumes` 섹션을 수정한다.

---

## 환경변수 레퍼런스

### 백엔드 (`backend/.env`)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `JWT_SECRET_KEY` | *(필수 변경)* | JWT 서명 키, 32자 이상 랜덤 문자열 |
| `DB_PATH` | `backend/data/family_app.db` | SQLite 파일 경로 |
| `APP_ENV` | `development` | `development` 또는 `production` |
| `PORT` | `8000` | 서버 포트 |
| `JWT_ACCESS_TOKEN_EXPIRE_HOURS` | `24` | Access Token 유효 시간 (시간 단위) |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `90` | Refresh Token 유효 기간 (일 단위) |

### 모바일 (`mobile/.env`)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `EXPO_PUBLIC_API_URL` | `http://localhost:8000` | 백엔드 API 주소 |
