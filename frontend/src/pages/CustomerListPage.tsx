import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  userID: string;
  name: string;
  email: string;
  companyName?: string;
  position?: string;
}

const tableStyle: React.CSSProperties = {
  margin: '0 auto',
  borderCollapse: 'separate',
  borderSpacing: '0',
  minWidth: 700,
  background: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  borderRadius: 12,
  overflow: 'hidden',
};
const thStyle: React.CSSProperties = {
  background: '#f5f6fa',
  color: '#222',
  fontWeight: 700,
  padding: '16px 22px',
  borderBottom: '1.5px solid #e0e0e0',
  textAlign: 'center',
  fontSize: 17,
};
const tdStyle: React.CSSProperties = {
  padding: '15px 20px',
  borderBottom: '1px solid #f0f0f0',
  textAlign: 'center',
  fontSize: 16,
};
const trHover: React.CSSProperties = {
  background: '#f9fafb',
};
const trClickable: React.CSSProperties = {
  cursor: 'pointer',
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '80vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  padding: '48px 0',
  boxSizing: 'border-box',
};

const innerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 1000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  margin: '0 auto',
};

const CustomerListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const roleId = Number(localStorage.getItem('roleId') || 3);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/data/users?roleId=2`)
      .then(res => {
        if (!res.ok) throw new Error('사용자 조회 실패');
        return res.json();
      })
      .then(data => setUsers(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        <h2 style={{ marginBottom: 48, marginTop: 0, fontSize: 28 }}>고객 관리</h2>
        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div>로딩 중...</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>번호</th>
                <th style={thStyle}>회사명</th>
                <th style={thStyle}>담당자명</th>
                <th style={thStyle}>직급</th>
                <th style={thStyle}>이메일</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td style={tdStyle} colSpan={5}>고객이 없습니다.</td></tr>
              ) : (
                users.map((u, idx) => (
                  <tr
                    key={u.userID}
                    style={{ ...(idx % 2 === 1 ? trHover : {}), ...trClickable }}
                    onClick={() => navigate(`/users/${u.userID}`)}
                  >
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={tdStyle}>{u.companyName}</td>
                    <td style={tdStyle}>{u.name}</td>
                    <td style={tdStyle}>{u.position}</td>
                    <td style={tdStyle}>{u.email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomerListPage; 