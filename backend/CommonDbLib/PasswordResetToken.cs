using System.ComponentModel.DataAnnotations;

namespace CommonDbLib
{
    public class PasswordResetToken
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; }
        
        [MaxLength(50)]
        public string? UserID { get; set; }
        
        [Required]
        [MaxLength(6)]
        public string VerificationCode { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime ExpiresAt { get; set; }
        
        public bool IsUsed { get; set; } = false;
        
        public bool IsValid()
        {
            return !IsUsed && DateTime.UtcNow <= ExpiresAt;
        }
        
        public void MarkAsUsed()
        {
            IsUsed = true;
        }
    }
} 