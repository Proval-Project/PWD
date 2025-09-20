import React, { useState } from 'react';
import { resetPassword } from '../../api/auth';

interface ResetPasswordFormProps {
  email?: string;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ email }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-message">
        <h3>비밀번호가 성공적으로 변경되었습니다.</h3>
        <p>이제 새로운 비밀번호로 로그인할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && <div className="error-message">{error}</div>}
      {email && (
        <div className="form-group">
          <label>이메일</label>
          <div className="form-input bg-gray-100">{email}</div>
        </div>
      )}
      <div className="form-group">
        <label htmlFor="token">토큰</label>
        <input
          type="text"
          id="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          className="form-input"
          placeholder="이메일로 받은 토큰을 입력하세요"
        />
      </div>
      <div className="form-group">
        <label htmlFor="newPassword">새 비밀번호</label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="form-input"
        />
      </div>
      <button type="submit" disabled={loading} className="submit-button">
        {loading ? '변경 중...' : '비밀번호 변경'}
      </button>
    </form>
  );
};

export default ResetPasswordForm;
