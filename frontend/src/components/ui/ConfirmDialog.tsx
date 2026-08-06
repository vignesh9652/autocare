import { AlertTriangle } from 'lucide-react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            danger
              ? 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-400'
              : 'bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
      </div>
    </Modal>
  );
}
