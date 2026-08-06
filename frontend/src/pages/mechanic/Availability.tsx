import { useMemo, useState } from 'react';
import { Clock4, MapPin, Save, Wifi, WifiOff, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Toggle from '@/components/ui/Toggle';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getMechanics, updateAvailability } from '@/api/mechanicApi';
import { cn } from '@/utils/cn';

const AREAS = ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Electronic City', 'Jayanagar'];

export default function Availability() {
  const { user } = useAuth();
  const mechanics = useApiData(() => getMechanics(), []);

  const mine =
    (mechanics.data ?? []).find((m) => m.email.toLowerCase() === (user?.email ?? '').toLowerCase()) ??
    null;

  const [emergency, setEmergency] = useState(false);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('19:00');
  const [areas, setAreas] = useState<string[]>([AREAS[0], AREAS[2]]);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const online = useMemo(
    () => (mine ? mine.availabilityStatus === 'AVAILABLE' : false),
    [mine],
  );

  const toggleArea = (area: string) =>
    setAreas((a) => (a.includes(area) ? a.filter((x) => x !== area) : [...a, area]));

  const saveStatus = async () => {
    if (!mine) return;
    setSaving(true);
    try {
      await updateAvailability(mine.id, {
        availabilityStatus: online ? 'OFFLINE' : 'AVAILABLE',
      });
      success('Availability updated', online ? 'You are now offline.' : 'You are now online.');
      mechanics.refresh();
    } catch (err) {
      error('Could not update availability', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (mechanics.loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Availability" subtitle="Control when and where customers can book you" icon={<Clock4 className="h-5 w-5" />} />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!mine) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Availability" subtitle="Control when and where customers can book you" icon={<Clock4 className="h-5 w-5" />} />
        <div className="card">
          <EmptyState
            icon={<WifiOff className="h-9 w-9" />}
            title="No mechanic profile linked"
            description="Ask an admin to link a mechanic profile to your account — your online status and service area will show up here."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Availability"
        subtitle="Control when and where customers can book you"
        icon={<Clock4 className="h-5 w-5" />}
        actions={<Button onClick={saveStatus} disabled={saving}><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Changes'}</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Online status */}
        <div
          className={cn(
            'card relative overflow-hidden p-6 transition-colors',
            online ? 'border-emerald-300/60 dark:border-emerald-500/40' : '',
          )}
        >
          {online && (
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl" />
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg',
                  online
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
                )}
              >
                {online ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
              </span>
              <div>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                  You are {online ? 'Online' : 'Offline'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {online
                    ? 'Customers can see and book you right now'
                    : 'You will not receive new booking requests'}
                </p>
              </div>
            </div>
            <Badge variant={online ? 'success' : 'neutral'} dot>{online ? 'Accepting jobs' : 'Not accepting'}</Badge>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Toggle
              checked={online}
              onChange={() => saveStatus()}
              label="Go online / offline"
              description="Toggle your availability instantly"
            />
          </div>
        </div>

        {/* Working hours + areas */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Working Hours</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Starts at</label>
                <input type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <label className="label">Ends at</label>
                <input type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              Preferred hours are stored on this device only — the backend does not persist schedules yet.
            </p>
            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <Toggle checked={emergency} onChange={setEmergency} label="Emergency availability" description="Accept urgent jobs within 2 hours (+₹500/job)" />
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
              <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Service Area
            </h3>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              Registered area: <span className="font-semibold text-slate-700 dark:text-slate-200">{mine.serviceArea}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleArea(area)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
                    areas.includes(area)
                      ? 'border-transparent bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md shadow-brand-600/20'
                      : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:text-brand-400',
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {emergency && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
              <Zap className="h-5 w-5 shrink-0" />
              <p className="text-xs">Emergency jobs will be dispatched to you first within your service area.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
