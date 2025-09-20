import React from 'react';
import ForgotPasswordForm from '../components/Auth/ForgotPasswordForm';
import LanguageToggle from '../components/LanguageToggle';

const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="page-container flex flex-col min-h-screen bg-white">
      <div className="flex-grow flex items-center flex-col justify-center font-inter">
        <div className="auth-container bg-[#EFEFEF] p-8 rounded-lg shadow w-96">
          <h2 className="text-4xl font-black mb-6 text-center">아이디 찾기</h2>
          <ForgotPasswordForm />

          <div className="flex justify-between items-center mt-6 text-xs text-gray-500 font-bold">
            <a href="/login" className="hover:underline">
              로그인
            </a>
            <a href="/register" className="hover:underline">
              회원가입
            </a>
          </div>
        </div>
        <div className="mt-8">
          <img src="/ProvalLogo.svg" alt="로고" className="h-12 w-auto" />
        </div>
      </div>

      <div className="flex justify-start items-center p-4">
        <LanguageToggle />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
