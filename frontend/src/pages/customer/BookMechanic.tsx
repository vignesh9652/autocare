import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  MapPin,
  Star,
  UserCheck,
  Wrench,
} from 'lucide-react';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Toggle from '@/components/ui/Toggle';
import PartVisual from '@/components/marketplace/PartVisual';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getPart } from '@/api/sparePartsApi';
import { getMechanics } from '@/api/mechanicApi';
import { toDashMechanic, toMarketplacePart } from '@/utils/apiMappers';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';

export default function BookMechanic() {
  const { id } = useParams<{ id: string }>();
  const partId = Number(id);
  const part = useApiData(() => getPart(partId), [partId]);
  const mechanics = useApiData(() => getMechanics(), []);
  const navigate = useNavigate();
  const { info } = useToast();

  const marketplacePart = useMemo(
    () => (part.data ? toMarketplacePart(part.data) : undefined),
    [part.data],
  );
  const dashMechanics = useMemo(
    () => (mechanics.data ?? []).map(toDashMechanic),
    [mechanics.data],
  );
  const serviceAreaById = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of mechanics.data ?? []) map.set(m.id, m.serviceArea);
    return map;
  }, [mechanics.data]);
  const available = useMemo(
    () => [...dashMechanics].sort((a, b) => Number(b.available) - Number(a.available)),
    [dashMechanics],
  );

  const [mechanicId, setMechanicId] = useState<number | null>(null);
  const [dateIndex, setDateIndex] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [homeService, setHomeService] = useState(true);
  const [location, setLocation] = useState('Home · Indiranagar, Bengaluru');

  const [searchParams] = useSearchParams();
  const qty = Math.max(1, Number(searchParams.get('qty') ?? 1));

  const dates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      return d;
    });
  }, []);

  if (!part.data || !marketplacePart) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading part…</p>
        <Link to="/customer/parts" className="mt-2 inline-block text-sm font-semibold">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  if (!marketplacePart.mechanicInstall) {
    return (
      <div className="card p-8 text-center">
        <EmptyState
          icon={<Wrench className="h-9 w-9" />}
          title="Installation service not available yet"
          description="This part can be bought DIY with a guided installation guide. Certified mechanic installation is coming soon."
          action={
            <Button onClick={() => navigate(`/customer/parts/${marketplacePart.id}`)}>
              View part & DIY guide
            </Button>
          }
        />
        <Link to="/customer/parts" className="mt-3 inline-block text-sm font-semibold">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  const selectedMechanic = available.find((m) => m.id === mechanicId) ?? null;

  const continueToPayment = () => {
    if (!selectedMechanic) {
      info('Choose a mechanic', 'Please select a mechanic for the installation.');
      return;
    }
    if (!time) {
      info('Pick a time slot', 'Select a convenient time for the visit.');
      return;
    }
    const date = dates[dateIndex];
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    navigate(
      `/customer/checkout?part=${marketplacePart.id}&mode=mechanic&mechanic=${selectedMechanic.id}&date=${iso}&time=${time}&home=${homeService ? 1 : 0}&qty=${qty}`,
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link to="/customer/parts" className="font-medium hover:text-brand-600 dark:hover:text-brand-400">
          Marketplace
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          to={`/customer/parts/${marketplacePart.id}`}
          className="font-medium hover:text-brand-600 dark:hover:text-brand-400"
        >
          {marketplacePart.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">Book Mechanic</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Booking steps */}
        <div className="space-y-6 lg:col-span-2">
          {/* Step 1 — mechanic */}
          <section className="card p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-sky-500 text-sm font-bold text-white">
                1
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Choose your AutoCare certified mechanic
                </h2>
                <p className="text-xs text-slate-400">
                  {available.filter((m) => m.available).length} available near you
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {available.map((m) => {
                const selected = selectedMechanic?.id === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    disabled={!m.available}
                    onClick={() => {
                      setMechanicId(m.id);
                      setTime(null);
                      setHomeService(true);
                    }}
                    className={cn(
                      'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all',
                      selected
                        ? 'border-brand-400 bg-brand-50/60 shadow-md ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/10'
                        : 'card hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:hover:border-brand-500/40',
                      !m.available && 'cursor-not-allowed opacity-55 hover:translate-y-0 hover:border-slate-200 hover:shadow-none dark:hover:border-slate-700',
                    )}
                  >
                    <Avatar name={m.name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{m.name}</p>
                        {!m.available && <Badge variant="neutral">Busy</Badge>}
                        {selected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {m.jobsCompleted.toLocaleString('en-IN')} jobs completed
                        {serviceAreaById.get(m.id) ? ` · ${serviceAreaById.get(m.id)}` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 space-y-1.5 text-right text-xs">
                      <p className="flex items-center justify-end gap-1 font-bold text-slate-700 dark:text-slate-200">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {m.rating.toFixed(1)}
                      </p>
                      <p className="flex items-center justify-end gap-1 text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5" /> {serviceAreaById.get(m.id) ?? '—'}
                      </p>
                      <Badge variant={m.available ? 'success' : 'warning'} dot>
                        {m.available ? 'Available' : 'Busy'}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 2 — date & time */}
          <section
            className={cn('card p-6', !selectedMechanic && 'pointer-events-none opacity-50')}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-sky-500 text-sm font-bold text-white">
                2
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Select date &amp; time
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedMechanic ? `with ${selectedMechanic.name}` : 'Pick a mechanic first'}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {dates.map((d, i) => (
                <button
                  key={d.toISOString()}
                  onClick={() => {
                    setDateIndex(i);
                    setTime(null);
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-center transition-all',
                    i === dateIndex
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'border-slate-200 text-slate-500 hover:border-brand-300 dark:border-slate-700 dark:text-slate-400',
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase">
                    {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-extrabold">{d.getDate()}</span>
                  <span className="text-[10px] uppercase">
                    {d.toLocaleDateString('en-IN', { month: 'short' })}
                  </span>
                </button>
              ))}
            </div>

            <p className="label mt-5">Available time slots</p>
            {selectedMechanic ? (
              <p className="text-xs text-slate-400">
                Choose any slot — the mechanic will confirm shortly after payment.
              </p>
            ) : (
              <p className="text-xs text-slate-400">Choose a mechanic to see their slots.</p>
            )}
          </section>

          {/* Step 3 — location */}
          <section
            className={cn('card p-6', (!selectedMechanic || !time) && 'pointer-events-none opacity-50')}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-sky-500 text-sm font-bold text-white">
                3
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Where should we come?
                </h2>
                <p className="text-xs text-slate-400">Confirm your preferred service address</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700">
                <Toggle
                  checked={homeService}
                  onChange={setHomeService}
                  label="Home service"
                  description="The mechanic visits your address and installs the part there"
                />
              </div>

              {homeService ? (
                <div>
                  <label className="label">Delivery & service address</label>
                  <select className="select" value={location} onChange={(e) => setLocation(e.target.value)}>
                    <option>Home · Indiranagar, Bengaluru</option>
                    <option>Home · HSR Layout, Bengaluru</option>
                    <option>Office · Koramangala, Bengaluru</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <Wrench className="h-4 w-4 shrink-0 text-brand-500" />
                  AutoCare Workshop · Koramangala — drop your vehicle or collect the part and we
                  install it while you wait.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Summary */}
        <div>
          <div className="card sticky top-20 space-y-4 p-5">
            <div className="flex items-center gap-3">
              <PartVisual part={marketplacePart} className="h-14 w-14 shrink-0 rounded-xl" iconClassName="h-7 w-7" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                  {marketplacePart.name}
                </p>
                <p className="text-xs text-slate-400">Qty {qty} · {marketplacePart.brand}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
              <p className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Part price</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatCurrency(marketplacePart.price * qty)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Installation charge</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatCurrency(marketplacePart.mechanicInstall?.installationCharge ?? 0)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Est. install time</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {marketplacePart.mechanicInstall?.estimatedTime ?? '—'}
                </span>
              </p>
              {selectedMechanic && time && (
                <p className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Slot</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {dates[dateIndex].toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
                    · {time}
                  </span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <UserCheck className="h-4 w-4 shrink-0" />
              Certified &amp; background-verified mechanics only
            </div>

            <Button className="w-full" onClick={continueToPayment}>
              Continue to Payment <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate(`/customer/parts/${marketplacePart.id}`)}>
              <ArrowLeft className="h-4 w-4" /> Back to Part
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
