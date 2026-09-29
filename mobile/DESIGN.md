# LBaraka Design System v2 : "Terracotta & Ink"

Refonte complète (2026). Direction inspirée de trois référentiels :
- **taste-skill** : audit-first, un seul accent, un seul système de rayons,
  un seul thème par page, parité claire des modes light/dark.
- **emilkowalski/improve-animations** : entrées en ease-out < 300ms,
  feedback presse scale 0.97 à 160ms, stagger 30-80ms, transform/opacity
  uniquement, respect de reduced-motion.
- **UI-UX-Pro-Max (React Native)** : patterns mobiles natifs, touch targets
  44px+, contraste AA.

## 1. Identité
Terre cuite chaleureuse + encre chaude. Une seule couleur d'accent (l'argile)
sur toutes les pages. L'or est réservé aux scores, paliers et badges.
Jamais de noir/blanc purs : fonds cassés chauds dans les deux modes.

## 2. Couleurs (`theme/tokens.ts`)
| Rôle | Light | Dark |
|---|---|---|
| bg | #FAF6F0 | #151110 |
| surface | #FFFFFF | #201A16 |
| surface2 (puits) | #F2EBDF | #2B231C |
| ink / ink2 / muted | #221A13 / #4A3F34 / #8A7B6B | #F5EDE1 / #D8C9B6 / #A89885 |
| primary (argile) | #BC4B1F, texte #FFFFFF | #E4703A, texte #231104 |
| primarySoft | #F8E2D0 / #8A3411 | #4A2410 / #F2B48C |
| gold | #B8862E (+ soft #F6E8C8) | #D9A441 (+ soft #4A3A16) |
| success / danger / info | tons doux + textes AA dans les deux modes | idem |

## 3. Typographie
Outfit partout, chargée via `@expo-google-fonts/outfit` (root layout).
Échelle compacte mobile-first : display 30, h1 23, h2 19, h3 16,
body 14/21, small 12, caption 11, overline 10 capitales espacées.
Composant `T` (`components/ui`). Densité : boutons 50/44, champs 52,
écran pad 16, cartes pad 16.

## 4. Formes (un seul système : géométrie douce)
Cartes 20, champs 14, boutons 16, pills 999 réservées aux chips et tags.
Pas de bordures 1px opaques : séparations par tons (surface2) et ombres
teintées (`shadowSm` / `shadowMd`).

## 5. Motion (`theme/motion.ts`)
- Entrée : ease-out 240ms. Modales : 320ms.
- Presse : scale 0.97, 160ms (`PressableScale`, intégré à `Button`).
- Listes : `Enter` avec stagger 60ms par index. Jamais de scale(0).
- `useReducedMotion` : aucun déplacement si activé.

## 6. Composants (`components/ui/`)
`Button` (primary/secondary/ghost/danger, md/lg, loading, icônes),
`Card`, `Chip` + `Tag` (tons primary/gold/success/danger/info/muted),
`TextField` (label, icône, mot de passe, erreur), `Screen` (safe area,
fond, scroll), `T`, `Avatar`, `SectionHeader`, `EmptyState`,
`PressableScale`, `Enter`, `Segmented`.

## 7. Thème clair/sombre (`theme/ThemeContext.tsx`)
Mode persisté (`lbaraka-theme-mode`), défaut = système. Toggle dans Profil.
Règle d'or : aucune couleur codée en dur dans les écrans, tout passe par
`useTheme().c`, vérifié en screenshots light + dark.

## 8. Règles de contribution
- Logique, routes, noms de champs et copies FR inchangés lors d'un restyle.
- Pas de nouvelles dépendances sans discussion. Ionicons uniquement, pas
  d'emoji dans l'UI. Pas de texte "dev" visible (ex : "tester le backend").
- `npx tsc --noEmit` vert + `npx expo-doctor` 18/18 avant chaque merge.

## 9. Patterns signatures (v2.1, faits main)
- **Floating tab bar** (`app/(tabs)/_layout.tsx`) : barre flottante arrondie
  26, active pill argile, 7 onglets. Les écrans d'onglets réservent
  `padBottom 108` (prop `Screen`, + FABs remontés).
- **Home magazine** : feature story edge-to-edge (photo 300 + bandeau
  overlay, tag catégorie + titre + caution), ligne de stats texte,
  rangées compactes 68. Plus de carrousel redondant.
- **Wallet fintech** : carte encre profonde (`#241811` / crème en dark),
  chiffres gold, chip motif, œil masquage, tuiles d'actions 84.
- **Onboarding full-bleed** : photo/panneau 340 plein écran + sheet
  surface radius 32 qui chevauche (-32), dots + CTA dans le sheet.
- **Detail magazine** : galerie 340 plein cadre, sheet -28, sticky bottom
  bar [Discuter / Réserver]. Titres display, grille infos 2 col.
