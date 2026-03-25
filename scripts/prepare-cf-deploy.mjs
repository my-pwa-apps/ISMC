/**
 * Prepares the Cloudflare Pages deployment directory.
 *
 * @opennextjs/cloudflare outputs:
 *   .open-next/worker.js          — unbundled Worker entry point
 *   .open-next/assets/            — static assets (_next/static, public files…)
 *   .open-next/cloudflare/        — imported by worker.js (images.js, init.js…)
 *   .open-next/middleware/        — imported by worker.js (handler.mjs)
 *   .open-next/server-functions/  — imported by worker.js (default/handler.mjs)
 *   .open-next/.build/            — Durable Object stubs (optional)
 *
 * CF Pages _worker.js advanced mode bundles the entry point via esbuild and
 * resolves imports relative to pages_build_output_dir. So we merge everything
 * into .open-next/deploy/ → that path becomes pages_build_output_dir.
 *
 *   .open-next/deploy/
 *     _worker.js          ← renamed from worker.js (CF Pages entry point)
 *     <static assets>     ← merged from assets/ so /_next/static/… works
 *     cloudflare/         ← worker companion modules
 *     middleware/
 *     server-functions/
 *     .build/             (if present)
 */

import { cpSync, existsSync, mkdirSync, copyFileSync, rmSync, writeFileSync } from "node:fs";

const openNext = ".open-next";
const deploy = `${openNext}/deploy`;

// Start fresh
if (existsSync(deploy)) rmSync(deploy, { recursive: true });
mkdirSync(deploy, { recursive: true });

// 1. Static assets → root of deploy (so /_next/static/… is served correctly)
const assets = `${openNext}/assets`;
if (existsSync(assets)) {
  cpSync(assets, deploy, { recursive: true });
  console.log("✓ Copied static assets");
}

// 2. Worker entry point → _worker.js
const workerSrc = `${openNext}/worker.js`;
copyFileSync(workerSrc, `${deploy}/_worker.js`);
console.log("✓ Placed _worker.js");

// 3. Worker companion modules (needed by esbuild when bundling _worker.js)
for (const dir of ["cloudflare", "middleware", "server-functions", ".build", "cloudflare-templates"]) {
  const src = `${openNext}/${dir}`;
  if (existsSync(src)) {
    cpSync(src, `${deploy}/${dir}`, { recursive: true });
    console.log(`✓ Copied ${dir}/`);
  }
}

// 4. _routes.json — bypass the Worker for static assets so CF Pages serves
//    them directly with correct MIME types (text/css, application/javascript…).
//    Without this, ALL requests hit _worker.js including /_next/static/*, and
//    the Worker returns a 404 HTML page (wrong MIME type, browser rejects it).
const routesJson = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/_next/static/*",
    "/favicon.ico",
  ],
};
writeFileSync(`${deploy}/_routes.json`, JSON.stringify(routesJson, null, 2));
console.log("✓ Written _routes.json");

console.log(`\nDeploy directory ready: ${deploy}`);
