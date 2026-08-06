import { Car } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminVehicles() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Vehicle Management"
        subtitle="Registered vehicles across all owners"
        icon={<Car className="h-5 w-5" />}
      />

      <div className="card">
        <EmptyState
          icon={<Car className="h-9 w-9" />}
          title="No vehicle list available"
          description="The backend does not expose an admin endpoint to list every vehicle yet — individual vehicle details are available per booking."
        />
      </div>
    </div>
  );
}
