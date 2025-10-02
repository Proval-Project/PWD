import React, { useState } from 'react';
import { register } from '../../api/auth';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Toast } from '../common/Toast';

const roleMap: Record<string, number> = {
  Admin: 1,
  Sales: 2,
  Customer: 3,
};

interface RegisterFormProps {
  setRegistrationSuccess: React.Dispatch<React.SetStateAction<boolean>>; 
}

const RegisterForm: React.FC<RegisterFormProps> = ({ setRegistrationSuccess }) => {
  const [step, setStep] = useState(1);

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const isUserIDValid = /^[a-z0-9]{3,10}$/.test(formData.userID);

  const validatePassword = (pw: string) => {
    if (pw.length < 8 || pw.length > 20) return false;
    let types = 0;
    if (/[a-z]/.test(pw)) types++;
    if (/[A-Z]/.test(pw)) types++;
    if (/[0-9]/.test(pw)) types++;
    return types >= 2;
  };
  const isPasswordValid = validatePassword(formData.password);
  const isStep1Ready =
    !!formData.userID &&
    !!formData.email &&
    !!formData.password &&
    !!formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    isUserIDValid &&
    isPasswordValid;

  const isStep2Ready =
    !!formData.name &&
    !!formData.phoneNumber &&
    !!formData.department &&
    !!formData.position;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.userID || !formData.email || !formData.password || !formData.confirmPassword) {
        setToast({ message: '아이디, 이메일, 비밀번호를 모두 입력해주세요.', type: 'error' });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setToast({ message: '비밀번호가 일치하지 않습니다.', type: 'error' });
        return;
      }
      if (!isUserIDValid || !isPasswordValid) {
        setToast({ message: '아이디/비밀번호 조건을 충족하지 않았습니다.', type: 'error' });
        return;
      }
    }

    if (step === 2) {
      if (!formData.name || !formData.phoneNumber || !formData.department || !formData.position) {
        setToast({ message: '담당자 정보를 모두 입력해주세요.', type: 'error' });
        return;
      }
    }

    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

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
      await register(payload);
      setRegistrationSuccess(true);
      setFormData({
        userID: '', email: '', password: '', confirmPassword: '', role: 'Customer',
        companyName: '', businessNumber: '', address: '', companyPhone: '',
        department: '', position: '', phoneNumber: '', name: '',
      });
      setStep(1);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || '회원가입에 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {toast && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">

        {step === 1 && (
          <>
            <div className="mb-4">
              <div className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12">
                <span className="text-gray-400 w-20 text-sm font-semibold">아이디</span>
                <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
                <input
                  type="text"
                  id="userID"
                  name="userID"
                  value={formData.userID}
                  onChange={handleChange}
                  className="flex-1 outline-none text-sm pl-2"
                />
              </div>
              <div className={`text-xs mt-1 ${isUserIDValid ? 'text-black' : 'text-red-500'}`}>
                <p>◦ 로그인에 사용되는 아이디</p>
                <p>◦ 소문자와 숫자로만 3~10자 입력</p>
              </div>
            </div>

            <div className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12 mb-4">
              <span className="text-gray-400 w-20 text-sm font-semibold">이메일</span>
              <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="flex-1 outline-none text-sm pl-2"
              />
            </div>

            <div className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12 relative">
              <span className="text-gray-400 w-20 text-sm font-semibold">비밀번호</span>
              <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="flex-1 outline-none text-sm pl-2 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <div className={`text-xs mb-2 mt-1 ${isPasswordValid ? 'text-black' : 'text-red-500'}`}>
              <p>◦ 8-20 문자</p>
              <p>◦ 대문자, 소문자, 숫자 중 2가지 포함 필수</p>
            </div>

            <div className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12 relative mb-1">
              <span className="text-gray-400 w-20 text-sm font-semibold">재입력</span>
              <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="flex-1 outline-none text-sm pl-2 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-500 mb-4">비밀번호가 일치하지 않습니다.</p>
            )}

            <div className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12 mt-4 mb-6">
              <span className="text-gray-400 w-20 text-sm font-semibold">역할</span>
              <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="flex-1 outline-none text-sm pl-2 bg-transparent"
              >
                <option value="Customer">고객</option>
                <option value="Sales">영업</option>
                <option value="Admin">관리자</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={!isStep1Ready}
              className={`w-full h-12 rounded-lg font-semibold text-lg transition ${
                isStep1Ready
                  ? 'bg-[#2320F1] text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-white cursor-not-allowed'
              }`}
            >
              다음 단계
            </button>
          </>
        )}

        {/* 2단계: 담당자 정보 */}
        {step === 2 && (
          <>
            {[
              { id: 'name', label: '담당자 성함', type: 'text' },
              { id: 'phoneNumber', label: '담당자 연락처', type: 'tel' },
              { id: 'department', label: '부서', type: 'text' },
              { id: 'position', label: '직책', type: 'text' },
            ].map((field) => (
              <div key={field.id} className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12 mb-4">
                <span className="text-gray-400 w-28 text-sm font-semibold">{field.label}</span>
                <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
                <input
                  type={field.type}
                  id={field.id}
                  name={field.id}
                  value={(formData as any)[field.id]}
                  onChange={handleChange}
                  className="flex-1 outline-none text-sm pl-2"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={handleNext}
              disabled={!isStep2Ready}
              className={`w-full h-12 rounded-lg font-semibold text-lg transition ${
                isStep2Ready
                  ? 'bg-[#2320F1] text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-white cursor-not-allowed'
              }`}
            >
              다음 단계
            </button>
          </>
        )}

        {/* 3단계: 회사 정보 */}
        {step === 3 && (
          <>
            {[
              { id: 'companyName', label: '회사명', type: 'text' },
              { id: 'businessNumber', label: '사업자번호', type: 'text' },
              { id: 'address', label: '회사 주소', type: 'text' },
              { id: 'companyPhone', label: '회사 연락처', type: 'tel' },
            ].map((field) => (
              <div key={field.id} className="flex items-center border border-[#989898] rounded-lg bg-white px-3 h-12 mb-4">
                <span className="text-gray-400 w-28 text-sm font-semibold">{field.label}</span>
                <span className="text-gray-400 ml-2 text-sm font-semibold">|</span>
                <input
                  type={field.type}
                  id={field.id}
                  name={field.id}
                  value={(formData as any)[field.id]}
                  onChange={handleChange}
                  className="flex-1 outline-none text-sm pl-2"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading || !formData.companyName || !formData.businessNumber || !formData.address || !formData.companyPhone}
              className={`w-full h-12 rounded-lg font-semibold text-lg transition ${
                loading || !formData.companyName || !formData.businessNumber || !formData.address || !formData.companyPhone
                  ? 'bg-gray-300 text-white cursor-not-allowed'
                  : 'bg-[#2320F1] text-white hover:bg-blue-700'
              }`}
            >
              {loading ? '회원가입 중...' : '회원가입'}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default RegisterForm;
