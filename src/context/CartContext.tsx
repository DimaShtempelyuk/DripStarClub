'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Cart,
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCartLine,
} from '@/lib/shopify';

// A persistent crayon mark on a product page.
export interface Circle {
  circleId: string;
  productId: string;
  variantId: string;
  xPct: number; // 0..1 horizontal position on the page
  yPct: number; // 0..1 vertical position on the page
  rPct: number; // radius as a fraction of page width
  seed: number; // stable wobble seed
}

interface AddCirclePayload {
  productId: string;
  variantId: string;
  xPct: number;
  yPct: number;
  rPct: number;
}

interface CartContextValue {
  cart: Cart | null;
  circles: Circle[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Add a circle at an explicit position (from clicking a product page). */
  addCircle: (payload: AddCirclePayload) => Promise<void>;
  /** Remove one specific circle by id (and decrement its cart line). */
  removeCircleById: (circleId: string) => Promise<void>;
  /** Drawer "+" — add a circle for a product at a random spot. */
  incrementProduct: (productId: string, variantId: string) => Promise<void>;
  /** Drawer "−" — remove the newest circle for a product. */
  decrementProduct: (productId: string) => Promise<void>;
  /** Drawer trash — remove all circles for a product and its cart line. */
  removeProduct: (productId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_ID_KEY = 'dripstar_cart_id';
const CIRCLES_KEY = 'dripstar_circles';

// Sentinel id for the tutorial "cookie" — a demo-only item that never touches
// the real Shopify cart (so it's never charged at checkout).
export const COOKIE_ID = '__cookie__';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cartRef = useRef<Cart | null>(null);
  const circlesRef = useRef<Circle[]>([]);
  const ensuringRef = useRef<Promise<Cart> | null>(null);

  // cartRef backup sync (commitCart also sets it synchronously)
  useEffect(() => { cartRef.current = cart; }, [cart]);

  // Single source of truth for circles: update the ref SYNCHRONOUSLY so rapid
  // clicks never read a stale list (that was the "count won't decrease" bug).
  function setCirclesBoth(next: Circle[]) {
    circlesRef.current = next;
    setCircles(next);
  }

  // ── init: audio + restore circles + restore cart ────────────────────────────
  useEffect(() => {
    const audio = new Audio('/sounds/click.mp3');
    audio.volume = 0.6;
    audio.addEventListener('canplaythrough', () => { audioRef.current = audio; }, { once: true });

    try {
      const raw = localStorage.getItem(CIRCLES_KEY);
      if (raw) {
        const parsed: Circle[] = JSON.parse(raw);
        if (Array.isArray(parsed)) { circlesRef.current = parsed; setCircles(parsed); }
      }
    } catch { /* ignore */ }

    const storedId = localStorage.getItem(CART_ID_KEY);
    if (storedId) {
      getCart(storedId).then((c) => { if (c) setCart(c); }).catch(() => undefined);
    }
  }, []);

  // ── persist circles (cookie circles are a per-session game — never saved) ───
  useEffect(() => {
    try {
      const persistable = circles.filter((c) => c.productId !== COOKIE_ID);
      localStorage.setItem(CIRCLES_KEY, JSON.stringify(persistable));
    } catch { /* ignore */ }
  }, [circles]);

  // ── cart bootstrap (race-safe) ──────────────────────────────────────────────
  async function ensureCart(): Promise<Cart> {
    if (cartRef.current) return cartRef.current;
    if (ensuringRef.current) return ensuringRef.current;
    ensuringRef.current = (async () => {
      const storedId = localStorage.getItem(CART_ID_KEY);
      if (storedId) {
        try {
          const existing = await getCart(storedId);
          if (existing) { cartRef.current = existing; setCart(existing); return existing; }
        } catch { /* fall through to create */ }
      }
      const created = await createCart();
      localStorage.setItem(CART_ID_KEY, created.id);
      cartRef.current = created;
      setCart(created);
      return created;
    })();
    try { return await ensuringRef.current; }
    finally { ensuringRef.current = null; }
  }

  function commitCart(c: Cart) { cartRef.current = c; setCart(c); }

  // ── core: add a circle + bump the matching cart line ────────────────────────
  async function addCircle(payload: AddCirclePayload) {
    const circle: Circle = { circleId: uid(), seed: Math.floor(Math.random() * 1e9), ...payload };
    setCirclesBoth([...circlesRef.current, circle]);
    audioRef.current?.play().catch(() => undefined);

    // The tutorial cookie is demo-only — never hit Shopify.
    if (payload.productId === COOKIE_ID) return;

    try {
      const c = await ensureCart();
      const updated = await addToCart(c.id, payload.variantId, 1);
      commitCart(updated);
    } catch { /* keep the optimistic circle; cart will reconcile on reload */ }
  }

  function lineForProduct(productId: string) {
    return cartRef.current?.lines.nodes.find((l) => l.merchandise.product.id === productId) ?? null;
  }

  // ── remove a specific circle, sync its cart line to the remaining count ─────
  async function removeCircleById(circleId: string) {
    const target = circlesRef.current.find((c) => c.circleId === circleId);
    if (!target) return;
    const remaining = circlesRef.current.filter((c) => c.circleId !== circleId);
    setCirclesBoth(remaining);

    if (target.productId === COOKIE_ID) return; // demo — no Shopify line
    const line = lineForProduct(target.productId);
    if (!line || !cartRef.current) return;
    const count = remaining.filter((c) => c.productId === target.productId).length;
    try {
      const updated = count <= 0
        ? await removeFromCart(cartRef.current.id, [line.id])
        : await updateCartLine(cartRef.current.id, line.id, count);
      commitCart(updated);
    } catch { /* ignore */ }
  }

  async function incrementProduct(productId: string, variantId: string) {
    await addCircle({
      productId,
      variantId,
      xPct: 0.3 + Math.random() * 0.4,
      yPct: 0.25 + Math.random() * 0.35,
      rPct: 0.3,
    });
  }

  async function decrementProduct(productId: string) {
    // newest circle for this product = last match in the array
    for (let i = circlesRef.current.length - 1; i >= 0; i--) {
      if (circlesRef.current[i].productId === productId) {
        await removeCircleById(circlesRef.current[i].circleId);
        return;
      }
    }
    // No circle tracked (legacy/desynced item): decrement the Shopify line directly.
    if (productId === COOKIE_ID) return;
    const line = lineForProduct(productId);
    if (!line || !cartRef.current) return;
    try {
      const updated = line.quantity > 1
        ? await updateCartLine(cartRef.current.id, line.id, line.quantity - 1)
        : await removeFromCart(cartRef.current.id, [line.id]);
      commitCart(updated);
    } catch { /* ignore */ }
  }

  async function removeProduct(productId: string) {
    const remaining = circlesRef.current.filter((c) => c.productId !== productId);
    setCirclesBoth(remaining);
    const line = lineForProduct(productId);
    if (line && cartRef.current) {
      const updated = await removeFromCart(cartRef.current.id, [line.id]);
      commitCart(updated);
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        circles,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        addCircle,
        removeCircleById,
        incrementProduct,
        decrementProduct,
        removeProduct,
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
