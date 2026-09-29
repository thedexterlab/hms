using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace Hms.Api.Migrations
{
    /// <inheritdoc />
    public partial class MySqlInitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "AuditEvents",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    ActorId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    Action = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    EntityType = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    EntityId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    Reason = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    ChangesJson = table.Column<string>(type: "longtext", nullable: true),
                    IpAddress = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: true),
                    OccurredAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditEvents", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Patients",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Mrn = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    FirstName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    Gender = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false),
                    Dob = table.Column<DateOnly>(type: "date", nullable: true),
                    ApproximateAge = table.Column<int>(type: "int", nullable: true),
                    BloodGroup = table.Column<string>(type: "varchar(5)", maxLength: 5, nullable: true),
                    MaritalStatus = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: true),
                    Cnic = table.Column<string>(type: "varchar(13)", maxLength: 13, nullable: true),
                    PrimaryMobile = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false),
                    SecondaryMobile = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "varchar(254)", maxLength: 254, nullable: true),
                    AddressLine = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: true),
                    City = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    District = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    Province = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    PostalCode = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    GuardianName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true),
                    GuardianRelationship = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true),
                    GuardianMobile = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: true),
                    RegistrationType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    Department = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    Consent = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    PrivacyNotice = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false),
                    RegisteredAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Patients", x => x.Id);
                    table.CheckConstraint("CK_Patients_Age", "`ApproximateAge` IS NULL OR (`ApproximateAge` BETWEEN 0 AND 120)");
                    table.CheckConstraint("CK_Patients_Version", "`Version` > 0");
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Username = table.Column<string>(type: "varchar(254)", maxLength: 254, nullable: false),
                    NormalizedUsername = table.Column<string>(type: "varchar(254)", maxLength: 254, nullable: false),
                    FullName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: false),
                    Role = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    DepartmentId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    DepartmentName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true),
                    Specialty = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true),
                    Room = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    OpdHours = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    ClockedInAt = table.Column<DateTimeOffset>(type: "datetime", nullable: true),
                    LastSeenAt = table.Column<DateTimeOffset>(type: "datetime", nullable: true),
                    ClockedOutAt = table.Column<DateTimeOffset>(type: "datetime", nullable: true),
                    Permissions = table.Column<string>(type: "longtext", nullable: false),
                    FailedLoginCount = table.Column<int>(type: "int", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetime", nullable: true),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.CheckConstraint("CK_Users_FailedLoginCount", "`FailedLoginCount` >= 0");
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PatientAmendments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    PatientId = table.Column<long>(type: "bigint", nullable: false),
                    ChangesJson = table.Column<string>(type: "longtext", nullable: false),
                    Reason = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false),
                    ChangedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    ChangedAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientAmendments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PatientAmendments_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Appointments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    PatientId = table.Column<long>(type: "bigint", nullable: false),
                    Department = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    DoctorId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    DoctorUserId = table.Column<Guid>(type: "char(36)", nullable: true),
                    AppointmentDate = table.Column<DateOnly>(type: "date", nullable: false),
                    AppointmentTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    AppointmentType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    Priority = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false),
                    PaymentStatus = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false),
                    AdminNote = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: true),
                    TokenNumber = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appointments", x => x.Id);
                    table.CheckConstraint("CK_Appointments_TokenNumber", "`TokenNumber` > 0");
                    table.ForeignKey(
                        name: "FK_Appointments_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Appointments_Users_DoctorUserId",
                        column: x => x.DoctorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    UserId = table.Column<Guid>(type: "char(36)", nullable: false),
                    TokenHash = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    RevokedAt = table.Column<DateTimeOffset>(type: "datetime", nullable: true),
                    ReplacedByTokenHash = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.CheckConstraint("CK_RefreshTokens_Expiry", "`ExpiresAt` > `CreatedAt`");
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_Department_AppointmentDate_TokenNumber",
                table: "Appointments",
                columns: new[] { "Department", "AppointmentDate", "TokenNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_DoctorUserId",
                table: "Appointments",
                column: "DoctorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_PatientId_AppointmentDate_AppointmentTime",
                table: "Appointments",
                columns: new[] { "PatientId", "AppointmentDate", "AppointmentTime" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditEvents_OccurredAt",
                table: "AuditEvents",
                column: "OccurredAt");

            migrationBuilder.CreateIndex(
                name: "IX_PatientAmendments_PatientId",
                table: "PatientAmendments",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_Patients_Cnic",
                table: "Patients",
                column: "Cnic",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Patients_Mrn",
                table: "Patients",
                column: "Mrn",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Patients_PrimaryMobile",
                table: "Patients",
                column: "PrimaryMobile");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_TokenHash",
                table: "RefreshTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_NormalizedUsername",
                table: "Users",
                column: "NormalizedUsername",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Appointments");

            migrationBuilder.DropTable(
                name: "AuditEvents");

            migrationBuilder.DropTable(
                name: "PatientAmendments");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "Patients");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
