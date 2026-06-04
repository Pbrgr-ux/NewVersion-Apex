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

const FILES = [
  "avatar_01_young_hoodie",
  "avatar_02_woman_wavy",
  "avatar_03_glasses",
  "avatar_04_dark_skin_hoodie",
  "avatar_05_hijab",
  "avatar_06_blond_hoodie",
  "avatar_07_suit_beard",
  "avatar_08_bob",
  "avatar_09_senior_glasses",
  "avatar_10_afro",
  "avatar_11_turban",
  "avatar_12_curly",
  "avatar_13_east_asian",
  "avatar_14_red_hair",
  "avatar_15_senior_woman",
  "avatar_16_keffiyeh",
]

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
