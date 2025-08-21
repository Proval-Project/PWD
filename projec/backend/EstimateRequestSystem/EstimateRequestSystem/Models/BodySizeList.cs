using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstimateRequestSystem.Models
{
    public class BodySizeList
    {
        [Key, Column(Order = 0)]
        public string UnitCode { get; set; } = string.Empty;

        [Key, Column(Order = 1)]
        public string BodySizeCode { get; set; } = string.Empty;

        public string BodySize { get; set; } = string.Empty;

        public virtual BodySizeUnit? BodySizeUnit { get; set; }
    }
}
