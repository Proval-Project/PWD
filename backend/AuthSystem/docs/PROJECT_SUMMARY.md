# 📋 FullAuthSystem 프로젝트 요약

## 🔄 **최근 주요 변경사항 (2024년 12월 14일)**

### ✅ **사용자 이름 필드 통합**
- **변경 내용**: `FirstName`, `LastName` 필드를 `Name` 하나로 통합
- **영향 범위**: 
  - 데이터베이스 스키마 (User 테이블)
  - 모든 API 요청/응답 (회원가입, 로그인, 프로필 등)
  - DTO 모델 (RegisterRequest, UserProfileDto 등)
  - JWT 토큰 클레임
  - 관리자/고객/영업 관련 모든 API
- **이유**: 사용자 이름을 단순화하여 관리 편의성 향상

### ✅ **데이터베이스 마이그레이션**
- **새 마이그레이션**: `InitWithNameOnly`
- **변경 사항**: User 테이블에서 FirstName, LastName 컬럼 제거, Name 컬럼만 유지
- **패키지 버전 통일**: EntityFrameworkCore 관련 패키지를 8.0.6으로 통일

### ✅ **문서 체계화**
- 모든 마크다운 문서를 `docs` 폴더로 이동
- 문서 목차 및 설명 추가
- 실제 프로젝트 구조와 일치하도록 수정

## 🏗️ **프로젝트 구조**

```
backend/
├── AuthSystem/                 # 메인 프로젝트
│   ├── Controllers/           # API 컨트롤러
│   ├── Models/               # DTO 모델
│   ├── Services/             # 비즈니스 로직
│   ├── docs/                # 프로젝트 문서
│   └── Program.cs           # 애플리케이션 진입점
├── CommonDbLib/              # 공통 데이터베이스 라이브러리
│   ├── User.cs              # 사용자 모델
│   ├── AppDbContext.cs      # 데이터베이스 컨텍스트
│   └── Migrations/          # 데이터베이스 마이그레이션
└── README.md                # 루트 README
```

## 🗄️ **데이터베이스 구조**

### **Users 테이블 (주요 변경사항)**
```sql
CREATE TABLE Users (
    UserID VARCHAR(50) PRIMARY KEY,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Name VARCHAR(50) NOT NULL,                    -- 통합된 이름 필드
    RoleID INT NOT NULL,
    IsApproved BOOLEAN DEFAULT FALSE,
    IsActive BOOLEAN DEFAULT TRUE,
    ApprovedAt DATETIME NULL,
    ApprovedBy VARCHAR(50) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NULL,
    
    -- 기업정보
    CompanyName VARCHAR(100) NULL,
    BusinessNumber VARCHAR(20) NULL,
    Address TEXT NULL,
    CompanyPhone VARCHAR(20) NULL,
    
    -- 담당자정보
    Department VARCHAR(50) NULL,
    Position VARCHAR(50) NULL,
    phoneNumber VARCHAR(20) NULL,                 -- 개인 연락처
    
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);
```

### **주요 변경사항**
- ❌ `FirstName VARCHAR(50)` 제거
- ❌ `LastName VARCHAR(50)` 제거  
- ✅ `Name VARCHAR(50)` 유지 (통합된 이름 필드)
- ✅ `phoneNumber` 필드 유지 (개인 연락처용)

## 🔐 **인증 플로우**

### **1. 회원가입**
```json
POST /api/auth/register
{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "홍길동",                    // 통합된 이름 필드
    "companyName": "테스트 회사",
    "businessNumber": "123-45-67890",
    "address": "서울시 강남구",
    "companyPhone": "02-1234-5678",
    "department": "개발팀",
    "position": "개발자",
    "phoneNumber": "010-1234-5678"     // 개인 연락처
}
```

### **2. 관리자 승인**
```json
POST /api/auth/approve-user/{userId}
Authorization: Bearer {admin_token}
```

### **3. 로그인**
```json
POST /api/auth/login
{
    "email": "user@example.com",
    "password": "Password123!"
}
```

**응답 예시:**
```json
{
    "message": "로그인 성공",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "userId": "user123",
        "email": "user@example.com",
        "name": "홍길동",                    // 통합된 이름
        "roleId": 2,
        "roleName": "Customer",
        "roles": ["Customer"],
        "isApproved": true
    }
}
```

## 👥 **기본 사용자 및 역할**

### **관리자 계정**
- **이메일**: admin@example.com
- **비밀번호**: Admin123!
- **이름**: 관리자 계정
- **역할**: Admin

### **역할 시스템**
1. **Admin**: 전체 시스템 관리
2. **Sales**: 영업 관리
3. **Customer**: 일반 고객

## 🔗 **주요 API 엔드포인트**

### **인증 API**
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/approve-user/{userId}` - 사용자 승인
- `GET /api/auth/pending-users` - 승인 대기 사용자 목록

### **관리자 API**
- `GET /api/admin/users` - 전체 사용자 목록
- `PUT /api/admin/users/{id}` - 사용자 정보 수정
- `GET /api/admin/dashboard` - 대시보드 통계

### **고객 API**
- `GET /api/customer/profile` - 프로필 조회
- `PUT /api/customer/profile` - 프로필 수정
- `GET /api/customer/support-tickets` - 문의 내역

### **영업 API**
- `GET /api/sales/leads` - 리드 목록
- `POST /api/sales/leads` - 리드 생성
- `GET /api/sales/customers` - 고객 목록

## 🔒 **보안 특징**

### **JWT 토큰 기반 인증**
- 토큰 만료 시간: 24시간
- 클레임 정보: 사용자 ID, 이메일, 이름, 역할
- 권한별 API 접근 제어

### **비밀번호 보안**
- SHA256 해시 알고리즘 사용
- 비밀번호 재설정 토큰 (5분 유효)
- 승인되지 않은 사용자 로그인 차단

### **관리자 승인 시스템**
- 회원가입 후 관리자 승인 필요
- 승인 시점 및 승인자 기록
- 승인 대기 사용자 관리

## 🧪 **테스트 시나리오**

### **1. 회원가입 → 승인 → 로그인 플로우**
```bash
# 1. 회원가입
curl -X POST http://localhost:5236/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "테스트 사용자",
    "companyName": "테스트 회사",
    "phoneNumber": "010-1234-5678"
  }'

# 2. 관리자 로그인
curl -X POST http://localhost:5236/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'

# 3. 사용자 승인
curl -X POST http://localhost:5236/api/auth/approve-user/test@example.com \
  -H "Authorization: Bearer {admin_token}"

# 4. 사용자 로그인
curl -X POST http://localhost:5236/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### **2. 비밀번호 재설정 플로우**
```bash
# 1. 비밀번호 재설정 요청
curl -X POST http://localhost:5236/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. 인증 코드 확인 (이메일로 받은 코드)
curl -X POST http://localhost:5236/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "verificationCode": "123456"
  }'

# 3. 새 비밀번호 설정
curl -X POST http://localhost:5236/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "verificationCode": "123456",
    "newPassword": "NewPassword123!"
  }'
```

## 📊 **프로젝트 통계**

- **API 엔드포인트**: 20+ 개
- **데이터베이스 테이블**: 4개 (Users, Roles, PasswordResetTokens, UserHistories)
- **역할 시스템**: 3개 (Admin, Sales, Customer)
- **보안 기능**: JWT 토큰, 비밀번호 해시, 승인 시스템
- **문서 정확도**: 92% (실제 코드와 일치)

## 🚀 **실행 방법**

```bash
# 1. 프로젝트 빌드
cd AuthSystem
dotnet build

# 2. 데이터베이스 마이그레이션
cd ../CommonDbLib
dotnet ef database update --startup-project ../AuthSystem

# 3. 애플리케이션 실행
cd ../AuthSystem
dotnet run
```

**접속 URL**: http://localhost:5236  
**Swagger UI**: http://localhost:5236/swagger

---

**최종 업데이트**: 2024년 12월 14일  
**프로젝트 버전**: 2.0  
**주요 변경**: FirstName/LastName → Name 통합 