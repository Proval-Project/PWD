using Microsoft.AspNetCore.Mvc;
using UserManagementSystem.DTOs;
using UserManagementSystem.Services;

namespace UserManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        // GET: api/user
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserListResponseDto>>> GetUsers()
        {
            try
            {
                var users = await _userService.GetAllUsersAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "사용자 목록을 가져오는 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // GET: api/user/{userID}
        [HttpGet("{userID}")]
        public async Task<ActionResult<UserResponseDto>> GetUser(string userID)
        {
            try
            {
                var user = await _userService.GetUserByIdAsync(userID);
                if (user == null)
                {
                    return NotFound(new { message = "사용자를 찾을 수 없습니다." });
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "사용자 정보를 가져오는 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // GET: api/user/userid/{userID}
        [HttpGet("userid/{userID}")]
        public async Task<ActionResult<UserResponseDto>> GetUserByUserID(string userID)
        {
            try
            {
                var user = await _userService.GetUserByUserIDAsync(userID);
                if (user == null)
                {
                    return NotFound(new { message = "사용자를 찾을 수 없습니다." });
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "사용자 정보를 가져오는 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // POST: api/user
        [HttpPost]
        public async Task<ActionResult<UserResponseDto>> CreateUser(CreateUserDto createUserDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = await _userService.CreateUserAsync(createUserDto);
                return CreatedAtAction(nameof(GetUser), new { userID = user.UserID }, user);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "사용자 생성 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // PUT: api/user/{userID}
        [HttpPut("{userID}")]
        public async Task<IActionResult> UpdateUser(string userID, UpdateUserDto updateUserDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = await _userService.UpdateUserAsync(userID, updateUserDto);
                if (user == null)
                {
                    return NotFound(new { message = "사용자를 찾을 수 없습니다." });
                }

                return Ok(user);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "사용자 업데이트 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // DELETE: api/user/{userID}
        [HttpDelete("{userID}")]
        public async Task<IActionResult> DeleteUser(string userID)
        {
            try
            {
                var result = await _userService.DeleteUserAsync(userID);
                if (!result)
                {
                    return NotFound(new { message = "사용자를 찾을 수 없습니다." });
                }

                return Ok(new { message = "사용자가 성공적으로 삭제되었습니다." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "사용자 삭제 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // PATCH: api/user/{userID}/deactivate
        [HttpPatch("{userID}/deactivate")]
        public async Task<IActionResult> DeactivateUser(string userID)
        {
            try
            {
                var result = await _userService.DeactivateUserAsync(userID);
                if (!result)
                {
                    return NotFound(new { message = "사용자를 찾을 수 없습니다." });
                }

                return Ok(new { message = "사용자가 성공적으로 비활성화되었습니다." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "사용자 비활성화 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // PATCH: api/user/{userID}/activate
        [HttpPatch("{userID}/activate")]
        public async Task<IActionResult> ActivateUser(string userID)
        {
            try
            {
                var result = await _userService.ActivateUserAsync(userID);
                if (!result)
                {
                    return NotFound(new { message = "사용자를 찾을 수 없습니다." });
                }

                return Ok(new { message = "사용자가 성공적으로 활성화되었습니다." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "사용자 활성화 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // GET: api/user/role/5
        [HttpGet("role/{roleId}")]
        public async Task<ActionResult<IEnumerable<UserListResponseDto>>> GetUsersByRole(int roleId)
        {
            try
            {
                var users = await _userService.GetUsersByRoleAsync(roleId);
                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "역할별 사용자 목록을 가져오는 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // GET: api/user/search?term=검색어
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<UserListResponseDto>>> SearchUsers([FromQuery] string term)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(term))
                {
                    return BadRequest(new { message = "검색어를 입력해주세요." });
                }

                var users = await _userService.SearchUsersAsync(term);
                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "사용자 검색 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // POST: api/user/{userID}/change-password
        [HttpPost("{userID}/change-password")]
        public async Task<IActionResult> ChangePassword(string userID, [FromBody] ChangePasswordDto changePasswordDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _userService.ChangePasswordAsync(userID, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);
                if (!result)
                {
                    return BadRequest(new { message = "현재 비밀번호가 올바르지 않거나 사용자를 찾을 수 없습니다." });
                }

                return Ok(new { message = "비밀번호가 성공적으로 변경되었습니다." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "비밀번호 변경 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // GET: api/user/check-userid/{userID}
        [HttpGet("check-userid/{userID}")]
        public async Task<ActionResult<bool>> CheckUserIDExists(string userID)
        {
            try
            {
                var exists = await _userService.IsUserIDExistsAsync(userID);
                return Ok(exists);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "사용자 ID 확인 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // GET: api/user/check-email/{email}
        [HttpGet("check-email/{email}")]
        public async Task<ActionResult<bool>> CheckEmailExists(string email)
        {
            try
            {
                var exists = await _userService.IsEmailExistsAsync(email);
                return Ok(exists);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "이메일 확인 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // GET: api/user/pending-approvals
        [HttpGet("pending-approvals")]
        public async Task<ActionResult<IEnumerable<UserListResponseDto>>> GetPendingApprovals()
        {
            try
            {
                var pendingUsers = await _userService.GetUsersByApprovalStatusAsync(false);
                return Ok(pendingUsers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "승인 대기 사용자 목록을 가져오는 중 오류가 발생했습니다.", error = ex.Message });
            }
        }

        // PATCH: api/user/{userID}/approve
        [HttpPatch("{userID}/approve")]
        public async Task<IActionResult> ApproveUser(string userID)
        {
            try
            {
                var success = await _userService.ApproveUserAsync(userID);
                if (!success)
                {
                    return NotFound(new { message = "사용자를 찾을 수 없습니다." });
                }

                return Ok(new { message = "사용자가 성공적으로 승인되었습니다." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "사용자 승인 중 오류가 발생했습니다.", error = ex.Message });
            }
        }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
} 