import type { BadgeVariant } from '@/components/ui/Badge';

export function bookingStatusVariant(status: string): BadgeVariant {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return 'success';
    case 'ACCEPTED':
      return 'info';
    case 'IN_PROGRESS':
      return 'brand';
    case 'REJECTED':
      return 'danger';
    case 'CANCELLED':
      return 'neutral';
    case 'PENDING':
    default:
      return 'warning';
  }
}

export function paymentStatusVariant(status: string): BadgeVariant {
  switch (status.toUpperCase()) {
    case 'PAID':
    case 'SUCCESS':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'FAILED':
      return 'danger';
    case 'REFUNDED':
    default:
      return 'neutral';
  }
}

export function availabilityVariant(status: string): BadgeVariant {
  switch (status.toUpperCase()) {
    case 'AVAILABLE':
    case 'APPROVED':
      return 'success';
    case 'BUSY':
    case 'PENDING':
      return 'warning';
    case 'OFFLINE':
    case 'DISABLED':
    case 'REJECTED':
      return 'neutral';
    default:
      return 'neutral';
  }
}
