using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class ActHWList
    {
        [Key]
        public string HWCode { get; set; } = string.Empty;
        
        public string HW { get; set; } = string.Empty;
    }
}
