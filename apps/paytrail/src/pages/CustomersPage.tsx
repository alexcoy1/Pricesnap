import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ContactKind, CommissionRun, Customer } from '../types';
import {
  createCustomer,
  deleteCustomer,
  listCommissionRunsForRep,
  listCustomers,
  updateCustomer,
} from '../services/dataService';
import { formatMoney } from '../utils/commission';

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  address: '',
  company: '',
  notes: '',
  kind: 'customer' as ContactKind,
};

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [showCompany, setShowCompany] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [repRuns, setRepRuns] = useState<CommissionRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setCustomers(await listCustomers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm(EMPTY);
    setShowCompany(false);
    setEditingId(null);
    setRepRuns([]);
  };

  const loadRepRuns = async (repId: string) => {
    setRepRuns(await listCommissionRunsForRep(repId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.kind === 'customer' ? form.address.trim() || null : null,
        company: showCompany ? form.company.trim() || null : null,
        notes: form.notes.trim() || null,
        kind: form.kind,
      };
      if (editingId) {
        await updateCustomer(editingId, payload);
      } else {
        await createCustomer(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const startEdit = (c: Customer) => {
    setEditingId(c.id);
    setShowCompany(!!c.company);
    setForm({
      name: c.name,
      email: c.email ?? '',
      phone: c.phone ?? '',
      address: c.address ?? '',
      company: c.company ?? '',
      notes: c.notes ?? '',
      kind: c.kind,
    });
    if (c.kind === 'rep') void loadRepRuns(c.id);
    else setRepRuns([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await deleteCustomer(id);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Customers &amp; reps</h1>
        <p className="page-sub">
          Track buyers and salespeople. Owners — add each rep here to tie payouts to the right person.
        </p>
      </div>

      <div className="two-col-page">
        <section className="panel">
          <h2>{editingId ? 'Edit record' : 'Add customer or rep'}</h2>
          <form onSubmit={(e) => void handleSubmit(e)} className="stack-form">
            <label>
              Type
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as ContactKind })}
              >
                <option value="customer">Customer (buyer)</option>
                <option value="rep">Sales rep</option>
              </select>
            </label>
            <label>
              Name *
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label>
              Phone
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            {form.kind === 'customer' && (
              <label>
                Address
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </label>
            )}
            {!showCompany ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm form-opt-btn"
                onClick={() => setShowCompany(true)}
              >
                + Add company
              </button>
            ) : (
              <label>
                Company
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </label>
            )}
            <label>
              Notes
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </label>
            {error && <p className="alert alert-error">{error}</p>}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Save changes' : 'Add record'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>

          {editingId && form.kind === 'rep' && (
            <div className="rep-commissions-panel">
              <div className="panel-head">
                <h3>Commission history</h3>
                <Link to={`/app/commissions?rep=${editingId}`} className="btn btn-ghost btn-sm">
                  View all
                </Link>
              </div>
              {repRuns.length === 0 ? (
                <p className="muted cell-sub">
                  No payouts yet. Select this rep on the dashboard when calculating commission.
                </p>
              ) : (
                <ul className="rep-commissions-list">
                  {repRuns.slice(0, 5).map((run) => (
                    <li key={run.id}>
                      <div>
                        <strong>{formatMoney(Number(run.total_commission))}</strong>
                        <span className="cell-sub">
                          {new Date(run.created_at).toLocaleDateString()}
                          {run.customers?.name ? ` · ${run.customers.name}` : ''}
                        </span>
                      </div>
                      <Link
                        to={`/app/commissions?rep=${editingId}&open=${run.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Your records ({customers.length})</h2>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : customers.length === 0 ? (
            <p className="muted">No customers or reps yet. Add a buyer or salesperson to track payouts.</p>
          ) : (
            <div className="table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Contact</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>{c.kind === 'rep' ? 'Rep' : 'Customer'}</td>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.company || '—'}</td>
                      <td>
                        <div className="cell-sub">{c.email}</div>
                        <div className="cell-sub">{c.phone}</div>
                        {c.address && <div className="cell-sub">{c.address}</div>}
                      </td>
                      <td className="row-actions">
                        {c.kind === 'rep' && (
                          <Link to={`/app/commissions?rep=${c.id}`} className="btn btn-ghost btn-sm">
                            Payouts
                          </Link>
                        )}
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(c)}>Edit</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleDelete(c.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
