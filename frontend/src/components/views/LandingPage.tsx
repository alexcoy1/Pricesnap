import React from 'react';
import { AppView } from '../../types';

interface Props {
  onNavigate: (view: AppView) => void;
  onGetStarted: () => void;
  fromApp?: boolean;
  onBackToApp?: () => void;
}

const FEATURES = [
  {
    title: 'Describe, don’t data-entry',
    body: 'Type what your customer needs in plain language. PriceSnap maps it to your catalog in seconds.',
  },
  {
    title: 'Margin-aware quoting',
    body: 'Switch to internal view for cost, profit, and tax — negotiate with confidence, not guesswork.',
  },
  {
    title: 'Customer-ready in one click',
    body: 'Branded PDFs, financing options, and promotions — polished output without the polish work.',
  },
];

const COMPARE = [
  { old: 'Ctrl+F across spreadsheets', next: 'One catalog, instant match' },
  { old: 'Re-type every line item', next: 'Natural language → multi-line quote' },
  { old: 'No margin visibility', next: 'Profit & tax built in' },
  { old: 'Hours to onboard', next: 'Upload .xlsx and go' },
];

export const LandingPage: React.FC<Props> = ({ onNavigate, onGetStarted, fromApp, onBackToApp }) => (
  <div className="landing">
    <header className="landing-header">
      <div className="landing-header-inner">
        <div className="landing-logo">
          <span className="brand-mark">PS</span>
          <span className="brand-text">PriceSnap</span>
        </div>
        <nav className="landing-header-nav">
          {fromApp ? (
            <button type="button" className="landing-btn-primary" onClick={onBackToApp}>Back to app</button>
          ) : (
            <>
              <button type="button" className="landing-link" onClick={() => onNavigate(AppView.HELP)}>How it works</button>
              <button type="button" className="landing-btn-ghost" onClick={() => onNavigate(AppView.LOGIN)}>Sign in</button>
              <button type="button" className="landing-btn-primary" onClick={onGetStarted}>Get started</button>
            </>
          )}
        </nav>
      </div>
    </header>

    <section className="landing-hero">
      <div className="landing-hero-inner">
        <p className="landing-eyebrow">Built for field sales teams</p>
        <h1 className="landing-headline">
          Quotes that move as fast as your conversation.
        </h1>
        <p className="landing-subhead">
          PriceSnap turns a customer description into a accurate, branded quote — with margins, tax, and PDF ready before they leave the showroom.
        </p>
        <div className="landing-hero-actions">
          {fromApp ? (
            <>
              <button type="button" className="landing-btn-primary landing-btn-lg" onClick={onBackToApp}>
                Open workspace
              </button>
              <button type="button" className="landing-btn-secondary landing-btn-lg" onClick={() => onNavigate(AppView.INPUT_FORM)}>
                New quote
              </button>
            </>
          ) : (
            <>
              <button type="button" className="landing-btn-primary landing-btn-lg" onClick={onGetStarted}>
                Get started
              </button>
              <button type="button" className="landing-btn-secondary landing-btn-lg" onClick={() => onNavigate(AppView.LOGIN)}>
                Sign in
              </button>
            </>
          )}
        </div>
        <p className="landing-demo-hint">{fromApp ? 'You are signed in — return anytime from Settings' : 'No credit card · Works offline · Upload your own price list'}</p>
      </div>
    </section>

    <section className="landing-features">
      <div className="landing-section-inner">
        <h2 className="landing-section-title">Everything reps need. Nothing they don’t.</h2>
        <div className="landing-feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="landing-feature-card">
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="landing-compare">
      <div className="landing-section-inner">
        <h2 className="landing-section-title">Leave the spreadsheet behind.</h2>
        <div className="landing-compare-grid">
          {COMPARE.map((row) => (
            <div key={row.old} className="landing-compare-row">
              <span className="landing-compare-old">{row.old}</span>
              <span className="landing-compare-arrow" aria-hidden>→</span>
              <span className="landing-compare-new">{row.next}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="landing-cta">
      <div className="landing-cta-inner">
        <h2>{fromApp ? 'Ready to quote?' : 'Start quoting in minutes.'}</h2>
        <p>{fromApp ? 'Jump back into your workspace and keep selling.' : 'Create an account, upload your price list, and turn customer requests into branded quotes.'}</p>
        <button type="button" className="landing-btn-primary landing-btn-lg" onClick={fromApp ? onBackToApp : onGetStarted}>
          {fromApp ? 'Return to workspace' : 'Create account'}
        </button>
      </div>
    </section>

    <footer className="landing-footer">
      <p>© 2025 PriceSnap. All rights reserved.</p>
    </footer>
  </div>
);
