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
        public async Task<ActionResult<string>> CreateEstimateSheet(CreateEstimateSheetDto dto, [FromQuery] string currentUserId)
        {
            try
            {
                var tempEstimateNo = await _estimateService.CreateEstimateSheetAsync(dto, currentUserId);
                return CreatedAtAction(nameof(GetEstimateSheet), new { tempEstimateNo }, tempEstimateNo);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 기존 견적에서 새로운 견적 생성 (재문의용)
        [HttpPost("sheets/reinquiry")]
        public async Task<ActionResult<string>> CreateEstimateSheetFromExisting(CreateEstimateSheetDto dto, [FromQuery] string currentUserId, [FromQuery] string existingEstimateNo)
        {
            try
            {
                Console.WriteLine($"🔍 CreateEstimateSheetFromExisting 호출됨");
                Console.WriteLine($"🔍 dto: {System.Text.Json.JsonSerializer.Serialize(dto)}");
                Console.WriteLine($"🔍 currentUserId: {currentUserId}");
                Console.WriteLine($"🔍 existingEstimateNo: {existingEstimateNo}");
                
                var tempEstimateNo = await _estimateService.CreateEstimateSheetFromExistingAsync(dto, currentUserId, existingEstimateNo);
                Console.WriteLine($"🔍 새로운 견적 번호 생성됨: {tempEstimateNo}");
                
                return CreatedAtAction(nameof(GetEstimateSheet), new { tempEstimateNo }, tempEstimateNo);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ CreateEstimateSheetFromExisting 오류: {ex.Message}");
                Console.WriteLine($"❌ 스택 트레이스: {ex.StackTrace}");
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/estimate/sheets/{tempEstimateNo}
        [HttpGet("sheets/{tempEstimateNo}")]
        public async Task<IActionResult> GetEstimateSheet(string tempEstimateNo)
        {
            var estimateSheet = await _estimateService.GetEstimateSheetAsync(tempEstimateNo);
            if (estimateSheet == null)
            {
                return NotFound();
            }

            // 디버깅을 위한 JSON 출력
            var json = System.Text.Json.JsonSerializer.Serialize(estimateSheet, new System.Text.Json.JsonSerializerOptions
            {
                WriteIndented = true,
                // 순환 참조를 처리하기 위한 설정 (필요 시)
                // ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve
            });
            Console.WriteLine("---- ESTIMATE SHEET RESPONSE DATA ----");
            Console.WriteLine(json);
            Console.WriteLine("------------------------------------");

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
        public async Task<ActionResult> SubmitEstimate(string tempEstimateNo, [FromBody] SubmitEstimateDto estimateDto)
        {
            try
            {
                // 디버깅을 위한 수신 데이터 JSON 출력
                var json = System.Text.Json.JsonSerializer.Serialize(estimateDto, new System.Text.Json.JsonSerializerOptions
                {
                    WriteIndented = true,
                });
                Console.WriteLine("---- SUBMIT ESTIMATE REQUEST DATA ----");
                Console.WriteLine(json);
                Console.WriteLine("--------------------------------------");

                var success = await _estimateService.SubmitEstimateAsync(tempEstimateNo, estimateDto);
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



        // 특정 UnitCode에 해당하는 BodySize 목록 조회 (새로 추가)
        [HttpGet("body-size-list-by-unit")]
        public async Task<IActionResult> GetBodySizeListByUnit([FromQuery] string unitCode)
        {
            try
            {
                if (string.IsNullOrEmpty(unitCode))
                {
                    return BadRequest(new { message = "UnitCode is required" });
                }

                var result = await _estimateService.GetBodySizeListByUnitAsync(unitCode);
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
                var ratingList = await _estimateService.GetBodyRatingListAsync();
                return Ok(ratingList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Step 3 마스터 데이터 엔드포인트들
        [HttpGet("body-bonnet-list")]
        public async Task<IActionResult> GetBodyBonnetList()
        {
            try
            {
                var bonnetList = await _estimateService.GetBodyBonnetListAsync();
                return Ok(bonnetList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("body-connection-list")]
        public async Task<IActionResult> GetBodyConnectionList()
        {
            try
            {
                var connectionList = await _estimateService.GetBodyConnectionListAsync();
                return Ok(connectionList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("trim-type-list")]
        public async Task<IActionResult> GetTrimTypeList()
        {
            try
            {
                var trimTypeList = await _estimateService.GetTrimTypeListAsync();
                return Ok(trimTypeList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("trim-series-list")]
        public async Task<IActionResult> GetTrimSeriesList()
        {
            try
            {
                var trimSeriesList = await _estimateService.GetTrimSeriesListAsync();
                return Ok(trimSeriesList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("trim-port-size-list")]
        public async Task<IActionResult> GetTrimPortSizeList()
        {
            try
            {
                var portSizeList = await _estimateService.GetTrimPortSizeListAsync();
                return Ok(portSizeList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // TrimPortSizeUnit 마스터 데이터 조회 (새로 추가)
        [HttpGet("trim-port-size-unit-list")]
        public async Task<IActionResult> GetTrimPortSizeUnitList()
        {
            try
            {
                var result = await _estimateService.GetTrimPortSizeUnitListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 특정 UnitCode에 해당하는 TrimPortSize 목록 조회 (새로 추가)
        [HttpGet("trim-port-size-list-by-unit")]
        public async Task<IActionResult> GetTrimPortSizeListByUnit([FromQuery] string unitCode)
        {
            try
            {
                if (string.IsNullOrEmpty(unitCode))
                {
                    return BadRequest(new { message = "UnitCode is required" });
                }

                var result = await _estimateService.GetTrimPortSizeListByUnitAsync(unitCode);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("trim-form-list")]
        public async Task<IActionResult> GetTrimFormList()
        {
            try
            {
                var formList = await _estimateService.GetTrimFormListAsync();
                return Ok(formList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("act-type-list")]
        public async Task<IActionResult> GetActTypeList()
        {
            try
            {
                var actTypeList = await _estimateService.GetActTypeListAsync();
                return Ok(actTypeList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("act-series-list")]
        public async Task<IActionResult> GetActSeriesList()
        {
            try
            {
                var actSeriesList = await _estimateService.GetActSeriesListAsync();
                return Ok(actSeriesList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("act-size-list")]
        public async Task<IActionResult> GetActSizeList([FromQuery] string? actSeriesCode = null)
        {
            try
            {
                var actSizeList = await _estimateService.GetActSizeListAsync(actSeriesCode);
                return Ok(actSizeList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("act-hw-list")]
        public async Task<IActionResult> GetActHWList()
        {
            try
            {
                var hwList = await _estimateService.GetActHWListAsync();
                return Ok(hwList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }


        [HttpGet("acc-maker-list")]
        public async Task<IActionResult> GetAccMakerList([FromQuery] string? makerCode = null)
        {
            try
            {
                var accMakerList = await _estimateService.GetAccMakerListAsync(makerCode);
                return Ok(accMakerList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("acc-model-list")]
        public async Task<IActionResult> GetAccModelList([FromQuery] string? accTypeCode = null, [FromQuery] string? accMakerCode = null)
        {
            try
            {
                var accModelList = await _estimateService.GetAccModelListAsync(accTypeCode, accMakerCode);
                return Ok(accModelList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
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
        public async Task<ActionResult<EstimateAttachmentResponseDto>> UploadAttachment(string tempEstimateNo, IFormFile file, [FromQuery] string uploadUserID, [FromQuery] string fileType = "customer", [FromQuery] string managerFileType = "")
        {
            Console.WriteLine($"🔍 UploadAttachment 호출됨 - tempEstimateNo: {tempEstimateNo}, uploadUserID: {uploadUserID}, fileType: {fileType}, managerFileType: {managerFileType}");
            Console.WriteLine($"🔍 파일 정보 - Name: {file?.FileName}, Length: {file?.Length}, ContentType: {file?.ContentType}");
            
            if (file == null || file.Length == 0)
            {
                Console.WriteLine("❌ 파일이 null이거나 크기가 0");
                return BadRequest(new { message = "파일이 없습니다." });
            }

            try
            {
                Console.WriteLine("✅ 파일 업로드 시작");
                // customer 업로드 시 managerFileType이 비어 있으면 "customer"로 통일
                if (fileType == "customer" && string.IsNullOrEmpty(managerFileType))
                {
                    managerFileType = "customer";
                }
                var attachment = await _estimateService.UploadAttachmentAsync(tempEstimateNo, file, uploadUserID, fileType, managerFileType);
                Console.WriteLine("✅ 파일 업로드 성공");
                return CreatedAtAction(nameof(GetAttachments), new { tempEstimateNo }, attachment);
            }
            catch (InvalidOperationException ex)
            {
                Console.WriteLine($"❌ InvalidOperationException: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 일반 Exception: {ex.Message}");
                Console.WriteLine($"❌ StackTrace: {ex.StackTrace}");
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

        // 🔑 파일 경로로 다운로드하는 새로운 API 추가
        [HttpGet("attachments/download")]
        public async Task<ActionResult> DownloadFileByPath([FromQuery] string filePath)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath))
                {
                    return BadRequest(new { message = "파일 경로가 제공되지 않았습니다." });
                }

                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new { message = "파일을 찾을 수 없습니다." });
                }

                var fileName = Path.GetFileName(filePath);
                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var contentType = GetContentType(fileName);

                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"파일 다운로드 중 오류: {ex.Message}");
                return BadRequest(new { message = $"파일 다운로드 중 오류가 발생했습니다: {ex.Message}" });
            }
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".xls" => "application/vnd.ms-excel",
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".txt" => "text/plain",
                _ => "application/octet-stream"
            };
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

        [HttpPost("sheets/{tempEstimateNo}/assign")]
        public async Task<IActionResult> AssignEstimate(string tempEstimateNo, [FromBody] EstimateAssignDto request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.ManagerId))
                {
                    return BadRequest("담당자 ID가 필요합니다.");
                }

                var result = await _estimateService.AssignManagerAsync(tempEstimateNo, request.ManagerId);
                
                if (result)
                {
                    return Ok(new { message = "견적 담당 처리 완료" });
                }
                else
                {
                    return BadRequest("견적 담당 처리에 실패했습니다.");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"서버 오류: {ex.Message}" });
            }
        }

        // 견적 완료 처리: CurEstimateNo 생성 및 상태=완료 저장
        [HttpPost("sheets/{tempEstimateNo}/complete")]
        public async Task<IActionResult> CompleteEstimate(string tempEstimateNo)
        {
            try
            {
                var curNo = await _estimateService.CompleteEstimateAsync(tempEstimateNo);
                if (string.IsNullOrEmpty(curNo))
                    return NotFound(new { message = "견적을 찾을 수 없습니다." });
                return Ok(new { curEstimateNo = curNo, statusText = "견적완료" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 완료 취소 → 진행중으로 되돌리기
        [HttpPost("sheets/{tempEstimateNo}/complete/cancel")]
        public async Task<IActionResult> CancelCompletion(string tempEstimateNo)
        {
            try
            {
                var ok = await _estimateService.CancelCompletionAsync(tempEstimateNo);
                if (!ok) return NotFound(new { message = "견적을 찾을 수 없습니다." });
                return Ok(new { statusText = "견적처리중" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 주문 확정 → 상태=주문
        [HttpPost("sheets/{tempEstimateNo}/order/confirm")]
        public async Task<IActionResult> ConfirmOrder(string tempEstimateNo)
        {
            try
            {
                var ok = await _estimateService.ConfirmOrderAsync(tempEstimateNo);
                if (!ok) return NotFound(new { message = "견적을 찾을 수 없습니다." });
                return Ok(new { statusText = "주문" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 주문 취소 → 완료 상태로 되돌리기
        [HttpPost("sheets/{tempEstimateNo}/order/cancel")]
        public async Task<IActionResult> CancelOrder(string tempEstimateNo)
        {
            try
            {
                var ok = await _estimateService.CancelOrderAsync(tempEstimateNo);
                if (!ok) return NotFound(new { message = "견적을 찾을 수 없습니다." });
                return Ok(new { statusText = "견적완료" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 시작 취소 -> 견적요청 상태로 되돌리기
        [HttpPost("sheets/{tempEstimateNo}/cancel-start")]
        public async Task<IActionResult> CancelStart(string tempEstimateNo)
        {
            try
            {
                var ok = await _estimateService.CancelStartAsync(tempEstimateNo);
                if (!ok) return NotFound(new { message = "견적을 찾을 수 없습니다." });
                return Ok(new { statusText = "견적요청" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

                    // 사양 저장
            [HttpPost("sheets/{tempEstimateNo}/requests/{sheetID}/specification")]
            public async Task<ActionResult> SaveSpecification(string tempEstimateNo, int sheetID, [FromBody] SaveSpecificationRequestDto specification) // DTO 변경
            {
                try
                {
                    // 요청 데이터 로깅
                    Console.WriteLine($"사양 저장 요청 - TempEstimateNo: {tempEstimateNo}, SheetID: {sheetID}");
                    Console.WriteLine($"ValveId: {specification.ValveId}");
                    Console.WriteLine($"Body: {System.Text.Json.JsonSerializer.Serialize(specification.Body)}");
                    Console.WriteLine($"Trim: {System.Text.Json.JsonSerializer.Serialize(specification.Trim)}");
                    Console.WriteLine($"Actuator: {System.Text.Json.JsonSerializer.Serialize(specification.Actuator)}");
                    Console.WriteLine($"Accessories: {System.Text.Json.JsonSerializer.Serialize(specification.Accessories)}");

                    var success = await _estimateService.SaveSpecificationAsync(tempEstimateNo, sheetID, specification);
                    if (!success)
                        return BadRequest(new { message = "사양 저장에 실패했습니다." });

                    return Ok(new { message = "사양이 성공적으로 저장되었습니다." });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"사양 저장 중 예외 발생: {ex.Message}");
                    Console.WriteLine($"스택 트레이스: {ex.StackTrace}");
                    return BadRequest(new { message = ex.Message });
                }
            }

            // 사양 일괄 저장 (해당 tempEstimateNo의 모든 SheetID 대상)
            [HttpPost("sheets/{tempEstimateNo}/specification/bulk")]
            public async Task<ActionResult> BulkSaveSpecification(string tempEstimateNo, [FromBody] BulkSaveSpecificationRequestDto request)
            {
                try
                {
                    if (request?.Items == null || request.Items.Count == 0)
                        return BadRequest(new { message = "저장할 항목이 없습니다." });

                    var okAll = true;
                    foreach (var item in request.Items)
                    {
                        var saved = await _estimateService.SaveSpecificationAsync(tempEstimateNo, item.SheetID, item.Specification);
                        if (!saved) okAll = false;
                    }
                    if (!okAll) return BadRequest(new { message = "일괄 저장에 실패했습니다." });
                    return Ok(new { message = "모든 태그에 사양을 일괄 저장했습니다." });
                }
                catch (Exception ex)
                {
                    return BadRequest(new { message = ex.Message });
                }
            }

        // 기존 사양 데이터 조회
        [HttpGet("sheets/{tempEstimateNo}/specification/{sheetID}")]
        public async Task<ActionResult<SpecificationResponseDto>> GetSpecification(string tempEstimateNo, int sheetID)
        {
            try
            {
                var specification = await _estimateService.GetSpecificationAsync(tempEstimateNo, sheetID);
                
                if (specification == null)
                    return NotFound(new { message = "해당 SheetID의 사양 데이터를 찾을 수 없습니다." });

                return Ok(specification);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetSpecification 예외 발생: {ex.Message}");
                return BadRequest(new { message = $"사양 데이터 조회 중 오류가 발생했습니다: {ex.Message}" });
            }
        }

        // CV 리스트 생성 (새로 추가)
        [HttpPost("sheets/{tempEstimateNo}/generate-cv")]
        public async Task<ActionResult<string>> GenerateCVList(string tempEstimateNo)
        {
            try
            {
                Console.WriteLine($"CV 리스트 생성 요청 - TempEstimateNo: {tempEstimateNo}");
                
                var fileName = await _estimateService.GenerateCVListAsync(tempEstimateNo);
                
                Console.WriteLine($"CV 리스트 생성 완료 - 파일명: {fileName}");
                
                return Ok(new { fileName = fileName, message = "CV 리스트가 성공적으로 생성되었습니다." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CV 리스트 생성 중 예외 발생: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        // VL 리스트 생성
        [HttpPost("sheets/{tempEstimateNo}/generate-vl")]
        public async Task<ActionResult<string>> GenerateVLList(string tempEstimateNo)
        {
            try
            {
                Console.WriteLine($"VL 리스트 생성 요청 - TempEstimateNo: {tempEstimateNo}");
                
                var fileName = await _estimateService.GenerateVLListAsync(tempEstimateNo);
                
                Console.WriteLine($"VL 리스트 생성 완료 - 파일명: {fileName}");
                
                return Ok(new { fileName = fileName, message = "VL 리스트가 성공적으로 생성되었습니다." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"VL 리스트 생성 중 예외 발생: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        // DataSheet 생성
        [HttpPost("sheets/{tempEstimateNo}/generate-datasheet")]
        public async Task<ActionResult<string>> GenerateDataSheet(string tempEstimateNo)
        {
            try
            {
                Console.WriteLine($"DataSheet 생성 요청 - TempEstimateNo: {tempEstimateNo}");
                
                var fileName = await _estimateService.GenerateDataSheetAsync(tempEstimateNo);
                
                Console.WriteLine($"DataSheet 생성 완료 - 파일명: {fileName}");
                
                return Ok(new { fileName = fileName, message = "DataSheet가 성공적으로 생성되었습니다." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DataSheet 생성 중 예외 발생: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        // 단품견적서 생성
        [HttpPost("sheets/{tempEstimateNo}/generate-single-quote")]
        public async Task<ActionResult<string>> GenerateSingleQuote(string tempEstimateNo)
        {
            try
            {
                Console.WriteLine($"단품견적서 생성 요청 - TempEstimateNo: {tempEstimateNo}");
                
                var fileName = await _estimateService.GenerateSingleQuoteAsync(tempEstimateNo);
                
                Console.WriteLine($"단품견적서 생성 완료 - 파일명: {fileName}");
                
                return Ok(new { fileName = fileName, message = "단품견적서가 성공적으로 생성되었습니다." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"단품견적서 생성 중 예외 발생: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        // 다수량견적서 생성
        [HttpPost("sheets/{tempEstimateNo}/generate-multi-quote")]
        public async Task<ActionResult<string>> GenerateMultiQuote(string tempEstimateNo)
        {
            try
            {
                Console.WriteLine($"다수량견적서 생성 요청 - TempEstimateNo: {tempEstimateNo}");
                
                var fileName = await _estimateService.GenerateMultiQuoteAsync(tempEstimateNo);
                
                Console.WriteLine($"다수량견적서 생성 완료 - 파일명: {fileName}");
                
                return Ok(new { fileName = fileName, message = "다수량견적서가 성공적으로 생성되었습니다." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"다수량견적서 생성 중 예외 발생: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        // 🔑 파일 관리 API 엔드포인트들 (새로 추가)

        // 관리자용 파일 목록 조회
        [HttpGet("sheets/{tempEstimateNo}/manager-files")]
        public async Task<ActionResult<List<EstimateAttachmentResponseDto>>> GetManagerFiles(string tempEstimateNo)
        {
            try
            {
                var files = await _estimateService.GetManagerFilesAsync(tempEstimateNo);
                return Ok(files);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"관리자 파일 목록 조회 중 예외 발생: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        // 고객용 파일 목록 조회
        [HttpGet("sheets/{tempEstimateNo}/customer-files")]
        public async Task<ActionResult<List<EstimateAttachmentResponseDto>>> GetCustomerFiles(string tempEstimateNo)
        {
            try
            {
                var files = await _estimateService.GetCustomerFilesAsync(tempEstimateNo);
                return Ok(files);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"고객 파일 목록 조회 중 예외 발생: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        // 특정 타입의 파일 조회
        [HttpGet("sheets/{tempEstimateNo}/files/{managerFileType}")]
        public async Task<ActionResult<EstimateAttachmentResponseDto>> GetFileByManagerType(string tempEstimateNo, string managerFileType)
        {
            try
            {
                var file = await _estimateService.GetFileByManagerTypeAsync(tempEstimateNo, managerFileType);
                if (file == null)
                    return NotFound(new { message = "해당 타입의 파일을 찾을 수 없습니다." });
                
                return Ok(file);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"파일 조회 중 예외 발생: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        // 특정 타입의 파일 삭제
        [HttpDelete("sheets/{tempEstimateNo}/files/{managerFileType}")]
        public async Task<ActionResult> DeleteFileByManagerType(string tempEstimateNo, string managerFileType)
        {
            try
            {
                var success = await _estimateService.DeleteFileByManagerTypeAsync(tempEstimateNo, managerFileType);
                if (!success)
                    return NotFound(new { message = "삭제할 파일을 찾을 수 없습니다." });

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"파일 삭제 중 예외 발생: {ex.Message}");
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