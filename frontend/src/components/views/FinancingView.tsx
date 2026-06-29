import React, { useState } from 'react';
import { FinancingOption } from '../../types';

interface Props {
  options: FinancingOption[];
  onAddOption: (opt: Omit<FinancingOption, 'id'>) => void;
  onUpdateOption: (id: string, updates: Partial<FinancingOption>) => void;
  onDeleteOption: (id: string) => void;
}

const emptyForm = { name: '', termMonths: '12', apr: '0', minAmount: '5000' };

export const FinancingView: React.FC<Props> = ({
  options,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (opt: FinancingOption) => {
    setEditingId(opt.id);
    setForm({
      name: opt.name,
      termMonths: String(opt.termMonths),
      apr: String(opt.apr),
      minAmount: String(opt.minAmount),
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      termMonths: parseInt(form.termMonths, 10) || 12,
      apr: parseFloat(form.apr) || 0,
      minAmount: parseFloat(form.minAmount) || 0,
      active: true,
    };
    if (editingId) {
      onUpdateOption(editingId, payload);
    } else {
      onAddOption(payload);
    }
    reset();
  };

  const active = options.filter((o) => o.active);

  return (
    <div>
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="view-heading">Financing</h2>
          <p className="view-subheading">Financing options available on customer quotes</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { reset(); setShowForm(true); }}>
          + Add Option
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginTop: 24, maxWidth: 640 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>{editingId ? 'Edit Option' : 'New Financing Option'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 36 Month — 6.99% APR" required />
            </div>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Term (months)</label>
                <input className="form-input" type="number" min={1} value={form.termMonths} onChange={(e) => setForm({ ...form, termMonths: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">APR %</label>
                <input className="form-input" type="number" min={0} step={0.01} value={form.apr} onChange={(e) => setForm({ ...form, apr: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Minimum ($)</label>
                <input className="form-input" type="number" min={0} value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add Option'}</button>
              <button type="button" className="btn btn-secondary" onClick={reset}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 24 }}>
        {active.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No financing options. Add one to show on quotes.</p>
        ) : (
          active.map((opt) => (
            <div key={opt.id} className="card">
              <h3 style={{ fontWeight: 700 }}>{opt.name}</h3>
              <div style={{ marginTop: 12, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                <p><strong>Term:</strong> {opt.termMonths} months</p>
                <p style={{ marginTop: 4 }}><strong>APR:</strong> {opt.apr}%</p>
                <p style={{ marginTop: 4 }}><strong>Minimum:</strong> ${opt.minAmount.toLocaleString()}</p>
              </div>
              <div className="flex gap-2" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(opt)}>Edit</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeleteOption(opt.id)}>Remove</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
