using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

namespace  ConvalServiceApi.Models
{
    public class DatabaseHelper
    {
        private readonly string connectionString;

        public DatabaseHelper()
        {
            // 로컬 MySQL 연결 문자열 (비밀번호 없음)
            connectionString = "Server=localhost;Database=pwd_final;Uid=root;";
        }

        public bool TestConnection()
        {
            try
            {
                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    Console.WriteLine("데이터베이스 연결 성공!");
                    return true;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"데이터베이스 연결 실패: {ex.Message}");
                return false;
            }
        }

        public Dictionary<string, object> GetConvalRowByFileName(string estimateNo, int sheetId)
        {
            var result = new Dictionary<string, object>();
            
            try
            {
                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    
                    // DataSheetLv3 테이블에서 데이터 조회
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
            }
            catch (Exception ex)
            {
                Console.WriteLine($"데이터베이스 조회 실패: {ex.Message}");
            }
            
            return result;
        }

        public bool SaveConvalResults(string estimateNo, Dictionary<string, object> results, int sheetId)
        {
            try
            {
                using (var connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    
                    // 기존 데이터 확인
                    string checkSql = "SELECT COUNT(*) FROM DataSheetLv3 WHERE TempEstimateNo = @TempEstimateNo AND SheetID = @SheetID";
                    using (var checkCommand = new MySqlCommand(checkSql, connection))
                    {
                        checkCommand.Parameters.AddWithValue("@TempEstimateNo", estimateNo);
                        checkCommand.Parameters.AddWithValue("@SheetID", sheetId);
                        int existingCount = Convert.ToInt32(checkCommand.ExecuteScalar());
                        
                        string sql;
                        if (existingCount > 0)
                        {
                            // UPDATE 쿼리
                            sql = @"
                                UPDATE DataSheetLv3 SET
                                    Density = @Density, DensityUnit = @DensityUnit,
                                    MolecularWeight = @MolecularWeight, MolecularWeightUnit = @MolecularWeightUnit,
                                    OutletPressureMaxQ = @OutletPressureMaxQ, OutletPressureNorQ = @OutletPressureNorQ, OutletPressureMinQ = @OutletPressureMinQ,
                                    DifferentialPressureMaxQ = @DifferentialPressureMaxQ, DifferentialPressureNorQ = @DifferentialPressureNorQ, DifferentialPressureMinQ = @DifferentialPressureMinQ,
                                    QMMax = @QMMax, QMNor = @QMNor, QMMin = @QMMin,
                                    QNMax = @QNMax, QNNor = @QNNor, QNMin = @QNMin,
                                    CalculatedCvMaxQ = @CalculatedCvMaxQ, CalculatedCvNorQ = @CalculatedCvNorQ, CalculatedCvMinQ = @CalculatedCvMinQ,
                                    SS100Max = @SS100Max, SS100Nor = @SS100Nor, SS100Min = @SS100Min,
                                    LpAeMax = @LpAeMax, LpAeNor = @LpAeNor, LpAeMin = @LpAeMin,
                                    WarningStateMax = @WarningStateMax, WarningStateNor = @WarningStateNor, WarningStateMin = @WarningStateMin,
                                    WarningTypeMax = @WarningTypeMax, WarningTypeNor = @WarningTypeNor, WarningTypeMin = @WarningTypeMin,
                                    FlowCoeff = @FlowCoeff, SuggestedValveSize = @SuggestedValveSize,
                                    FluidP1Max = @FluidP1Max, FluidP1Nor = @FluidP1Nor, FluidP1Min = @FluidP1Min,
                                    FluidP2Max = @FluidP2Max, FluidP2Nor = @FluidP2Nor, FluidP2Min = @FluidP2Min,
                                    FluidN1Max = @FluidN1Max, FluidN1Nor = @FluidN1Nor, FluidN1Min = @FluidN1Min, FluidN1Unit = @FluidN1Unit,
                                    FluidV1Max = @FluidV1Max, FluidV1Nor = @FluidV1Nor, FluidV1Min = @FluidV1Min, FluidV1Unit = @FluidV1Unit,
                                    FluidPV1Max = @FluidPV1Max, FluidPV1Nor = @FluidPV1Nor, FluidPV1Min = @FluidPV1Min, FluidPV1Unit = @FluidPV1Unit,
                                    FluidTV1Max = @FluidTV1Max, FluidTV1Nor = @FluidTV1Nor, FluidTV1Min = @FluidTV1Min, FluidTV1Unit = @FluidTV1Unit,
                                    FluidKMax = @FluidKMax, FluidKNor = @FluidKNor, FluidKMin = @FluidKMin,
                                    U1Max = @U1Max, U1Nor = @U1Nor, U1Min = @U1Min,
                                    U2Max = @U2Max, U2Nor = @U2Nor, U2Min = @U2Min
                                WHERE TempEstimateNo = @TempEstimateNo AND SheetID = @SheetID";
                        }
                        else
                        {
                            // INSERT 쿼리
                            sql = @"
                                INSERT INTO DataSheetLv3 (
                                    TempEstimateNo, SheetID, Density, DensityUnit,
                                    MolecularWeight, MolecularWeightUnit,
                                    OutletPressureMaxQ, OutletPressureNorQ, OutletPressureMinQ,
                                    DifferentialPressureMaxQ, DifferentialPressureNorQ, DifferentialPressureMinQ,
                                    QMMax, QMNor, QMMin, QNMax, QNNor, QNMin,
                                    CalculatedCvMaxQ, CalculatedCvNorQ, CalculatedCvMinQ,
                                    SS100Max, SS100Nor, SS100Min,
                                    LpAeMax, LpAeNor, LpAeMin,
                                    WarningStateMax, WarningStateNor, WarningStateMin,
                                    WarningTypeMax, WarningTypeNor, WarningTypeMin,
                                    FlowCoeff, SuggestedValveSize,
                                    FluidP1Max, FluidP1Nor, FluidP1Min,
                                    FluidP2Max, FluidP2Nor, FluidP2Min,
                                    FluidN1Max, FluidN1Nor, FluidN1Min, FluidN1Unit,
                                    FluidV1Max, FluidV1Nor, FluidV1Min, FluidV1Unit,
                                    FluidPV1Max, FluidPV1Nor, FluidPV1Min, FluidPV1Unit,
                                    FluidTV1Max, FluidTV1Nor, FluidTV1Min, FluidTV1Unit,
                                    FluidKMax, FluidKNor, FluidKMin,
                                    U1Max, U1Nor, U1Min,
                                    U2Max, U2Nor, U2Min
                                ) VALUES (
                                    @TempEstimateNo, @SheetID, @Density, @DensityUnit,
                                    @MolecularWeight, @MolecularWeightUnit,
                                    @OutletPressureMaxQ, @OutletPressureNorQ, @OutletPressureMinQ,
                                    @DifferentialPressureMaxQ, @DifferentialPressureNorQ, @DifferentialPressureMinQ,
                                    @QMMax, @QMNor, @QMMin, @QNMax, @QNNor, @QNMin,
                                    @CalculatedCvMaxQ, @CalculatedCvNorQ, @CalculatedCvMinQ,
                                    @SS100Max, @SS100Nor, @SS100Min,
                                    @LpAeMax, @LpAeNor, @LpAeMin,
                                    @WarningStateMax, @WarningStateNor, @WarningStateMin,
                                    @WarningTypeMax, @WarningTypeNor, @WarningTypeMin,
                                    @FlowCoeff, @SuggestedValveSize,
                                    @FluidP1Max, @FluidP1Nor, @FluidP1Min,
                                    @FluidP2Max, @FluidP2Nor, @FluidP2Min,
                                    @FluidN1Max, @FluidN1Nor, @FluidN1Min, @FluidN1Unit,
                                    @FluidV1Max, @FluidV1Nor, @FluidV1Min, @FluidV1Unit,
                                    @FluidPV1Max, @FluidPV1Nor, @FluidPV1Min, @FluidPV1Unit,
                                    @FluidTV1Max, @FluidTV1Nor, @FluidTV1Min, @FluidTV1Unit,
                                    @FluidKMax, @FluidKNor, @FluidKMin,
                                    @U1Max, @U1Nor, @U1Min,
                                    @U2Max, @U2Nor, @U2Min
                                )";
                        }
                        
                        using (var command = new MySqlCommand(sql, connection))
                        {
                            Console.WriteLine($"[DB] SQL 쿼리: {sql}");
                            Console.WriteLine($"[DB] 기본 파라미터: TempEstimateNo={estimateNo}, SheetID={sheetId}");
                            
                            // 기본 파라미터 설정
                            command.Parameters.AddWithValue("@TempEstimateNo", estimateNo);
                            command.Parameters.AddWithValue("@SheetID", sheetId);
                            
                            // 모든 필요한 파라미터에 대해 기본값 설정
                            var allParameters = new Dictionary<string, object>
                            {
                                ["@Density"] = DBNull.Value,
                                ["@DensityUnit"] = DBNull.Value,
                                ["@MolecularWeight"] = DBNull.Value,
                                ["@MolecularWeightUnit"] = DBNull.Value,
                                ["@OutletPressureMaxQ"] = DBNull.Value,
                                ["@OutletPressureNorQ"] = DBNull.Value,
                                ["@OutletPressureMinQ"] = DBNull.Value,
                                ["@DifferentialPressureMaxQ"] = DBNull.Value,
                                ["@DifferentialPressureNorQ"] = DBNull.Value,
                                ["@DifferentialPressureMinQ"] = DBNull.Value,
                                ["@QMMax"] = DBNull.Value,
                                ["@QMNor"] = DBNull.Value,
                                ["@QMMin"] = DBNull.Value,
                                ["@QNMax"] = DBNull.Value,
                                ["@QNNor"] = DBNull.Value,
                                ["@QNMin"] = DBNull.Value,
                                ["@CalculatedCvMaxQ"] = DBNull.Value,
                                ["@CalculatedCvNorQ"] = DBNull.Value,
                                ["@CalculatedCvMinQ"] = DBNull.Value,
                                ["@SS100Max"] = DBNull.Value,
                                ["@SS100Nor"] = DBNull.Value,
                                ["@SS100Min"] = DBNull.Value,
                                ["@LpAeMax"] = DBNull.Value,
                                ["@LpAeNor"] = DBNull.Value,
                                ["@LpAeMin"] = DBNull.Value,
                                ["@WarningStateMax"] = DBNull.Value,
                                ["@WarningStateNor"] = DBNull.Value,
                                ["@WarningStateMin"] = DBNull.Value,
                                ["@WarningTypeMax"] = DBNull.Value,
                                ["@WarningTypeNor"] = DBNull.Value,
                                ["@WarningTypeMin"] = DBNull.Value,
                                ["@FlowCoeff"] = DBNull.Value,
                                ["@SuggestedValveSize"] = DBNull.Value,
                                ["@FluidP1Max"] = DBNull.Value,
                                ["@FluidP1Nor"] = DBNull.Value,
                                ["@FluidP1Min"] = DBNull.Value,
                                ["@FluidP2Max"] = DBNull.Value,
                                ["@FluidP2Nor"] = DBNull.Value,
                                ["@FluidP2Min"] = DBNull.Value,
                                ["@FluidN1Max"] = DBNull.Value,
                                ["@FluidN1Nor"] = DBNull.Value,
                                ["@FluidN1Min"] = DBNull.Value,
                                ["@FluidN1Unit"] = DBNull.Value,
                                ["@FluidV1Max"] = DBNull.Value,
                                ["@FluidV1Nor"] = DBNull.Value,
                                ["@FluidV1Min"] = DBNull.Value,
                                ["@FluidV1Unit"] = DBNull.Value,
                                ["@FluidPV1Max"] = DBNull.Value,
                                ["@FluidPV1Nor"] = DBNull.Value,
                                ["@FluidPV1Min"] = DBNull.Value,
                                ["@FluidPV1Unit"] = DBNull.Value,
                                ["@FluidTV1Max"] = DBNull.Value,
                                ["@FluidTV1Nor"] = DBNull.Value,
                                ["@FluidTV1Min"] = DBNull.Value,
                                ["@FluidTV1Unit"] = DBNull.Value,
                                ["@FluidKMax"] = DBNull.Value,
                                ["@FluidKNor"] = DBNull.Value,
                                ["@FluidKMin"] = DBNull.Value,
                                ["@U1Max"] = DBNull.Value,
                                ["@U1Nor"] = DBNull.Value,
                                ["@U1Min"] = DBNull.Value,
                                ["@U2Max"] = DBNull.Value,
                                ["@U2Nor"] = DBNull.Value,
                                ["@U2Min"] = DBNull.Value
                            };
                            
                            // 모든 파라미터를 명령에 추가
                            foreach (var param in allParameters)
                            {
                                command.Parameters.AddWithValue(param.Key, param.Value);
                            }
                            
                            // 결과 데이터를 파라미터에 매핑
                            Console.WriteLine($"[DB] 결과 데이터 매핑 시작, 총 {results.Count}개");
                            foreach (var item in results)
                            {
                                string paramName = "@" + item.Key;
                                if (command.Parameters.Contains(paramName))
                                {
                                    var value = item.Value ?? DBNull.Value;
                                    command.Parameters[paramName].Value = value;
                                    Console.WriteLine($"[DB] 파라미터 설정: {paramName} = {value} (타입: {value?.GetType().Name ?? "DBNull"})");
                                }
                                else
                                {
                                    Console.WriteLine($"[DB] 파라미터 없음: {paramName}");
                                }
                            }
                            
                            Console.WriteLine("[DB] SQL 실행 시작");
                            try
                            {
                                command.ExecuteNonQuery();
                                Console.WriteLine("[DB] SQL 실행 완료");
                            }
                            catch (Exception sqlEx)
                            {
                                Console.WriteLine($"[DB] SQL 실행 실패: {sqlEx.Message}");
                                Console.WriteLine($"[DB] SQL 실행 실패 타입: {sqlEx.GetType().FullName}");
                                if (sqlEx is MySql.Data.MySqlClient.MySqlException mysqlSqlEx)
                                {
                                    Console.WriteLine($"[DB] MySQL SQL 에러 코드: {mysqlSqlEx.Number}");
                                    Console.WriteLine($"[DB] MySQL SQL 에러 메시지: {mysqlSqlEx.Message}");
                                }
                                throw; // 예외를 다시 던져서 상위에서 처리
                            }
                        }
                    }
                }
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CONVAL 결과 저장 실패: {ex.Message}");
                Console.WriteLine($"예외 타입: {ex.GetType().FullName}");
                Console.WriteLine($"예외 상세: {ex}");
                
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"내부 예외: {ex.InnerException.Message}");
                    Console.WriteLine($"내부 예외 타입: {ex.InnerException.GetType().FullName}");
                }
                
                // MySQL 특정 예외 정보 출력
                if (ex is MySql.Data.MySqlClient.MySqlException mysqlEx)
                {
                    Console.WriteLine($"MySQL 에러 코드: {mysqlEx.Number}");
                    Console.WriteLine($"MySQL 에러 메시지: {mysqlEx.Message}");
                    Console.WriteLine($"MySQL SQL 상태: {mysqlEx.SqlState}");
                }
                
                return false;
            }
        }
    }
} 