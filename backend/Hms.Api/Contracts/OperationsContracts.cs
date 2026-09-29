using System.ComponentModel.DataAnnotations;

namespace Hms.Api.Contracts;

public sealed record DashboardSummaryResponse(int RegistrationsToday, int AppointmentsToday, int WaitingPatients,
    int CheckedInPatients, int WalkInPatients, int CancelledAppointments, int NoShows, int PendingPayments);

public sealed record QueueItemResponse(long Id, int TokenNumber, string PatientName, string Mrn,
    string Department, string Doctor, string Priority, string Status, string WaitingDuration);

public sealed record CreatePaymentRequest(long PatientId, long? AppointmentId,
    [property: Range(0.01, 999999999)] decimal Amount, [property: Required, MaxLength(50)] string Method,
    [property: Required, MaxLength(50)] string Category, [property: MaxLength(100)] string? Reference);

public sealed record PaymentResponse(long Id, long PatientId, string PatientName, string Mrn, long? AppointmentId,
    decimal Amount, string Method, string Category, string Status, string? Reference, string RecordedBy,
    DateTimeOffset RecordedAt);

public sealed record PrescriptionItemInput([property: Required, MaxLength(200)] string Medicine,
    [property: Required, MaxLength(200)] string Dosage, [property: MaxLength(100)] string? Duration,
    [property: MaxLength(500)] string? Instructions);

public sealed record PrescriptionItemResponse(long Id, string Medicine, string Dosage, string? Duration,
    string? Instructions, string Status, DateTimeOffset? DispensedAt, string? DispensedBy, string? PharmacyNote);

public sealed record CreateConsultationRequest(long PatientId, long? AppointmentId,
    [property: MaxLength(500)] string? ChiefComplaint, [property: MaxLength(500)] string? Diagnosis,
    [property: MaxLength(2000)] string? Notes, [property: MaxLength(20)] string? BloodPressure,
    [property: MaxLength(20)] string? Temperature, [property: MaxLength(20)] string? Pulse,
    [property: MaxLength(20)] string? Weight, [property: MaxLength(20)] string? Height,
    [property: MaxLength(20)] string? OxygenSaturation, [property: MaxLength(30)] string? Status,
    IReadOnlyList<PrescriptionItemInput>? Prescription);

public sealed record ConsultationResponse(long Id, long PatientId, string PatientName, string Mrn, long? AppointmentId,
    string Doctor, string? ChiefComplaint, string? Diagnosis, string? Notes,
    IReadOnlyDictionary<string, string?> Vitals, string Status, DateTimeOffset CreatedAt,
    IReadOnlyList<PrescriptionItemResponse> Prescription);

public sealed record CreateLabOrderRequest(long PatientId, long? AppointmentId,
    [property: Required, MaxLength(50)] string OrderType, [property: Required, MaxLength(200)] string Study,
    [property: MaxLength(500)] string? ClinicalDetails);

public sealed record UpdateLabOrderRequest([property: MaxLength(30)] string? Status, string? Report);

public sealed record LabOrderResponse(long Id, long PatientId, string PatientName, string Mrn, long? AppointmentId,
    string Doctor, string OrderType, string Study, string? ClinicalDetails, string? Report, string Status,
    DateTimeOffset CreatedAt, DateTimeOffset? CompletedAt);

public sealed record PharmacyInventoryResponse(long Id, string Name, string Unit, decimal UnitPrice,
    int StockQuantity, int ReorderLevel, string Level, DateTimeOffset UpdatedAt);

public sealed record CreatePharmacyItemRequest([property: Required, MaxLength(200)] string Name,
    [property: Required, MaxLength(50)] string Unit, [property: Range(0, 999999999)] decimal UnitPrice,
    [property: Range(0, int.MaxValue)] int StockQuantity, [property: Range(0, int.MaxValue)] int ReorderLevel);

public sealed record UpdatePharmacyItemRequest([property: Range(0, int.MaxValue)] int StockQuantity,
    [property: Range(0, int.MaxValue)] int? ReorderLevel);

public sealed record DispenseRequest([property: MaxLength(500)] string? Note);

public sealed record DispenseResponse(long Id, long PatientId, string PatientName, string Mrn, string Doctor,
    DateTimeOffset CreatedAt, string Status, string? PharmacyNote, DateTimeOffset? DispensedAt, string? DispensedBy,
    IReadOnlyList<PrescriptionItemResponse> Medicines);

public sealed record NotificationResponse(long Id, string Title, string Detail, string Severity, string Audience,
    DateTimeOffset CreatedAt, DateTimeOffset? ReadAt);

public sealed record ActivityResponse(long Id, string ActorId, string Action, string EntityType, string EntityId,
    string? Reason, string? ChangesJson, string? IpAddress, DateTimeOffset OccurredAt);