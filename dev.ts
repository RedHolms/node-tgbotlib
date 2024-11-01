import { exec } from "node:child_process";
import type { ChildProcess } from "node:child_process";

import esbuild from "esbuild";

let testProcess: ChildProcess | undefined;

function shutdownProcess() {
  if (testProcess === undefined)
    return;

  testProcess.kill("SIGINT");
}

function startProcess() {
  testProcess = exec("npx tsx ./test/main.ts");
  testProcess.stdout!.pipe(process.stdout);
}

esbuild.context({
  entryPoints: ["./src/index.ts"],
  outfile: "./dist/index.js",
  platform: "node",
  bundle: true,
  minify: true,
  packages: "external",
  format: "esm",
  plugins: [{
    name: "run-test",
    setup(build) {
      build.onEnd((result) => {
        shutdownProcess();

        if (result.errors.length === 0)
          startProcess();
      });
    },
  }]
}).then((ctx) => ctx.watch());
