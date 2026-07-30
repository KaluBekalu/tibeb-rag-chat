import * as esbuild from "esbuild";

const opts = {
  entryPoints: ["widget/src/widget.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2019",
  outfile: "public/widget.js",
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const ctx = await esbuild.context(opts);
  await ctx.watch();
} else {
  await esbuild.build(opts);
}
