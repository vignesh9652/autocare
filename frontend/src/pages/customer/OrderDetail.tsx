import { useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Home,
  MapPin,
  MessageSquare,
  RotateCcw,
  User,
  ShoppingCart,
  Star,
  Truck,
  UserCheck,
} from 'lucide-react';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import OrderTimeline from '@/components/marketplace/OrderTimeline';
import PartVisual from '@/components/marketplace/PartVisual';
import { useCart, useOrders } from '@/context/MarketplaceStore';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getParts } from '@/api/sparePartsApi';
import { getMechanics } from '@/api/mechanicApi';
import { toDashMechanic, toMarketplacePart } from '@/utils/apiMappers';
import { formatCurrency, formatDate } from '@/utils/format';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const placed = params.get('placed') === '1';
  const navigate = useNavigate();
  const { getOrder } = useOrders();
  const { add } = useCart();
  const { success } = useToast();
  const catalog = useApiData(() => getParts(), []);
  const mechanicsData = useApiData(() => getMechanics(), []);

  const order = useMemo(() => (id ? getOrder(id) : undefined), [id, getOrder]);

  const partById = useMemo(() => {
    const map = new Map<number, ReturnType<typeof toMarketplacePart>>();
    for (const p of catalog.data ?? []) map.set(p.id, toMarketplacePart(p));
    return map;
  }, [catalog.data]);

  const allMechanics = useMemo(
    () => (mechanicsData.data ?? []).map(toDashMechanic),
    [mechanicsData.data],
  );

  if (!order) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Order not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/customer/orders')}>
          View my orders
        </Button>
      </div>
    );
  }

  const mechanic = order.mechanic
    ? allMechanics.find((m) => m.name === order.mechanic?.name) ?? null
    : null;

  return (
    <div className="animate-fade-in">
      {/* Confirmation banner */}
      {placed && (
        <div className="mb-5 flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-6 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10 sm:flex-row sm:text-left">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h1 className="text-base font-extrabold text-emerald-800 dark:text-emerald-300">
              Order placed successfully!
            </h1>
            <p className="mt-0.5 text-sm text-emerald-700/80 dark:text-emerald-400/80">
              Order <span className="font-bold">{order.id}</span> ·{' '}
              {order.mode === 'MECHANIC'
                ? 'A certified mechanic will be assigned shortly.'
                : 'Your installation guide is now available in the timeline.'}
            </p>
          </div>
          <Badge variant="success" dot>{order.status}</Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/orders')}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
            aria-label="Back to orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Order {order.id}
            </h1>
            <p className="text-xs text-slate-400">
              Placed on {formatDate(order.placedAt)} · {order.paymentMethod}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={order.mode === 'MECHANIC' ? 'brand' : 'neutral'}>
            {order.mode === 'MECHANIC' ? 'Professional install' : 'DIY'}
          </Badge>
          <Badge variant="success" dot>{order.status}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-5 lg:col-span-2">
          {/* Timeline */}
          <div className="card p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <CalendarDays className="h-4 w-4 text-brand-500" /> Order Timeline
            </h2>
            <OrderTimeline steps={order.timeline} />
          </div>

          {/* Mechanic card */}
          {order.mechanic && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <UserCheck className="h-4 w-4 text-brand-500" /> Your installation
              </h2>
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <Avatar name={order.mechanic.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {order.mechanic.name}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {mechanic ? (
                      <>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {mechanic.rating.toFixed(1)} ({mechanic.reviewsCount})
                        </span>
                        · {mechanic.experience} yrs experience
                      </>
                    ) : (
                      'AutoCare certified mechanic'
                    )}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {order.mechanic.date} at {order.mechanic.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" />
                      {order.mechanic.homeService ? 'Home service' : 'Workshop'}
                    </span>
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => success('Chat opened', `Messaging ${order.mechanic?.name}…`)}>
                  <MessageSquare className="h-3.5 w-3.5" /> Chat
                </Button>
              </div>
            </div>
          )}

          {/* Order items */}
          <div className="card p-6">
            <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Items</h2>
            <div className="space-y-3">
              {order.lines.map((line) => {
                const part = partById.get(line.partId);
                return (
                  <div key={line.partId} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    {part ? (
                      <PartVisual part={part} className="h-14 w-14 shrink-0 rounded-xl" iconClassName="h-7 w-7" />
                    ) : (
                      <span className="h-14 w-14 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{line.name}</p>
                      <p className="text-xs text-slate-400">{line.brand} · Qty {line.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(line.lineTotal)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Price breakdown */}
            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
              <p className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Spare part cost</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(order.itemCost)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">GST (18%)</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(order.gst)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Delivery charges</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {order.deliveryCharge === 0 ? 'FREE' : formatCurrency(order.deliveryCharge)}
                </span>
              </p>
              {order.mechanicCharge > 0 && (
                <p className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Mechanic charges</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatCurrency(order.mechanicCharge)}
                  </span>
                </p>
              )}
              {order.couponDiscount > 0 && (
                <p className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Coupon ({order.couponCode})</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    − {formatCurrency(order.couponDiscount)}
                  </span>
                </p>
              )}
              <p className="flex justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Total</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">{formatCurrency(order.total)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          <div className="card sticky top-20 space-y-4 p-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Details</h2>
            <div className="space-y-2.5 text-xs">
              <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <User className="h-3.5 w-3.5 shrink-0" />
                Customer: <span className="font-semibold text-slate-700 dark:text-slate-200">{order.customerName || 'Customer'}</span>
              </p>
              <p className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Deliver to:</span>
                  <br />
                  {order.address}
                </span>
              </p>
              <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Truck className="h-3.5 w-3.5 shrink-0" />
                Estimated delivery:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatDate(order.estimatedDelivery)}
                </span>
              </p>
              <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                Payment: <span className="font-semibold text-slate-700 dark:text-slate-200">{order.paymentMethod}</span>
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              {order.mode === 'DIY' && (
                <Button className="w-full" onClick={() => navigate(`/customer/parts/${order.lines[0]?.partId}/install-guide`)}>
                  <FileText className="h-4 w-4" /> View Installation Guide
                </Button>
              )}
              {order.mode === 'MECHANIC' && (
                <Button variant="secondary" className="w-full" onClick={() => success('Chat opened', `Messaging ${order.mechanic?.name}…`)}>
                  <MessageSquare className="h-4 w-4" /> Chat with Mechanic
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => success('Invoice downloaded', 'Your invoice has been sent to your email.')}
              >
                <Download className="h-4 w-4" /> Download Invoice
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  order.lines.forEach((line) => {
                    const part = partById.get(line.partId);
                    if (part) add(part, line.quantity);
                  });
                  success('Added to cart', 'Reorder this part from your cart.');
                  navigate('/customer/parts');
                }}
              >
                <RotateCcw className="h-4 w-4" /> Reorder
              </Button>
            </div>

            <Link
              to="/customer/parts"
              className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
            >
              <ShoppingCart className="h-3.5 w-3.5" /> Shop more parts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
