import * as esbuild from "esbuild";

const shared = { bundle: true, minify: true, format: "iife", target: "es2019", logLevel: "info" };
const targets = [
  { ...shared, entryPoints: ["widget/src/widget.ts"], outfile: "public/widget.js" },
  { ...shared, entryPoints: ["widget/src/page.ts"], outfile: "public/app.js" },
];

if (process.argv.includes("--watch")) {
  for (const t of targets) await (await esbuild.context(t)).watch();
} else {
  for (const t of targets) await esbuild.build(t);
}
