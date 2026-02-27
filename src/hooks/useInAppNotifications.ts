import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserEstablishment } from './useUserEstablishment';

export interface InAppNotification {
  id: string;
  type: 'new_rating' | 'new_appointment' | 'cancelled_appointment';
  title: string;
  message: string;
  data: {
    ratingId?: string;
    appointmentId?: string;
    stars?: number;
    customerName?: string;
    serviceName?: string;
  };
  read: boolean;
  created_at: string;
}

// Local storage key for notifications
const NOTIFICATIONS_KEY = 'agendali_notifications';
const READ_NOTIFICATIONS_KEY = 'agendali_read_notifications';

export function useInAppNotifications() {
  const { data: establishment } = useUserEstablishment();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const queryClient = useQueryClient();

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    const readIds = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]');
    
    if (stored) {
      const parsed = JSON.parse(stored) as InAppNotification[];
      // Mark read notifications
      const withReadStatus = parsed.map(n => ({
        ...n,
        read: readIds.includes(n.id)
      }));
      setNotifications(withReadStatus);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  // Subscribe to new ratings via Realtime
  useEffect(() => {
    if (!establishment?.id) return;

    const channel = supabase
      .channel('ratings-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ratings',
          filter: `establishment_id=eq.${establishment.id}`,
        },
        async (payload) => {
          const rating = payload.new as {
            id: string;
            stars: number;
            comment: string | null;
            customer_id: string;
            appointment_id: string;
            created_at: string;
          };

          // Fetch customer and appointment details
          const { data: appointmentData } = await supabase
            .from('appointments')
            .select(`
              id,
              customer:customers!appointments_customer_id_fkey(name),
              service:services!appointments_service_id_fkey(name)
            `)
            .eq('id', rating.appointment_id)
            .single();

          const customerName = (appointmentData?.customer as any)?.name || 'Cliente';
          const serviceName = (appointmentData?.service as any)?.name || 'Serviço';

          const newNotification: InAppNotification = {
            id: `rating-${rating.id}`,
            type: 'new_rating',
            title: 'Nova Avaliação',
            message: `${customerName} avaliou ${serviceName} com ${rating.stars} estrela${rating.stars !== 1 ? 's' : ''}`,
            data: {
              ratingId: rating.id,
              appointmentId: rating.appointment_id,
              stars: rating.stars,
              customerName,
              serviceName,
            },
            read: false,
            created_at: rating.created_at,
          };

          setNotifications(prev => {
            // Avoid duplicates
            if (prev.some(n => n.id === newNotification.id)) {
              return prev;
            }
            // Keep last 50 notifications
            const updated = [newNotification, ...prev].slice(0, 50);
            return updated;
          });

          // Invalidate ratings queries to refresh dashboard
          queryClient.invalidateQueries({ queryKey: ['establishment-rating'] });
          queryClient.invalidateQueries({ queryKey: ['establishment-ratings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishment?.id, queryClient]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    
    // Update read IDs in localStorage
    const readIds = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]');
    if (!readIds.includes(notificationId)) {
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...readIds, notificationId]));
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    const allIds = notifications.map(n => n.id);
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(allIds));
  }, [notifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(NOTIFICATIONS_KEY);
    localStorage.removeItem(READ_NOTIFICATIONS_KEY);
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
  };
}
