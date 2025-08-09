namespace EstimateRequestSystem.DTOs
{
    public class CreateEstimateRequestDto
    {
        public string Tagno { get; set; } = string.Empty;
        public int Qty { get; set; }
        public string? Medium { get; set; }
        public string? Fluid { get; set; }
        public bool? IsQM { get; set; }
        public string? QMUnit { get; set; }
        public decimal? QMMax { get; set; }
        public decimal? QMNor { get; set; }
        public decimal? QMMin { get; set; }
        public string? QNUnit { get; set; }
        public decimal? QNMax { get; set; }
        public decimal? QNNor { get; set; }
        public decimal? QNMin { get; set; }
        public bool? IsP2 { get; set; }
        public string? InletPressureUnit { get; set; }
        public decimal? InletPressureMaxQ { get; set; }
        public decimal? InletPressureNorQ { get; set; }
        public decimal? InletPressureMinQ { get; set; }
        public string? OutletPressureUnit { get; set; }
        public decimal? OutletPressureMaxQ { get; set; }
        public decimal? OutletPressureNorQ { get; set; }
        public decimal? OutletPressureMinQ { get; set; }
        public string? DifferentialPressureUnit { get; set; }
        public decimal? DifferentialPressureMaxQ { get; set; }
        public decimal? DifferentialPressureNorQ { get; set; }
        public decimal? DifferentialPressureMinQ { get; set; }
        public string? InletTemperatureUnit { get; set; }
        public decimal? InletTemperatureQ { get; set; }
        public decimal? InletTemperatureNorQ { get; set; }
        public decimal? InletTemperatureMinQ { get; set; }
        public string? DensityUnit { get; set; }
        public decimal? Density { get; set; }
        public string? MolecularWeightUnit { get; set; }
        public decimal? MolecularWeight { get; set; }

        public string? BodySizeUnit { get; set; }
        public string? BodySize { get; set; }
        public string? BodyMat { get; set; }
        public string? TrimMat { get; set; }
        public string? TrimOption { get; set; }

        public string? BodyRating { get; set; }
        public string? ActType { get; set; }
        public bool? IsHW { get; set; }
        public bool? IsPositioner { get; set; }
        public string? PositionerType { get; set; }
        public string? ExplosionProof { get; set; }
        public bool? IsTransmitter { get; set; }
        public bool? IsSolenoid { get; set; }
        public bool? IsLimSwitch { get; set; }
        public bool? IsAirSet { get; set; }
        public bool? IsVolumeBooster { get; set; }
        public bool? IsAirOperated { get; set; }
        public bool? IsLockUp { get; set; }
        public bool? IsSnapActingRelay { get; set; }
    }

    public class UpdateEstimateRequestDto : CreateEstimateRequestDto
    {
        public int SheetNo { get; set; }
    }

    public class EstimateRequestResponseDto : CreateEstimateRequestDto
    {
        public string TempEstimateNo { get; set; } = string.Empty;
        public int SheetID { get; set; }
        public int SheetNo { get; set; }
        public string? EstimateNo { get; set; }
        public string? ValveType { get; set; }
        public int? UnitPrice { get; set; }
    }

    public class EstimateRequestListResponseDto
    {
        public string TempEstimateNo { get; set; } = string.Empty;
        public int SheetID { get; set; }
        public int SheetNo { get; set; }
        public string Tagno { get; set; } = string.Empty;
        public int Qty { get; set; }
        public string? Medium { get; set; }
        public string? Fluid { get; set; }
        public string? ValveType { get; set; }
    }

    // 첨부파일 정보 DTO
    public class AttachmentInfoDto
    {
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public int FileSize { get; set; }
        public string UploadUserID { get; set; } = string.Empty;
    }

    // 파일 삭제 요청 DTO
    public class DeleteFileRequest
    {
        public string FilePath { get; set; } = string.Empty;
    }

    // 임시저장을 위한 DTO
    public class SaveDraftDto
    {
        public List<TypeSelectionDto> TypeSelections { get; set; } = new List<TypeSelectionDto>();
        public string? Project { get; set; }
        public string? CustomerRequirement { get; set; }
        public string? CustomerID { get; set; }
        public string? WriterID { get; set; }
        public List<AttachmentInfoDto> Attachments { get; set; } = new List<AttachmentInfoDto>();
    }

    // 견적요청을 위한 DTO
    public class SubmitEstimateDto : SaveDraftDto
    {
        public string? StaffComment { get; set; }
    }

    // Type 선택 데이터
    public class TypeSelectionDto
    {
        public string Type { get; set; } = string.Empty; // 2-way, 3-way 등
        public List<ValveSelectionDto> Valves { get; set; } = new List<ValveSelectionDto>();
    }

    // Valve 선택 데이터
    public class ValveSelectionDto
    {
        public string ValveName { get; set; } = string.Empty;
        public List<TagNoDto> TagNos { get; set; } = new List<TagNoDto>();
    }

    // TagNo 데이터
    public class TagNoDto : CreateEstimateRequestDto
    {
        public int SheetNo { get; set; }
    }
} 