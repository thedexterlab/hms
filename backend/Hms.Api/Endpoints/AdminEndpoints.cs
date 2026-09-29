using System.Text.Json;
using Hms.Api.Auth;
using Hms.Api.Contracts;
using Hms.Api.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Endpoints;

public static class AdminEndpoints
{
    private static readonly string[] ValidRoles = ["Administrator", "Receptionist", "Doctor", "Pharmacist", "Nurse", "Laboratory Staff", "Finance Staff", "HR Staff", "IT Staff", "Store Staff"];
    private static readonly string[] TerminalStatuses = ["Completed", "Cancelled", "No Show"];

    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin").RequireAuthorization();
        group.MapGet("/overview", Overview).RequireAuthorization(Permissions.Policy(Permissions.AdminOverview));
        group.MapGet("/users", ListUsers).RequireAuthorization(Permissions.Policy(Permissions.AdminUsersView));
        group.MapPost("/users", CreateUser).RequireAuthorization(Permissions.Policy(Permissions.AdminUsersManage));
        group.MapPatch("/users/{id:guid}", UpdateUser).RequireAuthorization(Permissions.Policy(Permissions.AdminUsersManage));
        group.MapPost("/users/{id:guid}/reset-password", ResetPassword).RequireAuthorization(Permissions.Policy(Permissions.AdminUsersManage));
        group.MapPost("/users/{id:guid}/unlock", UnlockUser).RequireAuthorization(Permissions.Policy(Permissions.AdminUsersManage));
        group.MapPost("/users/{id:guid}/deactivate", DeactivateUser).RequireAuthorization(Permissions.Policy(Permissions.AdminUsersManage));
        group.MapPost("/users/{id:guid}/activate", ActivateUser).RequireAuthorization(Permissions.Policy(Permissions.AdminUsersManage));
        group.MapGet("/patients", ListPatients).RequireAuthorization(Permissions.Policy(Permissions.AdminPatientsManage));
        group.MapGet("/appointments", ListAppointments).RequireAuthorization(Permissions.Policy(Permissions.AdminAppointmentsManage));
        group.MapPost("/appointments/{id:long}/cancel", CancelAppointment).RequireAuthorization(Permissions.Policy(Permissions.AdminAppointmentsManage));
        group.MapGet("/payments", ListPayments).RequireAuthorization(Permissions.Policy(Permissions.AdminPaymentsManage));
        group.MapPost("/notifications", Broadcast).RequireAuthorization(Permissions.Policy(Permissions.AdminBroadcast));
        return app;
    }

    // __PART2__

    private static async Task<IResult> Overview(HttpContext http, HmsDbContext db, TimeProvider clock)
    {
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var start = new DateTimeOffset(today.Year, today.Month, today.Day, 0, 0, 0, TimeSpan.Zero);
        var now = clock.GetUtcNow();

        var users = await db.Users.AsNoTracking().ToListAsync();
        var totalPatients = await db.Patients.CountAsync();
        var registrationsToday = await db.Patients.CountAsync(x => x.RegisteredAt >= start);
        var appointmentsToday = await db.Appointments.CountAsync(x => x.AppointmentDate == today);
        var cancelledToday = await db.Appointments.CountAsync(x => x.AppointmentDate == today && x.Status == "Cancelled");
        var activeVisits = await db.Appointments.CountAsync(x => x.Status == "Waiting" || x.Status == "Checked In" || x.Status == "In consultation");
        var pendingPayments = await db.Appointments.CountAsync(x => x.PaymentStatus == "Pending" && x.Status != "Cancelled");
        var revenueToday = await db.Payments.Where(x => x.RecordedAt >= start && x.Status == "Paid").SumAsync(x => (decimal?)x.Amount) ?? 0m;
        var lowStock = await db.PharmacyItems.CountAsync(x => x.IsActive && x.StockQuantity <= x.ReorderLevel);
        var pendingLabs = await db.LabOrders.CountAsync(x => x.Status != "Completed");
        var pendingPrescriptions = await db.PrescriptionItems.CountAsync(x => x.Status == "Pending");

        var staffByRole = users.GroupBy(x => x.Role).ToDictionary(g => g.Key, g => g.Count());
        return Results.Ok(new AdminOverviewResponse(
            totalPatients, registrationsToday, appointmentsToday, cancelledToday,
            activeVisits, users.Count, users.Count(x => x.IsActive), users.Count(x => x.LockoutEnd is not null && x.LockoutEnd > now),
            revenueToday, pendingPayments, lowStock, pendingLabs, pendingPrescriptions, staffByRole));
    }

    private static async Task<IResult> ListUsers(string? search, string? role, HmsDbContext db)
    {
        var users = db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToUpperInvariant();
            users = users.Where(x => x.NormalizedUsername.Contains(term) || x.FullName.ToUpper().Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(role) && role != "All") users = users.Where(x => x.Role == role);
        var records = await users.OrderBy(x => x.FullName).Take(300).ToListAsync();
        return Results.Ok(records.Select(ToUserResponse));
    }

    private static async Task<IResult> CreateUser(CreateAdminUserRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        var username = request.Username.Trim();
        var normalized = username.ToUpperInvariant();
        if (await db.Users.AnyAsync(x => x.NormalizedUsername == normalized))
            return Results.Conflict(new { code = "DUPLICATE_USERNAME", message = "An account with this username already exists." });
        if (!ValidRoles.Contains(request.Role))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["role"] = ["Role is not recognized."] });

        var user = new AppUser
        {
            Username = username,
            NormalizedUsername = normalized,
            FullName = request.FullName.Trim(),
            PasswordHash = "pending",
            Role = request.Role,
            DepartmentId = Clean(request.DepartmentId),
            DepartmentName = Clean(request.DepartmentName),
            Specialty = Clean(request.Specialty),
            Room = Clean(request.Room),
            OpdHours = Clean(request.OpdHours),
            Permissions = (request.Permissions ?? []).Distinct().ToList(),
        };
        user.PasswordHash = new PasswordHasher<AppUser>().HashPassword(user, request.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        audit.Add(http.User, "Admin.UserCreated", "AppUser", user.Id.ToString(),
            changesJson: JsonSerializer.Serialize(new { user.Username, user.FullName, user.Role }),
            ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.Created($"/api/admin/users/{user.Id}", ToUserResponse(user));
    }

    private static async Task<IResult> UpdateUser(Guid id, UpdateAdminUserRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == id);
        if (user is null) return Results.NotFound();
        if (request.Role is { } role && !ValidRoles.Contains(role))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["role"] = ["Role is not recognized."] });

        var before = new { user.FullName, user.Role, user.DepartmentId, user.DepartmentName, user.Specialty, user.Room, user.OpdHours, user.IsActive, user.Permissions };
        if (!string.IsNullOrWhiteSpace(request.FullName)) user.FullName = request.FullName.Trim();
        if (request.Role is not null) user.Role = request.Role;
        if (request.DepartmentId is not null) user.DepartmentId = Clean(request.DepartmentId);
        if (request.DepartmentName is not null) user.DepartmentName = Clean(request.DepartmentName);
        if (request.Specialty is not null) user.Specialty = Clean(request.Specialty);
        if (request.Room is not null) user.Room = Clean(request.Room);
        if (request.OpdHours is not null) user.OpdHours = Clean(request.OpdHours);
        if (request.IsActive is { } active) user.IsActive = active;
        if (request.Permissions is { } permissions) user.Permissions = permissions.Distinct().ToList();

        // Deactivating an account immediately revokes its active sessions, and
        // the last active administrator can never be locked out of the system.
        if (request.IsActive == false) await RevokeSessions(db, user);
        if (!user.IsActive && user.Role == "Administrator" && !await db.Users.AnyAsync(x => x.Role == "Administrator" && x.IsActive && x.Id != user.Id))
        {
            user.IsActive = true;
            return Results.Conflict(new { code = "LAST_ADMIN", message = "At least one active administrator must remain." });
        }

        audit.Add(http.User, "Admin.UserUpdated", "AppUser", user.Id.ToString(),
            changesJson: JsonSerializer.Serialize(new
            {
                before,
                after = new { user.FullName, user.Role, user.DepartmentId, user.DepartmentName, user.Specialty, user.Room, user.OpdHours, user.IsActive, user.Permissions }
            }),
            ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.Ok(ToUserResponse(user));
    }

    private static async Task<IResult> ResetPassword(Guid id, ResetAdminPasswordRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == id);
        if (user is null) return Results.NotFound();
        user.PasswordHash = new PasswordHasher<AppUser>().HashPassword(user, request.NewPassword);
        user.FailedLoginCount = 0;
        user.LockoutEnd = null;
        await RevokeSessions(db, user);
        audit.Add(http.User, "Admin.PasswordReset", "AppUser", user.Id.ToString(), ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> UnlockUser(Guid id, HttpContext http, HmsDbContext db, AuditService audit)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == id);
        if (user is null) return Results.NotFound();
        user.FailedLoginCount = 0;
        user.LockoutEnd = null;
        audit.Add(http.User, "Admin.AccountUnlocked", "AppUser", user.Id.ToString(), ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> DeactivateUser(Guid id, HttpContext http, HmsDbContext db, AuditService audit)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == id);
        if (user is null) return Results.NotFound();
        if (user.Role == "Administrator" && !await db.Users.AnyAsync(x => x.Role == "Administrator" && x.IsActive && x.Id != user.Id))
            return Results.Conflict(new { code = "LAST_ADMIN", message = "At least one active administrator must remain." });
        user.IsActive = false;
        await RevokeSessions(db, user);
        audit.Add(http.User, "Admin.UserDeactivated", "AppUser", user.Id.ToString(), ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> ActivateUser(Guid id, HttpContext http, HmsDbContext db, AuditService audit)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == id);
        if (user is null) return Results.NotFound();
        user.IsActive = true;
        user.FailedLoginCount = 0;
        user.LockoutEnd = null;
        audit.Add(http.User, "Admin.UserActivated", "AppUser", user.Id.ToString(), ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> ListPatients(string? search, HmsDbContext db)
    {
        var patients = db.Patients.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            patients = patients.Where(x => x.Mrn.Contains(term) || x.FirstName.Contains(term) || x.LastName.Contains(term) || x.PrimaryMobile.Contains(term));
        }
        var records = await patients.OrderByDescending(x => x.RegisteredAt).Take(200).ToListAsync();
        return Results.Ok(records.Select(x => new
        {
            x.Id, x.Mrn, FullName = $"{x.FirstName} {x.LastName}".Trim(), x.Gender,
            x.Dob, x.ApproximateAge, x.PrimaryMobile, x.Status,
            RegisteredAt = DateOnly.FromDateTime(x.RegisteredAt.UtcDateTime), x.RegistrationType, x.Department,
        }));
    }

    private static async Task<IResult> ListAppointments(DateOnly? date, string? status, HmsDbContext db)
    {
        var appointments = db.Appointments.AsNoTracking().Include(x => x.Patient).Include(x => x.Doctor).AsQueryable();
        if (date is { } day) appointments = appointments.Where(x => x.AppointmentDate == day);
        if (!string.IsNullOrWhiteSpace(status) && status != "All") appointments = appointments.Where(x => x.Status == status);
        var records = await appointments.OrderByDescending(x => x.AppointmentDate).ThenBy(x => x.TokenNumber).Take(300).ToListAsync();
        return Results.Ok(records.Select(x => new
        {
            x.Id, x.TokenNumber, AppointmentTime = x.AppointmentTime.ToString("HH:mm"),
            x.AppointmentDate, PatientName = $"{x.Patient.FirstName} {x.Patient.LastName}", x.Patient.Mrn,
            Doctor = x.Doctor?.FullName ?? x.DoctorId, x.Department, x.AppointmentType, x.Priority, x.Status, x.PaymentStatus, x.AdminNote,
        }));
    }

    private static async Task<IResult> CancelAppointment(long id, CancelAdminAppointmentRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        var appointment = await db.Appointments.Include(x => x.Patient).SingleOrDefaultAsync(x => x.Id == id);
        if (appointment is null) return Results.NotFound();
        if (TerminalStatuses.Contains(appointment.Status))
            return Results.Conflict(new { code = "TERMINAL_STATUS", message = "Completed, cancelled, and no-show appointments cannot change status." });

        var previous = appointment.Status;
        appointment.Status = "Cancelled";
        appointment.AdminNote = request.Reason.Trim();
        db.Notifications.Add(new Notification
        {
            Title = "Appointment cancelled by administration",
            Detail = $"{appointment.Patient.FirstName} {appointment.Patient.LastName} ({appointment.Patient.Mrn}) — {appointment.AppointmentDate:yyyy-MM-dd} {appointment.AppointmentTime}. Reason: {request.Reason.Trim()}",
            Severity = "warning", Audience = "Reception", CreatedAt = DateTimeOffset.UtcNow
        });
        audit.Add(http.User, "Admin.AppointmentCancelled", "Appointment", id.ToString(), request.Reason.Trim(),
            changesJson: JsonSerializer.Serialize(new { previous, current = "Cancelled" }),
            ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> ListPayments(DateOnly? date, HmsDbContext db)
    {
        var payments = db.Payments.AsNoTracking().Include(x => x.Patient).AsQueryable();
        if (date is { } day)
        {
            var start = new DateTimeOffset(day.Year, day.Month, day.Day, 0, 0, 0, TimeSpan.Zero);
            payments = payments.Where(x => x.RecordedAt >= start && x.RecordedAt < start.AddDays(1));
        }
        var records = await payments.OrderByDescending(x => x.RecordedAt).Take(300).ToListAsync();
        return Results.Ok(records.Select(x => new
        {
            x.Id, x.PatientId, PatientName = $"{x.Patient.FirstName} {x.Patient.LastName}", x.Patient.Mrn,
            x.Amount, x.Method, x.Category, x.Status, x.Reference, x.RecordedBy, x.RecordedAt,
        }));
    }

    private static async Task<IResult> Broadcast(BroadcastNotificationRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        var notification = new Notification
        {
            Title = request.Title.Trim(), Detail = request.Detail.Trim(),
            Severity = request.Severity.Trim(), Audience = request.Audience.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.Notifications.Add(notification);
        audit.Add(http.User, "Admin.NotificationBroadcast", "Notification", notification.Id.ToString(),
            changesJson: JsonSerializer.Serialize(new { notification.Title, notification.Audience, notification.Severity }),
            ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.Created("/api/notifications", new NotificationResponse(notification.Id, notification.Title, notification.Detail, notification.Severity, notification.Audience, notification.CreatedAt, notification.ReadAt));
    }

    private static async Task RevokeSessions(HmsDbContext db, AppUser user)
    {
        var tokens = await db.RefreshTokens.Where(x => x.UserId == user.Id && x.RevokedAt == null).ToListAsync();
        foreach (var token in tokens) token.RevokedAt = DateTimeOffset.UtcNow;
    }

    private static AdminUserResponse ToUserResponse(AppUser x) => new(x.Id, x.Username, x.FullName, x.Role,
        x.DepartmentId, x.DepartmentName, x.Specialty, x.Room, x.OpdHours, x.IsActive,
        x.Permissions, x.FailedLoginCount, x.LockoutEnd, x.ClockedInAt, x.ClockedOutAt, x.LastSeenAt);

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}