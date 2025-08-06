using Microsoft.AspNetCore.Mvc;
using EstimateRequestSystem.Services;
using EstimateRequestSystem.DTOs;

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
    }
} 