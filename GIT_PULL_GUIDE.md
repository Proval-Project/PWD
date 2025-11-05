# Git Pull 가이드 (다른 컴퓨터에서 최신 코드 가져오기)

## 문제 상황
다른 컴퓨터에서 `npm install`이나 `dotnet build`를 실행하면 빌드 파일들이 생성됩니다.
이 파일들 때문에 `git pull`이 안 될 수 있습니다.

## 해결 방법

### 방법 1: 간단한 git pull (권장)
빌드 파일은 `.gitignore`에 포함되어 있어서 Git이 추적하지 않습니다.
따라서 대부분의 경우 그냥 `git pull`만 하면 됩니다:

```bash
git pull origin main
```

### 방법 2: 빌드 파일 정리 후 pull (충돌 시)
만약 `git pull`이 안 되거나 충돌이 발생하면:

**Mac/Linux:**
```bash
./clean-build-files.sh
git pull origin main
```

**Windows:**
```cmd
clean-build-files.bat
git pull origin main
```

### 방법 3: 로컬 변경사항 무시하고 pull
로컬 빌드 파일 때문에 계속 문제가 생기면:

```bash
# 로컬 변경사항 저장 (선택사항)
git stash

# 최신 코드 가져오기
git pull origin main

# 저장한 변경사항 복원 (선택사항)
git stash pop
```

### 방법 4: 완전히 깨끗하게 업데이트 (최후의 수단)
다른 컴퓨터의 모든 로컬 변경사항을 버리고 최신 코드로 덮어쓰기:

```bash
# 주의: 로컬 변경사항이 모두 사라집니다!
git fetch origin
git reset --hard origin/main
git clean -fd
```

## 빌드 파일 정리 스크립트
- `clean-build-files.sh` (Mac/Linux용)
- `clean-build-files.bat` (Windows용)

이 스크립트들은 다음 파일들을 삭제합니다:
- `.NET` 빌드 파일 (bin/, obj/, *.dll, *.pdb, *.exe)
- NuGet 캐시 파일
- package-lock.json (ClientApp 제외)

## 자주 발생하는 에러 해결

### 에러: "Unable to create '.git/index.lock': File exists"
이 에러는 Git의 lock 파일이 남아있을 때 발생합니다.

**해결 방법:**

**Mac/Linux:**
```bash
rm .git/index.lock
git pull origin main
```

**Windows:**
```cmd
del .git\index.lock
git pull origin main
```

또는 Git Bash에서:
```bash
rm .git/index.lock
git pull origin main
```

## 자주 묻는 질문

**Q: git pull이 안 되는데 왜 그런가요?**
A: 보통 로컬에 수정된 파일이 있거나, Git이 추적하는 파일이 변경되었을 때 발생합니다.
   빌드 파일은 `.gitignore`에 있어서 일반적으로 문제가 되지 않습니다.
   또는 `.git/index.lock` 파일이 남아있을 수 있습니다.

**Q: npm install이나 dotnet build를 했는데 괜찮나요?**
A: 네, 괜찮습니다. 빌드 파일은 `.gitignore`에 포함되어 있어서 Git이 추적하지 않습니다.

**Q: 다른 컴퓨터에서 빌드 파일을 정리해야 하나요?**
A: 일반적으로는 필요 없습니다. 하지만 git pull이 안 될 때만 정리 스크립트를 실행하세요.

**Q: "index.lock: File exists" 에러가 나요?**
A: `.git/index.lock` 파일을 삭제하고 다시 시도하세요. 다른 Git 프로세스가 실행 중이거나
   이전 작업이 비정상 종료되어 lock 파일이 남아있는 경우입니다.

