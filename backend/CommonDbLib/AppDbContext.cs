using Microsoft.EntityFrameworkCore;

namespace CommonDbLib
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // 디자인 타임 마이그레이션용 파라미터 없는 생성자
        public AppDbContext() : base() { }

        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<EstimateSheetLv1> EstimateSheetLv1s { get; set; }
        public DbSet<ItemList> ItemLists { get; set; }
        public DbSet<DataSheetLv3> DataSheetLv3s { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // 복합키 지정
            modelBuilder.Entity<DataSheetLv3>()
                .HasKey(d => new { d.EstimateNo, d.SheetID });
            // 필요한 관계 설정 및 Fluent API 작성 가능
            modelBuilder.Entity<DataSheetLv3>()
                .HasOne(d => d.EstimateSheet)
                .WithMany()
                .HasForeignKey(d => d.EstimateNo);
            modelBuilder.Entity<DataSheetLv3>()
                .HasOne(d => d.Item)
                .WithMany()
                .HasForeignKey(d => d.ItemCode);
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseMySql(
                    "server=localhost;database=FullAuthSystemDb;user=root;CharSet=utf8mb4;",
                    new MySqlServerVersion(new Version(8, 0, 0))
                );
            }
        }
    }
} 