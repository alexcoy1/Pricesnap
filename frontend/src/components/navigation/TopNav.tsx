import React, { useState, useRef, useEffect } from 'react';
import { AppView } from '../../types';

interface Props {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  userName: string;
}

const MAIN_NAV: { view: AppView; label: string }[] = [
  { view: AppView.DASHBOARD, label: 'Home' },
  { view: AppView.INPUT_FORM, label: 'New Quote' },
  { view: AppView.CUSTOMERS, label: 'Customers' },
  { view: AppView.ANALYTICS, label: 'Analytics' },
  { view: AppView.INVENTORY, label: 'Inventory' },
  { view: AppView.PROMOTIONS, label: 'Promotions' },
  { view: AppView.FINANCING, label: 'Financing' },
  { view: AppView.FILES, label: 'Files' },
  { view: AppView.TEAM, label: 'Team' },
];

const SETTINGS_NAV: { view: AppView; label: string }[] = [
  { view: AppView.PROFILE, label: 'Profile' },
  { view: AppView.COMPANY_BRANDING, label: 'Branding' },
  { view: AppView.PRICE_LISTS, label: 'Price Lists' },
  { view: AppView.SETTINGS, label: 'Preferences' },
  { view: AppView.SUBSCRIPTION, label: 'Subscription' },
  { view: AppView.LANDING, label: 'Marketing site' },
];

function isActive(view: AppView, current: AppView): boolean {
  if (view === AppView.DASHBOARD) return current === AppView.DASHBOARD;
  if (view === AppView.INPUT_FORM) {
    return current === AppView.INPUT_FORM || current === AppView.CUSTOMER_QUOTE || current === AppView.INTERNAL_QUOTE;
  }
  if (view === AppView.PROFILE || view === AppView.COMPANY_BRANDING || view === AppView.PRICE_LISTS || view === AppView.SUBSCRIPTION || view === AppView.SETTINGS || view === AppView.LANDING) {
    return current === view;
  }
  return current === view;
}

export const TopNav: React.FC<Props> = ({ currentView, onNavigate, onLogout, userName }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const settingsActive = SETTINGS_NAV.some((s) => s.view === currentView);

  useEffect(() => {
    if (!settingsOpen) return;
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [settingsOpen]);

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <button
          type="button"
          className="top-nav-brand"
          onClick={() => onNavigate(AppView.DASHBOARD)}
          aria-label="PriceSnap Home"
        >
          <span className="brand-mark">PS</span>
          <span className="brand-text">PriceSnap</span>
        </button>

        <nav className="top-nav-links" aria-label="Main">
          <div className="top-nav-links-scroll">
            {MAIN_NAV.map((item) => (
              <button
                key={item.view}
                type="button"
                className={`top-nav-link${isActive(item.view, currentView) ? ' active' : ''}`}
                onClick={() => onNavigate(item.view)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="top-nav-dropdown" ref={dropdownRef}>
            <button
              type="button"
              className={`top-nav-link top-nav-settings${settingsActive ? ' active' : ''}${settingsOpen ? ' open' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSettingsOpen((o) => !o);
              }}
              aria-expanded={settingsOpen}
              aria-haspopup="true"
            >
              Settings
              <span className="top-nav-chevron" aria-hidden>▾</span>
            </button>
            {settingsOpen && (
              <div className="top-nav-dropdown-menu" role="menu">
                {SETTINGS_NAV.map((item) => (
                  <button
                    key={item.view}
                    type="button"
                    role="menuitem"
                    className={currentView === item.view ? 'active' : ''}
                    onClick={() => {
                      onNavigate(item.view);
                      setSettingsOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="top-nav-user">
          <span className="top-nav-welcome">Welcome, {userName}</span>
          <button type="button" className="top-nav-logout" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
};
