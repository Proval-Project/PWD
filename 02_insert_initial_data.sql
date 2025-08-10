-- 초기 데이터 삽입
USE PWD_Final;

-- 1) Role 데이터
INSERT INTO Role (RoleID, RoleName, Description) VALUES
(1, 'Admin', '관리자'),
(2, 'Staff', '직원'),
(3, 'Customer', '고객');

-- 2) User 데이터 (테스트용)
INSERT INTO User (UserID, Password, CompanyName, CompanyPhone, RoleID, Position, Department, Name, BusinessNumber, Address, Email, PhoneNumber, IsApproved) VALUES
('admin', 'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=', '관리자회사', '02-1234-5678', 1, '관리자', '관리팀', '관리자', '123-45-67890', '서울시 강남구', 'admin@example.com', '010-1234-5678', TRUE),
('customer1', 'sEHArrNbsPpKpmjKWpILWQGW/a+aAOuFLJt/TRI8xtY=', '테스트고객사', '02-2345-6789', 3, '과장', '구매팀', '김고객', '234-56-78901', '서울시 서초구', 'customer1@example.com', '010-2345-6789', TRUE),
('staff1', 'EBdue3sk0xes/PjSBkz9LyThVPe1qWYDB31e+BPWprY=', '직원회사', '02-3456-7890', 2, '대리', '영업팀', '박직원', '345-67-89012', '서울시 마포구', 'staff1@example.com', '010-3456-7890', TRUE);

-- 3) BodyValveList 데이터 (이미지 참조)
INSERT INTO BodyValveList (ValveSeries, ValveSeriesCode) VALUES
('None', '0'),
('2-Way Globe', 'A'),
('3-Way Globe', 'B'),
('Angle', 'C'),
('Hi-Performance Butterfly', 'D'),
('Segmental Ball', 'E'),
('Damper', 'F'),
('2-Way Ball', 'G'),
('Gate Valve', 'H'),
('Electric Motor Globe', 'I'),
('Electric Motor Gate', 'J'),
('Diaphragm (Weir Type)', 'K'),
('2-WAY GLOBE JAKET', 'L'),
('Float 2-Way Globe', 'M'),
('3-Way Ball', 'N'),
('SPECIAL', 'Z');

-- 4) BodyBonnetList 데이터 (이미지 참조)
INSERT INTO BodyBonnetList (BonnetType, BonnetCode) VALUES
('None', '0'),
('Standard', 'A'),
('Extension', 'B'),
('Extension (Short)', 'C'),
('Extension (Long)', 'D'),
('Extension (Cry.)', 'E'),
('Damper', 'F'),
('2-Way Ball', 'G'),
('Gate Valve', 'H'),
('Bellows (STD)', 'I'),
('Bellows (Long)', 'J'),
('Electric Motor Globe', 'K'),
('Electric Motor Gate', 'L'),
('Diaphragm (Weir Type)', 'M'),
('2-WAY GLOBE JAKET', 'N'),
('Float 2-Way Globe', 'O'),
('3-Way Ball', 'P'),
('SPECIAL', 'Z');

-- 5) BodyMatList 데이터 (이미지 참조)
INSERT INTO BodyMatList (BodyMat, BodyMatCode) VALUES
('None', '0'),
('WCB', 'A'),
('LCB', 'B'),
('WC6', 'C'),
('WC9', 'D'),
('CF8 (SCS13)', 'E'),
('CF8M (SCS14)', 'F'),
('CF3', 'G'),
('CF3M', 'H'),
('A105', 'I'),
('F11', 'J'),
('F22', 'K'),
('F51', 'L'),
('F52', 'M'),
('F53', 'N'),
('F55', 'O'),
('SUS304', 'P'),
('SUS316', 'Q'),
('F304', 'R'),
('F316', 'S'),
('SPECIAL', 'Z');

-- 6) BodySizeList 데이터 (이미지 참조) - 단위를 별도로 표기
INSERT INTO BodySizeList (SizeUnit, BodySize, BodySizeCode) VALUES
('None', 'None', '0'),
('A', '15A', 'A'),
('A', '20A', 'B'),
('A', '25A', 'C'),
('A', '32A', 'D'),
('A', '40A', 'E'),
('A', '50A', 'F'),
('A', '65A', 'G'),
('A', '80A', 'H'),
('A', '100A', 'I'),
('A', '125A', 'J'),
('A', '150A', 'K'),
('A', '200A', 'L'),
('A', '250A', 'M'),
('A', '300A', 'N'),
('A', '350A', 'O'),
('A', '400A', 'P'),
('A', '450A', 'Q'),
('A', '500A', 'R'),
('A', '550A', 'S'),
('A', '600A', 'T'),
('A', '650A', 'U'),
('A', '700A', 'V'),
('A', '750A', 'W'),
('A', '800A', 'X'),
('A', '900A', 'Y'),
('inch', '1/2"', 'A'),
('inch', '3/4"', 'B'),
('inch', '1"', 'C'),
('inch', '1 1/4"', 'D'),
('inch', '1 1/2"', 'E'),
('inch', '2"', 'F'),
('inch', '2 1/2"', 'G'),
('inch', '3"', 'H'),
('inch', '4"', 'I'),
('inch', '5"', 'J'),
('inch', '6"', 'K'),
('inch', '8"', 'L'),
('inch', '10"', 'M'),
('inch', '12"', 'N'),
('inch', '14"', 'O'),
('inch', '16"', 'P'),
('inch', '18"', 'Q'),
('inch', '20"', 'R'),
('inch', '22"', 'S'),
('inch', '24"', 'T'),
('inch', '26"', 'U'),
('inch', '28"', 'V'),
('inch', '30"', 'W'),
('inch', '32"', 'X'),
('inch', '36"', 'Y'),
('SPECIAL', 'SPECIAL', 'Z');

-- 7) BodyRatingList 데이터 (이미지 참조) - 단위를 별도로 표기
INSERT INTO BodyRatingList (RatingUnit, RatingCode, RatingName) VALUES
('ASME', 'A', '150#'),
('ASME', 'B', '300#'),
('ASME', 'C', '600#'),
('ASME', 'D', '900#'),
('ASME', 'E', '1500#'),
('ASME', 'F', '2500#'),
('ASME', 'G', '3500#'),
('ASME', 'H', '4500#'),
('JIS/KS', 'I', '5K'),
('JIS/KS', 'J', '10K'),
('JIS/KS', 'K', '16K'),
('JIS/KS', 'L', '20K'),
('JIS/KS', 'M', '30K'),
('JIS/KS', 'N', '40K'),
('JIS/KS', 'O', '63K'),
('PN', 'P', 'PN 10'),
('PN', 'Q', 'PN 16'),
('PN', 'R', 'PN 25'),
('PN', 'S', 'PN 40'),
('PN', 'T', 'PN 63'),
('SPECIAL', 'Z', 'SPECIAL');

-- 8) BodyConnectionList 데이터 (이미지 참조)
INSERT INTO BodyConnectionList (Connection, ConnectionCode) VALUES
('None', '0'),
('R.F', 'A'),
('F.F', 'B'),
('S.W', 'C'),
('B.W', 'D'),
('Wafer', 'E'),
('Screwed', 'F'),
('Female', 'G'),
('RTJ', 'H'),
('SPECIAL', 'Z');

-- 9) TrimTypeList 데이터 (이미지 참조)
INSERT INTO TrimTypeList (TrimType, TrimTypeCode) VALUES
('None', '0'),
('T-Port', 'A'),
('Y-Port', 'B'),
('L-Port', 'C'),
('Multi-Hole', 'D'),
('Multi-Hole(P-Port)', 'E'),
('Balanced / Protek', 'F'),
('Balanced', 'G'),
('Diverting', 'H'),
('Concentric', 'I'),
('Eccentric', 'J'),
('TRIPLE OFF SET', 'K'),
('Floating', 'L'),
('Trunnion Type', 'M'),
('Knife Gate', 'N'),
('L-Type', 'O'),
('Mixing', 'P'),
('Straight', 'Q'),
('Weir', 'R'),
('Unbalanced / Protek', 'S'),
('Unbalanced', 'T'),
('SPECIAL', 'Z');

-- 10) TrimSeriesList 데이터 (이미지 참조)
INSERT INTO TrimSeriesList (TrimSeries, TrimSeriesCode) VALUES
('None', '0'),
('Single Port & Seat', 'A'),
('Quick-Change / P-Port', 'B'),
('Quick-Change', 'C'),
('Cage Single', 'D'),
('Multi-Hole', 'E'),
('Multi-Hole(P-Port)', 'F'),
('Diverting', 'G'),
('Concentric', 'H'),
('Eccentric', 'I'),
('TRIPLE OFF SET', 'J'),
('Floating', 'K'),
('Trunnion Type', 'L'),
('Knife Gate', 'M'),
('L-Type', 'N'),
('Straight', 'O'),
('Weir', 'P'),
('Unbalanced / Protek', 'Q'),
('Unbalanced', 'R'),
('SPECIAL', 'Z');

-- 11) TrimMatList 데이터 (이미지 참조)
INSERT INTO TrimMatList (TrimMat, TrimMatCode) VALUES
('None', '0'),
('WCB (SCPH2)', 'A'),
('LCB', 'B'),
('WC6', 'C'),
('WC9', 'D'),
('CF8 (SCS13)', 'E'),
('CF8M (SCS14)', 'F'),
('CF3', 'G'),
('CF3M', 'H'),
('A105', 'I'),
('F11', 'J'),
('F22', 'K'),
('F51', 'L'),
('F52', 'M'),
('F53', 'N'),
('F55', 'O'),
('SUS304', 'P'),
('SUS316', 'Q'),
('304 / RTFE', 'R'),
('316 / RTFE', 'S'),
('304 / PTFE', 'T'),
('316 / PTFE', 'U'),
('304 / PCTFE', 'V'),
('316 / PCTFE', 'W'),
('CF8M / RTFE', 'X'),
('CF8 / RTFE', 'Y'),
('PTFE', 'Z'),
('PFA LINED', '1'),
('304 / Alloy-TiC', '2'),
('TCC(304)', '3'),
('TCC(316)', '4'),
('630', '5'),
('SUS420J2', '6'),
('SPECIAL', '7');

-- 12) TrimPortSizeList 데이터 (이미지 참조) - 단위를 별도로 표기
INSERT INTO TrimPortSizeList (PortSizeCode, PortSizeUnit, PortSize) VALUES
('0', 'None', 'None'),
('A', 'inch', '1/8"'),
('B', 'inch', '1/4"'),
('C', 'inch', '3/8"'),
('D', 'inch', '1/2"'),
('E', 'inch', '3/4"'),
('F', 'inch', '1"'),
('G', 'inch', '1 1/4"'),
('H', 'inch', '1 1/2"'),
('I', 'inch', '2"'),
('J', 'inch', '2 1/2"'),
('K', 'inch', '3"'),
('L', 'inch', '4"'),
('M', 'inch', '5"'),
('N', 'inch', '6"'),
('O', 'inch', '8"'),
('P', 'inch', '10"'),
('Q', 'inch', '12"'),
('R', 'inch', '14"'),
('S', 'inch', '16"'),
('T', 'inch', '18"'),
('U', 'inch', '20"'),
('V', 'inch', '22"'),
('W', 'inch', '24"'),
('X', 'inch', '26"'),
('Y', 'inch', '28"'),
('Z', 'inch', '30"'),
('1', 'inch', '32"'),
('2', 'inch', '36"'),
('7', 'SPECIAL', 'SPECIAL');

-- 13) TrimFormList 데이터 (이미지 참조)
INSERT INTO TrimFormList (TrimForm, TrimFormCode) VALUES
('None', '0'),
('(NONE)', 'A'),
('Equal %', 'B'),
('Linear', 'C'),
('Quick-Open', 'D'),
('Modified-Linear', 'E'),
('On-Off', 'F'),
('SPECIAL', 'Z');

-- 14) TrimOptionList 데이터 (이미지 참조)
INSERT INTO TrimOptionList (TrimOptionCode, TrimOptionName) VALUES
('A', 'Standard'),
('B', 'Reduced'),
('C', 'Anti-cavitation'),
('D', 'Low Noise'),
('E', 'Cage');

-- 15) ActTypeList 데이터 (이미지 참조)
INSERT INTO ActTypeList (ActType, ActTypeCode) VALUES
('None', '0'),
('Double', 'B'),
('DA (Open)', 'D'),
('RA (Close)', 'R'),
('SPECIAL', 'Z');

-- 16) ActSeriesList 데이터 (이미지 참조)
INSERT INTO ActSeriesList (ActSeries, ActSeriesCode) VALUES
('None', '0'),
('A시리즈', 'A'),
('B시리즈', 'B'),
('C시리즈', 'C'),
('DB시리즈', 'D'),
('CB시리즈', 'E'),
('Float', 'F'),
('(HKC)HP시리즈', 'H'),
('(성원)PM시리즈', 'P'),
('R시리즈', 'R'),
('C V/T시리즈', 'T'),
('R V/T시리즈', 'V'),
('SPECIAL', 'Z');

-- 17) ActSizeList 데이터 (이미지 참조)
INSERT INTO ActSizeList (ActSeriesCode, ActSize, ActSizeCode) VALUES
-- A시리즈
('A', 'None', '0'),
('A', 'A-220M', '1'),
('A', 'A-270M', '2'),
('A', 'A-360M', '3'),
('A', 'A-430M', '4'),
('A', 'A-520M', '5'),
-- B시리즈
('B', 'None', '0'),
('B', 'B1', '1'),
('B', 'B2', '2'),
('B', 'B3', '3'),
('B', 'B4', '4'),
('B', 'B5', '5'),
('B', 'B6', '6'),
-- C시리즈
('C', 'None', '0'),
('C', 'C-160', '1'),
('C', 'C-200', '2'),
('C', 'C-250', '3'),
('C', 'C-300', '4'),
('C', 'C-350', '5'),
('C', 'C-400', '6'),
('C', 'C-450', '7'),
('C', 'C-500', '8'),
-- DB시리즈
('D', 'None', '0'),
('D', 'DB-270', '1'),
('D', 'DB-360', '2'),
('D', 'DB-430', '3'),
('D', 'DB-520', '4'),
-- CB시리즈
('E', 'None', '0'),
('E', 'CB-270', '1'),
('E', 'CB-360', '2'),
('E', 'CB-430', '3'),
('E', 'CB-520', '4'),
-- Float
('F', 'None', '0'),
('F', '25A용', '1'),
('F', '40-50A용', '2'),
-- HP시리즈
('H', 'None', '0'),
('H', 'HP-88 (B1)', '1'),
('H', 'HP-100 (B2)', '2'),
('H', 'HP-125 (B4)', '3'),
('H', 'HP-66 (B0)', '4'),
('H', 'HP-115(B3)', '5'),
('H', 'HP-145 (B6)', '6'),
('H', 'HP-160', '7'),
('H', 'HP-200', '8'),
-- PM시리즈
('P', 'None', '0'),
('P', 'PM-S065 (B1)', '1'),
('P', 'PM-S080 (B2)', '2'),
('P', 'PM-S100 (B3)', '3'),
('P', 'PM-S125 (B4)', '4'),
('P', 'PM-S140 (B5)', '5'),
('P', 'PM-S160 (B6)', '6'),
-- R시리즈
('R', 'None', '0'),
('R', 'R6', '1'),
('R', 'R7', '2'),
('R', 'R8', '3'),
('R', 'R9', '4'),
('R', 'R10', '5'),
('R', 'R11', '6'),
('R', 'R12', '7'),
('R', 'R13', '8'),
('R', 'R14', '9'),
('R', 'R15', 'A'),
-- C V/T시리즈
('T', 'None', '0'),
('T', 'C-160 + V/T', '1'),
('T', 'C-200 + V/T', '2'),
('T', 'C-250 + V/T', '3'),
('T', 'C-300 + V/T', '4'),
('T', 'C-350 + V/T', '5'),
('T', 'C-400 + V/T', '6'),
('T', 'C-450 + V/T', '7'),
('T', 'C-500 + V/T', '8'),
-- R V/T시리즈
('V', 'None', '0'),
('V', 'R6 + V/T', '1'),
('V', 'R7 + V/T', '2'),
('V', 'R8 + V/T', '3'),
('V', 'R9 + V/T', '4'),
('V', 'R10 + V/T', '5'),
('V', 'R11 + V/T', '6'),
('V', 'R12 + V/T', '7'),
('V', 'R13 + V/T', '8'),
('V', 'R14 + V/T', '9'),
('V', 'R15 + V/T', 'A'),
-- SPECIAL
('Z', 'None', '0');

-- 18) ActHWList 데이터 (이미지 참조)
INSERT INTO ActHWList (HW, HWCode) VALUES
('None', '0'),
('Screwed', '1'),
('Screwed / Top', '2'),
('Screwed / Side', '3'),
('Worm-Gear-Top', '4'),
('Worm-Gear-Side', '5'),
('Declutchable', '6');

-- 19) AccTypeList 데이터 (이미지 참조)
INSERT INTO AccTypeList (AccTypeCode, AccTypeName) VALUES
('A', 'Positioner'),
('B', 'Solenoid Valve'),
('C', 'Limit Switch'),
('D', 'Air Set'),
('E', 'Volume Booster'),
('F', 'Air Operated'),
('G', 'Lock Up'),
('H', 'Snap Acting Relay');

-- 20) AccMakerList 데이터 (이미지 참조)
INSERT INTO AccMakerList (AccMakerCode, AccMakerName, AccTypeCode) VALUES
-- Positioner 제조사
('A', 'YTC', 'A'),
('B', 'SAMSON', 'A'),
('C', 'FISHER', 'A'),
-- Solenoid Valve 제조사
('D', 'YTC', 'B'),
('E', 'SAMSON', 'B'),
('F', 'FISHER', 'B'),
-- Limit Switch 제조사
('G', 'YTC', 'C'),
('H', 'SAMSON', 'C'),
('I', 'FISHER', 'C'),
-- Air Set 제조사
('J', 'Tissin', 'D'),
('K', 'SAMSON', 'D'),
('L', 'FISHER', 'D'),
-- Volume Booster 제조사
('M', 'YTC', 'E'),
('N', 'SAMSON', 'E'),
('O', 'FISHER', 'E'),
-- Air Operated 제조사
('P', 'YTC', 'F'),
('Q', 'SAMSON', 'F'),
('R', 'FISHER', 'F'),
-- Lock Up 제조사
('S', 'YTC', 'G'),
('T', 'SAMSON', 'G'),
('U', 'FISHER', 'G'),
-- Snap Acting Relay 제조사
('V', 'YTC', 'H'),
('W', 'SAMSON', 'H'),
('X', 'FISHER', 'H');

-- 21) AccModelList 데이터 (이미지 참조)
INSERT INTO AccModelList (AccModelCode, AccModelName, AccTypeCode, AccMakerCode, AccSize, AccStatus) VALUES
-- Positioner 모델
('A001', 'YT-1000R', 'A', 'A', '1/2', TRUE),
('A002', '3760', 'A', 'B', '1', TRUE),
('A003', '3582', 'A', 'C', '1/4', TRUE),
-- Solenoid Valve 모델
('B001', 'YT-2000', 'B', 'D', '1/2', TRUE),
('B002', '3785', 'B', 'E', '1', TRUE),
('B003', '3585', 'B', 'F', '1/4', TRUE),
-- Limit Switch 모델
('C001', 'YT-3000', 'C', 'G', '1/2', TRUE),
('C002', '3790', 'C', 'H', '1', TRUE),
('C003', '3590', 'C', 'I', '1/4', TRUE),
-- Air Set 모델
('D001', 'TS300PS0', 'D', 'J', '1/4', TRUE),
('D002', 'PT 1/4', 'D', 'J', '1/4', TRUE),
('D003', 'TS500PS0', 'D', 'K', '1/2', TRUE),
-- Volume Booster 모델
('E001', 'VB-100', 'E', 'M', '1/2', TRUE),
('E002', 'VB-200', 'E', 'N', '1', TRUE),
('E003', 'VB-300', 'E', 'O', '1/4', TRUE),
-- Air Operated 모델
('F001', 'AO-100', 'F', 'P', '1/2', TRUE),
('F002', 'AO-200', 'F', 'Q', '1', TRUE),
('F003', 'AO-300', 'F', 'R', '1/4', TRUE),
-- Lock Up 모델
('G001', 'LU-100', 'G', 'S', '1/2', TRUE),
('G002', 'LU-200', 'G', 'T', '1', TRUE),
('G003', 'LU-300', 'G', 'U', '1/4', TRUE),
-- Snap Acting Relay 모델
('H001', 'SAR-100', 'H', 'V', '1/2', TRUE),
('H002', 'SAR-200', 'H', 'W', '1', TRUE),
('H003', 'SAR-300', 'H', 'X', '1/4', TRUE);
