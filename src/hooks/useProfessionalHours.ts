import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProfessionalHour {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string | null;
  end_time: string | null;
  closed: boolean;
}

const WEEKDAYS = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

export function useProfessionalHours(professionalId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['professional-hours', professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_hours')
        .select('*')
        .eq('professional_id', professionalId)
        .order('weekday');
      if (error) throw error;
      return data as ProfessionalHour[];
    },
    enabled: !!professionalId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (hours: { professional_id: string; weekday: number; start_time: string | null; end_time: string | null; closed: boolean }[]) => {
      // Delete existing hours for this professional
      await supabase
        .from('professional_hours')
        .delete()
        .eq('professional_id', professionalId);
      
      // Insert new hours
      const { error } = await supabase
        .from('professional_hours')
        .insert(hours);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-hours', professionalId] });
    },
  });

  return {
    hours: query.data ?? [],
    isLoading: query.isLoading,
    upsert: upsertMutation.mutateAsync,
    isUpdating: upsertMutation.isPending,
    WEEKDAYS,
  };
}
