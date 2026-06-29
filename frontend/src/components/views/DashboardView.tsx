import React from 'react';
import { QuoteData, User, AppView } from '../../types';

interface Props {
  quotes: QuoteData[];
  currentUser: User;
  onNavigate: (view: AppView) => void;
}

export const DashboardView: React.FC<Props> = ({ quotes, currentUser, onNavigate }) => {
  const totalValue = quotes.reduce((s, q) => s + q.overallTotalPrice, 0);
  const draftCount = quotes.filter((q) => q.status === 'Draft').length;
  const recent = quotes.slice(0, 5);

  return (
    <div>
      <p style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
        Welcome back, {currentUser.displayName}!
      </p>
      <div className="grid-4 mb-6">
        <div className="stat-card">
          <div className="stat-value">{quotes.length}</div>
          <div className="stat-label">Total Quotes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="stat-label">Total Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{draftCount}</div>
          <div className="stat-label">Drafts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{quotes.length ? Math.round(totalValue / quotes.length) : 0}</div>
          <div className="stat-label">Avg Quote Value</div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button className="btn btn-primary" onClick={() => onNavigate(AppView.INPUT_FORM)}>+ New Quote</button>
        <button className="btn btn-secondary" onClick={() => onNavigate(AppView.QUOTE_HISTORY)}>View History</button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Recent Quotes</h3>
        {recent.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No quotes yet. Create your first quote!</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recent.map((q) => (
                <tr key={q.id}>
                  <td>{q.customerName || '—'}</td>
                  <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td>{q.lines.length}</td>
                  <td>${q.overallTotalPrice.toFixed(2)}</td>
                  <td><span className={`badge badge-${q.status.toLowerCase()}`}>{q.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
