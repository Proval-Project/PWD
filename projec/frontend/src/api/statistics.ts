import axios from 'axios';
import { buildApiUrl } from '../config/api';

// DTO 인터페이스들
export interface StatisticsSummaryDto {
  input: number;      // Status 1: 임시저장
  waiting: number;    // Status 2: 견적요청
  completed: number;  // Status 4: 견적완료
  ordered: number;    // Status 5: 주문
}

export interface StatusDistributionDto {
  input: number;      // Status 1: 견적입력
  waiting: number;    // Status 2: 접수
  completed: number;  // Status 4: 완료
  ordered: number;    // Status 5: 주문
}

export interface MonthlyOrderDto {
  month: string;      // "YYYY-MM" 형식
  count: number;
}

export interface ValveRatioDto {
  valveType: string;      // 밸브 타입 코드
  valveTypeName: string;  // 밸브 타입 이름
  count: number;
  percentage: number;      // 비율 (%)
}

export interface ConversionRateDto {
  month: string;          // "YYYY-MM" 형식
  totalRequests: number;  // 전체 견적 요청 건수
  completedQuotes: number; // 견적 완료 건수 (Status >= 4)
  actualOrders: number;   // 실제 주문 건수 (Status = 5)
  conversionRate: number; // 전환율 (%)
}

// 상단 요약 카운트 조회 (전체 누적 또는 오늘 기준)
export const getStatisticsSummary = async (): Promise<StatisticsSummaryDto> => {
  const response = await axios.get<StatisticsSummaryDto>(buildApiUrl('/statistics/summary'));
  return response.data;
};

// 기간별 상태 분포 조회
export const getStatusDistribution = async (
  startDate: Date,
  endDate: Date
): Promise<StatusDistributionDto> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  });
  const response = await axios.get<StatusDistributionDto>(
    buildApiUrl(`/statistics/status-distribution?${params.toString()}`)
  );
  return response.data;
};

// 월별 수주 현황 조회 (밸브 타입 필터 옵션)
export const getMonthlyOrderStatistics = async (
  startDate: Date,
  endDate: Date,
  valveType?: string | null
): Promise<MonthlyOrderDto[]> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  });
  if (valveType) {
    params.append('valveType', valveType);
  }
  const response = await axios.get<MonthlyOrderDto[]>(
    buildApiUrl(`/statistics/monthly-orders?${params.toString()}`)
  );
  return response.data;
};

// 밸브 사양 비율 조회 (밸브 타입 필터 옵션)
export const getValveRatioStatistics = async (
  startDate: Date,
  endDate: Date,
  valveType?: string | null
): Promise<ValveRatioDto[]> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  });
  if (valveType) {
    params.append('valveType', valveType);
  }
  const response = await axios.get<ValveRatioDto[]>(
    buildApiUrl(`/statistics/valve-ratio?${params.toString()}`)
  );
  return response.data;
};

// 전환율 통계 조회
export const getConversionRateStatistics = async (
  startDate: Date,
  endDate: Date
): Promise<ConversionRateDto[]> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  });
  const response = await axios.get<ConversionRateDto[]>(
    buildApiUrl(`/statistics/conversion-rate?${params.toString()}`)
  );
  return response.data;
};

