-- =====================================================
-- PWD 데이터베이스 관리자 계정 추가
-- =====================================================

USE PWD_Final;

-- =====================================================
-- 관리자 계정 생성
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
-- 설정 완료 메시지
-- =====================================================
SELECT '관리자 계정이 추가되었습니다!' AS Message;

-- 관리자 계정 확인
SELECT 
    UserID, 
    Name, 
    Email, 
    RoleID, 
    IsApproved 
FROM User 
WHERE RoleID = 1; 