import type { CommissionSummary } from '../types';
import { formatMoney } from '../utils/commission';

interface Props {
  summary: CommissionSummary | null;
}

function confidenceClass(c: string) {
  if (c === 'high') return 'badge-high';
  if (c === 'medium') return 'badge-med';
  if (c === 'low') return 'badge-low';
  return 'badge-none';
}

export function CommissionResults({ summary }: Props) {
  if (!summary) {
    return (
      <section className="panel panel-results panel-empty">
        <h2>Commission trail</h2>
        <p className="muted">Upload a price list and invoice — reps and owners see the payout here.</p>
      </section>
    );
  }

  return (
    <section className="panel panel-results">
      <div className="panel-head">
        <div>
          <h2>Commission trail</h2>
          <p className="panel-sub">
            {summary.matchedCount} matched · {summary.unmatchedCount} need review
          </p>
        </div>
        <div className="total-commission" aria-live="polite">
          <span className="total-label">Your commission</span>
          <span className="total-value">{formatMoney(summary.totalCommission)}</span>
        </div>
      </div>

      <div className="summary-grid">
        <div className="stat">
          <span className="stat-label">Revenue</span>
          <span className="stat-value">{formatMoney(summary.totalRevenue)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Cost</span>
          <span className="stat-value">{formatMoney(summary.totalCost)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Margin</span>
          <span className="stat-value">{formatMoney(summary.totalMargin)}</span>
        </div>
      </div>

      <div className="table-wrap">
        <table className="results-table">
          <thead>
            <tr>
              <th>Order line</th>
              <th>Matched item</th>
              <th>Qty</th>
              <th>Sell</th>
              <th>Cost</th>
              <th>Margin</th>
              <th>Commission</th>
            </tr>
          </thead>
          <tbody>
            {summary.lines.map((line) => (
              <tr key={line.input.id} className={line.catalogItem ? '' : 'row-unmatched'}>
                <td>
                  <div className="cell-primary">{line.input.description}</div>
                  <div className="cell-sub">{line.input.rawText}</div>
                </td>
                <td>
                  {line.catalogItem ? (
                    <>
                      <div className="cell-primary">{line.catalogItem.Item}</div>
                      <span className={`badge ${confidenceClass(line.confidence)}`}>
                        {line.confidence}
                      </span>
                    </>
                  ) : (
                    <span className="badge badge-none">no match</span>
                  )}
                </td>
                <td>{line.quantity}</td>
                <td>{formatMoney(line.unitPrice)}</td>
                <td>{formatMoney(line.unitCost)}</td>
                <td>{formatMoney(line.lineMargin)}</td>
                <td className="cell-commission">{formatMoney(line.lineCommission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
