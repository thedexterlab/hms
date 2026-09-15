import type { AuthResponse, AuthSession, LoginRequest } from './auth.types';
import { AuthError } from './auth.types';

const STORAGE_KEY = 'hms-auth-session';

// SECURITY: hard-coded demo accounts exist only for UI development. They are
// gated behind the VITE_USE_MOCK_AUTH flag and must be disabled in any build
// that touches real hospital data (see .env.example). This is frontend-only
// scaffolding - real authentication, password hashing, lockout and MFA must
// be implemented by the backend identity service before production use.
const MOCK_AUTH_ENABLED = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

// Temporary frontend-only accounts. Replace this service with the backend API
// before production use; passwords must never be hard-coded in a real app.
const LOCAL_ACCOUNTS: Record<string, { password: string; response: AuthResponse }> = MOCK_AUTH_ENABLED ? {
  'reception@example.com': {
    password: 'Reception@123',
    response: {
      accessToken: 'local-reception-token',
      refreshToken: 'local-reception-refresh',
      expiresIn: 86400,
      user: {
        id: 'local-receptionist',
        fullName: 'Mastan Hospital Receptionist',
        roles: ['Receptionist'],
        permissions: [
          'Reception.Dashboard.View',
          'Patients.Search',
          'Patients.Create',
          'Appointments.View',
          'Appointments.Create',
          'Queue.View',
        ],
        departmentId: 'reception',
        departmentName: 'Reception & Registration',
      },
    },
  },
  'doctor.opd': {
    password: 'Doctor@123',
    response: {
      accessToken: 'local-doctor-opd-token',
      refreshToken: 'local-doctor-opd-refresh',
      expiresIn: 86400,
      user: {
        id: 'local-doctor-opd',
        fullName: 'Dr. OPD Doctor',
        roles: ['Doctor'],
        permissions: ['Patients.View', 'Appointments.View', 'MedicalRecords.View'],
        departmentId: 'opd',
        departmentName: 'Outpatient Department',
      },
    },
  },
  'doctor.opd@mastan.local': {
    password: 'Doctor@123',
    response: {
      accessToken: 'local-doctor-opd-token',
      refreshToken: 'local-doctor-opd-refresh',
      expiresIn: 86400,
      user: {
        id: 'local-doctor-opd',
        fullName: 'Dr. OPD Doctor',
        roles: ['Doctor'],
        permissions: ['Patients.View', 'Appointments.View', 'MedicalRecords.View'],
        departmentId: 'opd',
        departmentName: 'Outpatient Department',
      },
    },
  },
  'gynae@mastan.local': {
    password: 'Gynae@123',
    response: {
      accessToken: 'local-gynae-token', refreshToken: 'local-gynae-refresh', expiresIn: 86400,
      user: { id: 'local-gynae', fullName: 'Dr. Gynae Specialist', roles: ['Doctor'], specialty: 'Gynaecology', permissions: ['Patients.View', 'Appointments.View', 'MedicalRecords.View', 'Reports.View'], departmentId: 'gynae', departmentName: 'Gynaecology & Obstetrics' },
    },
  },
  'physician@mastan.local': {
    password: 'Physician@123',
    response: {
      accessToken: 'local-physician-token', refreshToken: 'local-physician-refresh', expiresIn: 86400,
      user: { id: 'local-physician', fullName: 'Dr. General Physician', roles: ['Doctor'], specialty: 'General Medicine', permissions: ['Patients.View', 'Appointments.View', 'MedicalRecords.View'], departmentId: 'medicine', departmentName: 'General Medicine' },
    },
  },
  'pediatrician@mastan.local': {
    password: 'Pediatric@123',
    response: {
      accessToken: 'local-pediatrician-token', refreshToken: 'local-pediatrician-refresh', expiresIn: 86400,
      user: { id: 'local-pediatrician', fullName: 'Dr. Child Specialist', roles: ['Doctor'], specialty: 'Paediatrics', permissions: ['Patients.View', 'Appointments.View', 'MedicalRecords.View'], departmentId: 'paediatrics', departmentName: 'Paediatrics' },
    },
  },
  'pharmacist@mastan.local': {
    password: 'Pharmacist@123',
    response: {
      accessToken: 'local-pharmacist-token', refreshToken: 'local-pharmacist-refresh', expiresIn: 86400,
      user: { id: 'local-pharmacist', fullName: 'Mastan Hospital Pharmacist', roles: ['Pharmacist'], permissions: ['Pharmacy.View', 'Pharmacy.Dispense', 'Inventory.View'], departmentId: 'pharmacy', departmentName: 'Pharmacy' },
    },
  },
} : {};

export const isMockAuthEnabled = (): boolean => MOCK_AUTH_ENABLED;

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    clearStoredSession();
    return null;
  }
}

function persistSession(session: AuthSession | null, _rememberMe = false): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const serialized = JSON.stringify(session);
  window.localStorage.setItem(STORAGE_KEY, serialized);
}

function clearStoredSession(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

let currentSession: AuthSession | null = readStoredSession();

export function getCurrentSession(): AuthSession | null {
  if (!currentSession) {
    currentSession = readStoredSession();
  }

  return currentSession;
}

export function setCurrentSession(session: AuthSession, rememberMe = false): void {
  currentSession = session;
  persistSession(session, rememberMe);
}

export function clearCurrentSession(): void {
  currentSession = null;
  clearStoredSession();
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  if (!MOCK_AUTH_ENABLED) {
    // Fail closed: no demo credentials in this build (and no backend yet).
    throw new AuthError('Demo accounts are disabled in this build. Connect the hospital server to sign in.', 'NETWORK_ERROR');
  }

  const account = LOCAL_ACCOUNTS[request.usernameOrEmail.trim().toLowerCase()];

  if (account) {
    if (request.password !== account.password) {
      throw new AuthError('Invalid username or password.', 'INVALID_CREDENTIALS');
    }

    setCurrentSession(account.response, request.rememberMe);
    return account.response;
  }

  // Backend integration can be restored here when the API is available.
  throw new AuthError('Invalid username or password.', 'INVALID_CREDENTIALS');

  /*
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '/api';
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        usernameOrEmail: request.usernameOrEmail.trim(),
        password: request.password,
        rememberMe: request.rememberMe,
      }),
    });
  } catch {
    throw new AuthError('Unable to connect to the hospital server. Please try again.', 'NETWORK_ERROR');
  }

  if (!response.ok) {
    switch (response.status) {
      case 401:
        throw new AuthError('Invalid username or password.', 'INVALID_CREDENTIALS');
      case 403:
        throw new AuthError('Your account does not have permission to access this system.', 'FORBIDDEN');
      case 423:
        throw new AuthError('Your account is temporarily locked. Please contact the administrator.', 'ACCOUNT_LOCKED');
      case 440:
        throw new AuthError('Your session has expired. Please sign in again.', 'SESSION_EXPIRED');
      default:
        throw new AuthError('Unable to connect to the hospital server. Please try again.', 'NETWORK_ERROR');
    }
  }

  let payload: Partial<AuthResponse>;
  try {
    payload = (await response.json()) as Partial<AuthResponse>;
  } catch {
    throw new AuthError('Unable to connect to the hospital server. Please try again.', 'NETWORK_ERROR');
  }

  if (!payload.accessToken || !payload.refreshToken || !payload.user) {
    throw new AuthError('Unable to connect to the hospital server. Please try again.', 'NETWORK_ERROR');
  }

  const authResponse: AuthResponse = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresIn: payload.expiresIn ?? 900,
    user: payload.user,
  };

  const nextSession: AuthSession = {
    accessToken: authResponse.accessToken,
    refreshToken: authResponse.refreshToken,
    expiresIn: authResponse.expiresIn,
    user: authResponse.user,
  };

  setCurrentSession(nextSession, request.rememberMe ?? false);

  return authResponse;
  */
}
