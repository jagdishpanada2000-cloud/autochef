import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/services/authService';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/auth?error=callback_failed', { replace: true });
          return;
        }

        if (session?.user) {
          // Check if user has EXPLICITLY selected a role (from user_roles table)
          const { hasRole, role } = await authService.hasSelectedRole(session.user.id);

          if (hasRole && role) {
            // User has explicitly selected a role, redirect to appropriate dashboard
            if (role === 'owner') {
              navigate('/owner/dashboard', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          } else {
            // User needs to select a role
            navigate('/select-role', { replace: true });
          }
        } else {
          navigate('/auth', { replace: true });
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        navigate('/auth?error=unexpected', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
