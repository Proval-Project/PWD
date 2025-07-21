import React, { useState } from 'react';
import { resetPassword } from '../../api/auth';

const ResetPasswordForm: React.FC<{ onResetSuccess?: () => void }> = ({ onResetSuccess }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await resetPassword(email, code, newPassword);
      setSuccess('비밀번호가 성공적으로 변경되었습니다!');
      if (onResetSuccess) onResetSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || '비밀번호 재설정 실패');
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
      <div>
        <input
          type="text"
          placeholder="인증 코드"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="새 비밀번호"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
      <button type="submit" disabled={loading} style={{ marginTop: 16, width: '100%' }}>
        {loading ? '변경 중...' : '비밀번호 변경'}
      </button>
    </form>
  );
};

export default ResetPasswordForm;
export {}; 