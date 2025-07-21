import React from 'react';
import LoginForm from '../components/Auth/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="auth-container">
        <h2>로그인</h2>
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
