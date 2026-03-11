import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { handleAiRoute } from "./api/aiRoute.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const appRoot = process.env.APP_ROOT ? join(root, process.env.APP_ROOT) : join(root, "app");
const port = Number(process.env.PORT ?? 8000);

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function resolveStaticPath(urlPathname) {
  const relativePath = urlPathname === "/" ? "/index.html" : urlPathname;
  const normalized = normalize(relativePath).replace(/^([.][.][/\\])+/, "");
  return join(appRoot, normalized);
}

function serveFile(res, filePath) {
  const type = CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `127.0.0.1:${port}`}`);

  if (url.pathname === "/api/ai") {
    await handleAiRoute(req, res);
    return;
  }

  const filePath = resolveStaticPath(url.pathname);
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  serveFile(res, filePath);
});

server.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}`);
});
