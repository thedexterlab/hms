using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Data;

public sealed class DoctorPresenceMonitor(IDbContextFactory<HmsDbContext> factory, TimeProvider clock, ILogger<DoctorPresenceMonitor> logger) : BackgroundService
{
    public static readonly TimeSpan InactivityTimeout = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1), clock);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try { await ClockOutInactiveDoctors(stoppingToken); }
            catch (Exception exception) { logger.LogError(exception, "Failed to clock out inactive doctors."); }
        }
    }

    public async Task<int> ClockOutInactiveDoctors(CancellationToken cancellationToken = default)
    {
        await using var db = await factory.CreateDbContextAsync(cancellationToken);
        var now = clock.GetUtcNow();
        var cutoff = now - InactivityTimeout;
        var inactive = await db.Users.Where(x => x.Role == "Doctor" && x.ClockedInAt != null && x.LastSeenAt < cutoff && (x.ClockedOutAt == null || x.ClockedOutAt < x.ClockedInAt)).ToListAsync(cancellationToken);
        foreach (var doctor in inactive) doctor.ClockedOutAt = now;
        if (inactive.Count > 0) await db.SaveChangesAsync(cancellationToken);
        return inactive.Count;
    }
}
