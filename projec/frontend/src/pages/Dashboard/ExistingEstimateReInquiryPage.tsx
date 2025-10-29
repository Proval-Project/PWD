import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEstimateInquiry, EstimateInquiryRequest, EstimateInquiryItem, statusOptions } from '../../api/estimateInquiry';
import { createEstimateSheetFromExisting, CreateEstimateSheetDto } from '../../api/estimateRequest';
import { buildApiUrl } from '../../config/api';
import { getEstimateDetail } from '../../api/estimateRequest';
import './DashboardPages.css';
import './EstimateInquiry.css';
import CustomerSearchModal from '../../components/CustomerSearchModal';
import { IoIosArrowBack, IoIosSearch, IoIosCalendar } from 'react-icons/io';
import { AiOutlineDoubleLeft, AiOutlineLeft, AiOutlineRight, AiOutlineDoubleRight } from 'react-icons/ai';

const ExistingEstimateReInquiryPage: React.FC = () => {
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
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  
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
        // 재문의 페이지는 '견적완료(4), 주문(5)'만 대상. 서버 조회는 상태별로 따로 불러와 합치기 때문에 여기 기본 status는 넣지 않음
        page,
        pageSize,
        isDescending,
        ...overrideParams, // 매개변수로 전달된 값이 우선
      };

      // 고객(roleID=3): 자신의 건만. 관리자/직원: 고객 선택 강제
      if (user) {
        if (user.roleId === 3) {
          params.customerID = user.userId;
          console.log('고객 권한으로 조회 - CustomerID(UserID):', user.userId);
        } else {
          // 관리자/직원은 고객 선택이 있어야 함
          if (selectedCustomer?.userID || selectedCustomer?.userId) {
            params.customerID = (selectedCustomer as any).userID || (selectedCustomer as any).userId;
          } else {
            // 고객 미선택 시 빈 결과 강제
            setItems([]);
            setTotalCount(0);
            setTotalPages(1);
            setCurrentPage(1);
            return;
          }
        }
      }

      console.log('API 요청 파라미터(기본):', params); // 디버깅용
      // 상태 3(처리중), 4(완료), 5(주문) 조회하여 병합
      const MAX_PAGE = 1000;
      const [resp3, resp4, resp5] = await Promise.all([
        getEstimateInquiry({ ...params, status: 3, page: 1, pageSize: MAX_PAGE }),
        getEstimateInquiry({ ...params, status: 4, page: 1, pageSize: MAX_PAGE }),
        getEstimateInquiry({ ...params, status: 5, page: 1, pageSize: MAX_PAGE })
      ]);

      const combined = [
        ...(resp3.items || []),
        ...(resp4.items || []),
        ...(resp5.items || [])
      ];
      // 정렬: 요청일자 우선, 없으면 TempEstimateNo 날짜로 대체
      const toDateKey = (it: any) => {
        if (it.requestDate) return new Date(it.requestDate).getTime();
        const m = /TEMP(\d{4})(\d{2})(\d{2})/.exec(it.tempEstimateNo || '');
        if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`).getTime();
        return 0;
      };
      combined.sort((a, b) => {
        const da = toDateKey(a);
        const db = toDateKey(b);
        return isDescending ? db - da : da - db;
      });

      const startIdx = (page - 1) * pageSize;
      const paged = combined.slice(startIdx, startIdx + pageSize);
      setItems(paged);
      setCurrentPage(page);
      setTotalCount(combined.length);
      setTotalPages(Math.max(1, Math.ceil(combined.length / pageSize)));
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

    // EstimateRequestPage에서 전달된 선택 고객 복원
    const preselected = localStorage.getItem('selectedCustomerForReInquiry');
    if (preselected) {
      try {
        const cust = JSON.parse(preselected);
        setSelectedCustomer(cust);
        // 일회성 사용 후 제거
        localStorage.removeItem('selectedCustomerForReInquiry');
      } catch {}
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

  // 행 클릭 핸들러 (기존 견적에서 새로운 견적 생성)
  const handleRowClick = async (item: EstimateInquiryItem) => {
    try {
      // 현재 사용자 정보가 없으면 다시 가져오기
      let user = currentUser;
      if (!user) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          user = JSON.parse(userStr);
          setCurrentUser(user);
        }
      }

      if (!user) {
        alert('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      console.log('기존 견적 복제 준비:', item.tempEstimateNo);
      // 백엔드 재문의 API를 호출하여 새 견적을 생성(PrevEstimateNo 자동 설정)
      const dto: CreateEstimateSheetDto = {
        project: (item as any).project || '',
        customerRequirement: '',
        customerID: user.userId,
        writerID: user.userId,
      };
      const newTempEstimateNo = await createEstimateSheetFromExisting(dto, user.userId, item.tempEstimateNo);
      // 새로 생성된 견적으로 이동
      navigate(`/estimate-request/${newTempEstimateNo}`);

    } catch (error) {
      console.error('기존 견적에서 새로운 견적 생성 실패:', error);
      alert('기존 견적에서 새로운 견적을 생성하는데 실패했습니다.');
    }
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
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-1 gap-3 mt-7">
        <button
          className="text-xl text-black p-1"
          onClick={() => navigate(-1)}
        >
          <IoIosArrowBack />
        </button>
        <h1 className="text-2xl font-bold text-black">기존견적 재문의</h1>
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

          {/* 관리자/직원 전용 고객선택 보조 */}
          {currentUser?.roleId !== 3 && (
            <div className="search-field" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="btn-search" onClick={() => setShowCustomerSearch(true)}>고객 검색</button>
              {selectedCustomer && (
                <span className="selected-customer">{selectedCustomer.companyName} / {selectedCustomer.name}</span>
              )}
              {selectedCustomer && (
                <button className="btn-clear" onClick={() => setSelectedCustomer(null)}>선택 해제</button>
              )}
            </div>
          )}

          <button className="search-btn" onClick={handleSearch}>검색</button>
        </div>
      </div>

      {/* 고객 검색 모달 */}
      {showCustomerSearch && (
        <CustomerSearchModal
          isOpen={showCustomerSearch}
          onClose={() => setShowCustomerSearch(false)}
          onSelectUser={(user: any) => {
            setSelectedCustomer(user);
            setShowCustomerSearch(false);
            setCurrentPage(1);
            setTimeout(() => fetchData(1), 100);
          }}
        />
      )}

      {/* 결과 헤더 */}
      <div className="results-header">
        <div className="results-info">총 {totalCount}건</div>
      </div>

      {/* 테이블 - 견적요청 조회와 동일 구성 */}
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

      {/* 페이지네이션 - 견적요청 조회와 동일 구성 */}
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
      </div>
    </div>
  );
};

export default ExistingEstimateReInquiryPage;
