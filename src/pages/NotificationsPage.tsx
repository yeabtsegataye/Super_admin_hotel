import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

type AnnouncementType = 'notification' | 'popup';

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: AnnouncementType;
  targetUserId: number | null;
  isEnabled: boolean;
  createdAt: string;
}

interface User { id: number; firstName: string; lastName: string; email: string; }

const badge = (type: AnnouncementType, isEnabled: boolean) => {
  if (type === 'popup') {
    return isEnabled
      ? 'bg-purple-900/40 text-purple-300 border border-purple-700/40'
      : 'bg-slate-800 text-slate-500 border border-slate-700';
  }
  return 'bg-cyan-900/40 text-cyan-300 border border-cyan-700/40';
};

export default function NotificationsPage() {
  const [items,   setItems]   = useState<Announcement[]>([]);
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title:       '',
    message:     '',
    type:        'notification' as AnnouncementType,
    targetAll:   true,
    targetUserId: '' as string | number,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [annRes, usrRes] = await Promise.all([
        api.get('/super/announcements'),
        api.get('/super/users'),
      ]);
      setItems(Array.isArray(annRes.data) ? annRes.data : []);
      const rawUsers = Array.isArray(usrRes.data) ? usrRes.data : (usrRes.data?.data ?? []);
      setUsers(rawUsers.slice(0, 200));
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string, type: 'ok' | 'err') => {
    if (type === 'ok') { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); }
    else               { setError(msg);   setTimeout(() => setError(''),   3500); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      flash('Title and message are required', 'err'); return;
    }
    setSaving(true);
    try {
      await api.post('/super/announcements', {
        title:        form.title.trim(),
        message:      form.message.trim(),
        type:         form.type,
        targetAll:    form.targetAll,
        targetUserId: form.targetAll ? undefined : Number(form.targetUserId),
      });
      flash(
        form.type === 'popup'
          ? 'Pop-up created. It will show on clients\' next login / refresh.'
          : `Notification sent to ${form.targetAll ? 'all users' : 'selected user'}.`,
        'ok'
      );
      setForm({ title: '', message: '', type: 'notification', targetAll: true, targetUserId: '' });
      load();
    } catch { flash('Failed to send announcement', 'err'); }
    finally { setSaving(false); }
  };

  const togglePopup = async (id: number, current: boolean) => {
    try {
      await api.put(`/super/announcements/${id}/toggle`, { isEnabled: !current });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isEnabled: !current } : i)));
    } catch { flash('Failed to update popup', 'err'); }
  };

  const deleteItem = async (id: number) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/super/announcements/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      flash('Deleted', 'ok');
    } catch { flash('Failed to delete', 'err'); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications & Pop-ups</h1>
        <p className="mt-1 text-sm text-slate-400">
          Send inbox notifications or controlled pop-up modals to your hotel clients.
        </p>
      </div>

      {/* Flash messages */}
      {error   && <div className="rounded-2xl bg-red-900/40 border border-red-700/40 px-4 py-3 text-sm text-red-300">{error}</div>}
      {success && <div className="rounded-2xl bg-emerald-900/40 border border-emerald-700/40 px-4 py-3 text-sm text-emerald-300">{success}</div>}

      {/* ── Create form ─────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="mb-4 text-base font-semibold text-white">Send New Announcement</h2>
        <form onSubmit={handleCreate} className="space-y-4">

          {/* Type toggle */}
          <div className="flex gap-3">
            {(['notification', 'popup'] as AnnouncementType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`rounded-2xl px-4 py-2 text-sm font-medium border transition ${
                  form.type === t
                    ? t === 'popup'
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-cyan-600 border-cyan-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                {t === 'notification' ? '🔔 Notification' : '📢 Pop-up'}
              </button>
            ))}
          </div>

          {/* Targeting */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.targetAll}
                onChange={(e) => setForm((f) => ({ ...f, targetAll: e.target.checked }))}
                className="rounded"
              />
              Send to all users
            </label>
            {!form.targetAll && (
              <select
                value={form.targetUserId}
                onChange={(e) => setForm((f) => ({ ...f, targetUserId: e.target.value }))}
                className="rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="">— pick a user —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <input
            type="text"
            placeholder="Title"
            value={form.title}
            maxLength={200}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
          />

          <textarea
            placeholder="Message"
            value={form.message}
            rows={4}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 resize-none"
          />

          {form.type === 'popup' && (
            <p className="text-xs text-slate-500">
              ⓘ Pop-ups appear as a modal when the client logs in or refreshes. They can dismiss it with ✕ but it reappears on the next session. You can disable it below at any time.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 transition"
          >
            {saving ? 'Sending…' : form.type === 'popup' ? 'Create Pop-up' : 'Send Notification'}
          </button>
        </form>
      </div>

      {/* ── Existing announcements ───────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="mb-4 text-base font-semibold text-white">All Announcements</h2>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-slate-500 text-sm">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${badge(item.type as AnnouncementType, item.isEnabled)}`}>
                      {item.type === 'popup' ? '📢 Pop-up' : '🔔 Notification'}
                    </span>
                    {item.targetUserId === null
                      ? <span className="text-xs text-slate-500">→ All users</span>
                      : <span className="text-xs text-slate-500">→ User #{String(item.targetUserId)}</span>
                    }
                    <span className="text-xs text-slate-600 ml-auto">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-2">{item.message}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.type === 'popup' && (
                    <button
                      onClick={() => togglePopup(item.id, item.isEnabled)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
                        item.isEnabled
                          ? 'bg-emerald-900/40 border-emerald-700/40 text-emerald-400 hover:bg-red-900/40 hover:border-red-700/40 hover:text-red-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-emerald-900/40 hover:border-emerald-700/40 hover:text-emerald-400'
                      }`}
                    >
                      {item.isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold border border-red-800/40 bg-red-900/20 text-red-400 hover:bg-red-900/40 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
