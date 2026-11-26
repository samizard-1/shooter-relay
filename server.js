const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.wasm': 'application/wasm',
    '.data': 'application/octet-stream'
};

// 1. Serve the compiled web game files
const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, 'public', filePath);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found: ' + filePath);
            return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(content);
    });
});

// 2. Attach the WebSocket multiplayer relay to the same server
const wss = new WebSocket.Server({ server });
let p1 = null, p2 = null;

wss.on('connection', (ws) => {
    if (!p1) { p1 = ws; ws.send(Buffer.from()); }
    else if (!p2) { p2 = ws; ws.send(Buffer.from()); }
    else { ws.close(); return; }

    ws.on('message', (data) => {
        if (ws === p1 && p2 && p2.readyState === WebSocket.OPEN) p2.send(data);
        if (ws === p2 && p1 && p1.readyState === WebSocket.OPEN) p1.send(data);
    });

    ws.on('close', () => {
        if (ws === p1) p1 = null;
        if (ws === p2) p2 = null;
    });
});

server.listen(process.env.PORT || 8080);
