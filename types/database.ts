/**
 * Types TypeScript générés depuis le schéma Supabase APEX.
 * Pour regénérer automatiquement :
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */
export type Database = {
  public: {
    Tables: {

      // ── users ──────────────────────────────────────────────
      users: {
        Row: {
          id:         string
          email:      string
          pseudo:     string
          is_pro:     boolean
          created_at: string
        }
        Insert: {
          id:          string
          email:       string
          pseudo:      string
          is_pro?:     boolean
          created_at?: string
        }
        Update: {
          pseudo?:     string
          is_pro?:     boolean
        }
        Relationships: []
      }

      // ── portfolios ─────────────────────────────────────────
      portfolios: {
        Row: {
          id:         string
          user_id:    string
          saison:     number
          cash:       number
          created_at: string
        }
        Insert: {
          id?:         string
          user_id:     string
          saison?:     number
          cash?:       number
          created_at?: string
        }
        Update: {
          cash?:   number
          saison?: number
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      // ── positions ──────────────────────────────────────────
      positions: {
        Row: {
          id:             string
          portfolio_id:   string
          ticker:         string
          allocation_pct: number
          prix_achat:     number
          created_at:     string
        }
        Insert: {
          id?:             string
          portfolio_id:    string
          ticker:          string
          allocation_pct:  number
          prix_achat:      number
          created_at?:     string
        }
        Update: {
          allocation_pct?: number
          prix_achat?:     number
        }
        Relationships: [
          {
            foreignKeyName: "positions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          }
        ]
      }

      // ── cours ──────────────────────────────────────────────
      cours: {
        Row: {
          id:     string
          ticker: string
          prix:   number
          date:   string
        }
        Insert: {
          id?:    string
          ticker: string
          prix:   number
          date:   string
        }
        Update: {
          prix?: number
        }
        Relationships: []
      }

      // ── classement ─────────────────────────────────────────
      classement: {
        Row: {
          id:          string
          user_id:     string
          saison:      number
          perf_totale: number
          rang:        number
          updated_at:  string
        }
        Insert: {
          id?:          string
          user_id:      string
          saison?:      number
          perf_totale?: number
          rang?:        number
          updated_at?:  string
        }
        Update: {
          perf_totale?: number
          rang?:        number
          updated_at?:  string
        }
        Relationships: [
          {
            foreignKeyName: "classement_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

    }
    Views:     { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums:     { [_ in never]: never }
  }
}

// ── Alias pratiques ───────────────────────────────────────────
export type User        = Database["public"]["Tables"]["users"]["Row"]
export type Portfolio   = Database["public"]["Tables"]["portfolios"]["Row"]
export type Position    = Database["public"]["Tables"]["positions"]["Row"]
export type Cours       = Database["public"]["Tables"]["cours"]["Row"]
export type Classement  = Database["public"]["Tables"]["classement"]["Row"]
