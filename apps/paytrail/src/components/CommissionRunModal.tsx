import type { CommissionRun } from '../types';
import { CommissionResults } from './CommissionResults';
import { formatMoney } from '../utils/commission';

interface Props {
  run: CommissionRun;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function CommissionRunModal({ run, onClose, onDelete }: Props) {
  const handleDelete = () => {
    if (!confirm('Delete this commission run? This cannot be undone.')) return;
    onDelete(run.id);
  };

  return (
    <div className="invoice-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="invoice-modal commission-run-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Commission run details"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="invoice-modal-head">
          <div>
            <h3>Commission run</h3>
            <p className="cell-sub">
              {new Date(run.created_at).toLocaleString()}
              {run.reps?.name ? ` · Rep: ${run.reps.name}` : ''}
              {run.customers?.name ? ` · Customer: ${run.customers.name}` : ''}
            </p>
          </div>
          <div className="row-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleDelete}>
              Delete
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="commission-run-meta">
          <div>
            <span className="meta-label">Invoice</span>
            <span>{run.invoice_file_name ?? '—'}</span>
          </div>
          <div>
            <span className="meta-label">Price list</span>
            <span>{run.price_lists?.name ?? '—'}</span>
          </div>
          <div>
            <span className="meta-label">Matched</span>
            <span>{run.matched_count}/{run.line_count}</span>
          </div>
          <div>
            <span className="meta-label">Total payout</span>
            <strong className="cell-commission">{formatMoney(Number(run.total_commission))}</strong>
          </div>
        </div>

        <div className="commission-run-body">
          <CommissionResults summary={run.summary} />
        </div>
      </div>
    </div>
  );
}
