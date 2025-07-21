import React, { useState } from 'react';
import { forgotPassword } from '../../api/auth';

const ForgotPasswordForm: React.FC<{ onRequestCode?: (email: string) => void }> = ({ onRequestCode }) => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await forgotPassword(email);
      setSuccess('인증 코드가 이메일로 전송되었습니다.');
      if (onRequestCode) onRequestCode(email);
    } catch (err: any) {
      setError(err.response?.data?.message || '요청 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: '0 auto' }}>
      <h2>비밀번호 재설정</h2>
      <div>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
      <button type="submit" disabled={loading} style={{ marginTop: 16, width: '100%' }}>
        {loading ? '요청 중...' : '인증 코드 요청'}
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
export {}; 