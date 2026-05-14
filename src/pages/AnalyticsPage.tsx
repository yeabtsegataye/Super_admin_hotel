import { useEffect, useState } from 'react';
import { fetchSummary, fetchPackages, fetchPayments } from '../services/authService';
import type { SummaryStats, PackageItem, PaymentRecord } from '../types';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [summaryResponse, packagesResponse, paymentsResponse] = await Promise.all([
          fetchSummary(),
          fetchPackages(),
          fetchPayments(),
        ]);
        setSummary(summaryResponse.data);
        setPackages(packagesResponse.data);
        setPayments(paymentsResponse.data.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="mt-2 text-sm text-slate-400">Business insights and top-performing packages.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">Loading analytics…</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-lg font-semibold text-white">Key metrics</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {summary ? (
                [
                  { label: 'Revenue', value: `$${summary.totalRevenue.toLocaleString()}` },
                  { label: 'Subscriptions', value: summary.activeSubscriptions.toString() },
                  { label: 'Blocked Users', value: summary.blockedUsers.toString() },
                  { label: 'Orders', value: summary.totalOrders.toString() },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl bg-slate-950/70 p-4">
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No analytics data available.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-lg font-semibold text-white">Active packages</h2>
            <div className="mt-5 space-y-4">
              {packages.map((pack) => (
                <div key={pack.id} className="rounded-3xl bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{pack.name}</p>
                      <p className="text-sm text-slate-400">{pack.description}</p>
                    </div>
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm text-cyan-200">{pack.activeSubscribers} subscribers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="text-lg font-semibold text-white">Recent payment activity</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-800 hover:bg-slate-950/60">
                  <td className="px-4 py-4">{payment.transactionId}</td>
                  <td className="px-4 py-4 text-white">${payment.amount.toFixed(2)}</td>
                  <td className="px-4 py-4">{payment.packageName}</td>
                  <td className="px-4 py-4">{payment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
