import { createClinicalMockData } from './mockData';

const PREFIX = 'hms-doctor-';
const SEED_KEY = `${PREFIX}demo-seed-v1`;

export function seedDoctorDemoData(): void {
  if (typeof window === 'undefined' || import.meta.env.VITE_USE_MOCK_AUTH !== 'true') return;
  if (window.localStorage.getItem(SEED_KEY)) return;
  for (const [key, fixtures] of Object.entries(createClinicalMockData())) {
    const storageKey = `${PREFIX}${key}`;
    const raw = window.localStorage.getItem(storageKey);
    const existing = raw === null ? null : JSON.parse(raw);
    if (Array.isArray(fixtures) && (existing === null || Array.isArray(existing))) {
      const records = existing ?? [];
      const ids = new Set(records.map((item: { id?: string }) => item.id).filter(Boolean));
      window.localStorage.setItem(storageKey, JSON.stringify([...records, ...fixtures.filter((item) => !item.id || !ids.has(item.id))]));
    } else if (existing === null) {
      window.localStorage.setItem(storageKey, JSON.stringify(fixtures));
    }
  }
  window.localStorage.setItem(SEED_KEY, 'true');
}

export function readDoctorData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    seedDoctorDemoData();
    const value = window.localStorage.getItem(`${PREFIX}${key}`);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeDoctorData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export function removeDoctorData(key: string): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(`${PREFIX}${key}`);
}
