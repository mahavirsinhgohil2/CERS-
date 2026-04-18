const isLocal = window.location.hostname === 'localhost'
             || window.location.hostname === '127.0.0.1';

const API_BASE = isLocal
  ? 'http://localhost:3000'
  : 'https://cers-4occ.onrender.com';

window.API_BASE = API_BASE;