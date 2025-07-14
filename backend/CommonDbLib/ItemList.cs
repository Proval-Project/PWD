using System.ComponentModel.DataAnnotations;

namespace CommonDbLib
{
    public class ItemList
    {
        [Key]
        [MaxLength(50)]
        public string ItemCode { get; set; }
        [Required]
        [MaxLength(100)]
        public string ItemName { get; set; }
        public string? ItemDescription { get; set; }
    }
} 