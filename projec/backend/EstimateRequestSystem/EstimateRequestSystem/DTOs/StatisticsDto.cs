namespace EstimateRequestSystem.DTOs
{
    // 상단 요약 카운트 (전체 누적 또는 오늘 기준)
    public class StatisticsSummaryDto
    {
        public int Input { get; set; }      // Status 1: 임시저장
        public int Waiting { get; set; }     // Status 2: 견적요청
        public int Completed { get; set; }  // Status 4: 견적완료
        public int Ordered { get; set; }     // Status 5: 주문
    }

    // 기간별 상태 분포 데이터
    public class StatusDistributionDto
    {
        public int Input { get; set; }      // Status 1: 견적입력
        public int Waiting { get; set; }     // Status 2: 접수
        public int Completed { get; set; }   // Status 4: 완료
        public int Ordered { get; set; }     // Status 5: 주문
    }

    // 월별 수주 현황 데이터
    public class MonthlyOrderDto
    {
        public string Month { get; set; } = string.Empty;  // "YYYY-MM" 형식
        public int Count { get; set; }
    }

    // 밸브 사양별 비율 데이터
    public class ValveRatioDto
    {
        public string ValveType { get; set; } = string.Empty;  // 밸브 타입 코드
        public string ValveTypeName { get; set; } = string.Empty;  // 밸브 타입 이름
        public int Count { get; set; }
        public double Percentage { get; set; }  // 비율 (%)
    }

    // 전환율 데이터
    public class ConversionRateDto
    {
        public string Month { get; set; } = string.Empty;  // "YYYY-MM" 형식
        public int TotalRequests { get; set; }      // 전체 견적 요청 건수
        public int CompletedQuotes { get; set; }    // 견적 완료 건수 (Status >= 4)
        public int ActualOrders { get; set; }       // 실제 주문 건수 (Status = 5)
        public double ConversionRate { get; set; }  // 전환율 (%)
    }

    // 차트 데이터 요청 파라미터
    public class StatisticsChartRequestDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? ValveType { get; set; }  // null이면 전체 조회, 특정 밸브 타입이면 필터링
        public string? ChartType { get; set; }  // 차트 타입 (선택적)
    }
}

