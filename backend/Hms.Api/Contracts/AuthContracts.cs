namespace Hms.Api.Contracts;

public sealed record LoginRequest(string UsernameOrEmail, string Password, bool RememberMe);
public sealed record RefreshRequest(string RefreshToken);
public sealed record UserResponse(Guid Id, string FullName, string[] Roles, string[] Permissions, string? DepartmentId, string? DepartmentName, string? Specialty);
public sealed record AuthResponse(string AccessToken, string RefreshToken, int ExpiresIn, UserResponse User);
