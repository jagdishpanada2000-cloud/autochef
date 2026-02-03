import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';
import { MenuItem } from '@/components/menu/MenuItem';
import { MenuItemSkeleton } from '@/components/menu/MenuItemSkeleton';
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { supabase } from '@/integrations/supabase/client';

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  banner_url: string | null;
  images: string[] | null;
  rating: number | null;
  delivery_time: string | null;
  cuisine_type: string[] | null;
  is_open: boolean | null;
}

interface MenuSection {
  id: string;
  name: string;
  position: number | null;
}

interface MenuItemType {
  id: string;
  section_id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_vegetarian: boolean | null;
  is_available: boolean | null;
  position: number | null;
}

export default function Restaurant() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('');
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
    }
  }, [id]);

  const fetchRestaurantData = async () => {
    setLoading(true);

    // Fetch restaurant
    const { data: restaurantData } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (restaurantData) {
      setRestaurant(restaurantData);
    }

    // Fetch sections
    const { data: sectionsData } = await supabase
      .from('menu_sections')
      .select('*')
      .eq('restaurant_id', id)
      .order('position', { ascending: true });

    if (sectionsData && sectionsData.length > 0) {
      setSections(sectionsData);
      setActiveSection(sectionsData[0].id);

      // Fetch menu items using section IDs (since menu_items doesn't have restaurant_id)
      const sectionIds = sectionsData.map(s => s.id);
      
      const { data: itemsData } = await supabase
        .from('menu_items')
        .select('*')
        .in('section_id', sectionIds)
        .order('position', { ascending: true });

      if (itemsData) {
        setMenuItems(itemsData);
      }
    }

    setLoading(false);
  };

  const getItemsForSection = (sectionId: string) => {
    return menuItems.filter((item) => item.section_id === sectionId);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="h-64 shimmer rounded-xl mb-6" />
          <div className="h-8 w-1/2 shimmer rounded mb-4" />
          <div className="h-4 w-3/4 shimmer rounded mb-8" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!restaurant) {
    return (
      <Layout>
        <div className="container py-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Restaurant not found</h1>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const allImages = restaurant.images && restaurant.images.length > 0 
    ? restaurant.images 
    : [restaurant.banner_url || '/placeholder.svg'];

  return (
    <Layout>
      <div className="relative">
        {/* Banner/Slideshow */}
        <div className="h-64 md:h-80 relative group">
          {allImages.length > 1 ? (
            <Carousel 
              setApi={setApi} 
              className="w-full h-full" 
              opts={{ loop: true }}
              plugins={[
                Autoplay({
                  delay: 4000,
                }),
              ]}
            >
              <CarouselContent className="h-full ml-0">
                {allImages.map((image, index) => (
                  <CarouselItem key={index} className="h-full pl-0">
                    <img
                      src={image}
                      alt={`${restaurant.name} photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* Custom indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {allImages.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current ? "w-6 bg-white" : "w-1.5 bg-white/50"
                    }`} 
                  />
                ))}
              </div>
            </Carousel>
          ) : (
            <img
              src={allImages[0]}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
          
          <Link to="/" className="absolute top-4 left-4 z-20">
            <Button variant="secondary" size="icon" className="rounded-full shadow-md">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Restaurant Info */}
        <div className="container -mt-20 relative z-10 pb-6">
          <div className="glass-card p-6 mb-6 slide-up">
            <h1 className="font-display text-3xl font-bold mb-2">{restaurant.name}</h1>
            <p className="text-muted-foreground mb-4">{restaurant.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="rating-badge">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold">{restaurant.rating?.toFixed(1) || '4.0'}</span>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{restaurant.delivery_time || '30-40 min'}</span>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{restaurant.address}</span>
              </div>
            </div>
          </div>

          {/* Menu Tabs */}
          {sections.length > 0 ? (
            <Tabs value={activeSection} onValueChange={setActiveSection} className="fade-in">
              <TabsList className="w-full justify-start overflow-x-auto mb-6 bg-card">
                {sections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {section.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {sections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="space-y-4">
                  <h2 className="font-display text-xl font-semibold mb-4">{section.name}</h2>
                  {getItemsForSection(section.id).length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No items in this section</p>
                  ) : (
                    <div className="space-y-4">
                      {getItemsForSection(section.id).map((item) => (
                        <MenuItem
                          key={item.id}
                          id={item.id}
                          restaurantId={restaurant.id}
                          restaurantName={restaurant.name}
                          name={item.name}
                          description={item.description}
                          price={Number(item.price)}
                          imageUrl={item.image_url}
                          isVegetarian={item.is_vegetarian}
                          isAvailable={item.is_available}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <p className="text-muted-foreground text-center py-8">No menu available</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
