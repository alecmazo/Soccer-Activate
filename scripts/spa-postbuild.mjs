import { copyFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const out = "dist-spa";
const index = join(out, "index.html");
if (existsSync(index)) {
  copyFileSync(index, join(out, "404.html"));
}
writeFileSync(join(out, ".nojekyll"), "");
console.log("[spa-postbuild] 404.html + .nojekyll ready");
