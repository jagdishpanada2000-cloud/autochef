-- =====================================================
-- COMPREHENSIVE RLS POLICIES FOR DELIVERY APP
-- Ensures customers can see data and owners can manage their own
-- =====================================================

-- 1. RESTAURANTS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public restaurants are viewable by everyone" ON public.restaurants;
CREATE POLICY "Public restaurants are viewable by everyone" ON public.restaurants
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage own restaurant" ON public.restaurants;
CREATE POLICY "Owners can manage own restaurant" ON public.restaurants
    FOR ALL USING (auth.uid() = owner_id);

-- 2. MENU SECTIONS
ALTER TABLE public.menu_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public menu sections are viewable by everyone" ON public.menu_sections;
CREATE POLICY "Public menu sections are viewable by everyone" ON public.menu_sections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage own menu sections" ON public.menu_sections;
CREATE POLICY "Owners can manage own menu sections" ON public.menu_sections
    FOR ALL USING (auth.uid() = owner_id);

-- 3. MENU ITEMS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public menu items are viewable by everyone" ON public.menu_items;
CREATE POLICY "Public menu items are viewable by everyone" ON public.menu_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage own menu items" ON public.menu_items;
CREATE POLICY "Owners can manage own menu items" ON public.menu_items
    FOR ALL USING (auth.uid() = owner_id);

-- 4. ORDERS (Already has some in unified_schema but let's be sure)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
CREATE POLICY "Customers can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can view restaurant orders" ON public.orders;
CREATE POLICY "Owners can view restaurant orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE id = orders.restaurant_id AND owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners can update restaurant orders" ON public.orders;
CREATE POLICY "Owners can update restaurant orders" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE id = orders.restaurant_id AND owner_id = auth.uid()
        )
    );

-- 5. ORDER ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_items.order_id AND user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.restaurants r ON o.restaurant_id = r.id
            WHERE o.id = order_items.order_id AND r.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Customers can insert order items" ON public.order_items;
CREATE POLICY "Customers can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_items.order_id AND user_id = auth.uid()
        )
    );
