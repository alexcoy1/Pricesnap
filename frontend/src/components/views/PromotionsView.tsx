import React, { useState } from 'react';
import { Promotion } from '../../types';

interface Props {
  promotions: Promotion[];
  onAddPromotion: (promo: Omit<Promotion, 'id' | 'createdAt'>) => void;
  onUpdatePromotion: (id: string, updates: Partial<Promotion>) => void;
  onDeletePromotion: (id: string) => void;
}

export const PromotionsView: React.FC<Props> = ({
  promotions,
  onAddPromotion,
  onUpdatePromotion,
  onDeletePromotion,
}) => {
  const [name, setName] = useState('');
  const [discount, setDiscount] = useState('10');
  const [validUntil, setValidUntil] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDiscount('10');
    setValidUntil('');
    setDescription('');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      discountPct: Math.min(100, Math.max(0, parseFloat(discount) || 0)),
      validUntil,
      description: description.trim(),
      active: true,
    };
    if (editingId) {
      onUpdatePromotion(editingId, payload);
    } else {
      onAddPromotion(payload);
    }
    resetForm();
  };

  const startEdit = (p: Promotion) => {
    setEditingId(p.id);
    setName(p.name);
    setDiscount(String(p.discountPct));
    setValidUntil(p.validUntil);
    setDescription(p.description);
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 className="view-heading">Promotions</h2>
      <p className="view-subheading">Create and manage promotional offers for quotes</p>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>{editingId ? 'Edit Promotion' : 'Create Promotion'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Promotion Name</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring Sale" required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Discount %</label>
              <input className="form-input" type="number" min={0} max={100} value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Valid Until</label>
              <input className="form-input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Promotion details shown to your team..." />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Promotion'}</button>
            {editingId && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Active Promotions</h3>
        {promotions.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No promotions yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Discount</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    {p.description && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.description}</div>}
                  </td>
                  <td>{p.discountPct}%</td>
                  <td>{p.validUntil ? new Date(p.validUntil).toLocaleDateString() : '—'}</td>
                  <td>
                    <button
                      type="button"
                      className={`badge ${p.active ? 'badge-approved' : 'badge-draft'}`}
                      style={{ border: 'none', cursor: 'pointer' }}
                      onClick={() => onUpdatePromotion(p.id, { active: !p.active })}
                    >
                      {p.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="flex gap-2">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(p)}>Edit</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeletePromotion(p.id)}>Delete</button>
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
