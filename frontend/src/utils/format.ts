/**
 * Shared formatting helpers.
 */

/** Format an ISO date/time string (e.g. "2026-08-10T10:30:00") for display. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format a date-only ISO string. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a number as currency. Defaults to INR (the AutoCare platform is
 * Indian); pass the `currency` from a Payment DTO to override.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency = 'INR',
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a rating (1..5) with one decimal place. */
export function formatRating(rating: number | null | undefined): string {
  if (rating === null || rating === undefined) return '—';
  return rating.toFixed(1);
}
