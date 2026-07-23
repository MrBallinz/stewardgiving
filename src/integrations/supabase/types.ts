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
          institution_id: string | null
          institution_name: string
          is_mock: boolean
          last_sync_at: string | null
          plaid_access_token: string | null
          plaid_item_id: string | null
          status: string
          sync_cursor: string | null
          user_id: string
        }
        Insert: {
          account_mask?: string | null
          created_at?: string
          id?: string
          institution_id?: string | null
          institution_name: string
          is_mock?: boolean
          last_sync_at?: string | null
          plaid_access_token?: string | null
          plaid_item_id?: string | null
          status?: string
          sync_cursor?: string | null
          user_id: string
        }
        Update: {
          account_mask?: string | null
          created_at?: string
          id?: string
          institution_id?: string | null
          institution_name?: string
          is_mock?: boolean
          last_sync_at?: string | null
          plaid_access_token?: string | null
          plaid_item_id?: string | null
          status?: string
          sync_cursor?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      chat_rate_buckets: {
        Row: {
          hour_count: number
          hour_window_start: string
          minute_count: number
          minute_window_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          hour_count?: number
          hour_window_start?: string
          minute_count?: number
          minute_window_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          hour_count?: number
          hour_window_start?: string
          minute_count?: number
          minute_window_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      church_corrections: {
        Row: {
          church_id: string
          created_at: string
          field_corrected: string
          id: string
          new_value: string | null
          note: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          church_id: string
          created_at?: string
          field_corrected: string
          id?: string
          new_value?: string | null
          note?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          church_id?: string
          created_at?: string
          field_corrected?: string
          id?: string
          new_value?: string | null
          note?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_corrections_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      church_giving_link_audit: {
        Row: {
          changed_by: string | null
          changed_by_role: string | null
          church_id: string
          created_at: string
          id: string
          new_giving_platform: string | null
          new_giving_url: string | null
          old_giving_platform: string | null
          old_giving_url: string | null
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          changed_by_role?: string | null
          church_id: string
          created_at?: string
          id?: string
          new_giving_platform?: string | null
          new_giving_url?: string | null
          old_giving_platform?: string | null
          old_giving_url?: string | null
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          changed_by_role?: string | null
          church_id?: string
          created_at?: string
          id?: string
          new_giving_platform?: string | null
          new_giving_url?: string | null
          old_giving_platform?: string | null
          old_giving_url?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_giving_link_audit_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      church_reports: {
        Row: {
          church_id: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_user_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          church_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          church_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_reports_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      churches: {
        Row: {
          aliases: string[]
          approved_by_admin_id: string | null
          city: string | null
          created_at: string
          dba_name: string | null
          denomination: string | null
          ein: string | null
          enrichment_attempted_at: string | null
          enrichment_last_error: string | null
          enrichment_status: string
          giving_platform: string | null
          giving_url: string | null
          giving_url_source: string | null
          google_place_id: string | null
          id: string
          last_verified_at: string | null
          legal_name: string
          listing_status: string
          ntee_code: string | null
          org_type: string
          pastor_name: string | null
          phone: string | null
          source_type: string
          source_url: string | null
          state: string | null
          street: string | null
          submitted_by_user_id: string | null
          updated_at: string
          verification_notes: string | null
          verification_status: string
          verified_501c3: boolean
          website: string | null
          zip: string | null
        }
        Insert: {
          aliases?: string[]
          approved_by_admin_id?: string | null
          city?: string | null
          created_at?: string
          dba_name?: string | null
          denomination?: string | null
          ein?: string | null
          enrichment_attempted_at?: string | null
          enrichment_last_error?: string | null
          enrichment_status?: string
          giving_platform?: string | null
          giving_url?: string | null
          giving_url_source?: string | null
          google_place_id?: string | null
          id?: string
          last_verified_at?: string | null
          legal_name: string
          listing_status?: string
          ntee_code?: string | null
          org_type?: string
          pastor_name?: string | null
          phone?: string | null
          source_type?: string
          source_url?: string | null
          state?: string | null
          street?: string | null
          submitted_by_user_id?: string | null
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
          verified_501c3?: boolean
          website?: string | null
          zip?: string | null
        }
        Update: {
          aliases?: string[]
          approved_by_admin_id?: string | null
          city?: string | null
          created_at?: string
          dba_name?: string | null
          denomination?: string | null
          ein?: string | null
          enrichment_attempted_at?: string | null
          enrichment_last_error?: string | null
          enrichment_status?: string
          giving_platform?: string | null
          giving_url?: string | null
          giving_url_source?: string | null
          google_place_id?: string | null
          id?: string
          last_verified_at?: string | null
          legal_name?: string
          listing_status?: string
          ntee_code?: string | null
          org_type?: string
          pastor_name?: string | null
          phone?: string | null
          source_type?: string
          source_url?: string | null
          state?: string | null
          street?: string | null
          submitted_by_user_id?: string | null
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
          verified_501c3?: boolean
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          flag_count: number
          id: string
          post_id: string
          status: Database["public"]["Enums"]["moderation_status"]
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          flag_count?: number
          id?: string
          post_id: string
          status?: Database["public"]["Enums"]["moderation_status"]
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          flag_count?: number
          id?: string
          post_id?: string
          status?: Database["public"]["Enums"]["moderation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: []
      }
      connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          last_message_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          last_message_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          last_message_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_reply: string | null
          ai_reply: string | null
          category: string | null
          created_at: string
          id: string
          message: string
          route: string | null
          severity: string | null
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
          viewport: string | null
        }
        Insert: {
          admin_reply?: string | null
          ai_reply?: string | null
          category?: string | null
          created_at?: string
          id?: string
          message: string
          route?: string | null
          severity?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          viewport?: string | null
        }
        Update: {
          admin_reply?: string | null
          ai_reply?: string | null
          category?: string | null
          created_at?: string
          id?: string
          message?: string
          route?: string | null
          severity?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          viewport?: string | null
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
          church_id: string | null
          created_at: string
          custom_ein: string | null
          custom_name: string | null
          donate_url: string | null
          ein: string | null
          giving_method: string
          id: string
          name: string
          notes: string | null
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
          church_id?: string | null
          created_at?: string
          custom_ein?: string | null
          custom_name?: string | null
          donate_url?: string | null
          ein?: string | null
          giving_method?: string
          id?: string
          name: string
          notes?: string | null
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
          church_id?: string | null
          created_at?: string
          custom_ein?: string | null
          custom_name?: string | null
          donate_url?: string | null
          ein?: string | null
          giving_method?: string
          id?: string
          name?: string
          notes?: string | null
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
        Relationships: [
          {
            foreignKeyName: "giving_recipients_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      giving_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_sample: boolean
          marked_paid_at: string | null
          monthly_summary_id: string
          payment_method: string | null
          recipient_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          transferred_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          is_sample?: boolean
          marked_paid_at?: string | null
          monthly_summary_id: string
          payment_method?: string | null
          recipient_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transferred_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_sample?: boolean
          marked_paid_at?: string | null
          monthly_summary_id?: string
          payment_method?: string | null
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
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          flagged: boolean
          id: string
          read_at: string | null
          sender_id: string
          status: Database["public"]["Enums"]["moderation_status"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          flagged?: boolean
          id?: string
          read_at?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["moderation_status"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          flagged?: boolean
          id?: string
          read_at?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["moderation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          notes: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          notes?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      monthly_summaries: {
        Row: {
          created_at: string
          giving_amount: number
          giving_percent: number
          id: string
          is_sample: boolean
          month: string
          net_profit: number
          reviewed_at: string | null
          source: string
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
          is_sample?: boolean
          month: string
          net_profit?: number
          reviewed_at?: string | null
          source?: string
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
          is_sample?: boolean
          month?: string
          net_profit?: number
          reviewed_at?: string | null
          source?: string
          status?: Database["public"]["Enums"]["summary_status"]
          total_expenses?: number
          total_revenue?: number
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          comment_on_post: boolean
          connection_accepted: boolean
          connection_requests: boolean
          giving_ready: boolean
          new_message: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_on_post?: boolean
          connection_accepted?: boolean
          connection_requests?: boolean
          giving_ready?: boolean
          new_message?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_on_post?: boolean
          connection_accepted?: boolean
          connection_requests?: boolean
          giving_ready?: boolean
          new_message?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          dismissed_at: string | null
          id: string
          kind: string
          metadata: Json
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          kind: string
          metadata?: Json
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          kind?: string
          metadata?: Json
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      plaid_transactions: {
        Row: {
          account_id: string | null
          amount_cents: number
          bank_connection_id: string
          classification: string
          created_at: string
          excluded: boolean
          id: string
          iso_currency_code: string | null
          merchant_name: string | null
          name: string | null
          pending: boolean
          pf_category_detailed: string | null
          pf_category_primary: string | null
          plaid_transaction_id: string
          posted_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount_cents: number
          bank_connection_id: string
          classification?: string
          created_at?: string
          excluded?: boolean
          id?: string
          iso_currency_code?: string | null
          merchant_name?: string | null
          name?: string | null
          pending?: boolean
          pf_category_detailed?: string | null
          pf_category_primary?: string | null
          plaid_transaction_id: string
          posted_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount_cents?: number
          bank_connection_id?: string
          classification?: string
          created_at?: string
          excluded?: boolean
          id?: string
          iso_currency_code?: string | null
          merchant_name?: string | null
          name?: string | null
          pending?: boolean
          pf_category_detailed?: string | null
          pf_category_primary?: string | null
          plaid_transaction_id?: string
          posted_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plaid_transactions_bank_connection_id_fkey"
            columns: ["bank_connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          flag_count: number
          id: string
          image_url: string | null
          status: Database["public"]["Enums"]["moderation_status"]
          updated_at: string
          visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          flag_count?: number
          id?: string
          image_url?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          flag_count?: number
          id?: string
          image_url?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          business_type: string | null
          community_suspended_at: string | null
          created_at: string
          display_name: string | null
          financial_suspended_at: string | null
          full_name: string | null
          id: string
          industry: string | null
          is_public: boolean
          onboarded: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          business_type?: string | null
          community_suspended_at?: string | null
          created_at?: string
          display_name?: string | null
          financial_suspended_at?: string | null
          full_name?: string | null
          id: string
          industry?: string | null
          is_public?: boolean
          onboarded?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          business_type?: string | null
          community_suspended_at?: string | null
          created_at?: string
          display_name?: string | null
          financial_suspended_at?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          is_public?: boolean
          onboarded?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          id: string
          payload: Json | null
          received_at: string
          source: string
          type: string | null
        }
        Insert: {
          id: string
          payload?: Json | null
          received_at?: string
          source: string
          type?: string | null
        }
        Update: {
          id?: string
          payload?: Json | null
          received_at?: string
          source?: string
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_connected: { Args: { _a: string; _b: string }; Returns: boolean }
      consume_chat_rate: {
        Args: { _hour_limit: number; _minute_limit: number; _user_id: string }
        Returns: Json
      }
      contains_scam_pattern: { Args: { _text: string }; Returns: boolean }
      is_admin: { Args: { _uid: string }; Returns: boolean }
      is_blocked: { Args: { _a: string; _b: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conv: string; _uid: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      connection_status: "pending" | "accepted" | "declined"
      moderation_status: "visible" | "flagged" | "hidden" | "removed"
      post_visibility: "public" | "connections"
      recipient_type: "church" | "missions" | "nonprofit" | "other"
      report_status: "pending" | "reviewed" | "actioned" | "dismissed"
      report_target: "post" | "comment" | "message" | "profile"
      summary_status:
        | "pending"
        | "transferred"
        | "skipped"
        | "reviewed"
        | "completed"
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
      app_role: ["admin", "moderator", "user"],
      connection_status: ["pending", "accepted", "declined"],
      moderation_status: ["visible", "flagged", "hidden", "removed"],
      post_visibility: ["public", "connections"],
      recipient_type: ["church", "missions", "nonprofit", "other"],
      report_status: ["pending", "reviewed", "actioned", "dismissed"],
      report_target: ["post", "comment", "message", "profile"],
      summary_status: [
        "pending",
        "transferred",
        "skipped",
        "reviewed",
        "completed",
      ],
      transaction_status: ["pending", "completed", "failed"],
    },
  },
} as const
