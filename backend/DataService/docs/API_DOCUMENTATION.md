# DataService API 문서

## 📋 개요

DataService는 데이터베이스에서 프론트엔드 요청에 따라 데이터를 조회하는 백엔드 서비스입니다. AuthSystem과 별도로 운영되며, 사용자 정보, 견적서 정보, 통계 데이터를 제공합니다.

## 🔗 기본 정보

- **Base URL**: `http://localhost:5162`
- **데이터베이스**: MySQL (FullAuthSystemDb)
- **인증**: 현재 인증 없음 (공개 API)

## 📊 API 엔드포인트

### 1. 사용자 관리 API

#### 1.1 모든 사용자 조회
```http
GET /api/data/users
```

**응답 예시**:
```json
[
  {
    "userID": "admin@example.com",
    "name": "관리자 계정",
    "email": "admin@example.com",
    "phoneNumber": "010-1234-5678",
    "roleID": 1,
    "isApproved": true,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00",
    "updatedAt": "2024-01-01T00:00:00",
    "companyName": "회사명",
    "businessNumber": "123-45-67890",
    "address": "서울시 강남구",
    "companyPhone": "02-1234-5678",
    "department": "IT부서",
    "position": "매니저"
  }
]
```

#### 1.2 특정 사용자 조회
```http
GET /api/data/users/{id}
```

**파라미터**:
- `id` (string): 사용자 ID (이메일)

**응답 예시**:
```json
{
  "userID": "admin@example.com",
  "name": "관리자 계정",
  "email": "admin@example.com",
  "phoneNumber": "010-0000-0000",
  "roleID": 1,
  "isApproved": true,
  "isActive": true,
  "createdAt": "2025-07-14T05:03:03.791504",
  "updatedAt": null,
  "companyName": "기본회사",
  "businessNumber": "000-00-00000",
  "address": "기본주소",
  "companyPhone": "02-0000-0000",
  "department": "기본부서",
  "position": "기본직책"
}
```

#### 1.3 사용자 검색
```http
GET /api/data/users/search?name={검색어}
```

**쿼리 파라미터**:
- `name` (string, optional): 사용자 이름 검색어

**주의사항**:
- 한글 검색어는 URL 인코딩이 필요합니다
- 예: `관리자` → `%EA%B4%80%EB%A6%AC%EC%9E%90`

**응답 예시**:
```json
[
  {
    "userID": "admin@example.com",
    "name": "관리자 계정",
    "email": "admin@example.com",
    "phoneNumber": "010-0000-0000",
    "roleID": 1,
    "isApproved": true,
    "isActive": true,
    "createdAt": "2025-07-14T05:03:03.791504",
    "updatedAt": null,
    "companyName": "기본회사",
    "businessNumber": "000-00-00000",
    "address": "기본주소",
    "companyPhone": "02-0000-0000",
    "department": "기본부서",
    "position": "기본직책"
  }
]
```

### 2. 견적서 관리 API

#### 2.1 모든 견적서 조회
```http
GET /api/data/estimates
```

**응답 예시**:
```json
[
  {
    "curEstimateNo": "EST-2024-001",
    "curEstPrice": 1000000,
    "prevEstimateNo": null,
    "status": 1,
    "customerID": "customer@example.com",
    "managerUserID": "manager@example.com"
  }
]
```

#### 2.2 특정 견적서 조회
```http
GET /api/data/estimates/{id}
```

**파라미터**:
- `id` (string): 견적서 번호

**응답 예시**:
```json
{
  "curEstimateNo": "EST-2024-001",
  "curEstPrice": 1000000,
  "prevEstimateNo": null,
  "status": 1,
  "customerID": "customer@example.com",
  "managerUserID": "manager@example.com"
}
```

#### 2.3 견적서 상태별 검색
```http
GET /api/data/estimates/search?status={상태값}
```

**쿼리 파라미터**:
- `status` (string, optional): 견적서 상태
  - `1`: 견적입력
  - `2`: 접수대기
  - `3`: 견적완료
  - `4`: 주문

**응답 예시**:
```json
[
  {
    "curEstimateNo": "EST-2024-001",
    "curEstPrice": 1000000,
    "prevEstimateNo": null,
    "status": 1,
    "customerID": "customer@example.com",
    "managerUserID": "manager@example.com"
  }
]
```

### 3. 통계 API

#### 3.1 전체 통계 조회
```http
GET /api/data/stats
```

**응답 예시**:
```json
{
  "totalUsers": 3,
  "totalEstimates": 0
}
```

## 🔧 사용 예시

### JavaScript/TypeScript

```javascript
// 모든 사용자 조회
async function getUsers() {
  try {
    const response = await fetch('http://localhost:5162/api/data/users');
    const users = await response.json();
    console.log('사용자 목록:', users);
    return users;
  } catch (error) {
    console.error('사용자 조회 오류:', error);
  }
}

// 특정 사용자 조회
async function getUser(userId) {
  try {
    const response = await fetch(`http://localhost:5162/api/data/users/${userId}`);
    const user = await response.json();
    console.log('사용자 정보:', user);
    return user;
  } catch (error) {
    console.error('사용자 조회 오류:', error);
  }
}

// 사용자 검색
async function searchUsers(name) {
  try {
    const response = await fetch(`http://localhost:5162/api/data/users/search?name=${encodeURIComponent(name)}`);
    const users = await response.json();
    console.log('검색 결과:', users);
    return users;
  } catch (error) {
    console.error('사용자 검색 오류:', error);
  }
}

// 통계 조회
async function getStats() {
  try {
    const response = await fetch('http://localhost:5162/api/data/stats');
    const stats = await response.json();
    console.log('통계 정보:', stats);
    return stats;
  } catch (error) {
    console.error('통계 조회 오류:', error);
  }
}

// 견적서 조회
async function getEstimates() {
  try {
    const response = await fetch('http://localhost:5162/api/data/estimates');
    const estimates = await response.json();
    console.log('견적서 목록:', estimates);
    return estimates;
  } catch (error) {
    console.error('견적서 조회 오류:', error);
  }
}
```

### React Hook 예시

```typescript
import { useState, useEffect } from 'react';

interface User {
  userID: string;
  name: string;
  email: string;
  phoneNumber?: string;
  roleID: number;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  companyName?: string;
  businessNumber?: string;
  address?: string;
  companyPhone?: string;
  department?: string;
  position?: string;
}

interface Stats {
  totalUsers: number;
  totalEstimates: number;
}

// 사용자 목록 Hook
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5162/api/data/users');
      if (!response.ok) {
        throw new Error('사용자 조회 실패');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, error, refetch: fetchUsers };
}

// 통계 Hook
export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5162/api/data/stats');
      if (!response.ok) {
        throw new Error('통계 조회 실패');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refetch: fetchStats };
}
```

## ⚠️ 주의사항

### 1. 현재 상태
- ✅ **사용자 조회 API**: NULL 값 처리 문제 해결됨
- ✅ **사용자 검색 API**: 정상 작동 (한글 검색어는 URL 인코딩 필요)
- ✅ **통계 API**: 정상 작동
- ✅ **견적서 API**: 스키마 불일치 문제 해결됨 - 모든 기능 정상 작동

### 2. 권장사항
- 프로덕션 환경에서는 인증/인가 추가 필요
- CORS 설정을 특정 도메인으로 제한
- 에러 처리 및 로깅 강화
- API 응답 캐싱 고려

### 3. 개발 환경 설정
```bash
# DataService 실행
cd backend/DataService
dotnet run

# 포트 확인
lsof -i :5162
```

## 📝 변경 이력

- **2024-07-18**: 초기 API 문서 작성
- **2024-07-18**: 통계 API 구현 완료
- **2024-07-18**: 사용자 API 구현 (NULL 값 처리 문제 있음)
- **2024-07-18**: 견적서 API 구현 (스키마 불일치 문제 있음)
- **2024-07-18**: NULL 값 처리 문제 해결 (데이터베이스 기본값 업데이트)
- **2024-07-18**: 특정 사용자 조회 및 검색 API 수정 완료 