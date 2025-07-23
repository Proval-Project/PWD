# PWD 프로젝트 세팅 및 실행 가이드

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