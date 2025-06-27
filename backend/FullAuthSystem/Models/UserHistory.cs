using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FullAuthSystem.Models
{
    public class UserHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } // 예: "주문", "문의", "방문", "계약" 등

        [MaxLength(20)]
        public string? Status { get; set; } // 예: "진행중", "완료", "취소" 등

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public string? CreatedBy { get; set; }

        public string? UpdatedBy { get; set; }

        // 외래키 관계
        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; }
    }
} 