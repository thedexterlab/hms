using System.ComponentModel.DataAnnotations;

namespace Hms.Api.Contracts;

public sealed record AdminOverviewResponse(
    int TotalPatients, int RegistrationsToday, int AppointmentsToday, int CancelledToday,
    int ActiveVisits, int TotalStaff, int ActiveStaff, int LockedAccounts,
    decimal RevenueToday, int PendingPayments, int LowStockItems, int PendingLabs, int PendingPrescriptions,
    IReadOnlyDictionary<string, int> StaffByRole);

public sealed record AdminUserResponse(Guid Id, string Username, string FullName, string Role,
    string? DepartmentId, string? DepartmentName, string? Specialty, string? Room, string? OpdHours,
    bool IsActive, IReadOnlyList<string> Permissions, int FailedLoginCount, DateTimeOffset? LockoutEnd,
    DateTimeOffset? ClockedInAt, DateTimeOffset? ClockedOutAt, DateTimeOffset? LastSeenAt);

public sealed record CreateAdminUserRequest(
    [property: Required, MaxLength(254)] string Username,
    [property: Required, MaxLength(200)] string FullName,
    [property: Required, MaxLength(100)] string Role,
    [property: Required, MinLength(8)] string Password,
    [property: MaxLength(100)] string? DepartmentId,
    [property: MaxLength(200)] string? DepartmentName,
    [property: MaxLength(200)] string? Specialty,
    [property: MaxLength(100)] string? Room,
    [property: MaxLength(100)] string? OpdHours,
    IReadOnlyList<string>? Permissions);

public sealed record UpdateAdminUserRequest(
    [property: MaxLength(200)] string? FullName,
    [property: MaxLength(100)] string? Role,
    [property: MaxLength(100)] string? DepartmentId,
    [property: MaxLength(200)] string? DepartmentName,
    [property: MaxLength(200)] string? Specialty,
    [property: MaxLength(100)] string? Room,
    [property: MaxLength(100)] string? OpdHours,
    bool? IsActive,
    IReadOnlyList<string>? Permissions);

public sealed record ResetAdminPasswordRequest([property: Required, MinLength(8)] string NewPassword);

public sealed record CancelAdminAppointmentRequest([property: Required, MaxLength(500)] string Reason);

public sealed record BroadcastNotificationRequest(
    [property: Required, MaxLength(200)] string Title,
    [property: Required, MaxLength(1000)] string Detail,
    [property: Required, MaxLength(20)] string Severity,
    [property: Required, MaxLength(50)] string Audience);