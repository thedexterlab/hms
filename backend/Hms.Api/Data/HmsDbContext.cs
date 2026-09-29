using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Text.Json;

namespace Hms.Api.Data;

public sealed class HmsDbContext(DbContextOptions<HmsDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<PatientAmendment> PatientAmendments => Set<PatientAmendment>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Consultation> Consultations => Set<Consultation>();
    public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();
    public DbSet<LabOrder> LabOrders => Set<LabOrder>();
    public DbSet<PharmacyItem> PharmacyItems => Set<PharmacyItem>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var comparer = new ValueComparer<List<string>>((a, b) => a != null && b != null && a.SequenceEqual(b), value => value.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())), value => value.ToList());
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasIndex(x => x.NormalizedUsername).IsUnique();
            entity.Property(x => x.Username).HasMaxLength(254);
            entity.Property(x => x.NormalizedUsername).HasMaxLength(254);
            entity.Property(x => x.FullName).HasMaxLength(200);
            entity.Property(x => x.PasswordHash).HasMaxLength(1000);
            entity.Property(x => x.Role).HasMaxLength(100);
            entity.Property(x => x.DepartmentId).HasMaxLength(100);
            entity.Property(x => x.DepartmentName).HasMaxLength(200);
            entity.Property(x => x.Specialty).HasMaxLength(200);
            entity.Property(x => x.Room).HasMaxLength(100);
            entity.Property(x => x.OpdHours).HasMaxLength(100);
            entity.Property(x => x.Permissions).HasColumnType("longtext").HasConversion(v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null), v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new()).Metadata.SetValueComparer(comparer);
            entity.ToTable(t => t.HasCheckConstraint("CK_Users_FailedLoginCount", "`FailedLoginCount` >= 0"));
        });
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.Property(x => x.TokenHash).HasMaxLength(64);
            entity.Property(x => x.ReplacedByTokenHash).HasMaxLength(64);
            entity.ToTable(t => t.HasCheckConstraint("CK_RefreshTokens_Expiry", "`ExpiresAt` > `CreatedAt`"));
        });
        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasIndex(x => x.Mrn).IsUnique();
            entity.HasIndex(x => x.Cnic).IsUnique();
            entity.HasIndex(x => x.PrimaryMobile);
            entity.Property(x => x.Mrn).HasMaxLength(32);
            entity.Property(x => x.FirstName).HasMaxLength(100);
            entity.Property(x => x.LastName).HasMaxLength(100);
            entity.Property(x => x.Gender).HasMaxLength(30);
            entity.Property(x => x.BloodGroup).HasMaxLength(5);
            entity.Property(x => x.MaritalStatus).HasMaxLength(30);
            entity.Property(x => x.Cnic).HasMaxLength(13);
            entity.Property(x => x.PrimaryMobile).HasMaxLength(30);
            entity.Property(x => x.SecondaryMobile).HasMaxLength(30);
            entity.Property(x => x.Email).HasMaxLength(254);
            entity.Property(x => x.AddressLine).HasMaxLength(250);
            entity.Property(x => x.City).HasMaxLength(100);
            entity.Property(x => x.District).HasMaxLength(100);
            entity.Property(x => x.Province).HasMaxLength(100);
            entity.Property(x => x.PostalCode).HasMaxLength(20);
            entity.Property(x => x.GuardianName).HasMaxLength(200);
            entity.Property(x => x.GuardianRelationship).HasMaxLength(50);
            entity.Property(x => x.GuardianMobile).HasMaxLength(30);
            entity.Property(x => x.RegistrationType).HasMaxLength(50);
            entity.Property(x => x.Department).HasMaxLength(100);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.Property(x => x.Version).IsConcurrencyToken();
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_Patients_Age", "`ApproximateAge` IS NULL OR (`ApproximateAge` BETWEEN 0 AND 120)");
                t.HasCheckConstraint("CK_Patients_Version", "`Version` > 0");
            });
        });
        modelBuilder.Entity<PatientAmendment>().HasOne(x => x.Patient).WithMany(x => x.Amendments).HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<PatientAmendment>(entity =>
        {
            entity.Property(x => x.ChangesJson).HasColumnType("longtext");
            entity.Property(x => x.Reason).HasMaxLength(500);
            entity.Property(x => x.ChangedBy).HasMaxLength(100);
        });
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => new { x.PatientId, x.AppointmentDate, x.AppointmentTime }); // uniqueness enforced in code (MySQL has no filtered indexes)
            entity.HasIndex(x => new { x.Department, x.AppointmentDate, x.TokenNumber }).IsUnique();
            entity.Property(x => x.DoctorUserId).HasColumnType("char(36)");
            entity.Property(x => x.Department).HasMaxLength(100);
            entity.Property(x => x.DoctorId).HasMaxLength(100);
            entity.Property(x => x.AppointmentType).HasMaxLength(50);
            entity.Property(x => x.Priority).HasMaxLength(30);
            entity.Property(x => x.PaymentStatus).HasMaxLength(30);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.Property(x => x.AdminNote).HasMaxLength(250);
            entity.ToTable(t => t.HasCheckConstraint("CK_Appointments_TokenNumber", "`TokenNumber` > 0"));
        });
        modelBuilder.Entity<AuditEvent>(entity =>
        {
            entity.HasIndex(x => x.OccurredAt);
            entity.Property(x => x.ActorId).HasMaxLength(100);
            entity.Property(x => x.Action).HasMaxLength(100);
            entity.Property(x => x.EntityType).HasMaxLength(100);
            entity.Property(x => x.EntityId).HasMaxLength(100);
            entity.Property(x => x.Reason).HasMaxLength(500);
            entity.Property(x => x.ChangesJson).HasColumnType("longtext");
            entity.Property(x => x.IpAddress).HasMaxLength(64);
        });
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Appointment).WithMany().HasForeignKey(x => x.AppointmentId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(x => x.RecordedAt);
            entity.Property(x => x.Amount).HasPrecision(12, 2);
            entity.Property(x => x.Method).HasMaxLength(50);
            entity.Property(x => x.Category).HasMaxLength(50);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.Property(x => x.Reference).HasMaxLength(100);
            entity.Property(x => x.RecordedBy).HasMaxLength(100);
            entity.ToTable(t => t.HasCheckConstraint("CK_Payments_Amount", "`Amount` >= 0"));
        });
        modelBuilder.Entity<Consultation>(entity =>
        {
            entity.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Appointment).WithMany().HasForeignKey(x => x.AppointmentId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => new { x.PatientId, x.CreatedAt });
            entity.Property(x => x.DoctorUserId).HasColumnType("char(36)");
            entity.Property(x => x.ChiefComplaint).HasMaxLength(500);
            entity.Property(x => x.Diagnosis).HasMaxLength(500);
            entity.Property(x => x.Notes).HasMaxLength(2000);
            entity.Property(x => x.BloodPressure).HasMaxLength(20);
            entity.Property(x => x.Temperature).HasMaxLength(20);
            entity.Property(x => x.Pulse).HasMaxLength(20);
            entity.Property(x => x.Weight).HasMaxLength(20);
            entity.Property(x => x.Height).HasMaxLength(20);
            entity.Property(x => x.OxygenSaturation).HasMaxLength(20);
            entity.Property(x => x.Status).HasMaxLength(30);
        });
        modelBuilder.Entity<PrescriptionItem>(entity =>
        {
            entity.HasOne(x => x.Consultation).WithMany(x => x.PrescriptionItems).HasForeignKey(x => x.ConsultationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(x => new { x.ConsultationId, x.Status });
            entity.Property(x => x.Medicine).HasMaxLength(200);
            entity.Property(x => x.Dosage).HasMaxLength(200);
            entity.Property(x => x.Duration).HasMaxLength(100);
            entity.Property(x => x.Instructions).HasMaxLength(500);
            entity.Property(x => x.Status).HasMaxLength(30);
            entity.Property(x => x.DispensedBy).HasMaxLength(100);
            entity.Property(x => x.PharmacyNote).HasMaxLength(500);
        });
        modelBuilder.Entity<LabOrder>(entity =>
        {
            entity.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Appointment).WithMany().HasForeignKey(x => x.AppointmentId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(x => x.OrderedBy).WithMany().HasForeignKey(x => x.OrderedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => new { x.PatientId, x.CreatedAt });
            entity.Property(x => x.OrderedByUserId).HasColumnType("char(36)");
            entity.Property(x => x.OrderType).HasMaxLength(50);
            entity.Property(x => x.Study).HasMaxLength(200);
            entity.Property(x => x.ClinicalDetails).HasMaxLength(500);
            entity.Property(x => x.Report).HasColumnType("longtext");
            entity.Property(x => x.Status).HasMaxLength(30);
        });
        modelBuilder.Entity<PharmacyItem>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Unit).HasMaxLength(50);
            entity.Property(x => x.UnitPrice).HasPrecision(12, 2);
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_PharmacyItems_Stock", "`StockQuantity` >= 0");
                t.HasCheckConstraint("CK_PharmacyItems_ReorderLevel", "`ReorderLevel` >= 0");
            });
        });
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasIndex(x => x.CreatedAt);
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.Detail).HasMaxLength(1000);
            entity.Property(x => x.Severity).HasMaxLength(20);
            entity.Property(x => x.Audience).HasMaxLength(50);
        });
    }
}
