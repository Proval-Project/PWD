using Microsoft.EntityFrameworkCore;
using EstimateRequestSystem.Models;

namespace EstimateRequestSystem.Data
{
    public class EstimateRequestDbContext : DbContext
    {
        public EstimateRequestDbContext(DbContextOptions<EstimateRequestDbContext> options) : base(options)
        {
        }

        public DbSet<EstimateSheetLv1> EstimateSheetLv1 { get; set; }
        public DbSet<EstimateRequest> EstimateRequest { get; set; }
        public DbSet<EstimateAttachment> EstimateAttachment { get; set; }
        public DbSet<DataSheetLv3> DataSheetLv3 { get; set; }
        public DbSet<User> User { get; set; }
        public DbSet<Role> Role { get; set; }
        public DbSet<BodyValveList> BodyValveList { get; set; }
        public DbSet<BodyBonnetList> BodyBonnetList { get; set; }
        public DbSet<BodyMatList> BodyMatList { get; set; }
        public DbSet<BodySizeList> BodySizeList { get; set; }
        public DbSet<BodyRatingList> BodyRatingList { get; set; }
        public DbSet<BodyConnectionList> BodyConnectionList { get; set; }
        public DbSet<TrimTypeList> TrimTypeList { get; set; }
        public DbSet<TrimMatList> TrimMatList { get; set; }
        public DbSet<TrimOptionList> TrimOptionList { get; set; }
        public DbSet<ActHWList> ActHWList { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // EstimateSheetLv1
            modelBuilder.Entity<EstimateSheetLv1>(entity =>
            {
                entity.ToTable("EstimateSheetLv1");
                entity.HasKey(e => e.TempEstimateNo);
                entity.Property(e => e.TempEstimateNo).HasMaxLength(255);
                entity.Property(e => e.CurEstimateNo).HasMaxLength(255);
                entity.Property(e => e.PrevEstimateNo).HasMaxLength(255);
                entity.Property(e => e.CustomerID).HasMaxLength(255);
                entity.Property(e => e.WriterID).HasMaxLength(255);
                entity.Property(e => e.ManagerID).HasMaxLength(255);
                entity.Property(e => e.Project).HasMaxLength(255);
                entity.Property(e => e.CustomerRequirement).HasColumnType("TEXT");
                entity.Property(e => e.StaffComment).HasColumnType("TEXT");

                // Foreign keys
                entity.HasOne(e => e.Customer)
                    .WithMany(u => u.CustomerEstimates)
                    .HasForeignKey(e => e.CustomerID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Writer)
                    .WithMany(u => u.WriterEstimates)
                    .HasForeignKey(e => e.WriterID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Manager)
                    .WithMany(u => u.ManagerEstimates)
                    .HasForeignKey(e => e.ManagerID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // EstimateRequest
            modelBuilder.Entity<EstimateRequest>(entity =>
            {
                entity.ToTable("EstimateRequest");
                entity.HasKey(e => new { e.TempEstimateNo, e.SheetID });
                entity.Property(e => e.TempEstimateNo).HasMaxLength(255);
                entity.Property(e => e.EstimateNo).HasMaxLength(255);
                entity.Property(e => e.Tagno).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Medium).HasMaxLength(255);
                entity.Property(e => e.Fluid).HasMaxLength(255);
                entity.Property(e => e.QMUnit).HasMaxLength(255);
                entity.Property(e => e.QNUnit).HasMaxLength(255);
                entity.Property(e => e.PressureUnit).HasMaxLength(255);
                entity.Property(e => e.TemperatureUnit).HasMaxLength(255);
                entity.Property(e => e.DensityUnit).HasMaxLength(255);
                entity.Property(e => e.MolecularWeightUnit).HasMaxLength(255);
                entity.Property(e => e.BodySizeUnit).HasMaxLength(255);
                entity.Property(e => e.BodySize).HasMaxLength(255);
                entity.Property(e => e.TrimOption).HasMaxLength(255);
                entity.Property(e => e.PositionerType).HasMaxLength(255);
                entity.Property(e => e.ExplosionProof).HasMaxLength(255);

                // Foreign key
                entity.HasOne(e => e.EstimateSheet)
                    .WithMany(es => es.EstimateRequests)
                    .HasForeignKey(e => e.TempEstimateNo)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // EstimateAttachment
            modelBuilder.Entity<EstimateAttachment>(entity =>
            {
                entity.ToTable("EstimateAttachment");
                entity.HasKey(e => e.AttachmentID);
                entity.Property(e => e.TempEstimateNo).HasMaxLength(255).IsRequired();
                entity.Property(e => e.FileName).HasMaxLength(255).IsRequired();
                entity.Property(e => e.FilePath).HasMaxLength(500).IsRequired();
                entity.Property(e => e.UploadUserID).HasMaxLength(255);

                // Foreign keys
                entity.HasOne(e => e.EstimateSheet)
                    .WithMany(es => es.Attachments)
                    .HasForeignKey(e => e.TempEstimateNo)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.UploadUser)
                    .WithMany(u => u.UploadedAttachments)
                    .HasForeignKey(e => e.UploadUserID)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // DataSheetLv3
            modelBuilder.Entity<DataSheetLv3>(entity =>
            {
                entity.ToTable("DataSheetLv3");
                entity.HasKey(e => new { e.TempEstimateNo, e.SheetID });
                entity.Property(e => e.TempEstimateNo).HasMaxLength(255).IsRequired();
                entity.Property(e => e.EstimateNo).HasMaxLength(255);
                entity.Property(e => e.Medium).HasMaxLength(255);
                entity.Property(e => e.Fluid).HasMaxLength(255);
                entity.Property(e => e.QMUnit).HasMaxLength(255);
                entity.Property(e => e.QNUnit).HasMaxLength(255);
                entity.Property(e => e.PressureUnit).HasMaxLength(255);
                entity.Property(e => e.TemperatureUnit).HasMaxLength(255);
                entity.Property(e => e.DensityUnit).HasMaxLength(255);
                entity.Property(e => e.MolecularWeightUnit).HasMaxLength(255);
                entity.Property(e => e.CalculatedCvUnit).HasMaxLength(255);
                entity.Property(e => e.U1Unit).HasMaxLength(255);
                entity.Property(e => e.WarningStateMax).HasMaxLength(255);
                entity.Property(e => e.WarningStateNor).HasMaxLength(255);
                entity.Property(e => e.WarningStateMin).HasMaxLength(255);
                entity.Property(e => e.WarningTypeMax).HasMaxLength(255);
                entity.Property(e => e.WarningTypeNor).HasMaxLength(255);
                entity.Property(e => e.WarningTypeMin).HasMaxLength(255);
                entity.Property(e => e.FluidPUnit).HasMaxLength(255);
                entity.Property(e => e.FluidN1Unit).HasMaxLength(255);
                entity.Property(e => e.FluidV1Unit).HasMaxLength(255);
                entity.Property(e => e.FluidPV1Unit).HasMaxLength(255);
                entity.Property(e => e.FluidTV1Unit).HasMaxLength(255);
                entity.Property(e => e.FluidCF1Unit).HasMaxLength(255);
                entity.Property(e => e.ValveType).HasMaxLength(1);
                entity.Property(e => e.FlowDirection).HasMaxLength(255);
                entity.Property(e => e.ValvePerformClass).HasMaxLength(255);
                entity.Property(e => e.Protection).HasMaxLength(255);
                entity.Property(e => e.BasicCharacter).HasMaxLength(255);
                entity.Property(e => e.FlowCoeffUnit).HasMaxLength(255);
                entity.Property(e => e.SizePressureClass).HasMaxLength(255);
                entity.Property(e => e.BonnetType).HasMaxLength(1);
                entity.Property(e => e.BodyMat).HasMaxLength(1);
    
                entity.Property(e => e.BodySize).HasMaxLength(1);
                entity.Property(e => e.Rating).HasMaxLength(1);
                entity.Property(e => e.Connection).HasMaxLength(1);
                entity.Property(e => e.TrimType).HasMaxLength(1);
                entity.Property(e => e.TrimSeries).HasMaxLength(1);
                entity.Property(e => e.TrimMat).HasMaxLength(1);
                entity.Property(e => e.TrimOption).HasMaxLength(1);
                entity.Property(e => e.TrimPortSize).HasMaxLength(1);
                entity.Property(e => e.TrimForm).HasMaxLength(1);
                entity.Property(e => e.ActType).HasMaxLength(1);
                entity.Property(e => e.ActSeriesCode).HasMaxLength(1);
                entity.Property(e => e.ActSize).HasMaxLength(1);
                entity.Property(e => e.HW).HasMaxLength(1);
                entity.Property(e => e.PosCode).HasMaxLength(10);
                entity.Property(e => e.SolCode).HasMaxLength(10);
                entity.Property(e => e.LimCode).HasMaxLength(10);
                entity.Property(e => e.ASCode).HasMaxLength(10);
                entity.Property(e => e.VolCode).HasMaxLength(10);
                entity.Property(e => e.AirOpCode).HasMaxLength(10);
                entity.Property(e => e.LockupCode).HasMaxLength(10);
                entity.Property(e => e.SnapActCode).HasMaxLength(10);

                // Foreign keys
                entity.HasOne(e => e.EstimateSheet)
                    .WithMany()
                    .HasForeignKey(e => e.TempEstimateNo)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.ActHW)
                    .WithMany()
                    .HasForeignKey(e => e.HW)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // User
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("User");
                entity.HasKey(e => e.UserID);
                entity.Property(e => e.UserID).HasMaxLength(255);
                entity.Property(e => e.Password).HasMaxLength(255).IsRequired();
                entity.Property(e => e.CompanyName).HasMaxLength(255).IsRequired();
                entity.Property(e => e.CompanyPhone).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Position).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Department).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
                entity.Property(e => e.BusinessNumber).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Address).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
                entity.Property(e => e.PhoneNumber).HasMaxLength(255).IsRequired();

                // Foreign key
                entity.HasOne(e => e.Role)
                    .WithMany(r => r.Users)
                    .HasForeignKey(e => e.RoleID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Role
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("Role");
                entity.HasKey(e => e.RoleID);
                entity.Property(e => e.RoleName).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(255);
            });

            // ActHWList
            modelBuilder.Entity<ActHWList>(entity =>
            {
                entity.ToTable("ActHWList");
                entity.HasKey(e => e.HWCode);
                entity.Property(e => e.HWCode).HasMaxLength(1).IsRequired();
                entity.Property(e => e.HW).HasMaxLength(255).IsRequired();
            });
        }
    }
} 