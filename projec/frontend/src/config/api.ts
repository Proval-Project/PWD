// API 서버 설정
export const API_CONFIG = {
  // 백엔드 서비스 URL들
  AUTH_SERVICE: 'http://192.168.0.14:5236',
  USER_MANAGEMENT_SERVICE: 'http://192.168.0.14:5237',
  ESTIMATE_REQUEST_SERVICE: 'http://192.168.0.14:5135',
  WEB_API_SERVICE: 'https://192.168.0.14:7001',
  
  // API 엔드포인트들
  AUTH_API: 'http://192.168.0.14:5236/api',
  USER_MANAGEMENT_API: 'http://192.168.0.14:5237/api',
  ESTIMATE_REQUEST_API: 'http://192.168.0.14:5135/api',
  WEB_API: 'https://192.168.0.14:7001/api',
};

// 개발 환경과 프로덕션 환경을 구분하여 설정
export const getApiUrl = (service: keyof typeof API_CONFIG) => {
  if (process.env.NODE_ENV === 'production') {
    // 프로덕션 환경에서는 상대 경로 사용
    return API_CONFIG[service].replace(/^https?:\/\/[^\/]+/, '');
  }
  return API_CONFIG[service];
}; 