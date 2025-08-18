using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class BodyMatList
    {
        public string BodyMat { get; set; } = string.Empty;
        [Key]
        public string BodyMatCode { get; set; } = string.Empty;
    }
}
