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
          id:         string        // uuid — references auth.users
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
      }

      // ── positions ──────────────────────────────────────────
      positions: {
        Row: {
          id:             string
          portfolio_id:   string
          ticker:         string
          allocation_pct: number   // 0–100
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
      }

      // ── cours ──────────────────────────────────────────────
      cours: {
        Row: {
          id:     string
          ticker: string
          prix:   number
          date:   string  // format ISO "YYYY-MM-DD"
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
      }

      // ── classement ─────────────────────────────────────────
      classement: {
        Row: {
          id:          string
          user_id:     string
          saison:      number
          perf_totale: number   // ex: 12.34 = +12.34%
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
      }

    }
    Views:     Record<string, never>
    Functions: Record<string, never>
    Enums:     Record<string, never>
  }
}

// ── Alias pratiques ───────────────────────────────────────────
export type User        = Database["public"]["Tables"]["users"]["Row"]
export type Portfolio   = Database["public"]["Tables"]["portfolios"]["Row"]
export type Position    = Database["public"]["Tables"]["positions"]["Row"]
export type Cours       = Database["public"]["Tables"]["cours"]["Row"]
export type Classement  = Database["public"]["Tables"]["classement"]["Row"]
