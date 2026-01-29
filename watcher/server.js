const http = require('http');
const fs = require('fs');
const path = require('path');

// === CONFIGURE THESE ===
const PORT = process.env.PORT || 3333;
const REACT_DIR = process.env.REACT_DIR || path.join(__dirname, '../dist');
const STATE_FILE = process.env.STATE_FILE || path.join(__dirname, 'state.json');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  let filePath = req.url.split('?')[0];
  
  // Serve state.json from face/ folder
  if (filePath === '/state.json') {
    fs.readFile(STATE_FILE, (err, data) => {
      if (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ state: 'idle', activity: '' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }
  
  // Serve static files from React dist
  if (filePath === '/') filePath = '/index.html';
  
  const fullPath = path.join(REACT_DIR, filePath);
  const ext = path.extname(filePath);
  
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 Claude Face running at http://localhost:${PORT}`);
  console.log(`   React: ${REACT_DIR}`);
  console.log(`   State: ${STATE_FILE}`);
});
