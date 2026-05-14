import { useEffect, useMemo, useState } from 'react';
import { fetchAudit } from '../services/authService';
import type { AuditEntry } from '../types';

const pageSize = 8;
const categories = [
  { label: 'Registered accounts', value: 'register' },
  { label: 'Wrong password attempts', value: 'wrong_password' },
];

export default function SecurityPage() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('register');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadAudit = async () => {
      try {
        const response = await fetchAudit();
        setAuditLog(response.data);
      } finally {
        setLoading(false);
      }
    };

    loadAudit();
  }, []);

  const filteredAudit = useMemo(
    () => auditLog.filter((entry) => entry.action === selectedCategory),
    [auditLog, selectedCategory],
  );

  const totalPages = Math.max(1, Math.ceil(filteredAudit.length / pageSize));

  const pagedAudit = useMemo(
    () => filteredAudit.slice((page - 1) * pageSize, page * pageSize),
    [filteredAudit, page],
  );

  const selectCategory = (value: string) => {
    setSelectedCategory(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Security Audit</h1>
        <p className="mt-2 text-sm text-slate-400">View only account registration and wrong password attempts.</p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Audit categories</h2>
            <p className="mt-2 text-sm text-slate-400">The audit view is limited to the categories you requested.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => selectCategory(category.value)}
                className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                  selectedCategory === category.value
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">Loading security audit data…</div>
      ) : (
        <div className="space-y-4">
          {pagedAudit.length ? (
            pagedAudit.map((entry) => (
              <div key={entry.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{entry.action}</p>
                    <p className="text-sm text-slate-400">{entry.details ?? 'No additional details'}</p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-400">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
                  <span>Actor: {entry.actor || 'system'}</span>
                  <span>Target: {entry.target || 'global'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-400">No records found for this category.</div>
          )}

          <div className="flex flex-col items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400 sm:flex-row">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-3xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded-3xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
