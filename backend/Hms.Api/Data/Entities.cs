namespace Hms.Api.Data;

public sealed class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Username { get; set; }
    public required string NormalizedUsername { get; set; }
    public required string FullName { get; set; }
    public required string PasswordHash { get; set; }
    public required string Role { get; set; }
    public string? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? Specialty { get; set; }
    public string? Room { get; set; }
    public string? OpdHours { get; set; }
    public DateTimeOffset? ClockedInAt { get; set; }
    public DateTimeOffset? LastSeenAt { get; set; }
    public DateTimeOffset? ClockedOutAt { get; set; }
    public List<string> Permissions { get; set; } = [];
    public int FailedLoginCount { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; }
    public bool IsActive { get; set; } = true;
    public List<RefreshToken> RefreshTokens { get; set; } = [];
}

public sealed class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public required string TokenHash { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }
}

public sealed class Patient
{
    public long Id { get; set; }
    public required string Mrn { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Gender { get; set; }
    public DateOnly? Dob { get; set; }
    public int? ApproximateAge { get; set; }
    public string? BloodGroup { get; set; }
    public string? MaritalStatus { get; set; }
    public string? Cnic { get; set; }
    public required string PrimaryMobile { get; set; }
    public string? SecondaryMobile { get; set; }
    public string? Email { get; set; }
    public string? AddressLine { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string? GuardianName { get; set; }
    public string? GuardianRelationship { get; set; }
    public string? GuardianMobile { get; set; }
    public required string RegistrationType { get; set; }
    public required string Department { get; set; }
    public bool Consent { get; set; }
    public bool PrivacyNotice { get; set; }
    public string Status { get; set; } = "Active";
    public DateTimeOffset RegisteredAt { get; set; }
    public long Version { get; set; } = 1;
    public List<PatientAmendment> Amendments { get; set; } = [];
}

public sealed class PatientAmendment
{
    public long Id { get; set; }
    public long PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public required string ChangesJson { get; set; }
    public required string Reason { get; set; }
    public required string ChangedBy { get; set; }
    public DateTimeOffset ChangedAt { get; set; }
}

public sealed class Appointment
{
    public long Id { get; set; }
    public long PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public required string Department { get; set; }
    public required string DoctorId { get; set; }
    public Guid? DoctorUserId { get; set; }
    public AppUser? Doctor { get; set; }
    public DateOnly AppointmentDate { get; set; }
    public TimeOnly AppointmentTime { get; set; }
    public required string AppointmentType { get; set; }
    public required string Priority { get; set; }
    public string PaymentStatus { get; set; } = "Pending";
    public string Status { get; set; } = "Scheduled";
    public string? AdminNote { get; set; }
    public int TokenNumber { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class AuditEvent
{
    public long Id { get; set; }
    public required string ActorId { get; set; }
    public required string Action { get; set; }
    public required string EntityType { get; set; }
    public required string EntityId { get; set; }
    public string? Reason { get; set; }
    public string? ChangesJson { get; set; }
    public string? IpAddress { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
}

public sealed class Payment
{
    public long Id { get; set; }
    public long PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public long? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public decimal Amount { get; set; }
    public required string Method { get; set; }
    public required string Category { get; set; }
    public string Status { get; set; } = "Paid";
    public string? Reference { get; set; }
    public required string RecordedBy { get; set; }
    public DateTimeOffset RecordedAt { get; set; }
}

public sealed class Consultation
{
    public long Id { get; set; }
    public long PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public long? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public Guid DoctorUserId { get; set; }
    public AppUser Doctor { get; set; } = null!;
    public string? ChiefComplaint { get; set; }
    public string? Diagnosis { get; set; }
    public string? Notes { get; set; }
    public string? BloodPressure { get; set; }
    public string? Temperature { get; set; }
    public string? Pulse { get; set; }
    public string? Weight { get; set; }
    public string? Height { get; set; }
    public string? OxygenSaturation { get; set; }
    public string Status { get; set; } = "Completed";
    public DateTimeOffset CreatedAt { get; set; }
    public List<PrescriptionItem> PrescriptionItems { get; set; } = [];
}

public sealed class PrescriptionItem
{
    public long Id { get; set; }
    public long ConsultationId { get; set; }
    public Consultation Consultation { get; set; } = null!;
    public required string Medicine { get; set; }
    public required string Dosage { get; set; }
    public string? Duration { get; set; }
    public string? Instructions { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTimeOffset? DispensedAt { get; set; }
    public string? DispensedBy { get; set; }
    public string? PharmacyNote { get; set; }
}

public sealed class LabOrder
{
    public long Id { get; set; }
    public long PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public long? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public Guid OrderedByUserId { get; set; }
    public AppUser OrderedBy { get; set; } = null!;
    public required string OrderType { get; set; }
    public required string Study { get; set; }
    public string? ClinicalDetails { get; set; }
    public string? Report { get; set; }
    public string Status { get; set; } = "Requested";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}

public sealed class PharmacyItem
{
    public long Id { get; set; }
    public required string Name { get; set; }
    public required string Unit { get; set; }
    public decimal UnitPrice { get; set; }
    public int StockQuantity { get; set; }
    public int ReorderLevel { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class Notification
{
    public long Id { get; set; }
    public required string Title { get; set; }
    public required string Detail { get; set; }
    public required string Severity { get; set; }
    public required string Audience { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
}
