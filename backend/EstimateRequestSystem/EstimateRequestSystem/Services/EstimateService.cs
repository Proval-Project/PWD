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
                    Project = er.Project,
                    UnitPrice = er.UnitPrice,
                    Tagno = er.Tagno,
                    Qty = er.Qty,
                    Medium = er.Medium,
                    Fluid = er.Fluid,
                    IsQM = er.IsQM,
                    FlowRateUnit = er.FlowRateUnit,
                    FlowRateMaxQ = er.FlowRateMaxQ,
                    FlowRateNorQ = er.FlowRateNorQ,
                    FlowRateMinQ = er.FlowRateMinQ,
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
                    BodySizeUnit = er.BodySizeUnit,
                    BodySize = er.BodySize,
                    BodyMat = er.BodyMat,
                    TrimMat = er.TrimMat,
                    TrimOption = er.TrimOption,
                    BodyRatingUnit = er.BodyRatingUnit,
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
                FlowRateUnit = dto.FlowRateUnit,
                FlowRateMaxQ = dto.FlowRateMaxQ,
                FlowRateNorQ = dto.FlowRateNorQ,
                FlowRateMinQ = dto.FlowRateMinQ,
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
                BodySizeUnit = dto.BodySizeUnit,
                BodySize = dto.BodySize,
                BodyMat = dto.BodyMat,
                TrimMat = dto.TrimMat,
                TrimOption = dto.TrimOption,
                BodyRatingUnit = dto.BodyRatingUnit,
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
                Project = estimateRequest.Project,
                UnitPrice = estimateRequest.UnitPrice,
                Tagno = estimateRequest.Tagno,
                Qty = estimateRequest.Qty,
                Medium = estimateRequest.Medium,
                Fluid = estimateRequest.Fluid,
                IsQM = estimateRequest.IsQM,
                FlowRateUnit = estimateRequest.FlowRateUnit,
                FlowRateMaxQ = estimateRequest.FlowRateMaxQ,
                FlowRateNorQ = estimateRequest.FlowRateNorQ,
                FlowRateMinQ = estimateRequest.FlowRateMinQ,
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
                BodySizeUnit = estimateRequest.BodySizeUnit,
                BodySize = estimateRequest.BodySize,
                BodyMat = estimateRequest.BodyMat,
                TrimMat = estimateRequest.TrimMat,
                TrimOption = estimateRequest.TrimOption,
                BodyRatingUnit = estimateRequest.BodyRatingUnit,
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
                Project = estimateRequest.Project,
                UnitPrice = estimateRequest.UnitPrice,
                Tagno = estimateRequest.Tagno,
                Qty = estimateRequest.Qty,
                Medium = estimateRequest.Medium,
                Fluid = estimateRequest.Fluid,
                IsQM = estimateRequest.IsQM,
                FlowRateUnit = estimateRequest.FlowRateUnit,
                FlowRateMaxQ = estimateRequest.FlowRateMaxQ,
                FlowRateNorQ = estimateRequest.FlowRateNorQ,
                FlowRateMinQ = estimateRequest.FlowRateMinQ,
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
                BodySizeUnit = estimateRequest.BodySizeUnit,
                BodySize = estimateRequest.BodySize,
                BodyMat = estimateRequest.BodyMat,
                TrimMat = estimateRequest.TrimMat,
                TrimOption = estimateRequest.TrimOption,
                BodyRatingUnit = estimateRequest.BodyRatingUnit,
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
            estimateRequest.FlowRateUnit = dto.FlowRateUnit;
            estimateRequest.FlowRateMaxQ = dto.FlowRateMaxQ;
            estimateRequest.FlowRateNorQ = dto.FlowRateNorQ;
            estimateRequest.FlowRateMinQ = dto.FlowRateMinQ;
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
            estimateRequest.BodySizeUnit = dto.BodySizeUnit;
            estimateRequest.BodySize = dto.BodySize;
            estimateRequest.BodyMat = dto.BodyMat;
            estimateRequest.TrimMat = dto.TrimMat;
            estimateRequest.TrimOption = dto.TrimOption;
            estimateRequest.BodyRatingUnit = dto.BodyRatingUnit;
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

        // Attachment operations
        public async Task<EstimateAttachmentResponseDto> UploadAttachmentAsync(string tempEstimateNo, IFormFile file, string uploadUserID)
        {
            // 중복 파일명 체크
            if (await IsDuplicateFileNameAsync(tempEstimateNo, file.FileName))
            {
                throw new InvalidOperationException("같은 파일명이 이미 존재합니다.");
            }

            var uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads", tempEstimateNo);
            Directory.CreateDirectory(uploadsFolder);

            var fileName = Path.GetFileName(file.FileName);
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var attachment = new EstimateAttachment
            {
                TempEstimateNo = tempEstimateNo,
                FileName = fileName,
                FilePath = filePath,
                FileSize = (int)file.Length,
                UploadUserID = uploadUserID
            };

            _context.EstimateAttachment.Add(attachment);
            await _context.SaveChangesAsync();

            return new EstimateAttachmentResponseDto
            {
                AttachmentID = attachment.AttachmentID,
                TempEstimateNo = attachment.TempEstimateNo,
                FileName = attachment.FileName,
                FilePath = attachment.FilePath,
                FileSize = attachment.FileSize,
                UploadDate = attachment.UploadDate,
                UploadUserID = attachment.UploadUserID
            };
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
            var today = DateTime.Now.ToString("yyyyMMdd");
            var count = await _context.EstimateSheetLv1
                .Where(es => es.TempEstimateNo.StartsWith($"TEMP{today}"))
                .CountAsync();

            return $"TEMP{today}-{(count + 1):D3}";
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
    }
} 