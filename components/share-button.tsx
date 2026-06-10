"use client"

import { useState } from "react"
import { Share2, Check, Copy, Link as LinkIcon, Download, Loader2 } from "lucide-react"

type Props = {
  url:        string
  text:       string
  cardBase?:  string   // ex. `${origin}/u/${id}/card` → image partageable/téléchargeable
  className?: string
  label?:     string
}

export function ShareButton({ url, text, cardBase, className, label = "Share my result" }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied]     = useState(false)
  const [busy, setBusy]         = useState(false)

  const enc  = encodeURIComponent
  const NETS = [
    { name: "X",        href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${enc(text + " " + url)}` },
  ]

  async function shareImageFile(): Promise<boolean> {
    if (!cardBase || typeof navigator === "undefined" || !navigator.canShare) return false
    try {
      const res  = await fetch(`${cardBase}?f=square`)
      if (!res.ok) return false
      const blob = await res.blob()
      const file = new File([blob], "tradeleague.png", { type: "image/png" })
      if (!navigator.canShare({ files: [file] })) return false
      await navigator.share({ files: [file], text, url })
      return true
    } catch {
      return false   // annulé ou non supporté → repli
    }
  }

  async function onShare() {
    setBusy(true)
    try {
      // 1) Partager l'IMAGE elle-même (mobile) → Instagram / WhatsApp / stories…
      if (await shareImageFile()) return
      // 2) Sinon partage texte+lien natif
      if (typeof navigator !== "undefined" && navigator.share) {
        try { await navigator.share({ title: "TradeLeague", text, url }); return } catch { /* repli menu */ }
      }
      // 3) Sinon menu desktop
      setMenuOpen((v) => !v)
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* noop */ }
  }

  return (
    <div className="relative">
      <button
        onClick={onShare}
        disabled={busy}
        className={className ?? "flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-60"}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />} {label}
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl border border-border bg-card p-1.5 shadow-lg">
            {cardBase && (
              <>
                <a href={`${cardBase}?f=square`} download="tradeleague.png" target="_blank" rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                  <Download className="h-3.5 w-3.5 text-primary" /> Download image (square)
                </a>
                <a href={`${cardBase}?f=story`} download="tradeleague-story.png" target="_blank" rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                  <Download className="h-3.5 w-3.5 text-primary" /> Download image (story)
                </a>
                <div className="my-1 h-px bg-border" />
              </>
            )}
            {NETS.map((n) => (
              <a key={n.name} href={n.href} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary">
                <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" /> {n.name}
              </a>
            ))}
            <button onClick={copyLink} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary">
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
