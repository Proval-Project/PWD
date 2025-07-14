# FullAuthSystem 프로젝트 요약

## 📋 프로젝트 개요

ASP.NET Core 8.0 기반의 완전한 인증 시스템으로, MySQL과 JWT 인증을 사용합니다. Identity 의존성을 완전히 제거하고 커스텀 인증 시스템을 구현했습니다.

## 🔧 주요 수정사항

### 1. Identity 완전 제거
- **UserManager, SignInManager 등 Identity 의존성 제거**
- **DbContext와 직접 구현한 비밀번호 해시/검증 함수로 인증 로직 대체**
- **커스텀 User 모델 사용 (IdentityUser 상속 제거)**

### 2. 비밀번호 해시 통일
- **문제**: Seed 코드와 실제 인증 코드의 해시 생성 방식 불일치
- **해결**: Seed 코드에서도 실제 인증 코드와 동일한 해시 생성 함수 사용
- **결과**: DB 초기화 시 올바른 해시값으로 관리자 계정 생성

### 3. 승인(Approve) 로직 개선
- **문제**: approve-user API에서 UserID/Email 조회 불일치
- **해결**: `FirstOrDefaultAsync(u => u.UserID == userId || u.Email == userId)`로 조회 범위 확장
- **결과**: UserID 또는 Email로 모두 승인 가능

### 4. UserID=Email 일관성 보장
- **회원가입 시**: `UserID = model.Email`로 설정
- **Seed 코드**: `UserID = "admin@example.com"`로 설정
- **모든 로직에서**: UserID와 Email이 동일하게 처리

## 🗄️ 데이터베이스 구조

### Users 테이블
```sql
CREATE TABLE `Users` (
    `UserID` varchar(50) NOT NULL,           -- Primary Key (Email과 동일)
    `Password` varchar(100) NOT NULL,         -- SHA256 해시된 비밀번호
    `Name` varchar(50) NOT NULL,              -- 사용자 이름
    `PhoneNumber` varchar(20) NULL,           -- 전화번호
    `RoleID` int NOT NULL,                    -- 역할 ID (FK)
    `Email` varchar(100) NOT NULL,            -- 이메일 (UserID와 동일)
    `FirstName` varchar(50) NOT NULL,         -- 이름
    `LastName` varchar(50) NOT NULL,          -- 성
    `IsApproved` tinyint(1) NOT NULL,        -- 승인 여부 (기본값: false)
    `ApprovedAt` datetime(6) NULL,            -- 승인 시간
    `ApprovedBy` varchar(50) NULL,            -- 승인자
    `IsActive` tinyint(1) NOT NULL,           -- 활성화 여부 (기본값: true)
    `CreatedAt` datetime(6) NOT NULL,         -- 생성 시간
    `UpdatedAt` datetime(6) NULL,             -- 수정 시간
    `CompanyName` varchar(100) NULL,          -- 회사명
    `BusinessNumber` varchar(20) NULL,        -- 사업자번호
    `Address` varchar(200) NULL,              -- 주소
    `CompanyPhone` varchar(20) NULL,          -- 회사전화
    `Department` varchar(50) NULL,            -- 부서
    `Position` varchar(50) NULL,              -- 직책
    `ContactPhone` varchar(20) NULL,          -- 연락처
    PRIMARY KEY (`UserID`),
    FOREIGN KEY (`RoleID`) REFERENCES `Roles` (`RoleID`) ON DELETE CASCADE
);
```

### Roles 테이블
```sql
CREATE TABLE `Roles` (
    `RoleID` int NOT NULL AUTO_INCREMENT,     -- Primary Key
    `RoleName` varchar(50) NOT NULL,          -- 역할명 (Admin, Sales, Customer)
    `Description` varchar(200) NULL,           -- 설명
    `IsActive` tinyint(1) NOT NULL,           -- 활성화 여부
    PRIMARY KEY (`RoleID`)
);
```

### PasswordResetTokens 테이블
```sql
CREATE TABLE `PasswordResetTokens` (
    `Id` int NOT NULL AUTO_INCREMENT,         -- Primary Key
    `Email` varchar(100) NOT NULL,            -- 이메일
    `UserID` varchar(50) NULL,                -- 사용자 ID (FK)
    `VerificationCode` varchar(6) NOT NULL,   -- 인증 코드
    `CreatedAt` datetime(6) NOT NULL,         -- 생성 시간
    `ExpiresAt` datetime(6) NOT NULL,         -- 만료 시간
    `IsUsed` tinyint(1) NOT NULL,             -- 사용 여부
    `UsedAt` datetime(6) NULL,                -- 사용 시간
    PRIMARY KEY (`Id`)
);
```

## 🔐 인증 플로우

### 1. 회원가입 → 승인대기 → 관리자 승인 → 로그인
```
1. 회원가입 (/api/auth/register)
   - UserID=Email로 사용자 생성
   - IsApproved=false (승인 대기 상태)
   - IsActive=true

2. 승인 전 로그인 시도
   - "관리자 승인이 필요한 계정입니다" 메시지로 거부

3. 관리자 승인 (/api/auth/approve-user/{userId})
   - UserID 또는 Email로 사용자 조회
   - IsApproved=true, ApprovedAt, ApprovedBy 설정

4. 승인 후 로그인
   - 정상적으로 JWT 토큰 발급
   - 로그인 성공
```

### 2. 비밀번호 재설정 플로우
```
1. 비밀번호 재설정 요청 (/api/auth/forgot-password)
   - 이메일 입력
   - 6자리 인증 코드 생성
   - PasswordResetTokens 테이블에 저장

2. 인증 코드 확인 (/api/auth/verify-reset-code)
   - 이메일 + 인증 코드 입력
   - 유효성 검증

3. 새 비밀번호 설정 (/api/auth/reset-password)
   - 새 비밀번호 입력
   - 비밀번호 변경 후 토큰 즉시 삭제
```

## 👥 기본 사용자

### 관리자 계정 (Seed로 자동 생성)
- **이메일**: admin@example.com
- **비밀번호**: Admin123!
- **역할**: Admin
- **상태**: 승인됨 (IsApproved=true)

### 역할 정보
- **Admin (RoleID=1)**: 관리자 기능, 사용자 승인/거부
- **Sales (RoleID=2)**: 영업 기능, 고객 관리
- **Customer (RoleID=3)**: 고객 기능, 프로필 관리

## 🛠️ 주요 API 엔드포인트

### 인증 (AuthController)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/check-auth` - 인증 상태 확인
- `GET /api/auth/pending-users` - 승인 대기 사용자 목록 (Admin)
- `POST /api/auth/approve-user/{userId}` - 사용자 승인 (Admin)
- `POST /api/auth/reject-user/{userId}` - 사용자 거부 (Admin)
- `POST /api/auth/forgot-password` - 비밀번호 재설정 요청
- `POST /api/auth/verify-reset-code` - 인증 코드 확인
- `POST /api/auth/reset-password` - 새 비밀번호 설정

### 관리자 (AdminController)
- `GET /api/admin/users` - 모든 사용자 조회
- `GET /api/admin/users/{id}` - 특정 사용자 조회
- `PUT /api/admin/users/{id}` - 사용자 정보 수정
- `PUT /api/admin/users/{id}/role` - 사용자 역할 변경
- `PUT /api/admin/users/{id}/status` - 사용자 상태 변경
- `DELETE /api/admin/users/{id}` - 사용자 삭제
- `GET /api/admin/dashboard` - 대시보드 통계
- `GET /api/admin/pending-users` - 승인 대기 사용자 목록

### 고객 (CustomerController)
- `GET /api/customer/profile` - 프로필 조회
- `PUT /api/customer/profile` - 프로필 수정
- `POST /api/customer/change-password` - 비밀번호 변경
- `GET /api/customer/orders` - 주문 조회
- `GET /api/customer/support-tickets` - 문의 조회

### 영업 (SalesController)
- `GET /api/sales/customers` - 고객 목록 조회
- `GET /api/sales/customers/{id}` - 특정 고객 조회
- `GET /api/sales/leads` - 리드 조회
- `POST /api/sales/leads` - 리드 생성
- `GET /api/sales/reports` - 매출 보고서
- `GET /api/sales/performance` - 성과 조회
- `GET /api/sales/pending-customers` - 승인 대기 고객 목록

## 🔒 보안 특징

### 1. 비밀번호 보안
- **SHA256 해시**: 평문 저장 금지
- **일관된 해시 생성**: Seed와 인증 코드에서 동일한 방식 사용

### 2. 승인 시스템
- **관리자 승인 필수**: 회원가입 후 자동 승인 안 됨
- **승인 전 로그인 불가**: 보안 강화

### 3. 토큰 관리
- **JWT 토큰**: 인증 및 권한 관리
- **비밀번호 재설정 토큰**: 사용 후 즉시 삭제

### 4. 권한 기반 접근 제어
- **역할별 API 접근 제어**: Admin, Sales, Customer
- **사용자별 데이터 접근 제어**: 본인 데이터만 접근 가능

## 🚀 실행 방법

### 1. 데이터베이스 초기화
```bash
cd AuthSystem
dotnet ef database drop --force
dotnet ef database update
```

### 2. 애플리케이션 실행
```bash
dotnet run
```

### 3. Swagger UI 접속
```
http://localhost:5236/swagger
```

## 📝 테스트 시나리오

### 1. 기본 관리자 로그인
```bash
curl -X POST "http://localhost:5236/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin123!", "rememberMe": false}'
```

### 2. 신규 사용자 회원가입
```bash
curl -X POST "http://localhost:5236/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "Customer123!", "confirmPassword": "Customer123!", "firstName": "고객", "lastName": "테스트", "roleID": 3, "companyName": "고객기업", "businessNumber": "987-65-43210", "address": "서울시 서초구 고객로 456", "companyPhone": "02-9876-5432", "department": "구매부", "position": "대리", "contactPhone": "010-9876-5432"}'
```

### 3. 관리자 승인
```bash
curl -X POST "http://localhost:5236/api/auth/approve-user/customer@example.com" \
  -H "Authorization: Bearer {ADMIN_JWT_TOKEN}"
```

### 4. 승인 후 로그인
```bash
curl -X POST "http://localhost:5236/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "Customer123!", "rememberMe": false}'
```

## ⚠️ 주의사항

### 1. 비밀번호 해시 일관성
- Seed 코드와 인증 코드에서 동일한 해시 생성 함수 사용 필수
- 하드코딩된 해시값 사용 금지

### 2. UserID=Email 일관성
- 모든 사용자에서 UserID와 Email이 동일해야 함
- 승인 API에서 UserID/Email 모두로 조회 가능

### 3. 승인 시스템
- 회원가입 시 무조건 IsApproved=false로 생성
- 관리자 승인 후에만 로그인 가능

## 🔄 향후 개선 방향

### 1. 코드 품질 개선
- 경고 메시지 정리 (CS8618, CS1998)
- 비동기 메서드 최적화

### 2. 기능 확장
- 이메일 서비스 실제 구현
- 파일 업로드 기능
- 로그 시스템 강화

### 3. 보안 강화
- 비밀번호 정책 강화
- 토큰 만료 시간 조정
- CORS 설정 최적화

---

**최종 업데이트**: 2024년 12월 14일  
**프로젝트 상태**: ✅ 정상 동작  
**테스트 완료**: 회원가입 → 승인 → 로그인 플로우 