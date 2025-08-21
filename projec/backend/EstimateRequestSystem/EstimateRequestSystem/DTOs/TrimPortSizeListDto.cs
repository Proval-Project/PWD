namespace EstimateRequestSystem.DTOs
{
    public class TrimPortSizeListDto
    {
        public string PortSizeCode { get; set; } = string.Empty;
        public string UnitCode { get; set; } = string.Empty;
        public string PortSize { get; set; } = string.Empty;
        public string UnitName { get; set; } = string.Empty;  // 단위명 (inch, mm 등)
    }
}
