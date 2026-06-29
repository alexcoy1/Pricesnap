import React, { useState } from 'react';
import { Customer, QuoteData, User } from '../../types';

interface Props {
  quotes: QuoteData[];
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  onUpdateCustomer: (customerId: string, customer: Omit<Customer, 'id'>) => void;
  onDeleteCustomer: (customerId: string) => void;
  currentUser: User;
}

export const CustomersView: React.FC<Props> = ({
  customers,
  quotes,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '' });

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', company: '', address: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateCustomer(editingId, form);
    } else {
      onAddCustomer({ ...form, createdAt: new Date().toISOString() });
    }
    resetForm();
  };

  const startEdit = (c: Customer) => {
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '', address: c.address || '' });
    setEditingId(c.id);
    setShowForm(true);
  };

  const quoteCount = (customerId: string) => quotes.filter((q) => q.customerId === customerId).length;

  return (
    <div>
      <h2 className="view-heading">Customers</h2>
      <p className="view-subheading" style={{ marginBottom: 24 }}>Manage contacts and view quote history per customer.</p>
      <button className="btn btn-primary mb-6" onClick={() => { resetForm(); setShowForm(true); }}>
        + Add Customer
      </button>

      {showForm && (
        <div className="card mb-6">
          <h3 style={{ marginBottom: 16 }}>{editingId ? 'Edit Customer' : 'New Customer'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <input className="form-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Add'}</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {customers.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No customers yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Quotes</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.company || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{quoteCount(c.id)}</td>
                  <td className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(c)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDeleteCustomer(c.id)}>Delete</button>
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
