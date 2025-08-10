using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class TrimSeriesList
    {
        [Key]
        public string TrimSeriesCode { get; set; } = string.Empty;
        public string TrimSeries { get; set; } = string.Empty;
    }
}
