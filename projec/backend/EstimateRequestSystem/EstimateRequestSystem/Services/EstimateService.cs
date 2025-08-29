using Microsoft.EntityFrameworkCore;
using EstimateRequestSystem.Data;
using EstimateRequestSystem.DTOs;
using EstimateRequestSystem.Models;
using MySql.Data.MySqlClient;

namespace EstimateRequestSystem.Services
{
    public class EstimateService : IEstimateService
    {
        private readonly EstimateRequestDbContext _context;
        private readonly IWebHostEnvironment _environment;

        private static bool IsAllDigits(string? value)
        {
            if (string.IsNullOrEmpty(value)) return false;
            for (int i = 0; i < value.Length; i++)
            {
                if (!char.IsDigit(value[i])) return false;
            }
            return true;
        }

        private static IOrderedEnumerable<T> OrderByCodePreferred<T>(IEnumerable<T> source, Func<T, string?> codeSelector)
        {
            return source
                .OrderBy(item =>
                {
                    var code = codeSelector(item) ?? string.Empty;
                    return IsAllDigits(code) ? 0 : 1; // 숫자 우선
                })
                .ThenBy(item =>
                {
                    var code = codeSelector(item) ?? string.Empty;
                    return int.TryParse(code, out var n) ? n : int.MaxValue; // 숫자는 값으로 정렬
                })
                .ThenBy(item => (codeSelector(item) ?? string.Empty), StringComparer.OrdinalIgnoreCase); // 그 외 알파벳
        }

        private static string GetPropString(object item, string propertyName)
        {
            var prop = item.GetType().GetProperty(propertyName);
            var value = prop?.GetValue(item)?.ToString() ?? string.Empty;
            return value;
        }

        private static List<object> OrderByCodePreferredObject(IEnumerable<object> source, string codePropertyName)
        {
            return source
                .OrderBy(item => IsAllDigits(GetPropString(item, codePropertyName)) ? 0 : 1)
                .ThenBy(item =>
                {
                    var code = GetPropString(item, codePropertyName);
                    return int.TryParse(code, out var n) ? n : int.MaxValue;
                })
                .ThenBy(item => GetPropString(item, codePropertyName), StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        public EstimateService(EstimateRequestDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // EstimateSheet operations
        public async Task<string> CreateEstimateSheetAsync(CreateEstimateSheetDto dto, string currentUserId)
        {
            var tempEstimateNo = await GenerateTempEstimateNoAsync();
            
            var estimateSheet = new EstimateSheetLv1
            {
                TempEstimateNo = tempEstimateNo,
                CustomerID = currentUserId, // currentUserId 사용
                WriterID = currentUserId,   // currentUserId 사용
                Status = 1, // 임시저장
                Project = dto.Project,
                CustomerRequirement = dto.CustomerRequirement
            };

            _context.EstimateSheetLv1.Add(estimateSheet);
            await _context.SaveChangesAsync();

            return tempEstimateNo;
        }

        // 임시저장 기능
        public async Task<bool> SaveDraftAsync(string tempEstimateNo, SaveDraftDto dto)
        {
            // 1. EstimateSheetLv1 생성 또는 업데이트
            var estimateSheet = await _context.EstimateSheetLv1
                .FirstOrDefaultAsync(es => es.TempEstimateNo == tempEstimateNo);

            if (estimateSheet == null)
            {
                // 새로 생성
                estimateSheet = new EstimateSheetLv1
                {
                    TempEstimateNo = tempEstimateNo,
                    CustomerID = dto.CustomerID,
                    WriterID = dto.WriterID,
                    ManagerID = null,
                    CurEstimateNo = null,
                    PrevEstimateNo = null,
                    Status = 1, // 임시저장 상태
                    Project = dto.Project ?? "",
                    CustomerRequirement = dto.CustomerRequirement ?? "",
                    StaffComment = ""
                };
                _context.EstimateSheetLv1.Add(estimateSheet);
            }
            else
            {
                // 기존 데이터 업데이트
                estimateSheet.CustomerID = dto.CustomerID;
                estimateSheet.WriterID = dto.WriterID;
                estimateSheet.Project = dto.Project ?? "";
                estimateSheet.CustomerRequirement = dto.CustomerRequirement ?? "";
            }

            // 2. 기존 EstimateRequest 및 DataSheetLv3 삭제
            var existingRequests = _context.EstimateRequest.Where(er => er.TempEstimateNo == tempEstimateNo);
            if (await existingRequests.AnyAsync())
            {
                var sheetIdsToDelete = await existingRequests.Select(er => er.SheetID).ToListAsync();
                var existingDataSheets = _context.DataSheetLv3.Where(ds => ds.TempEstimateNo == tempEstimateNo && sheetIdsToDelete.Contains(ds.SheetID));
                
                if (await existingDataSheets.AnyAsync())
                {
                    _context.DataSheetLv3.RemoveRange(existingDataSheets);
                }
                _context.EstimateRequest.RemoveRange(existingRequests);
                await _context.SaveChangesAsync();
            }

            // 3. 새 데이터 추가
            if (dto.TypeSelections != null && dto.TypeSelections.Any())
            {
                foreach (var typeSelection in dto.TypeSelections)
                {
                    foreach (var valveSelection in typeSelection.Valves)
                    {
                        foreach (var tagNo in valveSelection.TagNos)
                        {
                            var estimateRequest = new EstimateRequest
                            {
                                TempEstimateNo = tempEstimateNo,
                                SheetID = tagNo.SheetID.Value,
                                SheetNo = tagNo.SheetNo,
                                ValveType = valveSelection.ValveSeriesCode,
                                Tagno = tagNo.Tagno,
                                Qty = tagNo.Qty,
                                Medium = tagNo.Medium,
                                Fluid = tagNo.Fluid,
                                IsQM = tagNo.IsQM,
                                QMUnit = tagNo.QMUnit,
                                QMMax = tagNo.QMMax,
                                QMNor = tagNo.QMNor,
                                QMMin = tagNo.QMMin,
                                QNUnit = tagNo.QNUnit,
                                QNMax = tagNo.QNMax,
                                QNNor = tagNo.QNNor,
                                QNMin = tagNo.QNMin,
                                IsP2 = tagNo.IsP2,
                                IsDensity = tagNo.IsDensity,
                                PressureUnit = tagNo.PressureUnit,
                                InletPressureMaxQ = tagNo.InletPressureMaxQ,
                                InletPressureNorQ = tagNo.InletPressureNorQ,
                                InletPressureMinQ = tagNo.InletPressureMinQ,
                                OutletPressureMaxQ = tagNo.OutletPressureMaxQ,
                                OutletPressureNorQ = tagNo.OutletPressureNorQ,
                                OutletPressureMinQ = tagNo.OutletPressureMinQ,
                                DifferentialPressureMaxQ = tagNo.DifferentialPressureMaxQ,
                                DifferentialPressureNorQ = tagNo.DifferentialPressureNorQ,
                                DifferentialPressureMinQ = tagNo.DifferentialPressureMinQ,
                                TemperatureUnit = tagNo.TemperatureUnit,
                                InletTemperatureQ = tagNo.InletTemperatureQ,
                                InletTemperatureNorQ = tagNo.InletTemperatureNorQ,
                                InletTemperatureMinQ = tagNo.InletTemperatureMinQ,
                                DensityUnit = tagNo.DensityUnit,
                                Density = tagNo.Density,
                                MolecularWeightUnit = tagNo.MolecularWeightUnit,
                                MolecularWeight = tagNo.MolecularWeight,
                                BodySizeUnit = string.IsNullOrEmpty(tagNo.BodySizeUnit) ? null : tagNo.BodySizeUnit,
                                BodySize = string.IsNullOrEmpty(tagNo.BodySize) ? null : tagNo.BodySize,
                                BodyMat = string.IsNullOrEmpty(tagNo.BodyMat) ? null : tagNo.BodyMat,
                                TrimMat = string.IsNullOrEmpty(tagNo.TrimMat) ? null : tagNo.TrimMat,
                                TrimOption = string.IsNullOrEmpty(tagNo.TrimOption) ? null : tagNo.TrimOption,
                                BodyRating = await GetBodyRatingCodeAsync(tagNo.BodyRating),
                                ActType = await GetActTypeCodeAsync(tagNo.ActType),
                                IsHW = tagNo.IsHW,
                                IsPositioner = tagNo.IsPositioner,
                                PositionerType = tagNo.PositionerType,
                                ExplosionProof = tagNo.ExplosionProof,
                                TransmitterType = tagNo.TransmitterType,
                                IsSolenoid = tagNo.IsSolenoid,
                                IsLimSwitch = tagNo.IsLimSwitch,
                                IsAirSet = tagNo.IsAirSet,
                                IsVolumeBooster = tagNo.IsVolumeBooster,
                                IsAirOperated = tagNo.IsAirOperated,
                                IsLockUp = tagNo.IsLockUp,
                                IsSnapActingRelay = tagNo.IsSnapActingRelay
                            };

                            _context.EstimateRequest.Add(estimateRequest);

                            // DataSheetLv3에도 동일한 데이터 저장
                            var dataSheetLv3 = new DataSheetLv3
                            {
                                TempEstimateNo = tempEstimateNo,
                                SheetID = tagNo.SheetID.Value,
                                Medium = tagNo.Medium,
                                Fluid = tagNo.Fluid,
                                IsQM = tagNo.IsQM,
                                IsP2 = tagNo.IsP2,
                                IsDensity = tagNo.IsDensity,
                                QMUnit = tagNo.QMUnit,
                                QMMax = tagNo.QMMax,
                                QMNor = tagNo.QMNor,
                                QMMin = tagNo.QMMin,
                                QNUnit = tagNo.QNUnit,
                                QNMax = tagNo.QNMax,
                                QNNor = tagNo.QNNor,
                                QNMin = tagNo.QNMin,
                                PressureUnit = tagNo.PressureUnit,
                                InletPressureMaxQ = tagNo.InletPressureMaxQ,
                                InletPressureNorQ = tagNo.InletPressureNorQ,
                                InletPressureMinQ = tagNo.InletPressureMinQ,
                                OutletPressureMaxQ = tagNo.OutletPressureMaxQ,
                                OutletPressureNorQ = tagNo.OutletPressureNorQ,
                                OutletPressureMinQ = tagNo.OutletPressureMinQ,
                                DifferentialPressureMaxQ = tagNo.DifferentialPressureMaxQ,
                                DifferentialPressureNorQ = tagNo.DifferentialPressureNorQ,
                                DifferentialPressureMinQ = tagNo.DifferentialPressureMinQ,
                                TemperatureUnit = tagNo.TemperatureUnit,
                                InletTemperatureQ = tagNo.InletTemperatureQ,
                                InletTemperatureNorQ = tagNo.InletTemperatureNorQ,
                                InletTemperatureMinQ = tagNo.InletTemperatureMinQ,
                                DensityUnit = tagNo.DensityUnit,
                                Density = tagNo.Density,
                                MolecularWeightUnit = tagNo.MolecularWeightUnit,
                                MolecularWeight = tagNo.MolecularWeight,
                                ValveType = valveSelection.ValveSeriesCode,
                                
                                BodySizeUnit = string.IsNullOrEmpty(tagNo.BodySizeUnit) ? null : tagNo.BodySizeUnit,
                                BodySize = string.IsNullOrEmpty(tagNo.BodySize) ? null : tagNo.BodySize,
                                BodyMat = await GetBodyMatCodeAsync(tagNo.BodyMat),
                                TrimMat = await GetTrimMatCodeAsync(tagNo.TrimMat),
                                TrimOption = await GetTrimOptionCodeAsync(tagNo.TrimOption),
                                Rating = await GetBodyRatingCodeAsync(tagNo.BodyRating)
                            };
                            _context.DataSheetLv3.Add(dataSheetLv3);
                        }
                    }
                }
            }

           

            // EstimateSheet 업데이트
            estimateSheet.Project = dto.Project;
            estimateSheet.CustomerRequirement = dto.CustomerRequirement;
            estimateSheet.CustomerID = dto.CustomerID ?? "customer1"; // 기본값 설정
            estimateSheet.WriterID = dto.WriterID ?? "customer1"; // 기본값 설정
            estimateSheet.Status = (int)EstimateStatus.Draft; // 임시저장

            await _context.SaveChangesAsync();
            return true;
        }

        // 견적요청 기능
        public async Task<bool> SubmitEstimateAsync(string tempEstimateNo, SubmitEstimateDto dto)
        {
            // 1. EstimateSheetLv1 생성 또는 업데이트
            var estimateSheet = await _context.EstimateSheetLv1
                .FirstOrDefaultAsync(es => es.TempEstimateNo == tempEstimateNo);

            if (estimateSheet == null)
            {
                // 새로 생성
                estimateSheet = new EstimateSheetLv1
                {
                    TempEstimateNo = tempEstimateNo,
                    CustomerID = dto.CustomerID,
                    WriterID = dto.WriterID,
                    ManagerID = null,
                    CurEstimateNo = null,
                    PrevEstimateNo = null,
                    Status = (int)EstimateStatus.Requested, // 견적요청 상태
                    Project = dto.Project ?? "",
                    CustomerRequirement = dto.CustomerRequirement ?? "",
                    StaffComment = dto.StaffComment ?? ""
                };
                _context.EstimateSheetLv1.Add(estimateSheet);
            }
            else
            {
                // 기존 데이터 업데이트
                estimateSheet.CustomerID = dto.CustomerID;
                estimateSheet.WriterID = dto.WriterID;
                estimateSheet.Project = dto.Project ?? "";
                estimateSheet.CustomerRequirement = dto.CustomerRequirement ?? "";
                estimateSheet.StaffComment = dto.StaffComment ?? "";
                estimateSheet.Status = (int)EstimateStatus.Requested; // 견적요청 상태
            }

            // 2. 기존 EstimateRequest 및 DataSheetLv3 삭제
            var existingRequests = _context.EstimateRequest.Where(er => er.TempEstimateNo == tempEstimateNo);
            if (await existingRequests.AnyAsync())
            {
                var sheetIdsToDelete = await existingRequests.Select(er => er.SheetID).ToListAsync();
                var existingDataSheets = _context.DataSheetLv3.Where(ds => ds.TempEstimateNo == tempEstimateNo && sheetIdsToDelete.Contains(ds.SheetID));

                if (await existingDataSheets.AnyAsync())
                {
                    _context.DataSheetLv3.RemoveRange(existingDataSheets);
                }
                _context.EstimateRequest.RemoveRange(existingRequests);
                await _context.SaveChangesAsync();
            }

            // 3. 새 데이터 추가
            if (dto.TypeSelections != null && dto.TypeSelections.Any())
            {
                 foreach (var typeSelection in dto.TypeSelections)
                {
                    foreach (var valveSelection in typeSelection.Valves)
                    {
                        foreach (var tagNo in valveSelection.TagNos)
                        {
                            var estimateRequest = new EstimateRequest
                            {
                                TempEstimateNo = tempEstimateNo,
                                SheetID = tagNo.SheetID.Value,
                                SheetNo = tagNo.SheetNo,
                                ValveType = valveSelection.ValveSeriesCode,
                                Tagno = tagNo.Tagno,
                                Qty = tagNo.Qty,
                                Medium = tagNo.Medium,
                                Fluid = tagNo.Fluid,
                                IsQM = tagNo.IsQM,
                                QMUnit = tagNo.QMUnit,
                                QMMax = tagNo.QMMax,
                                QMNor = tagNo.QMNor,
                                QMMin = tagNo.QMMin,
                                QNUnit = tagNo.QNUnit,
                                QNMax = tagNo.QNMax,
                                QNNor = tagNo.QNNor,
                                QNMin = tagNo.QNMin,
                                IsP2 = tagNo.IsP2,
                                IsDensity = tagNo.IsDensity,
                                PressureUnit = tagNo.PressureUnit,
                                InletPressureMaxQ = tagNo.InletPressureMaxQ,
                                InletPressureNorQ = tagNo.InletPressureNorQ,
                                InletPressureMinQ = tagNo.InletPressureMinQ,
                                OutletPressureMaxQ = tagNo.OutletPressureMaxQ,
                                OutletPressureNorQ = tagNo.OutletPressureNorQ,
                                OutletPressureMinQ = tagNo.OutletPressureMinQ,
                                DifferentialPressureMaxQ = tagNo.DifferentialPressureMaxQ,
                                DifferentialPressureNorQ = tagNo.DifferentialPressureNorQ,
                                DifferentialPressureMinQ = tagNo.DifferentialPressureMinQ,
                                TemperatureUnit = tagNo.TemperatureUnit,
                                InletTemperatureQ = tagNo.InletTemperatureQ,
                                InletTemperatureNorQ = tagNo.InletTemperatureNorQ,
                                InletTemperatureMinQ = tagNo.InletTemperatureMinQ,
                                DensityUnit = tagNo.DensityUnit,
                                Density = tagNo.Density,
                                MolecularWeightUnit = tagNo.MolecularWeightUnit,
                                MolecularWeight = tagNo.MolecularWeight,
                                BodySizeUnit = string.IsNullOrEmpty(tagNo.BodySizeUnit) ? null : tagNo.BodySizeUnit,
                                BodySize = string.IsNullOrEmpty(tagNo.BodySize) ? null : tagNo.BodySize,
                                BodyMat = string.IsNullOrEmpty(tagNo.BodyMat) ? null : tagNo.BodyMat,
                                TrimMat = string.IsNullOrEmpty(tagNo.TrimMat) ? null : tagNo.TrimMat,
                                TrimOption = string.IsNullOrEmpty(tagNo.TrimOption) ? null : tagNo.TrimOption,
                                BodyRating = await GetBodyRatingCodeAsync(tagNo.BodyRating),
                                BodyRatingUnit = await GetBodyRatingUnitCodeAsync(tagNo.BodyRatingUnit),
                                ActType = await GetActTypeCodeAsync(tagNo.ActType),
                                IsHW = tagNo.IsHW,
                                IsPositioner = tagNo.IsPositioner,
                                PositionerType = tagNo.PositionerType,
                                ExplosionProof = tagNo.ExplosionProof,
                                TransmitterType = tagNo.TransmitterType,
                                IsSolenoid = tagNo.IsSolenoid,
                                IsLimSwitch = tagNo.IsLimSwitch,
                                IsAirSet = tagNo.IsAirSet,
                                IsVolumeBooster = tagNo.IsVolumeBooster,
                                IsAirOperated = tagNo.IsAirOperated,
                                IsLockUp = tagNo.IsLockUp,
                                IsSnapActingRelay = tagNo.IsSnapActingRelay
                            };
                            _context.EstimateRequest.Add(estimateRequest);

                            var dataSheetLv3 = new DataSheetLv3
                            {
                                TempEstimateNo = tempEstimateNo,
                                SheetID = tagNo.SheetID.Value,
                                Medium = tagNo.Medium,
                                Fluid = tagNo.Fluid,
                                IsQM = tagNo.IsQM,
                                IsP2 = tagNo.IsP2,
                                IsDensity = tagNo.IsDensity,
                                QMUnit = tagNo.QMUnit,
                                QMMax = tagNo.QMMax,
                                QMNor = tagNo.QMNor,
                                QMMin = tagNo.QMMin,
                                QNUnit = tagNo.QNUnit,
                                QNMax = tagNo.QNMax,
                                QNNor = tagNo.QNNor,
                                QNMin = tagNo.QNMin,
                                PressureUnit = tagNo.PressureUnit,
                                InletPressureMaxQ = tagNo.InletPressureMaxQ,
                                InletPressureNorQ = tagNo.InletPressureNorQ,
                                InletPressureMinQ = tagNo.InletPressureMinQ,
                                OutletPressureMaxQ = tagNo.OutletPressureMaxQ,
                                OutletPressureNorQ = tagNo.OutletPressureNorQ,
                                OutletPressureMinQ = tagNo.OutletPressureMinQ,
                                DifferentialPressureMaxQ = tagNo.DifferentialPressureMaxQ,
                                DifferentialPressureNorQ = tagNo.DifferentialPressureNorQ,
                                DifferentialPressureMinQ = tagNo.DifferentialPressureMinQ,
                                TemperatureUnit = tagNo.TemperatureUnit,
                                InletTemperatureQ = tagNo.InletTemperatureQ,
                                InletTemperatureNorQ = tagNo.InletTemperatureNorQ,
                                InletTemperatureMinQ = tagNo.InletTemperatureMinQ,
                                DensityUnit = tagNo.DensityUnit,
                                Density = tagNo.Density,
                                MolecularWeightUnit = tagNo.MolecularWeightUnit,
                                MolecularWeight = tagNo.MolecularWeight,
                                BodySizeUnit = string.IsNullOrEmpty(tagNo.BodySizeUnit) ? null : tagNo.BodySizeUnit,
                                BodySize = string.IsNullOrEmpty(tagNo.BodySize) ? null : tagNo.BodySize,
                                BodyMat = await GetBodyMatCodeAsync(tagNo.BodyMat),
                                TrimMat = await GetTrimMatCodeAsync(tagNo.TrimMat),
                                TrimOption = await GetTrimOptionCodeAsync(tagNo.TrimOption),
                                Rating = await GetBodyRatingCodeAsync(tagNo.BodyRating),
                                ValveType = valveSelection.ValveSeriesCode
                            };
                            _context.DataSheetLv3.Add(dataSheetLv3);
                        }
                    }
                }
            }

            

            // EstimateSheet 상태를 견적요청으로 변경
            estimateSheet.Status = 2; // 견적요청

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<EstimateSheetResponseDto?> GetEstimateSheetAsync(string tempEstimateNo)
        {
            var estimateSheet = await _context.EstimateSheetLv1
                .Include(es => es.Customer)
                .Include(es => es.Writer)
                .Include(es => es.Manager)
                .Include(es => es.EstimateRequests)
                .Include(es => es.Attachments)
                .ThenInclude(a => a.UploadUser)
                .FirstOrDefaultAsync(es => es.TempEstimateNo == tempEstimateNo);

            if (estimateSheet == null) return null;

            return new EstimateSheetResponseDto
            {
                TempEstimateNo = estimateSheet.TempEstimateNo,
                CurEstimateNo = estimateSheet.CurEstimateNo,
                PrevEstimateNo = estimateSheet.PrevEstimateNo,
                CustomerID = estimateSheet.CustomerID,
                WriterID = estimateSheet.WriterID,
                ManagerID = estimateSheet.ManagerID,
                Status = estimateSheet.Status,
                Project = estimateSheet.Project,
                CustomerRequirement = estimateSheet.CustomerRequirement,
                StaffComment = estimateSheet.StaffComment,
                CustomerName = estimateSheet.Customer?.Name,
                WriterName = estimateSheet.Writer?.Name,
                EstimateRequests = estimateSheet.EstimateRequests.Select(er => new EstimateRequestResponseDto
                {
                    TempEstimateNo = er.TempEstimateNo,
                    SheetID = er.SheetID,
                    SheetNo = er.SheetNo,
                    EstimateNo = er.EstimateNo,
                    ValveType = er.ValveType,
                    UnitPrice = er.UnitPrice,
                    Tagno = er.Tagno,
                    Qty = er.Qty,
                    Medium = er.Medium,
                    Fluid = er.Fluid,
                    IsQM = er.IsQM,
                    QMUnit = er.QMUnit,
                    QMMax = er.QMMax,
                    QMNor = er.QMNor,
                    QMMin = er.QMMin,
                    QNUnit = er.QNUnit,
                    QNMax = er.QNMax,
                    QNNor = er.QNNor,
                    QNMin = er.QNMin,
                    IsP2 = er.IsP2,
                    IsDensity = er.IsDensity,
                    PressureUnit = er.PressureUnit,
                    InletPressureMaxQ = er.InletPressureMaxQ,
                    InletPressureNorQ = er.InletPressureNorQ,
                    InletPressureMinQ = er.InletPressureMinQ,
                    OutletPressureMaxQ = er.OutletPressureMaxQ,
                    OutletPressureNorQ = er.OutletPressureNorQ,
                    OutletPressureMinQ = er.OutletPressureMinQ,
                    DifferentialPressureMaxQ = er.DifferentialPressureMaxQ,
                    DifferentialPressureNorQ = er.DifferentialPressureNorQ,
                    DifferentialPressureMinQ = er.DifferentialPressureMinQ,
                    TemperatureUnit = er.TemperatureUnit,
                    InletTemperatureQ = er.InletTemperatureQ,
                    InletTemperatureNorQ = er.InletTemperatureNorQ,
                    InletTemperatureMinQ = er.InletTemperatureMinQ,
                    DensityUnit = er.DensityUnit,
                    Density = er.Density,
                    MolecularWeightUnit = er.MolecularWeightUnit,
                    MolecularWeight = er.MolecularWeight,
                    BodySize = er.BodySize,
                    BodyMat = er.BodyMat,
                    TrimMat = er.TrimMat,
                    TrimOption = er.TrimOption,
                    BodyRating = er.BodyRating,
                    BodyRatingUnit = er.BodyRatingUnit,
                    ActType = er.ActType,
                    IsHW = er.IsHW,
                    IsPositioner = er.IsPositioner,
                    PositionerType = er.PositionerType,
                    ExplosionProof = er.ExplosionProof,
                    TransmitterType = er.TransmitterType,
                    IsSolenoid = er.IsSolenoid,
                    IsLimSwitch = er.IsLimSwitch,
                    IsAirSet = er.IsAirSet,
                    IsVolumeBooster = er.IsVolumeBooster,
                    IsAirOperated = er.IsAirOperated,
                    IsLockUp = er.IsLockUp,
                    IsSnapActingRelay = er.IsSnapActingRelay
                }).ToList(),
                Attachments = estimateSheet.Attachments.Select(a => new EstimateAttachmentResponseDto
                {
                    AttachmentID = a.AttachmentID,
                    TempEstimateNo = a.TempEstimateNo,
                    FileName = a.FileName,
                    FilePath = a.FilePath,
                    FileSize = a.FileSize,
                    UploadDate = a.UploadDate,
                    UploadUserID = a.UploadUserID,
                    UploadUserName = a.UploadUser?.Name
                }).ToList()
            };
        }

        
         public async Task<List<EstimateSheetListResponseDto>> GetEstimateSheetsByStatusAsync(int status)
        {
            return await _context.EstimateSheetLv1
                .Include(es => es.Customer)
                .Include(es => es.Writer)
                .Include(es => es.EstimateRequests)
                .Where(es => es.Status == status)
                .Select(es => new EstimateSheetListResponseDto
                {
                    TempEstimateNo = es.TempEstimateNo,
                    Project = es.Project,
                    Status = es.Status,
                    CustomerName = es.Customer!.Name,
                    WriterName = es.Writer!.Name,
                    RequestCount = es.EstimateRequests.Count
                })
                .ToListAsync();
        }

        public async Task<List<EstimateSheetListResponseDto>> GetEstimateSheetsByUserAsync(string userID)
        {
            return await _context.EstimateSheetLv1
                .Include(es => es.Customer)
                .Include(es => es.Writer)
                .Include(es => es.EstimateRequests)
                .Where(es => es.CustomerID == userID || es.WriterID == userID)
                .Select(es => new EstimateSheetListResponseDto
                {
                    TempEstimateNo = es.TempEstimateNo,
                    Project = es.Project,
                    Status = es.Status,
                    CustomerName = es.Customer!.Name,
                    WriterName = es.Writer!.Name,
                    RequestCount = es.EstimateRequests.Count
                })
                .ToListAsync();
        }

        public async Task<bool> UpdateEstimateSheetAsync(string tempEstimateNo, UpdateEstimateSheetDto dto)
        {
            var estimateSheet = await _context.EstimateSheetLv1.FindAsync(tempEstimateNo);
            if (estimateSheet == null) return false;

            estimateSheet.Project = dto.Project;
            estimateSheet.CustomerRequirement = dto.CustomerRequirement;
            estimateSheet.Status = dto.Status;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteEstimateSheetAsync(string tempEstimateNo)
        {
            var estimateSheet = await _context.EstimateSheetLv1.FindAsync(tempEstimateNo);
            if (estimateSheet == null) return false;

            _context.EstimateSheetLv1.Remove(estimateSheet);
            await _context.SaveChangesAsync();
            return true;
        }

        // EstimateRequest operations
        public async Task<EstimateRequestResponseDto> CreateEstimateRequestAsync(string tempEstimateNo, CreateEstimateRequestDto dto)
        {
            var sheetID = await GetNextSheetIDAsync(tempEstimateNo);
            var sheetNo = sheetID; // 초기에는 SheetNo = SheetID

            var estimateRequest = new EstimateRequest
            {
                TempEstimateNo = tempEstimateNo,
                SheetID = sheetID,
                SheetNo = sheetNo,
                Tagno = dto.Tagno,
                Qty = dto.Qty,
                Medium = dto.Medium,
                Fluid = dto.Fluid,
                IsQM = dto.IsQM,
                QMUnit = dto.QMUnit,
                QMMax = dto.QMMax,
                QMNor = dto.QMNor,
                QMMin = dto.QMMin,
                QNUnit = dto.QNUnit,
                QNMax = dto.QNMax,
                QNNor = dto.QNNor,
                QNMin = dto.QNMin,
                IsP2 = dto.IsP2,
                IsDensity = dto.IsDensity,
                PressureUnit = dto.PressureUnit,
                InletPressureMaxQ = dto.InletPressureMaxQ,
                InletPressureNorQ = dto.InletPressureNorQ,
                InletPressureMinQ = dto.InletPressureMinQ,
                OutletPressureMaxQ = dto.OutletPressureMaxQ,
                OutletPressureNorQ = dto.OutletPressureNorQ,
                OutletPressureMinQ = dto.OutletPressureMinQ,
                DifferentialPressureMaxQ = dto.DifferentialPressureMaxQ,
                DifferentialPressureNorQ = dto.DifferentialPressureNorQ,
                DifferentialPressureMinQ = dto.DifferentialPressureMinQ,
                TemperatureUnit = dto.TemperatureUnit,
                InletTemperatureQ = dto.InletTemperatureQ,
                InletTemperatureNorQ = dto.InletTemperatureNorQ,
                InletTemperatureMinQ = dto.InletTemperatureMinQ,
                DensityUnit = dto.DensityUnit,
                Density = dto.Density,
                MolecularWeightUnit = dto.MolecularWeightUnit,
                MolecularWeight = dto.MolecularWeight,

                BodySize = dto.BodySize,
                BodyMat = dto.BodyMat,
                TrimMat = dto.TrimMat,
                TrimOption = dto.TrimOption,

                BodyRating = dto.BodyRating,
                BodyRatingUnit = dto.BodyRatingUnit,
                ActType = dto.ActType,
                IsHW = dto.IsHW,
                IsPositioner = dto.IsPositioner,
                PositionerType = dto.PositionerType,
                ExplosionProof = dto.ExplosionProof,
                TransmitterType = dto.TransmitterType,
                IsSolenoid = dto.IsSolenoid,
                IsLimSwitch = dto.IsLimSwitch,
                IsAirSet = dto.IsAirSet,
                IsVolumeBooster = dto.IsVolumeBooster,
                IsAirOperated = dto.IsAirOperated,
                IsLockUp = dto.IsLockUp,
                IsSnapActingRelay = dto.IsSnapActingRelay
            };

            _context.EstimateRequest.Add(estimateRequest);
            await _context.SaveChangesAsync();

            return new EstimateRequestResponseDto
            {
                TempEstimateNo = estimateRequest.TempEstimateNo,
                SheetID = estimateRequest.SheetID,
                SheetNo = estimateRequest.SheetNo,
                EstimateNo = estimateRequest.EstimateNo,
                ValveType = estimateRequest.ValveType,
                UnitPrice = estimateRequest.UnitPrice,
                Tagno = estimateRequest.Tagno,
                Qty = estimateRequest.Qty,
                Medium = estimateRequest.Medium,
                Fluid = estimateRequest.Fluid,
                IsQM = estimateRequest.IsQM,
                QMUnit = estimateRequest.QMUnit,
                QMMax = estimateRequest.QMMax,
                QMNor = estimateRequest.QMNor,
                QMMin = estimateRequest.QMMin,
                QNUnit = estimateRequest.QNUnit,
                QNMax = estimateRequest.QNMax,
                QNNor = estimateRequest.QNNor,
                QNMin = estimateRequest.QNMin,
                IsP2 = estimateRequest.IsP2,
                IsDensity = estimateRequest.IsDensity,
                PressureUnit = estimateRequest.PressureUnit,
                InletPressureMaxQ = estimateRequest.InletPressureMaxQ,
                InletPressureNorQ = estimateRequest.InletPressureNorQ,
                InletPressureMinQ = estimateRequest.InletPressureMinQ,
                OutletPressureMaxQ = estimateRequest.OutletPressureMaxQ,
                OutletPressureNorQ = estimateRequest.OutletPressureNorQ,
                OutletPressureMinQ = estimateRequest.OutletPressureMinQ,
                DifferentialPressureMaxQ = estimateRequest.DifferentialPressureMaxQ,
                DifferentialPressureNorQ = estimateRequest.DifferentialPressureNorQ,
                DifferentialPressureMinQ = estimateRequest.DifferentialPressureMinQ,
                TemperatureUnit = estimateRequest.TemperatureUnit,
                InletTemperatureQ = estimateRequest.InletTemperatureQ,
                InletTemperatureNorQ = estimateRequest.InletTemperatureNorQ,
                InletTemperatureMinQ = estimateRequest.InletTemperatureMinQ,
                DensityUnit = estimateRequest.DensityUnit,
                Density = estimateRequest.Density,
                MolecularWeightUnit = estimateRequest.MolecularWeightUnit,
                MolecularWeight = estimateRequest.MolecularWeight,
                BodySize = estimateRequest.BodySize,
                BodyMat = estimateRequest.BodyMat,
                TrimMat = estimateRequest.TrimMat,
                TrimOption = estimateRequest.TrimOption,
                BodyRating = estimateRequest.BodyRating,
                ActType = estimateRequest.ActType,
                IsHW = estimateRequest.IsHW,
                IsPositioner = estimateRequest.IsPositioner,
                PositionerType = estimateRequest.PositionerType,
                ExplosionProof = estimateRequest.ExplosionProof,
                TransmitterType = estimateRequest.TransmitterType,
                IsSolenoid = estimateRequest.IsSolenoid,
                IsLimSwitch = estimateRequest.IsLimSwitch,
                IsAirSet = estimateRequest.IsAirSet,
                IsVolumeBooster = estimateRequest.IsVolumeBooster,
                IsAirOperated = estimateRequest.IsAirOperated,
                IsLockUp = estimateRequest.IsLockUp,
                IsSnapActingRelay = estimateRequest.IsSnapActingRelay
            };
        }
        public async Task<EstimateRequestResponseDto?> GetEstimateRequestAsync(string tempEstimateNo, int sheetID)
        {
            var estimateRequest = await _context.EstimateRequest
                .FirstOrDefaultAsync(er => er.TempEstimateNo == tempEstimateNo && er.SheetID == sheetID);

            if (estimateRequest == null) return null;

            return new EstimateRequestResponseDto
            {
                TempEstimateNo = estimateRequest.TempEstimateNo,
                SheetID = estimateRequest.SheetID,
                SheetNo = estimateRequest.SheetNo,
                EstimateNo = estimateRequest.EstimateNo,
                ValveType = estimateRequest.ValveType,
                UnitPrice = estimateRequest.UnitPrice,
                Tagno = estimateRequest.Tagno,
                Qty = estimateRequest.Qty,
                Medium = estimateRequest.Medium,
                Fluid = estimateRequest.Fluid,
                IsQM = estimateRequest.IsQM,
                QMUnit = estimateRequest.QMUnit,
                QMMax = estimateRequest.QMMax,
                QMNor = estimateRequest.QMNor,
                QMMin = estimateRequest.QMMin,
                QNUnit = estimateRequest.QNUnit,
                QNMax = estimateRequest.QNMax,
                QNNor = estimateRequest.QNNor,
                QNMin = estimateRequest.QNMin,
                IsP2 = estimateRequest.IsP2,
                IsDensity = estimateRequest.IsDensity,
                PressureUnit = estimateRequest.PressureUnit,
                InletPressureMaxQ = estimateRequest.InletPressureMaxQ,
                InletPressureNorQ = estimateRequest.InletPressureNorQ,
                InletPressureMinQ = estimateRequest.InletPressureMinQ,
                OutletPressureMaxQ = estimateRequest.OutletPressureMaxQ,
                OutletPressureNorQ = estimateRequest.OutletPressureNorQ,
                OutletPressureMinQ = estimateRequest.OutletPressureMinQ,
                DifferentialPressureMaxQ = estimateRequest.DifferentialPressureMaxQ,
                DifferentialPressureNorQ = estimateRequest.DifferentialPressureNorQ,
                DifferentialPressureMinQ = estimateRequest.DifferentialPressureMinQ,
                TemperatureUnit = estimateRequest.TemperatureUnit,
                InletTemperatureQ = estimateRequest.InletTemperatureQ,
                InletTemperatureNorQ = estimateRequest.InletTemperatureNorQ,
                InletTemperatureMinQ = estimateRequest.InletTemperatureMinQ,
                DensityUnit = estimateRequest.DensityUnit,
                Density = estimateRequest.Density,
                MolecularWeightUnit = estimateRequest.MolecularWeightUnit,
                MolecularWeight = estimateRequest.MolecularWeight,
                BodySize = estimateRequest.BodySize,
                BodyMat = estimateRequest.BodyMat,
                TrimMat = estimateRequest.TrimMat,
                TrimOption = estimateRequest.TrimOption,
                BodyRating = estimateRequest.BodyRating,
                BodyRatingUnit = estimateRequest.BodyRatingUnit,
                ActType = estimateRequest.ActType,
                IsHW = estimateRequest.IsHW,
                IsPositioner = estimateRequest.IsPositioner,
                PositionerType = estimateRequest.PositionerType,
                ExplosionProof = estimateRequest.ExplosionProof,
                TransmitterType = estimateRequest.TransmitterType,
                IsSolenoid = estimateRequest.IsSolenoid,
                IsLimSwitch = estimateRequest.IsLimSwitch,
                IsAirSet = estimateRequest.IsAirSet,
                IsVolumeBooster = estimateRequest.IsVolumeBooster,
                IsAirOperated = estimateRequest.IsAirOperated,
                IsLockUp = estimateRequest.IsLockUp,
                IsSnapActingRelay = estimateRequest.IsSnapActingRelay
            };
        }

        public async Task<List<EstimateRequestListResponseDto>> GetEstimateRequestsAsync(string tempEstimateNo)
        {
            return await _context.EstimateRequest
                .Where(er => er.TempEstimateNo == tempEstimateNo)
                .OrderBy(er => er.SheetNo)
                .Select(er => new EstimateRequestListResponseDto
                {
                    TempEstimateNo = er.TempEstimateNo,
                    SheetID = er.SheetID,
                    SheetNo = er.SheetNo,
                    Tagno = er.Tagno,
                    Qty = er.Qty,
                    Medium = er.Medium,
                    Fluid = er.Fluid,
                    ValveType = er.ValveType
                })
                .ToListAsync();
        }

        public async Task<bool> UpdateEstimateRequestAsync(string tempEstimateNo, int sheetID, CreateEstimateRequestDto dto)
        {
            var estimateRequest = await _context.EstimateRequest
                .FirstOrDefaultAsync(er => er.TempEstimateNo == tempEstimateNo && er.SheetID == sheetID);

            if (estimateRequest == null) return false;

            estimateRequest.Tagno = dto.Tagno;
            estimateRequest.Qty = dto.Qty;
            estimateRequest.Medium = dto.Medium;
            estimateRequest.Fluid = dto.Fluid;
            estimateRequest.IsQM = dto.IsQM;
            estimateRequest.QMUnit = dto.QMUnit;
            estimateRequest.QMMax = dto.QMMax;
            estimateRequest.QMNor = dto.QMNor;
            estimateRequest.QMMin = dto.QMMin;
            estimateRequest.QNUnit = dto.QNUnit;
            estimateRequest.QNMax = dto.QNMax;
            estimateRequest.QNNor = dto.QNNor;
            estimateRequest.QNMin = dto.QNMin;
            estimateRequest.IsP2 = dto.IsP2;
            estimateRequest.IsDensity = dto.IsDensity;
            estimateRequest.PressureUnit = dto.PressureUnit;
            estimateRequest.InletPressureMaxQ = dto.InletPressureMaxQ;
            estimateRequest.InletPressureNorQ = dto.InletPressureNorQ;
            estimateRequest.InletPressureMinQ = dto.InletPressureMinQ;
            estimateRequest.OutletPressureMaxQ = dto.OutletPressureMaxQ;
            estimateRequest.OutletPressureNorQ = dto.OutletPressureNorQ;
            estimateRequest.OutletPressureMinQ = dto.OutletPressureMinQ;
            estimateRequest.DifferentialPressureMaxQ = dto.DifferentialPressureMaxQ;
            estimateRequest.DifferentialPressureNorQ = dto.DifferentialPressureNorQ;
            estimateRequest.DifferentialPressureMinQ = dto.DifferentialPressureMinQ;
            estimateRequest.TemperatureUnit = dto.TemperatureUnit;
            estimateRequest.InletTemperatureQ = dto.InletTemperatureQ;
            estimateRequest.InletTemperatureNorQ = dto.InletTemperatureNorQ;
            estimateRequest.InletTemperatureMinQ = dto.InletTemperatureMinQ;
            estimateRequest.DensityUnit = dto.DensityUnit;
            estimateRequest.Density = dto.Density;
            estimateRequest.MolecularWeightUnit = dto.MolecularWeightUnit;
            estimateRequest.MolecularWeight = dto.MolecularWeight;

            estimateRequest.BodySize = dto.BodySize;
            estimateRequest.BodyMat = dto.BodyMat;
            estimateRequest.TrimMat = dto.TrimMat;
            estimateRequest.TrimOption = dto.TrimOption;

            estimateRequest.BodyRating = dto.BodyRating;
            estimateRequest.ActType = dto.ActType;
            estimateRequest.IsHW = dto.IsHW;
            estimateRequest.IsPositioner = dto.IsPositioner;
            estimateRequest.PositionerType = dto.PositionerType;
            estimateRequest.ExplosionProof = dto.ExplosionProof;
            estimateRequest.TransmitterType = dto.TransmitterType;
            estimateRequest.IsSolenoid = dto.IsSolenoid;
            estimateRequest.IsLimSwitch = dto.IsLimSwitch;
            estimateRequest.IsAirSet = dto.IsAirSet;
            estimateRequest.IsVolumeBooster = dto.IsVolumeBooster;
            estimateRequest.IsAirOperated = dto.IsAirOperated;
            estimateRequest.IsLockUp = dto.IsLockUp;
            estimateRequest.IsSnapActingRelay = dto.IsSnapActingRelay;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteEstimateRequestAsync(string tempEstimateNo, int sheetID)
        {
            var estimateRequest = await _context.EstimateRequest
                .FirstOrDefaultAsync(er => er.TempEstimateNo == tempEstimateNo && er.SheetID == sheetID);

            if (estimateRequest == null) return false;

            _context.EstimateRequest.Remove(estimateRequest);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateEstimateRequestOrderAsync(string tempEstimateNo, List<int> sheetIDs)
        {
            var estimateRequests = await _context.EstimateRequest
                .Where(er => er.TempEstimateNo == tempEstimateNo)
                .ToListAsync();

            for (int i = 0; i < sheetIDs.Count; i++)
            {
                var estimateRequest = estimateRequests.FirstOrDefault(er => er.SheetID == sheetIDs[i]);
                if (estimateRequest != null)
                {
                    estimateRequest.SheetNo = i + 1;
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        // 허용된 파일 타입들
        private readonly string[] _allowedFileTypes = {
            "application/pdf",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/x-hwp",
            "application/haansofthwp",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/bmp",
            "image/tiff",
            "image/webp",
            "text/plain",
            "application/zip",
            "application/x-zip-compressed",
            "application/x-rar-compressed",
            "application/x-7z-compressed",
            // 일부 브라우저/클라이언트에서 문서/압축파일을 octet-stream으로 전송하는 경우 허용
            "application/octet-stream"
        };

        // Attachment operations
        public async Task<EstimateAttachmentResponseDto> UploadAttachmentAsync(string tempEstimateNo, IFormFile file, string uploadUserID, string fileType = "customer", string managerFileType = "")
        {
            // 파일 타입 검증
            if (!_allowedFileTypes.Contains(file.ContentType.ToLower()))
            {
                throw new InvalidOperationException($"지원하지 않는 파일 타입입니다: {file.ContentType}");
            }

            // 파일 크기 제한 (10MB)
            if (file.Length > 10 * 1024 * 1024)
            {
                throw new InvalidOperationException("파일 크기는 10MB를 초과할 수 없습니다.");
            }

            // 🔑 attachmentID 기반 중복 체크 (더 정확한 방법)
            var originalFileName = Path.GetFileName(file.FileName); // 🔑 변수 선언을 먼저!
            
            // 관리자 파일 타입에 대해서만 '교체' 동작 수행 (customer는 누적 저장)
            if (fileType == "manager" && !string.IsNullOrEmpty(managerFileType) && managerFileType != "customer")
            {
                var existingAttachment = await _context.EstimateAttachment
                    .FirstOrDefaultAsync(a => a.TempEstimateNo == tempEstimateNo && a.ManagerFileType == managerFileType);

                if (existingAttachment != null)
                {
                    // 기존 파일 삭제
                    if (File.Exists(existingAttachment.FilePath))
                    {
                        try
                        {
                            File.Delete(existingAttachment.FilePath);
                            Console.WriteLine($"✅ 기존 파일 삭제 완료: {existingAttachment.FilePath}");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"⚠️ 기존 파일 삭제 실패: {ex.Message}");
                        }
                    }

                    // 기존 DB 레코드도 삭제
                    _context.EstimateAttachment.Remove(existingAttachment);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"✅ 기존 DB 레코드 삭제 완료");
                }
            }

            // 폴더 크기 제한 (100MB)
            string filesFolder;
            if (fileType == "manager")
            {
                if (!string.IsNullOrEmpty(managerFileType))
                {
                    filesFolder = Path.Combine(Directory.GetCurrentDirectory(), "files", tempEstimateNo, "ResultFiles", managerFileType);
                }
                else
                {
                    filesFolder = Path.Combine(Directory.GetCurrentDirectory(), "files", tempEstimateNo, "ResultFiles");
                }
            }
            else
            {
                // 고객 업로드 파일은 CustomerRequest 경로에 저장
                // ManagerFileType은 명시적으로 'customer'로 남기되, 물리 경로는 CustomerRequest로 분리
                if (string.IsNullOrEmpty(managerFileType)) managerFileType = "customer";
                filesFolder = Path.Combine(Directory.GetCurrentDirectory(), "files", tempEstimateNo, "CustomerRequest");
            }
            
            Console.WriteLine($"📁 파일 저장 경로: {filesFolder}");
            Console.WriteLine($"🔑 현재 작업 디렉토리: {Directory.GetCurrentDirectory()}");

            if (Directory.Exists(filesFolder))
            {
                var currentFolderSize = GetFolderSize(filesFolder);
                if (currentFolderSize + file.Length > 100 * 1024 * 1024)
                {
                    throw new InvalidOperationException("전체 폴더 크기는 100MB를 초과할 수 없습니다.");
                }
            }

            // 폴더 구조 생성
            Directory.CreateDirectory(filesFolder);

            // 파일명 중복 처리 (이미 위에서 선언됨)
            var fileName = await GenerateUniqueFileNameAsync(filesFolder, originalFileName);
            var filePath = Path.Combine(filesFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // DB에 첨부파일 정보 저장
            var attachment = new EstimateAttachment
            {
                TempEstimateNo = tempEstimateNo,
                FileName = originalFileName,
                FilePath = filePath,
                FileSize = (int)file.Length,
                UploadDate = DateTime.Now,
                UploadUserID = uploadUserID,
                ManagerFileType = managerFileType
            };

            _context.EstimateAttachment.Add(attachment);
            await _context.SaveChangesAsync();

            return new EstimateAttachmentResponseDto
            {
                AttachmentID = attachment.AttachmentID,
                TempEstimateNo = tempEstimateNo,
                FileName = originalFileName,
                FilePath = filePath,
                FileSize = (int)file.Length,
                UploadDate = DateTime.Now,
                UploadUserID = uploadUserID,
                ManagerFileType = managerFileType
            };
        }

        // 파일명 중복 처리 메서드
        private async Task<string> GenerateUniqueFileNameAsync(string folderPath, string originalFileName)
        {
            var nameParts = originalFileName.Split('.');
            var extension = nameParts.Length > 1 ? nameParts.Last() : "";
            var baseName = nameParts.Length > 1 ? string.Join(".", nameParts.Take(nameParts.Length - 1)) : originalFileName;
            
            var counter = 1;
            var fileName = originalFileName;
            
            while (File.Exists(Path.Combine(folderPath, fileName)))
            {
                fileName = $"{baseName}_{counter:D3}.{extension}";
                counter++;
            }
            
            return fileName;
        }



        // 폴더 크기 계산 메서드
        private long GetFolderSize(string folderPath)
        {
            if (!Directory.Exists(folderPath))
                return 0;

            var files = Directory.GetFiles(folderPath, "*", SearchOption.AllDirectories);
            return files.Sum(file => new FileInfo(file).Length);
        }

        public async Task<List<EstimateAttachmentResponseDto>> GetAttachmentsAsync(string tempEstimateNo)
        {
            return await _context.EstimateAttachment
                .Include(a => a.UploadUser)
                .Where(a => a.TempEstimateNo == tempEstimateNo)
                .Select(a => new EstimateAttachmentResponseDto
                {
                    AttachmentID = a.AttachmentID,
                    TempEstimateNo = a.TempEstimateNo,
                    FileName = a.FileName,
                    FilePath = a.FilePath,
                    FileSize = a.FileSize,
                    UploadDate = a.UploadDate,
                    UploadUserID = a.UploadUserID,
                    UploadUserName = a.UploadUser!.Name
                })
                .ToListAsync();
        }

        public async Task<bool> DeleteAttachmentAsync(int attachmentID)
        {
            var attachment = await _context.EstimateAttachment.FindAsync(attachmentID);
            if (attachment == null) return false;

            // 파일 삭제
            if (File.Exists(attachment.FilePath))
            {
                File.Delete(attachment.FilePath);
                Console.WriteLine($"🗑️ 파일 삭제됨: {attachment.FilePath}");
                
                // 폴더가 비어있으면 폴더도 삭제
                var folderPath = Path.GetDirectoryName(attachment.FilePath);
                if (!string.IsNullOrEmpty(folderPath) && Directory.Exists(folderPath))
                {
                    var remainingFiles = Directory.GetFiles(folderPath, "*", SearchOption.TopDirectoryOnly);
                    if (remainingFiles.Length == 0)
                    {
                        Directory.Delete(folderPath);
                        Console.WriteLine($"🗑️ 빈 폴더 삭제됨: {folderPath}");
                    }
                }
            }

            _context.EstimateAttachment.Remove(attachment);
            await _context.SaveChangesAsync();
            Console.WriteLine($"🗑️ DB에서 첨부파일 삭제됨: ID {attachmentID}");
            return true;
        }

        // 파일 경로로 직접 삭제하는 메서드 (DB에 저장되지 않은 파일용)
        public async Task<bool> DeleteFileByPathAsync(string filePath)
        {
            try
            {
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in DeleteFileByPathAsync: {ex.Message}"); // Add logging
                return false;
            }
        }

        public async Task<byte[]> DownloadAttachmentAsync(int attachmentID)
        {
            var attachment = await _context.EstimateAttachment.FindAsync(attachmentID);
            if (attachment == null || !File.Exists(attachment.FilePath))
            {
                throw new FileNotFoundException("파일을 찾을 수 없습니다.");
            }

            return await File.ReadAllBytesAsync(attachment.FilePath);
        }

        // Utility methods
        public async Task<string> GenerateTempEstimateNoAsync()
        {
            var today = DateTime.Now;
            var datePrefix = today.ToString("yyyyMMdd");
            
            // 오늘 날짜로 생성된 TempEstimateNo 중 가장 큰 번호 찾기
            var existingNumbers = await _context.EstimateSheetLv1
                .Where(es => es.TempEstimateNo.StartsWith($"TEMP{datePrefix}-"))
                .Select(es => es.TempEstimateNo)
                .ToListAsync();

            int maxNumber = 0;
            foreach (var number in existingNumbers)
            {
                var parts = number.Split('-');
                if (parts.Length == 2 && int.TryParse(parts[1], out int num))
                {
                    maxNumber = Math.Max(maxNumber, num);
                }
            }

            var nextNumber = maxNumber + 1;
            var tempEstimateNo = $"TEMP{datePrefix}-{nextNumber:D3}";

            Console.WriteLine($"새로운 TempEstimateNo 생성: {tempEstimateNo}");

            // 1. EstimateSheetLv1 생성
            var estimateSheet = new EstimateSheetLv1
            {
                TempEstimateNo = tempEstimateNo,
                CustomerID = "customer1", // 기본값 -> currentUserId로 변경
                WriterID = "customer1",   // 기본값 -> currentUserId로 변경
                ManagerID = null,
                CurEstimateNo = null,
                PrevEstimateNo = null,
                Status = (int)EstimateStatus.Draft,
                Project = "",
                CustomerRequirement = "",
                StaffComment = ""
            };
            _context.EstimateSheetLv1.Add(estimateSheet);

            // 2. EstimateRequest 기본 레코드 생성 (SheetID = 1)
            var estimateRequest = new EstimateRequest
            {
                TempEstimateNo = tempEstimateNo,
                SheetID = 1,
                EstimateNo = null,
                SheetNo = 1,
                ValveType = null,
                Tagno = "",
                UnitPrice = null,
                Qty = 1,
                Medium = "",
                Fluid = "",
                IsQM = false,
                QMUnit = "m³/h",
                QMMax = 0,
                QMNor = 0,
                QMMin = 0,
                QNUnit = "m³/h",
                QNMax = 0,
                QNNor = 0,
                QNMin = 0,
                IsP2 = false,
                IsDensity = false,
                PressureUnit = "bar(g)",
                InletPressureMaxQ = 0,
                InletPressureNorQ = 0,
                InletPressureMinQ = 0,
                OutletPressureMaxQ = 0,
                OutletPressureNorQ = 0,
                OutletPressureMinQ = 0,
                DifferentialPressureMaxQ = 0,
                DifferentialPressureNorQ = 0,
                DifferentialPressureMinQ = 0,
                TemperatureUnit = "°C",
                InletTemperatureQ = 0,
                InletTemperatureNorQ = 0,
                InletTemperatureMinQ = 0,
                DensityUnit = "kg/m³",
                Density = 0,
                MolecularWeightUnit = "g/mol",
                MolecularWeight = 0,
                BodySizeUnit = "",
                BodySize = null,
                BodyMat = null,
                TrimMat = null,
                TrimOption = null,
                BodyRating = null,
                BodyRatingUnit = null,
                ActType = null,
                IsHW = false,
                IsPositioner = false,
                PositionerType = null,
                ExplosionProof = null,
                TransmitterType = null,
                IsSolenoid = false,
                IsLimSwitch = false,
                IsAirSet = false,
                IsVolumeBooster = false,
                IsAirOperated = false,
                IsLockUp = false,
                IsSnapActingRelay = false
            };
            _context.EstimateRequest.Add(estimateRequest);

            // 3. DataSheetLv3 기본 레코드 생성 (SheetID = 1)
            var dataSheetLv3 = new DataSheetLv3
            {
                TempEstimateNo = tempEstimateNo,
                SheetID = 1,
                BodySize = null,
                BodyMat = null,
                Rating = null,
                Connection = null,
                BonnetType = null,
                TrimSeries = null,
                TrimType = null,
                TrimPortSize = null,
                TrimMat = null,
                TrimOption = null,
                ActSeriesCode = null,
                ActType = null,
                ActSize = null,
                HW = null
            };
            _context.DataSheetLv3.Add(dataSheetLv3);

            await _context.SaveChangesAsync();
            
            Console.WriteLine($"TempEstimateNo {tempEstimateNo} 생성 완료 - EstimateSheetLv1, EstimateRequest, DataSheetLv3 모두 생성됨");
            
            return tempEstimateNo;
        }

        public async Task<int> GetNextSheetIDAsync(string tempEstimateNo)
        {
            // DataSheetLv3 테이블에서 가장 큰 SheetID 조회
            var maxSheetID = await _context.DataSheetLv3
                .Select(ds => (int?)ds.SheetID)
                .MaxAsync() ?? 0;

            return maxSheetID + 1;
        }

        public async Task<bool> IsDuplicateFileNameAsync(string tempEstimateNo, string fileName)
        {
            return await _context.EstimateAttachment
                .AnyAsync(a => a.TempEstimateNo == tempEstimateNo && a.FileName == fileName);
        }

        public async Task<List<object>> GetBodyValveListAsync()
        {
            var valveList = await _context.BodyValveList
                .Select(v => new { v.ValveSeries, v.ValveSeriesCode })
                .ToListAsync();
            return OrderByCodePreferredObject(valveList.Cast<object>(), "ValveSeriesCode");
        }

        public async Task<List<BodySizeListDto>> GetBodySizeListAsync(string? sizeUnitCode = null)
        {
            var query = _context.BodySizeList.AsQueryable();

            if (!string.IsNullOrEmpty(sizeUnitCode))
            {
                query = query.Where(s => s.UnitCode == sizeUnitCode);
            }

            var list = await query
                .Include(s => s.BodySizeUnit) // Include the navigation property
                .Select(s => new BodySizeListDto
                {
                    SizeUnitCode = s.UnitCode,  // RatingUnitCode와 동일한 패턴
                    BodySizeCode = s.BodySizeCode,
                    BodySize = s.BodySize,
                    SizeUnit = s.BodySizeUnit != null ? s.BodySizeUnit.UnitName : string.Empty  // RatingUnit과 동일한 패턴
                })
                .ToListAsync();

            return list;
        }

        public async Task<List<object>> GetBodyMatListAsync()
        {
            var matList = await _context.BodyMatList
                .Select(m => new { m.BodyMat, m.BodyMatCode })
                .ToListAsync();
            return OrderByCodePreferredObject(matList.Cast<object>(), "BodyMatCode");
        }

        public async Task<List<object>> GetTrimMatListAsync()
{
    var matList = await _context.TrimMatList
        .Select(m => new { trimMatCode = m.TrimMatCode, trimMat = m.TrimMat })
        .OrderBy(m => m.trimMatCode)
        .ToListAsync();
    return matList.Cast<object>().ToList();
}

        public async Task<List<object>> GetTrimOptionListAsync()
{
    var optionList = await _context.TrimOptionList
        .Select(o => new { trimOptionCode = o.TrimOptionCode, trimOption = o.TrimOptionName }) // trimOptionName을 trimOption으로 변경
        .OrderBy(o => o.trimOptionCode)
        .ToListAsync();
    return optionList.Cast<object>().ToList();
}
        public async Task<List<object>> GetBodyRatingListAsync(string? ratingUnitCode = null)
        {
            var query = _context.BodyRatingList.AsQueryable();

            if (!string.IsNullOrEmpty(ratingUnitCode))
            {
                query = query.Where(r => r.RatingUnitCode == ratingUnitCode);
            }

            var list = await query
                .Include(r => r.BodyRatingUnit) // Include the navigation property
                .Select(r => new
                {
                    ratingCode = r.RatingCode,
                    ratingName = r.RatingName,
                    ratingUnitCode = r.RatingUnitCode, // Keep code for filtering
                    ratingUnit = r.BodyRatingUnit != null ? r.BodyRatingUnit.RatingUnit : string.Empty // Get RatingUnit name
                })
                .ToListAsync();

            return OrderByCodePreferredObject(list.Cast<object>(), "ratingCode");
        }

        public async Task<List<string>> GetBodySizeUnitsAsync()
        {
            var units = await _context.BodySizeList
                .Select(s => s.UnitCode)
                .Distinct()
                .OrderBy(u => u)
                .ToListAsync();
            return OrderByCodePreferred(units, u => u).ToList();
        }



        // 특정 UnitCode에 해당하는 BodySize 목록 조회 (새로 추가)
        public async Task<IEnumerable<BodySizeList>> GetBodySizeListByUnitAsync(string unitCode)
        {
            var list = await _context.BodySizeList
                .Where(b => b.UnitCode == unitCode)
                .ToListAsync();
            return OrderByCodePreferred(list, b => b.BodySizeCode);
        }

        // TrimPortSizeUnit 마스터 데이터 조회 (새로 추가)
        public async Task<IEnumerable<TrimPortSizeUnit>> GetTrimPortSizeUnitListAsync()
        {
            var trimUnits = await _context.TrimPortSizeUnit.ToListAsync();
            return OrderByCodePreferred(trimUnits, u => u.UnitCode);
        }

        // 특정 UnitCode에 해당하는 TrimPortSize 목록 조회 (새로 추가)
        public async Task<IEnumerable<TrimPortSizeList>> GetTrimPortSizeListByUnitAsync(string unitCode)
        {
            var trimList = await _context.TrimPortSizeList
                .Where(t => t.UnitCode == unitCode)
                .ToListAsync();
            return OrderByCodePreferred(trimList, t => t.PortSizeCode);
        }

        // BodySizeUnit CRUD 메서드들
        public async Task<bool> AddBodySizeUnitAsync(string unitCode, string unitName)
        {
            try
            {
                if (await _context.BodySizeUnit.AnyAsync(u => u.UnitCode == unitCode))
                {
                    return false; // 중복된 코드
                }

                var newUnit = new BodySizeUnit
                {
                    UnitCode = unitCode,
                    UnitName = unitName
                };

                _context.BodySizeUnit.Add(newUnit);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateBodySizeUnitAsync(string unitCode, string unitName)
        {
            try
            {
                var unit = await _context.BodySizeUnit.FindAsync(unitCode);
                if (unit == null)
                {
                    return false; // 찾을 수 없음
                }

                unit.UnitName = unitName;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteBodySizeUnitAsync(string unitCode)
        {
            try
            {
                var unit = await _context.BodySizeUnit.FindAsync(unitCode);
                if (unit == null)
                {
                    return false; // 찾을 수 없음
                }

                // 사용 중인지 확인
                if (await _context.BodySizeList.AnyAsync(b => b.UnitCode == unitCode))
                {
                    return false; // 사용 중
                }

                _context.BodySizeUnit.Remove(unit);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        // TrimPortSizeUnit CRUD 메서드들
        public async Task<bool> AddTrimPortSizeUnitAsync(string unitCode, string unitName)
        {
            try
            {
                if (await _context.TrimPortSizeUnit.AnyAsync(u => u.UnitCode == unitCode))
                {
                    return false; // 중복된 코드
                }

                var newUnit = new TrimPortSizeUnit
                {
                    UnitCode = unitCode,
                    UnitName = unitName
                };

                _context.TrimPortSizeUnit.Add(newUnit);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateTrimPortSizeUnitAsync(string unitCode, string unitName)
        {
            try
            {
                var unit = await _context.TrimPortSizeUnit.FindAsync(unitCode);
                if (unit == null)
                {
                    return false; // 찾을 수 없음
                }

                unit.UnitName = unitName;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteTrimPortSizeUnitAsync(string unitCode)
        {
            try
            {
                var unit = await _context.TrimPortSizeUnit.FindAsync(unitCode);
                if (unit == null)
                {
                    return false; // 찾을 수 없음
                }

                // 사용 중인지 확인
                if (await _context.TrimPortSizeList.AnyAsync(t => t.UnitCode == unitCode))
                {
                    return false; // 사용 중
                }

                _context.TrimPortSizeUnit.Remove(unit);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<List<object>> GetBodyRatingUnitsAsync()
        {
            var unitList = await _context.BodyRatingUnitList
                .Select(u => new
                {
                    ratingUnitCode = u.RatingUnitCode,
                    ratingUnit = u.RatingUnit
                })
                .ToListAsync();
            return unitList.Cast<object>().ToList();
        }

        // 견적 요청 조회 (검색, 필터링, 페이징)
        public async Task<EstimateInquiryResponseDto> GetEstimateInquiryAsync(EstimateInquiryRequestDto request)
        {
            // 먼저 기본 데이터를 가져온 후 메모리에서 처리
            var baseQuery = from sheet in _context.EstimateSheetLv1
                           join customer in _context.User on sheet.CustomerID equals customer.UserID into customerGroup
                           from c in customerGroup.DefaultIfEmpty()
                           join manager in _context.User on sheet.ManagerID equals manager.UserID into managerGroup
                           from m in managerGroup.DefaultIfEmpty()
                           join writer in _context.User on sheet.WriterID equals writer.UserID into writerGroup
                           from w in writerGroup.DefaultIfEmpty()
                           where sheet.Status >= (int)EstimateStatus.Requested  // 임시저장 제외, 견적요청 이상만
                           select new
                           {
                               sheet.TempEstimateNo,
                               sheet.CurEstimateNo,
                               sheet.CustomerID,
                               sheet.WriterID,
                               sheet.ManagerID,
                               sheet.Status,
                               sheet.Project,
                               CustomerName = c != null ? c.CompanyName : sheet.CustomerID,
                               ManagerName = m != null ? (m.Name ?? m.UserID) : sheet.ManagerID, // 담당자명
                               WriterName = w != null ? w.Name : null, // 작성자명
                               EstimateRequestCount = _context.EstimateRequest
                                   .Where(er => er.TempEstimateNo == sheet.TempEstimateNo)
                                   .Sum(er => er.Qty)
                           };

            var baseData = await baseQuery.ToListAsync();

            // 메모리에서 날짜 파싱 및 필터링
            var processedData = baseData.Select(x => new
            {
                x.TempEstimateNo,
                x.CurEstimateNo,
                x.CustomerID,
                x.WriterID,
                x.ManagerID,
                x.Status,
                x.Project,
                x.CustomerName,
                x.ManagerName, // ManagerName 추가
                x.WriterName,
                x.EstimateRequestCount,
                RequestDate = ParseDateFromTempEstimateNo(x.TempEstimateNo)
            }).AsQueryable();

            // 검색어 필터
            if (!string.IsNullOrEmpty(request.SearchKeyword))
            {
                processedData = processedData.Where(x => 
                    x.TempEstimateNo.Contains(request.SearchKeyword) ||
                    (x.CurEstimateNo != null && x.CurEstimateNo.Contains(request.SearchKeyword)) ||
                    x.CustomerName.Contains(request.SearchKeyword) ||
                    (x.Project != null && x.Project.Contains(request.SearchKeyword)));
            }

            // 기간 필터
            if (request.StartDate.HasValue)
            {
                processedData = processedData.Where(x => x.RequestDate >= request.StartDate.Value);
            }
            if (request.EndDate.HasValue)
            {
                var endDate = request.EndDate.Value.AddDays(1); // 종료일 포함
                processedData = processedData.Where(x => x.RequestDate < endDate);
            }

            // 상태 필터
            if (request.Status.HasValue)
            {
                processedData = processedData.Where(x => x.Status == request.Status.Value);
            }

            // 고객 ID 필터 (고객 권한일 때 자신의 견적만 조회)
            if (!string.IsNullOrEmpty(request.CustomerID))
            {
                processedData = processedData.Where(x => x.CustomerID == request.CustomerID);
            }

            // 전체 개수 계산
            var totalCount = processedData.Count();

            // 정렬
            if (request.IsDescending)
            {
                processedData = processedData.OrderByDescending(x => x.RequestDate);
            }
            else
            {
                processedData = processedData.OrderBy(x => x.RequestDate);
            }

            // 페이징
            var items = processedData
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(x => new EstimateInquiryItemDto
                {
                    EstimateNo = !string.IsNullOrEmpty(x.CurEstimateNo) ? x.CurEstimateNo : x.TempEstimateNo,
                    CompanyName = x.CustomerName,
                    ContactPerson = x.WriterName ?? x.WriterID, // 작성자는 WriterName으로 설정
                    RequestDate = x.RequestDate,
                    Quantity = x.EstimateRequestCount,
                    Status = x.Status,
                    StatusText = GetStatusText(x.Status),
                    Project = x.Project ?? "",
                    TempEstimateNo = x.TempEstimateNo,
                    WriterID = x.WriterID ?? "", // 작성자 ID 추가
                    ManagerID = x.ManagerID, // ManagerID 추가
                    ManagerName = x.ManagerName ?? x.ManagerID ?? "미지정" // ManagerName 추가 및 fallback
                })
                .ToList();

            var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

            return new EstimateInquiryResponseDto
            {
                Items = items,
                TotalCount = totalCount,
                TotalPages = totalPages,
                CurrentPage = request.Page,
                PageSize = request.PageSize
            };
        }

        private static string GetStatusText(int status)
        {
            return EstimateStatusExtensions.ToKoreanText(status);
        }

        private static DateTime ParseDateFromTempEstimateNo(string tempEstimateNo)
        {
            try
            {
                // TEMP20250808-001 형식에서 20250808 부분 추출
                if (tempEstimateNo.StartsWith("TEMP") && tempEstimateNo.Length >= 12)
                {
                    var dateString = tempEstimateNo.Substring(4, 8); // 20250808
                    if (DateTime.TryParseExact(dateString, "yyyyMMdd", null, System.Globalization.DateTimeStyles.None, out DateTime result))
                    {
                        return result;
                    }
                }
            }
            catch
            {
                // 파싱 실패 시 현재 날짜 반환
            }
            
            return DateTime.Now;
        }

        // 견적 상태 업데이트
        public async Task<bool> UpdateEstimateStatusAsync(string tempEstimateNo, EstimateStatus status)
        {
            var estimateSheet = await _context.EstimateSheetLv1
                .FirstOrDefaultAsync(es => es.TempEstimateNo == tempEstimateNo);

            if (estimateSheet == null)
                return false;

            estimateSheet.Status = (int)status;
            await _context.SaveChangesAsync();
            return true;
        }

        // 담당자 지정
        public async Task<bool> AssignManagerAsync(string tempEstimateNo, string managerID)
        {
            var estimateSheet = await _context.EstimateSheetLv1
                .FirstOrDefaultAsync(es => es.TempEstimateNo == tempEstimateNo);

            if (estimateSheet == null)
                return false;

            // 담당자가 실제로 존재하는지 확인
            var manager = await _context.User
                .FirstOrDefaultAsync(u => u.UserID == managerID && (u.RoleID == 1 || u.RoleID == 2));

            if (manager == null)
                return false;

            estimateSheet.ManagerID = managerID;
            estimateSheet.Status = (int)EstimateStatus.InProgress; // 상태를 견적처리중(3)으로 변경
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<string> GenerateCurEstimateNoAsync()
        {
            var today = DateTime.Now;
            var datePrefix = today.ToString("yyyyMMdd");
            var prefix = $"YA{datePrefix}-";

            var existingNumbers = await _context.EstimateSheetLv1
                .Where(es => es.CurEstimateNo != null && es.CurEstimateNo.StartsWith(prefix))
                .Select(es => es.CurEstimateNo!)
                .ToListAsync();

            var maxSeq = 0;
            foreach (var no in existingNumbers)
            {
                var parts = no.Split('-');
                if (parts.Length == 2 && int.TryParse(parts[1], out int seq))
                    maxSeq = Math.Max(maxSeq, seq);
            }

            var next = maxSeq + 1;
            return $"{prefix}{next:D3}";
        }

        public async Task<string?> CompleteEstimateAsync(string tempEstimateNo)
        {
            var sheet = await _context.EstimateSheetLv1.FirstOrDefaultAsync(x => x.TempEstimateNo == tempEstimateNo);
            if (sheet == null) return null;

            if (string.IsNullOrEmpty(sheet.CurEstimateNo))
            {
                sheet.CurEstimateNo = await GenerateCurEstimateNoAsync();
            }
            sheet.Status = (int)EstimateStatus.Completed; // 견적완료(가정: 4)
            await _context.SaveChangesAsync();
            return sheet.CurEstimateNo;
        }

        public async Task<bool> CancelCompletionAsync(string tempEstimateNo)
        {
            var sheet = await _context.EstimateSheetLv1.FirstOrDefaultAsync(x => x.TempEstimateNo == tempEstimateNo);
            if (sheet == null) return false;
            // 이전 완료 번호를 보존하고 현재 번호는 해제하여 재발급 가능하게 함
            if (!string.IsNullOrEmpty(sheet.CurEstimateNo))
            {
                sheet.PrevEstimateNo = sheet.CurEstimateNo;
                sheet.CurEstimateNo = null;
            }
            sheet.Status = (int)EstimateStatus.InProgress; // 진행중으로 되돌림
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ConfirmOrderAsync(string tempEstimateNo)
        {
            var sheet = await _context.EstimateSheetLv1.FirstOrDefaultAsync(x => x.TempEstimateNo == tempEstimateNo);
            if (sheet == null) return false;
            sheet.Status = (int)EstimateStatus.Ordered; // 주문
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CancelOrderAsync(string tempEstimateNo)
        {
            var sheet = await _context.EstimateSheetLv1.FirstOrDefaultAsync(x => x.TempEstimateNo == tempEstimateNo);
            if (sheet == null) return false;
            sheet.Status = (int)EstimateStatus.Completed; // 견적완료
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CancelStartAsync(string tempEstimateNo)
        {
            var sheet = await _context.EstimateSheetLv1.FirstOrDefaultAsync(x => x.TempEstimateNo == tempEstimateNo);
            if (sheet == null) return false;
            sheet.Status = (int)EstimateStatus.Requested; // 견적요청
            sheet.ManagerID = null;
            await _context.SaveChangesAsync();
            return true;
        }

        // 임시저장 목록 조회
        public async Task<EstimateInquiryResponseDto> GetDraftEstimatesAsync(EstimateInquiryRequestDto request, string currentUserId, string? customerId = null)
        {
            // 기본 데이터를 가져온 후 메모리에서 처리
            var baseQuery = from sheet in _context.EstimateSheetLv1
                           join customer in _context.User on sheet.CustomerID equals customer.UserID into customerGroup
                           from c in customerGroup.DefaultIfEmpty()
                           join writer in _context.User on sheet.WriterID equals writer.UserID into writerGroup
                           from w in writerGroup.DefaultIfEmpty()
                           join manager in _context.User on sheet.ManagerID equals manager.UserID into managerGroup
                           from m in managerGroup.DefaultIfEmpty()
                           where (sheet.WriterID == currentUserId || sheet.CustomerID == currentUserId)  // 작성자이거나 고객이면 표시
                               && (customerId == null || sheet.CustomerID == customerId)  // 고객 ID 필터 추가
                           select new
                           {
                               sheet.TempEstimateNo,
                               sheet.CurEstimateNo,
                               sheet.CustomerID,
                               sheet.WriterID,
                               sheet.ManagerID,
                               sheet.Status,
                               sheet.Project,
                               CustomerName = c != null ? c.CompanyName : sheet.CustomerID,
                               WriterName = w != null ? w.Name : null,
                               ManagerName = m != null ? m.Name : null,
                               EstimateRequestCount = _context.EstimateRequest
                                   .Where(er => er.TempEstimateNo == sheet.TempEstimateNo)
                                   .Sum(er => er.Qty)
                           };

            var baseData = await baseQuery.ToListAsync();

            // 메모리에서 날짜 파싱 및 필터링
            var processedData = baseData.Select(x => new
            {
                x.TempEstimateNo,
                x.CurEstimateNo,
                x.CustomerID,
                x.WriterID,
                x.ManagerID,
                x.Status,
                x.Project,
                x.CustomerName,
                x.WriterName,
                x.ManagerName,
                x.EstimateRequestCount,
                RequestDate = ParseDateFromTempEstimateNo(x.TempEstimateNo)
            }).AsQueryable();

            // 상태 필터
            if (request.Status.HasValue)
            {
                processedData = processedData.Where(x => x.Status == request.Status.Value);
            }

            // 검색어 필터
            if (!string.IsNullOrEmpty(request.SearchKeyword))
            {
                processedData = processedData.Where(x => 
                    x.TempEstimateNo.Contains(request.SearchKeyword) ||
                    (x.CurEstimateNo != null && x.CurEstimateNo.Contains(request.SearchKeyword)) ||
                    x.CustomerName.Contains(request.SearchKeyword) ||
                    (x.Project != null && x.Project.Contains(request.SearchKeyword)));
            }

            // 기간 필터
            if (request.StartDate.HasValue)
            {
                processedData = processedData.Where(x => x.RequestDate >= request.StartDate.Value);
            }
            if (request.EndDate.HasValue)
            {
                var endDate = request.EndDate.Value.AddDays(1);
                processedData = processedData.Where(x => x.RequestDate < endDate);
            }

            // 전체 개수 계산
            var totalCount = processedData.Count();

            // 정렬
            if (request.IsDescending)
            {
                processedData = processedData.OrderByDescending(x => x.RequestDate);
            }
            else
            {
                processedData = processedData.OrderBy(x => x.RequestDate);
            }

            // 페이징
            var items = processedData
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(x => new EstimateInquiryItemDto
                {
                    EstimateNo = x.CurEstimateNo ?? x.TempEstimateNo,
                    CompanyName = x.CustomerName,
                    ContactPerson = x.WriterName ?? x.WriterID,
                    RequestDate = x.RequestDate,
                    Quantity = x.EstimateRequestCount,
                    StatusText = EstimateStatusExtensions.ToKoreanText(x.Status),
                    Status = x.Status,
                    Project = x.Project ?? "",
                    TempEstimateNo = x.TempEstimateNo,
                    WriterID = x.WriterID,
                    ManagerID = x.ManagerID,
                    ManagerName = x.ManagerName,
                })
                .ToList();

            var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

            return new EstimateInquiryResponseDto
            {
                Items = items,
                TotalCount = totalCount,
                TotalPages = totalPages,
                CurrentPage = request.Page,
                PageSize = request.PageSize
            };
        }

        // 견적 상세 조회
        public async Task<EstimateDetailResponseDto?> GetEstimateDetailAsync(string tempEstimateNo, string currentUserId)
        {
            // 1. EstimateSheetLv1 조회
            var estimateSheet = await _context.EstimateSheetLv1
                .Include(es => es.Customer)
                .Include(es => es.Writer)
                .Include(es => es.Manager)
                .FirstOrDefaultAsync(es => es.TempEstimateNo == tempEstimateNo);

            if (estimateSheet == null)
                return null;

            // 2. EstimateRequest 목록 조회
            var estimateRequests = await _context.EstimateRequest
                .Where(er => er.TempEstimateNo == tempEstimateNo)
                .OrderBy(er => er.SheetID)
                .ToListAsync();

            // 3. 첨부파일 목록 조회
            var attachments = await _context.EstimateAttachment
                .Where(ea => ea.TempEstimateNo == tempEstimateNo)
                .Select(ea => new EstimateAttachmentResponseDto
                {
                    AttachmentID = ea.AttachmentID,
                    TempEstimateNo = ea.TempEstimateNo,
                    FileName = ea.FileName,
                    FilePath = ea.FilePath,
                    FileSize = ea.FileSize,
                    UploadUserID = ea.UploadUserID
                })
                .ToListAsync();

            // 4. 권한 확인
            bool canEdit = (estimateSheet.Status == (int)EstimateStatus.Draft || 
                           estimateSheet.Status == (int)EstimateStatus.Requested) &&
                           estimateSheet.WriterID == currentUserId;

            // 5. 현재 사용자 역할 확인
            var currentUser = await _context.User.FirstOrDefaultAsync(u => u.UserID == currentUserId);
            string currentUserRole = currentUser?.RoleID switch
            {
                1 => "Admin",
                2 => "Staff", 
                3 => "Customer",
                _ => "Unknown"
            };

            // 6. EstimateRequest를 ValveType별로 그룹핑하여 변환 (SheetNo 순서대로)
            var groupedRequests = estimateRequests
                .GroupBy(er => er.ValveType ?? "")
                .Select(group => new EstimateRequestDetailDto
                {
                    ValveType = group.Key,
                    TagNos = group
                        .OrderBy(er => er.SheetNo) // SheetNo 순서대로 정렬
                        .Select(er => new TagNoDetailDto
                        {
                            SheetID = er.SheetID,
                            TagNo = er.Tagno ?? "",
                            Qty = er.Qty,
                            Medium = er.Medium,
                            Fluid = er.Fluid,
                            IsQM = er.IsQM ?? false,
                            QMUnit = er.QMUnit,
                            QMMax = er.QMMax,
                            QMNor = er.QMNor,
                            QMMin = er.QMMin,
                            QNUnit = er.QNUnit,
                            QNMax = er.QNMax,
                            QNNor = er.QNNor,
                            QNMin = er.QNMin,
                            IsP2 = er.IsP2 ?? false,
                            IsDensity = er.IsDensity ?? false,
                            PressureUnit = er.PressureUnit,
                            InletPressureMaxQ = er.InletPressureMaxQ,
                            InletPressureNorQ = er.InletPressureNorQ,
                            InletPressureMinQ = er.InletPressureMinQ,
                            OutletPressureMaxQ = er.OutletPressureMaxQ,
                            OutletPressureNorQ = er.OutletPressureNorQ,
                            OutletPressureMinQ = er.OutletPressureMinQ,
                            DifferentialPressureMaxQ = er.DifferentialPressureMaxQ,
                            DifferentialPressureNorQ = er.DifferentialPressureNorQ,
                            DifferentialPressureMinQ = er.DifferentialPressureMinQ,
                            TemperatureUnit = er.TemperatureUnit,
                            InletTemperatureQ = er.InletTemperatureQ,
                            InletTemperatureNorQ = er.InletTemperatureNorQ,
                            InletTemperatureMinQ = er.InletTemperatureMinQ,
                            DensityUnit = er.DensityUnit,
                            Density = er.Density,
                            MolecularWeightUnit = er.MolecularWeightUnit,
                            MolecularWeight = er.MolecularWeight,
                            BodySizeUnit = er.BodySizeUnit,
                            BodySize = er.BodySize,
                            BodyMat = er.BodyMat,
                            TrimMat = er.TrimMat,
                            TrimOption = er.TrimOption,
                            BodyRating = er.BodyRating,
                            BodyRatingUnit = er.BodyRatingUnit,
                            ActType = er.ActType,
                            IsHW = er.IsHW,
                            IsPositioner = er.IsPositioner,
                            PositionerType = er.PositionerType,
                            ExplosionProof = er.ExplosionProof,
                            TransmitterType = er.TransmitterType,
                            IsSolenoid = er.IsSolenoid,
                            IsLimSwitch = er.IsLimSwitch,
                            IsAirSet = er.IsAirSet,
                            IsVolumeBooster = er.IsVolumeBooster,
                            IsAirOperated = er.IsAirOperated,
                            IsLockUp = er.IsLockUp,
                            IsSnapActingRelay = er.IsSnapActingRelay
                        }).ToList()
                })
                .OrderBy(g => g.TagNos.FirstOrDefault()?.SheetID ?? 0) // ValveType 그룹도 첫 번째 SheetID 순서로 정렬
                .ToList();

            // 7. DTO 변환
            var response = new EstimateDetailResponseDto
            {
                EstimateSheet = new EstimateSheetInfoDto
                {
                    TempEstimateNo = estimateSheet.TempEstimateNo,
                    CurEstimateNo = estimateSheet.CurEstimateNo,
                    PrevEstimateNo = estimateSheet.PrevEstimateNo,
                    CustomerID = estimateSheet.CustomerID ?? "",
                    CustomerName = estimateSheet.Customer?.CompanyName ?? estimateSheet.CustomerID ?? "",
                    CustomerUserName = estimateSheet.Customer?.Name ?? estimateSheet.CustomerID ?? "",
                    WriterID = estimateSheet.WriterID ?? "",
                    WriterName = estimateSheet.Writer?.Name ?? estimateSheet.WriterID ?? "",
                    ManagerID = estimateSheet.ManagerID,
                    ManagerName = estimateSheet.Manager?.Name ?? estimateSheet.ManagerID ?? "",
                    Status = estimateSheet.Status,
                    StatusText = EstimateStatusExtensions.ToKoreanText(estimateSheet.Status),
                    Project = estimateSheet.Project,
                    CustomerRequirement = estimateSheet.CustomerRequirement,
                    StaffComment = estimateSheet.StaffComment,
                    CreatedDate = ParseDateFromTempEstimateNo(estimateSheet.TempEstimateNo)
                },
                EstimateRequests = groupedRequests,
                Attachments = attachments,
                CanEdit = canEdit,
                CurrentUserRole = currentUserRole
            };

            return response;
        }

        // Step 3 마스터 데이터 메서드들
        public async Task<List<object>> GetBodyBonnetListAsync()
        {
            var bonnetList = await _context.BodyBonnetList
                .Select(b => new { bonnetCode = b.BonnetCode, bonnet = b.BonnetType })
                .OrderBy(b => b.bonnetCode)
                .ToListAsync();
            return bonnetList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetBodyConnectionListAsync()
        {
            var connectionList = await _context.BodyConnectionList
                .Select(c => new { connectionCode = c.ConnectionCode, connection = c.Connection })
                .OrderBy(c => c.connectionCode)
                .ToListAsync();
            return connectionList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetTrimTypeListAsync()
        {
            var trimTypeList = await _context.TrimTypeList
                .Select(t => new { trimTypeCode = t.TrimTypeCode, trimType = t.TrimType })
                .ToListAsync();
            return OrderByCodePreferredObject(trimTypeList.Cast<object>(), "trimTypeCode");
        }

        public async Task<List<object>> GetTrimSeriesListAsync()
        {
            var trimSeriesList = await _context.TrimSeriesList
                .Select(t => new { trimSeriesCode = t.TrimSeriesCode, trimSeries = t.TrimSeries })
                .ToListAsync();
            return OrderByCodePreferredObject(trimSeriesList.Cast<object>(), "trimSeriesCode");
        }

        public async Task<List<TrimPortSizeListDto>> GetTrimPortSizeListAsync()
        {
            try
            {
                var portSizeList = await _context.TrimPortSizeList
                    .Include(t => t.TrimPortSizeUnit)
                    .Select(p => new TrimPortSizeListDto
                    {
                        PortSizeCode = p.PortSizeCode,
                        UnitCode = p.UnitCode,
                        PortSize = p.PortSize,
                        UnitName = p.TrimPortSizeUnit != null ? p.TrimPortSizeUnit.UnitName : string.Empty
                    })
                    .ToListAsync();
                return OrderByCodePreferred(portSizeList, p => p.PortSizeCode).ToList();
            }
            catch (Exception ex)
            {
                // 더 자세한 로깅을 위해 예외 정보를 포함
                throw new Exception($"GetTrimPortSizeListAsync 실행 중 오류 발생: {ex.Message}", ex);
            }
        }
        public async Task<List<object>> GetTrimFormListAsync()
        {
            var formList = await _context.TrimFormList
                .Select(f => new { trimFormCode = f.TrimFormCode, trimForm = f.TrimForm })
                .ToListAsync();
            return OrderByCodePreferredObject(formList.Cast<object>(), "trimFormCode");
        }

        public async Task<List<object>> GetActTypeListAsync()
        {
            var actTypeList = await _context.ActTypeList
                .Select(a => new { actTypeCode = a.ActTypeCode, actType = a.ActType })
                .ToListAsync();
            return OrderByCodePreferredObject(actTypeList.Cast<object>(), "actTypeCode");
        }

        public async Task<List<object>> GetActSeriesListAsync()
        {
            var actSeriesList = await _context.ActSeriesList
                .Select(a => new { actSeriesCode = a.ActSeriesCode, actSeries = a.ActSeries })
                .ToListAsync();
            return OrderByCodePreferredObject(actSeriesList.Cast<object>(), "actSeriesCode");
        }

        public async Task<List<object>> GetActSizeListAsync(string? actSeriesCode = null)
        {
            var query = _context.ActSizeList.AsQueryable();
            if (!string.IsNullOrEmpty(actSeriesCode))
            {
                query = query.Where(a => a.ActSeriesCode == actSeriesCode);
            }
            var list = await query
                .Select(a => new { actSizeCode = a.ActSizeCode, actSize = a.ActSize, actSeriesCode = a.ActSeriesCode })
                .Cast<object>()
                .ToListAsync();
            return OrderByCodePreferredObject(list, "actSizeCode");
        }

        public async Task<List<object>> GetActHWListAsync()
        {
            try
            {
                var hwList = await _context.ActHWList
                    .Select(h => new { hwCode = h.HWCode, hw = h.HW })
                    .ToListAsync();
                return OrderByCodePreferredObject(hwList.Cast<object>(), "hwCode");
            }
            catch (Exception ex)
            {
                // 더 자세한 로깅을 위해 예외 정보를 포함
                throw new Exception($"GetActHWListAsync 실행 중 오류 발생: {ex.Message}", ex);
            }
        }


        public async Task<List<object>> GetAccMakerListAsync(string? accTypeCode = null)
        {
            List<object> resultList = new List<object>();

            switch (accTypeCode)
            {
                case "Positioner":
                    resultList.AddRange(await _context.PositionerMakerList
                        .Select(m => new { AccMakerCode = m.AccMakerCode, AccMakerName = m.AccMakerName })
                        .ToListAsync());
                    break;
                case "Solenoid":
                    resultList.AddRange(await _context.SolenoidMakerList
                        .Select(m => new { AccMakerCode = m.AccMakerCode, AccMakerName = m.AccMakerName })
                        .ToListAsync());
                    break;
                case "Limit":
                    resultList.AddRange(await _context.LimitMakerList
                        .Select(m => new { AccMakerCode = m.AccMakerCode, AccMakerName = m.AccMakerName })
                        .ToListAsync());
                    break;
                case "Airset":
                    resultList.AddRange(await _context.AirsetMakerList
                        .Select(m => new { AccMakerCode = m.AccMakerCode, AccMakerName = m.AccMakerName })
                        .ToListAsync());
                    break;
                case "Volume":
                    resultList.AddRange(await _context.VolumeMakerList
                        .Select(m => new { AccMakerCode = m.AccMakerCode, AccMakerName = m.AccMakerName })
                        .ToListAsync());
                    break;
                case "Airoperate":
                    resultList.AddRange(await _context.AiroperateMakerList
                        .Select(m => new { AccMakerCode = m.AccMakerCode, AccMakerName = m.AccMakerName })
                        .ToListAsync());
                    break;
                case "Lockup":
                    resultList.AddRange(await _context.LockupMakerList
                        .Select(m => new { AccMakerCode = m.AccMakerCode, AccMakerName = m.AccMakerName })
                        .ToListAsync());
                    break;
                case "Snapacting":
                    resultList.AddRange(await _context.SnapactingMakerList
                        .Select(m => new { AccMakerCode = m.AccMakerCode, AccMakerName = m.AccMakerName })
                        .ToListAsync());
                    break;
                default:
                    break;
            }

            return OrderByCodePreferredObject(resultList.Cast<object>(), "AccMakerCode");
        }

        public async Task<List<object>> GetAccModelListAsync(string? accTypeCode = null, string? accMakerCode = null)
        {
            List<object> resultList = new List<object>();

            switch (accTypeCode)
            {
                case "Positioner":
                    var positionerQuery = _context.PositionerList.AsQueryable();
                    if (!string.IsNullOrEmpty(accMakerCode))
                    {
                        positionerQuery = positionerQuery.Where(a => a.AccMakerCode == accMakerCode);
                    }
                    resultList.AddRange(await positionerQuery
                        .Join(_context.PositionerMakerList, 
                              model => model.AccMakerCode, 
                              maker => maker.AccMakerCode, 
                              (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize })
                        .ToListAsync());
                    break;
                case "Solenoid":
                    var solenoidQuery = _context.SolenoidList.AsQueryable();
                    if (!string.IsNullOrEmpty(accMakerCode))
                    {
                        solenoidQuery = solenoidQuery.Where(a => a.AccMakerCode == accMakerCode);
                    }
                    resultList.AddRange(await solenoidQuery
                        .Join(_context.SolenoidMakerList,
                              model => model.AccMakerCode,
                              maker => maker.AccMakerCode,
                              (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize })
                        .ToListAsync());
                    break;
                case "Limit":
                     var limitQuery = _context.LimitList.AsQueryable();
                    if (!string.IsNullOrEmpty(accMakerCode))
                    {
                        limitQuery = limitQuery.Where(a => a.AccMakerCode == accMakerCode);
                    }
                    resultList.AddRange(await limitQuery
                        .Join(_context.LimitMakerList,
                              model => model.AccMakerCode,
                              maker => maker.AccMakerCode,
                              (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize })
                        .ToListAsync());
                    break;
                case "Airset":
                    var airsetQuery = _context.AirsetList.AsQueryable();
                    if (!string.IsNullOrEmpty(accMakerCode))
                    {
                        airsetQuery = airsetQuery.Where(a => a.AccMakerCode == accMakerCode);
                    }
                    resultList.AddRange(await airsetQuery
                        .Join(_context.AirsetMakerList,
                              model => model.AccMakerCode,
                              maker => maker.AccMakerCode,
                              (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize })
                        .ToListAsync());
                    break;
                case "Volume":
                    var volumeQuery = _context.VolumeList.AsQueryable();
                    if (!string.IsNullOrEmpty(accMakerCode))
                    {
                        volumeQuery = volumeQuery.Where(a => a.AccMakerCode == accMakerCode);
                    }
                    resultList.AddRange(await volumeQuery
                        .Join(_context.VolumeMakerList,
                              model => model.AccMakerCode,
                              maker => maker.AccMakerCode,
                              (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize })
                        .ToListAsync());
                    break;
                case "Airoperate":
                    var airoperateQuery = _context.AiroperateList.AsQueryable();
                    if (!string.IsNullOrEmpty(accMakerCode))
                    {
                        airoperateQuery = airoperateQuery.Where(a => a.AccMakerCode == accMakerCode);
                    }
                    resultList.AddRange(await airoperateQuery
                        .Join(_context.AiroperateMakerList,
                              model => model.AccMakerCode,
                              maker => maker.AccMakerCode,
                              (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize })
                        .ToListAsync());
                    break;
                case "Lockup":
                    var lockupQuery = _context.LockupList.AsQueryable();
                    if (!string.IsNullOrEmpty(accMakerCode))
                    {
                        lockupQuery = lockupQuery.Where(a => a.AccMakerCode == accMakerCode);
                    }
                    resultList.AddRange(await lockupQuery
                        .Join(_context.LockupMakerList,
                              model => model.AccMakerCode,
                              maker => maker.AccMakerCode,
                              (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize })
                        .ToListAsync());
                    break;
                case "Snapacting":
                    var snapactingQuery = _context.SnapactingList.AsQueryable();
                    if (!string.IsNullOrEmpty(accMakerCode))
                    {
                        snapactingQuery = snapactingQuery.Where(a => a.AccMakerCode == accMakerCode);
                    }
                    resultList.AddRange(await snapactingQuery
                        .Join(_context.SnapactingMakerList,
                              model => model.AccMakerCode,
                              maker => maker.AccMakerCode,
                              (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize })
                        .ToListAsync());
                    break;
                default:
                    break;
            }

            return OrderByCodePreferredObject(resultList.Cast<object>(), "AccModelCode");
        }

        // 마스터 데이터 CRUD 메서드들
        // Body 관련
        public async Task<bool> AddBodyValveAsync(string valveSeriesCode, string valveSeries)
        {
            try
            {
                Console.WriteLine($"🔍 AddBodyValveAsync 호출: valveSeriesCode='{valveSeriesCode}', valveSeries='{valveSeries}'");
                
                // Primary Key 중복 검사
                var existing = await _context.BodyValveList
                    .FirstOrDefaultAsync(b => b.ValveSeriesCode == valveSeriesCode);
                if (existing != null)
                {
                    Console.WriteLine($"❌ 중복된 코드 발견: {valveSeriesCode}");
                    return false; // 중복된 코드
                }

                var newValve = new BodyValveList
                {
                    ValveSeriesCode = valveSeriesCode,
                    ValveSeries = valveSeries
                };

                _context.BodyValveList.Add(newValve);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateBodyValveAsync(string valveSeriesCode, string valveSeries)
        {
            try
            {
                Console.WriteLine($"🔍 UpdateBodyValveAsync 호출: valveSeriesCode='{valveSeriesCode}', valveSeries='{valveSeries}'");
                
                Console.WriteLine($"🔍 데이터베이스에서 코드 '{valveSeriesCode}' 검색 중...");
                var existing = await _context.BodyValveList
                    .FirstOrDefaultAsync(b => b.ValveSeriesCode == valveSeriesCode);
                if (existing == null)
                {
                    Console.WriteLine($"❌ 존재하지 않는 코드: {valveSeriesCode}");
                    // 전체 데이터베이스 내용 확인
                    var allCodes = await _context.BodyValveList.Select(b => b.ValveSeriesCode).ToListAsync();
                    Console.WriteLine($"🔍 데이터베이스에 있는 모든 코드: {string.Join(", ", allCodes)}");
                    return false; // 존재하지 않는 코드
                }

                Console.WriteLine($"✅ 기존 항목 발견: {existing.ValveSeriesCode} -> {existing.ValveSeries}");
                existing.ValveSeries = valveSeries;
                Console.WriteLine($"✅ 업데이트 후: {existing.ValveSeriesCode} -> {existing.ValveSeries}");
                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ 데이터베이스 저장 완료");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ UpdateBodyValveAsync 오류: {ex.Message}");
                Console.WriteLine($"❌ 스택 트레이스: {ex.StackTrace}");
                return false;
            }
        }

        public async Task<bool> DeleteBodyValveAsync(string valveSeriesCode)
        {
            try
            {
                Console.WriteLine($"🔍 DeleteBodyValveAsync 호출: valveSeriesCode='{valveSeriesCode}'");
                
                var existing = await _context.BodyValveList
                    .FirstOrDefaultAsync(b => b.ValveSeriesCode == valveSeriesCode);
                if (existing == null)
                {
                    Console.WriteLine($"❌ 존재하지 않는 코드: {valveSeriesCode}");
                    return false; // 존재하지 않는 코드
                }

                // FK 제약조건 검사 제거 (사용자 요청에 따라 무시)
                // var isUsed = await _context.EstimateRequest
                //     .AnyAsync(er => er.ValveType == valveSeriesCode);
                // if (isUsed)
                // {
                //     return false; // 사용 중인 항목은 삭제 불가
                // }

                _context.BodyValveList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AddBodyBonnetAsync(string bonnetCode, string bonnetType)
        {
            try
            {
                var existing = await _context.BodyBonnetList
                    .FirstOrDefaultAsync(b => b.BonnetCode == bonnetCode);
                if (existing != null)
                {
                    return false;
                }

                var newBonnet = new BodyBonnetList
                {
                    BonnetCode = bonnetCode,
                    BonnetType = bonnetType
                };

                _context.BodyBonnetList.Add(newBonnet);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AddBodyBonnetAsync: {ex.Message}"); // Add logging
                return false;
            }
        }

        // 업데이트 로직 점검 및 개선
        public async Task<bool> UpdateBodyBonnetAsync(string bonnetCode, string bonnetType)
        {
            try
            {
                // 입력값 유효성 검사
                if (string.IsNullOrWhiteSpace(bonnetCode) || string.IsNullOrWhiteSpace(bonnetType))
                {
                    Console.WriteLine("UpdateBodyBonnetAsync: bonnetCode 또는 bonnetType이 비어 있습니다.");
                    return false;
                }

                // 기존 Bonnet 정보 조회
                var existing = await _context.BodyBonnetList
                    .FirstOrDefaultAsync(b => b.BonnetCode == bonnetCode);

                if (existing == null)
                {
                    Console.WriteLine($"UpdateBodyBonnetAsync: BonnetCode '{bonnetCode}'에 해당하는 데이터가 없습니다.");
                    return false;
                }

                // 변경사항이 없는 경우 바로 true 반환 (불필요한 DB 작업 방지)
                if (existing.BonnetType == bonnetType)
                {
                    return true;
                }

                // BonnetType 업데이트
                existing.BonnetType = bonnetType;

                // 변경사항 저장
                var result = await _context.SaveChangesAsync();
                if (result > 0)
                {
                return true;
            }
                else
                {
                    Console.WriteLine("UpdateBodyBonnetAsync: DB에 변경사항이 반영되지 않았습니다.");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"UpdateBodyBonnetAsync 오류: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> DeleteBodyBonnetAsync(string bonnetCode)
        {
            try
            {
                var existing = await _context.BodyBonnetList
                    .FirstOrDefaultAsync(b => b.BonnetCode == bonnetCode);
                if (existing == null)
                {
                    return false;
                }

                // BodyBonnet은 EstimateRequest에서 사용되지 않으므로 FK 체크 생략
                // var isUsed = await _context.EstimateRequest
                //     .AnyAsync(er => er.BodyBonnet == bonnetCode);
                // if (isUsed)
                // {
                //     return false;
                // }

                _context.BodyBonnetList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AddBodyMatAsync(string bodyMatCode, string bodyMat)
        {
            try
            {
                var existing = await _context.BodyMatList
                    .FirstOrDefaultAsync(b => b.BodyMatCode == bodyMatCode);
                if (existing != null)
                {
                    return false;
                }

                var newMaterial = new BodyMatList
                {
                    BodyMatCode = bodyMatCode,
                    BodyMat = bodyMat
                };

                _context.BodyMatList.Add(newMaterial);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateBodyMatAsync(string bodyMatCode, string bodyMat)
        {
            try
            {
                var existing = await _context.BodyMatList
                    .FirstOrDefaultAsync(b => b.BodyMatCode == bodyMatCode);
                if (existing == null)
                {
                    return false;
                }

                existing.BodyMat = bodyMat;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteBodyMatAsync(string bodyMatCode)
        {
            try
            {
                var existing = await _context.BodyMatList
                    .FirstOrDefaultAsync(b => b.BodyMatCode == bodyMatCode);
                if (existing == null)
                {
                    return false;
                }

                var isUsed = await _context.EstimateRequest
                    .AnyAsync(er => er.BodyMat == bodyMatCode);
                if (isUsed)
                {
                    return false;
                }

                _context.BodyMatList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AddBodySizeAsync(string sizeUnit, string bodySizeCode, string bodySize)
        {
            try
            {
                var existing = await _context.BodySizeList
                    .FirstOrDefaultAsync(b => b.UnitCode == sizeUnit && b.BodySizeCode == bodySizeCode);
                if (existing != null)
                {
                    return false;
                }

                var newSize = new BodySizeList
                {
                    UnitCode = sizeUnit,
                    BodySizeCode = bodySizeCode,
                    BodySize = bodySize
                };

                _context.BodySizeList.Add(newSize);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateBodySizeAsync(string sizeUnit, string bodySizeCode, string bodySize)
        {
            try
            {
                var existing = await _context.BodySizeList
                    .FirstOrDefaultAsync(b => b.UnitCode == sizeUnit && b.BodySizeCode == bodySizeCode);
                if (existing == null)
                {
                    return false;
                }

                existing.BodySize = bodySize;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteBodySizeAsync(string sizeUnit, string bodySizeCode)
        {
            try
            {
                var existing = await _context.BodySizeList
                    .FirstOrDefaultAsync(b => b.UnitCode == sizeUnit && b.BodySizeCode == bodySizeCode);
                if (existing == null)
                {
                    return false;
                }

                var isUsed = await _context.EstimateRequest
                    .AnyAsync(er => er.BodySizeUnit == sizeUnit && er.BodySize == existing.BodySize);
                if (isUsed)
                {
                    return false;
                }

                _context.BodySizeList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AddBodyRatingAsync(string ratingCode, string rating, string unit)
        {
            try
            {
                // 복합키 (RatingUnitCode, RatingCode)로 중복 검사
                var existing = await _context.BodyRatingList
                    .FirstOrDefaultAsync(b => b.RatingUnitCode == unit && b.RatingCode == ratingCode);
                if (existing != null)
                {
                    return false;
                }

                var newRating = new BodyRatingList
                {
                    RatingUnitCode = unit,
                    RatingCode = ratingCode,
                    RatingName = rating
                };

                _context.BodyRatingList.Add(newRating);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateBodyRatingAsync(string ratingCode, string rating, string unit)
        {
            try
            {
                // 복합키 (RatingUnitCode, RatingCode)로 검색
                var existing = await _context.BodyRatingList
                    .FirstOrDefaultAsync(b => b.RatingUnitCode == unit && b.RatingCode == ratingCode);
                if (existing == null)
                {
                    return false;
                }

                // RatingName만 수정 가능 (복합키는 수정 불가)
                existing.RatingName = rating;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteBodyRatingAsync(string ratingCode, string unit)
        {
            try
            {
                // 복합키 (RatingUnitCode, RatingCode)로 검색
                var existing = await _context.BodyRatingList
                    .FirstOrDefaultAsync(b => b.RatingUnitCode == unit && b.RatingCode == ratingCode);
                if (existing == null)
                {
                    return false;
                }

                // Rating은 가장 하위 항목이므로 자유롭게 삭제 가능
                // EstimateRequest 체크 제거

                _context.BodyRatingList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AddBodyRatingUnitAsync(string ratingUnitCode, string ratingUnit)
        {
            try
            {
                var existing = await _context.BodyRatingUnitList
                    .FirstOrDefaultAsync(b => b.RatingUnitCode == ratingUnitCode);
                if (existing != null)
                {
                    return false;
                }

                var newRatingUnit = new BodyRatingUnitList
                {
                    RatingUnitCode = ratingUnitCode,
                    RatingUnit = ratingUnit
                };

                _context.BodyRatingUnitList.Add(newRatingUnit);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateBodyRatingUnitAsync(string ratingUnitCode, string ratingUnit)
        {
            try
            {
                var existing = await _context.BodyRatingUnitList
                    .FirstOrDefaultAsync(b => b.RatingUnitCode == ratingUnitCode);
                if (existing == null)
                {
                    return false;
                }

                existing.RatingUnit = ratingUnit;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteBodyRatingUnitAsync(string ratingUnitCode)
        {
            try
            {
                var existing = await _context.BodyRatingUnitList
                    .FirstOrDefaultAsync(b => b.RatingUnitCode == ratingUnitCode);
                if (existing == null)
                {
                    return false;
                }

                // Rating Unit이 사용 중인지 확인
                var isUsed = await _context.BodyRatingList
                    .AnyAsync(br => br.RatingUnitCode == ratingUnitCode);
                if (isUsed)
                {
                    return false;
                }

                _context.BodyRatingUnitList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AddBodyConnectionAsync(string connectionCode, string connection)
        {
            try
            {
                var existing = await _context.BodyConnectionList
                    .FirstOrDefaultAsync(b => b.ConnectionCode == connectionCode);
                if (existing != null)
                {
                    return false;
                }

                var newConnection = new BodyConnectionList
                {
                    ConnectionCode = connectionCode,
                    Connection = connection
                };

                _context.BodyConnectionList.Add(newConnection);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateBodyConnectionAsync(string connectionCode, string connection)
        {
            try
            {
                var existing = await _context.BodyConnectionList
                    .FirstOrDefaultAsync(b => b.ConnectionCode == connectionCode);
                if (existing == null)
                {
                    return false;
                }

                existing.Connection = connection;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }
        public async Task<bool> DeleteBodyConnectionAsync(string connectionCode)
        {
            try
            {
                var existing = await _context.BodyConnectionList
                    .FirstOrDefaultAsync(b => b.ConnectionCode == connectionCode);
                if (existing == null)
                {
                    return false;
                }

                // BodyConnection은 EstimateRequest에서 사용되지 않으므로 FK 체크 생략
                // var isUsed = await _context.EstimateRequest
                //     .AnyAsync(er => er.BodyConnectionCode == connectionCode);
                // if (isUsed)
                // {
                //     return false;
                // }

                _context.BodyConnectionList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        // Trim 관련
        public async Task<bool> AddTrimTypeAsync(string trimTypeCode, string trimType)
        {
            try
            {
                var existing = await _context.TrimTypeList
                    .FirstOrDefaultAsync(t => t.TrimTypeCode == trimTypeCode);
                if (existing != null)
                {
                    return false;
                }

                var newTrimType = new TrimTypeList
                {
                    TrimTypeCode = trimTypeCode,
                    TrimType = trimType
                };

                _context.TrimTypeList.Add(newTrimType);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateTrimTypeAsync(string trimTypeCode, string trimType)
        {
            try
            {
                var existing = await _context.TrimTypeList
                    .FirstOrDefaultAsync(t => t.TrimTypeCode == trimTypeCode);
                if (existing == null)
                {
                    return false;
                }

                existing.TrimType = trimType;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteTrimTypeAsync(string trimTypeCode)
        {
            try
            {
                var existing = await _context.TrimTypeList
                    .FirstOrDefaultAsync(t => t.TrimTypeCode == trimTypeCode);
                if (existing == null)
                {
                    return false;
                }

                var isUsed = await _context.DataSheetLv3
                    .AnyAsync(ds => ds.TrimType == trimTypeCode);
                if (isUsed)
                {
                    return false;
                }

                _context.TrimTypeList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        // Act 관련
        public async Task<bool> AddActTypeAsync(string actTypeCode, string actType)
        {
            try
            {
                var existing = await _context.ActTypeList
                    .FirstOrDefaultAsync(a => a.ActTypeCode == actTypeCode);
                if (existing != null)
                {
                    return false;
                }

                var newActType = new ActTypeList
                {
                    ActTypeCode = actTypeCode,
                    ActType = actType
                };

                _context.ActTypeList.Add(newActType);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateActTypeAsync(string actTypeCode, string actType)
        {
            try
            {
                var existing = await _context.ActTypeList
                    .FirstOrDefaultAsync(a => a.ActTypeCode == actTypeCode);
                if (existing == null)
                {
                    return false;
                }

                existing.ActType = actType;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteActTypeAsync(string actTypeCode)
        {
            try
            {
                var existing = await _context.ActTypeList
                    .FirstOrDefaultAsync(a => a.ActTypeCode == actTypeCode);
                if (existing == null)
                {
                    return false;
                }

                // Act Type은 독립적이므로 직접 삭제 가능
                // (견적에서 사용 중인지는 이미 FK 제약조건 제거로 해결됨)

                _context.ActTypeList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }



        
        // Trim 관련 추가 메서드들
        public async Task<bool> AddTrimSeriesAsync(string trimSeriesCode, string trimSeries)
        {
            try
            {
                var existing = await _context.TrimSeriesList
                    .FirstOrDefaultAsync(t => t.TrimSeriesCode == trimSeriesCode);
                if (existing != null)
                {
                    return false;
                }

                var newTrimSeries = new TrimSeriesList
                {
                    TrimSeriesCode = trimSeriesCode,
                    TrimSeries = trimSeries
                };

                _context.TrimSeriesList.Add(newTrimSeries);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateTrimSeriesAsync(string trimSeriesCode, string trimSeries)
        {
            try
            {
                var existing = await _context.TrimSeriesList
                    .FirstOrDefaultAsync(t => t.TrimSeriesCode == trimSeriesCode);
                if (existing == null)
                {
                    return false;
                }

                existing.TrimSeries = trimSeries;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteTrimSeriesAsync(string trimSeriesCode)
        {
            try
            {
                var existing = await _context.TrimSeriesList
                    .FirstOrDefaultAsync(t => t.TrimSeriesCode == trimSeriesCode);
                if (existing == null)
                {
                    return false;
                }

                var isUsed = await _context.DataSheetLv3
                    .AnyAsync(ds => ds.TrimSeries == trimSeriesCode);
                if (isUsed)
                {
                    return false;
                }

                _context.TrimSeriesList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AddTrimPortSizeAsync(string portSizeCode, string portSize, string unit)
        {
            try
            {
                // 복합키(PortSizeCode + PortSizeUnit)로 중복 확인
                var existing = await _context.TrimPortSizeList
                    .FirstOrDefaultAsync(t => t.PortSizeCode == portSizeCode && t.UnitCode == unit);
                if (existing != null)
                {
                    return false;
                }

                var newTrimPortSize = new TrimPortSizeList
                {
                    PortSizeCode = portSizeCode,
                    PortSize = portSize,
                    UnitCode = unit
                };

                _context.TrimPortSizeList.Add(newTrimPortSize);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateTrimPortSizeAsync(string portSizeCode, string portSize, string unit)
        {
            try
            {
                // 복합키(PortSizeCode + PortSizeUnit)로 기존 항목 찾기
                var existing = await _context.TrimPortSizeList
                    .FirstOrDefaultAsync(t => t.PortSizeCode == portSizeCode && t.UnitCode == unit);
                if (existing == null)
                {
                    return false;
                }

                // PortSize만 업데이트 (복합키는 변경 불가)
                existing.PortSize = portSize;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteTrimPortSizeAsync(string portSizeCode, string unit)
        {
            try
            {
                // 복합키(PortSizeCode + PortSizeUnit)로 기존 항목 찾기
                var existing = await _context.TrimPortSizeList
                    .FirstOrDefaultAsync(t => t.PortSizeCode == portSizeCode && t.UnitCode == unit);
                if (existing == null)
                {
                    return false;
                }

                var isUsed = await _context.DataSheetLv3
                    .AnyAsync(ds => ds.TrimPortSize == portSizeCode);
                if (isUsed)
                {
                    return false;
                }

                _context.TrimPortSizeList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AddTrimFormAsync(string formCode, string form)
        {
            try
            {
                var existing = await _context.TrimFormList
                    .FirstOrDefaultAsync(t => t.TrimFormCode == formCode);
                if (existing != null)
                {
                    return false;
                }

                var newTrimForm = new TrimFormList
                {
                    TrimFormCode = formCode,
                    TrimForm = form
                };

                _context.TrimFormList.Add(newTrimForm);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateTrimFormAsync(string formCode, string form)
        {
            try
            {
                var existing = await _context.TrimFormList
                    .FirstOrDefaultAsync(t => t.TrimFormCode == formCode);
                if (existing == null)
                {
                    return false;
                }

                existing.TrimForm = form;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteTrimFormAsync(string formCode)
        {
            try
            {
                var existing = await _context.TrimFormList
                    .FirstOrDefaultAsync(t => t.TrimFormCode == formCode);
                if (existing == null)
                {
                    return false;
                }

                var isUsed = await _context.DataSheetLv3
                    .AnyAsync(ds => ds.TrimForm == formCode);
                if (isUsed)
                {
                    return false;
                }

                _context.TrimFormList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        // Act 관련 추가 메서드들
        public async Task<bool> AddActSeriesAsync(string actSeriesCode, string actSeries)
        {
            try
            {
                var existing = await _context.ActSeriesList
                    .FirstOrDefaultAsync(a => a.ActSeriesCode == actSeriesCode);
                if (existing != null)
                {
                    return false;
                }

                var newActSeries = new ActSeriesList
                {
                    ActSeriesCode = actSeriesCode,
                    ActSeries = actSeries
                };

                _context.ActSeriesList.Add(newActSeries);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateActSeriesAsync(string actSeriesCode, string actSeries)
        {
            try
            {
                var existing = await _context.ActSeriesList
                    .FirstOrDefaultAsync(a => a.ActSeriesCode == actSeriesCode);
                if (existing == null)
                {
                    return false;
                }

                existing.ActSeries = actSeries;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteActSeriesAsync(string actSeriesCode)
        {
            try
            {
                var existing = await _context.ActSeriesList
                    .FirstOrDefaultAsync(a => a.ActSeriesCode == actSeriesCode);
                if (existing == null)
                {
                    return false;
                }

                // Act Series 삭제 시 하위 Act Size들도 함께 삭제
                var relatedSizes = await _context.ActSizeList
                    .Where(a => a.ActSeriesCode == actSeriesCode)
                    .ToListAsync();
                
                if (relatedSizes.Any())
                {
                    _context.ActSizeList.RemoveRange(relatedSizes);
                }

                _context.ActSeriesList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AddActSeriesSizeAsync(string seriesSizeCode, string seriesSize, string unit)
        {
            try
            {
                var existing = await _context.ActSizeList
                    .FirstOrDefaultAsync(a => a.ActSizeCode == seriesSizeCode);
                if (existing != null)
                {
                    return false;
                }

                var newActSeriesSize = new ActSizeList
                {
                    ActSizeCode = seriesSizeCode,
                    ActSize = seriesSize,
                    ActSeriesCode = unit // unit을 ActSeriesCode로 사용
                };

                _context.ActSizeList.Add(newActSeriesSize);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateActSeriesSizeAsync(string seriesSizeCode, string seriesSize, string unit)
        {
            try
            {
                var existing = await _context.ActSizeList
                    .FirstOrDefaultAsync(a => a.ActSizeCode == seriesSizeCode);
                if (existing == null)
                {
                    return false;
                }

                existing.ActSize = seriesSize;
                existing.ActSeriesCode = unit; // unit을 ActSeriesCode로 사용
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteActSeriesSizeAsync(string seriesSizeCode)
        {
            try
            {
                var existing = await _context.ActSizeList
                    .FirstOrDefaultAsync(a => a.ActSizeCode == seriesSizeCode);
                if (existing == null)
                {
                    return false;
                }

                var isUsed = await _context.DataSheetLv3
                    .AnyAsync(ds => ds.ActSize == seriesSizeCode);
                if (isUsed)
                {
                    return false;
                }

                _context.ActSizeList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AddActHWAsync(string hwCode, string hw)
        {
            try
            {
                var existing = await _context.ActHWList
                    .FirstOrDefaultAsync(a => a.HWCode == hwCode);
                if (existing != null)
                {
                    return false;
                }

                var newActHW = new ActHWList
                {
                    HWCode = hwCode,
                    HW = hw
                };

                _context.ActHWList.Add(newActHW);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateActHWAsync(string hwCode, string hw)
        {
            try
            {
                var existing = await _context.ActHWList
                    .FirstOrDefaultAsync(a => a.HWCode == hwCode);
                if (existing == null)
                {
                    return false;
                }

                existing.HW = hw;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteActHWAsync(string hwCode)
        {
            try
            {
                var existing = await _context.ActHWList
                    .FirstOrDefaultAsync(a => a.HWCode == hwCode);
                if (existing == null)
                {
                    return false;
                }

                // Act HW는 직접적으로 하위 계층이 없으므로 삭제 가능
                // (견적에서 사용 중인지는 이미 FK 제약조건 제거로 해결됨)

                _context.ActHWList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        // Act Series-Size 조회를 위한 새로운 메서드
        public async Task<List<object>> GetActSeriesSizeListAsync()
        {
            try
            {
                var result = await _context.ActSizeList
                    .Select(a => new
                    {
                        code = a.ActSizeCode,
                        name = a.ActSize,
                        seriesCode = a.ActSeriesCode, // ActSeriesCode를 명확하게 반환
                        unit = a.ActSize // 실제 size 값을 unit으로 반환
                    })
                    .ToListAsync();

                return result.Cast<object>().ToList();
            }
            catch
            {
                return new List<object>();
            }
        }

        // Acc 관련 추가 메서드들
        // accTypeCode에 따라 각 Acc Maker 테이블에 추가하는 switch문 방식으로 변경
        public async Task<bool> AddAccMakerAsync(string accTypeCode, string makerCode, string maker)
        {
            try
            {
                switch (accTypeCode)
                {
                    case "Positioner":
                        if (await _context.PositionerMakerList.AnyAsync(m => m.AccMakerCode == makerCode))
                            return false;
                            _context.PositionerMakerList.Add(new PositionerMakerList { AccMakerCode = makerCode, AccMakerName = maker });
                        break;
                    case "Solenoid":
                        if (await _context.SolenoidMakerList.AnyAsync(m => m.AccMakerCode == makerCode))
                            return false;
                            _context.SolenoidMakerList.Add(new SolenoidMakerList { AccMakerCode = makerCode, AccMakerName = maker });
                        break;
                    case "Limit":
                        if (await _context.LimitMakerList.AnyAsync(m => m.AccMakerCode == makerCode))
                            return false;
                            _context.LimitMakerList.Add(new LimitMakerList { AccMakerCode = makerCode, AccMakerName = maker });
                        break;
                    case "Airset":
                        if (await _context.AirsetMakerList.AnyAsync(m => m.AccMakerCode == makerCode))
                            return false;
                            _context.AirsetMakerList.Add(new AirsetMakerList { AccMakerCode = makerCode, AccMakerName = maker });
                        break;
                    case "Airoperate":
                        if (await _context.AiroperateMakerList.AnyAsync(m => m.AccMakerCode == makerCode))
                            return false;
                            _context.AiroperateMakerList.Add(new AiroperateMakerList { AccMakerCode = makerCode, AccMakerName = maker });
                        break;
                    case "Lockup":
                        if (await _context.LockupMakerList.AnyAsync(m => m.AccMakerCode == makerCode))
                            return false;
                            _context.LockupMakerList.Add(new LockupMakerList { AccMakerCode = makerCode, AccMakerName = maker });
                        break;
                    case "Snapacting":
                        if (await _context.SnapactingMakerList.AnyAsync(m => m.AccMakerCode == makerCode))
                            return false;
                            _context.SnapactingMakerList.Add(new SnapactingMakerList { AccMakerCode = makerCode, AccMakerName = maker });
                        break;
                    default:
                        return false; // 알 수 없는 accTypeCode
                }
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddAccMakerAsync 오류: {ex.Message}");
                return false;
            }
        }

        // accTypeCode에 따라 각 Maker 테이블을 업데이트하도록 switch문 적용
        public async Task<bool> UpdateAccMakerAsync(string accTypeCode, string makerCode, string maker)
        {
            try
            {
                switch (accTypeCode)
                {
                    case "Positioner":
                        {
                            var existing = await _context.PositionerMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            existing.AccMakerName = maker;
                        }
                        break;
                    case "Solenoid":
                        {
                            var existing = await _context.SolenoidMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            existing.AccMakerName = maker;
                        }
                        break;
                    case "Limit":
                        {
                            var existing = await _context.LimitMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            existing.AccMakerName = maker;
                        }
                        break;
                    case "Airset":
                        {
                            var existing = await _context.AirsetMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            existing.AccMakerName = maker;
                        }
                        break;
                    case "Airoperate":
                        {
                            var existing = await _context.AiroperateMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            existing.AccMakerName = maker;
                        }
                        break;
                    case "Lockup":
                        {
                            var existing = await _context.LockupMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            existing.AccMakerName = maker;
                        }
                        break;
                    case "Snapacting":
                        {
                            var existing = await _context.SnapactingMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            existing.AccMakerName = maker;
                        }
                        break;
                    default:
                        return false; // 알 수 없는 accTypeCode
                }
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"UpdateAccMakerAsync 오류: {ex.Message}");
                return false;
            }
        }
        // acc 종류별로 Maker 테이블이 다르므로, accTypeCode를 받아서 switch문으로 처리 (에러 수정)
        public async Task<bool> DeleteAccMakerAsync(string accTypeCode, string makerCode)
        {
            try
            {
                switch (accTypeCode)
                {
                    case "Positioner":
                        {
                            var existing = await _context.PositionerMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            _context.PositionerMakerList.Remove(existing);
                        }
                        break;
                    case "Solenoid":
                        {
                            var existing = await _context.SolenoidMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            _context.SolenoidMakerList.Remove(existing);
                        }
                        break;
                    case "Limit":
                        {
                            var existing = await _context.LimitMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            _context.LimitMakerList.Remove(existing);
                        }
                        break;
                    case "Airset":
                        {
                            var existing = await _context.AirsetMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            _context.AirsetMakerList.Remove(existing);
                        }
                        break;
                    case "Volume":
                        {
                            var existing = await _context.VolumeMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            _context.VolumeMakerList.Remove(existing);
                        }
                        break;
                    case "Airoperate":
                        {
                            var existing = await _context.AiroperateMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            _context.AiroperateMakerList.Remove(existing);
                        }
                        break;
                    case "Lockup":
                        {
                            var existing = await _context.LockupMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            _context.LockupMakerList.Remove(existing);
                        }
                        break;
                    case "Snapacting":
                        {
                            var existing = await _context.SnapactingMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == makerCode);
                            if (existing == null) return false;
                            _context.SnapactingMakerList.Remove(existing);
                        }
                        break;
                    default:
                        // 알 수 없는 타입
                        return false;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DeleteAccMakerAsync에서 오류 발생: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> AddAccModelAsync(string modelCode, string model, string accTypeCode, string accMakerCode, string? accSize)
        {
            try
            {
                switch (accTypeCode)
                {
                    case "Positioner":
                        {
                            var existing = await _context.PositionerList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing != null) return false;
                            _context.PositionerList.Add(new PositionerList { AccMakerCode = accMakerCode, AccModelCode = modelCode, AccModelName = model, AccSize = accSize });
                        }
                        break;
                    case "Solenoid":
                        {
                            var existing = await _context.SolenoidList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing != null) return false;
                            _context.SolenoidList.Add(new SolenoidList { AccMakerCode = accMakerCode, AccModelCode = modelCode, AccModelName = model, AccSize = accSize });
                        }
                        break;
                    case "Limit":
                        {
                            var existing = await _context.LimitList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing != null) return false;
                            _context.LimitList.Add(new LimitList { AccMakerCode = accMakerCode, AccModelCode = modelCode, AccModelName = model, AccSize = accSize });
                        }
                        break;
                    case "Airset":
                        {
                            var existing = await _context.AirsetList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing != null) return false;
                            _context.AirsetList.Add(new AirsetList { AccMakerCode = accMakerCode, AccModelCode = modelCode, AccModelName = model, AccSize = accSize });
                        }
                        break;
                    case "Volume":
                        {
                            var existing = await _context.VolumeList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing != null) return false;
                            _context.VolumeList.Add(new VolumeList { AccMakerCode = accMakerCode, AccModelCode = modelCode, AccModelName = model, AccSize = accSize });
                        }
                        break;
                    case "Airoperate":
                        {
                            var existing = await _context.AiroperateList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing != null) return false;
                            _context.AiroperateList.Add(new AiroperateList { AccMakerCode = accMakerCode, AccModelCode = modelCode, AccModelName = model, AccSize = accSize });
                        }
                        break;
                    case "Lockup":
                        {
                            var existing = await _context.LockupList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing != null) return false;
                            _context.LockupList.Add(new LockupList { AccMakerCode = accMakerCode, AccModelCode = modelCode, AccModelName = model, AccSize = accSize });
                        }
                        break;
                    case "Snapacting":
                        {
                            var existing = await _context.SnapactingList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing != null) return false;
                            _context.SnapactingList.Add(new SnapactingList { AccMakerCode = accMakerCode, AccModelCode = modelCode, AccModelName = model, AccSize = accSize });
                        }
                        break;
                    default:
                        return false; // Unsupported accTypeCode
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateAccModelAsync(string modelCode, string model, string accTypeCode, string accMakerCode, string? accSize)
        {
            try
            {
                switch (accTypeCode)
                {
                    case "Positioner":
                        {
                            var existing = await _context.PositionerList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            existing.AccModelName = model;
                            existing.AccSize = accSize;
                        }
                        break;
                    case "Solenoid":
                        {
                            var existing = await _context.SolenoidList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            existing.AccModelName = model;
                            existing.AccSize = accSize;
                        }
                        break;
                    case "Limit":
                        {
                            var existing = await _context.LimitList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            existing.AccModelName = model;
                            existing.AccSize = accSize;
                        }
                        break;
                    case "Airset":
                        {
                            var existing = await _context.AirsetList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            existing.AccModelName = model;
                            existing.AccSize = accSize;
                        }
                        break;
                    case "Volume":
                        {
                            var existing = await _context.VolumeList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            existing.AccModelName = model;
                            existing.AccSize = accSize;
                        }
                        break;
                    case "Airoperate":
                        {
                            var existing = await _context.AiroperateList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            existing.AccModelName = model;
                            existing.AccSize = accSize;
                        }
                        break;
                    case "Lockup":
                        {
                            var existing = await _context.LockupList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            existing.AccModelName = model;
                            existing.AccSize = accSize;
                        }
                        break;
                    case "Snapacting":
                        {
                            var existing = await _context.SnapactingList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            existing.AccModelName = model;
                            existing.AccSize = accSize;
                        }
                        break;
                    default:
                        return false; // Unsupported accTypeCode
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteAccModelAsync(string modelCode, string accTypeCode, string accMakerCode)
        {
            try
            {
                switch (accTypeCode)
                {
                    case "Positioner":
                        {
                            var existing = await _context.PositionerList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            _context.PositionerList.Remove(existing);
                        }
                        break;
                    case "Solenoid":
                        {
                            var existing = await _context.SolenoidList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            _context.SolenoidList.Remove(existing);
                        }
                        break;
                    case "Limit":
                        {
                            var existing = await _context.LimitList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            _context.LimitList.Remove(existing);
                        }
                        break;
                    case "Airset":
                        {
                            var existing = await _context.AirsetList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            _context.AirsetList.Remove(existing);
                        }
                        break;
                    case "Volume":
                        {
                            var existing = await _context.VolumeList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            _context.VolumeList.Remove(existing);
                        }
                        break;
                    case "Airoperate":
                        {
                            var existing = await _context.AiroperateList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            _context.AiroperateList.Remove(existing);
                        }
                        break;
                    case "Lockup":
                        {
                            var existing = await _context.LockupList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            _context.LockupList.Remove(existing);
                        }
                        break;
                    case "Snapacting":
                        {
                            var existing = await _context.SnapactingList.FirstOrDefaultAsync(a => a.AccMakerCode == accMakerCode && a.AccModelCode == modelCode);
                            if (existing == null) return false;
                            _context.SnapactingList.Remove(existing);
                        }
                        break;
                    default:
                        return false; // Unsupported accTypeCode
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        // SaveSpecificationAsync 메서드 바로 위에 추가
private string? ConvertEmptyToNull(string? value)
{
    return string.IsNullOrWhiteSpace(value) ? null : value;
}
        public async Task<bool> SaveSpecificationAsync(string tempEstimateNo, int sheetID, SaveSpecificationRequestDto specification)
        {
            try
            {
                Console.WriteLine($"SaveSpecificationAsync 시작 - TempEstimateNo: {tempEstimateNo}, SheetID: {sheetID}");
                
                // 실제 이름을 코드로 변환
                var bodySizeCode = await GetBodySizeCodeAsync(specification.Body.SizeUnit, specification.Body.Size); // SizeUnit 추가
                var bodyMatCode = await GetBodyMatCodeAsync(specification.Body.MaterialBody);
                var trimTypeCode = await GetTrimTypeCodeAsync(specification.Trim.Type);
                var actTypeCode = await GetActTypeCodeAsync(specification.Actuator.Type);
                var actSizeCode = await GetActSizeCodeAsync(specification.Actuator.Series, specification.Actuator.Size);
                var actHWCode = await GetActHWCodeAsync(specification.Actuator.HW);
                
                Console.WriteLine($"코드 변환 결과 - BodySizeUnit: {specification.Body.SizeUnit}, BodySize: {specification.Body.Size} -> {bodySizeCode}"); // 로그 업데이트
                Console.WriteLine($"코드 변환 결과 - BodyMat: {specification.Body.MaterialBody} -> {bodyMatCode}");
                Console.WriteLine($"코드 변환 결과 - TrimType: {specification.Trim.Type} -> {trimTypeCode}");
                Console.WriteLine($"코드 변환 결과 - ActType: {specification.Actuator.Type} -> {actTypeCode}");
                Console.WriteLine($"코드 변환 결과 - ActSize: {specification.Actuator.Size} -> {actSizeCode}");
                Console.WriteLine($"코드 변환 결과 - ActHW: {specification.Actuator.HW} -> {actHWCode}");
                
                // 기존 DataSheetLv3 데이터가 있는지 확인 (TempEstimateNo + SheetID로 검색)
                var existingDataSheet = await _context.DataSheetLv3
                    .FirstOrDefaultAsync(ds => ds.TempEstimateNo == tempEstimateNo && ds.SheetID == sheetID);

                Console.WriteLine($"기존 DataSheetLv3 검색 결과: {(existingDataSheet != null ? "존재함" : "존재하지 않음")}");

                if (existingDataSheet != null)
                {
                    Console.WriteLine("기존 데이터 업데이트 시작");
                    // 기존 데이터 업데이트 (코드 사용)
                    existingDataSheet.ValveType = ConvertEmptyToNull(specification.ValveId);
                    existingDataSheet.BonnetType = ConvertEmptyToNull(specification.Body.BonnetType);
                    existingDataSheet.BodyMat = ConvertEmptyToNull(bodyMatCode);
                    existingDataSheet.TrimMat = ConvertEmptyToNull(specification.Trim.MaterialTrim); // DTO 변경에 따라 수정
                    existingDataSheet.TrimOption = ConvertEmptyToNull(await GetTrimOptionCodeAsync(specification.Trim.Option)); // DTO 변경에 따라 수정
                    existingDataSheet.Rating = ConvertEmptyToNull(specification.Body.Rating);
                    existingDataSheet.RatingUnit = ConvertEmptyToNull(specification.Body.RatingUnit);
                    existingDataSheet.Connection = ConvertEmptyToNull(specification.Body.Connection);
                    existingDataSheet.BodySize = ConvertEmptyToNull(bodySizeCode);
                    existingDataSheet.BodySizeUnit = ConvertEmptyToNull(specification.Body.SizeUnit); // 이 라인 아래에 로그 추가
                    
                    existingDataSheet.TrimType = ConvertEmptyToNull(trimTypeCode);
                    existingDataSheet.TrimSeries = ConvertEmptyToNull(specification.Trim.Series);
                    existingDataSheet.TrimPortSize = ConvertEmptyToNull(specification.Trim.PortSize);
                    existingDataSheet.TrimPortSizeUnit = ConvertEmptyToNull(specification.Trim.PortSizeUnit);
                    existingDataSheet.TrimForm = ConvertEmptyToNull(specification.Trim.Form);
                    
                    existingDataSheet.ActType = ConvertEmptyToNull(actTypeCode);
                    existingDataSheet.ActSeriesCode = ConvertEmptyToNull(specification.Actuator.Series);
                    existingDataSheet.ActSize = ConvertEmptyToNull(actSizeCode);
                    existingDataSheet.HW = ConvertEmptyToNull(actHWCode);
                    
                    // 악세사리 필드들 업데이트
                    existingDataSheet.PosCode = ConvertEmptyToNull(specification.Accessories.PosCode);
                    existingDataSheet.PosMakerCode = ConvertEmptyToNull(specification.Accessories.PosMakerCode); // New
                    existingDataSheet.SolCode = ConvertEmptyToNull(specification.Accessories.SolCode);
                    existingDataSheet.SolMakerCode = ConvertEmptyToNull(specification.Accessories.SolMakerCode); // New
                    existingDataSheet.LimCode = ConvertEmptyToNull(specification.Accessories.LimCode);
                    existingDataSheet.LimMakerCode = ConvertEmptyToNull(specification.Accessories.LimMakerCode); // New
                    existingDataSheet.ASCode = ConvertEmptyToNull(specification.Accessories.ASCode);
                    existingDataSheet.ASMakerCode = ConvertEmptyToNull(specification.Accessories.ASMakerCode); // New
                    existingDataSheet.VolCode = ConvertEmptyToNull(specification.Accessories.VolCode);
                    existingDataSheet.VolMakerCode = ConvertEmptyToNull(specification.Accessories.VolMakerCode); // New
                    existingDataSheet.AirOpCode = ConvertEmptyToNull(specification.Accessories.AirOpCode);
                    existingDataSheet.AirOpMakerCode = ConvertEmptyToNull(specification.Accessories.AirOpMakerCode); // New
                    existingDataSheet.LockupCode = ConvertEmptyToNull(specification.Accessories.LockupCode);
                    existingDataSheet.LockupMakerCode = ConvertEmptyToNull(specification.Accessories.LockupMakerCode); // New
                    existingDataSheet.SnapActCode = ConvertEmptyToNull(specification.Accessories.SnapActCode);
                    existingDataSheet.SnapActMakerCode = ConvertEmptyToNull(specification.Accessories.SnapActMakerCode); // New
                    
                    Console.WriteLine("기존 데이터 업데이트 완료");
                }
                else
                {
                    Console.WriteLine("새 데이터 생성 시작");
                    // 새 데이터 생성 (코드 사용)
                    var newDataSheet = new DataSheetLv3
                    {
                        TempEstimateNo = tempEstimateNo,
                        SheetID = sheetID, // 기존 SheetID 사용
                        ValveType = ConvertEmptyToNull(specification.ValveId),
                        BonnetType = ConvertEmptyToNull(specification.Body.BonnetType),
                        BodyMat = ConvertEmptyToNull(bodyMatCode),
                        TrimMat = ConvertEmptyToNull(specification.Trim.MaterialTrim), // DTO 변경에 따라 수정
                        TrimOption = ConvertEmptyToNull(await GetTrimOptionCodeAsync(specification.Trim.Option)), // DTO 변경에 따라 수정
                        Rating = ConvertEmptyToNull(specification.Body.Rating),
                        RatingUnit = ConvertEmptyToNull(specification.Body.RatingUnit),
                        Connection = ConvertEmptyToNull(specification.Body.Connection),
                        BodySize = ConvertEmptyToNull(bodySizeCode),
                        BodySizeUnit = ConvertEmptyToNull(specification.Body.SizeUnit), // BodySizeUnit 추가
                        
                        TrimType = ConvertEmptyToNull(trimTypeCode),
                        TrimSeries = ConvertEmptyToNull(specification.Trim.Series),
                        TrimPortSize = ConvertEmptyToNull(specification.Trim.PortSize),
                        TrimForm = ConvertEmptyToNull(specification.Trim.Form),
                        
                        ActType = ConvertEmptyToNull(actTypeCode),
                        ActSeriesCode = ConvertEmptyToNull(specification.Actuator.Series),
                        ActSize = ConvertEmptyToNull(actSizeCode),
                        HW = ConvertEmptyToNull(actHWCode),
                        
                        // 악세사리 필드들 저장
                        PosCode = ConvertEmptyToNull(specification.Accessories.PosCode),
                        PosMakerCode = ConvertEmptyToNull(specification.Accessories.PosMakerCode), // New
                        SolCode = ConvertEmptyToNull(specification.Accessories.SolCode),
                        SolMakerCode = ConvertEmptyToNull(specification.Accessories.SolMakerCode), // New
                        LimCode = ConvertEmptyToNull(specification.Accessories.LimCode),
                        LimMakerCode = ConvertEmptyToNull(specification.Accessories.LimMakerCode), // New
                        ASCode = ConvertEmptyToNull(specification.Accessories.ASCode),
                        ASMakerCode = ConvertEmptyToNull(specification.Accessories.ASMakerCode), // New
                        VolCode = ConvertEmptyToNull(specification.Accessories.VolCode),
                        VolMakerCode = ConvertEmptyToNull(specification.Accessories.VolMakerCode), // New
                        AirOpCode = ConvertEmptyToNull(specification.Accessories.AirOpCode),
                        AirOpMakerCode = ConvertEmptyToNull(specification.Accessories.AirOpMakerCode), // New
                        LockupCode = ConvertEmptyToNull(specification.Accessories.LockupCode),
                        LockupMakerCode = ConvertEmptyToNull(specification.Accessories.LockupMakerCode), // New
                        SnapActCode = ConvertEmptyToNull(specification.Accessories.SnapActCode),
                        SnapActMakerCode = ConvertEmptyToNull(specification.Accessories.SnapActMakerCode) // New
                    };

                    _context.DataSheetLv3.Add(newDataSheet);
                    Console.WriteLine("새 데이터 생성 완료");
                }

                Console.WriteLine("SaveChangesAsync 시작");
                await _context.SaveChangesAsync();
                Console.WriteLine("SaveChangesAsync 완료");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"사양 저장 중 예외 발생: {ex.Message}");
                Console.WriteLine($"스택 트레이스: {ex.StackTrace}");
                return false;
            }
        }

        public async Task<bool> BulkSaveSpecificationAsync(string tempEstimateNo, SaveSpecificationRequestDto specification)
        {
            try
            {
                var sheetIds = await _context.EstimateRequest
                    .Where(er => er.TempEstimateNo == tempEstimateNo)
                    .Select(er => er.SheetID)
                    .ToListAsync();

                var okAll = true;
                foreach (var sid in sheetIds)
                {
                    var ok = await SaveSpecificationAsync(tempEstimateNo, sid, specification);
                    if (!ok) okAll = false;
                }
                return okAll;
            }
            catch
            {
                return false;
            }
        }
         public async Task<bool> AssignEstimateAsync(string tempEstimateNo, string managerId)
        {
            try
            {
                Console.WriteLine($"=== 견적 담당 처리 시작 ===");
                Console.WriteLine($"TempEstimateNo: {tempEstimateNo}");
                Console.WriteLine($"ManagerID: {managerId}");

                // EstimateSheetLv1 조회
                var estimateSheet = await _context.EstimateSheetLv1
                    .FirstOrDefaultAsync(e => e.TempEstimateNo == tempEstimateNo);

                if (estimateSheet == null)
                {
                    Console.WriteLine("견적 시트를 찾을 수 없습니다.");
                    return false;
                }

                // Status를 2(견적 진행중)로 업데이트
                estimateSheet.Status = 2;
                estimateSheet.ManagerID = managerId;

                Console.WriteLine($"견적 상태 업데이트: Status={estimateSheet.Status}, ManagerID={estimateSheet.ManagerID}");

                // 데이터베이스에 저장
                await _context.SaveChangesAsync();
                Console.WriteLine("견적 담당 처리 완료");

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"견적 담당 처리 중 오류 발생: {ex.Message}");
                return false;
            }
        }

        // ... existing code ...

        // 실제 이름을 코드로 변환하는 헬퍼 메서드들
        private async Task<string?> GetBodySizeCodeAsync(string? sizeUnit, string? bodySizeCode) // 시그니처 변경
        {
            if (string.IsNullOrEmpty(sizeUnit) || string.IsNullOrEmpty(bodySizeCode)) return null;

            // BodySizeList에서 sizeUnit과 bodySizeCode로 찾아서 유효성 검사
            var exists = await _context.BodySizeList.AnyAsync(bs => bs.UnitCode == sizeUnit && bs.BodySizeCode == bodySizeCode);

            return exists ? bodySizeCode : null;
        }

        private async Task<string?> GetBodyMatCodeAsync(string? matCode)
        {
            if (string.IsNullOrEmpty(matCode)) return null;
            
            // 변경된 로직: 이미 코드를 받고 있으므로 코드를 그대로 반환
            return matCode;
        }

        private async Task<string?> GetTrimTypeCodeAsync(string? typeCode)
        {
            if (string.IsNullOrEmpty(typeCode)) return null;
            
            // 변경된 로직: 이미 코드를 받고 있으므로 코드를 그대로 반환 (선택적으로 유효성 검증)
            return typeCode;
        }

        private async Task<string?> GetActTypeCodeAsync(string? typeCode)
        {
            if (string.IsNullOrEmpty(typeCode)) return null;
            
            // 변경된 로직: 이미 코드를 받고 있으므로 코드를 그대로 반환
            return typeCode;
        }

        private async Task<string?> GetActSizeCodeAsync(string? seriesCode, string? sizeCode) // sizeName을 sizeCode로 변경
        {
            if (string.IsNullOrEmpty(seriesCode) || string.IsNullOrEmpty(sizeCode)) return null;

            // ActSizeList에서 시리즈 코드와 사이즈 코드로 찾기
            var actSizeEntry = await _context.ActSizeList
                .FirstOrDefaultAsync(asize => asize.ActSeriesCode == seriesCode && asize.ActSizeCode == sizeCode);

            return actSizeEntry?.ActSizeCode;
        }

        private async Task<string?> GetActHWCodeAsync(string? hwCode)
        {
            if (string.IsNullOrEmpty(hwCode)) return null;
            
            // 변경된 로직: 이미 코드를 받고 있으므로 코드를 그대로 반환
            return hwCode;
        }

        // 코드를 실제 이름으로 변환하는 헬퍼 메서드들
        private async Task<string> GetBonnetTypeNameAsync(string bonnetCode)
        {
            Console.WriteLine($"[GetBonnetTypeNameAsync] 찾는 코드: '{bonnetCode}'");
            var bonnet = await _context.BodyBonnetList
                .FirstOrDefaultAsync(b => b.BonnetCode == bonnetCode);
            Console.WriteLine($"[GetBonnetTypeNameAsync] 찾은 이름: '{bonnet?.BonnetType}'");
            return bonnet?.BonnetType ?? "";
        }

        private async Task<string> GetBodyMatNameAsync(string bodyMatCode)
        {
            Console.WriteLine($"[GetBodyMatNameAsync] 찾는 코드: '{bodyMatCode}'");
            var bodyMat = await _context.BodyMatList
                .FirstOrDefaultAsync(bm => bm.BodyMatCode == bodyMatCode);
            Console.WriteLine($"[GetBodyMatNameAsync] 찾은 이름: '{bodyMat?.BodyMat}'");
            return bodyMat?.BodyMat ?? "";
        }

        private async Task<string> GetTrimMatNameAsync(string trimMatCode)
        {
            Console.WriteLine($"[GetTrimMatNameAsync] 찾는 코드: '{trimMatCode}'");
            var trimMat = await _context.TrimMatList
                .FirstOrDefaultAsync(tm => tm.TrimMatCode == trimMatCode);
            Console.WriteLine($"[GetTrimMatNameAsync] 찾은 이름: '{trimMat?.TrimMat}'");
            return trimMat?.TrimMat ?? "";
        }

        private async Task<string> GetTrimOptionNameAsync(string trimOptionCode)
        {
            Console.WriteLine($"[GetTrimOptionNameAsync] 찾는 코드: '{trimOptionCode}'");
            var trimOption = await _context.TrimOptionList
                .FirstOrDefaultAsync(to => to.TrimOptionCode == trimOptionCode);
            Console.WriteLine($"[GetTrimOptionNameAsync] 찾은 이름: '{trimOption?.TrimOptionName}'");
            return trimOption?.TrimOptionName ?? "";
        }

        private async Task<string> GetBodyRatingNameAsync(string ratingCode)
        {
            Console.WriteLine($"[GetBodyRatingNameAsync] 찾는 코드: '{ratingCode}'");
            var rating = await _context.BodyRatingList
                .FirstOrDefaultAsync(br => br.RatingCode == ratingCode);
            Console.WriteLine($"[GetBodyRatingNameAsync] 찾은 이름: '{rating?.RatingName}'");
            return rating?.RatingName ?? "";
        }

        private async Task<string> GetBodyConnectionNameAsync(string connectionCode)
        {
            Console.WriteLine($"[GetBodyConnectionNameAsync] 찾는 코드: '{connectionCode}'");
            var connection = await _context.BodyConnectionList
                .FirstOrDefaultAsync(bc => bc.ConnectionCode == connectionCode);
            Console.WriteLine($"[GetBodyConnectionNameAsync] 찾은 이름: '{connection?.Connection}'");
            return connection?.Connection ?? "";
        }

        private async Task<string> GetBodySizeNameAsync(string bodySizeCode)
        {
            Console.WriteLine($"[GetBodySizeNameAsync] 찾는 코드: '{bodySizeCode}'");
            var bodySize = await _context.BodySizeList
                .FirstOrDefaultAsync(bs => bs.BodySizeCode == bodySizeCode);
            Console.WriteLine($"[GetBodySizeNameAsync] 찾은 이름: '{bodySize?.BodySize}'");
            return bodySize?.BodySize ?? "";
        }

        private async Task<string> GetTrimTypeNameAsync(string trimTypeCode)
        {
            Console.WriteLine($"[GetTrimTypeNameAsync] 찾는 코드: '{trimTypeCode}'");
            var trimType = await _context.TrimTypeList
                .FirstOrDefaultAsync(tt => tt.TrimTypeCode == trimTypeCode);
            Console.WriteLine($"[GetTrimTypeNameAsync] 찾은 이름: '{trimType?.TrimType}'");
            return trimType?.TrimType ?? "";
        }

        private async Task<string> GetTrimSeriesNameAsync(string trimSeriesCode)
        {
            Console.WriteLine($"[GetTrimSeriesNameAsync] 찾는 코드: '{trimSeriesCode}'");
            var trimSeries = await _context.TrimSeriesList
                .FirstOrDefaultAsync(ts => ts.TrimSeriesCode == trimSeriesCode);
            Console.WriteLine($"[GetTrimSeriesNameAsync] 찾은 이름: '{trimSeries?.TrimSeries}'");
            return trimSeries?.TrimSeries ?? "";
        }

        private async Task<string> GetTrimPortSizeNameAsync(string portSizeCode, string portSizeUnit)
        {
            Console.WriteLine($"[GetTrimPortSizeNameAsync] 찾는 코드: '{portSizeCode}'");
            var portSize = await _context.TrimPortSizeList
                .FirstOrDefaultAsync(ps => ps.PortSizeCode == portSizeCode && ps.UnitCode == portSizeUnit);
            Console.WriteLine($"[GetTrimPortSizeNameAsync] 찾은 이름: '{portSize?.PortSize}'");
            return portSize?.PortSize ?? "";
        }

        private async Task<string> GetTrimFormNameAsync(string formCode)
        {
            Console.WriteLine($"[GetTrimFormNameAsync] 찾는 코드: '{formCode}'");
            var form = await _context.TrimFormList
                .FirstOrDefaultAsync(f => f.TrimFormCode == formCode);
            Console.WriteLine($"[GetTrimFormNameAsync] 찾은 이름: '{form?.TrimForm}'");
            return form?.TrimForm ?? "";
        }

        private async Task<string> GetActTypeNameAsync(string actTypeCode)
        {
            Console.WriteLine($"[GetActTypeNameAsync] 찾는 코드: '{actTypeCode}'");
            var actType = await _context.ActTypeList
                .FirstOrDefaultAsync(at => at.ActTypeCode == actTypeCode);
            Console.WriteLine($"[GetActTypeNameAsync] 찾은 이름: '{actType?.ActType}'");
            return actType?.ActType ?? "";
        }

        private async Task<string> GetActSeriesNameAsync(string actSeriesCode)
        {
            Console.WriteLine($"[GetActSeriesNameAsync] 찾는 코드: '{actSeriesCode}'");
            var actSeries = await _context.ActSeriesList
                .FirstOrDefaultAsync(as_ => as_.ActSeriesCode == actSeriesCode);
            Console.WriteLine($"[GetActSeriesNameAsync] 찾은 이름: '{actSeries?.ActSeries}'");
            return actSeries?.ActSeries ?? "";
        }

        private async Task<string> GetActSizeNameAsync(string? actSeriesCode, string actSizeCode)
        {
            Console.WriteLine($"[GetActSizeNameAsync] 찾는 시리즈 코드: '{actSeriesCode}', 사이즈 코드: '{actSizeCode}'");
            if (string.IsNullOrEmpty(actSeriesCode) || string.IsNullOrEmpty(actSizeCode))
                return "";
            
            var actSize = await _context.ActSizeList
                .FirstOrDefaultAsync(asize => asize.ActSeriesCode == actSeriesCode && asize.ActSizeCode == actSizeCode);
            Console.WriteLine($"[GetActSizeNameAsync] 찾은 이름: '{actSize?.ActSize}'");
            return actSize?.ActSize ?? "";
        }

        private async Task<string> GetActHWNameAsync(string hwCode)
        {
            Console.WriteLine($"[GetActHWNameAsync] 찾는 코드: '{hwCode}'");
            var hw = await _context.ActHWList
                .FirstOrDefaultAsync(ah => ah.HWCode == hwCode);
            Console.WriteLine($"[GetActHWNameAsync] 찾은 이름: '{hw?.HW}'");
            return hw?.HW ?? "";
        }

        private async Task<string?> GetTrimOptionCodeAsync(string? optionCode)
        {
            if (string.IsNullOrEmpty(optionCode)) return null;
            
            // 변경된 로직: 이미 코드를 받고 있으므로 코드를 그대로 반환
            return optionCode;
        }

        // 사양 조회 메서드
        public async Task<SpecificationResponseDto?> GetSpecificationAsync(string tempEstimateNo, int sheetID)
        {
            try
            {
                Console.WriteLine($"GetSpecificationAsync 호출됨, TempEstimateNo: {tempEstimateNo}, SheetID: {sheetID}");
                
                var dataSheet = await _context.DataSheetLv3
                    .FirstOrDefaultAsync(d => d.TempEstimateNo == tempEstimateNo && d.SheetID == sheetID);
    
                if (dataSheet == null)
                {
                    Console.WriteLine($"DataSheetLv3 TempEstimateNo: {tempEstimateNo}, SheetID: {sheetID}에 대한 데이터를 찾을 수 없습니다.");
                    return null;
                }

                Console.WriteLine($"SheetID {sheetID}의 원본 데이터: BonnetType={dataSheet.BonnetType}, BodyMat={dataSheet.BodyMat}, TrimMat={dataSheet.TrimMat}, TrimOption={dataSheet.TrimOption}");

                // 코드를 실제 이름으로 변환
                var bonnetType = dataSheet.BonnetType != null ? 
                    await GetBonnetTypeNameAsync(dataSheet.BonnetType) : "";
                var bodyMat = dataSheet.BodyMat != null ? 
                    await GetBodyMatNameAsync(dataSheet.BodyMat) : "";
                var trimMat = dataSheet.TrimMat != null ? 
                    await GetTrimMatNameAsync(dataSheet.TrimMat) : "";
                var trimOption = dataSheet.TrimOption != null ? 
                    await GetTrimOptionNameAsync(dataSheet.TrimOption) : "";
                var rating = dataSheet.Rating != null ? 
                    await GetBodyRatingNameAsync(dataSheet.Rating) : "";
                var ratingUnit = dataSheet.RatingUnit ?? "";
                var connection = dataSheet.Connection != null ? 
                    await GetBodyConnectionNameAsync(dataSheet.Connection) : "";
                var size = dataSheet.BodySize != null ? 
                    await GetBodySizeNameAsync(dataSheet.BodySize) : "";
                var sizeUnit = dataSheet.BodySizeUnit ?? "";
                var trimType = dataSheet.TrimType != null ? 
                    await GetTrimTypeNameAsync(dataSheet.TrimType) : "";
                var trimSeries = dataSheet.TrimSeries != null ? 
                    await GetTrimSeriesNameAsync(dataSheet.TrimSeries) : "";
                var trimPortSize = dataSheet.TrimPortSize != null ? 
                    await GetTrimPortSizeNameAsync(dataSheet.TrimPortSize, dataSheet.TrimPortSizeUnit ?? "") : "";
                var trimForm = dataSheet.TrimForm != null ? 
                    await GetTrimFormNameAsync(dataSheet.TrimForm) : "";
                var actType = dataSheet.ActType != null ? 
                    await GetActTypeNameAsync(dataSheet.ActType) : "";
                var actSeries = dataSheet.ActSeriesCode != null ? (await _context.ActSeriesList.FirstOrDefaultAsync(s => s.ActSeriesCode == dataSheet.ActSeriesCode))?.ActSeries ?? "" : "";
                var actSize = dataSheet.ActSize != null ? (await _context.ActSizeList.FirstOrDefaultAsync(s => s.ActSizeCode == dataSheet.ActSize && s.ActSeriesCode == dataSheet.ActSeriesCode))?.ActSize ?? "" : "";
                var hw = dataSheet.HW != null ? (await _context.ActHWList.FirstOrDefaultAsync(h => h.HWCode == dataSheet.HW))?.HW ?? "" : "";

                Console.WriteLine($"변환된 데이터: BonnetType={bonnetType}, BodyMat={bodyMat}, TrimMat={trimMat}, TrimOption={trimOption}");

                // Accessories 정보 조회
                var accessories = new AccessorySpecificationResponseDto
                {
                    Positioner = await GetAccessoryDetailAsync("Positioner", dataSheet.PosCode, dataSheet.PosMakerCode),
                    Solenoid = await GetAccessoryDetailAsync("Solenoid", dataSheet.SolCode, dataSheet.SolMakerCode),
                    Limiter = await GetAccessoryDetailAsync("Limiter", dataSheet.LimCode, dataSheet.LimMakerCode),
                    AirSupply = await GetAccessoryDetailAsync("AirSupply", dataSheet.ASCode, dataSheet.ASMakerCode),
                    VolumeBooster = await GetAccessoryDetailAsync("VolumeBooster", dataSheet.VolCode, dataSheet.VolMakerCode),
                    AirOperator = await GetAccessoryDetailAsync("AirOperator", dataSheet.AirOpCode, dataSheet.AirOpMakerCode),
                    LockUp = await GetAccessoryDetailAsync("LockUp", dataSheet.LockupCode, dataSheet.LockupMakerCode),
                    SnapActingRelay = await GetAccessoryDetailAsync("SnapActingRelay", dataSheet.SnapActCode, dataSheet.SnapActMakerCode)
                };

                return new SpecificationResponseDto
                {
                    SheetID = dataSheet.SheetID,
                    ValveId = dataSheet.ValveType ?? "",
                    Body = new BodySpecificationResponseDto
                    {
                        BonnetTypeCode = dataSheet.BonnetType ?? "",
                        BonnetTypeName = bonnetType,
                        MaterialBodyCode = dataSheet.BodyMat ?? "",
                        MaterialBodyName = bodyMat,
                        MaterialTrimCode = dataSheet.TrimMat ?? "",
                        MaterialTrimName = trimMat,
                        OptionCode = dataSheet.TrimOption ?? "",
                        OptionName = trimOption,
                        RatingCode = dataSheet.Rating ?? "",
                        RatingName = rating,
                        RatingUnit = ratingUnit,
                        ConnectionCode = dataSheet.Connection ?? "",
                        ConnectionName = connection,
                        SizeCode = dataSheet.BodySize ?? "",
                        SizeName = size,
                        SizeUnit = sizeUnit
                    },
                    Trim = new TrimSpecificationResponseDto
                    {
                        TypeCode = dataSheet.TrimType ?? "",
                        TypeName = trimType,
                        SeriesCode = dataSheet.TrimSeries ?? "",
                        SeriesName = trimSeries,
                        PortSizeCode = dataSheet.TrimPortSize ?? "",
                        PortSizeName = trimPortSize,
                        PortSizeUnit = dataSheet.TrimPortSizeUnit ?? "",
                        FormCode = dataSheet.TrimForm ?? "",
                        FormName = trimForm
                    },
                    Actuator = new ActuatorSpecificationResponseDto
                    {
                        TypeCode = dataSheet.ActType ?? "",
                        TypeName = actType,
                        SeriesCode = dataSheet.ActSeriesCode ?? "",
                        SeriesName = actSeries,
                        SizeCode = dataSheet.ActSize ?? "",
                        SizeName = actSize,
                        HWCode = dataSheet.HW ?? "",
                        HWName = hw
                    },
                    Accessories = accessories
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"사양 조회 중 오류 발생: {ex.Message}");
                return new SpecificationResponseDto(); // null 대신 빈 DTO 반환
            }
        }
        // 악세사리 검색 메서드 (새로 추가)
        public async Task<List<object>> SearchAccessoriesAsync(string? accTypeCode = null, string? searchKeyword = null)
        {
            try
            {
                List<object> resultList = new List<object>();
                
                // 검색어가 없으면 전체 반환 (accTypeCode가 null이어도 모든 데이터 반환)
                if (string.IsNullOrEmpty(searchKeyword))
                {
                    // accTypeCode가 지정되지 않았으면 모든 타입의 데이터 반환
                    if (string.IsNullOrEmpty(accTypeCode))
                    {
                        var allResults = new List<object>();
                        
                        // Positioner
                        var allPositioner = await _context.PositionerList
                            .Join(_context.PositionerMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Positioner" })
                            .ToListAsync();
                        allResults.AddRange(allPositioner);

                        // Solenoid
                        var allSolenoid = await _context.SolenoidList
                            .Join(_context.SolenoidMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Solenoid" })
                            .ToListAsync();
                        allResults.AddRange(allSolenoid);

                        // Limit
                        var allLimit = await _context.LimitList
                            .Join(_context.LimitMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Limit" })
                            .ToListAsync();
                        allResults.AddRange(allLimit);

                        // Airset
                        var allAirset = await _context.AirsetList
                            .Join(_context.AirsetMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Airset" })
                            .ToListAsync();
                        allResults.AddRange(allAirset);

                        // Volume
                        var allVolume = await _context.VolumeList
                            .Join(_context.VolumeMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Volume" })
                            .ToListAsync();
                        allResults.AddRange(allVolume);

                        // Airoperate
                        var allAiroperate = await _context.AiroperateList
                            .Join(_context.AiroperateMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Airoperate" })
                            .ToListAsync();
                        allResults.AddRange(allAiroperate);

                        // Lockup
                        var allLockup = await _context.LockupList
                            .Join(_context.LockupMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Lockup" })
                            .ToListAsync();
                        allResults.AddRange(allLockup);

                        // Snapacting
                        var allSnapacting = await _context.SnapactingList
                            .Join(_context.SnapactingMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Snapacting" })
                            .ToListAsync();
                        allResults.AddRange(allSnapacting);

                        return allResults.Cast<object>().ToList();
                    }
                    else
                    {
                        // 특정 타입만 반환
                        return await GetAccModelListAsync(accTypeCode);
                    }
                }

                var lowerSearchKeyword = searchKeyword.ToLower();

                switch (accTypeCode)
                {
                    case "Positioner":
                        var positionerResults = await _context.PositionerList
                            .Join(_context.PositionerMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Positioner" })
                            .Where(item => 
                                item.AccMakerName.ToLower().Contains(lowerSearchKeyword) ||
                                item.AccModelName.ToLower().Contains(lowerSearchKeyword) ||
                                (item.AccSize != null && item.AccSize.ToLower().Contains(lowerSearchKeyword)))
                            .ToListAsync();
                        resultList.AddRange(positionerResults);
                        break;

                    case "Solenoid":
                        var solenoidResults = await _context.SolenoidList
                            .Join(_context.SolenoidMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Solenoid" })
                            .Where(item => 
                                item.AccMakerName.ToLower().Contains(lowerSearchKeyword) ||
                                item.AccModelName.ToLower().Contains(lowerSearchKeyword) ||
                                (item.AccSize != null && item.AccSize.ToLower().Contains(lowerSearchKeyword)))
                            .ToListAsync();
                        resultList.AddRange(solenoidResults);
                        break;

                    case "Limit":
                        var limitResults = await _context.LimitList
                            .Join(_context.LimitMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Limit" })
                            .Where(item => 
                                item.AccMakerName.ToLower().Contains(lowerSearchKeyword) ||
                                item.AccModelName.ToLower().Contains(lowerSearchKeyword) ||
                                (item.AccSize != null && item.AccSize.ToLower().Contains(lowerSearchKeyword)))
                            .ToListAsync();
                        resultList.AddRange(limitResults);
                        break;

                    case "Airset":
                        var airsetResults = await _context.AirsetList
                            .Join(_context.AirsetMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Airset" })
                            .Where(item => 
                                item.AccMakerName.ToLower().Contains(lowerSearchKeyword) ||
                                item.AccModelName.ToLower().Contains(lowerSearchKeyword) ||
                                (item.AccSize != null && item.AccSize.ToLower().Contains(lowerSearchKeyword)))
                            .ToListAsync();
                        resultList.AddRange(airsetResults);
                        break;

                    case "Volume":
                        var volumeResults = await _context.VolumeList
                            .Join(_context.VolumeMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Volume" })
                            .Where(item => 
                                item.AccMakerName.ToLower().Contains(lowerSearchKeyword) ||
                                item.AccModelName.ToLower().Contains(lowerSearchKeyword) ||
                                (item.AccSize != null && item.AccSize.ToLower().Contains(lowerSearchKeyword)))
                            .ToListAsync();
                        resultList.AddRange(volumeResults);
                        break;

                    case "Airoperate":
                        var airoperateResults = await _context.AiroperateList
                            .Join(_context.AiroperateMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Airoperate" })
                            .Where(item => 
                                item.AccMakerName.ToLower().Contains(lowerSearchKeyword) ||
                                item.AccModelName.ToLower().Contains(lowerSearchKeyword) ||
                                (item.AccSize != null && item.AccSize.ToLower().Contains(lowerSearchKeyword)))
                            .ToListAsync();
                        resultList.AddRange(airoperateResults);
                        break;

                    case "Lockup":
                        var lockupResults = await _context.LockupList
                            .Join(_context.LockupMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Lockup" })
                            .ToListAsync();
                        resultList.AddRange(lockupResults.Where(item => 
                            item.AccMakerName.ToLower().Contains(lowerSearchKeyword) ||
                            item.AccModelName.ToLower().Contains(lowerSearchKeyword) ||
                            (item.AccSize != null && item.AccSize.ToLower().Contains(lowerSearchKeyword))));
                        break;

                    case "Snapacting":
                        var snapactingResults = await _context.SnapactingList
                            .Join(_context.SnapactingMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Snapacting" })
                            .ToListAsync();
                        resultList.AddRange(snapactingResults.Where(item => 
                            item.AccMakerName.ToLower().Contains(lowerSearchKeyword) ||
                            item.AccModelName.ToLower().Contains(lowerSearchKeyword) ||
                            (item.AccSize != null && item.AccSize.ToLower().Contains(lowerSearchKeyword))));
                        break;

                    default:
                        // 모든 타입에서 검색
                        var allResults = new List<object>();
                        
                        // Positioner
                        var allPositioner = await _context.PositionerList
                            .Join(_context.PositionerMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Positioner" })
                            .ToListAsync();
                        allResults.AddRange(allPositioner);

                        // Solenoid
                        var allSolenoid = await _context.SolenoidList
                            .Join(_context.SolenoidMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Solenoid" })
                            .ToListAsync();
                        allResults.AddRange(allSolenoid);

                        // Limit
                        var allLimit = await _context.LimitList
                            .Join(_context.LimitMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Limit" })
                            .ToListAsync();
                        allResults.AddRange(allLimit);

                        // Airset
                        var allAirset = await _context.AirsetList
                            .Join(_context.AirsetMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Airset" })
                            .ToListAsync();
                        allResults.AddRange(allAirset);

                        // Volume
                        var allVolume = await _context.VolumeList
                            .Join(_context.VolumeMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Volume" })
                            .ToListAsync();
                        allResults.AddRange(allVolume);

                        // Airoperate
                        var allAiroperate = await _context.AiroperateList
                            .Join(_context.AiroperateMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Airoperate" })
                            .ToListAsync();
                        allResults.AddRange(allAiroperate);

                        // Lockup
                        var allLockup = await _context.LockupList
                            .Join(_context.LockupMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Lockup" })
                            .ToListAsync();
                        allResults.AddRange(allLockup);

                        // Snapacting
                        var allSnapacting = await _context.SnapactingList
                            .Join(_context.SnapactingMakerList,
                                  model => model.AccMakerCode,
                                  maker => maker.AccMakerCode,
                                  (model, maker) => new { model.AccMakerCode, model.AccModelCode, model.AccModelName, maker.AccMakerName, model.AccSize, AccTypeCode = "Snapacting" })
                            .ToListAsync();
                        allResults.AddRange(allSnapacting);

                        // 전체에서 검색어 필터링
                        resultList.AddRange(allResults.Where(item => 
                            item.GetType().GetProperty("AccMakerName")?.GetValue(item)?.ToString()?.ToLower().Contains(lowerSearchKeyword) == true ||
                            item.GetType().GetProperty("AccModelName")?.GetValue(item)?.ToString()?.ToLower().Contains(lowerSearchKeyword) == true ||
                            (item.GetType().GetProperty("AccSize")?.GetValue(item)?.ToString() != null && 
                             item.GetType().GetProperty("AccSize")?.GetValue(item)?.ToString()?.ToLower().Contains(lowerSearchKeyword) == true)));
                        break;
                }

                return resultList.Cast<object>().ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SearchAccessoriesAsync 실행 중 오류 발생: {ex.Message}");
                return new List<object>();
            }
        }

        private async Task<AccessoryDetailDto?> GetAccessoryDetailAsync(string accessoryType, string? modelCode, string? makerCode)
        {
            if (string.IsNullOrEmpty(modelCode) && string.IsNullOrEmpty(makerCode))
            {
                return new AccessoryDetailDto { TypeCode = accessoryType, MakerCode = makerCode ?? "", ModelCode = modelCode ?? "", Specification = "" };
            }

            PositionerList? positionerModel = null;
            PositionerMakerList? positionerMaker = null;
            SolenoidList? solenoidModel = null;
            SolenoidMakerList? solenoidMaker = null;
            LimitList? limitModel = null;
            LimitMakerList? limitMaker = null;
            AirsetList? airsetModel = null;
            AirsetMakerList? airsetMaker = null;
            VolumeList? volumeModel = null;
            VolumeMakerList? volumeMaker = null;
            AiroperateList? airoperateModel = null;
            AiroperateMakerList? airoperateMaker = null;
            LockupList? lockupModel = null;
            LockupMakerList? lockupMaker = null;
            SnapactingList? snapactingModel = null;
            SnapactingMakerList? snapactingMaker = null;

            switch (accessoryType)
            {
                case "Positioner":
                    positionerModel = await _context.PositionerList.FirstOrDefaultAsync(m => m.AccModelCode == modelCode && m.AccMakerCode == makerCode);
                    if (positionerModel != null) positionerMaker = await _context.PositionerMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == positionerModel.AccMakerCode);
                    break;
                case "Solenoid":
                    solenoidModel = await _context.SolenoidList.FirstOrDefaultAsync(m => m.AccModelCode == modelCode && m.AccMakerCode == makerCode);
                    if (solenoidModel != null) solenoidMaker = await _context.SolenoidMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == solenoidModel.AccMakerCode);
                    break;
                case "Limiter":
                    limitModel = await _context.LimitList.FirstOrDefaultAsync(m => m.AccModelCode == modelCode && m.AccMakerCode == makerCode);
                    if (limitModel != null) limitMaker = await _context.LimitMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == limitModel.AccMakerCode);
                    break;
                case "AirSupply":
                    airsetModel = await _context.AirsetList.FirstOrDefaultAsync(m => m.AccModelCode == modelCode && m.AccMakerCode == makerCode);
                    if (airsetModel != null) airsetMaker = await _context.AirsetMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == airsetModel.AccMakerCode);
                    break;
                case "VolumeBooster":
                    volumeModel = await _context.VolumeList.FirstOrDefaultAsync(m => m.AccModelCode == modelCode && m.AccMakerCode == makerCode);
                    if (volumeModel != null) volumeMaker = await _context.VolumeMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == volumeModel.AccMakerCode);
                    break;
                case "AirOperator":
                    airoperateModel = await _context.AiroperateList.FirstOrDefaultAsync(m => m.AccModelCode == modelCode && m.AccMakerCode == makerCode);
                    if (airoperateModel != null) airoperateMaker = await _context.AiroperateMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == airoperateModel.AccMakerCode);
                    break;
                case "LockUp":
                    lockupModel = await _context.LockupList.FirstOrDefaultAsync(m => m.AccModelCode == modelCode && m.AccMakerCode == makerCode);
                    if (lockupModel != null) lockupMaker = await _context.LockupMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == lockupModel.AccMakerCode);
                    break;
                case "SnapActingRelay":
                    snapactingModel = await _context.SnapactingList.FirstOrDefaultAsync(m => m.AccModelCode == modelCode && m.AccMakerCode == makerCode);
                    if (snapactingModel != null) snapactingMaker = await _context.SnapactingMakerList.FirstOrDefaultAsync(m => m.AccMakerCode == snapactingModel.AccMakerCode);
                    break;
            }

            if (positionerModel == null && solenoidModel == null && limitModel == null && airsetModel == null && volumeModel == null && airoperateModel == null && lockupModel == null && snapactingModel == null)
            {
                return new AccessoryDetailDto { TypeCode = accessoryType, MakerCode = makerCode ?? "", ModelCode = modelCode ?? "", Specification = "" };
            }

            string accMakerCode = "";
            string accMakerName = "";
            string accModelCode = "";
            string accModelName = "";
            string accSize = "";

            switch (accessoryType)
            {
                case "Positioner":
                    if (positionerModel != null)
                    {
                        accMakerCode = positionerModel.AccMakerCode ?? "";
                        accModelCode = positionerModel.AccModelCode ?? "";
                        accModelName = positionerModel.AccModelName ?? "";
                        accSize = positionerModel.AccSize ?? "";
                    }
                    if (positionerMaker != null) accMakerName = positionerMaker.AccMakerName ?? "";
                    break;
                case "Solenoid":
                    if (solenoidModel != null)
                    {
                        accMakerCode = solenoidModel.AccMakerCode ?? "";
                        accModelCode = solenoidModel.AccModelCode ?? "";
                        accModelName = solenoidModel.AccModelName ?? "";
                        accSize = solenoidModel.AccSize ?? "";
                    }
                    if (solenoidMaker != null) accMakerName = solenoidMaker.AccMakerName ?? "";
                    break;
                case "Limiter":
                    if (limitModel != null)
                    {
                        accMakerCode = limitModel.AccMakerCode ?? "";
                        accModelCode = limitModel.AccModelCode ?? "";
                        accModelName = limitModel.AccModelName ?? "";
                        accSize = limitModel.AccSize ?? "";
                    }
                    if (limitMaker != null) accMakerName = limitMaker.AccMakerName ?? "";
                    break;
                case "AirSupply":
                    if (airsetModel != null)
                    {
                        accMakerCode = airsetModel.AccMakerCode ?? "";
                        accModelCode = airsetModel.AccModelCode ?? "";
                        accModelName = airsetModel.AccModelName ?? "";
                        accSize = airsetModel.AccSize ?? "";
                    }
                    if (airsetMaker != null) accMakerName = airsetMaker.AccMakerName ?? "";
                    break;
                case "VolumeBooster":
                    if (volumeModel != null)
                    {
                        accMakerCode = volumeModel.AccMakerCode ?? "";
                        accModelCode = volumeModel.AccModelCode ?? "";
                        accModelName = volumeModel.AccModelName ?? "";
                        accSize = volumeModel.AccSize ?? "";
                    }
                    if (volumeMaker != null) accMakerName = volumeMaker.AccMakerName ?? "";
                    break;
                case "AirOperator":
                    if (airoperateModel != null)
                    {
                        accMakerCode = airoperateModel.AccMakerCode ?? "";
                        accModelCode = airoperateModel.AccModelCode ?? "";
                        accModelName = airoperateModel.AccModelName ?? "";
                        accSize = airoperateModel.AccSize ?? "";
                    }
                    if (airoperateMaker != null) accMakerName = airoperateMaker.AccMakerName ?? "";
                    break;
                case "LockUp":
                    if (lockupModel != null)
                    {
                        accMakerCode = lockupModel.AccMakerCode ?? "";
                        accModelCode = lockupModel.AccModelCode ?? "";
                        accModelName = lockupModel.AccModelName ?? "";
                        accSize = lockupModel.AccSize ?? "";
                    }
                    if (lockupMaker != null) accMakerName = lockupMaker.AccMakerName ?? "";
                    break;
                case "SnapActingRelay":
                    if (snapactingModel != null)
                    {
                        accMakerCode = snapactingModel.AccMakerCode ?? "";
                        accModelCode = snapactingModel.AccModelCode ?? "";
                        accModelName = snapactingModel.AccModelName ?? "";
                        accSize = snapactingModel.AccSize ?? "";
                    }
                    if (snapactingMaker != null) accMakerName = snapactingMaker.AccMakerName ?? "";
                    break;
            }

            return new AccessoryDetailDto
            {
                TypeCode = accessoryType,
                ModelCode = accModelCode,
                ModelName = accModelName,
                MakerCode = accMakerCode,
                MakerName = accMakerName,
                Specification = accSize // AccSize 값을 Specification에 할당
            };
        }

        private async Task<string?> GetTrimMatCodeAsync(string? trimMatName)
        {
            if (string.IsNullOrEmpty(trimMatName)) return null;
            var trimMat = await _context.TrimMatList.FirstOrDefaultAsync(m => m.TrimMat == trimMatName);
            return trimMat?.TrimMatCode ?? trimMatName; // 못찾으면 원래 이름 반환
        }

        private async Task<string?> GetBodyRatingCodeAsync(string? ratingName)
        {
            if (string.IsNullOrEmpty(ratingName)) return null;
            var rating = await _context.BodyRatingList.FirstOrDefaultAsync(r => r.RatingName == ratingName);
            return rating?.RatingCode ?? ratingName;
        }
        

        private async Task<string?> GetBodyRatingUnitCodeAsync(string? unitCode)
        {
            if (string.IsNullOrEmpty(unitCode))
            {
                return null;
            }

            var bodyRatingUnit = await _context.BodyRatingList
                                               .FirstOrDefaultAsync(b => b.RatingUnitCode == unitCode);

            return bodyRatingUnit?.RatingUnitCode;
        }


        private async Task<string?> GetActHWCodeAsync(bool? isHw)
        {
            if (!isHw.HasValue || !isHw.Value) return null;
            // 프론트엔드에서는 'Yes'/'No' 문자열로 관리하지만, DTO에서는 bool? 타입.
            // 여기서는 bool 값을 기준으로 코드를 찾는다. 'Yes' -> '1', 'No'/'None' -> '0' 또는 다른 코드
            // 여기서는 간단하게 bool 값을 문자열로 변환하여 사용
            var hwName = isHw.Value ? "Yes" : "No";
            var hw = await _context.ActHWList.FirstOrDefaultAsync(h => h.HW == hwName);
            return hw?.HWCode;
        }

        // Trim Material 추가
        public async Task<bool> AddTrimMaterialAsync(string trimMatCode, string trimMat)
        {
            try
            {
                if (_context.TrimMatList.Any(t => t.TrimMatCode == trimMatCode))
                {
                    return false; // 중복 코드
                }
                _context.TrimMatList.Add(new TrimMatList { TrimMatCode = trimMatCode, TrimMat = trimMat });
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AddTrimMaterialAsync: {ex.Message}");
                return false;
            }
        }

        // Trim Material 수정
        public async Task<bool> UpdateTrimMaterialAsync(string trimMatCode, string trimMat)
        {
            try
            {
                var existing = await _context.TrimMatList.FirstOrDefaultAsync(t => t.TrimMatCode == trimMatCode);
                if (existing == null)
                {
                    return false; // 존재하지 않는 코드
                }
                existing.TrimMat = trimMat;
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateTrimMaterialAsync: {ex.Message}");
                return false;
            }
        }

        // Trim Option 추가
        public async Task<bool> AddTrimOptionAsync(string trimOptionCode, string trimOption)
        {
            try
            {
                if (_context.TrimOptionList.Any(t => t.TrimOptionCode == trimOptionCode))
                {
                    return false; // 중복 코드
                }
                _context.TrimOptionList.Add(new TrimOptionList { TrimOptionCode = trimOptionCode, TrimOptionName = trimOption });
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AddTrimOptionAsync: {ex.Message}");
                return false;
            }
        }

        // Trim Option 수정
        public async Task<bool> UpdateTrimOptionAsync(string trimOptionCode, string trimOption)
        {
            try
            {
                var existing = await _context.TrimOptionList.FirstOrDefaultAsync(t => t.TrimOptionCode == trimOptionCode);
                if (existing == null)
                {
                    return false; // 존재하지 않는 코드
                }
                existing.TrimOptionName = trimOption;
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateTrimOptionAsync: {ex.Message}");
                return false;
            }
        }

        // Act Size 추가 (새로운 시그니처)
        public async Task<bool> AddActSizeAsync(string actSeriesCode, string actSizeCode, string actSize)
        {
            try
            {
                if (_context.ActSizeList.Any(a => a.ActSeriesCode == actSeriesCode && a.ActSizeCode == actSizeCode))
                {
                    return false; // 중복 코드
                }
                _context.ActSizeList.Add(new ActSizeList { ActSeriesCode = actSeriesCode, ActSizeCode = actSizeCode, ActSize = actSize });
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AddActSizeAsync: {ex.Message}");
                return false;
            }
        }

        // Act Size 수정 (새로운 시그니처)
        public async Task<bool> UpdateActSizeAsync(string actSeriesCode, string actSizeCode, string actSize)
        {
            try
            {
                var existing = await _context.ActSizeList
                    .FirstOrDefaultAsync(a => a.ActSeriesCode == actSeriesCode && a.ActSizeCode == actSizeCode);
                if (existing == null)
                {
                    return false; // 존재하지 않는 코드
                }
                existing.ActSize = actSize;
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateActSizeAsync: {ex.Message}");
                return false;
            }
        }

        // Act Size 삭제 (새로운 시그니처)
        public async Task<bool> DeleteActSizeAsync(string actSeriesCode, string actSizeCode)
        {
            try
            {
                var existing = await _context.ActSizeList
                    .FirstOrDefaultAsync(a => a.ActSeriesCode == actSeriesCode && a.ActSizeCode == actSizeCode);
                if (existing == null)
                {
                    return false;
                }

                // Act Size는 Series와 연결되어 있지만, 실제로는 독립적으로 삭제 가능
                // (견적에서 사용 중인지는 이미 FK 제약조건 제거로 해결됨)

                _context.ActSizeList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in DeleteActSizeAsync: {ex.Message}");
                return false;
            }
        }

        // Trim Material 삭제
        public async Task<bool> DeleteTrimMaterialAsync(string trimMatCode)
        {
            try
            {
                var existing = await _context.TrimMatList.FirstOrDefaultAsync(t => t.TrimMatCode == trimMatCode);
                if (existing == null)
                {
                    return false;
                }
                // TODO: 실제 데이터 사용 여부 확인 로직 추가 필요
                _context.TrimMatList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in DeleteTrimMaterialAsync: {ex.Message}");
                return false;
            }
        }

        // Trim Option 삭제
        public async Task<bool> DeleteTrimOptionAsync(string trimOptionCode)
        {
            try
            {
                var existing = await _context.TrimOptionList.FirstOrDefaultAsync(t => t.TrimOptionCode == trimOptionCode);
                if (existing == null)
                {
                    return false;
                }
                // TODO: 실제 데이터 사용 여부 확인 로직 추가 필요
                _context.TrimOptionList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in DeleteTrimOptionAsync: {ex.Message}");
                return false;
            }
        }

        // 악세사리 메이커 사용 여부 확인 (새로 추가)
        public async Task<object> CheckAccMakerUsageAsync(string accTypeCode, string makerCode)
        {
            try
            {
                // 해당 메이커를 사용하는 모델들 확인
                var usedModels = new List<object>();
                
                switch (accTypeCode)
                {
                    case "Positioner":
                        var positionerModels = await _context.PositionerList
                            .Where(p => p.AccMakerCode == makerCode)
                            .Select(p => new { p.AccModelCode, p.AccModelName, p.AccSize })
                            .ToListAsync();
                        usedModels.AddRange(positionerModels);
                        break;
                        
                    case "Solenoid":
                        var solenoidModels = await _context.SolenoidList
                            .Where(s => s.AccMakerCode == makerCode)
                            .Select(s => new { s.AccModelCode, s.AccModelName, s.AccSize })
                            .ToListAsync();
                        usedModels.AddRange(solenoidModels);
                        break;
                        
                    case "Limit":
                        var limitModels = await _context.LimitList
                            .Where(l => l.AccMakerCode == makerCode)
                            .Select(l => new { l.AccModelCode, l.AccModelName, l.AccSize })
                            .ToListAsync();
                        usedModels.AddRange(limitModels);
                        break;
                        
                    case "Airset":
                        var airsetModels = await _context.AirsetList
                            .Where(a => a.AccMakerCode == makerCode)
                            .Select(a => new { a.AccModelCode, a.AccModelName, a.AccSize })
                            .ToListAsync();
                        usedModels.AddRange(airsetModels);
                        break;
                        
                    case "Volume":
                        var volumeModels = await _context.VolumeList
                            .Where(v => v.AccMakerCode == makerCode)
                            .Select(v => new { v.AccModelCode, v.AccModelName, v.AccSize })
                            .ToListAsync();
                        usedModels.AddRange(volumeModels);
                        break;
                        
                    case "Airoperate":
                        var airoperateModels = await _context.AiroperateList
                            .Where(a => a.AccMakerCode == makerCode)
                            .Select(a => new { a.AccModelCode, a.AccModelName, a.AccSize })
                            .ToListAsync();
                        usedModels.AddRange(airoperateModels);
                        break;
                        
                    case "Lockup":
                        var lockupModels = await _context.LockupList
                            .Where(l => l.AccMakerCode == makerCode)
                            .Select(l => new { l.AccModelCode, l.AccModelName, l.AccSize })
                            .ToListAsync();
                        usedModels.AddRange(lockupModels);
                        break;
                        
                    case "Snapacting":
                        var snapactingModels = await _context.SnapactingList
                            .Where(s => s.AccMakerCode == makerCode)
                            .Select(s => new { s.AccModelCode, s.AccModelName, s.AccSize })
                            .ToListAsync();
                        usedModels.AddRange(snapactingModels);
                        break;
                        
                    default:
                        return new { error = "알 수 없는 악세사리 타입입니다." };
                }

                return new
                {
                    isUsed = usedModels.Any(),
                    usedModelsCount = usedModels.Count,
                    usedModels = usedModels
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CheckAccMakerUsageAsync에서 오류 발생: {ex.Message}");
                return new { error = ex.Message };
            }
        }
        // 악세사리 모델 사용 여부 확인 (새로 추가)
        public async Task<object> CheckAccModelUsageAsync(string accTypeCode, string makerCode, string modelCode)
        {
            try
            {
                // 해당 모델이 견적에서 사용 중인지 확인
                var usedEstimates = await _context.DataSheetLv3
                    .Where(ds => ds.TempEstimateNo != null)
                    .Where(ds => 
                        (accTypeCode == "Positioner" && ds.PosMakerCode == makerCode && ds.PosCode == modelCode) ||
                        (accTypeCode == "Solenoid" && ds.SolMakerCode == makerCode && ds.SolCode == modelCode) ||
                        (accTypeCode == "Limit" && ds.LimMakerCode == makerCode && ds.LimCode == modelCode) ||
                        (accTypeCode == "Airset" && ds.ASMakerCode == makerCode && ds.ASCode == modelCode) ||
                        (accTypeCode == "Volume" && ds.VolMakerCode == makerCode && ds.VolCode == modelCode) ||
                        (accTypeCode == "Airoperate" && ds.AirOpMakerCode == makerCode && ds.AirOpCode == modelCode) ||
                        (accTypeCode == "Lockup" && ds.LockupMakerCode == makerCode && ds.LockupCode == modelCode) ||
                        (accTypeCode == "Snapacting" && ds.SnapActMakerCode == makerCode && ds.SnapActCode == modelCode)
                    )
                    .Select(ds => new { ds.TempEstimateNo, ds.SheetID })
                    .ToListAsync();

                return new
                {
                    isUsed = usedEstimates.Any(),
                    usedEstimatesCount = usedEstimates.Count,
                    usedEstimates = usedEstimates
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CheckAccModelUsageAsync에서 오류 발생: {ex.Message}");
                return new { error = ex.Message };
            }
        }

        // CV 리스트 생성 메서드
        public async Task<string> GenerateCVListAsync(string tempEstimateNo)
        {
            try
            {
                Console.WriteLine($"🔍 CV 리스트 생성 시작 - tempEstimateNo: {tempEstimateNo}");
                
                // 1. 데이터베이스에서 데이터 조회
                Console.WriteLine("📊 데이터베이스 쿼리 시작...");
                var query = @"SELECT d.*, e.Project, er.Tagno, al.AccSize as AiroperateAccSize
                             FROM DataSheetLv3 d 
                             JOIN EstimateSheetLv1 e ON d.TempEstimateNo = e.TempEstimateNo 
                             JOIN EstimateRequest er ON d.TempEstimateNo = er.TempEstimateNo AND d.SheetID = er.SheetID
                             LEFT JOIN AiroperateList al ON d.AirOpCode = al.AccModelCode 
                             WHERE d.TempEstimateNo = @tempEstimateNo;";
                
                Console.WriteLine("🔌 데이터베이스 연결 시도...");
                using var connection = new MySql.Data.MySqlClient.MySqlConnection(_context.Database.GetConnectionString());
                await connection.OpenAsync();
                Console.WriteLine("✅ 데이터베이스 연결 성공");
                
                Console.WriteLine("📝 SQL 명령 실행...");
                using var command = new MySql.Data.MySqlClient.MySqlCommand(query, connection);
                command.Parameters.AddWithValue("@tempEstimateNo", tempEstimateNo);
                
                Console.WriteLine("🔍 데이터 읽기 시작...");
                using var reader = await command.ExecuteReaderAsync();
                
                // 1. 모든 데이터를 읽어서 ValveType별로 그룹화
                Console.WriteLine("📝 데이터 읽기 및 그룹화 시작...");
                var valveTypeGroups = new Dictionary<string, List<Dictionary<string, object>>>();
                
                while (await reader.ReadAsync())
                {
                    var valveType = reader["ValveType"]?.ToString() ?? "Unknown";
                    if (!valveTypeGroups.ContainsKey(valveType))
                    {
                        valveTypeGroups[valveType] = new List<Dictionary<string, object>>();
                    }
                    
                    // 현재 행의 모든 데이터를 저장
                    var rowData = new Dictionary<string, object>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        rowData[reader.GetName(i)] = reader[i];
                    }
                    valveTypeGroups[valveType].Add(rowData);
                    
                    Console.WriteLine($"📊 ValveType: {valveType}, SheetID: {reader["SheetID"]} 데이터 추가됨");
                }
                
                Console.WriteLine($"✅ 총 {valveTypeGroups.Count}개 ValveType 그룹 생성됨");
                
                if (valveTypeGroups.Count == 0)
                {
                    throw new Exception("데이터를 찾을 수 없습니다.");
                }
                
                // 2. CV 템플릿 파일 복사
                Console.WriteLine("📁 템플릿 파일 경로 확인...");
                var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "Templates", "CV.xlsx");
                Console.WriteLine($"📁 템플릿 경로: {templatePath}");
                
                if (!File.Exists(templatePath))
                {
                    throw new Exception($"템플릿 파일을 찾을 수 없습니다: {templatePath}");
                }
                Console.WriteLine("✅ 템플릿 파일 존재 확인");
                
                var outputFileName = $"{tempEstimateNo}_CV_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
                var outputPath = Path.Combine(Directory.GetCurrentDirectory(), "files", tempEstimateNo, "ResultFiles", "cvlist", outputFileName);
                Console.WriteLine($"📁 출력 경로: {outputPath}");
                
                // 3. 출력 폴더 생성
                Console.WriteLine("📁 출력 폴더 생성 시작...");
                var outputDir = Path.GetDirectoryName(outputPath);
                Console.WriteLine($"📁 출력 디렉토리: {outputDir}");
                
                if (!string.IsNullOrEmpty(outputDir))
                {
                    Console.WriteLine("📁 디렉토리 생성 시도...");
                    Directory.CreateDirectory(outputDir);
                    Console.WriteLine("✅ 디렉토리 생성 완료");
                }
                
                Console.WriteLine("📄 템플릿 파일 복사 시작...");
                File.Copy(templatePath, outputPath, true);
                Console.WriteLine("✅ 템플릿 파일 복사 완료");
                
                // 4. Excel 파일 업데이트
                Console.WriteLine("📊 Excel 파일 업데이트 시작...");
                Console.WriteLine("📖 Excel 워크북 열기...");
                using var workbook = new ClosedXML.Excel.XLWorkbook(outputPath);
                Console.WriteLine("✅ Excel 워크북 열기 완료");
                
                // 5. 각 ValveType별로 시트 생성 및 데이터 입력
                foreach (var valveTypeGroup in valveTypeGroups)
                {
                    string valveType = valveTypeGroup.Key;
                    var dataRows = valveTypeGroup.Value;
                    
                    Console.WriteLine($"📋 ValveType '{valveType}' 시트 처리 시작...");
                    
                    // 기존 CV 시트를 복사하여 새로운 시트 생성
                    var originalWorksheet = workbook.Worksheet("CV");
                    var newWorksheet = originalWorksheet.CopyTo($"CV_{valveType}");
                    Console.WriteLine($"✅ 시트 'CV_{valveType}' 생성 완료");
                    

                    
                        int rowCount = 0;     // 각 SheetID별로 데이터 입력 (파일예시와 동일: sheetID + 15)
                        for (int currentIndex = 0; currentIndex < dataRows.Count; currentIndex++)
                        {
                            var rowData = dataRows[currentIndex];
                            int sheetID = Convert.ToInt32(rowData["SheetID"]);
                            
                            int row_cv = rowCount + 14; // 파일예시와 동일: sheetID + 15
                            rowCount++;
                            Console.WriteLine($"📊 SheetID: {sheetID}, CV 행: {row_cv} (인덱스: {currentIndex})");
                        
                        // 파일예시와 동일한 배열 정의
                        int[] cv_skip_excel_cell = { 4, 9, 10, 11, 24, 26, 28, 29, 30, 31 }; // 셀 빈칸
                        string[] target_value = {
                            "Tagno",   // 견적번호 (파일예시와 동일)
                            "ValveType",   // 밸브타입
                            "BodySize",   // 바디사이즈
                            "TrimPortSize",   // 포트사이즈
                            "Medium",   // 매체
                            "Fluid",   // 유체
                            "InletPressureMaxQ",   // P1 최대
                            "InletPressureNorQ",   // P1 정상
                            "InletPressureMinQ",   // P1 최소
                            "OutletPressureMaxQ",   // P2 최대
                            "OutletPressureNorQ",   // P2 정상
                            "OutletPressureMinQ",   // P2 최소
                            "DifferentialPressureMaxQ",   // 차압 최대
                            "DifferentialPressureNorQ",   // 차압 정상
                            "DifferentialPressureMinQ",   // 차압 최소
                            "InletTemperatureQ",   // 온도 최대
                            "InletTemperatureNorQ",   // 온도 정상
                            "InletTemperatureMinQ",   // 온도 최소
                            "Density",   // 밀도
                            "MolecularWeight",   // 분자량
                            "CalculatedCvMaxQ",   // Cv 최대
                            "CalculatedCvNorQ",   // Cv 정상
                            "CalculatedCvMinQ",   // Cv 최소
                            "SS100Max",   // S/S100 최대
                            "SS100Nor",   // S/S100 정상
                            "SS100Min",   // S/S100 최소
                            "LpAeMax",   // LpAe 최대
                            "LpAeNor",   // LpAe 정상
                            "LpAeMin",   // LpAe 최소
                            "NorFlowCoeff",   // 정상유량계수
                            "BasicCharacter",   // 기본특성
                        };
                        
                        Console.WriteLine("📝 기본 데이터 입력 시작...");
                        int cv_target_index = 0;
                        
                        // 파일예시와 동일한 for 루프로 데이터 입력
                        for (int i = 2; i < 43; i++) // B열(2번째)부터 시작해서 42번째 열까지
                        {
                            if (cv_skip_excel_cell.Contains(i)) { continue; }
                            
                            Console.WriteLine($"📊 {target_value[cv_target_index]} 입력 (열 {i})...");
                            // TagNo가 없으면 빈 문자열로 처리
                            var cellValue = rowData.ContainsKey(target_value[cv_target_index]) 
                                ? rowData[target_value[cv_target_index]]?.ToString() ?? "" 
                                : "";
                            newWorksheet.Cell(row_cv, i).Value = cellValue;
                            cv_target_index++;
                        }
                        
                        Console.WriteLine("✅ 기본 데이터 입력 완료");
                        
                        // QM/QN 관련 데이터 (IsQM에 따라) - 파일예시 방식
                        Console.WriteLine("📊 QM/QN 데이터 입력 시작...");
                        bool isQM = Convert.ToBoolean(rowData["IsQM"]);
                        Console.WriteLine($"📊 IsQM: {isQM}");
                        
                        // 파일예시와 동일한 방식으로 QM/QN 데이터 입력
                        for (int i = 28; i < 32; i++)
                        {
                            string value;
                            
                            if (isQM)
                            {
                                // IsQM이 true면 QM 관련 값 사용
                                switch (i)
                                {
                                    case 28: // QM 단위
                                        value = rowData["QMUnit"]?.ToString() ?? "";
                                        break;
                                    case 29: // QM 최대
                                        value = rowData["QMMax"]?.ToString() ?? "";
                                        break;
                                    case 30: // QM 정상
                                        value = rowData["QMNor"]?.ToString() ?? "";
                                        break;
                                    case 31: // QM 최소
                                        value = rowData["QMMin"]?.ToString() ?? "";
                                        break;
                                    default:
                                        value = "";
                                        break;
                                }
                            }
                            else
                            {
                                // IsQM이 false면 QN 관련 값 사용
                                switch (i)
                                {
                                    case 28: // QN 단위
                                        value = rowData["QNUnit"]?.ToString() ?? "";
                                        break;
                                    case 29: // QN 최대
                                        value = rowData["QNMax"]?.ToString() ?? "";
                                        break;
                                    case 30: // QN 정상
                                        value = rowData["QNNor"]?.ToString() ?? "";
                                        break;
                                    case 31: // QN 최소
                                        value = rowData["QNMin"]?.ToString() ?? "";
                                        break;
                                    default:
                                        value = "";
                                        break;
                                }
                            }
                            
                            Console.WriteLine($"📊 QM/QN 데이터 입력 (열 {i}): {value}");
                            newWorksheet.Cell(row_cv, i).Value = value;
                        }
                        
                        Console.WriteLine("✅ QM/QN 데이터 입력 완료");
                        
                        // 특정 위치 데이터 (파일예시와 동일)
                        Console.WriteLine("📊 특정 위치 데이터 입력 시작...");
                        newWorksheet.Cell(4, 1).Value = "Project : " + (rowData["Project"]?.ToString() ?? "");  // Project : 값 형태
                        newWorksheet.Cell(12, 4).Value = rowData["AiroperateAccSize"]?.ToString();  // 표준값
                        newWorksheet.Cell(12, 5).Value = rowData["AiroperateAccSize"]?.ToString();  // 표준값
                        newWorksheet.Cell(12, 6).Value = rowData["AiroperateAccSize"]?.ToString();  // 표준값
                        newWorksheet.Cell(10, 12).Value = rowData["PressureUnit"]?.ToString();  // 압력단위
                        newWorksheet.Cell(10, 15).Value = rowData["PressureUnit"]?.ToString();  // 압력단위
                        newWorksheet.Cell(10, 18).Value = rowData["PressureUnit"]?.ToString();  // 압력단위
                        newWorksheet.Cell(10, 21).Value = rowData["TemperatureUnit"]?.ToString();  // 온도단위
                        newWorksheet.Cell(11, 25).Value = rowData["DensityUnit"]?.ToString();  // 밀도단위
                        newWorksheet.Cell(11, 27).Value = rowData["MolecularWeightUnit"]?.ToString();  // 분자량단위
                        newWorksheet.Cell(4, 43).Value = DateTime.Now.ToString("yyyy년 MM월 dd일");  // 현재 날짜
                        Console.WriteLine("✅ 특정 위치 데이터 입력 완료");
                        
                        Console.WriteLine($"✅ SheetID {sheetID} 데이터 입력 완료");
                    }
                    
                    Console.WriteLine($"✅ ValveType '{valveType}' 시트 처리 완료");
                }
                
                // 5-1. 모든 시트 생성 완료 후 기본 CV 시트 삭제
                Console.WriteLine("🗑️ 기본 CV 템플릿 시트 삭제 시작...");
                var templateWorksheet = workbook.Worksheet("CV");
                templateWorksheet.Delete();
                Console.WriteLine("✅ 기본 CV 템플릿 시트 삭제 완료");
                
                // 6. 파일 저장
                Console.WriteLine("💾 Excel 파일 저장 시작...");
                workbook.Save();
                Console.WriteLine("✅ Excel 파일 저장 완료");
                
                Console.WriteLine("🔒 Excel 워크북 닫기...");
                workbook.Dispose();
                Console.WriteLine("✅ Excel 워크북 닫기 완료");
                
                // 7. Excel 파일을 EstimateAttachment에 저장 (기존 파일이 있으면 대체)
                var existingAttachment = await _context.EstimateAttachment
                    .FirstOrDefaultAsync(ea => ea.TempEstimateNo == tempEstimateNo && ea.ManagerFileType == "cvlist");
                
                if (existingAttachment != null)
                {
                    // 기존 파일 삭제
                    if (File.Exists(existingAttachment.FilePath))
                    {
                        try
                        {
                            File.Delete(existingAttachment.FilePath);
                        }
                        catch (Exception ex)
                        {
                            // 파일 삭제 실패 시 로그만 남기고 계속 진행
                            Console.WriteLine($"기존 파일 삭제 실패: {ex.Message}");
                        }
                    }
                    
                    // 기존 DB 레코드 업데이트
                    existingAttachment.FileName = outputFileName;
                    existingAttachment.FilePath = outputPath;
                    existingAttachment.FileSize = (int)new FileInfo(outputPath).Length;
                    existingAttachment.UploadDate = DateTime.Now;
                }
                else
                {
                    // 새 DB 레코드 생성
                    var excelAttachment = new EstimateAttachment
                    {
                        TempEstimateNo = tempEstimateNo,
                        FileName = outputFileName,
                        FilePath = outputPath,
                        FileSize = (int)new FileInfo(outputPath).Length,
                        UploadDate = DateTime.Now,
                        UploadUserID = null,
                        ManagerFileType = "cvlist"
                    };
                    
                    _context.EstimateAttachment.Add(excelAttachment);
                }
                
                await _context.SaveChangesAsync();
                
                return $"{outputFileName}";
            }
            catch (Exception ex)
            {
                throw new Exception($"CV 리스트 생성 실패: {ex.Message}");
            }
        }

        public async Task<string> GenerateVLListAsync(string tempEstimateNo)
        {
            try
            {
                // 1. 템플릿 경로 설정
                var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "Templates", "VL.xlsx");
                if (!File.Exists(templatePath))
                {
                    throw new Exception($"VL 템플릿 파일을 찾을 수 없습니다: {templatePath}");
                }

                // 2. 출력 경로 설정
                var outputDir = Path.Combine(Directory.GetCurrentDirectory(), "files", tempEstimateNo, "ResultFiles", "vllist");
                var outputFileName = $"VL_{tempEstimateNo}_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
                var outputPath = Path.Combine(outputDir, outputFileName);

                // 3. 디렉토리 생성 및 템플릿 복사
                if (!Directory.Exists(outputDir))
                {
                    Directory.CreateDirectory(outputDir);
                }
                
                File.Copy(templatePath, outputPath, true);

                // 4. 데이터베이스에서 데이터 조회
                using var conn = new MySqlConnection(_context.Database.GetConnectionString());
                await conn.OpenAsync();
                
                // only_full_group_by 모드 끄기
                using var modeCmd = new MySqlCommand("SET sql_mode = (SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));", conn);
                await modeCmd.ExecuteNonQueryAsync();
                
                string query = @"SELECT d.*, e.Project, er.Tagno, er.Qty, er.UnitPrice,
                                       bvl.ValveSeries as ValveTypeName,
                                       bsl.BodySize as BodySizeName,
                                       tpsl.PortSize as TrimPortSizeName,
                                       bml.BodyMat as BodyMatName,
                                       tml.TrimMat as TrimMatName,
                                       brl.RatingName as RatingName,
                                       atl.ActType as ActTypeName,
                                       asl.ActSize as ActSizeName,
                                       ahl.HW as HWName,
                                       bbl.BonnetType as BonnetTypeName,
                                       tsl.TrimSeries as TrimSeriesName,
                                       ttl.TrimType as TrimTypeName,
                                       al.AccSize as AiroperateAccSize,
                                       er.IsPositioner,
                                       er.IsSolenoid,
                                       er.IsLimSwitch,
                                       er.IsLockUp,
                                       er.IsVolumeBooster,
                                       er.IsSnapActingRelay,
                                       er.IsAirOperated
                                FROM DataSheetLv3 d 
                                JOIN EstimateSheetLv1 e ON d.TempEstimateNo = e.TempEstimateNo 
                                LEFT JOIN EstimateRequest er ON d.TempEstimateNo = er.TempEstimateNo AND d.SheetID = er.SheetID
                                LEFT JOIN BodyValveList bvl ON d.ValveType = bvl.ValveSeriesCode
                                LEFT JOIN BodySizeList bsl ON d.BodySize = bsl.BodySizeCode
                                LEFT JOIN TrimPortSizeList tpsl ON d.TrimPortSize = tpsl.PortSizeCode
                                LEFT JOIN BodyMatList bml ON d.BodyMat = bml.BodyMatCode
                                LEFT JOIN TrimMatList tml ON d.TrimMat = tml.TrimMatCode
                                LEFT JOIN BodyRatingList brl ON d.Rating = brl.RatingCode
                                LEFT JOIN ActTypeList atl ON d.ActType = atl.ActTypeCode
                                LEFT JOIN ActSizeList asl ON d.ActSize = asl.ActSizeCode
                                LEFT JOIN ActHWList ahl ON d.HW = ahl.HWCode
                                LEFT JOIN BodyBonnetList bbl ON d.BonnetType = bbl.BonnetCode
                                LEFT JOIN TrimSeriesList tsl ON d.TrimSeries = tsl.TrimSeriesCode
                                LEFT JOIN TrimTypeList ttl ON d.TrimType = ttl.TrimTypeCode
                                LEFT JOIN AiroperateList al ON d.AirOpCode = al.AccModelCode
                                WHERE d.TempEstimateNo = @tempEstimateNo
                                GROUP BY d.TempEstimateNo, d.SheetID;";

                using var cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@tempEstimateNo", tempEstimateNo);
                using var reader = await cmd.ExecuteReaderAsync();

                // 5. ValveType별로 데이터 그룹화
                var valveTypeGroups = new Dictionary<string, List<Dictionary<string, object>>>();
                
                while (await reader.ReadAsync())
                {
                    var valveType = reader["ValveType"]?.ToString() ?? "Unknown";
                    if (!valveTypeGroups.ContainsKey(valveType))
                    {
                        valveTypeGroups[valveType] = new List<Dictionary<string, object>>();
                    }
                    
                    var rowData = new Dictionary<string, object>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        rowData[reader.GetName(i)] = reader[i];
                    }
                    valveTypeGroups[valveType].Add(rowData);
                }

                if (valveTypeGroups.Count == 0)
                {
                    throw new Exception("데이터를 찾을 수 없습니다.");
                }

                // 6. Excel 파일 업데이트
                using var workbook = new ClosedXML.Excel.XLWorkbook(outputPath);
                
                // 7. 각 ValveType별로 시트 생성 및 데이터 입력
                foreach (var valveTypeGroup in valveTypeGroups)
                {
                    string valveType = valveTypeGroup.Key;
                    var dataRows = valveTypeGroup.Value;
                    
                    // 기존 VL 시트를 복사하여 새로운 시트 생성
                    var originalWorksheet = workbook.Worksheet("VL");
                    var newWorksheet = originalWorksheet.CopyTo($"VL_{valveType}");
                    
                    // 각 SheetID별로 데이터 입력
                    for (int currentIndex = 0; currentIndex < dataRows.Count; currentIndex++)
                    {
                        var rowData = dataRows[currentIndex];
                        int sheetID = Convert.ToInt32(rowData["SheetID"]);
                        int row_vl = 10 + currentIndex; // VL은 10행부터 시작
                        
                        // VL 데이터 매핑 배열
                        int[] vl_skip_excel_cell = { 3, 4, 5, 7, 12, 13, 14, 18, 23, 24, 26, 28, 29, 30, 31, 35, 39, 40, 41, 42 };
                        string[] vl_target_value = {
                            "Tagno",   // 견적번호
                            "ValveTypeName",   // 밸브타입
                            "BodySizeName",   // 바디사이즈
                            "TrimPortSizeName",   // 포트사이즈
                            "Medium",   // 매체
                            "Fluid",   // 유체
                            "BodyMatName",   // 바디재질
                            "TrimMatName",   // 트림재질
                            "RatingName",   // 레이팅
                            "ActTypeName",   // 액추에이터타입
                            "ActSizeName",   // 액추에이터사이즈
                            "HWName",   // 액추에이터HW
                            "BonnetTypeName",   // 보넷타입
                            "BasicCharacter",   // 기본특성
                            "IsPositioner",   // 에어셋
                            "IsSolenoid",   // 솔레노이드
                            "IsLimSwitch",   // 리미트스위치
                            "IsLockUp",   // 락업밸브
                            "IsVolumeBooster",   // 볼륨부스터
                            "IsSnapActingRelay",   // 스냅액팅
                            "IsAirOperated",   // 에어오퍼레이트
                            "Qty",   // 수량
                            "UnitPrice",   // 단가
                        };
                        
                        int vl_target_index = 0;
                        for (int i = 2; i < 45; i++)
                        {
                            if (vl_skip_excel_cell.Contains(i)) { continue; }
                            
                            var cellValue = rowData.ContainsKey(vl_target_value[vl_target_index]) 
                                ? rowData[vl_target_value[vl_target_index]]?.ToString() ?? "" 
                                : "";
                            newWorksheet.Cell(row_vl, i).Value = cellValue;
                            vl_target_index++;
                        }
                        
                        // 특정 위치 데이터 (첫 번째 행에만 설정)
                        if (currentIndex == 0)
                        {
                            newWorksheet.Cell(4, 1).Value = "Project : " + (rowData["Project"]?.ToString() ?? "");
                            newWorksheet.Cell(9, 1).Value = "A. " + (rowData["ValveTypeName"]?.ToString() ?? "");
                            newWorksheet.Cell(8, 7).Value = rowData["AiroperateAccSize"]?.ToString();
                            newWorksheet.Cell(8, 8).Value = rowData["AiroperateAccSize"]?.ToString();
                            newWorksheet.Cell(8, 9).Value = rowData["AiroperateAccSize"]?.ToString();
                        }
                    }
                }
                
                // 8. 기본 VL 시트 삭제
                var templateWorksheet = workbook.Worksheet("VL");
                templateWorksheet.Delete();
                
                // 9. 파일 저장
                workbook.Save();
                workbook.Dispose();
                
                // 10. EstimateAttachment에 저장
                var existingAttachment = await _context.EstimateAttachment
    .FirstOrDefaultAsync(ea => ea.TempEstimateNo == tempEstimateNo && ea.ManagerFileType == "vllist");

if (existingAttachment != null)
{
    // 기존 파일 삭제
    if (File.Exists(existingAttachment.FilePath))
    {
        try
        {
            File.Delete(existingAttachment.FilePath);
        }
        catch (Exception ex)
        {
            // 파일 삭제 실패 시 로그만 남기고 계속 진행
            Console.WriteLine($"기존 파일 삭제 실패: {ex.Message}");
        }
    }
    
    // 기존 DB 레코드 업데이트
    existingAttachment.FileName = outputFileName;
    existingAttachment.FilePath = outputPath;
    existingAttachment.FileSize = (int)new FileInfo(outputPath).Length;
    existingAttachment.UploadDate = DateTime.Now;
}
else
{
    // 새 DB 레코드 생성
    var excelAttachment = new EstimateAttachment
    {
        TempEstimateNo = tempEstimateNo,
        FileName = outputFileName,
        FilePath = outputPath,
        FileSize = (int)new FileInfo(outputPath).Length,
        UploadDate = DateTime.Now,
        UploadUserID = null,
        ManagerFileType = "vllist"
    };
    
    _context.EstimateAttachment.Add(excelAttachment);
}
await _context.SaveChangesAsync();
                
                return $"{outputFileName}";
            }
            catch (Exception ex)
            {
                throw new Exception($"VL 리스트 생성 실패: {ex.Message}");
            }
        }

        public async Task<string> GenerateDataSheetAsync(string tempEstimateNo)
        {
            try
            {
                // 1. 템플릿 경로 설정
                var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "Templates", "DS.xlsx");
                if (!File.Exists(templatePath))
                {
                    throw new Exception($"DS 템플릿 파일을 찾을 수 없습니다: {templatePath}");
                }

                // 2. 출력 경로 설정
                var outputDir = Path.Combine(Directory.GetCurrentDirectory(), "files", tempEstimateNo, "ResultFiles", "datasheet");
                var outputFileName = $"DS_{tempEstimateNo}_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
                var outputPath = Path.Combine(outputDir, outputFileName);

                // 3. 디렉토리 생성 및 템플릿 복사
                if (!Directory.Exists(outputDir))
                {
                    Directory.CreateDirectory(outputDir);
                }
                
                File.Copy(templatePath, outputPath, true);

                // 4. 데이터베이스에서 데이터 조회
                using var conn = new MySqlConnection(_context.Database.GetConnectionString());
                await conn.OpenAsync();
                
                // only_full_group_by 모드 끄기
                using var modeCmd = new MySqlCommand("SET sql_mode = (SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));", conn);
                await modeCmd.ExecuteNonQueryAsync();
                
                string query = @"SELECT d.*, e.Project, er.Tagno, er.Qty,
                                       bvl.ValveSeries as ValveTypeName,
                                       bsl.BodySize as BodySizeName,
                                       tpsl.PortSize as TrimPortSizeName,
                                       bml.BodyMat as BodyMatName,
                                       tml.TrimMat as TrimMatName,
                                       brl.RatingName as RatingName,
                                       atl.ActType as ActTypeName,
                                       asl.ActSize as ActSizeName,
                                       ahl.HW as HWName,
                                       bbl.BonnetType as BonnetTypeName,
                                       tsl.TrimSeries as TrimSeriesName,
                                       ttl.TrimType as TrimTypeCode,
                                       pl.AccModelName as PosCodeName,
                                       sl.AccModelName as SolCodeName,
                                       ll.AccModelName as LimCodeName,
                                       al.AccModelCode as ASCodeName,
                                       vl.AccModelName as VolCodeName,
                                       aol.AccModelName as AirOpCodeName,
                                       lkl.AccModelName as LockupCodeName,
                                       sal.AccModelName as SnapActCodeName,
                                       al_acc.AccSize as AiroperateAccSize,
                                       er.IsPositioner,
                                       er.IsSolenoid,
                                       er.IsLimSwitch,
                                       er.IsLockUp,
                                       er.IsVolumeBooster,
                                       er.IsSnapActingRelay,
                                       er.IsAirOperated
                                FROM DataSheetLv3 d 
                                JOIN EstimateSheetLv1 e ON d.TempEstimateNo = e.TempEstimateNo 
                                LEFT JOIN EstimateRequest er ON d.TempEstimateNo = er.TempEstimateNo AND d.SheetID = er.SheetID
                                LEFT JOIN BodyValveList bvl ON d.ValveType = bvl.ValveSeriesCode
                                LEFT JOIN BodySizeList bsl ON d.BodySize = bsl.BodySizeCode
                                LEFT JOIN TrimPortSizeList tpsl ON d.TrimPortSize = tpsl.PortSizeCode
                                LEFT JOIN BodyMatList bml ON d.BodyMat = bml.BodyMatCode
                                LEFT JOIN TrimMatList tml ON d.TrimMat = tml.TrimMatCode
                                LEFT JOIN BodyRatingList brl ON d.Rating = brl.RatingCode
                                LEFT JOIN ActTypeList atl ON d.ActType = atl.ActTypeCode
                                LEFT JOIN ActSizeList asl ON d.ActSize = asl.ActSizeCode
                                LEFT JOIN ActHWList ahl ON d.HW = ahl.HWCode
                                LEFT JOIN BodyBonnetList bbl ON d.BonnetType = bbl.BonnetCode
                                LEFT JOIN TrimSeriesList tsl ON d.TrimSeries = tsl.TrimSeriesCode
                                LEFT JOIN TrimTypeList ttl ON d.TrimType = ttl.TrimTypeCode
                                LEFT JOIN PositionerList pl ON d.PosCode = pl.AccModelCode
                                LEFT JOIN SolenoidList sl ON d.SolCode = sl.AccModelCode
                                LEFT JOIN LimitList ll ON d.LimCode = ll.AccModelCode
                                LEFT JOIN AirsetList al ON d.ASCode = al.AccModelCode
                                LEFT JOIN VolumeList vl ON d.VolCode = vl.AccModelCode
                                LEFT JOIN AiroperateList aol ON d.AirOpCode = aol.AccModelCode
                                LEFT JOIN LockupList lkl ON d.LockupCode = lkl.AccModelCode
                                LEFT JOIN SnapactingList sal ON d.SnapActCode = sal.AccModelCode
                                LEFT JOIN AiroperateList al_acc ON d.AirOpCode = al_acc.AccModelCode
                                WHERE d.TempEstimateNo = @tempEstimateNo
                                GROUP BY d.TempEstimateNo, d.SheetID;";

                using var cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@tempEstimateNo", tempEstimateNo);
                using var reader = await cmd.ExecuteReaderAsync();

                // 5. Excel 파일 업데이트
                using var workbook = new ClosedXML.Excel.XLWorkbook(outputPath);
                var templateWorksheet = workbook.Worksheet("DS");
                
                int rowCount = 0;
                while (await reader.ReadAsync())
                {
                    // SheetID에 따라 새로운 시트 생성 (Program 복사본.cs와 동일한 로직)
                    string sheetName = rowCount == 0 ? "DS" : $"DS{rowCount + 1}";
                    var worksheet_ds = rowCount == 0 ? templateWorksheet : templateWorksheet.CopyTo(sheetName);
                    
                    // DS 데이터 매핑 (Program 복사본.cs와 동일한 로직)
                    int[] row_ds_1 = { 11, 12, 13, 14, 16, 17, 19, 20, 21 };
                    int[] col_ds_1 = { 17, 22, 30, 38 };
                    string[] ds_target_value_1 = {
                        "PressureUnit",        // 압력단위
                        "InletPressureMaxQ",           // P1 최대
                        "InletPressureNorQ",        // P1 정상
                        "InletPressureMinQ",           // P1 최소
                        "PressureUnit",          // 압력단위
                        "OutletPressureMaxQ",           // P2 최대
                        "OutletPressureNorQ",        // P2 정상
                        "OutletPressureMinQ",           // P2 최소
                        "PressureUnit",     // 압력단위
                        "DifferentialPressureMaxQ",      // 차압 최대
                        "DifferentialPressureNorQ",   // 차압 정상
                        "DifferentialPressureMinQ",      // 차압 최소
                        "TemperatureUnit",          // 온도단위
                        "InletTemperatureQ",           // 온도 최대
                        "InletTemperatureNorQ",        // 온도 정상
                        "InletTemperatureMinQ",           // 온도 최소
                        "DensityUnit",    // 밀도단위
                        "Density",            // 밀도
                        "Density",            // 밀도
                        "Density",            // 밀도
                        "MolecularWeightUnit",  // 분자량단위
                        "MolecularWeight",     // 분자량
                        "MolecularWeight",     // 분자량
                        "MolecularWeight",     // 분자량
                        "LpAeMax",       // LpAe 최대
                        "LpAeNor",    // LpAe 정상
                        "LpAeMin",     // LpAe 최소
                        "CalculatedCvUnit",          // Cv 단위
                        "CalculatedCvMaxQ",           // Cv 최대
                        "CalculatedCvNorQ",        // Cv 정상
                        "CalculatedCvMinQ",           // Cv 최소
                        "SS100Max",         // S/S100 최대
                        "SS100Nor",      // S/S100 정상
                        "SS100Min"        // S/S100 최소
                    };
                    
                    int ds_target_index_1 = 0;
                    foreach (int row in row_ds_1)
                    {
                        foreach (int col in col_ds_1)
                        {
                            if ((row == 19 && col == 17) || (row == 21 && col == 17)) { continue; }
                            worksheet_ds.Cell(row, col).Value = reader[ds_target_value_1[ds_target_index_1]]?.ToString();
                            ds_target_index_1++;
                        }
                    }

                    // QM/QN 데이터 처리
                    int[] col_2 = { 17, 22, 30, 38 };
                    string[] ds_target_value_2 = {
                        "QMUnit",          // QM 단위
                        "QNUnit",         // QN 단위
                        "QMMax",          // QM 최대
                        "QNMax",          // QN 최대
                        "QMNor",       // QM 정상
                        "QNNor",         // QN 정상
                        "QMMin",          // QM 최소
                        "QNMin"        // QN 최소
                    };
                    
                    int ds_target_index_2 = 0;
                    foreach (int col in col_2)
                    {
                        bool isQM = Convert.ToBoolean(reader["IsQM"]);
                        string value;
                        
                        if (isQM)
                        {
                            switch (ds_target_index_2)
                            {
                                case 0: value = reader["QMUnit"]?.ToString() ?? ""; break;
                                case 1: value = reader["QMMax"]?.ToString() ?? ""; break;
                                case 2: value = reader["QMNor"]?.ToString() ?? ""; break;
                                case 3: value = reader["QMMin"]?.ToString() ?? ""; break;
                                default: value = ""; break;
                            }
                        }
                        else
                        {
                            switch (ds_target_index_2)
                            {
                                case 0: value = reader["QNUnit"]?.ToString() ?? ""; break;
                                case 1: value = reader["QNMax"]?.ToString() ?? ""; break;
                                case 2: value = reader["QNNor"]?.ToString() ?? ""; break;
                                case 3: value = reader["QNMin"]?.ToString() ?? ""; break;
                                default: value = ""; break;
                            }
                        }
                        
                        worksheet_ds.Cell(10, col).Value = value;
                        ds_target_index_2++;
                    }

                    // 기본 정보 데이터
                    int[] row_ds_3 = { 29, 30, 31, 32, 34, 36, 37, 41, 42, 45 };
                    string[] ds_target_value_3 = {
                        "ValveTypeName",              // 밸브타입
                        "BodySizeName",               // 바디사이즈
                        "TrimSeriesName",                 // 트림시리즈
                        "TrimTypeCode",               // 트림타입
                        "RatingName",             // 레이팅
                        "BodyMatName",           // 바디재질
                        "TrimMatName",           // 트림재질
                        "BonnetTypeName",        // 보넷타입
                        "BasicCharacter",                 // 기본특성
                        "NorFlowCoeff"                  // 정상유량계수
                    };

                    int ds_target_index_3 = 0;
                    foreach (int row in row_ds_3)
                    {
                        worksheet_ds.Cell(row, 25).Value = reader[ds_target_value_3[ds_target_index_3]]?.ToString();
                        ds_target_index_3++;
                    }

                    // 액세사리 코드 데이터
                    int[] row_ds_4 = { 4, 12, 18, 24, 28, 30, 32, 35 };
                    string[] ds_target_value_4 = {
                        "PosCodeName", // 포지셔너코드
                        "SolCodeName", // 솔레노이드코드
                        "LimCodeName", // 리미트스위치코드
                        "ASCodeName", // 에어셋코드
                        "VolCodeName", // 볼륨부스터코드
                        "AirOpCodeName", // 에어오퍼레이트코드
                        "LockupCodeName", // 락업밸브코드
                        "SnapActCodeName" // 스냅액팅코드
                    };
                    
                    int ds_target_index_4 = 0;
                    foreach (int row in row_ds_4)
                    {
                        worksheet_ds.Cell(row, 97).Value = reader[ds_target_value_4[ds_target_index_4]]?.ToString();
                        ds_target_index_4++;
                    }

                    // 특정 위치 데이터
                    worksheet_ds.Cell(2, 36).Value = reader["ValveTypeName"]?.ToString();
                    worksheet_ds.Cell(3, 36).Value = reader["Project"]?.ToString();
                    worksheet_ds.Cell(5, 36).Value = reader["Tagno"]?.ToString();
                    worksheet_ds.Cell(6, 76).Value = reader["Qty"]?.ToString();
                    worksheet_ds.Cell(8, 22).Value = reader["Medium"]?.ToString();
                    worksheet_ds.Cell(8, 35).Value = reader["Fluid"]?.ToString();
                    worksheet_ds.Cell(11, 69).Value = reader["ActTypeName"]?.ToString();
                    worksheet_ds.Cell(30, 36).Value = reader["TrimPortSizeName"]?.ToString();
                    worksheet_ds.Cell(4, 92).Value = reader["ActSizeName"]?.ToString();
                    worksheet_ds.Cell(11, 92).Value = reader["HWName"]?.ToString();
                    
                    rowCount++;
                }
                
                // 원본 템플릿 시트는 그대로 유지 (첫 번째 시트로 사용)
                
                // 6. 파일 저장
                workbook.Save();
                workbook.Dispose();
                
                // 7. EstimateAttachment에 저장 (기존 파일이 있으면 대체)
                var existingAttachment = await _context.EstimateAttachment
                    .FirstOrDefaultAsync(ea => ea.TempEstimateNo == tempEstimateNo && ea.ManagerFileType == "datasheet");
                
                if (existingAttachment != null)
                {
                    // 기존 파일 삭제
                    if (File.Exists(existingAttachment.FilePath))
                    {
                        try
                        {
                            File.Delete(existingAttachment.FilePath);
                        }
                        catch (Exception ex)
                        {
                            // 파일 삭제 실패 시 로그만 남기고 계속 진행
                            Console.WriteLine($"기존 파일 삭제 실패: {ex.Message}");
                        }
                    }
                    
                    // 기존 DB 레코드 업데이트
                    existingAttachment.FileName = outputFileName;
                    existingAttachment.FilePath = outputPath;
                    existingAttachment.FileSize = (int)new FileInfo(outputPath).Length;
                    existingAttachment.UploadDate = DateTime.Now;
                }
                else
                {
                    // 새 DB 레코드 생성
                    var excelAttachment = new EstimateAttachment
                    {
                        TempEstimateNo = tempEstimateNo,
                        FileName = outputFileName,
                        FilePath = outputPath,
                        FileSize = (int)new FileInfo(outputPath).Length,
                        UploadDate = DateTime.Now,
                        UploadUserID = null,
                        ManagerFileType = "datasheet"
                    };
                    
                    _context.EstimateAttachment.Add(excelAttachment);
                }
                
                await _context.SaveChangesAsync();
                
                return $"{outputFileName}";
            }
            catch (Exception ex)
            {
                throw new Exception($"DataSheet 생성 실패: {ex.Message}");
            }
        }

        public async Task<string> GenerateSingleQuoteAsync(string tempEstimateNo)
        {
            try
            {
                // 1. 템플릿 경로 설정
                var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "Templates", "SingleQuote.xlsx");
                if (!File.Exists(templatePath))
                {
                    throw new Exception($"SingleQuote 템플릿 파일을 찾을 수 없습니다: {templatePath}");
                }

                // 2. 출력 경로 설정
                var outputDir = Path.Combine(Directory.GetCurrentDirectory(), "files", tempEstimateNo, "ResultFiles", "singlequote");
                var outputFileName = $"SingleQuote_{tempEstimateNo}_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
                var outputPath = Path.Combine(outputDir, outputFileName);

                // 3. 디렉토리 생성 및 템플릿 복사
                if (!Directory.Exists(outputDir))
                {
                    Directory.CreateDirectory(outputDir);
                }
                
                File.Copy(templatePath, outputPath, true);

                // 4. 데이터베이스에서 데이터 조회
                using var conn = new MySqlConnection(_context.Database.GetConnectionString());
                await conn.OpenAsync();
                
                // only_full_group_by 모드 끄기
                using var modeCmd = new MySqlCommand("SET sql_mode = (SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));", conn);
                await modeCmd.ExecuteNonQueryAsync();
                
                string query = @"SELECT d.*, e.Project, e.ManagerID, er.Tagno, er.Qty, er.UnitPrice,
                                       bvl.ValveSeries as ValveTypeName,
                                       bml.BodyMat as BodyMatName,
                                       tml.TrimMat as TrimMatName,
                                       brl.RatingName as RatingName,
                                       u.CompanyName
                                FROM DataSheetLv3 d 
                                JOIN EstimateSheetLv1 e ON d.TempEstimateNo = e.TempEstimateNo 
                                LEFT JOIN EstimateRequest er ON d.TempEstimateNo = er.TempEstimateNo AND d.SheetID = er.SheetID
                                LEFT JOIN BodyValveList bvl ON d.ValveType = bvl.ValveSeriesCode
                                LEFT JOIN BodyMatList bml ON d.BodyMat = bml.BodyMatCode
                                LEFT JOIN TrimMatList tml ON d.TrimMat = tml.TrimMatCode
                                LEFT JOIN BodyRatingList brl ON d.Rating = brl.RatingCode
                                LEFT JOIN User u ON e.ManagerID = u.UserID
                                WHERE d.TempEstimateNo = @tempEstimateNo
                                GROUP BY d.TempEstimateNo, d.SheetID;";

                using var cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@tempEstimateNo", tempEstimateNo);
                using var reader = await cmd.ExecuteReaderAsync();

                // 5. Excel 파일 업데이트
                using var workbook = new ClosedXML.Excel.XLWorkbook(outputPath);
                var templateWorksheet = workbook.Worksheet("단품견적서");
                
                int rowCount = 0;
                while (await reader.ReadAsync())
                {
                    // SheetID에 따라 새로운 시트 생성 (Program 복사본.cs와 동일한 로직)
                    string sheetName = rowCount == 0 ? "단품견적서" : $"단품견적서-{rowCount + 1}";
                    var worksheet_est1 = rowCount == 0 ? templateWorksheet : templateWorksheet.CopyTo(sheetName);
                    
                    // 견적서1 데이터 입력
                    worksheet_est1.Cell(3, 6).Value = reader["CompanyName"]?.ToString();
                    worksheet_est1.Cell(4, 6).Value = reader["ManagerID"]?.ToString();
                    worksheet_est1.Cell(5, 6).Value = reader["Project"]?.ToString();
                    worksheet_est1.Cell(6, 6).Value = reader["Tagno"]?.ToString();
                    worksheet_est1.Cell(7, 6).Value = DateTime.Now.ToString("yyyy년 MM월 dd일");
                    worksheet_est1.Cell(22, 6).Value = reader["BodyMatName"]?.ToString();
                    worksheet_est1.Cell(23, 6).Value = reader["TrimMatName"]?.ToString();
                    worksheet_est1.Cell(26, 3).Value = reader["RatingName"]?.ToString();
                    worksheet_est1.Cell(29, 3).Value = "ACT Full Name";
                    worksheet_est1.Cell(16, 12).Value = "BodyTrim Size";
                    worksheet_est1.Cell(16, 13).Value = reader["Qty"]?.ToString();
                    worksheet_est1.Cell(16, 14).Value = reader["UnitPrice"]?.ToString();
                    worksheet_est1.Cell(11, 4).Value = reader["ValveTypeName"]?.ToString();
                    
                    rowCount++;
                }
                
                // 원본 템플릿 시트는 그대로 유지 (첫 번째 시트로 사용)
                
                // 6. 파일 저장
                workbook.Save();
                workbook.Dispose();
                
                // 7. EstimateAttachment에 저장 (기존 파일이 있으면 대체)
                var existingAttachment = await _context.EstimateAttachment
                    .FirstOrDefaultAsync(ea => ea.TempEstimateNo == tempEstimateNo && ea.ManagerFileType == "singlequote");
                
                if (existingAttachment != null)
                {
                    // 기존 파일 삭제
                    if (File.Exists(existingAttachment.FilePath))
                    {
                        try
                        {
                            File.Delete(existingAttachment.FilePath);
                        }
                        catch (Exception ex)
                        {
                            // 파일 삭제 실패 시 로그만 남기고 계속 진행
                            Console.WriteLine($"기존 파일 삭제 실패: {ex.Message}");
                        }
                    }
                    
                    // 기존 DB 레코드 업데이트
                    existingAttachment.FileName = outputFileName;
                    existingAttachment.FilePath = outputPath;
                    existingAttachment.FileSize = (int)new FileInfo(outputPath).Length;
                    existingAttachment.UploadDate = DateTime.Now;
                }
                else
                {
                    // 새 DB 레코드 생성
                    var excelAttachment = new EstimateAttachment
                    {
                        TempEstimateNo = tempEstimateNo,
                        FileName = outputFileName,
                        FilePath = outputPath,
                        FileSize = (int)new FileInfo(outputPath).Length,
                        UploadDate = DateTime.Now,
                        UploadUserID = null,
                        ManagerFileType = "singlequote"
                    };
                    
                    _context.EstimateAttachment.Add(excelAttachment);
                }
                
                await _context.SaveChangesAsync();
                
                return $"{outputFileName}";
            }
            catch (Exception ex)
            {
                throw new Exception($"단품견적서 생성 실패: {ex.Message}");
            }
        }

        public async Task<string> GenerateMultiQuoteAsync(string tempEstimateNo)
        {
            try
            {
                // 1. 템플릿 경로 설정
                var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "Templates", "MultiQuote.xlsx");
                if (!File.Exists(templatePath))
                {
                    throw new Exception($"MultiQuote 템플릿 파일을 찾을 수 없습니다: {templatePath}");
                }

                // 2. 출력 경로 설정
                var outputDir = Path.Combine(Directory.GetCurrentDirectory(), "files", tempEstimateNo, "ResultFiles", "multiquote");
                var outputFileName = $"MultiQuote_{tempEstimateNo}_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
                var outputPath = Path.Combine(outputDir, outputFileName);

                // 3. 디렉토리 생성 및 템플릿 복사
                if (!Directory.Exists(outputDir))
                {
                    Directory.CreateDirectory(outputDir);
                }
                
                File.Copy(templatePath, outputPath, true);

                // 4. 데이터베이스에서 데이터 조회
                using var conn = new MySqlConnection(_context.Database.GetConnectionString());
                await conn.OpenAsync();
                
                // only_full_group_by 모드 끄기
                using var modeCmd = new MySqlCommand("SET sql_mode = (SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));", conn);
                await modeCmd.ExecuteNonQueryAsync();
                
                string query = @"SELECT d.*, e.Project, e.ManagerID, er.Tagno, er.Qty, er.UnitPrice,
                                       bvl.ValveSeries as ValveTypeName,
                                       u.CompanyName
                                FROM DataSheetLv3 d 
                                JOIN EstimateSheetLv1 e ON d.TempEstimateNo = e.TempEstimateNo 
                                LEFT JOIN EstimateRequest er ON d.TempEstimateNo = er.TempEstimateNo AND d.SheetID = er.SheetID
                                LEFT JOIN BodyValveList bvl ON d.ValveType = bvl.ValveSeriesCode
                                LEFT JOIN User u ON e.ManagerID = u.UserID
                                WHERE d.TempEstimateNo = @tempEstimateNo
                                GROUP BY d.TempEstimateNo, d.SheetID;";

                using var cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@tempEstimateNo", tempEstimateNo);
                using var reader = await cmd.ExecuteReaderAsync();

                // 5. Excel 파일 업데이트
                using var workbook = new ClosedXML.Excel.XLWorkbook(outputPath);
                var worksheet_est2 = workbook.Worksheet("다수량견적서");
                
                // 견적서2 헤더 정보 (첫 번째 행에만 설정)
                bool isFirstRow = true;
                int rowCount = 0;
                
                while (await reader.ReadAsync())
                {
                    if (isFirstRow)
                    {
                        worksheet_est2.Cell(3, 6).Value = reader["CompanyName"]?.ToString();
                        worksheet_est2.Cell(4, 6).Value = reader["ManagerID"]?.ToString();
                        worksheet_est2.Cell(5, 6).Value = reader["Project"]?.ToString();
                        worksheet_est2.Cell(6, 6).Value = reader["Tagno"]?.ToString();
                        isFirstRow = false;
                    }
                    
                    // rowIndex를 사용해서 줄을 내려가면서 데이터 입력
                    int row_est2 = 13 + rowCount;
                    worksheet_est2.Cell(row_est2, 4).Value = reader["ValveTypeName"]?.ToString();
                    worksheet_est2.Cell(row_est2, 12).Value = "BodyTrim Size";
                    worksheet_est2.Cell(row_est2, 13).Value = reader["Qty"]?.ToString();
                    worksheet_est2.Cell(row_est2, 14).Value = reader["UnitPrice"]?.ToString();
                    
                    rowCount++;
                }
                
                // 6. 파일 저장
                workbook.Save();
                workbook.Dispose();
                
                // 7. EstimateAttachment에 저장 (기존 파일이 있으면 대체)
                var existingAttachment = await _context.EstimateAttachment
                    .FirstOrDefaultAsync(ea => ea.TempEstimateNo == tempEstimateNo && ea.ManagerFileType == "multiquote");
                
                if (existingAttachment != null)
                {
                    // 기존 파일 삭제
                    if (File.Exists(existingAttachment.FilePath))
                    {
                        try
                        {
                            File.Delete(existingAttachment.FilePath);
                        }
                        catch (Exception ex)
                        {
                            // 파일 삭제 실패 시 로그만 남기고 계속 진행
                            Console.WriteLine($"기존 파일 삭제 실패: {ex.Message}");
                        }
                    }
                    
                    // 기존 DB 레코드 업데이트
                    existingAttachment.FileName = outputFileName;
                    existingAttachment.FilePath = outputPath;
                    existingAttachment.FileSize = (int)new FileInfo(outputPath).Length;
                    existingAttachment.UploadDate = DateTime.Now;
                }
                else
                {
                    // 새 DB 레코드 생성
                    var excelAttachment = new EstimateAttachment
                    {
                        TempEstimateNo = tempEstimateNo,
                        FileName = outputFileName,
                        FilePath = outputPath,
                        FileSize = (int)new FileInfo(outputPath).Length,
                        UploadDate = DateTime.Now,
                        UploadUserID = null,
                        ManagerFileType = "multiquote"
                    };
                    
                    _context.EstimateAttachment.Add(excelAttachment);
                }
                
                await _context.SaveChangesAsync();
                
                return $"{outputFileName}";
            }
            catch (Exception ex)
            {
                throw new Exception($"다수량견적서 생성 실패: {ex.Message}");
            }
        }

            // �� 관리자용 파일 목록 조회 메서드들
public async Task<List<EstimateAttachmentResponseDto>> GetManagerFilesAsync(string tempEstimateNo)
{
    var attachments = await _context.EstimateAttachment
        .Where(ea => ea.TempEstimateNo == tempEstimateNo && 
                    !string.IsNullOrEmpty(ea.ManagerFileType) && ea.ManagerFileType != "customer")
        .OrderBy(ea => ea.ManagerFileType)
        .ThenBy(ea => ea.UploadDate)
        .Select(ea => new EstimateAttachmentResponseDto
        {
            AttachmentID = ea.AttachmentID,
            TempEstimateNo = ea.TempEstimateNo,
            FileName = ea.FileName,
            FilePath = ea.FilePath,
            FileSize = ea.FileSize,
            UploadDate = ea.UploadDate,
            UploadUserID = ea.UploadUserID,
            ManagerFileType = ea.ManagerFileType
        })
        .ToListAsync();

    return attachments;
}

public async Task<List<EstimateAttachmentResponseDto>> GetCustomerFilesAsync(string tempEstimateNo)
{
    var attachments = await _context.EstimateAttachment
        .Where(ea => ea.TempEstimateNo == tempEstimateNo && 
                    (string.IsNullOrEmpty(ea.ManagerFileType) || ea.ManagerFileType == "customer"))
        .OrderBy(ea => ea.UploadDate)
        .Select(ea => new EstimateAttachmentResponseDto
        {
            AttachmentID = ea.AttachmentID,
            TempEstimateNo = ea.TempEstimateNo,
            FileName = ea.FileName,
            FilePath = ea.FilePath,
            FileSize = ea.FileSize,
            UploadDate = ea.UploadDate,
            UploadUserID = ea.UploadUserID,
            ManagerFileType = ea.ManagerFileType
        })
        .ToListAsync();

    return attachments;
}

public async Task<EstimateAttachmentResponseDto> GetFileByManagerTypeAsync(string tempEstimateNo, string managerFileType)
{
    var attachment = await _context.EstimateAttachment
        .Where(ea => ea.TempEstimateNo == tempEstimateNo && 
                    ea.ManagerFileType == managerFileType)
        .Select(ea => new EstimateAttachmentResponseDto
        {
            AttachmentID = ea.AttachmentID,
            TempEstimateNo = ea.TempEstimateNo,
            FileName = ea.FileName,
            FilePath = ea.FilePath,
            FileSize = ea.FileSize,
            UploadDate = ea.UploadDate,
            UploadUserID = ea.UploadUserID,
            ManagerFileType = ea.ManagerFileType
        })
        .FirstOrDefaultAsync();

    return attachment;
}

public async Task<bool> DeleteFileByManagerTypeAsync(string tempEstimateNo, string managerFileType)
{
    var attachment = await _context.EstimateAttachment
        .FirstOrDefaultAsync(ea => ea.TempEstimateNo == tempEstimateNo && 
                                 ea.ManagerFileType == managerFileType);

    if (attachment == null)
        return false;

    // 파일 삭제
    if (File.Exists(attachment.FilePath))
    {
        try
        {
            File.Delete(attachment.FilePath);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"파일 삭제 실패: {ex.Message}");
            return false;
        }
    }

    // DB 레코드 삭제
    _context.EstimateAttachment.Remove(attachment);
    await _context.SaveChangesAsync();

    return true;
}

    }



} 