import { useEffect, useMemo, useState } from 'react';
import { fetchAudit } from '../services/authService';
import type { AuditEntry } from '../types';

const pageSize = 10;

// Action type definitions with icons and colors
const actionConfig: Record<string, { icon: string; color: string; label: string }> = {
  // Auth actions
  register: { icon: '📝', color: 'text-green-400', label: 'Account Registration' },
  login: { icon: '🔑', color: 'text-blue-400', label: 'Login' },
  logout: { icon: '🚪', color: 'text-gray-400', label: 'Logout' },
  wrong_password: { icon: '❌', color: 'text-red-400', label: 'Failed Login Attempt' },
  
  // User management
  block_user: { icon: '🚫', color: 'text-red-400', label: 'User Blocked' },
  unblock_user: { icon: '✅', color: 'text-green-400', label: 'User Unblocked' },
  
  // License management
  renew_license: { icon: '🔄', color: 'text-cyan-400', label: 'License Renewed' },
  extend_license: { icon: '⏰', color: 'text-purple-400', label: 'License Extended' },
  
  // Package management
  create_package: { icon: '📦', color: 'text-yellow-400', label: 'Package Created' },
  update_package: { icon: '✏️', color: 'text-orange-400', label: 'Package Updated' },
  delete_package: { icon: '🗑️', color: 'text-red-400', label: 'Package Deleted' },
  
  // Hotel management
  create_hotel: { icon: '🏨', color: 'text-emerald-400', label: 'Hotel Created' },
  update_hotel: { icon: '🏢', color: 'text-blue-400', label: 'Hotel Updated' },
  
  // Payment
  payment_success: { icon: '💰', color: 'text-green-400', label: 'Payment Success' },
  payment_failed: { icon: '💸', color: 'text-red-400', label: 'Payment Failed' },
  
  // Settings
  settings_change: { icon: '⚙️', color: 'text-gray-400', label: 'Settings Changed' },
  permission_change: { icon: '🔐', color: 'text-yellow-400', label: 'Permissions Changed' },
};

export default function SecurityPage() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  useEffect(() => {
    const loadAudit = async () => {
      try {
        const response = await fetchAudit();
        setAuditLog(response.data);
      } finally {
        setLoading(false);
      }
    };

    loadAudit();
  }, []);

  // Get unique actions for filter
  const uniqueActions = useMemo(() => {
    const actions = new Set(auditLog.map(entry => entry.action));
    return Array.from(actions).sort();
  }, [auditLog]);

  // Filter audit log
  const filteredAudit = useMemo(() => {
    let filtered = [...auditLog];

    // Filter by action
    if (selectedAction !== 'all') {
      filtered = filtered.filter(entry => entry.action === selectedAction);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.actor?.toLowerCase().includes(search) ||
        entry.target?.toLowerCase().includes(search) ||
        entry.details?.toLowerCase().includes(search) ||
        entry.ipAddress?.toLowerCase().includes(search) ||
        entry.location?.toLowerCase().includes(search)
      );
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(entry => 
        new Date(entry.createdAt) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(entry => 
        new Date(entry.createdAt) <= endDate
      );
    }

    // Sort by most recent first
    filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return filtered;
  }, [auditLog, selectedAction, searchTerm, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredAudit.length / pageSize));
  const pagedAudit = useMemo(
    () => filteredAudit.slice((page - 1) * pageSize, page * pageSize),
    [filteredAudit, page],
  );

  const handleActionChange = (action: string) => {
    setSelectedAction(action);
    setPage(1);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionConfig = (action: string) => {
    return actionConfig[action] || { icon: '📋', color: 'text-gray-400', label: action };
  };

  // Statistics
  const stats = useMemo(() => {
    const total = filteredAudit.length;
    const uniqueIPs = new Set(filteredAudit.map(entry => entry.ipAddress)).size;
    const today = new Date().toDateString();
    const todayEvents = filteredAudit.filter(entry => 
      new Date(entry.createdAt).toDateString() === today
    ).length;
    
    return { total, uniqueIPs, todayEvents };
  }, [filteredAudit]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">
        Loading security audit data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Security Audit Log</h1>
            <p className="mt-2 text-sm text-slate-400">
              Complete audit trail of all system activities including IP tracking and user actions
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-cyan-400">{stats.total}</div>
            <div className="text-xs text-slate-500">Total Events</div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm text-slate-400">Total Events</p>
              <p className="text-2xl font-semibold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div>
              <p className="text-sm text-slate-400">Unique IP Addresses</p>
              <p className="text-2xl font-semibold text-white">{stats.uniqueIPs}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-sm text-slate-400">Today's Events</p>
              <p className="text-2xl font-semibold text-white">{stats.todayEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by actor, target, IP, location, or details..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Action Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleActionChange('all')}
                className={`rounded-xl px-3 py-1.5 text-sm transition ${
                  selectedAction === 'all'
                    ? 'bg-cyan-500 text-white'
                    : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                }`}
              >
                All Actions
              </button>
              {uniqueActions.map((action) => {
                const config = getActionConfig(action);
                return (
                  <button
                    key={action}
                    onClick={() => handleActionChange(action)}
                    className={`rounded-xl px-3 py-1.5 text-sm transition ${
                      selectedAction === action
                        ? 'bg-cyan-500 text-white'
                        : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {config.icon} {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">From Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">To Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="text-right text-sm text-slate-400">
            Showing {pagedAudit.length} of {filteredAudit.length} events
          </div>
        </div>
      </div>

      {/* Audit Log Entries */}
      <div className="space-y-4">
        {pagedAudit.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-12 text-center text-slate-400">
            No audit records found matching your criteria
          </div>
        ) : (
          pagedAudit.map((entry) => {
            const config = getActionConfig(entry.action);
            return (
              <div
                key={entry.id}
                className="group rounded-3xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-700 hover:bg-slate-900/90 cursor-pointer"
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <p className={`text-lg font-semibold ${config.color}`}>
                          {config.label}
                        </p>
                        <p className="text-sm text-slate-400">
                          {entry.details || 'No additional details'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-500">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>

                  {/* Actor and Target Info */}
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-950/70 p-3">
                      <p className="text-xs text-slate-500">ACTOR</p>
                      <p className="font-medium text-white">{entry.actor || 'System'}</p>
                      {entry.actorRole && (
                        <span className="mt-1 inline-block rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
                          Role: {entry.actorRole}
                        </span>
                      )}
                    </div>
                    <div className="rounded-2xl bg-slate-950/70 p-3">
                      <p className="text-xs text-slate-500">TARGET</p>
                      <p className="font-medium text-white">{entry.target || 'Global'}</p>
                    </div>
                  </div>

                  {/* IP and Location Info */}
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-950/70 p-3">
                      <p className="text-xs text-slate-500">IP ADDRESS</p>
                      <p className="font-mono text-white">{entry.ipAddress || 'Unknown'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/70 p-3">
                      <p className="text-xs text-slate-500">LOCATION</p>
                      <p className="text-white">{entry.location || 'Unknown'}</p>
                    </div>
                  </div>

                  {/* Additional Metadata */}
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {entry.method && (
                      <span className="rounded-full bg-slate-800 px-2 py-1">
                        Method: {entry.method}
                      </span>
                    )}
                    {entry.endpoint && (
                      <span className="rounded-full bg-slate-800 px-2 py-1">
                        Endpoint: {entry.endpoint}
                      </span>
                    )}
                    {entry.userAgent && (
                      <span className="rounded-full bg-slate-800 px-2 py-1">
                        {entry.userAgent.substring(0, 50)}...
                      </span>
                    )}
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEntry(entry);
                    }}
                    className="mt-2 rounded-xl bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400 transition hover:bg-cyan-500/20"
                  >
                    View Full Details →
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400 sm:flex-row">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-3xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded-3xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Detailed View */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Audit Event Details</h2>
              <button
                onClick={() => setSelectedEntry(null)}
                className="rounded-xl bg-slate-800 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">EVENT ID</p>
                <p className="font-mono text-white">{selectedEntry.id}</p>
              </div>

              <div className="rounded-2xl bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">ACTION</p>
                <p className="text-white">{selectedEntry.action}</p>
              </div>

              <div className="rounded-2xl bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">DETAILS</p>
                <p className="text-white whitespace-pre-wrap">{selectedEntry.details || 'No details'}</p>
              </div>

              <div className="rounded-2xl bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">ACTOR INFO</p>
                <div className="mt-2 space-y-1">
                  <p><span className="text-slate-400">Name:</span> {selectedEntry.actor || 'Unknown'}</p>
                  <p><span className="text-slate-400">Role:</span> {selectedEntry.actorRole || 'Unknown'}</p>
                  <p><span className="text-slate-400">Actor ID:</span> {selectedEntry.actorId || 'N/A'}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">TARGET INFO</p>
                <div className="mt-2 space-y-1">
                  <p><span className="text-slate-400">Target:</span> {selectedEntry.target || 'Global'}</p>
                  <p><span className="text-slate-400">Target ID:</span> {selectedEntry.targetId || 'N/A'}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">NETWORK INFO</p>
                <div className="mt-2 space-y-1">
                  <p><span className="text-slate-400">IP Address:</span> <span className="font-mono">{selectedEntry.ipAddress || 'Unknown'}</span></p>
                  <p><span className="text-slate-400">Location:</span> {selectedEntry.location || 'Unknown'}</p>
                  <p><span className="text-slate-400">User Agent:</span> <span className="break-all">{selectedEntry.userAgent || 'Unknown'}</span></p>
                  <p><span className="text-slate-400">Method:</span> {selectedEntry.method || 'Unknown'}</p>
                  <p><span className="text-slate-400">Endpoint:</span> {selectedEntry.endpoint || 'Unknown'}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/70 p-4">
                <p className="text-xs text-slate-500">TIMESTAMP</p>
                <p className="text-white">{formatDate(selectedEntry.createdAt)}</p>
              </div>

              {selectedEntry.oldData && (
                <div className="rounded-2xl bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-500">OLD DATA</p>
                  <pre className="mt-2 overflow-x-auto text-xs text-white">
                    {JSON.stringify(selectedEntry.oldData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedEntry.newData && (
                <div className="rounded-2xl bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-500">NEW DATA</p>
                  <pre className="mt-2 overflow-x-auto text-xs text-white">
                    {JSON.stringify(selectedEntry.newData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}