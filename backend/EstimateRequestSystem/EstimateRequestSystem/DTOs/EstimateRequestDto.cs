namespace EstimateRequestSystem.DTOs
{
    public class CreateEstimateRequestDto
    {
        public int? SheetID { get; set; } // 기존 데이터 수정 시 사용
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
        public bool? IsDensity { get; set; }
        public string? PressureUnit { get; set; }
        public decimal? InletPressureMaxQ { get; set; }
        public decimal? InletPressureNorQ { get; set; }
        public decimal? InletPressureMinQ { get; set; }
        public decimal? OutletPressureMaxQ { get; set; }
        public decimal? OutletPressureNorQ { get; set; }
        public decimal? OutletPressureMinQ { get; set; }
        public decimal? DifferentialPressureMaxQ { get; set; }
        public decimal? DifferentialPressureNorQ { get; set; }
        public decimal? DifferentialPressureMinQ { get; set; }
        public string? TemperatureUnit { get; set; }
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
        public string? TransmitterType { get; set; }
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
        public string ValveSeriesCode { get; set; } = string.Empty; // FK를 위한 코드 추가
        public List<TagNoDto> TagNos { get; set; } = new List<TagNoDto>();
    }

    // TagNo 데이터
    public class TagNoDto : CreateEstimateRequestDto
    {
        public int SheetNo { get; set; }
    }

    // 사양 저장 DTO (기존)
    public class SpecificationSaveDto
    {
        public string ValveId { get; set; } = string.Empty;
        public BodySpecificationDto Body { get; set; } = new BodySpecificationDto();
        public TrimSpecificationDto Trim { get; set; } = new TrimSpecificationDto();
        public ActuatorSpecificationDto Actuator { get; set; } = new ActuatorSpecificationDto();
        public AccessorySpecificationDto Accessories { get; set; } = new AccessorySpecificationDto();
    }

    // 새로운 사양 저장 요청 DTO
    public class SaveSpecificationRequestDto
    {
        public string ValveId { get; set; } = string.Empty;
        public BodySaveSpecificationDto Body { get; set; } = new BodySaveSpecificationDto();
        public TrimSaveSpecificationDto Trim { get; set; } = new TrimSaveSpecificationDto();
        public ActuatorSpecificationDto Actuator { get; set; } = new ActuatorSpecificationDto();
        public AccessorySpecificationDto Accessories { get; set; } = new AccessorySpecificationDto();
    }

    // Body 사양 저장 DTO (SaveSpecificationRequestDto 전용)
    public class BodySaveSpecificationDto
    {
        public string BonnetType { get; set; } = string.Empty;
        public string MaterialBody { get; set; } = string.Empty;
        public string Rating { get; set; } = string.Empty;
        public string Connection { get; set; } = string.Empty;
        public string SizeUnit { get; set; } = string.Empty; // SizeUnit 추가
        public string Size { get; set; } = string.Empty;     // BodySizeCode를 저장할 필드
    }

    // Trim 사양 저장 DTO (SaveSpecificationRequestDto 전용)
    public class TrimSaveSpecificationDto
    {
        public string Type { get; set; } = string.Empty;
        public string Series { get; set; } = string.Empty;
        public string PortSize { get; set; } = string.Empty;
        public string Form { get; set; } = string.Empty;
        public string MaterialTrim { get; set; } = string.Empty; // Trim에 MaterialTrim 추가
        public string Option { get; set; } = string.Empty;       // Trim에 Option 추가
    }

    public class BodySpecificationDto
    {
        public string BonnetType { get; set; } = string.Empty;
        public string MaterialBody { get; set; } = string.Empty;
        public string MaterialTrim { get; set; } = string.Empty; // 다시 BodySpecificationDto로 이동
        public string Option { get; set; } = string.Empty;       // 다시 BodySpecificationDto로 이동
        public string Rating { get; set; } = string.Empty;
        public string Connection { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
    }

    public class TrimSpecificationDto
    {
        public string Type { get; set; } = string.Empty;
        public string Series { get; set; } = string.Empty;
        public string PortSize { get; set; } = string.Empty;
        public string Form { get; set; } = string.Empty;
        // MaterialTrim과 Option을 BodySpecificationDto로 다시 이동
        // public string MaterialTrim { get; set; } = string.Empty;
        // public string Option { get; set; } = string.Empty;
    }

    public class ActuatorSpecificationDto
    {
        public string Type { get; set; } = string.Empty;
        public string Series { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
        public string HW { get; set; } = string.Empty;
    }

    public class AccessorySpecificationDto
    {
        public string Maker { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        
        // 실제 DB 필드들 추가
        public string? PosCode { get; set; }        // 포지셔너
        public string? SolCode { get; set; }        // 솔레노이드
        public string? LimCode { get; set; }        // 리미터
        public string? ASCode { get; set; }         // 에어 서플라이
        public string? VolCode { get; set; }        // 볼륨 부스터
        public string? AirOpCode { get; set; }      // 에어 오퍼레이터
        public string? LockupCode { get; set; }     // 락업
        public string? SnapActCode { get; set; }    // 스냅 액션
    }

    // 사양 데이터 응답 DTO
    public class SpecificationResponseDto
    {
        public int SheetID { get; set; }
        public string ValveId { get; set; } = string.Empty;
        public BodySpecificationResponseDto Body { get; set; } = new BodySpecificationResponseDto();
        public TrimSpecificationResponseDto Trim { get; set; } = new TrimSpecificationResponseDto();
        public ActuatorSpecificationResponseDto Actuator { get; set; } = new ActuatorSpecificationResponseDto();
        public AccessorySpecificationResponseDto Accessories { get; set; } = new AccessorySpecificationResponseDto();
    }

    public class BodySpecificationResponseDto
    {
        public string BonnetTypeCode { get; set; } = string.Empty;
        public string BonnetTypeName { get; set; } = string.Empty;
        public string MaterialBodyCode { get; set; } = string.Empty;
        public string MaterialBodyName { get; set; } = string.Empty;
        public string MaterialTrimCode { get; set; } = string.Empty;
        public string MaterialTrimName { get; set; } = string.Empty;
        public string OptionCode { get; set; } = string.Empty;
        public string OptionName { get; set; } = string.Empty;
        public string RatingCode { get; set; } = string.Empty;
        public string RatingName { get; set; } = string.Empty;
        public string RatingUnit { get; set; } = string.Empty;
        public string ConnectionCode { get; set; } = string.Empty;
        public string ConnectionName { get; set; } = string.Empty;
        public string SizeCode { get; set; } = string.Empty;
        public string SizeName { get; set; } = string.Empty;
        public string SizeUnit { get; set; } = string.Empty;
    }

    public class TrimSpecificationResponseDto
    {
        public string TypeCode { get; set; } = string.Empty;
        public string TypeName { get; set; } = string.Empty;
        public string SeriesCode { get; set; } = string.Empty;
        public string SeriesName { get; set; } = string.Empty;
        public string PortSizeCode { get; set; } = string.Empty;
        public string PortSizeName { get; set; } = string.Empty;
        public string PortSizeUnit { get; set; } = string.Empty;
        public string FormCode { get; set; } = string.Empty;
        public string FormName { get; set; } = string.Empty;
    }

    public class ActuatorSpecificationResponseDto
    {
        public string TypeCode { get; set; } = string.Empty;
        public string TypeName { get; set; } = string.Empty;
        public string SeriesCode { get; set; } = string.Empty;
        public string SeriesName { get; set; } = string.Empty;
        public string SizeCode { get; set; } = string.Empty;
        public string SizeName { get; set; } = string.Empty;
        public string HWCode { get; set; } = string.Empty;
        public string HWName { get; set; } = string.Empty;
    }

    public class AccessoryDetailDto
    {
        public string? TypeCode { get; set; }
        public string? ModelCode { get; set; }
        public string? ModelName { get; set; }
        public string? MakerCode { get; set; }
        public string? MakerName { get; set; }
    }

    public class AccessorySpecificationResponseDto
    {
        public AccessoryDetailDto? Positioner { get; set; }
        public AccessoryDetailDto? Solenoid { get; set; }
        public AccessoryDetailDto? Limiter { get; set; }
        public AccessoryDetailDto? AirSupply { get; set; }
        public AccessoryDetailDto? VolumeBooster { get; set; }
        public AccessoryDetailDto? AirOperator { get; set; }
        public AccessoryDetailDto? LockUp { get; set; }
        public AccessoryDetailDto? SnapActingRelay { get; set; }
    }

    public class EstimateAssignDto
    {
        public string ManagerId { get; set; } = string.Empty;
        public int Status { get; set; }
    }
} 