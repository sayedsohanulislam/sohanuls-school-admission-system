using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<SchoolClass> Classes => Set<SchoolClass>();
    public DbSet<SeatHold> SeatHolds => Set<SeatHold>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<SchoolClass>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(200);
            entity.Property(c => c.TotalSeats).IsRequired();
        });

        modelBuilder.Entity<SeatHold>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.Property(h => h.StudentId).IsRequired().HasMaxLength(17);
            entity.Property(h => h.Status).IsRequired().HasMaxLength(20);

            entity.HasOne(h => h.Class)
                .WithMany(c => c.Holds)
                .HasForeignKey(h => h.ClassId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(h => h.ClassId);
            entity.HasIndex(h => h.StudentId);
            entity.HasIndex(h => h.Status);
            entity.HasIndex(h => h.ExpiresAt);
            entity.HasIndex(h => new { h.ClassId, h.StudentId });
        });
    }
}
