# 프로젝트 전체 실행 스크립트 사용 가이드

이 스크립트는 프로젝트의 모든 서비스를 한 번에 실행할 수 있도록 도와줍니다.

## 지원 플랫폼

- **Mac/Linux**: `start-all.sh` (bash 스크립트)
- **Windows**: `start-all.bat` (배치 파일) 또는 `start-all.ps1` (PowerShell 스크립트)

## 실행할 서비스

1. **Frontend** - React 앱 (포트 3000)
2. **Backend** - EstimateRequestSystem .NET API (포트 5135)
3. **WebApi** - ConvalWebApi .NET API (포트 7001)
4. **ClientApp** - React 앱 (포트 5001)

## 사용법

### Mac/Linux

```bash
# 모든 서비스 실행
./start-all.sh

# 특정 서비스만 실행
./start-all.sh --frontend-only
./start-all.sh --backend-only
./start-all.sh --webapi-only
./start-all.sh --clientapp-only
```

### Windows (배치 파일)

```cmd
REM 모든 서비스 실행
start-all.bat

REM 특정 서비스만 실행
start-all.bat --frontend-only
start-all.bat --backend-only
start-all.bat --webapi-only
start-all.bat --clientapp-only
```

### Windows (PowerShell)

```powershell
# 모든 서비스 실행
.\start-all.ps1

# 특정 서비스만 실행
.\start-all.ps1 --frontend-only
.\start-all.ps1 --backend-only
.\start-all.ps1 --webapi-only
.\start-all.ps1 --clientapp-only
```

## 실행 전 요구사항

1. **Node.js** 및 **npm** 설치 필요 (Frontend, ClientApp용)
2. **.NET SDK 8.0** 설치 필요 (Backend, WebApi용)
3. 각 프로젝트의 `node_modules`가 없으면 자동으로 `npm install` 실행

## 종료 방법

- **Mac/Linux**: `Ctrl+C`를 누르면 모든 프로세스가 종료됩니다.
- **Windows**: 각 창을 닫거나 `Ctrl+C`를 누르면 종료됩니다.

## 로그 파일

모든 로그는 `.pids/` 디렉토리에 저장됩니다:
- `frontend.log` / `frontend.error.log`
- `backend.log` / `backend.error.log`
- `webapi.log` / `webapi.error.log`
- `clientapp.log` / `clientapp.error.log`

## 접속 URL

스크립트 실행 후 다음 URL로 접속할 수 있습니다:

- **Frontend**: http://localhost:3000
- **Backend Swagger**: http://localhost:5135/swagger
- **WebApi Swagger**: http://localhost:7001/swagger
- **ClientApp**: http://localhost:5001

## 문제 해결

### 포트가 이미 사용 중인 경우

해당 포트를 사용하는 프로세스를 종료하거나, 각 프로젝트의 설정 파일에서 포트를 변경하세요.

### 권한 오류 (Mac/Linux)

스크립트에 실행 권한이 없는 경우:
```bash
chmod +x start-all.sh
```

### PowerShell 실행 정책 오류 (Windows)

PowerShell 스크립트 실행이 차단된 경우:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

