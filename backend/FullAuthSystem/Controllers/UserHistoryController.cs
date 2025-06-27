using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FullAuthSystem.Models;
using FullAuthSystem.Models.DTOs;
using FullAuthSystem.Data;
using System.Security.Claims;

namespace FullAuthSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserHistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserHistoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 모든 사용자 히스토리 조회 (관리자, 영업부만)
        [HttpGet]
        [Authorize(Roles = "Admin,Sales")]
        public async Task<IActionResult> GetAllHistories()
        {
            var histories = await _context.UserHistories
                .Include(h => h.User)
                .Select(h => new UserHistoryDto
                {
                    Id = h.Id,
                    UserId = h.UserId,
                    Title = h.Title,
                    Description = h.Description,
                    Category = h.Category,
                    Status = h.Status,
                    CreatedAt = h.CreatedAt,
                    UpdatedAt = h.UpdatedAt,
                    CreatedBy = h.CreatedBy,
                    UpdatedBy = h.UpdatedBy,
                    UserName = h.User.FullName,
                    UserEmail = h.User.Email
                })
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();

            return Ok(histories);
        }

        // 특정 사용자의 히스토리 조회
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserHistories(string userId)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst("Role")?.Value;

            // 권한 확인: 본인 또는 관리자/영업부만 조회 가능
            if (currentUserId != userId && currentUserRole != "Admin" && currentUserRole != "Sales")
            {
                return Forbid();
            }

            var histories = await _context.UserHistories
                .Where(h => h.UserId == userId)
                .Include(h => h.User)
                .Select(h => new UserHistoryDto
                {
                    Id = h.Id,
                    UserId = h.UserId,
                    Title = h.Title,
                    Description = h.Description,
                    Category = h.Category,
                    Status = h.Status,
                    CreatedAt = h.CreatedAt,
                    UpdatedAt = h.UpdatedAt,
                    CreatedBy = h.CreatedBy,
                    UpdatedBy = h.UpdatedBy,
                    UserName = h.User.FullName,
                    UserEmail = h.User.Email
                })
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();

            return Ok(histories);
        }

        // 특정 히스토리 조회
        [HttpGet("{id}")]
        public async Task<IActionResult> GetHistory(int id)
        {
            var history = await _context.UserHistories
                .Include(h => h.User)
                .FirstOrDefaultAsync(h => h.Id == id);

            if (history == null)
                return NotFound(new { message = "히스토리를 찾을 수 없습니다." });

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst("Role")?.Value;

            // 권한 확인: 본인 또는 관리자/영업부만 조회 가능
            if (currentUserId != history.UserId && currentUserRole != "Admin" && currentUserRole != "Sales")
            {
                return Forbid();
            }

            var historyDto = new UserHistoryDto
            {
                Id = history.Id,
                UserId = history.UserId,
                Title = history.Title,
                Description = history.Description,
                Category = history.Category,
                Status = history.Status,
                CreatedAt = history.CreatedAt,
                UpdatedAt = history.UpdatedAt,
                CreatedBy = history.CreatedBy,
                UpdatedBy = history.UpdatedBy,
                UserName = history.User.FullName,
                UserEmail = history.User.Email
            };

            return Ok(historyDto);
        }

        // 히스토리 생성
        [HttpPost]
        [Authorize(Roles = "Admin,Sales")]
        public async Task<IActionResult> CreateHistory([FromBody] CreateUserHistoryRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var history = new UserHistory
            {
                UserId = model.UserId,
                Title = model.Title,
                Description = model.Description,
                Category = model.Category,
                Status = model.Status ?? "진행중",
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserHistories.Add(history);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetHistory), new { id = history.Id }, history);
        }

        // 본인 히스토리 생성 (고객만)
        [HttpPost("my-history")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreateMyHistory([FromBody] CreateUserHistoryRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var history = new UserHistory
            {
                UserId = currentUserId,
                Title = model.Title,
                Description = model.Description,
                Category = model.Category,
                Status = model.Status ?? "진행중",
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserHistories.Add(history);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetHistory), new { id = history.Id }, history);
        }

        // 히스토리 수정
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHistory(int id, [FromBody] UpdateUserHistoryRequest model)
        {
            var history = await _context.UserHistories.FindAsync(id);
            if (history == null)
                return NotFound(new { message = "히스토리를 찾을 수 없습니다." });

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst("Role")?.Value;

            // 권한 확인: 본인 또는 관리자/영업부만 수정 가능
            if (currentUserId != history.UserId && currentUserRole != "Admin" && currentUserRole != "Sales")
            {
                return Forbid();
            }

            history.Title = model.Title;
            history.Description = model.Description;
            history.Category = model.Category;
            history.Status = model.Status;
            history.UpdatedBy = currentUserId;
            history.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "히스토리가 업데이트되었습니다." });
        }

        // 히스토리 삭제
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHistory(int id)
        {
            var history = await _context.UserHistories.FindAsync(id);
            if (history == null)
                return NotFound(new { message = "히스토리를 찾을 수 없습니다." });

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst("Role")?.Value;

            // 권한 확인: 본인 또는 관리자/영업부만 삭제 가능
            if (currentUserId != history.UserId && currentUserRole != "Admin" && currentUserRole != "Sales")
            {
                return Forbid();
            }

            _context.UserHistories.Remove(history);
            await _context.SaveChangesAsync();

            return Ok(new { message = "히스토리가 삭제되었습니다." });
        }

        // 카테고리별 히스토리 조회
        [HttpGet("category/{category}")]
        [Authorize(Roles = "Admin,Sales")]
        public async Task<IActionResult> GetHistoriesByCategory(string category)
        {
            var histories = await _context.UserHistories
                .Include(h => h.User)
                .Where(h => h.Category == category)
                .Select(h => new UserHistoryDto
                {
                    Id = h.Id,
                    UserId = h.UserId,
                    Title = h.Title,
                    Description = h.Description,
                    Category = h.Category,
                    Status = h.Status,
                    CreatedAt = h.CreatedAt,
                    UpdatedAt = h.UpdatedAt,
                    CreatedBy = h.CreatedBy,
                    UpdatedBy = h.UpdatedBy,
                    UserName = h.User.FullName,
                    UserEmail = h.User.Email
                })
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();

            return Ok(histories);
        }

        // 상태별 히스토리 조회
        [HttpGet("status/{status}")]
        [Authorize(Roles = "Admin,Sales")]
        public async Task<IActionResult> GetHistoriesByStatus(string status)
        {
            var histories = await _context.UserHistories
                .Include(h => h.User)
                .Where(h => h.Status == status)
                .Select(h => new UserHistoryDto
                {
                    Id = h.Id,
                    UserId = h.UserId,
                    Title = h.Title,
                    Description = h.Description,
                    Category = h.Category,
                    Status = h.Status,
                    CreatedAt = h.CreatedAt,
                    UpdatedAt = h.UpdatedAt,
                    CreatedBy = h.CreatedBy,
                    UpdatedBy = h.UpdatedBy,
                    UserName = h.User.FullName,
                    UserEmail = h.User.Email
                })
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();

            return Ok(histories);
        }
    }
} 