import axios from 'axios';
import { getApiUrl } from '../config/api';

const USER_MANAGEMENT_API_BASE_URL = getApiUrl('USER_MANAGEMENT_API');

// 데이터 타입 정의
export interface UserResponseDto {
  userID: string;
  email: string;
  roleID: number;
  companyName: string;
  businessNumber: string;
  address: string;
  companyPhone: string;
  department: string;
  position: string;
  phoneNumber: string;
  name: string;
  isApproved: boolean;
}

export interface UserListResponseDto {
  userID: string;
  email: string;
  roleID: number;
  companyName: string;
  businessNumber: string;
  address: string;
  companyPhone: string;
  department: string;
  position: string;
  phoneNumber: string;
  name: string;
  isApproved: boolean;
  roleName: string;
}

export interface CreateUserDto {
  userID: string;
  email: string;
  password: string;
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

export interface UpdateUserDto {
  email?: string;
  companyName?: string;
  businessNumber?: string;
  address?: string;
  companyPhone?: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  name?: string;
}

// 고객 관리 API
export const getCustomers = async (): Promise<UserListResponseDto[]> => {
  const response = await axios.get(`${USER_MANAGEMENT_API_BASE_URL}/customer`);
  return response.data;
};

export const getCustomerById = async (userID: string): Promise<UserResponseDto> => {
  const response = await axios.get(`${USER_MANAGEMENT_API_BASE_URL}/customer/${userID}`);
  return response.data;
};

export const createCustomer = async (customerData: CreateUserDto): Promise<UserResponseDto> => {
  const response = await axios.post(`${USER_MANAGEMENT_API_BASE_URL}/customer`, customerData);
  return response.data;
};

export const updateCustomer = async (userID: string, customerData: UpdateUserDto): Promise<UserResponseDto> => {
  const response = await axios.put(`${USER_MANAGEMENT_API_BASE_URL}/customer/${userID}`, customerData);
  return response.data;
};

export const deleteCustomer = async (userID: string): Promise<void> => {
  await axios.delete(`${USER_MANAGEMENT_API_BASE_URL}/customer/${userID}`);
};

export const activateCustomer = async (userID: string): Promise<void> => {
  await axios.patch(`${USER_MANAGEMENT_API_BASE_URL}/customer/${userID}/activate`);
};

export const deactivateCustomer = async (userID: string): Promise<void> => {
  await axios.patch(`${USER_MANAGEMENT_API_BASE_URL}/customer/${userID}/deactivate`);
};

export const searchCustomers = async (term: string): Promise<UserListResponseDto[]> => {
  const response = await axios.get(`${USER_MANAGEMENT_API_BASE_URL}/customer/search?term=${encodeURIComponent(term)}`);
  return response.data;
};

// 담당자 관리 API
export const getStaff = async (): Promise<UserListResponseDto[]> => {
  const response = await axios.get(`${USER_MANAGEMENT_API_BASE_URL}/staff`);
  return response.data;
};

export const getStaffById = async (userID: string): Promise<UserResponseDto> => {
  const response = await axios.get(`${USER_MANAGEMENT_API_BASE_URL}/staff/${userID}`);
  return response.data;
};

export const createStaff = async (staffData: CreateUserDto): Promise<UserResponseDto> => {
  const response = await axios.post(`${USER_MANAGEMENT_API_BASE_URL}/staff`, staffData);
  return response.data;
};

export const updateStaff = async (userID: string, staffData: UpdateUserDto): Promise<UserResponseDto> => {
  const response = await axios.put(`${USER_MANAGEMENT_API_BASE_URL}/staff/${userID}`, staffData);
  return response.data;
};

export const deleteStaff = async (userID: string): Promise<void> => {
  await axios.delete(`${USER_MANAGEMENT_API_BASE_URL}/staff/${userID}`);
};

export const activateStaff = async (userID: string): Promise<void> => {
  await axios.patch(`${USER_MANAGEMENT_API_BASE_URL}/staff/${userID}/activate`);
};

export const deactivateStaff = async (userID: string): Promise<void> => {
  await axios.patch(`${USER_MANAGEMENT_API_BASE_URL}/staff/${userID}/deactivate`);
};

export const searchStaff = async (term: string): Promise<UserListResponseDto[]> => {
  const response = await axios.get(`${USER_MANAGEMENT_API_BASE_URL}/staff/search?term=${encodeURIComponent(term)}`);
  return response.data;
};

// 회원가입 요청 관리 API
export const getPendingApprovals = async (): Promise<UserListResponseDto[]> => {
  const response = await axios.get(`${USER_MANAGEMENT_API_BASE_URL}/user/pending-approvals`);
  return response.data;
};

export const approveUser = async (userID: string): Promise<void> => {
  await axios.patch(`${USER_MANAGEMENT_API_BASE_URL}/user/${userID}/approve`);
};

export const rejectUser = async (userID: string): Promise<void> => {
  await axios.delete(`${USER_MANAGEMENT_API_BASE_URL}/user/${userID}`);
};

// 사용자 검색 (회사명, 이름, 이메일로 검색)
export const searchUsers = async (searchTerm: string): Promise<UserListResponseDto[]> => {
  const response = await axios.get(`${USER_MANAGEMENT_API_BASE_URL}/user/search?term=${encodeURIComponent(searchTerm)}`);
  return response.data;
}; 