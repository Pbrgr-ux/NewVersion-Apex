/**
 * Auto-generated types for the APEX Supabase schema.
 * Regenerate with: npx supabase gen types typescript --project-id <id> > types/database.ts
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string                  // uuid — references auth.users
          pseudo: string
          avatar_url: string | null
          is_pro: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          pseudo: string
          avatar_url?: string | null
          is_pro?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          pseudo?: string
          avatar_url?: string | null
          is_pro?: boolean
          updated_at?: string
        }
      }

      portfolios: {
        Row: {
          id: string
          user_id: string
          season: number
          ticker: string
          allocation: number          // 0–100 (percentage)
          submitted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          season: number
          ticker: string
          allocation: number
          submitted_at?: string
        }
        Update: {
          allocation?: number
        }
      }

      performance: {
        Row: {
          id: string
          user_id: string
          season: number
          week: number
          perf_day: number
          perf_week: number
          perf_month: number
          perf_season: number
          recorded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          season: number
          week: number
          perf_day: number
          perf_week: number
          perf_month: number
          perf_season: number
          recorded_at?: string
        }
        Update: never
      }

      leagues: {
        Row: {
          id: string
          name: string
          code: string                // short invite code e.g. WOLF-42
          creator_id: string
          season: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          creator_id: string
          season?: number
          created_at?: string
        }
        Update: {
          name?: string
        }
      }

      league_members: {
        Row: {
          league_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          league_id: string
          user_id: string
          joined_at?: string
        }
        Update: never
      }

      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          plan: "monthly" | "annual"
          status: "active" | "canceled" | "past_due"
          current_period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          plan: "monthly" | "annual"
          status?: "active" | "canceled" | "past_due"
          current_period_end: string
          created_at?: string
        }
        Update: {
          status?: "active" | "canceled" | "past_due"
          current_period_end?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience type aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Portfolio = Database["public"]["Tables"]["portfolios"]["Row"]
export type Performance = Database["public"]["Tables"]["performance"]["Row"]
export type League = Database["public"]["Tables"]["leagues"]["Row"]
export type LeagueMember = Database["public"]["Tables"]["league_members"]["Row"]
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"]
