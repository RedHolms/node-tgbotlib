import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["./src/index.ts"],
  outfile: "./dist/index.js",
  platform: "node",
  bundle: true,
  minify: true,
  packages: "external",
  format: "esm"
});
