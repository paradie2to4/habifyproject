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
  sm: 'text-[15px]',
  md: 'text-lg',
  lg: 'text-2xl'
};

export const HabifyMark: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = ''
}) => (
  <svg
    viewBox="0 0 40 40"
    className={`${markSizes[size]} ${className}`}
    aria-hidden="true"
  >
    <rect width="40" height="40" rx="10" fill="#1a2942" />
    <path
      d="M10 19.5L20 11l10 8.5V30a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V19.5z"
      fill="none"
      stroke="#faf8f5"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <rect x="17.5" y="23.5" width="5" height="8.5" rx="0.8" fill="#d46251" />
  </svg>
);

export const HabifyLogo: React.FC<HabifyLogoProps> = ({
  size = 'md',
  showTagline = false,
  theme = 'auto',
  className = '',
  markOnly = false
}) => {
  const isDark = theme === 'dark';

  if (markOnly) {
    return <HabifyMark size={size} className={className} />;
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <HabifyMark size={size} />
      <div className="text-left leading-tight">
        <span
          className={`${titleSizes[size]} font-semibold tracking-tight ${
            isDark ? 'text-white' : 'text-navy-900'
          }`}
        >
          Hab<span className="text-terra-600">i</span>fy
        </span>
        {showTagline && (
          <p
            className={`mt-0.5 text-[11px] font-medium tracking-wide ${
              isDark ? 'text-cream-400' : 'text-cream-600'
            } hidden sm:block`}
          >
            Find Where You Belong.
          </p>
        )}
      </div>
    </div>
  );
};
