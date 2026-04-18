(function () {
  const apiBase =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : 'https://cers-4occ.onrender.com';

  window.API_BASE = apiBase;
})();