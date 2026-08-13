import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  partId: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl?: string | null;
  stock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (partId: number) => void;
  setQuantity: (partId: number, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.partId === item.partId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.partId === item.partId
                ? { ...i, quantity: Math.min(i.quantity + (item.quantity ?? 1), i.stock) }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: item.quantity ?? 1 }] });
        }
      },
      removeItem: (partId) => set({ items: get().items.filter((i) => i.partId !== partId) }),
      setQuantity: (partId, quantity) =>
        set({
          items: get().items.map((i) =>
            i.partId === partId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i
          ),
        }),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'autocare-cart' }
  )
);
