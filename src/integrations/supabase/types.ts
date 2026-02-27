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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details: Json | null
          id: string
          request_hash: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          request_hash: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          request_hash?: string
        }
        Relationships: []
      }
      admin_locks: {
        Row: {
          key: string
          locked_at: string
          locked_by: string | null
        }
        Insert: {
          key: string
          locked_at?: string
          locked_by?: string | null
        }
        Update: {
          key?: string
          locked_at?: string
          locked_by?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          level: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string
          user_id?: string
        }
        Relationships: []
      }
      allowed_establishment_signups: {
        Row: {
          activation_sent_at: string | null
          created_at: string
          email: string
          kiwify_order_id: string
          paid_at: string
          plan_id: string
          used: boolean
        }
        Insert: {
          activation_sent_at?: string | null
          created_at?: string
          email: string
          kiwify_order_id: string
          paid_at?: string
          plan_id: string
          used?: boolean
        }
        Update: {
          activation_sent_at?: string | null
          created_at?: string
          email?: string
          kiwify_order_id?: string
          paid_at?: string
          plan_id?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "allowed_establishment_signups_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          blocked_until: string | null
          endpoint: string
          id: string
          key: string
          request_count: number
          window_start: string
        }
        Insert: {
          blocked_until?: string | null
          endpoint: string
          id?: string
          key: string
          request_count?: number
          window_start?: string
        }
        Update: {
          blocked_until?: string | null
          endpoint?: string
          id?: string
          key?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      appointment_completion_prompts: {
        Row: {
          action_taken: string | null
          appointment_id: string
          id: string
          prompted_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          action_taken?: string | null
          appointment_id: string
          id?: string
          prompted_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          action_taken?: string | null
          appointment_id?: string
          id?: string
          prompted_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_completion_prompts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_events: {
        Row: {
          actor_type: Database["public"]["Enums"]["event_actor_type"]
          actor_user_id: string | null
          appointment_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["appointment_event_type"]
          from_payload: Json | null
          id: string
          to_payload: Json | null
        }
        Insert: {
          actor_type: Database["public"]["Enums"]["event_actor_type"]
          actor_user_id?: string | null
          appointment_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["appointment_event_type"]
          from_payload?: Json | null
          id?: string
          to_payload?: Json | null
        }
        Update: {
          actor_type?: Database["public"]["Enums"]["event_actor_type"]
          actor_user_id?: string | null
          appointment_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["appointment_event_type"]
          from_payload?: Json | null
          id?: string
          to_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_manage_tokens: {
        Row: {
          appointment_id: string
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_manage_tokens_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
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
          status: Database["public"]["Enums"]["appointment_status"]
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
          status?: Database["public"]["Enums"]["appointment_status"]
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
          status?: Database["public"]["Enums"]["appointment_status"]
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
      billing_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          id: string
          ignore_reason: string | null
          ignored: boolean
          kiwify_product_id: string | null
          payload: Json
          processed_at: string | null
          processing_error: string | null
          provider: string
          received_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          id?: string
          ignore_reason?: string | null
          ignored?: boolean
          kiwify_product_id?: string | null
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          provider?: string
          received_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          id?: string
          ignore_reason?: string | null
          ignored?: boolean
          kiwify_product_id?: string | null
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          provider?: string
          received_at?: string
        }
        Relationships: []
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
      contact_messages: {
        Row: {
          admin_reply: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          replied_at: string | null
          replied_by: string | null
          status: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
        }
        Relationships: []
      }
      contact_whatsapp_events: {
        Row: {
          block_reason: string | null
          created_at: string
          email: string | null
          fingerprint: string | null
          id: string
          ip: string | null
          message_hash: string | null
          name: string | null
          page_path: string
          referrer: string | null
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          block_reason?: string | null
          created_at?: string
          email?: string | null
          fingerprint?: string | null
          id?: string
          ip?: string | null
          message_hash?: string | null
          name?: string | null
          page_path?: string
          referrer?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          block_reason?: string | null
          created_at?: string
          email?: string | null
          fingerprint?: string | null
          id?: string
          ip?: string | null
          message_hash?: string | null
          name?: string | null
          page_path?: string
          referrer?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          establishment_id: string
          id?: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          establishment_id?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
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
      establishment_monthly_usage: {
        Row: {
          appointments_count: number
          created_at: string
          establishment_id: string
          id: string
          month: number
          updated_at: string
          year: number
        }
        Insert: {
          appointments_count?: number
          created_at?: string
          establishment_id: string
          id?: string
          month: number
          updated_at?: string
          year: number
        }
        Update: {
          appointments_count?: number
          created_at?: string
          establishment_id?: string
          id?: string
          month?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "establishment_monthly_usage_establishment_id_fkey"
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
          owner_user_id: string
          phone?: string | null
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
      kiwify_products: {
        Row: {
          active: boolean
          created_at: string
          id: string
          kiwify_checkout_url: string | null
          kiwify_offer_id: string | null
          kiwify_product_id: string | null
          plan_code: string
          product_name: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          kiwify_checkout_url?: string | null
          kiwify_offer_id?: string | null
          kiwify_product_id?: string | null
          plan_code: string
          product_name?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          kiwify_checkout_url?: string | null
          kiwify_offer_id?: string | null
          kiwify_product_id?: string | null
          plan_code?: string
          product_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kiwify_products_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
        ]
      }
      plans: {
        Row: {
          allow_multi_establishments: boolean
          code: string
          created_at: string
          description: string | null
          features: Json
          id: string
          max_appointments_month: number
          max_establishments: number | null
          max_professionals: number
          max_professionals_per_establishment: number | null
          name: string
          popular: boolean
          price_cents: number
        }
        Insert: {
          allow_multi_establishments?: boolean
          code: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          max_appointments_month?: number
          max_establishments?: number | null
          max_professionals?: number
          max_professionals_per_establishment?: number | null
          name: string
          popular?: boolean
          price_cents: number
        }
        Update: {
          allow_multi_establishments?: boolean
          code?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          max_appointments_month?: number
          max_establishments?: number | null
          max_professionals?: number
          max_professionals_per_establishment?: number | null
          name?: string
          popular?: boolean
          price_cents?: number
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
      professional_portal_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          professional_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          professional_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          professional_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_portal_sessions_professional_id_fkey"
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
      public_rate_limits: {
        Row: {
          action: string
          count: number
          created_at: string
          id: string
          ip_hash: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          created_at?: string
          id?: string
          ip_hash: string
          window_start: string
        }
        Update: {
          action?: string
          count?: number
          created_at?: string
          id?: string
          ip_hash?: string
          window_start?: string
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
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
        ]
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
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
      v_dash_by_professional_30d: {
        Row: {
          establishment_id: string | null
          professional_id: string | null
          professional_name: string | null
          total_30d: number | null
        }
        Relationships: [
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
        ]
      }
      v_dash_canceled_7d: {
        Row: {
          canceled_7d: number | null
          establishment_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      v_dash_today: {
        Row: {
          active_today: number | null
          establishment_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      v_dash_top_services_30d: {
        Row: {
          establishment_id: string | null
          service_id: string | null
          service_name: string | null
          total_30d: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
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
      v_dash_week: {
        Row: {
          active_week: number | null
          establishment_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      v_establishment_ratings: {
        Row: {
          establishment_id: string | null
          rating_avg: number | null
          rating_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      v_whatsapp_metrics_daily: {
        Row: {
          blocked: number | null
          clicked: number | null
          day: string | null
          failed: number | null
          reason_cooldown: number | null
          reason_duplicate: number | null
          reason_honeypot: number | null
          reason_rate_limit: number | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_list_contact_messages: {
        Args: { p_limit?: number; p_offset?: number; p_status?: string }
        Returns: Json
      }
      admin_list_establishments: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: Json
      }
      admin_toggle_establishment: {
        Args: { p_active: boolean; p_establishment_id: string }
        Returns: Json
      }
      admin_update_establishment_plan: {
        Args: { p_establishment_id: string; p_new_plan_code: string }
        Returns: Json
      }
      can_create_appointment: {
        Args: { p_establishment_id: string }
        Returns: Json
      }
      can_create_establishment: { Args: { p_owner_id: string }; Returns: Json }
      can_create_professional: {
        Args: { p_establishment_id: string }
        Returns: Json
      }
      can_establishment_accept_bookings: {
        Args: { p_establishment_id: string }
        Returns: Json
      }
      check_establishment_signup_allowed: {
        Args: { p_email: string }
        Returns: Json
      }
      check_establishment_slug_available: {
        Args: { p_current_establishment_id?: string; p_slug: string }
        Returns: boolean
      }
      client_reschedule_appointment: {
        Args: {
          p_appointment_id: string
          p_new_end_at: string
          p_new_professional_id?: string
          p_new_start_at: string
        }
        Returns: Json
      }
      get_active_plan_for_establishment: {
        Args: { p_establishment_id: string }
        Returns: Json
      }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_establishment_rating: {
        Args: { p_establishment_id: string }
        Returns: Json
      }
      get_owner_subscription_status: {
        Args: { p_owner_id: string }
        Returns: Json
      }
      get_professional_appointments: {
        Args: { p_end_date: string; p_start_date: string; p_token: string }
        Returns: Json
      }
      get_subscription_usage: {
        Args: { p_establishment_id: string }
        Returns: Json
      }
      is_admin: { Args: { p_user_id?: string }; Returns: boolean }
      is_admin_master: { Args: { p_user_id?: string }; Returns: boolean }
      is_establishment_member: { Args: { est_id: string }; Returns: boolean }
      professional_portal_login: {
        Args: {
          p_establishment_slug: string
          p_password: string
          p_professional_slug: string
        }
        Returns: Json
      }
      professional_update_appointment_status: {
        Args: {
          p_appointment_id: string
          p_new_status: string
          p_token: string
        }
        Returns: Json
      }
      professional_update_profile: {
        Args: { p_name?: string; p_photo_url?: string; p_token: string }
        Returns: Json
      }
      public_create_appointment:
        | {
            Args: {
              p_customer_email?: string
              p_customer_name: string
              p_customer_notes?: string
              p_customer_phone: string
              p_end_at: string
              p_professional_id: string
              p_service_id: string
              p_slug: string
              p_start_at: string
            }
            Returns: {
              appointment_id: string
              manage_token: string
            }[]
          }
        | {
            Args: {
              p_customer_email?: string
              p_customer_name: string
              p_customer_notes?: string
              p_customer_phone: string
              p_customer_user_id?: string
              p_end_at: string
              p_professional_id: string
              p_service_id: string
              p_slug: string
              p_start_at: string
            }
            Returns: {
              appointment_id: string
              manage_token: string
            }[]
          }
      public_reschedule_appointment: {
        Args: {
          p_appointment_id: string
          p_new_end_at: string
          p_new_start_at: string
          p_token: string
        }
        Returns: Json
      }
      set_professional_portal_password: {
        Args: { p_password: string; p_professional_id: string }
        Returns: Json
      }
      use_establishment_signup: {
        Args: { p_email: string; p_owner_user_id: string }
        Returns: Json
      }
      validate_professional_session: {
        Args: { p_token: string }
        Returns: Json
      }
    }
    Enums: {
      appointment_event_type:
        | "created"
        | "confirmed"
        | "rescheduled"
        | "professional_changed"
        | "canceled"
        | "completed"
        | "no_show_marked"
      appointment_status:
        | "booked"
        | "confirmed"
        | "completed"
        | "canceled"
        | "no_show"
      event_actor_type: "customer" | "admin" | "staff" | "system"
      member_role: "owner" | "manager" | "staff"
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
    Enums: {
      appointment_event_type: [
        "created",
        "confirmed",
        "rescheduled",
        "professional_changed",
        "canceled",
        "completed",
        "no_show_marked",
      ],
      appointment_status: [
        "booked",
        "confirmed",
        "completed",
        "canceled",
        "no_show",
      ],
      event_actor_type: ["customer", "admin", "staff", "system"],
      member_role: ["owner", "manager", "staff"],
    },
  },
} as const
