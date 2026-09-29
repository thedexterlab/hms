using Hms.Api.Auth;
using Hms.Api.Contracts;
using Hms.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Endpoints;

public static class QueueEndpoints
{
    public static IEndpointRouteBuilder MapQueueEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").RequireAuthorization();
        group.MapGet("/queue", GetQueue).RequireAuthorization(Permissions.Policy(Permissions.QueueView));
        group.MapGet("/dashboard/summary", GetDashboardSummary).RequireAuthorization(Permissions.Policy(Permissions.DashboardView));
        return app;
    }

    private static async Task<IResult> GetQueue(HmsDbContext db, TimeProvider clock)
    {
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var records = await db.Appointments.AsNoTracking().Include(x => x.Patient).Include(x => x.Doctor)
            .Where(x => x.AppointmentDate == today).ToListAsync();
        var now = clock.GetUtcNow();
        var items = records
            .OrderBy(x => PriorityRank(x.Priority)).ThenBy(x => x.TokenNumber)
            .Select(x => new QueueItemResponse(
                x.Id, x.TokenNumber, $"{x.Patient.FirstName} {x.Patient.LastName}".Trim(), x.Patient.Mrn,
                x.Department, x.Doctor?.FullName ?? x.DoctorId, x.Priority, x.Status,
                WaitingDuration(now, x.CreatedAt, x.Status)));
        return Results.Ok(items);
    }

    private static async Task<IResult> GetDashboardSummary(HmsDbContext db, TimeProvider clock)
    {
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var start = new DateTimeOffset(today.Year, today.Month, today.Day, 0, 0, 0, TimeSpan.Zero);
        var end = start.AddDays(1);
        var appointmentsToday = db.Appointments.Where(x => x.AppointmentDate == today);
        var summary = new DashboardSummaryResponse(
            await db.Patients.CountAsync(x => x.RegisteredAt >= start && x.RegisteredAt < end),
            await appointmentsToday.CountAsync(),
            await appointmentsToday.CountAsync(x => x.Status == "Waiting"),
            await appointmentsToday.CountAsync(x => x.Status == "Checked In"),
            await appointmentsToday.CountAsync(x => x.AppointmentType == "Walk-In"),
            await appointmentsToday.CountAsync(x => x.Status == "Cancelled"),
            await appointmentsToday.CountAsync(x => x.Status == "No Show"),
            await appointmentsToday.CountAsync(x => x.PaymentStatus == "Pending"));
        return Results.Ok(summary);
    }

    internal static int PriorityRank(string priority) => priority switch
    {
        "Emergency" => 0,
        "Urgent" => 1,
        "Pregnant" => 2,
        "Elderly" => 3,
        _ => 4
    };

    internal static string WaitingDuration(DateTimeOffset now, DateTimeOffset queuedAt, string status) =>
        status is "Completed" or "Cancelled" or "No Show"
            ? "0 mins"
            : $"{Math.Max(0, (int)(now - queuedAt).TotalMinutes)} mins";
}