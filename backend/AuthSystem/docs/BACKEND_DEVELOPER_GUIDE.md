# 백엔드 개발자 가이드

## 📁 프로젝트 구조 및 파일별 기능

### 🔧 Controllers/
#### AuthController.cs
**기능**: 사용자 인증 및 권한 관리
**주요 API**:
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/approve-user/{userId}` - 사용자 승인
- `GET /api/auth/pending-users` - 승인 대기 사용자 목록
- `POST /api/auth/forgot-password` - 비밀번호 재설정 요청
- `POST /api/auth/reset-password` - 비밀번호 재설정
- `POST /api/auth/verify-code` - 인증 코드 검증

**핵심 로직**:
- 커스텀 비밀번호 해시/검증 (SHA256)
- JWT 토큰 생성 및 검증
- 승인 시스템 (IsApproved 관리)
- UserID=Email 일관성 보장

#### AdminController.cs
**기능**: 관리자 전용 기능
**주요 API**:
- `GET /api/admin/users` - 전체 사용자 목록
- `GET /api/admin/users/{userId}` - 특정 사용자 정보
- `PUT /api/admin/users/{userId}` - 사용자 정보 수정
- `DELETE /api/admin/users/{userId}` - 사용자 삭제
- `GET /api/admin/roles` - 역할 목록
- `POST /api/admin/roles` - 역할 생성
- `PUT /api/admin/roles/{roleId}` - 역할 수정
- `DELETE /api/admin/roles/{roleId}` - 역할 삭제

**핵심 로직**:
- 관리자 권한 검증
- 사용자 관리 (CRUD)
- 역할 관리 (CRUD)

#### CustomerController.cs
**기능**: 고객 전용 기능
**주요 API**:
- `GET /api/customer/profile` - 프로필 조회
- `PUT /api/customer/profile` - 프로필 수정
- `PUT /api/customer/change-password` - 비밀번호 변경
- `GET /api/customer/orders` - 주문 내역
- `POST /api/customer/orders` - 주문 생성

**핵심 로직**:
- 고객 권한 검증
- 개인정보 관리
- 주문 관리

#### SalesController.cs
**기능**: 영업 담당자 전용 기능
**주요 API**:
- `GET /api/sales/customers` - 고객 목록
- `GET /api/sales/customers/{customerId}` - 고객 정보
- `PUT /api/sales/customers/{customerId}` - 고객 정보 수정
- `GET /api/sales/orders` - 주문 목록
- `POST /api/sales/orders` - 주문 생성
- `PUT /api/sales/orders/{orderId}` - 주문 수정

**핵심 로직**:
- 영업 담당자 권한 검증
- 고객 관리
- 주문 관리

### 🗄️ Models/
#### User.cs
**기능**: 사용자 엔티티 모델
**주요 필드**:
- `UserID` (Primary Key, Email과 동일)
- `Email`, `Password`, `Name`
- `RoleID`, `IsApproved`, `IsActive`
- `CompanyName`, `BusinessNumber`, `Address`
- `Department`, `Position`, `PhoneNumber`
- `CreatedAt`, `UpdatedAt`, `ApprovedAt`, `ApprovedBy`

#### Role.cs
**기능**: 역할 엔티티 모델
**주요 필드**:
- `RoleID` (Primary Key)
- `RoleName`, `Description`, `IsActive`

#### PasswordResetToken.cs
**기능**: 비밀번호 재설정 토큰 모델
**주요 필드**:
- `Id` (Primary Key)
- `Email`, `VerificationCode`, `ExpiresAt`, `CreatedAt`, `IsUsed`
- `UserID` (외래키, 사용 후 즉시 삭제)
- `IsValid()` 메서드

### 🔧 CommonDbLib/
#### AppDbContext.cs
**기능**: Entity Framework Core DbContext
**주요 설정**:
- MySQL 연결 설정
- 엔티티 관계 설정
- 마이그레이션 관리

### ⚙️ Program.cs
**기능**: 애플리케이션 설정 및 초기화
**주요 설정**:
- 서비스 등록 (DbContext, JWT, CORS 등)
- 미들웨어 설정
- Seed 데이터 생성 (기본 관리자, 역할)

## 🔐 인증 및 권한 시스템

### JWT 토큰 구조
```json
{
  "nameid": "user@email.com",
  "email": "user@email.com",
  "unique_name": "사용자명",
  "FirstName": "이름",
  "LastName": "성",
  "RoleID": "1",
  "RoleName": "Admin",
  "IsApproved": "True",
  "role": "Admin",
  "exp": 1752461657,
  "iss": "FullAuthSystem",
  "aud": "FullAuthSystemUsers"
}
```

### 권한별 접근 제어
- **Admin**: 모든 API 접근 가능
- **Sales**: 고객 관리, 주문 관리
- **Customer**: 개인정보 관리, 주문 조회

## 🛠️ 개발 환경 설정

### 필수 패키지
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
<PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="8.0.0" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
```

### 환경 변수
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=FullAuthSystemDb;User=root;Password=;"
  },
  "JwtSettings": {
    "Key": "your-secret-key-here",
    "Issuer": "FullAuthSystem",
    "Audience": "FullAuthSystemUsers",
    "ExpiryInMinutes": 60
  }
}
```

## 🔄 데이터베이스 마이그레이션

### 명령어
```bash
# 마이그레이션 생성
dotnet ef migrations add MigrationName

# 데이터베이스 업데이트
dotnet ef database update

# 데이터베이스 삭제
dotnet ef database drop --force
```

### Seed 데이터
- 기본 역할: Admin, Sales, Customer
- 기본 관리자: admin@example.com / Admin123!

## ⚠️ 주의사항

### 1. 비밀번호 해시 일관성
- Seed 코드와 실제 인증 코드의 해시 생성 방식이 동일해야 함
- SHA256 + Base64 인코딩 사용

### 2. UserID=Email 일관성
- 모든 사용자에서 UserID와 Email이 동일해야 함
- 회원가입, Seed, 승인 등 모든 로직에서 일관성 유지

### 3. 승인 시스템
- 회원가입 시 IsApproved=false로 설정
- 관리자 승인 후에만 로그인 가능
- approve-user API는 관리자 권한 필요

### 4. 토큰 관리
- PasswordResetToken은 사용 후 즉시 삭제
- 만료된 토큰은 BackgroundService(TokenCleanupService)에서 10분마다 자동 삭제됨
- 운영자가 직접 쿼리로 삭제할 필요 없음
- JWT 토큰은 설정된 만료 시간 후 자동 만료

## 🧪 테스트 방법

### 1. 기본 관리자 로그인
```bash
curl -X POST "http://localhost:5236/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin123!", "rememberMe": false}'
```

### 2. 회원가입 → 승인 → 로그인 플로우
```bash
# 1. 회원가입
curl -X POST "http://localhost:5236/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!", ...}'

# 2. 관리자 로그인
curl -X POST "http://localhost:5236/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin123!"}'

# 3. 사용자 승인
curl -X POST "http://localhost:5236/api/auth/approve-user/test@example.com" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 4. 승인된 사용자 로그인
curl -X POST "http://localhost:5236/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!"}'
``` 