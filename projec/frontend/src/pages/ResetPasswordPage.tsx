import React from "react";
import ResetPasswordForm from "../components/Auth/ResetPasswordForm";
import LanguageToggle from "../components/LanguageToggle";
import { useLocation } from "react-router-dom";
import { emit } from "process";

const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const email = location.state?.email || "";

  return (
    <div className="page-container flex flex-col min-h-screen bg-white">
      <div className="flex-grow flex items-center flex-col justify-center font-inter">
        <div className="auth-container bg-[#EFEFEF] p-8 rounded-lg shadow w-96">
          <h2 className="text-4xl font-black mb-6 text-center">비밀번호 재설정</h2>
          <ResetPasswordForm email={email} />
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

export default ResetPasswordPage;
