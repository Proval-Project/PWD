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
        
        // 견적 상태 (enum 사용)
        public EstimateStatus Status { get; set; } = EstimateStatus.EstimateInput;
        
        [MaxLength(50)]
        public string CustomerID { get; set; }
        public User Customer { get; set; }

        // 담당자 UserID (외래키)
        [MaxLength(50)]
        public string ManagerUserID { get; set; }
        public User Manager { get; set; }
    }
} 