import React from 'react';
import ForgotPasswordForm from '../components/Auth/ForgotPasswordForm';

const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="auth-container">
        <h2>비밀번호 찾기</h2>
        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
