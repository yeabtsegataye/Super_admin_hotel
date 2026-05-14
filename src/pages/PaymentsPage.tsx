import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchPayments } from '../services/authService';
import type { PaymentRecord } from '../types';

const pageSize = 15;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const response = await fetchPayments();
        setPayments(response.data);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [search]);

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) =>
        [payment.transactionId, payment.packageName, payment.userEmail, payment.userName, payment.hotelName, payment.status]
          .join(' ')
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [payments, search],
  );

  const displayedPayments = filteredPayments.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredPayments.length;

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && canLoadMore) {
          setVisibleCount((current) => Math.min(current + pageSize, filteredPayments.length));
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, filteredPayments.length]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Payments</h1>
        <p className="mt-2 text-sm text-slate-400">View transaction IDs, hotel names, and search through payments.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <label className="block text-sm font-medium text-slate-300">
            Search payments
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Transaction, package, user email, hotel, status"
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
            />
          </label>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-right text-sm text-slate-400">
          {filteredPayments.length} payments found
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">Loading payments…</div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Hotel</th>
                <th className="px-4 py-3">Subscriber</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-800 hover:bg-slate-950/60">
                  <td className="px-4 py-4">{new Date(payment.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-4 text-white">${payment.amount.toFixed(2)}</td>
                  <td className="px-4 py-4">{payment.transactionId}</td>
                  <td className="px-4 py-4">{payment.hotelName}</td>
                  <td className="px-4 py-4">{payment.userEmail}</td>
                  <td className="px-4 py-4">{payment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div ref={loaderRef} className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-4 text-center text-sm text-slate-400">
            {canLoadMore ? 'Scroll to load more payments…' : 'All matching payments loaded.'}
          </div>
        </div>
      )}
    </div>
  );
}
