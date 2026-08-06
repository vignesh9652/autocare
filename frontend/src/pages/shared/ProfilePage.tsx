import { useState, type FormEvent } from 'react';
import { Mail, MapPin, Phone, Save, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast } from '@/components/ui/Toast';

interface ProfilePageProps {
  roleLabel: string;
  stats: { label: string; value: string | number }[];
  phone: string;
  location: string;
}

function displayName(email?: string): string {
  const raw = email?.split('@')[0] ?? 'user';
  return raw
    .replace(/[._-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function ProfilePage({ roleLabel, stats, phone, location }: ProfilePageProps) {
  const { user } = useAuth();
  const name = displayName(user?.email);
  const [form, setForm] = useState({ name, phone, location });
  const { success } = useToast();

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    success('Profile updated', 'Your profile information has been saved.');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Profile"
        subtitle="Your personal information and account summary"
        icon={<User className="h-5 w-5" />}
      />

      {/* Profile summary */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-600 via-sky-500 to-emerald-500" />
        <div className="relative px-6 pb-6">
          <div className="-mt-10 mb-4 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="rounded-2xl ring-4 ring-white dark:ring-slate-900">
                <Avatar name={name} size="lg" className="!h-20 !w-20 !text-2xl" />
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{name}</h2>
                  <Badge variant="brand" dot>{roleLabel}</Badge>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5" /> {user?.email ?? ''}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{s.label}</p>
                <p className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editable form */}
      <div className="card p-6">
        <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Edit profile</h3>
        <form onSubmit={handleSave} className="max-w-xl">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Location</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
          </div>
          <Button type="submit">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}
