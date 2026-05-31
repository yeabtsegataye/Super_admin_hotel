import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

interface Referral {
  id: number;
  code: string;
  name: string;
  rewardDays: number;
  commissionPercent: number;
  totalCommissionEarned: number;
  usageCount: number;
  isActive: boolean;
  createdByUserId: number | null;
  createdAt: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${copied ? 'bg-emerald-900/40 border-emerald-700/40 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'}`}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

const emptyForm = { name: '', rewardDays: 30, commissionPercent: 0 };

export default function ReferralsPage() {
  const [items,   setItems]   = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [editId,  setEditId]  = useState<number | null>(null);
  const [flash,   setFlash]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState<{
    name: string; rewardDays: number; commissionPercent: number; isActive: boolean;
  } | null>(null);

  const showFlash = (msg: string, ok = true) => {
    setFlash({ msg, ok });
    setTimeout(() => setFlash(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/super/referrals');
      setItems(Array.isArray(data) ? data : []);
    } catch { showFlash('Failed to load referrals', false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showFlash('Name is required', false); return; }
    setSaving(true);
    try {
      await api.post('/super/referrals', {
        name: form.name.trim(),
        rewardDays: Number(form.rewardDays),
        commissionPercent: Number(form.commissionPercent),
      });
      showFlash('Referral code created!');
      setForm(emptyForm);
      load();
    } catch (e: any) { showFlash(e?.response?.data?.message || 'Failed to create', false); }
    finally { setSaving(false); }
  };

  const handleSaveEdit = async (id: number) => {
    if (!editForm) return;
    setSaving(true);
    try {
      await api.put(`/super/referrals/${id}`, {
        name: editForm.name.trim(),
        rewardDays: Number(editForm.rewardDays),
        commissionPercent: Number(editForm.commissionPercent),
        isActive: editForm.isActive,
      });
      showFlash('Updated');
      setEditId(null);
      load();
    } catch { showFlash('Failed to update', false); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: number, current: boolean) => {
    try {
      await api.put(`/super/referrals/${id}`, { isActive: !current });
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !current } : r)));
    } catch { showFlash('Failed to update', false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this referral code?')) return;
    try {
      await api.delete(`/super/referrals/${id}`);
      setItems((prev) => prev.filter((r) => r.id !== id));
      showFlash('Deleted');
    } catch { showFlash('Failed to delete', false); }
  };

  const startEdit = (r: Referral) => {
    setEditId(r.id);
    setEditForm({ name: r.name, rewardDays: r.rewardDays, commissionPercent: r.commissionPercent, isActive: r.isActive });
  };

  // Summary stats
  const totalCommission = items.reduce((s, r) => s + Number(r.totalCommissionEarned), 0);
  const totalUsage      = items.reduce((s, r) => s + r.usageCount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Referral Codes & Commissions</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create referral codes for your sales team. When a referred hotel makes their first payment,
          the referee gets bonus license days <em>and</em> you can track commission owed to your sales person.
        </p>
      </div>

      {/* Flash */}
      {flash && (
        <div className={`rounded-2xl px-4 py-3 text-sm border ${flash.ok ? 'bg-emerald-900/40 border-emerald-700/40 text-emerald-300' : 'bg-red-900/40 border-red-700/40 text-red-300'}`}>
          {flash.msg}
        </div>
      )}

      {/* Summary stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Codes',        value: items.length,              suffix: '',    color: 'cyan'    },
            { label: 'Total Referrals',    value: totalUsage,                suffix: '',    color: 'purple'  },
            { label: 'Total Commission',   value: totalCommission.toFixed(2), suffix: ' ETB', color: 'amber'  },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold text-${s.color}-400`}>{s.value}{s.suffix}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Create form ── */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="mb-1 text-base font-semibold text-white">Generate New Referral Code</h2>
        <p className="text-xs text-slate-500 mb-4">
          Set a <strong>commission %</strong> if this code is for a sales person you pay by commission.
          Set it to <strong>0</strong> for hotel-to-hotel referral campaigns.
        </p>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          {/* Name */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-slate-400 block mb-1">Sales person / Campaign name <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="e.g. John Smith — Sales Rep"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200
                placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Reward days */}
          <div className="w-32">
            <label className="text-xs text-slate-400 block mb-1">Bonus days (referee)</label>
            <input
              type="number" min={0} max={365}
              value={form.rewardDays}
              onChange={(e) => setForm((f) => ({ ...f, rewardDays: Number(e.target.value) }))}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200
                px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Commission % */}
          <div className="w-36">
            <label className="text-xs text-slate-400 block mb-1">Commission % (your decision)</label>
            <div className="relative">
              <input
                type="number" min={0} max={100} step={0.5}
                value={form.commissionPercent}
                onChange={(e) => setForm((f) => ({ ...f, commissionPercent: Number(e.target.value) }))}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200
                  px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
            </div>
          </div>

          <button
            type="submit" disabled={saving}
            className="rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold
              px-6 py-2.5 transition disabled:opacity-50 whitespace-nowrap"
          >
            {saving ? 'Creating…' : '+ Generate Code'}
          </button>
        </form>
      </div>

      {/* ── List ── */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="mb-4 text-base font-semibold text-white">
          All Referral Codes
          <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-800 rounded-full px-2 py-0.5">{items.length}</span>
        </h2>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-slate-500 text-sm">No referral codes yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                {editId === r.id && editForm ? (
                  /* ── inline edit ── */
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-xs text-slate-500 block mb-1">Name</label>
                        <input value={editForm.name}
                          onChange={(e) => setEditForm((f) => f && ({ ...f, name: e.target.value }))}
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500" />
                      </div>
                      <div className="w-28">
                        <label className="text-xs text-slate-500 block mb-1">Bonus days</label>
                        <input type="number" min={0} value={editForm.rewardDays}
                          onChange={(e) => setEditForm((f) => f && ({ ...f, rewardDays: Number(e.target.value) }))}
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500" />
                      </div>
                      <div className="w-32">
                        <label className="text-xs text-slate-500 block mb-1">Commission %</label>
                        <input type="number" min={0} max={100} step={0.5} value={editForm.commissionPercent}
                          onChange={(e) => setEditForm((f) => f && ({ ...f, commissionPercent: Number(e.target.value) }))}
                          className="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500" />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer pb-1">
                        <input type="checkbox" checked={editForm.isActive}
                          onChange={(e) => setEditForm((f) => f && ({ ...f, isActive: e.target.checked }))}
                          className="rounded" />
                        Active
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(r.id)} disabled={saving}
                        className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-1.5 transition disabled:opacity-50">
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs px-4 py-1.5 hover:bg-slate-700 transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── normal row ── */
                  <div className="flex flex-wrap items-center gap-4">
                    {/* name + code */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{r.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono text-sm font-bold text-cyan-400 tracking-widest">{r.code}</span>
                        <CopyBtn text={r.code} />
                        <span className="text-xs text-slate-600">{r.createdByUserId ? 'Client-generated' : 'Admin-generated'}</span>
                      </div>
                    </div>

                    {/* stats */}
                    <div className="flex gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-500">Bonus days</p>
                        <p className="text-sm font-bold text-purple-400">{r.rewardDays}d</p>
                      </div>

                      {/* Commission section — highlighted when > 0 */}
                      <div className={`rounded-xl px-3 py-1 ${Number(r.commissionPercent) > 0 ? 'bg-amber-900/30 border border-amber-700/30' : ''}`}>
                        <p className="text-xs text-slate-500">Commission</p>
                        <p className={`text-sm font-bold ${Number(r.commissionPercent) > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                          {Number(r.commissionPercent) > 0 ? `${r.commissionPercent}%` : '—'}
                        </p>
                      </div>

                      <div className={`rounded-xl px-3 py-1 ${Number(r.totalCommissionEarned) > 0 ? 'bg-amber-900/20 border border-amber-700/20' : ''}`}>
                        <p className="text-xs text-slate-500">Total earned</p>
                        <p className={`text-sm font-bold ${Number(r.totalCommissionEarned) > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                          {Number(r.totalCommissionEarned) > 0
                            ? `${Number(r.totalCommissionEarned).toFixed(2)} ETB`
                            : '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Referrals</p>
                        <p className="text-sm font-bold text-slate-200">{r.usageCount}</p>
                      </div>
                    </div>

                    {/* status toggle */}
                    <button onClick={() => toggleActive(r.id, r.isActive)}
                      className={`rounded-xl px-3 py-1 text-xs font-semibold border transition ${
                        r.isActive
                          ? 'bg-emerald-900/40 border-emerald-700/40 text-emerald-400 hover:bg-red-900/30 hover:border-red-700/40 hover:text-red-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-emerald-900/40 hover:border-emerald-700/40 hover:text-emerald-400'
                      }`}>
                      {r.isActive ? 'Active' : 'Disabled'}
                    </button>

                    {/* edit / delete */}
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(r)}
                        className="rounded-xl px-3 py-1 text-xs font-semibold border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(r.id)}
                        className="rounded-xl px-3 py-1 text-xs font-semibold border border-red-800/40 bg-red-900/20 text-red-400 hover:bg-red-900/40 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 text-xs text-slate-500 space-y-1.5">
        <p className="font-semibold text-slate-400 mb-2">How referrals & commissions work</p>
        <p>1. <strong>Create a code</strong> — set a name (sales person's name), bonus days for the referee, and your commission % decision.</p>
        <p>2. The sales person shares the code. A new hotel owner enters it at signup.</p>
        <p>3. When the hotel makes their <strong>first Chapa payment</strong>, two things happen automatically:</p>
        <p className="pl-4">• The hotel's license is extended by the bonus days.</p>
        <p className="pl-4">• The commission (<code>payment × commission%</code>) is added to <strong>Total earned</strong>.</p>
        <p>4. You pay the sales person manually based on the <strong>Total earned</strong> figure shown here.</p>
        <p>5. Disable a code at any time — future sign-ups won't receive rewards or trigger commission.</p>
        <p className="text-slate-600 mt-2">Hotel owners can also generate their own codes (0% commission, 30 bonus days) from their Settings page.</p>
      </div>
    </div>
  );
}
