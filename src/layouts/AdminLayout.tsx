import { HospitalLogo } from '../components/common/HospitalLogo';
import { Menu, Search, Users, UserCircle2, LogOut, LayoutDashboard, CalendarDays, Wallet, Megaphone, ScrollText } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { permissions } from '../lib/permissions';
import { clearCurrentSession, getCurrentSession } from '../auth.service';

const navigation = [
  { label: 'Admin Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, permission: permissions.adminOverview },
  { label: 'User Management', to: '/admin/users', icon: Users, permission: permissions.adminUsersView },
  { label: 'Patients', to: '/admin/patients', icon: Search, permission: permissions.adminPatientsManage },
  { label: 'Appointments', to: '/admin/appointments', icon: CalendarDays, permission: permissions.adminAppointmentsManage },
  { label: 'Payments', to: '/admin/payments', icon: Wallet, permission: permissions.adminPaymentsManage },
  { label: 'Broadcast Center', to: '/admin/notifications', icon: Megaphone, permission: permissions.adminBroadcast },
  { label: 'Activity Log', to: '/admin/activity', icon: ScrollText, permission: permissions.adminOverview },
  { label: 'My Profile', to: '/admin/profile', icon: UserCircle2, permission: permissions.adminOverview },
];

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userName = getCurrentSession()?.user.fullName ?? 'Administrator';

  const logout = () => {
    clearCurrentSession();
    navigate('/login', { replace: true });
  };

  const pageTitle = location.pathname.replace('/admin/', '').replace(/\//g, ' ').replace(/(^|\s)(\w)/g, (m) => m.toUpperCase()) || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">
        <aside className={`hidden border-r border-slate-200 bg-slate-950 text-slate-100 lg:flex ${collapsed ? 'w-24' : 'w-72'} flex-col transition-all`}>
          <div className="border-b border-slate-800">
            <div className={collapsed ? 'flex flex-col items-center gap-4 px-4 py-4' : 'flex items-center justify-between gap-3 px-4 py-4'}>
              <div className="flex items-center gap-3">
                <HospitalLogo />
                {!collapsed ? (
                  <div>
                    <p className="text-sm font-semibold">Mastan Hospital</p>
                    <p className="text-xs text-slate-400">Administration</p>
                  </div>
                ) : null}
              </div>
              <button type="button" onClick={() => setCollapsed((prev) => !prev)} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800">
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {!collapsed ? (
            <div className="px-4 py-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-sm font-semibold text-white">{userName}</p>
                <p className="text-xs text-slate-400">Hospital Administration</p>
              </div>
            </div>
          ) : null}

          <nav className="flex-1 space-y-1 px-1 pb-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} end to={item.to} className={({ isActive }) => {
                  const base = `flex items-center ${collapsed ? 'justify-center' : 'gap-3'} rounded-xl ${collapsed ? 'px-2' : 'px-3'} py-3 text-sm font-medium transition`;
                  const state = isActive ? 'bg-teal-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white';
                  return `${base} ${state}`;
                }}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {!collapsed ? item.label : null}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        {/* __PART2__ */}

        <div className="flex-1">
          <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden">
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
                <HospitalLogo className="h-12 w-12" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Mastan Admin</p>
                  <h1 className="text-xl font-semibold text-slate-900">{pageTitle}</h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                  <UserCircle2 className="h-5 w-5 text-teal-700" aria-hidden="true" />
                  {userName}
                </div>
                <button type="button" onClick={logout} className="flex items-center gap-2 rounded-full border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50" aria-label="Log out">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="h-full w-72 max-w-[85vw] bg-slate-950 p-4 text-slate-100" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HospitalLogo />
                <div>
                  <p className="text-sm font-semibold">Mastan Hospital</p>
                  <p className="text-xs text-slate-400">Administration</p>
                </div>
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800">
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} end to={item.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-teal-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            <button type="button" onClick={logout} className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-950 hover:text-red-200">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
