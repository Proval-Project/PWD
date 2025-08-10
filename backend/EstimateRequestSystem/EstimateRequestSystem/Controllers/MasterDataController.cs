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
        [HttpGet("act-type")]
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

        [HttpPost("act-type")]
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

        [HttpPut("act-type/{code}")]
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

        [HttpDelete("act-type/{code}")]
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

        // Acc Type 관련
        [HttpGet("acc-type")]
        public async Task<IActionResult> GetAccTypeList()
        {
            try
            {
                var result = await _estimateService.GetAccTypeListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("acc-type")]
        public async Task<IActionResult> AddAccType([FromBody] AccTypeList item)
        {
            try
            {
                var result = await _estimateService.AddAccTypeAsync(item.AccTypeCode, item.AccTypeName);
                
                if (result)
                {
                    return Ok(new { message = "Acc Type이 추가되었습니다." });
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

        [HttpPut("acc-type/{code}")]
        public async Task<IActionResult> UpdateAccType(string code, [FromBody] AccTypeList item)
        {
            try
            {
                var result = await _estimateService.UpdateAccTypeAsync(code, item.AccTypeName);
                
                if (result)
                {
                    return Ok(new { message = "Acc Type이 수정되었습니다." });
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

        [HttpDelete("acc-type/{code}")]
        public async Task<IActionResult> DeleteAccType(string code)
        {
            try
            {
                var result = await _estimateService.DeleteAccTypeAsync(code);
                
                if (result)
                {
                    return Ok(new { message = "Acc Type이 삭제되었습니다." });
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

        // 모든 마스터 데이터 조회 (카테고리별)
        [HttpGet("all/{category}")]
        public async Task<IActionResult> GetAllMasterData(string category)
        {
            try
            {
                // 실제로는 카테고리별 데이터를 반환하는 로직 구현 필요
                return Ok(new { message = $"{category} 카테고리 데이터입니다." });
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
                            valveData.GetProperty("code").GetString(),
                            valveData.GetProperty("name").GetString()
                        );
                        break;
                    case "bonnet":
                        var bonnetData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddBodyBonnetAsync(
                            bonnetData.GetProperty("code").GetString(),
                            bonnetData.GetProperty("name").GetString()
                        );
                        break;
                    case "material":
                        var materialData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddBodyMaterialAsync(
                            materialData.GetProperty("code").GetString(),
                            materialData.GetProperty("name").GetString()
                        );
                        break;
                    case "size":
                        var sizeData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddBodySizeAsync(
                            sizeData.GetProperty("unit").GetString(),
                            sizeData.GetProperty("code").GetString(),
                            sizeData.GetProperty("name").GetString()
                        );
                        break;
                    case "rating":
                        var ratingData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddBodyRatingAsync(
                            ratingData.GetProperty("code").GetString(),
                            ratingData.GetProperty("name").GetString(),
                            ratingData.GetProperty("unit").GetString()
                        );
                        break;
                    case "connection":
                        var connectionData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddBodyConnectionAsync(
                            connectionData.GetProperty("code").GetString(),
                            connectionData.GetProperty("name").GetString()
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
                        result = await _estimateService.UpdateBodyValveAsync(
                            code,
                            valveData.GetProperty("name").GetString()
                        );
                        break;
                    case "bonnet":
                        var bonnetData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateBodyBonnetAsync(
                            code,
                            bonnetData.GetProperty("name").GetString()
                        );
                        break;
                    case "material":
                        var materialData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateBodyMaterialAsync(
                            code,
                            materialData.GetProperty("name").GetString()
                        );
                        break;
                    case "size":
                        var sizeData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        var sizeUnit = sizeData.GetProperty("unit").GetString();
                        result = await _estimateService.UpdateBodySizeAsync(
                            sizeUnit,
                            code,
                            sizeData.GetProperty("name").GetString()
                        );
                        break;
                    case "rating":
                        var ratingData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateBodyRatingAsync(
                            code,
                            ratingData.GetProperty("name").GetString(),
                            ratingData.GetProperty("unit").GetString()
                        );
                        break;
                    case "connection":
                        var connectionData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateBodyConnectionAsync(
                            code,
                            connectionData.GetProperty("name").GetString()
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
                        result = await _estimateService.DeleteBodyMaterialAsync(code);
                        break;
                    case "size":
                        // Size는 복합키이므로 unit도 필요
                        return BadRequest(new { message = "Size 삭제는 별도 엔드포인트를 사용하세요." });
                    case "rating":
                        result = await _estimateService.DeleteBodyRatingAsync(code);
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

        // Size 복합키 삭제를 위한 별도 엔드포인트
        [HttpDelete("body/size/{unit}/{code}")]
        public async Task<IActionResult> DeleteBodySizeItem(string unit, string code)
        {
            try
            {
                var result = await _estimateService.DeleteBodySizeAsync(unit, code);
                
                if (result)
                {
                    return Ok(new { message = "Body Size 항목이 삭제되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "삭제에 실패했습니다. 존재하지 않는 항목이거나 사용 중인 항목입니다." });
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
                return StatusCode(500, new { 
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
                
                switch (section.ToLower())
                {
                    case "series":
                        var seriesData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddTrimSeriesAsync(
                            seriesData.GetProperty("code").GetString(),
                            seriesData.GetProperty("name").GetString()
                        );
                        break;
                    case "port-size":
                        var portSizeData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddTrimPortSizeAsync(
                            portSizeData.GetProperty("code").GetString(),
                            portSizeData.GetProperty("name").GetString(),
                            portSizeData.GetProperty("unit").GetString()
                        );
                        break;
                    case "form":
                        var formData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddTrimFormAsync(
                            formData.GetProperty("code").GetString(),
                            formData.GetProperty("name").GetString()
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Trim {section} 항목이 추가되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "추가에 실패했습니다. 이미 존재하는 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("trim/{section}/{code}")]
        public async Task<IActionResult> UpdateTrimItem(string section, string code, [FromBody] object item)
        {
            try
            {
                bool result = false;
                
                switch (section.ToLower())
                {
                    case "series":
                        var seriesData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateTrimSeriesAsync(
                            code,
                            seriesData.GetProperty("name").GetString()
                        );
                        break;
                    case "port-size":
                        var portSizeData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateTrimPortSizeAsync(
                            code,
                            portSizeData.GetProperty("name").GetString(),
                            portSizeData.GetProperty("unit").GetString()
                        );
                        break;
                    case "form":
                        var formData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateTrimFormAsync(
                            code,
                            formData.GetProperty("name").GetString()
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 섹션입니다." });
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
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("trim/{section}/{code}")]
        public async Task<IActionResult> DeleteTrimItem(string section, string code)
        {
            try
            {
                bool result = false;
                
                switch (section.ToLower())
                {
                    case "series":
                        result = await _estimateService.DeleteTrimSeriesAsync(code);
                        break;
                    case "port-size":
                        result = await _estimateService.DeleteTrimPortSizeAsync(code);
                        break;
                    case "form":
                        result = await _estimateService.DeleteTrimFormAsync(code);
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

        [HttpGet("act/series-size")]
        public async Task<IActionResult> GetActSeriesSizeList()
        {
            try
            {
                var result = await _estimateService.GetActSeriesSizeListAsync();
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
                // 더 자세한 로깅을 위해 내부 예외도 포함
                var innerException = ex.InnerException?.Message ?? "내부 예외 없음";
                var source = ex.TargetSite?.Name ?? "알 수 없음";
                return StatusCode(500, new { 
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
                
                switch (section.ToLower())
                {
                    case "series":
                        var seriesData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddActSeriesAsync(
                            seriesData.GetProperty("code").GetString(),
                            seriesData.GetProperty("name").GetString()
                        );
                        break;
                    case "series-size":
                        var seriesSizeData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddActSeriesSizeAsync(
                            seriesSizeData.GetProperty("code").GetString(),
                            seriesSizeData.GetProperty("name").GetString(),
                            seriesSizeData.GetProperty("unit").GetString()
                        );
                        break;
                    case "hw":
                        var hwData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddActHWAsync(
                            hwData.GetProperty("code").GetString(),
                            hwData.GetProperty("name").GetString()
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Act {section} 항목이 추가되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "추가에 실패했습니다. 이미 존재하는 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("act/{section}/{code}")]
        public async Task<IActionResult> UpdateActItem(string section, string code, [FromBody] object item)
        {
            try
            {
                bool result = false;
                
                switch (section.ToLower())
                {
                    case "series":
                        var seriesData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateActSeriesAsync(
                            code,
                            seriesData.GetProperty("name").GetString()
                        );
                        break;
                    case "series-size":
                        var seriesSizeData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateActSeriesSizeAsync(
                            code,
                            seriesSizeData.GetProperty("name").GetString(),
                            seriesSizeData.GetProperty("unit").GetString()
                        );
                        break;
                    case "hw":
                        var hwData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateActHWAsync(
                            code,
                            hwData.GetProperty("name").GetString()
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 섹션입니다." });
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
                    case "series":
                        result = await _estimateService.DeleteActSeriesAsync(code);
                        break;
                    case "series-size":
                        result = await _estimateService.DeleteActSeriesSizeAsync(code);
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

        [HttpPost("acc/{section}")]
        public async Task<IActionResult> AddAccItem(string section, [FromBody] object item)
        {
            try
            {
                bool result = false;
                
                switch (section.ToLower())
                {
                    case "maker":
                        var makerData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddAccMakerAsync(
                            makerData.GetProperty("code").GetString(),
                            makerData.GetProperty("name").GetString(),
                            makerData.GetProperty("accTypeCode").GetString()
                        );
                        break;
                    case "model":
                        var modelData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.AddAccModelAsync(
                            modelData.GetProperty("code").GetString(),
                            modelData.GetProperty("name").GetString(),
                            modelData.GetProperty("accTypeCode").GetString(),
                            modelData.GetProperty("accMakerCode").GetString()
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Acc {section} 항목이 추가되었습니다." });
                }
                else
                {
                    return BadRequest(new { message = "추가에 실패했습니다. 이미 존재하는 코드이거나 유효하지 않은 데이터입니다." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("acc/{section}/{code}")]
        public async Task<IActionResult> UpdateAccItem(string section, string code, [FromBody] object item)
        {
            try
            {
                bool result = false;
                
                switch (section.ToLower())
                {
                    case "maker":
                        var makerData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateAccMakerAsync(
                            code,
                            makerData.GetProperty("name").GetString(),
                            makerData.GetProperty("accTypeCode").GetString()
                        );
                        break;
                    case "model":
                        var modelData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(item.ToString());
                        result = await _estimateService.UpdateAccModelAsync(
                            code,
                            modelData.GetProperty("name").GetString(),
                            modelData.GetProperty("accTypeCode").GetString(),
                            modelData.GetProperty("accMakerCode").GetString()
                        );
                        break;
                    default:
                        return BadRequest(new { message = "지원하지 않는 섹션입니다." });
                }

                if (result)
                {
                    return Ok(new { message = $"Acc {section} 항목이 수정되었습니다." });
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

        [HttpDelete("acc/{section}/{code}")]
        public async Task<IActionResult> DeleteAccItem(string section, string code)
        {
            try
            {
                bool result = false;
                
                switch (section.ToLower())
                {
                    case "maker":
                        result = await _estimateService.DeleteAccMakerAsync(code);
                        break;
                    case "model":
                        result = await _estimateService.DeleteAccModelAsync(code);
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
    }
}
