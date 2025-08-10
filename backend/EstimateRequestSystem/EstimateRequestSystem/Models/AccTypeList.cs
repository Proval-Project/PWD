using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class AccTypeList
    {
        [Key]
        public string AccTypeCode { get; set; } = string.Empty;
        public string AccTypeName { get; set; } = string.Empty;
    }
}
