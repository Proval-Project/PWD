namespace EstimateRequestSystem.DTOs
{
    // 견적 요청 조회 요청 DTO
    public class EstimateInquiryRequestDto
    {
        public string? SearchKeyword { get; set; }  // 검색어
        public DateTime? StartDate { get; set; }    // 시작일
        public DateTime? EndDate { get; set; }      // 종료일
        public int? Status { get; set; }            // 상태 (null이면 전체)
        public int Page { get; set; } = 1;          // 페이지 번호
        public int PageSize { get; set; } = 10;     // 페이지 크기
        public bool IsDescending { get; set; } = true; // 역순 정렬
    }

    // 견적 요청 조회 응답 DTO
    public class EstimateInquiryResponseDto
    {
        public List<EstimateInquiryItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
    }

    // 견적 요청 항목 DTO
    public class EstimateInquiryItemDto
    {
        public string EstimateNo { get; set; } = string.Empty;      // 견적번호 (TempEstimateNo 또는 CurEstimateNo)
        public string CompanyName { get; set; } = string.Empty;     // 회사명
        public string ContactPerson { get; set; } = string.Empty;   // 담당자
        public DateTime RequestDate { get; set; }                   // 요청일자
        public int Quantity { get; set; }                          // 수량
        public string StatusText { get; set; } = string.Empty;      // 상태 텍스트
        public int Status { get; set; }                            // 상태 코드
        public string Project { get; set; } = string.Empty;        // 프로젝트
        public string TempEstimateNo { get; set; } = string.Empty; // 임시 견적번호 (상세 조회용)
    }
}
