import { BadgeCheck, Clock3, MapPin, Phone, ShieldCheck, UserCircle2 } from 'lucide-react';

export function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <UserCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Receptionist Demo</h2>
              <p className="text-sm text-slate-500">Reception & Registration • Khokhrapar Desk</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                Active account
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              Shift: 08:00 – 16:00
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Profile details</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-teal-700" aria-hidden="true" /> +92 300 1234567</div>
            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-teal-700" aria-hidden="true" /> Khokhrapar, Malir, Karachi</div>
            <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-teal-700" aria-hidden="true" /> Role: Receptionist</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Assigned permissions</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Patients.Search', 'Patients.Create', 'Appointments.View', 'Queue.Manage'].map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
