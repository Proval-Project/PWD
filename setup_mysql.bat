@echo off
chcp 65001 >nul
echo ========================================
echo    MySQL 외부 접속 허용 설정
echo ========================================
echo.

REM IP 주소 입력 받기
set /p NEW_IP="새로운 IP 주소를 입력하세요 (예: 192.168.0.100): "
if "%NEW_IP%"=="" (
    echo IP 주소가 입력되지 않았습니다. 기본값 192.168.0.59를 사용합니다.
    set NEW_IP=192.168.0.59
)

echo.
echo IP 주소: %NEW_IP%로 MySQL 외부 접속을 허용합니다.
echo.

REM MySQL 서비스 상태 확인
echo MySQL 서비스 상태 확인 중...
sc query MySQL80 >nul 2>&1
if %errorlevel% neq 0 (
    echo MySQL 서비스가 설치되지 않았습니다.
    echo MySQL을 먼저 설치해주세요.
    pause
    exit /b 1
)

echo MySQL 서비스가 설치되어 있습니다.
echo.

REM MySQL 외부 접속 허용 SQL 스크립트 생성
echo MySQL 외부 접속 허용 SQL 스크립트를 생성합니다...
(
echo -- MySQL 외부 접속 허용 스크립트
echo -- 실행 전 MySQL root 비밀번호를 입력하세요
echo.
echo -- 사용자 생성 (비밀번호는 'password'로 설정, 필요시 변경하세요)
echo CREATE USER IF NOT EXISTS 'conval_user'@'%NEW_IP%' IDENTIFIED BY 'password';
echo.
echo -- 모든 데이터베이스에 대한 권한 부여
echo GRANT ALL PRIVILEGES ON *.* TO 'conval_user'@'%NEW_IP%';
echo.
echo -- 권한 적용
echo FLUSH PRIVILEGES;
echo.
echo -- 현재 사용자 확인
echo SELECT User, Host FROM mysql.user WHERE User = 'conval_user';
echo.
echo -- 외부 접속 테스트
echo -- mysql -h %NEW_IP% -u conval_user -p
) > mysql_external_access.sql

echo SQL 스크립트가 생성되었습니다: mysql_external_access.sql
echo.

REM MySQL 접속 테스트
echo MySQL 접속 테스트를 진행합니다...
echo MySQL root 비밀번호를 입력하세요:
mysql -u root -p < mysql_external_access.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    MySQL 외부 접속 설정 완료!
    echo ========================================
    echo.
    echo 접속 정보:
    echo - 호스트: %NEW_IP%
    echo - 사용자: conval_user
    echo - 비밀번호: password
    echo - 포트: 3306
    echo.
    echo 접속 테스트:
    echo mysql -h %NEW_IP% -u conval_user -p
    echo.
) else (
    echo.
    echo MySQL 설정 중 오류가 발생했습니다.
    echo 수동으로 설정해주세요.
    echo.
)

echo 아무 키나 누르면 종료됩니다...
pause >nul
exit
