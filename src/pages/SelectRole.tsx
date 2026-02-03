import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Store, User, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { UserRole } from '@/integrations/supabase/types';

export default function SelectRole() {
  const navigate = useNavigate();
  const { user, loading, hasRole, selectedRole: userRole, setUserRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if already has role (from user_roles table, not default)
  if (hasRole && userRole) {
    const redirectPath = userRole === 'owner' ? '/owner/dashboard' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setIsSubmitting(true);
    
    const { success, error } = await setUserRole(selectedRole);
    
    if (error) {
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }

    if (success) {
      toast.success(`Welcome! You're now registered as a ${selectedRole === 'user' ? 'customer' : 'restaurant owner'}.`);
      
      // Redirect based on role
      if (selectedRole === 'owner') {
        navigate('/owner/onboarding', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
    
    setIsSubmitting(false);
  };

  const roles = [
    {
      id: 'user' as UserRole,
      title: 'Customer',
      description: 'Order delicious food from your favorite restaurants',
      icon: User,
      features: [
        'Browse restaurants',
        'Order food online',
        'Track deliveries',
        'Save favorite restaurants',
      ],
    },
    {
      id: 'owner' as UserRole,
      title: 'Restaurant Owner',
      description: 'Manage your restaurant and receive orders',
      icon: Store,
      features: [
        'Register your restaurant',
        'Manage menu items',
        'Handle orders',
        'View analytics',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-display font-bold text-3xl">F</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Choose Your Role</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Select how you want to use the platform. This choice is permanent for this account.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`
                  relative p-6 rounded-2xl border-2 text-left transition-all
                  ${isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }
                `}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                )}

                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center mb-4
                  ${isSelected ? 'bg-primary' : 'bg-secondary'}
                `}>
                  <Icon className={`w-7 h-7 ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`} />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold mb-2">{role.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{role.description}</p>

                {/* Features */}
                <ul className="space-y-2">
                  {role.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary' : 'bg-muted-foreground'}`} />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!selectedRole || isSubmitting}
            className="min-w-[200px] gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Note: You cannot change your role after selection. To use the platform with a different role, please use another Google account.
        </p>
      </div>
    </div>
  );
}
