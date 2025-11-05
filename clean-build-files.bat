@echo off
REM 빌드 파일 정리 스크립트 (Windows용)
REM 다른 컴퓨터에서 git pull 전에 실행하거나, git pull 후 충돌 시 실행

echo 빌드 파일 정리 중...

REM .NET 빌드 디렉토리 삭제 (packages 제외)
for /d /r . %%d in (bin obj) do @if exist "%%d" (
    echo %%d | findstr /i /v "packages" >nul && rd /s /q "%%d" 2>nul
)

REM .NET 빌드 아티팩트 삭제 (packages 제외)
for /r . %%f in (*.dll *.pdb *.exe) do @if exist "%%f" (
    echo %%f | findstr /i /v "packages" >nul && del /f /q "%%f" 2>nul
)

REM NuGet 캐시 파일 삭제
for /r . %%f in (*.cache *.dgspec.json *.sourcelink.json *.AssemblyInfo.cs *.assets.cache *.FileListAbsolute.txt *.GeneratedMSBuildEditorConfig.editorconfig *.AssemblyInfoInputs.cache *.genruntimeconfig.cache project.assets.json project.nuget.cache) do @if exist "%%f" (
    echo %%f | findstr /i /v "packages" >nul && del /f /q "%%f" 2>nul
)

REM package-lock.json 삭제 (ClientApp 제외)
for /r . %%f in (package-lock.json) do @if exist "%%f" (
    echo %%f | findstr /i /v "ClientApp" >nul && del /f /q "%%f" 2>nul
)

echo 빌드 파일 정리 완료!
echo.
echo 다음 명령어로 Git 상태를 확인하세요:
echo   git status

