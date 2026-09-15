import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('auth session persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('restores a saved session after a refresh', async () => {
    const session = {
      accessToken: 'persisted-token',
      refreshToken: 'persisted-refresh',
      expiresIn: 900,
      user: {
        id: 'demo-receptionist',
        fullName: 'Receptionist Demo',
        roles: ['Receptionist'],
        permissions: ['Patients.Search'],
        departmentId: 'dept-reception',
        departmentName: 'Reception & Registration',
      },
    };

    localStorage.setItem('hms-auth-session', JSON.stringify(session));

    const { getCurrentSession } = await import('./auth.service');

    expect(getCurrentSession()).toMatchObject({ accessToken: 'persisted-token' });
  });
});
