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

        // Navigation properties
        public virtual EstimateSheetLv1 EstimateSheet { get; set; } = null!;
        public virtual User? UploadUser { get; set; }
    }
} 