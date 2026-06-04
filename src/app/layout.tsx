import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import StyledComponentsRegistry from '@/lib/StyledComponentsRegistry';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import FloatingRoamers from '@/components/FloatingRoamers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dripstar',
  description: 'The drop has landed.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <CartProvider>
            <Navbar />
            {children}
            <CartDrawer />
            <FloatingRoamers />
          </CartProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
