// Order Service
// Handles all order-related operations

import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate, OrderStatus, PaymentMethod } from '@/integrations/supabase/types';

export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type Payment = Tables<'payments'>;

export interface OrderWithItems extends Order {
  items: (OrderItem & { menu_item?: Tables<'menu_items'> })[];
  restaurant?: Tables<'restaurants'>;
  payment?: Payment;
}

export interface CreateOrderPayload {
  restaurant_id: string;
  items: {
    menu_item_id: string;
    quantity: number;
    price: number;
    special_instructions?: string;
  }[];
  delivery_address: string;
  delivery_instructions?: string;
  payment_method: PaymentMethod;
}

export const orderService = {
  // ==================== CUSTOMER ORDER OPERATIONS ====================

  // Create a new order
  async createOrder(userId: string, payload: CreateOrderPayload): Promise<{ data: Order | null; error: Error | null }> {
    const totalPrice = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Start a transaction by creating the order first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        restaurant_id: payload.restaurant_id,
        total_price: totalPrice,
        delivery_address: payload.delivery_address,
        delivery_instructions: payload.delivery_instructions,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      return { data: null, error: new Error(orderError.message) };
    }

    // Insert order items
    const orderItems = payload.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: item.price,
      special_instructions: item.special_instructions,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback: delete the order if items failed to insert
      await supabase.from('orders').delete().eq('id', order.id);
      return { data: null, error: new Error(itemsError.message) };
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        method: payload.payment_method,
        amount: totalPrice,
        status: 'pending',
      });

    if (paymentError) {
      console.error('Payment record creation failed:', paymentError);
      // Don't rollback, order is still valid
    }

    return { data: order, error: null };
  },

  // Get orders for customer
  async getCustomerOrders(userId: string): Promise<{ data: OrderWithItems[] | null; error: Error | null }> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(*),
        items:order_items(
          *,
          menu_item:menu_items(*)
        ),
        payment:payments(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    // Transform the data to match OrderWithItems type
    const transformedOrders = orders?.map((order) => ({
      ...order,
      items: order.items || [],
      restaurant: order.restaurant,
      payment: Array.isArray(order.payment) ? order.payment[0] : order.payment,
    })) as OrderWithItems[];

    return { data: transformedOrders, error: null };
  },

  // Get single order details
  async getOrderById(orderId: string): Promise<{ data: OrderWithItems | null; error: Error | null }> {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(*),
        items:order_items(
          *,
          menu_item:menu_items(*)
        ),
        payment:payments(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const transformedOrder = {
      ...order,
      items: order.items || [],
      restaurant: order.restaurant,
      payment: Array.isArray(order.payment) ? order.payment[0] : order.payment,
    } as OrderWithItems;

    return { data: transformedOrder, error: null };
  },

  // ==================== OWNER ORDER OPERATIONS ====================

  // Get orders for restaurant owner
  async getRestaurantOrders(restaurantId: string): Promise<{ data: OrderWithItems[] | null; error: Error | null }> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          menu_item:menu_items(*)
        ),
        payment:payments(*)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const transformedOrders = orders?.map((order) => ({
      ...order,
      items: order.items || [],
      payment: Array.isArray(order.payment) ? order.payment[0] : order.payment,
    })) as OrderWithItems[];

    return { data: transformedOrders, error: null };
  },

  // Get orders by status for restaurant
  async getOrdersByStatus(restaurantId: string, status: OrderStatus): Promise<{ data: Order[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    return { data, error: error ? new Error(error.message) : null };
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ data: Order | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    return { data, error: error ? new Error(error.message) : null };
  },

  // ==================== ANALYTICS ====================

  // Get order statistics for restaurant
  async getOrderStats(restaurantId: string, startDate?: string, endDate?: string): Promise<{
    data: {
      totalOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
      ordersByStatus: Record<OrderStatus, number>;
    } | null;
    error: Error | null;
  }> {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: orders, error } = await query;

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByStatus: Record<string, number> = {};
    orders?.forEach((order) => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    return {
      data: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus: ordersByStatus as Record<OrderStatus, number>,
      },
      error: null,
    };
  },

  // Get daily revenue for charts
  async getDailyRevenue(restaurantId: string, days: number = 7): Promise<{
    data: { date: string; revenue: number; orders: number }[] | null;
    error: Error | null;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at, total_price')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', startDate.toISOString())
      .eq('status', 'delivered');

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    // Group by date
    const revenueByDate: Record<string, { revenue: number; orders: number }> = {};
    
    orders?.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = { revenue: 0, orders: 0 };
      }
      revenueByDate[date].revenue += Number(order.total_price);
      revenueByDate[date].orders += 1;
    });

    const result = Object.entries(revenueByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { data: result, error: null };
  },

  // ==================== PAYMENT OPERATIONS ====================

  // Update payment status
  async updatePaymentStatus(orderId: string, status: 'completed' | 'failed', transactionId?: string): Promise<{ error: Error | null }> {
    const updates: TablesUpdate<'payments'> = { status };
    if (transactionId) {
      updates.transaction_id = transactionId;
    }

    const { error } = await supabase
      .from('payments')
      .update(updates)
      .eq('order_id', orderId);

    return { error: error ? new Error(error.message) : null };
  },
};
