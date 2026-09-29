using Hms.Api.Auth;
using Hms.Api.Contracts;
using Hms.Api.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Authentication");
        group.MapPost("/login", Login).RequireRateLimiting("auth");
        group.MapPost("/refresh", Refresh).RequireRateLimiting("auth");
        group.MapPost("/logout", Logout);
        return app;
    }

    private static async Task<IResult> Login(LoginRequest request, HmsDbContext db, TokenService tokens, JwtOptions options)
    {
        if (string.IsNullOrWhiteSpace(request.UsernameOrEmail) || string.IsNullOrWhiteSpace(request.Password)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["credentials"] = ["Username and password are required."] });
        var normalized = request.UsernameOrEmail.Trim().ToUpperInvariant();
        var user = await db.Users.Include(x => x.RefreshTokens).SingleOrDefaultAsync(x => x.NormalizedUsername == normalized);
        if (user is null || !user.IsActive) return Results.Unauthorized();
        if (user.LockoutEnd > DateTimeOffset.UtcNow) return Results.StatusCode(StatusCodes.Status423Locked);

        var result = new PasswordHasher<AppUser>().VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            user.FailedLoginCount++;
            if (user.FailedLoginCount >= 5) { user.LockoutEnd = DateTimeOffset.UtcNow.AddMinutes(15); user.FailedLoginCount = 0; }
            await db.SaveChangesAsync();
            return Results.Unauthorized();
        }

        if (result == PasswordVerificationResult.SuccessRehashNeeded) user.PasswordHash = new PasswordHasher<AppUser>().HashPassword(user, request.Password);
        user.FailedLoginCount = 0; user.LockoutEnd = null;
        if (user.Role == "Doctor")
        {
            var now = DateTimeOffset.UtcNow;
            user.ClockedInAt = now; user.LastSeenAt = now; user.ClockedOutAt = null;
        }
        return await IssueTokens(user, db, tokens, options, request.RememberMe);
    }

    private static async Task<IResult> Refresh(RefreshRequest request, HmsDbContext db, TokenService tokens, JwtOptions options)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken)) return Results.Unauthorized();
        var hash = TokenService.HashRefreshToken(request.RefreshToken);
        var stored = await db.RefreshTokens.Include(x => x.User).SingleOrDefaultAsync(x => x.TokenHash == hash);
        if (stored is null || stored.RevokedAt is not null || stored.ExpiresAt <= DateTimeOffset.UtcNow || !stored.User.IsActive) return Results.Unauthorized();
        stored.RevokedAt = DateTimeOffset.UtcNow;
        var rawReplacement = TokenService.CreateRefreshToken();
        stored.ReplacedByTokenHash = TokenService.HashRefreshToken(rawReplacement);
        return await IssueTokens(stored.User, db, tokens, options, true, rawReplacement);
    }

    private static async Task<IResult> Logout(RefreshRequest request, HmsDbContext db)
    {
        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            var hash = TokenService.HashRefreshToken(request.RefreshToken);
            var stored = await db.RefreshTokens.SingleOrDefaultAsync(x => x.TokenHash == hash);
            if (stored is not null && stored.RevokedAt is null)
            {
                stored.RevokedAt = DateTimeOffset.UtcNow;
                var user = await db.Users.SingleOrDefaultAsync(x => x.Id == stored.UserId);
                if (user?.Role == "Doctor") user.ClockedOutAt = DateTimeOffset.UtcNow;
                await db.SaveChangesAsync();
            }
        }
        return Results.NoContent();
    }

    private static async Task<IResult> IssueTokens(AppUser user, HmsDbContext db, TokenService tokens, JwtOptions options, bool rememberMe, string? rawRefreshToken = null)
    {
        var (accessToken, expires) = tokens.CreateAccessToken(user);
        rawRefreshToken ??= TokenService.CreateRefreshToken();
        db.RefreshTokens.Add(new RefreshToken { UserId = user.Id, TokenHash = TokenService.HashRefreshToken(rawRefreshToken), CreatedAt = DateTimeOffset.UtcNow, ExpiresAt = DateTimeOffset.UtcNow.AddDays(rememberMe ? options.RefreshTokenDays : 1) });
        await db.SaveChangesAsync();
        return Results.Ok(new AuthResponse(accessToken, rawRefreshToken, (int)(expires - DateTimeOffset.UtcNow).TotalSeconds,
            new UserResponse(user.Id, user.FullName, [user.Role], user.Permissions.ToArray(), user.DepartmentId, user.DepartmentName, user.Specialty)));
    }
}
