import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartLine, MarketplaceOrder, MarketplacePart } from '@/types';
import { nextOrderId, statusLabelFor, timelineFor } from '@/utils/marketplace';

/* ------------------------------------------------------------------ */
/* localStorage-backed state                                           */
/* ------------------------------------------------------------------ */

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveState<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable (private mode / quota) — ignore.
  }
}

/* ------------------------------------------------------------------ */
/* Cart                                                                */
/* ------------------------------------------------------------------ */

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (part: MarketplacePart, qty?: number) => void;
  remove: (partId: number) => void;
  updateQty: (partId: number, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const CART_KEY = 'autocare.marketplace.cart.v1';

function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => loadState<CartLine[]>(CART_KEY, []));

  useEffect(() => {
    saveState(CART_KEY, lines);
  }, [lines]);

  const add = useCallback((part: MarketplacePart, qty = 1) => {
    if (part.stock <= 0) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.part.id === part.id);
      if (existing) {
        return prev.map((l) =>
          l.part.id === part.id ? { ...l, qty: Math.min(l.qty + qty, part.stock) } : l,
        );
      }
      return [...prev, { part, qty: Math.min(qty, part.stock) }];
    });
  }, []);

  const remove = useCallback((partId: number) => {
    setLines((prev) => prev.filter((l) => l.part.id !== partId));
  }, []);

  const updateQty = useCallback((partId: number, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => {
          if (l.part.id !== partId) return l;
          const max = Math.max(1, l.part.stock);
          return { ...l, qty: Math.min(Math.max(1, qty), max) };
        })
        .filter((l) => l.qty > 0),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.part.price * l.qty, 0);
    return { lines, count, subtotal, add, remove, updateQty, clear };
  }, [lines, add, remove, updateQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a <MarketplaceProvider>');
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

interface OrdersContextValue {
  orders: MarketplaceOrder[];
  placeOrder: (order: Omit<MarketplaceOrder, 'id' | 'placedAt'>) => MarketplaceOrder;
  getOrder: (id: string) => MarketplaceOrder | undefined;
  /** Advance an order's timeline to the given step key (mechanic-side updates). */
  updateOrderStatus: (orderId: string, nextKey: string) => void;
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);
// v2: discards orders seeded into localStorage by the old mock-based build
// (the backend has no order endpoint yet, so orders are still local-only).
const ORDERS_KEY = 'autocare.marketplace.orders.v2';

function OrdersProvider({ children }: { children: ReactNode }) {
  // Orders are stored locally (the backend has no order endpoint yet) but
  // start empty — no seeded/dummy orders.
  const [orders, setOrders] = useState<MarketplaceOrder[]>(() =>
    loadState<MarketplaceOrder[]>(ORDERS_KEY, []),
  );

  useEffect(() => {
    saveState(ORDERS_KEY, orders);
  }, [orders]);

  const placeOrder = useCallback(
    (order: Omit<MarketplaceOrder, 'id' | 'placedAt'>): MarketplaceOrder => {
      const id = nextOrderId(orders);
      const placedAt = new Date().toISOString();
      const full: MarketplaceOrder = { ...order, id, placedAt };
      setOrders((prev) => [full, ...prev]);
      return full;
    },
    [orders],
  );

  const getOrder = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders],
  );

  const updateOrderStatus = useCallback((orderId: string, nextKey: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const timeline = timelineFor(o.mode, nextKey);
        return { ...o, timeline, status: statusLabelFor(nextKey) };
      }),
    );
  }, []);

  const value = useMemo<OrdersContextValue>(
    () => ({ orders, placeOrder, getOrder, updateOrderStatus }),
    [orders, placeOrder, getOrder, updateOrderStatus],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within a <MarketplaceProvider>');
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <OrdersProvider>{children}</OrdersProvider>
    </CartProvider>
  );
}
