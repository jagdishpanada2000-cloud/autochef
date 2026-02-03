import { ReactNode } from 'react';
import { Header } from './Header';
import { StickyCart } from '@/components/cart/StickyCart';

interface LayoutProps {
  children: ReactNode;
  showStickyCart?: boolean;
}

export function Layout({ children, showStickyCart = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      {showStickyCart && <StickyCart />}
    </div>
  );
}
