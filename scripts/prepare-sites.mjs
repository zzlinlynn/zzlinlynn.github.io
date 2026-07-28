import { cp, mkdir, writeFile } from "node:fs/promises";

const outputDirectory = new URL("../dist/server/", import.meta.url);
const distDirectory = new URL("../dist/", import.meta.url);
const workerEntry = `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
`;

await mkdir(outputDirectory, { recursive: true });
await writeFile(new URL("index.js", outputDirectory), workerEntry);

await Promise.all([
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
