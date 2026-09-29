using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Hms.Api.Data;

public sealed class DatabaseHealthCheck(HmsDbContext db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            return await db.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("Database is unreachable.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("Database health check failed.", exception);
        }
    }
}
