import { useEffect, useMemo, useState } from 'react';
import { fetchSummary, fetchSubscribers, fetchExpiredLicensesDetailed, fetchUsers } from '../services/authService';
import type { SummaryStats, SubscriberRecord, ExpiredLicenseRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function OverviewPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [expiredLicenses, setExpiredLicenses] = useState<ExpiredLicenseRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [summaryResponse, subscribersResponse, expiredResponse, usersResponse] = await Promise.all([
          fetchSummary(),
          fetchSubscribers(),
          fetchExpiredLicensesDetailed(),
          fetchUsers(),
        ]);

        setSummary(summaryResponse.data);
        setSubscribers(subscribersResponse.data || []);
        setExpiredLicenses(expiredResponse.data || []);
        setTotalUsers(usersResponse.data?.length || 0);
      } catch (error) {
        console.error('Failed to load overview data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  // Prepare pie chart data for subscription distribution
  const pieData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Active Subscriptions', value: summary.activeSubscriptions || 0, color: '#06b6d4' },
      { name: 'Expired Licenses', value: summary.expiredLicenses || 0, color: '#ef4444' },
    ];
  }, [summary]);

  // Prepare bar chart data
  const barChartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Total Users', value: totalUsers, color: '#8b5cf6' },
      { name: 'Active Subscriptions', value: summary.activeSubscriptions || 0, color: '#06b6d4' },
      { name: 'Expired Licenses', value: summary.expiredLicenses || 0, color: '#ef4444' },
      { name: 'Blocked Users', value: summary.blockedUsers || 0, color: '#f59e0b' },
      { name: 'Active Hotels', value: summary.activeHotels || 0, color: '#10b981' },
      { name: 'Total Hotels', value: summary.totalHotels || 0, color: '#6366f1' },
    ];
  }, [summary, totalUsers]);

  // Prepare revenue trend data (mock for now - you can replace with real data)
  const revenueData = useMemo(() => {
    if (!summary) return [];
    // This would ideally come from your backend with monthly breakdown
    return [
      { month: 'Jan', revenue: Math.floor(summary.totalRevenue * 0.1) },
      { month: 'Feb', revenue: Math.floor(summary.totalRevenue * 0.15) },
      { month: 'Mar', revenue: Math.floor(summary.totalRevenue * 0.2) },
      { month: 'Apr', revenue: Math.floor(summary.totalRevenue * 0.25) },
      { month: 'May', revenue: Math.floor(summary.totalRevenue * 0.3) },
      { month: 'Jun', revenue: Math.floor(summary.totalRevenue * 0.35) },
    ];
  }, [summary]);

  const statCards = useMemo(() => {
    if (!summary) return [];
    return [
      { 
        label: 'Total Revenue', 
        value: `ETB ${summary.totalRevenue?.toLocaleString() || 0}`, 
        color: 'text-green-400',
        icon: '💰',
        change: '+12%',
        changeColor: 'text-green-400'
      },
      { 
        label: 'Active Subscriptions', 
        value: summary.activeSubscriptions?.toString() || '0', 
        color: 'text-cyan-400',
        icon: '✅',
        change: '+5%',
        changeColor: 'text-green-400'
      },
      { 
        label: 'Expired Licenses', 
        value: summary.expiredLicenses?.toString() || '0', 
        color: 'text-red-400',
        icon: '⚠️',
        change: '+8%',
        changeColor: 'text-red-400'
      },
      { 
        label: 'Active Hotels', 
        value: summary.activeHotels?.toString() || '0', 
        color: 'text-emerald-400',
        icon: '🏨',
        change: '+3%',
        changeColor: 'text-green-400'
      },
      { 
        label: 'Total Hotels', 
        value: summary.totalHotels?.toString() || '0', 
        color: 'text-blue-400',
        icon: '🏢',
        change: '+2%',
        changeColor: 'text-green-400'
      },
      { 
        label: 'Blocked Users', 
        value: summary.blockedUsers?.toString() || '0', 
        color: 'text-amber-400',
        icon: '🚫',
        change: '-2%',
        changeColor: 'text-green-400'
      },
    ];
  }, [summary]);

  const handleViewAllSubscribers = () => {
    navigate('/payments');
  };

  const handleViewAllExpired = () => {
    navigate('/users/expired');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="h-8 w-48 animate-pulse rounded-2xl bg-slate-800"></div>
          <div className="mt-2 h-4 w-64 animate-pulse rounded-xl bg-slate-800"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="h-4 w-24 animate-pulse rounded-xl bg-slate-800"></div>
              <div className="mt-4 h-8 w-32 animate-pulse rounded-xl bg-slate-800"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950/70 to-slate-900/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-slate-400">
          Real-time system analytics, subscription metrics, and license management insights.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="group rounded-3xl border border-slate-800 bg-slate-900/80 p-6 transition hover:border-slate-700 hover:bg-slate-900/90">
            <div className="flex items-start justify-between">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">{stat.label}</p>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className={`mt-4 text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-xs ${stat.changeColor}`}>{stat.change}</span>
              <span className="text-xs text-slate-500">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Bar Chart */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">System Metrics Overview</h2>
              <p className="text-sm text-slate-400">Key performance indicators at a glance</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} angle={-25} textAnchor="end" height={60} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '0.75rem',
                    color: '#f1f5f9',
                  }}
                  cursor={{ fill: '#334155' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">Revenue Trend</h2>
            <p className="text-sm text-slate-400">Monthly revenue progression (ETB)</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '0.75rem',
                  }}
                  formatter={(value) => [`ETB ${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Subscription Distribution */}
      <div className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Subscribers</h2>
              <p className="text-sm text-slate-400">Latest active subscriptions with expiry dates</p>
            </div>
            <button
              onClick={handleViewAllSubscribers}
              className="rounded-xl bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-400 transition hover:bg-cyan-500/20"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/70">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Hotel</th>
                  <th className="px-4 py-3">Subscriber</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No subscribers found
                    </td>
                  </tr>
                ) : (
                  subscribers.slice(0, 8).map((subscriber, idx) => {
                    const isExpired = subscriber.expiryDate && new Date(subscriber.expiryDate) < new Date();
                    return (
                      <tr key={`${subscriber.userEmail}-${idx}`} className="border-b border-slate-800 hover:bg-slate-950/60">
                        <td className="px-4 py-4 font-medium text-white">{subscriber.hotelName}</td>
                        <td className="px-4 py-4">{subscriber.userEmail}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-400">
                            {subscriber.packageName}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={isExpired ? 'text-red-400' : 'text-slate-200'}>
                            {subscriber.expiryDate ? new Date(subscriber.expiryDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {isExpired ? (
                            <span className="inline-flex rounded-full bg-red-900/50 px-2 py-1 text-xs text-red-300">Expired</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-green-900/50 px-2 py-1 text-xs text-green-300">Active</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie Chart - Subscription Distribution */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-lg font-semibold text-white">License Distribution</h2>
          <p className="text-sm text-slate-400">Active vs Expired licenses</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '0.75rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-cyan-500"></div>
              <span className="text-slate-300">Active: {summary?.activeSubscriptions || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-slate-300">Expired: {summary?.expiredLicenses || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expired Licenses Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Recently Expired Licenses</h2>
            <p className="text-sm text-slate-400">Hotels with expired subscriptions needing attention</p>
          </div>
          <button
            onClick={handleViewAllExpired}
            className="rounded-xl bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/20"
          >
            View All Expired
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {expiredLicenses.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-center text-slate-400">
              No expired licenses found. All subscriptions are active!
            </div>
          ) : (
            expiredLicenses.slice(0, 4).map((expired, index) => (
              <div
                key={`${expired.userEmail}-${index}`}
                className="group cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-red-500/50 hover:bg-slate-900/80"
                onClick={() => navigate(`/users/${expired.userId}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-white group-hover:text-red-400">{expired.hotelName}</p>
                    <p className="mt-1 text-sm text-slate-400">{expired.userEmail}</p>
                    {expired.phone && expired.phone !== 'N/A' && (
                      <p className="mt-1 text-xs text-slate-500">📞 {expired.phone}</p>
                    )}
                  </div>
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="mt-3 rounded-2xl bg-red-500/10 p-2">
                  <p className="text-xs text-red-400">
                    Expired: {new Date(expired.expiryDate).toLocaleDateString()}
                  </p>
                  {expired.daysExpired && (
                    <p className="text-xs text-red-400">
                      {Math.abs(expired.daysExpired)} days ago
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/users/${expired.userId}`);
                  }}
                  className="mt-3 w-full rounded-xl bg-cyan-500/10 px-3 py-2 text-xs text-cyan-400 transition hover:bg-cyan-500/20"
                >
                  Renew License →
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}