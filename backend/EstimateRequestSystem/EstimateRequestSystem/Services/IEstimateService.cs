using EstimateRequestSystem.DTOs;
using EstimateRequestSystem.Models;

namespace EstimateRequestSystem.Services
{
    public interface IEstimateService
    {
        // EstimateSheet operations
        Task<string> CreateEstimateSheetAsync(CreateEstimateSheetDto dto);
        Task<EstimateSheetResponseDto?> GetEstimateSheetAsync(string tempEstimateNo);
        Task<List<EstimateSheetListResponseDto>> GetEstimateSheetsByStatusAsync(int status);
        Task<List<EstimateSheetListResponseDto>> GetEstimateSheetsByUserAsync(string userID);
        Task<bool> UpdateEstimateSheetAsync(string tempEstimateNo, UpdateEstimateSheetDto dto);
        Task<bool> DeleteEstimateSheetAsync(string tempEstimateNo);

        // 임시저장 및 견적요청
        Task<bool> SaveDraftAsync(string tempEstimateNo, SaveDraftDto dto);
        Task<bool> SubmitEstimateAsync(string tempEstimateNo, SubmitEstimateDto dto);

        // EstimateRequest operations
        Task<EstimateRequestResponseDto> CreateEstimateRequestAsync(string tempEstimateNo, CreateEstimateRequestDto dto);
        Task<EstimateRequestResponseDto?> GetEstimateRequestAsync(string tempEstimateNo, int sheetID);
        Task<List<EstimateRequestListResponseDto>> GetEstimateRequestsAsync(string tempEstimateNo);
        Task<bool> UpdateEstimateRequestAsync(string tempEstimateNo, int sheetID, CreateEstimateRequestDto dto);
        Task<bool> DeleteEstimateRequestAsync(string tempEstimateNo, int sheetID);
        Task<bool> UpdateEstimateRequestOrderAsync(string tempEstimateNo, List<int> sheetIDs);

        // Attachment operations
        Task<EstimateAttachmentResponseDto> UploadAttachmentAsync(string tempEstimateNo, IFormFile file, string uploadUserID);
        Task<List<EstimateAttachmentResponseDto>> GetAttachmentsAsync(string tempEstimateNo);
        Task<bool> DeleteAttachmentAsync(int attachmentID);
        Task<bool> DeleteFileByPathAsync(string filePath);
        Task<byte[]> DownloadAttachmentAsync(int attachmentID);

        // Utility methods
        Task<string> GenerateTempEstimateNoAsync();
        Task<int> GetNextSheetIDAsync(string tempEstimateNo);
        Task<bool> IsDuplicateFileNameAsync(string tempEstimateNo, string fileName);
        Task<List<object>> GetBodyValveListAsync();
        Task<List<object>> GetBodySizeListAsync();
        Task<List<object>> GetBodyMatListAsync();
        Task<List<object>> GetTrimMatListAsync();
        Task<List<object>> GetTrimOptionListAsync();
        Task<List<object>> GetBodyRatingListAsync();

        // 견적 요청 조회
        Task<EstimateInquiryResponseDto> GetEstimateInquiryAsync(EstimateInquiryRequestDto request);

        // 견적 상태 업데이트
        Task<bool> UpdateEstimateStatusAsync(string tempEstimateNo, EstimateStatus status);

        // 담당자 지정
        Task<bool> AssignManagerAsync(string tempEstimateNo, string managerID);

        // 임시저장 목록 조회
        Task<EstimateInquiryResponseDto> GetDraftEstimatesAsync(EstimateInquiryRequestDto request, string currentUserId, string? customerId = null);

        // 견적 상세 조회
        Task<EstimateDetailResponseDto?> GetEstimateDetailAsync(string tempEstimateNo, string currentUserId);
    }
} 