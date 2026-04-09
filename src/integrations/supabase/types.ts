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
          client_id: string
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
          client_id: string
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
          client_id?: string
          created_at?: string
          id?: string
          offer?: Database["public"]["Enums"]["offer_type"]
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_observations: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          metadata: Json | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_observations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      clients: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          end_date: string | null
          full_name: string | null
          id: string
          instagram: string | null
          internal_notes: string | null
          offer: Database["public"]["Enums"]["offer_type"]
          origin_source: string | null
          phone: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["client_status"]
          tags: string[] | null
          tiktok: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          end_date?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          internal_notes?: string | null
          offer: Database["public"]["Enums"]["offer_type"]
          origin_source?: string | null
          phone?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[] | null
          tiktok?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          end_date?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          internal_notes?: string | null
          offer?: Database["public"]["Enums"]["offer_type"]
          origin_source?: string | null
          phone?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[] | null
          tiktok?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
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
      deliverables: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_visible_to_client: boolean
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_visible_to_client?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_visible_to_client?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      email_logs: {
        Row: {
          client_id: string | null
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          template_id: string | null
          type: Database["public"]["Enums"]["email_type"]
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
          template_id?: string | null
          type: Database["public"]["Enums"]["email_type"]
        }
        Update: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          template_id?: string | null
          type?: Database["public"]["Enums"]["email_type"]
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string
          id: string
          name: string
          subject: string
          type: Database["public"]["Enums"]["email_type"]
          updated_at: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string
          id?: string
          name: string
          subject: string
          type: Database["public"]["Enums"]["email_type"]
          updated_at?: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string
          id?: string
          name?: string
          subject?: string
          type?: Database["public"]["Enums"]["email_type"]
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
          stripe_session_id: string
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
          stripe_session_id: string
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
          stripe_session_id?: string
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
      sessions: {
        Row: {
          admin_notes: string | null
          client_id: string
          created_at: string
          duration_minutes: number
          google_event_id: string | null
          id: string
          meeting_link: string | null
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["session_status"]
          type: Database["public"]["Enums"]["session_type"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          client_id: string
          created_at?: string
          duration_minutes?: number
          google_event_id?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["session_status"]
          type: Database["public"]["Enums"]["session_type"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          client_id?: string
          created_at?: string
          duration_minutes?: number
          google_event_id?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          type?: Database["public"]["Enums"]["session_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      vip_subscriptions: {
        Row: {
          client_id: string | null
          created_at: string
          discord_role_granted: boolean
          discord_user_id: string | null
          duration_months: number
          expires_at: string
          id: string
          starts_at: string
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          discord_role_granted?: boolean
          discord_user_id?: string | null
          duration_months: number
          expires_at: string
          id?: string
          starts_at?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          discord_role_granted?: boolean
          discord_user_id?: string | null
          duration_months?: number
          expires_at?: string
          id?: string
          starts_at?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      wav_premium_applications: {
        Row: {
          blockers: string
          conversion_trigger: string | null
          created_at: string
          current_level: string
          current_revenue: string | null
          email: string
          first_name: string
          follower_since: string | null
          goals: string
          id: string
          last_name: string
          origin_source: string | null
          posthog_id: string | null
          revenue_goal: string | null
          tiktok_username: string | null
        }
        Insert: {
          blockers: string
          conversion_trigger?: string | null
          created_at?: string
          current_level: string
          current_revenue?: string | null
          email: string
          first_name: string
          follower_since?: string | null
          goals: string
          id?: string
          last_name: string
          origin_source?: string | null
          posthog_id?: string | null
          revenue_goal?: string | null
          tiktok_username?: string | null
        }
        Update: {
          blockers?: string
          conversion_trigger?: string | null
          created_at?: string
          current_level?: string
          current_revenue?: string | null
          email?: string
          first_name?: string
          follower_since?: string | null
          goals?: string
          id?: string
          last_name?: string
          origin_source?: string | null
          posthog_id?: string | null
          revenue_goal?: string | null
          tiktok_username?: string | null
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
      client_status: "prospect" | "active" | "completed" | "cancelled"
      email_status: "pending" | "sent" | "failed"
      email_type:
        | "confirmation"
        | "reminder"
        | "deliverable"
        | "cancellation"
        | "reschedule"
      offer_type: "one_shot" | "45_jours" | "vip"
      payment_status: "pending" | "paid" | "refunded" | "failed"
      session_status: "scheduled" | "completed" | "cancelled" | "no_show"
      session_type: "one_shot" | "closing_45j" | "closing_vip" | "suivi"
      task_status: "todo" | "in_progress" | "done"
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
      client_status: ["prospect", "active", "completed", "cancelled"],
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
      session_status: ["scheduled", "completed", "cancelled", "no_show"],
      session_type: ["one_shot", "closing_45j", "closing_vip", "suivi"],
      task_status: ["todo", "in_progress", "done"],
    },
  },
} as const
