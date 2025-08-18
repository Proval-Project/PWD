using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class User
    {
        [Key]
        public string UserID { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyPhone { get; set; } = string.Empty;
        public int RoleID { get; set; }
        public string Position { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string BusinessNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public bool IsApproved { get; set; }

        // Navigation properties
        public virtual Role Role { get; set; } = null!;
        public virtual ICollection<EstimateSheetLv1> CustomerEstimates { get; set; } = new List<EstimateSheetLv1>();
        public virtual ICollection<EstimateSheetLv1> WriterEstimates { get; set; } = new List<EstimateSheetLv1>();
        public virtual ICollection<EstimateSheetLv1> ManagerEstimates { get; set; } = new List<EstimateSheetLv1>();
        public virtual ICollection<EstimateAttachment> UploadedAttachments { get; set; } = new List<EstimateAttachment>();
    }
} 