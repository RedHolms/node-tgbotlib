import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["./src/index.ts"],
  outfile: "./dist/index.js",
  platform: "node",
  bundle: true,
  packages: "external",
  treeShaking: true,
  format: "esm",
  sourcemap: "inline"
});
