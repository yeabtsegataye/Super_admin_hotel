import { useEffect, useMemo, useRef, useState } from 'react';
import { createPackage, deletePackage, fetchPackages, updatePackage } from '../services/authService';
import type { PackageItem } from '../types';
import {
  Pencil, Trash2, Plus, Search, X, Check, Clock, Tag, Star,
  Package, Power, Users, Shield, ChevronDown, ChevronUp, Layers,
} from 'lucide-react';

const pageSize = 10;

const ALL_MODULES = [
  { key: 'dashboard',    label: 'Dashboard & Analytics', group: 'Reports'  },
  { key: 'bills',        label: 'Bills Management',       group: 'Reports'  },
  { key: 'employees',    label: 'Employee Management',    group: 'Reports'  },
  { key: 'orders',       label: 'Orders',                 group: 'Menu'     },
  { key: 'food',         label: 'Food Management',        group: 'Menu'     },
  { key: 'categories',   label: 'Food Categories',        group: 'Menu'     },
  { key: 'ingredients',  label: 'Ingredients',            group: 'Menu'     },
  { key: 'place-order',  label: 'Place Order (Staff)',    group: 'Menu'     },
  { key: 'feedback',     label: 'Feedback & Reviews',     group: 'Menu'     },
  { key: 'rooms',        label: 'Room Management',        group: 'Rooms'    },
  { key: 'reservations', label: 'Reservations',           group: 'Rooms'    },
  { key: 'room-types',   label: 'Room Types',             group: 'Rooms'    },
  { key: 'settings',     label: 'Settings & QR',          group: 'General'  },
];

const PRESETS = [
  { label: 'Menu Only',      color: '#06b6d4', modules: ['orders','food','categories','ingredients','place-order','feedback','settings'] },
  { label: 'Menu + Reports', color: '#8b5cf6', modules: ['orders','food','categories','ingredients','place-order','feedback','settings','dashboard','bills'] },
  { label: 'Rooming Only',   color: '#10b981', modules: ['rooms','reservations','room-types','settings'] },
  { label: 'All-Inclusive',  color: '#f59e0b', modules: ALL_MODULES.map(m => m.key) },
];

const EMPTY_FORM = {
  name: '', price: '', description: '',
  durationValue: '1', durationUnit: 'month' as 'day' | 'month' | 'year',
  features: '', modules: [] as string[], isTrial: false, isEnabled: true,
};

const GROUP_COLORS: Record<string, string> = {
  Reports: 'text-purple-400', Menu: 'text-cyan-400',
  Rooms: 'text-emerald-400',  General: 'text-amber-400',
};

export default function ManagePackagesPage() {
  const [packages,   setPackages]   = useState<PackageItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search,     setSearch]     = useState('');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // modal state: null = closed, 'create' = new, PackageItem = edit
  const [modal, setModal] = useState<null | 'create' | PackageItem>(null);
  const [form,  setForm]  = useState({ ...EMPTY_FORM });
  const [error, setError] = useState('');

  // ── Load packages ──────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchPackages();
      setPackages(res.data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setVisibleCount(pageSize); }, [search]);

  const filtered = useMemo(
    () => packages.filter(p =>
      [p.name, p.description, p.price, ...(p.features || [])].join(' ')
        .toLowerCase().includes(search.trim().toLowerCase())
    ), [packages, search]
  );
  const displayed = filtered.slice(0, visibleCount);

  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visibleCount < filtered.length)
        setVisibleCount(n => Math.min(n + pageSize, filtered.length));
    }, { rootMargin: '200px' });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [visibleCount, filtered.length]);

  // ── Open modals ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setError('');
    setModal('create');
  };

  const openEdit = (pack: PackageItem) => {
    setForm({
      name: pack.name,
      price: pack.price,
      description: pack.description,
      durationValue: String(pack.durationValue || 1),
      durationUnit: pack.durationUnit,
      features: (pack.features || []).join(', '),
      modules: (pack.modules || []).filter(m => m?.trim()),
      isTrial: pack.isTrial || false,
      isEnabled: pack.isEnabled ?? true,
    });
    setError('');
    setModal(pack);
  };

  const closeModal = () => { setModal(null); setError(''); };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const buildPayload = () => ({
    name: form.name.trim(),
    price: form.price.trim(),
    description: form.description.trim(),
    sub_date: Number(form.durationValue) || 1,
    durationUnit: form.durationUnit,
    features: form.features.split(',').map(f => f.trim()).filter(Boolean),
    modules: form.modules,
    isTrial: form.isTrial,
    isEnabled: form.isEnabled,
  });

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name || !form.price || !form.description) {
      setError('Please fill in all required fields (name, price, description).');
      return;
    }
    setSaving(true); setError('');
    try {
      const res = await createPackage(buildPayload());
      setPackages(cur => [res.data, ...cur]);
      closeModal();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to create package.');
    } finally { setSaving(false); }
  };

  // ── Save edit ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name || !form.price || !form.description) {
      setError('Please fill in all required fields (name, price, description).');
      return;
    }
    if (typeof modal !== 'object' || modal === null) return;
    setSaving(true); setError('');
    try {
      const payload = buildPayload();
      await updatePackage((modal as PackageItem).id, payload);
      setPackages(cur => cur.map(p =>
        p.id === (modal as PackageItem).id
          ? { ...p, ...payload, durationValue: payload.sub_date, modules: payload.modules }
          : p
      ));
      closeModal();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to save changes.');
    } finally { setSaving(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this package? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deletePackage(id);
      setPackages(cur => cur.filter(p => p.id !== id));
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to delete package.');
    } finally { setDeletingId(null); }
  };

  // ── Toggle enabled ─────────────────────────────────────────────────────────
  const toggleEnabled = async (pack: PackageItem) => {
    const next = !(pack.isEnabled ?? true);
    try {
      await updatePackage(pack.id, { isEnabled: next });
      setPackages(cur => cur.map(p => p.id === pack.id ? { ...p, isEnabled: next } : p));
    } catch (e: any) {
      alert('Failed to toggle package status.');
    }
  };

  const toggleModule = (key: string) =>
    setForm(f => ({
      ...f,
      modules: f.modules.includes(key) ? f.modules.filter(k => k !== key) : [...f.modules, key],
    }));

  const isEditModal = modal !== null && modal !== 'create';
  const isOpen = modal !== null;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Packages',    value: packages.length,                               icon: Package, color: 'cyan'   },
    { label: 'Active',            value: packages.filter(p => p.isEnabled !== false).length, icon: Check,  color: 'green'  },
    { label: 'Trial Packages',    value: packages.filter(p => p.isTrial).length,        icon: Star,   color: 'amber'  },
    { label: 'Total Subscribers', value: packages.reduce((s, p) => s + (p.activeSubscribers || 0), 0), icon: Users, color: 'purple' },
  ];
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500/10 text-cyan-400', green: 'bg-green-500/10 text-green-400',
    amber: 'bg-amber-500/10 text-amber-400', purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Subscription Packages</h1>
            <p className="mt-1 text-sm text-slate-400">Define plans, pricing, and which modules each package unlocks.</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
          >
            <Plus className="h-4 w-4" /> New Package
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 flex items-center gap-4">
            <div className={`rounded-xl p-3 ${colorMap[s.color]}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search packages…"
          className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-11 pr-10 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Package Cards ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 py-20 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading packages…</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 py-20 gap-3 text-slate-500">
          <Package className="h-12 w-12 opacity-40" />
          <p className="text-sm">No packages found.</p>
          <button onClick={openCreate} className="text-sm text-cyan-400 hover:text-cyan-300 font-semibold">
            + Create your first package
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {displayed.map(pack => <PackageCard key={pack.id} pack={pack} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleEnabled} deletingId={deletingId} />)}
        </div>
      )}

      {/* Load more sentinel */}
      {!loading && displayed.length > 0 && (
        <div ref={loaderRef} className="py-4 text-center text-xs text-slate-600">
          {visibleCount < filtered.length ? 'Loading more…' : `Showing all ${filtered.length} packages`}
        </div>
      )}

      {/* ════════════════ MODAL ════════════════ */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-10">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-800 bg-slate-900 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isEditModal ? `Edit — ${(modal as PackageItem).name}` : 'Create New Package'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isEditModal ? 'Update package details and module access.' : 'Configure a new subscription plan.'}
                </p>
              </div>
              <button onClick={closeModal} className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5">
              {/* Error banner */}
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Basic info */}
              <Section title="Basic Information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Package Name *">
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Menu Only" className={inputCls} />
                  </Field>
                  <Field label="Price (ETB) *">
                    <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="e.g. 499" type="number" min="0" className={inputCls} />
                  </Field>
                  <Field label="Duration">
                    <div className="flex gap-2">
                      <input value={form.durationValue} type="number" min={1}
                        onChange={e => setForm(f => ({ ...f, durationValue: e.target.value }))}
                        className={inputCls + ' w-20'} />
                      <select value={form.durationUnit}
                        onChange={e => setForm(f => ({ ...f, durationUnit: e.target.value as any }))}
                        className={inputCls + ' flex-1'}>
                        <option value="day">Day(s)</option>
                        <option value="month">Month(s)</option>
                        <option value="year">Year(s)</option>
                      </select>
                    </div>
                  </Field>
                  <div className="flex flex-col justify-end gap-3">
                    <ToggleRow label="Trial package" checked={form.isTrial} onChange={v => setForm(f => ({ ...f, isTrial: v }))} />
                    <ToggleRow label="Enabled"       checked={form.isEnabled} onChange={v => setForm(f => ({ ...f, isEnabled: v }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Description *">
                      <textarea value={form.description} rows={3} placeholder="Describe what this plan includes…"
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className={inputCls + ' resize-none'} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Marketing Features">
                      <input value={form.features} placeholder="24/7 Support, Priority Queue, API Access"
                        onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
                        className={inputCls} />
                      <p className="mt-1 text-xs text-slate-600">Comma-separated — shown on the pricing page.</p>
                    </Field>
                  </div>
                </div>
              </Section>

              {/* Module Access */}
              <Section title="Module Access" subtitle={`${form.modules.length} of ${ALL_MODULES.length} modules selected`}>
                {/* Presets */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {PRESETS.map(p => (
                    <button key={p.label} type="button"
                      onClick={() => setForm(f => ({ ...f, modules: p.modules }))}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold transition hover:border-slate-500"
                      style={{ color: p.color }}>
                      {p.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => setForm(f => ({ ...f, modules: ALL_MODULES.map(m => m.key) }))}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-400 hover:border-slate-500 transition">
                    Select All
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, modules: [] }))}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-600 hover:border-slate-500 transition">
                    Clear
                  </button>
                </div>

                {/* Checkboxes grouped */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {(['Reports', 'Menu', 'Rooms', 'General'] as const).map(group => (
                    <div key={group} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                      <p className={`mb-2.5 text-xs font-bold uppercase tracking-wider ${GROUP_COLORS[group]}`}>{group}</p>
                      <div className="space-y-1.5">
                        {ALL_MODULES.filter(m => m.group === group).map(mod => {
                          const on = form.modules.includes(mod.key);
                          return (
                            <label key={mod.key} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-800/60 transition">
                              <button type="button" onClick={() => toggleModule(mod.key)}
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${on ? 'border-cyan-500 bg-cyan-500' : 'border-slate-600'}`}>
                                {on && <Check className="h-3 w-3 text-slate-950 stroke-[3]" />}
                              </button>
                              <span className={`text-sm ${on ? 'text-slate-100 font-medium' : 'text-slate-500'}`}>{mod.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between rounded-b-2xl border-t border-slate-800 bg-slate-950/40 px-6 py-4">
              <span className="text-xs text-slate-600">
                {form.modules.length === 0 && '⚠ No modules selected — users will get full access'}
                {form.modules.length > 0 && `✓ ${form.modules.length} module${form.modules.length > 1 ? 's' : ''} enabled`}
              </span>
              <div className="flex gap-3">
                <button onClick={closeModal} className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition">
                  Cancel
                </button>
                <button
                  onClick={isEditModal ? handleSave : handleCreate}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition"
                >
                  {saving
                    ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> Saving…</>
                    : isEditModal ? <><Check className="h-4 w-4" /> Save Changes</> : <><Plus className="h-4 w-4" /> Create Package</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

const inputCls = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500 transition placeholder:text-slate-600';

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <h3 className="text-sm font-bold text-slate-200">{title}</h3>
        {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
      <span className="text-sm text-slate-300">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${checked ? 'bg-cyan-500' : 'bg-slate-700'}`}>
        <span className={`inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

function PackageCard({ pack, onEdit, onDelete, onToggle, deletingId }: {
  pack: PackageItem;
  onEdit: (p: PackageItem) => void;
  onDelete: (id: number) => void;
  onToggle: (p: PackageItem) => void;
  deletingId: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const modules = (pack.modules || []).filter(m => m?.trim());
  const priceNum = parseFloat(pack.price);
  const priceColor = priceNum === 0 ? 'text-green-400' : priceNum < 500 ? 'text-cyan-400' : 'text-purple-400';

  return (
    <div className={`rounded-2xl border transition-all ${pack.isEnabled === false ? 'border-slate-800 opacity-60' : 'border-slate-700 hover:border-slate-600'} bg-slate-900/80`}>
      {/* Card top */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-white truncate">{pack.name}</h3>
              {pack.isTrial && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300 font-semibold">
                  <Star className="h-3 w-3" /> Trial
                </span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pack.isEnabled === false ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                {pack.isEnabled === false ? 'Disabled' : 'Active'}
              </span>
            </div>
            <p className="text-sm text-slate-400 line-clamp-2">{pack.description}</p>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-xl font-black ${priceColor}`}>ETB {priceNum.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {pack.durationValue} {pack.durationUnit}{pack.durationValue !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{pack.activeSubscribers || 0} subscribers</span>
          <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />{modules.length} modules</span>
        </div>

        {/* Module badges (collapsed) */}
        {modules.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(expanded ? modules : modules.slice(0, 4)).map(m => (
              <span key={m} className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-400">{m}</span>
            ))}
            {!expanded && modules.length > 4 && (
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">+{modules.length - 4} more</span>
            )}
          </div>
        )}

        {/* Expand/collapse */}
        {modules.length > 4 && (
          <button onClick={() => setExpanded(e => !e)} className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition">
            {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Collapse</> : <><ChevronDown className="h-3.5 w-3.5" /> Show all modules</>}
          </button>
        )}
      </div>

      {/* Card actions */}
      <div className="flex items-center gap-2 border-t border-slate-800 px-5 py-3">
        <button onClick={() => onToggle(pack)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${pack.isEnabled === false ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}>
          <Power className="h-3.5 w-3.5" />
          {pack.isEnabled === false ? 'Enable' : 'Disable'}
        </button>
        <button onClick={() => onEdit(pack)}
          className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button onClick={() => onDelete(pack.id)} disabled={deletingId === pack.id}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition">
          {deletingId === pack.id
            ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
            : <Trash2 className="h-3.5 w-3.5" />}
          Delete
        </button>
      </div>
    </div>
  );
}
