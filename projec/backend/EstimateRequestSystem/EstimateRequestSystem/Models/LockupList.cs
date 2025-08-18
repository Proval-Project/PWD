using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstimateRequestSystem.Models
{
    using Microsoft.EntityFrameworkCore;

    [Table("LockupList")]
    [PrimaryKey(nameof(AccMakerCode), nameof(AccModelCode))]
    public class LockupList
    {
        [Column(TypeName = "char(1)")]
        public string AccMakerCode { get; set; }

        [Column(TypeName = "char(1)")]
        public string AccModelCode { get; set; }

        [Required]
        [Column(TypeName = "varchar(255)")]
        public string AccModelName { get; set; }

        [Column(TypeName = "varchar(255)")]
        public string? AccSize { get; set; }

        [ForeignKey("AccMakerCode")]
        public virtual LockupMakerList LockupMaker { get; set; }
    }
}
