/**
 * Types TypeScript générés depuis le schéma Supabase TradeLeague.
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
          is_admin:   boolean
          created_at: string
        }
        Insert: {
          id:          string
          email:       string
          pseudo:      string
          is_pro?:     boolean
          is_admin?:   boolean
          created_at?: string
        }
        Update: {
          pseudo?:   string
          is_pro?:   boolean
          is_admin?: boolean
        }
        Relationships: []
      }

      // ── saisons ────────────────────────────────────────────
      saisons: {
        Row: {
          id:                  number
          saison_code:         string
          nom:                 string | null
          type:                string        // "trimestrielle" | "speciale"
          debut_date:          string
          fin_date:            string
          statut:              string        // "active" | "terminee" | "a_venir"
          capital_initial:     number
          max_allocation_pct:  number
          tickers_autorises:   string[] | null   // null = les 65
          fenetre_jours:       number[] | null   // [6,0] = sam+dim
          fenetre_heure_debut: number
          fenetre_heure_fin:   number
          inscription_requise: boolean
          created_at:          string
        }
        Insert: {
          saison_code:          string
          nom?:                 string | null
          type?:                string
          debut_date:           string
          fin_date:             string
          statut?:              string
          capital_initial?:     number
          max_allocation_pct?:  number
          tickers_autorises?:   string[] | null
          fenetre_jours?:       number[] | null
          fenetre_heure_debut?: number
          fenetre_heure_fin?:   number
          inscription_requise?: boolean
          created_at?:          string
        }
        Update: {
          nom?:                 string | null
          type?:                string
          debut_date?:          string
          fin_date?:            string
          statut?:              string
          capital_initial?:     number
          max_allocation_pct?:  number
          tickers_autorises?:   string[] | null
          fenetre_jours?:       number[] | null
          fenetre_heure_debut?: number
          fenetre_heure_fin?:   number
          inscription_requise?: boolean
        }
        Relationships: []
      }

      // ── portfolios ─────────────────────────────────────────
      portfolios: {
        Row: {
          id:                    string
          user_id:               string
          saison:                number
          cash:                  number
          capital_initial:       number
          capital_ajuste:        number
          statut_joueur:         string    // "confirmed" | "rookie"
          date_inscription_saison: string
          created_at:            string
        }
        Insert: {
          id?:                    string
          user_id:                string
          saison?:                number
          cash?:                  number
          capital_initial?:       number
          capital_ajuste?:        number
          statut_joueur?:         string
          date_inscription_saison?: string
          created_at?:            string
        }
        Update: {
          cash?:           number
          capital_ajuste?: number
          saison?:         number
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
          user_id:        string | null
          saison:         number | null
          ticker:         string
          allocation_pct: number
          prix_achat:     number
          status:         string         // 'open' | 'closed'
          open_price:     number | null
          opened_at:      string | null
          close_price:    number | null
          closed_at:      string | null
          created_at:     string
        }
        Insert: {
          id?:             string
          portfolio_id:    string
          user_id?:        string | null
          saison?:         number | null
          ticker:          string
          allocation_pct:  number
          prix_achat:      number
          status?:         string
          open_price?:     number | null
          opened_at?:      string | null
          close_price?:    number | null
          closed_at?:      string | null
          created_at?:     string
        }
        Update: {
          allocation_pct?: number
          prix_achat?:     number
          status?:         string
          open_price?:     number | null
          opened_at?:      string | null
          close_price?:    number | null
          closed_at?:      string | null
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

      // ── quotes_live ────────────────────────────────────────
      quotes_live: {
        Row: {
          ticker:     string
          prix:       number
          fetched_at: string
        }
        Insert: {
          ticker:      string
          prix:        number
          fetched_at?: string
        }
        Update: {
          prix?:       number
          fetched_at?: string
        }
        Relationships: []
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
          id:             string
          user_id:        string
          saison:         number
          perf_totale:    number
          rang:           number
          statut_joueur:  string    // "confirmed" | "rookie"
          perf_vs_cac40:  number | null
          perf_vs_sp500:  number | null
          updated_at:     string
        }
        Insert: {
          id?:            string
          user_id:        string
          saison?:        number
          perf_totale?:   number
          rang?:          number
          statut_joueur?: string
          perf_vs_cac40?: number | null
          perf_vs_sp500?: number | null
          updated_at?:    string
        }
        Update: {
          perf_totale?:  number
          rang?:         number
          statut_joueur?: string
          perf_vs_cac40?: number | null
          perf_vs_sp500?: number | null
          updated_at?:   string
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

      // ── palmares_all_time ──────────────────────────────────
      palmares_all_time: {
        Row: {
          id:                   number
          user_id:              string
          saison_id:            number
          rang_final:           number
          perf_totale:          number
          alpha_positif_weeks:  number
          top10:                boolean
          perf_vs_cac40:        number | null
          perf_vs_sp500:        number | null
          created_at:           string
        }
        Insert: {
          user_id:             string
          saison_id:           number
          rang_final:          number
          perf_totale:         number
          alpha_positif_weeks?: number
          top10?:              boolean
          perf_vs_cac40?:      number | null
          perf_vs_sp500?:      number | null
          created_at?:         string
        }
        Update: {
          rang_final?:  number
          perf_totale?: number
        }
        Relationships: []
      }

      // ── indices ────────────────────────────────────────────
      indices: {
        Row: {
          id:                      number
          date:                    string
          saison_id:               number
          cac40_prix:              number
          sp500_prix:              number
          cac40_variation_saison:  number
          sp500_variation_saison:  number
          updated_at:              string
        }
        Insert: {
          date:                    string
          saison_id:               number
          cac40_prix:              number
          sp500_prix:              number
          cac40_variation_saison:  number
          sp500_variation_saison:  number
          updated_at?:             string
        }
        Update: {
          cac40_prix?:             number
          sp500_prix?:             number
          cac40_variation_saison?: number
          sp500_variation_saison?: number
          updated_at?:             string
        }
        Relationships: []
      }

    }
    Views:     { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums:     { [_ in never]: never }
  }
}

// ── Alias pratiques ───────────────────────────────────────────
export type User            = Database["public"]["Tables"]["users"]["Row"]
export type Saison          = Database["public"]["Tables"]["saisons"]["Row"]
export type Portfolio       = Database["public"]["Tables"]["portfolios"]["Row"]
export type Position        = Database["public"]["Tables"]["positions"]["Row"]
export type Cours           = Database["public"]["Tables"]["cours"]["Row"]
export type Classement      = Database["public"]["Tables"]["classement"]["Row"]
export type PalmaresAllTime = Database["public"]["Tables"]["palmares_all_time"]["Row"]
export type Indice          = Database["public"]["Tables"]["indices"]["Row"]
