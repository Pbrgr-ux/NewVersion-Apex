# TradeLeague — Document de reprise

> Dernière mise à jour : 2026-06-11 · dernier commit `9ad8baa` · branche `main` (remote `newversion` = `Pbrgr-ux/NewVersion-Apex`).
> Ce fichier sert à reprendre le dev dans une nouvelle conversation. Lis-le en entier d'abord.

---

## 1. C'est quoi le produit
**Fantasy trading hebdomadaire.** Un joueur a **un seul portefeuille** (« Major League ») de 100 000 € virtuels. Une fois par semaine, pendant une **fenêtre d'arbitrage**, il répartit son capital sur des actions réelles (max 50 % par action, le reste en cash). Les positions sont figées jusqu'à la fenêtre suivante. Performance calculée sur cours réels (Yahoo), classement global + saisons trimestrielles.

Proposition unique : *« Un coup par semaine sur les vrais marchés. Bats l'indice et grimpe au classement. »*

**Autour du cœur :**
- **Floors** = classements privés entre amis (sous-classements de la Major League, pas de portefeuille séparé).
- **Pulse** = positionnement agrégé/anonyme de la communauté (« 67 % des joueurs détiennent AAPL »).
- **Partage social** = page publique `/u/[id]` + cartes image (OG) virales.
- **Pro** (freemium) = stats avancées, historique all-time, positions des rivaux, badge.

---

## 2. Stack & lancer le projet
- **Next.js 16** (App Router, Turbopack) · **React 19** · **Tailwind v4** (`@theme`, tokens oklch).
- **Supabase** : Auth + Postgres + RLS. Client serveur (`lib/supabase/server.ts`, cookies) + client admin `service_role` (lectures cross-users).
- **yahoo-finance2** (`lib/yahoo-finance.ts`) : cours, historique, ratios.
- Déploiement **Vercel** (auto-deploy sur push `main`).

```bash
npm install
npm run dev            # ⚠️ Turbopack OOM fréquent → utiliser :
NODE_OPTIONS=--max-old-space-size=4096 npm run dev
npm run build          # build prod
npx tsc --noEmit       # ⚠️ le build NE valide PAS les types → toujours lancer tsc
```
`.env.local` requis : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`. **`.env.local` pointe sur la base de PROD.**

Vérif visuelle : extension **Claude for Chrome** (l'utilisateur se connecte, on pilote) OU **Claude Preview** (`/stock`, `/u/[id]` sont publics → screenshot sans login).

---

## 3. État actuel — CE QUI MARCHE
- **Auth** : inscription (mdp ≥ 8), confirmation email → dashboard, login, mot de passe oublié, changement de mot de passe. **OAuth Google/Microsoft/Facebook** : code en place (boutons + `/auth/callback?next`), **providers à configurer côté consoles + Supabase**.
- **Dashboard** : hero (rang/capital/perf saison + « +X% to pass Y »), classement top-3, MY POSITIONS, MY STATS (Today/Week/Ever + Best/Worst/Win rate/Trades), bouton **Share my result**, fenêtre d'arbitrage.
- **Arbitrage** (`/arbitrage`) : contexte unique Major League, fenêtre pilotée par la saison, max 50 %/action, cash, **lock de validation** par user (localStorage), dialog de confirmation, **historisation** complète des positions (open/close prices, base_capital).
- **Ranking** (`/classement`) : onglets Overall / Rookie / All-Time / Month / Week (Day retiré), **liste compacte** (forme des Floors), indices CAC40/S&P500, « Your position », **positions des joueurs dépliables si Pro**.
- **Floors** (`/floors`, `/floors/[id]`) : créer (nom), rejoindre par **code 8 lettres `ABCD-EFGH`**, classement des membres par perf Major League, positions des membres si Pro, **Leave** (membre) / **Delete** (admin). Réutilise les tables `leagues` + `league_members`.
- **Pulse** (`/pulse`) : actions classées par popularité (% détenteurs, alloc moyenne) — agrégé, anonyme, natif (aucune source externe). Carte **« League positioning »** sur chaque fiche action.
- **Fiche action** (`/stock/[ticker]`) : graphe 6 mois + **MA 200 jours**, ratios clés, stat foule.
- **Profil** : avatar (16 presets + **upload photo** via Supabase Storage), changer mot de passe, lien Floors, bouton **Admin** (si `is_admin`), déconnexion.
- **Admin** (`/admin`) : gestion des saisons (créer/éditer : dates, capital, **fenêtre de trading** jours+heures, univers de tickers, statut).
- **Pro** : `getEffectivePro` = `is_pro || pro_until > now`. Gating sur newsroom (dormant), création… (Floors gratuits), positions des rivaux. **Offre fondateurs** (6 mois Pro/compte, gate par date dans `app_config`) — **mécanisme prêt, OFF par défaut**.
- **Partage social** : `/u/[id]` (page publique, hors auth), image OG (`opengraph-image.tsx`), route image multi-format `/u/[id]/card?f=square|story|wide&v=auto|podium|rankup|alltime`, `ShareButton` (Web Share fichier + download + réseaux).
- **Sécurité** : migration **010** verrouille l'écriture de `is_pro`/`is_admin` côté client (REVOKE colonne + GRANT colonnes éditables).
- **Cron** : `update-cours` (nightly : cours + indices + table `classement`) ; `update-news` (dormant) ; quotes live (cache 20 min, `quotes_live`).

### Vérifié en navigateur cette session
Dashboard, Ranking (forme Floors + positions Pro), Floors (création/join/leave/detail), Arbitrage (contexte unique), Pulse (carte foule), MA200, partage (page + cartes OG square/story/wide + variantes).

---

## 4. CE QUI RESTE (bloquants de lancement)
| Priorité | Tâche |
|---|---|
| 🔴 | **Auth prod** : Supabase → Site URL + Redirect URLs = domaine Vercel ; configurer providers OAuth (Google/Azure/Facebook) + les activer |
| 🔴 | **Crons + données** : vérifier que `update-cours` tourne en prod (CRON_SECRET) et que la table `cours` se remplit (sinon perfs fausses) |
| 🟠 | **Légal** : CGU, confidentialité, **disclaimer finance** (« jeu, pas de conseil en investissement ») |
| 🟠 | **Tests manuels** : signup/email, états non-Pro, parcours à 2 comptes (join Floor, voir positions Pro) |
| 🟢 | **Stripe** (différé) : `is_pro` manuel en attendant. Brancher Checkout + webhook → `is_pro`. Decision : **lancer gratuit**, offre fondateurs activée à la rentrée. |
| 🟢 | Domaine custom (à inscrire sur les cartes de partage à la place du tagline) |
| 🟢 | Newsroom **dormante** (code+route `/newsroom`+cron `update-news` présents, non liés) — supprimer un jour si voulu |

---

## 5. DÉCISIONS TECHNIQUES (importantes pour ne rien casser)
- **Next 16** : `params` et `searchParams` sont des **Promise** → `const { id } = await params`.
- **Un seul portefeuille** par (user, saison) pour la Major League (`league_id IS NULL`). Les **Floors ne créent PAS de portefeuille** — ce sont des classements filtrés sur `classement`. Les colonnes `league_id` (portfolios/positions) et la config sur `leagues` (capital/fenêtre/durée) sont **dormantes** (toujours NULL/ignorées) — héritées du Modèle B, pas de migration de suppression (cf. archive §8).
- **Isolation Major League** : toutes les lectures du jeu principal filtrent `.is("league_id", null)` (dashboard-data, classement-data, update-cours, wild-card, arbitrate).
- **Fenêtre de trading** = config de la **saison active** (`saisons.fenetre_jours/heure_debut/heure_fin`) via `getActiveSeasonWindow()` ; défaut week-end sam-dim 8h-21h. Validée **côté serveur** dans `/api/arbitrate`. Logique pure isomorphe dans `lib/arbitrage-window.ts` (le hook client `useArbitrageWindow` la consomme).
- **Perf** : retours chaînés `Π(1 + rendement_batch) − 1` ; `base_capital` figé par arbitrage pour les montants € ; garde anti-corruption `safeContribution` (ratio hors [0.1, 10] ignoré). Helper partagé `lib/perf.ts`.
- **All-time** = variation composée toutes saisons (`palmares_all_time` × `classement` courant).
- **Pro** : source unique `lib/pro.ts` `getEffectivePro({is_pro, pro_until})`. Offre fondateurs : trigger `set_founder_pro` pose `pro_until = now()+6 mois` à l'inscription **si** `app_config.founder_offer_until` est dans le futur (NULL = OFF).
- **Séparation client/serveur** : ne JAMAIS importer un module server-only dans un composant client. Helpers purs extraits exprès : `lib/arbitrage-window.ts`, `lib/league-codes.ts`, `lib/pro.ts`, `lib/perf.ts`, `lib/share-card.tsx`.
- **Sécurité** : `is_pro`/`is_admin` non modifiables côté client (migration 010). `service_role` server-only (jamais exposé). Admin = `users.is_admin = true` (à passer en SQL).
- **Partage** : `/u/[id]` public (le middleware ne protège pas `/u`). OG via `next/og` **runtime nodejs**. `getPublicProfile` 100 % `service_role` (sans cookies) pour marcher dans le contexte OG.
- **Codes Floors** : 8 lettres (sans I/O), stockées sans tiret, affichées `ABCD-EFGH`, normalisées à la saisie (tiret optionnel).
- **Avatars** : champ `users.avatar` = `preset:avatar_XX` **ou** URL https (upload bucket Storage `avatars`). `resolvePreset`/`isImageUrl` dans `lib/avatars.ts`.

---

## 6. MIGRATIONS (`supabase/migrations/`, à exécuter à la main dans le SQL Editor)
| # | Objet | Statut prod |
|---|---|---|
| 001-002 | schéma initial + saisons + admin | ✅ |
| 003 | historique positions + `quotes_live` | ✅ |
| 004 | `base_capital` | ✅ |
| 005 | `users.avatar` | ✅ |
| 006 | newsroom (`news_items`) | ✅ |
| 007 | `leagues` + `league_members` | ✅ |
| 008 | verrou is_pro/is_admin (inefficace seul) | ✅ |
| 009 | config ligues + `league_id` | ✅ |
| 010 | **correctif** verrou is_pro/is_admin | ✅ (vérifié : 0 ligne) |
| 011 | offre fondateurs (`app_config`, `users.pro_until`, trigger) | ✅ |
| 012 | `ensure_pseudo` (login OAuth sans pseudo) | ✅ |
| 013 | bucket Storage `avatars` + policies | ✅ |

Activer l'offre fondateurs (à la rentrée) :
```sql
update public.app_config set value = '2026-09-15T23:59:59Z', updated_at = now()
where key = 'founder_offer_until';   -- NULL = OFF
```
Passer un compte admin :
```sql
update public.users set is_admin = true where email = 'ton-email@exemple.com';
```

---

## 7. CARTE DES FICHIERS CLÉS
```
app/
  dashboard/page.tsx          → DashboardScreen (getDashboardData + getActiveSeasonWindow)
  arbitrage/page.tsx          → ArbitrageScreen (contexte unique)
  classement/page.tsx         → ClassementScreen
  floors/page.tsx, [id]/      → FloorsHubScreen / FloorScreen
  pulse/page.tsx              → PulseScreen
  stock/[ticker]/page.tsx     → StockDetailScreen (+ opengraph non concerné)
  u/[id]/page.tsx             → page publique partage  + opengraph-image.tsx + card/route.ts
  profil/…                    → ProfilScreen, changer-mot-de-passe
  admin/…                     → gestion saisons
  api/arbitrate, api/floors, api/update-cours, api/wild-card, api/quotes, auth/callback
lib/
  floors.ts            (server) Floors : getMyFloors / getFloorDetail / create/join/leave/delete
  classement-data.ts   (server) classements + positions joueurs (Pro)
  dashboard-data.ts    (server) données dashboard
  pulse-data.ts        (server) positionnement agrégé
  public-profile.ts    (server) résumé public /u/[id] (service_role, sans cookies)
  stock-detail.ts      (server) fiche action (history+MA200, ratios, crowd)
  pro.ts               (pur)    getEffectivePro
  arbitrage-window.ts  (pur)    fenêtre (config-driven) + isWindowOpen
  perf.ts              (pur)    computeChainedPerf / safeContribution
  league-codes.ts      (pur)    genCode/formatCode/normalizeCode
  share-card.tsx       (pur)    buildCard(profile, format, variant) → next/og
  seasons.ts / seasons-server.ts  saison courante + getActiveSeasonWindow + noms
  avatars.ts, tickers.ts, yahoo-finance.ts, live-quotes.ts, supabase/{server,client,middleware}.ts
components/  (écrans = *-screen.tsx, + bottom-nav, top-header, share-button, oauth-buttons …)
```
Barre du bas (`bottom-nav.tsx`) : **Dashboard · Ranking · Floors · Pulse · Profile**.

---

## 8. ARCHIVE & GOTCHAS
- **Modèle B archivé** (ligues autonomes lourdes : portefeuilles séparés, arbitrage scopé, fenêtres/capital par ligue, gel) :
  - tag `archive-model-b` · branche `archive/model-b-leagues`. `git diff archive-model-b main` pour comparer.
- **Pièges connus** :
  - `npm run dev` (Turbopack) **sature la RAM** → `NODE_OPTIONS=--max-old-space-size=4096`. Après suppression de routes, `rm -rf .next/dev .next/types` si tsc râle sur des routes fantômes.
  - Le `build` ne valide pas les types → **toujours `npx tsc --noEmit`**.
  - Importer un module server-only (qui tire `next/headers`) dans un composant client = build cassé → utiliser les helpers purs.
  - Percentile / Pulse / All-Time sont **peu significatifs à faible nombre de joueurs** (logique correcte, juste du bruit au lancement).
  - Le serveur Vercel garde une activité réseau (analytics) → l'extension navigateur peut peiner à « idle » pour screenshot ; tester via Preview en local.

---

## 9. PROCHAINES PISTES PRODUIT (non commencées)
- **Stripe** (paiement → `is_pro` auto via webhook).
- **Follow** (graphe social asymétrique, réutilise `/u/[id]`).
- **Pulse insights** Pro (tendances semaine/semaine) + seuil de joueurs.
- Variantes de partage contextuelles auto (rank-up nécessite un **historique de rang hebdo** — non stocké).
- Stats Pro avancées (alpha vs CAC40/S&P500, exposition sectorielle, courbe d'équité).
