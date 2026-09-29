using System.Security.Claims;
using System.Text.Json;
using Hms.Api.Auth;
using Hms.Api.Contracts;
using Hms.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Endpoints;

public static class PatientEndpoints
{
    public static IEndpointRouteBuilder MapPatientEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/patients").RequireAuthorization();
        group.MapGet("/", Search).RequireAuthorization(Permissions.Policy(Permissions.PatientsSearch));
        group.MapGet("/{id:long}", GetById).RequireAuthorization(Permissions.Policy(Permissions.PatientsView));
        group.MapPost("/duplicate-check", DuplicateCheck).RequireAuthorization(Permissions.Policy(Permissions.PatientsSearch));
        group.MapPost("/", Create).RequireAuthorization(Permissions.Policy(Permissions.PatientsCreate));
        group.MapPatch("/{id:long}", Update).RequireAuthorization(Permissions.Policy(Permissions.PatientsUpdate));
        return app;
    }

    private static async Task<IResult> Search(string? query, HmsDbContext db)
    {
        var patients = db.Patients.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim();
            patients = patients.Where(x => x.Mrn.Contains(term) || x.FirstName.Contains(term) || x.LastName.Contains(term) || x.PrimaryMobile.Contains(term));
        }
        return Results.Ok((await patients.OrderByDescending(x => x.RegisteredAt).Take(100).ToListAsync()).Select(ToResponse));
    }

    private static async Task<IResult> GetById(long id, HmsDbContext db)
    {
        var patient = await db.Patients.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
        return patient is null ? Results.NotFound() : Results.Ok(ToResponse(patient));
    }

    private static async Task<IResult> DuplicateCheck(CreatePatientRequest request, HmsDbContext db)
    {
        var phone = NormalizePhone(request.PrimaryMobile); var cnic = NormalizeCnic(request.Cnic);
        var matches = await db.Patients.AsNoTracking().Where(x => x.PrimaryMobile == phone || (cnic != null && x.Cnic == cnic) || (x.FirstName == request.FirstName.Trim() && x.LastName == request.LastName.Trim() && x.Dob == request.Dob)).Take(10).ToListAsync();
        return Results.Ok(new DuplicateCheckResponse(matches.Count > 0, matches.Select(ToResponse).ToList()));
    }

    private static async Task<IResult> Create(CreatePatientRequest request, ClaimsPrincipal actor, HttpContext http, HmsDbContext db, AuditService audit)
    {
        if (!request.Consent || !request.PrivacyNotice) return Results.ValidationProblem(new Dictionary<string, string[]> { ["consent"] = ["Consent and privacy acknowledgement are required."] });
        if (request.Dob is null && request.Age is null) return Results.ValidationProblem(new Dictionary<string, string[]> { ["dob"] = ["Date of birth or approximate age is required."] });
        if (request.Dob > DateOnly.FromDateTime(DateTime.UtcNow)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["dob"] = ["Date of birth cannot be in the future."] });
        var phone = NormalizePhone(request.PrimaryMobile); var cnic = NormalizeCnic(request.Cnic);
        if (await db.Patients.AnyAsync(x => x.PrimaryMobile == phone || (cnic != null && x.Cnic == cnic))) return Results.Conflict(new { code = "DUPLICATE_PATIENT", message = "A patient with the same mobile number or CNIC already exists." });

        await using var transaction = db.Database.IsRelational() ? await db.Database.BeginTransactionAsync() : null;
        var patient = new Patient
        {
            Mrn = $"PENDING-{Guid.NewGuid():N}", FirstName = request.FirstName.Trim(), LastName = request.LastName.Trim(), Gender = request.Gender.Trim(), Dob = request.Dob, ApproximateAge = request.Age,
            BloodGroup = Clean(request.BloodGroup), MaritalStatus = Clean(request.MaritalStatus), Cnic = cnic, PrimaryMobile = phone, SecondaryMobile = Clean(request.SecondaryMobile), Email = Clean(request.Email)?.ToLowerInvariant(),
            AddressLine = Clean(request.AddressLine), City = Clean(request.City), District = Clean(request.District), Province = Clean(request.Province), PostalCode = Clean(request.PostalCode),
            GuardianName = Clean(request.GuardianName), GuardianRelationship = Clean(request.GuardianRelationship), GuardianMobile = Clean(request.GuardianMobile), RegistrationType = request.RegistrationType.Trim(), Department = request.Department.Trim(),
            Consent = request.Consent, PrivacyNotice = request.PrivacyNotice, RegisteredAt = DateTimeOffset.UtcNow
        };
        db.Patients.Add(patient); await db.SaveChangesAsync();
        patient.Mrn = $"MH-{DateTime.UtcNow.Year}-{patient.Id:D8}";
        audit.Add(actor, "Patient.Created", "Patient", patient.Id.ToString(), changesJson: JsonSerializer.Serialize(new { patient.Mrn, patient.FirstName, patient.LastName }), ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        if (transaction is not null) await transaction.CommitAsync();
        return Results.Created($"/api/patients/{patient.Id}", new { id = patient.Id, patient.Mrn, mrnProvisional = false });
    }

    private static async Task<IResult> Update(long id, UpdatePatientRequest request, ClaimsPrincipal actor, HttpContext http, HmsDbContext db, AuditService audit)
    {
        var patient = await db.Patients.SingleOrDefaultAsync(x => x.Id == id);
        if (patient is null) return Results.NotFound();
        if (patient.Version != request.Version) return Results.Conflict(new { code = "CONCURRENCY_CONFLICT", currentVersion = patient.Version });
        var before = Snapshot(patient);
        patient.FirstName = Clean(request.FirstName) ?? patient.FirstName; patient.LastName = Clean(request.LastName) ?? patient.LastName;
        patient.Gender = Clean(request.Gender) ?? patient.Gender; patient.Dob = request.Dob ?? patient.Dob; patient.ApproximateAge = request.Age ?? patient.ApproximateAge;
        patient.BloodGroup = Clean(request.BloodGroup) ?? patient.BloodGroup; patient.MaritalStatus = Clean(request.MaritalStatus) ?? patient.MaritalStatus;
        patient.PrimaryMobile = request.PrimaryMobile is null ? patient.PrimaryMobile : NormalizePhone(request.PrimaryMobile);
        patient.SecondaryMobile = Clean(request.SecondaryMobile) ?? patient.SecondaryMobile; patient.Email = Clean(request.Email)?.ToLowerInvariant() ?? patient.Email;
        patient.AddressLine = Clean(request.AddressLine) ?? patient.AddressLine; patient.City = Clean(request.City) ?? patient.City; patient.District = Clean(request.District) ?? patient.District;
        patient.Province = Clean(request.Province) ?? patient.Province; patient.PostalCode = Clean(request.PostalCode) ?? patient.PostalCode;
        patient.GuardianName = Clean(request.GuardianName) ?? patient.GuardianName; patient.GuardianRelationship = Clean(request.GuardianRelationship) ?? patient.GuardianRelationship; patient.GuardianMobile = Clean(request.GuardianMobile) ?? patient.GuardianMobile;
        patient.Version++;
        var changes = JsonSerializer.Serialize(new { before, after = Snapshot(patient) });
        db.PatientAmendments.Add(new PatientAmendment { PatientId = id, ChangesJson = changes, Reason = request.EditReason.Trim(), ChangedBy = actor.FindFirst("sub")?.Value ?? "unknown", ChangedAt = DateTimeOffset.UtcNow });
        audit.Add(actor, "Patient.Amended", "Patient", id.ToString(), request.EditReason.Trim(), changes, http.Connection.RemoteIpAddress?.ToString());
        try { await db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { return Results.Conflict(new { code = "CONCURRENCY_CONFLICT" }); }
        return Results.Ok(ToResponse(patient));
    }

    private static object Snapshot(Patient x) => new { x.FirstName, x.LastName, x.Gender, x.Dob, x.ApproximateAge, x.BloodGroup, x.MaritalStatus, x.PrimaryMobile, x.SecondaryMobile, x.Email, x.AddressLine, x.City, x.District, x.Province, x.PostalCode, x.GuardianName, x.GuardianRelationship, x.GuardianMobile };
    private static PatientResponse ToResponse(Patient x) => new(x.Id, x.Mrn, $"{x.FirstName} {x.LastName}".Trim(), Age(x), x.Gender, x.PrimaryMobile, x.GuardianName ?? "N/A", DateOnly.FromDateTime(x.RegisteredAt.UtcDateTime), x.Status, x.Dob, x.Email, x.GuardianMobile, x.City, x.District, x.MaritalStatus, x.AddressLine, x.Province, x.PostalCode, x.BloodGroup, x.SecondaryMobile, x.GuardianRelationship, x.Consent, x.PrivacyNotice, x.RegistrationType, x.Department, x.Version);
    private static int Age(Patient x) { if (x.ApproximateAge.HasValue) return x.ApproximateAge.Value; if (!x.Dob.HasValue) return 0; var today = DateOnly.FromDateTime(DateTime.UtcNow); var age = today.Year - x.Dob.Value.Year; return x.Dob.Value > today.AddYears(-age) ? age - 1 : age; }
    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static string NormalizePhone(string value) => new(value.Where(char.IsDigit).ToArray());
    private static string? NormalizeCnic(string? value) { var digits = value is null ? null : new string(value.Where(char.IsDigit).ToArray()); return string.IsNullOrWhiteSpace(digits) ? null : digits; }
}
