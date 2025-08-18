using Microsoft.EntityFrameworkCore;
using UserManagementSystem.Models;

namespace UserManagementSystem.Data
{
    public class UserManagementDbContext : DbContext
    {
        public UserManagementDbContext(DbContextOptions<UserManagementDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User 엔티티 설정
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("User");
                entity.HasKey(e => e.UserID);
                entity.Property(e => e.UserID).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Password).IsRequired().HasMaxLength(255);
                entity.Property(e => e.CompanyName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.CompanyPhone).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Position).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Department).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.BusinessNumber).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Address).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(255);
                
                // Unique constraints
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.PhoneNumber).IsUnique();
                
                // Foreign key relationship
                entity.HasOne(e => e.Role)
                      .WithMany(e => e.Users)
                      .HasForeignKey(e => e.RoleID)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Role 엔티티 설정
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("Role");
                entity.HasKey(e => e.RoleID);
                entity.Property(e => e.RoleName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).HasMaxLength(255);
            });
        }
    }
} 