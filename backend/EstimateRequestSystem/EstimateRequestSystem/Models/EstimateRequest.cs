using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class EstimateRequest
    {
        [Key]
        public string TempEstimateNo { get; set; } = string.Empty;
        [Key]
        public int SheetID { get; set; }
        public string? EstimateNo { get; set; }
        public int SheetNo { get; set; }
        public char? ValveType { get; set; }
        public string Tagno { get; set; } = string.Empty;
        public string? Project { get; set; }
        public int? UnitPrice { get; set; }
        public int Qty { get; set; }
        public string? Medium { get; set; }
        public string? Fluid { get; set; }
        public bool? IsQM { get; set; }
        public string? FlowRateUnit { get; set; }
        public decimal? FlowRateMaxQ { get; set; }
        public decimal? FlowRateNorQ { get; set; }
        public decimal? FlowRateMinQ { get; set; }
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
        public char? BodySizeUnit { get; set; }
        public string? BodySize { get; set; }
        public char? BodyMat { get; set; }
        public char? TrimMat { get; set; }
        public string? TrimOption { get; set; }
        public char? BodyRatingUnit { get; set; }
        public char? BodyRating { get; set; }
        public char? ActType { get; set; }
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

        // Navigation properties
        public virtual EstimateSheetLv1 EstimateSheet { get; set; } = null!;
    }
} 