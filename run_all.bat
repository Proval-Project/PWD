@echo off
chcp 65001 >nul
echo ========================================
echo    Conval 견적 시스템 실행 스크립트
echo ========================================
echo.

REM 현재 IP 주소 확인
echo 현재 IP 주소를 확인 중입니다...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set CURRENT_IP=%%a
    goto :found_ip
)
:found_ip
set CURRENT_IP=%CURRENT_IP: =%
echo 현재 IP 주소: %CURRENT_IP%
echo.

REM IP 주소 입력 받기
set /p NEW_IP="새로운 IP 주소를 입력하세요 (예: 192.168.0.100): "
if "%NEW_IP%"=="" (
    echo IP 주소가 입력되지 않았습니다. 기본값 192.168.0.59를 사용합니다.
    set NEW_IP=192.168.0.59
)

echo.
echo 새로운 IP 주소: %NEW_IP%로 설정을 변경합니다...
echo.

REM IP 주소 변경
call :update_ip_addresses

echo.
echo ========================================
echo    모든 서비스 시작 중...
echo ========================================
echo.

REM MySQL 서비스 시작
echo 1. MySQL 서비스 시작 중...
net start MySQL80 >nul 2>&1
if %errorlevel% equ 0 (
    echo    MySQL 서비스 시작 완료
) else (
    echo    MySQL 서비스 시작 실패 (이미 실행 중이거나 설치되지 않음)
)
echo.

REM EstimateRequestSystem 백엔드 시작
echo 2. EstimateRequestSystem 백엔드 시작 중...
start "EstimateRequestSystem" cmd /k "cd /d %~dp0projec\backend\EstimateRequestSystem\EstimateRequestSystem && dotnet run --urls http://%NEW_IP%:7001"
echo    EstimateRequestSystem 백엔드 시작됨 (포트 7001)
echo.

REM WebApi 백엔드 시작
echo 3. WebApi 백엔드 시작 중...
start "WebApi" cmd /k "cd /d %~dp0projec\WebApi && dotnet run --urls http://%NEW_IP%:7001"
echo    WebApi 백엔드 시작됨 (포트 7001)
echo.

REM ConvalServiceApi 시작 (Conval 소프트웨어가 설치된 경우)
echo 4. ConvalServiceApi 시작 중...
start "ConvalServiceApi" cmd /k "cd /d %~dp0ConvalServiceApi\ConvalServiceApi && dotnet run --urls http://%NEW_IP%:44340"
echo    ConvalServiceApi 시작됨 (포트 44340)
echo.

REM 프론트엔드 시작
echo 5. 프론트엔드 시작 중...
start "Frontend" cmd /k "cd /d %~dp0projec\frontend && npm start"
echo    프론트엔드 시작됨 (포트 3000)
echo.

REM ClientApp 시작
echo 6. ClientApp 시작 중...
start "ClientApp" cmd /k "cd /d %~dp0projec\ClientApp && npm start"
echo    ClientApp 시작됨 (포트 5001)
echo.

echo.
echo ========================================
echo    모든 서비스가 시작되었습니다!
echo ========================================
echo.
echo 접속 주소:
echo - 프론트엔드: http://%NEW_IP%:3000
echo - ClientApp: http://%NEW_IP%:5001
echo - 백엔드 API: http://%NEW_IP%:7001
echo - Conval API: http://%NEW_IP%:44340
echo.
echo MySQL 외부 접속 허용 설정:
echo - IP: %NEW_IP%
echo - 포트: 3306
echo.
echo 아무 키나 누르면 종료됩니다...
pause >nul
exit

:update_ip_addresses
echo IP 주소를 %NEW_IP%로 변경 중...

REM EstimateRequestSystem launchSettings.json
if exist "projec\backend\EstimateRequestSystem\EstimateRequestSystem\Properties\launchSettings.json" (
    powershell -Command "(Get-Content 'projec\backend\EstimateRequestSystem\EstimateRequestSystem\Properties\launchSettings.json') -replace '192\.168\.0\.14', '%NEW_IP%' | Set-Content 'projec\backend\EstimateRequestSystem\EstimateRequestSystem\Properties\launchSettings.json'"
    echo    EstimateRequestSystem 설정 변경 완료
)

REM WebApi launchSettings.json
if exist "projec\WebApi\Properties\launchSettings.json" (
    powershell -Command "(Get-Content 'projec\WebApi\Properties\launchSettings.json') -replace '192\.168\.0\.14', '%NEW_IP%' | Set-Content 'projec\WebApi\Properties\launchSettings.json'"
    echo    WebApi 설정 변경 완료
)

REM ConvalServiceApi csproj.user
if exist "ConvalServiceApi\ConvalServiceApi\ConvalServiceApi.csproj.user" (
    powershell -Command "(Get-Content 'ConvalServiceApi\ConvalServiceApi\ConvalServiceApi.csproj.user') -replace '192\.168\.0\.14', '%NEW_IP%' | Set-Content 'ConvalServiceApi\ConvalServiceApi\ConvalServiceApi.csproj.user'"
    echo    ConvalServiceApi 설정 변경 완료
)

REM ClientApp api.js
if exist "projec\ClientApp\src\services\api.js" (
    powershell -Command "(Get-Content 'projec\ClientApp\src\services\api.js') -replace '192\.168\.0\.14', '%NEW_IP%' | Set-Content 'projec\ClientApp\src\services\api.js'"
    echo    ClientApp API 설정 변경 완료
)

REM Frontend EstimateDetailPage.tsx
if exist "projec\frontend\src\pages\Dashboard\EstimateDetailPage.tsx" (
    powershell -Command "(Get-Content 'projec\frontend\src\pages\Dashboard\EstimateDetailPage.tsx') -replace '192\.168\.0\.14', '%NEW_IP%' | Set-Content 'projec\frontend\src\pages\Dashboard\EstimateDetailPage.tsx'"
    echo    Frontend EstimateDetailPage 설정 변경 완료
)

echo    모든 IP 주소 변경 완료!
echo.
goto :eof
