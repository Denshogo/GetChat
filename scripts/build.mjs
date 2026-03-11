import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const appDir = join(root, "app");
const serverDir = join(root, "server");
const distDir = join(root, "dist");

if (!existsSync(appDir)) {
  throw new Error("app directory not found");
}

if (!existsSync(serverDir)) {
  throw new Error("server directory not found");
}

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}

mkdirSync(distDir, { recursive: true });
cpSync(appDir, join(distDir, "app"), { recursive: true });
cpSync(serverDir, join(distDir, "server"), { recursive: true });

console.log("Build completed: dist/");
