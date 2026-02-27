import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Admin Access Check ───
export function useAdminAccess() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-access", user?.id],
    queryFn: async () => {
      if (!user) return { isAdmin: false };
      try {
        // Check admin_users table directly
        const { data, error } = await supabase
          .from("admin_users")
          .select("id")
          .limit(1);

        // If we can query admin_users and get results, user has access
        // (RLS should handle this, but as fallback check via edge function)
        if (error) {
          // Fallback: call edge function
          const { data: efData, error: efError } = await supabase.functions.invoke('admin-data', {
            body: { action: 'check_access' },
          });
          if (efError) return { isAdmin: false };
          return { isAdmin: true };
        }

        return { isAdmin: (data?.length ?? 0) > 0 };
      } catch {
        return { isAdmin: false };
      }
    },
    enabled: !!user,
    staleTime: 60000,
  });
}

// ─── Admin Stats ───
export interface AdminStats {
  total_establishments: number;
  total_customers: number;
  active_subscriptions: number;
  by_status: Record<string, number>;
  trial_active: number;
  trial_expired: number;
  recent_establishments: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    created_at: string;
    trial_ends_at: string | null;
    owner_email: string;
  }>;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { action: 'stats' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as AdminStats;
    },
    staleTime: 30000,
  });
}

// ─── Admin Establishments List ───
export interface AdminEstablishment {
  id: string;
  name: string;
  slug: string;
  status: string;
  plano: string | null;
  created_at: string;
  trial_ends_at: string | null;
  booking_enabled: boolean;
  owner_user_id: string;
  owner_email: string;
  subscription: { plan_code: string; status: string } | null;
  professionals_count: number;
}

export function useAdminEstablishments(search?: string) {
  return useQuery({
    queryKey: ["admin-establishments", search],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { action: 'list_establishments', search: search || '' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { establishments: AdminEstablishment[]; total: number };
    },
    staleTime: 15000,
  });
}

// ─── Update Establishment (plan, status, trial) ───
export function useUpdateEstablishment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      establishment_id: string;
      status?: string;
      plano?: string;
      trial_ends_at?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { action: 'update_establishment', ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-establishments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

// ─── Legacy exports for backward compatibility ───
export function useUpdateEstablishmentPlan() {
  const updateEst = useUpdateEstablishment();
  return {
    ...updateEst,
    mutateAsync: async ({ establishmentId, newPlanCode }: { establishmentId: string; newPlanCode: string }) => {
      return updateEst.mutateAsync({ establishment_id: establishmentId, plano: newPlanCode, status: 'active' });
    },
  };
}

export function useToggleEstablishment() {
  const updateEst = useUpdateEstablishment();
  return {
    ...updateEst,
    mutateAsync: async ({ establishmentId, active }: { establishmentId: string; active: boolean }) => {
      return updateEst.mutateAsync({
        establishment_id: establishmentId,
        status: active ? 'active' : 'canceled',
      });
    },
  };
}

export function useAdminContactMessages(status?: string) {
  return useQuery({
    queryKey: ["admin-contact-messages", status],
    queryFn: async () => ({ messages: [], total: 0 }),
    enabled: false,
  });
}

export function useUpdateContactMessageStatus() {
  return useMutation({ mutationFn: async () => {} });
}

export function useAddAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.functions.invoke("admin-add-user", {
        body: { email },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
