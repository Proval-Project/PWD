import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CustomerDetail.css';

interface User {
  userID: string;
  name: string;
  email: string;
  roleId: number;
  companyName: string;
  department: string;
  position: string;
  phoneNumber: string;
  isApproved: boolean;
}

const CustomerDetailPage: React.FC = () => {
  const { userID } = useParams<{ userID: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 실제로는 API 호출로 사용자 정보를 가져와야 함
    // 임시 데이터
    const mockUser: User = {
      userID: userID || '',
      name: '김고객',
      email: 'customer@example.com',
      roleId: 3, // Customer
      companyName: '테스트고객사',
      department: '구매팀',
      position: '과장',
      phoneNumber: '010-2345-6789',
      isApproved: true
    };
    setUser(mockUser);
    setLoading(false);
  }, [userID]);

  const handleBack = () => {
    navigate('/customer-management');
  };

  const handleEdit = () => {
    // 편집 페이지로 이동
    navigate(`/customer-edit/${userID}`);
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user) {
    return <div>사용자를 찾을 수 없습니다.</div>;
  }

  const isAdmin = user?.roleId === 1; // Admin은 1

  return (
    <div className="customer-detail-page">
      <div className="customer-detail-header">
        <button onClick={handleBack} className="back-button">
          ← 뒤로 가기
        </button>
        <h1>고객 상세 정보</h1>
        {isAdmin && (
          <button onClick={handleEdit} className="edit-button">
            편집
          </button>
        )}
      </div>

      <div className="customer-detail-content">
        <div className="detail-section">
          <h2>기본 정보</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>사용자 ID:</label>
              <span>{user.userID}</span>
            </div>
            <div className="detail-item">
              <label>이름:</label>
              <span>{user.name}</span>
            </div>
            <div className="detail-item">
              <label>이메일:</label>
              <span>{user.email}</span>
            </div>
            <div className="detail-item">
              <label>역할:</label>
              <span>{user.roleId === 1 ? '관리자' : user.roleId === 2 ? '직원' : '고객'}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>회사 정보</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>회사명:</label>
              <span>{user.companyName}</span>
            </div>
            <div className="detail-item">
              <label>부서:</label>
              <span>{user.department}</span>
            </div>
            <div className="detail-item">
              <label>직책:</label>
              <span>{user.position}</span>
            </div>
            <div className="detail-item">
              <label>연락처:</label>
              <span>{user.phoneNumber}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>계정 상태</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>승인 상태:</label>
              <span className={user.isApproved ? 'approved' : 'pending'}>
                {user.isApproved ? '승인됨' : '승인 대기'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage; 