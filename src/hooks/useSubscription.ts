import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Subscription {
  id: string;
  owner_user_id: string;
  plan_code: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  provider: string | null;
  provider_subscription_id: string | null;
  provider_order_id: string | null;
  buyer_email: string | null;
}

export interface SubscriptionWithPlan extends Subscription {
  plan: {
    code: string;
    name: string;
    price_cents: number;
    max_professionals: number;
    max_appointments_month: number | null;
    max_establishments: number | null;
    max_professionals_per_establishment: number | null;
    allow_multi_establishments: boolean;
    features: string[];
  };
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionWithPlan | null> => {
      if (!user?.id) return null;

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('owner_user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No subscription found - return null (user is on basic)
          return null;
        }
        console.error('Error fetching subscription:', error);
        throw error;
      }

      // Get plan details
      const { data: plan, error: planError } = await (supabase as any)
        .from('plans')
        .select('*')
        .eq('code', subscription.plan_code)
        .single();

      if (planError) {
        console.error('Error fetching plan:', planError);
        throw planError;
      }

      return {
        ...subscription,
        plan: {
          code: plan.code,
          name: plan.name,
          price_cents: plan.price_cents,
          max_professionals: plan.max_professionals,
          max_appointments_month: plan.max_appointments_month,
          max_establishments: (plan as Record<string, unknown>).max_establishments as number | null,
          max_professionals_per_establishment: (plan as Record<string, unknown>).max_professionals_per_establishment as number | null,
          allow_multi_establishments: plan.allow_multi_establishments,
          features: plan.features as string[],
        },
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}

// Hook to check if establishment can accept bookings (for public booking page)
export function useCanEstablishmentAcceptBookings(establishmentId: string | undefined) {
  return useQuery({
    queryKey: ['can-accept-bookings', establishmentId],
    queryFn: async () => {
      if (!establishmentId) return { can_accept: false, reason: 'No establishment' } as { can_accept: boolean; reason?: string; error_code?: string };

      const { data, error } = await (supabase.rpc as any)('can_establishment_accept_bookings', {
        p_establishment_id: establishmentId,
      });

      if (error) {
        console.error('Error checking can_establishment_accept_bookings:', error);
        return { can_accept: false, reason: error.message } as { can_accept: boolean; reason?: string; error_code?: string };
      }

      return data as { can_accept: boolean; reason?: string; error_code?: string };
    },
    enabled: !!establishmentId,
    staleTime: 10000, // 10 seconds
  });
}

// Helper to get plan display info
export function getPlanDisplayInfo(planCode: string | undefined) {
  switch (planCode) {
    case 'studio':
      return { name: 'Studio', color: 'text-primary', bgColor: 'bg-primary/10' };
    case 'essential':
      return { name: 'Essencial', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    case 'basic':
    default:
      return { name: 'Básico', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  }
}
