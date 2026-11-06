"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
type Basket = {
  cart: Record<string, number>;
  favorites: string[];
  change: (id: string, delta: number) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
};
export const useShop = create<Basket>()(
  persist(
    (set) => ({
      cart: {},
      favorites: [],
      change: (id, delta) =>
        set((s) => {
          const cart = { ...s.cart };
          const n = Math.min(99, Math.max(0, (cart[id] || 0) + delta));
          if (n) cart[id] = n;
          else delete cart[id];
          return { cart };
        }),
      remove: (id) =>
        set((s) => {
          const cart = { ...s.cart };
          delete cart[id];
          return { cart };
        }),
      toggle: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((x) => x !== id)
            : [...s.favorites, id],
        })),
    }),
    { name: "telefon28-shopping-v1", skipHydration: true },
  ),
);
