using Hms.Api.Auth;
using Hms.Api.Contracts;
using Hms.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Endpoints;

public static class DoctorEndpoints
{
    public static IEndpointRouteBuilder MapDoctorEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/doctors").RequireAuthorization();
        group.MapGet("/", GetDirectory).RequireAuthorization(Permissions.Policy(Permissions.DoctorsView));
        group.MapPost("/me/heartbeat", Heartbeat).RequireAuthorization(Permissions.Policy(Permissions.DoctorsPresence));
        group.MapPost("/me/clock-out", ClockOut).RequireAuthorization(Permissions.Policy(Permissions.DoctorsPresence));
        return app;
    }

    private static async Task<IResult> GetDirectory(HmsDbContext db, TimeProvider clock)
    {
        var cutoff = clock.GetUtcNow() - DoctorPresenceMonitor.InactivityTimeout;
        var doctors = await db.Users.AsNoTracking().Where(x => x.IsActive && x.Role == "Doctor").OrderBy(x => x.FullName).ToListAsync();
        return Results.Ok(doctors.Select(x => new DoctorDirectoryResponse(x.Id, x.FullName, x.DepartmentName ?? "OPD",
            IsAvailable(x, cutoff) ? "Available" : "Off Duty", x.OpdHours ?? "Not scheduled", x.Room ?? "Not assigned", x.LastSeenAt)));
    }

    private static async Task<IResult> Heartbeat(HttpContext http, HmsDbContext db, TimeProvider clock)
    {
        if (!TryUserId(http, out var id)) return Results.Unauthorized();
        var doctor = await db.Users.SingleOrDefaultAsync(x => x.Id == id && x.Role == "Doctor");
        if (doctor is null) return Results.Forbid();
        var now = clock.GetUtcNow();
        if (doctor.ClockedInAt is null || doctor.ClockedOutAt >= doctor.ClockedInAt) doctor.ClockedInAt = now;
        doctor.LastSeenAt = now; doctor.ClockedOutAt = null;
        await db.SaveChangesAsync();
        return Results.Ok(new { status = "Available", lastSeenAt = now });
    }

    private static async Task<IResult> ClockOut(HttpContext http, HmsDbContext db, TimeProvider clock)
    {
        if (!TryUserId(http, out var id)) return Results.Unauthorized();
        var doctor = await db.Users.SingleOrDefaultAsync(x => x.Id == id && x.Role == "Doctor");
        if (doctor is null) return Results.Forbid();
        doctor.ClockedOutAt = clock.GetUtcNow();
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static bool TryUserId(HttpContext http, out Guid id) => Guid.TryParse(http.User.FindFirst("sub")?.Value, out id);
    private static bool IsAvailable(AppUser doctor, DateTimeOffset cutoff) => doctor.ClockedInAt is not null && doctor.LastSeenAt >= cutoff && (doctor.ClockedOutAt is null || doctor.ClockedOutAt < doctor.ClockedInAt);
}
