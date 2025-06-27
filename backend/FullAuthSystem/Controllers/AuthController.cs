using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using FullAuthSystem.Models;
using FullAuthSystem.Models.DTOs;
using FullAuthSystem.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using FullAuthSystem.Services;
using Microsoft.Extensions.Logging;

namespace FullAuthSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ApplicationDbContext context,
            IConfiguration configuration,
            IEmailService emailService,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // 이메일 중복 확인
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
                return BadRequest(new { message = "이미 등록된 이메일입니다." });

            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName,
                Role = model.Role,
                IsApproved = false, // 승인 대기 상태로 생성
                
                // 기업정보
                CompanyName = model.CompanyName,
                BusinessNumber = model.BusinessNumber,
                Address = model.Address,
                CompanyPhone = model.CompanyPhone,
                
                // 담당자정보
                Department = model.Department,
                Position = model.Position,
                PhoneNumber = model.ContactPhone
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, model.Role);
                return Ok(new { 
                    message = "회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.",
                    userId = user.Id
                });
            }

            return BadRequest(result.Errors);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return Unauthorized(new { message = "잘못된 이메일 또는 비밀번호입니다." });

            // 승인되지 않은 사용자는 로그인 불가
            if (!user.IsApproved)
                return Unauthorized(new { message = "관리자 승인이 필요한 계정입니다. 승인 후 로그인이 가능합니다." });

            // 비활성화된 사용자는 로그인 불가
            if (!user.IsActive)
                return Unauthorized(new { message = "비활성화된 계정입니다. 관리자에게 문의하세요." });

            var result = await _signInManager.PasswordSignInAsync(
                model.Email, model.Password, model.RememberMe, false);

            if (result.Succeeded)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var token = GenerateJwtToken(user, roles);
                
                return Ok(new
                {
                    message = "로그인 성공",
                    token = token,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        role = user.Role,
                        roles = roles,
                        isApproved = user.IsApproved
                    }
                });
            }

            return Unauthorized(new { message = "잘못된 이메일 또는 비밀번호입니다." });
        }

        [HttpPost("logout")]
        [Authorize] // 인증 토큰 필요
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "인증되지 않은 사용자입니다." });

            await _signInManager.SignOutAsync();
            
            return Ok(new { 
                message = "로그아웃되었습니다.",
                userId = userId,
                logoutTime = DateTime.UtcNow
            });
        }

        // 로그아웃 상태 확인
        [HttpGet("logout-status")]
        public async Task<IActionResult> GetLogoutStatus()
        {
            // 디버깅: 모든 클레임 출력
            var allClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            var userRole = User.FindFirst("Role")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Ok(new { 
                    isLoggedIn = false,
                    message = "로그인되지 않은 상태입니다.",
                    debug = new {
                        allClaims = allClaims,
                        hasUserId = !string.IsNullOrEmpty(userId),
                        hasUserEmail = !string.IsNullOrEmpty(userEmail),
                        hasUserRole = !string.IsNullOrEmpty(userRole)
                    }
                });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return Ok(new { 
                    isLoggedIn = false,
                    message = "사용자를 찾을 수 없습니다.",
                    debug = new {
                        userId = userId,
                        allClaims = allClaims
                    }
                });
            }

            return Ok(new { 
                isLoggedIn = true,
                userId = userId,
                email = user.Email,
                role = user.Role,
                debug = new {
                    allClaims = allClaims
                }
            });
        }

        // 승인 대기 중인 사용자 목록 조회 (관리자만)
        [HttpGet("pending-users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingUsers()
        {
            var pendingUsers = await _context.Users
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

        // 사용자 승인 (관리자만)
        [HttpPost("approve-user/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveUser(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });

            if (user.IsApproved)
                return BadRequest(new { message = "이미 승인된 사용자입니다." });

            user.IsApproved = true;
            user.ApprovedAt = DateTime.UtcNow;
            user.ApprovedBy = User.Identity?.Name ?? "Admin";

            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                return Ok(new { message = "사용자가 승인되었습니다." });
            }

            return BadRequest(result.Errors);
        }

        // 사용자 거부 (관리자만)
        [HttpPost("reject-user/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectUser(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "사용자를 찾을 수 없습니다." });

            if (user.IsApproved)
                return BadRequest(new { message = "이미 승인된 사용자는 거부할 수 없습니다." });

            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded)
            {
                return Ok(new { message = "사용자가 거부되었습니다." });
            }

            return BadRequest(result.Errors);
        }

        // 비밀번호 재설정 요청 (1단계: 이메일 입력)
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);
            
            // 사용자가 존재하지 않는 경우에도 이메일 발송 (보안상 실제 발송하지 않지만 로그는 출력)
            if (user == null)
            {
                _logger.LogInformation("존재하지 않는 이메일로 비밀번호 재설정 요청: {Email}", model.Email);
                // 테스트를 위해 실제로 이메일 발송 시도
                var randomForUnknown = new Random();
                var verificationCodeForUnknown = randomForUnknown.Next(100000, 999999).ToString();
                var emailSentForUnknown = await _emailService.SendPasswordResetEmailAsync(model.Email, verificationCodeForUnknown);
                return Ok(new ForgotPasswordResponse
                {
                    Success = true,
                    Message = "비밀번호 재설정 이메일이 전송되었습니다.",
                    Email = model.Email
                });
            }

            // 승인되지 않은 사용자는 비밀번호 재설정 불가
            if (!user.IsApproved)
                return BadRequest(new { message = "승인되지 않은 계정입니다. 관리자에게 문의하세요." });

            // 비활성화된 사용자는 비밀번호 재설정 불가
            if (!user.IsActive)
                return BadRequest(new { message = "비활성화된 계정입니다. 관리자에게 문의하세요." });

            // 기존 토큰이 있으면 만료 처리
            var existingTokens = await _context.PasswordResetTokens
                .Where(t => t.Email == model.Email && !t.IsUsed)
                .ToListAsync();

            foreach (var token in existingTokens)
            {
                token.MarkAsUsed();
            }

            // 새로운 인증 코드 생성 (6자리 숫자)
            var random = new Random();
            var verificationCode = random.Next(100000, 999999).ToString();

            // 토큰 저장
            var resetToken = new PasswordResetToken
            {
                Email = model.Email,
                VerificationCode = verificationCode,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5) // 5분 유효
            };

            _context.PasswordResetTokens.Add(resetToken);
            await _context.SaveChangesAsync();

            // 이메일 전송
            var emailSent = await _emailService.SendPasswordResetEmailAsync(model.Email, verificationCode);

            if (emailSent)
            {
                return Ok(new ForgotPasswordResponse
                {
                    Success = true,
                    Message = "비밀번호 재설정 이메일이 전송되었습니다.",
                    Email = model.Email
                });
            }
            else
            {
                return BadRequest(new { message = "이메일 전송에 실패했습니다. 다시 시도해 주세요." });
            }
        }

        // 인증 코드 확인 (2단계: 인증 코드 입력)
        [HttpPost("verify-reset-code")]
        public async Task<IActionResult> VerifyResetCode([FromBody] VerifyResetCodeRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var token = await _context.PasswordResetTokens
                .Where(t => t.Email == model.Email && t.VerificationCode == model.VerificationCode)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (token == null || !token.IsValid())
            {
                return BadRequest(new VerifyResetCodeResponse
                {
                    Success = false,
                    Message = "유효하지 않은 인증 코드입니다.",
                    IsValid = false
                });
            }

            return Ok(new VerifyResetCodeResponse
            {
                Success = true,
                Message = "인증 코드가 확인되었습니다.",
                IsValid = true
            });
        }

        // 비밀번호 재설정 (3단계: 새 비밀번호 설정)
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return BadRequest(new { message = "사용자를 찾을 수 없습니다." });

            var token = await _context.PasswordResetTokens
                .Where(t => t.Email == model.Email && t.VerificationCode == model.VerificationCode)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (token == null || !token.IsValid())
            {
                return BadRequest(new ResetPasswordResponse
                {
                    Success = false,
                    Message = "유효하지 않은 인증 코드입니다."
                });
            }

            // 새 비밀번호 설정
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, resetToken, model.NewPassword);

            if (result.Succeeded)
            {
                // 토큰을 사용됨으로 표시
                token.MarkAsUsed();
                await _context.SaveChangesAsync();

                return Ok(new ResetPasswordResponse
                {
                    Success = true,
                    Message = "비밀번호가 성공적으로 재설정되었습니다."
                });
            }
            else
            {
                return BadRequest(new ResetPasswordResponse
                {
                    Success = false,
                    Message = "비밀번호 재설정에 실패했습니다: " + string.Join(", ", result.Errors.Select(e => e.Description))
                });
            }
        }

        private string GenerateJwtToken(ApplicationUser user, IList<string> roles)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "YourSuperSecretKeyHere12345678901234567890");
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim("FirstName", user.FirstName),
                new Claim("LastName", user.LastName),
                new Claim("Role", user.Role),
                new Claim("IsApproved", user.IsApproved.ToString())
            };

            // 역할 클레임 추가
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(Convert.ToDouble(jwtSettings["ExpirationInMinutes"] ?? "60")),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }

    public class LoginModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public bool RememberMe { get; set; }
    }
} 