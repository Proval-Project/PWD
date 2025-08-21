using EstimateRequestSystem.DTOs;
using EstimateRequestSystem.Models;

namespace EstimateRequestSystem.Services
{
    public interface IEstimateService
    {
        // EstimateSheet operations
        Task<string> CreateEstimateSheetAsync(CreateEstimateSheetDto dto, string currentUserId);
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
        Task<EstimateAttachmentResponseDto> UploadAttachmentAsync(string tempEstimateNo, IFormFile file, string uploadUserID, string fileType, string managerFileType = "");
        Task<List<EstimateAttachmentResponseDto>> GetAttachmentsAsync(string tempEstimateNo);
        Task<bool> DeleteAttachmentAsync(int attachmentID);
        Task<bool> DeleteFileByPathAsync(string filePath);
        Task<byte[]> DownloadAttachmentAsync(int attachmentID);

        // Utility methods
        Task<string> GenerateTempEstimateNoAsync();
        Task<int> GetNextSheetIDAsync(string tempEstimateNo);
        Task<bool> IsDuplicateFileNameAsync(string tempEstimateNo, string fileName);
        Task<List<object>> GetBodyValveListAsync();
        Task<List<BodySizeListDto>> GetBodySizeListAsync();
        Task<List<object>> GetBodyMatListAsync();
        Task<List<object>> GetTrimMatListAsync();
        Task<List<object>> GetTrimOptionListAsync();
        Task<List<object>> GetBodyRatingListAsync(string? ratingUnitCode = null);
        Task<List<string>> GetBodySizeUnitsAsync();
        Task<List<object>> GetBodyRatingUnitsAsync();

        // Step 3 마스터 데이터 메서드들
        Task<List<object>> GetBodyBonnetListAsync();
        Task<List<object>> GetBodyConnectionListAsync();
        Task<List<object>> GetTrimTypeListAsync();
        Task<List<object>> GetTrimSeriesListAsync();
        Task<List<TrimPortSizeListDto>> GetTrimPortSizeListAsync();
        Task<List<object>> GetTrimFormListAsync();
        Task<List<object>> GetActTypeListAsync();
        Task<List<object>> GetActSeriesListAsync();
        Task<List<object>> GetActSizeListAsync(string? actSeriesCode = null);
        Task<List<object>> GetActHWListAsync();
        Task<List<object>> GetAccMakerListAsync(string? accTypeCode = null);
        Task<List<object>> GetAccModelListAsync(string? accTypeCode = null, string? accMakerCode = null);

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

        // 견적 완료/주문 확정
        Task<string?> CompleteEstimateAsync(string tempEstimateNo);
        Task<bool> CancelCompletionAsync(string tempEstimateNo);
        Task<bool> ConfirmOrderAsync(string tempEstimateNo);

        // 파일 생성 메서드들
        Task<string> GenerateCVListAsync(string tempEstimateNo);
        Task<string> GenerateVLListAsync(string tempEstimateNo);
        Task<string> GenerateDataSheetAsync(string tempEstimateNo);
        Task<string> GenerateSingleQuoteAsync(string tempEstimateNo);
        Task<string> GenerateMultiQuoteAsync(string tempEstimateNo);

        // 마스터 데이터 CRUD 메서드들
        // Body 관련
        Task<bool> AddBodyValveAsync(string valveSeriesCode, string valveSeries);
        Task<bool> UpdateBodyValveAsync(string valveSeriesCode, string valveSeries);
        Task<bool> DeleteBodyValveAsync(string valveSeriesCode);
        
        Task<bool> AddBodyBonnetAsync(string bonnetCode, string bonnetType);
        Task<bool> UpdateBodyBonnetAsync(string bonnetCode, string bonnetType);
        Task<bool> DeleteBodyBonnetAsync(string bonnetCode);
        
        Task<bool> AddBodyMatAsync(string bodyMatCode, string bodyMat);
        Task<bool> UpdateBodyMatAsync(string bodyMatCode, string bodyMat);
        Task<bool> DeleteBodyMatAsync(string bodyMatCode);
        
        Task<bool> AddBodySizeAsync(string sizeUnit, string bodySizeCode, string bodySize);
        Task<bool> UpdateBodySizeAsync(string sizeUnit, string bodySizeCode, string bodySize);
        Task<bool> DeleteBodySizeAsync(string sizeUnit, string bodySizeCode);
        
        Task<bool> AddBodyRatingAsync(string ratingCode, string rating, string unit);
        Task<bool> UpdateBodyRatingAsync(string ratingCode, string rating, string unit);
        Task<bool> DeleteBodyRatingAsync(string ratingCode, string unit);
        
        Task<bool> AddBodyRatingUnitAsync(string ratingUnitCode, string ratingUnit);
        Task<bool> UpdateBodyRatingUnitAsync(string ratingUnitCode, string ratingUnit);
        Task<bool> DeleteBodyRatingUnitAsync(string ratingUnitCode);
        
        Task<bool> AddBodyConnectionAsync(string connectionCode, string connection);
        Task<bool> UpdateBodyConnectionAsync(string connectionCode, string connection);
        Task<bool> DeleteBodyConnectionAsync(string connectionCode);

        // Trim 관련
        Task<bool> AddTrimTypeAsync(string trimTypeCode, string trimType);
        Task<bool> UpdateTrimTypeAsync(string trimTypeCode, string trimType);
        Task<bool> DeleteTrimTypeAsync(string trimTypeCode);

        // Act 관련
        Task<bool> AddActTypeAsync(string actTypeCode, string actType);
        Task<bool> UpdateActTypeAsync(string actTypeCode, string actType);
        Task<bool> DeleteActTypeAsync(string actTypeCode);

        

        // Trim 관련 추가 메서드들
        Task<bool> AddTrimSeriesAsync(string trimSeriesCode, string trimSeries);
        Task<bool> UpdateTrimSeriesAsync(string trimSeriesCode, string trimSeries);
        Task<bool> DeleteTrimSeriesAsync(string trimSeriesCode);
        
        Task<bool> AddTrimPortSizeAsync(string portSizeCode, string portSize, string unit);
        Task<bool> UpdateTrimPortSizeAsync(string portSizeCode, string portSize, string unit);
        Task<bool> DeleteTrimPortSizeAsync(string portSizeCode, string unit);
        
        Task<bool> AddTrimFormAsync(string formCode, string form);
        Task<bool> UpdateTrimFormAsync(string formCode, string form);
        Task<bool> DeleteTrimFormAsync(string formCode);

        Task<bool> AddTrimMaterialAsync(string trimMatCode, string trimMat);
        Task<bool> UpdateTrimMaterialAsync(string trimMatCode, string trimMat);
        Task<bool> DeleteTrimMaterialAsync(string trimMatCode);

        Task<bool> AddTrimOptionAsync(string trimOptionCode, string trimOption);
        Task<bool> UpdateTrimOptionAsync(string trimOptionCode, string trimOption);
        Task<bool> DeleteTrimOptionAsync(string trimOptionCode);

        // Act 관련 추가 메서드들
        Task<bool> AddActSeriesAsync(string actSeriesCode, string actSeries);
        Task<bool> UpdateActSeriesAsync(string actSeriesCode, string actSeries);
        Task<bool> DeleteActSeriesAsync(string actSeriesCode);
        
        Task<bool> AddActSizeAsync(string actSeriesCode, string actSizeCode, string actSize);
        Task<bool> UpdateActSizeAsync(string actSeriesCode, string actSizeCode, string actSize);
        Task<bool> DeleteActSizeAsync(string actSeriesCode, string actSizeCode);
        
        Task<bool> AddActHWAsync(string hwCode, string hw);
        Task<bool> UpdateActHWAsync(string hwCode, string hw);
        Task<bool> DeleteActHWAsync(string hwCode);

        // Acc 관련 추가 메서드들
        Task<bool> AddAccMakerAsync(string accTypeCode, string makerCode, string maker);
        Task<bool> UpdateAccMakerAsync(string accTypeCode, string makerCode, string maker);
        Task<bool> DeleteAccMakerAsync(string accTypeCode, string makerCode);
        
        Task<bool> AddAccModelAsync(string modelCode, string model, string accTypeCode, string accMakerCode, string? accSize);
        Task<bool> UpdateAccModelAsync(string modelCode, string model, string accTypeCode, string accMakerCode, string? accSize);
        Task<bool> DeleteAccModelAsync(string modelCode, string accTypeCode, string accMakerCode);

        // Act Series-Size 조회를 위한 새로운 메서드
        Task<List<object>> GetActSeriesSizeListAsync();

        // 사양 저장
        Task<bool> SaveSpecificationAsync(string tempEstimateNo, int sheetID, SaveSpecificationRequestDto specification); // DTO 변경
        Task<bool> BulkSaveSpecificationAsync(string tempEstimateNo, SaveSpecificationRequestDto specification);

        // 사양 조회
        Task<SpecificationResponseDto?> GetSpecificationAsync(string tempEstimateNo, int sheetID);

        // 악세사리 검색 (새로 추가)
        Task<List<object>> SearchAccessoriesAsync(string? accTypeCode = null, string? searchKeyword = null);

        // 악세사리 삭제 전 사용 여부 확인 (새로 추가)
        Task<object> CheckAccMakerUsageAsync(string accTypeCode, string makerCode);
        Task<object> CheckAccModelUsageAsync(string accTypeCode, string makerCode, string modelCode);

        // 🔑 파일 관리 메서드들 (새로 추가)
        Task<List<EstimateAttachmentResponseDto>> GetManagerFilesAsync(string tempEstimateNo);
        Task<List<EstimateAttachmentResponseDto>> GetCustomerFilesAsync(string tempEstimateNo);
        Task<EstimateAttachmentResponseDto> GetFileByManagerTypeAsync(string tempEstimateNo, string managerFileType);
        Task<bool> DeleteFileByManagerTypeAsync(string tempEstimateNo, string managerFileType);

        // BodySizeUnit 관련
        Task<IEnumerable<BodySizeUnit>> GetBodySizeUnitListAsync();
        Task<IEnumerable<BodySizeList>> GetBodySizeListByUnitAsync(string unitCode);
        Task<bool> AddBodySizeUnitAsync(string unitCode, string unitName);
        Task<bool> UpdateBodySizeUnitAsync(string unitCode, string unitName);
        Task<bool> DeleteBodySizeUnitAsync(string unitCode);

        // TrimPortSizeUnit 관련
        Task<IEnumerable<TrimPortSizeUnit>> GetTrimPortSizeUnitListAsync();
        Task<IEnumerable<TrimPortSizeList>> GetTrimPortSizeListByUnitAsync(string unitCode);
        Task<bool> AddTrimPortSizeUnitAsync(string unitCode, string unitName);
        Task<bool> UpdateTrimPortSizeUnitAsync(string unitCode, string unitName);
        Task<bool> DeleteTrimPortSizeUnitAsync(string unitCode);
    }
} 