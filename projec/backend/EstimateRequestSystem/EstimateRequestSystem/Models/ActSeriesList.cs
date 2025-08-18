using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class ActSeriesList
    {
        [Key]
        public string ActSeriesCode { get; set; } = string.Empty;
        public string ActSeries { get; set; } = string.Empty;
    }
}
