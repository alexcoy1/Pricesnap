import { FormEvent, useState } from 'react';
import { getAppSettings, saveAppSettings, exportAllData, importAllData, clearAllData } from '../services/dataService';
import { getDevApiKey, setDevApiKey } from '../services/devApiKey';
import { useAuth } from '../contexts/AuthContext';
import type { AppSettings } from '../types';

export function SettingsPage() {
  const { updateUser } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(() => getAppSettings());
  const [devApiKey, setDevApiKeyState] = useState(() => getDevApiKey());
  const [devKeySaved, setDevKeySaved] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDev = import.meta.env.DEV;

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    saveAppSettings(settings);
    updateUser({ businessName: settings.businessName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([exportAllData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paytrail-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      importAllData(text);
      setSettings(getAppSettings());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Could not import that file. Use a PayTrail backup JSON.');
    }
  };

  const handleClear = () => {
    if (!confirm('Delete all PayTrail data in this browser? This cannot be undone.')) return;
    clearAllData();
    setSettings(getAppSettings());
  };

  const handleSaveDevKey = (e: FormEvent) => {
    e.preventDefault();
    setDevApiKey(devApiKey);
    setDevKeySaved(true);
    setTimeout(() => setDevKeySaved(false), 2000);
  };

  return (
    <>
      <div className="page-head">
        <h1>Settings</h1>
        <p className="page-sub">
          Commission defaults and backup for your account on this device.
        </p>
      </div>

      <section className="panel">
        <h2>Business profile</h2>
        <form onSubmit={handleSave} className="stack-form">
          <label>
            Business or dealership name
            <input
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
              placeholder="Shown in the sidebar"
            />
          </label>
          <label>
            Default commission rate (%)
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={settings.defaultRatePercent}
              onChange={(e) =>
                setSettings({ ...settings, defaultRatePercent: parseFloat(e.target.value) || 0 })
              }
            />
          </label>
          <label>
            Default basis
            <select
              value={settings.defaultBasis}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultBasis: e.target.value as AppSettings['defaultBasis'],
                })
              }
            >
              <option value="margin">Margin (sell − cost)</option>
              <option value="sell">Sell price</option>
            </select>
          </label>
          <button type="submit" className="btn btn-primary">Save settings</button>
          {saved && <p className="status-chip status-ok">Saved</p>}
        </form>
      </section>

      {isDev && (
        <section className="panel">
          <h2>Invoice AI (local dev)</h2>
          <p className="panel-sub">
            Paste your Anthropic API key to read PDF and photo invoices while developing locally.
            Stored only in this browser — not sent to production. Get a key at{' '}
            <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer">
              console.anthropic.com
            </a>
            .
          </p>
          <form onSubmit={handleSaveDevKey} className="stack-form">
            <label>
              Anthropic API key
              <input
                type="password"
                autoComplete="off"
                value={devApiKey}
                onChange={(e) => setDevApiKeyState(e.target.value)}
                placeholder="sk-ant-..."
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save API key</button>
              {devApiKey && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setDevApiKeyState('');
                    setDevApiKey('');
                    setDevKeySaved(true);
                    setTimeout(() => setDevKeySaved(false), 2000);
                  }}
                >
                  Remove key
                </button>
              )}
            </div>
            {devKeySaved && <p className="status-chip status-ok">API key saved for local dev</p>}
          </form>
        </section>
      )}

      <section className="panel">
        <h2>Backup &amp; restore</h2>
        <p className="panel-sub">Export your customers, price lists, and commission history to move to another computer.</p>
        <div className="form-actions">
          <button type="button" className="btn btn-primary" onClick={handleExport}>
            Download backup
          </button>
          <label className="btn btn-ghost import-label">
            Restore from file
            <input
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImport(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {error && <p className="alert alert-error">{error}</p>}
      </section>

      <section className="panel">
        <h2>Reset</h2>
        <p className="panel-sub">Remove all PayTrail data from this browser.</p>
        <button type="button" className="btn btn-ghost" onClick={handleClear}>
          Clear all data
        </button>
      </section>
    </>
  );
}
