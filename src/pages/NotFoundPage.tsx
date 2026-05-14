import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/95 p-10 text-center shadow-xl shadow-slate-950/40">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/90">Page not found</p>
        <h1 className="mt-6 text-4xl font-semibold text-white">404</h1>
        <p className="mt-4 text-sm text-slate-400">The page you are looking for does not exist or has been moved.</p>
        <Link to="/dashboard" className="mt-8 inline-flex rounded-3xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
