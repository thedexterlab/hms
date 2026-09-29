using System.ComponentModel.DataAnnotations;

namespace Hms.Api.Contracts;

public sealed record CreatePatientRequest(
    [property: Required, MaxLength(100)] string FirstName,
    [property: Required, MaxLength(100)] string LastName,
    [property: Required, MaxLength(30)] string Gender,
    DateOnly? Dob, [property: Range(0, 120)] int? Age,
    [property: MaxLength(5)] string? BloodGroup, [property: MaxLength(30)] string? MaritalStatus,
    [property: MaxLength(15)] string? Cnic,
    [property: Required, MinLength(7), MaxLength(30)] string PrimaryMobile,
    [property: MaxLength(30)] string? SecondaryMobile, [property: EmailAddress, MaxLength(254)] string? Email,
    [property: MaxLength(250)] string? AddressLine, [property: MaxLength(100)] string? City,
    [property: MaxLength(100)] string? District, [property: MaxLength(100)] string? Province,
    [property: MaxLength(20)] string? PostalCode, [property: MaxLength(200)] string? GuardianName,
    [property: MaxLength(50)] string? GuardianRelationship, [property: MaxLength(30)] string? GuardianMobile,
    [property: Required, MaxLength(50)] string RegistrationType,
    [property: Required, MaxLength(100)] string Department, bool Consent, bool PrivacyNotice);

public sealed record UpdatePatientRequest(
    [property: Required, MinLength(3), MaxLength(500)] string EditReason, long Version,
    [property: MaxLength(100)] string? FirstName = null, [property: MaxLength(100)] string? LastName = null,
    [property: MaxLength(30)] string? Gender = null, DateOnly? Dob = null, [property: Range(0, 120)] int? Age = null,
    [property: MaxLength(5)] string? BloodGroup = null, [property: MaxLength(30)] string? MaritalStatus = null,
    [property: MinLength(7), MaxLength(30)] string? PrimaryMobile = null, [property: MaxLength(30)] string? SecondaryMobile = null,
    [property: EmailAddress, MaxLength(254)] string? Email = null, [property: MaxLength(250)] string? AddressLine = null,
    [property: MaxLength(100)] string? City = null, [property: MaxLength(100)] string? District = null,
    [property: MaxLength(100)] string? Province = null, [property: MaxLength(20)] string? PostalCode = null,
    [property: MaxLength(200)] string? GuardianName = null, [property: MaxLength(50)] string? GuardianRelationship = null,
    [property: MaxLength(30)] string? GuardianMobile = null);

public sealed record PatientResponse(long Id, string Mrn, string FullName, int Age, string Gender, string Mobile,
    string GuardianName, DateOnly RegistrationDate, string Status, DateOnly? Dob, string? Email, string? GuardianMobile,
    string? City, string? District, string? MaritalStatus, string? AddressLine, string? Province, string? PostalCode,
    string? BloodGroup, string? SecondaryMobile, string? GuardianRelationship, bool Consent, bool PrivacyNotice,
    string RegistrationType, string Department, long Version);

public sealed record DuplicateCheckResponse(bool Warning, IReadOnlyList<PatientResponse> Matches);
