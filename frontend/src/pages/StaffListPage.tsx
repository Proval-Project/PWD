import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Staff {
  userID: string;
  name: string;
  email: string;
  companyName?: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  createdAt?: string;
}

const tableStyle: React.CSSProperties = {
  margin: '0 auto',
  borderCollapse: 'separate',
  borderSpacing: '0',
  minWidth: 900,
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
  maxWidth: 1100,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  margin: '0 auto',
};

const StaffListPage: React.FC = () => {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/data/users?roleId=3`)
      .then(res => {
        if (!res.ok) throw new Error('직원 조회 실패');
        return res.json();
      })
      .then(data => setStaffs(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        <h2 style={{ marginBottom: 48, marginTop: 0, fontSize: 28 }}>직원 관리</h2>
        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div>로딩 중...</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>번호</th>
                <th style={thStyle}>이름</th>
                <th style={thStyle}>이메일</th>
                <th style={thStyle}>회사명</th>
                <th style={thStyle}>부서</th>
                <th style={thStyle}>직급</th>
                <th style={thStyle}>전화번호</th>
                <th style={thStyle}>가입일</th>
              </tr>
            </thead>
            <tbody>
              {staffs.length === 0 ? (
                <tr><td style={tdStyle} colSpan={8}>직원이 없습니다.</td></tr>
              ) : (
                staffs.map((s, idx) => (
                  <tr
                    key={s.userID}
                    style={{ ...(idx % 2 === 1 ? trHover : {}), ...trClickable }}
                    onClick={() => navigate(`/users/${s.userID}`)}
                  >
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={tdStyle}>{s.name}</td>
                    <td style={tdStyle}>{s.email}</td>
                    <td style={tdStyle}>{s.companyName}</td>
                    <td style={tdStyle}>{s.department}</td>
                    <td style={tdStyle}>{s.position}</td>
                    <td style={tdStyle}>{s.phoneNumber}</td>
                    <td style={tdStyle}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</td>
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

export default StaffListPage; 