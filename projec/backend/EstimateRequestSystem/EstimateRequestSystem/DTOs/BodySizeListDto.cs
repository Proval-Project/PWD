namespace EstimateRequestSystem.DTOs
{
    public class BodySizeListDto
    {
        public string UnitCode { get; set; } = string.Empty;
        public string BodySizeCode { get; set; } = string.Empty;
        public string BodySize { get; set; } = string.Empty;
        public string UnitName { get; set; } = string.Empty;  // 단위명 (inch, mm 등)
    }
}
