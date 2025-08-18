using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class TrimFormList
    {
        [Key]
        public string TrimFormCode { get; set; } = string.Empty;
        public string TrimForm { get; set; } = string.Empty;
    }
}
