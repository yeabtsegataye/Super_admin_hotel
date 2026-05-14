import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex w-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 p-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
          >
            Menu
          </button>
          <span className="text-sm font-semibold text-white">Hotel ERP Admin</span>
        </div>

        <main className="flex-1 space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
