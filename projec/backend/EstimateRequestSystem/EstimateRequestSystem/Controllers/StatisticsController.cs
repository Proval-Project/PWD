using Microsoft.AspNetCore.Mvc;
using EstimateRequestSystem.Services;
using EstimateRequestSystem.DTOs;

namespace EstimateRequestSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatisticsController : ControllerBase
    {
        private readonly IEstimateService _estimateService;

        public StatisticsController(IEstimateService estimateService)
        {
            _estimateService = estimateService;
        }

        // 상단 요약 카운트 (전체 누적 또는 오늘 기준)
        [HttpGet("summary")]
        public async Task<ActionResult<StatisticsSummaryDto>> GetStatisticsSummary()
        {
            try
            {
                var summary = await _estimateService.GetStatisticsSummaryAsync();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 기간별 상태 분포
        [HttpGet("status-distribution")]
        public async Task<ActionResult<StatusDistributionDto>> GetStatusDistribution(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                var distribution = await _estimateService.GetStatusDistributionAsync(startDate, endDate);
                return Ok(distribution);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 월별 수주 현황 (밸브 타입 필터 옵션)
        [HttpGet("monthly-orders")]
        public async Task<ActionResult<List<MonthlyOrderDto>>> GetMonthlyOrderStatistics(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] string? valveType = null)
        {
            try
            {
                var monthlyData = await _estimateService.GetMonthlyOrderStatisticsAsync(startDate, endDate, valveType);
                return Ok(monthlyData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 밸브 사양 비율 (밸브 타입 필터 옵션)
        [HttpGet("valve-ratio")]
        public async Task<ActionResult<List<ValveRatioDto>>> GetValveRatioStatistics(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] string? valveType = null)
        {
            try
            {
                var valveRatio = await _estimateService.GetValveRatioStatisticsAsync(startDate, endDate, valveType);
                return Ok(valveRatio);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 전환율 통계
        [HttpGet("conversion-rate")]
        public async Task<ActionResult<List<ConversionRateDto>>> GetConversionRateStatistics(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                var conversionRate = await _estimateService.GetConversionRateStatisticsAsync(startDate, endDate);
                return Ok(conversionRate);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}

