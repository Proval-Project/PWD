# 🌐 프론트엔드 API 가이드

## 📋 개요

이 문서는 프론트엔드 개발자를 위한 FullAuthSystem API 사용 가이드입니다. 모든 API 요청/응답 형식과 에러 처리를 포함합니다.

## 🔐 인증 API

### 1. 회원가입

**엔드포인트**: `POST /api/auth/register`

**요청 바디**:
```json
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

**응답** (성공):
```json
{
    "message": "회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.",
    "userId": "user@example.com"
}
```

**응답** (실패):
```json
{
    "message": "이미 존재하는 이메일입니다.",
    "errors": {
        "email": ["이미 사용 중인 이메일입니다."]
    }
}
```

### 2. 로그인

**엔드포인트**: `POST /api/auth/login`

**요청 바디**:
```json
{
    "email": "user@example.com",
    "password": "Password123!"
}
```

**응답** (성공):
```json
{
    "message": "로그인 성공",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "userId": "user@example.com",
        "email": "user@example.com",
        "name": "홍길동",                    // 통합된 이름
        "roleId": 2,
        "roleName": "Customer",
        "roles": ["Customer"],
        "isApproved": true
    }
}
```

**응답** (실패 - 승인 대기):
```json
{
    "message": "관리자 승인이 필요한 계정입니다. 승인 후 로그인이 가능합니다."
}
```

### 3. 인증 상태 확인

**엔드포인트**: `GET /api/auth/check-auth`

**헤더**: `Authorization: Bearer {token}`

**응답** (성공):
```json
{
    "message": "인증된 사용자입니다.",
    "isAuthenticated": true,
    "user": {
        "userId": "user@example.com",
        "email": "user@example.com",
        "name": "홍길동",                    // 통합된 이름
        "role": "Customer",
        "roles": ["Customer"],
        "isApproved": true,
        "isActive": true
    }
}
```

### 4. 로그아웃

**엔드포인트**: `POST /api/auth/logout`

**헤더**: `Authorization: Bearer {token}`

**응답**:
```json
{
    "message": "로그아웃되었습니다.",
    "userId": "user@example.com",
    "logoutTime": "2024-12-14T10:30:00Z"
}
```

### 5. 비밀번호 재설정

#### 5.1 비밀번호 재설정 요청

**엔드포인트**: `POST /api/auth/forgot-password`

**요청 바디**:
```json
{
    "email": "user@example.com"
}
```

**응답**:
```json
{
    "success": true,
    "message": "비밀번호 재설정 이메일이 전송되었습니다.",
    "email": "user@example.com"
}
```

#### 5.2 인증 코드 확인

**엔드포인트**: `POST /api/auth/verify-reset-code`

**요청 바디**:
```json
{
    "email": "user@example.com",
    "verificationCode": "123456"
}
```

**응답** (성공):
```json
{
    "success": true,
    "message": "인증 코드가 확인되었습니다.",
    "isValid": true
}
```

#### 5.3 새 비밀번호 설정

**엔드포인트**: `POST /api/auth/reset-password`

**요청 바디**:
```json
{
    "email": "user@example.com",
    "verificationCode": "123456",
    "newPassword": "NewPassword123!"
}
```

**응답**:
```json
{
    "success": true,
    "message": "비밀번호가 성공적으로 재설정되었습니다."
}
```

## 👨‍💼 관리자 API

### 1. 전체 사용자 목록

**엔드포인트**: `GET /api/admin/users`

**헤더**: `Authorization: Bearer {admin_token}`

**응답**:
```json
[
    {
        "userID": "admin@example.com",
        "email": "admin@example.com",
        "name": "관리자 계정",                // 통합된 이름
        "role": "Admin",
        "isApproved": true,
        "approvedAt": "2024-12-14T10:00:00Z",
        "approvedBy": "Admin",
        "isActive": true,
        "createdAt": "2024-12-14T09:00:00Z",
        "updatedAt": "2024-12-14T10:00:00Z",
        "companyName": "관리자 회사",
        "businessNumber": "123-45-67890",
        "address": "서울시 강남구",
        "companyPhone": "02-1234-5678",
        "department": "관리팀",
        "position": "관리자",
        "phoneNumber": "010-1234-5678"     // 개인 연락처
    }
]
```

### 2. 사용자 정보 수정

**엔드포인트**: `PUT /api/admin/users/{id}`

**헤더**: `Authorization: Bearer {admin_token}`

**요청 바디**:
```json
{
    "name": "수정된 이름",                    // 통합된 이름
    "companyName": "수정된 회사",
    "businessNumber": "987-65-43210",
    "address": "수정된 주소",
    "companyPhone": "02-9876-5432",
    "department": "수정된 부서",
    "position": "수정된 직책",
    "phoneNumber": "010-9876-5432"         // 개인 연락처
}
```

**응답**:
```json
{
    "message": "사용자 정보가 업데이트되었습니다."
}
```

### 3. 대시보드 통계

**엔드포인트**: `GET /api/admin/dashboard`

**헤더**: `Authorization: Bearer {admin_token}`

**응답**:
```json
{
    "totalUsers": 10,
    "approvedUsers": 8,
    "pendingUsers": 2,
    "activeUsers": 9,
    "adminCount": 1,
    "salesCount": 3,
    "customerCount": 6
}
```

## 👤 고객 API

### 1. 프로필 조회

**엔드포인트**: `GET /api/customer/profile`

**헤더**: `Authorization: Bearer {customer_token}`

**응답**:
```json
{
    "userID": "customer@example.com",
    "email": "customer@example.com",
    "name": "고객 사용자",                    // 통합된 이름
    "role": "Customer",
    "isApproved": true,
    "approvedAt": "2024-12-14T10:00:00Z",
    "approvedBy": "Admin",
    "isActive": true,
    "createdAt": "2024-12-14T09:00:00Z",
    "updatedAt": "2024-12-14T10:00:00Z",
    "companyName": "고객 회사",
    "businessNumber": "123-45-67890",
    "address": "서울시 서초구",
    "companyPhone": "02-1234-5678",
    "department": "구매팀",
    "position": "대리",
    "phoneNumber": "010-1234-5678"         // 개인 연락처
}
```

### 2. 프로필 수정

**엔드포인트**: `PUT /api/customer/profile`

**헤더**: `Authorization: Bearer {customer_token}`

**요청 바디**:
```json
{
    "name": "수정된 고객 이름",                // 통합된 이름
    "companyName": "수정된 고객 회사",
    "businessNumber": "987-65-43210",
    "address": "수정된 고객 주소",
    "companyPhone": "02-9876-5432",
    "department": "수정된 부서",
    "position": "수정된 직책",
    "phoneNumber": "010-9876-5432"         // 개인 연락처
}
```

**응답**:
```json
{
    "message": "프로필이 성공적으로 업데이트되었습니다."
}
```

### 3. 문의 내역

**엔드포인트**: `GET /api/customer/support-tickets`

**헤더**: `Authorization: Bearer {customer_token}`

**응답**:
```json
[
    {
        "id": 1,
        "title": "배송 문의",
        "status": "답변완료",
        "createdAt": "2024-12-11T10:00:00Z"
    },
    {
        "id": 2,
        "title": "환불 요청",
        "status": "처리중",
        "createdAt": "2024-12-13T15:30:00Z"
    }
]
```

## 💼 영업 API

### 1. 리드 목록

**엔드포인트**: `GET /api/sales/leads`

**헤더**: `Authorization: Bearer {sales_token}`

**응답**:
```json
[
    {
        "id": 1,
        "name": "김철수",
        "email": "kim@example.com",
        "phone": "010-1234-5678",
        "status": "신규",
        "createdAt": "2024-12-07T10:00:00Z"
    },
    {
        "id": 2,
        "name": "이영희",
        "email": "lee@example.com",
        "phone": "010-9876-5432",
        "status": "연락중",
        "createdAt": "2024-12-11T15:30:00Z"
    }
]
```

### 2. 리드 생성

**엔드포인트**: `POST /api/sales/leads`

**헤더**: `Authorization: Bearer {sales_token}`

**요청 바디**:
```json
{
    "name": "새로운 리드",
    "email": "newlead@example.com",
    "phone": "010-5555-1234",
    "company": "새로운 회사",
    "description": "새로운 리드에 대한 설명"
}
```

**응답**:
```json
{
    "id": 3,
    "name": "새로운 리드",
    "email": "newlead@example.com",
    "phone": "010-5555-1234",
    "status": "신규",
    "createdAt": "2024-12-14T11:00:00Z"
}
```

### 3. 고객 목록

**엔드포인트**: `GET /api/sales/customers`

**헤더**: `Authorization: Bearer {sales_token}`

**응답**:
```json
[
    {
        "userID": "customer1@example.com",
        "email": "customer1@example.com",
        "name": "고객 1",                      // 통합된 이름
        "role": "Customer",
        "isApproved": true,
        "createdAt": "2024-12-10T09:00:00Z",
        "companyName": "고객 회사 1",
        "businessNumber": "123-45-67890",
        "address": "서울시 강남구",
        "companyPhone": "02-1234-5678",
        "department": "구매팀",
        "position": "대리",
        "phoneNumber": "010-1234-5678"       // 개인 연락처
    }
]
```

## ⚠️ 에러 코드 및 응답

### 공통 에러 응답 형식

```json
{
    "message": "에러 메시지",
    "errors": {
        "fieldName": ["필드별 에러 메시지"]
    }
}
```

### 주요 HTTP 상태 코드

- **200 OK**: 요청 성공
- **201 Created**: 리소스 생성 성공
- **400 Bad Request**: 잘못된 요청 (유효성 검증 실패)
- **401 Unauthorized**: 인증 실패 (토큰 없음/만료)
- **403 Forbidden**: 권한 없음
- **404 Not Found**: 리소스 없음
- **500 Internal Server Error**: 서버 오류

### 주요 에러 메시지

#### 인증 관련
- `"잘못된 이메일 또는 비밀번호입니다."`
- `"관리자 승인이 필요한 계정입니다."`
- `"비활성화된 계정입니다."`
- `"인증되지 않은 사용자입니다."`

#### 회원가입 관련
- `"이미 존재하는 이메일입니다."`
- `"비밀번호가 일치하지 않습니다."`
- `"필수 필드가 누락되었습니다."`

#### 비밀번호 재설정 관련
- `"유효하지 않은 인증 코드입니다."`
- `"인증 코드가 만료되었습니다."`
- `"승인되지 않은 계정입니다."`

## 🔧 사용 예시

### JavaScript/TypeScript 예시

```typescript
// 로그인 함수
async function login(email: string, password: string) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        console.error('로그인 실패:', error);
        throw error;
    }
}

// 인증된 요청 함수
async function authenticatedRequest(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        // 토큰 만료 시 로그인 페이지로 리다이렉트
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
    }

    return response;
}

// 사용자 프로필 조회
async function getUserProfile() {
    const response = await authenticatedRequest('/api/customer/profile');
    if (response?.ok) {
        const profile = await response.json();
        return profile;
    }
}
```

### React 예시

```typescript
// 로그인 컴포넌트
const LoginComponent = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await login(email, password);
            // 로그인 성공 시 처리
            console.log('로그인 성공:', result.user.name); // 통합된 이름
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <form onSubmit={handleLogin}>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
            />
            <button type="submit">로그인</button>
            {error && <p className="error">{error}</p>}
        </form>
    );
};
```

## 📝 주의사항

### 1. 토큰 관리
- JWT 토큰은 24시간 후 만료됩니다
- 토큰 만료 시 자동으로 로그인 페이지로 리다이렉트 처리
- 민감한 정보는 토큰에 포함하지 않습니다

### 2. 에러 처리
- 모든 API 호출에서 에러 처리를 구현하세요
- 네트워크 오류와 비즈니스 로직 오류를 구분하여 처리
- 사용자에게 적절한 에러 메시지를 표시

### 3. 데이터 형식
- 날짜는 ISO 8601 형식으로 전송됩니다
- 파일 업로드는 multipart/form-data 형식을 사용
- JSON 데이터는 UTF-8 인코딩을 사용

### 4. 보안
- HTTPS를 사용하여 모든 API 통신을 암호화
- 토큰을 안전하게 저장 (httpOnly 쿠키 권장)
- XSS 및 CSRF 공격 방지 조치

---

**최종 업데이트**: 2024년 12월 14일  
**API 버전**: 2.0  
**주요 변경**: FirstName/LastName → Name 통합 