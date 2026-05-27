import { useEffect, useMemo, useRef, useState } from 'react';
import { createPackage, deletePackage, fetchPackages, updatePackage } from '../services/authService';
import type { PackageItem } from '../types';
import { Pencil, Trash2, Plus, Search, X, Check, Clock, Tag, Star, Package, Power } from 'lucide-react';

const pageSize = 10;

export default function ManagePackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    durationValue: '',
    durationUnit: 'month' as 'day' | 'month' | 'year',
    features: '',
    isTrial: false,
    isEnabled: true,
  });
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const response = await fetchPackages();
        setPackages(response.data);
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, []);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [search]);

  const filteredPackages = useMemo(
    () =>
      packages.filter((pack) =>
        [pack.name, pack.description, pack.price, pack.features.join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [packages, search],
  );

  const displayedPackages = filteredPackages.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredPackages.length;

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && canLoadMore) {
          setVisibleCount((current) => Math.min(current + pageSize, filteredPackages.length));
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, filteredPackages.length]);

  const handleEdit = (pack: PackageItem) => {
    setEditingId(pack.id);
    setForm({
      name: pack.name,
      price: pack.price,
      description: pack.description,
      durationValue: String(pack.durationValue),
      durationUnit: pack.durationUnit,
      features: pack.features.join(', '),
      isTrial: pack.isTrial || false,
      isEnabled: pack.isEnabled ?? true,
    });
  };

  const handleSave = async (id: number) => {
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        price: form.price,
        description: form.description,
        sub_date: Number(form.durationValue),
        durationUnit: form.durationUnit,
        features: form.features.split(',').map((feature) => feature.trim()).filter(Boolean),
        isTrial: form.isTrial,
        isEnabled: form.isEnabled,
      };
      await updatePackage(id, payload);
      setPackages((current) =>
        current.map((pack) =>
          pack.id === id
            ? {
                ...pack,
                name: payload.name,
                price: payload.price,
                description: payload.description,
                durationValue: Number(payload.sub_date),
                durationUnit: payload.durationUnit,
                features: payload.features,
                isTrial: payload.isTrial,
                isEnabled: payload.isEnabled,
              }
            : pack,
        ),
      );
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this package? This action cannot be undone.')) return;
    
    setDeletingId(id);
    try {
      await deletePackage(id);
      setPackages((current) => current.filter((pack) => pack.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.price || !form.description) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        price: form.price,
        description: form.description,
        sub_date: Number(form.durationValue),
        durationUnit: form.durationUnit,
        features: form.features.split(',').map((feature) => feature.trim()).filter(Boolean),
        isTrial: form.isTrial,
        isEnabled: form.isEnabled,
      };
      const response = await createPackage(payload);
      setPackages((current) => [response.data, ...current]);
      setForm({ name: '', price: '', description: '', durationValue: '', durationUnit: 'month', features: '', isTrial: false, isEnabled: true });
      setShowCreateModal(false);
    } finally {
      setLoading(false);
    }
  };

  const getDurationDisplay = (duration: number, unit: 'day' | 'month' | 'year') => {
    const unitLabels = { day: 'Day', month: 'Month', year: 'Year' };
    const pluralLabels = { day: 'Days', month: 'Months', year: 'Years' };
    const label = duration === 1 ? unitLabels[unit] : pluralLabels[unit];
    return `${duration} ${label}`;
  };

  const getPriceColor = (price: string) => {
    const numPrice = parseFloat(price);
    if (numPrice === 0) return 'text-green-400';
    if (numPrice < 100) return 'text-blue-400';
    if (numPrice < 500) return 'text-purple-400';
    return 'text-yellow-400';
  };

  const resetForm = () => {
    setForm({ name: '', price: '', description: '', durationValue: '', durationUnit: 'month', features: '', isTrial: false, isEnabled: true });
  };

  const togglePackageEnabled = async (pack: PackageItem) => {
    const nextState = !(pack.isEnabled ?? true);
    await updatePackage(pack.id, { isEnabled: nextState });
    setPackages((current) =>
      current.map((item) =>
        item.id === pack.id ? { ...item, isEnabled: nextState } : item,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950/70 to-slate-900/70 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Manage Packages</h1>
            <p className="mt-2 text-sm text-slate-400">Create, edit, and manage subscription packages for your customers.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <Plus className="h-4 w-4" />
            New Package
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Packages</p>
              <p className="text-2xl font-semibold text-white">{packages.length}</p>
            </div>
            <div className="rounded-2xl bg-cyan-500/10 p-3">
              <Package className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Packages</p>
              <p className="text-2xl font-semibold text-white">
                {packages.filter(p => p.isEnabled !== false).length}
              </p>
            </div>
            <div className="rounded-2xl bg-green-500/10 p-3">
              <Check className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Trial Packages</p>
              <p className="text-2xl font-semibold text-white">
                {packages.filter(p => p.isTrial).length}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-3">
              <Star className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Subscribers</p>
              <p className="text-2xl font-semibold text-white">
                {packages.reduce((sum, p) => sum + (p.activeSubscribers || 0), 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-purple-500/10 p-3">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search packages by name, description, or features..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-3 text-right text-sm text-slate-400">
          Found {filteredPackages.length} package{filteredPackages.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="mt-3 text-slate-400">Loading packages...</p>
        </div>
      ) : displayedPackages.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-3 text-slate-400">No packages found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Create your first package
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayedPackages.map((pack) => (
            <div
              key={pack.id}
              className="group rounded-3xl border border-slate-800 bg-slate-900/80 p-6 transition-all hover:border-slate-700 hover:bg-slate-900/90"
            >
              {editingId === pack.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Package Name</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Price</label>
                      <input
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Duration</label>
                      <div className="flex gap-2">
                        <input
                          value={form.durationValue}
                          onChange={(e) => setForm({ ...form, durationValue: e.target.value })}
                          type="number"
                          min={1}
                          className="w-24 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                        />
                        <select
                          value={form.durationUnit}
                          onChange={(e) => setForm({ ...form, durationUnit: e.target.value as any })}
                          className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                        >
                          <option value="day">Day(s)</option>
                          <option value="month">Month(s)</option>
                          <option value="year">Year(s)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.isTrial}
                          onChange={(e) => setForm({ ...form, isTrial: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-700"
                        />
                        <span className="text-sm text-slate-300">Trial Package</span>
                      </label>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.isEnabled}
                          onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-700"
                        />
                        <span className="text-sm text-slate-300">Enabled</span>
                      </label>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs text-slate-400">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs text-slate-400">Features (comma separated)</label>
                      <input
                        value={form.features}
                        onChange={(e) => setForm({ ...form, features: e.target.value })}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(pack.id)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                    >
                      <Check className="h-4 w-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-white">{pack.name}</h2>
                      {pack.isTrial && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs text-amber-300">
                          <Star className="h-3 w-3" />
                          Trial
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${
                          pack.isEnabled === false
                            ? 'bg-rose-500/15 text-rose-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {pack.isEnabled === false ? 'Disabled' : 'Enabled'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs text-cyan-300">
                        <Users className="h-3 w-3" />
                        {pack.activeSubscribers || 0} subscribers
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-400">{pack.description}</p>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-slate-300">
                          {getDurationDisplay(pack.durationValue, pack.durationUnit)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-slate-500" />
                        <span className={`text-sm font-semibold ${getPriceColor(pack.price)}`}>
                          ETB {parseFloat(pack.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="mb-2 text-xs text-slate-500">Features:</p>
                      <div className="flex flex-wrap gap-2">
                        {pack.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 lg:flex-col">
                    <button
                      onClick={() => togglePackageEnabled(pack)}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                        pack.isEnabled === false
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                      }`}
                    >
                      <Power className="h-4 w-4" />
                      {pack.isEnabled === false ? 'Enable' : 'Disable'}
                    </button>
                    <button
                      onClick={() => handleEdit(pack)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pack.id)}
                      disabled={deletingId === pack.id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      {deletingId === pack.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {!loading && displayedPackages.length > 0 && (
        <div
          ref={loaderRef}
          className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-4 text-center text-sm text-slate-400"
        >
          {canLoadMore ? 'Scroll to load more packages...' : `All ${filteredPackages.length} packages loaded`}
        </div>
      )}

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Create New Package</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Package Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Premium Plan"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Price (ETB) *</label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g., 499"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Duration</label>
                  <div className="flex gap-2">
                    <input
                      value={form.durationValue}
                      onChange={(e) => setForm({ ...form, durationValue: e.target.value })}
                      type="number"
                      min={1}
                      placeholder="1"
                      className="w-24 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100"
                    />
                    <select
                      value={form.durationUnit}
                      onChange={(e) => setForm({ ...form, durationUnit: e.target.value as any })}
                      className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100"
                    >
                      <option value="day">Day(s)</option>
                      <option value="month">Month(s)</option>
                      <option value="year">Year(s)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isTrial}
                      onChange={(e) => setForm({ ...form, isTrial: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-700"
                    />
                    <span className="text-sm text-slate-300">Mark as trial package</span>
                  </label>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isEnabled}
                      onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-700"
                    />
                    <span className="text-sm text-slate-300">Enabled</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm text-slate-400">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Describe what this package includes..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm text-slate-400">Features</label>
                  <input
                    value={form.features}
                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                    placeholder="e.g., 24/7 Support, Analytics Dashboard, API Access"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100"
                  />
                  <p className="mt-1 text-xs text-slate-500">Separate features with commas</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="rounded-2xl border border-slate-700 px-6 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create Package
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add missing icon import
import { Users } from 'lucide-react';