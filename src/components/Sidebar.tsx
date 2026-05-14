import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Manage Users', path: '/users' },
  { label: 'Manage Packages', path: '/packages' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Payments', path: '/payments' },
  { label: 'Security', path: '/security' },
];

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const auth = useAuth();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/70 transition-opacity lg:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex min-h-screen w-72 flex-col gap-6 rounded-r-3xl border border-slate-800 bg-slate-900/95 p-6 text-slate-200 shadow-xl shadow-slate-950/20 transition-transform lg:static lg:translate-x-0 lg:min-h-auto lg:w-72 lg:rounded-none lg:border-0 lg:border-r lg:border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/90">Super Admin</p>
            <h2 className="text-2xl font-semibold text-white">Hotel ERP</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-3xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
          >
            Close
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/90">Super Admin</p>
          <h2 className="text-2xl font-semibold text-white">Hotel ERP</h2>
          <p className="text-sm text-slate-400">Control center for system-wide management.</p>
        </div>

        <nav className="mt-6 space-y-2">
          {navItems.map((navItem) => (
            <NavLink
              key={navItem.path}
              to={navItem.path}
              onClick={onClose}
              className={({ isActive }) =>
                `block rounded-3xl px-4 py-3 text-sm transition ${
                  isActive
                    ? 'bg-cyan-500/10 text-white border border-cyan-500/20'
                    : 'border border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`
              }
            >
              {navItem.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Signed in as:</p>
          <p className="truncate text-base font-semibold text-white">{auth.user?.email ?? 'Admin'}</p>
          <button
            onClick={auth.logout}
            className="w-full rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
