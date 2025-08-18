import React, { useState, useEffect } from 'react';
import { searchUsers, UserListResponseDto } from '../api/userManagement';
import './UserSearchModal.css';

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserListResponseDto) => void;
}

const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectUser 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserListResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = React.useCallback(async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const results = await searchUsers(searchTerm);
      console.log('검색 결과 (전체):', results);
      // 고객(roleID: 3)만 필터링
      const filteredResults = results.filter(user => user.roleID === 3);
      console.log('필터링된 고객 결과:', filteredResults);
      setUsers(filteredResults);
    } catch (err: any) {
      console.error('고객 검색 실패:', err);
      setError(err.response?.data?.message || '고객 검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen && searchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, isOpen, performSearch]);

  const handleUserSelect = (user: UserListResponseDto) => {
    onSelectUser(user);
    onClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setUsers([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="user-search-modal">
        <div className="modal-header">
          <h3>고객 검색</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="search-input">
            <input
              type="text"
              placeholder="고객을 회사명, 이름, 이메일로 검색하세요..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              className="search-btn" 
              onClick={performSearch}
              disabled={loading || !searchTerm.trim()}
            >
              {loading ? '검색 중...' : '검색'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-message">
              검색 중...
            </div>
          )}

          {!loading && searchTerm && users.length === 0 && (
            <div className="no-results">
              고객 중 검색 결과가 없습니다.
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="user-list">
              {users.map(user => (
                <div 
                  key={user.userID} 
                  className="user-item"
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-company">{user.companyName}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <div className="user-role">
                    {user.roleID === 3 ? '고객' : '기타'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSearchModal; 