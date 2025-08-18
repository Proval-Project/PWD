# 프로젝트 루트 디렉토리 (현재 스크립트가 실행되는 곳)
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

# 프론트엔드 실행
Write-Host "Starting frontend..."
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm install; npm start"

# 백엔드 AuthSystem 실행
Write-Host "Starting backend AuthSystem..."
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend\AuthSystem'; dotnet run"

# 백엔드 EstimateRequestSystem 실행
Write-Host "Starting backend EstimateRequestSystem..."
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend\EstimateRequestSystem\EstimateRequestSystem'; dotnet run"

# 백엔드 UserManagementSystem 실행
Write-Host "Starting backend UserManagementSystem..."
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend\UserManagementSystem'; dotnet run"

Write-Host "All applications are launched. Check the new console windows."
