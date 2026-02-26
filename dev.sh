#!/usr/bin/env bash
# 밥먹자 개발환경 시작 스크립트
# 사용법: ./dev.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
MOBILE_DIR="$ROOT_DIR/mobile"

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

log_backend() { echo -e "${CYAN}[backend]${RESET} $*"; }
log_mobile()  { echo -e "${GREEN}[mobile] ${RESET} $*"; }
log_info()    { echo -e "${BOLD}$*${RESET}"; }
log_warn()    { echo -e "${YELLOW}[warn]   ${RESET} $*"; }
log_error()   { echo -e "${RED}[error]  ${RESET} $*"; }

BACKEND_PID=""

cleanup() {
  echo ""
  log_info "종료 중..."
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID"
    log_backend "서버 종료됨 (PID $BACKEND_PID)"
  fi
  exit 0
}
trap cleanup INT TERM

# ── 사전 확인 ─────────────────────────────────────────────
check_requirements() {
  if [[ ! -f "$BACKEND_DIR/.venv/bin/python" ]]; then
    log_error "백엔드 가상환경이 없습니다."
    log_error "  cd backend && uv pip install -e '.[dev]'"
    exit 1
  fi

  if [[ ! -d "$MOBILE_DIR/node_modules" ]]; then
    log_warn "node_modules가 없습니다. 설치합니다..."
    (cd "$MOBILE_DIR" && npm install --legacy-peer-deps)
  fi
}

# ── .env 로컬 개발 설정 확인 ─────────────────────────────
check_env() {
  local env_file="$BACKEND_DIR/.env"

  if [[ ! -f "$env_file" ]]; then
    log_warn ".env 파일이 없습니다. .env.example 로 복사합니다..."
    cp "$BACKEND_DIR/.env.example" "$env_file"
  fi

  # DB_PATH가 Docker 경로(/app/...)인 경우 경고
  if grep -q 'DB_PATH=/app/' "$env_file" 2>/dev/null; then
    log_warn "DB_PATH가 Docker 경로입니다. 로컬 개발용으로 오버라이드합니다."
  fi
}

# ── 백엔드 시작 ───────────────────────────────────────────
start_backend() {
  local data_dir="$BACKEND_DIR/data"
  mkdir -p "$data_dir"

  log_backend "시작 중... (http://localhost:8000)"

  # 로컬 개발 설정으로 오버라이드 (.env 파일은 변경하지 않음)
  (
    set -a
    # shellcheck disable=SC1090
    source "$BACKEND_DIR/.env"
    set +a

    export APP_ENV=development
    export DB_PATH="$data_dir/family_app.db"

    cd "$BACKEND_DIR"
    .venv/bin/python -m uvicorn src.main:app \
      --reload \
      --host 0.0.0.0 \
      --port 8000 \
      2>&1 | sed "s/^/$(echo -e "${CYAN}[backend]${RESET}") /"
  ) &

  BACKEND_PID=$!

  # 백엔드가 뜰 때까지 대기 (최대 10초)
  local attempts=0
  while ! curl -sf http://localhost:8000/health > /dev/null 2>&1; do
    sleep 1
    attempts=$((attempts + 1))
    if [[ $attempts -ge 10 ]]; then
      log_error "백엔드가 10초 내에 응답하지 않습니다."
      log_error "로그를 확인하세요."
      exit 1
    fi
  done
  log_backend "준비 완료 ✓ (http://localhost:8000/docs)"
}

# ── 모바일 시작 ───────────────────────────────────────────
start_mobile() {
  log_mobile "Expo 시작 중..."
  cd "$MOBILE_DIR"
  npm start
}

# ── 메인 ──────────────────────────────────────────────────
main() {
  log_info "=============================="
  log_info "   밥먹자 개발환경 시작"
  log_info "=============================="

  check_requirements
  check_env
  start_backend
  start_mobile  # 포그라운드에서 실행 (Ctrl+C로 종료)
}

main
