import React from "react";
import LoginForm from "../components/Auth/LoginForm";
import LanguageToggle from "../components/LanguageToggle";

const LoginPage: React.FC = () => {
  return (
    <div className="page-container flex flex-col min-h-screen bg-white">
      <div className="flex-grow flex items-center flex-col justify-center font-inter">
        <div className="auth-container bg-[#EFEFEF] p-8 rounded-lg shadow w-96">
          <h2 className="text-4xl font-black mb-6 text-center">로그인 화면</h2>
          <LoginForm />

          <div className="flex justify-between items-center mt-6 text-xs text-gray-500 font-bold">
            <a href="/register" className="hover:underline">
              회원가입
            </a>
            <a href="/forgot-password" className="hover:underline">
              아이디/비밀번호 찾기
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

export default LoginPage;
