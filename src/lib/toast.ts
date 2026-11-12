import { create } from "zustand";

interface ToastState {
  items: { id: number; text: string }[];
  show: (text: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  items: [],
  show: (text) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { id, text }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 2600);
  },
}));

export const toast = (text: string) => useToast.getState().show(text);
