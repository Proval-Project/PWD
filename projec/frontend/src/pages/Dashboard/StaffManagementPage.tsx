import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPages.css';
import './StaffManagement.css';
import { getStaff, createStaff, searchStaff, UserListResponseDto, CreateUserDto } from '../../api/userManagement';

interface Staff {
  userID: string;
  name: string;
  department: string;
  email: string;
}

const StaffManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 담당자 목록 로드
  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStaff();
      const staffData: Staff[] = data.map(staff => ({
        userID: staff.userID,
        name: staff.name,
        department: staff.department,
        email: staff.email
      }));
      setStaffMembers(staffData);
      setFilteredStaff(staffData);
    } catch (err) {
      console.error('담당자 목록 로드 실패:', err);
      setError('담당자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 기능
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStaff(staffMembers);
    } else {
      const filtered = staffMembers.filter(staff =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStaff(filtered);
    }
  }, [searchTerm, staffMembers]);

  const handleStaffClick = (staffId: string) => {
    navigate(`/staff-detail/${staffId}`);
  };

  const handleAddStaff = () => {
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="staff-management-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>담당자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-management-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadStaff} className="retry-btn">다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-management-page">
      <div className="page-header">
        <div className="header-left">
          <h1>담당자 목록</h1>
        </div>
        <div className="header-right">
          <button className="add-staff-btn" onClick={handleAddStaff}>
            담당자 추가
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
        <table className="staff-table">
          <thead>
            <tr>
              <th>#</th>
              <th>담당자 성함</th>
              <th>담당자 부서</th>
              <th>담당자 이메일</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staff) => (
              <tr 
                key={staff.userID}
                onClick={() => handleStaffClick(staff.userID)}
                className="staff-row"
              >
                <td>{staff.userID}</td>
                <td>{staff.name}</td>
                <td>{staff.department}</td>
                <td>{staff.email}</td>
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
            <StaffAddForm 
              onClose={() => setShowAddModal(false)} 
              onSuccess={loadStaff}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// 담당자 추가 폼 컴포넌트
const StaffAddForm: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    userID: '',
    password: '',
    name: '',
    department: '',
    position: '',
    email: '',
    phoneNumber: ''
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
      
      const staffData: CreateUserDto = {
        ...formData,
        roleID: 2, // 담당자 역할
        companyName: '프로발', // 담당자는 프로발로 디폴트 설정
        businessNumber: '',
        address: '',
        companyPhone: ''
      };
      
      await createStaff(staffData);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('담당자 추가 실패:', err);
      setError(err.response?.data?.message || '담당자 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-add-form">
      <h2>담당자 추가</h2>
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
            <label>담당자 성함</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="담당자1"
            />
          </div>
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
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>담당자 직급</label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="대리"
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

export default StaffManagementPage; 