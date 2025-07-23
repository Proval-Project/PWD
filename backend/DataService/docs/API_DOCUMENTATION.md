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

#### 2.4 고객 견적 입력 (여러 TagNo)

##### POST /api/data/customer-estimate

**요청 예시:**
```json
{
  "tagNos": ["A001", "A002", "A003"],
  "customerID": "customer1"
}
```

**응답 예시:**
```json
{
  "message": "견적 생성 완료",
  "estimateNo": "YA20250721-001",
  "tagNos": ["A001", "A002", "A003"]
}
```

#### 2.5 특정 견적번호의 TagNo 리스트 조회

##### GET /api/data/estimates/{estimateNo}/tags

**응답 예시:**
```json
["A001", "A002", "A003"]
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

### DataSheetLv3 테이블 컬럼 (2024-07-22 기준)

| 컬럼명 | 타입 | 설명/비고 |
|--------|------|-----------|
| TagNo | string | PK, 견적 상세 식별자 |
| EstimateNo | string | FK, 견적번호 |
| ItemCode | string | FK, 품목코드 |
| SheetNo | int | 시트 번호 |
| UnitPrice | int | 단가 |
| Quantity | int | 수량 |
| Project | string | 프로젝트명 |
| Service | string | 서비스명 |
| MFGNo | string | 제조번호 |
| ModelNo | string | 모델번호 |
| Medium | string | 유체 |
| State | string | 상태 |
| FlowRateUnit | string | 유량 단위 |
| FlowRateMaxQ | decimal | 최대 유량 |
| FlowRateNorQ | decimal | 정상 유량 |
| FlowRateMinQ | decimal | 최소 유량 |
| InletPressureUnit | string | 입구 압력 단위 |
| InletPressureMaxQ | decimal | 입구 최대 압력 |
| InletPressureNorQ | decimal | 입구 정상 압력 |
| InletPressureMinQ | decimal | 입구 최소 압력 |
| OutletPressureUnit | string | 출구 압력 단위 |
| OutletPressureMaxQ | decimal | 출구 최대 압력 |
| OutletPressureNorQ | decimal | 출구 정상 압력 |
| OutletPressureMinQ | decimal | 출구 최소 압력 |
| DifferentialPressureUnit | string | 차압 단위 |
| DifferentialPressureMaxQ | decimal | 최대 차압 |
| DifferentialPressureNorQ | decimal | 정상 차압 |
| DifferentialPressureMinQ | decimal | 최소 차압 |
| InletTemperatureUnit | string | 입구 온도 단위 |
| InletTemperatureQ | decimal | 입구 온도 |
| InletTemperatureNorQ | decimal | 입구 정상 온도 |
| InletTemperatureMinQ | decimal | 입구 최소 온도 |
| SpecificGravityUnit | string | 비중 단위 |
| SpecificGravityMaxQ | decimal | 최대 비중 |
| SpecificGravityNorQ | decimal | 정상 비중 |
| SpecificGravityMinQ | decimal | 최소 비중 |
| DensityUnit | string | 밀도 단위 |
| DensityMaxQ | decimal | 최대 밀도 |
| DensityNorQ | decimal | 정상 밀도 |
| DensityMinQ | decimal | 최소 밀도 |
| MolecularWeightUnit | string | 분자량 단위 |
| MolecularWeightMaxQ | decimal | 최대 분자량 |
| MolecularWeightNorQ | decimal | 정상 분자량 |
| MolecularWeightMinQ | decimal | 최소 분자량 |
| ViscosityUnit | string | 점도 단위 |
| ViscosityMaxQ | decimal | 최대 점도 |
| ViscosityNorQ | decimal | 정상 점도 |
| ViscosityMinQ | decimal | 최소 점도 |
| PredictedSPLUnit | string | 예측 소음 단위 |
| PredictedSPLMaxQ | string | 예측 최대 소음 |
| PredictedSPLNorQ | string | 예측 정상 소음 |
| PredictedSPLMinQ | string | 예측 최소 소음 |
| CalculatedCvUnit | string | Cv 단위 |
| CalculatedCvMaxQ | decimal | 최대 Cv |
| CalculatedCvNorQ | decimal | 정상 Cv |
| CalculatedCvMinQ | decimal | 최소 Cv |
| OpeningLiftUnit | string | 개방 리프트 단위 |
| OpeningLiftMaxQ | decimal | 최대 개방 리프트 |
| OpeningLiftNorQ | decimal | 정상 개방 리프트 |
| OpeningLiftMinQ | decimal | 최소 개방 리프트 |
| ShutOffDPUnit | string | 셧오프 DP 단위 |
| ShutOffDP | decimal | 셧오프 DP |
| PressureUnit | string | 압력 단위 |
| Pressure | decimal | 압력 |
| TempUnit | string | 온도 단위 |
| Temp | string | 온도(범위 등) |
| InletPipeSize | string | 입구 파이프 사이즈 |
| InletPipeSizeSchNo | string | 입구 파이프 스케줄 번호 |
| OutletPipeSize | string | 출구 파이프 사이즈 |
| OutletPipeSizeSchNo | string | 출구 파이프 스케줄 번호 |
| BNTBodyType | string | 바디 타입 |
| BNTBodySize | string | 바디 사이즈 |
| BNTPortSize | string | 포트 사이즈 |
| BNTTrimDesign | string | 트림 디자인 |
| BNTTrimType | string | 트림 타입 |
| BNTTrimSealRing | string | 트림 실링 링 |
| BNTGuide | string | 가이드 |
| BNTRating | string | 등급 |
| BNTEndConnection | string | 엔드 커넥션 |
| BNTFlangeFacing | string | 플랜지 페이싱 |
| BNTBody | string | 바디 재질 |
| BNTTrim | string | 트림 재질 |
| BNTStem | string | 스템 재질 |
| BNTPacking | string | 패킹 |
| BNTSpecialName | string | 특수명칭 |
| BNTSpecial | string | 특수재질 |
| BNTBonnetType | string | 보닛 타입 |
| BNTTrimForm | string | 트림 형상 |
| BNTMaxAllowSoundLevel_dBA | string | 최대 허용 소음(dBA) |
| BNTRequiredSeatTightness | string | 시트 타이트니스 |
| BNTRatedCv | decimal | 정격 Cv |
| BNTStroke | string | 스트로크 |
| BNTFlowActionTo | string | 플로우 방향 |
| BNTPaintingColor | string | 도장 색상 |
| BNTPaintingType | string | 도장 타입 |
| BNTOilFreeWaterFreeTreatment | string | 오일/워터 프리 처리 |
| ActuatorType | string | 액추에이터 타입 |
| ActuatorModelNo | string | 액추에이터 모델번호 |
| ActuatorCloseAt | decimal | 액추에이터 닫힘 압력 |
| ActuatorOpenAt | decimal | 액추에이터 열림 압력 |
| ActuatorFailPosition | string | 액추에이터 실패 위치 |
| ActuatorPaintingColor | string | 액추에이터 도장 색상 |
| ActuatorPaintingType | string | 액추에이터 도장 타입 |
| HWTypeLocation | string | HW 타입/위치 |
| HWPaintingColor | string | HW 도장 색상 |
| HWPaintingType | string | HW 도장 타입 |
| IPPosInputSignal | string | IPPos 입력 신호 |
| IPPosType | string | IPPos 타입 |
| IPPosEnclosure | string | IPPos 인클로저 |
| IPPosModelNo | string | IPPos 모델번호 |
| IPPosMFG | string | IPPos 제조사 |
| PosTransOutput | string | 포지션 트랜스 출력 |
| PosTransType | string | 포지션 트랜스 타입 |
| AirSetSupplySettingPressure | decimal | 에어셋 공급 압력 |
| AirSetModelNo | string | 에어셋 모델번호 |
| AirSetMFG | string | 에어셋 제조사 |
| SolValvePower | string | 솔밸브 전원 |
| SolValveType | string | 솔밸브 타입 |
| SolValveEnclosure | string | 솔밸브 인클로저 |
| SolValveModelNo | string | 솔밸브 모델번호 |
| SolValveMFG | string | 솔밸브 제조사 |
| LimSwitchQuantity | string | 리미트스위치 수량 |
| LimSwitchType | string | 리미트스위치 타입 |
| LimSwitchEnclosure | string | 리미트스위치 인클로저 |
| LimSwitchModelNo | string | 리미트스위치 모델번호 |
| LimSwitchMFG | string | 리미트스위치 제조사 |
| LockUpValveSettingPressure | string | 락업밸브 설정 압력 |
| LockUpValveModelNo | string | 락업밸브 모델번호 |
| SnapActSettingPressure | string | 스냅액츄에이터 설정 압력 |
| SnapActModelNo | string | 스냅액츄에이터 모델번호 |
| AccAirOperatedValve | string | 에어 오퍼레이티드 밸브 |
| AccMechanicalValve | string | 메카니컬 밸브 |
| AccCheckValve | string | 체크 밸브 |
| AccVolumeBooster | string | 볼륨 부스터 |
| AccExhaustValve | string | 배기 밸브 |
| AccSpeedController | string | 스피드 컨트롤러 |
| AccSilencer | string | 사일렌서 |
| MiscellAirSupply | string | 기타 에어 공급 |
| MiscellElectrical | string | 기타 전기 |
| MiscellWaterSeal | string | 기타 워터실 |
| MiscellJacket | string | 기타 재킷 |
| MiscellJacketMaterial | string | 기타 재킷 재질 |
| MiscellTubingMaterial | string | 기타 튜빙 재질 |
| MiscellSunshadeMaterial | string | 기타 선쉐이드 재질 |
| Note | string | 비고 |
| No | string | 번호 |
| Date | date | 날짜 |
| Revision | string | 리비전 |
| PreparedBy | string | 작성자 |
| CheckedBy | string | 검토자 |
| ApprovedBy | string | 승인자 |
| CVDate | date | Cv 날짜 |
| CVNo | int | Cv 번호 |
| CVRemark | string | Cv 비고 |
| VALNo | int | Valve 번호 |
| VALJacket | string | Valve 재킷 |
| VALBR | bool | Valve BR |
| VALWS | bool | Valve WS |
| VALSS | bool | Valve SS |
| VALDeviation | string | Valve 편차 |
| VALRemak | string | Valve 비고 |
| VALTotal | int | Valve 총 개수 |
| VALBoosterRelay | string | Valve 부스터 릴레이 |

### User 테이블 컬럼 (2024-07-22 기준)

| 컬럼명 | 타입 | 설명/비고 |
|--------|------|-----------|
| UserID | string | PK, 아이디 |
| Password | string | 비밀번호(해싱) |
| CompanyName | string? | 회사명 |
| CompanyPhone | string? | 대표번호 |
| RoleID | int | FK, 권한 |
| Position | string? | 직급 |
| Department | string? | 부서 |
| Name | string | 이름 |
| BusinessNumber | string? | 사업자 등록번호 |
| Address | string? | 주소 |
| Email | string | 이메일 |
| PhoneNumber | string? | 연락처 |
| IsApproved | bool | 관리자 승인 여부 |
| ApprovedAt | DateTime? | 승인 일시 |
| ApprovedBy | string? | 승인자 |
| IsActive | bool | 활성화 여부 |
| CreatedAt | DateTime | 생성일 |
| UpdatedAt | DateTime? | 수정일 |

### Role 테이블 컬럼 (2024-07-22 기준)

| 컬럼명 | 타입 | 설명/비고 |
|--------|------|-----------|
| RoleID | int | PK |
| RoleName | string | 권한명 |
| Description | string? | 설명 |
| IsActive | bool | 활성화 여부 |

> 모든 테이블의 컬럼/타입/nullable 여부는 실제 소스코드와 DB 마이그레이션 기준으로 최신화됨. 