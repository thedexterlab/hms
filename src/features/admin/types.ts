export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  departmentId?: string | null;
  departmentName?: string | null;
  specialty?: string | null;
  room?: string | null;
  opdHours?: string | null;
  isActive: boolean;
  permissions: string[];
  failedLoginCount: number;
  lockoutEnd?: string | null;
  clockedInAt?: string | null;
  clockedOutAt?: string | null;
  lastSeenAt?: string | null;
}

export interface AdminUserInput {
  username: string;
  fullName: string;
  role: string;
  password?: string;
  departmentId?: string;
  departmentName?: string;
  specialty?: string;
  room?: string;
  opdHours?: string;
  permissions: string[];
}

export interface AdminUserPatch {
  fullName?: string;
  role?: string;
  departmentId?: string | null;
  departmentName?: string | null;
  specialty?: string | null;
  room?: string | null;
  opdHours?: string | null;
  isActive?: boolean;
  permissions?: string[];
}

export interface AdminOverview {
  totalPatients: number;
  registrationsToday: number;
  appointmentsToday: number;
  cancelledToday: number;
  activeVisits: number;
  totalStaff: number;
  activeStaff: number;
  lockedAccounts: number;
  revenueToday: number;
  pendingPayments: number;
  lowStockItems: number;
  pendingLabs: number;
  pendingPrescriptions: number;
  staffByRole: Record<string, number>;
}

export interface AdminPatient {
  id: number;
  mrn: string;
  fullName: string;
  gender: string;
  dob?: string | null;
  approximateAge?: number | null;
  primaryMobile: string;
  status: string;
  registeredAt: string;
  registrationType: string;
  department: string;
}

export interface AdminAppointment {
  id: number;
  tokenNumber: number;
  appointmentTime: string;
  appointmentDate: string;
  patientName: string;
  mrn: string;
  doctor: string;
  department: string;
  appointmentType: string;
  priority: string;
  status: string;
  paymentStatus: string;
  adminNote?: string | null;
}

export interface AdminPayment {
  id: number;
  patientId: number;
  patientName: string;
  mrn: string;
  amount: number;
  method: string;
  category: string;
  status: string;
  reference?: string | null;
  recordedBy: string;
  recordedAt: string;
}

export interface AdminActivity {
  id: number;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string | null;
  changesJson?: string | null;
  ipAddress?: string | null;
  occurredAt: string;
}

export interface AdminNotification {
  id: number;
  title: string;
  detail: string;
  severity: string;
  audience: string;
  createdAt: string;
  readAt?: string | null;
}

export interface BroadcastInput {
  title: string;
  detail: string;
  severity: string;
  audience: string;
}