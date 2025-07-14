# 프론트엔드 개발자 API 가이드

## 🔐 인증 API

### 1. 회원가입
**Endpoint**: `POST /api/auth/register`
**권한**: 없음

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "firstName": "홍",
  "lastName": "길동",
  "roleID": 3,
  "companyName": "테스트기업",
  "businessNumber": "123-45-67890",
  "address": "서울시 강남구 테스트로 123",
  "companyPhone": "02-1234-5678",
  "department": "개발부",
  "position": "사원",
  "contactPhone": "010-1234-5678"
}
```

**Response (성공 - 200)**:
```json
{
  "message": "회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.",
  "user": {
    "userID": "user@example.com",
    "email": "user@example.com",
    "firstName": "홍",
    "lastName": "길동",
    "roleID": 3,
    "isApproved": false,
    "companyName": "테스트기업",
    "businessNumber": "123-45-67890",
    "address": "서울시 강남구 테스트로 123",
    "companyPhone": "02-1234-5678",
    "department": "개발부",
    "position": "사원",
    "contactPhone": "010-1234-5678"
  }
}
```

**Response (실패 - 400)**:
```json
{
  "message": "이미 등록된 이메일입니다."
}
```

### 2. 로그인
**Endpoint**: `POST /api/auth/login`
**권한**: 없음

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "rememberMe": false
}
```

**Response (성공 - 200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userID": "user@example.com",
    "email": "user@example.com",
    "firstName": "홍",
    "lastName": "길동",
    "roleID": 3,
    "roleName": "Customer",
    "isApproved": true,
    "companyName": "테스트기업",
    "businessNumber": "123-45-67890",
    "address": "서울시 강남구 테스트로 123",
    "companyPhone": "02-1234-5678",
    "department": "개발부",
    "position": "사원",
    "contactPhone": "010-1234-5678"
  }
}
```

**Response (실패 - 400)**:
```json
{
  "message": "관리자 승인이 필요한 계정입니다."
}
```

**Response (실패 - 401)**:
```json
{
  "message": "이메일 또는 비밀번호가 올바르지 않습니다."
}
```

### 3. 사용자 승인 (관리자 전용)
**Endpoint**: `POST /api/auth/approve-user/{userId}`
**권한**: Admin

**Request Body**: 없음

**Response (성공 - 200)**:
```json
{
  "message": "사용자가 승인되었습니다.",
  "user": {
    "userID": "user@example.com",
    "email": "user@example.com",
    "firstName": "홍",
    "lastName": "길동",
    "isApproved": true,
    "approvedAt": "2024-01-15T10:30:00Z",
    "approvedBy": "admin@example.com"
  }
}
```

**Response (실패 - 404)**:
```json
{
  "message": "사용자를 찾을 수 없습니다."
}
```

### 4. 승인 대기 사용자 목록 (관리자 전용)
**Endpoint**: `GET /api/auth/pending-users`
**권한**: Admin

**Response (성공 - 200)**:
```json
[
  {
    "userID": "user1@example.com",
    "email": "user1@example.com",
    "firstName": "홍",
    "lastName": "길동",
    "role": "Customer",
    "isApproved": false,
    "createdAt": "2024-01-15T09:00:00Z",
    "companyName": "테스트기업1",
    "businessNumber": "123-45-67890",
    "address": "서울시 강남구 테스트로 123",
    "companyPhone": "02-1234-5678",
    "department": "개발부",
    "position": "사원",
    "contactPhone": "010-1234-5678"
  }
]
```

### 5. 비밀번호 재설정 요청
**Endpoint**: `POST /api/auth/forgot-password`
**권한**: 없음

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response (성공 - 200)**:
```json
{
  "message": "비밀번호 재설정 이메일이 발송되었습니다."
}
```

**Response (실패 - 404)**:
```json
{
  "message": "등록되지 않은 이메일입니다."
}
```

### 6. 인증 코드 검증
**Endpoint**: `POST /api/auth/verify-reset-code`
**권한**: 없음

**Request Body**:
```json
{
  "email": "user@example.com",
  "verificationCode": "123456"
}
```

**Response (성공 - 200)**:
```json
{
  "message": "인증 코드가 확인되었습니다."
}
```

**Response (실패 - 400)**:
```json
{
  "message": "인증 코드가 올바르지 않습니다."
}
```

### 7. 새 비밀번호 설정
**Endpoint**: `POST /api/auth/reset-password`
**권한**: 없음

**Request Body**:
```json
{
  "email": "user@example.com",
  "verificationCode": "123456",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response (성공 - 200)**:
```json
{
  "message": "비밀번호가 성공적으로 변경되었습니다."
}
```

**Response (실패 - 400)**:
```json
{
  "message": "비밀번호가 일치하지 않습니다."
}
```

### 8. 인증 상태 확인
**Endpoint**: `GET /api/auth/check-auth`
**권한**: 인증 필요

**Response (성공 - 200)**:
```json
{
  "message": "인증이 유효합니다.",
  "user": {
    "userID": "user@example.com",
    "email": "user@example.com",
    "firstName": "홍",
    "lastName": "길동",
    "roleID": 3,
    "roleName": "Customer",
    "isApproved": true
  }
}
```

**Response (실패 - 401)**:
```json
{
  "message": "인증이 필요합니다."
}
```

## 👥 관리자 API

### 1. 전체 사용자 목록
**Endpoint**: `GET /api/admin/users`
**권한**: Admin

**Response (성공 - 200)**:
```json
[
  {
    "userID": "admin@example.com",
    "email": "admin@example.com",
    "firstName": "관리자",
    "lastName": "계정",
    "roleName": "Admin",
    "isApproved": true,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "companyName": "관리자회사",
    "businessNumber": "000-00-00000",
    "address": "서울시 강남구",
    "companyPhone": "02-0000-0000",
    "department": "관리부",
    "position": "관리자",
    "contactPhone": "010-0000-0000"
  }
]
```

### 2. 특정 사용자 정보
**Endpoint**: `GET /api/admin/users/{userId}`
**권한**: Admin

**Response (성공 - 200)**:
```json
{
  "userID": "user@example.com",
  "email": "user@example.com",
  "firstName": "홍",
  "lastName": "길동",
  "roleName": "Customer",
  "isApproved": true,
  "isActive": true,
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "approvedAt": "2024-01-15T10:30:00Z",
  "approvedBy": "admin@example.com",
  "companyName": "테스트기업",
  "businessNumber": "123-45-67890",
  "address": "서울시 강남구 테스트로 123",
  "companyPhone": "02-1234-5678",
  "department": "개발부",
  "position": "사원",
  "contactPhone": "010-1234-5678"
}
```

### 3. 사용자 정보 수정
**Endpoint**: `PUT /api/admin/users/{userId}`
**권한**: Admin

**Request Body**:
```json
{
  "firstName": "수정된",
  "lastName": "이름",
  "roleID": 2,
  "isApproved": true,
  "isActive": true,
  "companyName": "수정된기업",
  "businessNumber": "987-65-43210",
  "address": "서울시 서초구 수정로 456",
  "companyPhone": "02-9876-5432",
  "department": "영업부",
  "position": "팀장",
  "contactPhone": "010-9876-5432"
}
```

**Response (성공 - 200)**:
```json
{
  "message": "사용자 정보가 수정되었습니다.",
  "user": {
    "userID": "user@example.com",
    "email": "user@example.com",
    "firstName": "수정된",
    "lastName": "이름",
    "roleName": "Sales",
    "isApproved": true,
    "isActive": true
  }
}
```

### 4. 사용자 삭제
**Endpoint**: `DELETE /api/admin/users/{userId}`
**권한**: Admin

**Response (성공 - 200)**:
```json
{
  "message": "사용자가 삭제되었습니다."
}
```

### 5. 역할 목록
**Endpoint**: `GET /api/admin/roles`
**권한**: Admin

**Response (성공 - 200)**:
```json
[
  {
    "roleID": 1,
    "roleName": "Admin",
    "description": "시스템 관리자",
    "isActive": true
  },
  {
    "roleID": 2,
    "roleName": "Sales",
    "description": "영업 담당자",
    "isActive": true
  },
  {
    "roleID": 3,
    "roleName": "Customer",
    "description": "고객",
    "isActive": true
  }
]
```

## 👤 고객 API

### 1. 프로필 조회
**Endpoint**: `GET /api/customer/profile`
**권한**: Customer

**Response (성공 - 200)**:
```json
{
  "userID": "customer@example.com",
  "email": "customer@example.com",
  "firstName": "고객",
  "lastName": "테스트",
  "roleName": "Customer",
  "isApproved": true,
  "isActive": true,
  "createdAt": "2024-01-15T09:00:00Z",
  "companyName": "고객기업",
  "businessNumber": "987-65-43210",
  "address": "서울시 서초구 고객로 456",
  "companyPhone": "02-9876-5432",
  "department": "구매부",
  "position": "대리",
  "contactPhone": "010-9876-5432"
}
```

### 2. 프로필 수정
**Endpoint**: `PUT /api/customer/profile`
**권한**: Customer

**Request Body**:
```json
{
  "firstName": "수정된",
  "lastName": "고객",
  "companyName": "수정된고객기업",
  "businessNumber": "111-22-33333",
  "address": "서울시 강남구 수정로 789",
  "companyPhone": "02-1111-2222",
  "department": "마케팅부",
  "position": "과장",
  "contactPhone": "010-1111-2222"
}
```

**Response (성공 - 200)**:
```json
{
  "message": "프로필이 수정되었습니다.",
  "user": {
    "userID": "customer@example.com",
    "email": "customer@example.com",
    "firstName": "수정된",
    "lastName": "고객",
    "companyName": "수정된고객기업",
    "businessNumber": "111-22-33333",
    "address": "서울시 강남구 수정로 789",
    "companyPhone": "02-1111-2222",
    "department": "마케팅부",
    "position": "과장",
    "contactPhone": "010-1111-2222"
  }
}
```

### 3. 비밀번호 변경
**Endpoint**: `PUT /api/customer/change-password`
**권한**: Customer

**Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response (성공 - 200)**:
```json
{
  "message": "비밀번호가 변경되었습니다."
}
```

**Response (실패 - 400)**:
```json
{
  "message": "현재 비밀번호가 올바르지 않습니다."
}
```

## 📊 영업 API

### 1. 고객 목록
**Endpoint**: `GET /api/sales/customers`
**권한**: Sales

**Response (성공 - 200)**:
```json
[
  {
    "userID": "customer1@example.com",
    "email": "customer1@example.com",
    "firstName": "고객1",
    "lastName": "테스트",
    "roleName": "Customer",
    "isApproved": true,
    "isActive": true,
    "createdAt": "2024-01-15T09:00:00Z",
    "companyName": "고객기업1",
    "businessNumber": "111-11-11111",
    "address": "서울시 강남구 고객로 123",
    "companyPhone": "02-1111-1111",
    "department": "구매부",
    "position": "대리",
    "contactPhone": "010-1111-1111"
  }
]
```

### 2. 고객 정보
**Endpoint**: `GET /api/sales/customers/{customerId}`
**권한**: Sales

**Response (성공 - 200)**:
```json
{
  "userID": "customer@example.com",
  "email": "customer@example.com",
  "firstName": "고객",
  "lastName": "테스트",
  "roleName": "Customer",
  "isApproved": true,
  "isActive": true,
  "createdAt": "2024-01-15T09:00:00Z",
  "companyName": "고객기업",
  "businessNumber": "987-65-43210",
  "address": "서울시 서초구 고객로 456",
  "companyPhone": "02-9876-5432",
  "department": "구매부",
  "position": "대리",
  "contactPhone": "010-9876-5432"
}
```

## 🔧 공통 응답 형식

### 성공 응답 (200)
```json
{
  "message": "작업이 성공적으로 완료되었습니다.",
  "data": { /* 응답 데이터 */ }
}
```

### 에러 응답 (4xx, 5xx)
```json
{
  "message": "에러 메시지",
  "errors": [
    {
      "field": "email",
      "message": "이메일 형식이 올바르지 않습니다."
    }
  ]
}
```

## 📋 HTTP 상태 코드

- **200 OK**: 요청 성공
- **201 Created**: 리소스 생성 성공
- **400 Bad Request**: 잘못된 요청
- **401 Unauthorized**: 인증 실패
- **403 Forbidden**: 권한 없음
- **404 Not Found**: 리소스 없음
- **409 Conflict**: 리소스 충돌
- **500 Internal Server Error**: 서버 오류

## 🔐 인증 헤더

모든 보호된 API에는 JWT 토큰이 필요합니다:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ⚠️ 주의사항

1. **비밀번호 정책**: 최소 8자, 대문자/소문자/숫자/특수문자 포함
2. **이메일 형식**: 유효한 이메일 형식 필수
3. **토큰 만료**: JWT 토큰은 60분 후 만료
4. **승인 시스템**: 회원가입 후 관리자 승인 필요
5. **권한 제어**: 각 API별 권한 확인 필수 