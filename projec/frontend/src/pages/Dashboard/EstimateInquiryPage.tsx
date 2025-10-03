import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getEstimateInquiry, 
  EstimateInquiryRequest, 
  EstimateInquiryItem, 
  statusOptions 
} from '../../api/estimateInquiry';
import './DashboardPages.css';
import './EstimateInquiry.css';
import { IoIosArrowBack, IoIosSearch, IoIosCalendar } from "react-icons/io";
import { AiOutlineDoubleLeft, AiOutlineLeft, AiOutlineRight, AiOutlineDoubleRight } from "react-icons/ai";

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
  const [pageSize, setPageSize] = useState(10);

  // 데이터 조회
  const fetchData = async (page: number = 1, overrideParams: Partial<EstimateInquiryRequest> = {}) => {
    setLoading(true);
    try {
      let user = currentUser;
      if (!user) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          user = JSON.parse(userStr);
          setCurrentUser(user);
        }
      }

      const params: EstimateInquiryRequest = {
        searchKeyword: searchKeyword || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter ? Number(statusFilter) : undefined,
        page,
        pageSize,
        isDescending,
        ...overrideParams,
      };

      if (user && user.roleId === 3) {
        params.customerID = user.userId;
      }

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

  // 초기 설정
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    setStartDate(oneMonthAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1);
  };

  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    fetchData(1, { pageSize: newSize });
  };

  const handleSortToggle = () => {
    const newIsDescending = !isDescending;
    setIsDescending(newIsDescending);
    fetchData(1, { isDescending: newIsDescending });
  };

  const extractDateFromTempEstimateNo = (tempEstimateNo: string): string => {
    const match = tempEstimateNo.match(/TEMP(\d{4})(\d{2})(\d{2})/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}`;
    }
    return tempEstimateNo;
  };

  const formatDateYmd = (dateString?: string): string => {
    if (!dateString) return '';
    return dateString.slice(0, 10).replace(/[-/]/g, '.');
  };

  const handleRowClick = (item: EstimateInquiryItem) => {
    navigate(`/estimate-detail/${item.tempEstimateNo}`, { state: { from: 'inquiry' } });
  };

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-1 gap-3 mt-7">
        <button
          className="text-xl text-black p-1"
          onClick={() => navigate(-1)}
        >
          <IoIosArrowBack />
        </button>
        <h1 className="text-2xl font-bold text-black">견적요청 조회</h1>
      </div>

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
                  const newKeyword = e.target.value;
                  setSearchKeyword(newKeyword);
                  if (searchTimeout.current) clearTimeout(searchTimeout.current);
                  searchTimeout.current = setTimeout(() => {
                    setCurrentPage(1);
                    fetchData(1, { searchKeyword: newKeyword || undefined });
                  }, 500);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
                onChange={(e) => setStartDate(e.target.value)}
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
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="status-filter">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
                fetchData(1, { status: e.target.value ? Number(e.target.value) : undefined });
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button className="search-btn" onClick={handleSearch}>검색</button>
        </div>
      </div>

      {/* 결과 헤더 */}
      <div className="results-header">
        <div className="results-info">총 {totalCount}건</div>
      </div>

      {/* 테이블 - 임시저장 UI 동일 */}
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="loading">로딩 중...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">조회된 데이터가 없습니다.</td>
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
                  <td>{`${(item as any).customerName || (item as any).writerName || item.writerID || '-'}`}{(item as any).customerPosition ? `  ${(item as any).customerPosition}` : ((item as any).writerPosition ? ` / ${(item as any).writerPosition}` : '')}</td>
                  <td>{
                    (item as any).writerRoleId === 1
                      ? '관리자'
                      : (item as any).writerRoleId === 3
                        ? '고객'
                        : `${(item as any).writerName || item.writerID || '-'}` + ((item as any).writerPosition ? ` ${(item as any).writerPosition}` : '')
                  }</td>
                  <td>{item.requestDate ? formatDateYmd(item.requestDate) : extractDateFromTempEstimateNo(item.tempEstimateNo)}</td>
                  <td>
                    <span className={`status-${item.status}`}>
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

      {/* 페이지네이션 - 임시저장 UI 동일 */}
        <div className="flex items-center justify-center gap-2 mt-7">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center bg-white border rounded disabled:opacity-50"
          >
            <AiOutlineDoubleLeft />
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center bg-white border rounded disabled:opacity-50"
          >
            <AiOutlineLeft />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 flex items-center justify-center rounded font-semibold ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-black'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center bg-white border rounded disabled:opacity-50"
          >
            <AiOutlineRight />
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center bg-white border rounded disabled:opacity-50"
          >
            <AiOutlineDoubleRight />
          </button>

          {/* ✅ pageSize 드롭다운 */}
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="ml-4 p-1 border rounded font-semibold"
          >
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

export default EstimateInquiryPage;
