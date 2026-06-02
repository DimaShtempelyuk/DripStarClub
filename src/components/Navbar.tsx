'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useCart, COOKIE_ID } from '@/context/CartContext';

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
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

export default function Navbar() {
  const { cart, circles, openDrawer } = useCart();
  const qty = (cart?.totalQuantity ?? 0) + circles.filter((c) => c.productId === COOKIE_ID).length;

  return (
    <Nav>
      <Logo href="/">Dripstar</Logo>
      <CartButton onClick={openDrawer}>
        Bag
        {qty > 0 && <Badge>{qty}</Badge>}
      </CartButton>
    </Nav>
  );
}
