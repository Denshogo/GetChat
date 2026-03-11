import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

function listJavaScriptFiles(dir, collector = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      listJavaScriptFiles(fullPath, collector);
      continue;
    }

    if (entry.endsWith(".js") || entry.endsWith(".mjs")) {
      collector.push(fullPath);
    }
  }

  return collector;
}

const root = process.cwd();
const files = [
  ...listJavaScriptFiles(join(root, "app")),
  ...listJavaScriptFiles(join(root, "server")),
  ...listJavaScriptFiles(join(root, "scripts")),
].sort();
if (files.length === 0) {
  throw new Error("No JavaScript files found under app/");
}

let hasError = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    hasError = true;
    console.error(`Syntax check failed: ${relative(root, file)}`);
    if (result.stderr) {
      console.error(result.stderr.trim());
    }
  }
}

if (hasError) {
  process.exit(1);
}

console.log(`Syntax check passed: ${files.length} files`);
