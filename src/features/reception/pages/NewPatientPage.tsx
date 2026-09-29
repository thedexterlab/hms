import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PatientRecord } from '../types';
import { patientRegistrationSchema } from '../schemas/patientSchemas';
import { createPatient, duplicateCheck } from '../services/receptionService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

export function NewPatientPage() {
  const [step, setStep] = useState(1);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<PatientRecord[]>([]);
  const [pendingValues, setPendingValues] = useState<Record<string, any> | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: '',
      dob: '',
      maritalStatus: 'Single',
      bloodGroup: '',
      age: '',
      primaryMobile: '',
      secondaryMobile: '',
      email: '',
      cnic: '',
      city: 'Karachi Malir',
      addressLine: '',
      province: 'Sindh',
      postalCode: '',
      occupation: '',
      preferredLanguage: '',
      district: '',
      guardianName: '',
      guardianRelationship: '',
      guardianMobile: '',
      guardianCnic: '',
      guardianAddress: '',
      registrationType: 'General OPD',
      department: 'General Medicine',
      consent: false,
      privacyNotice: false,
    },
  });

  const navigate = useNavigate();
  const createPatientMutation = useMutation({ mutationFn: createPatient });

  // Only 'General OPD' uses the short single-screen form; Gynae OPD,
  // Pediatrics OPD (children's OPD) and Emergency keep the full wizard.
  const registrationType = watch('registrationType');
  const isGeneralOpd = registrationType === 'General OPD';

  // Keep the department in sync with the chosen registration type so the
  // long-form wizard (Step 4) starts with the correct clinic preselected.
  const handleRegistrationTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setStep(1);
    const departmentByType: Record<string, string> = {
      'General OPD': 'General Medicine',
      'Gynae OPD': 'Gynecology',
      'Pediatrics OPD': 'Pediatrics',
      'Emergency': 'General Medicine',
    };
    const nextDepartment = departmentByType[event.target.value];
    if (nextDepartment) {
      setValue('department', nextDepartment);
    }
  };

  const onSubmit = async (values: any) => {
    const duplicate = await duplicateCheck({
      identity: values.primaryMobile ?? '',
      fullName: `${values.firstName} ${values.lastName}`,
      age: values.age ?? '',
      guardianName: values.guardianName ?? '',
      email: values.email ?? '',
    });

    if (duplicate.warning) {
      setPendingValues(values);
      setDuplicateMatches(duplicate.matches);
      setDuplicateWarning(true);
      return;
    }

    const result = await createPatientMutation.mutateAsync(values);
    if (result?.id) {
      navigate(`/reception/patients/${result.id}`);
    }
  };

  const onInvalid = (formErrors: Record<string, unknown>) => {
    const firstError = Object.keys(formErrors)[0];
    if (['firstName', 'lastName', 'gender', 'dob', 'bloodGroup', 'age', 'cnic'].includes(firstError)) setStep(1);
    else if (['primaryMobile', 'email', 'city', 'district', 'addressLine', 'province'].includes(firstError)) setStep(2);
    else if (['guardianRelationship', 'guardianCnic', 'guardianAddress'].includes(firstError)) setStep(3);
    else if (['registrationType', 'department', 'consent', 'privacyNotice'].includes(firstError)) setStep(4);
  };


  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">New patient registration</h2>
        <p className="mt-1 text-sm text-slate-500">Capture approved demographic details for reception use only.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" noValidate>
        <div className="max-w-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-800">Registration type</label>
          <select {...register('registrationType', { onChange: handleRegistrationTypeChange })} className="w-full rounded-xl border border-slate-200 px-3 py-2">
            <option value="General OPD">General OPD</option>
            <option value="Gynae OPD">Gynae OPD</option>
            <option value="Pediatrics OPD">Pediatrics OPD</option>
            <option value="Emergency">Emergency</option>
          </select>
          {errors.registrationType ? <p className="mt-1 text-sm text-red-600">{errors.registrationType.message}</p> : null}
        </div>

        {!isGeneralOpd ? (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <button key={item} type="button" onClick={() => setStep(item)} className={`rounded-full px-3 py-2 text-sm font-semibold ${step === item ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                Step {item}
              </button>
            ))}
          </div>
        ) : null}

        {(isGeneralOpd || step === 1) ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">First name</label>
              <input {...register('firstName')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              {errors.firstName ? <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Last name</label>
              <input {...register('lastName')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              {errors.lastName ? <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Gender</label>
              <select {...register('gender')} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender ? <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">{isGeneralOpd ? 'Age' : 'Age (only if DOB unknown)'}</label>
              <input type="number" min="0" {...register('age')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              {errors.age ? <p className="mt-1 text-sm text-red-600">{errors.age.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Contact Number</label>
              <input {...register('primaryMobile')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              {errors.primaryMobile ? <p className="mt-1 text-sm text-red-600">{errors.primaryMobile.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">CNIC</label>
              <input {...register('cnic')} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="42101-1234567-8" />
              {errors.cnic ? <p className="mt-1 text-sm text-red-600">{errors.cnic.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Blood group</label>
              <select {...register('bloodGroup')} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Unknown">Unknown</option>
              </select>
              {errors.bloodGroup ? <p className="mt-1 text-sm text-red-600">{errors.bloodGroup.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Marital status</label>
              <select {...register('maritalStatus')} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Divorced">Divorced</option>
                <option value="Separated">Separated</option>
              </select>
            </div>
          </div>
        ) : null}

        {(!isGeneralOpd && step === 2) ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Contact Number</label>
              <input {...register('primaryMobile')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              {errors.primaryMobile ? <p className="mt-1 text-sm text-red-600">{errors.primaryMobile.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Email</label>
              <input {...register('email')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">City</label>
              <select {...register('city')} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="Karachi South">Karachi South</option>
                <option value="Karachi East">Karachi East</option>
                <option value="Karachi West">Karachi West</option>
                <option value="Karachi Central">Karachi Central</option>
                <option value="Karachi Malir">Karachi Malir</option>
                <option value="Karachi Korangi">Karachi Korangi</option>
                <option value="Karachi Keamari">Karachi Keamari</option>
                <option value="Other (outside Karachi)">Other (outside Karachi)</option>
              </select>
              {errors.city ? <p className="mt-1 text-sm text-red-600">{errors.city.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Area / locality (Karachi)</label>
              <input {...register('district')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              {errors.district ? <p className="mt-1 text-sm text-red-600">{errors.district.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Street address</label>
              <input {...register('addressLine')} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="House / street / area" />
              {errors.addressLine ? <p className="mt-1 text-sm text-red-600">{errors.addressLine.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Province</label>
              <select {...register('province')} className="w-full rounded-xl border border-slate-200 px-3 py-2" disabled>
                <option value="Sindh">Sindh (fixed - hospital serves Karachi)</option>
              </select>
              {errors.province ? <p className="mt-1 text-sm text-red-600">{errors.province.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Postal code (optional)</label>
              <input {...register('postalCode')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Secondary mobile (optional)</label>
              <input {...register('secondaryMobile')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Occupation (optional)</label>
              <input {...register('occupation')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            
            
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Preferred language (optional)</label>
              <select {...register('preferredLanguage')} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="">Select</option>
                <option value="Urdu">Urdu</option>
                <option value="Sindhi">Sindhi</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Pashto">Pashto</option>
                <option value="Balochi">Balochi</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>
        ) : null}

        {(!isGeneralOpd && step === 3) ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Guardian name</label>
              <input {...register('guardianName')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Guardian relationship</label>
              <select {...register('guardianRelationship')} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="">Select</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Husband">Husband</option>
                <option value="Wife">Wife</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Uncle">Uncle</option>
                <option value="Aunt">Aunt</option>
                <option value="Guardian">Guardian</option>
                <option value="Guardian">Neighbors</option>
                <option value="Other">Other</option>
              </select>
              {errors.guardianRelationship ? <p className="mt-1 text-sm text-red-600">{errors.guardianRelationship.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Guardian mobile</label>
              <input {...register('guardianMobile')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Guardian CNIC</label>
              <input {...register('guardianCnic')} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="42101-1234567-8" />
              {errors.guardianCnic ? <p className="mt-1 text-sm text-red-600">{errors.guardianCnic.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Guardian Address</label>
              <input {...register('guardianAddress')} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
          </div>
        ) : null}

        {(!isGeneralOpd && step === 4) ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Department</label>
              <select {...register('department')} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="General Medicine">General Medicine</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Gynecology">Gynecology</option>
              </select>
            </div>
          </div>
        ) : null}

        {(!isGeneralOpd && step === 5) ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p>Important demographic changes are recorded for audit and patient-safety purposes.</p>
            <p className="mt-2">Receptionists may only capture approved demographic information. Clinical notes remain outside this form.</p>
          </div>
        ) : null}

        {/* {isGeneralOpd ? (
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register('consent')} />
              Consent acknowledged
            </label>
            {errors.consent ? <p className="text-sm text-red-600">{errors.consent.message}</p> : null}
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register('privacyNotice')} />
              Privacy notice acknowledged
            </label>
            {errors.privacyNotice ? <p className="text-sm text-red-600">{errors.privacyNotice.message}</p> : null}
          </div>
        ) : null} */}

        <div className="flex justify-between gap-3">
          {isGeneralOpd ? (
            <button type="submit" disabled={isSubmitting} className="ml-auto rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Register patient</button>
          ) : (
            <>
              <button type="button" onClick={() => setStep((value) => Math.max(1, value - 1))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Previous</button>
              {step < 5 ? <button type="button" onClick={() => setStep((value) => value + 1)} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Next</button> : <button type="submit" disabled={isSubmitting} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Register patient</button>}
            </>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={duplicateWarning}
        title="Possible duplicate patient"
        description="A similar patient record was found. Review the existing record before continuing."
        detail={
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Matching existing records</p>
            <div className="space-y-2 text-sm text-slate-700">
              {duplicateMatches.length > 0 ? (
                duplicateMatches.map((match) => (
                  <div key={match.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="font-semibold">{match.fullName}</p>
                    <p>{match.mrn} · {match.mobile}</p>
                    <p>{match.guardianName ? `Guardian: ${match.guardianName}` : 'No guardian on file'}</p>
                    <p>Registered: {match.registrationDate}</p>
                  </div>
                ))
              ) : (
                <p>No exact match details available.</p>
              )}
            </div>
          </div>
        }
        confirmLabel="Create anyway"
        cancelLabel="Cancel registration"
        onConfirm={async () => {
          setDuplicateWarning(false);
          if (!pendingValues) {
            return;
          }

          const result = await createPatientMutation.mutateAsync(pendingValues);
          navigate(`/reception/patients/${result.id}`);
        }}
        onCancel={() => {
          setDuplicateWarning(false);
          setPendingValues(null);
        }}
      />
    </div>
  );
}