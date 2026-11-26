const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });
let p1 = null, p2 = null;

wss.on('connection', (ws) => {
  if (!p1) { p1 = ws; ws.send(Buffer.from([1])); }
  else if (!p2) { p2 = ws; ws.send(Buffer.from([2])); }
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
