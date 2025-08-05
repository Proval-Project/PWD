import React from 'react';

const TemporaryStoragePage: React.FC = () => {
  return (
    <div className="page">
      <h1>📁 임시저장함</h1>
      <p>이 페이지는 임시 저장된 데이터를 관리합니다.</p>
      <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginTop: '20px' }}>
        <h3>간이 페이지입니다</h3>
        <p>실제 구현 시에는 임시 저장된 견적 목록이 표시됩니다.</p>
      </div>
    </div>
  );
};

export default TemporaryStoragePage; 