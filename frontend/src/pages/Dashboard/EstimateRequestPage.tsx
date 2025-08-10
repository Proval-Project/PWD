import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPages.css';
import './EstimateRequest.css';
import { searchUsers } from '../../api/userManagement';
import CustomerSearchModal from '../../components/CustomerSearchModal';

const EstimateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 현재 로그인한 사용자 정보
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isCustomer = currentUser.roleId === 3;

  // 관리자/직원용 상태
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  const handleNewEstimate = () => {
    if (isCustomer) {
      // 고객은 바로 이동
      navigate('/estimate-request/new');
    } else {
      // 관리자/직원은 고객 선택 확인
      if (!selectedCustomer) {
        alert('고객을 먼저 선택해주세요.');
        return;
      }
      // 선택된 고객 정보를 localStorage에 저장
      localStorage.setItem('selectedCustomer', JSON.stringify(selectedCustomer));
      navigate('/estimate-request/new');
    }
  };

  const handleLoadTemporary = () => {
    if (!selectedCustomer) {
      alert('고객을 먼저 선택해주세요.');
      return;
    }
    // 선택된 고객 정보를 localStorage에 저장
    localStorage.setItem('selectedCustomerForTempStorage', JSON.stringify(selectedCustomer));
    navigate('/estimate-request/temporary');
  };

  const handleReInquiry = () => {
    navigate('/estimate-request/re-inquiry');
  };

  const handleCustomerSelect = (user: any) => {
    setSelectedCustomer(user);
    setShowCustomerSearch(false);
  };

  const handleCustomerSearch = () => {
    setShowCustomerSearch(true);
  };

  return (
    <div className="estimate-request-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            &lt;
          </button>
          <h1>견적요청</h1>
        </div>
      </div>

      <div className="main-content">
        <div className="action-cards">
          <div className="action-card" onClick={handleNewEstimate}>
            <h3>신규 견적 요청하기</h3>
            <p>새로운 견적을 요청합니다</p>
          </div>
          
          <div className="action-card" onClick={handleLoadTemporary}>
            <h3>임시저장 불러오기</h3>
            <p>임시저장된 견적을 불러옵니다</p>
          </div>
          
          <div className="action-card" onClick={handleReInquiry}>
            <h3>기존 견적 재문의</h3>
            <p>기존 견적에 대해 재문의합니다</p>
          </div>
        </div>

        {/* 관리자/직원용 고객 검색 및 정보 표시 */}
        {!isCustomer && (
          <div className="customer-section">
            <div className="customer-search">
              <h3>고객 검색</h3>
              <div className="search-controls">
                <button 
                  className="btn-search" 
                  onClick={handleCustomerSearch}
                >
                  고객 검색
                </button>
                {selectedCustomer && (
                  <button 
                    className="btn-clear" 
                    onClick={() => setSelectedCustomer(null)}
                  >
                    선택 해제
                  </button>
                )}
              </div>
            </div>

            {selectedCustomer && (
              <div className="customer-info">
                <h3>선택된 고객 정보</h3>
                <div className="info-row">
                  <span className="label">회사명:</span>
                  <span className="value">{selectedCustomer.companyName}</span>
                </div>
                <div className="info-row">
                  <span className="label">담당자 성함:</span>
                  <span className="value">{selectedCustomer.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">직급:</span>
                  <span className="value">{selectedCustomer.position}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 고객 검색 모달 */}
        {showCustomerSearch && (
          <CustomerSearchModal
            isOpen={showCustomerSearch}
            onClose={() => setShowCustomerSearch(false)}
            onSelectUser={handleCustomerSelect}
          />
        )}
      </div>
    </div>
  );
};

export default EstimateRequestPage; 