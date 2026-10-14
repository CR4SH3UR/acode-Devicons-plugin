# Devicons pour Acode

Pack d'icônes de fichiers et dossiers pour [Acode](https://acode.app) basé sur [Devicons](https://devicons.io) : les logos en couleur des langages, frameworks, outils et services (JavaScript, Python, Rust, Docker, React, Git, Supabase…).

- **Les 1966 SVG de `@dev.icons/core` 1.3.0** : 1465 logos et 501 variantes compactes `-icon`, dans `icons/<nom>.svg`. Quand une variante `-icon` existe, c'est elle qui est affichée (plus lisible en petit).
- **190+ extensions** (`.js`, `.py`, `.rs`, `.kt`, `.dart`, `.vue`…)
- **230+ noms de fichiers** (`package.json`, `Dockerfile`, `Cargo.toml`, `vite.config.ts`, `.gitignore`, `.env`…)
- **1500+ noms de dossiers** : les dossiers spéciaux (`.github`, `node_modules`, `.vscode`…) et un dossier par logo (`docker/`, `react/`, `supabase/`…)
- Les logos noirs (GitHub, Rust, Markdown, Vercel…) sont recolorés en gris pour rester lisibles sur les thèmes sombres.

## Installation

1. Télécharger [`plugin.zip`](plugin.zip).
2. Dans Acode : **Plugins → + → Local**, puis choisir le zip.
3. Sélectionner **Devicons** dans **Settings → App settings → Icon pack**.

Nécessite une version d'Acode qui inclut l'API plugin `fileIcons`.

## Développement

Les icônes et les tables d'associations sont générées depuis le sprite SVG du paquet npm [`@dev.icons/core`](https://www.npmjs.com/package/@dev.icons/core) :

```sh
npm install
npm run build   # régénère icons/, file_icons.json et folder_icons.json
npm run pack    # build + crée plugin.zip
```

Pour ajouter une association, éditer [`scripts/mappings.mjs`](scripts/mappings.mjs) : chaque clé est le nom d'une icône (voir [devicons.io](https://devicons.io)), chaque valeur la liste des extensions, noms de fichiers ou noms de dossiers correspondants. Le build échoue si un nom d'icône n'existe pas ou si une même entrée est associée à deux icônes.

| Chemin | Rôle |
| --- | --- |
| `main.js` | Charge les tables JSON et enregistre le pack via `fileIcons.register` |
| `plugin.json` | Manifeste du plugin |
| `scripts/mappings.mjs` | Associations extensions / fichiers / dossiers → icône |
| `scripts/build.mjs` | Découpe le sprite en SVG et génère les JSON |
| `file_icons.json` / `folder_icons.json` | Tables générées |
| `icons/` | SVG générés : toutes les icônes Devicons + icônes de dossier génériques |
| `plugin.zip` | Archive installable |

## Licences

Code du plugin : Apache-2.0 ([LICENSE](LICENSE)), adapté de l'[exemple officiel d'Acode](https://github.com/Acode-Foundation/acode-icon-plugin-example).
Icônes : [Devicons](https://github.com/vorillaz/devicons) de Theodore Vorillas, licence MIT ([LICENSE-devicons](LICENSE-devicons)). Les logos restent la propriété de leurs détenteurs respectifs.
