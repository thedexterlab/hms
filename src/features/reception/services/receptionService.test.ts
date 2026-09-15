import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ReceptionModule from './receptionService';

// The service module captures localStorage state at import time, so each
// test resets modules and re-imports after seeding storage.
async function loadService() {
  return (await import('./receptionService')) as typeof ReceptionModule;
}

describe('reception patient MRN generation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('issues a clearly marked provisional identifier and makes it searchable', async () => {
    const service = await loadService();
    const result = await service.createPatient({
      firstName: 'Ali',
      lastName: 'Raza',
      primaryMobile: '0300-1112233',
      gender: 'Male',
    });

    // Frontend must never fabricate a permanent MRN: the PROV- prefix marks
    // the identifier as provisional until the backend issues the real MRN.
    expect(result.mrn).toMatch(/^PROV-\d{4}-\d{6}$/);
    expect(result.mrnProvisional).toBe(true);

    const matches = await service.searchPatients(result.mrn);
    expect(matches.some((patient) => patient.mrn === result.mrn)).toBe(true);
  });

  it('never issues the same provisional MRN twice in a session', async () => {
    const service = await loadService();
    const first = await service.createPatient({ firstName: 'A', lastName: 'B', primaryMobile: '03001112233' });
    const second = await service.createPatient({ firstName: 'C', lastName: 'D', primaryMobile: '03004445566' });
    expect(first.mrn).not.toBe(second.mrn);
  });
});

describe('duplicate detection (searchPatientsByIdentity)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('finds an existing patient by phone number regardless of formatting', async () => {
    localStorage.setItem('hms-patients', JSON.stringify([
      { id: 'p-1', mrn: 'MH-2026-000001', fullName: 'Ayesha Khan', age: 32, gender: 'Female', mobile: '0300-1112233', guardianName: 'Imran Khan', registrationDate: '2026-07-01', status: 'Active', identityMasked: 'N/A' },
    ]));

    const service = await loadService();
    const byPlain = await service.searchPatientsByIdentity('0300-1112233');
    const byDigits = await service.searchPatientsByIdentity('3001112233');
    expect(byPlain.some((patient) => patient.id === 'p-1')).toBe(true);
    expect(byDigits.some((patient) => patient.id === 'p-1')).toBe(true);
  });

  it('removes legacy CNIC and does not search by it', async () => {
    localStorage.setItem('hms-patients', JSON.stringify([
      { id: 'p-2', mrn: 'MH-2026-000002', fullName: 'Bilal Ahmed', age: 40, gender: 'Male', mobile: '0301-2223334', guardianName: '', registrationDate: '2026-07-02', status: 'Active', identityMasked: 'N/A' },
    ]));
    localStorage.setItem('hms-patient-details', JSON.stringify({
      'p-2': { id: 'p-2', mrn: 'MH-2026-000002', fullName: 'Bilal Ahmed', age: 40, gender: 'Male', mobile: '0301-2223334', guardianName: '', registrationDate: '2026-07-02', status: 'Active', identityMasked: 'N/A', dob: 'N/A', cnic: '37101-1234567-1', email: 'N/A', guardianMobile: 'N/A', registrationType: 'OPD', department: 'General Medicine' },
    }));

    localStorage.setItem('hms-identity-fingerprints', JSON.stringify({ 'p-2': { cnicTail: '345671', mobileTail: '3334' } }));

    const service = await loadService();
    const matches = await service.searchPatientsByIdentity('37101-1234567-1');
    expect(matches.some((patient) => patient.id === 'p-2')).toBe(false);
    expect(localStorage.getItem('hms-patient-details')).not.toContain('cnic');
    expect(localStorage.getItem('hms-identity-fingerprints')).toBeNull();
  });

  it('removes the legacy fingerprint index on reload', async () => {
    localStorage.setItem('hms-patients', JSON.stringify([
      { id: 'p-2', mrn: 'MH-2026-000002', fullName: 'Bilal Ahmed', age: 40, gender: 'Male', mobile: '0301-2223334', guardianName: '', registrationDate: '2026-07-02', status: 'Active', identityMasked: 'N/A' },
    ]));
    localStorage.setItem('hms-patient-details', JSON.stringify({
      'p-2': { id: 'p-2', mrn: 'MH-2026-000002', fullName: 'Bilal Ahmed', age: 40, gender: 'Male', mobile: '0301-2223334', guardianName: '', registrationDate: '2026-07-02', status: 'Active', identityMasked: 'N/A', dob: 'N/A', cnic: '37101-*******-1', email: 'N/A', guardianMobile: 'N/A', registrationType: 'OPD', department: 'General Medicine' },
    }));
    localStorage.setItem('hms-identity-fingerprints', JSON.stringify({ 'p-2': { cnicTail: '345671', mobileTail: '3334' } }));

    const service = await loadService();
    const matches = await service.searchPatientsByIdentity('37101-1234567-1');
    expect(matches.some((patient) => patient.id === 'p-2')).toBe(false);
    expect(localStorage.getItem('hms-patient-details')).not.toContain('cnic');
    expect(localStorage.getItem('hms-identity-fingerprints')).toBeNull();
  });

  it('finds a patient by MRN', async () => {
    localStorage.setItem('hms-patients', JSON.stringify([
      { id: 'p-3', mrn: 'MH-2026-000003', fullName: 'Sara Ali', age: 25, gender: 'Female', mobile: '0333-5556667', guardianName: '', registrationDate: '2026-07-03', status: 'Active', identityMasked: 'N/A' },
    ]));

    const service = await loadService();
    const matches = await service.searchPatientsByIdentity('MH-2026-000003');
    expect(matches.some((patient) => patient.id === 'p-3')).toBe(true);
  });

  it('returns nothing for an empty query and no false match for unrelated input', async () => {
    localStorage.setItem('hms-patients', JSON.stringify([
      { id: 'p-4', mrn: 'MH-2026-000004', fullName: 'Hina Malik', age: 29, gender: 'Female', mobile: '0345-7778889', guardianName: '', registrationDate: '2026-07-04', status: 'Active', identityMasked: 'N/A' },
    ]));

    const service = await loadService();
    expect(await service.searchPatientsByIdentity('')).toEqual([]);
    expect(await service.searchPatientsByIdentity('9999912345678')).toEqual([]);
  });
});

describe('privacy masking and update whitelist', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('discards CNIC while masking contact details', async () => {
    const service = await loadService();
    const result = await service.createPatient({
      firstName: 'Nadia',
      lastName: 'Iqbal',
      primaryMobile: '0321-9998877',
      cnic: '42101-7654321-8',
      email: 'nadia@example.com',
      guardianMobile: '0300-1234567',
    });

    const stored = JSON.parse(localStorage.getItem('hms-patient-details') ?? '{}') as Record<string, { cnic: string; email: string; guardianMobile: string }>;
    const detail = stored[result.id];
    expect(detail.cnic).toBeUndefined();
    expect(detail.email).toContain('•••');
    expect(detail.email).not.toContain('example.com');
    expect(detail.guardianMobile).toBe('•••••4567');
  });

  it('does not create identity fingerprints', async () => {
    const service = await loadService();
    const result = await service.createPatient({
      firstName: 'Nadia',
      lastName: 'Iqbal',
      primaryMobile: '0321-9998877',
      cnic: '42101-7654321-8',
    });

    const fingerprints = JSON.parse(localStorage.getItem('hms-identity-fingerprints') ?? '{}') as Record<string, { cnicTail: string; mobileTail: string }>;
    expect(fingerprints[result.id]).toBeUndefined();

    const raw = localStorage.getItem('hms-identity-fingerprints') ?? '';
    expect(raw).not.toContain('7654321');
  });

  it('ignores unknown and protected fields in updatePatient (mass-assignment defense)', async () => {
    const service = await loadService();
    const created = await service.createPatient({ firstName: 'Omar', lastName: 'Farooq', primaryMobile: '0311-2223334' });

    await service.updatePatient({
      id: created.id,
      firstName: 'Omar',
      lastName: 'Changed',
      // Attempted mass-assignment of protected/unknown fields must be ignored:
      mrn: 'HACKED-MRN',
      registrationDate: '1999-01-01',
      status: 'Deleted',
      rogueField: ' injected ',
    });

    const updated = await service.getPatientById(created.id);
    expect(updated.fullName).toBe('Omar Changed');
    expect(updated.mrn).toBe(created.mrn);
    expect(updated.mrn).not.toBe('HACKED-MRN');
    expect(updated.status).toBe('Active');
    expect(updated.registrationDate).not.toBe('1999-01-01');
  });

  it('rejects updates for unknown patient ids', async () => {
    const service = await loadService();
    await expect(service.updatePatient({ id: 'missing', firstName: 'X' })).rejects.toThrow('NOT_FOUND');
  });
});

