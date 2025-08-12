using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class AccMakerList
    {
        public string AccMakerCode { get; set; } = string.Empty;
        public string AccMakerName { get; set; } = string.Empty;
        public string AccTypeCode { get; set; } = string.Empty;
    }
}
