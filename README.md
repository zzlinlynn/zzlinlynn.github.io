# Lynn Portfolio Site

Formal frontend scaffold for the July 2026 portfolio site.

## Structure

- `index.html`, `styles.css`, `main.js`: static preview extracted from the preserved prototype checkpoint.
- `src/pages/index.astro`: Astro homepage using the same markup.
- `src/styles/global.css`: shared visual system and layout styles.
- `src/scripts/home.js`: homepage interaction, theme/language toggles, portrait particle rendering, cursor labels, and scroll effects.
- `public/assets/`: assets served by Astro.

## Local Commands

```bash
npm install
npm run dev
```

The project is static-output first, matching the GitHub Pages deployment path in the site spec.
