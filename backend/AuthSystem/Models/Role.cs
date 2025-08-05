using System.ComponentModel.DataAnnotations;

namespace FullAuthSystem.Models
{
    public class Role
    {
        [Key]
        public int RoleID { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string RoleName { get; set; }
        
        [MaxLength(255)]
        public string? Description { get; set; }
    }
} 