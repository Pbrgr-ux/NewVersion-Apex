"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart3, User, Newspaper } from "lucide-react"

// Pages sans barre de navigation (auth / accueil)
const HIDDEN = ["/", "/signup", "/connexion", "/mot-de-passe-oublie", "/auth/confirmed"]

const ITEMS = [
  { href: "/dashboard",  label: "Dashboard", icon: Home },
  { href: "/classement", label: "Ranking",   icon: BarChart3 },
  { href: "/newsroom",   label: "News",      icon: Newspaper },
  { href: "/profil",     label: "Profile",   icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  if (HIDDEN.includes(pathname)) return null

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-xl items-center justify-around py-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
