import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { authService, Profile } from '@/services/authService';
import type { UserRole } from '@/integrations/supabase/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setUserRole: (role: UserRole) => Promise<{ success: boolean; error: Error | null }>;
  refreshProfile: () => Promise<void>;
  hasRole: boolean;
  selectedRole: UserRole | null;
  isCustomer: boolean;
  isOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await authService.getProfile(userId);
      if (profileData) {
        setProfile(profileData);
      }

      // Check if user has EXPLICITLY selected a role (from user_roles table)
      const { hasRole, role, error } = await authService.hasSelectedRole(userId);
      if (error) {
        console.error('Error checking role:', error);
      }
      setSelectedRole(hasRole ? role : null);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  }, [user?.id, fetchUserData]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setSelectedRole(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    const { error } = await authService.signInWithEmail(email, password);
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await authService.signUpWithEmail(email, password);
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async () => {
    const { error } = await authService.signInWithGoogle();
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await authService.signOut();
    setProfile(null);
    setSelectedRole(null);
  };

  const setUserRoleHandler = async (role: UserRole) => {
    if (!user?.id) {
      return { success: false, error: new Error('Not authenticated') };
    }
    
    const result = await authService.setUserRole(user.id, role);
    
    if (result.success) {
      // Update local state immediately
      setSelectedRole(role);
      await refreshProfile();
    }
    
    return result;
  };

  // hasRole is TRUE only if user has EXPLICITLY selected a role in user_roles table
  const hasRole = selectedRole !== null;
  const isCustomer = selectedRole === 'user';
  const isOwner = selectedRole === 'owner';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      setUserRole: setUserRoleHandler,
      refreshProfile,
      hasRole,
      selectedRole,
      isCustomer,
      isOwner,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
