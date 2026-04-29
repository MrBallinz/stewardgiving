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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bank_connections: {
        Row: {
          account_mask: string | null
          created_at: string
          id: string
          institution_name: string
          plaid_item_id: string | null
          user_id: string
        }
        Insert: {
          account_mask?: string | null
          created_at?: string
          id?: string
          institution_name: string
          plaid_item_id?: string | null
          user_id: string
        }
        Update: {
          account_mask?: string | null
          created_at?: string
          id?: string
          institution_name?: string
          plaid_item_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      giving_covenants: {
        Row: {
          auto_transfer: boolean
          created_at: string
          id: string
          minimum_monthly: number
          percent_of_profit: number
          scripture_anchor: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_transfer?: boolean
          created_at?: string
          id?: string
          minimum_monthly?: number
          percent_of_profit?: number
          scripture_anchor?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_transfer?: boolean
          created_at?: string
          id?: string
          minimum_monthly?: number
          percent_of_profit?: number
          scripture_anchor?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      giving_recipients: {
        Row: {
          allocation_percent: number
          created_at: string
          donate_url: string | null
          ein: string | null
          id: string
          name: string
          platform: string | null
          platform_slug: string | null
          type: Database["public"]["Enums"]["recipient_type"]
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_ein: string | null
          verified_logo_url: string | null
          verified_name: string | null
          website: string | null
        }
        Insert: {
          allocation_percent?: number
          created_at?: string
          donate_url?: string | null
          ein?: string | null
          id?: string
          name: string
          platform?: string | null
          platform_slug?: string | null
          type?: Database["public"]["Enums"]["recipient_type"]
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_ein?: string | null
          verified_logo_url?: string | null
          verified_name?: string | null
          website?: string | null
        }
        Update: {
          allocation_percent?: number
          created_at?: string
          donate_url?: string | null
          ein?: string | null
          id?: string
          name?: string
          platform?: string | null
          platform_slug?: string | null
          type?: Database["public"]["Enums"]["recipient_type"]
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_ein?: string | null
          verified_logo_url?: string | null
          verified_name?: string | null
          website?: string | null
        }
        Relationships: []
      }
      giving_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          monthly_summary_id: string
          recipient_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          transferred_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          monthly_summary_id: string
          recipient_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transferred_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          monthly_summary_id?: string
          recipient_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transferred_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giving_transactions_monthly_summary_id_fkey"
            columns: ["monthly_summary_id"]
            isOneToOne: false
            referencedRelation: "monthly_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giving_transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "giving_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_summaries: {
        Row: {
          created_at: string
          giving_amount: number
          giving_percent: number
          id: string
          month: string
          net_profit: number
          status: Database["public"]["Enums"]["summary_status"]
          total_expenses: number
          total_revenue: number
          user_id: string
        }
        Insert: {
          created_at?: string
          giving_amount?: number
          giving_percent?: number
          id?: string
          month: string
          net_profit?: number
          status?: Database["public"]["Enums"]["summary_status"]
          total_expenses?: number
          total_revenue?: number
          user_id: string
        }
        Update: {
          created_at?: string
          giving_amount?: number
          giving_percent?: number
          id?: string
          month?: string
          net_profit?: number
          status?: Database["public"]["Enums"]["summary_status"]
          total_expenses?: number
          total_revenue?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_name: string | null
          business_type: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarded: boolean
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          onboarded?: boolean
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarded?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      recipient_type: "church" | "missions" | "nonprofit" | "other"
      summary_status: "pending" | "transferred" | "skipped"
      transaction_status: "pending" | "completed" | "failed"
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
      recipient_type: ["church", "missions", "nonprofit", "other"],
      summary_status: ["pending", "transferred", "skipped"],
      transaction_status: ["pending", "completed", "failed"],
    },
  },
} as const
