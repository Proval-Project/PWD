import axios from 'axios';
import { getApiUrl } from '../config/api';

const ESTIMATE_API_BASE_URL = getApiUrl('ESTIMATE_REQUEST_API');

// DTO 인터페이스들
export interface CreateEstimateSheetDto {
  project?: string;
  customerRequirement?: string;
  customerID: string;
  writerID: string;
}

export interface UpdateEstimateSheetDto {
  project?: string;
  customerRequirement?: string;
  status: number;
}

export interface EstimateSheetResponseDto {
  tempEstimateNo: string;
  curEstimateNo?: string;
  prevEstimateNo?: string;
  customerID?: string;
  writerID?: string;
  managerID?: string;
  status: number;
  project?: string;
  customerRequirement?: string;
  staffComment?: string;
  customerName?: string;
  writerName?: string;
  estimateRequests: EstimateRequestResponseDto[];
  attachments: EstimateAttachmentResponseDto[];
}

export interface EstimateSheetListResponseDto {
  tempEstimateNo: string;
  project?: string;
  status: number;
  customerName?: string;
  writerName?: string;
  requestCount: number;
  createdDate?: string;
}

export interface CreateEstimateRequestDto {
  tagno: string;
  qty: number;
  medium?: string;
  fluid?: string;
  isQM?: boolean;
  flowRateUnit?: string;
  flowRateMaxQ?: number;
  flowRateNorQ?: number;
  flowRateMinQ?: number;
  isP2?: boolean;
  pressureUnit?: string;
  inletPressureMaxQ?: number;
  inletPressureNorQ?: number;
  inletPressureMinQ?: number;
  outletPressureMaxQ?: number;
  outletPressureNorQ?: number;
  outletPressureMinQ?: number;
  differentialPressureMaxQ?: number;
  differentialPressureNorQ?: number;
  differentialPressureMinQ?: number;
  temperatureUnit?: string;
  inletTemperatureQ?: number;
  inletTemperatureNorQ?: number;
  inletTemperatureMinQ?: number;
  densityUnit?: string;
  density?: number;
  molecularWeightUnit?: string;
  molecularWeight?: number;
  bodySizeUnit?: string;
  bodySize?: string;
  bodyMat?: string;
  trimMat?: string;
  trimOption?: string;
  bodyRatingUnit?: string;
  bodyRating?: string;
  actType?: string;
  isHW?: boolean;
  isPositioner?: boolean;
  positionerType?: string;
  explosionProof?: string;
  transmitterType?: string;
  isSolenoid?: boolean;
  isLimSwitch?: boolean;
  isAirSet?: boolean;
  isVolumeBooster?: boolean;
  isAirOperated?: boolean;
  isLockUp?: boolean;
  isSnapActingRelay?: boolean;
}

export interface EstimateRequestResponseDto extends CreateEstimateRequestDto {
  tempEstimateNo: string;
  sheetID: number;
  sheetNo: number;
  estimateNo?: string;
  valveType?: string;
  project?: string;
  unitPrice?: number;
}

export interface EstimateRequestListResponseDto {
  tempEstimateNo: string;
  sheetID: number;
  sheetNo: number;
  tagno: string;
  qty: number;
  medium?: string;
  fluid?: string;
  valveType?: string;
}

export interface EstimateAttachmentResponseDto {
  attachmentID: number;
  tempEstimateNo: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  uploadDate: string;
  uploadUserID?: string;
  uploadUserName?: string;
}

// EstimateSheet API 함수들
export const createEstimateSheet = async (data: CreateEstimateSheetDto): Promise<string> => {
  const response = await axios.post(`${ESTIMATE_API_BASE_URL}/estimate/sheets`, data);
  return response.data;
};

// 기존 견적에서 새로운 견적 생성 (재문의)
export const createEstimateSheetFromExisting = async (
  data: CreateEstimateSheetDto,
  currentUserId: string,
  existingEstimateNo: string
): Promise<string> => {
  const response = await axios.post(
    `${ESTIMATE_API_BASE_URL}/estimate/sheets/reinquiry`,
    data,
    { params: { currentUserId, existingEstimateNo } }
  );
  return response.data;
};

export const getEstimateSheet = async (tempEstimateNo: string): Promise<EstimateSheetResponseDto> => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}`);
  return response.data;
};

export const getEstimateSheetsByStatus = async (status: number): Promise<EstimateSheetListResponseDto[]> => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/sheets/status/${status}`);
  return response.data;
};

export const getEstimateSheetsByUser = async (userID: string): Promise<EstimateSheetListResponseDto[]> => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/sheets/user/${userID}`);
  return response.data;
};

export const updateEstimateSheet = async (tempEstimateNo: string, data: UpdateEstimateSheetDto): Promise<void> => {
  await axios.put(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}`, data);
};

export const deleteEstimateSheet = async (tempEstimateNo: string): Promise<void> => {
  await axios.delete(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}`);
};

// EstimateRequest API 함수들
export const createEstimateRequest = async (tempEstimateNo: string, data: CreateEstimateRequestDto): Promise<EstimateRequestResponseDto> => {
  const response = await axios.post(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}/requests`, data);
  return response.data;
};

export const getEstimateRequest = async (tempEstimateNo: string, sheetID: number): Promise<EstimateRequestResponseDto> => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}/requests/${sheetID}`);
  return response.data;
};

export const getEstimateRequests = async (tempEstimateNo: string): Promise<EstimateRequestListResponseDto[]> => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}/requests`);
  return response.data;
};

export const updateEstimateRequest = async (tempEstimateNo: string, sheetID: number, data: CreateEstimateRequestDto): Promise<void> => {
  await axios.put(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}/requests/${sheetID}`, data);
};

export const deleteEstimateRequest = async (tempEstimateNo: string, sheetID: number): Promise<void> => {
  await axios.delete(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}/requests/${sheetID}`);
};

export const updateEstimateRequestOrder = async (tempEstimateNo: string, sheetIDs: number[]): Promise<void> => {
  await axios.put(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}/requests/order`, sheetIDs);
};

// Attachment API 함수들
export const uploadAttachment = async (tempEstimateNo: string, file: File, uploadUserID: string): Promise<EstimateAttachmentResponseDto> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(
    `${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}/attachments?uploadUserID=${uploadUserID}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const getAttachments = async (tempEstimateNo: string): Promise<EstimateAttachmentResponseDto[]> => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}/attachments`);
  return response.data;
};

export const deleteAttachment = async (attachmentID: number): Promise<void> => {
  await axios.delete(`${ESTIMATE_API_BASE_URL}/estimate/attachments/${attachmentID}`);
};

export const downloadAttachment = async (attachmentID: number): Promise<Blob> => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/attachments/${attachmentID}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

// 새로운 API 함수들
export const generateTempEstimateNo = async (): Promise<{ tempEstimateNo: string }> => {
  const response = await axios.post(`${ESTIMATE_API_BASE_URL}/estimate/generate-temp-no`);
  return response.data;
};

// 밸브 리스트 인터페이스
export interface BodyValveListItem {
  valveSeries: string;
  valveSeriesCode: string;
}

export const getBodyValveList = async (): Promise<BodyValveListItem[]> => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/body-valve-list`);
  return response.data;
};

export const getBodySizeList = async () => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/body-size-list`);
  return response.data;
};

export const getBodyMatList = async () => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/body-mat-list`);
  return response.data;
};

export const getTrimMatList = async () => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/trim-mat-list`);
  return response.data;
};

export const getTrimOptionList = async () => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/trim-option-list`);
  return response.data;
};

export const getBodyRatingList = async () => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/body-rating-list`);
  return response.data;
};

// Save Draft 및 Submit Estimate API 함수들
export interface SaveDraftDto {
  types: Array<{
    valveSeries: string;
    valveSeriesCode: string;
    order: number;
  }>;
  valves: Array<{
    valveSeries: string;
    valveSeriesCode: string;
    order: number;
  }>;
  specifications: {
    project?: string;
    customerRequirement?: string;
    staffComment?: string;
  };
}

export interface SubmitEstimateDto extends SaveDraftDto {
  // Submit은 SaveDraft와 동일한 구조를 사용
}

export const saveDraft = async (tempEstimateNo: string, data: SaveDraftDto): Promise<void> => {
  await axios.post(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}/save-draft`, data);
};

export const submitEstimate = async (tempEstimateNo: string, data: SubmitEstimateDto): Promise<void> => {
  await axios.post(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}/submit`, data);
};

// 견적 상세 조회 관련 인터페이스 및 API
export interface EstimateDetailResponseDto {
  estimateSheet: EstimateSheetInfoDto;
  estimateRequests: EstimateRequestDetailDto[];
  attachments: EstimateAttachmentResponseDto[];
  canEdit: boolean;
  currentUserRole: string;
}

export interface EstimateSheetInfoDto {
  tempEstimateNo: string;
  curEstimateNo?: string;
  prevEstimateNo?: string;
  customerID: string;
  customerName: string;
  writerID: string;
  writerName: string;
  managerID?: string;
  managerName?: string;
  status: number;
  statusText: string;
  project?: string;
  customerRequirement?: string;
  staffComment?: string;
  createdDate: string;
  completeDate?: string;
}

export interface EstimateRequestDetailDto {
  valveType: string; // ValveSeriesCode
  tagNos: TagNoDetailDto[];
}

export interface TagNoDetailDto {
  sheetID: number;
  sheetNo: number;  // SheetNo 필드 추가
  tagNo: string;
  qty: number;
  medium?: string;
  fluid?: string;
  
  // Flow Rate
  isQM: boolean;
  qmUnit?: string;
  qmMax?: number;
  qmNor?: number;
  qmMin?: number;
  qnUnit?: string;
  qnMax?: number;
  qnNor?: number;
  qnMin?: number;
  
  // Pressure
  isP2: boolean;
  pressureUnit?: string;
  inletPressureMaxQ?: number;
  inletPressureNorQ?: number;
  inletPressureMinQ?: number;
  outletPressureMaxQ?: number;
  outletPressureNorQ?: number;
  outletPressureMinQ?: number;
  differentialPressureMaxQ?: number;
  differentialPressureNorQ?: number;
  differentialPressureMinQ?: number;
  
  // Temperature
  temperatureUnit?: string;
  inletTemperatureQ?: number;
  inletTemperatureNorQ?: number;
  inletTemperatureMinQ?: number;
  
  // Density & Molecular
  isDensity?: boolean;
  densityUnit?: string;
  density?: number;
  molecularWeightUnit?: string;
  molecularWeight?: number;
  
  // Body
  bodySizeUnit?: string;
  bodySize?: string;
  bodyMat?: string;
  trimMat?: string;
  trimOption?: string;
  bodyRating?: string;
  bodyRatingUnit?: string;
  
  // Actuator
  actType?: string;
  isHW?: boolean;
  
  // Accessory
  isPositioner?: boolean;
  positionerType?: string;
  explosionProof?: string;
  transmitterType?: string;
  isSolenoid?: boolean;
  isLimSwitch?: boolean;
  isAirSet?: boolean;
  isVolumeBooster?: boolean;
  isAirOperated?: boolean;
  isLockUp?: boolean;
  isSnapActingRelay?: boolean;
}

// 임시저장 목록 조회 API
export const getDraftEstimates = async (params: any, currentUserId: string | null, customerId?: string): Promise<any> => {
  const apiParams = { ...params };
  
  // currentUserId가 null이 아닐 때만 추가
  if (currentUserId !== null) {
    apiParams.currentUserId = currentUserId;
  }
  
  // customerId가 있을 때만 추가
  if (customerId) {
    apiParams.customerId = customerId;
  }
  
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/drafts`, { 
    params: apiParams
  });
  return response.data;
};

// 견적 상세 조회 API
export const getEstimateDetail = async (tempEstimateNo: string, currentUserId: string): Promise<EstimateDetailResponseDto> => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}/detail?currentUserId=${currentUserId}`);
  return response.data;
}; 

export const assignEstimate = async (tempEstimateNo: string, managerId: string) => {
  const response = await fetch(`${ESTIMATE_API_BASE_URL}/estimate/sheets/${tempEstimateNo}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      managerId: managerId,
      status: 2
    })
  });
  return response.json();
};

// 견적요청 조회 API
export const getEstimateInquiry = async (params: any, currentUserId: string, customerId?: string): Promise<any> => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/inquiry`, { 
    params: { ...params, currentUserId, customerId } 
  });
  return response.data;
};

// 견적관리 페이지용 API - 임시저장 제외한 상태 조회
export const getEstimateManagement = async (params: any, currentUserId: string, customerId?: string): Promise<any> => {
  const response = await axios.get(`${ESTIMATE_API_BASE_URL}/estimate/management`, { 
    params: { ...params, currentUserId, customerId } 
  });
  return response.data;
};