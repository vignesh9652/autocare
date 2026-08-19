import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';
import { subscribeToBookingStream } from '@/lib/api';
import { BookingStatus } from '@/types';
import { cn } from '@/lib/utils';

const ORDER: BookingStatus[] = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'PAYMENT_PENDING', 'PAID'];
const DONE: BookingStatus[] = ['REJECTED', 'CANCELLED'];

const STEP_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Request sent',
  ACCEPTED: 'Mechanic assigned',
  IN_PROGRESS: 'Service in progress',
  COMPLETED: 'Service completed',
  PAYMENT_PENDING: 'Payment processing',
  PAID: 'Payment received',
  REJECTED: 'Request rejected',
  CANCELLED: 'Cancelled',
};

const STEP_DESC: Record<BookingStatus, string> = {
  PENDING: 'Waiting for a nearby mechanic to accept your request.',
  ACCEPTED: 'A mechanic accepted the job and is on the way.',
  IN_PROGRESS: 'The mechanic is working on your vehicle.',
  COMPLETED: 'Service done — pay through the platform to release the mechanic’s earning.',
  PAYMENT_PENDING: 'Your payment is being processed by AutoCare.',
  PAID: 'Payment received — thank you!',
  REJECTED: 'No mechanic was available. Try rescheduling.',
  CANCELLED: 'This booking was cancelled.',
};

export function BookingTimeline({ bookingId, currentStatus }: { bookingId: number; currentStatus: BookingStatus }) {
  const [status, setStatus] = useState<BookingStatus>(currentStatus);
  const [live, setLive] = useState(false);

  useEffect(() => setStatus(currentStatus), [currentStatus]);

  useEffect(() => {
    if (DONE.includes(status)) return;
    const controller = new AbortController();
    subscribeToBookingStream(
      bookingId,
      (event) => {
        const s = event.status as BookingStatus;
        if (s) {
          setStatus(s);
          setLive(true);
        }
      },
      controller.signal
    );
    return () => controller.abort();
  }, [bookingId, status]);

  const activeIndex = DONE.includes(status) ? (status === 'CANCELLED' ? -1 : ORDER.length) : ORDER.indexOf(status);

  return (
    <div className="card p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">Live tracking</h3>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Radio className="h-3 w-3 animate-pulse" /> LIVE
          </span>
        )}
      </div>

      {DONE.includes(status) ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {STEP_LABEL[status]} — {STEP_DESC[status]}
        </div>
      ) : (
        <ol className="relative space-y-5 pl-1">
          {ORDER.map((s, i) => {
            const done = i <= activeIndex;
            const current = i === activeIndex;
            return (
              <li key={s} className="relative flex gap-4">
                {i < ORDER.length - 1 && (
                  <span className={cn('absolute left-[13px] top-7 h-[calc(100%-8px)] w-0.5 rounded-full', done ? 'bg-emerald-400' : 'bg-ink-100 dark:bg-ink-800')} />
                )}
                <motion.span
                  animate={current ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ repeat: current ? Infinity : 0, duration: 1.6 }}
                  className={cn(
                    'z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold',
                    done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-ink-200 bg-white text-ink-400 dark:border-ink-700 dark:bg-ink-900'
                  )}
                >
                  {done ? '✓' : i + 1}
                </motion.span>
                <div className="pb-1">
                  <p className={cn('text-sm font-semibold', done ? 'text-ink-900 dark:text-ink-100' : 'text-ink-400')}>{STEP_LABEL[s]}</p>
                  <p className="text-xs text-ink-400">{STEP_DESC[s]}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
