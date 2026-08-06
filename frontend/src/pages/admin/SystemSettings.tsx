import { useState } from 'react';
import { Check, DatabaseBackup, Plus, Save, Settings, Shield, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Toggle from '@/components/ui/Toggle';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';

const ROLES = [
  { role: 'ADMIN', desc: 'Full platform control', permissions: { view: true, edit: true, delete: true } },
  { role: 'MECHANIC', desc: 'Jobs, repairs & earnings', permissions: { view: true, edit: true, delete: false } },
  { role: 'CUSTOMER', desc: 'Own vehicles & bookings', permissions: { view: true, edit: true, delete: false } },
];

const INITIAL_CATEGORIES = ['Engine Repair', 'AC Service', 'Brake Service', 'EV Service', 'Car Detailing'];

const TEMPLATES = [
  { name: 'Booking confirmed', subject: 'Your booking {id} is confirmed' },
  { name: 'Repair completed', subject: 'Your car is ready — {vehicle}' },
  { name: 'Payment receipt', subject: 'Payment received for {booking}' },
  { name: 'Service reminder', subject: '{vehicle} service due on {date}' },
];

export default function SystemSettings() {
  const [gst, setGst] = useState('18');
  const [autoBackup, setAutoBackup] = useState(true);
  const [admin2FA, setAdmin2FA] = useState(true);
  const [timeout, setTimeoutVal] = useState('30');
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const { success } = useToast();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="System Settings"
        subtitle="Roles, permissions, taxes, templates and platform configuration"
        icon={<Settings className="h-5 w-5" />}
        actions={<Button onClick={() => success('Settings saved', 'All system settings were updated.')}><Save className="h-4 w-4" /> Save All</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Roles & permissions */}
        <div className="card p-6">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Shield className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Roles & Permissions
          </h3>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Granular access control per role</p>
          <div className="space-y-3">
            {ROLES.map((r) => (
              <div key={r.role} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.role}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{r.desc}</p>
                  </div>
                  <Badge variant={r.role === 'ADMIN' ? 'danger' : r.role === 'MECHANIC' ? 'info' : 'success'}>{r.role}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  {(['view', 'edit', 'delete'] as const).map((p) => (
                    <span
                      key={p}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize',
                        r.permissions[p]
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
                      )}
                    >
                      {p} {r.permissions[p] ? '✓' : '—'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Service categories */}
          <div className="card p-6">
            <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Service Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c} className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 py-1 pl-3.5 pr-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                  {c}
                  <button
                    onClick={() => setCategories((all) => all.filter((x) => x !== c))}
                    className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    aria-label={`Remove ${c}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="input flex-1"
                placeholder="Add a category…"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategory.trim()) {
                    setCategories((all) => [...all, newCategory.trim()]);
                    setNewCategory('');
                  }
                }}
              />
              <Button variant="secondary" size="sm" onClick={() => {
                if (!newCategory.trim()) return;
                setCategories((all) => [...all, newCategory.trim()]);
                setNewCategory('');
                success('Category added', `${newCategory.trim()} is now bookable.`);
              }}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          {/* Tax + security */}
          <div className="card p-6">
            <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Tax Settings</h3>
            <div className="flex items-end gap-3">
              <div>
                <label className="label">GST Rate (%)</label>
                <input type="number" className="input w-32" value={gst} onChange={(e) => setGst(e.target.value)} />
              </div>
              <Button variant="secondary" size="sm" onClick={() => success('Tax rate updated', `GST set to ${gst}%.`)}>
                <Check className="h-3.5 w-3.5" /> Apply
              </Button>
            </div>

            <h3 className="mb-3 mt-6 text-sm font-bold text-slate-900 dark:text-slate-100">Security Configuration</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <Toggle checked={admin2FA} onChange={setAdmin2FA} label="Force 2FA for admins" description="OTP required for all admin logins" />
            </div>
            <div className="mt-3">
              <label className="label">Session timeout (minutes)</label>
              <select className="select" value={timeout} onChange={(e) => setTimeoutVal(e.target.value)}>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="480">8 hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification templates */}
        <div className="card p-6">
          <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Notification Templates</h3>
          <div className="space-y-2.5">
            {TEMPLATES.map((t) => (
              <div key={t.name} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.name}</p>
                  <p className="truncate text-xs text-slate-400">{t.subject}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => success('Template editor', `Editing "${t.name}" — this opens the editor.`)}>
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Backup */}
        <div className="card p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <DatabaseBackup className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Backup Settings
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <Toggle checked={autoBackup} onChange={setAutoBackup} label="Automatic nightly backups" description="Database + uploads every 2:00 AM IST" />
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <p className="flex justify-between"><span>Last backup</span><span className="font-bold text-slate-700 dark:text-slate-200">Today, 02:00 AM</span></p>
            <p className="mt-1 flex justify-between"><span>Backup size</span><span className="font-bold text-slate-700 dark:text-slate-200">1.2 GB</span></p>
          </div>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => success('Backup started', 'A manual backup is running in the background.')}>
            <DatabaseBackup className="h-3.5 w-3.5" /> Backup Now
          </Button>
        </div>
      </div>
    </div>
  );
}
