using System.ComponentModel.DataAnnotations;

namespace CommonDbLib
{
    public class DataSheetLv3
    {
        [Key]
        [MaxLength(50)]
        public string TagNo { get; set; }
        [MaxLength(50)]
        public string EstimateNo { get; set; }
        [MaxLength(50)]
        public string ItemCode { get; set; }
        public int UnitPrice { get; set; }
        public int Quantity { get; set; }
        public EstimateSheetLv1 EstimateSheet { get; set; }
        public ItemList Item { get; set; }
    }
} 