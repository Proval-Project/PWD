using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class AccModelList
    {
        public string AccModelCode { get; set; } = string.Empty;
        public string AccModelName { get; set; } = string.Empty;
        public string AccTypeCode { get; set; } = string.Empty;
        public string AccMakerCode { get; set; } = string.Empty;
        public string AccSize { get; set; } = string.Empty;
        public bool AccStatus { get; set; }
    }
}
