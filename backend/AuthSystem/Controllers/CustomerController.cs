using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CommonDbLib;
using FullAuthSystem.Models.DTOs;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace FullAuthSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class CustomerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CustomerController(AppDbContext context)
        {
            _context = context;
        }

        // 비밀번호 해시 함수 (SHA256 예시)
        private string HashPassword(string password)
        {
            using (var sha = SHA256.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(password);
                var hash = sha.ComputeHash(bytes);
                return Convert.ToBase64String(hash);
            }
        }

        // 비밀번호 검증 함수
        private bool VerifyPassword(string password, string hashedPassword)
        {
            return HashPassword(password) == hashedPassword;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserID == userId);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });
            var userProfile = new UserProfileDto
            {
                UserID = user.UserID,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.RoleName,
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
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId);
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
            await _context.SaveChangesAsync();
            return Ok(new { message = "프로필이 업데이트되었습니다." });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });
            if (!VerifyPassword(model.CurrentPassword, user.Password))
                return BadRequest(new { message = "현재 비밀번호가 일치하지 않습니다." });
            user.Password = HashPassword(model.NewPassword);
            await _context.SaveChangesAsync();
            return Ok(new { message = "비밀번호가 변경되었습니다." });
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