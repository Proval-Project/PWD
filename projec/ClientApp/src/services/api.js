import axios from 'axios';
import { buildApiUrl, buildConvalApiUrl } from '../config/api';

const api = axios.create({
  baseURL: buildApiUrl(''),
  timeout: 30000,
});

// 개발 환경에서 HTTPS 인증서 검증 비활성화
if (process.env.NODE_ENV === 'development') {
  // 브라우저에서 HTTPS 인증서 경고를 무시하기 위한 설정
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// 고객 데이터 조회
export const fetchCustomerData = async (estimateNo, sheetId = 1) => {
  try {
    const response = await api.get(`/conval/customer-data/${estimateNo}/${sheetId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '고객 데이터 조회 실패');
  }
};

// CONVAL 데이터 조회
export const fetchConvalData = async (estimateNo, sheetId) => {
  try {
    const response = await api.get(`/conval/conval-data/${estimateNo}/${sheetId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'CONVAL 데이터 조회 실패');
  }
};

// CONVAL 재계산
export const recalculateConval = async (estimateNo, sheetId, convalData) => {
  try {
    const response = await api.post('/conval/recalculate', {
      estimateNo,
      sheetId,
      convalData
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'CONVAL 재계산 실패');
  }
};

// CONVAL 재호출
export const retryConval = async (params) => {
  const url = buildConvalApiUrl('/conval/retry');
  try {
    console.log('[API] retryConval request', { url, params });
    console.log('[API] retryConval request body (JSON):', JSON.stringify(params, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(params)
    });
    
    console.log('[API] retryConval response status:', response.status);
    console.log('[API] retryConval response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] retryConval error response body:', errorText);
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[API] retryConval success', data);
    return data;
  } catch (error) {
    console.error('[API] retryConval error', error);
    throw new Error('CONVAL 재호출 실패: ' + (error?.message || String(error)));
  }
};

// 데이터베이스 연결 테스트
export const testDatabaseConnection = async () => {
  try {
    const response = await api.get('/conval/test-connection');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '데이터베이스 연결 테스트 실패');
  }
};

// 파일 상태 확인
export const getFileStatus = async (estimateNo) => {
  try {
    const response = await api.get(`/conval/files/status/${estimateNo}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '파일 상태 확인 실패');
  }
};

// PDF 파일 다운로드
export const downloadPdf = async (estimateNo) => {
  try {
    const response = await api.get(`/conval/download/pdf/${estimateNo}`, {
      responseType: 'blob'
    });
    
    // 파일 다운로드 처리
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${estimateNo}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    throw new Error(error.response?.data?.error || 'PDF 파일 다운로드 실패');
  }
};

// CCV 파일 다운로드
export const downloadCcv = async (estimateNo) => {
  try {
    const response = await api.get(`/conval/download/ccv/${estimateNo}`, {
      responseType: 'blob'
    });
    
    // 파일 다운로드 처리
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${estimateNo}.ccv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    throw new Error(error.response?.data?.error || 'CCV 파일 다운로드 실패');
  }
};

// 큐 상태 확인
export const getQueueStatus = async () => {
  const url = buildConvalApiUrl('/conval/status');
  try {
    console.log('[API] getQueueStatus request', { url });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json'
      }
    });
    
    console.log('[API] getQueueStatus response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] getQueueStatus error response body:', errorText);
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[API] getQueueStatus success', data);
    return data;
  } catch (error) {
    console.error('[API] getQueueStatus error', error);
    throw new Error('큐 상태 확인 실패: ' + (error?.message || String(error)));
  }
}; 