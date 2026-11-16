// Tiny static file server for the tests (no dependencies).
// Serves only the pages, assets/ and cv/, never node_modules or the tests.
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const types = {
    '.html': 'text/html; charset=utf-8',
    '.pdf': 'application/pdf',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/') p = '/index.html';
    const allowed =
        p === '/index.html' ||
        p === '/resume.html' ||
        p.startsWith('/cv/') ||
        p.startsWith('/assets/');
    const file = path.join(root, p);
    if (!allowed || !file.startsWith(root + path.sep) || !fs.existsSync(file)) {
        res.writeHead(404).end('Not found');
        return;
    }
    res.writeHead(200, {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
    });
    fs.createReadStream(file).pipe(res);
}).listen(4173, '127.0.0.1', () => {
    if (process.stdout.isTTY)
        console.log('Preview: http://127.0.0.1:4173  (Ctrl+C to stop)');
});
