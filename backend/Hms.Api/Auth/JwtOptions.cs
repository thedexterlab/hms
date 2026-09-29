using System.Security.Cryptography;

namespace Hms.Api.Auth;

public sealed record JwtOptions(string Issuer, string Audience, string SigningKey, int AccessTokenMinutes, int RefreshTokenDays)
{
    public static JwtOptions FromConfiguration(IConfiguration configuration, IHostEnvironment environment)
    {
        var issuer = configuration["Jwt:Issuer"] ?? "Hms.Api";
        var audience = configuration["Jwt:Audience"] ?? "Hms.Web";
        var key = configuration["Jwt:SigningKey"];
        if (string.IsNullOrWhiteSpace(key))
        {
            if (!environment.IsDevelopment()) throw new InvalidOperationException("Jwt:SigningKey must be supplied through secure configuration.");
            key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        }
        if (System.Text.Encoding.UTF8.GetByteCount(key) < 32) throw new InvalidOperationException("Jwt:SigningKey must contain at least 32 UTF-8 bytes.");
        return new(issuer, audience, key, configuration.GetValue("Jwt:AccessTokenMinutes", 15), configuration.GetValue("Jwt:RefreshTokenDays", 7));
    }
}
