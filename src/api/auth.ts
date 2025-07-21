import axios from 'axios';

const API_BASE = 'http://localhost:5236/api/auth';

export async function login(email: string, password: string) {
  return axios.post(`${API_BASE}/login`, { email, password });
}

export async function register(email: string, password: string, name: string) {
  return axios.post(`${API_BASE}/register`, { email, password, name });
}

export async function forgotPassword(email: string) {
  return axios.post(`${API_BASE}/forgot-password`, { email });
}

export async function verifyResetCode(email: string, code: string) {
  return axios.post(`${API_BASE}/verify-reset-code`, { email, code });
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  return axios.post(`${API_BASE}/reset-password`, { email, code, newPassword });
}

export {}; 