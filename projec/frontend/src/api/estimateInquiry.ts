import axios from 'axios';
import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl('ESTIMATE_REQUEST_API');

// 견적 요청 조회 요청 인터페이스
export interface EstimateInquiryRequest {
  searchKeyword?: string;
  startDate?: string;
  endDate?: string;
  status?: number;
  customerID?: string; // 고객 ID (고객 권한일 때 자신의 견적만 조회)
  writerID?: string; // 작성자 ID (자신이 작성한 견적만 조회)
  page?: number;
  pageSize?: number;
  isDescending?: boolean;
}

// 견적 요청 조회 응답 인터페이스
export interface EstimateInquiryResponse {
  items: EstimateInquiryItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// 견적 요청 항목 인터페이스
export interface EstimateInquiryItem {
  estimateNo: string;
  companyName: string;
  contactPerson: string;
  requestDate: string;
  quantity: number;
  statusText: string;
  status: number;
  project: string;
  tempEstimateNo: string;
  writerID: string; // 작성자 ID (수정 권한 확인용)
  managerID?: string; // 담당자 ID
  managerName?: string; // 담당자 이름
  customerRequirement?: string; // 고객 요구사항
  writerName?: string; // 작성자 이름
  writerPosition?: string; // 작성자 직급
  customerName?: string; // 고객 담당자 이름
  customerPosition?: string; // 고객 직급
}

// 견적 요청 조회 API
export const getEstimateInquiry = async (params: EstimateInquiryRequest): Promise<EstimateInquiryResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/estimate/inquiry`, { params });
    return response.data;
  } catch (error) {
    console.error('견적 요청 조회 실패:', error);
    throw error;
  }
};

// 상태 텍스트 매핑
export const getStatusText = (status: number): string => {
  switch (status) {
    case 2: return '견적요청';
    case 3: return '견적처리중';
    case 4: return '견적완료';
    case 5: return '주문';
    default: return '알 수 없음';
  }
};

// 상태 업데이트 API
export const updateEstimateStatus = async (tempEstimateNo: string, status: number): Promise<void> => {
  try {
    await axios.put(`${API_BASE_URL}/estimate/sheets/${tempEstimateNo}/status`, { status });
  } catch (error) {
    console.error('견적 상태 업데이트 실패:', error);
    throw error;
  }
};

// 상태 옵션 목록 (필터용)
export const statusOptions = [
  { value: '', label: '전체' },
  { value: '2', label: '견적요청' },
  { value: '3', label: '견적처리중' },
  { value: '4', label: '견적완료' },
  { value: '5', label: '주문' },
];

// 상태 변경 옵션 목록 (관리자/직원용)
export const statusChangeOptions = [
  { value: 1, label: '임시저장' },
  { value: 2, label: '견적요청' },
  { value: 3, label: '견적처리중' },
  { value: 4, label: '견적완료' },
  { value: 5, label: '주문' },
];
