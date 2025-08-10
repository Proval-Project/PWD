using System.ComponentModel.DataAnnotations;

namespace EstimateRequestSystem.Models
{
    public class DataSheetLv3
    {
        [Key]
        public string TempEstimateNo { get; set; } = string.Empty;
        
        [Key]
        public int SheetID { get; set; }
        
        public string? EstimateNo { get; set; }
        public string? Medium { get; set; }
        public string? Fluid { get; set; }
        public bool? IsQM { get; set; }
        public bool? IsP2 { get; set; }
        public bool? IsDensity { get; set; }
        public bool? IsN1 { get; set; }
        public string? QMUnit { get; set; }
        public decimal? QMMax { get; set; }
        public decimal? QMNor { get; set; }
        public decimal? QMMin { get; set; }
        public string? QNUnit { get; set; }
        public decimal? QNMax { get; set; }
        public decimal? QNNor { get; set; }
        public decimal? QNMin { get; set; }
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
        public string? CalculatedCvUnit { get; set; }
        public decimal? CalculatedCvMaxQ { get; set; }
        public decimal? CalculatedCvNorQ { get; set; }
        public decimal? CalculatedCvMinQ { get; set; }
        public decimal? SS100Max { get; set; }
        public decimal? SS100Nor { get; set; }
        public decimal? SS100Min { get; set; }
        public string? U1Unit { get; set; }
        public decimal? U1Max { get; set; }
        public decimal? U1Nor { get; set; }
        public decimal? U1Min { get; set; }
        public decimal? U2Max { get; set; }
        public decimal? U2Nor { get; set; }
        public decimal? U2Min { get; set; }
        public decimal? LpAeMax { get; set; }
        public decimal? LpAeNor { get; set; }
        public decimal? LpAeMin { get; set; }
        public string? WarningStateMax { get; set; }
        public string? WarningStateNor { get; set; }
        public string? WarningStateMin { get; set; }
        public string? WarningTypeMax { get; set; }
        public string? WarningTypeNor { get; set; }
        public string? WarningTypeMin { get; set; }
        public string? FluidPUnit { get; set; }
        public decimal? FluidP1Max { get; set; }
        public decimal? FluidP1Nor { get; set; }
        public decimal? FluidP1Min { get; set; }
        public decimal? FluidP2Max { get; set; }
        public decimal? FluidP2Nor { get; set; }
        public decimal? FluidP2Min { get; set; }
        public decimal? FluidN1Max { get; set; }
        public decimal? FluidN1Nor { get; set; }
        public decimal? FluidN1Min { get; set; }
        public string? FluidN1Unit { get; set; }
        public decimal? FluidV1Max { get; set; }
        public decimal? Fluidv1Nor { get; set; }
        public decimal? FluidV1Min { get; set; }
        public string? FluidV1Unit { get; set; }
        public decimal? FluidPV1Max { get; set; }
        public decimal? FluidPV1Nor { get; set; }
        public decimal? FluidPV1Min { get; set; }
        public string? FluidPV1Unit { get; set; }
        public decimal? FluidTV1Max { get; set; }
        public decimal? FluidTV1Nor { get; set; }
        public decimal? FluidTV1Min { get; set; }
        public string? FluidTV1Unit { get; set; }
        public decimal? FluidCF1Max { get; set; }
        public decimal? FluidCF1Nor { get; set; }
        public decimal? FluidCF1Min { get; set; }
        public string? FluidCF1Unit { get; set; }
        public string? ValveType { get; set; }
        public string? FlowDirection { get; set; }
        public string? ValvePerformClass { get; set; }
        public string? Protection { get; set; }
        public string? BasicCharacter { get; set; }
        public decimal? TheoreticalRangeability { get; set; }
        public string? FlowCoeffUnit { get; set; }
        public decimal? FlowCoeff { get; set; }
        public decimal? NorFlowCoeff { get; set; }
        public string? SizePressureClass { get; set; }
        public decimal? SuggestedValveSize { get; set; }
        public string? BonnetType { get; set; }
        public string? BodyMat { get; set; }

        public string? BodySizeUnit { get; set; }
        public string? BodySize { get; set; }
        public string? Rating { get; set; }
        public string? Connection { get; set; }
        public string? TrimType { get; set; }
        public string? TrimSeries { get; set; }
        public string? TrimMat { get; set; }
        public string? TrimOption { get; set; }
        public string? TrimPortSize { get; set; }
        public string? TrimForm { get; set; }
        public string? ActType { get; set; }
        public string? ActSeriesCode { get; set; }
        public string? ActSize { get; set; }
        public string? HW { get; set; }
        public string? PosCode { get; set; }
        public string? SolCode { get; set; }
        public string? LimCode { get; set; }
        public string? ASCode { get; set; }
        public string? VolCode { get; set; }
        public string? AirOpCode { get; set; }
        public string? LockupCode { get; set; }
        public string? SnapActCode { get; set; }

        // Navigation properties
        public virtual EstimateSheetLv1 EstimateSheet { get; set; } = null!;
        public virtual ActHWList? ActHW { get; set; }
    }
}
