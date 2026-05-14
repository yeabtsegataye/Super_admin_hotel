import { useEffect, useMemo, useState } from 'react';
import { fetchSummary, fetchSubscribers } from '../services/authService';
import type { SummaryStats, SubscriberRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function OverviewPage() {
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [summaryResponse, subscribersResponse] = await Promise.all([
          fetchSummary(),
          fetchSubscribers(),
        ]);

        setSummary(summaryResponse.data);
        setSubscribers(subscribersResponse.data);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const pieData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Active', value: summary.activeSubscriptions, color: '#06b6d4' },
      { name: 'Expired', value: summary.expiredLicenses, color: '#ef4444' },
    ];
  }, [summary]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Active Subscriptions', value: summary.activeSubscriptions, color: '#06b6d4' },
      { name: 'Expired Licenses', value: summary.expiredLicenses, color: '#ef4444' },
      { name: 'Blocked Users', value: summary.blockedUsers, color: '#f59e0b' },
      { name: 'Active Hotels', value: summary.activeHotels, color: '#10b981' },
    ];
  }, [summary]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Overview</h1>
        <p className="mt-2 text-sm text-slate-400">Live system analytics with charts, subscriber hotel data, and near-expiry alerts.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">Loading overview…</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 md:grid-cols-2">
              {summary ? (
                [
                  { label: 'Total Revenue', value: `$${summary.totalRevenue.toLocaleString()}`, color: 'text-green-400' },
                  { label: 'Active Subscriptions', value: summary.activeSubscriptions.toString(), color: 'text-cyan-400' },
                  { label: 'Expired Hotels', value: summary.expiredLicenses.toString(), color: 'text-red-400' },
                  { label: 'Active Hotels', value: summary.activeHotels.toString(), color: 'text-emerald-400' },
                  { label: 'Blocked Users', value: summary.blockedUsers.toString(), color: 'text-amber-400' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">{stat.label}</p>
                    <p className={`mt-4 text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-400">No summary data available.</div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Subscription status</p>
              <div className="mt-5 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-cyan-500"></div>
                  <span className="text-slate-400">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-slate-400">Expired</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">System Metrics Overview</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '0.75rem',
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.65fr_0.35fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Active Subscribers</h2>
                  <p className="mt-2 text-sm text-slate-400">Recent subscriber hotel and email details.</p>
                </div>
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm text-cyan-200">{subscribers.length} records</span>
              </div>

              <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/70">
                <table className="min-w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Hotel</th>
                      <th className="px-4 py-3">Subscriber</th>
                      <th className="px-4 py-3">Package</th>
                      <th className="px-4 py-3">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.slice(0, 6).map((subscriber) => (
                      <tr key={`${subscriber.userEmail}-${subscriber.hotelName}`} className="border-b border-slate-800 hover:bg-slate-950/60">
                        <td className="px-4 py-4 text-white">{subscriber.hotelName}</td>
                        <td className="px-4 py-4">{subscriber.userEmail}</td>
                        <td className="px-4 py-4">{subscriber.packageName}</td>
                        <td className="px-4 py-4 text-slate-200">
                          {subscriber.expiryDate ? new Date(subscriber.expiryDate).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-lg font-semibold text-white">Expired Licenses</h2>
              <p className="mt-2 text-sm text-slate-400">Hotels with expired subscription licenses.</p>
              <div className="mt-5 space-y-3">
                {summary?.expiredHotels && summary.expiredHotels.length ? (
                  summary.expiredHotels.slice(0, 5).map((expired, index) => (
                    <div key={`${expired.userEmail}-${expired.hotelName}-${index}`} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                      <p className="font-semibold text-white">{expired.hotelName}</p>
                      <p className="text-sm text-slate-400">{expired.userEmail}</p>
                      <p className="mt-1 text-sm text-red-300">Expired: {expired.expiryDate ? new Date(expired.expiryDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No expired licenses found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
