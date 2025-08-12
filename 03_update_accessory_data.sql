USE PWD_Final;
-- 액세서리 마스터 데이터 업데이트
-- 기존 데이터 삭제
DELETE FROM AccModelList;
DELETE FROM AccMakerList;
DELETE FROM AccTypeList;

-- 액세서리 타입 데이터 삽입
INSERT INTO AccTypeList (AccTypeCode, AccTypeName) VALUES
('A', 'Positioner'),
('B', 'Solenoid Valve'),
('C', 'Limit Switch'),
('D', 'Air-set'),
('E', 'Volume Booster'),
('F', 'Air Operated Valve'),
('G', 'Lockup Valve'),
('H', 'Snap-acting Relay');

-- 액세서리 메이커 데이터 삽입 (AccMakerCode를 한 글자로)
INSERT INTO AccMakerList (AccTypeCode, AccMakerCode, AccMakerName) VALUES
-- Positioner (A)
('A', 'A', 'Azbil'),
('A', 'P', 'Proval'),
('A', 'S', 'SMC'),
('A', 'T', 'Tissin'),
('A', 'R', 'Rotork'),

-- Solenoid Valve (B)
('B', 'C', 'CKD'),
('B', 'G', 'PG'),
('B', 'H', 'HSE'),
('B', 'A', 'ASCO'),
('B', 'K', 'KANEKO'),
('B', 'T', 'TPC'),
('B', 'Y', '신영제어기기'),

-- Limit Switch (C)
('C', 'H', 'HKC'),
('C', 'O', 'Honeywell'),
('C', 'Q', 'Qlight'),
('C', 'T', 'Tissin'),

-- Air-set (D)
('D', 'P', 'Proval'),
('D', 'S', 'SMC'),
('D', 'C', 'CKD'),
('D', 'T', 'Tissin'),
('D', 'R', 'Rotork'),

-- Volume Booster (E)
('E', 'P', 'Proval'),
('E', 'R', 'Rotork'),

-- Air Operated Valve (F)
('F', 'Y', '연우뉴매틱'),
('F', 'N', '신영제어기기'),

-- Lockup Valve (G)
('G', 'P', 'Proval'),

-- Snap-acting Relay (H)
('H', 'T', 'Tissin');

-- 액세서리 모델 데이터 삽입 (AccModelCode를 10글자 이하로)
INSERT INTO AccModelList (AccTypeCode, AccMakerCode, AccModelCode, AccModelName, AccSize) VALUES
-- Positioner (A)
('A', 'A', '1', 'AVP300-HSD3D-XXXX-X', '내압방폭 + NPT 1/2'),
('A', 'A', '2', 'AVP302-HSD3D-XXXX-X', '내압방폭 + NPT 1/2 + HART'),
('A', 'P', '1', 'EP-6000LN12S0(TS600)', '비방폭 + PT 1/2'),
('A', 'P', '2', 'EP-6100RN11S0', '비방폭 + PT 1/2'),
('A', 'S', '1', 'IP8100-031-CH-X114', '내압방폭 + PT 1/2'),
('A', 'P', '3', 'SP-8000N11S10(TS800)', '비방폭 + PT 1/2 + PTM'),
('A', 'P', '4', 'SP-8000N11S30(TS800)', '비방폭 + PT 1/2 + PTM+HART'),
('A', 'P', '5', 'SP-8100N11S30(TS800)', '비방폭 + PT 1/2 + PTM+HART'),
('A', 'T', '1', 'TS600LB12S0', '내압방폭 + PT 1/2'),
('A', 'T', '2', 'TS600LC12S0', '수소방폭 + PT 1/2'),
('A', 'T', '3', 'TS600LN12S1', '비방폭 + PT 1/2 + PTM'),
('A', 'T', '4', 'TS600RB11S0', '내압방폭 + PT 1/2'),
('A', 'T', '5', 'TS600RN11S1', '비방폭 + PT 1/2 + PTM'),
('A', 'T', '6', 'TS700LSN11S10', '비방폭 + PT 1/2 + PTM'),
('A', 'T', '7', 'TS800RA11S10', '수소+내압 + PT 1/2 + PTM'),
('A', 'T', '8', 'TS820RA11S01', '수소+내압 + PT 1/2 + Remote Type'),
('A', 'T', '9', 'TS900LC31S10', '수소방폭 + NPT 1/2 + PTM'),
('A', 'T', 'A', 'TS900LC31S20', '수소방폭 + NPT 1/2 + HART'),
('A', 'T', 'B', 'TS900LC31S30', '수소방폭 + NPT 1/2 + PTM+HART'),
('A', 'T', 'C', 'TS900RC31S10', '수소방폭 + NPT 1/2 + PTM'),
('A', 'R', '1', 'YT-1000LSC231S0', '수소방폭 + PT 1/2'),
('A', 'R', '2', 'YT-1000LSM231S0', '내압방폭 + PT 1/2'),
('A', 'R', '3', 'YT-1000RSM231S0', '내압방폭 + PT 1/2'),
('A', 'R', '4', 'YT-1200LS231S0', '비방폭 + PT 1/4'),
('A', 'R', '5', 'YT-3300LSN1101S', '비방폭 + PT 1/2 + PTM'),
('A', 'R', '6', 'YT-3300LSN1120S', '비방폭 + PT 1/2 + HART'),
('A', 'R', '7', 'YT-3300LSN1121S', '비방폭 + PT 1/2 + PTM+HART'),
('A', 'R', '8', 'YT-3300RSN2120S', '비방폭 + PT 1/2 + HART'),
('A', 'R', '9', 'YT-3303LDN2121S', '비방폭 + PT 1/2 + PTM+HART'),
('A', 'R', 'A', 'YT-3303LSN2100S', '비방폭 + PT 1/2'),
('A', 'R', 'B', 'YT-3303LSN2101S', '비방폭 + PT 1/2 + PTM'),
('A', 'R', 'C', 'YT-3303LSN2120S', '비방폭 + PT 1/2 + HART'),
('A', 'R', 'D', 'YT-3303LSN2121S', '비방폭 + PT 1/2 + PTM+HART'),
('A', 'R', 'E', 'YT-3400LDC2121S', '수소방폭 + PT 1/2 + PTM+HART'),
('A', 'R', 'F', 'YT-3400LSC2100S', '수소방폭 + PT 1/2'),
('A', 'R', 'G', 'YT-3400LSC2101S', '내압방폭 + PT 1/2 + PTM'),
('A', 'R', 'H', 'YT-3400LSC2121S', '수소방폭 + PT 1/2 + PTM+HART'),
('A', 'R', 'I', 'YT-3400RSC2100S', '수소방폭 + PT 1/2'),

-- Solenoid Valve (B)
('B', 'C', '1', '4F310-08-TP-X-DC24V', '5/2-WAY + DC24 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'C', '2', '4F310-10-B-DC24V', '5/2-WAY + DC24 + 비방폭 + PT 3/8xPT 3/8'),
('B', 'C', '3', '4F310E-08-TP-X-AC110V', '5/2-WAY + AC110 + 내압방폭 + PT 1/4xPT 1/4'),
('B', 'C', '4', '4F310E-08-TP-X-DC24V', '5/2-WAY + DC24 + 내압방폭 + PT 1/4xPT 1/4'),
('B', 'G', '1', 'ESV-S-A110P-F', '5/2-WAY + AC110 + 내압방폭 + PT 1/4xPT 3/4'),
('B', 'G', '2', 'ESV-S-A220P-F', '5/2-WAY + AC220 + 내압방폭 + PT 1/4xPT 3/4'),
('B', 'G', '3', 'ESV-S-D24P-F', '5/2-WAY + DC24 + 내압방폭 + PT 1/4xPT 3/4'),
('B', 'H', '1', 'HKW5020B', '2-WAY + DC24 + 비방폭 + PF 1/2xPT 2'),
('B', 'H', '2', 'HKW5020S', '2-WAY + DC24 + 비방폭 + PF 1/2xPT 2'),
('B', 'H', '3', 'HPW2510B', '2-WAY + DC24 + 비방폭 + PF 1/2xPT 1'),
('B', 'H', '4', 'HPW2510SB', '2-WAY + DC24 + 비방폭 + PF 1/2xPT 1'),
('B', 'H', '5', 'HPW3212B', '2-WAY + DC24 + 비방폭 + PF 1/2xPT 1 1/4'),
('B', 'A', '1', 'JKB8320G174MO', '3-WAY + AC220 + 비방폭 + NPT 1/2xNPT 1/4'),
('B', 'A', '2', 'JKH8320G174M0', '3/2-WAY + DC24 + 비방폭 + NPT 1/2xNPT 1/4'),
('B', 'K', '1', 'MOOU-8AE-12PU-AC110V', '3-WAY + AC110 + 내압방폭 + PT 1/4xPT 1/4'),
('B', 'K', '2', 'MOOU-8AE-12PU-AC220V', '3-WAY + AC220 + 내압방폭 + PT 1/4xPT 1/4'),
('B', 'K', '3', 'MOOU-8DE-12PU-DC24V', '3-WAY + DC24 + 내압방폭 + PT 1/4xPT 1/4'),
('B', 'T', '1', 'RDS5120-1DZ-03', '5/2-WAY + AC110 + 비방폭 + PT 1/2xPT 3/8'),
('B', 'Y', '1', 'SV-210-1D', '5/2-WAY + AC110 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', '2', 'SV-210-1D-LAMP', '5/2-WAY + AC110 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', '3', 'SV-210-1D-LOCK LEVER', '5/2-WAY + AC110 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', '4', 'SV-210-1D-LOCK LEVER+LAMP', '5/2-WAY + AC110 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', '5', 'SV-210-2D', '5/2-WAY + AC220 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', '6', 'SV-210-2D-LAMP', '5/2-WAY + AC220 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', '7', 'SV-210-2D-LOCK LEVER', '5/2-WAY + AC220 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', '8', 'SV-210-2D-LOCK LEVER+LAMP', '5/2-WAY + AC220 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', '9', 'SV-210-4D-LAMP', '5/2-WAY + DC24 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'A', 'SV-210-4D-LOCK LEVER', '5/2-WAY + DC24 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'B', 'SV-210-4D-LOCK LEVER+LAMP', '5/2-WAY + DC24 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'C', 'SV-410-1D-LOCK LEVER', '5/2-WAY + AC110 + 비방폭 + PT 1/2xPT 1/2'),
('B', 'A', '3', 'VCEFCMHBX8320G174MO-AC110V', '3/2-WAY + AC110 + 내압방폭 + NPT 1/2xNPT 1/4'),
('B', 'A', '4', 'VCEFCMHBX8320G174MO-AC220V', '3/2-WAY + AC220 + 내압방폭 + NPT 1/2xNPT 1/4'),

-- Limit Switch (C)
('C', 'H', '1', 'APL-210N', '2-SPDT + 비방폭 + NPT 1/2'),
('C', 'H', '2', 'APL-312N', '4-SPDT + 비방폭 + NPT 1/2'),
('C', 'H', '3', 'APL-314N', 'DPDT + 비방폭 + NPT 1/2'),
('C', 'H', '4', 'APL-510N', '2-SPDT + 내압수소방폭 + NPT 3/4'),
('C', 'H', '5', 'APL-512N', '4-SPDT + 내압수소방폭 + NPT 3/4'),
('C', 'O', '1', 'GLAA20A2A', 'DPDT + 비방폭 + NPT 1/2'),
('C', 'Q', '1', 'SLP5130-AL', '비방폭 + NPT 1/2'),
('C', 'O', '2', 'SZL-WLC-B', 'SPDT + 비방폭 + NPT 3/4'),
('C', 'T', '1', 'TS400M1S1', '2-SPDT + 비방폭 + NPT 1/2'),
('C', 'T', '2', 'TS410MK1S1', '2-SPDT + 내압방폭 + NPT 1/2'),

-- Air-set (D)
('D', 'P', '1', 'AR-1501NS0(TS300)', '10bar + NPT 1/4'),
('D', 'P', '2', 'AR-1501PS0(TS300)', '10bar + PT 1/4'),
('D', 'P', '3', 'AR-2501NS0(TS310)', '10bar + NPT 1/2'),
('D', 'S', '1', 'AW30-03-A', '10bar + PT 3/8'),
('D', 'C', '1', 'B7019-2C-M', '10bar + PT 1/4'),
('D', 'T', '1', 'TS300PS0', '10bar + PT 1/4'),
('D', 'R', '1', 'YT-200BN020', '10bar + NPT 1/4 + 고온용'),
('D', 'R', '2', 'YT-200BP010', '10bar + PT 1/4'),
('D', 'R', '3', 'YT-200BP020', '10bar + PT 1/4 + 고온용'),
('D', 'R', '4', 'YT-220BN010', '10bar + NPT 1/2'),

-- Volume Booster (E)
('E', 'P', '1', 'VB-1000NS(TS100)', 'NPT 1/4'),
('E', 'P', '2', 'VB-1000PS(TS100)', 'PT 1/4'),
('E', 'R', '1', 'YT-320P-1', 'NPT 1/2 + SUS'),

-- Air Operated Valve (F)
('F', 'Y', '1', 'SFP4313', '5/3-WAY + NPT 1/4'),
('F', 'Y', '2', 'SFP6313', '5/3-WAY + NPT 1/2'),
('F', 'N', '1', 'SV-210M', '5-WAY + PT 1/4'),
('F', 'N', '2', 'SV-310M', '4-WAY + NPT 1/2'),
('F', 'N', '3', 'SV-410M', '5-WAY + PT 1/2'),

-- Lockup Valve (G)
('G', 'P', '1', 'LV-2000DNS', 'Double + NPT 1/4'),
('G', 'P', '2', 'LV-2000SNS', 'Single + NPT 1/4'),
('G', 'P', '3', 'LV-2000SPS', 'Single + PT 1/4'),

-- Snap-acting Relay (H)
('H', 'T', '1', 'SAR25D(TS250)', 'Double + PT 1/4');

-- 데이터 확인
SELECT 'AccTypeList' as TableName, COUNT(*) as Count FROM AccTypeList
UNION ALL
SELECT 'AccMakerList' as TableName, COUNT(*) as Count FROM AccMakerList
UNION ALL
SELECT 'AccModelList' as TableName, COUNT(*) as Count FROM AccModelList;
