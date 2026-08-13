import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wrench, Star, ArrowRight, ShieldCheck, Clock, Car, Search, CalendarCheck, Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { HERO_BG, CTA_BG, SERVICE_IMAGES, HOW_IT_WORKS_IMG, TRUST_IMG, TESTIMONIAL_AVATAR } from '@/lib/images';

const services = [
  { icon: Wrench, label: 'Oil Change', desc: 'Keep your engine running smoothly' },
  { icon: Wrench, label: 'Brake Repair', desc: 'Certified safety-first brake service' },
  { icon: Car, label: 'Engine Service', desc: 'Full diagnostics & engine care' },
  { icon: Wrench, label: 'AC Repair', desc: 'Get cool again with pro AC service' },
  { icon: Wrench, label: 'Tire Change', desc: 'Quick, reliable tyre service' },
  { icon: Car, label: 'Battery Check', desc: 'Testing & replacement at your doorstep' },
];

const steps = [
  { icon: Search, title: 'Find a Mechanic', desc: 'Browse verified mechanics with real ratings near you.' },
  { icon: CalendarCheck, title: 'Book a Service', desc: 'Pick a service and slot — we handle pickup & drop.' },
  { icon: Star, title: 'Track & Review', desc: 'Live job tracking, then rate the experience.' },
];

const stats = [
  { value: '500+', label: 'Trusted Mechanics' },
  { value: '10,000+', label: 'Services Done' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '50+', label: 'Cities Covered' },
];

export function LandingScreen() {
  const user = useAuthStore((s) => s.user);
  const rolePath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'MECHANIC' ? '/mechanic' : '/dashboard';

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
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-brand-600/15 blur-3xl" />

        <div className="container-app relative py-20 sm:py-28 lg:py-36">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400">
              <Star className="h-4 w-4" /> Trusted by 10,000+ vehicle owners
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Your Vehicle Deserves
              <span className="block text-brand-400">The Best Care</span>
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:mt-20"
          >
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-ink-800 bg-ink-800/30 px-4 py-5 text-center backdrop-blur-sm">
                <p className="font-display text-2xl font-bold text-brand-400 sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-ink-400">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
        <div className="h-16 bg-gradient-to-t from-ink-50 dark:from-ink-950" />
      </section>

      {/* SERVICES */}
      <section className="bg-ink-50 py-20 dark:bg-ink-950">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-ink-900 dark:text-white sm:text-4xl">Services We Offer</h2>
            <p className="mt-3 text-ink-500 dark:text-ink-400">From routine maintenance to major repairs, at your doorstep.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card group overflow-hidden transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-lg dark:hover:border-brand-500/40"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={SERVICE_IMAGES[s.label]}
                    alt={s.label}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg transition group-hover:scale-110">
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-ink-900 dark:text-ink-100">{s.label}</h3>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
              <div className="mt-10 space-y-8">
                {steps.map((step, i) => (
                  <div key={step.title} className="relative flex gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg">
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
            {[
              { icon: ShieldCheck, title: 'Verified Experts', desc: 'Every mechanic passes ID, skill and background checks.' },
              { icon: Clock, title: 'On-Time, Every Time', desc: 'Live status tracking so you always know where your car is.' },
              { icon: Car, title: 'Doorstep Convenience', desc: 'We pick up, service, and drop off your vehicle.' },
            ].map((f) => (
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

          <div className="mx-auto mt-16 max-w-3xl rounded-3xl bg-white shadow-card dark:bg-ink-900">
            <div className="p-8 text-center sm:p-12">
            <Quote className="mx-auto h-10 w-10 text-brand-200 dark:text-brand-500/30" />
            <p className="mt-4 text-lg font-medium leading-relaxed text-ink-700 dark:text-ink-200">
              "AutoCare made it incredibly easy to find a reliable mechanic. Booked an oil change in minutes and the live tracking was amazing!"
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <img src={TESTIMONIAL_AVATAR} alt="Rajesh K." className="h-11 w-11 rounded-full object-cover ring-2 ring-brand-500/30" />
              <div className="text-left">
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Rajesh K.</p>
                <p className="text-xs text-ink-400">Happy Customer</p>
              </div>
            </div>
            </div>
          </div>

          {/* CTA banner */}
          <div className="relative mt-16 overflow-hidden rounded-3xl">
            <img src={CTA_BG} alt="Car ready for service" className="h-56 w-full object-cover sm:h-64" />
            <div className="absolute inset-0 bg-ink-950/70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">Ready to get your car serviced?</h3>
              <Link to={user ? rolePath : '/register'}>
                <Button size="lg" className="shadow-glow">
                  {user ? 'Go to Dashboard' : 'Book Your First Service'} <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
