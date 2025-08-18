using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class BodyBonnetList
    {
        [Key]
        public string BonnetCode { get; set; } = string.Empty;
        public string BonnetType { get; set; } = string.Empty;
    }
}
