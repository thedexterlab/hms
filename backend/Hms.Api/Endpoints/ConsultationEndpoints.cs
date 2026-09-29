using System.Text.Json;
using Hms.Api.Auth;
using Hms.Api.Contracts;
using Hms.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Endpoints;

public static class ConsultationEndpoints
{
    public static IEndpointRouteBuilder MapConsultationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/consultations").RequireAuthorization();
        group.MapPost("/", Create).RequireAuthorization(Permissions.Policy(Permissions.ConsultationsCreate));
        group.MapGet("/mine", GetMine).RequireAuthorization(Permissions.Policy(Permissions.ConsultationsView));
        group.MapGet("/patient/{patientId:long}", GetForPatient).RequireAuthorization(Permissions.Policy(Permissions.ConsultationsView));
        group.MapGet("/{id:long}", GetById).RequireAuthorization(Permissions.Policy(Permissions.ConsultationsView));
        return app;
    }

    private static async Task<IResult> Create(CreateConsultationRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        if (!Guid.TryParse(http.User.FindFirst("sub")?.Value, out var doctorId)) return Results.Unauthorized();
        var doctor = await db.Users.SingleOrDefaultAsync(x => x.Id == doctorId && x.Role == "Doctor" && x.IsActive);
        if (doctor is null) return Results.Forbid();
        var patient = await db.Patients.SingleOrDefaultAsync(x => x.Id == request.PatientId);
        if (patient is null) return Results.ValidationProblem(new Dictionary<string, string[]> { ["patientId"] = ["Patient was not found."] });
        Appointment? appointment = null;
        if (request.AppointmentId is { } appointmentId)
        {
            appointment = await db.Appointments.SingleOrDefaultAsync(x => x.Id == appointmentId);
            if (appointment is null || appointment.PatientId != patient.Id)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["appointmentId"] = ["Appointment was not found for this patient."] });
            if (appointment.DoctorUserId is { } owner && owner != doctorId)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["appointmentId"] = ["Appointment belongs to another doctor."] });
        }
        if (request.Prescription is { Count: > 0 } && request.Prescription.Any(x => string.IsNullOrWhiteSpace(x.Medicine) || string.IsNullOrWhiteSpace(x.Dosage)))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["prescription"] = ["Every prescribed medicine requires a name and dosage."] });

        var now = DateTimeOffset.UtcNow;
        var consultation = new Consultation
        {
            PatientId = patient.Id, Patient = patient, AppointmentId = appointment?.Id, Appointment = appointment,
            DoctorUserId = doctor.Id, Doctor = doctor, ChiefComplaint = request.ChiefComplaint?.Trim(),
            Diagnosis = request.Diagnosis?.Trim(), Notes = request.Notes?.Trim(),
            BloodPressure = request.BloodPressure?.Trim(), Temperature = request.Temperature?.Trim(), Pulse = request.Pulse?.Trim(),
            Weight = request.Weight?.Trim(), Height = request.Height?.Trim(), OxygenSaturation = request.OxygenSaturation?.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Completed" : request.Status.Trim(), CreatedAt = now
        };
        if (request.Prescription is { Count: > 0 })
        {
            consultation.PrescriptionItems.AddRange(request.Prescription.Select(x => new PrescriptionItem
            {
                Medicine = x.Medicine.Trim(), Dosage = x.Dosage.Trim(), Duration = x.Duration?.Trim(), Instructions = x.Instructions?.Trim()
            }));
        }
        db.Consultations.Add(consultation);
        if (consultation.PrescriptionItems.Count > 0)
        {
            db.Notifications.Add(new Notification
            {
                Title = "New prescription pending",
                Detail = $"{doctor.FullName} prescribed {consultation.PrescriptionItems.Count} medicine(s) for {patient.FirstName} {patient.LastName} ({patient.Mrn}).",
                Severity = "info", Audience = "Pharmacy", CreatedAt = now
            });
        }
        await db.SaveChangesAsync();
        audit.Add(http.User, "Consultation.Created", "Consultation", consultation.Id.ToString(),
            changesJson: JsonSerializer.Serialize(new { consultation.PatientId, consultation.AppointmentId, medicines = consultation.PrescriptionItems.Count }),
            ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.Created($"/api/consultations/{consultation.Id}", ToResponse(consultation));
    }
    // __PART2__
    private static async Task<IResult> GetMine(HttpContext http, HmsDbContext db)
    {
        if (!Guid.TryParse(http.User.FindFirst("sub")?.Value, out var doctorId)) return Results.Unauthorized();
        var records = await db.Consultations.AsNoTracking().Include(x => x.Patient).Include(x => x.Doctor).Include(x => x.PrescriptionItems)
            .Where(x => x.DoctorUserId == doctorId).OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync();
        return Results.Ok(records.Select(ToResponse));
    }

    private static async Task<IResult> GetForPatient(long patientId, HmsDbContext db)
    {
        var records = await db.Consultations.AsNoTracking().Include(x => x.Patient).Include(x => x.Doctor).Include(x => x.PrescriptionItems)
            .Where(x => x.PatientId == patientId).OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync();
        return Results.Ok(records.Select(ToResponse));
    }

    private static async Task<IResult> GetById(long id, HmsDbContext db)
    {
        var consultation = await db.Consultations.AsNoTracking().Include(x => x.Patient).Include(x => x.Doctor).Include(x => x.PrescriptionItems)
            .SingleOrDefaultAsync(x => x.Id == id);
        return consultation is null ? Results.NotFound() : Results.Ok(ToResponse(consultation));
    }

    private static ConsultationResponse ToResponse(Consultation x) => new(
        x.Id, x.PatientId, $"{x.Patient.FirstName} {x.Patient.LastName}".Trim(), x.Patient.Mrn, x.AppointmentId,
        x.Doctor?.FullName ?? x.DoctorUserId.ToString(), x.ChiefComplaint, x.Diagnosis, x.Notes,
        new Dictionary<string, string?>
        {
            ["bloodPressure"] = x.BloodPressure, ["temperature"] = x.Temperature, ["pulse"] = x.Pulse,
            ["weight"] = x.Weight, ["height"] = x.Height, ["oxygenSaturation"] = x.OxygenSaturation
        },
        x.Status, x.CreatedAt,
        x.PrescriptionItems.OrderBy(i => i.Id).Select(i => new PrescriptionItemResponse(i.Id, i.Medicine, i.Dosage, i.Duration, i.Instructions, i.Status, i.DispensedAt, i.DispensedBy, i.PharmacyNote)).ToList());
}