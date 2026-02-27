import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPlanLimits } from '@/lib/hardcodedPlans';
import { useAuth } from './useAuth';

export interface PlanLimitsData {
  planCode: string;
  isTrial: boolean;
  maxProfessionals: number;
  maxAppointmentsMonth: number | null;
  currentProfessionals: number;
  currentAppointmentsMonth: number;
  canAddProfessional: boolean;
  canAddAppointment: boolean;
  professionalsRemaining: number;
  appointmentsRemaining: number | null; // null = unlimited
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

      // 5. Count current month appointments
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { count: aptCount } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('establishment_id', establishmentId)
        .gte('start_at', monthStart)
        .lte('start_at', monthEnd)
        .not('status', 'in', '("canceled","canceled_by_customer","canceled_by_establishment")');

      const currentProfessionals = profCount ?? 0;
      const currentAppointmentsMonth = aptCount ?? 0;

      const canAddProfessional = currentProfessionals < limits.maxProfessionals;
      const canAddAppointment = limits.maxAppointmentsMonth === null || currentAppointmentsMonth < limits.maxAppointmentsMonth;

      return {
        planCode: isTrial ? 'trial' : planCode,
        isTrial: !!isTrial,
        maxProfessionals: limits.maxProfessionals,
        maxAppointmentsMonth: limits.maxAppointmentsMonth,
        currentProfessionals,
        currentAppointmentsMonth,
        canAddProfessional,
        canAddAppointment,
        professionalsRemaining: Math.max(0, limits.maxProfessionals - currentProfessionals),
        appointmentsRemaining: limits.maxAppointmentsMonth !== null
          ? Math.max(0, limits.maxAppointmentsMonth - currentAppointmentsMonth)
          : null,
      };
    },
    enabled: !!establishmentId && !!user?.id,
    staleTime: 30000,
  });
}

/**
 * Lightweight check for public booking pages (no auth required).
 * Checks if an establishment can accept new appointments based on plan limits.
 */
export function usePublicPlanLimits(establishmentId: string | undefined) {
  return useQuery({
    queryKey: ['public-plan-limits', establishmentId],
    queryFn: async () => {
      if (!establishmentId) return { canAccept: true };

      // Get establishment
      const { data: est } = await supabase
        .from('establishments')
        .select('status, trial_ends_at, owner_user_id')
        .eq('id', establishmentId)
        .single();

      if (!est) return { canAccept: false, reason: 'Estabelecimento não encontrado.' };

      // Check blocked status
      if (est.status === 'past_due' || est.status === 'canceled') {
        return { canAccept: false, reason: 'Estabelecimento temporariamente indisponível para novos agendamentos online.' };
      }
      if (est.status === 'trial' && est.trial_ends_at && new Date() > new Date(est.trial_ends_at)) {
        return { canAccept: false, reason: 'Estabelecimento temporariamente indisponível para novos agendamentos online.' };
      }

      const isTrial = est.status === 'trial' && est.trial_ends_at && new Date(est.trial_ends_at) > new Date();

      // Get subscription
      let planCode = 'basico';
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_code')
        .eq('owner_user_id', est.owner_user_id)
        .eq('status', 'active')
        .limit(1);

      if (sub && sub.length > 0) planCode = sub[0].plan_code;

      const limits = getPlanLimits(planCode, !!isTrial);

      if (limits.maxAppointmentsMonth === null) return { canAccept: true };

      // Count this month's appointments
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { count } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('establishment_id', establishmentId)
        .gte('start_at', monthStart)
        .lte('start_at', monthEnd)
        .not('status', 'in', '("canceled","canceled_by_customer","canceled_by_establishment")');

      const current = count ?? 0;
      if (current >= limits.maxAppointmentsMonth) {
        return { canAccept: false, reason: 'Estabelecimento não pode receber novos agendamentos online no momento.' };
      }

      return { canAccept: true };
    },
    enabled: !!establishmentId,
    staleTime: 10000,
  });
}
