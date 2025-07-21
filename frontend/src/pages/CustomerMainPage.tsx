import React from 'react';
import { Link } from 'react-router-dom';

const CustomerMainPage: React.FC = () => (
  <div className="page-container">
    <h2>고객 메인 페이지</h2>
    <p>견적 조회 등 고객 전용 기능을 사용할 수 있습니다.</p>
    <Link to="/customer/estimates" className="feature-link">내 견적 신청/조회</Link>
  </div>
);

export default CustomerMainPage; 