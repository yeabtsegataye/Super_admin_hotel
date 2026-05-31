import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchUsers, getBatchLicenseInfo, fetchPackages,
  renewLicense, extendLicense, bulkRenewLicenses, removeLicense,
} from '../services/authService';
import type { LicenseInfo, PackageItem } from '../types';
import { Search, RefreshCw, X, Check } from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'expiring' | 'expired' | 'no_license';

const PAGE_SIZE = 15;

function statusConfig(l: LicenseInfo) {
  if (l.status === 'no_license')                         return { label: 'No License',  cls: 'bg-slate-800 text-slate-400',     dot: 'bg-slate-500'   };
  if (l.status === 'expired')                            return { label: 'Expired',      cls: 'bg-red-900/40 text-red-400',      dot: 'bg-red-500'     };
  if (l.daysRemaining <= 7)                              return { label: `${l.daysRemaining}d left`, cls: 'bg-red-900/30 text-red-300',   dot: 'bg-red-400'     };
  if (l.daysRemaining <= 30)                             return { label: `${l.daysRemaining}d left`, cls: 'bg-amber-900/40 text-amber-400', dot: 'bg-amber-400'  };
  return                                                        { label: 'Active',       cls: 'bg-emerald-900/40 text-emerald-400', dot: 'bg-emerald-400' };
}

export default function LicensingPage() {
  const navigate = useNavigate();

  const [licenses,   setLicenses]   = useState<LicenseInfo[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<StatusFilter>('all');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [selected,   setSelected]   = useState<number[]>([]);
  const [removingId, setRemovingId] = useState<number | null>(null);

  // ── Renew modal ───────────────────────────────────────────────────────────
  const [packages,    setPackages]    = useState<PackageItem[]>([]);
  const [renewTarget, setRenewTarget] = useState<LicenseInfo | null>(null);
  const [renewType,   setRenewType]   = useState<'renew' | 'extend'>('renew');
  const [renewData,   setRenewData]   = useState({ duration: 1, unit: 'month' as 'day' | 'month' | 'year' });
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewError,   setRenewError]   = useState('');

  // ── Bulk modal ────────────────────────────────────────────────────────────
  const [showBulk,    setShowBulk]    = useState(false);
  const [bulkData,    setBulkData]    = useState({ duration: 1, unit: 'month' as 'day' | 'month' | 'year' });
  const [bulkLoading, setBulkLoading] = useState(false);

  // ── Load data ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, pkgRes] = await Promise.all([fetchUsers(), fetchPackages()]);
      const users: any[] = usersRes.data || [];
      setPackages((pkgRes.data || []).filter((p: PackageItem) => p.isEnabled !== false));
      if (!users.length) { setLicenses([]); return; }
      const ids = users.map((u: any) => Number(u.id));
      const licRes = await getBatchLicenseInfo(ids);
      setLicenses(licRes.data || []);
    } catch (e) {
      console.error('Licensing page load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     licenses.length,
    active:    licenses.filter(l => l.status === 'active' && l.daysRemaining > 30).length,
    expiring:  licenses.filter(l => l.status === 'active' && l.daysRemaining <= 30).length,
    expired:   licenses.filter(l => l.status === 'expired').length,
    noLicense: licenses.filter(l => l.status === 'no_license').length,
  }), [licenses]);

  const filtered = useMemo(() => {
    let r = [...licenses];
    if (filter === 'active')     r = r.filter(l => l.status === 'active' && l.daysRemaining > 30);
    else if (filter === 'expiring')  r = r.filter(l => l.status === 'active' && l.daysRemaining <= 30);
    else if (filter === 'expired')   r = r.filter(l => l.status === 'expired');
    else if (filter === 'no_license')r = r.filter(l => l.status === 'no_license');
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(l =>
        l.userEmail?.toLowerCase().includes(q) ||
        l.userName?.toLowerCase().includes(q) ||
        l.packageName?.toLowerCase().includes(q) ||
        l.hotels?.some(h => h.toLowerCase().includes(q))
      );
    }
    return r;
  }, [licenses, filter, search]);

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleRenew = async () => {
    if (!renewTarget) return;
    setRenewLoading(true); setRenewError('');
    try {
      if (renewType === 'renew') {
        await renewLicense(renewTarget.userId, { ...renewData, packageId: selectedPkg ?? undefined });
      } else {
        await extendLicense(renewTarget.userId, { extendBy: renewData.duration, unit: renewData.unit });
      }
      setRenewTarget(null);
      await load();
    } catch (e: any) {
      setRenewError(e?.response?.data?.message || 'Failed. Please try again.');
    } finally { setRenewLoading(false); }
  };

  const handleBulkRenew = async () => {
    setBulkLoading(true);
    try {
      const res = await bulkRenewLicenses(selected, bulkData.duration, bulkData.unit);
      alert(`Renewed ${res.data?.success ?? selected.length} license(s) successfully.`);
      setSelected([]); setShowBulk(false);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Bulk renew failed.');
    } finally { setBulkLoading(false); }
  };

  const handleRemove = async (l: LicenseInfo) => {
    if (!confirm(`Remove license for ${l.userEmail}?\n\nThis will immediately revoke their dashboard access.`)) return;
    setRemovingId(l.userId);
    try {
      await removeLicense(l.userId);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to remove license.');
    } finally { setRemovingId(null); }
  };

  const toggleSelect = (id: number) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? currentItems.map(l => l.userId) : []);

  const allChecked = currentItems.length > 0 && currentItems.every(l => selected.includes(l.userId));

  // Estimated new expiry preview
  const newExpiry = () => {
    const d = new Date();
    if (renewData.unit === 'day')   d.setDate(d.getDate() + renewData.duration);
    if (renewData.unit === 'month') d.setMonth(d.getMonth() + renewData.duration);
    if (renewData.unit === 'year')  d.setFullYear(d.getFullYear() + renewData.duration);
    return d.toLocaleDateString();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">License Management</h1>
            <p className="mt-1 text-sm text-slate-400">View, renew, extend, or revoke client licenses.</p>
          </div>
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50 transition">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {([
          { key: 'all',        label: 'All Clients',    value: stats.total,     color: 'border-slate-700 text-slate-200' },
          { key: 'active',     label: 'Active',         value: stats.active,    color: 'border-emerald-700/50 text-emerald-400' },
          { key: 'expiring',   label: 'Expiring Soon',  value: stats.expiring,  color: 'border-amber-700/50 text-amber-400' },
          { key: 'expired',    label: 'Expired',        value: stats.expired,   color: 'border-red-700/50 text-red-400' },
          { key: 'no_license', label: 'No License',     value: stats.noLicense, color: 'border-slate-700 text-slate-500' },
        ] as { key: StatusFilter; label: string; value: number; color: string }[]).map(s => (
          <button key={s.key} onClick={() => { setFilter(s.key); setPage(1); }}
            className={`rounded-xl border p-4 text-left transition hover:bg-slate-900/60 ${filter === s.key ? 'bg-slate-900/80 ' + s.color : 'border-slate-800 bg-slate-900/40'}`}>
            <p className={`text-2xl font-black ${filter === s.key ? s.color.split(' ')[1] : 'text-white'}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search email, name, package, hotel…"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-cyan-500" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>}
        </div>
        {selected.length > 0 && (
          <button onClick={() => setShowBulk(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition">
            Bulk Renew ({selected.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="text-sm">Loading license data…</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p className="text-sm">No records found for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/60">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" checked={allChecked} onChange={e => toggleAll(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 accent-cyan-500" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Hotel(s)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Package</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentItems.map(l => {
                  const cfg = statusConfig(l);
                  const isRemoving = removingId === l.userId;
                  return (
                    <tr key={l.userId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.includes(l.userId)} onChange={() => toggleSelect(l.userId)}
                          className="rounded border-slate-700 bg-slate-800 accent-cyan-500" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white truncate max-w-[180px]">{l.userName || '—'}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[180px]">{l.userEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-[140px]">
                        <div className="truncate text-xs">{l.hotels?.join(', ') || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        {l.packageName
                          ? <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">{l.packageName}</span>
                          : <span className="text-xs text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {l.expiryDate ? new Date(l.expiryDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setRenewTarget(l); setRenewType('renew'); setRenewData({ duration: 1, unit: 'month' }); setSelectedPkg(l.packageId ?? null); setRenewError(''); }}
                            className="rounded-lg bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition">
                            Renew
                          </button>
                          <button onClick={() => navigate(`/users/${l.userId}`)}
                            className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition">
                            Details
                          </button>
                          {l.hasLicense && (
                            <button onClick={() => handleRemove(l)} disabled={isRemoving}
                              className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition">
                              {isRemoving ? '…' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-40">← Prev</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const n = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <button key={n} onClick={() => setPage(n)}
                className={`rounded-xl px-3 py-2 text-sm transition ${page === n ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
                {n}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-40">Next →</button>
        </div>
      )}

      {/* ── Renew / Extend Modal ── */}
      {renewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-white">License Renewal</h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[300px]">{renewTarget.userEmail}</p>
              </div>
              <button onClick={() => setRenewTarget(null)} className="text-slate-500 hover:text-white transition"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Current info */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Package</span><span className="text-slate-200 font-medium">{renewTarget.packageName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Current expiry</span><span className="text-slate-200">{renewTarget.expiryDate ? new Date(renewTarget.expiryDate).toLocaleDateString() : '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`font-semibold ${statusConfig(renewTarget).cls.split(' ')[1]}`}>{statusConfig(renewTarget).label}</span></div>
              </div>

              {/* Type toggle */}
              <div className="flex rounded-xl border border-slate-800 overflow-hidden">
                {(['renew', 'extend'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setRenewType(t)}
                    className={`flex-1 py-2.5 text-sm font-semibold capitalize transition ${renewType === t ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950/40 text-slate-400 hover:text-slate-200'}`}>
                    {t === 'renew' ? 'Renew (from today)' : 'Extend (add time)'}
                  </button>
                ))}
              </div>

              {/* Package selector — only for renew */}
              {renewType === 'renew' && packages.length > 0 && (
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-400 uppercase tracking-wide">Select Package</label>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {packages.map(pkg => {
                      const mods = (pkg.modules || []).filter((m: string) => m?.trim());
                      const isCurrent = renewTarget?.packageId === pkg.id;
                      const isSelected = selectedPkg === pkg.id;
                      return (
                        <button key={pkg.id} type="button" onClick={() => setSelectedPkg(pkg.id)}
                          className={`w-full text-left rounded-xl border p-3 transition ${isSelected ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-slate-600'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-cyan-500 bg-cyan-500' : 'border-slate-600'}`}>
                                {isSelected && <Check className="h-2.5 w-2.5 text-slate-950 stroke-[3]" />}
                              </div>
                              <span className="text-sm font-bold text-white">{pkg.name}</span>
                              {isCurrent && <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400">Current</span>}
                            </div>
                            <span className="text-xs font-bold text-cyan-400">ETB {parseFloat(pkg.price).toLocaleString()}</span>
                          </div>
                          {mods.length > 0 && (
                            <div className="ml-6 mt-1.5 flex flex-wrap gap-1">
                              {mods.slice(0, 5).map((m: string) => (
                                <span key={m} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{m}</span>
                              ))}
                              {mods.length > 5 && <span className="text-xs text-slate-600">+{mods.length - 5}</span>}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">Duration</label>
                <div className="flex gap-2">
                  <input type="number" min={1} value={renewData.duration}
                    onChange={e => setRenewData(d => ({ ...d, duration: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500" />
                  <select value={renewData.unit} onChange={e => setRenewData(d => ({ ...d, unit: e.target.value as any }))}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500">
                    <option value="day">Day(s)</option>
                    <option value="month">Month(s)</option>
                    <option value="year">Year(s)</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/20 px-4 py-2.5 text-xs">
                <span className="text-slate-500">New expiry: </span>
                <span className="text-cyan-400 font-bold">{newExpiry()}</span>
              </div>

              {renewError && <p className="text-xs text-red-400">{renewError}</p>}
            </div>
            <div className="flex gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={() => setRenewTarget(null)} className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition">Cancel</button>
              <button onClick={handleRenew} disabled={renewLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition">
                {renewLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> : <Check className="h-4 w-4" />}
                {renewLoading ? 'Processing…' : renewType === 'renew' ? 'Renew License' : 'Extend License'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Renew Modal ── */}
      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Bulk Renew — {selected.length} users</h2>
              <button onClick={() => setShowBulk(false)} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wide">Duration</label>
                <div className="flex gap-2">
                  <input type="number" min={1} value={bulkData.duration}
                    onChange={e => setBulkData(d => ({ ...d, duration: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500" />
                  <select value={bulkData.unit} onChange={e => setBulkData(d => ({ ...d, unit: e.target.value as any }))}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500">
                    <option value="day">Day(s)</option>
                    <option value="month">Month(s)</option>
                    <option value="year">Year(s)</option>
                  </select>
                </div>
              </div>
              <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/20 px-4 py-2.5 text-xs">
                <span className="text-slate-500">All selected will expire on: </span>
                <span className="text-cyan-400 font-bold">
                  {(() => {
                    const d = new Date();
                    if (bulkData.unit === 'day')   d.setDate(d.getDate() + bulkData.duration);
                    if (bulkData.unit === 'month') d.setMonth(d.getMonth() + bulkData.duration);
                    if (bulkData.unit === 'year')  d.setFullYear(d.getFullYear() + bulkData.duration);
                    return d.toLocaleDateString();
                  })()}
                </span>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={() => setShowBulk(false)} className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition">Cancel</button>
              <button onClick={handleBulkRenew} disabled={bulkLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition">
                {bulkLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> : null}
                {bulkLoading ? 'Processing…' : `Renew ${selected.length} Licenses`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
