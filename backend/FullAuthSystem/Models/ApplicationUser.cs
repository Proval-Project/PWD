using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace FullAuthSystem.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; }

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; }

        [Required]
        [MaxLength(20)]
        public string Role { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public bool IsActive { get; set; } = true;

        // 승인 관련 필드
        public bool IsApproved { get; set; } = false;
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovedBy { get; set; }

        // 기업정보
        [MaxLength(100)]
        public string? CompanyName { get; set; }

        [MaxLength(20)]
        public string? BusinessNumber { get; set; }

        [MaxLength(200)]
        public string? Address { get; set; }

        [MaxLength(20)]
        public string? CompanyPhone { get; set; }

        // 담당자정보
        [MaxLength(50)]
        public string? Department { get; set; }

        [MaxLength(50)]
        public string? Position { get; set; }

        // 전체 이름을 반환하는 속성
        public string FullName => $"{FirstName} {LastName}";

        // 사용자 상태를 반환하는 속성
        public string Status => IsActive ? "활성" : "비활성";

        // 승인 상태를 반환하는 속성
        public string ApprovalStatus => IsApproved ? "승인됨" : "대기중";
    }
} 