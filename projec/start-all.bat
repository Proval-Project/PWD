@echo off
REM 프로젝트 전체 실행 스크립트 (Windows 배치 파일)
REM 사용법: start-all.bat [옵션]
REM 옵션:
REM   --frontend-only    : frontend만 실행
REM   --backend-only     : backend만 실행
REM   --webapi-only      : WebApi만 실행
REM   --clientapp-only   : ClientApp만 실행

setlocal enabledelayedexpansion

REM 프로젝트 루트 디렉토리
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

REM PID 파일 저장 디렉토리
set "PID_DIR=%PROJECT_ROOT%.pids"
if not exist "%PID_DIR%" mkdir "%PID_DIR%"

REM 옵션 파싱
set "RUN_FRONTEND=1"
set "RUN_BACKEND=1"
set "RUN_WEBAPI=1"
set "RUN_CLIENTAPP=1"

:parse_args
if "%~1"=="" goto :end_parse
if "%~1"=="--frontend-only" (
    set "RUN_BACKEND=0"
    set "RUN_WEBAPI=0"
    set "RUN_CLIENTAPP=0"
    shift
    goto :parse_args
)
if "%~1"=="--backend-only" (
    set "RUN_FRONTEND=0"
    set "RUN_WEBAPI=0"
    set "RUN_CLIENTAPP=0"
    shift
    goto :parse_args
)
if "%~1"=="--webapi-only" (
    set "RUN_FRONTEND=0"
    set "RUN_BACKEND=0"
    set "RUN_CLIENTAPP=0"
    shift
    goto :parse_args
)
if "%~1"=="--clientapp-only" (
    set "RUN_FRONTEND=0"
    set "RUN_BACKEND=0"
    set "RUN_WEBAPI=0"
    shift
    goto :parse_args
)
shift
goto :parse_args

:end_parse

echo ========================================
echo 프로젝트 전체 실행 스크립트
echo ========================================

REM Frontend 실행
if "%RUN_FRONTEND%"=="1" (
    echo.
    echo [1/4] Frontend 시작 중... (포트 3000)
    cd /d "%PROJECT_ROOT%frontend"
    if not exist "node_modules" (
        echo node_modules가 없습니다. npm install을 실행합니다...
        call npm install
    )
    set PORT=3000
    start "Frontend" cmd /c "npm start > %PID_DIR%\frontend.log 2>&1"
    timeout /t 2 /nobreak >nul
)

REM Backend (EstimateRequestSystem) 실행
if "%RUN_BACKEND%"=="1" (
    echo.
    echo [2/4] Backend (EstimateRequestSystem) 시작 중... (포트 5135)
    cd /d "%PROJECT_ROOT%backend\EstimateRequestSystem\EstimateRequestSystem"
    start "Backend" cmd /c "dotnet run > %PID_DIR%\backend.log 2>&1"
    timeout /t 3 /nobreak >nul
)

REM WebApi 실행
if "%RUN_WEBAPI%"=="1" (
    echo.
    echo [3/4] WebApi 시작 중... (포트 7001)
    cd /d "%PROJECT_ROOT%WebApi"
    start "WebApi" cmd /c "dotnet run > %PID_DIR%\webapi.log 2>&1"
    timeout /t 3 /nobreak >nul
)

REM ClientApp 실행
if "%RUN_CLIENTAPP%"=="1" (
    echo.
    echo [4/4] ClientApp 시작 중... (포트 5001)
    cd /d "%PROJECT_ROOT%ClientApp"
    if not exist "node_modules" (
        echo node_modules가 없습니다. npm install을 실행합니다...
        call npm install
    )
    set PORT=5001
    start "ClientApp" cmd /c "npm start > %PID_DIR%\clientapp.log 2>&1"
    timeout /t 2 /nobreak >nul
)

echo.
echo ========================================
echo 모든 프로젝트가 시작되었습니다!
echo ========================================
echo Frontend:     http://localhost:3000
echo Backend:      http://localhost:5135/swagger
echo WebApi:       http://localhost:7001/swagger
echo ClientApp:    http://localhost:5001
echo ========================================
echo 종료하려면 각 창을 닫거나 Ctrl+C를 누르세요.
echo 로그 파일 위치: %PID_DIR%
echo.

REM 대기
pause

