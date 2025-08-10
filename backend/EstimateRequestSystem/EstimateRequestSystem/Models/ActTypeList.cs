using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class ActTypeList
    {
        [Key]
        public string ActTypeCode { get; set; } = string.Empty;
        public string ActType { get; set; } = string.Empty;
    }
}
