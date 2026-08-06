import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  BadgeCheck,
  CreditCard,
  Gift,
  Landmark,
  Lock,
  MapPin,
  ShieldCheck,
  Tag,
  Truck,
  UserCheck,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import PartVisual from '@/components/marketplace/PartVisual';
import { useCart, useOrders } from '@/context/MarketplaceStore';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useApiData } from '@/hooks/useApiData';
import { getPart, getParts } from '@/api/sparePartsApi';
import { getMechanics } from '@/api/mechanicApi';
import { toDashMechanic, toMarketplacePart } from '@/utils/apiMappers';
import {
  GST_RATE,
  cartToOrderLines,
  couponDiscountFor,
  deliveryChargeFor,
  getCoupon,
  roundMoney,
  timelineFor,
} from '@/utils/marketplace';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { MarketplaceOrder, PartOrderMode } from '@/types';

interface PaymentOption {
  id: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  diyOnly?: boolean;
}

const PAYMENT_METHODS: PaymentOption[] = [
  { id: 'UPI', label: 'UPI', sub: 'GPay · PhonePe · Paytm', icon: Wallet },
  { id: 'Card', label: 'Credit / Debit Card', sub: 'Visa · Mastercard · RuPay', icon: CreditCard },
  { id: 'Net Banking', label: 'Net Banking', sub: 'All major banks', icon: Landmark },
  { id: 'Cash on Delivery', label: 'Cash on Delivery', sub: 'Pay when the part arrives', icon: Banknote, diyOnly: true },
];

function datePlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
}

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lines: cartLines, clear: clearCart } = useCart();
  const { placeOrder } = useOrders();
  const { success, error, info } = useToast();

  /* ----------------------- resolve what is being bought ----------------------- */
  const partId = Number(params.get('part') ?? 0);
  const partData = useApiData(() => (partId ? getPart(partId) : Promise.resolve(null)), [partId]);
  const catalog = useApiData(() => getParts(), []);
  const mechanicsData = useApiData(() => getMechanics(), []);

  const singlePart = useMemo(
    () => (partData.data ? toMarketplacePart(partData.data) : undefined),
    [partData.data],
  );
  const mechanics = useMemo(
    () => (mechanicsData.data ?? []).map(toDashMechanic),
    [mechanicsData.data],
  );
  const partById = useMemo(() => {
    const map = new Map<number, ReturnType<typeof toMarketplacePart>>();
    for (const p of catalog.data ?? []) map.set(p.id, toMarketplacePart(p));
    if (singlePart) map.set(singlePart.id, singlePart);
    return map;
  }, [catalog.data, singlePart]);

  const customerName = useMemo(() => {
    const raw = user?.email?.split('@')[0]?.replace(/[._-]/g, ' ') ?? 'Customer';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [user?.email]);

  const qty = Math.max(1, Number(params.get('qty') ?? 1));
  const mode: PartOrderMode = params.get('mode') === 'mechanic' && singlePart?.mechanicInstall
    ? 'MECHANIC'
    : 'DIY';

  const mechanicId = Number(params.get('mechanic') ?? 0);
  const mechanicDate = params.get('date') ?? '';
  const mechanicTime = params.get('time') ?? '';
  const homeService = params.get('home') === '1';

  const lines = useMemo(
    () =>
      singlePart
        ? [
            {
              partId: singlePart.id,
              name: singlePart.name,
              brand: singlePart.brand,
              quantity: qty,
              price: singlePart.price,
              lineTotal: roundMoney(singlePart.price * qty),
            },
          ]
        : cartToOrderLines(cartLines),
    [singlePart, qty, cartLines],
  );

  /* ------------------------------ pricing state ------------------------------ */
  const [address, setAddress] = useState('Home · Indiranagar, Bengaluru');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<string | null>(null);

  const itemCost = roundMoney(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  const gst = roundMoney(itemCost * GST_RATE);
  const deliveryCharge = deliveryChargeFor(itemCost);
  const mechanicCharge =
    mode === 'MECHANIC' && singlePart?.mechanicInstall ? singlePart.mechanicInstall.installationCharge : 0;
  const appliedCoupon = coupon ? getCoupon(coupon) ?? null : null;
  const discount = couponDiscountFor(itemCost, appliedCoupon);
  const total = roundMoney(itemCost + gst + deliveryCharge + mechanicCharge - discount);

  const applyCoupon = () => {
    const c = getCoupon(couponInput);
    if (!c) {
      error('Invalid coupon', 'This coupon code does not exist or has expired.');
      setCoupon(null);
      return;
    }
    if (itemCost < (c.minOrder ?? 0)) {
      info('Minimum order not met', `This coupon requires a minimum order of ${formatCurrency(c.minOrder ?? 0)}.`);
      setCoupon(null);
      return;
    }
    setCoupon(c.code);
    success('Coupon applied', `${c.label} — ${c.description}`);
    setCouponInput('');
  };

  const placeOrderAction = () => {
    if (lines.length === 0) {
      info('Cart is empty', 'Add a spare part before checking out.');
      return;
    }
    const order: Omit<MarketplaceOrder, 'id' | 'placedAt'> = {
      lines,
      customerName,
      mode,
      itemCost,
      gst,
      deliveryCharge,
      mechanicCharge,
      couponCode: coupon,
      couponDiscount: discount,
      total,
      paymentMethod,
      estimatedDelivery:
        mode === 'MECHANIC' && mechanicDate
          ? mechanicDate
          : datePlus(3),
      status: 'Placed',
      address,
      mechanic:
        mode === 'MECHANIC' && singlePart?.mechanicInstall
          ? {
              name: mechanics.find((m) => m.id === mechanicId)?.name ?? `Mechanic #${mechanicId}`,
              date: mechanicDate,
              time: mechanicTime,
              homeService,
              charge: mechanicCharge,
            }
          : null,
      timeline: timelineFor(mode, 'placed'),
    };
    const created = placeOrder(order);
    if (!singlePart) clearCart();
    success('Order placed!', `${created.id} — ${mode === 'MECHANIC' ? 'mechanic will be assigned' : 'part will be dispatched'} soon.`);
    navigate(`/customer/orders/${created.id}?placed=1`);
  };

  if (lines.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Your cart is empty — add a spare part first.
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/customer/parts')}>
          Browse marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Checkout
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Review your order and choose a payment method
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left — details */}
        <div className="space-y-5 lg:col-span-3">
          {/* Address */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <MapPin className="h-4 w-4 text-brand-500" /> Delivery address
            </h2>
            <select className="select mt-3" value={address} onChange={(e) => setAddress(e.target.value)}>
              <option>Home · Indiranagar, Bengaluru</option>
              <option>Home · HSR Layout, Bengaluru</option>
              <option>Office · Koramangala, Bengaluru</option>
            </select>
          </div>

          {/* Mechanic summary (if selected) */}
          {mode === 'MECHANIC' && singlePart?.mechanicInstall && (
            <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
              <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
              <div className="text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  Professional installation booked
                </p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  {mechanicDate && mechanicTime
                    ? `${mechanicDate} at ${mechanicTime} · ${homeService ? 'Home service' : 'Workshop'} · ${formatCurrency(mechanicCharge)} install charge`
                    : `Date & time to be confirmed · ${formatCurrency(mechanicCharge)} install charge`}
                </p>
                <p className="mt-1 text-slate-400">
                  A certified mechanic will be confirmed after payment.
                </p>
              </div>
            </div>
          )}

          {/* Coupon */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Tag className="h-4 w-4 text-brand-500" /> Coupon
            </h2>
            {coupon ? (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-500/10">
                <p className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <Gift className="h-4 w-4" /> {coupon} applied
                  <span className="font-medium text-emerald-600/80 dark:text-emerald-400/80">
                    − {formatCurrency(discount)}
                  </span>
                </p>
                <button
                  onClick={() => setCoupon(null)}
                  className="rounded-md p-1 text-emerald-600 transition-colors hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-500/15"
                  aria-label="Remove coupon"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  className="input"
                  placeholder="Enter coupon code (try AUTOCARE10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                />
                <Button variant="secondary" className="shrink-0" onClick={applyCoupon}>
                  Apply
                </Button>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <CreditCard className="h-4 w-4 text-brand-500" /> Payment method
            </h2>
            <div className="mt-3 space-y-2">
              {PAYMENT_METHODS.filter((m) => !(m.diyOnly && mode === 'MECHANIC')).map((method) => {
                const Icon = method.icon;
                const active = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all',
                      active
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
                        : 'border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-500/40',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg',
                        active
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                        {method.label}
                      </span>
                      <span className="block text-xs text-slate-400">{method.sub}</span>
                    </span>
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2',
                        active
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-slate-300 dark:border-slate-600',
                      )}
                    >
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — order summary */}
        <div className="lg:col-span-2">
          <div className="card sticky top-20 p-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Order Summary</h2>

            <div className="mt-4 space-y-3">
              {lines.map((line) => {
                const part = partById.get(line.partId);
                return (
                  <div key={line.partId} className="flex items-center gap-3">
                    {part ? (
                      <PartVisual part={part} className="h-12 w-12 shrink-0 rounded-lg" iconClassName="h-6 w-6" />
                    ) : (
                      <span className="h-12 w-12 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                        {line.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {line.brand} · Qty {line.quantity} × {formatCurrency(line.price)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(line.lineTotal)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
              <p className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Spare part cost</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(itemCost)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">GST (18%)</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(gst)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Delivery charges</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {deliveryCharge === 0 ? <Badge variant="success">FREE</Badge> : formatCurrency(deliveryCharge)}
                </span>
              </p>
              {mode === 'MECHANIC' && (
                <p className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Mechanic charges</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatCurrency(mechanicCharge)}
                  </span>
                </p>
              )}
              <p className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Coupon discount</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {coupon ? `− ${formatCurrency(discount)} (${coupon})` : formatCurrency(0)}
                </span>
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Total Amount</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(total)}</span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
              <Truck className="h-3.5 w-3.5 shrink-0" />
              {mode === 'MECHANIC' && mechanicDate
                ? `Part arrives by ${new Date(mechanicDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })} · install at ${mechanicTime}`
                : `Estimated delivery by ${datePlus(3)}`}
            </div>

            <Button className="mt-4 w-full" onClick={placeOrderAction}>
              <Lock className="h-4 w-4" /> Place Order · {formatCurrency(total)}
            </Button>
            <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Secure payment</span>
              <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-emerald-500" /> Genuine parts</span>
            </div>
            <button
              onClick={() => navigate(singlePart ? `/customer/parts/${singlePart.id}` : '/customer/parts')}
              className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
