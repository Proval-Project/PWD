using System.ComponentModel.DataAnnotations;

namespace CommonDbLib
{
    public class EstimateSheetLv1
    {
        [Key]
        [MaxLength(50)]
        public string CurEstimateNo { get; set; }
        public int CurEstPrice { get; set; }
        [MaxLength(50)]
        public string? PrevEstimateNo { get; set; }
        public int State { get; set; }
        [MaxLength(50)]
        public string CustomerID { get; set; }
        public User Customer { get; set; }
    }
} 