import React, { useState } from 'react';
import { TeamMember } from '../../types';

interface Props {
  members: TeamMember[];
  quotesCount: number;
  totalRevenue: number;
  totalProfit: number;
  onInvite: (member: Omit<TeamMember, 'id' | 'createdAt' | 'status'>) => void;
  onUpdate: (id: string, updates: Partial<TeamMember>) => void;
  onRemove: (id: string) => void;
}

const ROLES = ['Owner / Sales', 'Sales Rep', 'Showroom Manager', 'Office Admin'];

export const TeamView: React.FC<Props> = ({
  members,
  quotesCount,
  totalRevenue,
  totalProfit,
  onInvite,
  onUpdate,
  onRemove,
}) => {
  const [showInvite, setShowInvite] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', role: ROLES[1], email: '' });

  const reset = () => {
    setForm({ name: '', role: ROLES[1], email: '' });
    setEditingId(null);
    setShowInvite(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    if (editingId) {
      onUpdate(editingId, { name: form.name.trim(), role: form.role, email: form.email.trim() });
    } else {
      onInvite({ name: form.name.trim(), role: form.role, email: form.email.trim() });
    }
    reset();
  };

  const startEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setForm({ name: m.name, role: m.role, email: m.email });
    setShowInvite(true);
  };

  return (
    <div>
      <h2 className="view-heading">Team Management</h2>
      <p className="view-subheading">Manage team members and track performance</p>

      <div className="grid-4" style={{ marginTop: 24 }}>
        <div className="stat-card"><div className="stat-value">{members.length}</div><div className="stat-label">Team Members</div></div>
        <div className="stat-card"><div className="stat-value">{quotesCount}</div><div className="stat-label">Total Quotes</div></div>
        <div className="stat-card"><div className="stat-value">${Math.round(totalRevenue).toLocaleString()}</div><div className="stat-label">Total Revenue</div></div>
        <div className="stat-card"><div className="stat-value">${Math.round(totalProfit).toLocaleString()}</div><div className="stat-label">Total Profit</div></div>
      </div>

      {showInvite && (
        <div className="card" style={{ marginTop: 24, maxWidth: 520 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>{editingId ? 'Edit Member' : 'Invite Team Member'}</h3>
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Send Invite'}</button>
              <button type="button" className="btn btn-secondary" onClick={reset}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid-3" style={{ marginTop: 24 }}>
        {members.map((m) => (
          <div key={m.id} className="card team-card">
            <div className="team-avatar">{m.name.charAt(0)}</div>
            <h3 style={{ fontWeight: 700, marginTop: 12 }}>{m.name}</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{m.role}</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>{m.email}</p>
            <span className={`badge badge-${m.status === 'Active' ? 'approved' : 'draft'}`} style={{ marginTop: 12 }}>{m.status}</span>
            <div className="flex gap-2" style={{ marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(m)}>Edit</button>
              {m.status === 'Invited' && (
                <button type="button" className="btn btn-success btn-sm" onClick={() => onUpdate(m.id, { status: 'Active' })}>Activate</button>
              )}
              <button type="button" className="btn btn-danger btn-sm" onClick={() => onRemove(m.id)}>Remove</button>
            </div>
          </div>
        ))}
        <button type="button" className="card team-card team-card-add" style={{ borderStyle: 'dashed', cursor: 'pointer', background: 'var(--bg-card)' }} onClick={() => { reset(); setShowInvite(true); }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>+</div>
          <h3 style={{ fontWeight: 600 }}>Invite Team Member</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>Add a salesperson to your workspace</p>
        </button>
      </div>
    </div>
  );
};
