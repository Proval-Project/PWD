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
    public async Task<ActionResult<IEnumerable<object>>> GetUsers([FromQuery] int? roleId)
    {
        IQueryable<User> query = _context.Users;

        if (roleId.HasValue)
        {
            if (roleId.Value == 2) // 직원
            {
                query = query.Where(u => u.RoleID == 3); // 외부 고객만
            }
            // 관리자(1) 등은 전체 반환
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
    public async Task<ActionResult<IEnumerable<object>>> GetEstimates()
    {
        var estimates = await _context.EstimateSheetLv1s
            .Select(e => new {
                curEstimateNo = e.CurEstimateNo,
                curEstPrice = e.CurEstPrice,
                prevEstimateNo = e.PrevEstimateNo ?? "",
                status = (int)e.Status,
                customerID = e.CustomerID,
                managerUserID = e.ManagerUserID ?? ""
            })
            .ToListAsync();
        return Ok(estimates);
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

    // DataSheetLv3(견적 상세) 입력
    [HttpPost("datasheet")]
    public async Task<IActionResult> CreateDataSheet([FromBody] DataSheetInputDto dto)
    {
        // 1. 오늘 날짜 기준 마지막 EstimateNo 찾기
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"YA{today}-";
        var last = await _context.DataSheetLv3s
            .Where(d => d.EstimateNo.StartsWith(prefix))
            .OrderByDescending(d => d.EstimateNo)
            .Select(d => d.EstimateNo)
            .FirstOrDefaultAsync();
        int nextNum = 1;
        if (!string.IsNullOrEmpty(last) && last.Length >= prefix.Length + 3)
        {
            var numStr = last.Substring(prefix.Length, 3);
            if (int.TryParse(numStr, out int n)) nextNum = n + 1;
        }
        var newEstimateNo = $"{prefix}{nextNum:D3}";

        // 2. DataSheetLv3 생성 (불필요한 컬럼 할당 제거)
        var data = new DataSheetLv3
        {
            TagNo = dto.TagNo,
            EstimateNo = newEstimateNo,
            ItemCode = dto.ItemCode,
            UnitPrice = dto.UnitPrice,
            Quantity = dto.Quantity
        };
        _context.DataSheetLv3s.Add(data);
        await _context.SaveChangesAsync();
        return Ok(new { message = "입력 완료", estimateNo = newEstimateNo, tagNo = data.TagNo });
    }

    // DataSheetLv3(견적 상세) 고객별 리스트업
    [HttpGet("datasheet")]
    public async Task<IActionResult> GetDataSheets([FromQuery] string? customerId, [FromQuery] string? estimateNo)
    {
        var query = _context.DataSheetLv3s.AsQueryable();
        if (!string.IsNullOrEmpty(customerId))
        {
            var estNos = await _context.EstimateSheetLv1s
                .Where(e => e.CustomerID == customerId)
                .Select(e => e.CurEstimateNo)
                .ToListAsync();
            query = query.Where(d => estNos.Contains(d.EstimateNo));
        }
        if (!string.IsNullOrEmpty(estimateNo))
        {
            query = query.Where(d => d.EstimateNo == estimateNo);
        }
        var list = await query
            .Select(d => new {
                d.EstimateNo,
                d.SheetID,
                d.SheetNo,
                d.TagNo,
                d.ItemCode,
                d.UnitPrice,
                d.Quantity
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpPut("datasheet/order")]
    public async Task<IActionResult> UpdateSheetNo([FromBody] List<SheetNoOrderDto> orders)
    {
        foreach (var o in orders)
        {
            var row = await _context.DataSheetLv3s.FindAsync(o.estimateNo, o.sheetID);
            if (row != null)
            {
                row.SheetNo = o.sheetNo;
                Console.WriteLine($"Updated: {row.EstimateNo}, {row.SheetID} => SheetNo={row.SheetNo}");
            }
            else
            {
                Console.WriteLine($"Not found: {o.estimateNo}, {o.sheetID}");
            }
        }
        await _context.SaveChangesAsync();
        return Ok(new { message = "순서 저장 완료" });
    }

    // DataSheetLv3 SheetNo 수정
    [HttpPut("datasheet/{sheetID}")]
    public async Task<IActionResult> UpdateSheetNo(int sheetID, [FromBody] UpdateSheetNoDto dto)
    {
        var data = await _context.DataSheetLv3s.FindAsync(sheetID);
        if (data == null) return NotFound(new { message = "해당 SheetID를 찾을 수 없습니다." });
        data.SheetNo = dto.NewSheetNo;
        await _context.SaveChangesAsync();
        return Ok(new { message = "SheetNo 수정 완료", sheetNo = data.SheetNo });
    }

    // ItemList 전체 조회
    [HttpGet("items")]
    public async Task<IActionResult> GetItems()
    {
        var items = await _context.ItemLists.ToListAsync();
        return Ok(items);
    }

    // 고객용 견적 생성: TagNo만 입력, EstimateNo는 자동 생성
    [HttpPost("customer-estimate")]
    public async Task<IActionResult> CreateCustomerEstimate([FromBody] CustomerEstimateInputDto dto)
    {
        if (dto.Items == null || dto.Items.Count == 0)
        {
            return BadRequest(new { message = "ItemCode와 TagNo를 하나 이상 입력하세요." });
        }
        // 1. 오늘 날짜 기준 마지막 EstimateNo 찾기
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"YA{today}-";
        var last = await _context.EstimateSheetLv1s
            .Where(e => e.CurEstimateNo.StartsWith(prefix))
            .OrderByDescending(e => e.CurEstimateNo)
            .Select(e => e.CurEstimateNo)
            .FirstOrDefaultAsync();
        int nextNum = 1;
        if (!string.IsNullOrEmpty(last) && last.Length >= prefix.Length + 3)
        {
            var numStr = last.Substring(prefix.Length, 3);
            if (int.TryParse(numStr, out int n)) nextNum = n + 1;
        }
        var newEstimateNo = $"{prefix}{nextNum:D3}";

        // 2. 견적서(EstimateSheetLv1) 생성 (한 번만)
        var est = new EstimateSheetLv1
        {
            CurEstimateNo = newEstimateNo,
            CurEstPrice = 0, // 고객 입력 시 가격은 0 또는 null로 시작
            PrevEstimateNo = null,
            Status = EstimateStatus.EstimateInput,
            CustomerID = dto.CustomerID,
            ManagerUserID = null // 담당자 미지정
        };
        _context.EstimateSheetLv1s.Add(est);

        // 3. DataSheetLv3(상세) 여러 ItemCode/TagNo로 생성 (SheetID는 row 고유, SheetNo는 최초 순서만 할당)
        int sheetID = 0;
        foreach (var item in dto.Items)
        {
            sheetID++;
            var data = new DataSheetLv3
            {
                TagNo = item.TagNo,
                ItemCode = item.ItemCode,
                EstimateNo = newEstimateNo,
                SheetID = sheetID, // 1부터 순차적으로 할당(불변)
                SheetNo = sheetID,  // 최초 생성 시에만 순서로 할당, 이후에는 순서 변경 API로만 바뀜
                UnitPrice = 0,
                Quantity = 0
            };
            _context.DataSheetLv3s.Add(data);
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "견적 생성 완료", estimateNo = newEstimateNo, items = dto.Items });
    }

    // 특정 견적번호의 TagNo 리스트 조회
    [HttpGet("estimates/{estimateNo}/tags")]
    public async Task<IActionResult> GetTagsByEstimateNo(string estimateNo)
    {
        var tags = await _context.DataSheetLv3s
            .Where(d => d.EstimateNo == estimateNo)
            .Select(d => d.TagNo)
            .ToListAsync();
        return Ok(tags);
    }
}

// DTOs
public class DataSheetInputDto
{
    public string TagNo { get; set; }
    public string ItemCode { get; set; }
    public int UnitPrice { get; set; }
    public int Quantity { get; set; }
}
public class UpdateSheetNoDto
{
    public int NewSheetNo { get; set; }
}
public class CustomerEstimateItemDto
{
    public string TagNo { get; set; }
    public string ItemCode { get; set; }
}
public class CustomerEstimateInputDto
{
    public List<CustomerEstimateItemDto> Items { get; set; } = new List<CustomerEstimateItemDto>();
    public string CustomerID { get; set; }
} 

public class SheetNoOrderDto
{
    public string estimateNo { get; set; }
    public int sheetID { get; set; }
    public int sheetNo { get; set; }
} 