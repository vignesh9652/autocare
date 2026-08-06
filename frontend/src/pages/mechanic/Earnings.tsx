import { IndianRupee, TrendingUp, Wallet } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import EmptyState from '@/components/ui/EmptyState';

export default function Earnings() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Earnings"
        subtitle="Track your income from today to date"
        icon={<Wallet className="h-5 w-5" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Today's Earnings" value="—" icon={<IndianRupee className="h-5 w-5" />} accent="emerald" />
        <KpiCard label="This Week" value="—" icon={<IndianRupee className="h-5 w-5" />} accent="brand" />
        <KpiCard label="This Month" value="—" icon={<TrendingUp className="h-5 w-5" />} accent="violet" />
        <KpiCard label="Total Earnings" value="—" icon={<Wallet className="h-5 w-5" />} accent="amber" sub="Since joining AutoCare" />
      </div>

      <div className="card mt-6">
        <EmptyState
          icon={<Wallet className="h-9 w-9" />}
          title="No earnings data yet"
          description="Payouts and earnings charts will appear here once the backend provides a mechanic earnings endpoint."
        />
      </div>
    </div>
  );
}
