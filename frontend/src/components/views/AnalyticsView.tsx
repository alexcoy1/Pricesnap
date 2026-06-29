import React, { useMemo, useState } from 'react';
import { AppView, QuoteData } from '../../types';

interface Props {
  quotes: QuoteData[];
  onOpenQuote: (quote: QuoteData) => void;
  onViewAllHistory: () => void;
}

export const AnalyticsView: React.FC<Props> = ({ quotes, onOpenQuote, onViewAllHistory }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() =>
    statusFilter === 'all' ? quotes : quotes.filter((q) => q.status.toLowerCase() === statusFilter),
  [quotes, statusFilter]);

  const total = filtered.reduce((s, q) => s + q.overallTotalPrice, 0);
  const profit = filtered.reduce((s, q) => s + q.overallProfit, 0);
  const avg = filtered.length ? total / filtered.length : 0;

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    quotes.forEach((q) => { map[q.status] = (map[q.status] || 0) + 1; });
    return map;
  }, [quotes]);

  const exportCsv = () => {
    const rows = [['Customer', 'Date', 'Total', 'Profit', 'Status', 'Items']];
    filtered.forEach((q) => {
      rows.push([
        q.customerName || '',
        new Date(q.createdAt).toLocaleDateString(),
        q.overallTotalPrice.toFixed(2),
        q.overallProfit.toFixed(2),
        q.status,
        String(q.lines.length),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pricesnap-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="view-heading">Analytics</h2>
          <p className="view-subheading">Sales performance and quote insights</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={!filtered.length}>Export CSV</button>
          <button type="button" className="btn btn-secondary" onClick={onViewAllHistory}>Quote History</button>
        </div>
      </div>

      <div className="grid-4" style={{ marginTop: 24 }}>
        <div className="stat-card"><div className="stat-value">{filtered.length}</div><div className="stat-label">Quotes</div></div>
        <div className="stat-card"><div className="stat-value">${Math.round(total).toLocaleString()}</div><div className="stat-label">Revenue</div></div>
        <div className="stat-card"><div className="stat-value">${Math.round(profit).toLocaleString()}</div><div className="stat-label">Profit</div></div>
        <div className="stat-card"><div className="stat-value">${Math.round(avg).toLocaleString()}</div><div className="stat-label">Avg Quote</div></div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 12, fontWeight: 600 }}>By Status</h3>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button type="button" className={`chip${statusFilter === 'all' ? ' active' : ''}`} onClick={() => setStatusFilter('all')}>All ({quotes.length})</button>
          {Object.entries(byStatus).map(([status, count]) => (
            <button
              key={status}
              type="button"
              className={`chip${statusFilter === status.toLowerCase() ? ' active' : ''}`}
              onClick={() => setStatusFilter(status.toLowerCase())}
            >
              {status} ({count})
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Recent Activity</h3>
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No quote data for this filter.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Customer</th><th>Date</th><th>Total</th><th>Profit</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.slice(0, 15).map((q) => (
                <tr key={q.id}>
                  <td>{q.customerName || '—'}</td>
                  <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td>${q.overallTotalPrice.toFixed(2)}</td>
                  <td>${q.overallProfit.toFixed(2)}</td>
                  <td><span className={`badge badge-${q.status.toLowerCase()}`}>{q.status}</span></td>
                  <td>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenQuote(q)}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
