using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FullAuthSystem.Services;
using FullAuthSystem.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Entity Framework 설정 - MySQL 사용
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"), 
    ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))));

// 이메일 서비스 등록
builder.Services.AddScoped<IEmailService, EmailService>();

// JWT 인증 설정
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "YourSuperSecretKeyHere12345678901234567890");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// CORS 설정
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS 미들웨어 추가
app.UseCors("AllowAll");

// 인증 및 권한 미들웨어 추가
app.UseAuthentication();
app.UseAuthorization();

// 컨트롤러 라우팅 추가
app.MapControllers();

// 데이터베이스 초기화
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        
        // 데이터베이스 생성
        context.Database.EnsureCreated();
        
        // 기본 역할 시드
        if (!context.Roles.Any())
        {
            context.Roles.AddRange(
                new FullAuthSystem.Models.Role { RoleID = 1, RoleName = "Admin", Description = "관리자" },
                new FullAuthSystem.Models.Role { RoleID = 2, RoleName = "Sales", Description = "영업" },
                new FullAuthSystem.Models.Role { RoleID = 3, RoleName = "Customer", Description = "고객" }
            );
            context.SaveChanges();
        }
        
        // 기본 관리자 시드 - 이미 존재하는 경우 건너뛰기
        if (!context.Users.Any(u => u.Email == "admin@example.com") && !context.Users.Any(u => u.PhoneNumber == "010-1234-5678"))
        {
            // AuthController와 동일한 해시 방식 사용
            string adminPasswordHash;
            using (var sha = System.Security.Cryptography.SHA256.Create())
            {
                var bytes = System.Text.Encoding.UTF8.GetBytes("Admin123!");
                var hash = sha.ComputeHash(bytes);
                adminPasswordHash = Convert.ToBase64String(hash);
            }
            
            context.Users.Add(new FullAuthSystem.Models.User
            {
                UserID = "admin@example.com",
                Email = "admin@example.com",
                Name = "관리자 계정",
                IsApproved = true,
                Password = adminPasswordHash,
                RoleID = 1,
                CompanyName = "관리자회사",
                CompanyPhone = "010-1234-5678",
                Position = "관리자",
                Department = "관리부",
                BusinessNumber = "123-45-67890",
                Address = "서울시 강남구",
                PhoneNumber = "010-1234-5678"
            });
            context.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "데이터베이스 초기화 중 오류가 발생했습니다.");
    }
}

app.Run();
