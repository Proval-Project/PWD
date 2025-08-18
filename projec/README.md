# PWD 프로젝트 세팅 및 실행 가이드

## 0. .NET SDK 8.0 설치 (처음 환경 또는 재설치 시)

### MacOS
- **공식 사이트:**
  - https://dotnet.microsoft.com/ko-kr/download
- **Homebrew:**
  ```bash
  brew install --cask dotnet-sdk@8
  ```
- 설치 후, 아래 명령어로 정상 설치 확인:
  ```bash
  dotnet --version
  ```

### Windows
- **공식 사이트: 8.x으로 무조건 설치**
  - https://dotnet.microsoft.com/ko-kr/download
- 설치 후, 명령 프롬프트에서:
  ```cmd
  dotnet --version
  ```

---

## 1. 저장소 클론
```bash
git clone <레포지토리 주소>
cd PWD
```

## 2. .NET 의존성 복원
```bash
dotnet restore
```
- backend/CommonDbLib, backend/AuthSystem, backend/DataService 등 모든 하위 프로젝트의 패키지가 자동 복원됩니다.
- 각 폴더에 들어가서 restore 명령어를 수행해야 합니다.

## 3. MySQL 데이터베이스 준비
- MySQL 8.0 이상이 설치되어 있고 실행 중이어야 합니다.
- (최초 1회) 아래 명령어로 데이터베이스를 생성할 수 있습니다:

```bash
mysql -u root -p -e "CREATE DATABASE FullAuthSystemDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## 4. 데이터베이스 마이그레이션 (테이블 자동 생성)
- 실행 프로젝트(예: DataService) 폴더에서 아래 명령어 실행:

```bash
cd backend/DataService
# 또는 cd backend\DataService (Windows)
dotnet ef database update
```
- 연결 문자열(appsettings.json) 기준으로 DB와 테이블이 자동 생성됩니다.

## 5. 서비스 실행
```bash
# 예시: DataService 실행
cd backend/DataService
dotnet run
```

## 6. 주요 폴더 구조
```
PWD/
├── backend/
│   ├── CommonDbLib/   # DB 모델 및 마이그레이션
│   ├── AuthSystem/    # 인증/권한 서비스
│   └── DataService/   # 데이터/견적 API
└── frontend/          # 프론트엔드(React)
```

## 7. 자주 묻는 질문(FAQ)
- **Q. dotnet restore만 하면 DB도 만들어지나요?**
  - A. 아니요, DB/테이블 생성은 반드시 `dotnet ef database update`를 별도로 실행해야 합니다.
- **Q. appsettings.json은 어디에 있나요?**
  - A. backend/AuthSystem, backend/DataService 등 실행 프로젝트 폴더에 있습니다.
- **Q. MySQL이 없으면 어떻게 하나요?**
  - A. Mac: `brew install mysql`, Windows: [공식 홈페이지](https://dev.mysql.com/downloads/) 참고

## 8. 기타
- 자세한 API 문서는 `backend/DataService/docs/API_DOCUMENTATION.md` 참고
- 프론트엔드 실행은 `frontend/README.md` 참고(필요시)

---
문의사항은 이슈로 등록해 주세요. 

---
네, 맞습니다!  
**현재 이 프로젝트(PWD)는 .NET 8.0만 있으면 충분합니다.**  
즉, .NET 9.0은 굳이 설치하지 않아도 되고,  
8.0만 설치되어 있으면 빌드/실행/마이그레이션 모두 정상적으로 동작합니다.

---

## 정리

- **필수:**  
  - .NET 8.0 SDK & 런타임

- **선택:**  
  - .NET 9.0은 최신 기능 테스트나 다른 프로젝트가 요구하지 않는 한 필요 없음

- **여러 버전이 설치되어 있어도 문제 없음**  
  - 하지만, 프로젝트가 요구하는 버전(여기서는 8.0)이 반드시 설치되어 있어야 함

---

## 추천 명령어

```bash
<code_block_to_apply_changes_from>
```
또는  
[공식 .NET 8.0 다운로드 페이지](https://dotnet.microsoft.com/ko-kr/download/dotnet/8.0)에서 설치

---

추가로 궁금한 점 있으면 언제든 질문해 주세요! 