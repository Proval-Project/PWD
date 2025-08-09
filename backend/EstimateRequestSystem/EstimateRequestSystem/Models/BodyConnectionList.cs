using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class BodyConnectionList
    {
        [Key]
        public string ConnectionType { get; set; } = string.Empty;
        public string ConnectionCode { get; set; } = string.Empty;
    }
}
