using Hms.Api.Auth;
using Hms.Api.Contracts;
using Hms.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Endpoints;

public static class NotificationEndpoints
{
    public static IEndpointRouteBuilder MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/notifications").RequireAuthorization(Permissions.Policy(Permissions.NotificationsView));
        group.MapGet("/", List);
        group.MapPatch("/{id:long}/read", MarkRead);
        return app;
    }

    private static async Task<IResult> List(HttpContext http, HmsDbContext db)
    {
        var audience = AudienceFor(http.User.FindFirst("role")?.Value);
        var notifications = await db.Notifications.AsNoTracking()
            .Where(x => x.Audience == audience || x.Audience == "All")
            .OrderByDescending(x => x.CreatedAt).Take(50).ToListAsync();
        return Results.Ok(notifications.Select(ToResponse));
    }

    private static async Task<IResult> MarkRead(long id, HmsDbContext db)
    {
        var notification = await db.Notifications.SingleOrDefaultAsync(x => x.Id == id);
        if (notification is null) return Results.NotFound();
        if (notification.ReadAt is null) notification.ReadAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    internal static string AudienceFor(string? role) => role switch
    {
        "Receptionist" => "Reception",
        "Doctor" => "Doctor",
        "Pharmacist" => "Pharmacy",
        _ => "All"
    };

    private static NotificationResponse ToResponse(Notification x) =>
        new(x.Id, x.Title, x.Detail, x.Severity, x.Audience, x.CreatedAt, x.ReadAt);
}