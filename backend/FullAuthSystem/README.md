# FullAuthSystem

ASP.NET Core 8.0을 사용한 완전한 인증 시스템입니다. JWT 토큰 기반 인증과 역할 기반 권한 관리를 제공합니다.

## 기능

- **사용자 인증**: 회원가입, 로그인, 로그아웃
- **JWT 토큰 인증**: 보안된 API 접근
- **역할 기반 권한 관리**: Admin, Sales, Customer 역할
- **사용자 관리**: 관리자용 사용자 CRUD 기능
- **프로필 관리**: 사용자 프로필 조회 및 수정
- **비밀번호 변경**: 사용자 비밀번호 변경
- **비밀번호 재설정**: 이메일 인증을 통한 비밀번호 재설정
- **사용자 승인 시스템**: 관리자 승인 후 로그인 가능
- **사용자 히스토리 관리**: 역할별 권한이 분리된 히스토리 시스템
- **기업 정보 관리**: 회사명, 사업자번호, 주소 등 기업 정보
- **담당자 정보 관리**: 부서, 직책, 연락처 등 담당자 정보

## 프로젝트 구조

```
FullAuthSystem/
├── Controllers/
│   ├── AdminController.cs          # 관리자 기능
│   ├── AuthController.cs           # 인증 관련 기능
│   ├── CustomerController.cs       # 고객 기능
│   ├── SalesController.cs          # 영업 기능
│   └── UserHistoryController.cs    # 히스토리 관리
├── Data/
│   └── ApplicationDbContext.cs     # Entity Framework 컨텍스트
├── Models/
│   ├── ApplicationUser.cs          # 사용자 모델
│   ├── UserHistory.cs              # 히스토리 모델
│   └── PasswordResetToken.cs       # 비밀번호 재설정 토큰
├── Models/DTOs/
│   ├── RegisterRequest.cs          # 회원가입 요청
│   ├── UserProfileDto.cs           # 사용자 프로필
│   ├── UserHistoryDto.cs           # 히스토리 DTO
│   └── PasswordResetDto.cs         # 비밀번호 재설정 DTO
├── Services/
│   ├── IEmailService.cs            # 이메일 서비스 인터페이스
│   └── EmailService.cs             # 이메일 서비스 구현
├── appsettings.json               # 설정 파일
├── Program.cs                     # 애플리케이션 진입점
└── FullAuthSystem.csproj          # 프로젝트 파일
```

## 기술 스택

- **.NET 8.0**
- **ASP.NET Core Web API**
- **Entity Framework Core**
- **ASP.NET Core Identity**
- **JWT Bearer Authentication**
- **MySQL** (개발 환경: localhost, root 계정)
- **이메일 서비스** (개발 환경: 콘솔 출력)

## 설치 및 실행

### 필수 요구사항

- .NET 8.0 SDK
- MySQL Server

### 실행 방법

1. 프로젝트 디렉토리로 이동:
   ```bash
   cd FullAuthSystem
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

5. 브라우저에서 Swagger UI 접속:
   ```
   http://localhost:5236/swagger
   ```

## API 엔드포인트

### 인증 (AuthController)

- `POST /api/auth/register` - 사용자 등록
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/forgot-password` - 비밀번호 재설정 요청 (1단계: 이메일 입력)
- `POST /api/auth/verify-reset-code` - 인증 코드 확인 (2단계: 인증 코드 입력)
- `POST /api/auth/reset-password` - 비밀번호 재설정 (3단계: 새 비밀번호 설정)
- `GET /api/auth/pending-users` - 승인 대기 사용자 목록 (관리자만)
- `POST /api/auth/approve-user/{userId}` - 사용자 승인 (관리자만)
- `POST /api/auth/reject-user/{userId}` - 사용자 거부 (관리자만)
- `GET /api/auth/check-auth` - 인증 상태 확인

### 관리자 (AdminController) - Admin 역할 필요

- `GET /api/admin/users` - 모든 사용자 조회
- `GET /api/admin/users/{id}` - 특정 사용자 조회
- `PUT /api/admin/users/{id}` - 사용자 정보 수정
- `PUT /api/admin/users/{id}/role` - 사용자 역할 변경
- `PUT /api/admin/users/{id}/status` - 사용자 상태 변경
- `DELETE /api/admin/users/{id}` - 사용자 삭제
- `GET /api/admin/dashboard` - 대시보드 통계
- `GET /api/admin/pending-users` - 승인 대기 사용자 목록

### 고객 (CustomerController) - Customer 역할 필요

- `GET /api/customer/profile` - 프로필 조회
- `PUT /api/customer/profile` - 프로필 수정
- `POST /api/customer/change-password` - 비밀번호 변경
- `GET /api/customer/my-history` - 본인 히스토리 조회
- `POST /api/customer/my-history` - 본인 히스토리 생성
- `PUT /api/customer/my-history/{id}` - 본인 히스토리 수정
- `DELETE /api/customer/my-history/{id}` - 본인 히스토리 삭제
- `GET /api/customer/orders` - 주문 내역 조회
- `GET /api/customer/support-tickets` - 고객 지원 티켓 조회

### 영업 (SalesController) - Sales 역할 필요

- `GET /api/sales/customers` - 고객 목록 조회
- `GET /api/sales/customers/{id}` - 특정 고객 조회
- `GET /api/sales/customers/{id}/history` - 고객 히스토리 조회
- `POST /api/sales/customers/{id}/history` - 고객 히스토리 생성
- `PUT /api/sales/customers/{customerId}/history/{historyId}` - 고객 히스토리 수정
- `DELETE /api/sales/customers/{customerId}/history/{historyId}` - 고객 히스토리 삭제
- `GET /api/sales/leads` - 리드 목록 조회
- `POST /api/sales/leads` - 리드 생성
- `PUT /api/sales/leads/{id}` - 리드 수정
- `GET /api/sales/sales-report` - 매출 보고서
- `GET /api/sales/performance` - 개인 성과 조회

### 히스토리 관리 (UserHistoryController) - 인증 필요

- `GET /api/userhistory` - 모든 히스토리 조회 (Admin, Sales만)
- `GET /api/userhistory/{id}` - 특정 히스토리 조회
- `GET /api/userhistory/user/{userId}` - 특정 사용자 히스토리 조회
- `POST /api/userhistory` - 히스토리 생성 (Admin, Sales만)
- `POST /api/userhistory/my-history` - 본인 히스토리 생성 (Customer만)
- `PUT /api/userhistory/{id}` - 히스토리 수정
- `DELETE /api/userhistory/{id}` - 히스토리 삭제
- `GET /api/userhistory/category/{category}` - 카테고리별 조회 (Admin, Sales만)
- `GET /api/userhistory/status/{status}` - 상태별 조회 (Admin, Sales만)

## 기본 사용자

시스템 초기화 시 다음 기본 관리자 계정이 생성됩니다:

- **이메일**: admin@example.com
- **비밀번호**: Admin123!
- **역할**: Admin

## 사용 예시

### 1. 사용자 등록 (기업 정보 포함)

```bash
curl -X POST "http://localhost:5236/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "firstName": "홍",
    "lastName": "길동",
    "role": "Customer",
    "companyName": "테스트기업",
    "businessNumber": "123-45-67890",
    "address": "서울시 강남구 테스트로 123",
    "companyPhone": "02-1234-5678",
    "department": "영업부",
    "position": "과장",
    "contactPhone": "010-1234-5678"
  }'
```

### 2. 로그인

```bash
curl -X POST "http://localhost:5236/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "rememberMe": false
  }'
```

### 3. 인증된 API 호출

```bash
curl -X GET "http://localhost:5236/api/admin/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. 비밀번호 재설정

#### 4-1. 비밀번호 재설정 요청 (이메일 입력)
```bash
curl -X POST "http://localhost:5236/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

#### 4-2. 인증 코드 확인
```bash
curl -X POST "http://localhost:5236/api/auth/verify-reset-code" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "verificationCode": "123456"
  }'
```

#### 4-3. 새 비밀번호 설정
```bash
curl -X POST "http://localhost:5236/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "verificationCode": "123456",
    "newPassword": "NewPassword123!",
    "confirmPassword": "NewPassword123!"
  }'
```

### 5. 히스토리 생성

```bash
curl -X POST "http://localhost:5236/api/userhistory" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "title": "상품 문의",
    "description": "A제품의 가격과 배송일정에 대해 문의드립니다.",
    "category": "문의",
    "status": "진행중"
  }'
```

### 6. 사용자 승인 (관리자)

```bash
curl -X POST "http://localhost:5236/api/auth/approve-user/user123" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## 데이터 모델

### 사용자 정보 (ApplicationUser)
- 기본 정보: 이메일, 이름, 역할
- 기업 정보: 회사명, 사업자번호, 주소, 회사전화
- 담당자 정보: 부서, 직책, 연락처
- 상태 정보: 승인여부, 활성화여부, 생성/수정시간

### 히스토리 정보 (UserHistory)
- 기본 정보: 제목, 설명, 카테고리, 상태
- 시간 정보: 생성시간, 수정시간
- 사용자 정보: 생성자, 수정자
- 권한: 역할별 접근 제어

## 권한 체계

### 고객 (Customer)
- 본인 프로필 조회/수정
- 본인 히스토리 조회/생성/수정/삭제
- 본인 주문/문의 조회

### 영업부 (Sales)
- 모든 고객 정보 조회
- 모든 고객 히스토리 관리
- 리드 관리
- 매출/성과 조회

### 관리자 (Admin)
- 모든 사용자 관리
- 사용자 승인/거부
- 모든 히스토리 관리
- 시스템 통계 조회

## 설정

### appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=FullAuthSystemDb;User=root;Password=;"
  },
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyHere12345678901234567890",
    "Issuer": "FullAuthSystem",
    "Audience": "FullAuthSystemUsers",
    "ExpirationInMinutes": 60
  }
}
```

## 프론트엔드 연동 가이드

### 1. JWT 토큰 관리
- 로그인 시 받은 토큰을 localStorage/sessionStorage에 저장
- 모든 API 요청 시 Authorization 헤더에 포함
- 토큰 만료 시 자동 로그아웃 처리

### 2. 권한별 UI 구성
- 사용자 역할에 따라 메뉴/기능 표시/숨김
- API 호출 전 클라이언트 측 권한 확인
- 권한 없는 기능 접근 시 에러 처리

### 3. 파일 업로드 (향후 구현 예정)
- PDF, XML, CSV 파일 업로드 지원
- 이메일 해시 기반 폴더 구조
- 파일명 난독화 (원본명 + 타임스탬프)

### 4. 이메일 서비스
- 개발 환경: 콘솔에 이메일 내용 출력
- 프로덕션 환경: SMTP 설정 필요

## 보안 고려사항

1. **JWT Secret Key**: 프로덕션 환경에서는 강력한 비밀키를 사용하세요.
2. **HTTPS**: 프로덕션 환경에서는 HTTPS를 사용하세요.
3. **비밀번호 정책**: 강력한 비밀번호 정책을 적용하세요.
4. **CORS**: 필요한 도메인만 허용하도록 CORS를 설정하세요.
5. **파일 업로드**: 파일 타입, 크기 제한 및 바이러스 스캔을 적용하세요.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 