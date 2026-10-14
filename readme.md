# Devicons pour Acode

Pack d'icônes de fichiers et dossiers pour [Acode](https://acode.app) basé sur [Devicon](https://devicon.dev) : les logos officiels des langages, frameworks et outils (JavaScript, Python, Rust, Docker, React, Git…).

- **Les 1877 SVG de Devicon 2.17.0** : les 578 technologies dans toutes leurs variantes (`original`, `plain`, `line`, `wordmark`), dans `icons/<nom>-<variante>.svg`
- **240+ extensions** (`.js`, `.py`, `.rs`, `.kt`, `.dart`, `.vue`…)
- **200+ noms de fichiers** (`package.json`, `Dockerfile`, `Cargo.toml`, `vite.config.ts`, `.gitignore`…)
- **830+ noms de dossiers** : les dossiers spéciaux (`.github`, `node_modules`, `.vscode`…) et un dossier par technologie, avec ses noms alternatifs (`docker/`, `react/`, `kubernetes/`, `arm64/`…)
- Les logos noirs (GitHub, Rust, Markdown, Vercel…) sont recolorés en gris pour rester lisibles sur les thèmes sombres.

## Installation

1. Télécharger [`plugin.zip`](plugin.zip).
2. Dans Acode : **Plugins → + → Local**, puis choisir le zip.
3. Sélectionner **Devicons** dans **Settings → App settings → Icon pack**.

Nécessite une version d'Acode qui inclut l'API plugin `fileIcons`.

## Développement

Les icônes et les tables d'associations sont générées depuis le paquet npm [`devicon`](https://www.npmjs.com/package/devicon) :

```sh
npm install
npm run build   # régénère icons/, file_icons.json et folder_icons.json
npm run pack    # build + crée plugin.zip
```

Pour ajouter une association, éditer [`scripts/mappings.mjs`](scripts/mappings.mjs) : chaque clé est le nom d'une icône Devicon (voir [devicon.dev](https://devicon.dev)), chaque valeur la liste des extensions, noms de fichiers ou noms de dossiers correspondants. Le build échoue si un nom d'icône n'existe pas ou si une même entrée est associée à deux icônes. Chaque technologie utilise sa variante `original` (sinon `plain`, puis les autres) ; `VARIANT_OVERRIDES` dans `scripts/build.mjs` permet d'en choisir une autre.

| Chemin | Rôle |
| --- | --- |
| `main.js` | Charge les tables JSON et enregistre le pack via `fileIcons.register` |
| `plugin.json` | Manifeste du plugin |
| `scripts/mappings.mjs` | Associations extensions / fichiers / dossiers → icône Devicon |
| `scripts/build.mjs` | Génère `icons/` et les JSON à partir de `devicon` |
| `file_icons.json` / `folder_icons.json` | Tables générées |
| `icons/` | SVG générés : toutes les variantes Devicon + icônes de dossier génériques |
| `plugin.zip` | Archive installable |

## Licences

Code du plugin : Apache-2.0 ([LICENSE](LICENSE)), adapté de l'[exemple officiel d'Acode](https://github.com/Acode-Foundation/acode-icon-plugin-example).
Icônes : [Devicon](https://github.com/devicons/devicon), licence MIT ([LICENSE-devicon](LICENSE-devicon)). Les logos restent la propriété de leurs détenteurs respectifs.
