using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using FullAuthSystem.Models;

namespace FullAuthSystem.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // UserHistory DbSet 추가
        public DbSet<UserHistory> UserHistories { get; set; }

        // PasswordResetToken DbSet 추가
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // ApplicationUser 테이블 설정
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.ToTable("Users");
                entity.Property(e => e.FirstName).HasMaxLength(50);
                entity.Property(e => e.LastName).HasMaxLength(50);
                entity.Property(e => e.Role).HasMaxLength(20);
                
                // 새로 추가된 필드들 설정
                entity.Property(e => e.CompanyName).HasMaxLength(100);
                entity.Property(e => e.BusinessNumber).HasMaxLength(20);
                entity.Property(e => e.Address).HasMaxLength(200);
                entity.Property(e => e.CompanyPhone).HasMaxLength(20);
                entity.Property(e => e.Department).HasMaxLength(50);
                entity.Property(e => e.Position).HasMaxLength(50);
            });

            // UserHistory 테이블 설정
            builder.Entity<UserHistory>(entity =>
            {
                entity.ToTable("UserHistories");
                entity.Property(e => e.Title).HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Category).HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.CreatedBy).HasMaxLength(450);
                entity.Property(e => e.UpdatedBy).HasMaxLength(450);
                
                // 외래키 관계 설정
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // PasswordResetToken 테이블 설정
            builder.Entity<PasswordResetToken>(entity =>
            {
                entity.ToTable("PasswordResetTokens");
                entity.Property(e => e.Email).HasMaxLength(256);
                entity.Property(e => e.VerificationCode).HasMaxLength(6);
                entity.HasIndex(e => e.Email);
                entity.HasIndex(e => e.VerificationCode);
            });

            // 기본 역할 데이터 시드
            builder.Entity<Microsoft.AspNetCore.Identity.IdentityRole>(entity =>
            {
                entity.HasData(
                    new Microsoft.AspNetCore.Identity.IdentityRole
                    {
                        Id = "1",
                        Name = "Admin",
                        NormalizedName = "ADMIN",
                        ConcurrencyStamp = Guid.NewGuid().ToString()
                    },
                    new Microsoft.AspNetCore.Identity.IdentityRole
                    {
                        Id = "2",
                        Name = "Sales",
                        NormalizedName = "SALES",
                        ConcurrencyStamp = Guid.NewGuid().ToString()
                    },
                    new Microsoft.AspNetCore.Identity.IdentityRole
                    {
                        Id = "3",
                        Name = "Customer",
                        NormalizedName = "CUSTOMER",
                        ConcurrencyStamp = Guid.NewGuid().ToString()
                    }
                );
            });

            // 기본 관리자 사용자 시드
            builder.Entity<ApplicationUser>(entity =>
            {
                var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<ApplicationUser>();
                entity.HasData(
                    new ApplicationUser
                    {
                        Id = "1",
                        UserName = "admin@example.com",
                        NormalizedUserName = "ADMIN@EXAMPLE.COM",
                        Email = "admin@example.com",
                        NormalizedEmail = "ADMIN@EXAMPLE.COM",
                        EmailConfirmed = true,
                        PasswordHash = hasher.HashPassword(null, "Admin123!"),
                        SecurityStamp = Guid.NewGuid().ToString(),
                        ConcurrencyStamp = Guid.NewGuid().ToString(),
                        FirstName = "관리자",
                        LastName = "시스템",
                        Role = "Admin",
                        IsApproved = true, // 관리자는 승인된 상태로 생성
                        CreatedAt = DateTime.UtcNow
                    }
                );
            });

            // 사용자 역할 시드
            builder.Entity<Microsoft.AspNetCore.Identity.IdentityUserRole<string>>(entity =>
            {
                entity.HasData(
                    new Microsoft.AspNetCore.Identity.IdentityUserRole<string>
                    {
                        UserId = "1",
                        RoleId = "1"
                    }
                );
            });
        }
    }
} 