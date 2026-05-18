// pages/ExpiredLicensesPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchExpiredLicenses, bulkRenewLicenses } from '../services/authService';
import type { ExpiredLicenseRecord } from '../types';

export default function ExpiredLicensesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expiredLicenses, setExpiredLicenses] = useState<ExpiredLicenseRecord[]>([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'blocked' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'expiryDate' | 'userEmail' | 'hotelName'>('expiryDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showBulkRenewModal, setShowBulkRenewModal] = useState(false);
  const [bulkRenewData, setBulkRenewData] = useState({ duration: 1, unit: 'month' as 'day' | 'month' | 'year' });
  const [bulkRenewLoading, setBulkRenewLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetchExpiredLicenses();
        if (!mounted) return;
        setExpiredLicenses(response.data || []);
      } catch (e) {
        console.error('Failed loading expired licenses data', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter and search logic
  const filteredAndSearched = useMemo(() => {
    let filtered = [...expiredLicenses];

    if (filterStatus === 'blocked') {
      filtered = filtered.filter(item => item.isBlocked);
    } else if (filterStatus === 'expired') {
      filtered = filtered.filter(item => !item.isBlocked);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.userEmail.toLowerCase().includes(searchLower) ||
        item.hotelName.toLowerCase().includes(searchLower) ||
        item.phone?.toLowerCase().includes(searchLower) ||
        item.userId.toString().includes(searchTerm)
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'expiryDate') {
        comparison = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      } else if (sortBy === 'userEmail') {
        comparison = a.userEmail.localeCompare(b.userEmail);
      } else if (sortBy === 'hotelName') {
        comparison = a.hotelName.localeCompare(b.hotelName);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [expiredLicenses, searchTerm, filterStatus, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSearched.length / pageSize));
  const currentPageItems = filteredAndSearched.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleUserClick = (userId: number) => {
    navigate(`/users/${userId}`);
  };

  const handleSort = (column: 'expiryDate' | 'userEmail' | 'hotelName') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(currentPageItems.map(item => item.userId));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleBulkRenew = async () => {
    setBulkRenewLoading(true);
    try {
      const response = await bulkRenewLicenses(
        selectedUsers,
        bulkRenewData.duration,
        bulkRenewData.unit
      );
      
      if (response.data.success > 0) {
        alert(`Successfully renewed ${response.data.success} licenses. Failed: ${response.data.failed}`);
        // Refresh the list
        const refreshResponse = await fetchExpiredLicenses();
        setExpiredLicenses(refreshResponse.data || []);
        setSelectedUsers([]);
        setShowBulkRenewModal(false);
      } else {
        alert('Failed to renew licenses. Please try again.');
      }
    } catch (error) {
      console.error('Bulk renew failed:', error);
      alert('Failed to renew licenses. Please check console for details.');
    } finally {
      setBulkRenewLoading(false);
    }
  };

  if (loading) return <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">Loading expired licenses…</div>;

  return (
    <div className="space-y-6">
      {/* Bulk Renew Modal */}
      {showBulkRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Bulk Renew Licenses</h2>
            <p className="mb-4 text-sm text-slate-400">
              Renew {selectedUsers.length} selected license(s)
            </p>
            
            <div className="mb-4">
              <label className="mb-2 block text-sm text-slate-400">Duration</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={bulkRenewData.duration}
                  onChange={(e) => setBulkRenewData({ ...bulkRenewData, duration: parseInt(e.target.value) || 1 })}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-white"
                />
                <select
                  value={bulkRenewData.unit}
                  onChange={(e) => setBulkRenewData({ ...bulkRenewData, unit: e.target.value as any })}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-white"
                >
                  <option value="day">Day(s)</option>
                  <option value="month">Month(s)</option>
                  <option value="year">Year(s)</option>
                </select>
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-slate-950/70 p-3">
              <p className="text-sm text-slate-400">Preview:</p>
              <p className="text-sm text-cyan-400">
                New licenses will expire on: {new Date(new Date().setDate(new Date().getDate() + 
                  (bulkRenewData.unit === 'day' ? bulkRenewData.duration :
                   bulkRenewData.unit === 'month' ? bulkRenewData.duration * 30 :
                   bulkRenewData.duration * 365)
                )).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkRenewModal(false)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkRenew}
                disabled={bulkRenewLoading}
                className="flex-1 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-900 hover:bg-cyan-400 disabled:opacity-50"
              >
                {bulkRenewLoading ? 'Processing...' : 'Renew Selected'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Expired Licenses</h1>
        <p className="mt-2 text-sm text-slate-400">Listing of users with expired subscription licenses.</p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by email, hotel, phone, or user ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <svg
                className="absolute left-3 top-3 h-4 w-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setPage(1);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  filterStatus === 'all'
                    ? 'bg-cyan-500 text-white'
                    : 'border border-slate-800 bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setFilterStatus('expired');
                  setPage(1);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  filterStatus === 'expired'
                    ? 'bg-yellow-500 text-white'
                    : 'border border-slate-800 bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Expired Only
              </button>
              <button
                onClick={() => {
                  setFilterStatus('blocked');
                  setPage(1);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  filterStatus === 'blocked'
                    ? 'bg-red-500 text-white'
                    : 'border border-slate-800 bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Blocked
              </button>
            </div>
          </div>

          {/* Results Info and Bulk Actions */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <p>Showing {currentPageItems.length} of {filteredAndSearched.length} expired records</p>
            <div className="flex items-center gap-4">
              {selectedUsers.length > 0 && (
                <button
                  onClick={() => setShowBulkRenewModal(true)}
                  className="rounded-xl bg-cyan-500 px-3 py-1 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
                >
                  Bulk Renew ({selectedUsers.length})
                </button>
              )}
              <div className="flex items-center gap-2">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-1 text-sm text-white"
                >
                  <option value="expiryDate">Expiry Date</option>
                  <option value="userEmail">Email</option>
                  <option value="hotelName">Hotel Name</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-1 text-sm text-white"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/70">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={currentPageItems.length > 0 && selectedUsers.length === currentPageItems.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800"
                  />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('userEmail')}>
                  # {sortBy === 'userEmail' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('userEmail')}>
                  Email {sortBy === 'userEmail' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('hotelName')}>
                  Hotel {sortBy === 'hotelName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('expiryDate')}>
                  Expired On {sortBy === 'expiryDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentPageItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No expired licenses found matching your criteria
                   </td>
                </tr>
              ) : (
                currentPageItems.map((item, idx) => (
                  <tr key={`${item.userEmail}-${idx}`} className="border-b border-slate-800 hover:bg-slate-950/60">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(item.userId)}
                        onChange={(e) => handleSelectUser(item.userId, e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800"
                      />
                    </td>
                    <td className="px-4 py-4 text-white">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="px-4 py-4 text-white">{item.userId}</td>
                    <td className="px-4 py-4">{item.userEmail}</td>
                    <td className="px-4 py-4 text-white">{item.hotelName}</td>
                    <td className="px-4 py-4">{item.phone}</td>
                    <td className="px-4 py-4 text-red-400">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs ${
                        item.isBlocked 
                          ? 'bg-red-900/50 text-red-300' 
                          : 'bg-yellow-900/50 text-yellow-300'
                      }`}>
                        {item.isBlocked ? 'Blocked' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleUserClick(item.userId)}
                        className="rounded-lg bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400 transition hover:bg-cyan-500/20"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAndSearched.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl px-3 py-1 bg-slate-800 text-sm text-slate-200 disabled:opacity-50 hover:bg-slate-700"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pageNum = page - 2 + i;
                if (pageNum > totalPages) return null;
              }
              return (
                <button
                  key={i}
                  onClick={() => setPage(pageNum)}
                  className={`rounded-xl px-3 py-1 text-sm transition ${
                    page === pageNum 
                      ? 'bg-cyan-500 text-slate-900' 
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && page < totalPages - 2 && <span className="text-slate-500">...</span>}
            {totalPages > 5 && page < totalPages - 2 && (
              <button
                onClick={() => setPage(totalPages)}
                className="rounded-xl px-3 py-1 text-sm bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                {totalPages}
              </button>
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl px-3 py-1 bg-slate-800 text-sm text-slate-200 disabled:opacity-50 hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}