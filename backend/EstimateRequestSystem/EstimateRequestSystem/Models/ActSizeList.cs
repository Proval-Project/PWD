using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class ActSizeList
    {
        [Key]
        public string ActSeriesCode { get; set; } = string.Empty;
        [Key]
        public string ActSizeCode { get; set; } = string.Empty;
        public string ActSize { get; set; } = string.Empty;
    }
}
