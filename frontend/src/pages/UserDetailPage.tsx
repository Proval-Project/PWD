import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface UserDetail {
  userID: string;
  companyName?: string;
  businessNumber?: string;
  address?: string;
  companyPhone?: string;
  name?: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  email?: string;
  isApproved?: boolean;
}

const tableStyle: React.CSSProperties = {
  width: 520,
  margin: '40px auto',
  borderCollapse: 'collapse',
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  overflow: 'hidden',
};
const thStyle: React.CSSProperties = {
  background: '#f5f6fa',
  color: '#222',
  fontWeight: 600,
  padding: '14px 18px',
  borderBottom: '1px solid #e0e0e0',
  width: 160,
  textAlign: 'left',
};
const tdStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid #f0f0f0',
  textAlign: 'left',
  fontSize: 16,
};
const approveBtnStyle: React.CSSProperties = {
  marginTop: 32,
  padding: '12px 32px',
  background: '#2d8cff',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 18,
  fontWeight: 600,
  cursor: 'pointer',
};
const approvedTextStyle: React.CSSProperties = {
  marginTop: 32,
  color: '#1abc9c',
  fontWeight: 700,
  fontSize: 18,
};
const pendingTextStyle: React.CSSProperties = {
  marginTop: 32,
  color: '#e67e22',
  fontWeight: 700,
  fontSize: 18,
};

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approveMsg, setApproveMsg] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = currentUser && currentUser.roleName === 'Admin';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    fetch(`/api/data/users/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('사용자 정보를 불러오지 못했습니다.');
        return res.json();
      })
      .then(data => setUser(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    if (!user) return;
    setApproveMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5236/api/auth/approve-user/${user.userID}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        setUser({ ...user, isApproved: true });
        setApproveMsg('승인 완료!');
      } else {
        setApproveMsg(result.message || '승인에 실패했습니다.');
      }
    } catch (e) {
      setApproveMsg('승인 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 60 }}>로딩 중...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: 60 }}>{error}</div>;
  if (!user) return <div style={{ textAlign: 'center', marginTop: 60 }}>사용자 정보를 찾을 수 없습니다.</div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 0' }}>
      <h2 style={{ marginBottom: 32, fontSize: 28, fontWeight: 700 }}>고객 상세 정보</h2>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <th style={thStyle}>아이디</th>
            <td style={tdStyle}>{user.userID}</td>
          </tr>
          <tr>
            <th style={thStyle}>회사명</th>
            <td style={tdStyle}>{user.companyName || '-'}</td>
          </tr>
          <tr>
            <th style={thStyle}>사업자등록번호</th>
            <td style={tdStyle}>{user.businessNumber || '-'}</td>
          </tr>
          <tr>
            <th style={thStyle}>주소</th>
            <td style={tdStyle}>{user.address || '-'}</td>
          </tr>
          <tr>
            <th style={thStyle}>대표번호</th>
            <td style={tdStyle}>{user.companyPhone || '-'}</td>
          </tr>
          <tr>
            <th style={thStyle}>담당자 성함</th>
            <td style={tdStyle}>{user.name || '-'}</td>
          </tr>
          <tr>
            <th style={thStyle}>담당자 부서</th>
            <td style={tdStyle}>{user.department || '-'}</td>
          </tr>
          <tr>
            <th style={thStyle}>담당자 직급</th>
            <td style={tdStyle}>{user.position || '-'}</td>
          </tr>
          <tr>
            <th style={thStyle}>담당자 연락처</th>
            <td style={tdStyle}>{user.phoneNumber || '-'}</td>
          </tr>
          <tr>
            <th style={thStyle}>담당자 이메일</th>
            <td style={tdStyle}>{user.email || '-'}</td>
          </tr>
        </tbody>
      </table>
      {/* 승인 상태 및 승인 버튼 */}
      {user.isApproved ? (
        <div style={approvedTextStyle}>승인됨</div>
      ) : (
        <div style={pendingTextStyle}>승인 대기중</div>
      )}
      {isAdmin && !user.isApproved && (
        <button style={approveBtnStyle} onClick={handleApprove}>승인</button>
      )}
      {approveMsg && <div style={{ marginTop: 18, color: '#2d8cff', fontWeight: 500 }}>{approveMsg}</div>}
    </div>
  );
};

export default UserDetailPage;
