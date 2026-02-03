import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/restaurant/RestaurantCardSkeleton';
import { supabase } from '@/integrations/supabase/client';

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  banner_url: string | null;
  rating: number | null;
  delivery_time: string | null;
  cuisine_type: string[] | null;
  is_open: boolean | null;
}

const CUISINE_FILTERS = ['All', 'Indian', 'American', 'Japanese', 'Italian', 'Thai', 'Chinese'];

export default function Index() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error fetching restaurants:', error);
    } else {
      setRestaurants(data || []);
    }
    setLoading(false);
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch =
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine_type?.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCuisine =
      selectedCuisine === 'All' ||
      restaurant.cuisine_type?.includes(selectedCuisine);

    return matchesSearch && matchesCuisine;
  });

  return (
    <Layout>
      <div className="container py-6">
        {/* Hero Section */}
        <section className="mb-8 slide-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            Delicious food at 20%off
            <br />
       
          </h1>
          <p className="text-muted-foreground text-lg max-w-md">
       
          </p>
        </section>

        {/* Search and Filters */}
        <section className="mb-6 space-y-4 fade-in">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search restaurants or cuisines..."
                className="pl-10 h-12 bg-card border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CUISINE_FILTERS.map((cuisine) => (
              <Badge
                key={cuisine}
                variant={selectedCuisine === cuisine ? 'default' : 'secondary'}
                className={`cursor-pointer px-4 py-2 text-sm whitespace-nowrap transition-all ${
                  selectedCuisine === cuisine
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedCuisine(cuisine)}
              >
                {cuisine}
              </Badge>
            ))}
          </div>
        </section>

        {/* Restaurants Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">
              {selectedCuisine === 'All' ? 'All Restaurants' : `${selectedCuisine} Restaurants`}
            </h2>
            <span className="text-muted-foreground text-sm">
              {filteredRestaurants.length} places
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No restaurants found</p>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  id={restaurant.id}
                  name={restaurant.name}
                  description={restaurant.description}
                  address={restaurant.address}
                  bannerUrl={restaurant.banner_url}
                  rating={restaurant.rating}
                  deliveryTime={restaurant.delivery_time}
                  cuisineType={restaurant.cuisine_type}
                  isOpen={restaurant.is_open}
                />
              ))}
            </div>
          )}
        </section>
        <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
          <Link to="/orders" aria-label="Open orders drawer">
            <div className="relative h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 transition hover:scale-[1.03]">
              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tracking-tight">
                Orders
              </span>
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
              <span className="absolute inset-0 rounded-full border border-emerald-400/40" />
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
