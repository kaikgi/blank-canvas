export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      appointments: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          customer_id: string
          customer_notes: string | null
          customer_user_id: string | null
          end_at: string
          establishment_id: string
          id: string
          internal_notes: string | null
          professional_id: string
          service_id: string
          start_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          customer_user_id?: string | null
          end_at: string
          establishment_id: string
          id?: string
          internal_notes?: string | null
          professional_id: string
          service_id: string
          start_at: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          customer_user_id?: string | null
          end_at?: string
          establishment_id?: string
          id?: string
          internal_notes?: string | null
          professional_id?: string
          service_id?: string
          start_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          close_time: string | null
          closed: boolean
          establishment_id: string
          id: string
          open_time: string | null
          weekday: number
        }
        Insert: {
          close_time?: string | null
          closed?: boolean
          establishment_id: string
          id?: string
          open_time?: string | null
          weekday: number
        }
        Update: {
          close_time?: string | null
          closed?: boolean
          establishment_id?: string
          id?: string
          open_time?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          establishment_id: string
          id: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          establishment_id: string
          id?: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string | null
          establishment_id?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_members: {
        Row: {
          created_at: string
          establishment_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          establishment_id: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          establishment_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_members_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          address: string | null
          ask_email: boolean
          ask_notes: boolean
          auto_confirm_bookings: boolean
          booking_enabled: boolean
          buffer_minutes: number
          cancellation_policy_text: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          max_future_days: number
          name: string
          owner_user_id: string
          phone: string | null
          plano: string | null
          reminder_hours_before: number
          require_policy_acceptance: boolean
          reschedule_min_hours: number
          slot_interval_minutes: number
          slug: string
          state: string | null
          status: string
          timezone: string
          trial_ends_at: string | null
        }
        Insert: {
          address?: string | null
          ask_email?: boolean
          ask_notes?: boolean
          auto_confirm_bookings?: boolean
          booking_enabled?: boolean
          buffer_minutes?: number
          cancellation_policy_text?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          max_future_days?: number
          name: string
          owner_user_id?: string
          phone?: string | null
          plano?: string | null
          reminder_hours_before?: number
          require_policy_acceptance?: boolean
          reschedule_min_hours?: number
          slot_interval_minutes?: number
          slug: string
          state?: string | null
          status?: string
          timezone?: string
          trial_ends_at?: string | null
        }
        Update: {
          address?: string | null
          ask_email?: boolean
          ask_notes?: boolean
          auto_confirm_bookings?: boolean
          booking_enabled?: boolean
          buffer_minutes?: number
          cancellation_policy_text?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          max_future_days?: number
          name?: string
          owner_user_id?: string
          phone?: string | null
          plano?: string | null
          reminder_hours_before?: number
          require_policy_acceptance?: boolean
          reschedule_min_hours?: number
          slot_interval_minutes?: number
          slug?: string
          state?: string | null
          status?: string
          timezone?: string
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      professional_hours: {
        Row: {
          closed: boolean
          end_time: string | null
          id: string
          professional_id: string
          start_time: string | null
          weekday: number
        }
        Insert: {
          closed?: boolean
          end_time?: string | null
          id?: string
          professional_id: string
          start_time?: string | null
          weekday: number
        }
        Update: {
          closed?: boolean
          end_time?: string | null
          id?: string
          professional_id?: string
          start_time?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_hours_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          professional_id: string
          service_id: string
        }
        Insert: {
          professional_id: string
          service_id: string
        }
        Update: {
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean
          capacity: number
          created_at: string
          establishment_id: string
          id: string
          name: string
          photo_url: string | null
          portal_enabled: boolean | null
          portal_last_login_at: string | null
          portal_password_hash: string | null
          slug: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean
          capacity?: number
          created_at?: string
          establishment_id: string
          id?: string
          name: string
          photo_url?: string | null
          portal_enabled?: boolean | null
          portal_last_login_at?: string | null
          portal_password_hash?: string | null
          slug?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean
          capacity?: number
          created_at?: string
          establishment_id?: string
          id?: string
          name?: string
          photo_url?: string | null
          portal_enabled?: boolean | null
          portal_last_login_at?: string | null
          portal_password_hash?: string | null
          slug?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          appointment_id: string
          comment: string | null
          created_at: string
          customer_id: string
          customer_user_id: string | null
          establishment_id: string
          id: string
          stars: number
        }
        Insert: {
          appointment_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          customer_user_id?: string | null
          establishment_id: string
          id?: string
          stars: number
        }
        Update: {
          appointment_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          customer_user_id?: string | null
          establishment_id?: string
          id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_time_blocks: {
        Row: {
          active: boolean
          created_at: string
          end_time: string
          establishment_id: string
          id: string
          professional_id: string | null
          reason: string | null
          start_time: string
          weekday: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_time: string
          establishment_id: string
          id?: string
          professional_id?: string | null
          reason?: string | null
          start_time: string
          weekday: number
        }
        Update: {
          active?: boolean
          created_at?: string
          end_time?: string
          establishment_id?: string
          id?: string
          professional_id?: string | null
          reason?: string | null
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_time_blocks_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_time_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration_minutes: number
          establishment_id: string
          id: string
          name: string
          price_cents: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_minutes: number
          establishment_id: string
          id?: string
          name: string
          price_cents?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_minutes?: number
          establishment_id?: string
          id?: string
          name?: string
          price_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          buyer_email: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          external_id: string | null
          external_provider: string | null
          id: string
          owner_user_id: string
          plan_code: string
          provider: string | null
          provider_customer_id: string | null
          provider_order_id: string | null
          provider_subscription_id: string | null
          raw_last_event: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          buyer_email?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          external_id?: string | null
          external_provider?: string | null
          id?: string
          owner_user_id: string
          plan_code: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_order_id?: string | null
          provider_subscription_id?: string | null
          raw_last_event?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_email?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          external_id?: string | null
          external_provider?: string | null
          id?: string
          owner_user_id?: string
          plan_code?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_order_id?: string | null
          provider_subscription_id?: string | null
          raw_last_event?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_blocks: {
        Row: {
          created_at: string
          end_at: string
          establishment_id: string
          id: string
          professional_id: string | null
          reason: string | null
          start_at: string
        }
        Insert: {
          created_at?: string
          end_at: string
          establishment_id: string
          id?: string
          professional_id?: string | null
          reason?: string | null
          start_at: string
        }
        Update: {
          created_at?: string
          end_at?: string
          establishment_id?: string
          id?: string
          professional_id?: string | null
          reason?: string | null
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
