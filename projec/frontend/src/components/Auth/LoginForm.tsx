import React, { useState } from 'react';
import { login } from '../../api/auth';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Toast } from '../common/Toast';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    userID: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
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
      const response = await login(formData.userID, formData.password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      // 권한별로 분기 이동
      if (response.user.roleName === 'Admin') {
        window.location.href = '/admin';
      } else if (response.user.roleName === 'Sales') {
        window.location.href = '/sales';
      } else {
        window.location.href = '/'; // 고객은 메인 대시보드로 이동
      }
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || '로그인에 실패했습니다.',
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="relative">
    {toast && (
      <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50">
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      </div>
    )}

    <form onSubmit={handleSubmit} className="auth-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12 mt-12">
        <span className="text-gray-400 w-16 text-sm font-semibold">아이디</span>
        <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
        <input
          type="text"
          id="userID"
          name="userID"
          value={formData.userID}
          onChange={handleChange}
          required
          className="flex-1 outline-none text-sm bg-white pl-2"
        />
      </div>

      <div className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12 relative mt-8">
        <span className="text-gray-400 w-16 text-sm font-semibold">비밀번호</span>
        <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
        <input
          type={showPassword ? "text" : "password"}
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="flex-1 outline-none text-sm bg-white pl-2"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <FaEye /> : <FaEyeSlash />}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 mt-8 rounded-lg bg-[#2320F1] text-white font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  </div>
  );
}

export default LoginForm;
