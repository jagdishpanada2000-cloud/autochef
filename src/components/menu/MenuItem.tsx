import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { toast } from 'sonner';

interface MenuItemProps {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isVegetarian: boolean | null;
  isAvailable: boolean | null;
}

export function MenuItem({
  id,
  restaurantId,
  restaurantName,
  name,
  description,
  price,
  imageUrl,
  isVegetarian,
  isAvailable,
}: MenuItemProps) {
  const { items, addItem, updateQuantity, getRestaurantId } = useCartStore();
  const cartItem = items.find((item) => item.id === id);
  const quantity = cartItem?.quantity || 0;
  const currentRestaurantId = getRestaurantId();

  const handleAddToCart = () => {
    if (currentRestaurantId && currentRestaurantId !== restaurantId) {
      toast.warning('Cart cleared', {
        description: 'Your cart was cleared as you added items from a different restaurant.',
      });
    }
    
    addItem({
      id,
      restaurantId,
      restaurantName,
      name,
      price,
      imageUrl: imageUrl || undefined,
      isVegetarian: isVegetarian || false,
    });
    
    toast.success('Added to cart', {
      description: `${name} added to your cart`,
    });
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    updateQuantity(id, newQuantity);
    if (newQuantity === 0) {
      toast.info('Removed from cart');
    }
  };

  return (
    <div className={`glass-card p-4 flex gap-4 fade-in ${!isAvailable ? 'opacity-50' : ''}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className={`veg-indicator ${isVegetarian ? 'veg' : 'non-veg'}`} />
          {!isAvailable && (
            <span className="text-xs text-destructive font-medium">Unavailable</span>
          )}
        </div>
        
        <h4 className="font-semibold text-foreground mb-1">{name}</h4>
        <p className="text-primary font-display font-bold mb-2">${price.toFixed(2)}</p>
        
        {description && (
          <p className="text-muted-foreground text-sm line-clamp-2">{description}</p>
        )}
      </div>
      
      <div className="flex flex-col items-center justify-between">
        {imageUrl && (
          <div className="w-24 h-24 rounded-lg overflow-hidden mb-2">
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {isAvailable ? (
          quantity > 0 ? (
            <div className="flex items-center gap-2 bg-primary rounded-lg">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
                onClick={() => handleUpdateQuantity(quantity - 1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-primary-foreground w-6 text-center">{quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
                onClick={() => handleUpdateQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleAddToCart}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )
        ) : (
          <Button size="sm" variant="outline" disabled>
            Unavailable
          </Button>
        )}
      </div>
    </div>
  );
}
