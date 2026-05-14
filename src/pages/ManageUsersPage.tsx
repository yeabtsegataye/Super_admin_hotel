import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchUsers, blockUser, unblockUser } from '../services/authService';
import type { UserItem } from '../types';

const pageSize = 15;

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetchUsers();
        setUsers(response.data);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [search]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        [user.name, user.email, user.role, user.hotels, user.status]
          .join(' ')
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [users, search],
  );

  const displayedUsers = filteredUsers.slice(0, visibleCount);

  const canLoadMore = visibleCount < filteredUsers.length;

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && canLoadMore) {
          setVisibleCount((current) => Math.min(current + pageSize, filteredUsers.length));
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [filteredUsers.length, canLoadMore]);

  const toggleBlock = async (user: UserItem) => {
    setBusyId(user.id);
    try {
      if (user.status === 'Blocked') {
        await unblockUser(user.id);
        setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, status: 'Active' } : item)));
      } else {
        await blockUser(user.id);
        setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, status: 'Blocked' } : item)));
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Manage Users</h1>
        <p className="mt-2 text-sm text-slate-400">Review users, see hotel associations, and load more as you scroll.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <label className="block text-sm font-medium text-slate-300">
            Search users
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, hotel, or status"
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
            />
          </label>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-right text-sm text-slate-400">
          {filteredUsers.length} users found
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">Loading users…</div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Hotel</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-950/60">
                  <td className="px-4 py-4 text-white">{user.name}</td>
                  <td className="px-4 py-4">{user.email}</td>
                  <td className="px-4 py-4">{user.hotels}</td>
                  <td className="px-4 py-4">{user.role}</td>
                  <td className="px-4 py-4">{user.status}</td>
                  <td className="px-4 py-4">
                    <button
                      disabled={busyId === user.id}
                      onClick={() => toggleBlock(user)}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                        user.status === 'Blocked'
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      } ${busyId === user.id ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      {user.status === 'Blocked' ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div ref={loaderRef} className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-4 text-center text-sm text-slate-400">
            {canLoadMore ? 'Scroll down to load more users…' : 'All matching users loaded.'}
          </div>
        </div>
      )}
    </div>
  );
}
