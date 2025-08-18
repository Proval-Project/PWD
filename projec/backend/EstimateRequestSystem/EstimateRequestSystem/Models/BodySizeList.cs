using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class BodySizeList
    {
        [Key]
        public string SizeUnit { get; set; } = string.Empty;
        
        [Key]
        public string BodySizeCode { get; set; } = string.Empty;
        
        public string BodySize { get; set; } = string.Empty;
    }
}
