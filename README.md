# BelTools Dashboard

## Vision

Tableau de bord enseignant personnel servant de **page d'accueil de beltools.fr** avec deux modes :

- **Mode perso** : liens favoris, outils du quotidien, raccourcis clavier
- **Mode classe** : widgets projetables au videoprojecteur (minuteur, QR code, tirage au sort, etc.)

Inspire de [Digiscreen](https://ladigitale.dev/digiscreen/) de La Digitale, mais adapte aux besoins specifiques de M.Belhaj.

## URL

- **Production** : https://beltools.fr
- **Hebergement** : Oracle Cloud (Nginx, fichiers statiques dans `/var/www/beltools/`)

## Version actuelle (v1 — en ligne)

Page statique `index.html` avec :
- Horloge temps reel + date + message d'accueil "Bonjour M.Belhaj"
- Cartes outils avec favoris (etoile) + drag-and-drop (SortableJS)
- Section "Mes essentiels" (favoris) + "Autres outils" (repliable)
- Raccourcis clavier (1-9 pour ouvrir un outil favori)
- Persistence localStorage (ordre, favoris)
- Fichier source : `/Users/macbelhaj/Dev/Fusion-sites/index.html`

---

## Version cible (v2) — Decisions prises

### Choix de design valides par l'utilisateur

| Decision | Choix |
|----------|-------|
| **Ambiance** | Mixte : header sombre (gradient bleu nuit) + corps clair (#f0f2f5) + cartes blanches |
| **Layout** | **Bento Grid** — tuiles de tailles differentes (1x1, 2x1, 2x2), asymetrique, moderne |
| **Edition** | **Clic droit / long-press** — menu contextuel (modifier, redimensionner, favoris, supprimer) |
| **Ajout d'outils** | Carte "+" en fin de grille, ouvre un formulaire |
| **Pas de dropdown** | Tous les choix par chips/boutons (preference utilisateur CLAUDE.md) |
| **Architecture** | Single HTML file, vanilla JS, zero build step (SortableJS + Inter font CDN) |
| **Accueil** | Formel et sobre : "Bonjour M.Belhaj — Samedi 22 fevrier 2026" |

### Double usage
1. **Page d'accueil navigateur** : s'ouvre le matin, acces rapide a tous les outils
2. **Ecran de classe projete** : widgets interactifs pendant le cours

---

## Recherche Design (fevrier 2026)

### Tendance dominante : Bento Grid

LA tendance 2025-2026, popularisee par Apple (WWDC), Notion, et les designers Dribbble/Figma.

**Principe** : Grille asymetrique de "compartiments" (comme une boite bento japonaise). Certains grands, certains petits, tous dans la meme grille coherente.

**Caracteristiques** :
- Tuiles de tailles variables (1x1, 2x1, 1x2, 2x2)
- Coins tres arrondis (border-radius 16-24px)
- Espacement genereux et constant (16-20px gap)
- Fond de page uni, tuiles "flottent" dessus
- Micro-animations au hover (legere elevation, scale 1.02)

### References visuelles etudiees

| Reference | Style | A retenir |
|-----------|-------|-----------|
| **Bonjourr** | iOS minimaliste, backgrounds mood-aware (change selon l'heure) | Backgrounds dynamiques |
| **Homarr** | App launcher moderne, 10000+ icones, dark/light auto | Le plus proche d'un produit commercial |
| **Dashy** | Dashboard dense mais lisible, 50+ widgets, status en direct | Puissance fonctionnelle |
| **Homer** | Minimalisme YAML, zero DB, page statique | Legerete, le Dieter Rams des dashboards |
| **Momentum** | Photo plein-ecran + horloge geante, effet "respiration" | L'experience "zen" |
| **NightTab** | Grid de bookmarks, systeme de themes exceptionnel | Themes coherents |
| **Linear.app** | Dark, typographie serree, micro-animations | Benchmark dark dashboard pro |
| **Vercel Dashboard** | Minimalisme extreme, data-dense | Lisibilite maximale |

### Palettes envisagees

**Choix retenu — Mixte (header sombre + corps clair)** :
- Header : gradient `#1a1a2e → #16213e → #0f3460`
- Corps : `#f0f2f5` (gris tres clair)
- Cartes : `#ffffff` avec ombres douces
- Icones : fond pastel colore par carte (11 couleurs)
- Accents : `#3b82f6` (bleu) + `#8b5cf6` (violet)

---

## Implementation technique v2

### CSS — Bento Grid (4 colonnes fixes)

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(100px, auto);
  gap: 16px;
}
.tile-1x1 { grid-column: span 1; grid-row: span 1; }
.tile-2x1 { grid-column: span 2; grid-row: span 1; }
.tile-2x2 { grid-column: span 2; grid-row: span 2; }
```

Responsive :
- Tablet (768-1024px) : `repeat(3, 1fr)`
- Mobile (< 640px) : `repeat(2, 1fr)`, toutes les tuiles forcees en `span 1`

### Tailles par defaut suggerees

| Outil | Taille | Raison |
|-------|--------|--------|
| MathsMentales | 2x1 (large) | Outil principal, hero |
| Pronote | 2x1 (large) | Usage quotidien intensif |
| Tous les autres | 1x1 (standard) | Equilibre visuel |

### Menu contextuel (clic droit / long-press)

Un seul element `#ctx-menu` global, positionne en `fixed` au curseur :
- **Modifier** : ouvre le formulaire d'edition complet
- **Taille de la tuile** : mini-picker inline (3 chips : Petite / Large / Grande)
- **Favoris / Autres** : bascule entre les deux sections
- **Supprimer** : supprime les outils custom, deplace les builtins vers "Autres"

Long-press mobile : `touchstart` avec timeout 500ms, annule si `touchmove`.

### Formulaire d'edition / ajout

Un seul modal, deux modes (edit / create) :
- **Nom** : input text
- **URL** : input url
- **Icone** : 2 chips (Emoji / Image URL) + preview
- **Description** : input text
- **Couleur** : 11 chips de couleur (pastels)
- **Taille** : 3 chips (Petite 1x1, Large 2x1, Grande 2x2)
- **Mon outil** : checkbox toggle (badge bleu)

### Schema localStorage v2

```js
{
  version: 2,
  collapsed: true,
  tools: [
    {
      id: "mathsmentales",
      name: "MathsMentales",
      desc: "Calcul mental college",
      url: "https://mathsmentales.beltools.fr",
      icon: "🧠",
      iconColor: "icon-purple",
      mine: true,
      fav: true,
      size: "2x1",
      order: 0
    },
    // ...
  ]
}
```

Migration automatique v1 → v2 au premier chargement (silencieuse).

Les outils builtin (definis dans `ALL_TOOLS`) ne peuvent pas etre supprimes, seulement deplaces vers "Autres". Seuls les outils custom (`id: "custom_*"`) peuvent etre supprimes.

### SortableJS + Bento

- SortableJS gere le reorder par DOM order
- CSS Grid gere les tailles via classes `tile-*`
- `delay: 600` + `delayOnTouchOnly: true` pour eviter conflit avec long-press mobile
- Ghost element herite des classes de taille pour ne pas casser le layout

### Raccourcis clavier

- `1-9` : ouvrir les 9 premiers favoris
- `N` : ouvrir le formulaire d'ajout
- `Escape` : fermer menu/modal

---

## Widgets envisages (mode classe — phase future)

| Widget | Description | Priorite |
|--------|-------------|----------|
| Minuteur / Timer | Compte a rebours configurable, son a la fin | Haute |
| Chronometre | Temps qui decompte pour activites chronometrees | Haute |
| QR Code | Generer un QR code a projeter (lien vers exercice, site...) | Haute |
| Tirage au sort | Tirer un nom d'eleve au hasard (import liste) | Haute |
| Feu tricolore | Rouge/Orange/Vert pour gerer le bruit ou les phases | Moyenne |
| Zone de texte | Afficher une consigne, un objectif du jour | Moyenne |
| Fond personnalisable | Changer le fond d'ecran (couleur, image, theme) | Moyenne |
| Nuage de mots | Generer un nuage a partir de reponses | Basse |
| Minuteur visuel | Barre ou cercle qui se vide (type "Time Timer") | Basse |
| Integration media | Afficher image, video YouTube | Basse |

---

## Inspiration : Digiscreen

- **URL** : https://ladigitale.dev/digiscreen/
- **Blog** : https://ladigitale.dev/blog/digiscreen-un-fond-d-ecran-interactif-pour-la-classe
- **Code source** : https://codeberg.org/ladigitale/digiscreen (AGPL-3.0)
- **Stack** : Vue.js + Vite + PHP backend
- **Version** : 1.0.9, 504 commits, 17 releases
- **Widgets** : minuteur, chronometre, QR code, texte, dessin, YouTube, nuage de mots, exercices interactifs, capture d'ecran, annotation, retroaction emoji, multi-pages
- **Format sauvegarde** : fichiers .dgs proprietaires

---

## Outils du quotidien (contenu du dashboard)

### Mes essentiels (favoris par defaut)

| Outil | URL | Type | Taille |
|-------|-----|------|--------|
| MathsMentales | https://mathsmentales.beltools.fr | Mon outil | 2x1 |
| Maths 6e | https://belmathen6eme.vercel.app | Mon outil | 1x1 |
| Maths 5e | (a deployer) | Mon outil | 1x1 |
| Maths 4e | (a deployer) | Mon outil | 1x1 |
| Cahier de Maths | https://cahier-maths.vercel.app | Mon outil | 1x1 |
| ChaiPad | (a migrer sur Oracle) | Mon outil | 1x1 |
| Pronote | https://0850024p.index-education.net/pronote/professeur.html | Externe | 2x1 |
| Google Classroom | https://classroom.google.com | Externe | 1x1 |
| Webmail | https://messagerie.education.gouv.fr | Externe | 1x1 |
| e-lyco | https://chaissac.e-lyco.fr | Externe | 1x1 |
| Mathigon | https://fr.mathigon.org | Externe | 1x1 |
| Desmos | https://www.desmos.com/calculator?lang=fr | Externe | 1x1 |

### Autres outils (section repliable)

| Outil | URL | Type |
|-------|-----|------|
| MathEval | https://matheval.netlify.app | Mon outil |
| BacReady | https://bacready-maths.netlify.app | Mon outil |
| CorrecTool | (a deployer) | Mon outil |
| Calcul Mental Prix | https://calcul-mental-prix.vercel.app | Mon outil |
| App FR-AZ | https://fr-az-communication.netlify.app | Mon outil |
| MathsMentales.net | https://mathsmentales.net | Externe |

---

## Deploiement

```bash
# Copier la page sur le serveur Oracle
scp -i ~/.ssh/oracle-serveur.key index.html ubuntu@89.168.61.230:/var/www/beltools/index.html
```

Nginx sert les fichiers statiques depuis `/var/www/beltools/` pour beltools.fr et www.beltools.fr.

## Prochaines etapes

### Phase 1 — Dashboard v2 (mode perso)
- [ ] Implementer le Bento Grid (4 colonnes fixes, tailles variables)
- [ ] Ajouter le menu contextuel (clic droit / long-press)
- [ ] Ajouter le formulaire d'edition (modifier nom, URL, icone, taille)
- [ ] Ajouter le formulaire d'ajout (carte "+")
- [ ] Migration localStorage v1 → v2
- [ ] Mettre a jour le webmail vers https://messagerie.education.gouv.fr
- [ ] Tester sur mobile (long-press, scroll modal)

### Phase 2 — Mode classe (widgets)
- [ ] Implementer le basculement mode perso ↔ mode classe
- [ ] Creer le widget Minuteur
- [ ] Creer le widget QR Code
- [ ] Creer le widget Tirage au sort
- [ ] Ajouter la personnalisation du fond d'ecran

### Phase 3 — Migration ChaiPad
- [ ] Migrer ChaiPad d'OVH vers Oracle Cloud (voir `/Users/macbelhaj/Dev/digipad-classroom/MIGRATION-ORACLE.md`)
- [ ] Mettre a jour l'URL ChaiPad dans le dashboard
