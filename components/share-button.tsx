"use client"

import { useState } from "react"
import { Share2, Check, Copy, Link as LinkIcon } from "lucide-react"

type Props = {
  url:        string
  text:       string
  className?: string
  label?:     string
}

export function ShareButton({ url, text, className, label = "Share my result" }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied]     = useState(false)

  const enc  = encodeURIComponent
  const NETS = [
    { name: "X",        href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${enc(text + " " + url)}` },
  ]

  async function onShare() {
    // Mobile : feuille de partage native
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "TradeLeague", text, url })
        return
      } catch { /* annulé → on ouvre le menu en repli */ }
    }
    setMenuOpen((v) => !v)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    } catch { /* noop */ }
  }

  return (
    <div className="relative">
      <button
        onClick={onShare}
        className={className ?? "flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"}
      >
        <Share2 className="h-4 w-4" /> {label}
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-xl border border-border bg-card p-1.5 shadow-lg">
            {NETS.map((n) => (
              <a
                key={n.name}
                href={n.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary"
              >
                <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" /> {n.name}
              </a>
            ))}
            <button
              onClick={copyLink}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
