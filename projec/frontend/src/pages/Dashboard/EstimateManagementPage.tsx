import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDraftEstimates, assignEstimate, getEstimateManagement } from '../../api/estimateRequest';
import { IoIosArrowBack, IoIosSearch, IoIosCalendar } from "react-icons/io";
import { AiOutlineDoubleLeft, AiOutlineLeft, AiOutlineRight, AiOutlineDoubleRight } from "react-icons/ai";
import './DashboardPages.css';
import './EstimateInquiry.css'; // ✅ Inquiry UI 재사용

interface DraftItem {
  estimateNo: string;
  companyName: string;
  contactPerson: string;
  requestDate: string;
  completeDate?: string;
  quantity: number;
  statusText: string;
  status: number;
  project: string;
  tempEstimateNo: string;
  writerID: string;
  writerName?: string;
  writerPosition?: string;
  customerName?: string;
  customerPosition?: string;
  managerID?: string;
  managerName?: string;
  managerPosition?: string;
}

const statusOptions = [
  { value: '', label: '전체' },
  { value: '2', label: '견적요청' },
  { value: '3', label: '견적처리중' },
  { value: '4', label: '견적완료' },
  { value: '5', label: '주문' }
];

const EstimateManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // 필터
  const [searchKeyword, setSearchKeyword] = useState('');
  // 오늘 날짜를 YYYY-MM-DD 형식으로 변환
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(getTodayDateString()); // 초기값: 오늘 날짜
  const [statusFilter, setStatusFilter] = useState<string>('');

  // 페이징
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async (page: number = 1, overrideParams: any = {}) => {
    setLoading(true);
    try {
      const params = {
        searchKeyword: searchKeyword || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter ? parseInt(statusFilter) : undefined,
        page,
        pageSize,
        isDescending: true,
        ...overrideParams
      };

      const user = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      // 관리자용 API 사용 - 전체 견적 조회
      console.log('🔍 API 호출 파라미터:', params);
      console.log('🔍 사용자 ID:', user.userId);
      
      let response;
      try {
        // 먼저 관리자용 API 시도
        response = await getEstimateManagement(params, user.userId);
        console.log('✅ 관리자용 API 성공');
      } catch (error) {
        console.log('❌ 관리자용 API 실패, 기본 API 시도');
        // 관리자용 API가 실패하면 기본 API 사용
        response = await getDraftEstimates(params, user.userId);
      }

      // 임시저장(상태 1) 제외하고 필터링
      const allItems = response.Items || response.items || [];
      const filteredItems = allItems.filter((item: DraftItem) => item.status !== 1);
      
      setItems(filteredItems);
      setCurrentPage(response.CurrentPage || response.currentPage || 1);
      setTotalPages(response.TotalPages || response.totalPages || 1);
      // 서버에서 반환한 전체 건수 사용 (필터링 적용된 전체 건수)
      setTotalCount(response.TotalCount || response.totalCount || 0);
    } catch (err) {
      console.error('견적 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    // 상태 필터 변경 시 데이터 조회
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    // 날짜 필터 변경 시 데이터 조회
    if (startDate || endDate) {
      fetchData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    fetchData(1, { pageSize: newSize });
  };

  const extractDateFromCurEstimateNo = (estimateNo: string): string => {
    // YAyyyymmdd-xxx 형태에서 yyyy.mm.dd 추출
    const match = estimateNo.match(/YA(\d{4})(\d{2})(\d{2})/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}`;
    }
    return '-';
  };

  const handleRowClick = (item: DraftItem) => {
    navigate(`/estimate-detail/${item.tempEstimateNo}`, { state: { from: 'management' } });
  };

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-1 gap-3 mt-7">
        <button className="text-xl text-black p-1" onClick={() => navigate(-1)}>
          <IoIosArrowBack />
        </button>
        <h1 className="text-2xl font-bold text-black">견적요청 관리</h1>
      </div>

      {/* 검색/필터 */}
      <div className="search-section">
        <div className="search-row">
          <div className="search-field">
            <div className="search-bar">
              <IoIosSearch className="search-icon" />
              <input
                type="text"
                placeholder="검색"
                value={searchKeyword}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchKeyword(val);
                  if (searchTimeout.current) clearTimeout(searchTimeout.current);
                  searchTimeout.current = setTimeout(() => {
                    fetchData(1, { searchKeyword: val || undefined });
                  }, 500);
                }}
                onKeyPress={(e) => e.key === 'Enter' && fetchData(1)}
              />
            </div>
          </div>

          <div className="date-range">
            <div className="date-picker">
              <IoIosCalendar
                className="calendar-icon"
                onClick={() => (document.getElementById("startDate") as HTMLInputElement)?.showPicker?.()}
              />
              <input 
                type="date" 
                id="startDate" 
                value={startDate} 
                onChange={(e) => {
                  setStartDate(e.target.value);
                  // 날짜 변경 시 즉시 검색 (useEffect에서도 처리되지만 명시적으로 호출)
                  if (e.target.value || endDate) {
                    setTimeout(() => fetchData(1), 100);
                  }
                }} 
              />
            </div>
            <span>~</span>
            <div className="date-picker">
              <IoIosCalendar
                className="calendar-icon"
                onClick={() => (document.getElementById("endDate") as HTMLInputElement)?.showPicker?.()}
              />
              <input 
                type="date" 
                id="endDate" 
                value={endDate} 
                onChange={(e) => {
                  setEndDate(e.target.value);
                  // 날짜 변경 시 즉시 검색 (useEffect에서도 처리되지만 명시적으로 호출)
                  if (startDate || e.target.value) {
                    setTimeout(() => fetchData(1), 100);
                  }
                }} 
              />
            </div>
          </div>

          <div className="status-filter">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button className="search-btn" onClick={() => fetchData(1)}>검색</button>
        </div>
      </div>

      {/* 결과 정보 */}
      <div className="results-header">
        <div className="results-info">총 {totalCount}건</div>
      </div>

      {/* 테이블 */}
      <div className="table-container">
        <table className="inquiry-table">
          <thead>
            <tr>
              <th>견적번호</th>
              <th>회사명</th>
              <th>요청자</th>
              <th>작성자</th>
              <th>요청일자</th>
              <th>상태</th>
              <th>프로젝트명</th>
              <th>담당자</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="loading">로딩 중...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="no-data">데이터가 없습니다.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.tempEstimateNo} onClick={() => handleRowClick(item)} className="clickable-row">
                  <td>{item.estimateNo || '-'}</td>
                  <td>{item.companyName || '-'}</td>
                  <td>{`${item.customerName || item.writerName || item.writerID || '-'}`}{item.customerPosition ? `  ${item.customerPosition}` : (item.writerPosition ? ` / ${item.writerPosition}` : '')}</td>
                  <td>{
                    (item as any).writerRoleId === 1
                      ? '관리자'
                      : (item as any).writerRoleId === 3
                        ? '고객'
                        : `${item.writerName || item.writerID || '-'}` + (item.writerPosition ? ` ${item.writerPosition}` : '')
                  }</td>
                  <td>{item.estimateNo ? extractDateFromCurEstimateNo(item.estimateNo) : '-'}</td>
                  <td><span className={`status-${item.status}`}>{item.statusText}</span></td>
                  <td>{item.project || '-'}</td>
                  <td>
                    {(() => {
                      const roleId = (item as any).managerRoleId;
                      if (roleId === 1) return '관리자';
                      // role 2는 이름 직급 표시, 그 외/미지정 처리
                      if (item.managerName) return `${item.managerName}${item.managerPosition ? ` ${item.managerPosition}` : ''}`;
                      return '미지정';
                    })()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-2 mt-7">
        <button onClick={() => handlePageChange(1)} disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center bg-white border rounded disabled:opacity-50">
          <AiOutlineDoubleLeft />
        </button>
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center bg-white border rounded disabled:opacity-50">
          <AiOutlineLeft />
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
          return (
            <button key={page} onClick={() => handlePageChange(page)}
              className={`w-8 h-8 flex items-center justify-center rounded font-semibold ${currentPage === page ? 'bg-blue-600 text-white' : 'text-black'}`}>
              {page}
            </button>
          );
        })}

        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center bg-white border rounded disabled:opacity-50">
          <AiOutlineRight />
        </button>
        <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center bg-white border rounded disabled:opacity-50">
          <AiOutlineDoubleRight />
        </button>

        <select value={pageSize} onChange={handlePageSizeChange} className="ml-4 p-1 border rounded font-semibold">
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={40}>40</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  );
};

export default EstimateManagementPage;
