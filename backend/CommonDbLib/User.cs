using System.ComponentModel.DataAnnotations;

namespace CommonDbLib
{
    public class User
    {
        [Key]
        [MaxLength(50)]
        public string UserID { get; set; }
        [Required]
        [MaxLength(100)]
        public string Password { get; set; }
        [Required]
        [MaxLength(50)]
        public string Name { get; set; }
        [Required]
        [MaxLength(20)]
        public string PhoneNumber { get; set; }
        public int RoleID { get; set; }
        public Role Role { get; set; }
        [Required]
        [MaxLength(100)]
        public string Email { get; set; }

        public bool IsApproved { get; set; } = false;
        public DateTime? ApprovedAt { get; set; }
        [Required]
        [MaxLength(50)]
        public string ApprovedBy { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        [Required]
        [MaxLength(100)]
        public string CompanyName { get; set; }
        [Required]
        [MaxLength(20)]
        public string BusinessNumber { get; set; }
        [Required]
        [MaxLength(200)]
        public string Address { get; set; }
        [Required]
        [MaxLength(20)]
        public string CompanyPhone { get; set; }
        [Required]
        [MaxLength(50)]
        public string Department { get; set; }
        [Required]
        [MaxLength(50)]
        public string Position { get; set; }

        public string FullName => Name;
    }
} 