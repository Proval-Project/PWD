# 📚 프로젝트 문서 모음

이 폴더에는 FullAuthSystem 프로젝트의 모든 문서가 체계적으로 정리되어 있습니다.

## 📋 문서 목차

### 🚀 **시작하기**
- **[README.md](./README.md)** - 프로젝트 개요 및 기본 가이드
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - 프로젝트 요약 및 주요 변경사항

### 👨‍💻 **개발자 가이드**
- **[BACKEND_DEVELOPER_GUIDE.md](./BACKEND_DEVELOPER_GUIDE.md)** - 백엔드 개발자를 위한 상세 가이드
- **[WINDOWS_DEVELOPMENT_GUIDE.md](./WINDOWS_DEVELOPMENT_GUIDE.md)** - Windows 환경 개발 가이드

### 🌐 **프론트엔드 가이드**
- **[FRONTEND_API_GUIDE.md](./FRONTEND_API_GUIDE.md)** - 프론트엔드 개발자를 위한 API 가이드
- **[FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)** - 프론트엔드 연동 가이드

### 🗄️ **데이터베이스 가이드**
- **[DATABASE_QUERIES.md](./DATABASE_QUERIES.md)** - 데이터베이스 쿼리 가이드

### 📊 **검증 및 품질**
- **[CODE_VERIFICATION_REPORT.md](./CODE_VERIFICATION_REPORT.md)** - 코드 검증 보고서

## 📖 문서별 상세 설명

### 🚀 **시작하기**

#### README.md
- 프로젝트 개요 및 기능 설명
- 설치 및 실행 방법
- API 엔드포인트 목록
- 기본 사용자 정보
- 사용 예시 및 테스트 시나리오

#### PROJECT_SUMMARY.md
- 프로젝트 주요 수정사항
- 데이터베이스 구조 (Name 필드 통합 반영)
- 인증 플로우 설명
- 기본 사용자 및 역할 정보
- 주요 API 엔드포인트
- 보안 특징
- 테스트 시나리오

### 👨‍💻 **개발자 가이드**

#### BACKEND_DEVELOPER_GUIDE.md
- 프로젝트 구조 및 파일별 기능
- 인증 및 권한 시스템
- 개발 환경 설정
- 데이터베이스 마이그레이션
- 주의사항 및 테스트 방법

#### WINDOWS_DEVELOPMENT_GUIDE.md
- Windows 환경 설정
- Visual Studio 사용법
- 프로젝트 실행 방법
- 문제 해결 가이드
- 코딩 컨벤션

### 🌐 **프론트엔드 가이드**

#### FRONTEND_API_GUIDE.md
- 인증 API 상세 가이드 (Name 필드 통합 반영)
- 사용자 관리 API
- 고객 API
- 영업 API
- 에러 코드 및 응답 형식
- 사용 예시

#### FRONTEND_INTEGRATION_GUIDE.md
- JWT 토큰 관리
- 권한별 UI 구성
- 파일 업로드
- 이메일 서비스
- 보안 고려사항

### 🗄️ **데이터베이스 가이드**

#### DATABASE_QUERIES.md
- 데이터베이스 개요
- 테이블 구조 (Name 필드 통합 반영)
- 기본 쿼리 (SELECT, INSERT, UPDATE, DELETE)
- 관리자용 쿼리
- 통계 쿼리
- 검색 쿼리
- 유지보수 쿼리
- 백업 및 복원

### 📊 **검증 및 품질**

#### CODE_VERIFICATION_REPORT.md
- 실제 코드와 문서 비교 검증
- API 엔드포인트 정확성 확인
- 응답 형식 검증
- 발견된 차이점 및 수정 권장사항
- 검증 통계 (92% 정확도)

## 🎯 **문서 사용 가이드**

### 새로운 개발자라면
1. **[README.md](./README.md)** - 프로젝트 개요 파악
2. **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - 주요 변경사항 확인
3. **[BACKEND_DEVELOPER_GUIDE.md](./BACKEND_DEVELOPER_GUIDE.md)** - 개발 환경 설정
4. **[DATABASE_QUERIES.md](./DATABASE_QUERIES.md)** - 데이터베이스 이해

### 프론트엔드 개발자라면
1. **[FRONTEND_API_GUIDE.md](./FRONTEND_API_GUIDE.md)** - API 사용법 학습
2. **[FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)** - 연동 방법 확인

### 백엔드 개발자라면
1. **[BACKEND_DEVELOPER_GUIDE.md](./BACKEND_DEVELOPER_GUIDE.md)** - 개발 환경 설정
2. **[DATABASE_QUERIES.md](./DATABASE_QUERIES.md)** - 데이터베이스 관리
3. **[CODE_VERIFICATION_REPORT.md](./CODE_VERIFICATION_REPORT.md)** - 코드 정확성 확인

### 관리자라면
1. **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - 프로젝트 현황 파악
2. **[DATABASE_QUERIES.md](./DATABASE_QUERIES.md)** - 데이터베이스 관리
3. **[CODE_VERIFICATION_REPORT.md](./CODE_VERIFICATION_REPORT.md)** - 품질 확인

## 📝 **문서 업데이트 기록**

### 2024년 12월 14일
- ✅ 모든 마크다운 파일을 `docs` 폴더로 이동
- ✅ 문서 목차 및 설명 추가
- ✅ 실제 프로젝트 구조와 일치하도록 수정
- ✅ 데이터베이스 쿼리 가이드 추가
- ✅ **FirstName/LastName → Name 통합 반영**
- ✅ 모든 API 문서에서 이름 필드 통합 반영
- ✅ 데이터베이스 스키마 및 쿼리 업데이트

### 주요 변경사항
- Identity 의존성 제거 내용 반영
- 실제 API 엔드포인트와 일치하도록 수정
- 프로젝트 구조 업데이트
- 데이터베이스 스키마 정확성 확보
- **사용자 이름 필드 통합 (FirstName/LastName → Name)**

### 🆕 최근 주요 변경사항
- 비밀번호 재설정 토큰(VerificationCode) 만료 시 DB에서 자동 삭제 (BackgroundService)
- 운영자가 직접 쿼리로 삭제할 필요 없음
- PasswordResetToken 모델 UsedAt 필드 없음, 삭제 기준은 CreatedAt
- docs 내 모든 토큰 관리/정책/운영 방식 최신화

## 🔗 **관련 링크**

- **GitHub 저장소**: https://github.com/Proval-Project/PWD.git
- **Swagger UI**: http://localhost:5236/swagger
- **기본 관리자 계정**: admin@example.com / Admin123!

## 📞 **지원**

문서에 대한 질문이나 개선 제안이 있으시면:
1. GitHub Issues 등록
2. 팀 리드에게 문의
3. 프로젝트 채널로 연락

---

**최종 업데이트**: 2024년 12월 14일  
**문서 버전**: 2.0  
**프로젝트**: FullAuthSystem  
**주요 변경**: FirstName/LastName → Name 통합