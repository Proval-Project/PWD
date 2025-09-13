using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MySql.Data.MySqlClient;
using System.Linq; // Added for FirstOrDefault


namespace ConvalWebApi.Controllers


{
    [ApiController]
    [Route("api/[controller]")]
    public class ConvalController : ControllerBase
    {
        private readonly string connectionString;
        // private static readonly ConvalQueueProcessor convalProcessor = new ConvalQueueProcessor();

        // ValveType 매핑 Dictionary
        static readonly Dictionary<string, string> ValveTypeDbToConval = new Dictionary<string, string> {
            {"2", "Straight globe valve"},
            {"3", "Straight globe valve"},
            {"2-Way Conventional Ball", "Ball valve"},
            {"3-Way Conventional Ball", "Ball valve"},
            {"S", "Ball valve"},
            {"H", "Butterfly valve"},
            {"Std. Butterfly", "Butterfly valve"},
            {"A", "Angle globe valve"}
        };

        // Fluid 매핑 Dictionary
        static readonly Dictionary<string, string> FluidDbToConval = new Dictionary<string, string> {
            {"Gas", "Gaseous"},
            {"Steam", "Vaporous"}
        };

        // SelectedValveSize 매핑 Dictionary
        static readonly Dictionary<string, string> SelectedValveSizeDbToConval = new Dictionary<string, string> {
            {"A", "1/2\""},
            {"B", "3/4\""},
            {"C", "1\""},
            {"D", "1 1/4\""},
            {"E", "1 1/2\""},
            {"F", "2\""},
            {"G", "2 1/2\""},
            {"H", "3\""},
            {"I", "4\""},
            {"J", "5\""},
            {"K", "6\""},
            {"L", "8\""},
            {"M", "10\""},
            {"N", "12\""},
            {"O", "14\""},
            {"P", "16\""},
            {"Q", "18\""},
            {"R", "20\""},
            {"S", "22\""},
            {"T", "24\""},
            {"U", "26\""},
            {"V", "28\""},
            {"W", "30\""},
            {"X", "32\""},
            {"Y", "36\""},
        };

        // PressureClass 매핑 Dictionary
        static readonly Dictionary<string, string> PressureClassDbToConval = new Dictionary<string, string> {
            {"B", "class 150"},
            {"1", "class 150"},
            {"I", "class 150"},
            {"D", "class 300"},
            {"2", "class 300"},
            {"J", "class 300"},
            {"E", "class 600"},
            {"3", "class 600"},
            {"K", "class 600"},
            {"F", "class 900"},
            {"4", "class 900"},
            {"L", "class 900"},
            {"G", "class 1500"},
            {"5", "class 1500"},
            {"M", "class 1500"},
            {"6", "class 2500"},
            {"8", "class 4500"}
        };

        public ConvalController()
        {
            // 설정 파일에서 연결 문자열 읽기
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .Build();
            
            connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // EstimateRequest에서 고객 데이터 조회
        [HttpGet]
        [Route("customer-data/{estimateNo}/{sheetId}")]
        public IActionResult GetCustomerData(string estimateNo, int sheetId = 1)
        {
            try
            {
                var (success, customerData, errorMessage) = GetEstimateRequestData(estimateNo, sheetId);
                
                if (!success)
                {
                    return BadRequest(new { error = errorMessage });
                }
                
                // 데이터베이스에서 실제 데이터를 찾았을 때만 성공
                if (customerData.Count == 0)
                {
                    return BadRequest(new { error = $"견적번호 '{estimateNo}'에 해당하는 고객 데이터를 찾을 수 없습니다." });
                }
                
                // 데이터베이스에서 가져온 실제 데이터와 기본값을 조합 (운전조건 필드 포함)
                var result = new Dictionary<string, object>
                {
                    ["EstimateNo"] = customerData.GetValueOrDefault("EstimateNo", estimateNo),
                    ["CustomerName"] = GetValueOrDash(customerData.GetValueOrDefault("CustomerName", null)),
                    ["Engineer"] = GetValueOrDash(customerData.GetValueOrDefault("Engineer", null)),
                    ["Medium"] = GetValueOrDash(customerData.GetValueOrDefault("Medium", null)),
                    ["Fluid"] = GetValueOrDash(customerData.GetValueOrDefault("Fluid", null)),
                    ["Density"] = GetValueOrDash(customerData.GetValueOrDefault("Density", null)),
                    ["DensityUnit"] = GetValueOrDash(customerData.GetValueOrDefault("DensityUnit", null)),
                    ["Molecular"] = GetValueOrDash(customerData.GetValueOrDefault("MolecularWeight", customerData.GetValueOrDefault("Molecular", null))),
                    ["MolecularWeightUnit"] = GetValueOrDash(customerData.GetValueOrDefault("MolecularWeightUnit", null)),

                    // t1 (Inlet Temperature)
                    ["TemperatureUnit"] = GetValueOrDash(customerData.GetValueOrDefault("TemperatureUnit", null)),
                    ["InletTemperatureQ"] = customerData.GetValueOrDefault("InletTemperatureQ", null) ?? "",
                    ["InletTemperatureNorQ"] = customerData.GetValueOrDefault("InletTemperatureNorQ", null) ?? "",
                    ["InletTemperatureMinQ"] = customerData.GetValueOrDefault("InletTemperatureMinQ", null) ?? "",

                    // p1 (Inlet Pressure)
                    ["PressureUnit"] = GetValueOrDash(customerData.GetValueOrDefault("PressureUnit", null)),
                    ["InletPressureMaxQ"] = customerData.GetValueOrDefault("InletPressureMaxQ", null) ?? "",
                    ["InletPressureNorQ"] = customerData.GetValueOrDefault("InletPressureNorQ", null) ?? "",
                    ["InletPressureMinQ"] = customerData.GetValueOrDefault("InletPressureMinQ", null) ?? "",

                    // p2 (Outlet Pressure)
                    ["OutletPressureMaxQ"] = customerData.GetValueOrDefault("OutletPressureMaxQ", null) ?? "",
                    ["OutletPressureNorQ"] = customerData.GetValueOrDefault("OutletPressureNorQ", null) ?? "",
                    ["OutletPressureMinQ"] = customerData.GetValueOrDefault("OutletPressureMinQ", null) ?? "",

                    // Δp (Differential Pressure)
                    ["DifferentialPressureMaxQ"] = customerData.GetValueOrDefault("DifferentialPressureMaxQ", null) ?? "",
                    ["DifferentialPressureNorQ"] = customerData.GetValueOrDefault("DifferentialPressureNorQ", null) ?? "",
                    ["DifferentialPressureMinQ"] = customerData.GetValueOrDefault("DifferentialPressureMinQ", null) ?? "",

                    // qm / qn
                    ["QMUnit"] = GetValueOrDash(customerData.GetValueOrDefault("QMUnit", null)),
                    ["QMMax"] = customerData.GetValueOrDefault("QMMax", null) ?? "",
                    ["QMNor"] = customerData.GetValueOrDefault("QMNor", null) ?? "",
                    ["QMMin"] = customerData.GetValueOrDefault("QMMin", null) ?? "",
                    ["QNUnit"] = GetValueOrDash(customerData.GetValueOrDefault("QNUnit", null)),
                    ["QNMax"] = customerData.GetValueOrDefault("QNMax", null) ?? "",
                    ["QNNor"] = customerData.GetValueOrDefault("QNNor", null) ?? "",
                    ["QNMin"] = customerData.GetValueOrDefault("QNMin", null) ?? "",

                    // BODY
                    ["ValveType"] = GetValueOrDash(customerData.GetValueOrDefault("ValveTypeName", customerData.GetValueOrDefault("ValveType", null))),
                    ["BodySize"] = GetValueOrDash(customerData.GetValueOrDefault("BodySizeName", customerData.GetValueOrDefault("BodySize", null))),
                    ["BodySizeUnit"] = GetValueOrDash(customerData.GetValueOrDefault("BodySizeUnit", null)),
                    ["BodyMat"] = GetValueOrDash(customerData.GetValueOrDefault("BodyMatName", customerData.GetValueOrDefault("BodyMat", null))),
                    ["TrimMat"] = GetValueOrDash(customerData.GetValueOrDefault("TrimMatName", customerData.GetValueOrDefault("TrimMat", null))),
                    ["TrimOption"] = GetValueOrDash(customerData.GetValueOrDefault("TrimOptionName", customerData.GetValueOrDefault("TrimOption", null))),
                    ["BodyRating"] = GetValueOrDash(customerData.GetValueOrDefault("BodyRatingName", customerData.GetValueOrDefault("BodyRating", null))),
                    ["BodyRatingUnit"] = GetValueOrDash(customerData.GetValueOrDefault("BodyRatingUnit", null)),

                    // ACTUATOR
                    ["ActType"] = GetValueOrDash(customerData.GetValueOrDefault("ActType", null)),
                    ["IsHW"] = customerData.GetValueOrDefault("IsHW", null),

                    // ACCESSORY
                    ["IsPositioner"] = customerData.GetValueOrDefault("IsPositioner", null),
                    ["PositionerType"] = GetValueOrDash(customerData.GetValueOrDefault("PositionerType", null)),
                    ["ExplosionProof"] = GetValueOrDash(customerData.GetValueOrDefault("ExplosionProof", null)),
                    ["TransmitterType"] = GetValueOrDash(customerData.GetValueOrDefault("TransmitterType", null)),
                    ["IsSolenoid"] = customerData.GetValueOrDefault("IsSolenoid", null),
                    ["IsLimSwitch"] = customerData.GetValueOrDefault("IsLimSwitch", null),
                    ["IsAirSet"] = customerData.GetValueOrDefault("IsAirSet", null),
                    ["IsVolumeBooster"] = customerData.GetValueOrDefault("IsVolumeBooster", null),
                    ["IsAirOperated"] = customerData.GetValueOrDefault("IsAirOperated", null),
                    ["IsLockUp"] = customerData.GetValueOrDefault("IsLockUp", null),
                    ["IsSnapActingRelay"] = customerData.GetValueOrDefault("IsSnapActingRelay", null)
                };
                
                // 플래그 추가 (존재하면 포함)
                if (customerData.ContainsKey("IsQM")) result["IsQM"] = customerData["IsQM"];
                if (customerData.ContainsKey("IsP2")) result["IsP2"] = customerData["IsP2"];
                if (customerData.ContainsKey("IsDensity")) result["IsDensity"] = customerData["IsDensity"];

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DataSheetLv3에서 CONVAL 데이터 조회
        [HttpGet]
        [Route("conval-data/{estimateNo}/{sheetId}")]
        public IActionResult GetConvalData(string estimateNo, int sheetId)
        {
            try
            {
                var (success, convalData, errorMessage) = GetConvalRowByFileName(estimateNo, sheetId);
                
                if (!success)
                {
                    return BadRequest(new { error = errorMessage });
                }
                
                // 데이터베이스에서 실제 데이터를 찾았을 때만 성공
                if (convalData.Count == 0)
                {
                    return BadRequest(new { error = $"견적번호 '{estimateNo}', 시트ID '{sheetId}'에 해당하는 CONVAL 데이터를 찾을 수 없습니다." });
                }
                
                // 데이터베이스에서 가져온 실제 데이터와 기본값을 조합
                var result = new Dictionary<string, object>
                {
                    ["TempEstimateNo"] = convalData.GetValueOrDefault("TempEstimateNo", estimateNo),
                    ["SheetID"] = convalData.GetValueOrDefault("SheetID", sheetId),
                    ["Medium"] = GetValueOrDash(convalData.GetValueOrDefault("Medium", null)),
                    ["Fluid"] = GetValueOrDash(convalData.GetValueOrDefault("Fluid", null)),
                    ["Density"] = GetValueOrDash(convalData.GetValueOrDefault("Density", null)),
                    ["Molecular"] = GetValueOrDash(convalData.GetValueOrDefault("MolecularWeight", convalData.GetValueOrDefault("Molecular", null))),
                    ["DensityUnit"] = GetValueOrDash(convalData.GetValueOrDefault("DensityUnit", null)),
                    ["MolecularWeightUnit"] = GetValueOrDash(convalData.GetValueOrDefault("MolecularWeightUnit", null)),

                    ["t1Max"] = GetValueOrDash(convalData.GetValueOrDefault("InletTemperatureQ", null)),
                    ["t1Normal"] = GetValueOrDash(convalData.GetValueOrDefault("InletTemperatureNorQ", null)),
                    ["t1Min"] = GetValueOrDash(convalData.GetValueOrDefault("InletTemperatureMinQ", null)),
                    ["t1Unit"] = GetValueOrDash(convalData.GetValueOrDefault("TemperatureUnit", null)),

                    ["p1Max"] = GetValueOrDash(convalData.GetValueOrDefault("InletPressureMaxQ", null)),
                    ["p1Normal"] = GetValueOrDash(convalData.GetValueOrDefault("InletPressureNorQ", null)),
                    ["p1Min"] = GetValueOrDash(convalData.GetValueOrDefault("InletPressureMinQ", null)),

                    ["p2Max"] = GetValueOrDash(convalData.GetValueOrDefault("OutletPressureMaxQ", null)),
                    ["p2Normal"] = GetValueOrDash(convalData.GetValueOrDefault("OutletPressureNorQ", null)),
                    ["p2Min"] = GetValueOrDash(convalData.GetValueOrDefault("OutletPressureMinQ", null)),

                    ["dpMax"] = GetValueOrDash(convalData.GetValueOrDefault("DifferentialPressureMaxQ", null)),
                    ["dpNormal"] = GetValueOrDash(convalData.GetValueOrDefault("DifferentialPressureNorQ", null)),
                    ["dpMin"] = GetValueOrDash(convalData.GetValueOrDefault("DifferentialPressureMinQ", null)),
                    ["PressureUnit"] = GetValueOrDash(convalData.GetValueOrDefault("PressureUnit", null)),

                    ["CVMax"] = GetValueOrDash(convalData.GetValueOrDefault("CalculatedCvMaxQ", null)),
                    ["CVNormal"] = GetValueOrDash(convalData.GetValueOrDefault("CalculatedCvNorQ", null)),
                    ["CVMin"] = GetValueOrDash(convalData.GetValueOrDefault("CalculatedCvMinQ", null)),
                    ["CVUnit"] = GetValueOrDash(convalData.GetValueOrDefault("CalculatedCvUnit", null)),

                    ["qmMax"] = GetValueOrDash(convalData.GetValueOrDefault("QMMax", null)),
                    ["qmNormal"] = GetValueOrDash(convalData.GetValueOrDefault("QMNor", null)),
                    ["qmMin"] = GetValueOrDash(convalData.GetValueOrDefault("QMMin", null)),
                    ["qmUnit"] = GetValueOrDash(convalData.GetValueOrDefault("QMUnit", null)),

                    ["qnMax"] = GetValueOrDash(convalData.GetValueOrDefault("QNMax", null)),
                    ["qnNormal"] = GetValueOrDash(convalData.GetValueOrDefault("QNNor", null)),
                    ["qnMin"] = GetValueOrDash(convalData.GetValueOrDefault("QNMin", null)),
                    ["qnUnit"] = GetValueOrDash(convalData.GetValueOrDefault("QNUnit", null)),
                    ["SS100Max"] = GetValueOrDash(convalData.GetValueOrDefault("SS100Max", null)),
                    ["SS100Nor"] = GetValueOrDash(convalData.GetValueOrDefault("SS100Nor", null)),
                    ["SS100Min"] = GetValueOrDash(convalData.GetValueOrDefault("SS100Min", null)),
                    ["LpAeMax"] = GetValueOrDash(convalData.GetValueOrDefault("LpAeMax", null)),
                    ["LpAeNormal"] = GetValueOrDash(convalData.GetValueOrDefault("LpAeNor", null)),
                    ["LpAeMin"] = GetValueOrDash(convalData.GetValueOrDefault("LpAeMin", null)),

                    // 매핑 Dictionary를 사용한 변환
                    ["ValveType"] = MapValveType(GetValueOrDash(convalData.GetValueOrDefault("ValveType", null))),
                    ["Fluid"] = MapFluid(GetValueOrDash(convalData.GetValueOrDefault("Fluid", null))),
                    ["BodySize"] = MapSelectedValveSize(GetValueOrDash(convalData.GetValueOrDefault("BodySize", null))),
                    ["PressureClass"] = MapPressureClass(GetValueOrDash(convalData.GetValueOrDefault("Rating", null))),

                    ["PressureClassUnit"] = GetValueOrDash(convalData.GetValueOrDefault("PressureClassUnit", null)),
                    ["BodySizeUnit"] = GetValueOrDash(convalData.GetValueOrDefault("BodySizeUnit", null)),

                    ["CONVALTrim"] = GetValueOrDash(convalData.GetValueOrDefault("CONVALTrim", null)),
                    ["FlowDirection"] = GetValueOrDash(convalData.GetValueOrDefault("FlowDirection", null)),
                    ["ValvePerformClass"] = GetValueOrDash(convalData.GetValueOrDefault("ValvePerformClass", null)),
                    ["Protection"] = GetValueOrDash(convalData.GetValueOrDefault("Protection", null)),
                    ["BasicCharacter"] = GetValueOrDash(convalData.GetValueOrDefault("BasicCharacter", null)),
                    ["TheoreticalRangeability"] = GetValueOrDash(convalData.GetValueOrDefault("TheoreticalRangeability", null)),
                    ["FlowCoeff"] = GetValueOrDash(convalData.GetValueOrDefault("FlowCoeff", null)),
                    ["FlowCoeffUnit"] = GetValueOrDash(convalData.GetValueOrDefault("FlowCoeffUnit", null)),
                    ["NorFlowCoeff"] = GetValueOrDash(convalData.GetValueOrDefault("NorFlowCoeff", null)),
                    ["SizePressureClass"] = GetValueOrDash(convalData.GetValueOrDefault("SizePressureClass", null)),
                    ["SuggestedValveSize"] = GetValueOrDash(convalData.GetValueOrDefault("SuggestedValveSize", null)),

                    ["FluidP1Max"] = GetValueOrDash(convalData.GetValueOrDefault("FluidP1Max", null)),
                    ["FluidP1Nor"] = GetValueOrDash(convalData.GetValueOrDefault("FluidP1Nor", null)),
                    ["FluidP1Min"] = GetValueOrDash(convalData.GetValueOrDefault("FluidP1Min", null)),
                    ["FluidPUnit"] = GetValueOrDash(convalData.GetValueOrDefault("FluidPUnit", null)),

                    ["FluidP2Max"] = GetValueOrDash(convalData.GetValueOrDefault("FluidP2Max", null)),
                    ["FluidP2Nor"] = GetValueOrDash(convalData.GetValueOrDefault("FluidP2Nor", null)),
                    ["FluidP2Min"] = GetValueOrDash(convalData.GetValueOrDefault("FluidP2Min", null)),

                    ["FluidN1Max"] = GetValueOrDash(convalData.GetValueOrDefault("FluidN1Max", null)),
                    ["FluidN1Nor"] = GetValueOrDash(convalData.GetValueOrDefault("FluidN1Nor", null)),
                    ["FluidN1Min"] = GetValueOrDash(convalData.GetValueOrDefault("FluidN1Min", null)),
                    ["FluidN1Unit"] = GetValueOrDash(convalData.GetValueOrDefault("FluidN1Unit", null)),

                    ["FluidV1Max"] = GetValueOrDash(convalData.GetValueOrDefault("FluidV1Max", null)),
                    ["FluidV1Nor"] = GetValueOrDash(convalData.GetValueOrDefault("Fluidv1Nor", convalData.GetValueOrDefault("FluidV1Nor", null))),
                    ["FluidV1Min"] = GetValueOrDash(convalData.GetValueOrDefault("FluidV1Min", null)),
                    ["FluidV1Unit"] = GetValueOrDash(convalData.GetValueOrDefault("FluidV1Unit", null)),

                    ["FluidPV1Max"] = GetValueOrDash(convalData.GetValueOrDefault("FluidPV1Max", null)),
                    ["FluidPV1Nor"] = GetValueOrDash(convalData.GetValueOrDefault("FluidPV1Nor", null)),
                    ["FluidPV1Min"] = GetValueOrDash(convalData.GetValueOrDefault("FluidPV1Min", null)),
                    ["FluidPV1Unit"] = GetValueOrDash(convalData.GetValueOrDefault("FluidPV1Unit", null)),

                    ["FluidTV1Max"] = GetValueOrDash(convalData.GetValueOrDefault("FluidTV1Max", null)),
                    ["FluidTV1Nor"] = GetValueOrDash(convalData.GetValueOrDefault("FluidTV1Nor", null)),
                    ["FluidTV1Min"] = GetValueOrDash(convalData.GetValueOrDefault("FluidTV1Min", null)),
                    ["FluidTV1Unit"] = GetValueOrDash(convalData.GetValueOrDefault("FluidTV1Unit", null)),

                    ["FluidCF1Max"] = GetValueOrDash(convalData.GetValueOrDefault("FluidCF1Max", null)),
                    ["FluidCF1Nor"] = GetValueOrDash(convalData.GetValueOrDefault("FluidCF1Nor", null)),
                    ["FluidCF1Min"] = GetValueOrDash(convalData.GetValueOrDefault("FluidCF1Min", null)),
                    ["FluidCF1Unit"] = GetValueOrDash(convalData.GetValueOrDefault("FluidCF1Unit", null)),

                    ["FluidKMax"] = GetValueOrDash(convalData.GetValueOrDefault("FluidKMax", null)),
                    ["FluidKNor"] = GetValueOrDash(convalData.GetValueOrDefault("FluidKNor", null)),
                    ["FluidKMin"] = GetValueOrDash(convalData.GetValueOrDefault("FluidKMin", null)),

                    ["U1Max"] = GetValueOrDash(convalData.GetValueOrDefault("U1Max", null)),
                    ["U1Nor"] = GetValueOrDash(convalData.GetValueOrDefault("U1Nor", null)),
                    ["U1Min"] = GetValueOrDash(convalData.GetValueOrDefault("U1Min", null)),
                    ["U1Unit"] = GetValueOrDash(convalData.GetValueOrDefault("U1Unit", null)),
                    
                    ["U2Max"] = GetValueOrDash(convalData.GetValueOrDefault("U2Max", null)),
                    ["U2Nor"] = GetValueOrDash(convalData.GetValueOrDefault("U2Nor", null)),
                    ["U2Min"] = GetValueOrDash(convalData.GetValueOrDefault("U2Min", null)),
                    
                     // Warning 관련 필드들
                    ["WarningStateMax"] = GetValueOrDash(convalData.GetValueOrDefault("WarningStateMax", null)),
                    ["WarningStateNormal"] = GetValueOrDash(convalData.GetValueOrDefault("WarningStateNor", null)),
                    ["WarningStateMin"] = GetValueOrDash(convalData.GetValueOrDefault("WarningStateMin", null)),
                    ["WarningTypeMax"] = GetValueOrDash(convalData.GetValueOrDefault("WarningTypeMax", null)),
                    ["WarningTypeNormal"] = GetValueOrDash(convalData.GetValueOrDefault("WarningTypeNor", null)),
                    ["WarningTypeMin"] = GetValueOrDash(convalData.GetValueOrDefault("WarningTypeMin", null))
                };

                // 플래그 필드 포함 (있으면 그대로 전달)
                if (convalData.ContainsKey("IsQM")) result["IsQM"] = convalData["IsQM"];
                if (convalData.ContainsKey("IsP2")) result["IsP2"] = convalData["IsP2"];
                if (convalData.ContainsKey("IsDensity")) result["IsDensity"] = convalData["IsDensity"];
                if (convalData.ContainsKey("IsN1")) result["IsN1"] = convalData["IsN1"];
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // CONVAL 재계산 실행 (ConvalQueueProcessor 사용)
        // [HttpPost]
        // [Route("recalculate")]
        // public async Task<IActionResult> RecalculateConval([FromBody] RecalculateRequest request)
        // {
        //     try
        //     {
        //         // 데이터베이스에 업데이트된 데이터 저장
        //         if (request.ConvalData != null)
        //         {
        //             SaveConvalDataToDatabase(request.EstimateNo, request.SheetId, request.ConvalData);
        //         }
        //
        //         // 데이터베이스 기반 처리 신호를 큐에 추가
        //         convalProcessor.ProcessButtonClicked($"{request.EstimateNo}_{request.SheetId}");
        //
        //         // CONVAL 처리 시작 (비동기로 실행)
        //         _ = Task.Run(async () =>
        //         {
        //             try
        //             {
        //                 await convalProcessor.StartProcessingAsync();
        //             }
        //             catch (Exception ex)
        //             {
        //                 Console.WriteLine($"CONVAL 처리 중 오류: {ex.Message}");
        //             }
        //         });
        //
        //         // 즉시 상태 반환
        //         return Ok(new { 
        //             success = true, 
        //             message = "CONVAL 재계산이 큐에 추가되었습니다.",
        //             queueCount = convalProcessor.GetQueueCount(),
        //             isProcessing = convalProcessor.IsProcessing()
        //         });
        //     }
        //     catch (Exception ex)
        //     {
        //         return BadRequest(new { error = ex.Message });
        //     }
        // }

        // CONVAL 데이터를 데이터베이스에 저장
        private void SaveConvalDataToDatabase(string estimateNo, int sheetId, Dictionary<string, object> convalData)
        {
            try
            {
                // 전달받은 데이터 로깅 추가
                Console.WriteLine($"=== CONVAL 데이터 저장 시작 ===");
                Console.WriteLine($"견적번호: {estimateNo}, 시트ID: {sheetId}");
                Console.WriteLine($"전달받은 데이터 개수: {convalData.Count}");
                Console.WriteLine("=== 전달받은 키와 값 ===");
                
                foreach (var item in convalData)
                {
                    string valueStr = item.Value?.ToString() ?? "null";
                    Console.WriteLine($"키: {item.Key,-25} | 값: {valueStr}");
                }
                Console.WriteLine("=== 데이터 로깅 완료 ===");

                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    
                    // 기존 데이터 확인 (DataSheetLv3 테이블 사용)
                    string checkSql = "SELECT COUNT(*) FROM DataSheetLv3 WHERE TempEstimateNo = @TempEstimateNo AND SheetID = @SheetID";
                    using (var checkCommand = new MySqlCommand(checkSql, connection))
                    {
                        checkCommand.Parameters.AddWithValue("@TempEstimateNo", estimateNo);
                        checkCommand.Parameters.AddWithValue("@SheetID", sheetId);
                        int existingCount = Convert.ToInt32(checkCommand.ExecuteScalar());
                        
                        string sql;
                        if (existingCount > 0)
                        {
                            // UPDATE 쿼리 (DataSheetLv3 테이블의 실제 컬럼명 사용)
                            sql = @"
                                UPDATE DataSheetLv3 SET
                                    Medium = @Medium, Fluid = @Fluid, 
                                    IsQM = @IsQM,
                                    QMMax = @QMMax, QMNor = @QMNor, QMMin = @QMMin, QMUnit = @QMUnit,
                                    QNMax = @QNMax, QNNor = @QNNor, QNMin = @QNMin, QNUnit = @QNUnit,
                                    IsP2 = @IsP2, IsDensity = @IsDensity,
                                    InletPressureMaxQ = @InletPressureMaxQ, InletPressureNorQ = @InletPressureNorQ, InletPressureMinQ = @InletPressureMinQ, PressureUnit = @PressureUnit,
                                    OutletPressureMaxQ = @OutletPressureMaxQ, OutletPressureNorQ = @OutletPressureNorQ, OutletPressureMinQ = @OutletPressureMinQ,
                                    DifferentialPressureMaxQ = @DifferentialPressureMaxQ, DifferentialPressureNorQ = @DifferentialPressureNorQ, DifferentialPressureMinQ = @DifferentialPressureMinQ,
                                    InletTemperatureQ = @InletTemperatureQ, InletTemperatureNorQ = @InletTemperatureNorQ, InletTemperatureMinQ = @InletTemperatureMinQ, TemperatureUnit = @TemperatureUnit,
                                    Density = @Density, DensityUnit = @DensityUnit, MolecularWeight = @MolecularWeight, MolecularWeightUnit = @MolecularWeightUnit,
                                    CalculatedCvMaxQ = @CalculatedCvMaxQ, CalculatedCvNorQ = @CalculatedCvNorQ, CalculatedCvMinQ = @CalculatedCvMinQ, CalculatedCvUnit = @CalculatedCvUnit,
                                    SS100Max = @SS100Max, SS100Nor = @SS100Nor, SS100Min = @SS100Min,
                                    U1Max = @U1Max, U1Nor = @U1Nor, U1Min = @U1Min, U1Unit = @U1Unit,
                                    U2Max = @U2Max, U2Nor = @U2Nor, U2Min = @U2Min,
                                    LpAeMax = @LpAeMax, LpAeNor = @LpAeNor, LpAeMin = @LpAeMin,
                                    WarningStateMax = @WarningStateMax, WarningStateNor = @WarningStateNor, WarningStateMin = @WarningStateMin,
                                    WarningTypeMax = @WarningTypeMax, WarningTypeNor = @WarningTypeNor, WarningTypeMin = @WarningTypeMin,
                                    FluidP1Max = @FluidP1Max, FluidP1Nor = @FluidP1Nor, FluidP1Min = @FluidP1Min, FluidPUnit = @FluidPUnit,
                                    FluidP2Max = @FluidP2Max, FluidP2Nor = @FluidP2Nor, FluidP2Min = @FluidP2Min,
                                    IsN1 = @IsN1,
                                    FluidN1Max = @FluidN1Max, FluidN1Nor = @FluidN1Nor, FluidN1Min = @FluidN1Min, FluidN1Unit = @FluidN1Unit,
                                    FluidV1Max = @FluidV1Max, Fluidv1Nor = @Fluidv1Nor, FluidV1Min = @FluidV1Min, FluidV1Unit = @FluidV1Unit,
                                    FluidPV1Max = @FluidPV1Max, FluidPV1Nor = @FluidPV1Nor, FluidPV1Min = @FluidPV1Min, FluidPV1Unit = @FluidPV1Unit,
                                    FluidTV1Max = @FluidTV1Max, FluidTV1Nor = @FluidTV1Nor, FluidTV1Min = @FluidTV1Min, FluidTV1Unit = @FluidTV1Unit,
                                    FluidCF1Max = @FluidCF1Max, FluidCF1Nor = @FluidCF1Nor, FluidCF1Min = @FluidCF1Min, FluidCF1Unit = @FluidCF1Unit,
                                    ValveType = @ValveType, FlowDirection = @FlowDirection, ValvePerformClass = @ValvePerformClass,
                                    Protection = @Protection, BasicCharacter = @BasicCharacter, TheoreticalRangeability = @TheoreticalRangeability,
                                    FlowCoeff = @FlowCoeff, FlowCoeffUnit = @FlowCoeffUnit, NorFlowCoeff = @NorFlowCoeff, NorFlowCoeffUnit = @NorFlowCoeffUnit,
                                    Rating = @PressureClass, PressureClassUnit = @PressureClassUnit,
                                    BodySize = @BodySize, SizePressureClass = @SizePressureClass,
                                    SuggestedValveSize = @SuggestedValveSize,
                                    CONVALTrim = @CONVALTrim, FluidKMax = @FluidKMax, FluidKNor = @FluidKNor, FluidKMin
                                WHERE TempEstimateNo = @TempEstimateNo AND SheetID = @SheetID";
                        }
                        else
                        {
                            // INSERT 쿼리 (DataSheetLv3 테이블의 실제 컬럼명 사용)
                            sql = @"
                                INSERT INTO DataSheetLv3 (
                                    TempEstimateNo, SheetID, Medium, Fluid, 
                                    IsQM,
                                    QMMax, QMNor, QMMin, QMUnit,
                                    QNMax, QNNor, QNMin, QNUnit,
                                    IsP2, IsDensity,
                                    InletPressureMaxQ, InletPressureNorQ, InletPressureMinQ, PressureUnit,
                                    OutletPressureMaxQ, OutletPressureNorQ, OutletPressureMinQ,
                                    DifferentialPressureMaxQ, DifferentialPressureNorQ, DifferentialPressureMinQ,
                                    InletTemperatureQ, InletTemperatureNorQ, InletTemperatureMinQ, TemperatureUnit,
                                    Density, DensityUnit, MolecularWeight, MolecularWeightUnit,
                                    CalculatedCvMaxQ, CalculatedCvNorQ, CalculatedCvMinQ, CalculatedCvUnit,
                                    SS100Max, SS100Nor, SS100Min,
                                    U1Max, U1Nor, U1Min, U1Unit,
                                    U2Max, U2Nor, U2Min,
                                    LpAeMax, LpAeNor, LpAeMin,
                                    WarningStateMax, WarningStateNor, WarningStateMin,
                                    WarningTypeMax, WarningTypeNor, WarningTypeMin,
                                    FluidP1Max, FluidP1Nor, FluidP1Min, FluidPUnit,
                                    FluidP2Max, FluidP2Nor, FluidP2Min,
                                    IsN1,
                                    FluidN1Max, FluidN1Nor, FluidN1Min, FluidN1Unit,
                                    FluidV1Max, Fluidv1Nor, FluidV1Min, FluidV1Unit,
                                    FluidPV1Max, FluidPV1Nor, FluidPV1Min, FluidPV1Unit,
                                    FluidTV1Max, FluidTV1Nor, FluidTV1Min, FluidTV1Unit,
                                    FluidCF1Max, FluidCF1Nor, FluidCF1Min, FluidCF1Unit,
                                    ValveType, FlowDirection, ValvePerformClass,
                                    Protection, BasicCharacter, TheoreticalRangeability,
                                    FlowCoeff, FlowCoeffUnit, NorFlowCoeff, NorFlowCoeffUnit,
                                    Rating, PressureClassUnit,
                                    BodySize, SizePressureClass,
                                    SuggestedValveSize,
                                    CONVALTrim, FluidKMax, FluidKNor, FluidKMin
                                ) VALUES (
                                    @TempEstimateNo, @SheetID, @Medium, @Fluid, 
                                    @IsQM,
                                    @QMMax, @QMNor, @QMMin, @QMUnit,
                                    @QNMax, @QNNor, @QNMin, @QNUnit,
                                    @IsP2, @IsDensity,
                                    @InletPressureMaxQ, @InletPressureNorQ, @InletPressureMinQ, @PressureUnit,
                                    @OutletPressureMaxQ, @OutletPressureNorQ, @OutletPressureMinQ,
                                    @DifferentialPressureMaxQ, @DifferentialPressureNorQ, @DifferentialPressureMinQ,
                                    @InletTemperatureQ, @InletTemperatureNorQ, @InletTemperatureMinQ, @TemperatureUnit,
                                    @Density, @DensityUnit, @MolecularWeight, @MolecularWeightUnit,
                                    @CalculatedCvMaxQ, @CalculatedCvNorQ, @CalculatedCvMinQ, @CalculatedCvUnit,
                                    @SS100Max, @SS100Nor, @SS100Min,
                                    @U1Max, @U1Nor, @U1Min, @U1Unit,
                                    @U2Max, @U2Nor, @U2Min,
                                    @LpAeMax, @LpAeNor, @LpAeMin,
                                    @WarningStateMax, @WarningStateNor, @WarningStateMin,
                                    @WarningTypeMax, @WarningTypeNor, @WarningTypeMin,
                                    @FluidP1Max, @FluidP1Nor, @FluidP1Min, @FluidPUnit,
                                    @FluidP2Max, @FluidP2Nor, @FluidP2Min,
                                    @IsN1,
                                    @FluidN1Max, @FluidN1Nor, @FluidN1Min, @FluidN1Unit,
                                    @FluidV1Max, @Fluidv1Nor, @FluidV1Min, @FluidV1Unit,
                                    @FluidPV1Max, @FluidPV1Nor, @FluidPV1Min, @FluidPV1Unit,
                                    @FluidTV1Max, @FluidTV1Nor, @FluidTV1Min, @FluidTV1Unit,
                                    @FluidCF1Max, @FluidCF1Nor, @FluidCF1Min, @FluidCF1Unit,
                                    @ValveType, @FlowDirection, @ValvePerformClass,
                                    @Protection, @BasicCharacter, @TheoreticalRangeability,
                                    @FlowCoeff, @FlowCoeffUnit, @NorFlowCoeff, @NorFlowCoeffUnit,
                                    @PressureClass, @PressureClassUnit,
                                    @BodySize, @SizePressureClass,
                                    @SuggestedValveSize,
                                    @CONVALTrim, @FluidKMax, @FluidKNor, @FluidKMin
                                )";
                        }
                        
                        using (var command = new MySqlCommand(sql, connection))
                        {
                            command.Parameters.AddWithValue("@TempEstimateNo", estimateNo);
                            command.Parameters.AddWithValue("@SheetID", sheetId);
                            
                            // CONVAL 데이터를 파라미터에 매핑 (매핑된 텍스트를 원래 코드로 변환)
                            foreach (var item in convalData)
                            {
                                string paramName = "@" + item.Key;
                                if (command.Parameters.Contains(paramName))
                                {
                                    object value = item.Value ?? DBNull.Value;
                                    
                                    // 매핑된 텍스트를 원래 코드로 변환
                                    if (value != DBNull.Value && value is string stringValue)
                                    {
                                        switch (item.Key)
                                        {
                                            case "ValveType":
                                                value = ReverseMapValveType(stringValue);
                                                break;
                                            case "Fluid":
                                                value = ReverseMapFluid(stringValue);
                                                break;
                                            case "BodySize":
                                                value = ReverseMapSelectedValveSize(stringValue);
                                                break;
                                            case "PressureClass":
                                                value = ReverseMapPressureClass(stringValue);
                                                break;
                                        }
                                    }
                                    
                                    command.Parameters[paramName].Value = value;
                                }
                            }

                            // 토글에서 유도되는 플래그 파라미터 보완 (누락 시에도 값 세팅)
                            object GetDict(string key)
                                => convalData.TryGetValue(key, out var v) ? v : null;

                            bool? BoolFrom(object raw)
                            {
                                if (raw == null) return null;
                                if (raw is bool b) return b;
                                var s = raw.ToString();
                                if (bool.TryParse(s, out var pb)) return pb;
                                if (int.TryParse(s, out var pi)) return pi != 0;
                                return null;
                            }

                            // IsQM
                            var isQm = BoolFrom(GetDict("IsQM"));
                            if (isQm == null)
                            {
                                var sft = GetDict("selectedFlowType")?.ToString();
                                if (!string.IsNullOrEmpty(sft)) isQm = string.Equals(sft, "qm", StringComparison.OrdinalIgnoreCase);
                            }
                            if (!command.Parameters.Contains("@IsQM")) command.Parameters.Add("@IsQM", MySqlDbType.Bit);
                            command.Parameters["@IsQM"].Value = isQm.HasValue ? (object)isQm.Value : DBNull.Value;

                            // IsP2
                            var isP2 = BoolFrom(GetDict("IsP2"));
                            if (isP2 == null)
                            {
                                var spt = GetDict("selectedPressureType")?.ToString();
                                if (!string.IsNullOrEmpty(spt)) isP2 = string.Equals(spt, "p2", StringComparison.OrdinalIgnoreCase);
                            }
                            if (!command.Parameters.Contains("@IsP2")) command.Parameters.Add("@IsP2", MySqlDbType.Bit);
                            command.Parameters["@IsP2"].Value = isP2.HasValue ? (object)isP2.Value : DBNull.Value;

                            // IsDensity
                            var isDensity = BoolFrom(GetDict("IsDensity"));
                            if (isDensity == null)
                            {
                                var smt = GetDict("selectedMassType")?.ToString();
                                if (!string.IsNullOrEmpty(smt)) isDensity = string.Equals(smt, "density", StringComparison.OrdinalIgnoreCase);
                            }
                            if (!command.Parameters.Contains("@IsDensity")) command.Parameters.Add("@IsDensity", MySqlDbType.Bit);
                            command.Parameters["@IsDensity"].Value = isDensity.HasValue ? (object)isDensity.Value : DBNull.Value;

                            // IsN1
                            var isN1 = BoolFrom(GetDict("IsN1"));
                            if (isN1 == null)
                            {
                                var sft2 = GetDict("selectedFluidType")?.ToString();
                                if (!string.IsNullOrEmpty(sft2)) isN1 = string.Equals(sft2, "n1", StringComparison.OrdinalIgnoreCase);
                            }
                            if (!command.Parameters.Contains("@IsN1")) command.Parameters.Add("@IsN1", MySqlDbType.Bit);
                            command.Parameters["@IsN1"].Value = isN1.HasValue ? (object)isN1.Value : DBNull.Value;
                            
                            command.ExecuteNonQuery();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // 데이터베이스 저장 실패 처리
                Console.WriteLine($"CONVAL 데이터 저장 실패: {ex.Message}");
            }
        }

        // 처리 상태 조회
        // [HttpGet]
        // [Route("status")]
        // public IActionResult GetStatus()
        // {
        //     return Ok(new
        //     {
        //         isProcessing = convalProcessor.IsProcessing(),
        //         queueCount = convalProcessor.GetQueueCount(),
        //         successCount = convalProcessor.GetSuccessCount(),
        //         errorCount = convalProcessor.GetErrorCount()
        //     });
        // }

        // 결과 파일 경로 계산 메서드 (IIS Express 경로 사용)
        private string GetResultsPath()
        {
            // ConvalQueueProcessor에서 파일을 저장하는 실제 경로 사용
            string resultPath = @"C:\inetpub\wwwroot\ConvalServiceApi\ConvalServiceApi\TestData\Results";
            
            Console.WriteLine($"[DEBUG] GetResultsPath - IIS Express 경로 사용: {resultPath}");
            Console.WriteLine($"[DEBUG] GetResultsPath - 디렉토리 존재 여부: {Directory.Exists(resultPath)}");
            
            return resultPath;
        }

        // PDF 파일 다운로드
        [HttpGet]
        [Route("download/pdf/{estimateNo}")]
        public IActionResult DownloadPdf(string estimateNo)
        {
            try
            {
                string resultPath = GetResultsPath();
                string pdfFile = Path.Combine(resultPath, $"{estimateNo}.pdf");
                
                // 디버깅용 로그 추가
                Console.WriteLine($"[DEBUG] PDF 다운로드 요청: {estimateNo}");
                Console.WriteLine($"[DEBUG] 계산된 결과 경로: {resultPath}");
                Console.WriteLine($"[DEBUG] PDF 파일 전체 경로: {pdfFile}");
                Console.WriteLine($"[DEBUG] 파일 존재 여부: {System.IO.File.Exists(pdfFile)}");
                
                if (!System.IO.File.Exists(pdfFile))
                {
                    return NotFound(new { 
                        error = $"PDF 파일을 찾을 수 없습니다: {estimateNo}.pdf",
                        debugInfo = new {
                            resultPath = resultPath,
                            pdfFile = pdfFile,
                            currentDirectory = Directory.GetCurrentDirectory()
                        }
                    });
                }
                
                var fileBytes = System.IO.File.ReadAllBytes(pdfFile);
                return File(fileBytes, "application/pdf", $"{estimateNo}.pdf");
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = $"PDF 파일 다운로드 실패: {ex.Message}" });
            }
        }

        // CCV 파일 다운로드
        [HttpGet]
        [Route("download/ccv/{estimateNo}")]
        public IActionResult DownloadCcv(string estimateNo)
        {
            try
            {
                // string resultPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "TestData", "Results");
                string resultPath = GetResultsPath();
                string ccvFile = Path.Combine(resultPath, $"{estimateNo}.ccv");
                
                if (!System.IO.File.Exists(ccvFile))
                {
                    return NotFound(new { error = $"CCV 파일을 찾을 수 없습니다: {estimateNo}.ccv" });
                }
                
                var fileBytes = System.IO.File.ReadAllBytes(ccvFile);
                return File(fileBytes, "application/octet-stream", $"{estimateNo}.ccv");
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = $"CCV 파일 다운로드 실패: {ex.Message}" });
            }
        }

        // 파일 존재 여부 확인
        [HttpGet]
        [Route("files/status/{estimateNo}")]
        public IActionResult GetFileStatus(string estimateNo)
        {
            try
            {
                string resultPath = GetResultsPath();
                string pdfFile = Path.Combine(resultPath, $"{estimateNo}.pdf");
                string ccvFile = Path.Combine(resultPath, $"{estimateNo}.ccv");
                
                return Ok(new
                {
                    estimateNo = estimateNo,
                    pdfExists = System.IO.File.Exists(pdfFile),
                    ccvExists = System.IO.File.Exists(ccvFile),
                    pdfPath = pdfFile,
                    ccvPath = ccvFile
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = $"파일 상태 확인 실패: {ex.Message}" });
            }
        }

        // 데이터베이스 연결 테스트
        [HttpGet]
        [Route("test-connection")]
        public IActionResult TestDatabaseConnection()
        {
            try
            {
                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    
                    // 테이블 존재 여부 확인
                    string[] tablesToCheck = { "EstimateRequest", "DataSheetLv3" };
                    var tableStatus = new Dictionary<string, bool>();
                    
                    foreach (var table in tablesToCheck)
                    {
                        try
                        {
                            string sql = $"SELECT COUNT(*) FROM {table} LIMIT 1";
                            using (var command = new MySqlCommand(sql, connection))
                            {
                                command.ExecuteScalar();
                                tableStatus[table] = true;
                            }
                        }
                        catch
                        {
                            tableStatus[table] = false;
                        }
                    }
                    
                    return Ok(new
                    {
                        success = true,
                        message = "데이터베이스 연결 성공",
                        connectionString = connectionString.Replace("Pwd=1234;", "Pwd=***;"), // 비밀번호 숨김
                        tables = tableStatus
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "데이터베이스 연결 실패",
                    error = ex.Message,
                    connectionString = connectionString.Replace("Pwd=1234;", "Pwd=***;") // 비밀번호 숨김
                });
            }
        }

        // EstimateRequest 테이블에서 고객 데이터 조회
        private (bool success, Dictionary<string, object> data, string errorMessage) GetEstimateRequestData(string estimateNo, int sheetId = 1)
        {
            var result = new Dictionary<string, object>();
            
            try
            {
                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    // TempEstimateNo로 조회하도록 수정
                    string sql = @"
                        SELECT 
                            er.*,
                            es.TempEstimateNo AS EstimateNo,
                            c.CompanyName AS CustomerName,
                            w.Name AS Engineer,
                            bvl.ValveSeries AS ValveTypeName,
                            bsl.BodySize AS BodySizeName,
                             bsl.UnitCode AS BodySizeUnit,
                             bml.BodyMat AS BodyMatName,
                             tml.TrimMat AS TrimMatName,
                             tol.TrimOptionName AS TrimOptionName,
                             brl.RatingName AS BodyRatingName,
                             atl.ActType AS ActTypeName
                        FROM EstimateRequest er
                        LEFT JOIN EstimateSheetLv1 es ON er.TempEstimateNo = es.TempEstimateNo
                        LEFT JOIN User c ON es.CustomerID = c.UserID
                        LEFT JOIN User w ON es.ManagerID = w.UserID
                        LEFT JOIN BodyValveList bvl ON er.ValveType = bvl.ValveSeriesCode
                        LEFT JOIN BodySizeList bsl ON er.BodySizeUnit = bsl.UnitCode AND er.BodySize = bsl.BodySizeCode
                        LEFT JOIN BodyMatList bml ON er.BodyMat = bml.BodyMatCode
                        LEFT JOIN TrimMatList tml ON er.TrimMat = tml.TrimMatCode
                        LEFT JOIN TrimOptionList tol ON er.TrimOption = tol.TrimOptionCode
                        LEFT JOIN BodyRatingList brl ON er.BodyRating = brl.RatingCode
                        LEFT JOIN ActTypeList atl ON er.ActType = atl.ActTypeCode
                        WHERE er.TempEstimateNo = @estimateNo AND er.SheetID = @SheetID
                        LIMIT 1";
                    using (var command = new MySqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@estimateNo", estimateNo);
                        command.Parameters.AddWithValue("@SheetID", sheetId);
                        using (var reader = command.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    string col = reader.GetName(i);
                                    object val = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                    result[col] = val;
                                }
                            }
                        }
                    }
                }
                
                return (true, result, "");
            }
            catch (Exception ex)
            {
                return (false, new Dictionary<string, object>(), $"데이터베이스 연결 실패: {ex.Message}");
            }
        }

        // TempEstimateNo로 입력값 row를 조회하여 Dictionary<string, object>로 반환
        private (bool success, Dictionary<string, object> data, string errorMessage) GetConvalRowByFileName(string estimateNo, int sheetId)
        {
            var result = new Dictionary<string, object>();
            try
            {
                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    // DataSheetLv3 테이블만 조회 (외래키 조인 제거)
                    string sql = @"
                        SELECT dsl3.*
                        FROM DataSheetLv3 dsl3
                        WHERE dsl3.TempEstimateNo = @estimateNo AND dsl3.SheetID = @SheetID
                        LIMIT 1";
                    using (var command = new MySqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@estimateNo", estimateNo);
                        command.Parameters.AddWithValue("@SheetID", sheetId);
                        using (var reader = command.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    string col = reader.GetName(i);
                                    object val = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                    result[col] = val;
                                }
                            }
                        }
                    }
                }
                
                return (true, result, "");
            }
            catch (Exception ex)
            {
                return (false, new Dictionary<string, object>(), $"데이터베이스 연결 실패: {ex.Message}");
            }
        }

        // NULL이나 빈 값을 공백으로 변환하는 헬퍼 메서드
        private string GetValueOrDash(object value)
        {
            return value?.ToString() ?? "";
        }

        // 매핑 헬퍼 메서드들
        private string MapValveType(object code)
        {
            if (code == null) return "";
            
            // 숫자 타입인 경우 문자열로 변환
            string codeStr = code.ToString();
            if (string.IsNullOrEmpty(codeStr)) return "";
            
            return ValveTypeDbToConval.TryGetValue(codeStr, out string mapped) ? mapped : codeStr;
        }

        private string MapFluid(string code)
        {
            if (string.IsNullOrEmpty(code)) return "";
            return FluidDbToConval.TryGetValue(code, out string mapped) ? mapped : code;
        }

        private string MapSelectedValveSize(string code)
        {
            if (string.IsNullOrEmpty(code)) return "";
            return SelectedValveSizeDbToConval.TryGetValue(code, out string mapped) ? mapped : code;
        }

        private string MapPressureClass(string code)
        {
            if (string.IsNullOrEmpty(code)) return "";
            return PressureClassDbToConval.TryGetValue(code, out string mapped) ? mapped : code;
        }

        // 역매핑 헬퍼 메서드들 (텍스트 → 코드)
        private string ReverseMapValveType(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            return ValveTypeDbToConval.FirstOrDefault(x => x.Value == text).Key ?? text;
        }

        private string ReverseMapFluid(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            return FluidDbToConval.FirstOrDefault(x => x.Value == text).Key ?? text;
        }

        private string ReverseMapSelectedValveSize(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            return SelectedValveSizeDbToConval.FirstOrDefault(x => x.Value == text).Key ?? text;
        }

        private string ReverseMapPressureClass(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            return PressureClassDbToConval.FirstOrDefault(x => x.Value == text).Key ?? text;
        }
    }

    public class RecalculateRequest
    {
        public string EstimateNo { get; set; } = "";
        public int SheetId { get; set; } = 1;
        public Dictionary<string, object> ConvalData { get; set; } = new Dictionary<string, object>();
    }
} 