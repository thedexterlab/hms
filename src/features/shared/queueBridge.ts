export const QUEUE_UPDATED_EVENT = 'hms-queue-updated';

const QUEUE_STORAGE_KEYS = ['hms-walk-ins', 'hms-appointments'] as const;

export interface AssignedVisit {
  id: string;
  tokenNumber: number;
  patientId?: string;
  patientName: string;
  mrn: string;
  department: string;
  doctor: string;
  priority: string;
  status: string;
  appointmentDate?: string;
  arrivalTime?: string;
}

function readVisits(key: string): AssignedVisit[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function readAssignedVisits(doctorName: string): AssignedVisit[] {
  const normalizedDoctor = doctorName.trim().toLowerCase();
  if (!normalizedDoctor) return [];

  const unique = new Map<string, AssignedVisit>();
  for (const key of QUEUE_STORAGE_KEYS) {
    for (const visit of readVisits(key)) {
      if (visit.doctor?.trim().toLowerCase() === normalizedDoctor) unique.set(visit.id, visit);
    }
  }

  return [...unique.values()].sort((a, b) => {
    if (a.priority === 'Emergency' && b.priority !== 'Emergency') return -1;
    if (a.priority === 'Urgent' && !['Emergency', 'Urgent'].includes(b.priority)) return -1;
    return String(a.arrivalTime ?? a.appointmentDate ?? '').localeCompare(String(b.arrivalTime ?? b.appointmentDate ?? ''));
  });
}

export function updateAssignedVisitStatus(visitId: string, status: string): boolean {
  if (typeof window === 'undefined') return false;
  let updated = false;

  for (const key of QUEUE_STORAGE_KEYS) {
    const visits = readVisits(key);
    let keyUpdated = false;
    const next = visits.map((visit) => {
      if (visit.id !== visitId) return visit;
      updated = true;
      keyUpdated = true;
      return { ...visit, status };
    });
    if (keyUpdated) window.localStorage.setItem(key, JSON.stringify(next));
  }

  if (updated) window.dispatchEvent(new Event(QUEUE_UPDATED_EVENT));
  return updated;
}

export function notifyQueueUpdated(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(QUEUE_UPDATED_EVENT));
}
