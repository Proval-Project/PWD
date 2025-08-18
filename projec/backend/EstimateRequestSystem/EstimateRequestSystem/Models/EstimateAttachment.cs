using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class EstimateAttachment
    {
        [Key]
        public int AttachmentID { get; set; }
        public string TempEstimateNo { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public int? FileSize { get; set; }
        public DateTime UploadDate { get; set; } = DateTime.UtcNow;
        public string? UploadUserID { get; set; }
        
        // 🔑 관리 첨부파일 구분을 위한 필드
        public string ManagerFileType { get; set; } = ""; // "datasheet", "cvlist", "vllist", "singlequote", "multiquote"

        // Navigation properties
        public virtual EstimateSheetLv1 EstimateSheet { get; set; } = null!;
        public virtual User? UploadUser { get; set; }
    }
} 