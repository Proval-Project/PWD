using Microsoft.AspNetCore.Mvc;
using EstimateRequestSystem.Services;
using EstimateRequestSystem.DTOs;
using EstimateRequestSystem.Models;

namespace EstimateRequestSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EstimateController : ControllerBase
    {
        private readonly IEstimateService _estimateService;

        public EstimateController(IEstimateService estimateService)
        {
            _estimateService = estimateService;
        }

        // EstimateSheet operations
        [HttpPost("sheets")]
        public async Task<ActionResult<string>> CreateEstimateSheet(CreateEstimateSheetDto dto)
        {
            try
            {
                var tempEstimateNo = await _estimateService.CreateEstimateSheetAsync(dto);
                return CreatedAtAction(nameof(GetEstimateSheet), new { tempEstimateNo }, tempEstimateNo);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("sheets/{tempEstimateNo}")]
        public async Task<ActionResult<EstimateSheetResponseDto>> GetEstimateSheet(string tempEstimateNo)
        {
            var estimateSheet = await _estimateService.GetEstimateSheetAsync(tempEstimateNo);
            if (estimateSheet == null)
                return NotFound();

            return Ok(estimateSheet);
        }

        [HttpGet("sheets/status/{status}")]
        public async Task<ActionResult<List<EstimateSheetListResponseDto>>> GetEstimateSheetsByStatus(int status)
        {
            var estimateSheets = await _estimateService.GetEstimateSheetsByStatusAsync(status);
            return Ok(estimateSheets);
        }

        [HttpGet("sheets/user/{userID}")]
        public async Task<ActionResult<List<EstimateSheetListResponseDto>>> GetEstimateSheetsByUser(string userID)
        {
            var estimateSheets = await _estimateService.GetEstimateSheetsByUserAsync(userID);
            return Ok(estimateSheets);
        }

        [HttpPut("sheets/{tempEstimateNo}")]
        public async Task<ActionResult> UpdateEstimateSheet(string tempEstimateNo, UpdateEstimateSheetDto dto)
        {
            var success = await _estimateService.UpdateEstimateSheetAsync(tempEstimateNo, dto);
            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("sheets/{tempEstimateNo}")]
        public async Task<ActionResult> DeleteEstimateSheet(string tempEstimateNo)
        {
            var success = await _estimateService.DeleteEstimateSheetAsync(tempEstimateNo);
            if (!success)
                return NotFound();

            return NoContent();
        }

        // 임시저장 기능
        [HttpPost("sheets/{tempEstimateNo}/save-draft")]
        public async Task<ActionResult> SaveDraft(string tempEstimateNo, [FromBody] SaveDraftDto dto)
        {
            try
            {
                var success = await _estimateService.SaveDraftAsync(tempEstimateNo, dto);
                if (!success)
                    return NotFound();

                return Ok(new { message = "임시저장이 완료되었습니다." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 견적요청 기능
        [HttpPost("sheets/{tempEstimateNo}/submit")]
        public async Task<ActionResult> SubmitEstimate(string tempEstimateNo, [FromBody] SubmitEstimateDto dto)
        {
            try
            {
                var success = await _estimateService.SubmitEstimateAsync(tempEstimateNo, dto);
                if (!success)
                    return NotFound();

                return Ok(new { message = "견적요청이 완료되었습니다." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // TempEstimateNo 생성 API
        [HttpPost("generate-temp-no")]
        public async Task<ActionResult<object>> GenerateTempEstimateNo()
        {
            try
            {
                var tempEstimateNo = await _estimateService.GenerateTempEstimateNoAsync();
                return Ok(new { tempEstimateNo });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // BodyValveList API
        [HttpGet("body-valve-list")]
        public async Task<IActionResult> GetBodyValveList()
        {
            try
            {
                var result = await _estimateService.GetBodyValveListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("body-size-list")]
        public async Task<IActionResult> GetBodySizeList()
        {
            try
            {
                var result = await _estimateService.GetBodySizeListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("body-mat-list")]
        public async Task<IActionResult> GetBodyMatList()
        {
            try
            {
                var result = await _estimateService.GetBodyMatListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("trim-mat-list")]
        public async Task<IActionResult> GetTrimMatList()
        {
            try
            {
                var result = await _estimateService.GetTrimMatListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("trim-option-list")]
        public async Task<IActionResult> GetTrimOptionList()
        {
            try
            {
                var result = await _estimateService.GetTrimOptionListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("body-rating-list")]
        public async Task<IActionResult> GetBodyRatingList()
        {
            try
            {
                var result = await _estimateService.GetBodyRatingListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // EstimateRequest operations
        [HttpPost("sheets/{tempEstimateNo}/requests")]
        public async Task<ActionResult<EstimateRequestResponseDto>> CreateEstimateRequest(string tempEstimateNo, CreateEstimateRequestDto dto)
        {
            try
            {
                var estimateRequest = await _estimateService.CreateEstimateRequestAsync(tempEstimateNo, dto);
                return CreatedAtAction(nameof(GetEstimateRequest), new { tempEstimateNo, sheetID = estimateRequest.SheetID }, estimateRequest);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("sheets/{tempEstimateNo}/requests/{sheetID}")]
        public async Task<ActionResult<EstimateRequestResponseDto>> GetEstimateRequest(string tempEstimateNo, int sheetID)
        {
            var estimateRequest = await _estimateService.GetEstimateRequestAsync(tempEstimateNo, sheetID);
            if (estimateRequest == null)
                return NotFound();

            return Ok(estimateRequest);
        }

        [HttpGet("sheets/{tempEstimateNo}/requests")]
        public async Task<ActionResult<List<EstimateRequestListResponseDto>>> GetEstimateRequests(string tempEstimateNo)
        {
            var estimateRequests = await _estimateService.GetEstimateRequestsAsync(tempEstimateNo);
            return Ok(estimateRequests);
        }

        [HttpPut("sheets/{tempEstimateNo}/requests/{sheetID}")]
        public async Task<ActionResult> UpdateEstimateRequest(string tempEstimateNo, int sheetID, CreateEstimateRequestDto dto)
        {
            var success = await _estimateService.UpdateEstimateRequestAsync(tempEstimateNo, sheetID, dto);
            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("sheets/{tempEstimateNo}/requests/{sheetID}")]
        public async Task<ActionResult> DeleteEstimateRequest(string tempEstimateNo, int sheetID)
        {
            var success = await _estimateService.DeleteEstimateRequestAsync(tempEstimateNo, sheetID);
            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpPut("sheets/{tempEstimateNo}/requests/order")]
        public async Task<ActionResult> UpdateEstimateRequestOrder(string tempEstimateNo, [FromBody] List<int> sheetIDs)
        {
            var success = await _estimateService.UpdateEstimateRequestOrderAsync(tempEstimateNo, sheetIDs);
            if (!success)
                return NotFound();

            return NoContent();
        }

        // Attachment operations
        [HttpPost("sheets/{tempEstimateNo}/attachments")]
        public async Task<ActionResult<EstimateAttachmentResponseDto>> UploadAttachment(string tempEstimateNo, IFormFile file, [FromQuery] string uploadUserID)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "파일이 없습니다." });

            try
            {
                var attachment = await _estimateService.UploadAttachmentAsync(tempEstimateNo, file, uploadUserID);
                return CreatedAtAction(nameof(GetAttachments), new { tempEstimateNo }, attachment);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "파일 업로드에 실패했습니다." });
            }
        }

        [HttpGet("sheets/{tempEstimateNo}/attachments")]
        public async Task<ActionResult<List<EstimateAttachmentResponseDto>>> GetAttachments(string tempEstimateNo)
        {
            var attachments = await _estimateService.GetAttachmentsAsync(tempEstimateNo);
            return Ok(attachments);
        }

        [HttpDelete("attachments/{attachmentID}")]
        public async Task<ActionResult> DeleteAttachment(int attachmentID)
        {
            var success = await _estimateService.DeleteAttachmentAsync(attachmentID);
            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("attachments/file")]
        public async Task<ActionResult> DeleteFileByPath([FromBody] DeleteFileRequest request)
        {
            var success = await _estimateService.DeleteFileByPathAsync(request.FilePath);
            if (!success)
                return NotFound();

            return NoContent();
        }

        [HttpGet("attachments/{attachmentID}/download")]
        public async Task<ActionResult> DownloadAttachment(int attachmentID)
        {
            try
            {
                var fileBytes = await _estimateService.DownloadAttachmentAsync(attachmentID);
                var attachment = await _estimateService.GetAttachmentsAsync(""); // 임시로 빈 문자열 전달
                var fileName = attachment.FirstOrDefault(a => a.AttachmentID == attachmentID)?.FileName ?? "file";

                return File(fileBytes, "application/octet-stream", fileName);
            }
            catch (FileNotFoundException)
            {
                return NotFound();
            }
        }

        // 견적 요청 조회 (검색, 필터링, 페이징)
        [HttpGet("inquiry")]
        public async Task<ActionResult<EstimateInquiryResponseDto>> GetEstimateInquiry(
            [FromQuery] EstimateInquiryRequestDto request)
        {
            try
            {
                var result = await _estimateService.GetEstimateInquiryAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 임시저장 목록 조회
        [HttpGet("drafts")]
        public async Task<ActionResult<EstimateInquiryResponseDto>> GetDraftEstimates(
            [FromQuery] EstimateInquiryRequestDto request,
            [FromQuery] string currentUserId,
            [FromQuery] string? customerId = null)
        {
            try
            {
                var result = await _estimateService.GetDraftEstimatesAsync(request, currentUserId, customerId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 견적 상태 업데이트
        [HttpPut("sheets/{tempEstimateNo}/status")]
        public async Task<ActionResult> UpdateEstimateStatus(string tempEstimateNo, [FromBody] UpdateStatusRequest request)
        {
            try
            {
                var status = EstimateStatusExtensions.FromInt(request.Status);
                var result = await _estimateService.UpdateEstimateStatusAsync(tempEstimateNo, status);
                
                if (!result)
                    return NotFound();

                return Ok(new { message = "상태가 성공적으로 업데이트되었습니다." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 담당자 지정
        [HttpPut("sheets/{tempEstimateNo}/manager")]
        public async Task<ActionResult> AssignManager(string tempEstimateNo, [FromBody] AssignManagerRequest request)
        {
            try
            {
                var result = await _estimateService.AssignManagerAsync(tempEstimateNo, request.ManagerID);
                
                if (!result)
                    return BadRequest(new { message = "담당자 지정에 실패했습니다. 견적이 존재하지 않거나 유효하지 않은 담당자입니다." });

                return Ok(new { message = "담당자가 성공적으로 지정되었습니다." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 견적 상세 조회
        [HttpGet("sheets/{tempEstimateNo}/detail")]
        public async Task<ActionResult<EstimateDetailResponseDto>> GetEstimateDetail(string tempEstimateNo, [FromQuery] string currentUserId)
        {
            try
            {
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return BadRequest(new { message = "현재 사용자 ID가 필요합니다." });
                }

                var result = await _estimateService.GetEstimateDetailAsync(tempEstimateNo, currentUserId);
                
                if (result == null)
                    return NotFound(new { message = "견적을 찾을 수 없습니다." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    // 상태 업데이트 요청 DTO
    public class UpdateStatusRequest
    {
        public int Status { get; set; }
    }

    // 담당자 지정 요청 DTO
    public class AssignManagerRequest
    {
        public string ManagerID { get; set; } = string.Empty;
    }
} 