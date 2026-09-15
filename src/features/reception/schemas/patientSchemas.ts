import { z } from 'zod';

// Collect patient care and contact details without government identifiers.
export const patientRegistrationSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  gender: z.string().min(1, 'Gender is required.'),
  // Date of birth is mandatory (FHIR birthDate / Registrar Playbook §3.2);
  // approximate age may be captured only when the full DOB is unknown.
  dob: z.string().min(1, 'Date of birth is required.').refine((value) => !value || new Date(value) <= new Date(), 'Date of birth cannot be in the future.'),
  age: z.coerce.number().min(0, 'Enter a valid age.').max(120, 'Enter a valid age.').optional(),
  // Blood group is captured at registration for transfusion safety; an
  // explicit 'Unknown' value is allowed until a lab result confirms it.
  bloodGroup: z.string().min(1, 'Blood group is required.'),
  maritalStatus: z.string().optional(),
  occupation: z.string().optional(),
  preferredLanguage: z.string().optional(),
  primaryMobile: z.string().trim().min(7, 'Enter a valid mobile number.'),
  secondaryMobile: z.string().trim().optional(),
  email: z.string().trim().email('Enter a valid email address.').optional().or(z.literal('')),
  // Structured address (FHIR Patient.address: line, city, district, state,
  // postalCode).
  addressLine: z.string().trim().min(3, 'Street address is required.'),
  city: z.string().trim().min(2, 'City is required.'),
  district: z.string().trim().min(2, 'District is required.'),
  province: z.string().min(1, 'Province is required.'),
  postalCode: z.string().trim().optional(),
  guardianName: z.string().trim().optional(),
  guardianRelationship: z.string().optional(),
  guardianMobile: z.string().trim().optional(),
  registrationType: z.string().min(1, 'Registration type is required.'),
  department: z.string().min(1, 'Department is required.'),
  consent: z.boolean().refine((value) => value, { message: 'Consent is required.' }),
  privacyNotice: z.boolean().refine((value) => value, { message: 'Privacy notice is required.' }),
}).superRefine((data, ctx) => {
  if (data.guardianName && !data.guardianRelationship) {
    ctx.addIssue({ code: 'custom', message: 'Guardian relationship is required when guardian name is provided.', path: ['guardianRelationship'] });
  }
  // Emergency contact (guardian) phone is mandatory when a guardian is on
  // file — the Registrar Playbook requires full emergency-contact details.
  if (data.guardianName && !data.guardianMobile) {
    ctx.addIssue({ code: 'custom', message: 'Guardian mobile number is required when guardian name is provided.', path: ['guardianMobile'] });
  }
});

export const demographicsSchema = z.object({
  mobile: z.string().trim().min(7, 'Enter a valid mobile number.'),
  email: z.string().trim().email('Enter a valid email address.').optional().or(z.literal('')),
  address: z.string().trim().min(3, 'Address is required.'),
  preferredLanguage: z.string().optional(),
  editReason: z.string().trim().min(3, 'An edit reason is required.'),
});

export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required.'),
  department: z.string().min(1, 'Department is required.'),
  doctorId: z.string().min(1, 'Doctor is required.'),
  appointmentDate: z.string().min(1, 'Appointment date is required.'),
  appointmentTime: z.string().min(1, 'Appointment time is required.'),
  appointmentType: z.string().min(1, 'Appointment type is required.'),
  priority: z.string().min(1, 'Priority is required.'),
  paymentStatus: z.string().optional(),
  adminNote: z.string().max(250, 'Notes must be 250 characters or less.').optional(),
}).superRefine((data, ctx) => {
  if (new Date(data.appointmentDate) < new Date(new Date().toDateString())) {
    ctx.addIssue({ code: 'custom', message: 'Appointment date cannot be in the past.', path: ['appointmentDate'] });
  }
});

export const paymentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required.'),
  appointmentId: z.string().optional(),
  chargeType: z.string().min(1, 'Charge type is required.'),
  amount: z.coerce.number().min(0, 'Amount cannot be negative.'),
  paymentMethod: z.string().min(1, 'Payment method is required.'),
  referenceNumber: z.string().optional(),
  notes: z.string().max(250, 'Notes must be 250 characters or less.').optional(),
});
