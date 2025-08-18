import React from 'react';
import ResetPasswordForm from '../components/Auth/ResetPasswordForm';

const ResetPasswordPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="auth-container">
        <h2>비밀번호 재설정</h2>
        <ResetPasswordForm />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
