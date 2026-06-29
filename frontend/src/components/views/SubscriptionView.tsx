import React, { useState } from 'react';
import { SUBSCRIPTION_PLANS } from '../../utils/workspaceDefaults';

interface Props {
  selectedPlanId: string;
  billingEmail: string;
  onSelectPlan: (planId: string) => void;
  onUpdateBillingEmail: (email: string) => void;
}

export const SubscriptionView: React.FC<Props> = ({
  selectedPlanId,
  billingEmail,
  onSelectPlan,
  onUpdateBillingEmail,
}) => {
  const [saved, setSaved] = useState(false);
  const current = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];

  const saveBilling = () => {
    onUpdateBillingEmail(billingEmail);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 className="view-heading">Subscription</h2>
      <p className="view-subheading">Manage your PriceSnap plan and billing</p>

      <div className="card" style={{ marginTop: 24, borderTop: '4px solid var(--color-primary)' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current plan</p>
        <h3 style={{ fontWeight: 700, fontSize: 22, marginTop: 8 }}>{current.name}</h3>
        <div style={{ marginTop: 12, fontSize: 28, fontWeight: 800, color: 'var(--color-primary)' }}>
          ${current.priceMonthly}<span style={{ fontSize: 14, fontWeight: 500 }}>/month</span>
        </div>
        <ul style={{ marginTop: 16, fontSize: 14, paddingLeft: 20 }}>
          {current.features.map((f) => <li key={f} style={{ marginBottom: 4 }}>{f}</li>)}
        </ul>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Change Plan</h3>
        <div className="grid-3">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              className="card"
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                border: selectedPlanId === plan.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border-light)',
                background: selectedPlanId === plan.id ? 'var(--color-primary-50)' : 'var(--bg-card)',
              }}
              onClick={() => onSelectPlan(plan.id)}
            >
              <strong>{plan.name}</strong>
              <p style={{ marginTop: 8, fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>${plan.priceMonthly}/mo</p>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Billing</h3>
        <div className="form-group">
          <label className="form-label">Billing Email</label>
          <input className="form-input" type="email" value={billingEmail} onChange={(e) => onUpdateBillingEmail(e.target.value)} />
        </div>
        <button type="button" className="btn btn-primary" onClick={saveBilling}>
          {saved ? 'Saved ✓' : 'Update Billing'}
        </button>
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Next billing date: {new Date(Date.now() + 30 * 86400000).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};
