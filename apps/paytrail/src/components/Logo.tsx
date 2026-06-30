import { useId } from 'react';
import { Link } from 'react-router-dom';

type LogoSize = 'sm' | 'md' | 'lg';
type LogoVariant = 'dark' | 'light';

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  showWordmark?: boolean;
  tagline?: string;
  className?: string;
  href?: string;
}

const MARK_PX: Record<LogoSize, number> = { sm: 32, md: 40, lg: 48 };

function LogoMark({ size, variant }: { size: LogoSize; variant: LogoVariant }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `pt-grad-${uid}`;
  const glowId = `pt-glow-${uid}`;
  const px = MARK_PX[size];

  return (
    <svg
      className="logo-mark"
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="8" y1="42" x2="42" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor={variant === 'light' ? '#2d9b6a' : '#0f3d2a'} />
          <stop offset="1" stopColor={variant === 'light' ? '#5ee0a0' : '#2d9b6a'} />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f3d2a" floodOpacity="0.18" />
        </filter>
      </defs>
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="13"
        fill={`url(#${gradId})`}
        filter={`url(#${glowId})`}
      />
      {/* Commission trail — ascending path to payout */}
      <path
        d="M13 33 C17 33 19 27 24 24 C28 21 31 17 35 14"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <circle cx="35" cy="14" r="4" fill="white" />
      <path
        d="M33 14 L35 12 L37 14"
        stroke="#1a6b4a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  size = 'md',
  variant = 'dark',
  showWordmark = true,
  tagline,
  className = '',
  href = '/',
}: LogoProps) {
  const content = (
    <>
      <LogoMark size={size} variant={variant} />
      {showWordmark && (
        <div className="logo-text">
          <span className={`logo-wordmark logo-wordmark--${variant}`}>
            Pay<span className="logo-accent">Trail</span>
          </span>
          {tagline && <span className={`logo-tagline logo-tagline--${variant}`}>{tagline}</span>}
        </div>
      )}
    </>
  );

  const cls = `logo logo--${size} ${className}`.trim();

  if (href) {
    return (
      <Link to={href} className={cls} aria-label="PayTrail home">
        {content}
      </Link>
    );
  }

  return <div className={cls}>{content}</div>;
}
