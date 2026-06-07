/**
 * lib/pro.ts  (isomorphe — pas d'import serveur)
 *
 * Source de vérité unique pour « cet utilisateur a-t-il Pro ? ».
 *   effectivePro = is_pro réel  OU  offre fondateurs en cours (pro_until > now)
 *
 * `pro_until` est posé à l'inscription par le trigger set_founder_pro quand
 * l'offre de lancement est active (cf. migration 011). Aucune logique d'offre
 * ici : il suffit de comparer pro_until à maintenant.
 */

export type ProSource = {
  is_pro?:    boolean | null
  pro_until?: string | null
}

export function getEffectivePro(u: ProSource | null | undefined): boolean {
  if (!u) return false
  if (u.is_pro) return true
  if (u.pro_until && new Date(u.pro_until).getTime() > Date.now()) return true
  return false
}
