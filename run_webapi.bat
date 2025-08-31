@echo off
chcp 65001 >nul
echo ========================================
echo    WebApi 백엔드 실행
echo ========================================
echo.

REM IP 주소 입력 받기
set /p NEW_IP="IP 주소를 입력하세요 (기본값: 192.168.0.59): "
if "%NEW_IP%"=="" set NEW_IP=192.168.0.59

echo.
echo IP 주소: %NEW_IP%:7001로 실행합니다.
echo.

REM 디렉토리 이동 및 실행
cd /d "%~dp0projec\WebApi"
echo 현재 디렉토리: %CD%
echo.

echo .NET 애플리케이션을 시작합니다...
echo 종료하려면 Ctrl+C를 누르세요.
echo.

dotnet run --urls "http://%NEW_IP%:7001"

pause
