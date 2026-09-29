using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Hms.Api.Contracts;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Hms.Api.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace Hms.Api.Tests;

public sealed class HmsApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"hms-tests-{Guid.NewGuid():N}";
    public HmsApiFactory() => Environment.SetEnvironmentVariable("ConnectionStrings__Hms", "Server=unused;Port=3306;Database=unused;User=unused;Password=unused");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Hms"] = "Server=unused;Port=3306;Database=unused;User=unused;Password=unused",
            ["SeedDemoUsers"] = "true"
        }));
        builder.ConfigureTestServices(services =>
        {
            // Replace every EF registration from Program.cs (AddDbContextFactory
            // registers options + factory together, so all must go) with a single
            // shared InMemory options instance. The singleton factory that
            // DoctorPresenceMonitor depends on wraps the same options, keeping
            // lifetimes consistent.
            services.RemoveAll<DbContextOptions<HmsDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<HmsDbContext>>();
            services.RemoveAll<IDbContextFactory<HmsDbContext>>();
            services.RemoveAll<HmsDbContext>();
            var options = new DbContextOptionsBuilder<HmsDbContext>().UseInMemoryDatabase(_databaseName).Options;
            services.AddSingleton(options);
            services.AddSingleton<IDbContextFactory<HmsDbContext>>(new InMemoryDbContextFactory(options));
            services.AddScoped<HmsDbContext>(sp => new HmsDbContext(sp.GetRequiredService<DbContextOptions<HmsDbContext>>()));
        });
    }

    private sealed class InMemoryDbContextFactory(DbContextOptions<HmsDbContext> options) : IDbContextFactory<HmsDbContext>
    {
        public HmsDbContext CreateDbContext() => new(options);
        public Task<HmsDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default) => Task.FromResult(CreateDbContext());
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) Environment.SetEnvironmentVariable("ConnectionStrings__Hms", null);
    }
}

public sealed class ApiTests(HmsApiFactory factory) : IClassFixture<HmsApiFactory>
{
    [Fact]
    public async Task Protected_endpoint_rejects_anonymous_requests()
    {
        var response = await factory.CreateClient().GetAsync("/api/patients");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_returns_real_tokens_and_user_permissions()
    {
        var response = await Login();
        Assert.False(string.IsNullOrWhiteSpace(response.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(response.RefreshToken));
        Assert.Contains("Patients.Create", response.User.Permissions);
    }

    [Fact]
    public async Task Patient_creation_issues_permanent_mrn_and_blocks_duplicate_identity()
    {
        var client = factory.CreateClient();
        var auth = await Login(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        var patient = new
        {
            firstName = "Test", lastName = "Patient", gender = "Female", age = 30,
            cnic = "42101-1234567-8", primaryMobile = "+92 300 1234567",
            registrationType = "General OPD", department = "General Medicine", consent = true, privacyNotice = true
        };

        var created = await client.PostAsJsonAsync("/api/patients", patient);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var body = await created.Content.ReadFromJsonAsync<CreatePatientResult>();
        Assert.NotNull(body);
        Assert.StartsWith("MH-", body.Mrn);
        Assert.False(body.MrnProvisional);

        var duplicate = await client.PostAsJsonAsync("/api/patients", patient);
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
    }

    private async Task<AuthResponse> Login(HttpClient? client = null)
    {
        client ??= factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("reception@example.com", "Reception@123", false));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
    }

    [Fact]
    public async Task Doctor_heartbeat_marks_doctor_available_to_reception()
    {
        var doctor = await Login("doctor@master.local", "Doctor@123");
        Assert.Contains("Doctors.Presence", doctor.User.Permissions);

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", doctor.AccessToken);
        var heartbeat = await client.PostAsync("/api/doctors/me/heartbeat", null);
        Assert.Equal(HttpStatusCode.OK, heartbeat.StatusCode);

        var reception = await Login("reception@example.com", "Reception@123");
        var directory = await GetDirectory(reception.AccessToken);
        var master = directory.Single(d => d.Name == "Dr. Master Doctor");
        Assert.Equal("Available", master.Status);
    }

    [Fact]
    public async Task Inactive_doctor_is_clocked_out_after_five_minutes()
    {
        var doctor = await Login("doctor@master.local", "Doctor@123");
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", doctor.AccessToken);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync("/api/doctors/me/heartbeat", null)).StatusCode);

        // Simulate 6 minutes of silence directly in the store, then run the
        // same routine the background monitor executes every minute.
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<HmsDbContext>();
            var user = await db.Users.SingleAsync(u => u.NormalizedUsername == "DOCTOR@MASTER.LOCAL");
            user.LastSeenAt = DateTimeOffset.UtcNow.AddMinutes(-6);
            await db.SaveChangesAsync();
        }

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var monitor = new DoctorPresenceMonitor(
                scope.ServiceProvider.GetRequiredService<IDbContextFactory<HmsDbContext>>(),
                TimeProvider.System,
                NullLogger<DoctorPresenceMonitor>.Instance);
            var clockedOut = await monitor.ClockOutInactiveDoctors();
            Assert.Equal(1, clockedOut);
        }

        var reception = await Login("reception@example.com", "Reception@123");
        var directory = await GetDirectory(reception.AccessToken);
        var master = directory.Single(d => d.Name == "Dr. Master Doctor");
        Assert.Equal("Off Duty", master.Status);
    }

    [Fact]
    public async Task Reception_booking_with_doctor_id_appears_in_that_doctors_queue()
    {
        var reception = await Login("reception@example.com", "Reception@123");
        var receptionClient = factory.CreateClient();
        receptionClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", reception.AccessToken);

        var directory = await GetDirectory(reception.AccessToken);
        var master = directory.Single(d => d.Name == "Dr. Master Doctor");

        var patient = await CreatePatient(receptionClient);
        var booking = await receptionClient.PostAsJsonAsync("/api/appointments", new
        {
            patientId = patient.Id, department = "General Medicine", doctorId = master.Id,
            appointmentDate = DateTime.UtcNow.ToString("yyyy-MM-dd"), appointmentTime = "09:30",
            appointmentType = "OPD", priority = "Normal", paymentStatus = "Pending"
        });
        Assert.Equal(HttpStatusCode.Created, booking.StatusCode);
        var appointment = await booking.Content.ReadFromJsonAsync<AppointmentResponse>();
        Assert.NotNull(appointment);

        var doctor = await Login("doctor@master.local", "Doctor@123");
        var doctorClient = factory.CreateClient();
        doctorClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", doctor.AccessToken);
        var mine = await doctorClient.GetAsync("/api/appointments/mine");
        mine.EnsureSuccessStatusCode();
        var queue = await mine.Content.ReadFromJsonAsync<List<AppointmentResponse>>();
        Assert.Contains(queue!, item => item.Id == appointment.Id && item.PatientName == "Ward Patient");
    }

    [Fact]
    public async Task Doctor_cannot_update_another_doctors_appointment()
    {
        var reception = await Login("reception@example.com", "Reception@123");
        var receptionClient = factory.CreateClient();
        receptionClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", reception.AccessToken);
        var directory = await GetDirectory(reception.AccessToken);
        var master = directory.Single(d => d.Name == "Dr. Master Doctor");
        var patient = await CreatePatient(receptionClient);
        var booking = await receptionClient.PostAsJsonAsync("/api/appointments", new
        {
            patientId = patient.Id, department = "General Medicine", doctorId = master.Id,
            appointmentDate = DateTime.UtcNow.ToString("yyyy-MM-dd"), appointmentTime = "10:00",
            appointmentType = "OPD", priority = "Normal", paymentStatus = "Pending"
        });
        Assert.Equal(HttpStatusCode.Created, booking.StatusCode);
        var appointment = await booking.Content.ReadFromJsonAsync<AppointmentResponse>();

        var otherDoctor = await Login("doctor.opd@mastan.local", "Doctor@123");
        var otherClient = factory.CreateClient();
        otherClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", otherDoctor.AccessToken);
        var response = await otherClient.PatchAsJsonAsync($"/api/appointments/{appointment!.Id}/status", new UpdateAppointmentStatusRequest("Waiting"));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<AuthResponse> Login(string username, string password)
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(username, password, false));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
    }

    private async Task<List<DoctorDirectoryResponse>> GetDirectory(string accessToken)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var response = await client.GetAsync("/api/doctors");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<DoctorDirectoryResponse>>() ?? [];
    }

    private async Task<PatientCreated> CreatePatient(HttpClient client)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var response = await client.PostAsJsonAsync("/api/patients", new
        {
            firstName = "Ward", lastName = "Patient", gender = "Male", age = 40,
            cnic = $"42101-{suffix[..7]}-{suffix[7]}",
            primaryMobile = $"+92300{suffix}",
            registrationType = "General OPD", department = "General Medicine", consent = true, privacyNotice = true
        });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<PatientCreated>() ?? throw new InvalidOperationException("Patient creation returned no body.");
    }

    private sealed record PatientCreated(long Id, string Mrn, bool MrnProvisional);
    private sealed record CreatePatientResult(long Id, string Mrn, bool MrnProvisional);
}
