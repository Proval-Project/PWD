import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPages.css';
import './StaffManagement.css'; // 담당자 목록 CSS 재사용
import { getPendingApprovals } from '../../api/userManagement';
import { IoIosArrowBack, IoIosSearch } from "react-icons/io";
import { AiOutlineDoubleLeft, AiOutlineLeft, AiOutlineRight, AiOutlineDoubleRight } from "react-icons/ai";

interface MembershipRequest {
  userID: string;
  companyName: string;
  name: string;
  email: string;
}

const MembershipRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MembershipRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 요청 목록 로드
  useEffect(() => {
    loadRequests();
  }, []);

  // 페이지 포커스 시 목록 새로고침 (거절/승인 후 돌아왔을 때)
  useEffect(() => {
    const handleFocus = () => {
      loadRequests();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingApprovals();
      const requestData: MembershipRequest[] = data.map((r: any) => ({
        userID: r.userID,
        companyName: r.companyName,
        name: r.name,
        email: r.email
      }));
      setRequests(requestData);
      setFilteredRequests(requestData);
    } catch (err) {
      console.error('회원가입 요청 로드 실패:', err);
      setError('회원가입 요청을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 기능
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRequests(requests);
    } else {
      const filtered = requests.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRequests(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, requests]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="staff-management-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>회원가입 요청을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-management-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadRequests} className="retry-btn">다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-1 gap-3 mt-7">
        <button className="text-xl text-black p-1" onClick={() => navigate(-1)}>
          <IoIosArrowBack />
        </button>
        <div className="text-2xl font-bold text-black">
          <h1>회원가입 요청 목록</h1>
        </div>
      </div>

      {/* 테이블 */}
      <div className="table-wrapper mt-8">
        <div className="table-container">
          <table className="staff-table">
            <thead>
              <tr>
                <th>아이디</th>
                <th>회사명</th>
                <th>담당자 성함</th>
                <th>담당자 이메일</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.map((r) => (
                <tr
                  key={r.userID}
                  onClick={() => navigate(`/membership-request-detail/${r.userID}`)}
                  className="staff-row"
                >
                  <td>{r.userID}</td>
                  <td>{r.companyName}</td>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-8 h-8 flex items-center justify-center rounded font-semibold ${
                currentPage === page ? 'bg-blue-600 text-white' : 'text-black'
              }`}
            >
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

export default MembershipRequestsPage;
