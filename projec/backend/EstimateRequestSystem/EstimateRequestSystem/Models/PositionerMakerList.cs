using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstimateRequestSystem.Models
{
    [Table("PositionerMakerList")]
    public class PositionerMakerList
    {
        [Key]
        [Column(TypeName = "char(1)")]
        public string AccMakerCode { get; set; }

        [Required]
        [Column(TypeName = "varchar(100)")]
        public string AccMakerName { get; set; }
        [Column(TypeName = "tinyint(1)")]
        public bool Status { get; set; }
    }
}
