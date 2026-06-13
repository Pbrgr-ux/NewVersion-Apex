"use client"

import { useState, type RefObject } from "react"
import { toPng } from "html-to-image"
import { Share2, Loader2, Download, Check, Copy, X as XIcon } from "lucide-react"

type Target = {
  key:   string
  label: string
  ref:   RefObject<HTMLDivElement | null>
}

type Props = {
  url:        string
  text:       string
  targets:    Target[]
  className?: string
}

// Logos de marque (lucide n'expose plus les icônes de marque) — viewBox 24×24
const ICONS = {
  facebook: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.519 5.26l-.999 3.648 3.97-1.039zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
}

type Fallback = { imgUrl: string; label: string }

export function ShareSocial({ url, text, targets, className }: Props) {
  const [step, setStep]         = useState<"idle" | "choose">("idle")
  const [busy, setBusy]         = useState<string | null>(null)
  const [fallback, setFallback] = useState<Fallback | null>(null)
  const [copied, setCopied]     = useState(false)
  const enc = encodeURIComponent

  // Capture le DOM d'un container → PNG (copie pixel-exacte du container)
  async function capture(ref: RefObject<HTMLDivElement | null>): Promise<Blob | null> {
    const node = ref.current
    if (!node) return null
    const bg = getComputedStyle(document.body).backgroundColor || undefined
    const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: bg, cacheBust: true })
    return (await fetch(dataUrl)).blob()
  }

  async function onSelect(t: Target) {
    setBusy(t.key)
    try {
      const blob = await capture(t.ref)
      if (!blob) return
      const file = new File([blob], `tradeleague-${t.key}.png`, { type: "image/png" })

      // Mobile : partage natif de l'IMAGE exacte + message auto (l'OS propose FB/WhatsApp/X…)
      // NB : on ne passe PAS `url` ici — sinon de nombreuses apps (WhatsApp/Facebook)
      // traitent ça comme un partage de lien et IGNORENT l'image. Le lien va dans le texte.
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: `${text}\n${url}` })
          reset()
          return
        } catch {
          // annulé par l'utilisateur → on retombe sur le repli
        }
      }

      // Desktop : pas de partage de fichier → repli (télécharger l'image + boutons réseau)
      setFallback({ imgUrl: URL.createObjectURL(blob), label: t.label })
    } catch {
      // capture impossible (ex. image avatar cross-origin) → repli partage du lien sans image
      setFallback({ imgUrl: "", label: t.label })
    } finally {
      setBusy(null)
    }
  }

  function reset() {
    if (fallback?.imgUrl) URL.revokeObjectURL(fallback.imgUrl)
    setFallback(null)
    setStep("idle")
  }

  async function copyText() {
    try { await navigator.clipboard.writeText(`${text} ${url}`); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* noop */ }
  }

  const NETS = [
    { key: "facebook", label: "Facebook", bg: "bg-[#1877F2]", icon: ICONS.facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { key: "whatsapp", label: "WhatsApp", bg: "bg-[#25D366]", icon: ICONS.whatsapp, href: `https://wa.me/?text=${enc(text + " " + url)}` },
    { key: "x",        label: "X",        bg: "bg-black",      icon: ICONS.x,        href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
  ] as const

  return (
    <div className={className}>
      {/* Bouton principal */}
      {step === "idle" && (
        <button
          onClick={() => setStep("choose")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Share2 className="h-4 w-4" /> Share my result
        </button>
      )}

      {/* Étape 1 : choix du cartouche à partager */}
      {step === "choose" && !fallback && (
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">What do you want to share?</p>
            <button onClick={reset} aria-label="Close" className="text-muted-foreground hover:text-foreground">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {targets.map((t) => (
              <button
                key={t.key}
                onClick={() => onSelect(t)}
                disabled={busy !== null}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-3 py-4 text-sm font-medium text-foreground transition-colors hover:border-primary/50 disabled:opacity-60"
              >
                {busy === t.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4 text-primary" />}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Étape 2 (desktop) : repli — image prête, télécharger + partager le lien */}
      {fallback && (
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Share “{fallback.label}”</p>
            <button onClick={reset} aria-label="Close" className="text-muted-foreground hover:text-foreground">
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {fallback.imgUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fallback.imgUrl} alt={`${fallback.label} card`} className="mb-2 w-full rounded-xl border border-border" />
              <a
                href={fallback.imgUrl}
                download={`tradeleague-${fallback.label.toLowerCase().replace(/\s+/g, "-")}.png`}
                className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Download className="h-4 w-4" /> Download image
              </a>
            </>
          )}

          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Then share the link</p>
          <div className="grid grid-cols-3 gap-2">
            {NETS.map((n) => (
              <a
                key={n.key}
                href={n.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share on ${n.label}`}
                className="flex flex-col items-center gap-1.5"
              >
                <span className={`flex h-11 w-full items-center justify-center rounded-xl text-white transition-opacity hover:opacity-90 ${n.bg}`}>
                  {n.icon}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">{n.label}</span>
              </a>
            ))}
          </div>

          <button onClick={copyText} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary">
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            {copied ? "Copied!" : "Copy caption + link"}
          </button>
        </div>
      )}
    </div>
  )
}
