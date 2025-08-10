using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class BodyConnectionList
    {
        [Key]
        public string ConnectionCode { get; set; } = string.Empty;
        public string Connection { get; set; } = string.Empty;
    }
}
