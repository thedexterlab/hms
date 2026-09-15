// Fictional fixtures for the mock-auth demo environment only.
export type Medicine = { medicine: string; dosage: string; duration: string; instructions: string };
export type Prescription = { id?: string; patientMrn: string; patientName: string; medicines: Medicine[]; status: string; createdAt: string };
export type DispensedRecord = Prescription & { dispensedAt: string; dispensedBy: string; pharmacyNote: string };

export function createClinicalMockData(now = new Date()): Record<string, unknown> {
  const date = (daysAgo: number, hour = 9) => {
    const value = new Date(now);
    value.setDate(value.getDate() - daysAgo);
    value.setHours(hour, 0, 0, 0);
    return value.toISOString();
  };
  const people = [
    ['MH-240318', 'Ayesha Khan'], ['MH-240321', 'Muhammad Hamza'],
    ['MH-240327', 'Sana Iqbal'], ['MH-240329', 'Bilal Ahmed'], ['MH-240334', 'Nadia Rauf'],
  ];
  const medicines: Medicine[] = [
    { medicine: 'Paracetamol 500mg', dosage: '1 tablet as needed, up to 3 times daily', duration: '3 days', instructions: 'Demo prescription; for UI testing only.' },
    { medicine: 'Metformin 500mg', dosage: '1 tablet twice daily', duration: '30 days', instructions: 'With meals. Demo record.' },
    { medicine: 'Cetirizine 10mg', dosage: '1 tablet at night', duration: '5 days', instructions: 'Demo record.' },
    { medicine: 'Omeprazole 20mg', dosage: '1 capsule daily', duration: '14 days', instructions: 'Before breakfast. Demo record.' },
    { medicine: 'Calcium carbonate 500mg', dosage: '1 tablet daily', duration: '30 days', instructions: 'After a meal. Demo record.' },
  ];
  const prescriptions: Prescription[] = Array.from({ length: 10 }, (_, index) => {
    const [patientMrn, patientName] = people[index % people.length];
    return {
      id: `demo-rx-${index + 1}`, patientMrn, patientName,
      medicines: index === 0 ? [medicines[0], medicines[2]] : [medicines[index % medicines.length]],
      status: index < 5 ? 'Pending pharmacist' : 'Dispensed',
      createdAt: date(index < 7 ? 0 : index - 6, 8),
    };
  });
  const dispensed: DispensedRecord[] = prescriptions.slice(5).map((item, index) => ({
    ...item, dispensedAt: date(index < 2 ? 0 : index - 1, 9),
    dispensedBy: index % 2 ? 'Demo Pharmacist — Hina' : 'Demo Pharmacist — Usman',
    pharmacyNote: 'Demo handover completed. Quantity checked and instructions explained.',
  }));
  return {
    prescriptions,
    'dispensed-prescriptions': dispensed,
    consultations: people.map(([patientMrn, patientName], index) => ({
      id: `demo-visit-${index + 1}`, patientMrn, patientName, status: 'Completed', savedAt: date(index + 1),
      notes: 'Fictional follow-up consultation. Assessment documented and follow-up arranged.',
      vitals: { bloodPressure: '120/80', temperature: '36.8', pulse: '72', weight: '65' },
    })),
    'diagnostic-orders': [
      { patientMrn: people[0][0], patientName: people[0][1], type: 'Ultrasound', study: 'Abdominal ultrasound', clinicalDetails: 'Demo request for abdominal discomfort.', status: 'Requested' },
      { patientMrn: people[1][0], patientName: people[1][1], type: 'X-ray', study: 'Chest X-ray', clinicalDetails: 'Demo request for persistent cough.', status: 'Requested' },
    ],
    'diagnostic-results': [
      { patientMrn: people[0][0], patientName: people[0][1], type: 'Ultrasound', study: 'Pelvic ultrasound', report: 'Fictional report: no significant abnormality identified in this demo study.', status: 'Report available' },
      { patientMrn: people[0][0], patientName: people[0][1], type: 'X-ray', study: 'Chest X-ray', report: 'Fictional report: clear lung fields; no acute finding in this demo study.', status: 'Report available' },
    ],
    'started-consultations': ['MH-240321'],
    'gynae-cycle-MH-240318-notes': 'Demo antenatal follow-up: routine investigations reviewed; next growth scan scheduled.',
  };
}
