namespace EstimateRequestSystem.DTOs
{
    public class BodySizeListDto
    {

        public string SizeUnitCode { get; set; } = string.Empty;  // RatingUnitCode와 동일한 패턴
        public string BodySizeCode { get; set; } = string.Empty;
        public string BodySize { get; set; } = string.Empty;
        public string SizeUnit { get; set; } = string.Empty;      // RatingUnit과 동일한 패턴
    }
}
