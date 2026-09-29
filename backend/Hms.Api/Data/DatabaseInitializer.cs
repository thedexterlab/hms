using Hms.Api.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Data;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, IHostEnvironment environment, IConfiguration configuration)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<HmsDbContext>();
        if (db.Database.IsRelational())
            await db.Database.MigrateAsync();
        else
            await db.Database.EnsureCreatedAsync();

        // The administrator account is seeded unconditionally so the system is
        // never without a working admin login. Rotate this password in production
        // through the admin panel (Admin → Users → Reset password).
        var hasher = new PasswordHasher<AppUser>();
        var existingAdmin = await db.Users.SingleOrDefaultAsync(x => x.NormalizedUsername == "ADMIN@MASTAN.LOCAL");
        if (existingAdmin is null)
        {
            var admin = new AppUser
            {
                Username = "admin@mastan.local",
                NormalizedUsername = "ADMIN@MASTAN.LOCAL",
                FullName = "System Administrator",
                PasswordHash = "pending",
                Role = "Administrator",
                DepartmentId = "administration",
                DepartmentName = "Hospital Administration",
                Permissions = [.. Permissions.All],
            };
            admin.PasswordHash = hasher.HashPassword(admin, "Admin@123");
            db.Users.Add(admin);
        }
        else
        {
            existingAdmin.Permissions = existingAdmin.Permissions.Union(Permissions.All).ToList();
            existingAdmin.Role = "Administrator";
        }
        await db.SaveChangesAsync();

        if (!environment.IsDevelopment() || !configuration.GetValue("SeedDemoUsers", false)) return;

        var receptionPermissions = new List<string> { Permissions.DashboardView, Permissions.PatientsSearch, Permissions.PatientsCreate, Permissions.PatientsView, Permissions.PatientsUpdate, Permissions.AppointmentsView, Permissions.AppointmentsCreate, Permissions.AppointmentsReschedule, Permissions.AppointmentsCancel, Permissions.AppointmentsCheckIn, Permissions.AppointmentsNoShow, Permissions.PrintPatientCard, Permissions.PrintAppointmentSlip, Permissions.DoctorsView, Permissions.QueueView, Permissions.QueueManage, Permissions.PaymentsView, Permissions.PaymentsCreate, Permissions.NotificationsView, Permissions.AuditView };
        var doctorPermissions = new List<string> { Permissions.PatientsSearch, Permissions.PatientsView, Permissions.AppointmentsView, Permissions.DoctorsPresence, "MedicalRecords.View", Permissions.ConsultationsCreate, Permissions.ConsultationsView, Permissions.LabsOrder, Permissions.LabsView, Permissions.LabsUpdate, Permissions.NotificationsView };
        var pharmacyPermissions = new List<string> { Permissions.PharmacyView, Permissions.PharmacyDispense, Permissions.PharmacyManage, Permissions.NotificationsView, Permissions.PatientsSearch };
        await SeedUser("reception@example.com", "Mastan Hospital Receptionist", "Receptionist", "reception", "Reception & Registration", null, null, null, receptionPermissions, "Reception@123");
        await SeedUser("doctor.opd@mastan.local", "Dr. OPD Doctor", "Doctor", "opd", "General Medicine", "General Medicine", "OPD 1", "09:00 – 17:00", doctorPermissions, "Doctor@123");
        await SeedUser("doctor@master.local", "Dr. Master Doctor", "Doctor", "opd-master", "General Medicine", "General Medicine", "OPD 2", "09:00 – 17:00", doctorPermissions, "Doctor@123");
        await SeedUser("pharmacist@example.com", "Mastan Hospital Pharmacist", "Pharmacist", "pharmacy", "Pharmacy", null, null, null, pharmacyPermissions, "Pharmacy@123");
        await db.SaveChangesAsync();

        // Existing deployments: never skip a user that already exists. Merge the
        // required permissions in (so upgraded databases receive Doctors.View /
        // Doctors.Presence) and backfill any metadata that was previously null.
        async Task SeedUser(string username, string name, string role, string departmentId, string departmentName, string? specialty, string? room, string? opdHours, List<string> permissions, string password)
        {
            var existing = await db.Users.SingleOrDefaultAsync(x => x.NormalizedUsername == username.ToUpperInvariant());
            if (existing is null)
            {
                var created = NewUser(username, name, role, departmentId, departmentName, specialty, room, opdHours, permissions);
                created.PasswordHash = hasher.HashPassword(created, password);
                db.Users.Add(created);
                return;
            }
            existing.Permissions = existing.Permissions.Union(permissions).ToList();
            existing.Role = role;
            existing.FullName = string.IsNullOrWhiteSpace(existing.FullName) ? name : existing.FullName;
            existing.DepartmentId ??= departmentId;
            existing.DepartmentName ??= departmentName;
            existing.Specialty ??= specialty;
            existing.Room ??= room;
            existing.OpdHours ??= opdHours;
        }
    }
    private static AppUser NewUser(string username, string name, string role, string departmentId, string departmentName, string? specialty, string? room, string? opdHours, List<string> permissions) => new()
    {
        Username = username, NormalizedUsername = username.ToUpperInvariant(), FullName = name, PasswordHash = "pending",
        Role = role, DepartmentId = departmentId, DepartmentName = departmentName, Specialty = specialty, Room = room, OpdHours = opdHours, Permissions = permissions
    };
}
