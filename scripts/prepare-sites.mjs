import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

const outputDirectory = new URL("../dist/server/", import.meta.url);
const distDirectory = new URL("../dist/", import.meta.url);
const builtPlayground = new URL("../dist/playground/index.html", import.meta.url);
const liveServerPlaygroundDirectory = new URL("../playground/", import.meta.url);
const workerEntry = `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
`;

const playgroundHtml = await readFile(builtPlayground, "utf8");
const liveServerPlaygroundHtml = playgroundHtml
  .replaceAll('"/_astro/', '"/dist/_astro/')
  .replaceAll("/assets/playground/", "/public/assets/playground/");

await Promise.all([
  mkdir(outputDirectory, { recursive: true }),
  mkdir(liveServerPlaygroundDirectory, { recursive: true })
]);
await writeFile(new URL("index.js", outputDirectory), workerEntry);

await Promise.all([
  // Live Server serves the repository root and cannot resolve Astro routes.
  writeFile(
    new URL("index.html", liveServerPlaygroundDirectory),
    liveServerPlaygroundHtml
  ),
  // The root static homepage is the canonical version used for deployment.
  cp(new URL("../index.html", import.meta.url), new URL("index.html", distDirectory)),
  cp(new URL("../main.js", import.meta.url), new URL("main.js", distDirectory)),
  cp(new URL("../about/", import.meta.url), new URL("about/", distDirectory), {
    recursive: true
  }),
  cp(
    new URL("../assets/about/", import.meta.url),
    new URL("assets/about/", distDirectory),
    { recursive: true }
  ),
  cp(new URL("../styles.css", import.meta.url), new URL("styles.css", distDirectory)),
  cp(
    new URL("../footer-canvas.js", import.meta.url),
    new URL("footer-canvas.js", distDirectory)
  )
]);
