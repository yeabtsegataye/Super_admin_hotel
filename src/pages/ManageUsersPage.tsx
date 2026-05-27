import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUsers, blockUser, unblockUser, getBatchLicenseInfo, impersonateUser } from '../services/authService';
import type { UserItem, LicenseInfo } from '../types';

const pageSize = 15;

type FilterType = 'all' | 'active' | 'expired' | 'blocked' | 'no_license';
type RoleFilterType = 'all' | 'admin' | 'user';

export default function ManageUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [licenseFilter, setLicenseFilter] = useState<FilterType>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>('all');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [licenseInfoMap, setLicenseInfoMap] = useState<Map<number, LicenseInfo>>(new Map());
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetchUsers();
        const usersData = response.data;
        setUsers(usersData);
        
        // Batch load license info for all users at once
        if (usersData.length > 0) {
          const userIds = usersData.map((user: UserItem) => user.id);
          const licenseResponse = await getBatchLicenseInfo(userIds);
          
          const licenseMap = new Map();
          licenseResponse.data.forEach((license: LicenseInfo) => {
            licenseMap.set(license.userId, license);
          });
          setLicenseInfoMap(licenseMap);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [search, licenseFilter, roleFilter]);

  // Filter users based on search, license status, and role
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((user) =>
        [user.name, user.email, user.role, user.hotels, user.status, user.phone]
          .join(' ')
          .toLowerCase()
          .includes(searchLower),
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => 
        roleFilter === 'admin' ? user.role === 'admin' : user.role !== 'admin'
      );
    }

    // Apply license status filter
    if (licenseFilter !== 'all') {
      filtered = filtered.filter((user) => {
        const licenseInfo = licenseInfoMap.get(user.id);
        if (!licenseInfo) return licenseFilter === 'no_license';
        
        if (licenseFilter === 'active') return licenseInfo.status === 'active';
        if (licenseFilter === 'expired') return licenseInfo.status === 'expired';
        if (licenseFilter === 'blocked') return user.status === 'Blocked';
        if (licenseFilter === 'no_license') return !licenseInfo.hasLicense;
        
        return true;
      });
    }

    return filtered;
  }, [users, search, licenseFilter, roleFilter, licenseInfoMap]);

  const displayedUsers = filteredUsers.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredUsers.length;

  // Infinite scroll observer
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
        setUsers((current) => 
          current.map((item) => 
            item.id === user.id ? { ...item, status: 'Active' } : item
          )
        );
      } else {
        await blockUser(user.id);
        setUsers((current) => 
          current.map((item) => 
            item.id === user.id ? { ...item, status: 'Blocked' } : item
          )
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleImpersonate = async (user: UserItem) => {
    if (!confirm(`Start impersonation as ${user.email}?`)) return;
    try {
      const response = await impersonateUser(user.id);
      const token = response?.data?.impersonationToken;
      if (!token) {
        throw new Error('No impersonation token returned');
      }

      const dashboardUrl =
        import.meta.env.VITE_HOTEL_DASHBOARD_URL ||
        'http://localhost:5174';

      const url = `${dashboardUrl}/#/impersonate?token=${encodeURIComponent(token)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Impersonation failed', err);
      alert('Failed to impersonate user');
    }
  };

  const handleViewDetails = (userId: number) => {
    navigate(`/users/${userId}`);
  };

  const getLicenseStatusBadge = (userId: number) => {
    const licenseInfo = licenseInfoMap.get(userId);
    if (!licenseInfo) return <span className="text-slate-500">No license</span>;
    
    switch (licenseInfo.status) {
      case 'active':
        return (
          <span className="inline-flex rounded-full bg-green-900/50 px-2 py-1 text-xs text-green-300">
            Active ({licenseInfo.daysRemaining} days)
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex rounded-full bg-red-900/50 px-2 py-1 text-xs text-red-300">
            Expired ({Math.abs(licenseInfo.daysRemaining)} days)
          </span>
        );
      default:
        return <span className="text-slate-500">No license</span>;
    }
  };

  const getExpiryDate = (userId: number) => {
    const licenseInfo = licenseInfoMap.get(userId);
    if (!licenseInfo?.expiryDate) return 'N/A';
    return new Date(licenseInfo.expiryDate).toLocaleDateString();
  };

  // Get counts for filter badges
  const getFilterCounts = useCallback(() => {
    const counts = {
      all: filteredUsers.length,
      active: 0,
      expired: 0,
      blocked: 0,
      no_license: 0,
    };

    users.forEach(user => {
      const licenseInfo = licenseInfoMap.get(user.id);
      if (user.status === 'Blocked') counts.blocked++;
      else if (!licenseInfo?.hasLicense) counts.no_license++;
      else if (licenseInfo?.status === 'active') counts.active++;
      else if (licenseInfo?.status === 'expired') counts.expired++;
    });

    return counts;
  }, [users, licenseInfoMap]);

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">
        Loading users...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Manage Users</h1>
        <p className="mt-2 text-sm text-slate-400">Review users, view license status, and manage accounts.</p>
      </div>

      {/* Search and Filters Section */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <label className="block text-sm font-medium text-slate-300">
            Search users
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, hotel, phone, or status..."
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </label>
        </div>

        {/* Role Filter */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <label className="mb-3 block text-sm font-medium text-slate-300">Role Filter</label>
          <div className="flex gap-2">
            <button
              onClick={() => setRoleFilter('all')}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                roleFilter === 'all'
                  ? 'bg-cyan-500 text-white'
                  : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                roleFilter === 'admin'
                  ? 'bg-cyan-500 text-white'
                  : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Admins Only
            </button>
            <button
              onClick={() => setRoleFilter('user')}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                roleFilter === 'user'
                  ? 'bg-cyan-500 text-white'
                  : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Regular Users
            </button>
          </div>
        </div>

        {/* License Status Filter */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <label className="mb-3 block text-sm font-medium text-slate-300">License Status</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLicenseFilter('all')}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                licenseFilter === 'all'
                  ? 'bg-cyan-500 text-white'
                  : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setLicenseFilter('active')}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                licenseFilter === 'active'
                  ? 'bg-green-500 text-white'
                  : 'border border-slate-700 bg-slate-950 text-green-400 hover:bg-slate-800'
              }`}
            >
              Active ({counts.active})
            </button>
            <button
              onClick={() => setLicenseFilter('expired')}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                licenseFilter === 'expired'
                  ? 'bg-red-500 text-white'
                  : 'border border-slate-700 bg-slate-950 text-red-400 hover:bg-slate-800'
              }`}
            >
              Expired ({counts.expired})
            </button>
            <button
              onClick={() => setLicenseFilter('blocked')}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                licenseFilter === 'blocked'
                  ? 'bg-red-500 text-white'
                  : 'border border-slate-700 bg-slate-950 text-red-400 hover:bg-slate-800'
              }`}
            >
              Blocked ({counts.blocked})
            </button>
            <button
              onClick={() => setLicenseFilter('no_license')}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                licenseFilter === 'no_license'
                  ? 'bg-yellow-500 text-white'
                  : 'border border-slate-700 bg-slate-950 text-yellow-400 hover:bg-slate-800'
              }`}
            >
              No License ({counts.no_license})
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-right text-sm text-slate-400">
          Showing {displayedUsers.length} of {filteredUsers.length} users
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Hotel</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">License Status</th>
              <th className="px-4 py-3">Expiry Date</th>
              <th className="px-4 py-3">Account Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedUsers.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                  No users found matching your criteria
                </td>
              </tr>
            ) : (
              displayedUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-950/60">
                  <td className="px-4 py-4 text-white">{user.id}</td>
                  <td className="px-4 py-4 font-medium text-white">{user.name}</td>
                  <td className="px-4 py-4">{user.email}</td>
                  <td className="px-4 py-4">{user.phone || 'N/A'}</td>
                  <td className="px-4 py-4">{user.hotels}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-400">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">{getLicenseStatusBadge(user.id)}</td>
                  <td className="px-4 py-4 text-sm">{getExpiryDate(user.id)}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs ${
                      user.status === 'Blocked' 
                        ? 'bg-red-900/50 text-red-300' 
                        : 'bg-green-900/50 text-green-300'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(user.id)}
                        className="rounded-xl bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-400 transition hover:bg-cyan-500/20"
                      >
                        View Details
                      </button>
                      <button
                        disabled={busyId === user.id}
                        onClick={() => toggleBlock(user)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          user.status === 'Blocked'
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        } ${busyId === user.id ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        {user.status === 'Blocked' ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={() => handleImpersonate(user)}
                        className="rounded-xl bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-400 transition hover:bg-indigo-500/20"
                      >
                        Impersonate
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div ref={loaderRef} className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-4 text-center text-sm text-slate-400">
          {canLoadMore ? 'Scroll down to load more users…' : `All ${filteredUsers.length} users loaded.`}
        </div>
      </div>
    </div>
  );
}