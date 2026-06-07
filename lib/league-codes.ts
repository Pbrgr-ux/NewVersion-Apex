/**
 * lib/league-codes.ts  (isomorphe — utilisable client ET serveur)
 *
 * Helpers purs pour les codes d'invitation de ligue.
 * Pas d'import serveur ici → importable depuis des composants client.
 */

/** Normalise un code saisi : enlève tiret/espaces, met en majuscules. */
export function normalizeCode(code: string): string {
  return code.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
}

/** Affichage d'un code avec un tiret au milieu : ABCD-EFGH (ou ABC-DEF pour 6). */
export function formatCode(code: string): string {
  const c = normalizeCode(code)
  if (c.length < 2) return c
  const mid = Math.ceil(c.length / 2)
  return `${c.slice(0, mid)}-${c.slice(mid)}`
}
