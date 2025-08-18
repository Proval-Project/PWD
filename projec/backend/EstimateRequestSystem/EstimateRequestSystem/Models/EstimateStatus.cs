namespace EstimateRequestSystem.Models
{
    /// <summary>
    /// 견적 상태 열거형
    /// </summary>
    public enum EstimateStatus
    {
        /// <summary>
        /// 임시저장 (1)
        /// </summary>
        Draft = 1,

        /// <summary>
        /// 견적요청 (2)
        /// </summary>
        Requested = 2,

        /// <summary>
        /// 견적처리중 (3)
        /// </summary>
        InProgress = 3,

        /// <summary>
        /// 견적완료 (4)
        /// </summary>
        Completed = 4,

        /// <summary>
        /// 주문 (5)
        /// </summary>
        Ordered = 5
    }

    /// <summary>
    /// 견적 상태 유틸리티 클래스
    /// </summary>
    public static class EstimateStatusExtensions
    {
        /// <summary>
        /// 상태 코드를 한글 텍스트로 변환
        /// </summary>
        public static string ToKoreanText(this EstimateStatus status)
        {
            return status switch
            {
                EstimateStatus.Draft => "임시저장",
                EstimateStatus.Requested => "견적요청",
                EstimateStatus.InProgress => "견적처리중",
                EstimateStatus.Completed => "견적완료",
                EstimateStatus.Ordered => "주문",
                _ => "알 수 없음"
            };
        }

        /// <summary>
        /// 정수 값을 EstimateStatus로 변환
        /// </summary>
        public static EstimateStatus FromInt(int value)
        {
            return value switch
            {
                1 => EstimateStatus.Draft,
                2 => EstimateStatus.Requested,
                3 => EstimateStatus.InProgress,
                4 => EstimateStatus.Completed,
                5 => EstimateStatus.Ordered,
                _ => EstimateStatus.Draft
            };
        }

        /// <summary>
        /// 정수 값을 한글 텍스트로 직접 변환
        /// </summary>
        public static string ToKoreanText(int status)
        {
            return FromInt(status).ToKoreanText();
        }
    }
}
