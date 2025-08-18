using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class TrimOptionList
    {
        [Key]
        public string TrimOptionCode { get; set; }
        public string TrimOptionName { get; set; }
    }
}
