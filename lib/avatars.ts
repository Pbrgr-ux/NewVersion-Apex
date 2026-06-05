/**
 * lib/avatars.ts
 *
 * Avatars prédéfinis : illustrations SVG (public/avatars/).
 * Stockés en base sous la forme "preset:{id}".
 * (Une URL d'image uploadée est aussi acceptée dans le champ avatar.)
 */

export type AvatarPreset = {
  id:  string
  src: string   // chemin public de l'illustration SVG
}

const FILES = Array.from({ length: 16 }, (_, i) => `avatar_${String(i + 1).padStart(2, "0")}`)

export const AVATAR_PRESETS: AvatarPreset[] = FILES.map((id) => ({
  id,
  src: `/avatars/${id}.svg`,
}))

const PRESET_MAP = Object.fromEntries(AVATAR_PRESETS.map((p) => [p.id, p]))

/** Résout un champ avatar → preset (ou null si c'est une URL / vide). */
export function resolvePreset(avatar: string | null | undefined): AvatarPreset | null {
  if (!avatar || !avatar.startsWith("preset:")) return null
  return PRESET_MAP[avatar.slice(7)] ?? null
}

/** True si le champ avatar est une URL d'image uploadée. */
export function isImageUrl(avatar: string | null | undefined): boolean {
  return !!avatar && (avatar.startsWith("http://") || avatar.startsWith("https://"))
}
