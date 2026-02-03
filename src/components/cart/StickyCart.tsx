import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';

export function StickyCart() {
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const getItemCount = useCartStore((state) => state.getItemCount);

  if (items.length === 0) return null;

  const restaurantName = items[0]?.restaurantName || 'Restaurant';

  return (
    <div className="sticky-cart w-[calc(100%-2rem)] max-w-lg">
      <Link to="/cart">
        <div className="glass-card p-4 flex items-center justify-between gap-4 shadow-elevated border-primary/30 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{getItemCount()} items</p>
              <p className="text-xs text-muted-foreground">{restaurantName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-lg">${getTotal().toFixed(2)}</span>
            <Button size="sm" className="btn-glow gap-1">
              View Cart
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
}
