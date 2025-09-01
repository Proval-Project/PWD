// ì¤‘ì•™?”ëœ ?œë²„ ?¤ì •
const SERVER_IP = '192.168.0.59';
const PORTS = {
  FRONTEND: 3000,
  CLIENT_APP: 5001,
  ESTIMATE_REQUEST: 5135,
  WEB_API: 7001,
  CONVAL_API: 44340,
  AUTH_SERVICE: 5236,
  USER_MANAGEMENT: 5237
};

// API ?œë²„ ?¤ì •
export const API_CONFIG = {
  // ?œë²„ ?•ë³´
  SERVER_IP,
  PORTS,
  
  // ë°±ì—”???œë¹„??URL??
  AUTH_SERVICE: `http://${SERVER_IP}:${PORTS.AUTH_SERVICE}`,
  USER_MANAGEMENT_SERVICE: `http://${SERVER_IP}:${PORTS.USER_MANAGEMENT}`,
  ESTIMATE_REQUEST_SERVICE: `http://${SERVER_IP}:${PORTS.ESTIMATE_REQUEST}`,
  WEB_API_SERVICE: `http://${SERVER_IP}:${PORTS.WEB_API}`,
  CONVAL_API_SERVICE: `http://${SERVER_IP}:${PORTS.CONVAL_API}`,
  
  // API ?”ë“œ?¬ì¸?¸ë“¤
  AUTH_API: `http://${SERVER_IP}:${PORTS.AUTH_SERVICE}/api`,
  USER_MANAGEMENT_API: `http://${SERVER_IP}:${PORTS.USER_MANAGEMENT}/api`,
  ESTIMATE_REQUEST_API: `http://${SERVER_IP}:${PORTS.ESTIMATE_REQUEST}/api`,
  WEB_API: `http://${SERVER_IP}:${PORTS.WEB_API}/api`,
  
  // ?„ë¡ ?¸ì—”???œë¹„?¤ë“¤
  FRONTEND_URL: `http://${SERVER_IP}:${PORTS.FRONTEND}`,
  CLIENT_APP_URL: `http://${SERVER_IP}:${PORTS.CLIENT_APP}`
};

// URL ?€???•ì˜
type ApiServiceKey = 'AUTH_SERVICE' | 'USER_MANAGEMENT_SERVICE' | 'ESTIMATE_REQUEST_SERVICE' | 'WEB_API_SERVICE' | 'CONVAL_API_SERVICE' | 'AUTH_API' | 'USER_MANAGEMENT_API' | 'ESTIMATE_REQUEST_API' | 'WEB_API' | 'FRONTEND_URL' | 'CLIENT_APP_URL';

// ê°œë°œ ?˜ê²½ê³??„ë¡œ?•ì…˜ ?˜ê²½??êµ¬ë¶„?˜ì—¬ ?¤ì •
export const getApiUrl = (service: ApiServiceKey) => {
  if (process.env.NODE_ENV === 'production') {
    // ?„ë¡œ?•ì…˜ ?˜ê²½?ì„œ???ë? ê²½ë¡œ ?¬ìš©
    return API_CONFIG[service].replace(/^https?:\/\/[^\/]+/, '');
  }
  return API_CONFIG[service];
};

// URL ?ì„± ? í‹¸ë¦¬í‹° ?¨ìˆ˜??
export const buildApiUrl = (endpoint: string) => `${API_CONFIG.ESTIMATE_REQUEST_API}${endpoint}`;
export const buildWebApiUrl = (endpoint: string) => `${API_CONFIG.WEB_API}${endpoint}`;
export const buildClientAppUrl = (params: Record<string, string>) => {
  const queryString = new URLSearchParams(params).toString();
  return `${API_CONFIG.CLIENT_APP_URL}?${queryString}`;
};

// ?œë¹„?¤ë³„ URL ê°€?¸ì˜¤ê¸?
export const getEstimateApiUrl = () => API_CONFIG.ESTIMATE_REQUEST_API;
export const getWebApiUrl = () => API_CONFIG.WEB_API;
export const getClientAppUrl = () => API_CONFIG.CLIENT_APP_URL;
export const getFrontendUrl = () => API_CONFIG.FRONTEND_URL;

// ?˜ê²½ë³??¤ì •
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production'; 