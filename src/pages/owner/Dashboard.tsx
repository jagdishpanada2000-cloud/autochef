import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  UtensilsCrossed,
  ClipboardList,
  TrendingUp,
  Layers,
  ArrowRight,
  Plus,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { useAuth } from '@/hooks/useAuth';
import { restaurantService, orderService } from '@/services';
import type { Restaurant } from '@/services/restaurantService';

export default function OwnerDashboard() {
  const { user, profile } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState({
    totalSections: 0,
    totalItems: 0,
    availableItems: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // Get owner's restaurant (single since owner_id is UNIQUE)
        const { data: ownerRestaurant } = await restaurantService.getOwnerRestaurant(user.id);
        
        if (ownerRestaurant) {
          setRestaurant(ownerRestaurant);

          // Get menu stats
          const { data: sections } = await restaurantService.getMenuSections(ownerRestaurant.id);
          const { data: items } = await restaurantService.getMenuItemsByOwner(user.id);
          
          // Get order stats
          const { data: orderStats } = await orderService.getOrderStats(ownerRestaurant.id);
          const { data: pendingOrders } = await orderService.getOrdersByStatus(ownerRestaurant.id, 'pending');

          setStats({
            totalSections: sections?.length || 0,
            totalItems: items?.length || 0,
            availableItems: items?.filter(i => i.is_available).length || 0,
            pendingOrders: pendingOrders?.length || 0,
            totalRevenue: orderStats?.totalRevenue || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const statCards = [
    {
      title: 'Menu Sections',
      value: stats.totalSections,
      icon: Layers,
      href: '/owner/sections',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Menu Items',
      value: stats.totalItems,
      icon: UtensilsCrossed,
      href: '/owner/items',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ClipboardList,
      href: '/owner/orders',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      href: '/owner/orders',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <OwnerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Owner'}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your restaurant today.
            </p>
          </div>
          
          {!restaurant && !loading && (
            <Button asChild>
              <Link to="/owner/onboarding">
                <Plus className="w-4 h-4 mr-2" />
                Register Restaurant
              </Link>
            </Button>
          )}
        </div>

        {/* Restaurant Info Card */}
        {restaurant && (
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`
                w-16 h-16 rounded-xl flex items-center justify-center
                ${restaurant.is_open ? 'bg-green-500/10' : 'bg-red-500/10'}
              `}>
                <Store className={`w-8 h-8 ${restaurant.is_open ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{restaurant.name}</h2>
                <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                <span className={`
                  inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium
                  ${restaurant.is_open 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-red-500/10 text-red-500'
                  }
                `}>
                  {restaurant.is_open ? 'Open' : 'Closed'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      const { data, error } = await restaurantService.updateRestaurant(restaurant.id, {
                        is_open: !restaurant.is_open
                      });
                      if (error) throw error;
                      if (data) setRestaurant(data);
                    } catch (err) {
                      console.error('Error toggling status:', err);
                    }
                  }}
                >
                  {restaurant.is_open ? 'Close Shop' : 'Open Shop'}
                </Button>
                <Button variant="ghost" size="icon" asChild title="Restaurant Settings">
                  <Link to="/owner/settings">
                    <Settings className="w-5 h-5 text-muted-foreground" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.href}>
                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                      ) : (
                        stat.value
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/owner/items'}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Add Menu Item</h3>
                <p className="text-sm text-muted-foreground">Create a new dish for your menu</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/owner/orders'}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold">View Orders</h3>
                <p className="text-sm text-muted-foreground">Manage incoming orders</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    </OwnerLayout>
  );
}
