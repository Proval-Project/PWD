using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstimateRequestSystem.Models
{
    using Microsoft.EntityFrameworkCore;

    [PrimaryKey(nameof(RatingUnitCode), nameof(RatingCode))]
    public class BodyRatingList
    {
        public string RatingUnitCode { get; set; } = string.Empty;

        public string RatingCode { get; set; } = string.Empty;

        public string RatingName { get; set; } = string.Empty;

        public BodyRatingUnitList? BodyRatingUnit { get; set; }
    }
}
