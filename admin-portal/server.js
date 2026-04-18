// Admin Portal server
// Runs on port 4000 and serves only admin pages.
const path = require('path');
const express = require('express');

const app = express();
const PORT = 4000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`Admin Portal running at http://localhost:${PORT}`);
});
