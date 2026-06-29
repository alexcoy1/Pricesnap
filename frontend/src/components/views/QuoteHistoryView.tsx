import React, { useState } from 'react';
import { QuoteData, User } from '../../types';

interface Props {
  quotes: QuoteData[];
  onViewQuote: (quote: QuoteData) => void;
  onDuplicateQuote: (quote: QuoteData) => void;
  onDeleteQuote: (quoteId: string) => void;
  currentUser: User;
}

export const QuoteHistoryView: React.FC<Props> = ({ quotes, onViewQuote, onDuplicateQuote, onDeleteQuote }) => {
  const [search, setSearch] = useState('');

  const filtered = quotes.filter((q) =>
    !search || (q.customerName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div>
      <div className="form-group" style={{ maxWidth: 400 }}>
        <input
          className="form-input"
          placeholder="Search by customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No quotes found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Profit</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}>
                  <td>{q.customerName || '—'}</td>
                  <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td>{q.lines.length}</td>
                  <td>${q.overallTotalPrice.toFixed(2)}</td>
                  <td>${q.overallProfit.toFixed(2)} ({q.overallProfitMargin.toFixed(1)}%)</td>
                  <td><span className={`badge badge-${q.status.toLowerCase()}`}>{q.status}</span></td>
                  <td className="flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={() => onViewQuote(q)}>View</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => onDuplicateQuote(q)}>Duplicate</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDeleteQuote(q.id)}>Delete</button>
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
