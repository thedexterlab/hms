namespace Hms.Api.Auth;

public static class Permissions
{
    public const string PatientsSearch = "Patients.Search";
    public const string PatientsCreate = "Patients.Create";
    public const string PatientsView = "Patients.Demographics.View";
    public const string PatientsUpdate = "Patients.Demographics.Update";
    public const string AppointmentsView = "Appointments.View";
    public const string AppointmentsCreate = "Appointments.Create";
    public const string AppointmentsReschedule = "Appointments.Reschedule";
    public const string AppointmentsCancel = "Appointments.Cancel";
    public const string AppointmentsCheckIn = "Appointments.CheckIn";
    public const string AppointmentsNoShow = "Appointments.MarkNoShow";
    public const string PrintPatientCard = "Print.PatientCard";
    public const string PrintAppointmentSlip = "Print.AppointmentSlip";
    public const string AuditView = "Audit.View";
    public const string DoctorsView = "Doctors.View";
    public const string DoctorsPresence = "Doctors.Presence";
    public const string DashboardView = "Reception.Dashboard.View";
    public const string QueueView = "Queue.View";
    public const string QueueManage = "Queue.Manage";
    public const string PaymentsView = "Payments.View";
    public const string PaymentsCreate = "Payments.Create";
    public const string ConsultationsCreate = "Consultations.Create";
    public const string ConsultationsView = "Consultations.View";
    public const string LabsOrder = "Labs.Order";
    public const string LabsView = "Labs.View";
    public const string LabsUpdate = "Labs.Update";
    public const string PharmacyView = "Pharmacy.View";
    public const string PharmacyDispense = "Pharmacy.Dispense";
    public const string PharmacyManage = "Pharmacy.Manage";
    public const string NotificationsView = "Notifications.View";
    public const string AdminOverview = "Admin.Overview.View";
    public const string AdminUsersView = "Admin.Users.View";
    public const string AdminUsersManage = "Admin.Users.Manage";
    public const string AdminPatientsManage = "Admin.Patients.Manage";
    public const string AdminAppointmentsManage = "Admin.Appointments.Manage";
    public const string AdminPaymentsManage = "Admin.Payments.Manage";
    public const string AdminBroadcast = "Admin.Broadcast";
    public static readonly string[] All =
    [
        PatientsSearch, PatientsCreate, PatientsView, PatientsUpdate,
        AppointmentsView, AppointmentsCreate, AppointmentsReschedule, AppointmentsCancel, AppointmentsCheckIn, AppointmentsNoShow,
        PrintPatientCard, PrintAppointmentSlip, AuditView, DoctorsView, DoctorsPresence,
        DashboardView, QueueView, QueueManage, PaymentsView, PaymentsCreate,
        ConsultationsCreate, ConsultationsView, LabsOrder, LabsView, LabsUpdate,
        PharmacyView, PharmacyDispense, PharmacyManage, NotificationsView,
        AdminOverview, AdminUsersView, AdminUsersManage, AdminPatientsManage, AdminAppointmentsManage, AdminPaymentsManage, AdminBroadcast,
        "MedicalRecords.View", "Inventory.View", "Reports.View",
    ];
    public static string Policy(string permission) => $"Permission:{permission}";
}
