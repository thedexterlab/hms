using System.ComponentModel.DataAnnotations;

namespace Hms.Api.Contracts;

public sealed record CreateAppointmentRequest(long PatientId, [property: Required, MaxLength(100)] string Department,
    [property: Required, MaxLength(100)] string DoctorId, DateOnly AppointmentDate, TimeOnly AppointmentTime,
    [property: Required, MaxLength(50)] string AppointmentType, [property: Required, MaxLength(30)] string Priority,
    [property: MaxLength(30)] string? PaymentStatus, [property: MaxLength(250)] string? AdminNote);

public sealed record AppointmentResponse(long Id, int TokenNumber, string AppointmentTime, string PatientName,
    string Mrn, string Doctor, string Department, string AppointmentType, string Status, string PaymentStatus);

public sealed record UpdateAppointmentStatusRequest(string Status);
