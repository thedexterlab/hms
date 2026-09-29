using System.Text.Json;
using Hms.Api.Auth;
using Hms.Api.Contracts;
using Hms.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Endpoints;

public static class LabOrderEndpoints
{
    private static readonly string[] OrderStatuses = ["Requested", "Report available", "Reviewed"];

    public static IEndpointRouteBuilder MapLabOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/lab-orders").RequireAuthorization();
        group.MapPost("/", Create).RequireAuthorization(Permissions.Policy(Permissions.LabsOrder));
        group.MapGet("/mine", GetMine).RequireAuthorization(Permissions.Policy(Permissions.LabsView));
        group.MapGet("/patient/{patientId:long}", GetForPatient).RequireAuthorization(Permissions.Policy(Permissions.LabsView));
        group.MapPatch("/{id:long}", Update).RequireAuthorization(Permissions.Policy(Permissions.LabsView));
        return app;
    }

    private static async Task<IResult> Create(CreateLabOrderRequest request, HttpContext http, HmsDbContext db, AuditService audit)
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
        }

        var order = new LabOrder
        {
            PatientId = patient.Id, Patient = patient, AppointmentId = appointment?.Id, Appointment = appointment,
            OrderedByUserId = doctor.Id, OrderedBy = doctor, OrderType = request.OrderType.Trim(), Study = request.Study.Trim(),
            ClinicalDetails = request.ClinicalDetails?.Trim(), Status = "Requested", CreatedAt = DateTimeOffset.UtcNow
        };
        db.LabOrders.Add(order);
        await db.SaveChangesAsync();
        audit.Add(http.User, "LabOrder.Created", "LabOrder", order.Id.ToString(),
            changesJson: JsonSerializer.Serialize(new { order.PatientId, order.OrderType, order.Study }),
            ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.Created($"/api/lab-orders/{order.Id}", ToResponse(order));
    }
    // __PART2__
    private static async Task<IResult> GetMine(HttpContext http, HmsDbContext db)
    {
        if (!Guid.TryParse(http.User.FindFirst("sub")?.Value, out var doctorId)) return Results.Unauthorized();
        var records = await db.LabOrders.AsNoTracking().Include(x => x.Patient).Include(x => x.OrderedBy)
            .Where(x => x.OrderedByUserId == doctorId).OrderByDescending(x => x.CreatedAt).Take(200).ToListAsync();
        return Results.Ok(records.Select(ToResponse));
    }

    private static async Task<IResult> GetForPatient(long patientId, HmsDbContext db)
    {
        var records = await db.LabOrders.AsNoTracking().Include(x => x.Patient).Include(x => x.OrderedBy)
            .Where(x => x.PatientId == patientId).OrderByDescending(x => x.CreatedAt).Take(200).ToListAsync();
        return Results.Ok(records.Select(ToResponse));
    }

    private static async Task<IResult> Update(long id, UpdateLabOrderRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        if (string.IsNullOrWhiteSpace(request.Status) && string.IsNullOrWhiteSpace(request.Report))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Provide a status or a report."] });
        if (request.Status is { } status && !OrderStatuses.Contains(status))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Invalid lab order status."] });

        var order = await db.LabOrders.Include(x => x.Patient).Include(x => x.OrderedBy).SingleOrDefaultAsync(x => x.Id == id);
        if (order is null) return Results.NotFound();

        // Doctors may only update their own orders unless they hold Labs.Update.
        var canUpdateAny = http.User.FindAll("permission").Any(claim => claim.Value == Permissions.LabsUpdate);
        if (!Guid.TryParse(http.User.FindFirst("sub")?.Value, out var doctorId) || (order.OrderedByUserId != doctorId && !canUpdateAny))
            return Results.NotFound();

        var previous = order.Status;
        var reportAdded = false;
        if (!string.IsNullOrWhiteSpace(request.Report))
        {
            order.Report = request.Report.Trim();
            order.CompletedAt = DateTimeOffset.UtcNow;
            reportAdded = true;
        }
        order.Status = request.Status ?? (reportAdded ? "Report available" : order.Status);
        if (reportAdded)
        {
            db.Notifications.Add(new Notification
            {
                Title = "Lab report available",
                Detail = $"{order.Study} for {order.Patient.FirstName} {order.Patient.LastName} ({order.Patient.Mrn}) now has a report.",
                Severity = "info", Audience = "Doctor", CreatedAt = DateTimeOffset.UtcNow
            });
        }
        audit.Add(http.User, "LabOrder.Updated", "LabOrder", order.Id.ToString(),
            changesJson: JsonSerializer.Serialize(new { previous, current = order.Status, reportAdded }),
            ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.Ok(ToResponse(order));
    }

    private static LabOrderResponse ToResponse(LabOrder x) => new(x.Id, x.PatientId,
        $"{x.Patient.FirstName} {x.Patient.LastName}".Trim(), x.Patient.Mrn, x.AppointmentId,
        x.OrderedBy?.FullName ?? x.OrderedByUserId.ToString(), x.OrderType, x.Study, x.ClinicalDetails, x.Report,
        x.Status, x.CreatedAt, x.CompletedAt);
}