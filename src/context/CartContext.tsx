'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Cart,
  addToCart,
  createCart,
  removeFromCart,
  updateCartLine,
} from '@/lib/shopify';

interface CartContextValue {
  cart: Cart | null;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  lastAddedVariantId: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_ID_KEY = 'dripstar_cart_id';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAddedVariantId, setLastAddedVariantId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Wire up audio — drop your file at /sounds/click.mp3
    const audio = new Audio('/sounds/click.mp3');
    audio.volume = 0.6;
    // only attach if file loads successfully
    audio.addEventListener('canplaythrough', () => { audioRef.current = audio; }, { once: true });
  }, []);

  async function getOrCreateCart(): Promise<Cart> {
    const storedId = localStorage.getItem(CART_ID_KEY);
    if (storedId && cart) return cart;
    const newCart = await createCart();
    localStorage.setItem(CART_ID_KEY, newCart.id);
    setCart(newCart);
    return newCart;
  }

  async function addItem(variantId: string, quantity = 1) {
    const currentCart = await getOrCreateCart();
    const updated = await addToCart(currentCart.id, variantId, quantity);
    setCart(updated);
    setLastAddedVariantId(variantId);
    setDrawerOpen(true);
    audioRef.current?.play().catch(() => undefined);
    setTimeout(() => setLastAddedVariantId(null), 1200);
  }

  async function removeItem(lineId: string) {
    if (!cart) return;
    const updated = await removeFromCart(cart.id, [lineId]);
    setCart(updated);
  }

  async function updateItem(lineId: string, quantity: number) {
    if (!cart) return;
    const updated = await updateCartLine(cart.id, lineId, quantity);
    setCart(updated);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        addItem,
        removeItem,
        updateItem,
        lastAddedVariantId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
