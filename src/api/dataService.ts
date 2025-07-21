import axios from 'axios';

const API_BASE = 'http://localhost:5162/api/data';

// 사용자
export async function getUsers() {
  return axios.get(`${API_BASE}/users`);
}
export async function getUser(id: string) {
  return axios.get(`${API_BASE}/users/${id}`);
}
export async function searchUsers(name: string) {
  return axios.get(`${API_BASE}/users/search`, { params: { name } });
}

// 견적서
export async function getEstimates() {
  return axios.get(`${API_BASE}/estimates`);
}
export async function getEstimate(id: string) {
  return axios.get(`${API_BASE}/estimates/${id}`);
}
export async function searchEstimates(status: string) {
  return axios.get(`${API_BASE}/estimates/search`, { params: { status } });
}

// 통계
export async function getStats() {
  return axios.get(`${API_BASE}/stats`);
}

export {}; 