import React, { useState } from 'react';
import { useAuth } from './AuthContext';

interface Props {
  onNavigateToLogin: () => void;
}

export const SignUpView: React.FC<Props> = ({ onNavigateToLogin }) => {
  const { signup } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await signup(email, password, displayName);
    if (!ok) setError('An account with this email already exists');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="form-group">
        <label className="form-label">Full Name</label>
        <input className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      </div>
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
      <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
        Already have an account?{' '}
        <button type="button" className="btn btn-secondary btn-sm" onClick={onNavigateToLogin}>Sign In</button>
      </p>
    </form>
  );
};
