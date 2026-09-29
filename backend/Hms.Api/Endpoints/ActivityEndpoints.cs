using Hms.Api.Auth;
using Hms.Api.Contracts;
using Hms.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Endpoints;

public static class ActivityEndpoints
{
    public static IEndpointRouteBuilder MapActivityEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/activity").RequireAuthorization(Permissions.Policy(Permissions.AuditView));
        group.MapGet("/", List);
        return app;
    }

    private static async Task<IResult> List(HmsDbContext db)
    {
        var events = await db.AuditEvents.AsNoTracking().OrderByDescending(x => x.OccurredAt).Take(100).ToListAsync();
        return Results.Ok(events.Select(x => new ActivityResponse(x.Id, x.ActorId, x.Action, x.EntityType, x.EntityId, x.Reason, x.ChangesJson, x.IpAddress, x.OccurredAt)));
    }
}