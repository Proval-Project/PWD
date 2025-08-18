using Microsoft.AspNetCore.Mvc;
using UserManagementSystem.DTOs;
using UserManagementSystem.Services;

namespace UserManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly IUserService _userService;

        public CustomerController(IUserService userService)
        {
            _userService = userService;
        }

        // GET: api/customer
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserListResponseDto>>> GetCustomers()
        {
            try
            {
                // roleID가 3인 고객들만 조회
                var customers = await _userService.GetUsersByRoleAsync(3);
                return Ok(customers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "고객 목록을 가져오는 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // GET: api/customer/{userID}
        [HttpGet("{userID}")]
        public async Task<ActionResult<UserResponseDto>> GetCustomer(string userID)
        {
            try
            {
                var customer = await _userService.GetUserByIdAsync(userID);
                if (customer == null)
                {
                    return NotFound(new { message = "고객을 찾을 수 없습니다." });
                }

                // roleID가 3인 고객인지 확인
                if (customer.RoleID != 3)
                {
                    return BadRequest(new { message = "해당 사용자는 고객이 아닙니다." });
                }

                return Ok(customer);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "고객 정보를 가져오는 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // POST: api/customer
        [HttpPost]
        public async Task<ActionResult<UserResponseDto>> CreateCustomer(CreateUserDto createUserDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // 고객은 roleID가 3이어야 함
                createUserDto.RoleID = 3;

                var customer = await _userService.CreateUserAsync(createUserDto);
                return CreatedAtAction(nameof(GetCustomer), new { userID = customer.UserID }, customer);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "고객 생성 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // PUT: api/customer/{userID}
        [HttpPut("{userID}")]
        public async Task<IActionResult> UpdateCustomer(string userID, UpdateUserDto updateUserDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // 고객은 roleID를 변경할 수 없음
                updateUserDto.RoleID = null;

                var customer = await _userService.UpdateUserAsync(userID, updateUserDto);
                if (customer == null)
                {
                    return NotFound(new { message = "고객을 찾을 수 없습니다." });
                }

                // roleID가 3인 고객인지 확인
                if (customer.RoleID != 3)
                {
                    return BadRequest(new { message = "해당 사용자는 고객이 아닙니다." });
                }

                return Ok(customer);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "고객 업데이트 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // DELETE: api/customer/{userID}
        [HttpDelete("{userID}")]
        public async Task<IActionResult> DeleteCustomer(string userID)
        {
            try
            {
                var customer = await _userService.GetUserByIdAsync(userID);
                if (customer == null)
                {
                    return NotFound(new { message = "고객을 찾을 수 없습니다." });
                }

                // roleID가 3인 고객인지 확인
                if (customer.RoleID != 3)
                {
                    return BadRequest(new { message = "해당 사용자는 고객이 아닙니다." });
                }

                var result = await _userService.DeleteUserAsync(userID);
                if (!result)
                {
                    return NotFound(new { message = "고객을 찾을 수 없습니다." });
                }

                return Ok(new { message = "고객이 성공적으로 삭제되었습니다." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "고객 삭제 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // PATCH: api/customer/{userID}/deactivate
        [HttpPatch("{userID}/deactivate")]
        public async Task<IActionResult> DeactivateCustomer(string userID)
        {
            try
            {
                var customer = await _userService.GetUserByIdAsync(userID);
                if (customer == null)
                {
                    return NotFound(new { message = "고객을 찾을 수 없습니다." });
                }

                // roleID가 3인 고객인지 확인
                if (customer.RoleID != 3)
                {
                    return BadRequest(new { message = "해당 사용자는 고객이 아닙니다." });
                }

                var result = await _userService.DeactivateUserAsync(userID);
                if (!result)
                {
                    return NotFound(new { message = "고객을 찾을 수 없습니다." });
                }

                return Ok(new { message = "고객이 성공적으로 비활성화되었습니다." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "고객 비활성화 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // PATCH: api/customer/{userID}/activate
        [HttpPatch("{userID}/activate")]
        public async Task<IActionResult> ActivateCustomer(string userID)
        {
            try
            {
                var customer = await _userService.GetUserByIdAsync(userID);
                if (customer == null)
                {
                    return NotFound(new { message = "고객을 찾을 수 없습니다." });
                }

                // roleID가 3인 고객인지 확인
                if (customer.RoleID != 3)
                {
                    return BadRequest(new { message = "해당 사용자는 고객이 아닙니다." });
                }

                var result = await _userService.ActivateUserAsync(userID);
                if (!result)
                {
                    return NotFound(new { message = "고객을 찾을 수 없습니다." });
                }

                return Ok(new { message = "고객이 성공적으로 활성화되었습니다." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "고객 활성화 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // GET: api/customer/search?term=검색어
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<UserListResponseDto>>> SearchCustomers([FromQuery] string term)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(term))
                {
                    return BadRequest(new { message = "검색어를 입력해주세요." });
                }

                var customers = await _userService.SearchUsersAsync(term);
                // roleID가 3인 고객들만 필터링
                var filteredCustomers = customers.Where(c => c.RoleName == "Customer");
                return Ok(filteredCustomers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "고객 검색 중 오류가 발생했습니다.", error = ex.Message });
            }
        }
    }
} 