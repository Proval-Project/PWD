using System.ComponentModel.DataAnnotations;

namespace FullAuthSystem.Models
{
    public class PasswordResetToken
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Email { get; set; } = "";
        
        [Required]
        [MaxLength(255)]
        public string VerificationCode { get; set; } = "";
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime ExpiresAt { get; set; }
        
        public bool IsUsed { get; set; } = false;
        
        public bool IsValid()
        {
            return !IsUsed && DateTime.UtcNow < ExpiresAt;
        }
        
        public void MarkAsUsed()
        {
            IsUsed = true;
        }
    }
} 