using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class EstimateSheetLv1
    {
        [Key]
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
        public DateTime? RequestDate { get; set; }

        // Navigation properties
        public virtual User? Customer { get; set; }
        public virtual User? Writer { get; set; }
        public virtual User? Manager { get; set; }
        public virtual ICollection<EstimateRequest> EstimateRequests { get; set; } = new List<EstimateRequest>();
        public virtual ICollection<EstimateAttachment> Attachments { get; set; } = new List<EstimateAttachment>();
    }
} 