import React from 'react';
import { User } from '../../types';
import { getThemePreference, applyTheme } from '../../utils/themeUtils';
import type { Theme } from '../../App';

interface Props {
  defaultTerms: string;
  onUpdateDefaultTerms: (terms: string) => void;
  currentUser: User;
  onUpdateUser: (data: Partial<User>) => void;
  anthropicApiKey: string;
  onUpdateAnthropicApiKey: (key: string) => void;
}

export const SettingsView: React.FC<Props> = ({
  defaultTerms,
  onUpdateDefaultTerms,
  currentUser,
  onUpdateUser,
  anthropicApiKey,
  onUpdateAnthropicApiKey,
}) => {
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') as Theme || getThemePreference();
    const next: Theme = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('theme', next);
    window.location.reload();
  };

  return (
    <div className="grid-2">
      <div className="card">
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Account</h3>
        <div className="form-group">
          <label className="form-label">Display Name</label>
          <input className="form-input" value={currentUser.displayName} onChange={(e) => onUpdateUser({ displayName: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={currentUser.email} disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Company</label>
          <input className="form-input" value={currentUser.company || ''} onChange={(e) => onUpdateUser({ company: e.target.value })} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Appearance</h3>
        <button className="btn btn-secondary" onClick={toggleTheme}>Toggle Dark/Light Theme</button>
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          On the live Netlify site, Claude is configured server-side. The field below is only for local development.
        </p>
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Claude AI (recommended)</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          Paste your Anthropic API key from console.anthropic.com. Stored locally in your browser only.
        </p>
        <div className="form-group">
          <label className="form-label">Claude API Key</label>
          <input
            className="form-input"
            type="password"
            value={anthropicApiKey}
            onChange={(e) => onUpdateAnthropicApiKey(e.target.value.trim())}
            placeholder="sk-ant-..."
            autoComplete="off"
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Live site: set ANTHROPIC_API_KEY in Netlify → Environment variables (see DEPLOY.md). Local: use backend/.env or this field.
          </p>
        </div>
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Default Quote Terms</h3>
        <textarea className="form-textarea" value={defaultTerms} onChange={(e) => onUpdateDefaultTerms(e.target.value)} rows={8} />
      </div>
    </div>
  );
};
