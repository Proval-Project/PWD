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

### 방법 4: 빌드 파일 충돌 해결 (다른 컴퓨터에서 빌드 파일이 Git에 추적 중일 때)
**이 에러가 나는 경우:** "Your local changes to the following files would be overwritten by merge"

**해결 방법:**

**옵션 A: 빌드 파일 정리 스크립트 사용 (권장)**
```bash
# Windows Git Bash
./clean-build-files.sh

# 또는 Windows 명령 프롬프트
clean-build-files.bat

# 그 다음 pull
git pull origin main
```

**옵션 B: 수동으로 빌드 파일 제거**
```bash
# Git 추적에서 빌드 파일 제거 (로컬 파일은 유지)
git rm --cached -r projec/**/bin/ projec/**/obj/

# 또는 모든 빌드 파일 제거
git ls-files | grep -E "(bin/|obj/|\.dll$|\.pdb$|\.exe$)" | xargs git rm --cached

# 그 다음 pull
git pull origin main
```

**옵션 C: 완전히 깨끗하게 업데이트 (로컬 변경사항 모두 삭제)**
```bash
# 주의: 로컬 변경사항이 모두 사라집니다!
git fetch origin
git reset --hard origin/main
git clean -fd
```

### 방법 5: 완전히 깨끗하게 업데이트 (최후의 수단)
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

**Windows (Git Bash에서):**
```bash
# 방법 1: 일반 삭제 시도
rm .git/index.lock

# 방법 2: "Device or resource busy" 에러가 나면
# 1단계: 모든 Git 관련 프로세스 종료 (VS Code, Git GUI 등)
# 2단계: 파일 탐색기에서 직접 삭제 시도
# 3단계: 또는 관리자 권한으로 삭제

# 방법 3: 강제 삭제 (Windows)
# 파일 탐색기에서 .git/index.lock 파일을 찾아서 직접 삭제
# 또는 명령 프롬프트(관리자 권한)에서:
#   del /f .git\index.lock

# 방법 4: Git 프로세스 확인 후 삭제
# 작업 관리자에서 git.exe, gitk.exe 등 Git 관련 프로세스 종료 후
# 다시 삭제 시도

git pull origin main
```

**Windows에서 "Device or resource busy" 에러가 나는 경우:**
1. **VS Code나 다른 에디터 종료** - Git 관련 프로세스가 lock 파일을 잠글 수 있습니다
2. **파일 탐색기에서 직접 삭제** - `.git/index.lock` 파일을 찾아서 삭제
3. **관리자 권한으로 삭제** - 명령 프롬프트를 관리자 권한으로 실행 후 삭제
4. **Git 프로세스 종료** - 작업 관리자에서 `git.exe` 프로세스 확인 및 종료

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

