import React from 'react';
import { User } from '../../types';

interface Props {
  currentUser: User;
  onUpdateProfile: (data: Partial<User>) => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<Props> = ({ currentUser, onUpdateProfile, onLogout }) => (
  <div className="card" style={{ maxWidth: 480 }}>
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--color-primary), #8B5CF6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, color: 'white', margin: '0 auto 12px',
      }}>
        {currentUser.displayName.charAt(0).toUpperCase()}
      </div>
      <h2 style={{ fontWeight: 700 }}>{currentUser.displayName}</h2>
      <p style={{ color: 'var(--color-text-secondary)' }}>{currentUser.email}</p>
    </div>

    <div className="form-group">
      <label className="form-label">Display Name</label>
      <input className="form-input" value={currentUser.displayName} onChange={(e) => onUpdateProfile({ displayName: e.target.value })} />
    </div>
    <div className="form-group">
      <label className="form-label">Company</label>
      <input className="form-input" value={currentUser.company || ''} onChange={(e) => onUpdateProfile({ company: e.target.value })} />
    </div>
    <div className="form-group">
      <label className="form-label">Phone</label>
      <input className="form-input" value={currentUser.phone || ''} onChange={(e) => onUpdateProfile({ phone: e.target.value })} />
    </div>

    <button className="btn btn-danger" style={{ width: '100%', marginTop: 16 }} onClick={onLogout}>
      Sign Out
    </button>
  </div>
);
