using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class BodyRatingUnitList
    {
        [Key]
        [StringLength(1)]
        public string RatingUnitCode { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string RatingUnit { get; set; } = string.Empty;
    }
}