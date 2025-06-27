using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FullAuthSystem.Models;
using FullAuthSystem.Models.DTOs;
using FullAuthSystem.Data;

namespace FullAuthSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public AdminController(
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users
                .Select(u => new UserProfileDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = u.Role,
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
                    ContactPhone = u.PhoneNumber
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUserById(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });

            var roles = await _userManager.GetRolesAsync(user);

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

            return Ok(new { user = userProfile, roles = roles });
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserRequest model)
        {
            var user = await _userManager.FindByIdAsync(id);
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
            {
                return Ok(new { message = "사용자 정보가 업데이트되었습니다." });
            }

            return BadRequest(result.Errors);
        }

        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(string id, [FromBody] UpdateRoleModel model)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, model.Role);

            user.Role = model.Role;
            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            return Ok(new { message = "사용자 역할이 업데이트되었습니다." });
        }

        [HttpPut("users/{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(string id, [FromBody] UpdateStatusModel model)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });

            user.IsActive = model.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                return Ok(new { message = "사용자 상태가 업데이트되었습니다." });
            }

            return BadRequest(result.Errors);
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });

            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded)
                return Ok(new { message = "사용자가 삭제되었습니다." });

            return BadRequest(result.Errors);
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var totalUsers = await _userManager.Users.CountAsync();
            var approvedUsers = await _userManager.Users.CountAsync(u => u.IsApproved);
            var pendingUsers = await _userManager.Users.CountAsync(u => !u.IsApproved);
            var activeUsers = await _userManager.Users.CountAsync(u => u.IsActive);
            
            var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
            var salesUsers = await _userManager.GetUsersInRoleAsync("Sales");
            var customerUsers = await _userManager.GetUsersInRoleAsync("Customer");

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
            var pendingUsers = await _userManager.Users
                .Where(u => !u.IsApproved)
                .Select(u => new UserProfileDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = u.Role,
                    IsApproved = u.IsApproved,
                    CreatedAt = u.CreatedAt,
                    CompanyName = u.CompanyName,
                    BusinessNumber = u.BusinessNumber,
                    Address = u.Address,
                    CompanyPhone = u.CompanyPhone,
                    Department = u.Department,
                    Position = u.Position,
                    ContactPhone = u.PhoneNumber
                })
                .ToListAsync();

            return Ok(pendingUsers);
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
} 