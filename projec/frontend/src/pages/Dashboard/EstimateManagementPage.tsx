import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDraftEstimates, assignEstimate } from '../../api/estimateRequest';
import './EstimateManagementPage.css';

// 백엔드 DTO와 일치하는 인터페이스
interface DraftItem {
  estimateNo: string;           // EstimateNo
  companyName: string;          // CompanyName
  contactPerson: string;        // ContactPerson
  requestDate: string;          // RequestDate (문자열로 받음)
  quantity: number;             // Quantity
  statusText: string;           // StatusText
  status: number;               // Status
  project: string;              // Project
  tempEstimateNo: string;       // TempEstimateNo
  writerID: string;             // WriterID (백엔드에서 반환)
  managerID?: string;           // ManagerID
  managerName?: string;         // ManagerName
}

const EstimateManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // 필터 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: '1', label: '임시저장' },
    { value: '2', label: '견적요청' },
    { value: '3', label: '견적처리중' },
    { value: '4', label: '견적완료' },
    { value: '5', label: '주문' }
  ];

  // 데이터 조회 함수
  const fetchData = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = {
        searchKeyword: searchKeyword || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: selectedStatus !== 'all' ? parseInt(selectedStatus) : undefined,
        page,
        pageSize,
        isDescending: true,
      };

      // 현재 사용자 ID 가져오기
      const currentUserId = currentUser?.userId || 'defaultUser';
      
      // 선택된 고객 ID 가져오기 (있으면)
      const customerId = selectedCustomer?.userId;
      
      const response = await getDraftEstimates(params, currentUserId, customerId);
      
      // 백엔드 응답 구조에 맞게 수정 (대소문자 구분)
      setItems(response.Items || response.items || []);
      setCurrentPage(response.CurrentPage || response.currentPage || 1);
      setTotalPages(response.TotalPages || response.totalPages || 1);
      setTotalCount(response.TotalCount || response.totalCount || 0);
    } catch (error) {
      console.error('견적요청 목록 조회 실패:', error);
      alert('견적요청 목록 조회에 실패했습니다.');
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

    // 선택된 고객 정보 가져오기 (견적요청용)
    const selectedCustomerStr = localStorage.getItem('selectedCustomerForEstimateManagement');
    if (selectedCustomerStr) {
      setSelectedCustomer(JSON.parse(selectedCustomerStr));
      // 사용 후 제거
      localStorage.removeItem('selectedCustomerForEstimateManagement');
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

  // 상태 변경 시 데이터 조회
  useEffect(() => {
    if (startDate && endDate) {
      fetchData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  // 검색 버튼 클릭
  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1);
  };

  // 상태 변경 처리
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  // 견적 담당 처리
  const handleAssign = async (tempEstimateNo: string) => {
    try {
      // 현재 로그인한 사용자 ID를 사용 (실제로는 인증 시스템에서 가져와야 함)
      const currentUserId = currentUser?.userId; 
      
      if (!currentUserId) {
        alert('로그인한 사용자 정보를 찾을 수 없습니다.');
        return;
      }
      
      const result = await assignEstimate(tempEstimateNo, currentUserId);
      
      if (result.message === '견적 담당 처리 완료') {
        alert('견적 담당 처리 완료!');
        // 견적 목록 새로고침
        fetchData(1);
      } else {
        alert('견적 담당 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('견적 담당 처리 중 오류 발생:', error);
      alert('견적 담당 처리 중 오류가 발생했습니다.');
    }
  };

  // TempEstimateNo에서 날짜 추출 및 포맷팅 (백엔드와 동일한 로직)
  const extractDateFromTempEstimateNo = (tempEstimateNo: string): string => {
    const match = tempEstimateNo.match(/TEMP(\d{4})(\d{2})(\d{2})/);
    if (match) {
      const year = match[1];
      const month = match[2];
      const day = match[3];
      return `${year}.${month}.${day}`;
    }
    return tempEstimateNo; // 매칭되지 않으면 원본 반환
  };

  // 기존 날짜 포맷팅 (사용되지 않게 됨)
  // const formatDate = (dateString: string) => {
  //   if (!dateString) return '-';
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString('ko-KR');
  // };

  // 요청일자 YYYY.MM.DD 포맷 (시간 제거)
  const formatDateYmd = (dateString?: string): string => {
    if (!dateString) return '';
    const head = dateString.slice(0, 10);
    return head.replace(/[-\/]/g, '.');
  };

  // 행 클릭 처리
  const handleRowClick = async (item: DraftItem) => {
    const isCurrentUserManager = currentUser?.userId === item.managerID;
    const isUnassigned = item.managerID === null;
    const isCurrentUserWriter = currentUser?.userId === item.writerID;

    // 작성자이거나 담당자이거나 담당자가 없는 경우에만 진입
    if (isUnassigned || isCurrentUserManager || isCurrentUserWriter) {
      console.log('사양 선정 페이지로 이동:', `/dashboard/estimate-detail/${item.tempEstimateNo}`);
      navigate(`/dashboard/estimate-detail/${item.tempEstimateNo}`);
    } else {
      // 이미 다른 담당자에게 할당된 경우
      alert('이미 다른 담당자에게 할당된 견적입니다.');
    }
  };

  // 뒤로가기
  const handleBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="estimate-inquiry-page">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="estimate-inquiry-page">
      <div className="page-header">
        <button onClick={handleBack} className="back-button">
          ← 뒤로가기
        </button>
        <h1>견적 요청 관리</h1>
      </div>

      <div className="filters-section">
        <div className="date-filter">
          <span>등록기간</span>
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

        <div className="status-filter">
          <label>진행상태:</label>
          <select value={selectedStatus} onChange={handleStatusChange}>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="프로젝트명, 고객명, 작성자명으로 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>검색</button>
        </div>
      </div>

      <div className="table-container">
        <table className="estimate-table">
          <thead>
            <tr>
              <th>견적번호</th>
              <th>회사명</th>
              <th>담당자</th>
              <th>요청일자</th>
              <th>상태</th>
              <th>프로젝트명</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">데이터가 없습니다.</td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr 
                  key={item.tempEstimateNo || index}
                  onClick={() => handleRowClick(item)}
                  className="clickable-row"
                >
                  <td>{item.estimateNo || '-'}</td>
                  <td>{item.companyName || '-'}</td>
                  <td>{item.managerName || '미지정'}</td>
                  <td>{item.requestDate ? formatDateYmd(item.requestDate) : extractDateFromTempEstimateNo(item.tempEstimateNo)}</td>
                  <td>
                    <span className={`status-badge status-${item.status}`}>
                      {item.statusText || '알 수 없음'}
                    </span>
                  </td>
                  <td>{item.project || '-'}</td>
                  <td>
                    <button 
                      onClick={() => handleRowClick(item)}
                      className="btn btn-primary btn-sm me-2"
                    >
                      상세보기
                    </button>
                    <button 
                      onClick={() => handleAssign(item.tempEstimateNo)}
                      className="btn btn-success btn-sm"
                      disabled={!!item.managerID}
                    >
                      {!item.managerID ? '담당' : '담당중'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-btn"
          >
            이전
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`page-btn ${currentPage === page ? 'active' : ''}`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            다음
          </button>
        </div>
      )}

      <div className="summary-info">
        <p>총 {totalCount}건의 견적요청이 있습니다.</p>
      </div>
    </div>
  );
};

export default EstimateManagementPage; 