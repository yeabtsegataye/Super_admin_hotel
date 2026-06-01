import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPayments } from '../services/authService';
import type { PaymentRecord } from '../types';

const PAGE_SIZE = 15;

interface PaymentsResponse {
  data: PaymentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Debounce search so we don't fire a request on every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (p: number, order: 'ASC' | 'DESC', q: string) => {
      setLoading(true);
      try {
        const res = await fetchPayments(p, PAGE_SIZE, order, q);
        const body: PaymentsResponse = res.data;
        setPayments(body.data);
        setTotal(body.total);
        setTotalPages(body.totalPages);
        setPage(body.page);
      } catch {
        // keep previous data on error
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Initial load + re-load when page or sortOrder changes
  useEffect(() => {
    load(page, sortOrder, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortOrder]);

  // Debounced search — resets to page 1 on every new query
  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load(1, sortOrder, value);
    }, 400);
  };

  const toggleSort = () => {
    const next = sortOrder === 'DESC' ? 'ASC' : 'DESC';
    setSortOrder(next);
    setPage(1);
  };

  const goTo = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  // Build a compact page-number list: always show first, last, current ±1, with ellipsis
  const pageNumbers = (): (number | '…')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set([1, totalPages, page, page - 1, page + 1].filter((n) => n >= 1 && n <= totalPages));
    const sorted = Array.from(set).sort((a, b) => a - b);
    const result: (number | '…')[] = [];
    sorted.forEach((n, i) => {
      if (i > 0 && n - (sorted[i - 1] as number) > 1) result.push('…');
      result.push(n);
    });
    return result;
  };

  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <h1 className="text-2xl font-semibold text-white">Payments</h1>
        <p className="mt-2 text-sm text-slate-400">
          Browse transactions — newest first by default.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by email, transaction, package…"
          className="flex-1 min-w-[220px] rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder-slate-500 focus:border-slate-500"
        />

        <button
          onClick={toggleSort}
          className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition"
        >
          {sortOrder === 'DESC' ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10 4l-4 4m0 0l-4-4m4 4V8" />
              </svg>
              Newest first
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10-8l-4-4m0 0l-4 4m4-4v12" />
              </svg>
              Oldest first
            </>
          )}
        </button>

        <span className="ml-auto text-sm text-slate-400">
          {total > 0 ? `${first}–${last} of ${total}` : '0 results'}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/80">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No payments found.</div>
        ) : (
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Transaction ID</th>
                <th className="px-5 py-3">Hotel</th>
                <th className="px-5 py-3">Subscriber</th>
                <th className="px-5 py-3">Package</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-slate-800/60 hover:bg-slate-950/50 transition"
                >
                  <td className="px-5 py-4 whitespace-nowrap text-slate-400">
                    {new Date(payment.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 font-medium text-white whitespace-nowrap">
                    ETB {Number(payment.amount).toFixed(2)}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-400 max-w-[180px] truncate">
                    {payment.transactionId}
                  </td>
                  <td className="px-5 py-4">{payment.hotelName}</td>
                  <td className="px-5 py-4">{payment.userEmail}</td>
                  <td className="px-5 py-4">{payment.packageName}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        payment.status === 'success'
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : 'bg-red-900/60 text-red-300'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 flex-wrap">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
          >
            ← Prev
          </button>

          {pageNumbers().map((n, i) =>
            n === '…' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-slate-500 select-none">
                …
              </span>
            ) : (
              <button
                key={n}
                onClick={() => goTo(n as number)}
                className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                  n === page
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {n}
              </button>
            ),
          )}

          <button
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
