import React from 'react';

interface HabifyLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
  markOnly?: boolean;
}

const markSizes = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-12 h-12'
};

const titleSizes = {
  sm: 'text-[19px]',
  md: 'text-[22px]',
  lg: 'text-3xl'
};

/** Mark: a roofline over tea-terrace contours, with a saffron sun. */
export const HabifyMark: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = ''
}) => (
  <svg viewBox="0 0 40 40" className={`${markSizes[size]} shrink-0 ${className}`} aria-hidden="true">
    <rect width="40" height="40" rx="12" fill="var(--color-tea-700)" />
    <circle cx="28.5" cy="12" r="3.2" fill="var(--color-saffron-400)" />
    <path d="M9 20.5 20 12l11 8.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 26.5c4-2.6 8-2.6 11 0s7.2 2.6 11 0" fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 31.5c4-2.6 8-2.6 11 0s7.2 2.6 11 0" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const HabifyLogo: React.FC<HabifyLogoProps> = ({
  size = 'md',
  showTagline = false,
  theme = 'auto',
  className = '',
  markOnly = false
}) => {
  const onDark = theme === 'dark';

  if (markOnly) return <HabifyMark size={size} className={className} />;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <HabifyMark size={size} />
      <div className="text-left leading-none">
        <span
          className={`font-display ${titleSizes[size]} font-bold tracking-[-0.04em] ${onDark ? 'text-white' : 'text-ink-900'}`}
        >
          habify<span className="text-saffron-500">.</span>
        </span>
        {showTagline && (
          <p className={`mt-1 text-[11px] font-medium ${onDark ? 'text-stone-400' : 'text-stone-600'} hidden sm:block`}>
            Find where you belong
          </p>
        )}
      </div>
    </div>
  );
};
