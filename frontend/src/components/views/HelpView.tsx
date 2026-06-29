import React from 'react';

interface Props {
  onNavigateToLogin: () => void;
}

export const HelpView: React.FC<Props> = ({ onNavigateToLogin }) => (
  <div>
    <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Getting Started</h3>
    <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
      <p><strong>1. Upload a price list</strong> — Excel file with Item, Price, and Cost columns.</p>
      <p style={{ marginTop: 8 }}><strong>2. Describe your quote</strong> — Type what the customer needs in plain English.</p>
      <p style={{ marginTop: 8 }}><strong>3. Review & send</strong> — Edit items, apply discounts, export PDF.</p>
    </div>
    <button className="btn btn-primary" style={{ marginTop: 24, width: '100%' }} onClick={onNavigateToLogin}>
      Back to Sign In
    </button>
  </div>
);
