import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/integrations/supabase/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading, hasRole, selectedRole } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if role selection is required (checks user_roles table, not profiles default)
  if (user && !hasRole) {
    return <Navigate to="/select-role" state={{ from: location }} replace />;
  }

  // Check if specific role is required
  if (requiredRole && selectedRole !== requiredRole) {
    // Redirect to appropriate dashboard based on actual role
    if (selectedRole === 'owner') {
      return <Navigate to="/owner/dashboard" replace />;
    } else if (selectedRole === 'user') {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/select-role" replace />;
  }

  return <>{children}</>;
}

// Customer-only route (role is 'user' in database)
export function CustomerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="user">
      {children}
    </ProtectedRoute>
  );
}

// Owner-only route
export function OwnerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="owner">
      {children}
    </ProtectedRoute>
  );
}

// Guest-only route (redirect if already authenticated)
export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, hasRole, selectedRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    // If user is logged in, redirect based on role
    if (!hasRole) {
      return <Navigate to="/select-role" replace />;
    }
    
    if (selectedRole === 'owner') {
      return <Navigate to="/owner/dashboard" replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
