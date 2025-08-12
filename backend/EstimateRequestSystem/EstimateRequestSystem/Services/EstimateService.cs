using Microsoft.EntityFrameworkCore;
using EstimateRequestSystem.Data;
using EstimateRequestSystem.DTOs;
using EstimateRequestSystem.Models;

namespace EstimateRequestSystem.Services
{
    public class EstimateService : IEstimateService
    {
        private readonly EstimateRequestDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public EstimateService(EstimateRequestDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // EstimateSheet operations
        public async Task<string> CreateEstimateSheetAsync(CreateEstimateSheetDto dto)
        {
            var tempEstimateNo = await GenerateTempEstimateNoAsync();
            
            var estimateSheet = new EstimateSheetLv1
            {
                TempEstimateNo = tempEstimateNo,
                CustomerID = dto.CustomerID,
                WriterID = dto.WriterID,
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

            // 첨부파일 정보 저장
            if (dto.Attachments != null && dto.Attachments.Any())
            {
                foreach (var attachmentInfo in dto.Attachments)
                {
                    var attachment = new EstimateAttachment
                    {
                        TempEstimateNo = tempEstimateNo,
                        FileName = attachmentInfo.FileName,
                        FilePath = attachmentInfo.FilePath,
                        FileSize = attachmentInfo.FileSize,
                        UploadUserID = attachmentInfo.UploadUserID
                    };

                    _context.EstimateAttachment.Add(attachment);
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
                            };
                            _context.DataSheetLv3.Add(dataSheetLv3);
                        }
                    }
                }
            }

            // 4. 첨부파일 처리
            if (dto.Attachments != null && dto.Attachments.Any())
            {
                foreach (var attachmentInfo in dto.Attachments)
                {
                    var attachment = new EstimateAttachment
                    {
                        TempEstimateNo = tempEstimateNo,
                        FileName = attachmentInfo.FileName,
                        FilePath = attachmentInfo.FilePath,
                        FileSize = attachmentInfo.FileSize,
                        UploadUserID = attachmentInfo.UploadUserID
                    };

                    _context.EstimateAttachment.Add(attachment);
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
                ManagerName = estimateSheet.Manager?.Name,
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
                    ActType = er.ActType,
                    IsHW = er.IsHW,
                    IsPositioner = er.IsPositioner,
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
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/bmp",
            "image/tiff",
            "image/webp",
            "text/plain",
            "application/zip",
            "application/x-rar-compressed",
            "application/x-7z-compressed"
        };

        // Attachment operations
        public async Task<EstimateAttachmentResponseDto> UploadAttachmentAsync(string tempEstimateNo, IFormFile file, string uploadUserID)
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

            // 폴더 크기 제한 (100MB)
            var filesFolder = Path.Combine(_environment.ContentRootPath, "files", tempEstimateNo, "estimate-request-files");
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

            // 파일명 중복 처리
            var originalFileName = Path.GetFileName(file.FileName);
            var fileName = await GenerateUniqueFileNameAsync(filesFolder, originalFileName);
            var filePath = Path.Combine(filesFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 파일만 저장하고 DB에는 저장하지 않음 (임시저장/견적요청 시에 저장됨)
            return new EstimateAttachmentResponseDto
            {
                AttachmentID = 0, // 임시 ID
                TempEstimateNo = tempEstimateNo,
                FileName = originalFileName,
                FilePath = filePath,
                FileSize = (int)file.Length,
                UploadDate = DateTime.Now,
                UploadUserID = uploadUserID
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
            }

            _context.EstimateAttachment.Remove(attachment);
            await _context.SaveChangesAsync();
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
            catch (Exception)
            {
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
                CustomerID = "customer1", // 기본값
                WriterID = "customer1",   // 기본값
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
            var dataSheet = new DataSheetLv3
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
            _context.DataSheetLv3.Add(dataSheet);

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
            return valveList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetBodySizeListAsync()
        {
            var sizeList = await _context.BodySizeList
                .Select(s => new { s.SizeUnit, s.BodySize, s.BodySizeCode })
                .ToListAsync();
            return sizeList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetBodyMatListAsync()
        {
            var matList = await _context.BodyMatList
                .Select(m => new { m.BodyMat, m.BodyMatCode })
                .ToListAsync();
            return matList.Cast<object>().ToList();
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

        public async Task<List<object>> GetBodyRatingListAsync()
        {
            var ratingList = await _context.BodyRatingList
                .Select(r => new { r.RatingUnit, r.RatingCode, r.RatingName })
                .ToListAsync();
            return ratingList.Cast<object>().ToList();
        }

        public async Task<List<string>> GetBodySizeUnitsAsync()
        {
            var units = await _context.BodySizeList
                .Select(s => s.SizeUnit)
                .Distinct()
                .OrderBy(u => u)
                .ToListAsync();
            return units;
        }

        public async Task<List<string>> GetBodyRatingUnitsAsync()
        {
            var units = await _context.BodyRatingList
                .Select(r => r.RatingUnit)
                .Distinct()
                .OrderBy(u => u)
                .ToListAsync();
            return units;
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
                               ManagerName = m != null ? m.Name : null, // 담당자명
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
                x.ManagerName,
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
                    WriterID = x.WriterID ?? "" // 작성자 ID 추가
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
                    WriterID = x.WriterID
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
                    WriterID = estimateSheet.WriterID ?? "",
                    WriterName = estimateSheet.Writer?.Name ?? estimateSheet.WriterID ?? "",
                    ManagerID = estimateSheet.ManagerID,
                    ManagerName = estimateSheet.Manager?.Name,
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
                .OrderBy(t => t.trimTypeCode)
                .ToListAsync();
            return trimTypeList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetTrimSeriesListAsync()
        {
            var trimSeriesList = await _context.TrimSeriesList
                .Select(t => new { trimSeriesCode = t.TrimSeriesCode, trimSeries = t.TrimSeries })
                .OrderBy(t => t.trimSeriesCode)
                .ToListAsync();
            return trimSeriesList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetTrimPortSizeListAsync()
        {
            try
            {
                var portSizeList = await _context.TrimPortSizeList
                    .Select(p => new { portSizeCode = p.PortSizeCode, portSize = p.PortSize, portSizeUnit = p.PortSizeUnit })
                    .OrderBy(p => p.portSizeCode)
                    .ToListAsync();
                return portSizeList.Cast<object>().ToList();
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
                .OrderBy(f => f.trimFormCode)
                .ToListAsync();
            return formList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetActTypeListAsync()
        {
            var actTypeList = await _context.ActTypeList
                .Select(a => new { actTypeCode = a.ActTypeCode, actType = a.ActType })
                .OrderBy(a => a.actTypeCode)
                .ToListAsync();
            return actTypeList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetActSeriesListAsync()
        {
            var actSeriesList = await _context.ActSeriesList
                .Select(a => new { actSeriesCode = a.ActSeriesCode, actSeries = a.ActSeries })
                .OrderBy(a => a.actSeriesCode)
                .ToListAsync();
            return actSeriesList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetActSizeListAsync(string actSeriesCode = null)
        {
            var query = _context.ActSizeList.AsQueryable();
            
            if (!string.IsNullOrEmpty(actSeriesCode))
            {
                query = query.Where(a => a.ActSeriesCode == actSeriesCode);
            }

            var actSizeList = await query
                .Select(a => new { actSizeCode = a.ActSizeCode, actSize = a.ActSize })
                .OrderBy(a => a.actSizeCode)
                .ToListAsync();
            return actSizeList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetActHWListAsync()
        {
            try
            {
                var hwList = await _context.ActHWList
                    .Select(h => new { hwCode = h.HWCode, hw = h.HW })
                    .OrderBy(h => h.hwCode)
                    .ToListAsync();
                return hwList.Cast<object>().ToList();
            }
            catch (Exception ex)
            {
                // 더 자세한 로깅을 위해 예외 정보를 포함
                throw new Exception($"GetActHWListAsync 실행 중 오류 발생: {ex.Message}", ex);
            }
        }

        public async Task<List<object>> GetAccTypeListAsync()
        {
            var accTypeList = await _context.AccTypeList
                .Select(a => new { Code = a.AccTypeCode, Name = a.AccTypeName })
                .OrderBy(a => a.Code)
                .ToListAsync();
            return accTypeList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetAccMakerListAsync(string accTypeCode = null)
        {
            var query = _context.AccMakerList.AsQueryable();
            
            if (!string.IsNullOrEmpty(accTypeCode))
            {
                query = query.Where(a => a.AccTypeCode == accTypeCode);
            }

            var accMakerList = await query
                .Select(a => new { 
                    AccTypeCode = a.AccTypeCode, 
                    AccMakerCode = a.AccMakerCode, 
                    AccMakerName = a.AccMakerName 
                })
                .OrderBy(a => a.AccMakerCode)
                .ToListAsync();
            return accMakerList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetAccModelListAsync(string accTypeCode = null, string accMakerCode = null)
        {
            var query = _context.AccModelList.AsQueryable();
            
            if (!string.IsNullOrEmpty(accTypeCode))
            {
                query = query.Where(a => a.AccTypeCode == accTypeCode);
            }
            
            if (!string.IsNullOrEmpty(accMakerCode))
            {
                query = query.Where(a => a.AccMakerCode == accMakerCode);
            }

            var accModelList = await query
                .Select(a => new { 
                    AccModelCode = a.AccModelCode, 
                    AccModelName = a.AccModelName, 
                    AccTypeCode = a.AccTypeCode,
                    AccMakerCode = a.AccMakerCode,
                    AccSize = a.AccSize 
                })
                .OrderBy(a => a.AccModelCode)
                .ToListAsync();
            return accModelList.Cast<object>().ToList();
        }

        // 마스터 데이터 CRUD 메서드들
        // Body 관련
        public async Task<bool> AddBodyValveAsync(string valveSeriesCode, string valveSeries)
        {
            try
            {
                // Primary Key 중복 검사
                var existing = await _context.BodyValveList
                    .FirstOrDefaultAsync(b => b.ValveSeriesCode == valveSeriesCode);
                if (existing != null)
                {
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
                var existing = await _context.BodyValveList
                    .FirstOrDefaultAsync(b => b.ValveSeriesCode == valveSeriesCode);
                if (existing == null)
                {
                    return false; // 존재하지 않는 코드
                }

                existing.ValveSeries = valveSeries;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteBodyValveAsync(string valveSeriesCode)
        {
            try
            {
                var existing = await _context.BodyValveList
                    .FirstOrDefaultAsync(b => b.ValveSeriesCode == valveSeriesCode);
                if (existing == null)
                {
                    return false; // 존재하지 않는 코드
                }

                // FK 제약조건 검사 (실제 사용 중인지 확인)
                var isUsed = await _context.EstimateRequest
                    .AnyAsync(er => er.ValveType == valveSeriesCode);
                if (isUsed)
                {
                    return false; // 사용 중인 항목은 삭제 불가
                }

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
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateBodyBonnetAsync(string bonnetCode, string bonnetType)
        {
            try
            {
                var existing = await _context.BodyBonnetList
                    .FirstOrDefaultAsync(b => b.BonnetCode == bonnetCode);
                if (existing == null)
                {
                    return false;
                }

                existing.BonnetType = bonnetType;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
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

        public async Task<bool> AddBodyMaterialAsync(string bodyMatCode, string bodyMat)
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

        public async Task<bool> UpdateBodyMaterialAsync(string bodyMatCode, string bodyMat)
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

        public async Task<bool> DeleteBodyMaterialAsync(string bodyMatCode)
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
                    .FirstOrDefaultAsync(b => b.SizeUnit == sizeUnit && b.BodySizeCode == bodySizeCode);
                if (existing != null)
                {
                    return false;
                }

                var newSize = new BodySizeList
                {
                    SizeUnit = sizeUnit,
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
                    .FirstOrDefaultAsync(b => b.SizeUnit == sizeUnit && b.BodySizeCode == bodySizeCode);
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
                    .FirstOrDefaultAsync(b => b.SizeUnit == sizeUnit && b.BodySizeCode == bodySizeCode);
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
                var existing = await _context.BodyRatingList
                    .FirstOrDefaultAsync(b => b.RatingCode == ratingCode);
                if (existing != null)
                {
                    return false;
                }

                var newRating = new BodyRatingList
                {
                    RatingCode = ratingCode,
                    RatingUnit = $"{rating} {unit}".Trim(),
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
                var existing = await _context.BodyRatingList
                    .FirstOrDefaultAsync(b => b.RatingCode == ratingCode);
                if (existing == null)
                {
                    return false;
                }

                existing.RatingUnit = $"{rating} {unit}".Trim();
                existing.RatingName = rating;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteBodyRatingAsync(string ratingCode)
        {
            try
            {
                var existing = await _context.BodyRatingList
                    .FirstOrDefaultAsync(b => b.RatingCode == ratingCode);
                if (existing == null)
                {
                    return false;
                }

                var isUsed = await _context.EstimateRequest
                    .AnyAsync(er => er.BodyRating == ratingCode);
                if (isUsed)
                {
                    return false;
                }

                _context.BodyRatingList.Remove(existing);
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

                var isUsed = await _context.DataSheetLv3
                    .AnyAsync(ds => ds.ActType == actTypeCode);
                if (isUsed)
                {
                    return false;
                }

                _context.ActTypeList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        // Acc 관련
        public async Task<bool> AddAccTypeAsync(string accTypeCode, string accType)
        {
            try
            {
                var existing = await _context.AccTypeList
                    .FirstOrDefaultAsync(a => a.AccTypeCode == accTypeCode);
                if (existing != null)
                {
                    return false;
                }

                var newAccType = new AccTypeList
                {
                    AccTypeCode = accTypeCode,
                    AccTypeName = accType
                };

                _context.AccTypeList.Add(newAccType);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateAccTypeAsync(string accTypeCode, string accType)
        {
            try
            {
                var existing = await _context.AccTypeList
                    .FirstOrDefaultAsync(a => a.AccTypeCode == accTypeCode);
                if (existing == null)
                {
                    return false;
                }

                existing.AccTypeName = accType;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteAccTypeAsync(string accTypeCode)
        {
            try
            {
                var existing = await _context.AccTypeList
                    .FirstOrDefaultAsync(a => a.AccTypeCode == accTypeCode);
                if (existing == null)
                {
                    return false;
                }

                var isUsed = await _context.DataSheetLv3
                    .AnyAsync(ds => ds.PosCode == accTypeCode || ds.SolCode == accTypeCode || ds.LimCode == accTypeCode || ds.ASCode == accTypeCode);
                if (isUsed)
                {
                    return false;
                }

                _context.AccTypeList.Remove(existing);
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
                var existing = await _context.TrimPortSizeList
                    .FirstOrDefaultAsync(t => t.PortSizeCode == portSizeCode);
                if (existing != null)
                {
                    return false;
                }

                var newTrimPortSize = new TrimPortSizeList
                {
                    PortSizeCode = portSizeCode,
                    PortSize = portSize,
                    PortSizeUnit = unit
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
                var existing = await _context.TrimPortSizeList
                    .FirstOrDefaultAsync(t => t.PortSizeCode == portSizeCode);
                if (existing == null)
                {
                    return false;
                }

                existing.PortSize = portSize;
                existing.PortSizeUnit = unit;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteTrimPortSizeAsync(string portSizeCode)
        {
            try
            {
                var existing = await _context.TrimPortSizeList
                    .FirstOrDefaultAsync(t => t.PortSizeCode == portSizeCode);
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

                var isUsed = await _context.DataSheetLv3
                    .AnyAsync(ds => ds.ActSeriesCode == actSeriesCode);
                if (isUsed)
                {
                    return false;
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

                var isUsed = await _context.DataSheetLv3
                    .AnyAsync(ds => ds.HW == hwCode);
                if (isUsed)
                {
                    return false;
                }

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
        public async Task<bool> AddAccMakerAsync(string makerCode, string maker, string accTypeCode)
        {
            try
            {
                var existing = await _context.AccMakerList
                    .FirstOrDefaultAsync(a => a.AccMakerCode == makerCode);
                if (existing != null)
                {
                    return false;
                }

                var newAccMaker = new AccMakerList
                {
                    AccMakerCode = makerCode,
                    AccMakerName = maker,
                    AccTypeCode = accTypeCode
                };

                _context.AccMakerList.Add(newAccMaker);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateAccMakerAsync(string makerCode, string maker, string accTypeCode)
        {
            try
            {
                var existing = await _context.AccMakerList
                    .FirstOrDefaultAsync(a => a.AccMakerCode == makerCode);
                if (existing == null)
                {
                    return false;
                }

                existing.AccMakerName = maker;
                existing.AccTypeCode = accTypeCode;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteAccMakerAsync(string makerCode)
        {
            try
            {
                var existing = await _context.AccMakerList
                    .FirstOrDefaultAsync(a => a.AccMakerCode == makerCode);
                if (existing == null)
                {
                    return false;
                }

                var isUsed = await _context.DataSheetLv3
                    .AnyAsync(ds => ds.PosCode == makerCode || ds.SolCode == makerCode || ds.LimCode == makerCode || ds.ASCode == makerCode);
                if (isUsed)
                {
                    return false;
                }

                _context.AccMakerList.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> AddAccModelAsync(string modelCode, string model, string accTypeCode, string accMakerCode)
        {
            try
            {
                var existing = await _context.AccModelList
                    .FirstOrDefaultAsync(a => a.AccModelCode == modelCode);
                if (existing != null)
                {
                    return false;
                }

                var newAccModel = new AccModelList
                {
                    AccModelCode = modelCode,
                    AccModelName = model,
                    AccTypeCode = accTypeCode,
                    AccMakerCode = accMakerCode
                };

                _context.AccModelList.Add(newAccModel);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateAccModelAsync(string modelCode, string model, string accTypeCode, string accMakerCode)
        {
            try
            {
                var existing = await _context.AccModelList
                    .FirstOrDefaultAsync(a => a.AccModelCode == modelCode);
                if (existing == null)
                {
                    return false;
                }

                existing.AccModelName = model;
                existing.AccTypeCode = accTypeCode;
                existing.AccMakerCode = accMakerCode;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteAccModelAsync(string modelCode)
        {
            try
            {
                var existing = await _context.AccModelList
                    .FirstOrDefaultAsync(a => a.AccModelCode == modelCode);
                if (existing == null)
                {
                    return false;
                }

                var isUsed = await _context.DataSheetLv3
                    .AnyAsync(ds => ds.PosCode == modelCode || ds.SolCode == modelCode || ds.LimCode == modelCode || ds.ASCode == modelCode);
                if (isUsed)
                {
                    return false;
                }

                _context.AccModelList.Remove(existing);
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
                    existingDataSheet.Connection = ConvertEmptyToNull(specification.Body.Connection);
                    existingDataSheet.BodySize = ConvertEmptyToNull(bodySizeCode);
                    
                    existingDataSheet.TrimType = ConvertEmptyToNull(trimTypeCode);
                    existingDataSheet.TrimSeries = ConvertEmptyToNull(specification.Trim.Series);
                    existingDataSheet.TrimPortSize = ConvertEmptyToNull(specification.Trim.PortSize);
                    existingDataSheet.TrimForm = ConvertEmptyToNull(specification.Trim.Form);
                    
                    existingDataSheet.ActType = ConvertEmptyToNull(actTypeCode);
                    existingDataSheet.ActSeriesCode = ConvertEmptyToNull(specification.Actuator.Series);
                    existingDataSheet.ActSize = ConvertEmptyToNull(actSizeCode);
                    existingDataSheet.HW = ConvertEmptyToNull(actHWCode);
                    
                    // 악세사리 필드들 업데이트
                    existingDataSheet.PosCode = ConvertEmptyToNull(specification.Accessories.PosCode);
                    existingDataSheet.PosAccTypeCode = ConvertEmptyToNull(specification.Accessories.PosAccTypeCode); // New
                    existingDataSheet.PosAccMakerCode = ConvertEmptyToNull(specification.Accessories.PosAccMakerCode); // New
                    existingDataSheet.SolCode = ConvertEmptyToNull(specification.Accessories.SolCode);
                    existingDataSheet.SolAccTypeCode = ConvertEmptyToNull(specification.Accessories.SolAccTypeCode); // New
                    existingDataSheet.SolAccMakerCode = ConvertEmptyToNull(specification.Accessories.SolAccMakerCode); // New
                    existingDataSheet.LimCode = ConvertEmptyToNull(specification.Accessories.LimCode);
                    existingDataSheet.LimAccTypeCode = ConvertEmptyToNull(specification.Accessories.LimAccTypeCode); // New
                    existingDataSheet.LimAccMakerCode = ConvertEmptyToNull(specification.Accessories.LimAccMakerCode); // New
                    existingDataSheet.ASCode = ConvertEmptyToNull(specification.Accessories.ASCode);
                    existingDataSheet.ASAccTypeCode = ConvertEmptyToNull(specification.Accessories.ASAccTypeCode); // New
                    existingDataSheet.ASAccMakerCode = ConvertEmptyToNull(specification.Accessories.ASAccMakerCode); // New
                    existingDataSheet.VolCode = ConvertEmptyToNull(specification.Accessories.VolCode);
                    existingDataSheet.VolAccTypeCode = ConvertEmptyToNull(specification.Accessories.VolAccTypeCode); // New
                    existingDataSheet.VolAccMakerCode = ConvertEmptyToNull(specification.Accessories.VolAccMakerCode); // New
                    existingDataSheet.AirOpCode = ConvertEmptyToNull(specification.Accessories.AirOpCode);
                    existingDataSheet.AirOpAccTypeCode = ConvertEmptyToNull(specification.Accessories.AirOpAccTypeCode); // New
                    existingDataSheet.AirOpAccMakerCode = ConvertEmptyToNull(specification.Accessories.AirOpAccMakerCode); // New
                    existingDataSheet.LockupCode = ConvertEmptyToNull(specification.Accessories.LockupCode);
                    existingDataSheet.LockupAccTypeCode = ConvertEmptyToNull(specification.Accessories.LockupAccTypeCode); // New
                    existingDataSheet.LockupAccMakerCode = ConvertEmptyToNull(specification.Accessories.LockupAccMakerCode); // New
                    existingDataSheet.SnapActCode = ConvertEmptyToNull(specification.Accessories.SnapActCode);
                    existingDataSheet.SnapActAccTypeCode = ConvertEmptyToNull(specification.Accessories.SnapActAccTypeCode); // New
                    existingDataSheet.SnapActAccMakerCode = ConvertEmptyToNull(specification.Accessories.SnapActAccMakerCode); // New
                    
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
                        Connection = ConvertEmptyToNull(specification.Body.Connection),
                        BodySize = ConvertEmptyToNull(bodySizeCode),
                        
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
                        PosAccTypeCode = ConvertEmptyToNull(specification.Accessories.PosAccTypeCode), // New
                        PosAccMakerCode = ConvertEmptyToNull(specification.Accessories.PosAccMakerCode), // New
                        SolCode = ConvertEmptyToNull(specification.Accessories.SolCode),
                        SolAccTypeCode = ConvertEmptyToNull(specification.Accessories.SolAccTypeCode), // New
                        SolAccMakerCode = ConvertEmptyToNull(specification.Accessories.SolAccMakerCode), // New
                        LimCode = ConvertEmptyToNull(specification.Accessories.LimCode),
                        LimAccTypeCode = ConvertEmptyToNull(specification.Accessories.LimAccTypeCode), // New
                        LimAccMakerCode = ConvertEmptyToNull(specification.Accessories.LimAccMakerCode), // New
                        ASCode = ConvertEmptyToNull(specification.Accessories.ASCode),
                        ASAccTypeCode = ConvertEmptyToNull(specification.Accessories.ASAccTypeCode), // New
                        ASAccMakerCode = ConvertEmptyToNull(specification.Accessories.ASAccMakerCode), // New
                        VolCode = ConvertEmptyToNull(specification.Accessories.VolCode),
                        VolAccTypeCode = ConvertEmptyToNull(specification.Accessories.VolAccTypeCode), // New
                        VolAccMakerCode = ConvertEmptyToNull(specification.Accessories.VolAccMakerCode), // New
                        AirOpCode = ConvertEmptyToNull(specification.Accessories.AirOpCode),
                        AirOpAccTypeCode = ConvertEmptyToNull(specification.Accessories.AirOpAccTypeCode), // New
                        AirOpAccMakerCode = ConvertEmptyToNull(specification.Accessories.AirOpAccMakerCode), // New
                        LockupCode = ConvertEmptyToNull(specification.Accessories.LockupCode),
                        LockupAccTypeCode = ConvertEmptyToNull(specification.Accessories.LockupAccTypeCode), // New
                        LockupAccMakerCode = ConvertEmptyToNull(specification.Accessories.LockupAccMakerCode), // New
                        SnapActCode = ConvertEmptyToNull(specification.Accessories.SnapActCode),
                        SnapActAccTypeCode = ConvertEmptyToNull(specification.Accessories.SnapActAccTypeCode), // New
                        SnapActAccMakerCode = ConvertEmptyToNull(specification.Accessories.SnapActAccMakerCode) // New
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
            var exists = await _context.BodySizeList.AnyAsync(bs => bs.SizeUnit == sizeUnit && bs.BodySizeCode == bodySizeCode);

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

        private async Task<string> GetTrimPortSizeNameAsync(string portSizeCode)
        {
            Console.WriteLine($"[GetTrimPortSizeNameAsync] 찾는 코드: '{portSizeCode}'");
            var portSize = await _context.TrimPortSizeList
                .FirstOrDefaultAsync(ps => ps.PortSizeCode == portSizeCode);
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
                var connection = dataSheet.Connection != null ? 
                    await GetBodyConnectionNameAsync(dataSheet.Connection) : "";
                var bodySize = dataSheet.BodySize != null ? 
                    await GetBodySizeNameAsync(dataSheet.BodySize) : "";
                var trimType = dataSheet.TrimType != null ? 
                    await GetTrimTypeNameAsync(dataSheet.TrimType) : "";
                var trimSeries = dataSheet.TrimSeries != null ? 
                    await GetTrimSeriesNameAsync(dataSheet.TrimSeries) : "";
                
                // Trim Port Size와 Unit 조회
                var trimPortSizeInfo = dataSheet.TrimPortSize != null ? await _context.TrimPortSizeList.FirstOrDefaultAsync(p => p.PortSizeCode == dataSheet.TrimPortSize) : null;
                var trimPortSize = trimPortSizeInfo?.PortSize ?? "";
                var trimPortSizeUnit = trimPortSizeInfo?.PortSizeUnit ?? "";

                // Rating Unit 조회
                var ratingInfo = dataSheet.Rating != null ? await _context.BodyRatingList.FirstOrDefaultAsync(r => r.RatingCode == dataSheet.Rating) : null;
                var ratingUnit = ratingInfo?.RatingUnit ?? "";

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
                    Positioner = await GetAccessoryDetailAsync(dataSheet.PosCode, dataSheet.PosAccTypeCode, dataSheet.PosAccMakerCode),
                    Solenoid = await GetAccessoryDetailAsync(dataSheet.SolCode, dataSheet.SolAccTypeCode, dataSheet.SolAccMakerCode),
                    Limiter = await GetAccessoryDetailAsync(dataSheet.LimCode, dataSheet.LimAccTypeCode, dataSheet.LimAccMakerCode),
                    AirSupply = await GetAccessoryDetailAsync(dataSheet.ASCode, dataSheet.ASAccTypeCode, dataSheet.ASAccMakerCode),
                    VolumeBooster = await GetAccessoryDetailAsync(dataSheet.VolCode, dataSheet.VolAccTypeCode, dataSheet.VolAccMakerCode),
                    AirOperator = await GetAccessoryDetailAsync(dataSheet.AirOpCode, dataSheet.AirOpAccTypeCode, dataSheet.AirOpAccMakerCode),
                    LockUp = await GetAccessoryDetailAsync(dataSheet.LockupCode, dataSheet.LockupAccTypeCode, dataSheet.LockupAccMakerCode),
                    SnapActingRelay = await GetAccessoryDetailAsync(dataSheet.SnapActCode, dataSheet.SnapActAccTypeCode, dataSheet.SnapActAccMakerCode)
                };

                return new SpecificationResponseDto
                {
                    SheetID = dataSheet.SheetID,
                    ValveId = dataSheet.ValveType,
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
                        SizeName = bodySize,
                        SizeUnit = dataSheet.BodySizeUnit ?? ""
                    },
                    Trim = new TrimSpecificationResponseDto
                    {
                        TypeCode = dataSheet.TrimType ?? "",
                        TypeName = trimType,
                        SeriesCode = dataSheet.TrimSeries ?? "",
                        SeriesName = trimSeries,
                        PortSizeCode = dataSheet.TrimPortSize ?? "",
                        PortSizeName = trimPortSize,
                        PortSizeUnit = trimPortSizeUnit,
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

        private async Task<AccessoryDetailDto?> GetAccessoryDetailAsync(string? modelCode, string? typeCode, string? makerCode)
        {
            // 모든 코드가 null인 경우에도 최소한의 TypeCode를 가진 객체 반환 (프론트엔드 드롭다운 필터링 위함)
            if (string.IsNullOrEmpty(modelCode) && string.IsNullOrEmpty(typeCode) && string.IsNullOrEmpty(makerCode))
            {
                // 이전에 loadInitialSpecification에 하드코딩된 TypeCode 매핑을 활용
                // 예: Positioner는 'A', Solenoid는 'B' 등. 이 매핑은 프론트엔드에서 담당하므로 여기서는 빈 문자열로 둠.
                // 백엔드는 단순히 TypeCode가 null이 아니면 DTO를 반환하도록만 처리하고, 실제 TypeCode 매핑은 프론트엔드에 맡김.
                return new AccessoryDetailDto { TypeCode = typeCode ?? "", MakerCode = makerCode ?? "", ModelCode = modelCode ?? "", Specification = "" };
            }
            
            var model = await _context.AccModelList
                                      .FirstOrDefaultAsync(m => m.AccModelCode == modelCode && m.AccTypeCode == typeCode && m.AccMakerCode == makerCode);

            if (model == null)
            {
                // 모델을 찾지 못했더라도 TypeCode, MakerCode, ModelCode는 반환
                return new AccessoryDetailDto { TypeCode = typeCode ?? "", MakerCode = makerCode ?? "", ModelCode = modelCode ?? "", Specification = "" };
            }

            // AccMakerList의 복합 키를 사용하여 메이커 정보 조회
            var maker = await _context.AccMakerList
                                      .FirstOrDefaultAsync(m => m.AccMakerCode == model.AccMakerCode && m.AccTypeCode == model.AccTypeCode);

            Console.WriteLine($"GetAccessoryDetailAsync: model.AccSize = {model.AccSize}");
            return new AccessoryDetailDto
            {
                TypeCode = model.AccTypeCode,
                ModelCode = model.AccModelCode,
                ModelName = model.AccModelName,
                MakerCode = model.AccMakerCode,
                MakerName = maker?.AccMakerName,
                Specification = model.AccSize // AccSize 값을 Specification에 할당
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
    }
} 