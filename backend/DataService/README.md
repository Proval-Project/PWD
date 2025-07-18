# DataService

데이터베이스에서 프론트엔드 요청에 따라 데이터를 조회하는 백엔드 서비스입니다.

## 🚀 기능

- **사용자 관리**: 사용자 정보 조회, 검색
- **견적서 관리**: 견적서 정보 조회, 상태별 검색
- **통계 정보**: 사용자 수, 견적서 수 등 통계 데이터 제공

## 📋 요구사항

- .NET 8.0
- MySQL 8.0
- ASP.NET Core Web API

## 🛠️ 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd backend/DataService
```

### 2. 의존성 설치
```bash
dotnet restore
```

### 3. 데이터베이스 설정
MySQL 데이터베이스가 실행 중이어야 합니다. `appsettings.json`에서 연결 문자열을 확인하세요:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=FullAuthSystemDb;User=root;CharSet=utf8mb4;"
  }
}
```

### 4. 애플리케이션 실행
```bash
dotnet run
```

서비스가 `http://localhost:5162`에서 실행됩니다.

## 📊 API 엔드포인트

### 사용자 API
- `GET /api/data/users` - 모든 사용자 조회
- `GET /api/data/users/{id}` - 특정 사용자 조회
- `GET /api/data/users/search?name={검색어}` - 사용자 검색

### 견적서 API
- `GET /api/data/estimates` - 모든 견적서 조회
- `GET /api/data/estimates/{id}` - 특정 견적서 조회
- `GET /api/data/estimates/search?status={상태}` - 견적서 상태별 검색

### 통계 API
- `GET /api/data/stats` - 전체 통계 조회

## 🔧 개발

### 프로젝트 구조
```
DataService/
├── Controllers/
│   └── DataController.cs      # API 컨트롤러
├── Program.cs                 # 애플리케이션 진입점
├── appsettings.json          # 설정 파일
└── DataService.csproj        # 프로젝트 파일
```

### 빌드
```bash
dotnet build
```

### 테스트
```bash
# API 테스트
curl http://localhost:5162/api/data/stats
```

## 📚 문서

자세한 API 문서는 [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)를 참조하세요.

## ⚠️ 알려진 문제

1. **사용자 조회 API**: ✅ NULL 값 처리 문제 해결됨
2. **사용자 검색 API**: ✅ 정상 작동 (한글 검색어는 URL 인코딩 필요)
3. **통계 API**: ✅ 정상 작동
4. **견적서 API**: ✅ 스키마 불일치 문제 해결됨 - 모든 기능 정상 작동

## 🤝 기여

1. 이슈를 생성하거나 기존 이슈를 확인하세요
2. 새로운 브랜치를 생성하세요
3. 변경사항을 커밋하세요
4. Pull Request를 생성하세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 