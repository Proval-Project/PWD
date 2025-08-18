import React from 'react';
import './DashboardPages.css';

const StatisticsPage: React.FC = () => {
  return (
    <div className="page">
      <h1>📊 통계 분석</h1>
      <p>이 페이지는 통계 분석 기능을 제공합니다.</p>
      <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginTop: '20px' }}>
        <h3>간이 페이지입니다</h3>
        <p>실제 구현 시에는 차트와 통계 데이터가 표시됩니다.</p>
      </div>
    </div>
  );
};

export default StatisticsPage; 