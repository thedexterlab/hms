using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace Hms.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOperationsModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Consultations",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    PatientId = table.Column<long>(type: "bigint", nullable: false),
                    AppointmentId = table.Column<long>(type: "bigint", nullable: true),
                    DoctorUserId = table.Column<Guid>(type: "char(36)", nullable: false),
                    ChiefComplaint = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    Diagnosis = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: true),
                    BloodPressure = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    Temperature = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    Pulse = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    Weight = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    Height = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    OxygenSaturation = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Consultations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Consultations_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Consultations_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Consultations_Users_DoctorUserId",
                        column: x => x.DoctorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "LabOrders",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    PatientId = table.Column<long>(type: "bigint", nullable: false),
                    AppointmentId = table.Column<long>(type: "bigint", nullable: true),
                    OrderedByUserId = table.Column<Guid>(type: "char(36)", nullable: false),
                    OrderType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    Study = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false),
                    ClinicalDetails = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    Report = table.Column<string>(type: "longtext", nullable: true),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LabOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LabOrders_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LabOrders_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LabOrders_Users_OrderedByUserId",
                        column: x => x.OrderedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false),
                    Detail = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: false),
                    Severity = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false),
                    Audience = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    ReadAt = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    PatientId = table.Column<long>(type: "bigint", nullable: false),
                    AppointmentId = table.Column<long>(type: "bigint", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false),
                    Method = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false),
                    Reference = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    RecordedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    RecordedAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.CheckConstraint("CK_Payments_Amount", "`Amount` >= 0");
                    table.ForeignKey(
                        name: "FK_Payments_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Payments_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PharmacyItems",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false),
                    Unit = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false),
                    StockQuantity = table.Column<int>(type: "int", nullable: false),
                    ReorderLevel = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PharmacyItems", x => x.Id);
                    table.CheckConstraint("CK_PharmacyItems_ReorderLevel", "`ReorderLevel` >= 0");
                    table.CheckConstraint("CK_PharmacyItems_Stock", "`StockQuantity` >= 0");
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PrescriptionItems",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    ConsultationId = table.Column<long>(type: "bigint", nullable: false),
                    Medicine = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false),
                    Dosage = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false),
                    Duration = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    Instructions = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false),
                    DispensedAt = table.Column<DateTimeOffset>(type: "datetime", nullable: true),
                    DispensedBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    PharmacyNote = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrescriptionItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrescriptionItems_Consultations_ConsultationId",
                        column: x => x.ConsultationId,
                        principalTable: "Consultations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Consultations_AppointmentId",
                table: "Consultations",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Consultations_DoctorUserId",
                table: "Consultations",
                column: "DoctorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Consultations_PatientId_CreatedAt",
                table: "Consultations",
                columns: new[] { "PatientId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_LabOrders_AppointmentId",
                table: "LabOrders",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_LabOrders_OrderedByUserId",
                table: "LabOrders",
                column: "OrderedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_LabOrders_PatientId_CreatedAt",
                table: "LabOrders",
                columns: new[] { "PatientId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_CreatedAt",
                table: "Notifications",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_AppointmentId",
                table: "Payments",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PatientId",
                table: "Payments",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_RecordedAt",
                table: "Payments",
                column: "RecordedAt");

            migrationBuilder.CreateIndex(
                name: "IX_PharmacyItems_Name",
                table: "PharmacyItems",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PrescriptionItems_ConsultationId_Status",
                table: "PrescriptionItems",
                columns: new[] { "ConsultationId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LabOrders");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "PharmacyItems");

            migrationBuilder.DropTable(
                name: "PrescriptionItems");

            migrationBuilder.DropTable(
                name: "Consultations");
        }
    }
}
