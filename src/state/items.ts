import { todayKey, type DayKey } from '@/kit/dates';
import type { Pence } from '@/kit/money';
import { persisted, uid } from '@/kit/store';
import type { Item, Sale } from '@/domain/resale';

type ItemsState = {
  items: Item[];
  goal: Pence | null;
  added: Record<string, number>; // month → items added (free-tier count)
  add: (i: Omit<Item, 'id' | 'sold'>) => string;
  update: (id: string, patch: Partial<Omit<Item, 'id'>>) => void;
  sell: (id: string, sale: Sale) => void;
  unsell: (id: string) => void;
  remove: (id: string) => Item | undefined;
  restore: (i: Item) => void;
  setGoal: (g: Pence | null) => void;
};

export const useItems = persisted<ItemsState>('flipped.items', 1, (set, get) => ({
  items: [],
  goal: null,
  added: {},
  add: (i) => {
    const id = uid('i');
    const m = todayKey().slice(0, 7);
    set((s) => ({ items: [{ ...i, id }, ...s.items], added: { ...s.added, [m]: (s.added[m] ?? 0) + 1 } }));
    return id;
  },
  update: (id, patch) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
  sell: (id, sale) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, sold: sale } : i)) })),
  unsell: (id) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, sold: undefined } : i)) })),
  remove: (id) => {
    const it = get().items.find((i) => i.id === id);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    return it;
  },
  restore: (i) => set((s) => ({ items: [i, ...s.items] })),
  setGoal: (goal) => set({ goal }),
}));

export const addedThisMonth = (added: Record<string, number>, today: DayKey = todayKey()) => added[today.slice(0, 7)] ?? 0;
