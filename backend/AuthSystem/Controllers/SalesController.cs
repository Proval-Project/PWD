using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CommonDbLib;
using FullAuthSystem.Models.DTOs;
using System.Security.Claims;

namespace FullAuthSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Sales")]
    public class SalesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SalesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("customers")]
        public async Task<IActionResult> GetCustomers()
        {
            var customers = await _context.Users
                .Where(u => u.Role.RoleName == "Customer")
                .Select(c => new UserProfileDto
                {
                    UserID = c.UserID,
                    Email = c.Email,
                    Name = c.Name,
                    IsApproved = c.IsApproved,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    CompanyName = c.CompanyName,
                    BusinessNumber = c.BusinessNumber,
                    Address = c.Address,
                    CompanyPhone = c.CompanyPhone,
                    Department = c.Department,
                    Position = c.Position,
                    PhoneNumber = c.PhoneNumber
                }).ToListAsync();
            return Ok(customers);
        }

        [HttpGet("customers/{id}")]
        public async Task<IActionResult> GetCustomerById(string id)
        {
            var customer = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserID == id && u.Role.RoleName == "Customer");
            if (customer == null)
                return NotFound(new { message = "고객을 찾을 수 없습니다." });
            var customerProfile = new UserProfileDto
            {
                UserID = customer.UserID,
                Email = customer.Email,
                Name = customer.Name,
                IsApproved = customer.IsApproved,
                IsActive = customer.IsActive,
                CreatedAt = customer.CreatedAt,
                CompanyName = customer.CompanyName,
                BusinessNumber = customer.BusinessNumber,
                Address = customer.Address,
                CompanyPhone = customer.CompanyPhone,
                Department = customer.Department,
                Position = customer.Position,
                PhoneNumber = customer.PhoneNumber
            };
            return Ok(customerProfile);
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
            var pendingCustomers = await _context.Users
                .Where(u => !u.IsApproved && u.Role.RoleName == "Customer")
                .Select(u => new UserProfileDto
                {
                    UserID = u.UserID,
                    Email = u.Email,
                    Name = u.Name,
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