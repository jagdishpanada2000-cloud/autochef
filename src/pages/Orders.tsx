import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Truck, ChefHat, Package, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services';
import type { OrderWithItems } from '@/services/orderService';
import type { OrderStatus } from '@/integrations/supabase/types';
import { formatDistanceToNow, format } from 'date-fns';
import CustomerLayout from '@/components/layout/CustomerLayout';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Order Placed', color: 'bg-yellow-500', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500', icon: CheckCircle },
  preparing: { label: 'Being Prepared', color: 'bg-orange-500', icon: ChefHat },
  ready: { label: 'Ready for Pickup', color: 'bg-green-500', icon: Package },
  out_for_delivery: { label: 'On the Way', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-600', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
};

export default function CustomerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;

      try {
        const { data } = await orderService.getCustomerOrders(user.id);
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  const OrderCard = ({ order }: { order: OrderWithItems }) => {
    const config = statusConfig[order.status];
    const StatusIcon = config.icon;

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Restaurant Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                {order.restaurant?.logo_url ? (
                  <img
                    src={order.restaurant.logo_url}
                    alt={order.restaurant.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Store className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{order.restaurant?.name || 'Restaurant'}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.created_at), 'MMM d, yyyy • h:mm a')}
                </p>
              </div>
              <Badge className={`${config.color} text-white`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-4 space-y-2">
            {order.items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.quantity}x {item.menu_item?.name || 'Item'}
                </span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
            {order.items.length > 3 && (
              <p className="text-sm text-muted-foreground">
                +{order.items.length - 3} more items
              </p>
            )}
            <div className="border-t pt-2 mt-2 flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>₹{order.total_price}</span>
            </div>
          </div>

          {/* Status Timeline (for active orders) */}
          {!['delivered', 'cancelled'].includes(order.status) && (
            <div className="p-4 pt-0">
              <div className="flex items-center justify-between text-xs">
                {['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'].map((status, index) => {
                  const isCompleted = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
                    .indexOf(order.status) >= ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered']
                    .indexOf(status);
                  const isCurrent = order.status === status || (order.status === 'ready' && status === 'preparing');
                  
                  return (
                    <div key={status} className="flex flex-col items-center">
                      <div className={`
                        w-3 h-3 rounded-full
                        ${isCompleted ? 'bg-primary' : 'bg-muted'}
                        ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}
                      `} />
                      {index < 4 && (
                        <div className={`w-full h-0.5 mt-1 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order ID */}
          <div className="px-4 pb-4">
            <p className="text-xs text-muted-foreground">
              Order ID: {order.id.slice(-8).toUpperCase()}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Track and view your order history</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Button asChild>
              <Link to="/">Browse Restaurants</Link>
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="active" className="flex-1">
                Active ({activeOrders.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                Past Orders ({pastOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4 space-y-4">
              {activeOrders.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active orders</p>
                </div>
              ) : (
                activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-4 space-y-4">
              {pastOrders.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No past orders</p>
                </div>
              ) : (
                pastOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </CustomerLayout>
  );
}
