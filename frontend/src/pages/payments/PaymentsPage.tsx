import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createPayment, getMyPayments } from '@/api/paymentApi';
import { getApiErrorMessage } from '@/api/client';
import { Button, Card, Input, Modal, Spinner, StatusBadge } from '@/components';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Payment, ReferenceType } from '@/types';

const EMPTY_FORM = {
  referenceType: 'BOOKING' as ReferenceType,
  referenceId: '',
  amount: '',
  paymentMethod: 'UPI',
};

const PAYMENT_METHODS = ['CARD', 'UPI', 'NETBANKING', 'CASH'];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPayments(await getMyPayments());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load payments'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createPayment({
        referenceType: form.referenceType,
        referenceId: Number(form.referenceId),
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
      });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to initiate payment'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Payments</h1>
          <p className="mt-1 text-sm text-slate-400">Your transactions, initiated and settled</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New Payment</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading payments…" className="py-20" />
      ) : payments.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-slate-400">No payments yet.</p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {payments.map((p) => (
                <tr key={p.id} className="bg-slate-900/40 transition-colors hover:bg-slate-800/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">#{p.id}</div>
                    <div className="text-xs text-slate-500">{p.gatewayTransactionId || 'Pending gateway…'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {p.referenceType} #{p.referenceId}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-100">
                    {formatCurrency(p.amount, p.currency)}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="hidden px-4 py-3 text-slate-400 md:table-cell">{formatDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title="Initiate Payment"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button form="payment-form" type="submit" loading={saving}>
              {saving ? 'Processing…' : 'Pay Now'}
            </Button>
          </>
        }
      >
        <form id="payment-form" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="label" htmlFor="p-ref-type">Reference Type</label>
            <select
              id="p-ref-type"
              className="input"
              value={form.referenceType}
              onChange={(e) => setForm({ ...form, referenceType: e.target.value as ReferenceType })}
            >
              <option value="BOOKING">Booking</option>
              <option value="SPARE_PART">Spare Part</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Reference ID"
              type="number"
              min={1}
              required
              value={form.referenceId}
              onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
              placeholder="e.g. 42"
            />
            <Input
              label="Amount (₹)"
              type="number"
              min={0.01}
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="p-method">Payment Method</label>
            <select
              id="p-method"
              className="input"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
