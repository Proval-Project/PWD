using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class BodyValveList
    {
        [Key]
        public string ValveSeries { get; set; } = string.Empty;
        public string ValveSeriesCode { get; set; } = string.Empty;
    }
}
