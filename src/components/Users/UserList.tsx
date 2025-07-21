import React, { useEffect, useState } from 'react';
import { getUsers } from '../../api/dataService';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const UserList: React.FC<{ onSelectUser?: (id: string) => void }> = ({ onSelectUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsers()
      .then(res => setUsers(res.data))
      .catch(() => setError('사용자 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>이름</th>
          <th>이메일</th>
          <th>권한</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id} style={{ cursor: 'pointer' }} onClick={() => onSelectUser && onSelectUser(user.id)}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserList;
export {}; 