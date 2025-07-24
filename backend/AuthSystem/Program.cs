using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CommonDbLib;
using FullAuthSystem.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "FullAuthSystem API", Version = "v1" });
    
    // JWT 인증 설정 추가
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Entity Framework 설정 - MySQL 사용
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"), 
    ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))));

// 이메일 서비스 등록
builder.Services.AddScoped<IEmailService, EmailService>();

// Background Service 등록
builder.Services.AddHostedService<TokenCleanupService>();

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

// app.UseHttpsRedirection(); // 개발 환경에서는 HTTPS 리다이렉션 비활성화

// CORS 미들웨어 추가
app.UseCors("AllowAll");

// 인증 및 권한 미들웨어 추가
app.UseAuthentication();
app.UseAuthorization();

// 컨트롤러 라우팅 추가
app.MapControllers();

// 데이터베이스 마이그레이션 및 시드 데이터 생성
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        try
        {
            context.Database.Migrate();
        }
        catch (Exception migrationEx)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogWarning(migrationEx, "마이그레이션 중 오류가 발생했지만 애플리케이션을 계속 실행합니다.");
        }
        // 기본 역할 시드
        if (!context.Roles.Any())
        {
            context.Roles.AddRange(
                new Role { RoleID = 1, RoleName = "Admin", Description = "관리자", IsActive = true },
                new Role { RoleID = 2, RoleName = "Sales", Description = "영업", IsActive = true },
                new Role { RoleID = 3, RoleName = "Customer", Description = "고객", IsActive = true }
            );
            context.SaveChanges();
        }
        // ItemList 시드 (임의의 4개 아이템)
        /*
        if (!context.ItemLists.Any())
        {
            context.ItemLists.AddRange(
                new ItemList { ItemCode = "1", ItemName = "아이템1", ItemDescription = "테스트용 아이템1" },
                new ItemList { ItemCode = "2", ItemName = "아이템2", ItemDescription = "테스트용 아이템2" },
                new ItemList { ItemCode = "3", ItemName = "아이템3", ItemDescription = "테스트용 아이템3" },
                new ItemList { ItemCode = "4", ItemName = "아이템4", ItemDescription = "테스트용 아이템4" }
            );
            context.SaveChanges();
        }
        */
        // 기본 관리자 시드
        if (!context.Users.Any(u => u.Email == "admin@example.com"))
        {
            // 실제 인증 코드와 동일한 해시 생성 방식 사용
            string adminPasswordHash;
            using (var sha = System.Security.Cryptography.SHA256.Create())
            {
                var bytes = System.Text.Encoding.UTF8.GetBytes("Admin123!");
                var hash = sha.ComputeHash(bytes);
                adminPasswordHash = Convert.ToBase64String(hash);
            }
            
            context.Users.Add(new User
            {
                UserID = "admin@example.com",
                Email = "admin@example.com",
                Name = "관리자 계정",
                IsApproved = true,
                IsActive = true,
                Password = adminPasswordHash,
                CreatedAt = DateTime.UtcNow,
                RoleID = 1
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

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
