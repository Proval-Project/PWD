import axios from 'axios';

const AUTH_API_BASE_URL = 'http://localhost:5236/api';

// 로그인
export const login = async (userID: string, password: string) => {
  const response = await axios.post(`${AUTH_API_BASE_URL}/auth/login`, {
    userID,
    password
  });
  return response.data;
};

// 회원가입 (RegisterRequest DTO에 맞게 타입 수정)
export interface RegisterRequest {
  userID: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleID: number;
  companyName: string;
  businessNumber: string;
  address: string;
  companyPhone: string;
  department: string;
  position: string;
  phoneNumber: string;
  name: string;
}

export const register = async (userData: RegisterRequest) => {
  const response = await axios.post(`${AUTH_API_BASE_URL}/auth/register`, userData);
  return response.data;
};

// 아이디 찾기
export const findId = async (email: string) => {
  const response = await axios.post(`${AUTH_API_BASE_URL}/auth/find-id`, {
    email
  });
  return response.data;
};

// 비밀번호 찾기
export const forgotPassword = async (email: string) => {
  const response = await axios.post(`${AUTH_API_BASE_URL}/auth/forgot-password`, {
    email
  });
  return response.data;
};

// 비밀번호 재설정
export const resetPassword = async (token: string, newPassword: string) => {
  const response = await axios.post(`${AUTH_API_BASE_URL}/auth/reset-password`, {
    token,
    newPassword
  });
  return response.data;
};

// 로그아웃
export const logout = async () => {
  const response = await axios.post(`${AUTH_API_BASE_URL}/auth/logout`);
  return response.data;
};
