import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, ArrowLeft, Truck, ShieldCheck, BookOpen, Wrench, Zap, PackageCheck } from 'lucide-react';
import { diyApi, partsApi } from '@/lib/api';
import { partImageUrl } from '@/lib/images';
import { LoadingScreen, ErrorState } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';
import { toast } from '@/stores/toast-store';

export function PartDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const addItem = useCartStore((s) => s.addItem);
  const navigate = useNavigate();

  const { data: part, isLoading, isError, refetch } = useQuery({
    queryKey: ['part', id],
    queryFn: () => partsApi.get(Number(id)),
    enabled: !!id,
  });

  // A DIY guide is available only when one is published for this part
  // (the API returns 404 otherwise).
  const { data: guide, isError: noDiyGuide } = useQuery({
    queryKey: ['part-diy', id],
    queryFn: () => diyApi.getForPart(Number(id)),
    enabled: !!id,
    retry: false,
  });

  const diyAvailable = !!guide && !noDiyGuide;
  const mechanicAvailable = part?.mechanicInstallationAvailable !== false;

  if (isLoading) return <LoadingScreen label="Loading part…" />;
  if (isError || !part) return <ErrorState message="Couldn't load this part" onRetry={() => void refetch()} />;

  return (
    <div className="container-app py-10">
      <Link to="/parts" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to catalog
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-80 overflow-hidden rounded-3xl bg-ink-50 dark:bg-ink-800/50">
          <img src={partImageUrl(part.category, part.imageUrl)} alt={part.name} className="h-full w-full object-cover" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{part.category}</Badge>
            {part.stockQuantity > 0 ? <Badge variant="success">In stock ({part.stockQuantity})</Badge> : <Badge variant="error">Out of stock</Badge>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 dark:text-white">{part.name}</h1>
          {part.brand && <p className="mt-1 text-sm text-ink-500">by <span className="font-semibold text-ink-700 dark:text-ink-300">{part.brand}</span></p>}
          <p className="mt-2 font-display text-2xl font-bold text-brand-600 dark:text-brand-400">{formatCurrency(part.price)}</p>
          <p className="mt-1 text-xs text-ink-400">Delivery: {formatCurrency(part.deliveryFee ?? 80)}</p>
          {part.description && <p className="mt-4 text-ink-600 dark:text-ink-300">{part.description}</p>}

          {part.compatibleVehicleModels && part.compatibleVehicleModels.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-ink-700 dark:text-ink-300">Compatible with</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {part.compatibleVehicleModels.map((m) => <Badge key={m} variant="neutral">{m}</Badge>)}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              disabled={part.stockQuantity === 0}
              onClick={() => {
                addItem({ partId: part.id, name: part.name, price: part.price, category: part.category, imageUrl: partImageUrl(part.category, part.imageUrl), stock: part.stockQuantity });
                toast(`${part.name} added to cart`, 'success');
              }}
            >
              <ShoppingCart className="h-5 w-5" /> Add to Cart
            </Button>
            <Button
              size="lg"
              variant="secondary"
              disabled={part.stockQuantity === 0}
              onClick={() => {
                addItem({ partId: part.id, name: part.name, price: part.price, category: part.category, imageUrl: partImageUrl(part.category, part.imageUrl), stock: part.stockQuantity });
                toast(`${part.name} added — proceeding to checkout`, 'success');
                navigate('/checkout');
              }}
            >
              <Zap className="h-5 w-5" /> Buy Now
            </Button>
          </div>

          {/* Installation options — Buy → Learn → Install yourself OR book a mechanic */}
          {(diyAvailable || mechanicAvailable) && (
            <div className="mt-8 rounded-2xl border border-ink-100 p-5 dark:border-ink-800">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-400">Installation options</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {diyAvailable && (
                  <div className="flex flex-col justify-between rounded-xl bg-ink-50 p-4 dark:bg-ink-800/50">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-ink-100">
                        <BookOpen className="h-4 w-4 text-brand-500" /> DIY Installation
                      </p>
                      <p className="mt-1 text-xs text-ink-500">Learn how to install it yourself with a step-by-step guide.</p>
                    </div>
                    <Link to={`/parts/${part.id}/diy`} className="mt-3">
                      <Button variant="outline" size="sm" className="w-full">View DIY Guide</Button>
                    </Link>
                  </div>
                )}
                {mechanicAvailable && (
                  <div className="flex flex-col justify-between rounded-xl bg-ink-50 p-4 dark:bg-ink-800/50">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-ink-100">
                        <Wrench className="h-4 w-4 text-brand-500" /> Professional Installation
                      </p>
                      <p className="mt-1 text-xs text-ink-500">Let an AutoCare mechanic install it at your doorstep.</p>
                    </div>
                    <Link to={`/parts/${part.id}/install`} className="mt-3">
                      <Button size="sm" className="w-full">Book a Mechanic</Button>
                    </Link>
                  </div>
                )}
                {mechanicAvailable && part.stockQuantity > 0 && (
                  <div className="flex flex-col justify-between rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10 sm:col-span-2">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-ink-100">
                        <PackageCheck className="h-4 w-4 text-brand-500" /> Buy + Install
                      </p>
                      <p className="mt-1 text-xs text-ink-500">Purchase the part and book a mechanic installation in one go.</p>
                      <p className="mt-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                        {formatCurrency(part.price)} + {formatCurrency(part.deliveryFee ?? 80)} delivery + installation
                      </p>
                    </div>
                    <Link to={`/parts/${part.id}/install?mode=combined`} className="mt-3">
                      <Button size="sm" className="w-full"><PackageCheck className="h-4 w-4" /> Buy + Install</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 p-4 dark:border-ink-800">
              <Truck className="h-5 w-5 text-brand-500" />
              <div><p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Fast Delivery</p><p className="text-xs text-ink-400">2-4 business days</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 p-4 dark:border-ink-800">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <div><p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Genuine Part</p><p className="text-xs text-ink-400">Quality assured</p></div>
            </div>
          </div>

          {part.installationSteps && (
            <div className="mt-8 rounded-2xl bg-ink-50 p-5 dark:bg-ink-800/50">
              <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">Installation Guide</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">{part.installationSteps}</p>
            </div>
          )}

          {part.tutorialVideoUrl && (
            <a href={part.tutorialVideoUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.03 5.804.001 12 .03 18.185.484 20.55 4.385 20.816c3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zM10 16V8l6 4-6 4z" /></svg>
              Watch installation tutorial
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
