#!/bin/bash
# 빌드 파일 정리 스크립트 (Mac/Linux용)
# 다른 컴퓨터에서 git pull 전에 실행하거나, git pull 후 충돌 시 실행

echo "빌드 파일 정리 중..."

# .NET 빌드 디렉토리 삭제
find . -type d \( -name "bin" -o -name "obj" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -exec rm -rf {} + 2>/dev/null || true

# .NET 빌드 아티팩트 삭제 (packages 디렉토리 제외)
find . -type f \( -name "*.dll" -o -name "*.pdb" -o -name "*.exe" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/packages/*" -delete 2>/dev/null || true

# NuGet 캐시 파일 삭제 (obj 디렉토리 내)
find . -type f \( -name "*.cache" -o -name "*.dgspec.json" -o -name "*.sourcelink.json" -o -name "*.AssemblyInfo.cs" -o -name "*.assets.cache" -o -name "*.FileListAbsolute.txt" -o -name "*.GeneratedMSBuildEditorConfig.editorconfig" -o -name "*.AssemblyInfoInputs.cache" -o -name "*.genruntimeconfig.cache" -o -name "project.assets.json" -o -name "project.nuget.cache" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -delete 2>/dev/null || true

# package-lock.json 삭제 (ClientApp 제외)
find . -name "package-lock.json" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/ClientApp/*" -delete 2>/dev/null || true

echo "빌드 파일 정리 완료!"
echo ""
echo "다음 명령어로 Git 상태를 확인하세요:"
echo "  git status"
