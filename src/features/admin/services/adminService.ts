import type {
  AdminActivity, AdminAppointment, AdminNotification, AdminOverview, AdminPatient,
  AdminPayment, AdminUser, AdminUserInput, AdminUserPatch, BroadcastInput,
} from '../types';
import { apiClient } from '../../../lib/apiClient';
import { isMockAuthEnabled } from '../../../auth.service';
import { appointments as mockAppointments, patients as mockPatients } from '../../reception/services/mockData';

const MOCK_STORE_KEY = 'hms-admin-mock-store';

interface MockStore {
  users: AdminUser[];
  payments: AdminPayment[];
  activity: AdminActivity[];
  notifications: AdminNotification[];
  cancelledAppointments: number[];
}

export const ALL_PERMISSIONS = [
  'Reception.Dashboard.View', 'Patients.Search', 'Patients.Create', 'Patients.Demographics.View', 'Patients.Demographics.Update',
  'Appointments.View', 'Appointments.Create', 'Appointments.Reschedule', 'Appointments.Cancel', 'Appointments.CheckIn', 'Appointments.MarkNoShow',
  'Queue.View', 'Queue.Manage', 'Print.PatientCard', 'Print.AppointmentSlip',
  'Doctors.View', 'Doctors.Presence', 'Payments.View', 'Payments.Create',
  'Consultations.View', 'Consultations.Create', 'Labs.View', 'Labs.Order', 'Labs.Update',
  'Pharmacy.View', 'Pharmacy.Dispense', 'Pharmacy.Manage', 'Notifications.View', 'Audit.View',
  'Admin.Overview.View', 'Admin.Users.View', 'Admin.Users.Manage', 'Admin.Patients.Manage', 'Admin.Appointments.Manage', 'Admin.Payments.Manage', 'Admin.Broadcast',
];

function mockUser(id: string, username: string, fullName: string, role: string, departmentId: string, departmentName: string, permissions: string[], extra: Partial<AdminUser> = {}): AdminUser {
  return {
    id, username, fullName, role, departmentId, departmentName, specialty: null, room: null, opdHours: null,
    isActive: true, permissions, failedLoginCount: 0, lockoutEnd: null, clockedInAt: null, clockedOutAt: null, lastSeenAt: null, ...extra,
  };
}

function seedUsers(): AdminUser[] {
  const now = new Date().toISOString();
  return [
    mockUser('local-administrator', 'admin@mastan.local', 'System Administrator', 'Administrator', 'administration', 'Hospital Administration', ALL_PERMISSIONS, { lastSeenAt: now }),
    mockUser('local-receptionist', 'reception@example.com', 'Mastan Hospital Receptionist', 'Receptionist', 'reception', 'Reception & Registration', ['Reception.Dashboard.View', 'Patients.Search', 'Patients.Create', 'Appointments.View', 'Queue.View', 'Payments.View'], { lastSeenAt: now }),
    mockUser('local-doctor-opd', 'doctor.opd@mastan.local', 'Dr. OPD Doctor', 'Doctor', 'opd', 'General Medicine', ['Patients.View', 'Appointments.View', 'MedicalRecords.View'], { specialty: 'General Medicine', room: 'OPD 1', opdHours: '09:00 – 17:00', clockedInAt: now, lastSeenAt: now }),
    mockUser('local-doctor-master', 'doctor@master.local', 'Dr. Master Doctor', 'Doctor', 'opd-master', 'General Medicine', ['Patients.View', 'Appointments.View', 'MedicalRecords.View'], { specialty: 'General Medicine', room: 'OPD 2', opdHours: '09:00 – 17:00', clockedInAt: now, lastSeenAt: now, failedLoginCount: 2 }),
    mockUser('local-pharmacist', 'pharmacist@mastan.local', 'Mastan Hospital Pharmacist', 'Pharmacist', 'pharmacy', 'Pharmacy', ['Pharmacy.View', 'Pharmacy.Dispense', 'Inventory.View'], { lastSeenAt: now }),
  ];
}

// __PART2__

function readStore(): MockStore {
  if (typeof window === 'undefined') throw new Error('NO_WINDOW');
  const raw = window.localStorage.getItem(MOCK_STORE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as MockStore;
      if (parsed.users?.length) return parsed;
    } catch {
      window.localStorage.removeItem(MOCK_STORE_KEY);
    }
  }
  const today = new Date().toISOString();
  const store: MockStore = {
    users: seedUsers(),
    payments: [
      { id: 1, patientId: 1, patientName: 'Ayesha Khan', mrn: 'MH-2026-000123', amount: 1500, method: 'Cash', category: 'Consultation', status: 'Paid', reference: null, recordedBy: 'Mastan Hospital Receptionist', recordedAt: today },
      { id: 2, patientId: 2, patientName: 'Bilal Ahmed', mrn: 'MH-2026-000124', amount: 800, method: 'Card', category: 'Pharmacy', status: 'Paid', reference: 'TXN-88121', recordedBy: 'Mastan Hospital Pharmacist', recordedAt: today },
      { id: 3, patientId: 4, patientName: 'Farah Jamil', mrn: 'MH-2026-000128', amount: 3200, method: 'Cash', category: 'Lab', status: 'Paid', reference: null, recordedBy: 'Mastan Hospital Receptionist', recordedAt: today },
    ],
    activity: [
      { id: 3, actorId: 'local-pharmacist', action: 'Pharmacy.ItemUpdated', entityType: 'PharmacyItem', entityId: '2', reason: null, changesJson: '{"stockQuantity":42}', ipAddress: '127.0.0.1', occurredAt: today },
      { id: 2, actorId: 'local-doctor-opd', action: 'Consultation.Created', entityType: 'Consultation', entityId: '1', reason: null, changesJson: '{"diagnosis":"Viral fever"}', ipAddress: '127.0.0.1', occurredAt: today },
      { id: 1, actorId: 'local-receptionist', action: 'Patient.Created', entityType: 'Patient', entityId: '1', reason: null, changesJson: '{"mrn":"MH-2026-000123"}', ipAddress: '127.0.0.1', occurredAt: today },
    ],
    notifications: [
      { id: 1, title: 'Doctor schedule change', detail: 'Dr. Farhan Ali is unavailable after 12 noon.', severity: 'warning', audience: 'Reception', createdAt: today, readAt: null },
      { id: 2, title: 'Low stock alert', detail: 'Paracetamol 500mg is at 8 tabs (reorder level 50).', severity: 'critical', audience: 'Pharmacy', createdAt: today, readAt: null },
    ],
    cancelledAppointments: [],
  };
  window.localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(store));
  return store;
}

function saveStore(store: MockStore): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(store));
}

function logAdminAction(store: MockStore, action: string, entityType: string, entityId: string, changesJson: string | null = null): void {
  store.activity.unshift({
    id: Date.now(), actorId: 'local-administrator', action, entityType, entityId,
    reason: null, changesJson, ipAddress: '127.0.0.1', occurredAt: new Date().toISOString(),
  });
}

export async function getOverview(): Promise<AdminOverview> {
  if (!isMockAuthEnabled()) {
    return apiClient.get<AdminOverview>('/admin/overview');
  }
  const store = readStore();
  const active = store.users.filter((user) => user.isActive);
  return {
    totalPatients: mockPatients.length,
    registrationsToday: 3,
    appointmentsToday: mockAppointments.length,
    cancelledToday: store.cancelledAppointments.length,
    activeVisits: mockAppointments.filter((a) => a.status === 'Checked In' || a.status === 'Waiting' || a.status === 'In consultation').length,
    totalStaff: store.users.length,
    activeStaff: active.length,
    lockedAccounts: store.users.filter((user) => user.lockoutEnd && new Date(user.lockoutEnd) > new Date()).length,
    revenueToday: store.payments.reduce((sum, payment) => sum + payment.amount, 0),
    pendingPayments: mockAppointments.filter((a) => a.paymentStatus === 'Pending' && a.status !== 'Cancelled').length,
    lowStockItems: 2,
    pendingLabs: 1,
    pendingPrescriptions: 3,
    staffByRole: store.users.reduce<Record<string, number>>((acc, user) => {
      acc[user.role] = (acc[user.role] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

export async function listUsers(search?: string, role?: string): Promise<AdminUser[]> {
  if (!isMockAuthEnabled()) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role && role !== 'All') params.set('role', role);
    const qs = params.toString();
    return apiClient.get<AdminUser[]>(`/admin/users${qs ? `?${qs}` : ''}`);
  }
  const store = readStore();
  const term = search?.trim().toLowerCase() ?? '';
  return store.users.filter((user) => {
    const matchesRole = !role || role === 'All' || user.role === role;
    const matchesTerm = !term || [user.fullName, user.username, user.departmentName ?? ''].some((value) => value.toLowerCase().includes(term));
    return matchesRole && matchesTerm;
  });
}

export async function createUser(input: AdminUserInput): Promise<AdminUser> {
  if (!isMockAuthEnabled()) {
    return apiClient.post<AdminUser>('/admin/users', input);
  }
  const store = readStore();
  if (store.users.some((user) => user.username.toLowerCase() === input.username.trim().toLowerCase())) {
    throw new Error('DUPLICATE_USERNAME');
  }
  const user: AdminUser = {
    id: `mock-${crypto.randomUUID()}`,
    username: input.username.trim(),
    fullName: input.fullName.trim(),
    role: input.role,
    departmentId: input.departmentId ?? null,
    departmentName: input.departmentName ?? null,
    specialty: input.specialty ?? null,
    room: input.room ?? null,
    opdHours: input.opdHours ?? null,
    isActive: true,
    permissions: input.permissions,
    failedLoginCount: 0,
    lockoutEnd: null,
    clockedInAt: null,
    clockedOutAt: null,
    lastSeenAt: null,
  };
  store.users.push(user);
  logAdminAction(store, 'Admin.UserCreated', 'AppUser', user.id, JSON.stringify({ username: user.username, role: user.role }));
  saveStore(store);
  return user;
}

export async function updateUser(id: string, patch: AdminUserPatch): Promise<AdminUser> {
  if (!isMockAuthEnabled()) {
    return apiClient.patch<AdminUser>(`/admin/users/${encodeURIComponent(id)}`, patch);
  }
  const store = readStore();
  const user = store.users.find((item) => item.id === id);
  if (!user) throw new Error('NOT_FOUND');
  if (patch.fullName !== undefined) user.fullName = patch.fullName;
  if (patch.role !== undefined) user.role = patch.role;
  if (patch.departmentId !== undefined) user.departmentId = patch.departmentId;
  if (patch.departmentName !== undefined) user.departmentName = patch.departmentName;
  if (patch.specialty !== undefined) user.specialty = patch.specialty;
  if (patch.room !== undefined) user.room = patch.room;
  if (patch.opdHours !== undefined) user.opdHours = patch.opdHours;
  if (patch.isActive !== undefined) user.isActive = patch.isActive;
  if (patch.permissions !== undefined) user.permissions = [...patch.permissions];
  logAdminAction(store, 'Admin.UserUpdated', 'AppUser', user.id, JSON.stringify(patch));
  saveStore(store);
  return user;
}

export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  if (!isMockAuthEnabled()) {
    await apiClient.post(`/admin/users/${encodeURIComponent(id)}/reset-password`, { newPassword });
    return;
  }
  const store = readStore();
  const user = store.users.find((item) => item.id === id);
  if (!user) throw new Error('NOT_FOUND');
  user.failedLoginCount = 0;
  user.lockoutEnd = null;
  logAdminAction(store, 'Admin.PasswordReset', 'AppUser', user.id);
  saveStore(store);
}

export async function unlockUser(id: string): Promise<void> {
  if (!isMockAuthEnabled()) {
    await apiClient.post(`/admin/users/${encodeURIComponent(id)}/unlock`);
    return;
  }
  const store = readStore();
  const user = store.users.find((item) => item.id === id);
  if (!user) throw new Error('NOT_FOUND');
  user.failedLoginCount = 0;
  user.lockoutEnd = null;
  saveStore(store);
}

export async function setUserActive(id: string, isActive: boolean): Promise<void> {
  if (!isMockAuthEnabled()) {
    await apiClient.post(`/admin/users/${encodeURIComponent(id)}/${isActive ? 'activate' : 'deactivate'}`);
    return;
  }
  const store = readStore();
  const user = store.users.find((item) => item.id === id);
  if (!user) throw new Error('NOT_FOUND');
  if (!isActive && user.role === 'Administrator') {
    const remaining = store.users.filter((item) => item.role === 'Administrator' && item.isActive && item.id !== id);
    if (remaining.length === 0) throw new Error('LAST_ADMIN');
  }
  user.isActive = isActive;
  logAdminAction(store, isActive ? 'Admin.UserActivated' : 'Admin.UserDeactivated', 'AppUser', user.id);
  saveStore(store);
}

export async function listPatients(search?: string): Promise<AdminPatient[]> {
  if (!isMockAuthEnabled()) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const qs = params.toString();
    return apiClient.get<AdminPatient[]>(`/admin/patients${qs ? `?${qs}` : ''}`);
  }
  const term = search?.trim().toLowerCase() ?? '';
  const filtered = term
    ? mockPatients.filter((patient) => [patient.fullName, patient.mrn, patient.mobile].some((value) => value.toLowerCase().includes(term)))
    : mockPatients;
  return filtered.map((patient) => ({
    id: Number(patient.id.replace(/\D/g, '')) || 0,
    mrn: patient.mrn,
    fullName: patient.fullName,
    gender: patient.gender,
    approximateAge: patient.age,
    primaryMobile: patient.mobile,
    status: patient.status,
    registeredAt: patient.registrationDate,
    registrationType: 'Registered',
    department: 'General Medicine',
  }));
}

export async function listAppointments(date?: string, status?: string): Promise<AdminAppointment[]> {
  if (!isMockAuthEnabled()) {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (status && status !== 'All') params.set('status', status);
    const qs = params.toString();
    return apiClient.get<AdminAppointment[]>(`/admin/appointments${qs ? `?${qs}` : ''}`);
  }
  const store = readStore();
  return mockAppointments
    .filter((appointment) => (status && status !== 'All' ? appointment.status === status : true))
    .map((appointment, index) => ({
      id: Number(appointment.id.replace(/\D/g, '')) || index + 1,
      tokenNumber: appointment.tokenNumber,
      appointmentTime: appointment.appointmentTime,
      appointmentDate: new Date().toISOString().slice(0, 10),
      patientName: appointment.patientName,
      mrn: appointment.mrn,
      doctor: appointment.doctor,
      department: appointment.department,
      appointmentType: appointment.appointmentType,
      priority: 'Normal',
      status: store.cancelledAppointments.includes(Number(appointment.id.replace(/\D/g, '')) || index + 1) ? 'Cancelled' : appointment.status,
      paymentStatus: appointment.paymentStatus,
      adminNote: null,
    }));
}

export async function cancelAppointment(id: number, reason: string): Promise<void> {
  if (!isMockAuthEnabled()) {
    await apiClient.post(`/admin/appointments/${id}/cancel`, { reason });
    return;
  }
  const store = readStore();
  if (!store.cancelledAppointments.includes(id)) store.cancelledAppointments.push(id);
  logAdminAction(store, 'Admin.AppointmentCancelled', 'Appointment', String(id), JSON.stringify({ reason }));
  saveStore(store);
}

export async function listPayments(date?: string): Promise<AdminPayment[]> {
  if (!isMockAuthEnabled()) {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    const qs = params.toString();
    return apiClient.get<AdminPayment[]>(`/admin/payments${qs ? `?${qs}` : ''}`);
  }
  const store = readStore();
  return date ? store.payments.filter((payment) => payment.recordedAt.slice(0, 10) === date) : store.payments;
}

export async function listActivity(): Promise<AdminActivity[]> {
  if (!isMockAuthEnabled()) {
    return apiClient.get<AdminActivity[]>('/activity');
  }
  return readStore().activity;
}

export async function listNotifications(): Promise<AdminNotification[]> {
  if (!isMockAuthEnabled()) {
    return apiClient.get<AdminNotification[]>('/admin/notifications');
  }
  return readStore().notifications;
}

export async function broadcast(input: BroadcastInput): Promise<AdminNotification> {
  if (!isMockAuthEnabled()) {
    return apiClient.post<AdminNotification>('/admin/notifications', input);
  }
  const store = readStore();
  const notification: AdminNotification = {
    id: Date.now(), title: input.title.trim(), detail: input.detail.trim(),
    severity: input.severity, audience: input.audience, createdAt: new Date().toISOString(), readAt: null,
  };
  store.notifications.unshift(notification);
  logAdminAction(store, 'Admin.NotificationBroadcast', 'Notification', String(notification.id), JSON.stringify({ title: notification.title, audience: notification.audience }));
  saveStore(store);
  return notification;
}

