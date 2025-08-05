import React from 'react';

const MembershipRequestsPage: React.FC = () => {
  return (
    <div className="page">
      <h1>🔔 회원가입 요청</h1>
      <p>이 페이지는 회원가입 요청을 관리합니다.</p>
      <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginTop: '20px' }}>
        <h3>간이 페이지입니다</h3>
        <p>실제 구현 시에는 승인 대기 중인 회원 목록이 표시됩니다.</p>
      </div>
    </div>
  );
};

export default MembershipRequestsPage; 