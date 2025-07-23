using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CommonDbLib;
using FullAuthSystem.Models.DTOs;
using System.Security.Cryptography;
using System.Text;

namespace FullAuthSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Include(u => u.Role)
                .Select(u => new UserProfileDto
                {
                    UserID = u.UserID,
                    Email = u.Email,
                    Name = u.Name,
                    Role = u.Role.RoleName,
                    IsApproved = u.IsApproved,
                    ApprovedAt = u.ApprovedAt,
                    ApprovedBy = u.ApprovedBy,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt,
                    CompanyName = u.CompanyName,
                    BusinessNumber = u.BusinessNumber,
                    Address = u.Address,
                    CompanyPhone = u.CompanyPhone,
                    Department = u.Department,
                    Position = u.Position,
                    PhoneNumber = u.PhoneNumber
                })
                .ToListAsync();
            return Ok(users);
        }

        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUserById(string id)
        {
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserID == id);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });
            var userProfile = new UserProfileDto
            {
                UserID = user.UserID,
                Email = user.Email,
                Name = user.Name,
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
                PhoneNumber = user.PhoneNumber
            };
            return Ok(new { user = userProfile, roles = new[]{ user.Role.RoleName } });
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserRequest model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == id);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });
            // 기본 정보 업데이트
            user.Name = model.Name;
            user.PhoneNumber = model.PhoneNumber;
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
            return Ok(new { message = "사용자 정보가 업데이트되었습니다." });
        }

        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(string id, [FromBody] UpdateRoleModel model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == id);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });
            var roleEntity = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == model.Role);
            if (roleEntity != null)
            {
                user.RoleID = roleEntity.RoleID;
            }
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { message = "사용자 역할이 업데이트되었습니다." });
        }

        [HttpPut("users/{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(string id, [FromBody] UpdateStatusModel model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == id);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });
            user.IsActive = model.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { message = "사용자 상태가 업데이트되었습니다." });
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == id);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "사용자가 삭제되었습니다." });
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var totalUsers = await _context.Users.CountAsync();
            var approvedUsers = await _context.Users.CountAsync(u => u.IsApproved);
            var pendingUsers = await _context.Users.CountAsync(u => !u.IsApproved);
            var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
            var adminUsers = await _context.Users.Where(u => u.Role.RoleName == "Admin").ToListAsync();
            var salesUsers = await _context.Users.Where(u => u.Role.RoleName == "Sales").ToListAsync();
            var customerUsers = await _context.Users.Where(u => u.Role.RoleName == "Customer").ToListAsync();
            return Ok(new
            {
                totalUsers,
                approvedUsers,
                pendingUsers,
                activeUsers,
                adminCount = adminUsers.Count,
                salesCount = salesUsers.Count,
                customerCount = customerUsers.Count
            });
        }

        // 승인 대기 중인 사용자만 조회
        [HttpGet("pending-users")]
        public async Task<IActionResult> GetPendingUsers()
        {
            var pendingUsers = await _context.Users
                .Where(u => !u.IsApproved)
                .Include(u => u.Role)
                .Select(u => new UserProfileDto
                {
                    UserID = u.UserID,
                    Email = u.Email,
                    Name = u.Name,
                    Role = u.Role.RoleName,
                    IsApproved = u.IsApproved,
                    CreatedAt = u.CreatedAt,
                    CompanyName = u.CompanyName,
                    BusinessNumber = u.BusinessNumber,
                    Address = u.Address,
                    CompanyPhone = u.CompanyPhone,
                    Department = u.Department,
                    Position = u.Position,
                    PhoneNumber = u.PhoneNumber
                })
                .ToListAsync();
            return Ok(pendingUsers);
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
    }

    public class UpdateRoleModel
    {
        public string Role { get; set; }
    }

    public class UpdateStatusModel
    {
        public bool IsActive { get; set; }
    }

    public class UpdateUserRequest
    {
        public string Name { get; set; }
        public string CompanyName { get; set; }
        public string BusinessNumber { get; set; }
        public string Address { get; set; }
        public string CompanyPhone { get; set; }
        public string Department { get; set; }
        public string Position { get; set; }
        public string PhoneNumber { get; set; }
    }
} 