// Student Portal server
// Runs on port 3000 and serves only student pages.
const path = require('path');
const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Student Portal running at http://localhost:${PORT}`);
});
