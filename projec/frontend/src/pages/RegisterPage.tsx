import React, { useState } from 'react';
import RegisterForm from '../components/Auth/RegisterForm';
import LanguageToggle from "../components/LanguageToggle";

const RegisterPage: React.FC = () => {
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  return (
    <div className="page-container flex flex-col min-h-screen bg-white mt-8">
      <div className="flex-grow flex items-center flex-col justify-center font-inter">
        <div className="auth-container bg-[#EFEFEF] p-8 rounded-lg shadow w-96">
          <h2 className="text-4xl font-black mb-6 text-center">
            {registrationSuccess ? "Thank you :)" : "회원가입"}
          </h2>
          
          {!registrationSuccess ? (
            <RegisterForm setRegistrationSuccess={setRegistrationSuccess} />
          ) : (
            <div className="text-center bg-white p-4 rounded-lg shadow mt-12 text-lg">
              <p className="">귀하의 요청이 접수되었습니다.</p>
              <p className="mt-0.5 text-[#2320F1]">관리자 승인까지 잠시만 기다려 주세요.</p>
            </div>
          )}
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

export default RegisterPage;
