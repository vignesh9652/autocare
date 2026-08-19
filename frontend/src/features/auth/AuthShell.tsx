import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Settings2, CreditCard, Sparkles, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  { icon: Wrench, label: 'Trusted Mechanics' },
  { icon: Settings2, label: 'Quality Service' },
  { icon: CreditCard, label: 'Secure Payments' },
];

export function AuthShell({
  title,
  subtitle,
  children,
  bgImage,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** Optional full-page background image (overlays keep text readable). */
  bgImage?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex min-h-screen flex-col lg:flex-row',
        bgImage ? 'bg-ink-950' : 'bg-white dark:bg-ink-950'
      )}
    >
      {bgImage && (
        <div className="absolute inset-0 overflow-hidden">
          <img src={bgImage} alt="" className="h-full w-full animate-slow-zoom object-cover" />
          {/* Light overlay — the photo stays clearly visible while text remains readable */}
          <div className="absolute inset-0 bg-ink-950/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/35 to-ink-950/20" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950/70 to-transparent" />
        </div>
      )}

      {/* ── Left: AutoCare branding ─────────────────────────────────────── */}
      <aside
        className={cn(
          'relative z-10 flex flex-col justify-center overflow-hidden px-6 py-10 sm:px-10 lg:w-[55%] lg:px-14 lg:py-20',
          bgImage
            ? 'bg-gradient-to-br from-ink-950/95 via-ink-950/80 to-ink-950/40'
            : 'bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950'
        )}
      >
        {/* Subtle decorative automotive elements */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full border border-dashed border-white/10" />
        <div className="pointer-events-none absolute bottom-12 right-10 hidden h-40 w-40 rounded-full border border-white/5 lg:block" />
        <Car className="pointer-events-none absolute -bottom-8 -right-6 hidden h-56 w-56 text-white/[0.04] lg:block" aria-hidden="true" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mx-auto w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 lg:justify-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="font-display text-2xl font-bold text-white">AutoCare</span>
          </div>

          {/* Main tagline */}
          <h1 className="mt-8 text-center font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-left">
            Your Vehicle, <span className="text-gradient">Our Care.</span>
          </h1>

          {/* Short description — desktop only to keep the mobile stack compact */}
          <p className="mt-4 hidden max-w-md text-ink-300 lg:block">
            From routine maintenance to unexpected repairs, AutoCare connects you with trusted
            mechanics and makes vehicle servicing simple, transparent, and convenient.
          </p>

          {/* Feature highlights */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-sm"
              >
                <f.icon className="h-4 w-4 text-brand-400" />
                <span className="text-xs font-medium text-ink-200">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Supporting line */}
          <p className="mt-10 flex items-center justify-center gap-2 text-sm text-ink-400 lg:justify-start">
            <Sparkles className="h-4 w-4 shrink-0 text-brand-500/70" />
            Keep your vehicle running. Let AutoCare take care of the rest.
          </p>
        </motion.div>
      </aside>

      {/* ── Right: form card (unchanged) ────────────────────────────────── */}
      <div
        className={cn(
          'relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6',
          !bgImage && 'bg-white dark:bg-ink-950'
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'w-full max-w-sm',
            bgImage &&
              'rounded-3xl border border-white/10 bg-white/90 p-6 shadow-card-lg backdrop-blur-xl dark:bg-ink-950/85'
          )}
        >
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white">
              <Wrench className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">{title}</h1>
            <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
