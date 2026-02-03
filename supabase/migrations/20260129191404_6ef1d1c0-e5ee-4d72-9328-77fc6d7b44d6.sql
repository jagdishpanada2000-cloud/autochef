-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  banner_url TEXT,
  rating NUMERIC(2,1) DEFAULT 4.0,
  delivery_time TEXT DEFAULT '30-40 min',
  cuisine_type TEXT[],
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu_sections table
CREATE TABLE public.menu_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.menu_sections(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  is_vegetarian BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create read-only policies for all users (including anonymous)
CREATE POLICY "Anyone can view restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Anyone can view menu sections" ON public.menu_sections FOR SELECT USING (true);
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (true);

-- Insert sample restaurants
INSERT INTO public.restaurants (name, description, address, banner_url, rating, delivery_time, cuisine_type, is_open) VALUES
('The Spice Garden', 'Authentic Indian cuisine with bold flavors and aromatic spices', '123 Curry Lane, Food District', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', 4.5, '25-35 min', ARRAY['Indian', 'Curry', 'Vegetarian'], true),
('Burger Republic', 'Gourmet burgers crafted with premium ingredients', '456 Grill Street, Downtown', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 4.3, '20-30 min', ARRAY['American', 'Burgers', 'Fast Food'], true),
('Sushi Zen', 'Fresh Japanese sushi and traditional dishes', '789 Ocean Boulevard, Marina', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800', 4.7, '30-40 min', ARRAY['Japanese', 'Sushi', 'Asian'], true),
('Pizza Paradise', 'Wood-fired pizzas with authentic Italian recipes', '321 Roma Avenue, Little Italy', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800', 4.4, '25-35 min', ARRAY['Italian', 'Pizza', 'Pasta'], true),
('Thai Orchid', 'Exotic Thai flavors from street food to fine dining', '555 Bangkok Street, Eastside', 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800', 4.6, '30-40 min', ARRAY['Thai', 'Asian', 'Curry'], true),
('Dragon Wok', 'Traditional Chinese cuisine with modern twists', '888 Dynasty Road, Chinatown', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800', 4.2, '20-30 min', ARRAY['Chinese', 'Asian', 'Noodles'], true);

-- Insert menu sections for each restaurant
INSERT INTO public.menu_sections (restaurant_id, name, sort_order)
SELECT id, 'Starters', 1 FROM public.restaurants WHERE name = 'The Spice Garden'
UNION ALL SELECT id, 'Main Course', 2 FROM public.restaurants WHERE name = 'The Spice Garden'
UNION ALL SELECT id, 'Breads', 3 FROM public.restaurants WHERE name = 'The Spice Garden'
UNION ALL SELECT id, 'Desserts', 4 FROM public.restaurants WHERE name = 'The Spice Garden';

INSERT INTO public.menu_sections (restaurant_id, name, sort_order)
SELECT id, 'Burgers', 1 FROM public.restaurants WHERE name = 'Burger Republic'
UNION ALL SELECT id, 'Sides', 2 FROM public.restaurants WHERE name = 'Burger Republic'
UNION ALL SELECT id, 'Drinks', 3 FROM public.restaurants WHERE name = 'Burger Republic';

INSERT INTO public.menu_sections (restaurant_id, name, sort_order)
SELECT id, 'Nigiri', 1 FROM public.restaurants WHERE name = 'Sushi Zen'
UNION ALL SELECT id, 'Rolls', 2 FROM public.restaurants WHERE name = 'Sushi Zen'
UNION ALL SELECT id, 'Sashimi', 3 FROM public.restaurants WHERE name = 'Sushi Zen';

INSERT INTO public.menu_sections (restaurant_id, name, sort_order)
SELECT id, 'Pizzas', 1 FROM public.restaurants WHERE name = 'Pizza Paradise'
UNION ALL SELECT id, 'Pasta', 2 FROM public.restaurants WHERE name = 'Pizza Paradise'
UNION ALL SELECT id, 'Appetizers', 3 FROM public.restaurants WHERE name = 'Pizza Paradise';

INSERT INTO public.menu_sections (restaurant_id, name, sort_order)
SELECT id, 'Curries', 1 FROM public.restaurants WHERE name = 'Thai Orchid'
UNION ALL SELECT id, 'Noodles', 2 FROM public.restaurants WHERE name = 'Thai Orchid'
UNION ALL SELECT id, 'Stir Fry', 3 FROM public.restaurants WHERE name = 'Thai Orchid';

INSERT INTO public.menu_sections (restaurant_id, name, sort_order)
SELECT id, 'Appetizers', 1 FROM public.restaurants WHERE name = 'Dragon Wok'
UNION ALL SELECT id, 'Main Dishes', 2 FROM public.restaurants WHERE name = 'Dragon Wok'
UNION ALL SELECT id, 'Rice & Noodles', 3 FROM public.restaurants WHERE name = 'Dragon Wok';

-- Insert menu items for The Spice Garden
INSERT INTO public.menu_items (section_id, restaurant_id, name, description, price, image_url, is_vegetarian, is_available)
SELECT ms.id, r.id, 'Samosa', 'Crispy pastry filled with spiced potatoes and peas', 5.99, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', true, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'The Spice Garden' AND ms.name = 'Starters'
UNION ALL
SELECT ms.id, r.id, 'Paneer Tikka', 'Marinated cottage cheese grilled to perfection', 8.99, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400', true, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'The Spice Garden' AND ms.name = 'Starters'
UNION ALL
SELECT ms.id, r.id, 'Butter Chicken', 'Tender chicken in creamy tomato sauce', 15.99, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'The Spice Garden' AND ms.name = 'Main Course'
UNION ALL
SELECT ms.id, r.id, 'Palak Paneer', 'Cottage cheese in creamy spinach gravy', 13.99, 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?w=400', true, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'The Spice Garden' AND ms.name = 'Main Course'
UNION ALL
SELECT ms.id, r.id, 'Garlic Naan', 'Fluffy bread with garlic butter', 3.99, 'https://images.unsplash.com/photo-1574448857443-dc1d7e9c4dad?w=400', true, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'The Spice Garden' AND ms.name = 'Breads';

-- Insert menu items for Burger Republic
INSERT INTO public.menu_items (section_id, restaurant_id, name, description, price, image_url, is_vegetarian, is_available)
SELECT ms.id, r.id, 'Classic Smash', 'Double smashed patties with American cheese', 12.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Burger Republic' AND ms.name = 'Burgers'
UNION ALL
SELECT ms.id, r.id, 'Veggie Deluxe', 'Plant-based patty with all the fixings', 11.99, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400', true, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Burger Republic' AND ms.name = 'Burgers'
UNION ALL
SELECT ms.id, r.id, 'Bacon BBQ', 'Crispy bacon with smoky BBQ sauce', 14.99, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Burger Republic' AND ms.name = 'Burgers'
UNION ALL
SELECT ms.id, r.id, 'Loaded Fries', 'Crispy fries with cheese and bacon bits', 6.99, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Burger Republic' AND ms.name = 'Sides';

-- Insert menu items for Sushi Zen
INSERT INTO public.menu_items (section_id, restaurant_id, name, description, price, image_url, is_vegetarian, is_available)
SELECT ms.id, r.id, 'Dragon Roll', 'Eel and cucumber topped with avocado', 16.99, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Sushi Zen' AND ms.name = 'Rolls'
UNION ALL
SELECT ms.id, r.id, 'Rainbow Roll', 'California roll with assorted fish', 18.99, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Sushi Zen' AND ms.name = 'Rolls'
UNION ALL
SELECT ms.id, r.id, 'Salmon Nigiri', 'Fresh salmon over pressed rice (2 pcs)', 7.99, 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Sushi Zen' AND ms.name = 'Nigiri'
UNION ALL
SELECT ms.id, r.id, 'Tuna Sashimi', 'Premium sliced tuna (5 pcs)', 14.99, 'https://images.unsplash.com/photo-1534256958597-7fe685cbd745?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Sushi Zen' AND ms.name = 'Sashimi';

-- Insert menu items for Pizza Paradise
INSERT INTO public.menu_items (section_id, restaurant_id, name, description, price, image_url, is_vegetarian, is_available)
SELECT ms.id, r.id, 'Margherita', 'Fresh mozzarella, tomatoes, and basil', 14.99, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', true, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Pizza Paradise' AND ms.name = 'Pizzas'
UNION ALL
SELECT ms.id, r.id, 'Pepperoni Supreme', 'Loaded with pepperoni and extra cheese', 16.99, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Pizza Paradise' AND ms.name = 'Pizzas'
UNION ALL
SELECT ms.id, r.id, 'Spaghetti Carbonara', 'Classic Roman pasta with egg and pancetta', 13.99, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Pizza Paradise' AND ms.name = 'Pasta';

-- Insert menu items for Thai Orchid
INSERT INTO public.menu_items (section_id, restaurant_id, name, description, price, image_url, is_vegetarian, is_available)
SELECT ms.id, r.id, 'Green Curry', 'Aromatic Thai curry with coconut milk', 14.99, 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Thai Orchid' AND ms.name = 'Curries'
UNION ALL
SELECT ms.id, r.id, 'Pad Thai', 'Classic stir-fried rice noodles', 13.99, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Thai Orchid' AND ms.name = 'Noodles'
UNION ALL
SELECT ms.id, r.id, 'Basil Chicken', 'Spicy stir-fried chicken with Thai basil', 12.99, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Thai Orchid' AND ms.name = 'Stir Fry';

-- Insert menu items for Dragon Wok
INSERT INTO public.menu_items (section_id, restaurant_id, name, description, price, image_url, is_vegetarian, is_available)
SELECT ms.id, r.id, 'Spring Rolls', 'Crispy vegetable rolls (4 pcs)', 6.99, 'https://images.unsplash.com/photo-1548506924-a4e1d3c06d65?w=400', true, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Dragon Wok' AND ms.name = 'Appetizers'
UNION ALL
SELECT ms.id, r.id, 'Kung Pao Chicken', 'Spicy diced chicken with peanuts', 14.99, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Dragon Wok' AND ms.name = 'Main Dishes'
UNION ALL
SELECT ms.id, r.id, 'Beef Chow Mein', 'Stir-fried noodles with tender beef', 13.99, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400', false, true
FROM public.menu_sections ms JOIN public.restaurants r ON ms.restaurant_id = r.id WHERE r.name = 'Dragon Wok' AND ms.name = 'Rice & Noodles';