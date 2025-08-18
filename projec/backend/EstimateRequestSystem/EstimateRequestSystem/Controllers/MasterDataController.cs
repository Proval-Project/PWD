using Microsoft.AspNetCore.Mvc;
using EstimateRequestSystem.Services;
using EstimateRequestSystem.Models;
using System.Text.Json;

namespace EstimateRequestSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MasterDataController : ControllerBase
    {
        private readonly IEstimateService _estimateService;

        public MasterDataController(IEstimateService estimateService)
        {
            _estimateService = estimateService;
        }

        // BODY 관련 마스터 데이터
        [HttpGet("body/valve")]
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

        [HttpGet("body/bonnet")]
        public async Task<IActionResult> GetBodyBonnetList()
        {
            try
            {
                var result = await _estimateService.GetBodyBonnetListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("body/material")]
        public async Task<IActionResult> GetBodyMaterialList()
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

        [HttpGet("body/size")]
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

        [HttpGet("body/rating")]
        public async Task<IActionResult> GetBodyRatingList([FromQuery] string? ratingUnitCode = null)
        {
            try
            {
                var result = await _estimateService.GetBodyRatingListAsync(ratingUnitCode);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("body/rating")]
        public async Task<IActionResult> AddBodyRating([FromBody] JsonElement requestBody)
        {
            try
            {
                var ratingCode = requestBody.GetProperty("ratingCode").GetString();
                var rating = requestBody.GetProperty("rating").GetString();
                var unit = requestBody.GetProperty("unit").GetString();

                var result = await _estimateService.AddBodyRatingAsync(ratingCode, rating, unit);

                if (result)
                {
                    return Ok(new { message = "Body Rating이 추가되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "추가에 실패했습니다. 중복된 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("body/rating/{code}")]
        public async Task<IActionResult> UpdateBodyRating(string code, [FromBody] JsonElement requestBody)
        {
            try
            {
                var rating = requestBody.GetProperty("rating").GetString();
                var unit = requestBody.GetProperty("unit").GetString();

                var result = await _estimateService.UpdateBodyRatingAsync(code, rating, unit);

                if (result)
                {
                    return Ok(new { message = "Body Rating이 수정되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "수정에 실패했습니다. 존재하지 않는 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("body/rating/{code}")]
        public async Task<IActionResult> DeleteBodyRating(string code, [FromQuery] string unit)
        {
            try
            {
                var result = await _estimateService.DeleteBodyRatingAsync(code, unit);

                if (result)
                {
                    return Ok(new { message = "Body Rating이 삭제되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "삭제에 실패했습니다. 존재하지 않는 코드이거나 사용 중인 항목입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("body/connection")]
        public async Task<IActionResult> GetBodyConnectionList()
        {
            try
            {
                var result = await _estimateService.GetBodyConnectionListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("body/size-units")]
        public async Task<IActionResult> GetBodySizeUnits()
        {
            try
            {
                var result = await _estimateService.GetBodySizeUnitsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("body/rating-units")]
        public async Task<IActionResult> GetBodyRatingUnits()
        {
            try
            {
                var result = await _estimateService.GetBodyRatingUnitsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("body/rating-units")]
        public async Task<IActionResult> AddBodyRatingUnit([FromBody] BodyRatingUnitList item)
        {
            try
            {
                var result = await _estimateService.AddBodyRatingUnitAsync(item.RatingUnitCode, item.RatingUnit);

                if (result)
                {
                    return Ok(new { message = "Rating Unit이 추가되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "추가에 실패했습니다. 중복된 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("body/rating-units/{code}")]
        public async Task<IActionResult> UpdateBodyRatingUnit(string code, [FromBody] BodyRatingUnitList item)
        {
            try
            {
                var result = await _estimateService.UpdateBodyRatingUnitAsync(code, item.RatingUnit);

                if (result)
                {
                    return Ok(new { message = "Rating Unit이 수정되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "수정에 실패했습니다. 존재하지 않는 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("body/rating-units/{code}")]
        public async Task<IActionResult> DeleteBodyRatingUnit(string code)
        {
            try
            {
                var result = await _estimateService.DeleteBodyRatingUnitAsync(code);

                if (result)
                {
                    return Ok(new { message = "Rating Unit이 삭제되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "삭제에 실패했습니다. 존재하지 않는 코드이거나 사용 중인 항목입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // TRIM 관련 마스터 데이터
        [HttpGet("trim-type")]
        public async Task<IActionResult> GetTrimTypeList()
        {
            try
            {
                var result = await _estimateService.GetTrimTypeListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("trim-type")]
        public async Task<IActionResult> AddTrimType([FromBody] TrimTypeList item)
        {
            try
            {
                var result = await _estimateService.AddTrimTypeAsync(item.TrimTypeCode, item.TrimType);

                if (result)
                {
                    return Ok(new { message = "Trim Type이 추가되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "추가에 실패했습니다. 중복된 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("trim-type/{code}")]
        public async Task<IActionResult> UpdateTrimType(string code, [FromBody] TrimTypeList item)
        {
            try
            {
                var result = await _estimateService.UpdateTrimTypeAsync(code, item.TrimType);

                if (result)
                {
                    return Ok(new { message = "Trim Type이 수정되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "수정에 실패했습니다. 존재하지 않는 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("trim-type/{code}")]
        public async Task<IActionResult> DeleteTrimType(string code)
        {
            try
            {
                var result = await _estimateService.DeleteTrimTypeAsync(code);

                if (result)
                {
                    return Ok(new { message = "Trim Type이 삭제되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "삭제에 실패했습니다. 존재하지 않는 코드이거나 사용 중인 항목입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Act Type 관련
        [HttpGet("act/type")]
        public async Task<IActionResult> GetActTypeList()
        {
            try
            {
                var result = await _estimateService.GetActTypeListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("act/type")]
        public async Task<IActionResult> AddActType([FromBody] ActTypeList item)
        {
            try
            {
                var result = await _estimateService.AddActTypeAsync(item.ActTypeCode, item.ActType);

                if (result)
                {
                    return Ok(new { message = "Act Type이 추가되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "추가에 실패했습니다. 중복된 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("act/type/{code}")]
        public async Task<IActionResult> UpdateActType(string code, [FromBody] ActTypeList item)
        {
            try
            {
                var result = await _estimateService.UpdateActTypeAsync(code, item.ActType);

                if (result)
                {
                    return Ok(new { message = "Act Type이 수정되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "수정에 실패했습니다. 존재하지 않는 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("act/type/{code}")]
        public async Task<IActionResult> DeleteActType(string code)
        {
            try
            {
                var result = await _estimateService.DeleteActTypeAsync(code);

                if (result)
                {
                    return Ok(new { message = "Act Type이 삭제되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "삭제에 실패했습니다. 존재하지 않는 코드이거나 사용 중인 항목입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // TRIM 관련 마스터 데이터
        [HttpGet("trim/series")]
        public async Task<IActionResult> GetTrimSeriesList()
        {
            try
            {
                var result = await _estimateService.GetTrimSeriesListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("trim/port-size")]
        public async Task<IActionResult> GetTrimPortSizeList()
        {
            try
            {
                var result = await _estimateService.GetTrimPortSizeListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                // 더 자세한 로깅을 위해 내부 예외도 포함
                var innerException = ex.InnerException?.Message ?? "내부 예외 없음";
                var source = ex.TargetSite?.Name ?? "알 수 없음";
                return StatusCode(500, new
                {
                    message = ex.Message,
                    innerException = innerException,
                    stackTrace = ex.StackTrace,
                    source = source,
                    exceptionType = ex.GetType().Name
                });
            }
        }

        [HttpGet("trim/form")]
        public async Task<IActionResult> GetTrimFormList()
        {
            try
            {
                var result = await _estimateService.GetTrimFormListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("trim/material")]
        public async Task<IActionResult> GetTrimMaterialList()
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

        [HttpGet("trim/option")]
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

        [HttpPost("trim/{section}")]
        public async Task<IActionResult> AddTrimItem(string section, [FromBody] object item)
        {
            try
            {
                bool result = false;
                var trimData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());

                switch (section.ToLower())
                {
                    case "type":
                        result = await _estimateService.AddTrimTypeAsync(
                            trimData.GetProperty("trimTypeCode").GetString(),
                            trimData.GetProperty("trimType").GetString()
                        );
                        break;
                    case "series":
                        result = await _estimateService.AddTrimSeriesAsync(
                            trimData.GetProperty("trimSeriesCode").GetString(),
                            trimData.GetProperty("trimSeries").GetString()
                        );
                        break;
                    case "portsize":
                        var portSizeCode = trimData.GetProperty("portSizeCode").GetString();
                        var portSizeName = trimData.GetProperty("portSize").GetString();
                        var unit = trimData.GetProperty("unit").GetString();
                        result = await _estimateService.AddTrimPortSizeAsync(portSizeCode, portSizeName, unit);
                        break;
                    case "form":
                        result = await _estimateService.AddTrimFormAsync(
                            trimData.GetProperty("formCode").GetString(),
                            trimData.GetProperty("form").GetString()
                        );
                        break;
                    case "material":
                        result = await _estimateService.AddTrimMaterialAsync(
                            trimData.GetProperty("trimMatCode").GetString(),
                            trimData.GetProperty("trimMat").GetString()
                        );
                        break;
                    case "option":
                        result = await _estimateService.AddTrimOptionAsync(
                            trimData.GetProperty("trimOptionCode").GetString(),
                            trimData.GetProperty("trimOption").GetString()
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 트림 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Trim {section} 항목이 추가되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "추가에 실패했습니다. 중복된 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AddTrimItem: {ex.Message}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("trim/{section}/{code}")]
        public async Task<IActionResult> UpdateTrimItem(string section, string code, [FromBody] object item)
        {
            try
            {
                bool result = false;
                var trimData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());

                switch (section.ToLower())
                {
                    case "type":
                        result = await _estimateService.UpdateTrimTypeAsync(
                            code,
                            trimData.GetProperty("trimType").GetString()
                        );
                        break;
                    case "series":
                        result = await _estimateService.UpdateTrimSeriesAsync(
                            code,
                            trimData.GetProperty("trimSeries").GetString()
                        );
                        break;
                    case "portsize":
                        var portSizeName = trimData.GetProperty("portSize").GetString();
                        var unit = trimData.GetProperty("unit").GetString();
                        // 복합키를 고려하여 업데이트 (PortSize만 변경 가능)
                        result = await _estimateService.UpdateTrimPortSizeAsync(code, portSizeName, unit);
                        break;
                    case "form":
                        result = await _estimateService.UpdateTrimFormAsync(
                            code,
                            trimData.GetProperty("form").GetString()
                        );
                        break;
                    case "material":
                        result = await _estimateService.UpdateTrimMaterialAsync(
                            code,
                            trimData.GetProperty("trimMat").GetString()
                        );
                        break;
                    case "option":
                        result = await _estimateService.UpdateTrimOptionAsync(
                            code,
                            trimData.GetProperty("trimOption").GetString()
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 트림 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Trim {section} 항목이 수정되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "수정에 실패했습니다. 존재하지 않는 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateTrimItem: {ex.Message}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("trim/{section}/{code}")]
        public async Task<IActionResult> DeleteTrimItem(string section, string code, [FromQuery] string? unit = null)
        {
            try
            {
                bool result = false;

                switch (section.ToLower())
                {
                    case "series":
                        result = await _estimateService.DeleteTrimSeriesAsync(code);
                        break;
                    case "portsize":
                        // 복합키를 고려하여 삭제 (unit 정보 필요)
                        if (string.IsNullOrEmpty(unit))
                        {
                            return BadRequest(new { message = "Port Size 삭제 시 unit 정보가 필요합니다." });
                        }
                        result = await _estimateService.DeleteTrimPortSizeAsync(code, unit);
                        break;
                    case "form":
                        result = await _estimateService.DeleteTrimFormAsync(code);
                        break;
                    case "material":
                        result = await _estimateService.DeleteTrimMaterialAsync(code);
                        break;
                    case "option":
                        result = await _estimateService.DeleteTrimOptionAsync(code);
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Trim {section} 항목이 삭제되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "삭제에 실패했습니다. 존재하지 않는 코드이거나 사용 중인 항목입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("trim/portsize/{code}")]
        public async Task<IActionResult> DeleteTrimPortSize(string code, [FromQuery] string? unit = null)
        {
            try
            {
                if (string.IsNullOrEmpty(unit))
                {
                    return BadRequest(new { message = "Port Size 삭제 시 unit 정보가 필요합니다." });
                }

                var result = await _estimateService.DeleteTrimPortSizeAsync(code, unit);
                if (result)
                {
                    return Ok(new { message = "Trim Port Size 항목이 삭제되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "삭제에 실패했습니다. 존재하지 않는 코드이거나 사용 중인 항목입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ACT 관련 마스터 데이터
        [HttpGet("act/series")]
        public async Task<IActionResult> GetActSeriesList()
        {
            try
            {
                var result = await _estimateService.GetActSeriesListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("act/size")]
        public async Task<IActionResult> GetActSeriesSizeList([FromQuery] string? actSeriesCode = null)
        {
            try
            {
                var result = await _estimateService.GetActSizeListAsync(actSeriesCode);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("act/hw")]
        public async Task<IActionResult> GetActHWList()
        {
            try
            {
                var result = await _estimateService.GetActHWListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                var innerException = ex.InnerException?.Message ?? "내부 예외 없음";
                var source = ex.TargetSite?.Name ?? "알 수 없음";
                return StatusCode(500, new
                {
                    message = ex.Message,
                    innerException = innerException,
                    stackTrace = ex.StackTrace,
                    source = source,
                    exceptionType = ex.GetType().Name
                });
            }
        }

        [HttpPost("act/{section}")]
        public async Task<IActionResult> AddActItem(string section, [FromBody] object item)
        {
            try
            {
                bool result = false;
                var actData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());

                switch (section.ToLower())
                {
                    case "type":
                        result = await _estimateService.AddActTypeAsync(
                            actData.GetProperty("actTypeCode").GetString(),
                            actData.GetProperty("actType").GetString()
                        );
                        break;
                    case "series":
                        result = await _estimateService.AddActSeriesAsync(
                            actData.GetProperty("actSeriesCode").GetString(),
                            actData.GetProperty("actSeries").GetString()
                        );
                        break;
                    case "size":
                        var actSeriesCode = actData.GetProperty("actSeriesCode").GetString();
                        var actSizeCode = actData.GetProperty("actSizeCode").GetString();
                        var actSizeName = actData.GetProperty("actSize").GetString();
                        result = await _estimateService.AddActSizeAsync(
                            actSeriesCode,
                            actSizeCode,
                            actSizeName
                        );
                        break;
                    case "hw":
                        result = await _estimateService.AddActHWAsync(
                            actData.GetProperty("hwCode").GetString(),
                            actData.GetProperty("hw").GetString()
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 작동기 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Act {section} 항목이 추가되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "추가에 실패했습니다. 중복된 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AddActItem: {ex.Message}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("act/{section}/{code}")]
        public async Task<IActionResult> UpdateActItem(string section, string code, [FromBody] object item)
        {
            try
            {
                bool result = false;
                var actData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());

                switch (section.ToLower())
                {
                    case "type":
                        result = await _estimateService.UpdateActTypeAsync(
                            code,
                            actData.GetProperty("actType").GetString()
                        );
                        break;
                    case "series":
                        result = await _estimateService.UpdateActSeriesAsync(
                            code,
                            actData.GetProperty("actSeries").GetString()
                        );
                        break;
                    case "size":
                        var actSeriesCode = actData.GetProperty("actSeriesCode").GetString();
                        var actSizeName = actData.GetProperty("actSize").GetString();
                        result = await _estimateService.UpdateActSizeAsync(
                            actSeriesCode,
                            code,
                            actSizeName
                        );
                        break;
                    case "hw":
                        result = await _estimateService.UpdateActHWAsync(
                            code,
                            actData.GetProperty("hw").GetString()
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 작동기 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Act {section} 항목이 수정되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "수정에 실패했습니다. 존재하지 않는 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateActItem: {ex.Message}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("act/{section}/{code}")]
        public async Task<IActionResult> DeleteActItem(string section, string code)
        {
            try
            {
                bool result = false;

                switch (section.ToLower())
                {
                    case "type":
                        result = await _estimateService.DeleteActTypeAsync(code);
                        break;
                    case "series":
                        result = await _estimateService.DeleteActSeriesAsync(code);
                        break;
                    case "size":
                        // actSeriesCode와 actSizeCode 모두 필요
                        string actSeriesCode = Request.Query["actSeriesCode"].ToString();
                        result = await _estimateService.DeleteActSizeAsync(actSeriesCode, code);
                        break;
                    case "hw":
                        result = await _estimateService.DeleteActHWAsync(code);
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Act {section} 항목이 삭제되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "삭제에 실패했습니다. 존재하지 않는 코드이거나 사용 중인 항목입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ACC 관련 마스터 데이터
        [HttpGet("acc/maker")]
        public async Task<IActionResult> GetAccMakerList([FromQuery] string? accTypeCode = null)
        {
            try
            {
                var result = await _estimateService.GetAccMakerListAsync(accTypeCode);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("acc/model")]
        public async Task<IActionResult> GetAccModelList([FromQuery] string? accTypeCode = null, [FromQuery] string? accMakerCode = null)
        {
            try
            {
                var result = await _estimateService.GetAccModelListAsync(accTypeCode, accMakerCode);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 악세사리 검색 API (새로 추가)
        [HttpGet("acc/search")]
        public async Task<IActionResult> SearchAccessories([FromQuery] string? accTypeCode = null, [FromQuery] string? searchKeyword = null)
        {
            try
            {
                var result = await _estimateService.SearchAccessoriesAsync(accTypeCode, searchKeyword);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("acc/{type}")]
        public async Task<IActionResult> AddAccItem(string type, [FromBody] object item)
        {
            try
            {
                bool result = false;
                var accData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());

                switch (type.ToLower())
                {
                    case "maker":
                        // accTypeCode, makerCode, maker 순서로 전달해야 함
                        result = await _estimateService.AddAccMakerAsync(
                            accData.GetProperty("accTypeCode").GetString(),
                            accData.GetProperty("makerCode").GetString(),
                            accData.GetProperty("maker").GetString()
                        );
                        break;
                    case "model":
                        // modelCode, model, accTypeCode, accMakerCode, accSize 순서로 전달
                        var modelCode = accData.GetProperty("modelCode").GetString();
                        var model = accData.GetProperty("model").GetString();
                        var accTypeCode = accData.GetProperty("accTypeCode").GetString();
                        var accMakerCode = accData.GetProperty("accMakerCode").GetString();
                        var accSize = accData.TryGetProperty("accSize", out JsonElement sizeElement) ? sizeElement.GetString() : null;
                        result = await _estimateService.AddAccModelAsync(
                            modelCode,
                            model,
                            accTypeCode,
                            accMakerCode,
                            accSize
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 악세사리 타입입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"{type} 항목이 추가되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "추가에 실패했습니다. 중복된 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AddAccItem: {ex.Message}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("acc/{type}/{code}")]
        public async Task<IActionResult> UpdateAccItem(string type, string code, [FromBody] object item)
        {
            try
            {
                bool result = false;
                var accData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());

                switch (type.ToLower())
                {
                    case "maker":
                        result = await _estimateService.UpdateAccMakerAsync(
                            accData.GetProperty("accTypeCode").GetString(),
                            code,
                            accData.GetProperty("maker").GetString()
                        );
                        break;
                    case "model":
                        var model = accData.GetProperty("model").GetString();
                        var accTypeCode = accData.GetProperty("accTypeCode").GetString();
                        var accMakerCode = accData.GetProperty("accMakerCode").GetString();
                        var accSize = accData.TryGetProperty("accSize", out JsonElement sizeElement) ? sizeElement.GetString() : null;
                        result = await _estimateService.UpdateAccModelAsync(
                            code,
                            model,
                            accTypeCode,
                            accMakerCode,
                            accSize
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 악세사리 타입입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"{type} 항목이 수정되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "수정에 실패했습니다. 존재하지 않는 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateAccItem: {ex.Message}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 악세사리 메이커 사용 여부 확인 (새로 추가)
        [HttpGet("acc/{accTypeCode}/check-maker-usage/{makerCode}")]
        public async Task<IActionResult> CheckAccMakerUsage(string accTypeCode, string makerCode)
        {
            try
            {
                var result = await _estimateService.CheckAccMakerUsageAsync(accTypeCode, makerCode);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 악세사리 모델 사용 여부 확인 (새로 추가)
        [HttpGet("acc/{accTypeCode}/check-model-usage/{makerCode}/{modelCode}")]
        public async Task<IActionResult> CheckAccModelUsage(string accTypeCode, string makerCode, string modelCode)
        {
            try
            {
                var result = await _estimateService.CheckAccModelUsageAsync(accTypeCode, makerCode, modelCode);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("acc/{section}/{modelCode}/{accTypeCode}/{accMakerCode}")]
        public async Task<IActionResult> DeleteAccItem(string section, string modelCode, string accTypeCode, string accMakerCode)
        {
            try
            {
                bool result = false;

                switch (section.ToLower())
                {
                    case "maker":
                        result = await _estimateService.DeleteAccMakerAsync(accTypeCode, modelCode);
                        break;
                    case "model":
                        result = await _estimateService.DeleteAccModelAsync(modelCode, accTypeCode, accMakerCode);
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Acc {section} 항목이 삭제되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "삭제에 실패했습니다. 존재하지 않는 코드이거나 사용 중인 항목입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Body 관련 CRUD 작업
        [HttpPost("body/{section}")]
        public async Task<IActionResult> AddBodyItem(string section, [FromBody] object item)
        {
            try
            {
                bool result = false;

                switch (section.ToLower())
                {
                    case "valve":
                        var valveData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddBodyValveAsync(
                            valveData.GetProperty("valveSeriesCode").GetString(),
                            valveData.GetProperty("valveSeries").GetString()
                        );
                        break;
                    case "bonnet":
                        var bonnetData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddBodyBonnetAsync(
                            bonnetData.GetProperty("bonnetCode").GetString(),
                            bonnetData.GetProperty("bonnet").GetString()
                        );
                        break;
                    case "material":
                        var materialData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddBodyMatAsync(
                            materialData.GetProperty("bodyMatCode").GetString(),
                            materialData.GetProperty("bodyMat").GetString()
                        );
                        break;
                    case "size":
                        var sizeData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddBodySizeAsync(
                            sizeData.GetProperty("sizeUnit").GetString(),
                            sizeData.GetProperty("bodySizeCode").GetString(),
                            sizeData.GetProperty("bodySize").GetString()
                        );
                        break;
                    case "rating":
                        var ratingData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddBodyRatingAsync(
                            ratingData.GetProperty("ratingCode").GetString(),
                            ratingData.GetProperty("ratingName").GetString(),
                            ratingData.GetProperty("ratingUnit").GetString()
                        );
                        break;
                    case "connection":
                        var connectionData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddBodyConnectionAsync(
                            connectionData.GetProperty("connectionCode").GetString(),
                            connectionData.GetProperty("connection").GetString()
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Body {section} 항목이 추가되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "추가에 실패했습니다. 중복된 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("body/{section}/{code}")]
        public async Task<IActionResult> UpdateBodyItem(string section, string code, [FromBody] object item)
        {
            try
            {
                bool result = false;

                switch (section.ToLower())
                {
                    case "valve":
                        var valveData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        // 프론트엔드에서 valveSeriesCode도 함께 보내므로 이를 사용
                        var valveSeriesCode = valveData.GetProperty("valveSeriesCode").GetString();
                        var valveSeries = valveData.GetProperty("valveSeries").GetString();
                        result = await _estimateService.UpdateBodyValveAsync(
                            valveSeriesCode ?? code,  // valveSeriesCode가 있으면 사용, 없으면 URL의 code 사용
                            valveSeries
                        );
                        break;
                    case "bonnet":
                        var bonnetData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateBodyBonnetAsync(
                            code,
                            bonnetData.GetProperty("bonnet").GetString()
                        );
                        break;
                    case "material":
                        var materialData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateBodyMatAsync(
                            code,
                            materialData.GetProperty("bodyMat").GetString()
                        );
                        break;
                    case "size":
                        var sizeData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        var sizeUnit = sizeData.GetProperty("sizeUnit").GetString();
                        result = await _estimateService.UpdateBodySizeAsync(
                            sizeUnit,
                            code,
                            sizeData.GetProperty("bodySize").GetString()
                        );
                        break;
                    case "rating":
                        var ratingData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateBodyRatingAsync(
                            code,
                            ratingData.GetProperty("rating").GetString(),
                            ratingData.GetProperty("unit").GetString()
                        );
                        break;
                    case "connection":
                        var connectionData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateBodyConnectionAsync(
                            code,
                            connectionData.GetProperty("connection").GetString()
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Body {section} 항목이 수정되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "수정에 실패했습니다. 존재하지 않는 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("body/{section}/{code}")]
        public async Task<IActionResult> DeleteBodyItem(string section, string code)
        {
            try
            {
                bool result = false;

                switch (section.ToLower())
                {
                    case "valve":
                        result = await _estimateService.DeleteBodyValveAsync(code);
                        break;
                    case "bonnet":
                        result = await _estimateService.DeleteBodyBonnetAsync(code);
                        break;
                    case "material":
                        result = await _estimateService.DeleteBodyMatAsync(code);
                        break;
                    case "size":
                        string sizeUnitToDelete = Request.Query["unit"].ToString();
                        result = await _estimateService.DeleteBodySizeAsync(sizeUnitToDelete, code);
                        break;
                    case "rating":
                        string ratingUnitToDelete = Request.Query["unit"].ToString();
                        result = await _estimateService.DeleteBodyRatingAsync(code, ratingUnitToDelete);
                        break;
                    case "connection":
                        result = await _estimateService.DeleteBodyConnectionAsync(code);
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Body {section} 항목이 삭제되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "삭제에 실패했습니다. 존재하지 않는 코드이거나 사용 중인 항목입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
