using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
    [Authorize(Roles = "Customer")]
    public class CustomerController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public CustomerController(
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });

            var userProfile = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                IsApproved = user.IsApproved,
                ApprovedAt = user.ApprovedAt,
                ApprovedBy = user.ApprovedBy,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                CompanyName = user.CompanyName,
                BusinessNumber = user.BusinessNumber,
                Address = user.Address,
                CompanyPhone = user.CompanyPhone,
                Department = user.Department,
                Position = user.Position,
                ContactPhone = user.PhoneNumber
            };

            return Ok(userProfile);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateCustomerProfileModel model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });

            // 기본 정보 업데이트
            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.PhoneNumber = model.ContactPhone;
            user.UpdatedAt = DateTime.UtcNow;

            // 기업정보 업데이트
            user.CompanyName = model.CompanyName;
            user.BusinessNumber = model.BusinessNumber;
            user.Address = model.Address;
            user.CompanyPhone = model.CompanyPhone;

            // 담당자정보 업데이트
            user.Department = model.Department;
            user.Position = model.Position;

            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded)
                return Ok(new { message = "프로필이 업데이트되었습니다." });

            return BadRequest(result.Errors);
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });

            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
            if (result.Succeeded)
                return Ok(new { message = "비밀번호가 변경되었습니다." });

            return BadRequest(result.Errors);
        }

        // 본인 히스토리 조회
        [HttpGet("my-history")]
        public async Task<IActionResult> GetMyHistory()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var histories = await _context.UserHistories
                .Where(h => h.UserId == userId)
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
                    UpdatedBy = h.UpdatedBy
                })
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();

            return Ok(histories);
        }

        // 본인 히스토리 생성
        [HttpPost("my-history")]
        public async Task<IActionResult> CreateMyHistory([FromBody] CreateUserHistoryRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var history = new UserHistory
            {
                UserId = userId,
                Title = model.Title,
                Description = model.Description,
                Category = model.Category,
                Status = model.Status ?? "진행중",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserHistories.Add(history);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMyHistory), history);
        }

        // 본인 히스토리 수정
        [HttpPut("my-history/{id}")]
        public async Task<IActionResult> UpdateMyHistory(int id, [FromBody] UpdateUserHistoryRequest model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var history = await _context.UserHistories
                .FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId);

            if (history == null)
                return NotFound(new { message = "히스토리를 찾을 수 없습니다." });

            history.Title = model.Title;
            history.Description = model.Description;
            history.Category = model.Category;
            history.Status = model.Status;
            history.UpdatedBy = userId;
            history.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "히스토리가 업데이트되었습니다." });
        }

        // 본인 히스토리 삭제
        [HttpDelete("my-history/{id}")]
        public async Task<IActionResult> DeleteMyHistory(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var history = await _context.UserHistories
                .FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId);

            if (history == null)
                return NotFound(new { message = "히스토리를 찾을 수 없습니다." });

            _context.UserHistories.Remove(history);
            await _context.SaveChangesAsync();

            return Ok(new { message = "히스토리가 삭제되었습니다." });
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // 여기에 주문 조회 로직을 구현할 수 있습니다
            // 현재는 예시 데이터를 반환합니다
            var orders = new[]
            {
                new { id = 1, orderNumber = "ORD-001", status = "완료", total = 50000, orderDate = DateTime.UtcNow.AddDays(-5) },
                new { id = 2, orderNumber = "ORD-002", status = "처리중", total = 75000, orderDate = DateTime.UtcNow.AddDays(-2) }
            };

            return Ok(orders);
        }

        [HttpGet("support-tickets")]
        public async Task<IActionResult> GetMySupportTickets()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // 여기에 고객 지원 티켓 조회 로직을 구현할 수 있습니다
            var tickets = new[]
            {
                new { id = 1, title = "배송 문의", status = "답변완료", createdAt = DateTime.UtcNow.AddDays(-3) },
                new { id = 2, title = "환불 요청", status = "처리중", createdAt = DateTime.UtcNow.AddDays(-1) }
            };

            return Ok(tickets);
        }
    }

    public class UpdateCustomerProfileModel
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? CompanyName { get; set; }
        public string? BusinessNumber { get; set; }
        public string? Address { get; set; }
        public string? CompanyPhone { get; set; }
        public string? Department { get; set; }
        public string? Position { get; set; }
        public string? ContactPhone { get; set; }
    }

    public class ChangePasswordModel
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
} 