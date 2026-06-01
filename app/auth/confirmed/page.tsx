"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

export default function ConfirmedPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(2)

  useEffect(() => {
    // Compte à rebours 2 → 1 → redirect
    const interval = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(interval)
          router.replace("/connexion")
        }
        return n - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [router])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-center">
      {/* Icône animée */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
        <CheckCircle2 className="h-10 w-10 text-green-500" strokeWidth={1.5} />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Email confirmé !
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ton compte TradeLeague est activé.
      </p>

      {/* Barre de progression */}
      <div className="mt-8 w-48 overflow-hidden rounded-full bg-muted h-1">
        <div
          className="h-1 rounded-full bg-green-500 transition-all"
          style={{
            width: countdown === 2 ? "50%" : "100%",
            transitionDuration: "1000ms",
            transitionTimingFunction: "linear",
          }}
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Redirection vers la connexion…
      </p>
    </main>
  )
}
