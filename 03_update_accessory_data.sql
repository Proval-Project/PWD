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
('A', 'A', 'AVP300', 'AVP300-HSD3D-XXXX-X', '내압방폭 + NPT 1/2'),
('A', 'A', 'AVP302', 'AVP302-HSD3D-XXXX-X', '내압방폭 + NPT 1/2 + HART'),
('A', 'P', 'EP6000', 'EP-6000LN12S0(TS600)', '비방폭 + PT 1/2'),
('A', 'P', 'EP6100', 'EP-6100RN11S0', '비방폭 + PT 1/2'),
('A', 'S', 'IP8100', 'IP8100-031-CH-X114', '내압방폭 + PT 1/2'),
('A', 'P', 'SP8000', 'SP-8000N11S10(TS800)', '비방폭 + PT 1/2 + PTM'),
('A', 'P', 'SP8001', 'SP-8000N11S30(TS800)', '비방폭 + PT 1/2 + PTM+HART'),
('A', 'P', 'SP8100', 'SP-8100N11S30(TS800)', '비방폭 + PT 1/2 + PTM+HART'),
('A', 'T', 'TS600L', 'TS600LB12S0', '내압방폭 + PT 1/2'),
('A', 'T', 'TS600C', 'TS600LC12S0', '수소방폭 + PT 1/2'),
('A', 'T', 'TS600N', 'TS600LN12S1', '비방폭 + PT 1/2 + PTM'),
('A', 'T', 'TS600R', 'TS600RB11S0', '내압방폭 + PT 1/2'),
('A', 'T', 'TS600RN', 'TS600RN11S1', '비방폭 + PT 1/2 + PTM'),
('A', 'T', 'TS700L', 'TS700LSN11S10', '비방폭 + PT 1/2 + PTM'),
('A', 'T', 'TS800R', 'TS800RA11S10', '수소+내압 + PT 1/2 + PTM'),
('A', 'T', 'TS820R', 'TS820RA11S01', '수소+내압 + PT 1/2 + Remote Type'),
('A', 'T', 'TS900L', 'TS900LC31S10', '수소방폭 + NPT 1/2 + PTM'),
('A', 'T', 'TS900L2', 'TS900LC31S20', '수소방폭 + NPT 1/2 + HART'),
('A', 'T', 'TS900L3', 'TS900LC31S30', '수소방폭 + NPT 1/2 + PTM+HART'),
('A', 'T', 'TS900R', 'TS900RC31S10', '수소방폭 + NPT 1/2 + PTM'),
('A', 'R', 'YT1000L', 'YT-1000LSC231S0', '수소방폭 + PT 1/2'),
('A', 'R', 'YT1000M', 'YT-1000LSM231S0', '내압방폭 + PT 1/2'),
('A', 'R', 'YT1000R', 'YT-1000RSM231S0', '내압방폭 + PT 1/2'),
('A', 'R', 'YT1200', 'YT-1200LS231S0', '비방폭 + PT 1/4'),
('A', 'R', 'YT3300L', 'YT-3300LSN1101S', '비방폭 + PT 1/2 + PTM'),
('A', 'R', 'YT3300L2', 'YT-3300LSN1120S', '비방폭 + PT 1/2 + HART'),
('A', 'R', 'YT3300L3', 'YT-3300LSN1121S', '비방폭 + PT 1/2 + PTM+HART'),
('A', 'R', 'YT3300R', 'YT-3300RSN2120S', '비방폭 + PT 1/2 + HART'),
('A', 'R', 'YT3303L', 'YT-3303LDN2121S', '비방폭 + PT 1/2 + PTM+HART'),
('A', 'R', 'YT3303L2', 'YT-3303LSN2100S', '비방폭 + PT 1/2'),
('A', 'R', 'YT3303L3', 'YT-3303LSN2101S', '비방폭 + PT 1/2 + PTM'),
('A', 'R', 'YT3303L4', 'YT-3303LSN2120S', '비방폭 + PT 1/2 + HART'),
('A', 'R', 'YT3303L5', 'YT-3303LSN2121S', '비방폭 + PT 1/2 + PTM+HART'),
('A', 'R', 'YT3400L', 'YT-3400LDC2121S', '수소방폭 + PT 1/2 + PTM+HART'),
('A', 'R', 'YT3400L2', 'YT-3400LSC2100S', '수소방폭 + PT 1/2'),
('A', 'R', 'YT3400L3', 'YT-3400LSC2101S', '내압방폭 + PT 1/2 + PTM'),
('A', 'R', 'YT3400L4', 'YT-3400LSC2121S', '수소방폭 + PT 1/2 + PTM+HART'),
('A', 'R', 'YT3400R', 'YT-3400RSC2100S', '수소방폭 + PT 1/2'),

-- Solenoid Valve (B)
('B', 'C', '4F31008', '4F310-08-TP-X-DC24V', '5/2-WAY + DC24 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'C', '4F31010', '4F310-10-B-DC24V', '5/2-WAY + DC24 + 비방폭 + PT 3/8xPT 3/8'),
('B', 'C', '4F310E8', '4F310E-08-TP-X-AC110V', '5/2-WAY + AC110 + 내압방폭 + PT 1/4xPT 1/4'),
('B', 'C', '4F310E8D', '4F310E-08-TP-X-DC24V', '5/2-WAY + DC24 + 내압방폭 + PT 1/4xPT 1/4'),
('B', 'G', 'ESVSA110', 'ESV-S-A110P-F', '5/2-WAY + AC110 + 내압방폭 + PT 1/4xPT 3/4'),
('B', 'G', 'ESVSA220', 'ESV-S-A220P-F', '5/2-WAY + AC220 + 내압방폭 + PT 1/4xPT 3/4'),
('B', 'G', 'ESVSD24', 'ESV-S-D24P-F', '5/2-WAY + DC24 + 내압방폭 + PT 1/4xPT 3/4'),
('B', 'H', 'HKW5020B', 'HKW5020B', '2-WAY + DC24 + 비방폭 + PF 1/2xPT 2'),
('B', 'H', 'HKW5020S', 'HKW5020S', '2-WAY + DC24 + 비방폭 + PF 1/2xPT 2'),
('B', 'H', 'HPW2510B', 'HPW2510B', '2-WAY + DC24 + 비방폭 + PF 1/2xPT 1'),
('B', 'H', 'HPW2510S', 'HPW2510SB', '2-WAY + DC24 + 비방폭 + PF 1/2xPT 1'),
('B', 'H', 'HPW3212', 'HPW3212B', '2-WAY + DC24 + 비방폭 + PF 1/2xPT 1 1/4'),
('B', 'A', 'JKB8320', 'JKB8320G174MO', '3-WAY + AC220 + 비방폭 + NPT 1/2xNPT 1/4'),
('B', 'A', 'JKH8320', 'JKH8320G174M0', '3/2-WAY + DC24 + 비방폭 + NPT 1/2xNPT 1/4'),
('B', 'K', 'MOOU8AE1', 'MOOU-8AE-12PU-AC110V', '3-WAY + AC110 + 내압방폭 + PT 1/4xPT 1/4'),
('B', 'K', 'MOOU8AE2', 'MOOU-8AE-12PU-AC220V', '3-WAY + AC220 + 내압방폭 + PT 1/4xPT 1/4'),
('B', 'K', 'MOOU8DE', 'MOOU-8DE-12PU-DC24V', '3-WAY + DC24 + 내압방폭 + PT 1/4xPT 1/4'),
('B', 'T', 'RDS5120', 'RDS5120-1DZ-03', '5/2-WAY + AC110 + 비방폭 + PT 1/2xPT 3/8'),
('B', 'Y', 'SV2101D', 'SV-210-1D', '5/2-WAY + AC110 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'SV2101DL', 'SV-210-1D-LAMP', '5/2-WAY + AC110 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'SV2101DL2', 'SV-210-1D-LOCK LEVER', '5/2-WAY + AC110 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'SV2101DL3', 'SV-210-1D-LOCK LEVER+LAMP', '5/2-WAY + AC110 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'SV2102D', 'SV-210-2D', '5/2-WAY + AC220 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'SV2102DL', 'SV-210-2D-LAMP', '5/2-WAY + AC220 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'SV2102DL2', 'SV-210-2D-LOCK LEVER', '5/2-WAY + AC220 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'SV2102DL3', 'SV-210-2D-LOCK LEVER+LAMP', '5/2-WAY + AC220 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'SV2104DL', 'SV-210-4D-LAMP', '5/2-WAY + DC24 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'SV2104DL2', 'SV-210-4D-LOCK LEVER', '5/2-WAY + DC24 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'SV2104DL3', 'SV-210-4D-LOCK LEVER+LAMP', '5/2-WAY + DC24 + 비방폭 + PT 1/4xPT 1/4'),
('B', 'Y', 'SV4101D', 'SV-410-1D-LOCK LEVER', '5/2-WAY + AC110 + 비방폭 + PT 1/2xPT 1/2'),
('B', 'A', 'VCEFCMH1', 'VCEFCMHBX8320G174MO-AC110V', '3/2-WAY + AC110 + 내압방폭 + NPT 1/2xNPT 1/4'),
('B', 'A', 'VCEFCMH2', 'VCEFCMHBX8320G174MO-AC220V', '3/2-WAY + AC220 + 내압방폭 + NPT 1/2xNPT 1/4'),

-- Limit Switch (C)
('C', 'H', 'APL210N', 'APL-210N', '2-SPDT + 비방폭 + NPT 1/2'),
('C', 'H', 'APL312N', 'APL-312N', '4-SPDT + 비방폭 + NPT 1/2'),
('C', 'H', 'APL314N', 'APL-314N', 'DPDT + 비방폭 + NPT 1/2'),
('C', 'H', 'APL510N', 'APL-510N', '2-SPDT + 내압수소방폭 + NPT 3/4'),
('C', 'H', 'APL512N', 'APL-512N', '4-SPDT + 내압수소방폭 + NPT 3/4'),
('C', 'O', 'GLAA20A2', 'GLAA20A2A', 'DPDT + 비방폭 + NPT 1/2'),
('C', 'Q', 'SLP5130', 'SLP5130-AL', '비방폭 + NPT 1/2'),
('C', 'O', 'SZLWLCB', 'SZL-WLC-B', 'SPDT + 비방폭 + NPT 3/4'),
('C', 'T', 'TS400M1S', 'TS400M1S1', '2-SPDT + 비방폭 + NPT 1/2'),
('C', 'T', 'TS410MK1', 'TS410MK1S1', '2-SPDT + 내압방폭 + NPT 1/2'),

-- Air-set (D)
('D', 'P', 'AR1501N', 'AR-1501NS0(TS300)', '10bar + NPT 1/4'),
('D', 'P', 'AR1501P', 'AR-1501PS0(TS300)', '10bar + PT 1/4'),
('D', 'P', 'AR2501N', 'AR-2501NS0(TS310)', '10bar + NPT 1/2'),
('D', 'S', 'AW3003A', 'AW30-03-A', '10bar + PT 3/8'),
('D', 'C', 'B70192C', 'B7019-2C-M', '10bar + PT 1/4'),
('D', 'T', 'TS300PS0', 'TS300PS0', '10bar + PT 1/4'),
('D', 'R', 'YT200BN', 'YT-200BN020', '10bar + NPT 1/4 + 고온용'),
('D', 'R', 'YT200BP', 'YT-200BP010', '10bar + PT 1/4'),
('D', 'R', 'YT200BP2', 'YT-200BP020', '10bar + PT 1/4 + 고온용'),
('D', 'R', 'YT220BN', 'YT-220BN010', '10bar + NPT 1/2'),

-- Volume Booster (E)
('E', 'P', 'VB1000N', 'VB-1000NS(TS100)', 'NPT 1/4'),
('E', 'P', 'VB1000P', 'VB-1000PS(TS100)', 'PT 1/4'),
('E', 'R', 'YT320P1', 'YT-320P-1', 'NPT 1/2 + SUS'),

-- Air Operated Valve (F)
('F', 'Y', 'SFP4313', 'SFP4313', '5/3-WAY + NPT 1/4'),
('F', 'Y', 'SFP6313', 'SFP6313', '5/3-WAY + NPT 1/2'),
('F', 'N', 'SV210M', 'SV-210M', '5-WAY + PT 1/4'),
('F', 'N', 'SV310M', 'SV-310M', '4-WAY + NPT 1/2'),
('F', 'N', 'SV410M', 'SV-410M', '5-WAY + PT 1/2'),

-- Lockup Valve (G)
('G', 'P', 'LV2000D', 'LV-2000DNS', 'Double + NPT 1/4'),
('G', 'P', 'LV2000S', 'LV-2000SNS', 'Single + NPT 1/4'),
('G', 'P', 'LV2000SP', 'LV-2000SPS', 'Single + PT 1/4'),

-- Snap-acting Relay (H)
('H', 'T', 'SAR25D', 'SAR25D(TS250)', 'Double + PT 1/4');

-- 데이터 확인
SELECT 'AccTypeList' as TableName, COUNT(*) as Count FROM AccTypeList
UNION ALL
SELECT 'AccMakerList' as TableName, COUNT(*) as Count FROM AccMakerList
UNION ALL
SELECT 'AccModelList' as TableName, COUNT(*) as Count FROM AccModelList;
