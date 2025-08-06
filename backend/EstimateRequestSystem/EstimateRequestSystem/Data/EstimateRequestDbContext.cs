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
        public DbSet<User> User { get; set; }
        public DbSet<Role> Role { get; set; }

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
                entity.Property(e => e.Project).HasMaxLength(255);
                entity.Property(e => e.Medium).HasMaxLength(255);
                entity.Property(e => e.Fluid).HasMaxLength(255);
                entity.Property(e => e.FlowRateUnit).HasMaxLength(255);
                entity.Property(e => e.InletPressureUnit).HasMaxLength(255);
                entity.Property(e => e.OutletPressureUnit).HasMaxLength(255);
                entity.Property(e => e.DifferentialPressureUnit).HasMaxLength(255);
                entity.Property(e => e.InletTemperatureUnit).HasMaxLength(255);
                entity.Property(e => e.DensityUnit).HasMaxLength(255);
                entity.Property(e => e.MolecularWeightUnit).HasMaxLength(255);
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
        }
    }
} 