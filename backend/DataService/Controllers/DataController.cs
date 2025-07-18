using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CommonDbLib;

namespace DataService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DataController : ControllerBase
{
    private readonly AppDbContext _context;

    public DataController(AppDbContext context)
    {
        _context = context;
    }

    // 모든 사용자 조회
    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<object>>> GetUsers()
    {
        var users = await _context.Users
            .Select(u => new
            {
                u.UserID,
                u.Name,
                u.Email,
                u.PhoneNumber,
                u.RoleID,
                u.IsApproved,
                u.IsActive,
                u.CreatedAt,
                u.UpdatedAt,
                u.CompanyName,
                u.BusinessNumber,
                u.Address,
                u.CompanyPhone,
                u.Department,
                u.Position
            })
            .ToListAsync();
        
        return Ok(users);
    }

    // 특정 사용자 조회
    [HttpGet("users/{id}")]
    public async Task<ActionResult<object>> GetUser(string id)
    {
        var user = await _context.Users
            .Where(u => u.UserID == id)
            .Select(u => new
            {
                u.UserID,
                u.Name,
                u.Email,
                u.PhoneNumber,
                u.RoleID,
                u.IsApproved,
                u.IsActive,
                u.CreatedAt,
                u.UpdatedAt,
                u.CompanyName,
                u.BusinessNumber,
                u.Address,
                u.CompanyPhone,
                u.Department,
                u.Position
            })
            .FirstOrDefaultAsync();
        
        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    // 사용자 검색 (이름으로)
    [HttpGet("users/search")]
    public async Task<ActionResult<IEnumerable<object>>> SearchUsers([FromQuery] string? name)
    {
        var query = _context.Users.AsQueryable();
        
        if (!string.IsNullOrEmpty(name))
        {
            query = query.Where(u => u.Name.Contains(name));
        }

        var users = await query
            .Select(u => new
            {
                u.UserID,
                u.Name,
                u.Email,
                u.PhoneNumber,
                u.RoleID,
                u.IsApproved,
                u.IsActive,
                u.CreatedAt,
                u.UpdatedAt,
                u.CompanyName,
                u.BusinessNumber,
                u.Address,
                u.CompanyPhone,
                u.Department,
                u.Position
            })
            .ToListAsync();

        return Ok(users);
    }

    // 모든 견적서 조회
    [HttpGet("estimates")]
    public async Task<ActionResult<IEnumerable<EstimateSheetLv1>>> GetEstimates()
    {
        return await _context.EstimateSheetLv1s.ToListAsync();
    }

    // 특정 견적서 조회
    [HttpGet("estimates/{id}")]
    public async Task<ActionResult<EstimateSheetLv1>> GetEstimate(string id)
    {
        var estimate = await _context.EstimateSheetLv1s.FindAsync(id);
        
        if (estimate == null)
        {
            return NotFound();
        }

        return estimate;
    }

    // 견적서 검색 (상태별)
    [HttpGet("estimates/search")]
    public async Task<ActionResult<IEnumerable<EstimateSheetLv1>>> SearchEstimates([FromQuery] string? status)
    {
        var query = _context.EstimateSheetLv1s.AsQueryable();
        
        if (!string.IsNullOrEmpty(status) && int.TryParse(status, out int statusValue))
        {
            query = query.Where(e => (int)e.Status == statusValue);
        }

        return await query.ToListAsync();
    }

    // 통계 정보
    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetStats()
    {
        var totalUsers = await _context.Users.CountAsync();
        var totalEstimates = await _context.EstimateSheetLv1s.CountAsync();

        return new
        {
            TotalUsers = totalUsers,
            TotalEstimates = totalEstimates
        };
    }
} 