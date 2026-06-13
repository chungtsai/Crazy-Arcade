const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const WebSocket = require('ws');


const PORT = 3000;

// Simple mime types lookup
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

// Create HTTP Server to serve static files
const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  // Remove query parameters
  const qMarkIndex = filePath.indexOf('?');
  if (qMarkIndex !== -1) {
    filePath = filePath.substring(0, qMarkIndex);
  }

  filePath = path.resolve(filePath);
  const rootPath = path.resolve('.');

  // Prevent directory traversal attacks
  if (!filePath.startsWith(rootPath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocket.Server({ server });

let rooms = {}; // roomCode -> { players: [ws1, ws2], state: 'lobby'|'playing' }

wss.on('connection', (ws) => {
  ws.roomCode = null;
  ws.playerId = null;
  ws.role = null; // 'p1' or 'p2'

  ws.on('message', (messageText) => {
    try {
      const data = JSON.parse(messageText);
      
      if (data.type === 'join_lobby') {
        let roomCode = 'default_room';
        if (!rooms[roomCode]) {
          rooms[roomCode] = { players: [], state: 'lobby', selectedChars: {} };
        }
        
        const room = rooms[roomCode];
        
        if (room.players.length >= 4) {
          ws.send(JSON.stringify({ type: 'error', message: '房間已滿，請稍後再試。' }));
          return;
        }

        ws.roomCode = roomCode;
        room.players.push(ws);
        
        // Find the first available role from p1, p2, p3, p4
        const existingRoles = room.players.map(p => p.role).filter(Boolean);
        let role = 'p1';
        for (let i = 1; i <= 4; i++) {
          if (!existingRoles.includes('p' + i)) {
            role = 'p' + i;
            break;
          }
        }
        ws.role = role;
        ws.playerId = ws.role;

        // Send confirmation back
        ws.send(JSON.stringify({
          type: 'joined',
          role: ws.role,
          roomCode: roomCode,
          playerId: ws.playerId
        }));

        // Broadcast status to room
        broadcastToRoom(roomCode, {
          type: 'room_status',
          playerCount: room.players.length,
          roles: room.players.map(p => p.role)
        });
      }
      
      else if (data.type === 'select_char') {
        if (ws.roomCode && rooms[ws.roomCode]) {
          const room = rooms[ws.roomCode];
          if (!room.selectedChars) room.selectedChars = {};
          room.selectedChars[ws.role] = data.char;
          
          // Relay character selection to other players with sender info
          data.role = ws.role;
          broadcastToRoom(ws.roomCode, data, ws);
        }
      }
      
      else if (data.type === 'start_game') {
        if (ws.roomCode && rooms[ws.roomCode] && ws.role === 'p1') {
          const room = rooms[ws.roomCode];
          room.state = 'playing';
          
          // Ensure all players have a selected character
          if (!room.selectedChars) room.selectedChars = {};
          room.players.forEach(p => {
            if (!room.selectedChars[p.role]) {
              room.selectedChars[p.role] = 'dao'; // default fallback
            }
          });

          broadcastToRoom(ws.roomCode, {
            type: 'start_game',
            selectedChars: room.selectedChars,
            selectedMap: data.selectedMap
          });
        }
      }

      else {
        // Relay message to other players in the same room with sender's role
        if (ws.roomCode && rooms[ws.roomCode]) {
          data.role = ws.role;
          broadcastToRoom(ws.roomCode, data, ws);
        }
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    if (ws.roomCode && rooms[ws.roomCode]) {
      const room = rooms[ws.roomCode];
      room.players = room.players.filter(p => p !== ws);
      if (room.selectedChars) {
        delete room.selectedChars[ws.role];
      }
      
      if (room.players.length === 0) {
        delete rooms[ws.roomCode];
      } else {
        // Notify remaining players
        broadcastToRoom(ws.roomCode, {
          type: 'player_disconnected',
          role: ws.role
        });
        // Broadcast updated room status
        broadcastToRoom(ws.roomCode, {
          type: 'room_status',
          playerCount: room.players.length,
          roles: room.players.map(p => p.role)
        });
        room.state = 'lobby';
      }
    }
  });
});

function broadcastToRoom(roomCode, data, excludeWs = null) {
  const room = rooms[roomCode];
  if (!room) return;
  
  const msg = JSON.stringify(data);
  room.players.forEach(p => {
    if (p !== excludeWs && p.readyState === WebSocket.OPEN) {
      p.send(msg);
    }
  });
}

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      const isIPv4 = iface.family === 'IPv4' || iface.family === 4;
      if (isIPv4 && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIpAddresses();
  console.log(`===================================================`);
  console.log(`爆爆王區域網路伺服器啟動成功！`);
  console.log(`本機遊玩請在瀏覽器輸入： http://localhost:${PORT}`);
  console.log(`區域網路中其他玩家請輸入伺服器的 IP 地址：`);
  if (localIps.length > 0) {
    localIps.forEach(ip => {
      console.log(`   http://${ip}:${PORT}`);
    });
  } else {
    console.log(`   http://<您的電腦IP>:${PORT}`);
  }
  console.log(`===================================================`);
});
