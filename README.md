# Lynn Portfolio Site

Formal frontend scaffold for the July 2026 portfolio site.

## Structure

- `index.html`, `styles.css`, `main.js`, `footer-canvas.js`: canonical homepage deployed to production.
- `playground/index.html`: generated Live Server mirror of the Astro Playground route; refresh it with `npm run build`.
- `src/pages/index.astro`, `src/styles/global.css`, `src/scripts/home.js`: legacy Astro version retained for reference; the build replaces its homepage output with the canonical root files.
- `public/assets/`: assets served by Astro.

## Local Commands

```bash
npm install
npm run dev
```

The project is static-output first, matching the GitHub Pages deployment path in the site spec.
