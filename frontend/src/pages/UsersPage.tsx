import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
  companyName: string;
  businessNumber: string;
  address: string;
  companyPhone: string;
  department: string;
  position: string;
  phoneNumber: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/auth/pending-users', {
        baseURL: 'http://localhost:5236',
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '사용자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const handleApprove = async (email: string) => {
    setActionMsg('');
    try {
      await axios.post(`/api/auth/approve-user/${email}`, {}, {
        baseURL: 'http://localhost:5236',
        headers: { Authorization: `Bearer ${token}` }
      });
      setActionMsg('승인 완료!');
      fetchUsers();
    } catch (err: any) {
      setActionMsg(err.response?.data?.message || '승인에 실패했습니다.');
    }
  };

  const handleReject = async (email: string) => {
    setActionMsg('');
    try {
      await axios.post(`/api/auth/reject-user/${email}`, {}, {
        baseURL: 'http://localhost:5236',
        headers: { Authorization: `Bearer ${token}` }
      });
      setActionMsg('거부 완료!');
      fetchUsers();
    } catch (err: any) {
      setActionMsg(err.response?.data?.message || '거부에 실패했습니다.');
    }
  };

  return (
    <div className="page-container">
      <h2>회원 관리</h2>
      {error && <div className="error-message">{error}</div>}
      {actionMsg && <div className="success-message">{actionMsg}</div>}
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>이메일</th>
              <th>이름</th>
              <th>역할</th>
              <th>회사명</th>
              <th>부서</th>
              <th>직책</th>
              <th>전화번호</th>
              <th>가입일</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={10}>대기 중인 회원이 없습니다.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.userId}>
                  <td>{user.email}</td>
                  <td>{user.name}</td>
                  <td>{user.role}</td>
                  <td>{user.companyName}</td>
                  <td>{user.department}</td>
                  <td>{user.position}</td>
                  <td>{user.phoneNumber}</td>
                  <td>{new Date(user.createdAt).toLocaleString()}</td>
                  <td>{user.isApproved ? '승인됨' : '대기중'}</td>
                  <td>
                    {!user.isApproved && (
                      <>
                        <button onClick={() => handleApprove(user.email)} className="approve-btn">승인</button>
                        <button onClick={() => handleReject(user.email)} className="reject-btn">거부</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UsersPage;
