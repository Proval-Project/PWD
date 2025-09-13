using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Data;
using MySql.Data.MySqlClient;
using System.Runtime.InteropServices;

namespace ConvalServiceApi.Models
{
    public class ConvalQueueProcessor
    {
        private readonly ConcurrentQueue<string> fileNameQueue;
        private readonly SemaphoreSlim convalSemaphore;
        private readonly object processingLock = new object();
        
        private bool isProcessing = false;
        private CancellationTokenSource cancellationTokenSource;
        private int successCount = 0;
        private int errorCount = 0;
        
        // 데이터베이스 컬럼명을 CONVAL 태그명으로 매핑하는 딕셔너리

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


        public ConvalQueueProcessor()
        {
            fileNameQueue = new ConcurrentQueue<string>();
            convalSemaphore = new SemaphoreSlim(1, 1); // Conval은 한 번에 하나씩만
        }

        // 버튼 클릭 시 호출되는 메서드
        public void ProcessButtonClicked(string fileName)
        {
            fileNameQueue.Enqueue(fileName);
            Console.WriteLine($"[CONVAL] 큐에 추가됨: {fileName}");
            System.Diagnostics.Debug.WriteLine($"[CONVAL] 큐에 추가됨: {fileName}");
        }

        // 여러 파일을 한 번에 처리
        public void ProcessMultipleFiles(List<string> fileNames)
        {
            foreach (var fileName in fileNames)
            {
                fileNameQueue.Enqueue(fileName);
            }
        }

        // 사용 예시:
        // 1. 단일 파일 처리: ProcessButtonClicked("test_valve_001.xml")
        // 2. 여러 파일 처리: ProcessMultipleFiles(new List<string> { "file1.xml", "file2.xml" })
        // 3. 처리 시작: await StartProcessingAsync()
        public async Task StartProcessingAsync()
        {
            if (isProcessing)
            {
                Console.WriteLine("[CONVAL] 이미 처리 중입니다.");
                System.Diagnostics.Debug.WriteLine("[CONVAL] 이미 처리 중입니다.");
                return;
            }

            isProcessing = true;
            cancellationTokenSource = new CancellationTokenSource();
            successCount = 0;
            errorCount = 0;

            Console.WriteLine("[CONVAL] 큐 처리 시작");
            System.Diagnostics.Debug.WriteLine("[CONVAL] 큐 처리 시작");

            try
            {
                await ProcessQueueAsync(cancellationTokenSource.Token);
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine("[CONVAL] 처리 중단됨");
                System.Diagnostics.Debug.WriteLine("[CONVAL] 처리 중단됨");
            }
            finally
            {
                isProcessing = false;
                Console.WriteLine("[CONVAL] 큐 처리 종료");
                System.Diagnostics.Debug.WriteLine("[CONVAL] 큐 처리 종료");
            }
        }

        public void StopProcessing()
        {
            cancellationTokenSource?.Cancel();
        }

        private async Task ProcessQueueAsync(CancellationToken cancellationToken)
        {
            var stopwatch = Stopwatch.StartNew();
            int totalProcessed = 0;

            while (!cancellationToken.IsCancellationRequested)
            {
                // 큐에서 파일 이름 가져오기
                string currentFileName = null;
                if (fileNameQueue.TryDequeue(out currentFileName))
                {
                    totalProcessed++;
                    Console.WriteLine($"[CONVAL] 처리 시작: {currentFileName}");
                    System.Diagnostics.Debug.WriteLine($"[CONVAL] 처리 시작: {currentFileName}");

                    try
                    {
                        // CONVAL 세마포어 획득 (타임아웃 적용)
                        if (await convalSemaphore.WaitAsync(TimeSpan.FromSeconds(60), cancellationToken))
                        {
                            try
                            {
                                var success = await ProcessWithConvalAsync(currentFileName);
                                if (success)
                                {
                                    successCount++;
                                    Console.WriteLine($"[CONVAL] 처리 성공: {currentFileName}");
                                    System.Diagnostics.Debug.WriteLine($"[CONVAL] 처리 성공: {currentFileName}");
                                }
                                else
                                {
                                    errorCount++;
                                    Console.WriteLine($"[CONVAL] 처리 실패: {currentFileName}");
                                    System.Diagnostics.Debug.WriteLine($"[CONVAL] 처리 실패: {currentFileName}");
                                }
                            }
                            finally
                            {
                                convalSemaphore.Release();
                            }
                        }
                        else
                        {
                            errorCount++;
                            Console.WriteLine($"[CONVAL] 세마포어 획득 실패(타임아웃): {currentFileName}");
                            System.Diagnostics.Debug.WriteLine($"[CONVAL] 세마포어 획득 실패(타임아웃): {currentFileName}");
                        }
                    }
                    catch (Exception ex)
                    {
                        errorCount++;
                        Console.WriteLine($"[CONVAL] 처리 중 예외 발생: {currentFileName}, 예외: {ex.Message}");
                        System.Diagnostics.Debug.WriteLine($"[CONVAL] 처리 중 예외 발생: {currentFileName}, 예외: {ex.Message}");
                    }
                }
                else
                {
                    // 큐가 비어있으면 종료 조건 확인
                    if (totalProcessed > 0)
                    {
                        Console.WriteLine("[CONVAL] 큐 비어있음, 처리 종료");
                        System.Diagnostics.Debug.WriteLine("[CONVAL] 큐 비어있음, 처리 종료");
                        break;
                    }
                    
                    // 큐가 비어있으면 잠시 대기
                    await Task.Delay(50, cancellationToken);
                }
            }

            stopwatch.Stop();
            Console.WriteLine($"[CONVAL] 전체 처리 시간: {stopwatch.Elapsed.TotalSeconds:F2}초, 성공: {successCount}, 실패: {errorCount}");
            System.Diagnostics.Debug.WriteLine($"[CONVAL] 전체 처리 시간: {stopwatch.Elapsed.TotalSeconds:F2}초, 성공: {successCount}, 실패: {errorCount}");
        }

        private async Task<bool> ProcessWithConvalAsync(string fileName)
        {
            Console.WriteLine($"[CONVAL] CONVAL 엔진 처리 시작: {fileName}");
            System.Diagnostics.Debug.WriteLine($"[CONVAL] CONVAL 엔진 처리 시작: {fileName}");
            try
            {
                // fileName 형식: "EstimateNo_SheetId" (예: "YA250101-01_1")
                string[] parts = fileName.Split('_');
                if (parts.Length != 2)
                {
                    // 잘못된 형식
                    return false;
                }

                string estimateNo = parts[0];
                if (!int.TryParse(parts[1], out int sheetId))
                {
                    // SheetId가 숫자가 아님
                    return false;
                }

                // Windows 환경에서 실제 CONVAL 엔진 사용 (타임아웃 적용)
                if (IsWindows())
                {
                    // CONVAL 엔진 설치 여부 먼저 확인
                    if (!IsConvalEngineInstalled())
                    {
                        Console.WriteLine($"[CONVAL] CONVAL 엔진이 설치되지 않음: {fileName}");
                        System.Diagnostics.Debug.WriteLine($"[CONVAL] CONVAL 엔진이 설치되지 않음: {fileName}");
                        return false;
                    }
                    
                    try
                    {
                        // 30초 타임아웃으로 CONVAL 처리
                        using (var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30)))
                        {
                            var realConvalTask = ProcessWithRealConvalAsync(estimateNo, sheetId);
                            var completedTask = await Task.WhenAny(realConvalTask, Task.Delay(Timeout.Infinite, timeoutCts.Token));
                            if (completedTask == realConvalTask)
                            {
                                var result = await realConvalTask;
                                Console.WriteLine($"[CONVAL] 실제 CONVAL 엔진 처리 결과: {fileName}, 성공: {result}");
                                System.Diagnostics.Debug.WriteLine($"[CONVAL] 실제 CONVAL 엔진 처리 결과: {fileName}, 성공: {result}");
                                return result;
                            }
                            else
                            {
                                Console.WriteLine($"[CONVAL] CONVAL 엔진 처리 시간 초과: {fileName}");
                                System.Diagnostics.Debug.WriteLine($"[CONVAL] CONVAL 엔진 처리 시간 초과: {fileName}");
                                return false;
                            }
                        }
                    }
                    catch (OperationCanceledException)
                    {
                        Console.WriteLine($"[CONVAL] CONVAL 엔진 처리 시간 초과(예외): {fileName}");
                        System.Diagnostics.Debug.WriteLine($"[CONVAL] CONVAL 엔진 처리 시간 초과(예외): {fileName}");
                        return false;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[CONVAL] CONVAL 엔진 접근 실패: {fileName}, 예외: {ex.Message}");
                        System.Diagnostics.Debug.WriteLine($"[CONVAL] CONVAL 엔진 접근 실패: {fileName}, 예외: {ex.Message}");
                        return false;
                    }
                }
                else
                {
                    Console.WriteLine($"[CONVAL] Windows 환경이 아님: {fileName}");
                    System.Diagnostics.Debug.WriteLine($"[CONVAL] Windows 환경이 아님: {fileName}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CONVAL] 처리 중 예외 발생: {fileName}, 예외: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"[CONVAL] 처리 중 예외 발생: {fileName}, 예외: {ex.Message}");
                return false;
            }
        }

        // 실제 CONVAL 엔진 사용 메서드 (Windows 전용)
        private async Task<bool> ProcessWithRealConvalAsync(string estimateNo, int sheetId)
        {
            Console.WriteLine($"[CONVAL] 실제 CONVAL 엔진 호출: {estimateNo}_{sheetId}");
            System.Diagnostics.Debug.WriteLine($"[CONVAL] 실제 CONVAL 엔진 호출: {estimateNo}_{sheetId}");
            // Windows 환경에서만 실행
            if (!IsWindows())
            {
                return false;
            }

            try
            {
                // 실제 CONVAL COM 객체 사용 (CONVAL 엔진이 설치된 경우에만)
#if CONVAL_AVAILABLE
                Console.WriteLine("[CONVAL] CONVAL COM 객체 생성 시작");
                System.Diagnostics.Debug.WriteLine("[CONVAL] CONVAL COM 객체 생성 시작");
                
                var convalApp = new COMConval11.Conval11();
                Console.WriteLine("[CONVAL] CONVAL COM 객체 생성 완료");
                System.Diagnostics.Debug.WriteLine("[CONVAL] CONVAL COM 객체 생성 완료");
                
                // CONVAL 객체 상태 확인
                try
                {
                    Console.WriteLine($"[CONVAL] CONVAL 객체 타입: {convalApp.GetType().FullName}");
                    Console.WriteLine($"[CONVAL] CONVAL 객체 null 여부: {convalApp == null}");
                    System.Diagnostics.Debug.WriteLine($"[CONVAL] CONVAL 객체 타입: {convalApp.GetType().FullName}");
                    System.Diagnostics.Debug.WriteLine($"[CONVAL] CONVAL 객체 null 여부: {convalApp == null}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CONVAL] CONVAL 객체 상태 확인 실패: {ex.Message}");
                    System.Diagnostics.Debug.WriteLine($"[CONVAL] CONVAL 객체 상태 확인 실패: {ex.Message}");
                }
                
                // 각 작업마다 고유한 임시 .ccv 파일 생성
                string tempDir = Path.Combine(Path.GetTempPath(), "ConvalTemp");
                if (!Directory.Exists(tempDir))
                {
                    Directory.CreateDirectory(tempDir);
                }
                string tempCcvPath = Path.Combine(tempDir, $"temp_{Guid.NewGuid().ToString()}.ccv");
                
                // 디버그용 로그 추가
                Console.WriteLine($"[CONVAL] 임시 폴더 경로: {tempDir}");
                Console.WriteLine($"[CONVAL] 임시 CCV 파일 경로: {tempCcvPath}");
                System.Diagnostics.Debug.WriteLine($"[CONVAL] 임시 폴더 경로: {tempDir}");
                System.Diagnostics.Debug.WriteLine($"[CONVAL] 임시 CCV 파일 경로: {tempCcvPath}");

                // 원본 sample.CCV 파일을 임시 파일로 복사
                string originalSamplePath = GetSampleCcvPath();
                
                if (!File.Exists(originalSamplePath))
                {
                    System.Diagnostics.Debug.WriteLine($"[CONVAL] sample.CCV 경로 없음: {originalSamplePath}");
                    return false;
                }
                
                System.Diagnostics.Debug.WriteLine($"[CONVAL] tempccv경로 없음: {tempCcvPath}");
                // 임시 파일로 복사 (파일 공유 문제 해결)
                File.Copy(originalSamplePath, tempCcvPath, true);

                
                try
                {
                    Console.WriteLine("[CONVAL] NewDialog(1) 호출 시작");
                    System.Diagnostics.Debug.WriteLine("[CONVAL] NewDialog(1) 호출 시작");
                    
                    var dialog = convalApp.NewDialog(1);
                    if (dialog == null)
                    {
                        Console.WriteLine("[CONVAL] NewDialog(1)이 null을 반환했습니다!");
                        System.Diagnostics.Debug.WriteLine("[CONVAL] NewDialog(1)이 null을 반환했습니다!");
                        return false;
                    }
                    
                    Console.WriteLine("[CONVAL] NewDialog(1) 성공, Open 메서드 호출 시작");
                    System.Diagnostics.Debug.WriteLine("[CONVAL] NewDialog(1) 성공, Open 메서드 호출 시작");
                    
                    dialog.Open(tempCcvPath, true);
                    
                    dynamic cData = convalApp.Dialogs[1].Calculation.CalculationData;
                    dynamic oData = convalApp.Dialogs[1].Calculation.OptionalData;
                    
                    // 데이터베이스에서 데이터 가져오기
                    var dbHelper = new DatabaseHelper();
                    var dbRow = dbHelper.GetConvalRowByFileName(estimateNo, sheetId);
                    Console.WriteLine($"[CONVAL] DB 데이터 조회 완료: {estimateNo}_{sheetId}");
                    System.Diagnostics.Debug.WriteLine($"[CONVAL] DB 데이터 조회 완료: {estimateNo}_{sheetId}");
                    
                    SetConvalInputsFromDbRow(cData, dbRow);
                    
                    // CONVAL 계산 실행 (결과값 생성을 위해 필수)
                    
                    // 계산 완료 후 저장
                    try
                    {
                        convalApp.Dialogs[1].Save();
                    }
                    catch (Exception ex)
                    {
                        // CONVAL 데이터 저장 실패
                    }

                    // 결과 파일 생성
                    string resultPath = Path.Combine(GetSampleCcvPath(), "..", "..", "TestData", "Results");
                    resultPath = Path.GetFullPath(resultPath);
                    Directory.CreateDirectory(resultPath);
                    
                    string ccvFile = Path.Combine(resultPath, $"{estimateNo}.ccv");
                    string pdfFile = Path.Combine(resultPath, $"{estimateNo}.pdf");
                    
                    try
                    {
                        convalApp.Dialogs[1].SaveAs(ccvFile, true);
                    }
                    catch (Exception ex)
                    {
                        // CCV 파일 저장 실패
                    }
                    
                    CreatePdfFile(convalApp.Dialogs[1], pdfFile);
                    Console.WriteLine($"[CONVAL] 결과 파일 생성 완료: {estimateNo}_{sheetId}");
                    System.Diagnostics.Debug.WriteLine($"[CONVAL] 결과 파일 생성 완료: {estimateNo}_{sheetId}");


                    // 결과값을 데이터베이스에 저장
                    var valueDic = ExtractConvalResultsToDictionary(cData, oData, dbRow);
                    
                    Console.WriteLine($"[CONVAL] 추출된 결과값 개수: {valueDic.Count}");
                    Console.WriteLine($"[CONVAL] 결과값 키들: {string.Join(", ", valueDic.Keys)}");
                    System.Diagnostics.Debug.WriteLine($"[CONVAL] 추출된 결과값 개수: {valueDic.Count}");
                    System.Diagnostics.Debug.WriteLine($"[CONVAL] 결과값 키들: {string.Join(", ", valueDic.Keys)}");
                    
                    var dbHelper2 = new DatabaseHelper();
                    bool dbSaveOk = dbHelper2.SaveConvalResults(estimateNo, valueDic, sheetId);
                    Console.WriteLine($"[CONVAL] 결과값 DB 저장: {estimateNo}_{sheetId}, 성공: {dbSaveOk}");
                    System.Diagnostics.Debug.WriteLine($"[CONVAL] 결과값 DB 저장: {estimateNo}_{sheetId}, 성공: {dbSaveOk}");
                    
                    // CONVAL 엔진 완전 종료
                    convalApp.Dialogs[1].Close();
                    convalApp.Close();
                    convalApp.Exit();
                    
                    // COM 객체 해제
                    Marshal.ReleaseComObject(convalApp);
                    convalApp = null;
                    
                    // GC 강제 실행 (메모리 정리)
                    GC.Collect();
                    GC.WaitForPendingFinalizers();
                    
                    return true;
                }
                finally
                {
                    // 임시 파일 정리
                    try
                    {
                        if (File.Exists(tempCcvPath))
                        {
                            File.Delete(tempCcvPath);
                        }
                    }
                    catch (Exception ex)
                    {
                        // 임시 파일 정리 실패
                    }
                }
#else
                System.Diagnostics.Debug.WriteLine("[CONVAL] CONVAL_AVAILABLE 심볼 미정의: 실제 CONVAL 호출 생략 후 false 반환");
                // CONVAL 엔진이 없는 경우 실패 처리
                return false;
#endif
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CONVAL] 실제 CONVAL 엔진 처리 중 예외: {estimateNo}_{sheetId}, 예외: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"[CONVAL] 실제 CONVAL 엔진 처리 중 예외: {estimateNo}_{sheetId}, 예외: {ex.Message}");
                return false;
            }
        }

        // CONVAL에서 직접 데이터베이스 컬럼명으로 결과값을 추출하는 함수
        private Dictionary<string, object> ExtractConvalResultsToDictionary(dynamic cData, dynamic oData, Dictionary<string, object> dbRow)
        {
            var result = new Dictionary<string, object>();
            try
            {
                // 2-8: Valve 관련
                // SafeAddParameter(result, cData, "ValveType", "ValveType", "Text");
                // SafeAddParameter(result, cData, "ListDN", "SelectedValveSize", "Text");
                // SafeAddParameter(result, cData, "ListPN", "PressureClass", "Text");
                
                // 22-39: Medium 관련
                // SafeAddParameter(result, cData, "Fluidname", "Fluid", "Text");
                // SafeAddParameter(result, cData, "Phase", "Medium", "Text");
                SafeAddParameter(result, cData, "RhoN", "Density", "Value");
                SafeAddParameter(result, cData, "RhoN", "DensityUnit", "Unit");
                SafeAddParameter(result, cData, "M", "MolecularWeight", "Value");
                SafeAddParameter(result, cData, "M", "MolecularWeightUnit", "Unit");
                
                // 28-31: Temperature 관련
                // SafeAddParameter(result, cData, "T1", "InletTemperatureQ", "Value");
                // SafeAddParameter(result, cData, "T1Ap2", "InletTemperatureNorQ", "Value");
                // SafeAddParameter(result, cData, "T1Ap3", "InletTemperatureMinQ", "Value");
                // SafeAddParameter(result, cData, "T1", "InletTemperatureUnit", "Unit");
                
                // // 32-35: Pressure 관련
                // SafeAddParameter(result, cData, "P1", "InletPressureMaxQ", "Value");
                // SafeAddParameter(result, cData, "P1Ap2", "InletPressureNorQ", "Value");
                // SafeAddParameter(result, cData, "P1Ap3", "InletPressureMinQ", "Value");
                // SafeAddParameter(result, cData, "P1", "PressureUnit", "Unit");
                
                // 36-39: Delta Pressure 관련
                SafeAddParameter(result, cData, "P2", "OutletPressureMaxQ", "Value");
                SafeAddParameter(result, cData, "P2Ap2", "OutletPressureNorQ", "Value");
                SafeAddParameter(result, cData, "P2Ap3", "OutletPressureMinQ", "Value");
                SafeAddParameter(result, cData, "dpin", "DifferentialPressureMaxQ", "Value");
                SafeAddParameter(result, cData, "dpinAp2", "DifferentialPressureNorQ", "Value");
                SafeAddParameter(result, cData, "dpinAp3", "DifferentialPressureMinQ", "Value");

                
                // 44-51: Flow 관련
                SafeAddParameter(result, cData, "Qm", "QMMax", "Value");
                SafeAddParameter(result, cData, "QmAp2", "QMNor", "Value");
                SafeAddParameter(result, cData, "QmAp3", "QMMin", "Value");
                // SafeAddParameter(result, cData, "Qm", "QMUnit", "Unit");
                if (dbRow.TryGetValue("Fluid", out object displayPhaseObj) && displayPhaseObj is string displayPhase) {
                    if (displayPhase == "Gas") {
                        SafeAddParameter(result, cData, "Qn", "QNMax", "Value");
                        SafeAddParameter(result, cData, "QnAp2", "QNNor", "Value");
                        SafeAddParameter(result, cData, "QnAp3", "QNMin", "Value");
                        // SafeAddParameter(result, cData, "Qn", "QNUnit", "Unit");
                    }
                    else {
                        SafeAddParameter(result, cData, "Qv", "QNMax", "Value");
                        SafeAddParameter(result, cData, "QvAp2", "QNNor", "Value");
                        SafeAddParameter(result, cData, "QvAp3", "QNMin", "Value");
                        // SafeAddParameter(result, cData, "Qv", "QNUnit", "Unit");
                    }
                }

                
                // 56-62: CV 관련
                SafeAddParameter(result, cData, "kv", "CalculatedCvMaxQ", "Value");
                SafeAddParameter(result, cData, "kvAp2", "CalculatedCvNorQ", "Value");
                SafeAddParameter(result, cData, "kvAp3", "CalculatedCvMinQ", "Value");
                // SafeAddParameter(result, cData, "kv", "CalculatedCvUnit", "Unit");
                SafeAddParameter(result, cData, "h", "SS100Max", "Value");
                SafeAddParameter(result, cData, "hAp2", "SS100Nor", "Value");
                SafeAddParameter(result, cData, "hAp3", "SS100Min", "Value");
                
                // 63-68: LpAe 관련
                SafeAddParameter(result, cData, "LpAa", "LpAeMax", "Value");
                SafeAddParameter(result, cData, "LpAaAp2", "LpAeNor", "Value");
                SafeAddParameter(result, cData, "LpAaAp3", "LpAeMin", "Value");
                SafeAddParameter(result, cData, "FlowState", "WarningStateMax", "Text");
                SafeAddParameter(result, cData, "FlowStateAp2", "WarningStateNor", "Text");
                SafeAddParameter(result, cData, "FlowStateAp3", "WarningStateMin", "Text");
                SafeAddParameter(result, cData, "FlowType", "WarningTypeMax", "Text");
                SafeAddParameter(result, cData, "FlowTypeAp2", "WarningTypeNor", "Text");
                SafeAddParameter(result, cData, "FlowTypeAp3", "WarningTypeMin", "Text");
                
                // 69-78: Valve 상세 정보
                // SafeAddParameter(result, cData, "GlobeType", "CONVALTrim", "Text");
                // SafeAddParameter(result, cData, "InwardFlow", "FlowDirection", "Text");
                // SafeAddParameter(result, cData, "ValveClass", "ValvePerformClass", "Text");
                // SafeAddParameter(result, cData, "HardClass", "Protection", "Text");
                // SafeAddParameter(result, cData, "CharacteristicType", "BasicCharacter", "Text");
                // SafeAddParameter(result, cData, "Phi0", "TheoreticalRangeability", "Value");
                SafeAddParameter(result, cData, "kv", "FlowCoeff", "Value");
                // SafeAddParameter(result, cData, "kv", "FlowCoeffUnit", "Unit");
                // SafeAddParameter(result, cData, "kvs", "NorFlowCoeff", "Value");
                
                // 79-84: Size 관련
                // SafeAddParameter(result, cData, "PipeClass", "SizePressureClass", "Text");
                SafeAddParameter(result, cData, "MinDN", "SuggestedValveSize", "Value");
                SafeAddParameter(result, cData, "Rho1", "FluidP1Max", "Value");
                SafeAddParameter(result, cData, "Rho1Ap2", "FluidP1Nor", "Value");
                SafeAddParameter(result, cData, "Rho1Ap3", "FluidP1Min", "Value");
                // SafeAddParameter(result, cData, "Rho1", "FluidPUnit", "Unit");
                
                // 85-88: P2 관련
                SafeAddParameter(result, cData, "rho2", "FluidP2Max", "Value");
                SafeAddParameter(result, cData, "rho2Ap2", "FluidP2Nor", "Value");
                SafeAddParameter(result, cData, "rho2Ap3", "FluidP2Min", "Value");
                
                // 89-96: N1, V1 관련
                SafeAddParameter(result, cData, "Eta1", "FluidN1Max", "Value");
                SafeAddParameter(result, cData, "Eta1Ap2", "FluidN1Nor", "Value");
                SafeAddParameter(result, cData, "Eta1Ap3", "FluidN1Min", "Value");
                SafeAddParameter(result, cData, "Eta1", "FluidN1Unit", "Unit");
                SafeAddParameter(result, cData, "Ny1", "FluidV1Max", "Value");
                SafeAddParameter(result, cData, "Ny1Ap2", "FluidV1Nor", "Value");
                SafeAddParameter(result, cData, "Ny1Ap3", "FluidV1Min", "Value");
                SafeAddParameter(result, cData, "Ny1", "FluidV1Unit", "Unit");
                
                // 97-104: PV1, TV1 관련
                SafeAddParameter(result, cData, "Pv1", "FluidPV1Max", "Value");
                SafeAddParameter(result, cData, "Pv1Ap2", "FluidPV1Nor", "Value");
                SafeAddParameter(result, cData, "Pv1Ap3", "FluidPV1Min", "Value");
                SafeAddParameter(result, cData, "Pv1", "FluidPV1Unit", "Unit");
                SafeAddParameter(result, cData, "Tv1", "FluidTV1Max", "Value");
                SafeAddParameter(result, cData, "Tv1Ap2", "FluidTV1Nor", "Value");
                SafeAddParameter(result, cData, "Tv1Ap3", "FluidTV1Min", "Value");
                SafeAddParameter(result, cData, "Tv1", "FluidTV1Unit", "Unit");
                SafeAddParameter(result, cData, "Kappa1", "FluidKMax", "Value");
                SafeAddParameter(result, cData, "Kappa1Ap2", "FluidKNor", "Value");
                SafeAddParameter(result, cData, "Kappa1Ap3", "FluidKMin", "Value");
                
                // 105-111: CF1, SS100 관련
                // SafeAddParameter(result, cData, "Cf", "FluidCF1Max", "Value");
                // SafeAddParameter(result, cData, "CfAp2", "FluidCF1Nor", "Value");
                // SafeAddParameter(result, cData, "CfAp3", "FluidCF1Min", "Value");
                // SafeAddParameter(result, cData, "Cf", "FluidCF1Unit", "Unit");
                
                // 112-122: U1, U2, LpAe 관련
                SafeAddParameter(result, cData, "u", "U1Max", "Value");
                SafeAddParameter(result, cData, "uAp2", "U1Nor", "Value");
                SafeAddParameter(result, cData, "uAp3", "U1Min", "Value");
                // SafeAddParameter(result, cData, "u", "U1Unit", "Unit");
                SafeAddParameter(result, cData, "u2", "U2Max", "Value");
                SafeAddParameter(result, cData, "u2Ap2", "U2Nor", "Value");
                SafeAddParameter(result, cData, "u2Ap3", "U2Min", "Value");
                
            }
            catch (Exception ex)
            {
                // 결과값 추출 실패
            }
            return result;
        }

        // PDF 파일 생성 메서드
        private bool CreatePdfFile(dynamic dialog, string pdfPath)
        {
            try
            {
                // CONVAL에서 PDF 생성
                dialog.CreatePdf(pdfPath);
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public int GetQueueCount()
        {
            return fileNameQueue.Count;
        }

        public bool IsProcessing()
        {
            return isProcessing;
        }

        public int GetSuccessCount() => successCount;
        public int GetErrorCount() => errorCount;

        // Windows 환경 확인 메서드 (.NET Framework 4.8 호환)
        private bool IsWindows()
        {
            return Environment.OSVersion.Platform == PlatformID.Win32NT;
        }
        
        // CONVAL 엔진 설치 여부 확인
        private bool IsConvalEngineInstalled()
        {
            try
            {
                // 레지스트리에서 CONVAL 설치 여부 확인
                using (var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Classes\COMConval11.Conval11"))
                {
                    if (key != null)
                    {
                        Console.WriteLine("[CONVAL] 레지스트리에서 CONVAL 엔진 발견");
                        System.Diagnostics.Debug.WriteLine("[CONVAL] 레지스트리에서 CONVAL 엔진 발견");
                        return true;
                    }
                }
                
                // COM 객체 생성 시도
                try
                {
                    var testApp = new COMConval11.Conval11();
                    if (testApp != null)
                    {
                        Console.WriteLine("[CONVAL] COM 객체 생성 테스트 성공");
                        System.Diagnostics.Debug.WriteLine("[CONVAL] COM 객체 생성 테스트 성공");
                        Marshal.ReleaseComObject(testApp);
                        return true;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CONVAL] COM 객체 생성 테스트 실패: {ex.Message}");
                    System.Diagnostics.Debug.WriteLine($"[CONVAL] COM 객체 생성 테스트 실패: {ex.Message}");
                }
                
                Console.WriteLine("[CONVAL] CONVAL 엔진이 설치되지 않았습니다");
                System.Diagnostics.Debug.WriteLine("[CONVAL] CONVAL 엔진이 설치되지 않았습니다");
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CONVAL] CONVAL 엔진 설치 확인 실패: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"[CONVAL] CONVAL 엔진 설치 확인 실패: {ex.Message}");
                return false;
            }
        }

        // sample.CCV 파일 경로 찾기 메서드
        private string GetSampleCcvPath()
        {
            // 프로젝트 루트 디렉토리 찾기 (bin\Debug에서 상위로 이동)
            var currentDir = Directory.GetCurrentDirectory();
            var projectRoot = currentDir;
            
            // bin\Debug 또는 bin\Release 폴더에서 실행 중인 경우 상위로 이동
            if (currentDir.EndsWith("Debug") || currentDir.EndsWith("Release"))
            {
                // bin\Debug -> bin -> 프로젝트 루트
                var binDir = Directory.GetParent(currentDir);
                projectRoot = binDir?.Parent?.FullName ?? currentDir;
            }
            
            return Path.Combine(projectRoot, "sample", "sample.CCV");
        }


        // 안전한 CONVAL 파라미터 추가 헬퍼 메서드
        private void SafeAddParameter(Dictionary<string, object> result, dynamic cData, string paramName, string resultKey, string propertyType)
        {
            try
            {
                // 이미 존재하는 키인지 확인
                if (result.ContainsKey(resultKey))
                {
                    return;
                }
                
                var param = cData.ParamByName[paramName];
                if (param != null)
                {
                    object value = null;
                    switch (propertyType.ToLower())
                    {
                        case "text":
                            value = param.Text;
                            break;
                        case "value":
                            value = param.Value;
                            break;
                        case "unit":
                            value = param.CalcUnit.UnitName;
                            break;
                        default:
                            value = param.Text;
                            break;
                    }
                    
                    if (value != null)
                    {
                        result.Add(resultKey, value);
                    }
                }
            }
            catch (Exception)
            {
                // 파라미터 추가 실패
            }
        }

        // CONVAL에 데이터베이스 행 데이터를 설정하는 함수
        private void SetConvalInputsFromDbRow(dynamic cData, Dictionary<string, object> dbRow)
        {
            if (dbRow == null || dbRow.Count == 0)
            {
                return;
            }
            
            try
            {
                bool isP2OrDp = dbRow.TryGetValue("IsP2", out object isP2OrDpObj) && Convert.ToBoolean(isP2OrDpObj);
                if (isP2OrDp){
                cData.ParamByName["P2OrDp"].Text = "p2";
                } else {
                    cData.ParamByName["P2OrDp"].Text = "Δp";
                }

                bool isQmOrQv = dbRow.TryGetValue("IsQM", out object isQmOrQvObj) && Convert.ToBoolean(isQmOrQvObj);
                if (isQmOrQv){
                    cData.ParamByName["QmOrQv"].Text = "Mass flow rate";
                } else {
                    cData.ParamByName["QmOrQv"].Text = "Volume flow rate";
                }

                bool isViscosityType = dbRow.TryGetValue("IsN1", out object isViscosityTypeObj) && Convert.ToBoolean(isViscosityTypeObj);
                if (isViscosityType){
                    cData.ParamByName["ViscosityType"].Text = "Dynamic";
                } else {
                    cData.ParamByName["ViscosityType"].Text = "Kinematic";
                }

                bool isRhoNRiM = dbRow.TryGetValue("isDensity", out object isRhoNRiMObj) && Convert.ToBoolean(isRhoNRiMObj);
                if (isRhoNRiM){
                    cData.ParamByName["RhoNRiM"].Text = "RhoN";
                } else {
                    cData.ParamByName["RhoNRiM"].Text = "M";
                }

                cData.ParamByName["Use2ndOp"].Text = "ja";
                cData.ParamByName["Use3rdOp"].Text = "ja";
               
                // 1단계: Text 파라미터들 먼저 설정
                SafeSetParameter(cData, dbRow, "SizePressureClass", "PipeClass", "Text");
                if (dbRow.TryGetValue("ValveType", out object vtObj) && vtObj is string vtStr && ValveTypeDbToConval.ContainsKey(vtStr)) {
                    cData.ParamByName["ValveType"].Text = ValveTypeDbToConval[vtStr];
                } else if (dbRow.TryGetValue("ValveType", out vtObj) && vtObj is string vtStr2) {
                    cData.ParamByName["ValveType"].Text = vtStr2;
                }
                if (dbRow.TryGetValue("SelectedValveSize", out object svsObj) && svsObj is string svsStr && SelectedValveSizeDbToConval.ContainsKey(svsStr)) {
                    cData.ParamByName["ListDN"].Text = SelectedValveSizeDbToConval[svsStr];
                } else if (dbRow.TryGetValue("SelectedValveSize", out svsObj) && svsObj is string svsStr2) {
                    cData.ParamByName["ListDN"].Text = svsStr2;
                }
                if (dbRow.TryGetValue("PressureClass", out object pcObj) && pcObj is string pcStr && PressureClassDbToConval.ContainsKey(pcStr)) {
                    cData.ParamByName["ListPN"].Text = PressureClassDbToConval[pcStr];
                } else if (dbRow.TryGetValue("PressureClass", out pcObj) && pcObj is string pcStr2) {
                    cData.ParamByName["ListPN"].Text = pcStr2;
                }
                
                cData.ParamByName["ChangePhase"].Text = "nein";
                SafeSetParameter(cData, dbRow, "Medium", "FluidName", "Text");
                if (dbRow.TryGetValue("Fluid", out object fluidObj) && fluidObj is string fluidStr && FluidDbToConval.ContainsKey(fluidStr)) {
                    cData.ParamByName["Phase"].Text = FluidDbToConval[fluidStr];
                } else if (dbRow.TryGetValue("Fluid", out fluidObj) && fluidObj is string fluidStr2) {
                    cData.ParamByName["Phase"].Text = fluidStr2;
                }
                SafeSetParameter(cData, dbRow, "CONVALTrim", "GlobeType", "Text");
                SafeSetParameter(cData, dbRow, "FlowDirection", "InwardFlow", "Text");
                SafeSetParameter(cData, dbRow, "ValvePerformClass", "ValveClass", "Text");
                SafeSetParameter(cData, dbRow, "Protection", "HardClass", "Text");
                SafeSetParameter(cData, dbRow, "BasicCharacter", "CharacteristicType", "Text");
                
                // 2단계: Unit 파라미터들 설정
                SafeSetParameter(cData, dbRow, "DensityUnit", "RhoN", "Unit");
                SafeSetParameter(cData, dbRow, "MolecularWeightUnit", "M", "Unit");  
                SafeSetParameter(cData, dbRow, "InletTemperatureUnit", "T1", "Unit");
                SafeSetParameter(cData, dbRow, "PressureUnit", "P1", "Unit");
                SafeSetParameter(cData, dbRow, "PressureUnit", "P2", "Unit");
                SafeSetParameter(cData, dbRow, "PressureUnit", "dpin", "Unit");
                SafeSetParameter(cData, dbRow, "QMUnit", "Qm", "Unit");
                SafeSetParameter(cData, dbRow, "CalculatedCvUnit", "kv", "Unit");
                SafeSetParameter(cData, dbRow, "FlowCoeffUnit", "kv", "Unit");
                SafeSetParameter(cData, dbRow, "FlowCoeffUnit", "kvs", "Unit");
                SafeSetParameter(cData, dbRow, "FluidPUnit", "Rho1", "Unit");
                SafeSetParameter(cData, dbRow, "FluidPUnit", "rho2", "Unit");
                SafeSetParameter(cData, dbRow, "FluidN1Unit", "Eta1", "Unit");
                SafeSetParameter(cData, dbRow, "FluidV1Unit", "Ny1", "Unit");
                SafeSetParameter(cData, dbRow, "FluidPV1Unit", "Pv1", "Unit");
                SafeSetParameter(cData, dbRow, "FluidTV1Unit", "Tv1", "Unit");
                SafeSetParameter(cData, dbRow, "FluidCF1Unit", "Cf", "Unit");
                SafeSetParameter(cData, dbRow, "U1Unit", "u", "Unit");
                SafeSetParameter(cData, dbRow, "U1Unit", "u2", "Unit");
                
                // 3단계: Value 파라미터들 설정
                if (isRhoNRiM){
                SafeSetParameter(cData, dbRow, "Density", "RhoN", "Value");
                } else {
                SafeSetParameter(cData, dbRow, "MolecularWeight", "M", "Value");
                }
                SafeSetParameter(cData, dbRow, "InletTemperatureQ", "T1", "Value");
                SafeSetParameter(cData, dbRow, "InletTemperatureNorQ", "T1Ap2", "Value");
                SafeSetParameter(cData, dbRow, "InletTemperatureMinQ", "T1Ap3", "Value");
                SafeSetParameter(cData, dbRow, "InletPressureMaxQ", "P1", "Value");
                SafeSetParameter(cData, dbRow, "InletPressureNorQ", "P1Ap2", "Value");
                SafeSetParameter(cData, dbRow, "InletPressureMinQ", "P1Ap3", "Value");
                if (isP2OrDp){
                    SafeSetParameter(cData, dbRow, "OutletPressureMaxQ", "P2", "Value");
                    SafeSetParameter(cData, dbRow, "OutletPressureNorQ", "P2Ap2", "Value");
                    SafeSetParameter(cData, dbRow, "OutletPressureMinQ", "P2Ap3", "Value");
                } else {
                    SafeSetParameter(cData, dbRow, "DifferentialPressureMaxQ", "dpin", "Value");
                    SafeSetParameter(cData, dbRow, "DifferentialPressureNorQ", "dpinAp2", "Value");
                    SafeSetParameter(cData, dbRow, "DifferentialPressureMinQ", "dpinAp3", "Value");
                }
                if (isQmOrQv){
                    SafeSetParameter(cData, dbRow, "QMMax", "Qm", "Value");
                    SafeSetParameter(cData, dbRow, "QMNor", "QmAp2", "Value");
                    SafeSetParameter(cData, dbRow, "QMMin", "QmAp3", "Value");
                } else{
                    // DisplayPhase 값에 따라 Flow Rate 설정
                    if (dbRow.TryGetValue("Fluid", out object displayPhaseObj) && displayPhaseObj is string displayPhase)
                    {
                        if (displayPhase == "Gas")
                        {
                            SafeSetParameter(cData, dbRow, "QNUnit", "Qn", "Unit");
                            SafeSetParameter(cData, dbRow, "QNMax", "Qn", "Value");
                            SafeSetParameter(cData, dbRow, "QNNor", "QnAp2", "Value");
                            SafeSetParameter(cData, dbRow, "QNMin", "QnAp3", "Value");
                        }
                        else
                        {
                            SafeSetParameter(cData, dbRow, "QNUnit", "Qv", "Unit");
                            SafeSetParameter(cData, dbRow, "QNMax", "Qv", "Value");
                            SafeSetParameter(cData, dbRow, "QNNor", "QvAp2", "Value");
                            SafeSetParameter(cData, dbRow, "QNMin", "QvAp3", "Value");
                        }
                    }
                }

                SafeSetParameter(cData, dbRow, "TheoreticalRangeability", "Phi0", "Value");
                SafeSetParameter(cData, dbRow, "NorFlowCoeff", "kvs", "Value");
                SafeSetParameter(cData, dbRow, "FluidP1Max", "Rho1", "Value");
                SafeSetParameter(cData, dbRow, "FluidP1Nor", "Rho1Ap2", "Value");
                SafeSetParameter(cData, dbRow, "FluidP1Min", "Rho1Ap3", "Value");

                if (isViscosityType){
                    SafeSetParameter(cData, dbRow, "FluidN1Max", "Eta1", "Value");
                    SafeSetParameter(cData, dbRow, "FluidN1Nor", "Eta1Ap2", "Value");
                    SafeSetParameter(cData, dbRow, "FluidN1Min", "Eta1Ap3", "Value");
                } else {
                    SafeSetParameter(cData, dbRow, "FluidV1Max", "Ny1", "Value");
                    SafeSetParameter(cData, dbRow, "FluidV1Nor", "Ny1Ap2", "Value");
                    SafeSetParameter(cData, dbRow, "FluidV1Min", "Ny1Ap3", "Value");
                }
                SafeSetParameter(cData, dbRow, "FluidCF1Max", "Cf", "Value");
                SafeSetParameter(cData, dbRow, "FluidCF1Nor", "CfAp2", "Value");
                SafeSetParameter(cData, dbRow, "FluidCF1Min", "CfAp3", "Value");
                SafeSetParameter(cData, dbRow, "FluidKMax", "Kappa1", "Value");
                SafeSetParameter(cData, dbRow, "FluidKNor", "Kappa1Ap2", "Value");
                SafeSetParameter(cData, dbRow, "FluidKMin", "Kappa1Ap3", "Value");
                SafeSetParameter(cData, dbRow, "FluidP1Max", "Rho1", "Value");
                SafeSetParameter(cData, dbRow, "FluidP1Nor", "Rho1Ap2", "Value");
                SafeSetParameter(cData, dbRow, "FluidP1Min", "Rho1Ap3", "Value");

                
            }
            catch (Exception)
            {
                // SetConvalInputsFromDbRow 전체 실패
            }
        }

        // 안전한 CONVAL 파라미터 설정 헬퍼 메서드
        private void SafeSetParameter(dynamic cData, Dictionary<string, object> dbRow, string dbColumn, string paramName, string propertyType)
        {
            try
            {
                // 데이터베이스에서 값 가져오기
                if (!dbRow.TryGetValue(dbColumn, out object dbValue))
                {
                    return;
                }
                
                if (dbValue == null)
                {
                    return;
                }
                
                // CONVAL 파라미터 가져오기
                var param = cData.ParamByName[paramName];
                if (param == null)
                {
                    return;
                }
                
                // 값 설정
                switch (propertyType.ToLower())
                {
                    case "text":
                        if (dbValue is string stringValue)
                        {
                            param.Text = stringValue;
                        }
                        break;
                    case "value":
                        if (dbValue is double doubleValue)
                        {
                            param.Value = doubleValue;
                        }
                        else if (dbValue is int intValue)
                        {
                            param.Value = Convert.ToDouble(intValue);
                        }
                        else if (dbValue is decimal decimalValue)
                        {
                            param.Value = Convert.ToDouble(decimalValue);
                        }
                        else if (dbValue is string stringValue2 && double.TryParse(stringValue2, out double parsedValue))
                        {
                            param.Value = parsedValue;
                        }
                        break;
                    case "unit":
                        if (dbValue is string unitValue)
                        {
                            param.CalcUnit.UnitName = unitValue;
                        }
                        break;
                    default:
                        // 기본적으로 Text로 설정
                        param.Text = dbValue.ToString();

                        break;
                }
            }
            catch (Exception ex)
            {
                // 파라미터 설정 실패
            }
        }
    }
}
