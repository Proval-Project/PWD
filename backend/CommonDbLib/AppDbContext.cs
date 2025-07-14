using Microsoft.EntityFrameworkCore;

namespace CommonDbLib
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<EstimateSheetLv1> EstimateSheetLv1s { get; set; }
        public DbSet<ItemList> ItemLists { get; set; }
        public DbSet<DataSheetLv3> DataSheetLv3s { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // 필요한 관계 설정 및 Fluent API 작성 가능
        }
    }
} 