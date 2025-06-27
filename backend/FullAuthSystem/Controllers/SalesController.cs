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
    [Authorize(Roles = "Sales")]
    public class SalesController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public SalesController(
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet("customers")]
        public async Task<IActionResult> GetCustomers()
        {
            var customers = await _userManager.GetUsersInRoleAsync("Customer");
            
            var customerList = customers.Select(c => new UserProfileDto
            {
                Id = c.Id,
                Email = c.Email,
                FirstName = c.FirstName,
                LastName = c.LastName,
                IsApproved = c.IsApproved,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                CompanyName = c.CompanyName,
                BusinessNumber = c.BusinessNumber,
                Address = c.Address,
                CompanyPhone = c.CompanyPhone,
                Department = c.Department,
                Position = c.Position,
                ContactPhone = c.PhoneNumber
            }).ToList();

            return Ok(customerList);
        }

        [HttpGet("customers/{id}")]
        public async Task<IActionResult> GetCustomerById(string id)
        {
            var customer = await _userManager.FindByIdAsync(id);
            if (customer == null)
                return NotFound(new { message = "고객을 찾을 수 없습니다." });

            var roles = await _userManager.GetRolesAsync(customer);
            if (!roles.Contains("Customer"))
                return BadRequest(new { message = "해당 사용자는 고객이 아닙니다." });

            var customerProfile = new UserProfileDto
            {
                Id = customer.Id,
                Email = customer.Email,
                FirstName = customer.FirstName,
                LastName = customer.LastName,
                IsApproved = customer.IsApproved,
                IsActive = customer.IsActive,
                CreatedAt = customer.CreatedAt,
                UpdatedAt = customer.UpdatedAt,
                CompanyName = customer.CompanyName,
                BusinessNumber = customer.BusinessNumber,
                Address = customer.Address,
                CompanyPhone = customer.CompanyPhone,
                Department = customer.Department,
                Position = customer.Position,
                ContactPhone = customer.PhoneNumber
            };

            return Ok(customerProfile);
        }

        // 고객 히스토리 조회
        [HttpGet("customers/{id}/history")]
        public async Task<IActionResult> GetCustomerHistory(string id)
        {
            var customer = await _userManager.FindByIdAsync(id);
            if (customer == null)
                return NotFound(new { message = "고객을 찾을 수 없습니다." });

            var roles = await _userManager.GetRolesAsync(customer);
            if (!roles.Contains("Customer"))
                return BadRequest(new { message = "해당 사용자는 고객이 아닙니다." });

            var histories = await _context.UserHistories
                .Where(h => h.UserId == id)
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

        // 고객 히스토리 생성
        [HttpPost("customers/{id}/history")]
        public async Task<IActionResult> CreateCustomerHistory(string id, [FromBody] CreateUserHistoryRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customer = await _userManager.FindByIdAsync(id);
            if (customer == null)
                return NotFound(new { message = "고객을 찾을 수 없습니다." });

            var roles = await _userManager.GetRolesAsync(customer);
            if (!roles.Contains("Customer"))
                return BadRequest(new { message = "해당 사용자는 고객이 아닙니다." });

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var history = new UserHistory
            {
                UserId = id,
                Title = model.Title,
                Description = model.Description,
                Category = model.Category,
                Status = model.Status ?? "진행중",
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserHistories.Add(history);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCustomerHistory), new { id = customer.Id }, history);
        }

        // 고객 히스토리 수정
        [HttpPut("customers/{customerId}/history/{historyId}")]
        public async Task<IActionResult> UpdateCustomerHistory(string customerId, int historyId, [FromBody] UpdateUserHistoryRequest model)
        {
            var customer = await _userManager.FindByIdAsync(customerId);
            if (customer == null)
                return NotFound(new { message = "고객을 찾을 수 없습니다." });

            var history = await _context.UserHistories
                .FirstOrDefaultAsync(h => h.Id == historyId && h.UserId == customerId);

            if (history == null)
                return NotFound(new { message = "히스토리를 찾을 수 없습니다." });

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            history.Title = model.Title;
            history.Description = model.Description;
            history.Category = model.Category;
            history.Status = model.Status;
            history.UpdatedBy = currentUserId;
            history.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "히스토리가 업데이트되었습니다." });
        }

        // 고객 히스토리 삭제
        [HttpDelete("customers/{customerId}/history/{historyId}")]
        public async Task<IActionResult> DeleteCustomerHistory(string customerId, int historyId)
        {
            var customer = await _userManager.FindByIdAsync(customerId);
            if (customer == null)
                return NotFound(new { message = "고객을 찾을 수 없습니다." });

            var history = await _context.UserHistories
                .FirstOrDefaultAsync(h => h.Id == historyId && h.UserId == customerId);

            if (history == null)
                return NotFound(new { message = "히스토리를 찾을 수 없습니다." });

            _context.UserHistories.Remove(history);
            await _context.SaveChangesAsync();

            return Ok(new { message = "히스토리가 삭제되었습니다." });
        }

        [HttpGet("leads")]
        public async Task<IActionResult> GetLeads()
        {
            // 여기에 리드(잠재 고객) 조회 로직을 구현할 수 있습니다
            var leads = new[]
            {
                new { id = 1, name = "김철수", email = "kim@example.com", phone = "010-1234-5678", status = "신규", createdAt = DateTime.UtcNow.AddDays(-7) },
                new { id = 2, name = "이영희", email = "lee@example.com", phone = "010-9876-5432", status = "연락중", createdAt = DateTime.UtcNow.AddDays(-3) },
                new { id = 3, name = "박민수", email = "park@example.com", phone = "010-5555-1234", status = "제안완료", createdAt = DateTime.UtcNow.AddDays(-1) }
            };

            return Ok(leads);
        }

        [HttpPost("leads")]
        public async Task<IActionResult> CreateLead([FromBody] CreateLeadModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // 여기에 리드 생성 로직을 구현할 수 있습니다
            var newLead = new
            {
                id = 4,
                name = model.Name,
                email = model.Email,
                phone = model.Phone,
                status = "신규",
                createdAt = DateTime.UtcNow
            };

            return CreatedAtAction(nameof(GetLeads), new { id = newLead.id }, newLead);
        }

        [HttpPut("leads/{id}")]
        public async Task<IActionResult> UpdateLead(int id, [FromBody] UpdateLeadModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // 여기에 리드 업데이트 로직을 구현할 수 있습니다
            var updatedLead = new
            {
                id = id,
                name = model.Name,
                email = model.Email,
                phone = model.Phone,
                status = model.Status,
                updatedAt = DateTime.UtcNow
            };

            return Ok(updatedLead);
        }

        [HttpGet("sales-report")]
        public async Task<IActionResult> GetSalesReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
            var end = endDate ?? DateTime.UtcNow;

            // 여기에 매출 보고서 로직을 구현할 수 있습니다
            var report = new
            {
                period = new { start, end },
                totalSales = 15000000,
                totalOrders = 150,
                averageOrderValue = 100000,
                topProducts = new[]
                {
                    new { name = "제품 A", sales = 5000000, quantity = 50 },
                    new { name = "제품 B", sales = 3000000, quantity = 30 },
                    new { name = "제품 C", sales = 2000000, quantity = 20 }
                }
            };

            return Ok(report);
        }

        [HttpGet("performance")]
        public async Task<IActionResult> GetMyPerformance()
        {
            var salesPersonId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(salesPersonId))
                return Unauthorized();

            // 여기에 영업사원 성과 조회 로직을 구현할 수 있습니다
            var performance = new
            {
                salesPersonId,
                monthlySales = 5000000,
                monthlyOrders = 25,
                conversionRate = 0.15,
                customerSatisfaction = 4.5,
                targetAchievement = 0.95
            };

            return Ok(performance);
        }

        // 승인 대기 중인 고객만 조회
        [HttpGet("pending-customers")]
        public async Task<IActionResult> GetPendingCustomers()
        {
            var pendingCustomers = await _userManager.Users
                .Where(u => !u.IsApproved && u.Role == "Customer")
                .Select(u => new UserProfileDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
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

            return Ok(pendingCustomers);
        }
    }

    public class CreateLeadModel
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
    }

    public class UpdateLeadModel
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Status { get; set; }
    }
} 