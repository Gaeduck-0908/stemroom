const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "apps", "web");
const contentTypes = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

http.createServer((request, response) => {
  const urlPath = decodeURIComponent(request.url.split("?")[0]);
  const safePath = path.normalize(urlPath).replace(/^([.][.][/\\])+/, "");
  const requested = urlPath === "/" ? "index.html" : safePath.replace(/^[/\\]+/, "");
  const file = path.join(root, requested);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404); response.end("Not found"); return;
  }
  response.writeHead(200, { "Content-Type": contentTypes[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
}).listen(4173, "127.0.0.1", () => console.log("Stemroom UI: http://localhost:4173"));

