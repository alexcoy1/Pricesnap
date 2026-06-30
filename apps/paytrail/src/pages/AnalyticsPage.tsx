import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics, type AnalyticsSummary } from '../services/dataService';
import { formatMoney } from '../utils/commission';

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getAnalytics()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const maxMonth = data?.byMonth.length
    ? Math.max(...data.byMonth.map((m) => m.total), 1)
    : 1;

  return (
    <>
      <div className="page-head">
        <h1>Analytics</h1>
        <p className="page-sub">
          Payout totals for reps and owners — monthly trends, top accounts, and run history.
        </p>
      </div>

      {loading && <p className="muted">Loading analytics…</p>}
      {error && <p className="alert alert-error">{error}</p>}

      {data && (
        <>
          <div className="analytics-stats">
            <div className="stat-card">
              <span className="stat-label">All-time commission</span>
              <span className="stat-value-lg">{formatMoney(data.totalCommission)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">This month</span>
              <span className="stat-value-lg">{formatMoney(data.monthCommission)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Runs this month</span>
              <span className="stat-value-lg">{data.monthRunCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Avg per run</span>
              <span className="stat-value-lg">{formatMoney(data.avgCommission)}</span>
            </div>
          </div>

          <div className="analytics-grid">
            <section className="panel">
              <h2>Commission by month</h2>
              {data.byMonth.length === 0 ? (
                <p className="muted">No runs yet. <Link to="/app">Calculate your first commission</Link>.</p>
              ) : (
                <div className="bar-chart">
                  {data.byMonth.map((m) => (
                    <div key={m.label} className="bar-row">
                      <span className="bar-label">{m.label}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(m.total / maxMonth) * 100}%` }} />
                      </div>
                      <span className="bar-value">{formatMoney(m.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <h2>Top accounts</h2>
              {data.topCustomers.length === 0 ? (
                <p className="muted">Tag customers or reps on the dashboard to see rankings.</p>
              ) : (
                <ul className="rank-list">
                  {data.topCustomers.map((c, i) => (
                    <li key={c.name}>
                      <span className="rank-num">{i + 1}</span>
                      <div>
                        <strong>{c.name}</strong>
                        <span className="cell-sub">{c.runs} run{c.runs !== 1 ? 's' : ''}</span>
                      </div>
                      <strong className="rank-total">{formatMoney(c.total)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="panel">
            <div className="panel-head">
              <h2>Recent commission runs</h2>
              <Link to="/app/commissions" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            {data.recentRuns.length === 0 ? (
              <p className="muted">No history yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Rep</th>
                      <th>Invoice</th>
                      <th>Matched</th>
                      <th>Commission</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentRuns.map((run) => (
                      <tr key={run.id}>
                        <td>{new Date(run.created_at).toLocaleDateString()}</td>
                        <td>{run.customers?.name ?? '—'}</td>
                        <td>
                          {run.rep_id && run.reps?.name ? (
                            <Link to={`/app/commissions?rep=${run.rep_id}`}>{run.reps.name}</Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{run.invoice_file_name ?? '—'}</td>
                        <td>{run.matched_count}/{run.line_count}</td>
                        <td className="cell-commission">{formatMoney(Number(run.total_commission))}</td>
                        <td>
                          <Link
                            to={`/app/commissions?open=${run.id}${run.rep_id ? `&rep=${run.rep_id}` : ''}`}
                            className="btn btn-ghost btn-sm"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
