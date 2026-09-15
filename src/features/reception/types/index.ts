export interface DashboardSummary {
  registrationsToday: number;
  appointmentsToday: number;
  waitingPatients: number;
  checkedInPatients: number;
  walkInPatients: number;
  cancelledAppointments: number;
  noShows: number;
  pendingPayments: number;
}

export interface AppointmentRecord {
  id: string;
  tokenNumber: number;
  appointmentTime: string;
  patientName: string;
  mrn: string;
  doctor: string;
  department: string;
  appointmentType: string;
  status: string;
  paymentStatus: string;
}

export interface QueueItem {
  id: string;
  tokenNumber: number;
  patientName: string;
  mrn: string;
  department: string;
  doctor: string;
  priority: string;
  status: string;
  waitingDuration: string;
}

export interface PatientRecord {
  id: string;
  mrn: string;
  fullName: string;
  age: number;
  gender: string;
  mobile: string;
  guardianName: string;
  registrationDate: string;
  status: string;

}

export interface PatientReport {
  id: string;
  title: string;
  type: 'Lab' | 'X-ray' | 'Scan' | 'Report';
  date: string;
  status: 'Completed' | 'Pending' | 'Reviewed';
  fileName: string;
  fileUrl: string;
}

export interface PatientDetail extends PatientRecord {
  dob: string;
  email: string;
  guardianMobile: string;
  city?: string;
  district?: string;
  maritalStatus?: string;
  // Structured address (FHIR Patient.address equivalents)
  addressLine?: string;
  province?: string;
  postalCode?: string;
  // Extended demographics captured at registration
  bloodGroup?: string;
  occupation?: string;
  preferredLanguage?: string;
  secondaryMobile?: string;
  guardianRelationship?: string;
  consent?: boolean;
  privacyNotice?: boolean;
  registrationType: string;
  department: string;
  reports?: PatientReport[];
  caseSummary?: string;
  caseDoctors?: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
}
