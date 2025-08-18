import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEstimateInquiry, EstimateInquiryRequest, EstimateInquiryItem, statusOptions } from '../../api/estimateInquiry';
import './DashboardPages.css';
import './EstimateInquiry.css';

const EstimateInquiryPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<EstimateInquiryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // 필터 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDescending, setIsDescending] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  // 데이터 조회 함수 (매개변수로 현재 상태를 받아서 처리)
  const fetchData = async (page: number = 1, overrideParams: Partial<EstimateInquiryRequest> = {}) => {
    setLoading(true);
    try {
      // 매번 호출할 때마다 현재 사용자 정보를 다시 가져오기
      let user = currentUser;
      if (!user) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          user = JSON.parse(userStr);
          setCurrentUser(user);
        }
      }
      
      // 디버깅: 사용자 정보 확인
      console.log('현재 사용자 정보:', user);
      console.log('사용자 roleId:', user?.roleId);
      console.log('사용자 userId:', user?.userId);

      const params: EstimateInquiryRequest = {
        searchKeyword: searchKeyword || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter ? Number(statusFilter) : undefined,
        page,
        pageSize,
        isDescending,
        ...overrideParams, // 매개변수로 전달된 값이 우선
      };

      // 고객(roleID가 3)인 경우 자신의 UserID만 조회
      if (user && user.roleId === 3) {
        params.customerID = user.userId;
        console.log('고객 권한으로 조회 - CustomerID(UserID):', user.userId);
      }

      console.log('API 요청 파라미터:', params); // 디버깅용
      const response = await getEstimateInquiry(params);
      setItems(response.items);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      alert('데이터 조회에 실패했습니다.');
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

    // 기본 날짜 범위 설정 (최근 1개월)
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    setStartDate(oneMonthAgo.toISOString().split('T')[0]);
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

  // 정렬 토글
  const handleSortToggle = () => {
    const newIsDescending = !isDescending;
    setIsDescending(newIsDescending);
    setCurrentPage(1);
    setTimeout(() => {
      fetchData(1, { isDescending: newIsDescending });
    }, 100);
  };

  // TempEstimateNo에서 날짜 추출 및 포맷팅
  const extractDateFromTempEstimateNo = (tempEstimateNo: string): string => {
    const match = tempEstimateNo.match(/TEMP(\d{4})(\d{2})(\d{2})/);
    if (match) {
      const year = match[1];
      const month = match[2];
      const day = match[3];
      return `${year}.${month}.${day}`;
    }
    return tempEstimateNo; // 매칭되지 않으면 원본 반환 (혹은 빈 문자열 등)
  };
  
  // 요청일자 YYYY.MM.DD 포맷 (시간 제거)
  const formatDateYmd = (dateString?: string): string => {
    if (!dateString) return '';
    const head = dateString.slice(0, 10); // YYYY-MM-DD 또는 YYYY.MM.DD
    return head.replace(/[-/]/g, '.');
  };
  
  // 기존 날짜 포맷팅 함수 (사용되지 않게 됨)
  // const formatDate = (dateString: string) => {
  //   const date = new Date(dateString);
  //   return date.toISOString().split('T')[0].replace(/-/g, '.');
  // };

  // 행 클릭 핸들러 (상세 페이지로 이동)
  const handleRowClick = (item: EstimateInquiryItem) => {
    // 현재 사용자 정보가 없으면 다시 가져오기
    let user = currentUser;
    if (!user) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        user = JSON.parse(userStr);
        setCurrentUser(user);
      }
    }
    
    // 모든 경우에 NewEstimateRequestPage로 이동하되, 편집 권한 여부를 쿼리 파라미터로 전달
    console.log('Row clicked:', item);
    console.log('Current user:', user);
    console.log('Item status:', item.status);
    console.log('Item writerID:', item.writerID);
    console.log('Current userId:', user?.userId);
    
    const canEdit = (item.status === 1 || item.status === 2) && user && item.writerID === user.userId;
    console.log('Can edit:', canEdit);
    
    const readonly = canEdit ? 'false' : 'true';
    console.log('Readonly:', readonly);
    
    navigate(`/estimate-request/new?load=${item.tempEstimateNo}&readonly=${readonly}`);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 견적요청 목록
        </button>
        <h1>견적요청 목록</h1>
      </div>

      {/* 검색 필터 영역 */}
      <div className="search-section">
        <div className="search-row">
          <div className="date-range">
            <span>등록기간</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const newStartDate = e.target.value;
                setStartDate(newStartDate);
                setCurrentPage(1);
                // 즉시 검색 (날짜 하나만 입력해도 검색)
                setTimeout(() => {
                  fetchData(1, { 
                    startDate: newStartDate || undefined 
                  });
                }, 100);
              }}
            />
            <span>~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                const newEndDate = e.target.value;
                setEndDate(newEndDate);
                setCurrentPage(1);
                // 즉시 검색 (날짜 하나만 입력해도 검색)
                setTimeout(() => {
                  fetchData(1, { 
                    endDate: newEndDate || undefined 
                  });
                }, 100);
              }}
            />
          </div>

          <div className="status-filter">
            <span>진행상태</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                const newValue = e.target.value;
                setStatusFilter(newValue);
                setCurrentPage(1);
                setTimeout(() => {
                  fetchData(1, { status: newValue ? Number(newValue) : undefined });
                }, 100);
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="search-field">
            <input
              type="text"
              placeholder="검색 (견적번호, 회사명, 프로젝트명)"
              value={searchKeyword}
              onChange={(e) => {
                const newKeyword = e.target.value;
                setSearchKeyword(newKeyword);
                // 입력 후 500ms 후 자동 검색 (디바운싱)
                if (searchTimeout.current) {
                  clearTimeout(searchTimeout.current);
                }
                searchTimeout.current = setTimeout(() => {
                  setCurrentPage(1);
                  fetchData(1, { searchKeyword: newKeyword || undefined });
                }, 500);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (searchTimeout.current) {
                    clearTimeout(searchTimeout.current);
                  }
                  handleSearch();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* 결과 정보 및 정렬 */}
      <div className="results-header">
        <div className="results-info">
          총 {totalCount}건
        </div>
        <div className="sort-controls">
          <label>
            <input
              type="checkbox"
              checked={isDescending}
              onChange={handleSortToggle}
            />
            역순 정렬
          </label>
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
                <td colSpan={6} className="loading">로딩 중...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-data">조회된 데이터가 없습니다.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr 
                  key={item.tempEstimateNo}
                  onClick={() => handleRowClick(item)}
                  className="clickable-row"
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
                  <td>{item.project}</td>
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
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          
          {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
            const startPage = Math.max(1, Math.min(currentPage - 5, totalPages - 9));
            const pageNum = startPage + i;
            
            if (pageNum > totalPages) return null;
            
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={currentPage === pageNum ? 'active' : ''}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default EstimateInquiryPage;