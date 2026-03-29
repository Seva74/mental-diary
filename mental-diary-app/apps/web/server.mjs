import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, 'dist');
const indexPath = join(distDir, 'index.html');

const port = Number(process.env.PORT || 80);
const apiTarget = process.env.API_TARGET || 'http://api:3001';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const readRequestBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

const writeProxyResponse = (response, proxyResponse) => {
  response.statusCode = proxyResponse.status;

  proxyResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding' || key.toLowerCase() === 'connection') {
      return;
    }

    response.setHeader(key, value);
  });

  if (!proxyResponse.body) {
    response.end();
    return;
  }

  Readable.fromWeb(proxyResponse.body).pipe(response);
};

const proxyRequest = async (request, response) => {
  const targetUrl = new URL(request.url || '/', apiTarget);
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await readRequestBody(request);

  try {
    const proxyResponse = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body
    });

    writeProxyResponse(response, proxyResponse);
  } catch {
    response.statusCode = 502;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify({ error: 'Failed to reach upstream API service' }));
  }
};

const serveStatic = async (request, response) => {
  const url = request.url || '/';
  const cleanedPath = normalize(url.split('?')[0]).replace(/^\/+/, '');
  const requestedPath = join(distDir, cleanedPath || 'index.html');

  try {
    const fileStats = await stat(requestedPath);

    if (fileStats.isFile()) {
      const extension = extname(requestedPath).toLowerCase();
      response.statusCode = 200;
      response.setHeader('Content-Type', mimeTypes[extension] || 'application/octet-stream');
      createReadStream(requestedPath).pipe(response);
      return;
    }
  } catch {
    // Fallback to index.html for SPA routes.
  }

  const index = await readFile(indexPath);
  response.statusCode = 200;
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(index);
};

createServer(async (request, response) => {
  if ((request.url || '').startsWith('/api/') || request.url === '/health') {
    await proxyRequest(request, response);
    return;
  }

  await serveStatic(request, response);
}).listen(port, () => {
  console.log(`Web container is listening on port ${port}`);
});
