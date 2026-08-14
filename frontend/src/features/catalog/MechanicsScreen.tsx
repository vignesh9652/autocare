import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Wrench, ArrowRight, LocateFixed, Loader2, Navigation, X } from 'lucide-react';
import { mechanicApi } from '@/lib/api';
import { mechanicImageUrl } from '@/lib/images';
import { detectLiveLocation, haversineKm, formatDistanceKm, isGeolocationSupported } from '@/lib/geolocation';
import { CardSkeleton, EmptyState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from '@/stores/toast-store';
import { MechanicResponse } from '@/types';

const AREAS = ['All', 'Downtown', 'Brooklyn', 'Manhattan', 'Queens'];
const RADII = [5, 10, 25, 50];

interface WithDistance extends MechanicResponse {
  distanceKm?: number;
}

export function MechanicsScreen() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; area: string } | null>(null);
  const [radius, setRadius] = useState(25);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['mechanics', area],
    queryFn: () => mechanicApi.getAll({ available: true, area: area || undefined }),
  });

  const handleLocate = async () => {
    if (!isGeolocationSupported()) {
      toast('Geolocation is not supported by this browser', 'error');
      return;
    }
    setLocating(true);
    try {
      const loc = await detectLiveLocation();
      setLocation({ latitude: loc.latitude, longitude: loc.longitude, area: loc.area });
      toast(`Locating mechanics near ${loc.area}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not detect your location', 'error');
    } finally {
      setLocating(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setRadius(25);
  };

  const visible = useMemo<WithDistance[]>(() => {
    let list = (data ?? []).map((m) => ({ ...m })) as WithDistance[];
    if (search) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
          m.serviceArea.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (location) {
      // Compute distance for mechanics that have coordinates
      for (const m of list) {
        if (m.latitude != null && m.longitude != null) {
          m.distanceKm = haversineKm(location.latitude, location.longitude, m.latitude, m.longitude);
        }
      }
      // Filter to radius (mechanics without coords are kept, sorted last)
      list = list.filter((m) => m.distanceKm === undefined || m.distanceKm <= radius);
      // Sort: closest first, mechanics without coords at the end
      list.sort((a, b) => {
        if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
        if (a.distanceKm === undefined) return 1;
        if (b.distanceKm === undefined) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }
    return list;
  }, [data, search, location, radius]);

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <section className="bg-gradient-to-b from-ink-950 to-ink-900 py-16">
        <div className="container-app text-center">
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Find a Mechanic</h1>
          <p className="mt-3 text-ink-300">Browse trusted mechanics near you</p>

          {/* Live location control */}
          <div className="mx-auto mt-8 max-w-xl">
            {location ? (
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-brand-500/40 bg-brand-500/10 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2 text-left">
                  <Navigation className="h-4 w-4 shrink-0 text-brand-400" />
                  <p className="truncate text-sm font-medium text-white">
                    Showing mechanics within <span className="font-bold text-brand-400">{radius} km</span> of {location.area}
                  </p>
                </div>
                <button onClick={clearLocation} className="shrink-0 rounded-lg p-1 text-ink-300 transition hover:bg-ink-800 hover:text-white" aria-label="Clear location">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => void handleLocate()}
                disabled={locating}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-ink-600 bg-ink-800/60 px-4 py-3 text-sm font-semibold text-white transition hover:border-brand-500 hover:bg-ink-800 disabled:opacity-60"
              >
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4 text-brand-400" />}
                {locating ? 'Detecting your location…' : 'Find mechanics near me'}
              </button>
            )}
            {location && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-xs font-medium text-ink-400">Within</span>
                {RADII.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold transition',
                      radius === r ? 'bg-brand-500 text-white' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                    )}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-ink-700 bg-ink-800/50 px-4 py-1.5">
            <Search className="h-5 w-5 shrink-0 text-ink-400" />
            <input
              id="mechanics-search"
              className="w-full border-0 bg-transparent py-2 text-sm text-white placeholder:text-ink-500 outline-none"
              placeholder="Search by name, skill, or area…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {AREAS.map((a) => (
              <button
                key={a}
                onClick={() => setArea(a === 'All' ? '' : a)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  (a === 'All' && !area) || area === a ? 'bg-brand-500 text-white' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-app py-12">
        {isLoading ? (
          <CardSkeleton count={6} />
        ) : isError ? (
          <EmptyState icon={<Wrench className="h-6 w-6" />} title="Couldn't load mechanics" description="Please try again." action={<Button variant="secondary" onClick={() => void refetch()}>Retry</Button>} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-6 w-6" />}
            title={location ? `No mechanics within ${radius} km` : 'No mechanics found'}
            description={location ? 'Try a larger radius or clear the location filter.' : 'Try a different area or search term.'}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card group overflow-hidden transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-lg dark:hover:border-brand-500/40"
              >
                <div className="flex items-start gap-4 p-5">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-2 ring-brand-500/20">
                    <img src={mechanicImageUrl(m.id)} alt={m.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-ink-900 dark:text-ink-100">{m.name}</h3>
                      <Badge variant={m.availabilityStatus === 'AVAILABLE' ? 'success' : m.availabilityStatus === 'BUSY' ? 'warning' : 'neutral'}>
                        {m.availabilityStatus}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                      <MapPin className="h-3.5 w-3.5" /> {m.serviceArea}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.skills.slice(0, 3).map((s) => <Badge key={s} variant="neutral">{s}</Badge>)}
                      {m.skills.length > 3 && <Badge>+{m.skills.length - 3}</Badge>}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                      <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400" /> {m.averageRating?.toFixed(1) ?? 'New'}</span>
                      <span>{m.totalJobsCompleted} jobs</span>
                      {m.distanceKm !== undefined ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                          <Navigation className="h-3 w-3" /> {formatDistanceKm(m.distanceKm)} away
                        </span>
                      ) : (
                        location && <span className="text-ink-400">distance n/a</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="border-t border-ink-100 px-5 py-3 dark:border-ink-800">
                  {user ? (
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/dashboard/book-service')}>
                      Book Now <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/login')}>
                      Sign in to Book
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
