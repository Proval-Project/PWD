using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstimateRequestSystem.Models
{
    public class TrimPortSizeUnit
    {
        [Key]
        [StringLength(1)]
        public string UnitCode { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string UnitName { get; set; } = string.Empty;
    }
}
