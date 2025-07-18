#!/bin/bash

# 스크립트가 실행되는 디렉토리를 기준으로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 백엔드 서비스들을 시작합니다..."

# AuthSystem 시작 (백그라운드)
echo "📡 AuthSystem 시작 중... (포트 5236)"
cd "$SCRIPT_DIR/AuthSystem" && dotnet run &
AUTH_PID=$!

# 잠시 대기
sleep 5

# DataService 시작 (백그라운드)
echo "📊 DataService 시작 중... (포트 5162)"
cd "$SCRIPT_DIR/DataService" && dotnet run &
DATA_PID=$!

echo "✅ 모든 백엔드 서비스가 시작되었습니다!"
echo "📍 AuthSystem: http://localhost:5236"
echo "📍 DataService: http://localhost:5162"
echo "📍 Swagger UI: http://localhost:5236/swagger"
echo ""
echo "서비스를 중지하려면: Ctrl+C"

# 프로세스 종료 함수
cleanup() {
    echo ""
    echo "🛑 서비스들을 종료합니다..."
    kill $AUTH_PID $DATA_PID 2>/dev/null
    exit 0
}

# Ctrl+C 시그널 처리
trap cleanup SIGINT

# 프로세스들이 실행 중인 동안 대기
wait 