'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useCookieGame } from '@/context/CookieGameContext';

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* inset from the Dynamic Island / notch + side safe areas */
  padding: calc(1.25rem + env(safe-area-inset-top)) calc(2rem + env(safe-area-inset-right)) 1.25rem calc(2rem + env(safe-area-inset-left));
  background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
  pointer-events: none;

  a, button { pointer-events: all; }
`;

const Logo = styled(Link)`
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #fff;
  text-decoration: none;
`;

const CartButton = styled.button`
  position: relative;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Badge = styled.span`
  background: #e00;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
`;

const CookieCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #ffcf6b;
  text-shadow: 0 1px 6px rgba(0,0,0,0.4);

  .cookie { font-size: 1rem; }
`;

export default function Navbar() {
  const { cart, openDrawer } = useCart();
  const { count: cookieCount } = useCookieGame();
  const qty = cart?.totalQuantity ?? 0;

  return (
    <Nav>
      <Logo href="/">Dripstar</Logo>
      <Right>
        {cookieCount > 0 && (
          <CookieCount title="Cookies circled">
            <span className="cookie">🍪</span>
            {cookieCount}
          </CookieCount>
        )}
        <CartButton onClick={openDrawer}>
          Bag
          {qty > 0 && <Badge>{qty}</Badge>}
        </CartButton>
      </Right>
    </Nav>
  );
}
