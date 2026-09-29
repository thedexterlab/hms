namespace Hms.Api.Contracts;

public sealed record DoctorDirectoryResponse(Guid Id, string Name, string Department, string Status,
    string OpdHours, string Room, DateTimeOffset? LastSeenAt);
