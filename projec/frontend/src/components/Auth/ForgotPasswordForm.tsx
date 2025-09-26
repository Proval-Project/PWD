import React, { useState } from 'react';
import { forgotPassword } from '../../api/auth';
import { Toast } from '../common/Toast';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    setToast(null);

    if (!email) {
      setToast({ message: "이메일을 입력해주세요.", type: "error" });
      setLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setToast({ message: "올바른 이메일 형식을 입력해주세요.", type: "error" });
      setLoading(false);
      return;
    }

    try {
      await forgotPassword(email);
      setSuccessMessage("입력하신 이메일로 아이디를 전송했습니다!\n비밀번호 재설정을 진행해주세요.");
    } catch (err: any) {
      setErrorMessage("해당 이메일로 가입된 계정이 존재하지 않습니다.");
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
        <div className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12 mt-12">
          <span className="text-gray-400 text-sm font-semibold w-20">이메일 주소</span>
          <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 outline-none text-sm bg-white pl-2"
          />
        </div>

        {successMessage && (
          <p className="text-red-500 text-sm mt-2 whitespace-pre-line">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 mt-8 rounded-lg bg-[#2320F1] text-white font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50"
          onClick={(e) => {
            if (successMessage) {
              e.preventDefault();
              window.location.href = '/login';
            }
          }}
        >
          {loading ? '전송 중...' : successMessage ? '로그인' : '아이디 찾기'}
        </button>


        <button
          type="button"
          disabled={!successMessage}
          className={`w-full h-12 mt-4 rounded-lg font-semibold text-lg border transition
            ${
              successMessage
                ? 'bg-white text-[#2320F1] border-[#2320F1]'
                : 'bg-white text-gray-300 border-gray-300'
            }`}
          onClick={() => {
            if (successMessage) {
              navigate('/reset-password', { state: { email } });
            }
          }}
        >
          비밀번호 재설정
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
