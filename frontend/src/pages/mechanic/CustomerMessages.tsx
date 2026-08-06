import { MessageSquare } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function CustomerMessages() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Customer Messages"
        subtitle="Stay in touch with customers during repairs"
        icon={<MessageSquare className="h-5 w-5" />}
      />

      <div className="card">
        <EmptyState
          icon={<MessageSquare className="h-9 w-9" />}
          title="Messaging is coming soon"
          description="Customer conversations will appear here once the backend provides a messaging endpoint."
        />
      </div>
    </div>
  );
}
