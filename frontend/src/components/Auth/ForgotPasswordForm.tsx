import React, { useState } from 'react';
import { forgotPassword } from '../../api/auth';

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || '비밀번호 찾기에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-message">
        <h3>이메일이 전송되었습니다</h3>
        <p>입력하신 이메일 주소로 비밀번호 재설정 링크가 전송되었습니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="email">이메일 주소</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="form-input"
          placeholder="가입한 이메일 주소를 입력하세요"
        />
      </div>

      <button type="submit" disabled={loading} className="submit-button">
        {loading ? '전송 중...' : '비밀번호 찾기'}
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
