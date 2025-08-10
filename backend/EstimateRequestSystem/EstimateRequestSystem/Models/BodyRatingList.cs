using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class BodyRatingList
    {
        [Key]
        public string RatingCode { get; set; } = string.Empty;
        public string RatingUnit { get; set; } = string.Empty;
        public string RatingName { get; set; } = string.Empty;
    }
}
