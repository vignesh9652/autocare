import { ScrollText } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function AuditLogs() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Audit Logs"
        subtitle="Every important event across the platform, chronologically"
        icon={<ScrollText className="h-5 w-5" />}
      />

      <div className="card">
        <EmptyState
          icon={<ScrollText className="h-9 w-9" />}
          title="No audit logs available"
          description="Audit events will appear here once the backend exposes an audit-log endpoint."
        />
      </div>
    </div>
  );
}
