import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { readDoctorData, writeDoctorData } from './doctorStorage';
import type { DispensedRecord, Prescription } from './mockData';

describe('clinical demo data', () => {
  beforeEach(() => { localStorage.clear(); vi.stubEnv('VITE_USE_MOCK_AUTH', 'true'); });
  afterEach(() => vi.unstubAllEnvs());

  it('shares pending and dispensed prescriptions with consistent history', () => {
    const prescriptions = readDoctorData<Prescription[]>('prescriptions', []);
    const history = readDoctorData<DispensedRecord[]>('dispensed-prescriptions', []);
    expect(prescriptions.filter((item) => item.status === 'Pending pharmacist')).toHaveLength(5);
    expect(history).toHaveLength(5);
    for (const record of history) {
      expect(prescriptions.find((item) => item.id === record.id)).toMatchObject({ status: 'Dispensed', medicines: record.medicines });
      expect(new Date(record.dispensedAt).getTime()).toBeGreaterThanOrEqual(new Date(record.createdAt).getTime());
    }
    expect(readDoctorData('diagnostic-results', [])).toHaveLength(2);
    expect(readDoctorData('consultations', [])).toHaveLength(5);
  });

  it('preserves existing records and does not resurrect a cleared queue', () => {
    writeDoctorData('prescriptions', [{ id: 'user-rx', patientName: 'Existing record' }]);
    expect(readDoctorData<Prescription[]>('prescriptions', [])[0].id).toBe('user-rx');
    expect(readDoctorData('prescriptions', [])).toHaveLength(11);
    writeDoctorData('prescriptions', []);
    expect(readDoctorData('prescriptions', [])).toEqual([]);
  });

  it('populates previously empty demo collections once', () => {
    writeDoctorData('prescriptions', []);
    expect(readDoctorData('prescriptions', [])).toHaveLength(10);
    expect(readDoctorData('prescriptions', [])).toHaveLength(10);
  });

  it('does not seed when mock auth is disabled', () => {
    vi.stubEnv('VITE_USE_MOCK_AUTH', 'false');
    expect(readDoctorData('prescriptions', [])).toEqual([]);
    expect(localStorage.length).toBe(0);
  });
});
