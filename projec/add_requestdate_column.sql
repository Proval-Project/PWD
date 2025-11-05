-- EstimateSheetLv1 테이블에 RequestDate 컬럼 추가
-- User 테이블에 IsActive 컬럼 추가
-- 이 스크립트는 기존 테이블에 컬럼을 추가합니다.

USE pwd_final;

-- 1. EstimateSheetLv1 테이블에 RequestDate 컬럼 추가
-- RequestDate 컬럼이 이미 존재하는지 확인하고 없으면 추가
-- MySQL에서는 IF NOT EXISTS를 지원하지 않으므로, 에러가 발생하면 무시하세요
ALTER TABLE EstimateSheetLv1 
ADD COLUMN RequestDate DATETIME NULL DEFAULT NULL 
AFTER StaffComment;

-- 기존 데이터가 있는 경우, TempEstimateNo에서 날짜를 추출하여 RequestDate 업데이트
-- TEMP20250103-001 형식에서 날짜 추출
UPDATE EstimateSheetLv1 
SET RequestDate = STR_TO_DATE(
    CONCAT(
        SUBSTRING(TempEstimateNo, 5, 4), '-',  -- YYYY
        SUBSTRING(TempEstimateNo, 9, 2), '-',  -- MM
        SUBSTRING(TempEstimateNo, 11, 2)       -- DD
    ),
    '%Y-%m-%d'
)
WHERE RequestDate IS NULL 
  AND TempEstimateNo LIKE 'TEMP%'
  AND LENGTH(TempEstimateNo) >= 12;

-- 2. User 테이블에 IsActive 컬럼 추가
-- IsActive 컬럼이 이미 존재하는지 확인하고 없으면 추가
-- MySQL에서는 IF NOT EXISTS를 지원하지 않으므로, 에러가 발생하면 무시하세요
ALTER TABLE User
ADD COLUMN IsActive BOOLEAN NOT NULL DEFAULT TRUE
AFTER IsApproved;

-- 기존 데이터가 있는 경우, 모든 사용자를 활성 상태로 설정
UPDATE User
SET IsActive = TRUE
WHERE IsActive IS NULL;

