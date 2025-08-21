using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstimateRequestSystem.Models
{
    public class TrimPortSizeList
    {
        [Key, Column(Order = 0)]
        [ForeignKey("TrimPortSizeUnit")]
        public string UnitCode { get; set; } = string.Empty;

        [Key, Column(Order = 1)]
        public string PortSizeCode { get; set; } = string.Empty;

        public string PortSize { get; set; } = string.Empty;

        public virtual TrimPortSizeUnit? TrimPortSizeUnit { get; set; }
    }
}
