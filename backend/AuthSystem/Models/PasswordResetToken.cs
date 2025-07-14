using System.ComponentModel.DataAnnotations;

namespace FullAuthSystem.Models
{
    public class PasswordResetToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(6)]
        public string VerificationCode { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime ExpiresAt { get; set; }

        public bool IsUsed { get; set; } = false;

        public DateTime? UsedAt { get; set; }

        // 토큰이 유효한지 확인하는 메서드
        public bool IsValid()
        {
            return !IsUsed && DateTime.UtcNow <= ExpiresAt;
        }

        // 토큰을 사용됨으로 표시하는 메서드
        public void MarkAsUsed()
        {
            IsUsed = true;
            UsedAt = DateTime.UtcNow;
        }
    }
} 