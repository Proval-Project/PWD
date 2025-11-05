using System.ComponentModel.DataAnnotations;

namespace FullAuthSystem.Models
{
    public class User
    {
        [Key]
        [MaxLength(255)]
        public string UserID { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Password { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string CompanyName { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string CompanyPhone { get; set; }
        
        [Required]
        public int RoleID { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Position { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Department { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Name { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string BusinessNumber { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Address { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Email { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string PhoneNumber { get; set; }
        
        public bool IsApproved { get; set; } = false;
        
        public bool IsActive { get; set; } = true;
    }
} 