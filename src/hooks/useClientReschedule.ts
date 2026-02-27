import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sendRescheduleEmail } from '@/lib/emailNotifications';

interface RescheduleResult {
  success: boolean;
  appointment?: {
    id: string;
    start_at: string;
    end_at: string;
    status: string;
    establishment_id: string;
    professional_id: string;
    customer_id: string;
  };
  message?: string;
  error?: string;
}

export function useClientReschedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      newStartAt,
      newEndAt,
      newProfessionalId,
    }: {
      appointmentId: string;
      newStartAt: string;
      newEndAt: string;
      newProfessionalId?: string;
    }): Promise<RescheduleResult> => {
      const { data, error } = await supabase.rpc('client_reschedule_appointment', {
        p_appointment_id: appointmentId,
        p_new_start_at: newStartAt,
        p_new_end_at: newEndAt,
        p_new_professional_id: newProfessionalId ?? null,
      });

      if (error) {
        const errorMessage = error.message.replace(/^.*EXCEPTION:\s*/, '').trim();
        throw new Error(errorMessage || 'Erro ao reagendar');
      }

      const result = data as unknown as RescheduleResult;

      // Send reschedule email (fire and forget)
      if (result.success && result.appointment?.id) {
        sendRescheduleEmail(result.appointment.id).catch((emailErr) => {
          console.warn('Failed to send reschedule email:', emailErr);
        });
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate all appointment-related queries
      queryClient.invalidateQueries({ queryKey: ['client-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['client-appointments-month'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}
