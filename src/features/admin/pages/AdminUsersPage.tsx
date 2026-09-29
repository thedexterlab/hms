import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyRound, LockOpen, Pencil, Power, PowerOff, Search, UserPlus } from 'lucide-react';
import type { AdminUser, AdminUserInput, AdminUserPatch } from '../types';
import { ALL_PERMISSIONS, createUser, listUsers, resetUserPassword, setUserActive, unlockUser, updateUser } from '../services/adminService';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorState } from '../../../components/common/ErrorState';

const ROLES = ['Administrator', 'Receptionist', 'Doctor', 'Pharmacist', 'Nurse', 'Laboratory Staff', 'Finance Staff', 'HR Staff', 'IT Staff', 'Store Staff'];

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['admin-users', search, roleFilter], queryFn: () => listUsers(search, roleFilter) });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
  };

  const mutateAction = (action: () => Promise<unknown>) => {
    setActionError(null);
    action().then(invalidate).catch((err: Error) => setActionError(err.message));
  };

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">User management</h2>
          <p className="text-sm text-slate-500">Create staff accounts, assign roles and permissions, reset passwords, unlock and deactivate accounts.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" /> New account
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <Search className="h-4 w-4" aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, username or department" className="w-full bg-transparent outline-none" />
        </label>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          {['All', ...ROLES].map((role) => <option key={role}>{role}</option>)}
        </select>
      </div>

      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {actionError === 'LAST_ADMIN' ? 'At least one active administrator must remain.' : actionError === 'DUPLICATE_USERNAME' ? 'An account with this username already exists.' : `Action failed: ${actionError}`}
        </div>
      ) : null}

      {/* __TABLE__ */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((user) => (
              <tr key={user.id} className="align-middle">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{user.fullName}</p>
                  <p className="text-xs text-slate-500">{user.username}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{user.role}</td>
                <td className="px-4 py-3 text-slate-700">{user.departmentName ?? '—'}</td>
                <td className="px-4 py-3">
                  {user.isActive ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span> : <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Deactivated</span>}
                  {user.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? <span className="ml-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Locked</span> : null}
                  {user.failedLoginCount > 0 ? <span className="ml-2 text-xs text-amber-600">{user.failedLoginCount} failed attempts</span> : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" title="Edit" onClick={() => { setEditing(user); setFormOpen(true); }} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" title="Reset password" onClick={() => setPasswordTarget(user)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><KeyRound className="h-4 w-4" aria-hidden="true" /></button>
                    {user.lockoutEnd ? (
                      <button type="button" title="Unlock" onClick={() => mutateAction(() => unlockUser(user.id))} className="rounded-lg border border-amber-200 p-2 text-amber-700 hover:bg-amber-50"><LockOpen className="h-4 w-4" aria-hidden="true" /></button>
                    ) : null}
                    {user.isActive ? (
                      <button type="button" title="Deactivate" onClick={() => mutateAction(() => setUserActive(user.id, false))} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50"><PowerOff className="h-4 w-4" aria-hidden="true" /></button>
                    ) : (
                      <button type="button" title="Activate" onClick={() => mutateAction(() => setUserActive(user.id, true))} className="rounded-lg border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-50"><Power className="h-4 w-4" aria-hidden="true" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No accounts match your search.</p> : null}
      </div>
      {/* __DIALOGS__ */}
      {formOpen ? (
        <UserFormDialog
          user={editing}
          onClose={() => setFormOpen(false)}
          onSubmit={async (input, patch) => {
            setActionError(null);
            try {
              if (editing) await updateUser(editing.id, patch as AdminUserPatch);
              else await createUser(input as AdminUserInput);
              setFormOpen(false);
              invalidate();
            } catch (err) {
              setActionError(err instanceof Error ? err.message : 'Save failed.');
            }
          }}
        />
      ) : null}

      {passwordTarget ? (
        <ResetPasswordDialog
          user={passwordTarget}
          onClose={() => setPasswordTarget(null)}
          onSubmit={async (newPassword) => {
            setActionError(null);
            try {
              await resetUserPassword(passwordTarget.id, newPassword);
              setPasswordTarget(null);
              invalidate();
            } catch (err) {
              setActionError(err instanceof Error ? err.message : 'Reset failed.');
            }
          }}
        />
      ) : null}
    </div>
  );
}

interface UserFormDialogProps {
  user: AdminUser | null;
  onClose: () => void;
  onSubmit: (input: Partial<AdminUserInput>, patch: Partial<AdminUserPatch>) => Promise<void>;
}

function UserFormDialog({ user, onClose, onSubmit }: UserFormDialogProps) {
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role ?? 'Receptionist');
  const [departmentName, setDepartmentName] = useState(user?.departmentName ?? '');
  const [specialty, setSpecialty] = useState(user?.specialty ?? '');
  const [room, setRoom] = useState(user?.room ?? '');
  const [opdHours, setOpdHours] = useState(user?.opdHours ?? '');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(user?.permissions ?? []);
  const [formError, setFormError] = useState<string | null>(null);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) => (prev.includes(permission) ? prev.filter((item) => item !== permission) : [...prev, permission]));
  };

  const submit = async () => {
    setFormError(null);
    if (!fullName.trim()) { setFormError('Full name is required.'); return; }
    if (!user && !username.trim()) { setFormError('Username is required.'); return; }
    if (!user && password.trim().length < 8) { setFormError('Password must be at least 8 characters.'); return; }
    await onSubmit(
      { fullName, username, password, role, departmentName, specialty, room, opdHours, permissions: selectedPermissions },
      { fullName, role, departmentName, specialty, room, opdHours, permissions: selectedPermissions },
    );
  };

  const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{user ? `Edit account — ${user.fullName}` : 'Create staff account'}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Full name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} className={`mt-1 ${field}`} />
          </label>
          {!user ? (
            <label className="text-sm font-medium text-slate-700">
              Username / email
              <input value={username} onChange={(event) => setUsername(event.target.value)} className={`mt-1 ${field}`} />
            </label>
          ) : (
            <div className="text-sm font-medium text-slate-700">
              Username / email
              <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">{user.username}</p>
            </div>
          )}
          {!user ? (
            <label className="text-sm font-medium text-slate-700">
              Initial password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={`mt-1 ${field}`} placeholder="Minimum 8 characters" />
            </label>
          ) : null}
          <label className="text-sm font-medium text-slate-700">
            Role
            <select value={role} onChange={(event) => setRole(event.target.value)} className={`mt-1 ${field}`}>
              {ROLES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Department
            <input value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} className={`mt-1 ${field}`} />
          </label>
          {role === 'Doctor' ? (
            <>
              <label className="text-sm font-medium text-slate-700">
                Specialty
                <input value={specialty} onChange={(event) => setSpecialty(event.target.value)} className={`mt-1 ${field}`} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Room
                <input value={room} onChange={(event) => setRoom(event.target.value)} className={`mt-1 ${field}`} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                OPD hours
                <input value={opdHours} onChange={(event) => setOpdHours(event.target.value)} className={`mt-1 ${field}`} placeholder="e.g. 09:00 – 17:00" />
              </label>
            </>
          ) : null}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700">Permissions</p>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap gap-2">
              {ALL_PERMISSIONS.map((permission) => (
                <label key={permission} className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${selectedPermissions.includes(permission) ? 'border-teal-600 bg-teal-700 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>
                  <input type="checkbox" className="sr-only" checked={selectedPermissions.includes(permission)} onChange={() => togglePermission(permission)} />
                  {permission}
                </label>
              ))}
            </div>
          </div>
        </div>

        {formError ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
          <button type="button" onClick={submit} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">{user ? 'Save changes' : 'Create account'}</button>
        </div>
      </div>
    </div>
  );
}

interface ResetPasswordDialogProps {
  user: AdminUser;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
}

function ResetPasswordDialog({ user, onClose, onSubmit }: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Reset password</h3>
        <p className="mt-2 text-sm text-slate-600">
          Set a new password for <span className="font-semibold">{user.fullName}</span> ({user.username}). All active sessions for this account will be revoked immediately.
        </p>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="New password (minimum 8 characters)"
          className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        {formError ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
          <button
            type="button"
            onClick={async () => {
              if (newPassword.trim().length < 8) { setFormError('Password must be at least 8 characters.'); return; }
              await onSubmit(newPassword);
            }}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Reset password
          </button>
        </div>
      </div>
    </div>
  );
}

