import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import StyledComponentsRegistry from '@/lib/StyledComponentsRegistry';
import { CartProvider } from '@/context/CartContext';
import { CookieGameProvider } from '@/context/CookieGameContext';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import FloatingRoamers from '@/components/FloatingRoamers';
import CookieTimerBar from '@/components/CookieTimerBar';
import CookieDevPanel from '@/components/CookieDevPanel';
import CookieEmailModal from '@/components/CookieEmailModal';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dripstar',
  description: 'The drop has landed.',
};

// viewport-fit=cover lets env(safe-area-inset-*) resolve to real values on
// notch / Dynamic Island iPhones so we can inset the UI from them.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <CartProvider>
            <CookieGameProvider>
              <Navbar />
              <CookieTimerBar />
              {children}
              <CartDrawer />
              <FloatingRoamers />
              <CookieEmailModal />
              <CookieDevPanel />
            </CookieGameProvider>
          </CartProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
