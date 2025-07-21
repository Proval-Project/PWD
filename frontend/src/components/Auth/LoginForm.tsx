import React, { useState } from 'react';
import { login } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(formData.email, formData.password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      // 권한별로 분기 이동
      if (response.user.roleName === 'Admin') {
        window.location.href = '/admin';
      } else if (response.user.roleName === 'Sales') {
        window.location.href = '/sales';
      } else {
        window.location.href = '/customer';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="email">이메일</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">비밀번호</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>

      <button type="submit" disabled={loading} className="submit-button">
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
};

export default LoginForm;
