-- =====================================================
-- PWD 데이터베이스 초기 설정 파일
-- =====================================================

USE PWD_Final;

-- =====================================================
-- 1. 기본 역할(Role) 데이터 삽입
-- =====================================================
INSERT INTO Role (RoleID, RoleName, Description) VALUES
(1, '관리자', '시스템 전체 관리 권한'),
(2, '영업', '영업 관련 기능 사용 권한'),
(3, '고객', '견적 요청 및 조회 권한');

-- =====================================================
-- 2. 기본 관리자 계정 생성
-- =====================================================
-- 비밀번호: admin123 (BCrypt 해시)
INSERT INTO User (
    UserID, 
    Password, 
    CompanyName, 
    CompanyPhone, 
    RoleID, 
    Position, 
    Department, 
    Name, 
    BusinessNumber, 
    Address, 
    Email, 
    PhoneNumber, 
    IsApproved
) VALUES (
    'admin',
    '$2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'PWD 시스템 관리',
    '02-1234-5678',
    1,
    '시스템 관리자',
    'IT 관리팀',
    '시스템 관리자',
    '123-45-67890',
    '서울특별시 강남구 테헤란로 123',
    'admin@pwd.com',
    '010-1234-5678',
    TRUE
);

-- =====================================================
-- 3. 기본 악세사리 타입 데이터
-- =====================================================
INSERT INTO AccTypeList (AccTypeCode, AccTypeName) VALUES
('P', 'Positioner'),
('S', 'Solenoid'),
('L', 'Limit Switch'),
('A', 'Air Set'),
('V', 'Volume Booster'),
('O', 'Air Operated'),
('K', 'Lock Up'),
('N', 'Snap Acting Relay');

-- =====================================================
-- 4. 기본 악세사리 메이커 데이터
-- =====================================================
INSERT INTO AccMakerList (AccMakerCode, AccMakerName, AccTypeCode) VALUES
('1', 'Fisher', 'P'),
('2', 'Masoneilan', 'P'),
('3', 'Samson', 'P'),
('4', 'Fisher', 'S'),
('5', 'Masoneilan', 'S'),
('6', 'Samson', 'S'),
('7', 'Fisher', 'L'),
('8', 'Masoneilan', 'L'),
('9', 'Samson', 'L');

-- =====================================================
-- 5. 기본 Body Valve 데이터
-- =====================================================
INSERT INTO BodyValveList (ValveSeries, ValveSeriesCode) VALUES
('Globe', 'G'),
('Ball', 'B'),
('Butterfly', 'F'),
('Plug', 'P'),
('Diaphragm', 'D');

-- =====================================================
-- 6. 기본 Body Bonnet 데이터
-- =====================================================
INSERT INTO BodyBonnetList (BonnetType, BonnetCode) VALUES
('Standard', 'S'),
('Extended', 'E'),
('Cryogenic', 'C'),
('Bellows Seal', 'B');

-- =====================================================
-- 7. 기본 Body Material 데이터
-- =====================================================
INSERT INTO BodyMatList (BodyMat, BodyMatCode) VALUES
('Carbon Steel', 'C'),
('Stainless Steel', 'S'),
('Alloy Steel', 'A'),
('Cast Iron', 'I'),
('Duplex Steel', 'D');

-- =====================================================
-- 8. 기본 Body Size 데이터
-- =====================================================
INSERT INTO BodyTrimSizeList (SizeUnit, BodySize, BodySizeCode) VALUES
('mm', '15', '1'),
('mm', '20', '2'),
('mm', '25', '3'),
('mm', '32', '4'),
('mm', '40', '5'),
('mm', '50', '6'),
('mm', '65', '7'),
('mm', '80', '8'),
('mm', '100', '9'),
('mm', '125', 'A'),
('mm', '150', 'B'),
('mm', '200', 'C'),
('mm', '250', 'D'),
('mm', '300', 'E');

-- =====================================================
-- 9. 기본 Body Rating 데이터
-- =====================================================
INSERT INTO BodyRatingList (RatingUnit, Rating, RatingCode) VALUES
('PN', 'PN16', '1'),
('PN', 'PN25', '2'),
('PN', 'PN40', '3'),
('PN', 'PN63', '4'),
('Class', 'Class 150', '5'),
('Class', 'Class 300', '6'),
('Class', 'Class 600', '7'),
('Class', 'Class 900', '8'),
('Class', 'Class 1500', '9');

-- =====================================================
-- 10. 기본 Body Connection 데이터
-- =====================================================
INSERT INTO BodyConnectionList (Connection, ConnectionCode) VALUES
('Flanged', 'F'),
('Welded', 'W'),
('Threaded', 'T'),
('Socket Weld', 'S');

-- =====================================================
-- 11. 기본 Trim Type 데이터
-- =====================================================
INSERT INTO TrimTypeList (TrimType, TrimTypeCode) VALUES
('Equal Percentage', 'E'),
('Linear', 'L'),
('Quick Opening', 'Q'),
('Modified Equal Percentage', 'M');

-- =====================================================
-- 12. 기본 Trim Series 데이터
-- =====================================================
INSERT INTO TrimSeriesList (TrimSeries, TrimSeriesCode) VALUES
('Standard', 'S'),
('High Performance', 'H'),
('Low Noise', 'L'),
('Anti-cavitation', 'A');

-- =====================================================
-- 13. 기본 Trim Material 데이터
-- =====================================================
INSERT INTO TrimMatList (TrimMat, TrimMatCode) VALUES
('Stainless Steel', 'S'),
('Hardened Steel', 'H'),
('Stellite', 'T'),
('Tungsten Carbide', 'W'),
('Ceramic', 'C');

-- =====================================================
-- 14. 기본 Trim Port Size 데이터
-- =====================================================
INSERT INTO TrimPortSizeList (TrimPortSizeUnit, TrimPortSize, TrimPortSizeCode) VALUES
('mm', '15', '1'),
('mm', '20', '2'),
('mm', '25', '3'),
('mm', '32', '4'),
('mm', '40', '5'),
('mm', '50', '6'),
('mm', '65', '7'),
('mm', '80', '8'),
('mm', '100', '9');

-- =====================================================
-- 15. 기본 Trim Form 데이터
-- =====================================================
INSERT INTO TrimFormList (TrimForm, TrimFormCode) VALUES
('Cage', 'C'),
('Ported Plug', 'P'),
('Contoured', 'T'),
('Characterized', 'H');

-- =====================================================
-- 16. 기본 Trim Option 데이터
-- =====================================================
INSERT INTO TrimOptionList (TrimOption) VALUES
('Standard'),
('Anti-cavitation'),
('Low Emission'),
('High Temperature'),
('Cryogenic');

-- =====================================================
-- 17. 기본 Act Type 데이터
-- =====================================================
INSERT INTO ActTypeList (ActType, ActTypeCode) VALUES
('Pneumatic', 'P'),
('Electric', 'E'),
('Hydraulic', 'H'),
('Electro-hydraulic', 'L');

-- =====================================================
-- 18. 기본 Act Series 데이터
-- =====================================================
INSERT INTO ActSeriesList (ActSeries, ActSeriesCode) VALUES
('Standard', 'S'),
('High Thrust', 'H'),
('Low Friction', 'L'),
('High Temperature', 'T');

-- =====================================================
-- 19. 기본 Act Size 데이터
-- =====================================================
INSERT INTO ActSizeList (ActSeriesCode, ActSize, ActSizeCode) VALUES
('S', 'Small', 'S'),
('S', 'Medium', 'M'),
('S', 'Large', 'L'),
('H', 'Small', 'S'),
('H', 'Medium', 'M'),
('H', 'Large', 'L'),
('L', 'Small', 'S'),
('L', 'Medium', 'M'),
('L', 'Large', 'L');

-- =====================================================
-- 20. 기본 Act HW 데이터
-- =====================================================
INSERT INTO ActHWList (HW, HWCode) VALUES
('Handwheel', 'H'),
('Manual Override', 'M'),
('Locking Device', 'L'),
('Position Indicator', 'P');

-- =====================================================
-- 21. 기본 악세사리 모델 데이터
-- =====================================================
INSERT INTO AccModelList (AccModelCode, AccModelName, AccTypeCode, AccMakerCode, AccSize, AccStatus) VALUES
-- Positioner
('POS001', 'Fisher DVC2000', 'P', '1', 'Standard', TRUE),
('POS002', 'Masoneilan SVI II', 'P', '2', 'Standard', TRUE),
('POS003', 'Samson 3730', 'P', '3', 'Standard', TRUE),
('POS004', 'Fisher DVC6000', 'P', '1', 'High Performance', TRUE),
('POS005', 'Masoneilan SVI II AP', 'P', '2', 'High Performance', TRUE),

-- Solenoid
('SOL001', 'Fisher 546', 'S', '4', '1/4"', TRUE),
('SOL002', 'Masoneilan 67', 'S', '5', '1/4"', TRUE),
('SOL003', 'Samson 3321', 'S', '6', '1/4"', TRUE),
('SOL004', 'Fisher 546E', 'S', '4', '1/2"', TRUE),
('SOL005', 'Masoneilan 67E', 'S', '5', '1/2"', TRUE),

-- Limit Switch
('LIM001', 'Fisher 546LS', 'L', '7', 'Standard', TRUE),
('LIM002', 'Masoneilan 67LS', 'L', '8', 'Standard', TRUE),
('LIM003', 'Samson 3321LS', 'L', '9', 'Standard', TRUE),

-- Air Set
('AIR001', 'Fisher 546AS', 'A', '4', 'Standard', TRUE),
('AIR002', 'Masoneilan 67AS', 'A', '5', 'Standard', TRUE),

-- Volume Booster
('VOL001', 'Fisher 546VB', 'V', '4', 'Standard', TRUE),
('VOL002', 'Masoneilan 67VB', 'V', '5', 'Standard', TRUE),

-- Air Operated
('AOP001', 'Fisher 546AO', 'O', '4', 'Standard', TRUE),
('AOP002', 'Masoneilan 67AO', 'O', '5', 'Standard', TRUE),

-- Lock Up
('LUP001', 'Fisher 546LU', 'K', '4', 'Standard', TRUE),
('LUP002', 'Masoneilan 67LU', 'K', '5', 'Standard', TRUE),

-- Snap Acting Relay
('SAP001', 'Fisher 546SR', 'N', '4', 'Standard', TRUE),
('SAP002', 'Masoneilan 67SR', 'N', '5', 'Standard', TRUE);

-- =====================================================
-- 설정 완료 메시지
-- =====================================================
SELECT '데이터베이스 초기 설정이 완료되었습니다!' AS Message;

-- 관리자 계정 확인
SELECT 
    UserID, 
    Name, 
    Email, 
    RoleID, 
    IsApproved 
FROM User 
WHERE RoleID = 1; 