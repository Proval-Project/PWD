import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDraftEstimates } from '../../api/estimateRequest';
import './DashboardPages.css';
import './EstimateInquiry.css';
import { IoIosArrowBack, IoIosSearch, IoIosCalendar } from "react-icons/io";
import Modal from "../../components/common/Modal";
import { AiOutlineDoubleLeft, AiOutlineLeft, AiOutlineRight, AiOutlineDoubleRight } from "react-icons/ai";

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
  writerName?: string;
  managerID?: string;
  managerName?: string;
}

const TemporaryStoragePage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DraftItem | null>(null);
  
  // 필터 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // 데이터 조회 함수
  const fetchData = async (page: number = 1, size: number = pageSize) => {
    setLoading(true);
    try {
      const params = {
        searchKeyword: searchKeyword || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        pageSize: size,
        isDescending: true,
      };

      const currentUserId = currentUser?.userId || 'defaultUser';
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

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    const selectedCustomerStr = localStorage.getItem('selectedCustomerForTempStorage');
    if (selectedCustomerStr) {
      setSelectedCustomer(JSON.parse(selectedCustomerStr));
      localStorage.removeItem('selectedCustomerForTempStorage');
    }

    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
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
    fetchData(1, newSize);
  };

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

  const formatDateYmd = (dateString?: string): string => {
    if (!dateString) return '';
    const head = dateString.slice(0, 10);
    return head.replace(/[-\/]/g, '.');
  };

  const handleRowClick = (item: DraftItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleConfirmLoad = () => {
    if (selectedItem) {
      const user = currentUser;
      const canEdit =
        (selectedItem.status === 1 || selectedItem.status === 2) &&
        user &&
        selectedItem.writerID === user.userId;
      const readonly = canEdit ? "false" : "true";

      navigate(`/estimate-request/new?load=${selectedItem.tempEstimateNo}&readonly=${readonly}`);
    }
    setIsModalOpen(false);
  };

  const handleCancel = () => setIsModalOpen(false);

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      <div className="flex items-center mb-1 gap-3 mt-7">
        <button
          className="text-xl text-black p-1"
          onClick={() => navigate(-1)}
        >
          <IoIosArrowBack />
        </button>
        <h1 className="text-2xl font-bold text-black">임시저장함</h1>
      </div>

      {/* 검색 섹션 */}
      <div className="search-section">
        <div className="search-row">
          <div className="search-field">
            <div className="search-bar">
              <IoIosSearch className="search-icon" />
              <input
                type="text"
                placeholder="검색"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <div className="date-range">
            <div className="date-picker">
              <IoIosCalendar className="calendar-icon"
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

          <button className="search-btn" onClick={handleSearch}>
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
              <th>요청자</th>
              <th>요청일자</th>
              <th>상태</th>
              <th>프로젝트명</th>
              <th>담당자</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="loading">데이터를 불러오는 중...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">임시저장된 견적이 없습니다.</td>
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
                  <td>{item.writerName || item.writerID || '-'}</td>
                  <td>{item.requestDate ? formatDateYmd(item.requestDate) : extractDateFromTempEstimateNo(item.tempEstimateNo)}</td>
                  <td>
                    <span className={`status-${item.status}`}>
                      {item.statusText}
                    </span>
                  </td>
                  <td>{item.project || '-'}</td>
                  <td>{item.managerName || '미지정'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이징 */}
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
              }
              !border-0
            `}
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

      <Modal
        isOpen={isModalOpen}
        title="임시저장본"
        message="해당 임시저장본을 불러오시겠습니까?"
        confirmText="확인"
        cancelText="취소"
        confirmColor="green"
        onConfirm={handleConfirmLoad}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default TemporaryStoragePage;
