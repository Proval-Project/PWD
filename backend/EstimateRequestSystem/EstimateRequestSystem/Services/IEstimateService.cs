using EstimateRequestSystem.DTOs;

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
        Task<byte[]> DownloadAttachmentAsync(int attachmentID);

        // Utility methods
        Task<string> GenerateTempEstimateNoAsync();
        Task<int> GetNextSheetIDAsync(string tempEstimateNo);
        Task<bool> IsDuplicateFileNameAsync(string tempEstimateNo, string fileName);
    }
} 