using System.Text.Json;
using Hms.Api.Auth;
using Hms.Api.Contracts;
using Hms.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hms.Api.Endpoints;

public static class PaymentEndpoints
{
    public static IEndpointRouteBuilder MapPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/payments").RequireAuthorization();
        group.MapGet("/", List).RequireAuthorization(Permissions.Policy(Permissions.PaymentsView));
        group.MapPost("/", Create).RequireAuthorization(Permissions.Policy(Permissions.PaymentsCreate));
        return app;
    }

    private static async Task<IResult> List(DateOnly? date, long? patientId, HmsDbContext db)
    {
        var payments = db.Payments.AsNoTracking().Include(x => x.Patient).AsQueryable();
        if (date is { } day)
        {
            var start = new DateTimeOffset(day.Year, day.Month, day.Day, 0, 0, 0, TimeSpan.Zero);
            payments = payments.Where(x => x.RecordedAt >= start && x.RecordedAt < start.AddDays(1));
        }
        if (patientId is { } id) payments = payments.Where(x => x.PatientId == id);
        var records = await payments.OrderByDescending(x => x.RecordedAt).Take(200).ToListAsync();
        return Results.Ok(records.Select(ToResponse));
    }

    private static async Task<IResult> Create(CreatePaymentRequest request, HttpContext http, HmsDbContext db, AuditService audit)
    {
        if (request.Amount <= 0) return Results.ValidationProblem(new Dictionary<string, string[]> { ["amount"] = ["Payment amount must be greater than zero."] });
        if (string.IsNullOrWhiteSpace(request.Method)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["method"] = ["Payment method is required."] });
        if (string.IsNullOrWhiteSpace(request.Category)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["category"] = ["Payment category is required."] });
        var patient = await db.Patients.SingleOrDefaultAsync(x => x.Id == request.PatientId);
        if (patient is null) return Results.ValidationProblem(new Dictionary<string, string[]> { ["patientId"] = ["Patient was not found."] });
        Appointment? appointment = null;
        if (request.AppointmentId is { } appointmentId)
        {
            appointment = await db.Appointments.SingleOrDefaultAsync(x => x.Id == appointmentId);
            if (appointment is null || appointment.PatientId != patient.Id)
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["appointmentId"] = ["Appointment was not found for this patient."] });
        }

        var now = DateTimeOffset.UtcNow;
        var payment = new Payment
        {
            PatientId = patient.Id, Patient = patient, AppointmentId = appointment?.Id, Appointment = appointment,
            Amount = request.Amount, Method = request.Method.Trim(), Category = request.Category.Trim(),
            Status = "Paid", Reference = request.Reference?.Trim(), RecordedBy = http.User.FindFirst("name")?.Value ?? "unknown", RecordedAt = now
        };
        if (appointment is not null) appointment.PaymentStatus = "Paid";
        db.Payments.Add(payment);
        db.Notifications.Add(new Notification
        {
            Title = "Payment recorded",
            Detail = $"A payment of {request.Amount:0.##} was recorded for {patient.FirstName} {patient.LastName} ({patient.Mrn}).",
            Severity = "info", Audience = "Reception", CreatedAt = now
        });
        await db.SaveChangesAsync();
        audit.Add(http.User, "Payment.Created", "Payment", payment.Id.ToString(),
            changesJson: JsonSerializer.Serialize(new { request.PatientId, request.Amount, request.Method, request.Category }),
            ipAddress: http.Connection.RemoteIpAddress?.ToString());
        await db.SaveChangesAsync();
        return Results.Created($"/api/payments/{payment.Id}", ToResponse(payment));
    }

    private static PaymentResponse ToResponse(Payment x) => new(x.Id, x.PatientId, $"{x.Patient.FirstName} {x.Patient.LastName}".Trim(),
        x.Patient.Mrn, x.AppointmentId, x.Amount, x.Method, x.Category, x.Status, x.Reference, x.RecordedBy, x.RecordedAt);
}