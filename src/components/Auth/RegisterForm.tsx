import React, { useState } from 'react';
import { register } from '../../api/auth';

const RegisterForm: React.FC<{ onRegisterSuccess?: () => void }> = ({ onRegisterSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await register(email, password, name);
      setSuccess('회원가입이 완료되었습니다!');
      if (onRegisterSuccess) onRegisterSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || '회원가입 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: '0 auto' }}>
      <h2>회원가입</h2>
      <div>
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
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
      {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
      <button type="submit" disabled={loading} style={{ marginTop: 16, width: '100%' }}>
        {loading ? '회원가입 중...' : '회원가입'}
      </button>
    </form>
  );
};

export default RegisterForm;
export {}; 