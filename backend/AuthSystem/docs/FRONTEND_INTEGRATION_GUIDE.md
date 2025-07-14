# 프론트엔드 통합 가이드

## 🌐 **API 기본 정보**

### 서버 정보
- **Base URL**: `http://localhost:5236`
- **API 문서**: `http://localhost:5236/swagger`
- **인증 방식**: JWT Bearer Token

### CORS 설정
```javascript
// 백엔드에서 모든 도메인 허용 설정됨
// 별도 CORS 설정 불필요
```

## 🔐 **인증 시스템**

### 1. 로그인
```javascript
const login = async (email, password) => {
  const response = await fetch('http://localhost:5236/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      password: password,
      rememberMe: false
    })
  });

  const data = await response.json();
  
  if (response.ok) {
    // JWT 토큰 저장
    localStorage.setItem('token', data.token);
    return data.user;
  } else {
    throw new Error(data.message);
  }
};
```

### 2. 토큰 관리
```javascript
// 토큰 저장
localStorage.setItem('token', token);

// 토큰 가져오기
const token = localStorage.getItem('token');

// 토큰 삭제 (로그아웃)
localStorage.removeItem('token');

// 인증 헤더 설정
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

### 3. 인증 상태 확인
```javascript
const checkAuth = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return { isAuthenticated: false };
  }

  const response = await fetch('http://localhost:5236/api/auth/check-auth', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    localStorage.removeItem('token');
    return { isAuthenticated: false };
  }
};
```

## 👥 **사용자 관리**

### 1. 회원가입
```javascript
const register = async (userData) => {
  const response = await fetch('http://localhost:5236/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role, // 'Admin', 'Sales', 'Customer'
      companyName: userData.companyName,
      businessNumber: userData.businessNumber,
      address: userData.address,
      companyPhone: userData.companyPhone,
      department: userData.department,
      position: userData.position,
      contactPhone: userData.contactPhone
    })
  });

  const data = await response.json();
  
  if (response.ok) {
    return data;
  } else {
    throw new Error(data.message);
  }
};
```

### 2. 비밀번호 재설정
```javascript
// 1단계: 이메일 입력
const forgotPassword = async (email) => {
  const response = await fetch('http://localhost:5236/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json();
};

// 2단계: 인증 코드 확인
const verifyResetCode = async (email, verificationCode) => {
  const response = await fetch('http://localhost:5236/api/auth/verify-reset-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, verificationCode })
  });
  return response.json();
};

// 3단계: 새 비밀번호 설정
const resetPassword = async (email, verificationCode, newPassword, confirmPassword) => {
  const response = await fetch('http://localhost:5236/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, verificationCode, newPassword, confirmPassword })
  });
  return response.json();
};
```

## 🎯 **역할별 API**

### 관리자 (Admin)
```javascript
// 모든 사용자 조회
const getAllUsers = async () => {
  const response = await fetch('http://localhost:5236/api/admin/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// 사용자 승인
const approveUser = async (userId) => {
  const response = await fetch(`http://localhost:5236/api/auth/approve-user/${userId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// 대시보드 통계
const getDashboardStats = async () => {
  const response = await fetch('http://localhost:5236/api/admin/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### 고객 (Customer)
```javascript
// 프로필 조회
const getProfile = async () => {
  const response = await fetch('http://localhost:5236/api/customer/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// 프로필 수정
const updateProfile = async (profileData) => {
  const response = await fetch('http://localhost:5236/api/customer/profile', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  return response.json();
};

// 본인 히스토리 조회
const getMyHistory = async () => {
  const response = await fetch('http://localhost:5236/api/customer/my-history', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### 영업 (Sales)
```javascript
// 고객 목록 조회
const getCustomers = async () => {
  const response = await fetch('http://localhost:5236/api/sales/customers', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// 고객 히스토리 관리
const getCustomerHistory = async (customerId) => {
  const response = await fetch(`http://localhost:5236/api/sales/customers/${customerId}/history`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// 매출 보고서
const getSalesReport = async (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await fetch(`http://localhost:5236/api/sales/sales-report?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## 📊 **데이터 모델**

### 사용자 정보
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Sales' | 'Customer';
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  companyName?: string;
  businessNumber?: string;
  address?: string;
  companyPhone?: string;
  department?: string;
  position?: string;
  contactPhone?: string;
}
```

### 히스토리 정보
```typescript
interface UserHistory {
  id: number;
  userId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}
```

## 🛡️ **권한 관리**

### 1. 권한 체크
```javascript
const checkPermission = (requiredRole) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user && user.role === requiredRole;
};

// 사용 예시
if (checkPermission('Admin')) {
  // 관리자 기능 표시
}
```

### 2. 라우트 보호
```javascript
// React Router 예시
const ProtectedRoute = ({ children, requiredRole }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth().then(data => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;
  
  if (!user || user.role !== requiredRole) {
    return <Navigate to="/login" />;
  }

  return children;
};
```

## 🔄 **상태 관리**

### React Context 예시
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (email, password) => {
    // 로그인 로직
    const data = await loginAPI(email, password);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 🐛 **에러 처리**

### 1. HTTP 에러 처리
```javascript
const handleApiError = (response) => {
  if (response.status === 401) {
    // 인증 실패
    localStorage.removeItem('token');
    window.location.href = '/login';
  } else if (response.status === 403) {
    // 권한 없음
    alert('접근 권한이 없습니다.');
  } else if (response.status >= 500) {
    // 서버 오류
    alert('서버 오류가 발생했습니다.');
  }
};
```

### 2. 네트워크 에러 처리
```javascript
const apiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      handleApiError(response);
      return;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API 호출 실패:', error);
    alert('네트워크 오류가 발생했습니다.');
  }
};
```

## 📱 **UI 컴포넌트 예시**

### 로그인 폼
```javascript
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // 로그인 성공 후 리다이렉트
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        required
      />
      <button type="submit">로그인</button>
    </form>
  );
};
```

## 🧪 **테스트**

### 1. API 테스트
```javascript
// Jest + fetch-mock 예시
import fetchMock from 'fetch-mock';

test('로그인 성공', async () => {
  fetchMock.post('http://localhost:5236/api/auth/login', {
    status: 200,
    body: {
      message: '로그인 성공',
      token: 'jwt_token_here',
      user: { id: '1', email: 'test@example.com' }
    }
  });

  const result = await login('test@example.com', 'password');
  expect(result.user.email).toBe('test@example.com');
});
```

### 2. 컴포넌트 테스트
```javascript
// React Testing Library 예시
import { render, screen, fireEvent } from '@testing-library/react';

test('로그인 폼 렌더링', () => {
  render(<LoginForm />);
  expect(screen.getByPlaceholderText('이메일')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument();
});
```

## 📚 **유용한 라이브러리**

### HTTP 클라이언트
- **Axios**: `npm install axios`
- **SWR**: `npm install swr`
- **React Query**: `npm install @tanstack/react-query`

### 상태 관리
- **Redux Toolkit**: `npm install @reduxjs/toolkit react-redux`
- **Zustand**: `npm install zustand`
- **Recoil**: `npm install recoil`

### UI 라이브러리
- **Material-UI**: `npm install @mui/material @emotion/react @emotion/styled`
- **Ant Design**: `npm install antd`
- **Chakra UI**: `npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion`

## 🆘 **문제 해결**

### 1. CORS 오류
- 백엔드 CORS 설정 확인
- 프록시 설정 사용 (개발 환경)

### 2. 토큰 만료
- 자동 토큰 갱신 로직 구현
- 401 에러 시 자동 로그아웃

### 3. 권한 오류
- 사용자 역할 확인
- 라우트 보호 로직 점검

## 📞 **지원**

문제가 발생하면:
1. 브라우저 개발자 도구 확인
2. 네트워크 탭에서 API 응답 확인
3. 백엔드 로그 확인
4. 팀 리드에게 문의 
