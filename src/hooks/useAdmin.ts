import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AdminStats {
  total_establishments: number;
  total_clients: number;
  total_subscriptions_active: number;
  subscriptions_by_plan: Record<string, number> | null;
  appointments_this_month: number;
  new_contact_messages: number;
  recent_establishments: Array<{
    id: string;
    name: string;
    slug: string;
    created_at: string;
    owner_email: string;
  }>;
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  booking_enabled: boolean;
  owner_user_id: string;
  owner_email: string;
  subscription: {
    plan_code: string;
    status: string;
    current_period_end: string;
  } | null;
  professionals_count: number;
  appointments_this_month: number;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export function useAdminAccess() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-access", user?.id],
    queryFn: async () => {
      if (!user) return { isAdmin: false };

      const { data, error } = await (supabase.rpc as any)("is_admin", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("Error checking admin access:", error);
        return { isAdmin: false };
      }

      return { isAdmin: data as boolean };
    },
    enabled: !!user,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_admin_dashboard_stats");

      if (error) {
        console.error("Error fetching admin stats:", error);
        throw error;
      }

      return data as unknown as AdminStats;
    },
  });
}

export function useAdminEstablishments(search?: string) {
  return useQuery({
    queryKey: ["admin-establishments", search],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_list_establishments", {
        p_search: search || null,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) {
        console.error("Error fetching establishments:", error);
        throw error;
      }

      return data as unknown as { establishments: Establishment[]; total: number };
    },
  });
}

export function useAdminContactMessages(status?: string) {
  return useQuery({
    queryKey: ["admin-contact-messages", status],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_list_contact_messages", {
        p_status: status || null,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) {
        console.error("Error fetching contact messages:", error);
        throw error;
      }

      return data as unknown as { messages: ContactMessage[]; total: number };
    },
  });
}

export function useUpdateEstablishmentPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      establishmentId,
      newPlanCode,
    }: {
      establishmentId: string;
      newPlanCode: string;
    }) => {
      // Use Edge Function instead of RPC to bypass RLS
      const { data, error } = await supabase.functions.invoke('admin-set-plan', {
        body: {
          establishment_id: establishmentId,
          plan_code: newPlanCode,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao atualizar plano');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-establishments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useToggleEstablishment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      establishmentId,
      active,
    }: {
      establishmentId: string;
      active: boolean;
    }) => {
      const { data, error } = await (supabase.rpc as any)("admin_toggle_establishment", {
        p_establishment_id: establishmentId,
        p_active: active,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-establishments"] });
    },
  });
}

export function useUpdateContactMessageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      status,
      reply,
    }: {
      messageId: string;
      status: string;
      reply?: string;
    }) => {
      // Use Edge Function instead of direct update to bypass RLS and send email
      const { data, error } = await supabase.functions.invoke('admin-reply-contact', {
        body: {
          message_id: messageId,
          status: status as 'replied' | 'closed',
          reply_text: reply,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao atualizar mensagem');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useAddAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      // Use Edge Function to add admin with service role
      const { data, error } = await supabase.functions.invoke('admin-add-user', {
        body: { email },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao adicionar administrador');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
