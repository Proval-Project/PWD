// API URL 설정
export const API_CONFIG = {
  AUTH_API_URL: process.env.REACT_APP_AUTH_API_URL || 'http://localhost:5236/api',
  USER_MANAGEMENT_API_URL: process.env.REACT_APP_USER_MANAGEMENT_API_URL || 'http://localhost:5237/api',
  ESTIMATE_REQUEST_API_URL: process.env.REACT_APP_ESTIMATE_REQUEST_API_URL || 'http://localhost:5135/api',
}; 