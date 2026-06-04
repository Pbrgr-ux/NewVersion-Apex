/**
 * lib/avatars.ts
 *
 * Avatars prédéfinis : emoji sur fond coloré.
 * Stockés en base sous la forme "preset:{id}".
 * (Une URL d'image uploadée est aussi acceptée dans le champ avatar.)
 */

export type AvatarPreset = {
  id:    string
  emoji: string
  bg:    string   // classe Tailwind de fond
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "fox",     emoji: "🦊", bg: "bg-orange-500/20" },
  { id: "wolf",    emoji: "🐺", bg: "bg-slate-500/20" },
  { id: "lion",    emoji: "🦁", bg: "bg-amber-500/20" },
  { id: "dragon",  emoji: "🐉", bg: "bg-emerald-500/20" },
  { id: "bull",    emoji: "🐂", bg: "bg-red-500/20" },
  { id: "eagle",   emoji: "🦅", bg: "bg-blue-500/20" },
  { id: "shark",   emoji: "🦈", bg: "bg-cyan-500/20" },
  { id: "rocket",  emoji: "🚀", bg: "bg-indigo-500/20" },
  { id: "chart",   emoji: "📈", bg: "bg-green-500/20" },
  { id: "diamond", emoji: "💎", bg: "bg-sky-500/20" },
  { id: "fire",    emoji: "🔥", bg: "bg-rose-500/20" },
  { id: "bolt",    emoji: "⚡", bg: "bg-yellow-500/20" },
  { id: "target",  emoji: "🎯", bg: "bg-red-400/20" },
  { id: "trophy",  emoji: "🏆", bg: "bg-amber-400/20" },
  { id: "crown",   emoji: "👑", bg: "bg-yellow-400/20" },
  { id: "brain",   emoji: "🧠", bg: "bg-purple-500/20" },
]

const PRESET_MAP = Object.fromEntries(AVATAR_PRESETS.map((p) => [p.id, p]))

/** Résout un champ avatar → preset (ou null si c'est une URL / vide). */
export function resolvePreset(avatar: string | null | undefined): AvatarPreset | null {
  if (!avatar || !avatar.startsWith("preset:")) return null
  return PRESET_MAP[avatar.slice(7)] ?? null
}

/** True si le champ avatar est une URL d'image. */
export function isImageUrl(avatar: string | null | undefined): boolean {
  return !!avatar && (avatar.startsWith("http://") || avatar.startsWith("https://"))
}
