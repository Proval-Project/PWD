import axios from 'axios';

const ESTIMATE_API_BASE_URL = 'http://localhost:5208/api';

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
  managerName?: string;
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
  inletPressureUnit?: string;
  inletPressureMaxQ?: number;
  inletPressureNorQ?: number;
  inletPressureMinQ?: number;
  outletPressureUnit?: string;
  outletPressureMaxQ?: number;
  outletPressureNorQ?: number;
  outletPressureMinQ?: number;
  differentialPressureUnit?: string;
  differentialPressureMaxQ?: number;
  differentialPressureNorQ?: number;
  differentialPressureMinQ?: number;
  inletTemperatureUnit?: string;
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
  isTransmitter?: boolean;
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