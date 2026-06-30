import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';

const NAV = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/customers', label: 'Customers & reps' },
  { to: '/app/inventory', label: 'Inventory' },
  { to: '/app/commissions', label: 'Commissions' },
  { to: '/app/analytics', label: 'Analytics' },
  { to: '/app/settings', label: 'Settings' },
];

interface Props {
  children?: React.ReactNode;
}

export function AppLayout({ children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <Logo
            size="md"
            variant="light"
            href="/app"
            tagline={user?.businessName || user?.displayName}
          />
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="btn btn-ghost sidebar-signout" onClick={handleSignOut}>
          Sign out
        </button>
      </aside>

      <div className="app-content">
        <main className="app-main app-main-wide">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
