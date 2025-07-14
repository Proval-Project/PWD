# FullAuthSystem

ASP.NET Core 8.0을 사용한 완전한 인증 시스템입니다. JWT 토큰 기반 인증과 역할 기반 권한 관리를 제공합니다. Identity 의존성을 제거하고 커스텀 인증 시스템으로 구현했습니다.

## 📚 문서

모든 프로젝트 문서는 **[docs](./docs/)** 폴더에 체계적으로 정리되어 있습니다.

### 🚀 빠른 시작
- **[프로젝트 개요](./docs/README.md)** - 프로젝트 소개 및 기본 가이드
- **[프로젝트 요약](./docs/PROJECT_SUMMARY.md)** - 주요 변경사항 및 기능 설명

### 👨‍💻 개발자 가이드
- **[백엔드 개발자 가이드](./docs/BACKEND_DEVELOPER_GUIDE.md)** - 상세한 개발 가이드
- **[Windows 개발 가이드](./docs/WINDOWS_DEVELOPMENT_GUIDE.md)** - Windows 환경 설정

### 🌐 프론트엔드 가이드
- **[API 가이드](./docs/FRONTEND_API_GUIDE.md)** - 프론트엔드 개발자를 위한 API 문서
- **[연동 가이드](./docs/FRONTEND_INTEGRATION_GUIDE.md)** - 프론트엔드 연동 방법

### 🗄️ 데이터베이스
- **[쿼리 가이드](./docs/DATABASE_QUERIES.md)** - 데이터베이스 관리 및 쿼리

### 📊 품질 관리
- **[코드 검증 보고서](./docs/CODE_VERIFICATION_REPORT.md)** - 문서 정확성 검증

## 🚀 빠른 실행

### 필수 요구사항
- .NET 8.0 SDK
- MySQL Server

### 실행 방법

1. 프로젝트 디렉토리로 이동:
   ```bash
   cd AuthSystem
   ```

2. 의존성 복원:
   ```bash
   dotnet restore
   ```

3. 데이터베이스 마이그레이션:
   ```bash
   dotnet ef database update
   ```

4. 애플리케이션 실행:
   ```bash
   dotnet run
   ```

5. Swagger UI 접속:
   ```
   http://localhost:5236/swagger
   ```

## 👥 기본 사용자

시스템 초기화 시 다음 기본 관리자 계정이 생성됩니다:

- **이메일**: admin@example.com
- **비밀번호**: Admin123!
- **역할**: Admin

## 🔗 주요 링크

- **GitHub 저장소**: https://github.com/Proval-Project/PWD.git
- **Swagger UI**: http://localhost:5236/swagger
- **문서 모음**: [docs](./docs/) 폴더

## 📞 지원

- **문서 관련**: [docs](./docs/) 폴더의 문서들을 참조하세요
- **GitHub Issues**: https://github.com/Proval-Project/PWD/issues
- **팀 문의**: 프로젝트 리드에게 연락

---

**프로젝트**: FullAuthSystem  
**버전**: 1.0  
**최종 업데이트**: 2024년 12월 14일 