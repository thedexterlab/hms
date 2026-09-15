import type { AppointmentRecord, DashboardSummary, NotificationItem, PatientDetail, PatientRecord, QueueItem } from '../types';
import { appointments, dashboardSummary, notifications, patientDetails as initialPatientDetails, patients as initialPatients, queueItems } from './mockData';

const PATIENTS_STORAGE_KEY = 'hms-patients';
const PATIENT_DETAILS_STORAGE_KEY = 'hms-patient-details';

// Remove legacy identifiers from cached records, including unknown nested fields.
function stripSensitiveFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSensitiveFields);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([key]) =>
      !['cnic', 'identitymasked', 'passport', 'passportnumber', 'nationalid', 'religion', 'nationality'].includes(key.toLowerCase().replace(/[_-]/g, ''))
    ).map(([key, item]) => [key, stripSensitiveFields(item)]));
  }
  return value;
}

if (typeof window !== 'undefined') window.localStorage.removeItem('hms-identity-fingerprints');


function readJsonStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const cleaned = stripSensitiveFields(parsed);
    if (JSON.stringify(cleaned) !== JSON.stringify(parsed)) {
      window.localStorage.setItem(key, JSON.stringify(cleaned));
    }
    return cleaned as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function saveJsonStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(stripSensitiveFields(value)));
}

function initializePatients(): PatientRecord[] {
  const stored = readJsonStorage<PatientRecord[]>(PATIENTS_STORAGE_KEY);
  return stored && stored.length > 0 ? stored : [...initialPatients];
}

function initializePatientDetails(): Record<string, PatientDetail> {
  const stored = readJsonStorage<Record<string, PatientDetail>>(PATIENT_DETAILS_STORAGE_KEY);
  // Records created by older versions may contain unmasked identifiers;
  // sanitize on load so contaminated caches are repaired on first use.
  return stored && Object.keys(stored).length > 0 ? sanitizeDetailsForStorage(stored) : { ...initialPatientDetails };
}

function persistPatientState(): void {
  saveJsonStorage(PATIENTS_STORAGE_KEY, patients);
  // Privacy (minimum-necessary): only sanitized (masked) identity values are
  // ever written to localStorage. Full email values live in memory for
  // the current session only; the backend database must remain the single
  // permanent store of sensitive identifiers.
  saveJsonStorage(PATIENT_DETAILS_STORAGE_KEY, sanitizeDetailsForStorage(patientDetails));
  
}

// Privacy helpers: mask direct identifiers before they reach localStorage.
function maskEmail(value: string): string {
  if (!value.includes('@')) {
    return 'N/A';
  }
  const [name, domain] = value.split('@');
  return `${name.slice(0, 1)}•••@${domain.slice(0, 1)}•••`;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) {
    return 'N/A';
  }
  return `•••••${digits.slice(-4)}`;
}

function sanitizeDetailForStorage(detail: PatientDetail): PatientDetail {
  return {
    ...detail,
    email: maskEmail(String(detail.email ?? '')),
    guardianMobile: maskPhone(String(detail.guardianMobile ?? '')),
  };
}

function sanitizeDetailsForStorage(details: Record<string, PatientDetail>): Record<string, PatientDetail> {
  return Object.fromEntries(Object.entries(details).map(([id, detail]) => [id, sanitizeDetailForStorage(detail)]));
}

// Generates a clearly marked *provisional* identifier. The frontend must
// never fabricate a permanent MRN: the backend must issue the final,
// never-reused MRN (DB unique index) and replace every PROV- value. A
// deterministic sequential generator is used (never Math.random()) and
// existing MRNs are checked so no provisional value can collide.
function generateProvisionalMrn(): string {
  const existing = new Set(patients.map((patient) => patient.mrn));
  const year = new Date().getFullYear();
  let sequence = 1;
  let mrn = `PROV-${year}-${String(sequence).padStart(6, '0')}`;
  while (existing.has(mrn)) {
    sequence += 1;
    mrn = `PROV-${year}-${String(sequence).padStart(6, '0')}`;
  }
  return mrn;
}

export const patients: PatientRecord[] = initializePatients();
export const patientDetails: Record<string, PatientDetail> = initializePatientDetails();

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return dashboardSummary;
}

export async function searchPatients(query: string): Promise<PatientRecord[]> {
  if (!query.trim()) {
    return patients;
  }

  const normalized = query.toLowerCase();
  return patients.filter((patient) => [patient.fullName, patient.mrn, patient.mobile, patient.guardianName].some((value) => value.toLowerCase().includes(normalized)));
}

export async function getPatientById(patientId: string): Promise<PatientDetail> {
  const patient = patientDetails[patientId] ?? patients.find((item) => item.id === patientId);
  if (!patient) {
    throw new Error('NOT_FOUND');
  }

  return patient as PatientDetail;
}

export async function getAppointments(): Promise<AppointmentRecord[]> {
  const stored = readJsonStorage<AppointmentRecord[]>('hms-appointments');
  return stored ? [...stored, ...appointments] : appointments;
}

export async function searchPatientsByIdentity(query: string): Promise<PatientRecord[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const normalizedDigits = normalized.replace(/\D/g, '');
  const storedPatients = readJsonStorage<PatientRecord[]>(PATIENTS_STORAGE_KEY) ?? patients;
  const storedDetails = readJsonStorage<Record<string, PatientDetail>>(PATIENT_DETAILS_STORAGE_KEY) ?? patientDetails;
  const matches = storedPatients.filter((patient) => {
    return [patient.mobile, patient.mrn].some((value) => {
      const text = String(value).toLowerCase();
      return text.includes(normalized) || (normalizedDigits.length > 0 && text.replace(/\D/g, '').includes(normalizedDigits));
    });
  });

  // Support records created by older versions of the form and recover the
  // patient summary directly from the saved detail map when needed.
  Object.values(storedDetails).forEach((detail) => {
    const values = Object.values(detail as Record<string, unknown>).map((value) => String(value ?? '').toLowerCase());
    if (values.some((value) => value.includes(normalized) || (normalizedDigits && value.replace(/\D/g, '').includes(normalizedDigits))) && !matches.some((patient) => patient.id === detail.id)) {
      matches.push(detail);
    }
  });

  return matches;
}

export async function getQueue(): Promise<QueueItem[]> {
  const storedAppointments = readJsonStorage<AppointmentRecord[]>('hms-appointments') ?? [];
  const storedWalkIns = readJsonStorage<Array<QueueItem & { arrivalTime?: string }>>('hms-walk-ins') ?? [];
  const savedQueue: QueueItem[] = [
    ...storedAppointments.map((appointment) => ({
      id: appointment.id,
      tokenNumber: appointment.tokenNumber,
      patientName: appointment.patientName,
      mrn: appointment.mrn,
      department: appointment.department,
      doctor: appointment.doctor,
      priority: 'Normal',
      status: appointment.status === 'Scheduled' ? 'Waiting' : appointment.status,
      waitingDuration: '—',
    })),
    ...storedWalkIns.map((visit) => ({
      id: visit.id,
      tokenNumber: visit.tokenNumber,
      patientName: visit.patientName,
      mrn: visit.mrn,
      department: visit.department,
      doctor: visit.doctor,
      priority: visit.priority,
      status: visit.status,
      waitingDuration: '—',
    })),
  ];
  return [...savedQueue, ...queueItems];
}

export async function getNotifications(): Promise<NotificationItem[]> {
  return notifications;
}

export async function getReceptionActivity(): Promise<Array<{ action: string; entity: string; timestamp: string; status: string }>> {
  return [
    { action: 'Patient registered', entity: 'Ayesha Khan', timestamp: '2026-07-25 09:15', status: 'Completed' },
    { action: 'Appointment created', entity: 'Bilal Ahmed', timestamp: '2026-07-25 08:40', status: 'Completed' },
  ];
}

export async function duplicateCheck(payload: Record<string, string>): Promise<{ warning: boolean; matches: PatientRecord[] }> {
  const normalize = (value: string) => value.trim().toLowerCase();
  const fullName = normalize(payload.fullName ?? '');
  const identity = normalize(payload.identity ?? '');
  const patientAge = normalize(String(payload.age ?? ''));

  const matches = patients.filter((patient) => {
    const patientName = normalize(patient.fullName);
    const patientMobile = normalize(patient.mobile);
    const patientGuardian = normalize(patient.guardianName);
    const patientMrn = normalize(patient.mrn);
    const patientAgeValue = normalize(String(patient.age ?? ''));

    if (identity && patientMobile && identity === patientMobile) {
      return true;
    }

    if (fullName && patientAge && patientName === fullName && patientAgeValue === patientAge) {
      return true;
    }

    if (payload.guardianName && patientName === fullName && patientGuardian === normalize(payload.guardianName)) {
      return true;
    }

    if (payload.email && normalize((patientDetails[patient.id] as PatientDetail)?.email ?? '') === normalize(payload.email)) {
      return true;
    }

    if (identity && patientMrn === identity) {
      return true;
    }

    return false;
  });

  return {
    warning: matches.length > 0,
    matches,
  };
}

export async function createPatient(payload: Record<string, unknown>): Promise<{ id: string; mrn: string; mrnProvisional: true }> {
  // Derive age from the mandatory DOB (Registrar Playbook §3.2) unless an
  // approximate age was captured explicitly because the DOB was unknown.
  const deriveAge = (value: unknown): number => {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    const dob = String(payload.dob ?? '');
    if (dob && new Date(dob) <= new Date()) {
      const ms = Date.now() - new Date(dob).getTime();
      return Math.max(0, Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000)));
    }
    return 0;
  };

  // The frontend cannot mint a permanent MRN; this provisional identifier is
  // clearly marked and must be replaced by the backend-issued MRN.
  const mrn = generateProvisionalMrn();

  const nextPatient: PatientRecord = {
    id: `p-${Date.now()}`,
    mrn,
    fullName: `${String(payload.firstName ?? '').trim()} ${String(payload.lastName ?? '').trim()}`.trim() || 'New Patient',
    age: deriveAge(payload.age),
    gender: String(payload.gender ?? 'Unknown'),
    mobile: String(payload.primaryMobile ?? 'N/A'),
    guardianName: String(payload.guardianName ?? 'N/A'),
    registrationDate: new Date().toISOString().slice(0, 10),
    status: 'Active',
  };

  patients.push(nextPatient);
  // Keep the complete registration payload with the detail record so the
  // profile page can be rendered from localStorage after navigation/reload.
  patientDetails[nextPatient.id] = {
    ...nextPatient,
    city: String(payload.city ?? 'N/A'),
    district: String(payload.district ?? 'N/A'),
    maritalStatus: String(payload.maritalStatus ?? 'N/A'),
    addressLine: String(payload.addressLine ?? 'N/A'),
    province: String(payload.province ?? 'N/A'),
    postalCode: String(payload.postalCode ?? 'N/A'),
    bloodGroup: String(payload.bloodGroup ?? 'Unknown'),
    occupation: String(payload.occupation ?? 'N/A'),
    preferredLanguage: String(payload.preferredLanguage ?? 'N/A'),
    secondaryMobile: String(payload.secondaryMobile ?? 'N/A'),
    dob: String(payload.dob ?? 'N/A'),
    email: String(payload.email ?? 'N/A'),
    guardianMobile: String(payload.guardianMobile ?? 'N/A'),
    guardianRelationship: String(payload.guardianRelationship ?? 'N/A'),
    consent: Boolean(payload.consent),
    privacyNotice: Boolean(payload.privacyNotice),
    registrationType: String(payload.registrationType ?? 'OPD'),
    department: String(payload.department ?? 'General Medicine'),
  };

  persistPatientState();

  return { id: nextPatient.id, mrn, mrnProvisional: true };
}

export async function updatePatient(payload: Record<string, unknown>): Promise<void> {
  const id = String(payload.id ?? '');
  if (!id || !patientDetails[id]) {
    throw new Error('NOT_FOUND');
  }

  const existing = patientDetails[id];

  // Whitelist mapping (mass-assignment defense): only explicitly allowed
  // demographic fields may change. Identity, MRN, registration date and any
  // unknown fields in the payload are ignored — and once the API exists the
  // backend must enforce the same rule server-side.
  const readString = (key: string): string => (typeof payload[key] === 'string' ? (payload[key] as string).trim() : '');
  const firstName = readString('firstName');
  const lastName = readString('lastName');
  const parsedAge = Number(payload.age);
  const readBool = (key: string, fallback: boolean | undefined): boolean | undefined =>
    typeof payload[key] === 'boolean' ? (payload[key] as boolean) : fallback;

  const updated: PatientDetail = {
    ...existing,
    fullName: firstName || lastName ? `${firstName} ${lastName}`.trim() : existing.fullName,
    age: payload.age !== undefined && Number.isFinite(parsedAge) ? parsedAge : existing.age,
    gender: readString('gender') || existing.gender,
    mobile: readString('mobile') || readString('primaryMobile') || existing.mobile,
    guardianName: readString('guardianName') || existing.guardianName,
    email: readString('email') || existing.email,
    guardianMobile: readString('guardianMobile') || existing.guardianMobile,
    city: readString('city') || existing.city,
    district: readString('district') || existing.district,
    maritalStatus: readString('maritalStatus') || existing.maritalStatus,
    guardianRelationship: readString('guardianRelationship') || existing.guardianRelationship,
    consent: readBool('consent', existing.consent),
    privacyNotice: readBool('privacyNotice', existing.privacyNotice),
    registrationType: readString('registrationType') || existing.registrationType,
    department: readString('department') || existing.department,
    addressLine: readString('addressLine') || existing.addressLine,
    province: readString('province') || existing.province,
    postalCode: readString('postalCode') || existing.postalCode,
    dob: readString('dob') || existing.dob,
    bloodGroup: readString('bloodGroup') || existing.bloodGroup,
    occupation: readString('occupation') || existing.occupation,
    preferredLanguage: readString('preferredLanguage') || existing.preferredLanguage,
    secondaryMobile: readString('secondaryMobile') || existing.secondaryMobile,
  };

  patientDetails[id] = updated;

  const index = patients.findIndex((item) => item.id === id);
  if (index !== -1) {
    patients[index] = {
      ...patients[index],
      fullName: updated.fullName,
      age: updated.age,
      gender: updated.gender,
      mobile: updated.mobile,
      guardianName: updated.guardianName,
      status: updated.status ?? patients[index].status,
    };
  }

  persistPatientState();
}

export async function createAppointment(payload: Record<string, unknown>): Promise<{ id: string }> {
  return { id: 'apt-new' };
}

export async function createPayment(_payload: Record<string, unknown>): Promise<void> {
  return undefined;
}
