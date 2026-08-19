import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Wrench, Star, ArrowRight, ShieldCheck, Clock, Car, Search, CalendarCheck,
  Droplets, Disc3, Cog, Snowflake, CircleDashed, BatteryCharging, Gauge, Sparkles, Package,
  MapPin, BadgeCheck, Lock, HandCoins, type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { serviceApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { HERO_BG, CTA_BG, SERVICE_IMAGES, HOW_IT_WORKS_IMG, TRUST_IMG, SERVICE_FALLBACK } from '@/lib/images';

interface ServiceVisual {
  icon: LucideIcon;
  /** Tailwind bg class for the icon chip on the card image. */
  accent: string;
  image: string;
}

/**
 * Visual identity per service, keyed by the catalogue's normalised name.
 * Unknown services gracefully fall back to the generic workshop look.
 */
const SERVICE_VISUALS: Record<string, ServiceVisual> = {
  'oil change': { icon: Droplets, accent: 'bg-amber-500', image: SERVICE_IMAGES['Oil Change'] },
  'general service': { icon: Cog, accent: 'bg-violet-500', image: SERVICE_FALLBACK },
  'brake repair': { icon: Disc3, accent: 'bg-rose-500', image: SERVICE_IMAGES['Brake Repair'] },
  'engine service': { icon: Cog, accent: 'bg-violet-500', image: SERVICE_IMAGES['Engine Service'] },
  'engine diagnostics': { icon: Gauge, accent: 'bg-indigo-500', image: SERVICE_IMAGES['Engine Service'] },
  'ac repair': { icon: Snowflake, accent: 'bg-sky-500', image: SERVICE_IMAGES['AC Repair'] },
  'ac service': { icon: Snowflake, accent: 'bg-sky-500', image: SERVICE_IMAGES['AC Repair'] },
  'tire change': { icon: CircleDashed, accent: 'bg-emerald-500', image: SERVICE_IMAGES['Tire Change'] },
  'tyre change': { icon: CircleDashed, accent: 'bg-emerald-500', image: SERVICE_IMAGES['Tire Change'] },
  'tyre care': { icon: CircleDashed, accent: 'bg-emerald-500', image: SERVICE_IMAGES['Tire Change'] },
  'battery check': { icon: BatteryCharging, accent: 'bg-lime-500', image: SERVICE_IMAGES['Battery Check'] },
  'battery replacement': { icon: BatteryCharging, accent: 'bg-lime-500', image: SERVICE_IMAGES['Battery Check'] },
  'detailing & wash': { icon: Sparkles, accent: 'bg-cyan-500', image: SERVICE_FALLBACK },
  'insurance claim support': { icon: ShieldCheck, accent: 'bg-blue-500', image: SERVICE_FALLBACK },
};

const SERVICE_VISUALS_DEFAULT: ServiceVisual = { icon: Wrench, accent: 'bg-brand-500', image: SERVICE_FALLBACK };

function serviceVisual(name: string): ServiceVisual {
  return SERVICE_VISUALS[normalizeName(name)] ?? SERVICE_VISUALS_DEFAULT;
}

const steps = [
  { icon: Search, title: 'Find a Mechanic', desc: 'Browse verified mechanics with real ratings near you.' },
  { icon: CalendarCheck, title: 'Book a Service', desc: 'Pick a service and slot — we handle pickup & drop.' },
  { icon: Star, title: 'Track & Review', desc: 'Live job tracking, then rate the experience.' },
];

const heroPerks = [
  { icon: ShieldCheck, label: 'Verified mechanics' },
  { icon: MapPin, label: 'Doorstep service' },
  { icon: BadgeCheck, label: 'Genuine parts' },
  { icon: Lock, label: 'Secure payments' },
];

const trustFeatures = [
  { icon: ShieldCheck, title: 'Verified Experts', desc: 'Every mechanic passes ID, skill and background checks.' },
  { icon: Clock, title: 'On-Time, Every Time', desc: 'Live status tracking so you always know where your car is.' },
  { icon: Car, title: 'Doorstep Convenience', desc: 'We pick up, service, and drop off your vehicle.' },
];

/** Matches the backend's catalogue normalizer: trim, lowercase, collapse spaces. */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function LandingScreen() {
  const user = useAuthStore((s) => s.user);
  const rolePath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'MECHANIC' ? '/mechanic' : '/dashboard';
  const bookPath = user ? rolePath : '/register';

  // Real services straight from the platform catalogue (hidden when unavailable).
  const { data: catalog } = useQuery({
    queryKey: ['home-services'],
    queryFn: serviceApi.getAll,
    staleTime: 60_000,
  });
  const activeServices = (catalog ?? []).filter((s) => s.active);
  const hasActiveServices = activeServices.length > 0;

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Background image with dark overlays */}
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="AutoCare workshop" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-ink-950/85" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/40 to-ink-950" />
        </div>
        {/* Soft grid + glow accents */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-brand-600/15 blur-3xl" />

        <div className="container-app relative py-20 sm:py-24 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400">
              <ShieldCheck className="h-4 w-4" /> Verified mechanics · Doorstep service
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Your Vehicle Deserves
              <span className="block text-gradient">The Best Care</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
              Book trusted mechanics, track repairs live, and buy genuine spare parts — all from your phone.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <Link to={rolePath}>
                  <Button size="lg" className="gap-2 shadow-glow">
                    Go to Dashboard <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="gap-2 shadow-glow">Get Started Free <ArrowRight className="h-5 w-5" /></Button>
                  </Link>
                  <Link to="/mechanics">
                    <Button variant="secondary" size="lg" className="border-ink-700 bg-transparent text-white hover:bg-ink-800">
                      Find Mechanics
                    </Button>
                  </Link>
                </>
              )}
            </div>
            {/* Trust chips */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs font-medium text-ink-300">
              {heroPerks.map((perk) => (
                <span key={perk.label} className="flex items-center gap-1.5">
                  <perk.icon className="h-4 w-4 text-brand-400" /> {perk.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="h-16 bg-gradient-to-t from-ink-50 dark:from-ink-950" />
      </section>

      {/* SERVICES — hidden entirely when the catalogue is unavailable */}
      {hasActiveServices && (
        <section className="bg-ink-50 py-20 dark:bg-ink-950">
          <div className="container-app">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Transparent pricing</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-ink-900 dark:text-white sm:text-4xl">Services We Offer</h2>
              <p className="mt-3 text-ink-500 dark:text-ink-400">From routine maintenance to major repairs, at your doorstep.</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {activeServices.map((s, i) => {
                const visual = serviceVisual(s.serviceName);
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="card group overflow-hidden transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-lg dark:hover:border-brand-500/40"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={visual.image}
                        alt={s.serviceName}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                      <span className="absolute right-3 top-3 rounded-full bg-ink-950/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                        from {formatCurrency(s.basePrice)}
                      </span>
                      <div className={`absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg transition group-hover:scale-110 ${visual.accent}`}>
                        <visual.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-ink-900 dark:text-ink-100">{s.serviceName}</h3>
                      {s.description && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{s.description}</p>}
                      <Link
                        to={bookPath}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition group-hover:gap-2.5 dark:text-brand-400"
                      >
                        Book now <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="bg-white py-20 dark:bg-ink-900">
        <div className="container-app">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative">
              <img
                src={HOW_IT_WORKS_IMG}
                alt="Mechanic working on brakes"
                className="aspect-[4/3] w-full rounded-3xl object-cover shadow-card-lg"
              />
              <div className="absolute -bottom-5 -right-4 hidden rounded-2xl bg-brand-500 px-5 py-4 text-white shadow-glow sm:block">
                <p className="font-display text-2xl font-bold">3 Steps</p>
                <p className="text-xs opacity-90">to a serviced car</p>
              </div>
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold text-ink-900 dark:text-white sm:text-4xl">How It Works</h2>
              <p className="mt-3 text-ink-500 dark:text-ink-400">Three simple steps to a serviced vehicle.</p>
              <div className="relative mt-10 space-y-8">
                {/* Timeline connector behind the step icons */}
                <span
                  aria-hidden
                  className="absolute bottom-6 left-7 top-6 hidden w-px bg-gradient-to-b from-brand-300 via-brand-200 to-transparent sm:block dark:from-brand-500/50 dark:via-brand-500/30"
                />
                {steps.map((step, i) => (
                  <div key={step.title} className="relative flex gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg ring-4 ring-white dark:ring-ink-900">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">Step {i + 1}</span>
                      <h3 className="mt-0.5 text-lg font-bold text-ink-900 dark:text-ink-100">{step.title}</h3>
                      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-ink-50 py-20 dark:bg-ink-950">
        <div className="container-app">
          <div className="relative mb-16 overflow-hidden rounded-3xl">
            <img src={TRUST_IMG} alt="Trusted mechanics at work" className="h-64 w-full object-cover sm:h-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-8 sm:p-12">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Why AutoCare</p>
              <h2 className="mt-2 max-w-md font-display text-2xl font-bold text-white sm:text-3xl">Trusted care, from verified professionals</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {trustFeatures.map((f) => (
              <div key={f.title} className="card flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <f.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-ink-900 dark:text-ink-100">{f.title}</h3>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dual CTA — customers & mechanics */}
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card relative overflow-hidden p-8"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/10 blur-2xl" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg">
                <Car className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-ink-900 dark:text-ink-100">For your vehicle</h3>
              <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
                Book a doorstep service, approve only what your car needs, and pay securely after the job.
              </p>
              <Link to={bookPath} className="mt-5 inline-block">
                <Button className="gap-2">Book a Service <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="card relative overflow-hidden p-8"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-ink-900 dark:text-ink-100">For mechanics</h3>
              <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
                Join the AutoCare network, get bookings near you, and track every rupee you earn in your wallet.
              </p>
              <Link to={user ? rolePath : '/register/mechanic'} className="mt-5 inline-block">
                <Button variant="secondary" className="gap-2">Join as a Mechanic <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </motion.div>
          </div>

          {/* CTA banner */}
          <div className="relative mt-16 overflow-hidden rounded-3xl">
            <img src={CTA_BG} alt="Car ready for service" className="h-56 w-full object-cover sm:h-64" />
            <div className="absolute inset-0 bg-ink-950/70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">Ready to get your car serviced?</h3>
              <Link to={bookPath}>
                <Button size="lg" className="shadow-glow">
                  {user ? 'Go to Dashboard' : 'Book Your First Service'} <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Brand strip */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-ink-400 dark:text-ink-500">
            <span className="flex items-center gap-2 text-sm font-medium"><HandCoins className="h-4 w-4" /> No hidden fees</span>
            <span className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4" /> Background-checked pros</span>
            <span className="flex items-center gap-2 text-sm font-medium"><Clock className="h-4 w-4" /> Live job tracking</span>
            <span className="flex items-center gap-2 text-sm font-medium"><Package className="h-4 w-4" /> Genuine spare parts</span>
          </div>
        </div>
      </section>
    </div>
  );
}
