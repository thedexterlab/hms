using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Hms.Api.Data;
using Microsoft.IdentityModel.Tokens;

namespace Hms.Api.Auth;

public sealed class TokenService(JwtOptions options)
{
    public (string Token, DateTimeOffset ExpiresAt) CreateAccessToken(AppUser user)
    {
        var expires = DateTimeOffset.UtcNow.AddMinutes(options.AccessTokenMinutes);
        var claims = new List<Claim> { new(JwtRegisteredClaimNames.Sub, user.Id.ToString()), new("name", user.FullName), new("role", user.Role), new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")) };
        claims.AddRange(user.Permissions.Select(p => new Claim("permission", p)));
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.SigningKey)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(options.Issuer, options.Audience, claims, expires: expires.UtcDateTime, signingCredentials: credentials);
        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    public static string CreateRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    public static string HashRefreshToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
