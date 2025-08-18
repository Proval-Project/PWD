using System.ComponentModel.DataAnnotations;

namespace UserManagementSystem.Models
{
    public class User
    {
        [Key]
        [StringLength(255)]
        public string UserID { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string CompanyName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string CompanyPhone { get; set; } = string.Empty;
        
        [Required]
        public int RoleID { get; set; }
        
        [Required]
        [StringLength(255)]
        public string Position { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string Department { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string BusinessNumber { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string Address { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string PhoneNumber { get; set; } = string.Empty;
        
        public bool IsApproved { get; set; } = false;
        
        // Navigation property
        public virtual Role? Role { get; set; }
    }
} 