# 백엔드 시스템 가이드

## 📚 프로젝트 개요

이 프로젝트는 ASP.NET Core 8.0 기반의 풀스택 인증 시스템입니다. JWT 토큰 인증, 역할 기반 권한 관리, 데이터 조회 API를 제공합니다.

## 🏗️ 아키텍처

```
backend/
├── CommonDbLib/     # 공통 데이터베이스 라이브러리
├── AuthSystem/      # 인증 시스템 (포트 5236)
├── DataService/     # 데이터 조회 API (포트 5162)
├── start-backend.sh # 통합 실행 스크립트
└── docker-compose.yml # Docker 실행 설정
```

## 🚀 빠른 시작

### 방법 1: 스크립트로 한 번에 실행 (추천)
```bash
cd backend
./start-backend.sh
```

### 방법 2: 개별 실행
```bash
# AuthSystem만 실행
cd backend/AuthSystem && dotnet run

# DataService만 실행  
cd backend/DataService && dotnet run
```

### 방법 3: Docker Compose (고급)
```bash
cd backend
docker-compose up
```

## 📍 서비스 정보

| 서비스 | 포트 | 용도 | Swagger | 상태 |
|--------|------|------|---------|------|
| AuthSystem | 5236 | 인증/로그인/관리 | http://localhost:5236/swagger | ✅ 정상 |
| DataService | 5162 | 데이터 조회 API | http://localhost:5162/swagger | ✅ 정상 |

## 🔧 사전 요구사항

1. **.NET 8.0 SDK** 설치
2. **MySQL 8.0** 실행 중
3. **데이터베이스 마이그레이션** 완료

## 📋 초기 설정

### 1. 의존성 복원
```bash
cd backend/CommonDbLib && dotnet restore
cd ../AuthSystem && dotnet restore  
cd ../DataService && dotnet restore
```

### 2. 데이터베이스 마이그레이션
```bash
cd backend/DataService && dotnet ef database update
```

### 3. 서비스 실행
```bash
cd backend && ./start-backend.sh
```

## 🔐 기본 계정

- **관리자**: admin@example.com / Admin123!
- **역할**: Admin, Sales, Customer

## 📊 API 기능

### AuthSystem (인증 시스템)
- ✅ JWT 토큰 인증
- ✅ 사용자 등록/로그인
- ✅ 관리자 승인 시스템
- ✅ 비밀번호 재설정
- ✅ 역할 기반 권한 관리

### DataService (데이터 API)
- ✅ 사용자 정보 조회
- ✅ 견적서 정보 조회
- ✅ 통계 데이터 제공
- ✅ 검색 기능

## 🛑 서비스 중지

- **스크립트 실행 시**: `Ctrl+C`
- **개별 실행 시**: `Ctrl+C` (각 터미널에서)
- **Docker 실행 시**: `docker-compose down`

## 🔍 문제 해결

### 포트 충돌 시
```bash
# 실행 중인 프로세스 확인
lsof -i :5236
lsof -i :5162

# 프로세스 종료
kill -9 [PID]
```

### 데이터베이스 연결 오류 시
```bash
# MySQL 상태 확인
mysql -u root -p -e "SHOW DATABASES;"
```

### 스키마 불일치 시
```bash
# 마이그레이션 재실행
cd backend/DataService && dotnet ef database update
```

## 📚 상세 문서

- **[AuthSystem 문서](./AuthSystem/docs/)** - 인증 시스템 상세 가이드
- **[DataService 문서](./DataService/docs/)** - 데이터 API 문서
- **[프론트엔드 API 가이드](./AuthSystem/docs/FRONTEND_API_GUIDE.md)** - 프론트엔드 연동 가이드

## 🚀 최근 업데이트

- ✅ DataService 프로젝트 추가
- ✅ 견적서 API 스키마 불일치 문제 해결
- ✅ 통합 실행 스크립트 구현
- ✅ Docker Compose 설정 추가
- ✅ 모든 API 정상 작동 확인 