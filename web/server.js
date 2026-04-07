const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// index.html must never be cached so users always get the latest bundle
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Hashed JS/CSS/image assets can be cached aggressively (filename changes on rebuild)
app.use('/_expo', express.static(path.join(__dirname, 'dist', '_expo'), {
  maxAge: '1y',
  immutable: true,
}));

// Other static files — short cache
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1h',
  etag: true,
}));

// SPA fallback — serve index.html for all non-file routes (no cache)
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MYKO Web UI running on port ${PORT}`);
});
