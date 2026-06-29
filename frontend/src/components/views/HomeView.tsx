import React from 'react';
import { QuoteData, User, AppView } from '../../types';

interface Props {
  quotes: QuoteData[];
  currentUser: User;
  catalogLoaded: boolean;
  catalogCount: number;
  onNavigate: (view: AppView) => void;
  onOpenQuote: (quote: QuoteData) => void;
}

export const HomeView: React.FC<Props> = ({
  quotes,
  currentUser,
  catalogLoaded,
  catalogCount,
  onNavigate,
  onOpenQuote,
}) => {
  const totalValue = quotes.reduce((s, q) => s + q.overallTotalPrice, 0);
  const sentCount = quotes.filter((q) => q.status === 'Sent' || q.status === 'Approved').length;
  const recent = quotes.slice(0, 5);
  const isNewUser = quotes.length === 0;

  return (
    <div className="home-view">
      <header className="home-hero">
        <p className="home-eyebrow">Good {getGreeting()}</p>
        <h1 className="home-title">{currentUser.displayName}</h1>
        <p className="home-subtitle">
          {isNewUser
            ? 'Your workspace is ready. Create your first quote in under a minute.'
            : `${quotes.length} quotes · $${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} pipeline`}
        </p>
      </header>

      {isNewUser && (
        <div className="home-onboarding card">
          <h3>Quick start</h3>
          <ol className="home-steps">
            <li className={catalogLoaded ? 'done' : ''}>
              <span className="step-num">1</span>
              <div>
                <strong>Catalog loaded</strong>
                <p>{catalogLoaded ? `${catalogCount} items in Sample Catalog` : 'Loading your price list…'}</p>
              </div>
            </li>
            <li>
              <span className="step-num">2</span>
              <div>
                <strong>Describe a quote</strong>
                <p>Try: <code>cub sig, spaboy, spaboy starter</code></p>
              </div>
            </li>
            <li>
              <span className="step-num">3</span>
              <div>
                <strong>Send a branded PDF</strong>
                <p>Internal view shows margin before you share</p>
              </div>
            </li>
          </ol>
        </div>
      )}

      <div className="home-stats">
        <div className="home-stat">
          <span className="home-stat-value">{quotes.length}</span>
          <span className="home-stat-label">Quotes</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-value">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          <span className="home-stat-label">Pipeline</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-value">{sentCount}</span>
          <span className="home-stat-label">Sent / Approved</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-value">{catalogCount}</span>
          <span className="home-stat-label">Catalog items</span>
        </div>
      </div>

      <div className="home-actions">
        <button type="button" className="home-action-card home-action-primary" onClick={() => onNavigate(AppView.INPUT_FORM)}>
          <span className="home-action-icon">+</span>
          <span className="home-action-label">New Quote</span>
          <span className="home-action-desc">Identify items from plain language</span>
        </button>
        <button type="button" className="home-action-card" onClick={() => onNavigate(AppView.CUSTOMERS)}>
          <span className="home-action-icon">◎</span>
          <span className="home-action-label">Customers</span>
          <span className="home-action-desc">Manage contacts & history</span>
        </button>
        <button type="button" className="home-action-card" onClick={() => onNavigate(AppView.ANALYTICS)}>
          <span className="home-action-icon">◫</span>
          <span className="home-action-label">Analytics</span>
          <span className="home-action-desc">Team performance & activity</span>
        </button>
        <button type="button" className="home-action-card" onClick={() => onNavigate(AppView.COMPANY_BRANDING)}>
          <span className="home-action-icon">◇</span>
          <span className="home-action-label">Branding</span>
          <span className="home-action-desc">Logo, colors, PDF styling</span>
        </button>
      </div>

      <section className="card home-recent">
        <div className="home-recent-header">
          <h3>Recent quotes</h3>
          {quotes.length > 0 && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate(AppView.QUOTE_HISTORY)}>
              View all
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="home-empty">No quotes yet. Start with <button type="button" className="link-btn" onClick={() => onNavigate(AppView.INPUT_FORM)}>New Quote</button>.</p>
        ) : (
          <table className="table home-table">
            <thead>
              <tr><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {recent.map((q) => (
                <tr key={q.id}>
                  <td>{q.customerName || '—'}</td>
                  <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td>{q.lines.length}</td>
                  <td>${q.overallTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td><span className={`badge badge-${q.status.toLowerCase()}`}>{q.status}</span></td>
                  <td>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenQuote(q)}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
