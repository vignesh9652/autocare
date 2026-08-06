import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Car,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Home,
  MapPin,
  MessageSquare,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  ShoppingCart,
  Star,
  Timer,
  Truck,
  UserCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Badge from '@/components/ui/Badge';
import Stars from '@/components/Stars';
import CartDrawer from '@/components/marketplace/CartDrawer';
import PartVisual, { partCategoryStyle } from '@/components/marketplace/PartVisual';
import { useCart } from '@/context/MarketplaceStore';
import { useToast } from '@/components/ui/Toast';
import { useApiData } from '@/hooks/useApiData';
import { getPart } from '@/api/sparePartsApi';
import { toMarketplacePart } from '@/utils/apiMappers';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { InstallationDifficulty, PartOrderMode } from '@/types';

const DIFFICULTY_VARIANT: Record<InstallationDifficulty, 'success' | 'warning' | 'danger'> = {
  Easy: 'success',
  Moderate: 'warning',
  Expert: 'danger',
};

/** Slight visual variations per gallery "view" to simulate photography. */
const VIEW_VARIANTS = [
  { icon: 'h-32 w-32 sm:h-40 sm:w-40', label: 'Front view' },
  { icon: 'h-24 w-24 sm:h-32 sm:w-32 rotate-6', label: 'Angle view' },
  { icon: 'h-44 w-44 sm:h-52 sm:w-52 scale-110', label: 'Close-up' },
  { icon: 'h-24 w-24 sm:h-28 sm:w-28', label: 'Packaging' },
];

const CHAT_REPLIES = [
  "Sure! I'll bring my full tool kit and torque wrench.",
  'Yes, home service is available in your area — no need to visit a workshop.',
  'I typically finish in the estimated time. I also do a final inspection checklist.',
  'Please keep the part box handy; I will verify the OEM number before installing.',
];

interface ChatMessage {
  from: 'customer' | 'mechanic';
  text: string;
}

export default function PartDetail() {
  const { id } = useParams<{ id: string }>();
  const partId = Number(id);
  const partData = useApiData(() => getPart(partId), [partId]);
  const part = useMemo(
    () => (partData.data ? toMarketplacePart(partData.data) : undefined),
    [partData.data],
  );

  const navigate = useNavigate();
  const { add } = useCart();
  const { success, info } = useToast();

  const [viewIndex, setViewIndex] = useState(0);
  const [mode, setMode] = useState<PartOrderMode>('DIY');
  const [qty, setQty] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const replyIndex = useRef(0);
  const replyTimer = useRef<number | null>(null);
  const prevPartId = useRef(partId);

  // The route reuses this component across part ids — reset all ephemeral state
  // so switching parts never carries over qty/mode/gallery selection.
  if (prevPartId.current !== partId) {
    prevPartId.current = partId;
    setViewIndex(0);
    setMode('DIY');
    setQty(1);
    setChatOpen(false);
    setReportOpen(false);
    setDraft('');
    setChat([]);
    if (replyTimer.current) window.clearTimeout(replyTimer.current);
    replyTimer.current = null;
  }

  if (!part) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {partData.loading ? 'Loading part…' : 'Part not found.'}
        </p>
        <Link to="/customer/parts" className="mt-2 inline-block text-sm font-semibold">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  const savings = part.mrp - part.price;
  const lowStock = part.stock <= 10;
  const view = VIEW_VARIANTS[viewIndex % VIEW_VARIANTS.length];
  const { label: categoryLabel } = partCategoryStyle(part.category);

  const addToCart = () => {
    add(part, qty);
    success('Added to cart', `${qty} × ${part.name}`);
  };

  const buyNow = () => {
    if (part.stock <= 0) {
      info('Out of stock', `${part.name} will be restocked soon.`);
      return;
    }
    if (mode === 'MECHANIC' && part.mechanicInstall) {
      navigate(`/customer/parts/${part.id}/book-mechanic?qty=${qty}`);
    } else {
      navigate(`/customer/checkout?part=${part.id}&mode=diy&qty=${qty}`);
    }
  };

  const closeChat = () => {
    setChatOpen(false);
    if (replyTimer.current) window.clearTimeout(replyTimer.current);
    replyTimer.current = null;
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    setChat((c) => [...c, { from: 'customer', text }]);
    setDraft('');
    if (replyTimer.current) window.clearTimeout(replyTimer.current);
    replyTimer.current = window.setTimeout(() => {
      const reply = CHAT_REPLIES[replyIndex.current % CHAT_REPLIES.length];
      replyIndex.current += 1;
      setChat((c) => [...c, { from: 'mechanic', text: reply }]);
      replyTimer.current = null;
    }, 900);
  };

  const mechanicName = 'Certified AutoCare Mechanic';

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link to="/customer/parts" className="font-medium hover:text-brand-600 dark:hover:text-brand-400">
          Marketplace
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{categoryLabel}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">{part.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ------------------------- Main column ------------------------- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Gallery */}
          <div className="card overflow-hidden">
            <div className="relative">
              <PartVisual
                part={part}
                key={viewIndex}
                className="animate-scale-in h-64 w-full sm:h-80"
                iconClassName={view.icon}
              />
              <span className="absolute left-4 top-4">
                <Badge variant="brand" dot>{categoryLabel}</Badge>
              </span>
              <span className="absolute bottom-3 left-4 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                {view.label}
              </span>
              {savings > 0 && (
                <span className="absolute right-4 top-4 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                  {part.discountPercent}% OFF
                </span>
              )}
            </div>
            <div className="flex gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              {part.gallery.map((caption, i) => (
                <button
                  key={caption}
                  onClick={() => setViewIndex(i)}
                  className={cn(
                    'group flex flex-col items-center gap-1.5 rounded-xl border-2 p-1.5 transition-all',
                    i === viewIndex
                      ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
                      : 'border-transparent hover:border-brand-300 dark:hover:border-brand-500/40',
                  )}
                  aria-label={`Show ${caption}`}
                >
                  <PartVisual part={part} className="h-14 w-14 rounded-lg" iconClassName="h-6 w-6" />
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      i === viewIndex
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-slate-400',
                    )}
                  >
                    {caption}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Product info chips */}
          <div className="card grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            {[
              { icon: BadgeCheck, label: 'Brand', value: part.brand },
              { icon: Package, label: 'OEM Number', value: part.oemNumber },
              { icon: ShieldCheck, label: 'Warranty', value: part.warranty },
              { icon: Truck, label: 'Delivery', value: part.deliveryEstimate },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Product Description
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {part.shortDescription}
            </p>
            <div className="mt-5 space-y-4">
              {part.description.map((section) => (
                <div key={section.title}>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {section.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle compatibility */}
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <Car className="h-4 w-4 text-brand-500" /> Vehicle Compatibility
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {part.compatibility.map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:text-brand-400"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Installation options */}
          <div>
            <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
              Choose how you want it installed
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Option 1 — DIY */}
              <div className="card card-hover flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Wrench className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Buy Spare Part Only
                    </h3>
                    <p className="text-xs text-slate-400">DIY installation</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Perfect if you prefer installing the part yourself or through a local garage.
                  Includes a complete step-by-step installation guide.
                </p>
                <div className="mt-4 space-y-2 text-xs">
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Timer className="h-3.5 w-3.5 text-slate-400" /> Est. time{' '}
                    <span className="font-semibold">{part.guide.estimatedTime}</span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Wrench className="h-3.5 w-3.5 text-slate-400" /> {part.guide.tools.length} tools
                    needed
                  </p>
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" /> Difficulty{' '}
                    <Badge variant={DIFFICULTY_VARIANT[part.difficulty]}>{part.difficulty}</Badge>
                  </p>
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/customer/parts/${part.id}/install-guide`)}
                  >
                    <FileText className="h-3.5 w-3.5" /> View Guide
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1" onClick={addToCart}>
                    <ShoppingCart className="h-3.5 w-3.5" /> Buy Part
                  </Button>
                </div>
              </div>

              {/* Option 2 — Professional */}
              <div
                className={cn(
                  'card flex flex-col p-5',
                  part.mechanicInstall ? 'card-hover border-brand-200 dark:border-brand-500/30' : 'opacity-70',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-sky-500 text-white shadow-md shadow-brand-600/20">
                    <UserCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Buy Part + Book Mechanic
                    </h3>
                    <p className="text-xs text-slate-400">Professional installation</p>
                  </div>
                  <Badge variant="brand" className="ml-auto">Certified</Badge>
                </div>
                {part.mechanicInstall ? (
                  <>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      An AutoCare certified mechanic will install the part at your home or a nearby
                      workshop — no service-call hassle.
                    </p>
                    <div className="mt-4 space-y-2 text-xs">
                      <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Star className="h-3.5 w-3.5 text-amber-400" /> Rated mechanics · 4.8 avg
                      </p>
                      <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Home className="h-3.5 w-3.5 text-slate-400" />
                        {part.mechanicInstall.homeServiceAvailable
                          ? 'Home service available'
                          : 'Workshop service'}
                      </p>
                      <p className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 dark:bg-brand-500/10">
                        <span className="text-slate-500 dark:text-slate-400">Installation charge</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(part.mechanicInstall.installationCharge)}
                        </span>
                      </p>
                    </div>
                    <div className="mt-auto pt-4">
                      <Button
                        className="w-full"
                        onClick={() => navigate(`/customer/parts/${part.id}/book-mechanic?qty=${qty}`)}
                      >
                        <UserCheck className="h-4 w-4" /> Book Mechanic
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">
                    Professional installation is not offered for this part — the DIY guide is all
                    you need.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------- Purchase panel ------------------------- */}
        <div>
          <div className="card sticky top-20 space-y-4 p-6">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-lg font-extrabold leading-tight text-slate-900 dark:text-white">
                  {part.name}
                </h1>
                <Badge variant={lowStock ? 'warning' : 'success'} dot>
                  {part.stock <= 0 ? 'Out of stock' : lowStock ? `Only ${part.stock} left` : 'In stock'}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {part.rating > 0 ? (
                  <>
                    <Stars value={part.rating} size="sm" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {part.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">({part.reviewsCount} reviews)</span>
                  </>
                ) : (
                  <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    New arrival
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(part.price)}
                </span>
                <span className="text-sm text-slate-400 line-through">{formatCurrency(part.mrp)}</span>
                {savings > 0 && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                    Save {formatCurrency(savings)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Inclusive of all taxes · GST 18%</p>
            </div>

            {/* Installation mode toggle */}
            <div>
              <p className="label">Installation</p>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800">
                {(
                  [
                    { key: 'DIY', label: 'Install myself', icon: Wrench },
                    { key: 'MECHANIC', label: 'Book mechanic', icon: UserCheck },
                  ] as { key: PartOrderMode; label: string; icon: LucideIcon }[]
                ).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    disabled={key === 'MECHANIC' && !part.mechanicInstall}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                      mode === key
                        ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
              {mode === 'MECHANIC' && part.mechanicInstall && (
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  + {formatCurrency(part.mechanicInstall.installationCharge)} installation charge ·
                  est. {part.mechanicInstall.estimatedTime}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <p className="label !mb-0">Quantity</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-slate-800 dark:text-slate-100">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(part.stock || 1, q + 1))}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <Button className="w-full" disabled={part.stock <= 0} onClick={buyNow}>
                <ShoppingCart className="h-4 w-4" /> Buy Now
              </Button>
              <div className="grid grid-cols-2 gap-2.5">
                <Button variant="secondary" disabled={part.stock <= 0} onClick={addToCart}>
                  <Plus className="h-4 w-4" /> Add to Cart
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/customer/parts/${part.id}/install-guide`)}
                >
                  <FileText className="h-4 w-4" /> Guide
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setChat([
                    {
                      from: 'mechanic',
                      text: 'Hi! An AutoCare certified mechanic will help with this part. Ask me anything about installation.',
                    },
                  ]);
                  replyIndex.current = 0;
                  setChatOpen(true);
                }}
              >
                <MessageSquare className="h-4 w-4" /> Chat with Mechanic
              </Button>
            </div>

            {/* Trust points */}
            <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              {[
                { icon: ShieldCheck, text: `${part.warranty} manufacturer warranty` },
                { icon: BadgeCheck, text: '100% genuine & verified part' },
                { icon: Truck, text: part.freeDelivery ? 'Free delivery on this part' : 'Fast doorstep delivery' },
                { icon: RotateCcw, text: '7-day easy returns' },
              ].map(({ icon: Icon, text }) => (
                <p key={text} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> {text}
                </p>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-brand-500" />
              Delivery to Indiranagar, Bengaluru · {part.deliveryEstimate}
            </div>

            <Link
              to="/customer/parts"
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Continue shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Cart drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Chat modal */}
      <Modal open={chatOpen} onClose={closeChat} title={`Chat with ${mechanicName}`} maxWidth="max-w-lg">
        <div className="flex h-80 flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {chat.length === 0 && (
              <p className="py-10 text-center text-xs text-slate-400">
                Ask anything about the part or installation — a mechanic will reply.
              </p>
            )}
            {chat.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed',
                  m.from === 'customer'
                    ? 'ml-auto rounded-br-sm bg-brand-600 text-white'
                    : 'rounded-bl-sm bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
                )}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <input
              className="input"
              placeholder="Type a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} aria-label="Send message" className="!px-3.5">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Modal>

      {/* Inspection report modal */}
      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Inspection Report"
        maxWidth="max-w-xl"
      >
        <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Inspection reports from service bookings will appear here when available.
        </p>
      </Modal>
    </div>
  );
}
