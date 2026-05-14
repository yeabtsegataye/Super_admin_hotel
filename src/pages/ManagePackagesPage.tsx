import { useEffect, useMemo, useRef, useState } from 'react';
import { createPackage, deletePackage, fetchPackages, updatePackage } from '../services/authService';
import type { PackageItem } from '../types';

const pageSize = 10;

export default function ManagePackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    durationValue: '',
    durationUnit: 'month' as 'day' | 'month' | 'year',
    features: '',
    isTrial: false,
  });
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(pageSize);
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
        [pack.name, pack.description, pack.price, pack.features.join(' ')].join(' ').toLowerCase().includes(search.trim().toLowerCase()),
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
      };
      await updatePackage(id, payload);
      setPackages((current) =>
        current.map((pack) =>
          pack.id === id
            ? {
                ...pack,
                name: payload.name as string,
                price: payload.price as string,
                description: payload.description as string,
                durationValue: Number(payload.sub_date),
                durationUnit: payload.durationUnit as 'day' | 'month' | 'year',
                features: payload.features as string[],
                isTrial: payload.isTrial as boolean,
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
    setLoading(true);
    try {
      await deletePackage(id);
      setPackages((current) => current.filter((pack) => pack.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
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
      };
      const response = await createPackage(payload);
      setPackages((current) => [response.data, ...current]);
      setForm({ name: '', price: '', description: '', durationValue: '', durationUnit: 'month', features: '', isTrial: false });
    } finally {
      setLoading(false);
    }
  };

  const getDurationDisplay = (duration: number, unit: 'day' | 'month' | 'year') => {
    const unitLabels = { day: 'day(s)', month: 'month(s)', year: 'year(s)' };
    return `${duration} ${unitLabels[unit]}`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Manage Packages</h1>
        <p className="mt-2 text-sm text-slate-400">Create, edit, delete, and search packages with flexible duration and trial support.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-lg font-semibold text-white">Add new package</h2>
          <div className="mt-5 grid gap-4">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Package name"
              className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
            />
            <input
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              placeholder="Price"
              className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
            />
            
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.durationValue}
                onChange={(event) => setForm((current) => ({ ...current, durationValue: event.target.value }))}
                placeholder="Duration value"
                type="number"
                min={1}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
              />
              <select
                value={form.durationUnit}
                onChange={(event) => setForm((current) => ({ ...current, durationUnit: event.target.value as 'day' | 'month' | 'year' }))}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
              >
                <option value="day">Day(s)</option>
                <option value="month">Month(s)</option>
                <option value="year">Year(s)</option>
              </select>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.isTrial}
                onChange={(event) => setForm((current) => ({ ...current, isTrial: event.target.checked }))}
                className="h-4 w-4"
              />
              <span className="text-sm text-slate-300">Mark as trial package (users can use only once)</span>
            </label>

            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
              className="min-h-[120px] w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
            />
            <input
              value={form.features}
              onChange={(event) => setForm((current) => ({ ...current, features: event.target.value }))}
              placeholder="Features (comma separated)"
              className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
            />
            <button
              onClick={handleCreate}
              disabled={loading}
              className="rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Add Package
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-lg font-semibold text-white">Search packages</h2>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, price, or description"
            className="mt-4 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <p className="mt-3 text-sm text-slate-400">Showing {filteredPackages.length} matching packages.</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">Loading packages…</div>
      ) : (
        <div className="space-y-4">
          {displayedPackages.map((pack) => (
            <div key={pack.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/10">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-white">{pack.name}</h2>
                    <div className="flex gap-2">
                      {pack.isTrial && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-200">Trial</span>}
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm text-cyan-200">{pack.activeSubscribers} subs</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">{pack.description}</p>
                  <p className="text-sm text-slate-400">Duration: {getDurationDisplay(pack.durationValue, pack.durationUnit)}</p>
                  <p className="text-sm text-slate-400">Features: {pack.features.join(', ')}</p>
                </div>

                <div className="space-y-3 text-right">
                  {editingId === pack.id ? (
                    <div className="grid gap-3">
                      <input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
                      />
                      <input
                        value={form.price}
                        onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                        className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={form.durationValue}
                          onChange={(event) => setForm((current) => ({ ...current, durationValue: event.target.value }))}
                          type="number"
                          min={1}
                          className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
                        />
                        <select
                          value={form.durationUnit}
                          onChange={(event) => setForm((current) => ({ ...current, durationUnit: event.target.value as 'day' | 'month' | 'year' }))}
                          className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
                        >
                          <option value="day">Day(s)</option>
                          <option value="month">Month(s)</option>
                          <option value="year">Year(s)</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.isTrial}
                          onChange={(event) => setForm((current) => ({ ...current, isTrial: event.target.checked }))}
                          className="h-4 w-4"
                        />
                        <span className="text-xs text-slate-300">Trial</span>
                      </label>
                      <input
                        value={form.features}
                        onChange={(event) => setForm((current) => ({ ...current, features: event.target.value }))}
                        className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
                      />
                      <textarea
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        className="min-h-[100px] rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
                      />
                      <button
                        onClick={() => handleSave(pack.id)}
                        className="rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                      >
                        Save changes
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-2xl font-semibold text-white">{pack.price}</p>
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => handleEdit(pack)}
                          className="rounded-3xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pack.id)}
                          className="rounded-3xl bg-rose-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-rose-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div ref={loaderRef} className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-4 text-center text-sm text-slate-400">
            {canLoadMore ? 'Scroll to load more packages…' : 'All packages loaded.'}
          </div>
        </div>
      )}
    </div>
  );
}
