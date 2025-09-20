// CustomerManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPages.css';
import './CustomerManagement.css';
import { getCustomers, createCustomer, CreateUserDto } from '../../api/userManagement';
import { IoIosArrowBack, IoIosSearch } from "react-icons/io";
import { AiOutlineDoubleLeft, AiOutlineLeft, AiOutlineRight, AiOutlineDoubleRight } from "react-icons/ai";

interface Customer {
  userID: string;
  companyName: string;
  name: string;
  position: string;
  email: string;
}

const CustomerManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 고객 목록 로드
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomers();
      const customerData: Customer[] = data.map(customer => ({
        userID: customer.userID,
        companyName: customer.companyName,
        name: customer.name,
        position: customer.position,
        email: customer.email
      }));
      setCustomers(customerData);
      setFilteredCustomers(customerData);
    } catch (err) {
      console.error('고객 목록 로드 실패:', err);
      setError('고객 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 기능
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, customers]);

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customer-detail/${customerId}`);
  };

  const handleAddCustomer = () => {
    setShowAddModal(true);
  };

  // 페이지네이션 데이터
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice(
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
      <div className="customer-management-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>고객 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-management-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadCustomers} className="retry-btn">다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      <div className="flex items-center mb-1 gap-3 mt-7">
        <button
          className="text-xl text-black p-1"
          onClick={() => navigate(-1)}
        >
          <IoIosArrowBack />
        </button>
        <div className="text-2xl font-bold text-black">
          <h1>고객 목록</h1>
        </div>
      </div>

      <div className="search-section">
        <div className="search-row">
          <div className="search-field">
            <div className="search-bar">
              <IoIosSearch className="search-icon" />
              <input
                type="text"
                placeholder="검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="table-wrapper mt-8">
        <div className="add-customer-btn-wrapper flex justify-end mb-6">
          <button
            className="min-w-[150px] bg-[#DFDFDF] border-2 border-[#CDCDCD] text-black font-semibold px-4 py-2 rounded-2xl hover:bg-blue-700 hover:text-white hover:border-blue-700"
            onClick={handleAddCustomer}
          >
            고객 추가
          </button>
        </div>
        <div className="table-container">
          <table className="customer-table">
            <thead>
              <tr>
                <th>아이디</th>
                <th>회사명</th>
                <th>담당자 성함/직급</th>
                <th>담당자 이메일</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer) => (
                <tr 
                  key={customer.userID}
                  onClick={() => handleCustomerClick(customer.userID)}
                  className="customer-row"
                >
                  <td>{customer.userID}</td>
                  <td>{customer.companyName}</td>
                  <td>{customer.name}/{customer.position}</td>
                  <td>{customer.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-2 mt-7">
        <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center bg-white border rounded disabled:opacity-50">
          <AiOutlineDoubleLeft />
        </button>
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center bg-white border rounded disabled:opacity-50">
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

        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center bg-white border rounded disabled:opacity-50">
          <AiOutlineRight />
        </button>
        <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center bg-white border rounded disabled:opacity-50">
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

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <CustomerAddForm onClose={() => setShowAddModal(false)} onSuccess={loadCustomers} />
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ 고객 추가 폼 (표 스타일)
const CustomerAddForm: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    userID: '',
    password: '',
    companyName: '',
    businessNumber: '',
    address: '',
    companyPhone: '',
    name: '',
    department: '',
    position: '',
    phoneNumber: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const customerData: CreateUserDto = {
        ...formData,
        roleID: 3
      };

      await createCustomer(customerData);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('고객 추가 실패:', err);
      const errMsg = err.response?.data?.message || '고객 추가에 실패했습니다.';
      setError(errMsg);
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-add-form">
      <form onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-lg border border-[#CDCDCD] bg-white shadow">
          <table className="w-full border-collapse">
            <tbody>
              {[
                { label: "아이디", name: "userID", type: "text" },
                { label: "비밀번호", name: "password", type: "password" },
                { label: "이메일", name: "email", type: "email" },
                { label: "담당자 성함", name: "name", type: "text" },
                { label: "담당자 연락처", name: "phoneNumber", type: "text" },
                { label: "부서", name: "department", type: "text" },
                { label: "직책", name: "position", type: "text" },
                { label: "회사명", name: "companyName", type: "text" },
                { label: "사업자등록번호", name: "businessNumber", type: "text" },
                { label: "주소", name: "address", type: "text" },
                { label: "회사 연락처", name: "companyPhone", type: "text" },
              ].map((field) => (
                <tr key={field.name}>
                  <th className="w-1/3 bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">
                    {field.label}
                  </th>
                  <td className="p-3">
                    <input
                      type={field.type}
                      name={field.name}
                      value={(formData as any)[field.name]}
                      onChange={handleChange}
                      className="w-full border border-[#CDCDCD] rounded px-2 py-1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <div className="error-message mt-2">{error}</div>}

        <div className="flex justify-center gap-20 mt-10">
          <button type="submit" className="px-20 py-2 bg-green-600 text-white rounded font-semibold" disabled={loading}>
            {loading ? '추가 중...' : '추가'}
          </button>
          <button type="button" className="px-20 py-2 bg-red-600 text-white rounded font-semibold" onClick={onClose} disabled={loading}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerManagementPage;
