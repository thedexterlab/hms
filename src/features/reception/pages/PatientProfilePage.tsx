import { HospitalLogo } from '../../../components/common/HospitalLogo';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getPatientById } from '../services/receptionService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

export function PatientProfilePage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['patient-profile', patientId], queryFn: () => getPatientById(patientId ?? ''), enabled: Boolean(patientId) });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="print-card space-y-6">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"><HospitalLogo /><div><p className="font-bold text-slate-900">Mastan Hospital</p><p className="text-sm text-slate-500">Khokhrapar, Malir, Karachi</p></div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Patient profile</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{data.fullName}</h2>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              MR No. {data.mrn}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Active status • Registered {data.registrationDate}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Approved demographic information</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-600">Age / DOB</p>
                <p className="mt-1 text-sm text-slate-800">{data.age} years • {data.dob}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Gender</p>
                <p className="mt-1 text-sm text-slate-800">{data.gender}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Marital status</p>
                <p className="mt-1 text-sm text-slate-800">{data.maritalStatus ?? 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-slate-600">Mobile</p>
                <p className="mt-1 text-sm text-slate-800">{data.mobile}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Email</p>
                <p className="mt-1 text-sm text-slate-800">{data.email}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Guardian</p>
                <p className="mt-1 text-sm text-slate-800">{data.guardianName}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Guardian relationship / mobile</p>
                <p className="mt-1 text-sm text-slate-800">{data.guardianRelationship ?? 'N/A'} / {data.guardianMobile}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-slate-600">City / district</p>
                <p className="mt-1 text-sm text-slate-800">{data.city ?? 'N/A'} / {data.district ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Registration</p>
                <p className="mt-1 text-sm text-slate-800">{data.registrationType} / {data.department}</p>
              </div>
            </div>
          </div>

          {(data.caseSummary || data.caseDoctors?.length || data.reports?.length) ? <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Case overview</h3>
                <p className="mt-1 text-sm text-slate-500">Summary of the current case and consulting doctors.</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
              <p className="text-sm text-slate-500">Case</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{data.caseSummary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.caseDoctors?.map((doctor) => (
                  <span key={doctor} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">{doctor}</span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-900">Lab & X-ray reports</h4>
              <p className="mt-1 text-sm text-slate-500">Download completed patient reports below.</p>
            </div>

            <div className="mt-4 space-y-3">
              {data.reports?.length ? (
                data.reports.map((report) => (
                  <div key={report.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                      <p className="text-sm text-slate-600">{report.type} • {report.date} • {report.status}</p>
                    </div>
                    <a href={report.fileUrl} download={report.fileName} className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800">
                      Download
                    </a>
                  </div>
                ))
              ) : null}
            </div>
          </div> : null}
        </div>

        <div className="no-print rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Reception actions</h3>
          <div className="mt-4 space-y-3">
            <button type="button" onClick={() => navigate(`/reception/patients/${patientId}/edit`)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50">Edit approved demographics</button>
            <button type="button" onClick={() => navigate(`/reception/appointments/new?patientId=${patientId}`)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50">Book appointment / assign doctor</button>
            <button type="button" onClick={() => navigate(`/reception/walk-ins/new?patientId=${patientId}`)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50">Register walk-in</button>
            <button type="button" onClick={() => window.print()} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50">Print patient card</button>
          </div>
        </div>
      </div>
    </div>
  );
}
