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

            // 2. 기존 EstimateRequest 데이터 삭제
            var existingRequests = await _context.EstimateRequest
                .Where(er => er.TempEstimateNo == tempEstimateNo)
                .ToListAsync();
            _context.EstimateRequest.RemoveRange(existingRequests);

            // 3. 기존 DataSheetLv3 데이터 삭제
            var existingDataSheets = await _context.DataSheetLv3
                .Where(ds => ds.TempEstimateNo == tempEstimateNo)
                .ToListAsync();
            _context.DataSheetLv3.RemoveRange(existingDataSheets);

            // 새로운 데이터 삽입
            int sheetID = 1;
            foreach (var typeSelection in dto.TypeSelections)
            {
                foreach (var valveSelection in typeSelection.Valves)
                {
                    foreach (var tagNo in valveSelection.TagNos)
                    {
                        var estimateRequest = new EstimateRequest
                        {
                            TempEstimateNo = tempEstimateNo,
                            SheetID = sheetID,
                            SheetNo = tagNo.SheetNo,
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
                            InletPressureUnit = tagNo.InletPressureUnit,
                            InletPressureMaxQ = tagNo.InletPressureMaxQ,
                            InletPressureNorQ = tagNo.InletPressureNorQ,
                            InletPressureMinQ = tagNo.InletPressureMinQ,
                            OutletPressureUnit = tagNo.OutletPressureUnit,
                            OutletPressureMaxQ = tagNo.OutletPressureMaxQ,
                            OutletPressureNorQ = tagNo.OutletPressureNorQ,
                            OutletPressureMinQ = tagNo.OutletPressureMinQ,
                            DifferentialPressureUnit = tagNo.DifferentialPressureUnit,
                            DifferentialPressureMaxQ = tagNo.DifferentialPressureMaxQ,
                            DifferentialPressureNorQ = tagNo.DifferentialPressureNorQ,
                            DifferentialPressureMinQ = tagNo.DifferentialPressureMinQ,
                            InletTemperatureUnit = tagNo.InletTemperatureUnit,
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
                            BodyRating = string.IsNullOrEmpty(tagNo.BodyRating) ? null : tagNo.BodyRating,
                            ActType = string.IsNullOrEmpty(tagNo.ActType) ? null : tagNo.ActType,
                            IsHW = tagNo.IsHW,
                            IsPositioner = tagNo.IsPositioner,
                            PositionerType = tagNo.PositionerType,
                            ExplosionProof = tagNo.ExplosionProof,
                            IsTransmitter = tagNo.IsTransmitter,
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
                            SheetID = sheetID,
                            Medium = tagNo.Medium,
                            Fluid = tagNo.Fluid,
                            IsQM = tagNo.IsQM,
                            IsP2 = tagNo.IsP2,
                            QMUnit = tagNo.QMUnit,
                            QMMax = tagNo.QMMax,
                            QMNor = tagNo.QMNor,
                            QMMin = tagNo.QMMin,
                            QNUnit = tagNo.QNUnit,
                            QNMax = tagNo.QNMax,
                            QNNor = tagNo.QNNor,
                            QNMin = tagNo.QNMin,
                            PressureUnit = tagNo.InletPressureUnit,
                            InletPressureMaxQ = tagNo.InletPressureMaxQ,
                            InletPressureNorQ = tagNo.InletPressureNorQ,
                            InletPressureMinQ = tagNo.InletPressureMinQ,
                            OutletPressureMaxQ = tagNo.OutletPressureMaxQ,
                            OutletPressureNorQ = tagNo.OutletPressureNorQ,
                            OutletPressureMinQ = tagNo.OutletPressureMinQ,
                            DifferentialPressureMaxQ = tagNo.DifferentialPressureMaxQ,
                            DifferentialPressureNorQ = tagNo.DifferentialPressureNorQ,
                            DifferentialPressureMinQ = tagNo.DifferentialPressureMinQ,
                            InletTemperatureUnit = tagNo.InletTemperatureUnit,
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
                        };

                        _context.DataSheetLv3.Add(dataSheetLv3);
                        sheetID++;
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

            // 2. 기존 EstimateRequest 데이터 삭제
            var existingRequests = await _context.EstimateRequest
                .Where(er => er.TempEstimateNo == tempEstimateNo)
                .ToListAsync();
            _context.EstimateRequest.RemoveRange(existingRequests);

            // 3. 기존 DataSheetLv3 데이터 삭제
            var existingDataSheets = await _context.DataSheetLv3
                .Where(ds => ds.TempEstimateNo == tempEstimateNo)
                .ToListAsync();
            _context.DataSheetLv3.RemoveRange(existingDataSheets);

            // 새로운 데이터 삽입 (SaveDraft와 동일한 로직)
            int sheetID = 1;
            foreach (var typeSelection in dto.TypeSelections)
            {
                foreach (var valveSelection in typeSelection.Valves)
                {
                    foreach (var tagNo in valveSelection.TagNos)
                    {
                        var estimateRequest = new EstimateRequest
                        {
                            TempEstimateNo = tempEstimateNo,
                            SheetID = sheetID++,
                            SheetNo = tagNo.SheetNo,
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
                            InletPressureUnit = tagNo.InletPressureUnit,
                            InletPressureMaxQ = tagNo.InletPressureMaxQ,
                            InletPressureNorQ = tagNo.InletPressureNorQ,
                            InletPressureMinQ = tagNo.InletPressureMinQ,
                            OutletPressureUnit = tagNo.OutletPressureUnit,
                            OutletPressureMaxQ = tagNo.OutletPressureMaxQ,
                            OutletPressureNorQ = tagNo.OutletPressureNorQ,
                            OutletPressureMinQ = tagNo.OutletPressureMinQ,
                            DifferentialPressureUnit = tagNo.DifferentialPressureUnit,
                            DifferentialPressureMaxQ = tagNo.DifferentialPressureMaxQ,
                            DifferentialPressureNorQ = tagNo.DifferentialPressureNorQ,
                            DifferentialPressureMinQ = tagNo.DifferentialPressureMinQ,
                            InletTemperatureUnit = tagNo.InletTemperatureUnit,
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
                            TrimMat = tagNo.TrimMat,
                            TrimOption = tagNo.TrimOption,
                            BodyRating = tagNo.BodyRating,
                            ActType = tagNo.ActType,
                            IsHW = tagNo.IsHW,
                            IsPositioner = tagNo.IsPositioner,
                            PositionerType = tagNo.PositionerType,
                            ExplosionProof = tagNo.ExplosionProof,
                            IsTransmitter = tagNo.IsTransmitter,
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
                            SheetID = sheetID,
                            Medium = tagNo.Medium,
                            Fluid = tagNo.Fluid,
                            IsQM = tagNo.IsQM,
                            IsP2 = tagNo.IsP2,
                            QMUnit = tagNo.QMUnit,
                            QMMax = tagNo.QMMax,
                            QMNor = tagNo.QMNor,
                            QMMin = tagNo.QMMin,
                            QNUnit = tagNo.QNUnit,
                            QNMax = tagNo.QNMax,
                            QNNor = tagNo.QNNor,
                            QNMin = tagNo.QNMin,
                            PressureUnit = tagNo.InletPressureUnit,
                            InletPressureMaxQ = tagNo.InletPressureMaxQ,
                            InletPressureNorQ = tagNo.InletPressureNorQ,
                            InletPressureMinQ = tagNo.InletPressureMinQ,
                            OutletPressureMaxQ = tagNo.OutletPressureMaxQ,
                            OutletPressureNorQ = tagNo.OutletPressureNorQ,
                            OutletPressureMinQ = tagNo.OutletPressureMinQ,
                            DifferentialPressureMaxQ = tagNo.DifferentialPressureMaxQ,
                            DifferentialPressureNorQ = tagNo.DifferentialPressureNorQ,
                            DifferentialPressureMinQ = tagNo.DifferentialPressureMinQ,
                            InletTemperatureUnit = tagNo.InletTemperatureUnit,
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
                            ActType = string.IsNullOrEmpty(tagNo.ActType) ? null : tagNo.ActType,
                            HW = tagNo.IsHW == true ? "Y" : "N"
                        };

                        _context.DataSheetLv3.Add(dataSheetLv3);
                        sheetID++;
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
                    InletPressureUnit = er.InletPressureUnit,
                    InletPressureMaxQ = er.InletPressureMaxQ,
                    InletPressureNorQ = er.InletPressureNorQ,
                    InletPressureMinQ = er.InletPressureMinQ,
                    OutletPressureUnit = er.OutletPressureUnit,
                    OutletPressureMaxQ = er.OutletPressureMaxQ,
                    OutletPressureNorQ = er.OutletPressureNorQ,
                    OutletPressureMinQ = er.OutletPressureMinQ,
                    DifferentialPressureUnit = er.DifferentialPressureUnit,
                    DifferentialPressureMaxQ = er.DifferentialPressureMaxQ,
                    DifferentialPressureNorQ = er.DifferentialPressureNorQ,
                    DifferentialPressureMinQ = er.DifferentialPressureMinQ,
                    InletTemperatureUnit = er.InletTemperatureUnit,
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
                    PositionerType = er.PositionerType,
                    ExplosionProof = er.ExplosionProof,
                    IsTransmitter = er.IsTransmitter,
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
                InletPressureUnit = dto.InletPressureUnit,
                InletPressureMaxQ = dto.InletPressureMaxQ,
                InletPressureNorQ = dto.InletPressureNorQ,
                InletPressureMinQ = dto.InletPressureMinQ,
                OutletPressureUnit = dto.OutletPressureUnit,
                OutletPressureMaxQ = dto.OutletPressureMaxQ,
                OutletPressureNorQ = dto.OutletPressureNorQ,
                OutletPressureMinQ = dto.OutletPressureMinQ,
                DifferentialPressureUnit = dto.DifferentialPressureUnit,
                DifferentialPressureMaxQ = dto.DifferentialPressureMaxQ,
                DifferentialPressureNorQ = dto.DifferentialPressureNorQ,
                DifferentialPressureMinQ = dto.DifferentialPressureMinQ,
                InletTemperatureUnit = dto.InletTemperatureUnit,
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
                IsTransmitter = dto.IsTransmitter,
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
                InletPressureUnit = estimateRequest.InletPressureUnit,
                InletPressureMaxQ = estimateRequest.InletPressureMaxQ,
                InletPressureNorQ = estimateRequest.InletPressureNorQ,
                InletPressureMinQ = estimateRequest.InletPressureMinQ,
                OutletPressureUnit = estimateRequest.OutletPressureUnit,
                OutletPressureMaxQ = estimateRequest.OutletPressureMaxQ,
                OutletPressureNorQ = estimateRequest.OutletPressureNorQ,
                OutletPressureMinQ = estimateRequest.OutletPressureMinQ,
                DifferentialPressureUnit = estimateRequest.DifferentialPressureUnit,
                DifferentialPressureMaxQ = estimateRequest.DifferentialPressureMaxQ,
                DifferentialPressureNorQ = estimateRequest.DifferentialPressureNorQ,
                DifferentialPressureMinQ = estimateRequest.DifferentialPressureMinQ,
                InletTemperatureUnit = estimateRequest.InletTemperatureUnit,
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
                IsTransmitter = estimateRequest.IsTransmitter,
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
                InletPressureUnit = estimateRequest.InletPressureUnit,
                InletPressureMaxQ = estimateRequest.InletPressureMaxQ,
                InletPressureNorQ = estimateRequest.InletPressureNorQ,
                InletPressureMinQ = estimateRequest.InletPressureMinQ,
                OutletPressureUnit = estimateRequest.OutletPressureUnit,
                OutletPressureMaxQ = estimateRequest.OutletPressureMaxQ,
                OutletPressureNorQ = estimateRequest.OutletPressureNorQ,
                OutletPressureMinQ = estimateRequest.OutletPressureMinQ,
                DifferentialPressureUnit = estimateRequest.DifferentialPressureUnit,
                DifferentialPressureMaxQ = estimateRequest.DifferentialPressureMaxQ,
                DifferentialPressureNorQ = estimateRequest.DifferentialPressureNorQ,
                DifferentialPressureMinQ = estimateRequest.DifferentialPressureMinQ,
                InletTemperatureUnit = estimateRequest.InletTemperatureUnit,
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
                IsTransmitter = estimateRequest.IsTransmitter,
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
            estimateRequest.InletPressureUnit = dto.InletPressureUnit;
            estimateRequest.InletPressureMaxQ = dto.InletPressureMaxQ;
            estimateRequest.InletPressureNorQ = dto.InletPressureNorQ;
            estimateRequest.InletPressureMinQ = dto.InletPressureMinQ;
            estimateRequest.OutletPressureUnit = dto.OutletPressureUnit;
            estimateRequest.OutletPressureMaxQ = dto.OutletPressureMaxQ;
            estimateRequest.OutletPressureNorQ = dto.OutletPressureNorQ;
            estimateRequest.OutletPressureMinQ = dto.OutletPressureMinQ;
            estimateRequest.DifferentialPressureUnit = dto.DifferentialPressureUnit;
            estimateRequest.DifferentialPressureMaxQ = dto.DifferentialPressureMaxQ;
            estimateRequest.DifferentialPressureNorQ = dto.DifferentialPressureNorQ;
            estimateRequest.DifferentialPressureMinQ = dto.DifferentialPressureMinQ;
            estimateRequest.InletTemperatureUnit = dto.InletTemperatureUnit;
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
            estimateRequest.IsTransmitter = dto.IsTransmitter;
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
            string tempEstimateNo;
            bool isDuplicate;
            
            do
            {
                var today = DateTime.Now.ToString("yyyyMMdd");
                
                // 오늘 날짜의 기존 TempEstimateNo 개수 확인
                var todayCount = await _context.EstimateSheetLv1
                    .CountAsync(es => es.TempEstimateNo.StartsWith($"TEMP{today}-"));
                
                // 다음 번호 생성 (001부터 시작)
                var nextNumber = todayCount + 1;
                tempEstimateNo = $"TEMP{today}-{nextNumber:D3}";
                
                // 중복 체크
                isDuplicate = await _context.EstimateSheetLv1
                    .AnyAsync(es => es.TempEstimateNo == tempEstimateNo);
                    
            } while (isDuplicate);

            // EstimateSheetLv1 레코드 생성
            var estimateSheet = new EstimateSheetLv1
            {
                TempEstimateNo = tempEstimateNo,
                CustomerID = null, // 저장 시점에 결정
                WriterID = null, // 저장 시점에 결정
                ManagerID = null, // NULL 허용
                CurEstimateNo = null, // NULL 허용
                PrevEstimateNo = null, // NULL 허용
                Status = 1, // 임시저장 상태
                Project = "",
                CustomerRequirement = ""
            };

            _context.EstimateSheetLv1.Add(estimateSheet);

            // DataSheetLv3 기본 레코드 생성 (SheetID = 1)
            var dataSheetLv3 = new DataSheetLv3
            {
                TempEstimateNo = tempEstimateNo,
                SheetID = 1,
                Medium = "",
                Fluid = "",
                IsQM = false,
                IsP2 = false,
                IsDensity = false,
                IsN1 = false,
                QMUnit = "m³/h",
                QMMax = 0,
                QMNor = 0,
                QMMin = 0,
                QNUnit = "m³/h",
                QNMax = 0,
                QNNor = 0,
                QNMin = 0,
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
                InletTemperatureUnit = "°C",
                InletTemperatureQ = 0,
                InletTemperatureNorQ = 0,
                InletTemperatureMinQ = 0,
                DensityUnit = "kg/m³",
                Density = 0,
                MolecularWeightUnit = "g/mol",
                MolecularWeight = 0,
                CalculatedCvUnit = "",
                CalculatedCvMaxQ = 0,
                CalculatedCvNorQ = 0,
                CalculatedCvMinQ = 0,
                SS100Max = 0,
                SS100Nor = 0,
                SS100Min = 0,
                U1Unit = "",
                U1Max = 0,
                U1Nor = 0,
                U1Min = 0,
                U2Max = 0,
                U2Nor = 0,
                U2Min = 0,
                LpAeMax = 0,
                LpAeNor = 0,
                LpAeMin = 0,
                WarningStateMax = "",
                WarningStateNor = "",
                WarningStateMin = "",
                WarningTypeMax = "",
                WarningTypeNor = "",
                WarningTypeMin = "",
                FluidPUnit = "",
                FluidP1Max = 0,
                FluidP1Nor = 0,
                FluidP1Min = 0,
                FluidP2Max = 0,
                FluidP2Nor = 0,
                FluidP2Min = 0,
                FluidN1Max = 0,
                FluidN1Nor = 0,
                FluidN1Min = 0,
                FluidN1Unit = "",
                FluidV1Max = 0,
                Fluidv1Nor = 0,
                FluidV1Min = 0,
                FluidV1Unit = "",
                FluidPV1Max = 0,
                FluidPV1Nor = 0,
                FluidPV1Min = 0,
                FluidPV1Unit = "",
                FluidTV1Max = 0,
                FluidTV1Nor = 0,
                FluidTV1Min = 0,
                FluidTV1Unit = "",
                FluidCF1Max = 0,
                FluidCF1Nor = 0,
                FluidCF1Min = 0,
                FluidCF1Unit = "",
                ValveType = null, // NULL 허용
                FlowDirection = "",
                ValvePerformClass = "",
                Protection = "",
                BasicCharacter = "",
                TheoreticalRangeability = 0,
                FlowCoeffUnit = "",
                FlowCoeff = 0,
                NorFlowCoeff = 0,
                SizePressureClass = "",
                SuggestedValveSize = 0,
                SelectedValveSize = "",
                PressureClass = "",
                BonnetType = null, // NULL 허용
                BodyMat = null, // NULL 허용

                BodySize = null, // NULL 허용
                Rating = null, // NULL 허용
                Connection = null, // NULL 허용
                TrimType = null, // NULL 허용
                TrimSeries = null, // NULL 허용
                TrimMat = null, // NULL 허용
                TrimOption = null, // NULL 허용
                TrimPortSize = null, // NULL 허용
                TrimForm = null, // NULL 허용
                ActType = null, // NULL 허용
                ActSeriesCode = null, // NULL 허용
                ActSize = null, // NULL 허용
                HW = null, // NULL 허용
                PosCode = null, // NULL 허용
                SolCode = null, // NULL 허용
                LimCode = null, // NULL 허용
                ASCode = null, // NULL 허용
                VolCode = null, // NULL 허용
                AirOpCode = null, // NULL 허용
                LockupCode = null, // NULL 허용
                SnapActCode = null // NULL 허용
            };

            _context.DataSheetLv3.Add(dataSheetLv3);
            await _context.SaveChangesAsync();

            return tempEstimateNo;
        }

        public async Task<int> GetNextSheetIDAsync(string tempEstimateNo)
        {
            var maxSheetID = await _context.EstimateRequest
                .Where(er => er.TempEstimateNo == tempEstimateNo)
                .MaxAsync(er => (int?)er.SheetID) ?? 0;

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
            var trimMatList = await _context.TrimMatList
                .Select(t => new { t.TrimMat, t.TrimMatCode })
                .ToListAsync();
            return trimMatList.Cast<object>().ToList();
        }

        public async Task<List<object>> GetTrimOptionListAsync()
        {
            var optionList = await _context.TrimOptionList
                .Select(o => new { o.TrimOptionCode, o.TrimOptionName })
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

        // 견적 요청 조회 (검색, 필터링, 페이징)
        public async Task<EstimateInquiryResponseDto> GetEstimateInquiryAsync(EstimateInquiryRequestDto request)
        {
            // 먼저 기본 데이터를 가져온 후 메모리에서 처리
            var baseQuery = from sheet in _context.EstimateSheetLv1
                           join customer in _context.User on sheet.CustomerID equals customer.UserID into customerGroup
                           from c in customerGroup.DefaultIfEmpty()
                           join manager in _context.User on sheet.ManagerID equals manager.UserID into managerGroup
                           from m in managerGroup.DefaultIfEmpty()
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
                    ContactPerson = x.ManagerName ?? "미지정", // 담당자는 ManagerName으로 설정
                    RequestDate = x.RequestDate,
                    Quantity = x.EstimateRequestCount,
                    Status = x.Status,
                    StatusText = GetStatusText(x.Status),
                    Project = x.Project ?? "",
                    TempEstimateNo = x.TempEstimateNo
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
    }
} 