// Restaurant Service
// Handles all restaurant-related operations

import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Restaurant = Tables<'restaurants'>;
export type MenuSection = Tables<'menu_sections'>;
export type MenuItem = Tables<'menu_items'>;

export const restaurantService = {
  // ==================== RESTAURANT OPERATIONS ====================

  // Get all restaurants (for customers)
  async getAllRestaurants(): Promise<{ data: Restaurant[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('name', { ascending: true });
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Get restaurant by ID
  async getRestaurantById(id: string): Promise<{ data: Restaurant | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Get restaurant by unique_key
  async getRestaurantByKey(uniqueKey: string): Promise<{ data: Restaurant | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('unique_key', uniqueKey)
      .single();
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Get restaurants owned by user (should be one for now since owner_id is UNIQUE)
  async getOwnerRestaurant(ownerId: string): Promise<{ data: Restaurant | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', ownerId)
      .single();
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Create restaurant
  async createRestaurant(restaurant: TablesInsert<'restaurants'>): Promise<{ data: Restaurant | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('restaurants')
      .insert(restaurant)
      .select()
      .single();
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Update restaurant
  async updateRestaurant(id: string, updates: TablesUpdate<'restaurants'>): Promise<{ data: Restaurant | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Delete restaurant
  async deleteRestaurant(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id);
    
    return { error: error ? new Error(error.message) : null };
  },

  // ==================== MENU SECTION OPERATIONS ====================

  // Get menu sections for restaurant
  async getMenuSections(restaurantId: string): Promise<{ data: MenuSection[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('menu_sections')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('position', { ascending: true });
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Create menu section
  async createMenuSection(section: TablesInsert<'menu_sections'>): Promise<{ data: MenuSection | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('menu_sections')
      .insert(section)
      .select()
      .single();
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Update menu section
  async updateMenuSection(id: string, updates: TablesUpdate<'menu_sections'>): Promise<{ data: MenuSection | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('menu_sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Delete menu section
  async deleteMenuSection(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('menu_sections')
      .delete()
      .eq('id', id);
    
    return { error: error ? new Error(error.message) : null };
  },

  // ==================== MENU ITEM OPERATIONS ====================

  // Get all menu items for owner (via their sections)
  async getMenuItemsByOwner(ownerId: string): Promise<{ data: MenuItem[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('owner_id', ownerId)
      .order('position', { ascending: true });
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Get menu items by section
  async getMenuItemsBySection(sectionId: string): Promise<{ data: MenuItem[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('section_id', sectionId)
      .order('position', { ascending: true });
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Get available menu items by section (for customers)
  async getAvailableMenuItemsBySection(sectionId: string): Promise<{ data: MenuItem[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('section_id', sectionId)
      .eq('is_available', true)
      .order('position', { ascending: true });
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Get menu items for a restaurant (via sections)
  async getMenuItemsForRestaurant(restaurantId: string): Promise<{ data: MenuItem[] | null; error: Error | null }> {
    // First get sections for the restaurant
    const { data: sections, error: sectionsError } = await supabase
      .from('menu_sections')
      .select('id')
      .eq('restaurant_id', restaurantId);
    
    if (sectionsError) {
      return { data: null, error: new Error(sectionsError.message) };
    }

    if (!sections || sections.length === 0) {
      return { data: [], error: null };
    }

    const sectionIds = sections.map(s => s.id);
    
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .in('section_id', sectionIds)
      .eq('is_available', true)
      .order('position', { ascending: true });
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Create menu item
  async createMenuItem(item: TablesInsert<'menu_items'>): Promise<{ data: MenuItem | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('menu_items')
      .insert(item)
      .select()
      .single();
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Update menu item
  async updateMenuItem(id: string, updates: TablesUpdate<'menu_items'>): Promise<{ data: MenuItem | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Delete menu item
  async deleteMenuItem(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    
    return { error: error ? new Error(error.message) : null };
  },

  // Toggle menu item availability
  async toggleMenuItemAvailability(id: string, isAvailable: boolean): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: isAvailable })
      .eq('id', id);
    
    return { error: error ? new Error(error.message) : null };
  },

  // ==================== SEARCH & FILTER ====================

  // Search restaurants by name or description
  async searchRestaurants(query: string): Promise<{ data: Restaurant[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name', { ascending: true });
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Get full menu with sections and items for a restaurant
  async getFullMenu(restaurantId: string): Promise<{
    data: { sections: MenuSection[]; items: MenuItem[] } | null;
    error: Error | null;
  }> {
    const [sectionsResult, itemsResult] = await Promise.all([
      this.getMenuSections(restaurantId),
      this.getMenuItemsForRestaurant(restaurantId),
    ]);

    if (sectionsResult.error) {
      return { data: null, error: sectionsResult.error };
    }
    if (itemsResult.error) {
      return { data: null, error: itemsResult.error };
    }

    return {
      data: {
        sections: sectionsResult.data || [],
        items: itemsResult.data || [],
      },
      error: null,
    };
  },
};
