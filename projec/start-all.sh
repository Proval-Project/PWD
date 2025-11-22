#!/bin/bash

# 프로젝트 전체 실행 스크립트 (Mac/Linux)
# 사용법: ./start-all.sh [옵션]
# 옵션:
#   --frontend-only    : frontend만 실행
#   --backend-only     : backend만 실행
#   --webapi-only      : WebApi만 실행
#   --clientapp-only   : ClientApp만 실행

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# PID 파일 저장 디렉토리
PID_DIR="$PROJECT_ROOT/.pids"
mkdir -p "$PID_DIR"

# 종료 함수
cleanup() {
    echo -e "\n${YELLOW}종료 중...${NC}"
    if [ -d "$PID_DIR" ]; then
        for pidfile in "$PID_DIR"/*.pid; do
            if [ -f "$pidfile" ]; then
                pid=$(cat "$pidfile")
                if ps -p "$pid" > /dev/null 2>&1; then
                    echo -e "${YELLOW}프로세스 종료: $pid${NC}"
                    kill "$pid" 2>/dev/null || true
                fi
                rm -f "$pidfile"
            fi
        done
    fi
    # 추가로 남아있는 프로세스 정리
    pkill -f "react-scripts start" 2>/dev/null || true
    pkill -f "dotnet run" 2>/dev/null || true
    echo -e "${GREEN}모든 프로세스가 종료되었습니다.${NC}"
    exit 0
}

# 시그널 핸들러 등록
trap cleanup SIGINT SIGTERM

# 옵션 파싱
RUN_FRONTEND=true
RUN_BACKEND=true
RUN_WEBAPI=true
RUN_CLIENTAPP=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend-only)
            RUN_BACKEND=false
            RUN_WEBAPI=false
            RUN_CLIENTAPP=false
            shift
            ;;
        --backend-only)
            RUN_FRONTEND=false
            RUN_WEBAPI=false
            RUN_CLIENTAPP=false
            shift
            ;;
        --webapi-only)
            RUN_FRONTEND=false
            RUN_BACKEND=false
            RUN_CLIENTAPP=false
            shift
            ;;
        --clientapp-only)
            RUN_FRONTEND=false
            RUN_BACKEND=false
            RUN_WEBAPI=false
            shift
            ;;
        *)
            echo -e "${RED}알 수 없는 옵션: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}프로젝트 전체 실행 스크립트${NC}"
echo -e "${BLUE}========================================${NC}"

# Frontend 실행
if [ "$RUN_FRONTEND" = true ]; then
    echo -e "\n${GREEN}[1/4] Frontend 시작 중... (포트 3000)${NC}"
    cd "$PROJECT_ROOT/frontend"
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}node_modules가 없습니다. npm install을 실행합니다...${NC}"
        npm install
    fi
    PORT=3000 npm start > "$PID_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PID_DIR/frontend.pid"
    echo -e "${GREEN}Frontend 시작됨 (PID: $FRONTEND_PID)${NC}"
    sleep 2
fi

# Backend (EstimateRequestSystem) 실행
if [ "$RUN_BACKEND" = true ]; then
    echo -e "\n${GREEN}[2/4] Backend (EstimateRequestSystem) 시작 중... (포트 5135)${NC}"
    cd "$PROJECT_ROOT/backend/EstimateRequestSystem/EstimateRequestSystem"
    dotnet run > "$PID_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PID_DIR/backend.pid"
    echo -e "${GREEN}Backend 시작됨 (PID: $BACKEND_PID)${NC}"
    sleep 3
fi

# WebApi 실행
if [ "$RUN_WEBAPI" = true ]; then
    echo -e "\n${GREEN}[3/4] WebApi 시작 중... (포트 7001)${NC}"
    cd "$PROJECT_ROOT/WebApi"
    dotnet run > "$PID_DIR/webapi.log" 2>&1 &
    WEBAPI_PID=$!
    echo $WEBAPI_PID > "$PID_DIR/webapi.pid"
    echo -e "${GREEN}WebApi 시작됨 (PID: $WEBAPI_PID)${NC}"
    sleep 3
fi

# ClientApp 실행
if [ "$RUN_CLIENTAPP" = true ]; then
    echo -e "\n${GREEN}[4/4] ClientApp 시작 중... (포트 5001)${NC}"
    cd "$PROJECT_ROOT/ClientApp"
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}node_modules가 없습니다. npm install을 실행합니다...${NC}"
        npm install
    fi
    PORT=5001 npm start > "$PID_DIR/clientapp.log" 2>&1 &
    CLIENTAPP_PID=$!
    echo $CLIENTAPP_PID > "$PID_DIR/clientapp.pid"
    echo -e "${GREEN}ClientApp 시작됨 (PID: $CLIENTAPP_PID)${NC}"
    sleep 2
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}모든 프로젝트가 시작되었습니다!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Frontend:${NC}     http://localhost:3000"
echo -e "${GREEN}Backend:${NC}      http://localhost:5135/swagger"
echo -e "${GREEN}WebApi:${NC}       http://localhost:7001/swagger"
echo -e "${GREEN}ClientApp:${NC}    http://localhost:5001"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}종료하려면 Ctrl+C를 누르세요.${NC}"
echo -e "${BLUE}로그 파일 위치: $PID_DIR${NC}"

# 프로세스가 종료될 때까지 대기
wait

