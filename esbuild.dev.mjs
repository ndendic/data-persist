import * as esbuild from "esbuild";
import config from "./esbuild.config.mjs";

let ctx = await esbuild.context(config);

await ctx.watch();

let { port } = await ctx.serve({ servedir: ".", port: 8080 });

console.log(`Listening on http://localhost:${port}`);
