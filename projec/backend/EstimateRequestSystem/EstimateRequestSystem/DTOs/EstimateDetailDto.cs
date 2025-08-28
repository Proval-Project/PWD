namespace EstimateRequestSystem.DTOs
{
    public class BulkSaveSpecificationItemDto
    {
        public int SheetID { get; set; }
        public SaveSpecificationRequestDto Specification { get; set; } = new SaveSpecificationRequestDto();
    }

    public class BulkSaveSpecificationRequestDto
    {
        public List<BulkSaveSpecificationItemDto> Items { get; set; } = new List<BulkSaveSpecificationItemDto>();
    }

    // 견적 상세 조회 응답 DTO
    public class EstimateDetailResponseDto
    {
        public EstimateSheetInfoDto EstimateSheet { get; set; } = new();
        public List<EstimateRequestDetailDto> EstimateRequests { get; set; } = new();
        public List<EstimateAttachmentResponseDto> Attachments { get; set; } = new();
        public bool CanEdit { get; set; } // 수정 권한 여부
        public string CurrentUserRole { get; set; } = string.Empty; // 현재 사용자 역할
    }

    // 견적 시트 정보 DTO
    public class EstimateSheetInfoDto
    {
        public string TempEstimateNo { get; set; } = string.Empty;
        public string? CurEstimateNo { get; set; }
        public string? PrevEstimateNo { get; set; }
        public string CustomerID { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty; // 회사명
        public string CustomerUserName { get; set; } = string.Empty; // 고객 사용자 이름(User.Name)
        public string WriterID { get; set; } = string.Empty;
        public string WriterName { get; set; } = string.Empty; // 작성자명
        public string? ManagerID { get; set; }
        public string ManagerName { get; set; } = string.Empty; // 담당자명
        public int Status { get; set; }
        public string StatusText { get; set; } = string.Empty;
        public string? Project { get; set; }
        public string? CustomerRequirement { get; set; }
        public string? StaffComment { get; set; }
        public DateTime CreatedDate { get; set; } // TempEstimateNo에서 파싱
    }

    // 견적 요청 상세 DTO (ValveType별 그룹)
    public class EstimateRequestDetailDto
    {
        public string ValveType { get; set; } = string.Empty; // ValveSeriesCode
        public List<TagNoDetailDto> TagNos { get; set; } = new();
    }

    // TagNo 상세 DTO
    public class TagNoDetailDto
    {
        public int SheetID { get; set; }
        public string TagNo { get; set; } = string.Empty;
        public int Qty { get; set; }
        public string? Medium { get; set; }
        public string? Fluid { get; set; }
        
        // Flow Rate
        public bool IsQM { get; set; }
        public string? QMUnit { get; set; }
        public decimal? QMMax { get; set; }
        public decimal? QMNor { get; set; }
        public decimal? QMMin { get; set; }
        public string? QNUnit { get; set; }
        public decimal? QNMax { get; set; }
        public decimal? QNNor { get; set; }
        public decimal? QNMin { get; set; }
        
        // Pressure
        public bool IsP2 { get; set; }
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
        
        // Temperature
        public string? TemperatureUnit { get; set; }
        public decimal? InletTemperatureQ { get; set; }
        public decimal? InletTemperatureNorQ { get; set; }
        public decimal? InletTemperatureMinQ { get; set; }
        
        // Density & Molecular
        public bool? IsDensity { get; set; }
        public string? DensityUnit { get; set; }
        public decimal? Density { get; set; }
        public string? MolecularWeightUnit { get; set; }
        public decimal? MolecularWeight { get; set; }
        
        // Body
        public string? BodySizeUnit { get; set; }
        public string? BodySize { get; set; }
        public string? BodyMat { get; set; }
        public string? TrimMat { get; set; }
        public string? TrimOption { get; set; }
        public string? BodyRating { get; set; }
        public string? BodyRatingUnit { get; set; }
        
        // Actuator
        public string? ActType { get; set; }
        public bool? IsHW { get; set; }
        
        // Accessory
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
}
