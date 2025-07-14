using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CommonDbLib
{
    public class Role
    {
        [Key]
        public int RoleID { get; set; }
        [Required]
        [MaxLength(50)]
        public string RoleName { get; set; }
        [MaxLength(200)]
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public virtual ICollection<User> Users { get; set; } = new List<User>();
    }
} 