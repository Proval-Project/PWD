import React, { useState, useEffect } from 'react';
import { resetPassword, forgotPassword } from '../../api/auth';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { Toast } from '../common/Toast';

const ResetPasswordForm: React.FC<{ email?: string }> = ({ email = "" }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [expired, setExpired] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      setToken(''); 
      setNewPassword('');
      setConfirmPassword('');
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const validatePassword = (pw: string) => {
    if (pw.length < 8 || pw.length > 20) return false;
    let types = 0;
    if (/[a-z]/.test(pw)) types++;
    if (/[A-Z]/.test(pw)) types++;
    if (/[0-9]/.test(pw)) types++;
    return types >= 2;
  };

  const isPasswordValid = validatePassword(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setError("비밀번호가 조건을 충족하지 않습니다.");
      setLoading(false);
      return;
    }

    try {
      await resetPassword(email, token, newPassword, confirmPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      await forgotPassword(email);
      setTimeLeft(300); 
      setExpired(false);
      setToken('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setToast({ message: "인증번호가 이메일로 재발송되었습니다.", type: "success" });
    } catch (err: any) {
      setError(err.response?.data?.message || '인증번호 재발송에 실패했습니다.');
      setToast({ message: "인증번호 재발송에 실패했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-bold text-[#2320F1] mb-2">
          비밀번호가 성공적으로 변경되었습니다!
        </h3>
        <p className="text-sm text-gray-600">
          이제 새로운 비밀번호로 로그인할 수 있습니다.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full h-12 mt-8 rounded-lg bg-[#2320F1] text-white font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          로그인
        </button>
      </div>
    );
  }

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
        <div className="flex justify-between items-center mb-1 mt-8">
          <p className="text-xs text-black">{email}</p>
          {!expired && (
            <p className="text-xs text-red-500 font-semibold">
              {formatTime(timeLeft)}
            </p>
          )}
        </div>

        <div className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12">
          <span className="text-gray-400 w-20 text-sm font-semibold">인증번호</span>
          <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
          <input
            type="text"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            className="flex-1 outline-none text-sm bg-white pl-2"
          />
        </div>

        {expired && (
          <p className="text-sm text-red-500 mt-1">
            인증번호가 만료되었습니다. <br />
            인증번호 전송을 다시 요청해주세요.
          </p>
        )}

        <div className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12 relative mt-4">
          <span className="text-gray-400 w-20 text-sm font-semibold">새 비밀번호</span>
          <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
          <input
            type={showNewPassword ? "text" : "password"}
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="flex-1 outline-none text-sm bg-white pl-2 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            {showNewPassword ? <FaEye /> : <FaEyeSlash />}
          </button>
        </div>

        <div className={`mt-1 text-xs ${isPasswordValid ? 'text-black' : 'text-red-500'}`}>
          <p>◦ 8-20 문자</p>
          <p>◦ 대문자, 소문자, 숫자 중 2가지 포함 필수</p>
        </div>

        <div className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12 relative mt-4">
          <span className="text-gray-400 w-20 text-sm font-semibold">재입력</span>
          <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="flex-1 outline-none text-sm bg-white pl-2 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
          </button>
        </div>

        {error && <div className="text-sm text-red-500 mb-3">{error}</div>}

        {!expired ? (
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-4 rounded-lg bg-[#2320F1] text-white font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="w-full h-12 mt-8 rounded-lg bg-gray-500 text-white font-semibold text-lg hover:bg-gray-600 transition disabled:opacity-50"
          >
            {loading ? '재발송 중...' : '인증번호 재발송'}
          </button>
        )}
      </form>
    </div>
  );
};

export default ResetPasswordForm;
