using System.Text;
using System.Threading.RateLimiting;
using Hms.Api.Auth;
using Hms.Api.Data;
using Hms.Api.Endpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");
var databaseConnection = builder.Configuration.GetConnectionString("Hms")
    ?? throw new InvalidOperationException("ConnectionStrings:Hms is required. Supply it through environment variables or a secret store.");
builder.Services.AddDbContextFactory<HmsDbContext>(options =>
    options.UseMySQL(databaseConnection));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddHostedService<DoctorPresenceMonitor>();

var jwtOptions = JwtOptions.FromConfiguration(builder.Configuration, builder.Environment);
builder.Services.AddSingleton(jwtOptions);
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true,
        ValidIssuer = jwtOptions.Issuer, ValidAudience = jwtOptions.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
        ClockSkew = TimeSpan.FromSeconds(30), NameClaimType = "name", RoleClaimType = "role"
    };
});
builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"];
builder.Services.AddCors(options => options.AddPolicy("frontend", policy =>
    policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

var app = builder.Build();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}
app.UseExceptionHandler();
app.UseCors("frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health");
app.MapAuthEndpoints();
app.MapPatientEndpoints();
app.MapAppointmentEndpoints();
app.MapDoctorEndpoints();
app.MapQueueEndpoints();
app.MapPaymentEndpoints();
app.MapConsultationEndpoints();
app.MapLabOrderEndpoints();
app.MapPharmacyEndpoints();
app.MapNotificationEndpoints();
app.MapActivityEndpoints();
app.MapAdminEndpoints();
await DatabaseInitializer.InitializeAsync(app.Services, app.Environment, app.Configuration);
app.Run();

public partial class Program;
