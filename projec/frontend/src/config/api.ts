// 중앙?�된 ?�버 ?�정
const SERVER_IP = 'localhost';
const PORTS = {
  FRONTEND: 3000,
  CLIENT_APP: 5001,
  ESTIMATE_REQUEST: 5135,
  WEB_API: 7001,
  CONVAL_API: 44340,
  AUTH_SERVICE: 5236,
  USER_MANAGEMENT: 5237
};

// API ?�버 ?�정
export const API_CONFIG = {
  // ?�버 ?�보
  SERVER_IP,
  PORTS,
  
  // 백엔???�비??URL??
  AUTH_SERVICE: `http://${SERVER_IP}:${PORTS.AUTH_SERVICE}`,
  USER_MANAGEMENT_SERVICE: `http://${SERVER_IP}:${PORTS.USER_MANAGEMENT}`,
  ESTIMATE_REQUEST_SERVICE: `http://${SERVER_IP}:${PORTS.ESTIMATE_REQUEST}`,
  WEB_API_SERVICE: `http://${SERVER_IP}:${PORTS.WEB_API}`,
  CONVAL_API_SERVICE: `http://${SERVER_IP}:${PORTS.CONVAL_API}`,
  
  // API ?�드?�인?�들
  AUTH_API: `http://${SERVER_IP}:${PORTS.AUTH_SERVICE}/api`,
  USER_MANAGEMENT_API: `http://${SERVER_IP}:${PORTS.USER_MANAGEMENT}/api`,
  ESTIMATE_REQUEST_API: `http://${SERVER_IP}:${PORTS.ESTIMATE_REQUEST}/api`,
  WEB_API: `http://${SERVER_IP}:${PORTS.WEB_API}/api`,
  
  // ?�론?�엔???�비?�들
  FRONTEND_URL: `http://${SERVER_IP}:${PORTS.FRONTEND}`,
  CLIENT_APP_URL: `http://${SERVER_IP}:${PORTS.CLIENT_APP}`
};

// URL ?�???�의
type ApiServiceKey = 'AUTH_SERVICE' | 'USER_MANAGEMENT_SERVICE' | 'ESTIMATE_REQUEST_SERVICE' | 'WEB_API_SERVICE' | 'CONVAL_API_SERVICE' | 'AUTH_API' | 'USER_MANAGEMENT_API' | 'ESTIMATE_REQUEST_API' | 'WEB_API' | 'FRONTEND_URL' | 'CLIENT_APP_URL';

// 개발 ?�경�??�로?�션 ?�경??구분?�여 ?�정
export const getApiUrl = (service: ApiServiceKey) => {
  if (process.env.NODE_ENV === 'production') {
    // ?�로?�션 ?�경?�서???��? 경로 ?�용
    return API_CONFIG[service].replace(/^https?:\/\/[^\/]+/, '');
  }
  return API_CONFIG[service];
};

// URL ?�성 ?�틸리티 ?�수??
export const buildApiUrl = (endpoint: string) => `${API_CONFIG.ESTIMATE_REQUEST_API}${endpoint}`;
export const buildWebApiUrl = (endpoint: string) => `${API_CONFIG.WEB_API}${endpoint}`;
export const buildClientAppUrl = (params: Record<string, string>) => {
  const queryString = new URLSearchParams(params).toString();
  return `${API_CONFIG.CLIENT_APP_URL}?${queryString}`;
};

// ?�비?�별 URL 가?�오�?
export const getEstimateApiUrl = () => API_CONFIG.ESTIMATE_REQUEST_API;
export const getWebApiUrl = () => API_CONFIG.WEB_API;
export const getClientAppUrl = () => API_CONFIG.CLIENT_APP_URL;
export const getFrontendUrl = () => API_CONFIG.FRONTEND_URL;

// ?�경�??�정
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production'; 