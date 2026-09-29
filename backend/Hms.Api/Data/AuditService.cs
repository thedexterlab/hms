using System.Security.Claims;

namespace Hms.Api.Data;

public sealed class AuditService(HmsDbContext db, IHttpContextAccessor? accessor = null)
{
    public void Add(ClaimsPrincipal actor, string action, string entityType, string entityId, string? reason = null, string? changesJson = null, string? ipAddress = null)
    {
        db.AuditEvents.Add(new AuditEvent
        {
            ActorId = actor.FindFirst("sub")?.Value ?? "anonymous", Action = action, EntityType = entityType,
            EntityId = entityId, Reason = reason, ChangesJson = changesJson,
            IpAddress = ipAddress ?? accessor?.HttpContext?.Connection.RemoteIpAddress?.ToString(), OccurredAt = DateTimeOffset.UtcNow
        });
    }
}
