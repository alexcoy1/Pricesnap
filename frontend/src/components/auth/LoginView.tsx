import React, { useState } from 'react';
import { useAuth } from './AuthContext';

interface Props {
  onNavigateToSignUp: () => void;
  onNavigateToHelp: () => void;
}

export const LoginView: React.FC<Props> = ({ onNavigateToSignUp, onNavigateToHelp }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await login(email, password);
    if (!ok) setError('Invalid email or password');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      <div className="flex gap-3 justify-center" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onNavigateToSignUp}>Create Account</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onNavigateToHelp}>Help</button>
      </div>
    </form>
  );
};
