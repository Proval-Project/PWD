# 데이터베이스 쿼리 가이드

## 📋 데이터베이스 개요

### 데이터베이스 정보
- **데이터베이스명**: FullAuthSystemDb
- **엔진**: MySQL 8.0
- **문자셋**: utf8mb4
- **정렬**: utf8mb4_unicode_ci

## 🗄️ 테이블 구조

### 1. Users 테이블
```sql
CREATE TABLE `Users` (
    `UserID` varchar(50) NOT NULL,           -- Primary Key (Email과 동일)
    `Password` varchar(100) NOT NULL,         -- SHA256 해시된 비밀번호
    `Name` varchar(50) NOT NULL,              -- 사용자 이름
    `PhoneNumber` varchar(20) NULL,           -- 개인 연락처
    `RoleID` int NOT NULL,                    -- 역할 ID (FK)
    `Email` varchar(100) NOT NULL,            -- 이메일 (UserID와 동일)
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
    PRIMARY KEY (`UserID`),
    FOREIGN KEY (`RoleID`) REFERENCES `Roles` (`RoleID`) ON DELETE CASCADE
);
```

### 2. Roles 테이블
```sql
CREATE TABLE `Roles` (
    `RoleID` int NOT NULL AUTO_INCREMENT,     -- Primary Key
    `RoleName` varchar(50) NOT NULL,          -- 역할명 (Admin, Sales, Customer)
    `Description` varchar(200) NULL,           -- 설명
    `IsActive` tinyint(1) NOT NULL,           -- 활성화 여부
    PRIMARY KEY (`RoleID`)
);
```

### 3. PasswordResetTokens 테이블
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

### 4. EstimateSheetLv1 테이블
```sql
CREATE TABLE `EstimateSheetLv1` (
    `CurEstimateNo` varchar(50) NOT NULL,     -- Primary Key
    `CurEstPrice` int NOT NULL,               -- 견적 가격
    `PrevEstimateNo` varchar(50) NULL,        -- 이전 견적 번호
    `State` int NOT NULL,                     -- 상태
    `CustomerID` varchar(50) NOT NULL,        -- 고객 ID (FK)
    PRIMARY KEY (`CurEstimateNo`),
    FOREIGN KEY (`CustomerID`) REFERENCES `Users` (`UserID`) ON DELETE CASCADE
);
```

### 5. ItemList 테이블
```sql
CREATE TABLE `ItemList` (
    `ItemCode` varchar(50) NOT NULL,          -- Primary Key
    `ItemName` varchar(100) NOT NULL,         -- 품목명
    `ItemDescription` text NULL,               -- 품목 설명
    PRIMARY KEY (`ItemCode`)
);
```

### 6. DataSheetLv3 테이블
```sql
CREATE TABLE `DataSheetLv3` (
    `TagNo` varchar(50) NOT NULL,             -- Primary Key
    `EstimateNo` varchar(50) NOT NULL,        -- 견적 번호 (FK)
    `ItemCode` varchar(50) NOT NULL,          -- 품목 코드 (FK)
    `UnitPrice` int NOT NULL,                 -- 단가
    `Quantity` int NOT NULL,                  -- 수량
    PRIMARY KEY (`TagNo`),
    FOREIGN KEY (`EstimateNo`) REFERENCES `EstimateSheetLv1` (`CurEstimateNo`) ON DELETE CASCADE,
    FOREIGN KEY (`ItemCode`) REFERENCES `ItemList` (`ItemCode`) ON DELETE CASCADE
);
```

## 🔍 기본 쿼리

### 1. 사용자 관련 쿼리

#### 모든 사용자 조회
```sql
SELECT 
    u.UserID,
    u.Email,
    u.Name,
    u.PhoneNumber,
    r.RoleName,
    u.IsApproved,
    u.IsActive,
    u.CreatedAt,
    u.UpdatedAt,
    u.CompanyName,
    u.BusinessNumber,
    u.Address,
    u.CompanyPhone,
    u.Department,
    u.Position
FROM Users u
JOIN Roles r ON u.RoleID = r.RoleID
ORDER BY u.CreatedAt DESC;
```

#### 승인 대기 사용자 조회
```sql
SELECT 
    u.UserID,
    u.Email,
    u.Name,
    r.RoleName,
    u.CreatedAt,
    u.CompanyName,
    u.BusinessNumber,
    u.Address,
    u.CompanyPhone,
    u.Department,
    u.Position,
    u.PhoneNumber
FROM Users u
JOIN Roles r ON u.RoleID = r.RoleID
WHERE u.IsApproved = 0
ORDER BY u.CreatedAt ASC;
```

#### 승인된 사용자 조회
```sql
SELECT 
    u.UserID,
    u.Email,
    u.Name,
    r.RoleName,
    u.IsActive,
    u.ApprovedAt,
    u.ApprovedBy,
    u.CreatedAt
FROM Users u
JOIN Roles r ON u.RoleID = r.RoleID
WHERE u.IsApproved = 1
ORDER BY u.ApprovedAt DESC;
```

#### 특정 사용자 조회
```sql
SELECT 
    u.*,
    r.RoleName,
    r.Description as RoleDescription
FROM Users u
JOIN Roles r ON u.RoleID = r.RoleID
WHERE u.UserID = 'user@example.com';
```

#### 역할별 사용자 수 통계
```sql
SELECT 
    r.RoleName,
    COUNT(*) as UserCount,
    SUM(CASE WHEN u.IsApproved = 1 THEN 1 ELSE 0 END) as ApprovedCount,
    SUM(CASE WHEN u.IsApproved = 0 THEN 1 ELSE 0 END) as PendingCount
FROM Users u
JOIN Roles r ON u.RoleID = r.RoleID
GROUP BY r.RoleID, r.RoleName;
```

### 2. 역할 관련 쿼리

#### 모든 역할 조회
```sql
SELECT 
    RoleID,
    RoleName,
    Description,
    IsActive
FROM Roles
ORDER BY RoleID;
```

#### 활성화된 역할 조회
```sql
SELECT 
    RoleID,
    RoleName,
    Description
FROM Roles
WHERE IsActive = 1
ORDER BY RoleID;
```

### 3. 비밀번호 재설정 토큰 관련 쿼리

#### 유효한 토큰 조회
```sql
SELECT 
    Id,
    Email,
    UserID,
    VerificationCode,
    CreatedAt,
    ExpiresAt,
    IsUsed
FROM PasswordResetTokens
WHERE Email = 'user@example.com'
  AND IsUsed = 0
  AND ExpiresAt > NOW()
ORDER BY CreatedAt DESC
LIMIT 1;
```

#### 만료된 토큰 조회
```sql
SELECT 
    Id,
    Email,
    CreatedAt,
    ExpiresAt
FROM PasswordResetTokens
WHERE ExpiresAt < NOW()
  AND IsUsed = 0;
```

#### 사용된 토큰 조회
```sql
SELECT 
    Id,
    Email,
    CreatedAt,
    UsedAt
FROM PasswordResetTokens
WHERE IsUsed = 1
ORDER BY UsedAt DESC;
```

## 🔧 관리자용 쿼리

### 1. 사용자 관리

#### 사용자 승인
```sql
UPDATE Users 
SET 
    IsApproved = 1,
    ApprovedAt = NOW(),
    ApprovedBy = 'admin@example.com'
WHERE UserID = 'user@example.com';
```

#### 사용자 거부 (삭제)
```sql
DELETE FROM Users 
WHERE UserID = 'user@example.com' 
  AND IsApproved = 0;
```

#### 사용자 비활성화
```sql
UPDATE Users 
SET 
    IsActive = 0,
    UpdatedAt = NOW()
WHERE UserID = 'user@example.com';
```

#### 사용자 역할 변경
```sql
UPDATE Users 
SET 
    RoleID = 2,
    UpdatedAt = NOW()
WHERE UserID = 'user@example.com';
```

### 2. 데이터 정리

#### 만료된 토큰 삭제
```sql
DELETE FROM PasswordResetTokens 
WHERE ExpiresAt < NOW() 
  AND IsUsed = 0;
```

#### 사용된 토큰 삭제
```sql
DELETE FROM PasswordResetTokens 
WHERE IsUsed = 1 
  AND UsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

#### 비활성화된 사용자 삭제 (30일 이상)
```sql
DELETE FROM Users 
WHERE IsActive = 0 
  AND UpdatedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## 📊 통계 쿼리

### 1. 사용자 통계

#### 전체 통계
```sql
SELECT 
    COUNT(*) as TotalUsers,
    SUM(CASE WHEN IsApproved = 1 THEN 1 ELSE 0 END) as ApprovedUsers,
    SUM(CASE WHEN IsApproved = 0 THEN 1 ELSE 0 END) as PendingUsers,
    SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as ActiveUsers,
    SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as InactiveUsers
FROM Users;
```

#### 일별 가입자 통계
```sql
SELECT 
    DATE(CreatedAt) as JoinDate,
    COUNT(*) as NewUsers
FROM Users
WHERE CreatedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(CreatedAt)
ORDER BY JoinDate DESC;
```

#### 역할별 통계
```sql
SELECT 
    r.RoleName,
    COUNT(u.UserID) as UserCount,
    SUM(CASE WHEN u.IsApproved = 1 THEN 1 ELSE 0 END) as ApprovedCount,
    SUM(CASE WHEN u.IsApproved = 0 THEN 1 ELSE 0 END) as PendingCount,
    AVG(CASE WHEN u.IsApproved = 1 THEN 1 ELSE 0 END) * 100 as ApprovalRate
FROM Roles r
LEFT JOIN Users u ON r.RoleID = u.RoleID
GROUP BY r.RoleID, r.RoleName
ORDER BY UserCount DESC;
```

### 2. 비밀번호 재설정 통계

#### 토큰 사용 통계
```sql
SELECT 
    COUNT(*) as TotalTokens,
    SUM(CASE WHEN IsUsed = 1 THEN 1 ELSE 0 END) as UsedTokens,
    SUM(CASE WHEN IsUsed = 0 THEN 1 ELSE 0 END) as UnusedTokens,
    SUM(CASE WHEN ExpiresAt < NOW() THEN 1 ELSE 0 END) as ExpiredTokens
FROM PasswordResetTokens;
```

#### 일별 토큰 생성 통계
```sql
SELECT 
    DATE(CreatedAt) as TokenDate,
    COUNT(*) as TokensCreated,
    SUM(CASE WHEN IsUsed = 1 THEN 1 ELSE 0 END) as TokensUsed
FROM PasswordResetTokens
WHERE CreatedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(CreatedAt)
ORDER BY TokenDate DESC;
```

## 🔍 검색 쿼리

### 1. 사용자 검색

#### 이메일로 검색
```sql
SELECT 
    u.UserID,
    u.Email,
    u.Name,
    u.PhoneNumber,
    r.RoleName
FROM Users u
JOIN Roles r ON u.RoleID = r.RoleID
WHERE u.Email LIKE '%search@example.com%';
```

#### 이름으로 검색
```sql
SELECT 
    u.UserID,
    u.Email,
    u.Name,
    r.RoleName
FROM Users u
JOIN Roles r ON u.RoleID = r.RoleID
WHERE u.Name LIKE '%홍%' 
   OR u.Name LIKE '%길동%'
   OR CONCAT(u.Name, ' ', u.Name) LIKE '%홍길동%';
```

#### 회사명으로 검색
```sql
SELECT 
    u.UserID,
    u.Email,
    u.Name,
    u.CompanyName,
    u.BusinessNumber,
    r.RoleName
FROM Users u
JOIN Roles r ON u.RoleID = r.RoleID
WHERE u.CompanyName LIKE '%기업%';
```

### 2. 고급 검색

#### 조건부 사용자 검색
```sql
SELECT 
    u.UserID,
    u.Email,
    u.Name,
    u.IsApproved,
    u.IsActive,
    r.RoleName,
    u.CompanyName,
    u.CreatedAt
FROM Users u
JOIN Roles r ON u.RoleID = r.RoleID
WHERE 1=1
  AND (u.IsApproved = 1 OR u.IsApproved = 0)  -- 승인 상태
  AND (u.IsActive = 1 OR u.IsActive = 0)       -- 활성화 상태
  AND (r.RoleID = 1 OR r.RoleID = 2 OR r.RoleID = 3)  -- 역할
  AND u.CreatedAt >= '2024-01-01'              -- 가입일
  AND u.CreatedAt <= '2024-12-31'
ORDER BY u.CreatedAt DESC;
```

## 🛠️ 유지보수 쿼리

### 1. 데이터 무결성 검사

#### UserID와 Email 불일치 검사
```sql
SELECT 
    UserID,
    Email
FROM Users
WHERE UserID != Email;
```

#### 존재하지 않는 RoleID 참조 검사
```sql
SELECT 
    u.UserID,
    u.RoleID
FROM Users u
LEFT JOIN Roles r ON u.RoleID = r.RoleID
WHERE r.RoleID IS NULL;
```

#### 중복 이메일 검사
```sql
SELECT 
    Email,
    COUNT(*) as DuplicateCount
FROM Users
GROUP BY Email
HAVING COUNT(*) > 1;
```

### 2. 데이터 정리

#### UserID와 Email 일치시키기
```sql
UPDATE Users 
SET UserID = Email 
WHERE UserID != Email;
```

#### 비밀번호 해시 검증
```sql
-- SHA256 해시 길이는 64자
SELECT 
    UserID,
    LENGTH(Password) as HashLength
FROM Users
WHERE LENGTH(Password) != 64;
```

#### 최근 활동이 없는 사용자 조회
```sql
SELECT 
    UserID,
    Email,
    Name,
    UpdatedAt,
    DATEDIFF(NOW(), UpdatedAt) as DaysSinceUpdate
FROM Users
WHERE UpdatedAt < DATE_SUB(NOW(), INTERVAL 90 DAY)
  AND IsActive = 1;
```

## 📝 백업 및 복원

### 1. 백업 쿼리

#### 전체 데이터베이스 백업
```bash
mysqldump -u root -p FullAuthSystemDb > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 특정 테이블 백업
```bash
mysqldump -u root -p FullAuthSystemDb Users Roles PasswordResetTokens > tables_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 복원 쿼리

#### 전체 데이터베이스 복원
```bash
mysql -u root -p FullAuthSystemDb < backup_20241214_143000.sql
```

#### 특정 테이블 복원
```bash
mysql -u root -p FullAuthSystemDb < tables_backup_20241214_143000.sql
```

## ⚠️ 주의사항

### 1. 보안
- 프로덕션 환경에서는 읽기 전용 계정 사용
- 민감한 데이터 조회 시 로그 기록
- 비밀번호 해시는 절대 평문으로 조회하지 않음

### 2. 성능
- 대용량 데이터 조회 시 LIMIT 사용
- 인덱스가 있는 컬럼으로 WHERE 조건 작성
- JOIN 시 적절한 인덱스 활용

### 3. 데이터 무결성
- 외래키 제약조건 확인
- 트랜잭션 사용으로 데이터 일관성 보장
- 정기적인 데이터 무결성 검사

## 🔧 유용한 팁

### 1. 쿼리 최적화
```sql
-- 인덱스 사용 확인
EXPLAIN SELECT * FROM Users WHERE Email = 'user@example.com';

-- 느린 쿼리 로그 확인
SHOW VARIABLES LIKE 'slow_query_log';
```

### 2. 세션 관리
```sql
-- 현재 세션 정보
SELECT USER(), DATABASE(), VERSION();

-- 활성 세션 조회
SHOW PROCESSLIST;
```

### 3. 테이블 정보
```sql
-- 테이블 구조 확인
DESCRIBE Users;

-- 테이블 상태 확인
SHOW TABLE STATUS LIKE 'Users';
```

---

**최종 업데이트**: 2024년 12월 14일  
**데이터베이스 버전**: MySQL 8.0  
**프로젝트**: FullAuthSystem 