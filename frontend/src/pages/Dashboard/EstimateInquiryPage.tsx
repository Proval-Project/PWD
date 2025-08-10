import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEstimateInquiry, EstimateInquiryRequest, EstimateInquiryItem, statusOptions, statusChangeOptions, updateEstimateStatus } from '../../api/estimateInquiry';
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
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isDescending, setIsDescending] = useState(true);
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  // 데이터 조회 함수 (매개변수로 현재 상태를 받아서 처리)
  const fetchData = async (page: number = 1, overrideParams: Partial<EstimateInquiryRequest> = {}) => {
    setLoading(true);
    try {
      const params: EstimateInquiryRequest = {
        searchKeyword: searchKeyword || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: selectedStatus ? parseInt(selectedStatus) : undefined,
        page,
        pageSize,
        isDescending,
        ...overrideParams, // 매개변수로 전달된 값이 우선
      };

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

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0].replace(/-/g, '.');
  };

  // 상태 변경 핸들러
  const handleStatusChange = async (tempEstimateNo: string, newStatus: number) => {
    try {
      await updateEstimateStatus(tempEstimateNo, newStatus);
      alert('상태가 성공적으로 변경되었습니다.');
      fetchData(currentPage); // 데이터 새로고침
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };



  // 행 클릭 핸들러 (상세 페이지로 이동)
  const handleRowClick = (item: EstimateInquiryItem) => {
    // 견적요청 상태이고 본인이 작성한 경우 수정 가능한 페이지로
    const canEdit = item.status === 2 && currentUser && item.writerID === currentUser.userID;
    
    if (canEdit) {
      // 수정 가능한 페이지로 이동 (NewEstimateRequestPage와 동일)
      navigate(`/estimate-request/edit?tempEstimateNo=${item.tempEstimateNo}`);
    } else {
      // 읽기 전용 페이지로 이동
      navigate(`/estimate-detail/${item.tempEstimateNo}`);
    }
  };

  // 관리자/직원 여부 확인
  const canChangeStatus = currentUser && (currentUser.roleId === 1 || currentUser.roleId === 2);

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
              value={selectedStatus}
              onChange={(e) => {
                const newStatus = e.target.value;
                setSelectedStatus(newStatus);
                setCurrentPage(1);
                // 상태 변경 시 즉시 검색 (새로운 상태값으로)
                setTimeout(() => {
                  fetchData(1, { 
                    status: newStatus ? parseInt(newStatus) : undefined 
                  });
                }, 100);
              }}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              <th>수량</th>
              <th>상태</th>
              <th>프로젝트</th>
              <th>견적요청</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="loading">로딩 중...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">조회된 데이터가 없습니다.</td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr 
                  key={item.tempEstimateNo} 
                  onClick={() => handleRowClick(item)}
                  className="clickable-row"
                >
                  <td>{item.estimateNo}</td>
                  <td>{item.companyName}</td>
                  <td>{item.contactPerson}</td>
                  <td>{formatDate(item.requestDate)}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {canChangeStatus ? (
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.tempEstimateNo, parseInt(e.target.value))}
                        className="status-select"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {statusChangeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`status-badge status-${item.status}`}>
                        {item.statusText}
                      </span>
                    )}
                  </td>
                  <td>{item.project}</td>
                  <td>
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(item);
                      }}
                    >
                      {item.statusText}
                    </button>
                  </td>
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