import React, { useRef } from 'react';
import { CompanyInfo } from '../../types';

const COLOR_PRESETS: { name: string; primary: string; secondary: string }[] = [
  { name: 'Bold Red', primary: '#a31f37', secondary: '#000000' },
  { name: 'Professional Blue', primary: '#0066FF', secondary: '#8B5CF6' },
  { name: 'Ocean Teal', primary: '#0D9488', secondary: '#06B6D4' },
  { name: 'Forest Green', primary: '#059669', secondary: '#10B981' },
  { name: 'Sunset Orange', primary: '#EA580C', secondary: '#F59E0B' },
  { name: 'Classic Navy', primary: '#1E3A5F', secondary: '#3B82F6' },
];

interface Props {
  companyInfo: CompanyInfo;
  onUpdateCompanyInfo: (info: CompanyInfo) => void;
}

export const CompanyBrandingView: React.FC<Props> = ({ companyInfo, onUpdateCompanyInfo }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof CompanyInfo, value: string) => {
    onUpdateCompanyInfo({ ...companyInfo, [field]: value });
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) update('logoUrl', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    onUpdateCompanyInfo({ ...companyInfo, primaryColor: preset.primary, secondaryColor: preset.secondary });
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 className="view-heading">Company Branding</h2>
      <p className="view-subheading">Customize your company's branding to make quotes look more professional and personalized.</p>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 20, fontWeight: 600 }}>Company Details</h3>
        <div className="form-group">
          <label className="form-label">Company Name</label>
          <input className="form-input" value={companyInfo.companyName} onChange={(e) => update('companyName', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-input" value={companyInfo.companyAddress} onChange={(e) => update('companyAddress', e.target.value)} />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input className="form-input" value={companyInfo.companyContact} onChange={(e) => update('companyContact', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Website</label>
            <input className="form-input" value={companyInfo.website} onChange={(e) => update('website', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Tax Number</label>
          <input className="form-input" value={companyInfo.taxNumber} onChange={(e) => update('taxNumber', e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Logo</h3>
        <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap' }}>
          {companyInfo.logoUrl ? (
            <img src={companyInfo.logoUrl} alt="Company logo" style={{ maxHeight: 64, maxWidth: 160, objectFit: 'contain', border: '1px solid var(--color-border-light)', borderRadius: 8, padding: 8 }} />
          ) : (
            <div className="logo-placeholder">No logo</div>
          )}
          <div>
            <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>Upload Logo</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>Or paste a URL below</p>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 16, marginBottom: 0 }}>
          <input className="form-input" value={companyInfo.logoUrl} onChange={(e) => update('logoUrl', e.target.value)} placeholder="https://... or upload above" />
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Brand Colors</h3>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Primary Color</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={companyInfo.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} />
              <input className="form-input" value={companyInfo.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Secondary Color</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={companyInfo.secondaryColor} onChange={(e) => update('secondaryColor', e.target.value)} />
              <input className="form-input" value={companyInfo.secondaryColor} onChange={(e) => update('secondaryColor', e.target.value)} />
            </div>
          </div>
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, marginTop: 8, marginBottom: 12 }}>Preset Color Schemes</p>
        <div className="preset-row">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="preset-chip"
              onClick={() => applyPreset(preset)}
              title={preset.name}
            >
              <span style={{ background: preset.primary }} />
              <span style={{ background: preset.secondary }} />
              <span className="preset-label">{preset.name}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: 24, borderRadius: 12, background: `linear-gradient(135deg, ${companyInfo.primaryColor}, ${companyInfo.secondaryColor})`, color: 'white', textAlign: 'center' }}>
          {companyInfo.logoUrl && <img src={companyInfo.logoUrl} alt="" style={{ maxHeight: 40, marginBottom: 8, objectFit: 'contain' }} />}
          <div style={{ fontSize: 24, fontWeight: 800 }}>{companyInfo.companyName}</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>Brand Preview</div>
        </div>
      </div>
    </div>
  );
};
