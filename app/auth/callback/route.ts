/**
 * GET /auth/callback
 *
 * Supabase redirige ici après confirmation d'email (PKCE flow).
 * On échange le code contre une session, puis on redirige vers
 * /auth/confirmed qui affiche le message de succès 2 secondes.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code             = searchParams.get("code")
  const type             = searchParams.get("type")          // "signup" | "recovery" | null
  const error            = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Erreur Supabase (lien expiré, déjà utilisé…)
  if (error) {
    const params = new URLSearchParams({ error: errorDescription ?? error })
    return NextResponse.redirect(`${origin}/connexion?${params}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Reset de mot de passe → page de changement
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/profil/changer-mot-de-passe`)
      }
      // Confirmation d'inscription → page de succès 2s
      return NextResponse.redirect(`${origin}/auth/confirmed`)
    }
  }

  // Fallback : retour connexion avec erreur générique
  return NextResponse.redirect(`${origin}/connexion?error=Lien+invalide+ou+expiré`)
}
