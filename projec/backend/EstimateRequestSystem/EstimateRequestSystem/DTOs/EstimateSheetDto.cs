namespace EstimateRequestSystem.DTOs
{
    public class CreateEstimateSheetDto
    {
        public string? Project { get; set; }
        public string? CustomerRequirement { get; set; }
        public string CustomerID { get; set; } = string.Empty;
        public string WriterID { get; set; } = string.Empty;
    }

    public class UpdateEstimateSheetDto
    {
        public string? Project { get; set; }
        public string? CustomerRequirement { get; set; }
        public int Status { get; set; }
    }

    public class EstimateSheetResponseDto
    {
        public string TempEstimateNo { get; set; } = string.Empty;
        public string? CurEstimateNo { get; set; }
        public string? PrevEstimateNo { get; set; }
        public string? CustomerID { get; set; }
        public string? WriterID { get; set; }
        public string? ManagerID { get; set; }
        public int Status { get; set; }
        public string? Project { get; set; }
        public string? CustomerRequirement { get; set; }
        public string? StaffComment { get; set; }
        public string? CustomerName { get; set; }
        public string? WriterName { get; set; }
        public List<EstimateRequestResponseDto> EstimateRequests { get; set; } = new List<EstimateRequestResponseDto>();
        public List<EstimateAttachmentResponseDto> Attachments { get; set; } = new List<EstimateAttachmentResponseDto>();
    }

    public class EstimateSheetListResponseDto
    {
        public string TempEstimateNo { get; set; } = string.Empty;
        public string? Project { get; set; }
        public int Status { get; set; }
        public string? CustomerName { get; set; }
        public string? WriterName { get; set; }
        public int RequestCount { get; set; }
    }
} 