import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDraftEstimates } from '../../api/estimateRequest';
import './DashboardPages.css';
import './EstimateInquiry.css';

interface DraftItem {
  estimateNo: string;
  companyName: string;
  contactPerson: string;
  requestDate: string;
  quantity: number;
  statusText: string;
  status: number;
  project: string;
  tempEstimateNo: string;
  writerID: string;
  managerID?: string;
  managerName?: string;
}

const TemporaryStoragePage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // 필터 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  // 데이터 조회 함수
  const fetchData = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = {
        searchKeyword: searchKeyword || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        pageSize,
        isDescending: true,
      };

      // 현재 사용자 ID 가져오기
      const currentUserId = currentUser?.userId || 'defaultUser';
      
      // 선택된 고객 ID 가져오기 (있으면)
      const customerId = selectedCustomer?.userId;
      
      const response = await getDraftEstimates(params, currentUserId, customerId);
      setItems(response.items);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('임시저장 목록 조회 실패:', error);
      alert('임시저장 목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    // 현재 사용자 정보 가져오기
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    // 선택된 고객 정보 가져오기 (임시저장용)
    const selectedCustomerStr = localStorage.getItem('selectedCustomerForTempStorage');
    if (selectedCustomerStr) {
      setSelectedCustomer(JSON.parse(selectedCustomerStr));
      // 사용 후 제거
      localStorage.removeItem('selectedCustomerForTempStorage');
    }

    // 기본 날짜 범위 설정 (최근 3개월)
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  // 날짜가 설정되면 데이터 조회
  useEffect(() => {
    if (startDate && endDate) {
      fetchData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // 검색 버튼 클릭
  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1);
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  // TempEstimateNo에서 날짜 추출 (YYYY.MM.DD)
  const extractDateFromTempEstimateNo = (tempEstimateNo: string): string => {
    const match = tempEstimateNo.match(/TEMP(\d{4})(\d{2})(\d{2})/);
    if (match) {
      const year = match[1];
      const month = match[2];
      const day = match[3];
      return `${year}.${month}.${day}`;
    }
    return tempEstimateNo;
  };

  // 요청일자 YYYY.MM.DD 포맷 (시간 제거)
  const formatDateYmd = (dateString?: string): string => {
    if (!dateString) return '';
    const head = dateString.slice(0, 10);
    return head.replace(/[-\/]/g, '.');
  };

  // 행 클릭 핸들러 (견적 작성 페이지로 이동하여 불러오기)
  const handleRowClick = (item: DraftItem) => {
    // 현재 사용자 정보 가져오기
    let user = currentUser;
    if (!user) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        user = JSON.parse(userStr);
        setCurrentUser(user);
      }
    }
    
    // 수정 가능 여부 확인: 현재 사용자가 작성자이고 상태가 '임시저장'(1) 또는 '견적요청'(2)인 경우만 수정 가능
    const canEdit = (item.status === 1 || item.status === 2) && user && item.writerID === user.userId;
    const readonly = canEdit ? 'false' : 'true';
    
    // tempEstimateNo와 readonly 상태를 쿼리 파라미터로 전달
    navigate(`/estimate-request/new?load=${item.tempEstimateNo}&readonly=${readonly}`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            &lt;
          </button>
          <h1>📁 임시저장함</h1>
          {selectedCustomer && (
            <span style={{ marginLeft: '10px', fontSize: '16px', color: '#666' }}>
              - {selectedCustomer.companyName}
            </span>
          )}
        </div>
      </div>

      {/* 검색 섹션 */}
      <div className="search-section">
        <div className="search-row">
          <div className="search-field">
            <input
              type="text"
              placeholder="검색어 입력 (프로젝트명, 회사명 등)"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="date-range">
            <span>기간:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span>~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          <button className="action-btn" onClick={handleSearch}>
            검색
          </button>
        </div>
      </div>

      {/* 결과 헤더 */}
      <div className="results-header">
        <div className="results-info">
          총 {totalCount}개의 임시저장 항목이 있습니다.
        </div>
      </div>

      {/* 테이블 */}
      <div className="table-container">
        <table className="inquiry-table">
          <thead>
            <tr>
              <th>견적번호</th>
              <th>회사명</th>
              <th>담당자</th>
              <th>요청일자</th>
              <th>상태</th>
              <th>프로젝트명</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="loading">데이터를 불러오는 중...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-data">임시저장된 견적이 없습니다.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr 
                  key={item.tempEstimateNo} 
                  className="clickable-row"
                  onClick={() => handleRowClick(item)}
                >
                  <td>{item.estimateNo}</td>
                  <td>{item.companyName}</td>
                  <td>{item.managerName || '미지정'}</td>
                  <td>{item.requestDate ? formatDateYmd(item.requestDate) : extractDateFromTempEstimateNo(item.tempEstimateNo)}</td>
                  <td>
                    <span className={`status-badge status-${item.status}`}>
                      {item.statusText}
                    </span>
                  </td>
                  <td>{item.project || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이징 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            처음
          </button>
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            이전
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={currentPage === page ? 'active' : ''}
              >
                {page}
              </button>
            );
          })}
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
          </button>
          <button 
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            마지막
          </button>
        </div>
      )}
    </div>
  );
};

export default TemporaryStoragePage; 