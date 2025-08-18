using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Threading.Tasks;
using MySql.Data.MySqlClient;
using System.Web.Http; // Web API 컨트롤러라면 필요
using ConvalServiceApi.Models;
using System.Linq; // Added for FirstOrDefault
using System.Diagnostics;

namespace ConvalServiceApi.Controllers
{
    [RoutePrefix("api/conval")]
    public class ConvalRetryController : ApiController
    {
        // 싱글턴 또는 static으로 큐 프로세서 관리
        private static readonly ConvalQueueProcessor queueProcessor = new ConvalQueueProcessor();
        private readonly string connectionString = "Server=localhost;Database=pwd_final;Uid=root;";

        [HttpPost]
        [Route("retry")]
        public async Task<IHttpActionResult> RetryConval([FromBody] RetryRequestModel model)
        {
            Debug.WriteLine("[컨트롤러] 재호출 API 진입");
            Debug.WriteLine($"[컨트롤러] model null? { (model == null) }");
            if (model != null)
            {
                Debug.WriteLine($"[컨트롤러] 수신 파라미터 SomeParam={model.SomeParam}, SheetId={model.SheetId}, ConvalData.Count={ (model.ConvalData != null ? model.ConvalData.Count : 0) }");
            }

            // 1. ConvalData가 있으면 DB에 먼저 저장
            if (model?.ConvalData != null && !string.IsNullOrEmpty(model.SomeParam) && model.SheetId > 0)
            {
                Debug.WriteLine("[컨트롤러] DB 저장 시도");
                try
                {
                    SaveConvalDataToDatabase(model.SomeParam, model.SheetId, model.ConvalData);
                    Debug.WriteLine("[컨트롤러] DB 저장 완료");
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"[컨트롤러][오류] DB 저장 실패: {ex.Message}\n{ex}");
                }
            }
            else
            {
                Debug.WriteLine("[컨트롤러] DB 저장 조건 불충족 (ConvalData/SomeParam/SheetId 확인)");
            }

            // 2. 큐에 파일명(파라미터) 추가
            if (!string.IsNullOrEmpty(model?.SomeParam))
            {
                Debug.WriteLine("[컨트롤러] 큐에 추가 시도");
                try
                {
                    var sheet = model.SheetId > 0 ? model.SheetId : 1;
                    var workKey = $"{model.SomeParam}_{sheet}";
                    Debug.WriteLine($"[컨트롤러] 큐 키: {workKey}");
                    queueProcessor.ProcessButtonClicked(workKey);
                    Debug.WriteLine("[컨트롤러] 큐에 추가 완료");

                    // 3. 큐 처리 시작 (이미 처리 중이면 내부에서 무시)
                    Debug.WriteLine("[컨트롤러] 큐 처리 시작 호출");
                    await queueProcessor.StartProcessingAsync();
                    Debug.WriteLine("[컨트롤러] 큐 처리 시작 호출 완료");
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"[컨트롤러][오류] 큐 처리 중 예외: {ex.Message}\n{ex}");
                }
            }
            else
            {
                Debug.WriteLine("[컨트롤러] 큐 추가 생략: SomeParam 없음");
            }

            // 호출 시각과 전달받은 파라미터를 응답에 포함
            Debug.WriteLine("[컨트롤러] 응답 반환");
            return Ok(new {
                success = true,
                message = "Conval 재호출 완료",
                calledAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                receivedParam = model?.SomeParam
            });
        }

        // CONVAL 데이터를 데이터베이스에 저장
        private void SaveConvalDataToDatabase(string estimateNo, int sheetId, Dictionary<string, object> convalData)
        {
            try
            {
                // 전달받은 데이터 로깅 추가
                Debug.WriteLine($"=== CONVAL 데이터 저장 시작 ===");
                Debug.WriteLine($"견적번호: {estimateNo}, 시트ID: {sheetId}");
                Debug.WriteLine($"전달받은 데이터 개수: {convalData.Count}");
                Debug.WriteLine("=== 전달받은 키와 값 ===");
                
                foreach (var item in convalData)
                {
                    string valueStr = item.Value?.ToString() ?? "null";
                    Debug.WriteLine($"키: {item.Key,-25} | 값: {valueStr}");
                }
                Debug.WriteLine("=== 데이터 로깅 완료 ===");

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
                                    IsQM = @IsQM, IsP2 = @IsP2, IsDensity = @IsDensity, IsN1 = @IsN1,
                                    QMMax = @QMMax, QMNor = @QMNor, QMMin = @QMMin, QMUnit = @QMUnit,
                                    QNMax = @QNMax, QNNor = @QNNor, QNMin = @QNMin, QNUnit = @QNUnit,
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
                                    FluidN1Max = @FluidN1Max, FluidN1Nor = @FluidN1Nor, FluidN1Min = @FluidN1Min, FluidN1Unit = @FluidN1Unit,
                                    FluidV1Max = @FluidV1Max, Fluidv1Nor = @Fluidv1Nor, FluidV1Min = @FluidV1Min, FluidV1Unit = @FluidV1Unit,
                                    FluidPV1Max = @FluidPV1Max, FluidPV1Nor = @FluidPV1Nor, FluidPV1Min = @FluidPV1Min, FluidPV1Unit = @FluidPV1Unit,
                                    FluidTV1Max = @FluidTV1Max, FluidTV1Nor = @FluidTV1Nor, FluidTV1Min = @FluidTV1Min, FluidTV1Unit = @FluidTV1Unit,
                                    FluidCF1Max = @FluidCF1Max, FluidCF1Nor = @FluidCF1Nor, FluidCF1Min = @FluidCF1Min, FluidCF1Unit = @FluidCF1Unit,
                                    ValveType = @ValveType, FlowDirection = @FlowDirection, ValvePerformClass = @ValvePerformClass,
                                    Protection = @Protection, BasicCharacter = @BasicCharacter, TheoreticalRangeability = @TheoreticalRangeability,
                                    FlowCoeff = @FlowCoeff, FlowCoeffUnit = @FlowCoeffUnit, NorFlowCoeff = @NorFlowCoeff,
                                    Rating = @Rating,
                                    BodySize = @BodySize, SizePressureClass = @SizePressureClass,
                                    SuggestedValveSize = @SuggestedValveSize,
                                    CONVALTrim = @CONVALTrim, FluidKMax = @FluidKMax, FluidKNor = @FluidKNor, FluidKMin = @FluidKMin
                                WHERE TempEstimateNo = @TempEstimateNo AND SheetID = @SheetID";
                        }
                        else
                        {
                            // INSERT 쿼리 (DataSheetLv3 테이블의 실제 컬럼명 사용)
                            sql = @"
                                INSERT INTO DataSheetLv3 (
                                    TempEstimateNo, SheetID, Medium, Fluid, 
                                    IsQM, IsP2, IsDensity, IsN1,
                                    QMMax, QMNor, QMMin, QMUnit,
                                    QNMax, QNNor, QNMin, QNUnit,
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
                                    FluidN1Max, FluidN1Nor, FluidN1Min, FluidN1Unit,
                                    FluidV1Max, Fluidv1Nor, FluidV1Min, FluidV1Unit,
                                    FluidPV1Max, FluidPV1Nor, FluidPV1Min, FluidPV1Unit,
                                    FluidTV1Max, FluidTV1Nor, FluidTV1Min, FluidTV1Unit,
                                    FluidCF1Max, FluidCF1Nor, FluidCF1Min, FluidCF1Unit,
                                    ValveType, FlowDirection, ValvePerformClass,
                                    Protection, BasicCharacter, TheoreticalRangeability,
                                    FlowCoeff, FlowCoeffUnit, NorFlowCoeff,
                                    Rating,
                                    BodySize, SizePressureClass,
                                    SuggestedValveSize,
                                    ConvalTrim, FluidKMax, FluidKNor, FluidKMin
                                ) VALUES (
                                    @TempEstimateNo, @SheetID, @Medium, @Fluid, 
                                    @IsQM, @IsP2, @IsDensity, @IsN1,
                                    @QMMax, @QMNor, @QMMin, @QMUnit,
                                    @QNMax, @QNNor, @QNMin, @QNUnit,
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
                                    @FluidN1Max, @FluidN1Nor, @FluidN1Min, @FluidN1Unit,
                                    @FluidV1Max, @Fluidv1Nor, @FluidV1Min, @FluidV1Unit,
                                    @FluidPV1Max, @FluidPV1Nor, @FluidPV1Min, @FluidPV1Unit,
                                    @FluidTV1Max, @FluidTV1Nor, @FluidTV1Min, @FluidTV1Unit,
                                    @FluidCF1Max, @FluidCF1Nor, @FluidCF1Min, @FluidCF1Unit,
                                    @ValveType, @FlowDirection, @ValvePerformClass,
                                    @Protection, @BasicCharacter, @TheoreticalRangeability,
                                    @FlowCoeff, @FlowCoeffUnit, @NorFlowCoeff,
                                    @Rating,
                                    @BodySize, @SizePressureClass,
                                    @SuggestedValveSize,
                                    @CONVALTrim, @FluidKMax, @FluidKNor, @FluidKMin
                                )";
                        }
                        
                        using (var command = new MySqlCommand(sql, connection))
                        {
                            // 기본 파라미터 설정
                            command.Parameters.AddWithValue("@TempEstimateNo", estimateNo);
                            command.Parameters.AddWithValue("@SheetID", sheetId);
                            
                            // 프론트엔드 데이터를 SQL 파라미터에 매핑
                            MapFrontendDataToSqlParameters(command, convalData);
                            
                            // 디버깅용 로그
                            Debug.WriteLine($"[컨트롤러] SQL 실행 전 파라미터 개수: {command.Parameters.Count}");
                            
                            command.ExecuteNonQuery();
                            Debug.WriteLine("[컨트롤러] DB 저장 완료");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[컨트롤러][오류] SaveConvalDataToDatabase 실패: {ex.Message}\n{ex}");
                throw; // 예외를 다시 던져서 호출자에게 알림
            }
        }

        // 프론트엔드 데이터를 SQL 파라미터에 매핑하는 메서드
        private void MapFrontendDataToSqlParameters(MySqlCommand command, Dictionary<string, object> convalData)
        {
            // 프론트엔드 필드명을 SQL 파라미터명에 매핑
            var fieldMapping = new Dictionary<string, string>
            {
                // 기본 정보
                {"Medium", "@Medium"},
                {"Fluid", "@Fluid"},
                {"Density", "@Density"},
                {"DensityUnit", "@DensityUnit"},
                {"Molecular", "@MolecularWeight"},
                {"MolecularWeightUnit", "@MolecularWeightUnit"},
                
                // 토글 플래그들
                {"IsQM", "@IsQM"},
                {"IsP2", "@IsP2"},
                {"IsDensity", "@IsDensity"},
                {"IsN1", "@IsN1"},
                
                // 온도 (t1)
                {"t1Max", "@InletTemperatureQ"},
                {"t1Normal", "@InletTemperatureNorQ"},
                {"t1Min", "@InletTemperatureMinQ"},
                {"t1Unit", "@TemperatureUnit"},
                
                // 압력 (p1, p2, dp)
                {"p1Max", "@InletPressureMaxQ"},
                {"p1Normal", "@InletPressureNorQ"},
                {"p1Min", "@InletPressureMinQ"},
                {"p2Max", "@OutletPressureMaxQ"},
                {"p2Normal", "@OutletPressureNorQ"},
                {"p2Min", "@OutletPressureMinQ"},
                {"dpMax", "@DifferentialPressureMaxQ"},
                {"dpNormal", "@DifferentialPressureNorQ"},
                {"dpMin", "@DifferentialPressureMinQ"},
                {"PressureUnit", "@PressureUnit"},
                
                // CV
                {"CVMax", "@CalculatedCvMaxQ"},
                {"CVNormal", "@CalculatedCvNorQ"},
                {"CVMin", "@CalculatedCvMinQ"},
                {"CVUnit", "@CalculatedCvUnit"},
                
                // 유량 (qm, qn)
                {"qmMax", "@QMMax"},
                {"qmNormal", "@QMNor"},
                {"qmMin", "@QMMin"},
                {"qmUnit", "@QMUnit"},
                {"qnMax", "@QNMax"},
                {"qnNormal", "@QNNor"},
                {"qnMin", "@QNMin"},
                {"qnUnit", "@QNUnit"},
                
                // 기타 값들
                {"SS100Max", "@SS100Max"},
                {"SS100Nor", "@SS100Nor"},
                {"SS100Min", "@SS100Min"},
                {"LpAeMax", "@LpAeMax"},
                {"LpAeNormal", "@LpAeNor"},
                {"LpAeMin", "@LpAeMin"},
                {"WarningStateMax", "@WarningStateMax"},
                {"WarningStateNormal", "@WarningStateNor"},
                {"WarningStateMin", "@WarningStateMin"},
                {"WarningTypeMax", "@WarningTypeMax"},
                {"WarningTypeNormal", "@WarningTypeNor"},
                {"WarningTypeMin", "@WarningTypeMin"},
                
                // 밸브 구성
                {"ValveType", "@ValveType"},
                {"CONVALTrim", "@CONVALTrim"},
                {"FlowDirection", "@FlowDirection"},
                {"ValvePerformClass", "@ValvePerformClass"},
                {"Protection", "@Protection"},
                
                // 밸브 데이터
                {"BasicCharacter", "@BasicCharacter"},
                {"TheoreticalRangeability", "@TheoreticalRangeability"},
                {"FlowCoeff", "@FlowCoeff"},
                {"FlowCoeffUnit", "@FlowCoeffUnit"},
                {"NorFlowCoeff", "@NorFlowCoeff"},
                {"SizePressureClass", "@SizePressureClass"},
                {"SuggestedValveSize", "@SuggestedValveSize"},
                {"BodySize", "@BodySize"},
                {"PressureClass", "@Rating"},
                
                // 유체 작동 데이터
                {"FluidP1Max", "@FluidP1Max"},
                {"FluidP1Nor", "@FluidP1Nor"},
                {"FluidP1Min", "@FluidP1Min"},
                {"FluidPUnit", "@FluidPUnit"},
                {"FluidP2Max", "@FluidP2Max"},
                {"FluidP2Nor", "@FluidP2Nor"},
                {"FluidP2Min", "@FluidP2Min"},
                {"FluidN1Max", "@FluidN1Max"},
                {"FluidN1Nor", "@FluidN1Nor"},
                {"FluidN1Min", "@FluidN1Min"},
                {"FluidN1Unit", "@FluidN1Unit"},
                {"FluidV1Max", "@FluidV1Max"},
                {"FluidV1Nor", "@Fluidv1Nor"},
                {"FluidV1Min", "@FluidV1Min"},
                {"FluidV1Unit", "@FluidV1Unit"},
                {"FluidPV1Max", "@FluidPV1Max"},
                {"FluidPV1Nor", "@FluidPV1Nor"},
                {"FluidPV1Min", "@FluidPV1Min"},
                {"FluidPV1Unit", "@FluidPV1Unit"},
                {"FluidTV1Max", "@FluidTV1Max"},
                {"FluidTV1Nor", "@FluidTV1Nor"},
                {"FluidTV1Min", "@FluidTV1Min"},
                {"FluidTV1Unit", "@FluidTV1Unit"},
                {"FluidCF1Max", "@FluidCF1Max"},
                {"FluidCF1Nor", "@FluidCF1Nor"},
                {"FluidCF1Min", "@FluidCF1Min"},
                {"FluidCF1Unit", "@FluidCF1Unit"},
                {"FluidKMax", "@FluidKMax"},
                {"FluidKNor", "@FluidKNor"},
                {"FluidKMin", "@FluidKMin"},
                
                // 부하 의존 값들
                {"U1Max", "@U1Max"},
                {"U1Nor", "@U1Nor"},
                {"U1Min", "@U1Min"},
                {"U1Unit", "@U1Unit"},
                {"U2Max", "@U2Max"},
                {"U2Nor", "@U2Nor"},
                {"U2Min", "@U2Min"}
            };
            
            // SQL 파라미터를 먼저 추가
            foreach (var mapping in fieldMapping)
            {
                string sqlParam = mapping.Value;
                if (!command.Parameters.Contains(sqlParam))
                {
                    // BOOLEAN 타입 컬럼들은 Bit으로 설정
                    if (sqlParam == "@IsQM" || sqlParam == "@IsP2" || sqlParam == "@IsDensity" || sqlParam == "@IsN1")
                    {
                        command.Parameters.Add(sqlParam, MySqlDbType.Bit);
                    }
                    // DECIMAL 타입 컬럼들은 Decimal으로 설정
                    else if (sqlParam == "@QMMax" || sqlParam == "@QMNor" || sqlParam == "@QMMin" ||
                             sqlParam == "@QNMax" || sqlParam == "@QNNor" || sqlParam == "@QNMin" ||
                             sqlParam == "@InletPressureMaxQ" || sqlParam == "@InletPressureNorQ" || sqlParam == "@InletPressureMinQ" ||
                             sqlParam == "@OutletPressureMaxQ" || sqlParam == "@OutletPressureNorQ" || sqlParam == "@OutletPressureMinQ" ||
                             sqlParam == "@DifferentialPressureMaxQ" || sqlParam == "@DifferentialPressureNorQ" || sqlParam == "@DifferentialPressureMinQ" ||
                             sqlParam == "@InletTemperatureQ" || sqlParam == "@InletTemperatureNorQ" || sqlParam == "@InletTemperatureMinQ" ||
                             sqlParam == "@Density" || sqlParam == "@MolecularWeight" ||
                             sqlParam == "@CalculatedCvMaxQ" || sqlParam == "@CalculatedCvNorQ" || sqlParam == "@CalculatedCvMinQ" ||
                             sqlParam == "@SS100Max" || sqlParam == "@SS100Nor" || sqlParam == "@SS100Min" ||
                             sqlParam == "@U1Max" || sqlParam == "@U1Nor" || sqlParam == "@U1Min" ||
                             sqlParam == "@U2Max" || sqlParam == "@U2Nor" || sqlParam == "@U2Min" ||
                             sqlParam == "@LpAeMax" || sqlParam == "@LpAeNor" || sqlParam == "@LpAeMin" ||
                             sqlParam == "@FluidP1Max" || sqlParam == "@FluidP1Nor" || sqlParam == "@FluidP1Min" ||
                             sqlParam == "@FluidP2Max" || sqlParam == "@FluidP2Nor" || sqlParam == "@FluidP2Min" ||
                             sqlParam == "@FluidN1Max" || sqlParam == "@FluidN1Nor" || sqlParam == "@FluidN1Min" ||
                             sqlParam == "@FluidV1Max" || sqlParam == "@Fluidv1Nor" || sqlParam == "@FluidV1Min" ||
                             sqlParam == "@FluidPV1Max" || sqlParam == "@FluidPV1Nor" || sqlParam == "@FluidPV1Min" ||
                             sqlParam == "@FluidTV1Max" || sqlParam == "@FluidTV1Nor" || sqlParam == "@FluidTV1Min" ||
                             sqlParam == "@FluidCF1Max" || sqlParam == "@FluidCF1Nor" || sqlParam == "@FluidCF1Min" ||
                             sqlParam == "@FluidKMax" || sqlParam == "@FluidKNor" || sqlParam == "@FluidKMin" ||
                             sqlParam == "@TheoreticalRangeability" || sqlParam == "@FlowCoeff" || sqlParam == "@NorFlowCoeff" ||
                             sqlParam == "@SuggestedValveSize")
                    {
                        command.Parameters.Add(sqlParam, MySqlDbType.Decimal);
                    }
                    else
                    {
                        command.Parameters.Add(sqlParam, MySqlDbType.VarChar);
                    }
                }
            }
            
            // 누락된 파라미터 체크
            var missingParams = new List<string>();
            var extraDataKeys = new List<string>();
            
            // SQL 파라미터 목록 추출
            var sqlParams = command.Parameters.Cast<MySqlParameter>().Select(p => p.ParameterName.Replace("@", "")).ToList();
            var dataKeys = convalData.Keys.ToList();
            
            // 누락된 파라미터 찾기
            foreach (var mapping in fieldMapping)
            {
                string frontendKey = mapping.Key;
                string sqlParam = mapping.Value.Replace("@", "");
                
                if (!convalData.ContainsKey(frontendKey))
                {
                    missingParams.Add(sqlParam);
                }
            }
            
            // 추가 데이터 키 찾기
            var mappedFrontendKeys = fieldMapping.Keys.ToList();
            foreach (var dataKey in dataKeys)
            {
                if (!mappedFrontendKeys.Contains(dataKey))
                {
                    extraDataKeys.Add(dataKey);
                }
            }
            
            // 디버깅용 로그
            Debug.WriteLine($"[컨트롤러] 전달받은 데이터 키들: {string.Join(", ", dataKeys)}");
            Debug.WriteLine($"[컨트롤러] SQL 파라미터들: {string.Join(", ", sqlParams)}");
            Debug.WriteLine($"[컨트롤러] 누락된 파라미터: {string.Join(", ", missingParams)}");
            Debug.WriteLine($"[컨트롤러] 추가 데이터 키: {string.Join(", ", extraDataKeys)}");
            
            // 매핑된 필드들을 SQL 파라미터에 설정
            foreach (var mapping in fieldMapping)
            {
                string frontendKey = mapping.Key;
                string sqlParam = mapping.Value;
                
                if (convalData.ContainsKey(frontendKey))
                {
                    object value = convalData[frontendKey];
                    
                    // 매핑된 텍스트를 원래 코드로 변환 (필요한 경우)
                    if (value != null && value is string stringValue)
                    {
                        switch (frontendKey)
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
                    
                    // 빈 문자열을 NULL로 처리
                    if (value is string strValue && string.IsNullOrWhiteSpace(strValue))
                    {
                        value = DBNull.Value;
                    }
                    
                    command.Parameters[sqlParam].Value = value ?? DBNull.Value;
                }
                else
                {
                    // 프론트엔드에 없는 필드는 NULL로 설정
                    command.Parameters[sqlParam].Value = DBNull.Value;
                }
            }
        }

        // 매핑 헬퍼 메서드들
        private string MapValveType(string code)
        {
            if (string.IsNullOrEmpty(code)) return "";
            return ValveTypeDbToConval.TryGetValue(code, out string mapped) ? mapped : code;
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

        // 매핑 Dictionary들
        static readonly Dictionary<string, string> ValveTypeDbToConval = new Dictionary<string, string> {
            {"2", "Straight globe valve"},
            {"3", "Straight globe valve"},
            {"2-Way Conventional Ball", "Ball valve"},
            {"3-Way Conventional Ball", "Ball valve"},
            {"S", "Ball valve"},
            {"H", "Butterfly valve"},
            {"Std. Butterfly", "Butterfly valve"},
            {"4", "Angle globe valve"}
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
    }

    public class RetryRequestModel
    {
        public string SomeParam { get; set; }
        public int SheetId { get; set; }
        public Dictionary<string, object> ConvalData { get; set; }
        // 필요한 파라미터를 여기에 추가
    }
} 