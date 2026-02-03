import { Link } from 'react-router-dom';
import { Star, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RestaurantCardProps {
  id: string;
  name: string;
  description: string | null;
  address: string;
  bannerUrl: string | null;
  rating: number | null;
  deliveryTime: string | null;
  cuisineType: string[] | null;
  isOpen: boolean | null;
}

export function RestaurantCard({
  id,
  name,
  description,
  address,
  bannerUrl,
  rating,
  deliveryTime,
  cuisineType,
  isOpen,
}: RestaurantCardProps) {
  return (
    <Link to={`/restaurant/${id}`}>
      <article className="glass-card overflow-hidden group cursor-pointer fade-in hover:border-primary/30 transition-all duration-300">
        <div className="relative h-44 overflow-hidden">
          <img
            src={bannerUrl || '/placeholder.svg'}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          
          {!isOpen && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="bg-destructive px-4 py-2 rounded-lg font-semibold">Currently Closed</span>
            </div>
          )}
          
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="rating-badge">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{rating?.toFixed(1) || '4.0'}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-foreground bg-background/80 px-2 py-1 rounded-lg backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>{deliveryTime || '30-40 min'}</span>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-display font-bold text-lg mb-1 group-hover:text-primary transition-colors">{name}</h3>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-1">{description}</p>
          
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{address}</span>
          </div>
          
          {cuisineType && cuisineType.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cuisineType.slice(0, 3).map((cuisine) => (
                <Badge key={cuisine} variant="secondary" className="text-xs">
                  {cuisine}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
