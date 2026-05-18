import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLogoutMutation } from '../features/auth/authApiSlice.js';
import { logOut } from '../features/auth/authSlice.js';

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Manage Users', path: '/users' },
  { label: 'Manage Packages', path: '/packages' },
  { label: 'Payments', path: '/payments' },
  { label: 'Security', path: '/security' },
];

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const user = useSelector((state: any) => state.auth.user);

  const handleLogout = async () => {
    try {
      await logout(undefined).unwrap();
      dispatch(logOut(undefined));
      navigate('/login');
    } catch (error) {
      // Even if the API call fails, clear local state
      dispatch(logOut(undefined));
      navigate('/login');
    }
  };

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
            <div key={navItem.path}>
              <NavLink
                to={navItem.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `block rounded-3xl px-4 py-3 text-sm transition ${
                    isActive
                      ? 'bg-cyan-500/10 text-white border border-cyan-500/20'
                      : 'border border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
              >
                {navItem.label}
              </NavLink>

              {navItem.path === '/users' && (
                <div className="ml-4 mt-2 space-y-2">
                  <NavLink
                    to="/users/expired"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `block rounded-xl px-3 py-2 text-sm transition ${
                        isActive
                          ? 'bg-cyan-500/10 text-white border border-cyan-500/20'
                          : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                  >
                    Expired Licenses
                  </NavLink>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Signed in as:</p>
          <p className="truncate text-base font-semibold text-white">
            {user?.email || user?.payload?.email || 'Admin'}
          </p>
          <button
            onClick={handleLogout}
            className="w-full rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}