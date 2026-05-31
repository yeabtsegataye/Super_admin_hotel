import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchUserDetails, fetchPackages, blockUser, unblockUser,
  renewLicense, extendLicense, getLicenseInfo, removeLicense,
} from '../services/authService';
import type { UserDetails, LicenseInfo, PackageItem } from '../types';
import { ArrowLeft, Check, X, Shield, RefreshCw } from 'lucide-react';

export default function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [user,        setUser]        = useState<UserDetails | null>(null);
  const [licInfo,     setLicInfo]     = useState<LicenseInfo | null>(null);
  const [packages,    setPackages]    = useState<PackageItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [removingLic, setRemovingLic]  = useState(false);
  const [error,       setError]       = useState('');

  // ── Renewal modal ─────────────────────────────────────────────────────────
  const [showModal,    setShowModal]    = useState(false);
  const [renewType,    setRenewType]    = useState<'renew' | 'extend'>('renew');
  const [selectedPkg,  setSelectedPkg]  = useState<number | null>(null);
  const [duration,     setDuration]     = useState(1);
  const [unit,         setUnit]         = useState<'day' | 'month' | 'year'>('month');
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewError,   setRenewError]   = useState('');

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const [userRes, licRes, pkgRes] = await Promise.all([
        fetchUserDetails(Number(userId)),
        getLicenseInfo(Number(userId)),
        fetchPackages(),
      ]);
      setUser(userRes.data);
      setLicInfo(licRes.data);
      // Only show enabled packages
      setPackages((pkgRes.data || []).filter((p: PackageItem) => p.isEnabled !== false));
    } catch (e) {
      console.error('Failed to load user details:', e);
      setError('Failed to load user data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

  // ── Open renewal modal ────────────────────────────────────────────────────
  const openModal = (type: 'renew' | 'extend') => {
    setRenewType(type);
    setSelectedPkg(licInfo?.packageId ?? null);
    setDuration(1);
    setUnit('month');
    setRenewError('');
    setShowModal(true);
  };

  // ── Submit renewal ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user) return;
    setRenewLoading(true); setRenewError('');
    try {
      if (renewType === 'renew') {
        const res = await renewLicense(user.id, { duration, unit, packageId: selectedPkg ?? undefined });
        alert(`License renewed! New expiry: ${new Date(res.data.newExpiry).toLocaleDateString()}`);
      } else {
        const res = await extendLicense(user.id, { extendBy: duration, unit });
        alert(`License extended! New expiry: ${new Date(res.data.newExpiry).toLocaleDateString()}`);
      }
      setShowModal(false);
      await load();
    } catch (e: any) {
      setRenewError(e?.response?.data?.message || 'Failed to update license. Please try again.');
    } finally { setRenewLoading(false); }
  };

  // ── Block / Unblock ───────────────────────────────────────────────────────
  const handleBlockToggle = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      if (user.isBlocked) { await unblockUser(user.id); setUser({ ...user, isBlocked: false }); }
      else                { await blockUser(user.id);   setUser({ ...user, isBlocked: true  }); }
    } catch (e) {
      alert('Failed to change user block status.');
    } finally { setActionLoading(false); }
  };

  // ── Remove license ────────────────────────────────────────────────────────
  const handleRemoveLicense = async () => {
    if (!user || !confirm(`Remove license for ${user.email}?\n\nThis immediately revokes their access.`)) return;
    setRemovingLic(true);
    try {
      await removeLicense(user.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to remove license.');
    } finally { setRemovingLic(false); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const calcExpiry = () => {
    const d = new Date();
    if (renewType === 'extend' && user?.licenceExpiryDate) {
      const base = new Date(user.licenceExpiryDate);
      if (base > d) { // only extend if not already expired
        if (unit === 'day')   base.setDate(base.getDate() + duration);
        if (unit === 'month') base.setMonth(base.getMonth() + duration);
        if (unit === 'year')  base.setFullYear(base.getFullYear() + duration);
        return base.toLocaleDateString();
      }
    }
    if (unit === 'day')   d.setDate(d.getDate() + duration);
    if (unit === 'month') d.setMonth(d.getMonth() + duration);
    if (unit === 'year')  d.setFullYear(d.getFullYear() + duration);
    return d.toLocaleDateString();
  };

  const isExpired  = user?.licenceExpiryDate && new Date(user.licenceExpiryDate) < new Date();
  const daysLeft   = licInfo?.daysRemaining ?? 0;

  const licStatusCls =
    licInfo?.status === 'active' && daysLeft > 30 ? 'text-emerald-400' :
    licInfo?.status === 'active' && daysLeft <= 30 ? 'text-amber-400'  :
    'text-red-400';

  const licStatusLabel =
    !licInfo || licInfo.status === 'no_license' ? 'No License' :
    licInfo.status === 'expired'                ? 'Expired'    :
    daysLeft <= 7                               ? `${daysLeft}d remaining` :
    daysLeft <= 30                              ? `${daysLeft}d remaining` :
    'Active';

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
    </div>
  );

  if (!user) return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-10 text-center">
      <p className="text-slate-400">{error || 'User not found.'}</p>
      <button onClick={() => navigate('/licensing')} className="mt-4 rounded-xl bg-cyan-500 px-4 py-2 text-sm text-slate-950 font-semibold">
        Back to Licensing
      </button>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 p-6">
        <button onClick={() => navigate('/licensing')}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Licensing
        </button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{user.fullName}</h1>
            <p className="mt-0.5 text-sm text-slate-400">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openModal('renew')}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition">
              <RefreshCw className="h-4 w-4" /> Renew License
            </button>
            <button onClick={() => openModal('extend')}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-bold text-cyan-400 hover:bg-cyan-500/20 transition">
              + Extend
            </button>
            {licInfo?.hasLicense && (
              <button onClick={handleRemoveLicense} disabled={removingLic}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition">
                <X className="h-4 w-4" /> {removingLic ? '…' : 'Remove License'}
              </button>
            )}
            <button onClick={handleBlockToggle} disabled={actionLoading}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition border disabled:opacity-50 ${
                user.isBlocked
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
              }`}>
              {actionLoading ? '…' : user.isBlocked ? 'Unblock User' : 'Block User'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── User Info ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-4 text-base font-bold text-white flex items-center gap-2">
            <span className="h-5 w-5 text-slate-400">👤</span> User Information
          </h2>
          <dl className="space-y-3">
            {[
              ['User ID',  String(user.id)],
              ['Full Name', user.fullName],
              ['Email',     user.email],
              ['Phone',     user.phone || 'N/A'],
              ['Role',      user.role],
              ['Joined',    new Date(user.createdAt).toLocaleDateString()],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-800/60 pb-2">
                <dt className="text-sm text-slate-500">{k}</dt>
                <dd className="text-sm font-medium text-white capitalize">{v}</dd>
              </div>
            ))}
            <div className="flex justify-between pb-2">
              <dt className="text-sm text-slate-500">Account Status</dt>
              <dd>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  user.isBlocked ? 'bg-red-900/40 text-red-400' : 'bg-emerald-900/40 text-emerald-400'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${user.isBlocked ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  {user.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* ── License Info ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-4 text-base font-bold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" /> License Details
          </h2>

          {!licInfo || licInfo.status === 'no_license' ? (
            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-6 text-center">
              <p className="text-slate-500 text-sm mb-3">No license assigned.</p>
              <button onClick={() => openModal('renew')}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition">
                Assign License
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Package banner */}
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Current Package</span>
                  <span className={`text-xs font-bold ${licStatusCls}`}>{licStatusLabel}</span>
                </div>
                <p className="text-lg font-black text-white">{licInfo.packageName || '—'}</p>
              </div>

              <dl className="space-y-2.5">
                {[
                  ['Expiry Date',    licInfo.expiryDate ? new Date(licInfo.expiryDate).toLocaleString() : '—'],
                  ['Days Remaining', licInfo.status === 'expired'    ? 'Expired'
                                   : licInfo.status === 'no_license' ? '—'
                                   : `${licInfo.daysRemaining} days`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-slate-800/60 pb-2">
                    <dt className="text-sm text-slate-500">{k}</dt>
                    <dd className={`text-sm font-medium ${k === 'Days Remaining' && licInfo.status === 'expired' ? 'text-red-400' : 'text-white'}`}>{v}</dd>
                  </div>
                ))}
              </dl>

              {/* Modules */}
              {licInfo.packageId && (() => {
                const pkg = packages.find(p => p.id === licInfo.packageId);
                const mods = (pkg?.modules || []).filter(m => m?.trim());
                return mods.length > 0 ? (
                  <div>
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Included Modules</p>
                    <div className="flex flex-wrap gap-1.5">
                      {mods.map(m => (
                        <span key={m} className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-medium text-cyan-400">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* ── Hotels ── */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-4 text-base font-bold text-white">🏨 Hotels</h2>
          {user.hotels.length === 0 ? (
            <p className="text-sm text-slate-500">No hotels associated with this user.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {user.hotels.map(h => (
                <div key={h.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <h3 className="font-semibold text-white text-sm">{h.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{h.description || 'No description'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════ RENEWAL MODAL ════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-10">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">

            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-800 bg-slate-900 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {renewType === 'renew' ? 'Renew License' : 'Extend License'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{user.email}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* Operation type */}
              <div className="flex rounded-xl border border-slate-800 overflow-hidden">
                {(['renew', 'extend'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setRenewType(t)}
                    className={`flex-1 py-2.5 text-sm font-semibold transition ${
                      renewType === t ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950/40 text-slate-400 hover:text-slate-200'
                    }`}>
                    {t === 'renew' ? '↺ Renew from today' : '+ Extend current'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 -mt-2">
                {renewType === 'renew'
                  ? 'Starts a fresh license from today with the selected package.'
                  : 'Adds more time to the existing license without changing the package.'}
              </p>

              {/* Package selector — only show for renew */}
              {renewType === 'renew' && packages.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Select Package</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {packages.map(pkg => {
                      const mods = (pkg.modules || []).filter(m => m?.trim());
                      const isCurrent = licInfo?.packageId === pkg.id;
                      const isSelected = selectedPkg === pkg.id;
                      return (
                        <button key={pkg.id} type="button" onClick={() => setSelectedPkg(pkg.id)}
                          className={`w-full text-left rounded-xl border p-3 transition ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : 'border-slate-800 bg-slate-950/40 hover:border-slate-600'
                          }`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${isSelected ? 'border-cyan-500 bg-cyan-500' : 'border-slate-600'}`}>
                                {isSelected && <Check className="h-2.5 w-2.5 text-slate-950 stroke-[3]" />}
                              </div>
                              <span className="text-sm font-bold text-white">{pkg.name}</span>
                              {isCurrent && <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">Current</span>}
                              {pkg.isTrial && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">Trial</span>}
                            </div>
                            <span className="text-sm font-black text-cyan-400">
                              ETB {parseFloat(pkg.price).toLocaleString()}
                              <span className="text-xs text-slate-500 font-normal ml-1">/{pkg.durationValue}{pkg.durationUnit[0]}</span>
                            </span>
                          </div>
                          {mods.length > 0 && (
                            <div className="ml-6 flex flex-wrap gap-1 mt-1">
                              {mods.slice(0, 6).map(m => (
                                <span key={m} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{m}</span>
                              ))}
                              {mods.length > 6 && <span className="text-xs text-slate-600">+{mods.length - 6} more</span>}
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
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Duration</p>
                <div className="flex gap-2">
                  <input type="number" min={1} value={duration}
                    onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500" />
                  <select value={unit} onChange={e => setUnit(e.target.value as any)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500">
                    <option value="day">Day(s)</option>
                    <option value="month">Month(s)</option>
                    <option value="year">Year(s)</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-xs flex items-center justify-between">
                <span className="text-slate-500">New expiry date</span>
                <span className="font-bold text-cyan-400">{calcExpiry()}</span>
              </div>

              {renewError && <p className="text-xs text-red-400">{renewError}</p>}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={renewLoading || (renewType === 'renew' && !selectedPkg && packages.length > 0)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition">
                {renewLoading
                  ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> Processing…</>
                  : <><Check className="h-4 w-4" /> {renewType === 'renew' ? 'Renew License' : 'Extend License'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
