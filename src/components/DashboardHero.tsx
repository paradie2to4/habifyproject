import React from 'react';

export interface HeroStat {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  /** Highlight a stat that needs attention (pending items etc.) */
  attention?: boolean;
  onClick?: () => void;
}

interface DashboardHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  stats?: HeroStat[];
}

/**
 * Deep tea-green header used by every dashboard. It keeps the light palette in
 * dark mode (palette-light), so it stays a rich green panel on both canvases.
 */
export const DashboardHero: React.FC<DashboardHeroProps> = ({ eyebrow, title, subtitle, actions, stats = [] }) => (
  <header className="palette-light relative overflow-hidden rounded-[28px] bg-tea-800 text-white topo">
    {/* Saffron sun — echoes the logo mark */}
    <div
      aria-hidden
      className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full"
      style={{ background: 'radial-gradient(circle, rgb(229 170 60 / 0.55) 0%, rgb(229 170 60 / 0.12) 45%, transparent 70%)' }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full"
      style={{ background: 'radial-gradient(circle, rgb(87 151 126 / 0.35) 0%, transparent 65%)' }}
    />

    <div className="relative px-6 sm:px-10 pt-8 sm:pt-10 pb-6 sm:pb-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-saffron-300">{eyebrow}</p>
          <h1 className="mt-3 font-display text-[2rem] sm:text-[2.6rem] font-bold leading-[1.05] tracking-tight text-white">
            {title}
          </h1>
          {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-tea-100">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {stats.length > 0 && (
        <dl className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(({ label, value, hint, icon: Icon, attention, onClick }) => {
            const Tag = onClick ? 'button' : 'div';
            return (
              <Tag
                key={label}
                {...(onClick ? { type: 'button' as const, onClick } : {})}
                className={`group text-left rounded-2xl p-4 sm:p-5 border backdrop-blur-sm transition-colors ${
                  attention ? 'bg-white/[0.14] border-saffron-300/40' : 'bg-white/[0.07] border-white/10'
                } ${onClick ? 'hover:bg-white/[0.14] cursor-pointer' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <dt className="text-xs font-medium text-tea-100">{label}</dt>
                  <span
                    className={`w-8 h-8 rounded-xl inline-flex items-center justify-center ${
                      attention ? 'bg-saffron-400 text-saffron-900' : 'bg-white/10 text-tea-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <dd className="mt-3 font-display text-3xl font-bold text-white tabular-nums tracking-tight">{value}</dd>
                {hint && <dd className="mt-1 text-xs text-tea-100/80">{hint}</dd>}
              </Tag>
            );
          })}
        </dl>
      )}
    </div>
  </header>
);

/** Buttons styled for the green hero. */
export const heroPrimaryBtn =
  'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-sm font-semibold bg-white text-tea-800 hover:bg-tea-50 active:scale-[0.98] transition-[background-color,transform]';
export const heroGhostBtn =
  'inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full text-sm font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/[0.18] active:scale-[0.98] transition-[background-color,transform]';

export function greetingFor(date = new Date()) {
  const h = date.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function todayLabel(date = new Date()) {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
