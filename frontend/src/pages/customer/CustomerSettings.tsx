import { useState } from 'react';
import { Bell, Shield, Settings, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Toggle from '@/components/ui/Toggle';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast } from '@/components/ui/Toast';

export default function CustomerSettings() {
  const [bookingNotifs, setBookingNotifs] = useState(true);
  const [paymentNotifs, setPaymentNotifs] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [reminders, setReminders] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [shareData, setShareData] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { success } = useToast();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Settings"
        subtitle="Manage preferences, security and your account"
        icon={<Settings className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notification preferences */}
        <div className="card p-6">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Bell className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Notification Preferences
          </h3>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Choose what you want to hear about</p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <Toggle checked={bookingNotifs} onChange={setBookingNotifs} label="Booking updates" description="Status changes and new bookings" />
            <Toggle checked={paymentNotifs} onChange={setPaymentNotifs} label="Payment updates" description="Payments, invoices and refunds" />
            <Toggle checked={reminders} onChange={setReminders} label="Service reminders" description="Upcoming due dates for your vehicles" />
            <Toggle checked={marketing} onChange={setMarketing} label="Offers & promotions" description="Deals from AutoCare partners" />
          </div>
        </div>

        {/* Security */}
        <div className="card p-6">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Security
          </h3>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Keep your account safe</p>
          <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <Toggle checked={twoFA} onChange={setTwoFA} label="Two-factor authentication" description="Require an OTP on every login" />
          </div>
          <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <Toggle checked={shareData} onChange={setShareData} label="Share usage data" description="Help us improve recommendations" />
          </div>
          <p className="label">Change password</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="password" placeholder="Current password" className="!mb-0" />
            <Input type="password" placeholder="New password" className="!mb-0" />
          </div>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => success('Password updated', 'Your password has been changed successfully.')}>
            Update Password
          </Button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-500/30 dark:bg-red-500/5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-400">
          <Trash2 className="h-4 w-4" /> Danger Zone
        </h3>
        <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
          Deleting your account permanently removes your vehicles, bookings and review history. This cannot be undone.
        </p>
        <Button variant="danger" size="sm" className="mt-4" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="h-4 w-4" /> Delete Account
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete your account?"
        message="All your data — vehicles, bookings, payments and reviews — will be permanently erased. Are you absolutely sure?"
        confirmLabel="Yes, delete everything"
        danger
        onConfirm={() => {
          setDeleteOpen(false);
          success('Account deletion requested', 'Our team will process your request within 24 hours.');
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
