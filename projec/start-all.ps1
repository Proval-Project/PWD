# 프로젝트 전체 실행 스크립트 (Windows PowerShell)
# 사용법: .\start-all.ps1 [옵션]
# 옵션:
#   --frontend-only    : frontend만 실행
#   --backend-only     : backend만 실행
#   --webapi-only      : WebApi만 실행
#   --clientapp-only   : ClientApp만 실행

$ErrorActionPreference = "Stop"

# 프로젝트 루트 디렉토리
$PROJECT_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $PROJECT_ROOT

# PID 파일 저장 디렉토리
$PID_DIR = Join-Path $PROJECT_ROOT ".pids"
if (-not (Test-Path $PID_DIR)) {
    New-Item -ItemType Directory -Path $PID_DIR | Out-Null
}

# 프로세스 저장용
$global:Processes = @()

# 종료 함수
function Cleanup {
    Write-Host "`n종료 중..." -ForegroundColor Yellow
    foreach ($proc in $global:Processes) {
        if (-not $proc.HasExited) {
            Write-Host "프로세스 종료: $($proc.Id)" -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
    # 추가로 남아있는 프로세스 정리
    Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*dotnet*" } | 
        Where-Object { $_.CommandLine -like "*react-scripts*" -or $_.CommandLine -like "*dotnet run*" } | 
        Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "모든 프로세스가 종료되었습니다." -ForegroundColor Green
    exit 0
}

# 시그널 핸들러 등록
Register-EngineEvent PowerShell.Exiting -Action { Cleanup } | Out-Null

# 옵션 파싱
$RUN_FRONTEND = $true
$RUN_BACKEND = $true
$RUN_WEBAPI = $true
$RUN_CLIENTAPP = $true

foreach ($arg in $args) {
    switch ($arg) {
        "--frontend-only" {
            $RUN_BACKEND = $false
            $RUN_WEBAPI = $false
            $RUN_CLIENTAPP = $false
        }
        "--backend-only" {
            $RUN_FRONTEND = $false
            $RUN_WEBAPI = $false
            $RUN_CLIENTAPP = $false
        }
        "--webapi-only" {
            $RUN_FRONTEND = $false
            $RUN_BACKEND = $false
            $RUN_CLIENTAPP = $false
        }
        "--clientapp-only" {
            $RUN_FRONTEND = $false
            $RUN_BACKEND = $false
            $RUN_WEBAPI = $false
        }
        default {
            Write-Host "알 수 없는 옵션: $arg" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "========================================" -ForegroundColor Blue
Write-Host "프로젝트 전체 실행 스크립트" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# Frontend 실행
if ($RUN_FRONTEND) {
    Write-Host "`n[1/4] Frontend 시작 중... (포트 3000)" -ForegroundColor Green
    $frontendPath = Join-Path $PROJECT_ROOT "frontend"
    Set-Location $frontendPath
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "node_modules가 없습니다. npm install을 실행합니다..." -ForegroundColor Yellow
        npm install
    }
    
    $env:PORT = "3000"
    $frontendProc = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -WindowStyle Minimized
    $global:Processes += $frontendProc
    $frontendProc.Id | Out-File (Join-Path $PID_DIR "frontend.pid")
    Write-Host "Frontend 시작됨 (PID: $($frontendProc.Id))" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# Backend (EstimateRequestSystem) 실행
if ($RUN_BACKEND) {
    Write-Host "`n[2/4] Backend (EstimateRequestSystem) 시작 중... (포트 5135)" -ForegroundColor Green
    $backendPath = Join-Path $PROJECT_ROOT "backend\EstimateRequestSystem\EstimateRequestSystem"
    Set-Location $backendPath
    
    $backendProc = Start-Process -FilePath "dotnet" -ArgumentList "run" -PassThru -WindowStyle Minimized
    $global:Processes += $backendProc
    $backendProc.Id | Out-File (Join-Path $PID_DIR "backend.pid")
    Write-Host "Backend 시작됨 (PID: $($backendProc.Id))" -ForegroundColor Green
    Start-Sleep -Seconds 3
}

# WebApi 실행
if ($RUN_WEBAPI) {
    Write-Host "`n[3/4] WebApi 시작 중... (포트 7001)" -ForegroundColor Green
    $webapiPath = Join-Path $PROJECT_ROOT "WebApi"
    Set-Location $webapiPath
    
    $webapiProc = Start-Process -FilePath "dotnet" -ArgumentList "run" -PassThru -WindowStyle Minimized
    $global:Processes += $webapiProc
    $webapiProc.Id | Out-File (Join-Path $PID_DIR "webapi.pid")
    Write-Host "WebApi 시작됨 (PID: $($webapiProc.Id))" -ForegroundColor Green
    Start-Sleep -Seconds 3
}

# ClientApp 실행
if ($RUN_CLIENTAPP) {
    Write-Host "`n[4/4] ClientApp 시작 중... (포트 5001)" -ForegroundColor Green
    $clientappPath = Join-Path $PROJECT_ROOT "ClientApp"
    Set-Location $clientappPath
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "node_modules가 없습니다. npm install을 실행합니다..." -ForegroundColor Yellow
        npm install
    }
    
    $env:PORT = "5001"
    $clientappProc = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -WindowStyle Minimized
    $global:Processes += $clientappProc
    $clientappProc.Id | Out-File (Join-Path $PID_DIR "clientapp.pid")
    Write-Host "ClientApp 시작됨 (PID: $($clientappProc.Id))" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "모든 프로젝트가 시작되었습니다!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Frontend:     http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:      http://localhost:5135/swagger" -ForegroundColor Green
Write-Host "WebApi:       http://localhost:7001/swagger" -ForegroundColor Green
Write-Host "ClientApp:    http://localhost:5001" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue
Write-Host "종료하려면 Ctrl+C를 누르세요." -ForegroundColor Yellow
Write-Host "로그 파일 위치: $PID_DIR" -ForegroundColor Blue

# 프로세스가 종료될 때까지 대기
try {
    while ($true) {
        $allExited = $true
        foreach ($proc in $global:Processes) {
            if (-not $proc.HasExited) {
                $allExited = $false
                break
            }
        }
        if ($allExited) {
            break
        }
        Start-Sleep -Seconds 1
    }
} catch {
    Cleanup
}

