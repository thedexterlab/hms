import type { ReactNode } from 'react';
import type { Permission } from '../lib/permissions';

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
}

const currentPermissions: Permission[] = [
  'Reception.Dashboard.View',
  'Patients.Search',
  'Patients.Create',
  'Patients.Demographics.View',
  'Patients.Demographics.Update',
  'Appointments.View',
  'Appointments.Create',
  'Appointments.Reschedule',
  'Appointments.Cancel',
  'Appointments.CheckIn',
  'Appointments.MarkNoShow',
  'Queue.View',
  'Queue.Manage',
  'Print.PatientCard',
  'Print.AppointmentSlip',
];

export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const hasAccess = currentPermissions.includes(permission);

  if (!hasAccess) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        You do not have permission to access this section.
      </div>
    );
  }

  return <>{children}</>;
}
