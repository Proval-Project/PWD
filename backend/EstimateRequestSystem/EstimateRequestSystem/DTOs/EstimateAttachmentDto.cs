namespace EstimateRequestSystem.DTOs
{
    public class CreateEstimateAttachmentDto
    {
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public int? FileSize { get; set; }
        public string UploadUserID { get; set; } = string.Empty;
    }

    public class EstimateAttachmentResponseDto
    {
        public int AttachmentID { get; set; }
        public string TempEstimateNo { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public int? FileSize { get; set; }
        public DateTime UploadDate { get; set; }
        public string? UploadUserID { get; set; }
        public string? UploadUserName { get; set; }
    }
} 