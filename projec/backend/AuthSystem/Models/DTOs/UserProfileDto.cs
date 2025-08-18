namespace FullAuthSystem.Models.DTOs
{
    public class UserProfileDto
    {
        public string UserID { get; set; }
        public string Email { get; set; }

        public string Role { get; set; }
        public bool IsApproved { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovedBy { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // 기업정보
        public string CompanyName { get; set; }
        public string BusinessNumber { get; set; }
        public string Address { get; set; }
        public string CompanyPhone { get; set; }

        // 담당자정보
        public string Department { get; set; }
        public string Position { get; set; }
        public string PhoneNumber { get; set; }

        // 계산된 속성
        public string Name { get; set; }
        public string FullName => Name;
        public string Status => IsActive ? "활성" : "비활성";
        public string ApprovalStatus => IsApproved ? "승인됨" : "대기중";
    }
} 