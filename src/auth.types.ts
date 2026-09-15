export type RoleName =
  | 'Administrator'
  | 'Receptionist'
  | 'Doctor'
  | 'Nurse'
  | 'Emergency Staff'
  | 'Labour Room Staff'
  | 'Operation Theatre Staff'
  | 'Recovery Room Staff'
  | 'Ward Staff'
  | 'Nursery Staff'
  | 'Laboratory Staff'
  | 'Ultrasound Staff'
  | 'Pharmacist'
  | 'Vaccination Staff'
  | 'Medical Records Staff'
  | 'HR Staff'
  | 'Finance Staff'
  | 'Store Staff'
  | 'Housekeeping Staff'
  | 'Security Staff'
  | 'Maintenance Staff'
  | 'IT Staff'
  | (string & {});

export interface AuthUser {
  id: string;
  fullName: string;
  roles: RoleName[];
  permissions: string[];
  departmentId?: string;
  departmentName?: string;
  specialty?: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class AuthError extends Error {
  constructor(message: string, public code: AuthErrorCode) {
    super(message);
    this.name = 'AuthError';
  }
}
