import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPages.css';
import './CustomerManagement.css';
import { getCustomers, createCustomer, searchCustomers, UserListResponseDto, CreateUserDto } from '../../api/userManagement';

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
  }, [searchTerm, customers]);

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customer-detail/${customerId}`);
  };

  const handleAddCustomer = () => {
    setShowAddModal(true);
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
    <div className="customer-management-page">
      <div className="page-header">
        <div className="header-left">
          <h1>고객 목록</h1>
        </div>
        <div className="header-right">
          <button className="add-customer-btn" onClick={handleAddCustomer}>
            고객 추가
          </button>
        </div>
      </div>

      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="customer-table">
          <thead>
            <tr>
              <th>#</th>
              <th>회사명</th>
              <th>담당자 성함/직급</th>
              <th>담당자 이메일</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
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

      <div className="pagination">
        <button className="pagination-btn">&lt;</button>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((page) => (
          <button
            key={page}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}
        <button className="pagination-btn">&gt;</button>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <CustomerAddForm 
              onClose={() => setShowAddModal(false)} 
              onSuccess={loadCustomers}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// 고객 추가 폼 컴포넌트
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
        roleID: 3 // 고객 역할
      };
      
      await createCustomer(customerData);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('고객 추가 실패:', err);
      setError(err.response?.data?.message || '고객 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-add-form">
      <h2>고객 추가</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>아이디</label>
            <input
              type="text"
              name="userID"
              value={formData.userID}
              onChange={handleChange}
              placeholder="user_ID"
            />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="user_Password"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>회사명</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="프로발"
            />
          </div>
          <div className="form-group">
            <label>사업자등록번호</label>
            <input
              type="text"
              name="businessNumber"
              value={formData.businessNumber}
              onChange={handleChange}
              placeholder="133-81-22773"
            />
          </div>
        </div>

        <div className="form-group">
          <label>주소</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="경기도 시흥시 정왕동 302-702"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>회사 전화번호</label>
            <input
              type="text"
              name="companyPhone"
              value={formData.companyPhone}
              onChange={handleChange}
              placeholder="031-499-4900"
            />
          </div>
          <div className="form-group">
            <label>담당자 성함</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="홍길동"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>담당자 부서</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="영업팀"
            />
          </div>
          <div className="form-group">
            <label>담당자 직급</label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="팀장"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>담당자 연락처</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="010-1234-5678"
            />
          </div>
          <div className="form-group">
            <label>담당자 이메일</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="emailaddress@gmail.com"
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="form-actions">
          <button type="submit" className="btn-add" disabled={loading}>
            {loading ? '추가 중...' : '추가'}
          </button>
          <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>취소</button>
        </div>
      </form>
    </div>
  );
};

export default CustomerManagementPage; 