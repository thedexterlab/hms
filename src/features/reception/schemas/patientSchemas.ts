import { z } from 'zod';

// CNIC format (Pakistan): 5-7-1 digits; hyphens optional.
const cnicPattern = /^\d{5}-?\d{7}-?\d$/;

// Collect patient care and contact details without government identifiers.
// Only 'General OPD' registrations capture the minimum data set (name, gender,
// age, contact number, CNIC, optional blood group and marital status);
// Gynae OPD, Pediatrics OPD and Emergency keep the full Registrar Playbook
// field set.
export const patientRegistrationSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  gender: z.string().min(1, 'Gender is required.'),
  // Date of birth is mandatory for the full registration flow (FHIR birthDate
  // / Registrar Playbook §3.2); General OPD registrations capture age only.
  // Approximate age may be captured only when the full DOB is unknown.
  dob: z.string().optional().refine((value) => !value || new Date(value) <= new Date(), 'Date of birth cannot be in the future.'),
  age: z.preprocess((value) => (value === '' || value === null ? undefined : value), z.coerce.number().min(0, 'Enter a valid age.').max(120, 'Enter a valid age.').optional()),
  // Blood group is captured at registration for transfusion safety; an
  // explicit 'Unknown' value is allowed until a lab result confirms it.
  bloodGroup: z.string().optional(),
  maritalStatus: z.string().optional(),
  cnic: z.string().trim().optional().refine((value) => !value || cnicPattern.test(value), 'Enter a valid CNIC (e.g. 42101-1234567-8).'),
  occupation: z.string().optional(),
  preferredLanguage: z.string().optional(),
  primaryMobile: z.string().trim().min(7, 'Enter a valid mobile number.'),
  secondaryMobile: z.string().trim().optional(),
  email: z.string().trim().email('Enter a valid email address.').optional().or(z.literal('')),
  // Structured address (FHIR Patient.address: line, city, district, state,
  // postalCode). Required for the full flow only.
  addressLine: z.string().trim().optional().or(z.literal('')),
  city: z.string().trim().optional().or(z.literal('')),
  district: z.string().trim().optional().or(z.literal('')),
  province: z.string().optional(),
  postalCode: z.string().trim().optional(),
  guardianName: z.string().trim().optional(),
  guardianRelationship: z.string().optional(),
  guardianMobile: z.string().trim().optional(),
  guardianCnic: z.string().trim().optional().refine((value) => !value || cnicPattern.test(value), 'Enter a valid CNIC (e.g. 42101-1234567-8).'),
  guardianAddress: z.string().trim().optional(),
  registrationType: z.string().min(1, 'Registration type is required.'),
  department: z.string().min(1, 'Department is required.'),
  consent: z.boolean().refine((value) => value, { message: 'Consent is required.' }),
  privacyNotice: z.boolean().refine((value) => value, { message: 'Privacy notice is required.' }),
}).superRefine((data, ctx) => {
  const generalOpd = data.registrationType === 'General OPD';
  const addIssue = (path: string, message: string) => ctx.addIssue({ code: 'custom', message, path: [path] });

  if (generalOpd) {
    // General OPD: only name, gender, age, contact number and CNIC are
    // mandatory; blood group and marital status stay optional.
    if (data.age === undefined) {
      addIssue('age', 'Age is required.');
    }
    if (!data.cnic) {
      addIssue('cnic', 'CNIC is required.');
    }
  } else {
    if (!data.dob) {
      addIssue('dob', 'Date of birth is required.');
    }
    if (!data.bloodGroup) {
      addIssue('bloodGroup', 'Blood group is required.');
    }
    if (!data.addressLine || data.addressLine.trim().length < 3) {
      addIssue('addressLine', 'Street address is required.');
    }
    if (!data.city || data.city.trim().length < 2) {
      addIssue('city', 'City is required.');
    }
    if (!data.district || data.district.trim().length < 2) {
      addIssue('district', 'District is required.');
    }
    if (!data.province) {
      addIssue('province', 'Province is required.');
    }
  }

  if (data.guardianName && !data.guardianRelationship) {
    addIssue('guardianRelationship', 'Guardian relationship is required when guardian name is provided.');
  }
  // Emergency contact (guardian) phone is mandatory when a guardian is on
  // file — the Registrar Playbook requires full emergency-contact details.
  if (data.guardianName && !data.guardianMobile) {
    addIssue('guardianMobile', 'Guardian mobile number is required when guardian name is provided.');
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
