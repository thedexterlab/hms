import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QUEUE_UPDATED_EVENT, readAssignedVisits, updateAssignedVisitStatus } from './queueBridge';

describe('reception-to-doctor queue bridge', () => {
  beforeEach(() => localStorage.clear());

  it('shows only visits assigned to the signed-in doctor', () => {
    localStorage.setItem('hms-walk-ins', JSON.stringify([
      { id: 'visit-1', tokenNumber: 101, patientName: 'Ayesha Khan', mrn: 'MH-1', department: 'General Medicine', doctor: 'Dr. OPD Doctor', priority: 'Urgent', status: 'Waiting' },
      { id: 'visit-2', tokenNumber: 102, patientName: 'Other Patient', mrn: 'MH-2', department: 'Pediatrics', doctor: 'Dr. Child Specialist', priority: 'Normal', status: 'Waiting' },
    ]));

    expect(readAssignedVisits('Dr. OPD Doctor')).toEqual([expect.objectContaining({ id: 'visit-1', patientName: 'Ayesha Khan' })]);
  });

  it('returns consultation status to the reception queue', () => {
    const listener = vi.fn();
    window.addEventListener(QUEUE_UPDATED_EVENT, listener);
    localStorage.setItem('hms-walk-ins', JSON.stringify([
      { id: 'visit-1', tokenNumber: 101, patientName: 'Ayesha Khan', mrn: 'MH-1', department: 'General Medicine', doctor: 'Dr. OPD Doctor', priority: 'Normal', status: 'Waiting' },
    ]));

    expect(updateAssignedVisitStatus('visit-1', 'In consultation')).toBe(true);
    expect(JSON.parse(localStorage.getItem('hms-walk-ins') ?? '[]')[0].status).toBe('In consultation');
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(QUEUE_UPDATED_EVENT, listener);
  });
});
