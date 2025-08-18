using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class TrimMatList
    {
        [Key]
        public string TrimMatCode { get; set; }
        public string TrimMat { get; set; }
    }
}
