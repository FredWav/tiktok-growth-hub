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
      availability_slots: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          offer: Database["public"]["Enums"]["offer_type"]
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          offer: Database["public"]["Enums"]["offer_type"]
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          offer?: Database["public"]["Enums"]["offer_type"]
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_screenshots: {
        Row: {
          caption: string | null
          client_name: string | null
          created_at: string
          display_locations: string[]
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          offer: string[]
        }
        Insert: {
          caption?: string | null
          client_name?: string | null
          created_at?: string
          display_locations?: string[]
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          offer?: string[]
        }
        Update: {
          caption?: string | null
          client_name?: string | null
          created_at?: string
          display_locations?: string[]
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          offer?: string[]
        }
        Relationships: []
      }
      deep_links: {
        Row: {
          clicks_count: number
          created_at: string
          id: string
          slug: string
          title: string
          youtube_id: string
        }
        Insert: {
          clicks_count?: number
          created_at?: string
          id?: string
          slug: string
          title: string
          youtube_id: string
        }
        Update: {
          clicks_count?: number
          created_at?: string
          id?: string
          slug?: string
          title?: string
          youtube_id?: string
        }
        Relationships: []
      }
      diagnostic_leads: {
        Row: {
          blocker: string | null
          budget: string | null
          completed: boolean
          conversion_trigger: string | null
          created_at: string
          current_step: number
          email: string | null
          first_name: string | null
          follower_since: string | null
          id: string
          last_name: string | null
          level: string | null
          objective: string | null
          origin_source: string | null
          posthog_id: string | null
          recommended_offer: string | null
          temps: string | null
          tiktok: string | null
          updated_at: string
        }
        Insert: {
          blocker?: string | null
          budget?: string | null
          completed?: boolean
          conversion_trigger?: string | null
          created_at?: string
          current_step?: number
          email?: string | null
          first_name?: string | null
          follower_since?: string | null
          id?: string
          last_name?: string | null
          level?: string | null
          objective?: string | null
          origin_source?: string | null
          posthog_id?: string | null
          recommended_offer?: string | null
          temps?: string | null
          tiktok?: string | null
          updated_at?: string
        }
        Update: {
          blocker?: string | null
          budget?: string | null
          completed?: boolean
          conversion_trigger?: string | null
          created_at?: string
          current_step?: number
          email?: string | null
          first_name?: string | null
          follower_since?: string | null
          id?: string
          last_name?: string | null
          level?: string | null
          objective?: string | null
          origin_source?: string | null
          posthog_id?: string | null
          recommended_offer?: string | null
          temps?: string | null
          tiktok?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      express_analyses: {
        Row: {
          completed_at: string | null
          created_at: string
          email: string | null
          error_message: string | null
          health_score: number | null
          id: string
          job_id: string | null
          newsletter_requested: boolean | null
          newsletter_subscribed: boolean | null
          result_data: Json | null
          status: string
          stripe_session_id: string | null
          tiktok_username: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          email?: string | null
          error_message?: string | null
          health_score?: number | null
          id?: string
          job_id?: string | null
          newsletter_requested?: boolean | null
          newsletter_subscribed?: boolean | null
          result_data?: Json | null
          status?: string
          stripe_session_id?: string | null
          tiktok_username: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          email?: string | null
          error_message?: string | null
          health_score?: number | null
          id?: string
          job_id?: string | null
          newsletter_requested?: boolean | null
          newsletter_subscribed?: boolean | null
          result_data?: Json | null
          status?: string
          stripe_session_id?: string | null
          tiktok_username?: string
        }
        Relationships: []
      }
      oneshot_submissions: {
        Row: {
          conversion_trigger: string | null
          created_at: string
          email: string
          id: string
          name: string
          objectives: string
          origin_source: string | null
          posthog_id: string | null
          stripe_session_id: string
          tiktok: string
          whatsapp: string
        }
        Insert: {
          conversion_trigger?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          objectives: string
          origin_source?: string | null
          posthog_id?: string | null
          stripe_session_id: string
          tiktok: string
          whatsapp: string
        }
        Update: {
          conversion_trigger?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          objectives?: string
          origin_source?: string | null
          posthog_id?: string | null
          stripe_session_id?: string
          tiktok?: string
          whatsapp?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          duration_seconds: number | null
          entered_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          duration_seconds?: number | null
          entered_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          duration_seconds?: number | null
          entered_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trusted_clients: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          offers: string[]
          tiktok_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          offers?: string[]
          tiktok_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          offers?: string[]
          tiktok_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wav_premium_applications: {
        Row: {
          accompagnement_critere: string | null
          accompagnement_type: string | null
          blockers: string | null
          budget: string | null
          conversion_trigger: string | null
          created_at: string
          current_level: string | null
          email: string
          first_name: string
          follower_since: string | null
          goals: string
          id: string
          last_name: string
          motivation: string | null
          origin_source: string | null
          posthog_id: string | null
          profil: string | null
          tiktok_username: string | null
        }
        Insert: {
          accompagnement_critere?: string | null
          accompagnement_type?: string | null
          blockers?: string | null
          budget?: string | null
          conversion_trigger?: string | null
          created_at?: string
          current_level?: string | null
          email: string
          first_name: string
          follower_since?: string | null
          goals: string
          id?: string
          last_name: string
          motivation?: string | null
          origin_source?: string | null
          posthog_id?: string | null
          profil?: string | null
          tiktok_username?: string | null
        }
        Update: {
          accompagnement_critere?: string | null
          accompagnement_type?: string | null
          blockers?: string | null
          budget?: string | null
          conversion_trigger?: string | null
          created_at?: string
          current_level?: string | null
          email?: string
          first_name?: string
          follower_since?: string | null
          goals?: string
          id?: string
          last_name?: string
          motivation?: string | null
          origin_source?: string | null
          posthog_id?: string | null
          profil?: string | null
          tiktok_username?: string | null
        }
        Relationships: []
      }
      wavacademy_claims: {
        Row: {
          claimed_at: string | null
          created_at: string
          discord_role_env: string
          discord_user_id: string | null
          email: string
          expires_at: string
          plan_type: string
          subscription_id: string | null
          token: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          discord_role_env: string
          discord_user_id?: string | null
          email: string
          expires_at?: string
          plan_type: string
          subscription_id?: string | null
          token?: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          discord_role_env?: string
          discord_user_id?: string | null
          email?: string
          expires_at?: string
          plan_type?: string
          subscription_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "wavacademy_claims_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "wavacademy_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      wavacademy_consents: {
        Row: {
          cgv_version: string
          consent_cgv: boolean
          consent_renonciation: boolean
          created_at: string
          email: string
          id: string
          ip_address: string | null
          plan_type: string
          stripe_session_id: string | null
          user_agent: string | null
        }
        Insert: {
          cgv_version?: string
          consent_cgv: boolean
          consent_renonciation: boolean
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          plan_type: string
          stripe_session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          cgv_version?: string
          consent_cgv?: boolean
          consent_renonciation?: boolean
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          plan_type?: string
          stripe_session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      wavacademy_subscriptions: {
        Row: {
          created_at: string
          discord_role_env: string | null
          discord_role_granted: boolean
          discord_user_id: string | null
          email: string
          id: string
          plan_type: string
          status: string
          stripe_session_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          created_at?: string
          discord_role_env?: string | null
          discord_role_granted?: boolean
          discord_user_id?: string | null
          email: string
          id?: string
          plan_type: string
          status?: string
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          created_at?: string
          discord_role_env?: string | null
          discord_role_granted?: boolean
          discord_user_id?: string | null
          email?: string
          id?: string
          plan_type?: string
          status?: string
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client"
      email_status: "pending" | "sent" | "failed"
      email_type:
        | "confirmation"
        | "reminder"
        | "deliverable"
        | "cancellation"
        | "reschedule"
      offer_type: "one_shot" | "45_jours" | "vip"
      payment_status: "pending" | "paid" | "refunded" | "failed"
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
      app_role: ["admin", "client"],
      email_status: ["pending", "sent", "failed"],
      email_type: [
        "confirmation",
        "reminder",
        "deliverable",
        "cancellation",
        "reschedule",
      ],
      offer_type: ["one_shot", "45_jours", "vip"],
      payment_status: ["pending", "paid", "refunded", "failed"],
    },
  },
} as const
