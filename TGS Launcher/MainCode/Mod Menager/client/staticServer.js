const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3793;
const HOST = '127.0.0.1';

let server = null;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function startStaticServer(rootDir) {
  const root = path.resolve(rootDir);

  return new Promise((resolve, reject) => {
    if (server) {
      resolve(`http://${HOST}:${PORT}`);
      return;
    }

    server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
        let relative = urlPath === '/' ? '/login.html' : urlPath;
        const filePath = path.normalize(path.join(root, relative.replace(/^\//, '')));

        if (!filePath.startsWith(root)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
          res.end(data);
        });
      } catch {
        res.writeHead(500);
        res.end('Error');
      }
    });

    server.listen(PORT, HOST, () => {
      resolve(`http://${HOST}:${PORT}`);
    });

    server.on('error', reject);
  });
}

function stopStaticServer() {
  if (server) {
    server.close();
    server = null;
  }
}

module.exports = { startStaticServer, stopStaticServer, PORT };
