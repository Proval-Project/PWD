import React, { useState } from 'react';
import { login } from '../../api/auth';

const LoginForm: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      localStorage.setItem('token', res.data.token);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: '0 auto' }}>
      <h2>로그인</h2>
      <div>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ marginTop: 16, width: '100%' }}>
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
};

export default LoginForm;
export {}; 