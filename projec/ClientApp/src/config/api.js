// ClientApp 중앙?�된 API ?�정
const SERVER_IP = 'localhost';
const PORTS = {
  CLIENT_APP: 5001,
  WEB_API: 7001,
  CONVAL_SERVICE: 44340
};

const API_CONFIG = {
  SERVER_IP,
  PORTS,
  CLIENT_APP_URL: `http://${SERVER_IP}:${PORTS.CLIENT_APP}`,
  WEB_API_SERVICE: `http://${SERVER_IP}:${PORTS.WEB_API}`,
  CONVAL_API_SERVICE: `http://${SERVER_IP}:${PORTS.CONVAL_SERVICE}`,
  WEB_API: `http://${SERVER_IP}:${PORTS.WEB_API}/api`,
  CONVAL_API: `http://${SERVER_IP}:${PORTS.CONVAL_SERVICE}/api`
};

// ?�틸리티 ?�수??
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.WEB_API}${endpoint}`;
};

export const buildConvalApiUrl = (endpoint) => {
  return `${API_CONFIG.CONVAL_API}${endpoint}`;
};

export const getWebApiUrl = () => API_CONFIG.WEB_API_SERVICE;
export const getConvalApiUrl = () => API_CONFIG.CONVAL_API_SERVICE;
export const getClientAppUrl = () => API_CONFIG.CLIENT_APP_URL;

export default API_CONFIG;
