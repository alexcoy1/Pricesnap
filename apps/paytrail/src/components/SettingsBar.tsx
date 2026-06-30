import type { CommissionBasis, CommissionSettings } from '../types';

interface Props {
  settings: CommissionSettings;
  onChange: (s: CommissionSettings) => void;
}

export function SettingsBar({ settings, onChange }: Props) {
  return (
    <section className="settings-bar">
      <label className="field-inline">
        <span>Commission rate</span>
        <div className="input-suffix">
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={settings.ratePercent}
            onChange={(e) =>
              onChange({ ...settings, ratePercent: parseFloat(e.target.value) || 0 })
            }
          />
          <span>%</span>
        </div>
      </label>

      <label className="field-inline">
        <span>Based on</span>
        <select
          value={settings.basis}
          onChange={(e) =>
            onChange({ ...settings, basis: e.target.value as CommissionBasis })
          }
        >
          <option value="margin">Margin (sell − cost)</option>
          <option value="sell">Sell price</option>
        </select>
      </label>
    </section>
  );
}
