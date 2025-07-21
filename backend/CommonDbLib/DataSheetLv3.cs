using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CommonDbLib
{
    public class DataSheetLv3
    {
        [Key]
        [MaxLength(50)]
        public string TagNo { get; set; }
        [MaxLength(50)]
        public string EstimateNo { get; set; }
        [ForeignKey("EstimateNo")]
        public EstimateSheetLv1 EstimateSheet { get; set; }
        [MaxLength(50)]
        public string ItemCode { get; set; }
        [ForeignKey("ItemCode")]
        public ItemList Item { get; set; }
        public int UnitPrice { get; set; }
        public int Quantity { get; set; }
    }
} 