import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { CommissionRun, Customer } from '../types';
import {
  deleteCommissionRun,
  getCommissionRun,
  listCommissionRuns,
  listCustomers,
} from '../services/dataService';
import { formatMoney } from '../utils/commission';
import { CommissionRunModal } from '../components/CommissionRunModal';

export function CommissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const repFilter = searchParams.get('rep') ?? '';
  const openId = searchParams.get('open') ?? '';

  const [runs, setRuns] = useState<CommissionRun[]>([]);
  const [reps, setReps] = useState<Customer[]>([]);
  const [viewingRun, setViewingRun] = useState<CommissionRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allRuns, contacts] = await Promise.all([listCommissionRuns(200), listCustomers()]);
      setReps(contacts.filter((c) => c.kind === 'rep'));
      const filtered = repFilter ? allRuns.filter((r) => r.rep_id === repFilter) : allRuns;
      setRuns(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load commissions');
    } finally {
      setLoading(false);
    }
  }, [repFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!openId) return;
    void getCommissionRun(openId).then((run) => {
      if (run) setViewingRun(run);
    });
  }, [openId]);

  const openRun = (run: CommissionRun) => {
    setViewingRun(run);
    const next = new URLSearchParams(searchParams);
    next.set('open', run.id);
    setSearchParams(next, { replace: true });
  };

  const closeRun = () => {
    setViewingRun(null);
    const next = new URLSearchParams(searchParams);
    next.delete('open');
    setSearchParams(next, { replace: true });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCommissionRun(id);
      if (viewingRun?.id === id) closeRun();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const selectedRep = reps.find((r) => r.id === repFilter);
  const repTotal = runs.reduce((s, r) => s + Number(r.total_commission), 0);

  return (
    <>
      <div className="page-head">
        <h1>Commissions</h1>
        <p className="page-sub">
          Open saved payout runs, review line items, and manage history by sales rep.
        </p>
      </div>

      <section className="panel">
        <div className="commissions-toolbar">
          <label className="commissions-filter">
            <span className="dash-field-label">Sales rep</span>
            <select
              className="dash-select"
              value={repFilter}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                const value = e.target.value;
                if (value) next.set('rep', value);
                else next.delete('rep');
                next.delete('open');
                setSearchParams(next);
                setViewingRun(null);
              }}
            >
              <option value="">All reps</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}{r.company ? ` (${r.company})` : ''}
                </option>
              ))}
            </select>
          </label>
          {selectedRep && (
            <p className="cell-sub commissions-rep-summary">
              <strong>{selectedRep.name}</strong> — {runs.length} run{runs.length === 1 ? '' : 's'} ·{' '}
              {formatMoney(repTotal)} total
            </p>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>
          {selectedRep ? `${selectedRep.name}'s commissions` : 'All commission runs'} ({runs.length})
        </h2>
        {error && <p className="alert alert-error">{error}</p>}
        {loading ? (
          <p className="muted">Loading…</p>
        ) : runs.length === 0 ? (
          <p className="muted">
            No commissions yet.
            {selectedRep ? (
              <> Assign <strong>{selectedRep.name}</strong> on the dashboard when you calculate a payout.</>
            ) : (
              <> <Link to="/app">Calculate a commission</Link> and tag a sales rep to save it to their account.</>
            )}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Rep</th>
                  <th>Customer</th>
                  <th>Invoice</th>
                  <th>Matched</th>
                  <th>Commission</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td>{new Date(run.created_at).toLocaleDateString()}</td>
                    <td>{run.reps?.name ?? '—'}</td>
                    <td>{run.customers?.name ?? '—'}</td>
                    <td>{run.invoice_file_name ?? '—'}</td>
                    <td>{run.matched_count}/{run.line_count}</td>
                    <td className="cell-commission">{formatMoney(Number(run.total_commission))}</td>
                    <td className="row-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openRun(run)}>
                        Open
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => void handleDelete(run.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {viewingRun && (
        <CommissionRunModal
          run={viewingRun}
          onClose={closeRun}
          onDelete={(id) => void handleDelete(id)}
        />
      )}
    </>
  );
}
