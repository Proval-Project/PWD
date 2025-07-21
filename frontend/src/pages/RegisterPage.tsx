import React from 'react';
import RegisterForm from '../components/Auth/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="auth-container">
        <h2>회원가입</h2>
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
