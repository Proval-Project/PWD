using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstimateRequestSystem.Models
{
    [Table("AirsetMakerList")]
    public class AirsetMakerList
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
