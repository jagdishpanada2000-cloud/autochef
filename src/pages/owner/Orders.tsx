import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Truck, ChefHat, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { useAuth } from '@/hooks/useAuth';
import { restaurantService, orderService } from '@/services';
import type { OrderWithItems } from '@/services/orderService';
import type { Restaurant } from '@/services/restaurantService';
import type { OrderStatus } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'bg-orange-500', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-500', icon: Package },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-600', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
};

const statusFlow: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

export default function OwnerOrders() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchData();
    // Poll for new orders every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      const { data: ownerRestaurant } = await restaurantService.getOwnerRestaurant(user.id);
      if (ownerRestaurant) {
        setRestaurant(ownerRestaurant);
        const { data: ordersData } = await orderService.getRestaurantOrders(ownerRestaurant.id);
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await orderService.updateOrderStatus(orderId, newStatus);
      if (error) throw error;

      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      toast.success(`Order status updated to ${statusConfig[newStatus].label}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) return null;
    return statusFlow[currentIndex + 1];
  };

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerLayout>
    );
  }

  if (!restaurant) {
    return (
      <OwnerLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Please register your restaurant first</p>
          <Button asChild>
            <a href="/owner/onboarding">Register Restaurant</a>
          </Button>
        </div>
      </OwnerLayout>
    );
  }

  const OrderCard = ({ order }: { order: OrderWithItems }) => {
    const config = statusConfig[order.status];
    const StatusIcon = config.icon;
    const nextStatus = getNextStatus(order.status);

    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Order #{order.id.slice(-8).toUpperCase()}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </p>
            </div>
            <Badge className={`${config.color} text-white`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Items */}
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>
                  {item.quantity}x {item.menu_item?.name || 'Unknown Item'}
                </span>
                <span className="text-muted-foreground">₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>₹{order.total_price}</span>
            </div>
          </div>

          {/* Delivery Address */}
          {order.delivery_address && (
            <div className="text-sm">
              <p className="text-muted-foreground">Delivery Address:</p>
              <p>{order.delivery_address}</p>
            </div>
          )}

          {/* Actions */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="flex items-center gap-2 pt-2">
              {nextStatus && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(order.id, nextStatus)}
                  className="flex-1"
                >
                  Mark as {statusConfig[nextStatus].label}
                </Button>
              )}
              {order.status === 'pending' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                >
                  Cancel
                </Button>
              )}
              <Select
                value={order.status}
                onValueChange={(value: OrderStatus) => handleUpdateStatus(order.id, value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFlow.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusConfig[status].label}
                    </SelectItem>
                  ))}
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage incoming orders from customers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-500">
                {orders.filter(o => o.status === 'pending').length}
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-500">
                {orders.filter(o => o.status === 'preparing').length}
              </div>
              <p className="text-sm text-muted-foreground">Preparing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">
                {orders.filter(o => o.status === 'ready').length}
              </div>
              <p className="text-sm text-muted-foreground">Ready</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-500">
                {orders.filter(o => o.status === 'delivered').length}
              </div>
              <p className="text-sm text-muted-foreground">Delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {activeOrders.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active orders</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completedOrders.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No completed orders yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </OwnerLayout>
  );
}
