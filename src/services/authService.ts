// Authentication Service
// Handles all auth-related operations with Supabase

import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/integrations/supabase/types';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole | null;
  created_at: string | null;
  updated_at: string | null;
}

export const authService = {
  // Sign in with email and password
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign up with email and password
  async signUpWithEmail(email: string, password: string) {
    const redirectUrl = `${window.location.origin}/select-role`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { data, error };
  },

  // Sign in with Google OAuth
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  // Get current user
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  // Get user profile from profiles table
  async getProfile(userId: string): Promise<{ data: Profile | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ data: Profile | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error: error ? new Error(error.message) : null };
  },

  // Set user role (only works if role is not already set in user_roles table)
  async setUserRole(userId: string, role: UserRole): Promise<{ success: boolean; error: Error | null }> {
    // Check if user already explicitly selected a role (via user_roles table)
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleCheckError) {
      return { success: false, error: new Error(roleCheckError.message) };
    }

    // If user already has a role in user_roles and it's different, don't allow change
    if (existingRole && existingRole.role !== role) {
      return {
        success: false,
        error: new Error(`This account is already registered as a ${existingRole.role === 'user' ? 'customer' : 'restaurant owner'}. Please use another Google account.`),
      };
    }

    // If role already set and same, just return success
    if (existingRole && existingRole.role === role) {
      return { success: true, error: null };
    }

    // Insert into user_roles table (this is the source of truth for role selection)
    const { error: rolesError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });

    if (rolesError) {
      return { success: false, error: new Error(rolesError.message) };
    }

    // Also update profiles table for convenience
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (profileUpdateError) {
      console.warn('Could not update profiles table:', profileUpdateError.message);
    }

    return { success: true, error: null };
  },

  // Check if user has EXPLICITLY selected a role (checks user_roles table, not default)
  async hasSelectedRole(userId: string): Promise<{ hasRole: boolean; role: UserRole | null; error: Error | null }> {
    try {
      // Check user_roles table - this is only populated when user explicitly selects
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking user_roles:', error);
        return { hasRole: false, role: null, error: new Error(error.message) };
      }

      // If no entry in user_roles, user hasn't selected a role yet
      if (!data) {
        console.log('No role found in user_roles for user:', userId);
        return { hasRole: false, role: null, error: null };
      }

      console.log('Found role in user_roles:', data.role);
      return { hasRole: true, role: data.role as UserRole, error: null };
    } catch (err) {
      console.error('Unexpected error in hasSelectedRole:', err);
      return { hasRole: false, role: null, error: err instanceof Error ? err : new Error('Unknown error') };
    }
  },

  // Get the user's selected role from user_roles table
  async getUserRole(userId: string): Promise<{ role: UserRole | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      return { role: null, error: new Error(error.message) };
    }

    return { role: data?.role as UserRole || null, error: null };
  },

  // Validate role access
  async validateRoleAccess(userId: string, requiredRole: UserRole): Promise<{ allowed: boolean; error: Error | null }> {
    const { data, error } = await this.getProfile(userId);
    
    if (error) {
      return { allowed: false, error };
    }

    if (!data?.role) {
      return { allowed: false, error: new Error('No role selected') };
    }

    if (data.role !== requiredRole) {
      return {
        allowed: false,
        error: new Error(`Access denied. This area is only for ${requiredRole}s.`),
      };
    }

    return { allowed: true, error: null };
  },
};
