using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class TrimTypeList
    {
        [Key]
        public string TrimTypeCode { get; set; } = string.Empty;
        public string TrimType { get; set; } = string.Empty;
    }
}
