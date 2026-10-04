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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addons: {
        Row: {
          active: boolean
          id: string
          kind: Database["public"]["Enums"]["addon_kind"]
          name: string
          sort: number
          value: number
        }
        Insert: {
          active?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["addon_kind"]
          name: string
          sort?: number
          value: number
        }
        Update: {
          active?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["addon_kind"]
          name?: string
          sort?: number
          value?: number
        }
        Relationships: []
      }
      booking_events: {
        Row: {
          actor_id: string | null
          booking_id: string
          created_at: string
          id: string
          kind: string
          message: string | null
        }
        Insert: {
          actor_id?: string | null
          booking_id: string
          created_at?: string
          id?: string
          kind: string
          message?: string | null
        }
        Update: {
          actor_id?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          kind?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          access_notes: string | null
          addon_ids: string[]
          address: string
          admin_note: string | null
          bathrooms: number
          bedrooms: number
          clean_type_id: string
          client_email: string
          client_name: string
          client_phone: string | null
          client_user_id: string | null
          created_at: string
          estimate: Json
          final_crew: number | null
          final_hours: number | null
          final_price: number | null
          flexible: boolean
          id: string
          levels: number
          notes: string | null
          paid_at: string | null
          parking: string | null
          payment_ref: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_url: string | null
          pets: boolean
          ref: string
          service_date: string
          sqm: number | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          suburb: string
          suggestion: Json | null
          token: string
          updated_at: string
          worker_brief: string | null
        }
        Insert: {
          access_notes?: string | null
          addon_ids?: string[]
          address: string
          admin_note?: string | null
          bathrooms?: number
          bedrooms?: number
          clean_type_id: string
          client_email: string
          client_name: string
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string
          estimate: Json
          final_crew?: number | null
          final_hours?: number | null
          final_price?: number | null
          flexible?: boolean
          id?: string
          levels?: number
          notes?: string | null
          paid_at?: string | null
          parking?: string | null
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_url?: string | null
          pets?: boolean
          ref?: string
          service_date: string
          sqm?: number | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          suburb: string
          suggestion?: Json | null
          token?: string
          updated_at?: string
          worker_brief?: string | null
        }
        Update: {
          access_notes?: string | null
          addon_ids?: string[]
          address?: string
          admin_note?: string | null
          bathrooms?: number
          bedrooms?: number
          clean_type_id?: string
          client_email?: string
          client_name?: string
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string
          estimate?: Json
          final_crew?: number | null
          final_hours?: number | null
          final_price?: number | null
          flexible?: boolean
          id?: string
          levels?: number
          notes?: string | null
          paid_at?: string | null
          parking?: string | null
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_url?: string | null
          pets?: boolean
          ref?: string
          service_date?: string
          sqm?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          suburb?: string
          suggestion?: Json | null
          token?: string
          updated_at?: string
          worker_brief?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_clean_type_id_fkey"
            columns: ["clean_type_id"]
            isOneToOne: false
            referencedRelation: "clean_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_user_id_fkey"
            columns: ["client_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clean_types: {
        Row: {
          active: boolean
          description: string
          id: string
          key: string
          multiplier: number
          name: string
          sort: number
        }
        Insert: {
          active?: boolean
          description?: string
          id?: string
          key: string
          multiplier?: number
          name: string
          sort?: number
        }
        Update: {
          active?: boolean
          description?: string
          id?: string
          key?: string
          multiplier?: number
          name?: string
          sort?: number
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          budget_range: string | null
          category: string
          created_at: string
          description: string
          email: string
          id: string
          name: string
          phone: string | null
          photo_paths: string[]
          project_id: string | null
          ref: string
          status: Database["public"]["Enums"]["enquiry_status"]
          suburb: string | null
          timeframe: string | null
        }
        Insert: {
          budget_range?: string | null
          category: string
          created_at?: string
          description: string
          email: string
          id?: string
          name: string
          phone?: string | null
          photo_paths?: string[]
          project_id?: string | null
          ref?: string
          status?: Database["public"]["Enums"]["enquiry_status"]
          suburb?: string | null
          timeframe?: string | null
        }
        Update: {
          budget_range?: string | null
          category?: string
          created_at?: string
          description?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          photo_paths?: string[]
          project_id?: string | null
          ref?: string
          status?: Database["public"]["Enums"]["enquiry_status"]
          suburb?: string | null
          timeframe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_project_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          description: string
          id: string
          project_id: string
          receipt_path: string | null
          spent_on: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          project_id: string
          receipt_path?: string | null
          spent_on?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          project_id?: string
          receipt_path?: string | null
          spent_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          max_uses: number
          note: string | null
          revoked: boolean
          role: Database["public"]["Enums"]["app_role"]
          skills: string[]
          token: string
          uses: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          max_uses?: number
          note?: string | null
          revoked?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          skills?: string[]
          token?: string
          uses?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          max_uses?: number
          note?: string | null
          revoked?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          skills?: string[]
          token?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          created_by: string | null
          est_cost: number | null
          id: string
          name: string
          project_id: string
          qty: number
          status: Database["public"]["Enums"]["material_status"]
          unit: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          est_cost?: number | null
          id?: string
          name: string
          project_id: string
          qty?: number
          status?: Database["public"]["Enums"]["material_status"]
          unit?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          est_cost?: number | null
          id?: string
          name?: string
          project_id?: string
          qty?: number
          status?: Database["public"]["Enums"]["material_status"]
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          kind: string
          profile_id: string
          read_at: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind: string
          profile_id: string
          read_at?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          profile_id?: string
          read_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_presets: {
        Row: {
          active: boolean
          bathrooms: number
          bedrooms: number
          clean_type_id: string | null
          created_at: string
          fixed_price: number
          id: string
          max_sqm: number | null
          name: string
        }
        Insert: {
          active?: boolean
          bathrooms: number
          bedrooms: number
          clean_type_id?: string | null
          created_at?: string
          fixed_price: number
          id?: string
          max_sqm?: number | null
          name: string
        }
        Update: {
          active?: boolean
          bathrooms?: number
          bedrooms?: number
          clean_type_id?: string | null
          created_at?: string
          fixed_price?: number
          id?: string
          max_sqm?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_presets_clean_type_id_fkey"
            columns: ["clean_type_id"]
            isOneToOne: false
            referencedRelation: "clean_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_path: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          locale: Database["public"]["Enums"]["app_locale"]
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          skills: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_path?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          locale?: Database["public"]["Enums"]["app_locale"]
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          skills?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_path?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          locale?: Database["public"]["Enums"]["app_locale"]
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          skills?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      project_financials: {
        Row: {
          budget: number
          project_id: string
        }
        Insert: {
          budget?: number
          project_id: string
        }
        Update: {
          budget?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_financials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          profile_id: string
          project_id: string
          role: Database["public"]["Enums"]["member_role"]
        }
        Insert: {
          created_at?: string
          profile_id: string
          project_id: string
          role?: Database["public"]["Enums"]["member_role"]
        }
        Update: {
          created_at?: string
          profile_id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "project_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          id: string
          name: string
          position: number
          project_id: string
          status: Database["public"]["Enums"]["stage_status"]
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          position?: number
          project_id: string
          status?: Database["public"]["Enums"]["stage_status"]
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          position?: number
          project_id?: string
          status?: Database["public"]["Enums"]["stage_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          author_id: string | null
          body: string
          client_visible: boolean
          created_at: string
          id: string
          photo_paths: string[]
          project_id: string
          stage_id: string | null
        }
        Insert: {
          author_id?: string | null
          body?: string
          client_visible?: boolean
          created_at?: string
          id?: string
          photo_paths?: string[]
          project_id: string
          stage_id?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string
          client_visible?: boolean
          created_at?: string
          id?: string
          photo_paths?: string[]
          project_id?: string
          stage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          category: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          cover_path: string | null
          created_at: string
          description: string | null
          due_date: string | null
          enquiry_id: string | null
          id: string
          share_budget: boolean
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          token: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          enquiry_id?: string | null
          id?: string
          share_budget?: boolean
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          token?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          enquiry_id?: string | null
          id?: string
          share_budget?: boolean
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          profile_id: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          profile_id: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          profile_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          base_hours: number
          client_hourly_rate: number
          hours_per_50sqm: number
          hours_per_bathroom: number
          hours_per_bedroom: number
          hours_per_extra_level: number
          id: number
          max_shift_hours: number
          min_price: number
          pet_hours: number
          price_rounding: number
          updated_at: string
          worker_hourly_rate: number
        }
        Insert: {
          base_hours?: number
          client_hourly_rate?: number
          hours_per_50sqm?: number
          hours_per_bathroom?: number
          hours_per_bedroom?: number
          hours_per_extra_level?: number
          id?: number
          max_shift_hours?: number
          min_price?: number
          pet_hours?: number
          price_rounding?: number
          updated_at?: string
          worker_hourly_rate?: number
        }
        Update: {
          base_hours?: number
          client_hourly_rate?: number
          hours_per_50sqm?: number
          hours_per_bathroom?: number
          hours_per_bedroom?: number
          hours_per_extra_level?: number
          id?: number
          max_shift_hours?: number
          min_price?: number
          pet_hours?: number
          price_rounding?: number
          updated_at?: string
          worker_hourly_rate?: number
        }
        Relationships: []
      }
      shift_details: {
        Row: {
          access_notes: string | null
          address: string
          shift_id: string
        }
        Insert: {
          access_notes?: string | null
          address: string
          shift_id: string
        }
        Update: {
          access_notes?: string | null
          address?: string
          shift_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_details_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: true
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_signups: {
        Row: {
          created_at: string
          shift_id: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          shift_id: string
          worker_id: string
        }
        Update: {
          created_at?: string
          shift_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_signups_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_signups_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          booking_id: string | null
          brief: string | null
          created_at: string
          ends_at: string
          id: string
          pay_rate: number
          skill: string
          spots: number
          starts_at: string
          status: Database["public"]["Enums"]["shift_status"]
          suburb: string
          title: string
        }
        Insert: {
          booking_id?: string | null
          brief?: string | null
          created_at?: string
          ends_at: string
          id?: string
          pay_rate: number
          skill?: string
          spots?: number
          starts_at: string
          status?: Database["public"]["Enums"]["shift_status"]
          suburb: string
          title: string
        }
        Update: {
          booking_id?: string | null
          brief?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          pay_rate?: number
          skill?: string
          spots?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["shift_status"]
          suburb?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_templates: {
        Row: {
          id: string
          name: string
          sort: number
          stages: string[]
        }
        Insert: {
          id?: string
          name: string
          sort?: number
          stages: string[]
        }
        Update: {
          id?: string
          name?: string
          sort?: number
          stages?: string[]
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string
          created_by: string | null
          hours: number
          id: string
          note: string | null
          profile_id: string
          project_id: string
          work_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          hours: number
          id?: string
          note?: string | null
          profile_id: string
          project_id: string
          work_date?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          hours?: number
          id?: string
          note?: string | null
          profile_id?: string
          project_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_shift: { Args: { p_shift: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_on_shift: { Args: { p_shift: string }; Returns: boolean }
      is_project_member: { Args: { p_project: string }; Returns: boolean }
      is_project_supervisor: { Args: { p_project: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      leave_shift: { Args: { p_shift: string }; Returns: string }
      my_role: { Args: never; Returns: Database["public"]["Enums"]["app_role"] }
      random_ref: { Args: never; Returns: string }
      random_token: { Args: { bytes?: number }; Returns: string }
    }
    Enums: {
      addon_kind: "hours" | "fixed"
      app_locale: "en" | "es"
      app_role: "admin" | "supervisor" | "worker" | "client"
      booking_status:
        | "requested"
        | "awaiting_payment"
        | "scheduled"
        | "completed"
        | "declined"
        | "cancelled"
      enquiry_status: "new" | "contacted" | "converted" | "archived"
      expense_category: "materials" | "labour" | "equipment" | "other"
      material_status: "needed" | "bought" | "used"
      member_role: "supervisor" | "worker"
      payment_status: "unpaid" | "pending" | "paid"
      project_status: "planning" | "active" | "on_hold" | "completed"
      shift_status: "open" | "full" | "done" | "cancelled"
      stage_status: "todo" | "doing" | "done"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      addon_kind: ["hours", "fixed"],
      app_locale: ["en", "es"],
      app_role: ["admin", "supervisor", "worker", "client"],
      booking_status: [
        "requested",
        "awaiting_payment",
        "scheduled",
        "completed",
        "declined",
        "cancelled",
      ],
      enquiry_status: ["new", "contacted", "converted", "archived"],
      expense_category: ["materials", "labour", "equipment", "other"],
      material_status: ["needed", "bought", "used"],
      member_role: ["supervisor", "worker"],
      payment_status: ["unpaid", "pending", "paid"],
      project_status: ["planning", "active", "on_hold", "completed"],
      shift_status: ["open", "full", "done", "cancelled"],
      stage_status: ["todo", "doing", "done"],
    },
  },
} as const