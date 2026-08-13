import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, ShieldCheck, CalendarCheck, CreditCard, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const perks = [
  { icon: ShieldCheck, text: 'Verified mechanics with real reviews' },
  { icon: CalendarCheck, text: 'Doorstep pickup & service scheduling' },
  { icon: CreditCard, text: 'Transparent pricing & secure payments' },
  { icon: Star, text: 'Rate your service after every job' },
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
    <div className={cn('relative flex min-h-screen', bgImage ? 'bg-ink-950' : 'bg-white dark:bg-ink-950')}>
      {bgImage && (
        <div className="absolute inset-0 overflow-hidden">
          <img src={bgImage} alt="" className="h-full w-full animate-slow-zoom object-cover" />
          {/* Light overlay — the photo stays clearly visible while text remains readable */}
          <div className="absolute inset-0 bg-ink-950/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/35 to-ink-950/20" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950/70 to-transparent" />
        </div>
      )}

      <div
        className={cn(
          'hidden flex-1 flex-col justify-center p-12 lg:flex',
          !bgImage && 'bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950'
        )}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md">
          <div className="flex items-center gap-2 font-display text-2xl font-bold text-white">
            <Wrench className="h-7 w-7 text-brand-500" /> Auto<span className="text-brand-500">Care</span>
          </div>
          <h2 className="mt-10 font-display text-3xl font-bold text-white">{title}</h2>
          <p className="mt-3 text-ink-300">{subtitle}</p>
          <div className="mt-12 space-y-5">
            {perks.map((p) => (
              <div key={p.text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                  <p.icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-ink-200">{p.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className={cn('relative flex flex-1 items-center justify-center p-4 sm:p-6', !bgImage && 'bg-white dark:bg-ink-950')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'w-full max-w-sm',
            bgImage && 'rounded-3xl border border-white/10 bg-white/90 p-6 shadow-card-lg backdrop-blur-xl dark:bg-ink-950/85'
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
