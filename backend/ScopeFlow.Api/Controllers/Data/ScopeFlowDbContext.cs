using Microsoft.EntityFrameworkCore;
using ScopeFlow.Api.Models;

namespace ScopeFlow.Api.Data;

public class ScopeFlowDbContext : DbContext
{
    public ScopeFlowDbContext(DbContextOptions<ScopeFlowDbContext> options)
        : base(options)
    {
    }

    public DbSet<Project> Projects => Set<Project>();

    public DbSet<ScopeItem> ScopeItems => Set<ScopeItem>();

    public DbSet<ChangeRequest> ChangeRequests => Set<ChangeRequest>();

    public DbSet<ChangeRequestHistory> ChangeRequestHistories =>
        Set<ChangeRequestHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Project>(entity =>
        {
            entity.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(150);

            entity.Property(p => p.ClientName)
                .IsRequired()
                .HasMaxLength(150);

            entity.Property(p => p.Description)
                .HasMaxLength(1000);

            entity.Property(p => p.ContractValue)
                .HasPrecision(18, 2);

            entity.Property(p => p.EstimatedHours)
                .HasPrecision(10, 2);
        });

        modelBuilder.Entity<ScopeItem>(entity =>
        {
            entity.Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(s => s.Description)
                .HasMaxLength(1000);

            entity.HasOne(s => s.Project)
                .WithMany(p => p.ScopeItems)
                .HasForeignKey(s => s.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChangeRequest>(entity =>
        {
            entity.Property(c => c.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(c => c.Description)
                .IsRequired()
                .HasMaxLength(2000);

            entity.Property(c => c.Status)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(c => c.Classification)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(c => c.EstimatedHours)
                .HasPrecision(10, 2);

            entity.Property(c => c.EstimatedCost)
                .HasPrecision(18, 2);

            entity.HasOne(c => c.Project)
                .WithMany(p => p.ChangeRequests)
                .HasForeignKey(c => c.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChangeRequestHistory>(entity =>
        {
            entity.Property(h => h.Action)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(h => h.Description)
                .HasMaxLength(1000);

            entity.HasOne(h => h.ChangeRequest)
                .WithMany(c => c.History)
                .HasForeignKey(h => h.ChangeRequestId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}