import { useState, type FormEvent } from 'react';
import { Bell, History, Send } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getAdminUsers, getAdminMechanics } from '@/api/adminApi';

interface SentBroadcast {
  id: number;
  audience: string;
  title: string;
  date: string;
  recipients: number;
}

export default function AdminNotifications() {
  const users = useApiData(() => getAdminUsers(), []);
  const mechanics = useApiData(() => getAdminMechanics(), []);
  const [audience, setAudience] = useState('ALL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [broadcasts, setBroadcasts] = useState<SentBroadcast[]>([]);
  const { success, warning } = useToast();

  const customerCount = (users.data ?? []).filter((u) => u.role === 'CUSTOMER').length;
  const mechanicCount = mechanics.data?.length ?? 0;
  const totalCount = (users.data ?? []).length;

  const recipientsFor = (a: string) => (a === 'MECHANICS' ? mechanicCount : a === 'CUSTOMERS' ? customerCount : totalCount);

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      warning('Incomplete form', 'Add a title and message before sending.');
      return;
    }
    const label = audience === 'ALL' ? 'All users' : audience === 'MECHANICS' ? 'Mechanics' : 'Customers';
    setBroadcasts((all) => [
      { id: (all[0]?.id ?? 0) + 1, audience: label, title: title.trim(), date: new Date().toISOString().slice(0, 10), recipients: recipientsFor(audience) },
      ...all,
    ]);
    success('Notification queued', `Prepared for ${recipientsFor(audience)} ${label.toLowerCase()}.`);
    setTitle('');
    setMessage('');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Send Notifications"
        subtitle="Broadcast updates to customers, mechanics, or everyone"
        icon={<Bell className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose */}
        <form onSubmit={send} className="card h-fit p-6">
          <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Compose broadcast</h3>
          <div className="mb-4">
            <label className="label">Audience</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'ALL', label: 'All Users', count: totalCount },
                { key: 'CUSTOMERS', label: 'Customers', count: customerCount },
                { key: 'MECHANICS', label: 'Mechanics', count: mechanicCount },
              ].map((a) => (
                <button
                  type="button"
                  key={a.key}
                  onClick={() => setAudience(a.key)}
                  className={`rounded-xl border px-3 py-2.5 text-center transition-all ${
                    audience === a.key
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'border-slate-200 text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="block text-xs font-bold">{a.label}</span>
                  <span className="block text-[10px] text-slate-400">{a.count} recipients</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="label">Title</label>
            <input className="input" placeholder="e.g. Monsoon service campaign" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="label">Message</label>
            <textarea
              className="input min-h-28 resize-y"
              placeholder="Write your message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            <Send className="h-4 w-4" /> Send to {recipientsFor(audience)} users
          </Button>
          <p className="mt-2 text-[11px] text-slate-400">
            Broadcasting is queued locally for now — a push endpoint is not available on the backend.
          </p>
        </form>

        {/* History */}
        <div>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
            <History className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Broadcast History
          </h3>
          {broadcasts.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<History className="h-9 w-9" />}
                title="No broadcasts sent yet"
                description="Broadcasts you send this session will be listed here."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((b) => (
                <div key={b.id} className="card card-hover p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{b.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Sent {b.date} · {b.recipients} recipients
                      </p>
                    </div>
                    <Badge variant={b.audience === 'Mechanics' ? 'info' : b.audience === 'Customers' ? 'success' : 'brand'}>
                      {b.audience}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
