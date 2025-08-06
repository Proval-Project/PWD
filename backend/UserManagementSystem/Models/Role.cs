using System.ComponentModel.DataAnnotations;

namespace UserManagementSystem.Models
{
    public class Role
    {
        [Key]
        public int RoleID { get; set; }
        
        [Required]
        [StringLength(255)]
        public string RoleName { get; set; } = string.Empty;
        
        [StringLength(255)]
        public string? Description { get; set; }
        
        // Navigation property
        public virtual ICollection<User> Users { get; set; } = new List<User>();
    }
} 