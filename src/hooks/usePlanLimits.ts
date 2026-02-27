import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPlanLimits } from '@/lib/hardcodedPlans';
import { useAuth } from './useAuth';

export interface PlanLimitsData {
  planCode: string;
  isTrial: boolean;
  maxProfessionals: number | null; // null = unlimited
  currentProfessionals: number;
  canAddProfessional: boolean;
  professionalsRemaining: number | null; // null = unlimited
}

export function usePlanLimits(establishmentId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plan-limits', establishmentId, user?.id],
    queryFn: async (): Promise<PlanLimitsData | null> => {
      if (!establishmentId || !user?.id) return null;

      // 1. Get establishment status
      const { data: est } = await supabase
        .from('establishments')
        .select('status, trial_ends_at, owner_user_id')
        .eq('id', establishmentId)
        .single();

      if (!est) return null;

      const isTrial = est.status === 'trial' && est.trial_ends_at && new Date(est.trial_ends_at) > new Date();

      // 2. Get subscription plan_code (if any)
      let planCode = 'basico';
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_code, status')
        .eq('owner_user_id', est.owner_user_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (sub && sub.length > 0) {
        planCode = sub[0].plan_code;
      }

      // 3. Get limits from hardcoded plans
      const limits = getPlanLimits(planCode, !!isTrial);

      // 4. Count current professionals
      const { count: profCount } = await supabase
        .from('professionals')
        .select('id', { count: 'exact', head: true })
        .eq('establishment_id', establishmentId);

      const currentProfessionals = profCount ?? 0;

      const canAddProfessional = limits.maxProfessionals === null || currentProfessionals < limits.maxProfessionals;

      return {
        planCode: isTrial ? 'trial' : planCode,
        isTrial: !!isTrial,
        maxProfessionals: limits.maxProfessionals,
        currentProfessionals,
        canAddProfessional,
        professionalsRemaining: limits.maxProfessionals !== null
          ? Math.max(0, limits.maxProfessionals - currentProfessionals)
          : null,
      };
    },
    enabled: !!establishmentId && !!user?.id,
    staleTime: 30000,
  });
}

/**
 * Lightweight check for public booking pages (no auth required).
 * Only checks if establishment is blocked (trial expired / past_due).
 * Appointments are always unlimited — no count check needed.
 */
export function usePublicPlanLimits(establishmentId: string | undefined) {
  return useQuery({
    queryKey: ['public-plan-limits', establishmentId],
    queryFn: async () => {
      if (!establishmentId) return { canAccept: true };

      const { data: est } = await supabase
        .from('establishments')
        .select('status, trial_ends_at')
        .eq('id', establishmentId)
        .single();

      if (!est) return { canAccept: false, reason: 'Estabelecimento não encontrado.' };

      if (est.status === 'past_due' || est.status === 'canceled') {
        return { canAccept: false, reason: 'Estabelecimento temporariamente indisponível para novos agendamentos online.' };
      }
      if (est.status === 'trial' && est.trial_ends_at && new Date() > new Date(est.trial_ends_at)) {
        return { canAccept: false, reason: 'Estabelecimento temporariamente indisponível para novos agendamentos online.' };
      }

      return { canAccept: true };
    },
    enabled: !!establishmentId,
    staleTime: 10000,
  });
}
