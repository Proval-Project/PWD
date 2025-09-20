import React, { useState } from 'react';
import { register } from '../../api/auth';

const roleMap: Record<string, number> = {
  Admin: 1,
  Sales: 2,
  Customer: 3
};

interface RegisterFormProps {
  setRegistrationSuccess: (success: boolean) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ setRegistrationSuccess }) => {
  const [formData, setFormData] = useState({
    userID: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Customer',
    companyName: '',
    businessNumber: '',
    address: '',
    companyPhone: '',
    department: '',
    position: '',
    phoneNumber: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        userID: formData.userID,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        roleID: roleMap[formData.role],
        companyName: formData.companyName,
        businessNumber: formData.businessNumber,
        address: formData.address,
        companyPhone: formData.companyPhone,
        department: formData.department,
        position: formData.position,
        phoneNumber: formData.phoneNumber,
        name: formData.name,
      };
      const response = await register(payload);
      setSuccess('회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.');
      setRegistrationSuccess(true);
      setFormData({
        userID: '', email: '', password: '', confirmPassword: '', role: 'Customer',
        companyName: '', businessNumber: '', address: '', companyPhone: '',
        department: '', position: '', phoneNumber: '', name: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="form-group">
        <label htmlFor="userID">아이디</label>
        <input type="text" id="userID" name="userID" value={formData.userID} onChange={handleChange} required className="form-input" />
      </div>
      <div className="form-group">
        <label htmlFor="email">이메일</label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" />
      </div>
      <div className="form-group">
        <label htmlFor="password">비밀번호</label>
        <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required className="form-input" />
      </div>
      <div className="form-group">
        <label htmlFor="confirmPassword">비밀번호 확인</label>
        <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="form-input" />
      </div>
      <div className="form-group">
        <label htmlFor="role">역할</label>
        <select id="role" name="role" value={formData.role} onChange={handleChange} className="form-input">
          <option value="Customer">고객</option>
          <option value="Sales">영업</option>
          <option value="Admin">관리자</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="name">이름(담당자)</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="form-input" />
      </div>
      <div className="form-group">
        <label htmlFor="phoneNumber">담당자 전화번호</label>
        <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="form-input" />
      </div>
      <div className="form-group">
        <label htmlFor="department">부서</label>
        <input type="text" id="department" name="department" value={formData.department} onChange={handleChange} required className="form-input" />
      </div>
      <div className="form-group">
        <label htmlFor="position">직책</label>
        <input type="text" id="position" name="position" value={formData.position} onChange={handleChange} required className="form-input" />
      </div>
      <div className="form-group">
        <label htmlFor="companyName">회사명</label>
        <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required className="form-input" />
      </div>
      <div className="form-group">
        <label htmlFor="businessNumber">사업자번호</label>
        <input type="text" id="businessNumber" name="businessNumber" value={formData.businessNumber} onChange={handleChange} required className="form-input" />
      </div>
      <div className="form-group">
        <label htmlFor="address">회사 주소</label>
        <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required className="form-input" />
      </div>
      <div className="form-group">
        <label htmlFor="companyPhone">회사 전화번호</label>
        <input type="tel" id="companyPhone" name="companyPhone" value={formData.companyPhone} onChange={handleChange} required className="form-input" />
      </div>
      <button type="submit" disabled={loading} className="submit-button">
        {loading ? '회원가입 중...' : '회원가입'}
      </button>
    </form>
  );
};

export default RegisterForm;
