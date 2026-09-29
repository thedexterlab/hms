using System.Text.Json;
using Hms.Api.Auth;
using Hms.Api.Contracts;
using Hms.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Endpoints;

public static class AppointmentEndpoints
{
    public static IEndpointRouteBuilder MapAppointmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/appointments").RequireAuthorization();
        group.MapGet("/", GetAll).RequireAuthorization(Permissions.Policy(Permissions.AppointmentsView));
        group.MapGet("/mine", GetMine).RequireAuthorization(Permissions.Policy(Permissions.AppointmentsView));
        group.MapPost("/", Create).RequireAuthorization(Permissions.Policy(Permissions.AppointmentsCreate));
        group.MapPatch("/{id:long}/status", UpdateStatus).RequireAuthorization(Permissions.Policy(Permissions.AppointmentsView));
        return app;
    }

    private static async Task<IResult> GetAll(HmsDbContext db)
    {
        var records = await db.Appointments.AsNoTracking().Include(x => x.Patient).Include(x => x.Doctor)
            .OrderBy(x => x.AppointmentDate).ThenBy(x => x.AppointmentTime).Take(200).ToListAsync();
        return Results.Ok(records.Select(ToResponse));
    }

    private static async Task<IResult> GetMine(HttpContext http, HmsDbContext db)
    {
        if (!Guid.TryParse(http.User.FindFirst("sub")?.Value, out var doctorId)) return Results.Unauthorized();
        var records = await db.Appointments.AsNoTracking().Include(x => x.Patient).Include(x => x.Doctor)
            .Where(x => x.DoctorUserId == doctorId).OrderBy(x => x.AppointmentDate).ThenBy(x => x.AppointmentTime).Take(200).ToListAsync();
        return Results.Ok(records.Select(ToResponse));
    }

    private static async Task<IResult> Create(CreateAppointmentRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        if (request.AppointmentDate < DateOnly.FromDateTime(DateTime.UtcNow)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["appointmentDate"] = ["Appointment date cannot be in the past."] });
        var patient = await db.Patients.SingleOrDefaultAsync(x => x.Id == request.PatientId);
        if (patient is null) return Results.ValidationProblem(new Dictionary<string, string[]> { ["patientId"] = ["Patient was not found."] });
        if (!Guid.TryParse(request.DoctorId, out var doctorId)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["doctorId"] = ["Select a valid doctor."] });
        var doctor = await db.Users.SingleOrDefaultAsync(x => x.Id == doctorId && x.Role == "Doctor" && x.IsActive);
        if (doctor is null) return Results.ValidationProblem(new Dictionary<string, string[]> { ["doctorId"] = ["Doctor was not found or is inactive."] });
        var duplicate = await db.Appointments.AnyAsync(x => x.PatientId == request.PatientId && x.AppointmentDate == request.AppointmentDate && x.AppointmentTime == request.AppointmentTime && x.Status != "Cancelled");
        if (duplicate) return Results.Conflict(new { code = "DUPLICATE_APPOINTMENT" });
        var nextToken = (await db.Appointments.Where(x => x.AppointmentDate == request.AppointmentDate && x.Department == request.Department).MaxAsync(x => (int?)x.TokenNumber) ?? 0) + 1;
        var appointment = new Appointment
        {
            PatientId = patient.Id, Patient = patient, Department = request.Department.Trim(), DoctorId = doctor.Id.ToString(), DoctorUserId = doctor.Id, Doctor = doctor, AppointmentDate = request.AppointmentDate,
            AppointmentTime = request.AppointmentTime, AppointmentType = request.AppointmentType.Trim(), Priority = request.Priority.Trim(),
            PaymentStatus = string.IsNullOrWhiteSpace(request.PaymentStatus) ? "Pending" : request.PaymentStatus.Trim(), AdminNote = request.AdminNote?.Trim(), TokenNumber = nextToken, CreatedAt = DateTimeOffset.UtcNow
        };
        db.Appointments.Add(appointment); await db.SaveChangesAsync();
        audit.Add(http.User, "Appointment.Created", "Appointment", appointment.Id.ToString(), changesJson: JsonSerializer.Serialize(new { appointment.PatientId, appointment.AppointmentDate, appointment.AppointmentTime, appointment.Department }), ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.Created($"/api/appointments/{appointment.Id}", ToResponse(appointment));
    }

    private static readonly string[] ReceptionStatuses = ["Scheduled", "Checked In", "Waiting", "In consultation", "Completed", "Cancelled", "No Show"];
    private static readonly string[] DoctorStatuses = ["Waiting", "In consultation", "Completed"];
    private static readonly string[] TerminalStatuses = ["Completed", "Cancelled", "No Show"];

    private static async Task<IResult> UpdateStatus(long id, UpdateAppointmentStatusRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        if (!ReceptionStatuses.Contains(request.Status)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Invalid appointment status."] });
        var appointment = await db.Appointments.SingleOrDefaultAsync(x => x.Id == id);
        if (appointment is null) return Results.NotFound();

        // Queue managers (reception) may set any non-doctor-restricted status on
        // any appointment, but never resurrect a terminal one. Doctors remain
        // scoped to their own queue and the three statuses they own.
        if (http.User.FindAll("permission").Any(claim => claim.Value == Permissions.QueueManage))
        {
            if (TerminalStatuses.Contains(appointment.Status))
                return Results.Conflict(new { code = "TERMINAL_STATUS", message = "Completed, cancelled, and no-show appointments cannot change status." });
        }
        else
        {
            if (!Guid.TryParse(http.User.FindFirst("sub")?.Value, out var doctorId) || appointment.DoctorUserId != doctorId) return Results.NotFound();
            if (!DoctorStatuses.Contains(request.Status)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Doctors may only set Waiting, In consultation, or Completed."] });
        }

        var previous = appointment.Status; appointment.Status = request.Status;
        audit.Add(http.User, "Appointment.StatusChanged", "Appointment", id.ToString(), changesJson: JsonSerializer.Serialize(new { previous, current = request.Status }), ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static AppointmentResponse ToResponse(Appointment x) => new(x.Id, x.TokenNumber, x.AppointmentTime.ToString("HH:mm"), $"{x.Patient.FirstName} {x.Patient.LastName}", x.Patient.Mrn, x.Doctor?.FullName ?? x.DoctorId, x.Department, x.AppointmentType, x.Status, x.PaymentStatus);
}
