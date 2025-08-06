using System.ComponentModel.DataAnnotations;

namespace UserManagementSystem.DTOs
{
    public class CreateUserDto
    {
        [Required]
        [StringLength(50)]
        public string UserID { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        public int RoleID { get; set; }
        
        [StringLength(100)]
        public string CompanyName { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string BusinessNumber { get; set; } = string.Empty;
        
        [StringLength(200)]
        public string Address { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string CompanyPhone { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string Department { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string Position { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty;
    }

    public class UpdateUserDto
    {
        [StringLength(100)]
        public string? Email { get; set; }
        
        [StringLength(100, MinimumLength = 6)]
        public string? Password { get; set; }
        
        public int? RoleID { get; set; }
        
        [StringLength(100)]
        public string? CompanyName { get; set; }
        
        [StringLength(20)]
        public string? BusinessNumber { get; set; }
        
        [StringLength(200)]
        public string? Address { get; set; }
        
        [StringLength(20)]
        public string? CompanyPhone { get; set; }
        
        [StringLength(50)]
        public string? Department { get; set; }
        
        [StringLength(50)]
        public string? Position { get; set; }
        
        [StringLength(20)]
        public string? PhoneNumber { get; set; }
        
        [StringLength(50)]
        public string? Name { get; set; }
    }

    public class UserResponseDto
    {
        public string UserID { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int RoleID { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string BusinessNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string CompanyPhone { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsApproved { get; set; }
    }

    public class UserListResponseDto
    {
        public string UserID { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int RoleID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string BusinessNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string CompanyPhone { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public bool IsApproved { get; set; }
    }
} 