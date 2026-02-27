import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, eachDayOfInterval, parseISO, startOfDay } from 'date-fns';
import { useCallback } from 'react';

export function useDashboardMetrics(establishmentId: string | undefined) {
  const queryClient = useQueryClient();

  const todayQuery = useQuery({
    queryKey: ['metrics-today', establishmentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('v_dash_today')
        .select('active_today')
        .eq('establishment_id', establishmentId)
        .maybeSingle();
      if (error) throw error;
      return data?.active_today ?? 0;
    },
    enabled: !!establishmentId,
    staleTime: 30000, // 30 seconds
  });

  const weekQuery = useQuery({
    queryKey: ['metrics-week', establishmentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('v_dash_week')
        .select('active_week')
        .eq('establishment_id', establishmentId)
        .maybeSingle();
      if (error) throw error;
      return data?.active_week ?? 0;
    },
    enabled: !!establishmentId,
    staleTime: 30000,
  });

  const canceledQuery = useQuery({
    queryKey: ['metrics-canceled', establishmentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('v_dash_canceled_7d')
        .select('canceled_7d')
        .eq('establishment_id', establishmentId)
        .maybeSingle();
      if (error) throw error;
      return data?.canceled_7d ?? 0;
    },
    enabled: !!establishmentId,
    staleTime: 30000,
  });

  const byProfessionalQuery = useQuery({
    queryKey: ['metrics-by-professional', establishmentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('v_dash_by_professional_30d')
        .select('*')
        .eq('establishment_id', establishmentId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!establishmentId,
    staleTime: 60000, // 1 minute
  });

  const topServicesQuery = useQuery({
    queryKey: ['metrics-top-services', establishmentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('v_dash_top_services_30d')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('total_30d', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!establishmentId,
    staleTime: 60000,
  });

  const totalCustomersQuery = useQuery({
    queryKey: ['metrics-total-customers', establishmentId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('establishment_id', establishmentId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!establishmentId,
    staleTime: 60000,
  });

  const recurringCustomersQuery = useQuery({
    queryKey: ['metrics-recurring-customers', establishmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('customer_id')
        .eq('establishment_id', establishmentId!);
      
      if (error) throw error;
      if (!data) return 0;
      
      const countByCustomer = data.reduce((acc, apt) => {
        acc[apt.customer_id] = (acc[apt.customer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.values(countByCustomer).filter(count => count > 1).length;
    },
    enabled: !!establishmentId,
    staleTime: 60000,
  });

  const appointmentsByDayQuery = useQuery({
    queryKey: ['metrics-appointments-by-day', establishmentId],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 29);
      
      const { data, error } = await supabase
        .from('appointments')
        .select('start_at, status')
        .eq('establishment_id', establishmentId!)
        .gte('start_at', startDate.toISOString())
        .lte('start_at', endDate.toISOString());
      
      if (error) throw error;
      
      // Create a map for all days in the range
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const dayMap = days.reduce((acc, day) => {
        acc[format(day, 'yyyy-MM-dd')] = { date: format(day, 'dd/MM'), count: 0 };
        return acc;
      }, {} as Record<string, { date: string; count: number }>);
      
      // Count appointments by day (only active ones)
      if (data) {
        data.forEach((apt) => {
          if (apt.status !== 'canceled') {
            const dayKey = format(startOfDay(parseISO(apt.start_at)), 'yyyy-MM-dd');
            if (dayMap[dayKey]) {
              dayMap[dayKey].count += 1;
            }
          }
        });
      }
      
      return Object.values(dayMap);
    },
    enabled: !!establishmentId,
    staleTime: 60000,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['metrics-today', establishmentId] });
    queryClient.invalidateQueries({ queryKey: ['metrics-week', establishmentId] });
    queryClient.invalidateQueries({ queryKey: ['metrics-canceled', establishmentId] });
    queryClient.invalidateQueries({ queryKey: ['metrics-by-professional', establishmentId] });
    queryClient.invalidateQueries({ queryKey: ['metrics-top-services', establishmentId] });
    queryClient.invalidateQueries({ queryKey: ['metrics-total-customers', establishmentId] });
    queryClient.invalidateQueries({ queryKey: ['metrics-recurring-customers', establishmentId] });
    queryClient.invalidateQueries({ queryKey: ['metrics-appointments-by-day', establishmentId] });
  }, [queryClient, establishmentId]);

  const hasError = todayQuery.error || weekQuery.error || canceledQuery.error || totalCustomersQuery.error;

  return {
    today: todayQuery.data ?? 0,
    week: weekQuery.data ?? 0,
    canceled: canceledQuery.data ?? 0,
    byProfessional: byProfessionalQuery.data ?? [],
    topServices: topServicesQuery.data ?? [],
    totalCustomers: totalCustomersQuery.data ?? 0,
    recurringCustomers: recurringCustomersQuery.data ?? 0,
    appointmentsByDay: appointmentsByDayQuery.data ?? [],
    isLoading: todayQuery.isLoading || weekQuery.isLoading || canceledQuery.isLoading || totalCustomersQuery.isLoading,
    error: hasError,
    refetch,
  };
}
