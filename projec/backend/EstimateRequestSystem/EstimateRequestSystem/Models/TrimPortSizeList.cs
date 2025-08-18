using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class TrimPortSizeList
    {
        [Key]
        public string PortSizeCode { get; set; } = string.Empty;
        
        [Key]
        public string PortSizeUnit { get; set; } = string.Empty;
        
        public string PortSize { get; set; } = string.Empty;
    }
}
