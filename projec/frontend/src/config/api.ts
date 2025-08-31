// 중앙화된 서버 설정
const SERVER_IP = '192.168.0.14';
const PORTS = {
  FRONTEND: 3000,
  CLIENT_APP: 5001,
  ESTIMATE_REQUEST: 5135,
  WEB_API: 7001,
  CONVAL_API: 44340,
  AUTH_SERVICE: 5236,
  USER_MANAGEMENT: 5237
};

// API 서버 설정
export const API_CONFIG = {
  // 서버 정보
  SERVER_IP,
  PORTS,
  
  // 백엔드 서비스 URL들
  AUTH_SERVICE: `http://${SERVER_IP}:${PORTS.AUTH_SERVICE}`,
  USER_MANAGEMENT_SERVICE: `http://${SERVER_IP}:${PORTS.USER_MANAGEMENT}`,
  ESTIMATE_REQUEST_SERVICE: `http://${SERVER_IP}:${PORTS.ESTIMATE_REQUEST}`,
  WEB_API_SERVICE: `http://${SERVER_IP}:${PORTS.WEB_API}`,
  CONVAL_API_SERVICE: `http://${SERVER_IP}:${PORTS.CONVAL_API}`,
  
  // API 엔드포인트들
  AUTH_API: `http://${SERVER_IP}:${PORTS.AUTH_SERVICE}/api`,
  USER_MANAGEMENT_API: `http://${SERVER_IP}:${PORTS.USER_MANAGEMENT}/api`,
  ESTIMATE_REQUEST_API: `http://${SERVER_IP}:${PORTS.ESTIMATE_REQUEST}/api`,
  WEB_API: `http://${SERVER_IP}:${PORTS.WEB_API}/api`,
  
  // 프론트엔드 서비스들
  FRONTEND_URL: `http://${SERVER_IP}:${PORTS.FRONTEND}`,
  CLIENT_APP_URL: `http://${SERVER_IP}:${PORTS.CLIENT_APP}`
};

// URL 타입 정의
type ApiServiceKey = 'AUTH_SERVICE' | 'USER_MANAGEMENT_SERVICE' | 'ESTIMATE_REQUEST_SERVICE' | 'WEB_API_SERVICE' | 'CONVAL_API_SERVICE' | 'AUTH_API' | 'USER_MANAGEMENT_API' | 'ESTIMATE_REQUEST_API' | 'WEB_API' | 'FRONTEND_URL' | 'CLIENT_APP_URL';

// 개발 환경과 프로덕션 환경을 구분하여 설정
export const getApiUrl = (service: ApiServiceKey) => {
  if (process.env.NODE_ENV === 'production') {
    // 프로덕션 환경에서는 상대 경로 사용
    return API_CONFIG[service].replace(/^https?:\/\/[^\/]+/, '');
  }
  return API_CONFIG[service];
};

// URL 생성 유틸리티 함수들
export const buildApiUrl = (endpoint: string) => `${API_CONFIG.ESTIMATE_REQUEST_API}${endpoint}`;
export const buildWebApiUrl = (endpoint: string) => `${API_CONFIG.WEB_API}${endpoint}`;
export const buildClientAppUrl = (params: Record<string, string>) => {
  const queryString = new URLSearchParams(params).toString();
  return `${API_CONFIG.CLIENT_APP_URL}?${queryString}`;
};

// 서비스별 URL 가져오기
export const getEstimateApiUrl = () => API_CONFIG.ESTIMATE_REQUEST_API;
export const getWebApiUrl = () => API_CONFIG.WEB_API;
export const getClientAppUrl = () => API_CONFIG.CLIENT_APP_URL;
export const getFrontendUrl = () => API_CONFIG.FRONTEND_URL;

// 환경별 설정
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production'; 