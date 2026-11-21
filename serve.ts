import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./game/', import.meta.url));
const port = Number(process.env.PORT || 8080);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
createServer((request, response) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(request.url || '/', 'http://local').pathname));
    if (path !== root.slice(0, -1) && !path.startsWith(root)) throw new Error('Outside game');
    const file = statSync(path).isDirectory() ? resolve(path, 'index.html') : path;
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    response.end(readFileSync(file));
  } catch {
    response.writeHead(404); response.end('Not found');
  }
}).listen(port, () => console.log(`VICE HARBOR: http://localhost:${port}`));
