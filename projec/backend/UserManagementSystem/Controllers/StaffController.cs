using Microsoft.AspNetCore.Mvc;
using UserManagementSystem.DTOs;
using UserManagementSystem.Services;

namespace UserManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StaffController : ControllerBase
    {
        private readonly IUserService _userService;

        public StaffController(IUserService userService)
        {
            _userService = userService;
        }

        // GET: api/staff
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserListResponseDto>>> GetStaff()
        {
            try
            {
                // roleID가 2인 담당자들만 조회
                var staff = await _userService.GetUsersByRoleAsync(2);
                return Ok(staff);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "담당자 목록을 가져오는 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // GET: api/staff/{userID}
        [HttpGet("{userID}")]
        public async Task<ActionResult<UserResponseDto>> GetStaff(string userID)
        {
            try
            {
                var staff = await _userService.GetUserByIdAsync(userID);
                if (staff == null)
                {
                    return NotFound(new { message = "담당자를 찾을 수 없습니다." });
                }

                // roleID가 2인 담당자 또는 1인 관리자인지 확인
                if (staff.RoleID != 2 && staff.RoleID != 1)
                {
                    return BadRequest(new { message = "해당 사용자는 담당자/관리자가 아닙니다." });
                }

                return Ok(staff);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "담당자 정보를 가져오는 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // POST: api/staff
        [HttpPost]
        public async Task<ActionResult<UserResponseDto>> CreateStaff(CreateUserDto createUserDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // 담당자는 roleID가 2이어야 함
                createUserDto.RoleID = 2;

                var staff = await _userService.CreateUserAsync(createUserDto);
                return CreatedAtAction(nameof(GetStaff), new { userID = staff.UserID }, staff);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "담당자 생성 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // PUT: api/staff/{userID}
        [HttpPut("{userID}")]
        public async Task<IActionResult> UpdateStaff(string userID, UpdateUserDto updateUserDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // 담당자는 roleID를 변경할 수 없음
                updateUserDto.RoleID = null;

                var staff = await _userService.UpdateUserAsync(userID, updateUserDto);
                if (staff == null)
                {
                    return NotFound(new { message = "담당자를 찾을 수 없습니다." });
                }

                // roleID가 2인 담당자 또는 1인 관리자인지 확인
                if (staff.RoleID != 2 && staff.RoleID != 1)
                {
                    return BadRequest(new { message = "해당 사용자는 담당자/관리자가 아닙니다." });
                }

                return Ok(staff);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "담당자 업데이트 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // DELETE: api/staff/{userID}
        [HttpDelete("{userID}")]
        public async Task<IActionResult> DeleteStaff(string userID)
        {
            try
            {
                var staff = await _userService.GetUserByIdAsync(userID);
                if (staff == null)
                {
                    return NotFound(new { message = "담당자를 찾을 수 없습니다." });
                }

                // roleID가 2인 담당자인지 확인
                if (staff.RoleID != 2)
                {
                    return BadRequest(new { message = "해당 사용자는 담당자가 아닙니다." });
                }

                var result = await _userService.DeleteUserAsync(userID);
                if (!result)
                {
                    return NotFound(new { message = "담당자를 찾을 수 없습니다." });
                }

                return Ok(new { message = "담당자가 성공적으로 삭제되었습니다." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "담당자 삭제 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // PATCH: api/staff/{userID}/deactivate
        [HttpPatch("{userID}/deactivate")]
        public async Task<IActionResult> DeactivateStaff(string userID)
        {
            try
            {
                var staff = await _userService.GetUserByIdAsync(userID);
                if (staff == null)
                {
                    return NotFound(new { message = "담당자를 찾을 수 없습니다." });
                }

                // roleID가 2인 담당자인지 확인
                if (staff.RoleID != 2)
                {
                    return BadRequest(new { message = "해당 사용자는 담당자가 아닙니다." });
                }

                var result = await _userService.DeactivateUserAsync(userID);
                if (!result)
                {
                    return NotFound(new { message = "담당자를 찾을 수 없습니다." });
                }

                return Ok(new { message = "담당자가 성공적으로 비활성화되었습니다." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "담당자 비활성화 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // PATCH: api/staff/{userID}/activate
        [HttpPatch("{userID}/activate")]
        public async Task<IActionResult> ActivateStaff(string userID)
        {
            try
            {
                var staff = await _userService.GetUserByIdAsync(userID);
                if (staff == null)
                {
                    return NotFound(new { message = "담당자를 찾을 수 없습니다." });
                }

                // roleID가 2인 담당자인지 확인
                if (staff.RoleID != 2)
                {
                    return BadRequest(new { message = "해당 사용자는 담당자가 아닙니다." });
                }

                var result = await _userService.ActivateUserAsync(userID);
                if (!result)
                {
                    return NotFound(new { message = "담당자를 찾을 수 없습니다." });
                }

                return Ok(new { message = "담당자가 성공적으로 활성화되었습니다." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "담당자 활성화 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // GET: api/staff/search?term=검색어
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<UserListResponseDto>>> SearchStaff([FromQuery] string term)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(term))
                {
                    return BadRequest(new { message = "검색어를 입력해주세요." });
                }

                var staff = await _userService.SearchUsersAsync(term);
                // roleID가 2인 담당자들만 필터링
                var filteredStaff = staff.Where(s => s.RoleName == "Sales");
                return Ok(filteredStaff);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "담당자 검색 중 오류가 발생했습니다.", error = ex.Message });
            }
        }
    }
} 