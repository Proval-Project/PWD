using Microsoft.AspNetCore.Mvc;
using FullAuthSystem.Models;
using FullAuthSystem.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using System.Security.Cryptography;
using FullAuthSystem.Services;
using Microsoft.Extensions.DependencyInjection;

namespace FullAuthSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // 비밀번호 해시 함수
        private string HashPassword(string password)
        {
            using (var sha = SHA256.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(password);
                var hash = sha.ComputeHash(bytes);
                return Convert.ToBase64String(hash);
            }
        }

        // 로그인
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == model.UserID);
            if (user == null)
                return BadRequest(new { message = "아이디 또는 비밀번호가 잘못되었습니다." });

            if (!user.IsApproved)
                return Unauthorized(new { message = "관리자 승인이 필요한 계정입니다." });

            if (HashPassword(model.Password) != user.Password)
                return BadRequest(new { message = "아이디 또는 비밀번호가 잘못되었습니다." });

            var userRole = await _context.Roles.FindAsync(user.RoleID);
            var roles = new List<string> { userRole?.RoleName ?? "" };
            var token = GenerateJwtToken(user, roles);

            return Ok(new
            {
                message = "로그인 성공",
                token = token,
                user = new
                {
                    userId = user.UserID,
                    email = user.Email,
                    name = user.Name,
                    roleId = user.RoleID,
                    roleName = userRole?.RoleName,
                    roles = roles,
                    isApproved = user.IsApproved
                }
            });
        }

        // 회원가입
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // 아이디 중복 확인
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.UserID == model.UserID);
            if (existingUser != null)
                return BadRequest(new { message = "이미 등록된 아이디입니다." });

            // 이메일 중복 확인
            var existingEmail = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (existingEmail != null)
                return BadRequest(new { message = "이미 등록된 이메일입니다." });

            var user = new User
            {
                UserID = model.UserID,
                Name = model.Name,
                Email = model.Email,
                RoleID = model.RoleID,
                IsApproved = false,
                Password = HashPassword(model.Password),
                CompanyName = model.CompanyName,
                BusinessNumber = model.BusinessNumber,
                Address = model.Address,
                CompanyPhone = model.CompanyPhone,
                Department = model.Department,
                Position = model.Position,
                PhoneNumber = model.PhoneNumber
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다." });
        }

        // 역할 목록 조회
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .Select(r => new
                {
                    roleId = r.RoleID,
                    roleName = r.RoleName,
                    description = r.Description
                })
                .ToListAsync();

            return Ok(new { success = true, roles = roles });
        }

        // 아이디 찾기 (이메일로 아이디 전송)
        [HttpPost("find-id")]
        public async Task<IActionResult> FindId([FromBody] FindIdRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (user == null)
                return BadRequest(new { message = "해당 이메일로 등록된 계정이 없습니다." });

            // 이메일 서비스를 통해 아이디 정보 전송
            var emailService = HttpContext.RequestServices.GetRequiredService<IEmailService>();
            var emailSent = await emailService.SendIdInfoEmailAsync(model.Email, user.UserID);

            if (emailSent)
            {
                return Ok(new { message = $"아이디가 {model.Email}로 전송되었습니다.", userID = user.UserID });
            }
            else
            {
                return StatusCode(500, new { message = "이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요." });
            }
        }

        // 비밀번호 찾기 (인증 코드 전송)
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (user == null)
                return BadRequest(new { message = "해당 이메일로 등록된 계정이 없습니다." });

            // 6자리 인증 코드 생성
            var verificationCode = GenerateVerificationCode();
            var expiresAt = DateTime.UtcNow.AddMinutes(5); // 5분 유효

            // 기존 토큰이 있으면 삭제
            var existingToken = await _context.PasswordResetTokens
                .FirstOrDefaultAsync(t => t.Email == model.Email);
            if (existingToken != null)
            {
                _context.PasswordResetTokens.Remove(existingToken);
            }

            // 새 토큰 생성
            var resetToken = new PasswordResetToken
            {
                Email = model.Email,
                VerificationCode = verificationCode,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = expiresAt,
                IsUsed = false
            };

            await _context.PasswordResetTokens.AddAsync(resetToken);
            await _context.SaveChangesAsync();

            // 이메일로 인증 코드 전송
            var emailService = HttpContext.RequestServices.GetRequiredService<IEmailService>();
            var emailSent = await emailService.SendPasswordResetEmailAsync(model.Email, verificationCode);

            if (emailSent)
            {
                return Ok(new { message = $"인증 코드가 {model.Email}로 전송되었습니다. 5분 내에 인증 코드를 입력해주세요." });
            }
            else
            {
                return StatusCode(500, new { message = "이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요." });
            }
        }

        // 비밀번호 재설정
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (model.NewPassword != model.ConfirmPassword)
                return BadRequest(new { message = "새 비밀번호와 확인 비밀번호가 일치하지 않습니다." });

            // 인증 코드 확인
            var resetToken = await _context.PasswordResetTokens
                .FirstOrDefaultAsync(t => t.Email == model.Email && t.VerificationCode == model.VerificationCode);

            if (resetToken == null)
                return BadRequest(new { message = "잘못된 인증 코드입니다." });

            if (!resetToken.IsValid())
                return BadRequest(new { message = "인증 코드가 만료되었습니다. 다시 요청해주세요." });

            // 사용자 찾기
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (user == null)
                return BadRequest(new { message = "해당 이메일로 등록된 계정이 없습니다." });

            // 비밀번호 업데이트
            user.Password = HashPassword(model.NewPassword);
            await _context.SaveChangesAsync();

            // 토큰 사용 처리
            resetToken.MarkAsUsed();
            await _context.SaveChangesAsync();

            return Ok(new { message = "비밀번호가 성공적으로 재설정되었습니다." });
        }

        // 인증 코드 생성
        private string GenerateVerificationCode()
        {
            var random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        // JWT 토큰 생성
        private string GenerateJwtToken(User user, IList<string> roles)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "YourSuperSecretKeyHere12345678901234567890");
            
            var userRole = _context.Roles.Find(user.RoleID);
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserID),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("Name", user.Name),
                new Claim("RoleID", user.RoleID.ToString()),
                new Claim("RoleName", userRole?.RoleName ?? ""),
                new Claim("IsApproved", user.IsApproved.ToString())
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(60),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public class LoginModel
        {
            public string UserID { get; set; } = "";
            public string Password { get; set; } = "";
        }

        public class RegisterRequest
        {
            public string UserID { get; set; } = "";
            public string Name { get; set; } = "";
            public string Email { get; set; } = "";
            public string Password { get; set; } = "";
            public int RoleID { get; set; }
            public string CompanyName { get; set; } = "";
            public string BusinessNumber { get; set; } = "";
            public string Address { get; set; } = "";
            public string CompanyPhone { get; set; } = "";
            public string Department { get; set; } = "";
            public string Position { get; set; } = "";
            public string PhoneNumber { get; set; } = "";
        }

        public class FindIdRequest
        {
            public string Email { get; set; } = "";
        }

        public class ForgotPasswordRequest
        {
            public string Email { get; set; } = "";
        }

        public class ResetPasswordRequest
        {
            public string Email { get; set; } = "";
            public string VerificationCode { get; set; } = "";
            public string NewPassword { get; set; } = "";
            public string ConfirmPassword { get; set; } = "";
        }
    }
} 