using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class BodyMatList
    {
        [Key]
        public string BodyMat { get; set; } = string.Empty;
        public string BodyMatCode { get; set; } = string.Empty;
    }
}
