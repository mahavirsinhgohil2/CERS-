(function () {
  const localBase = 'http://localhost:5000';
  const deployedBase = 'https://YOUR-RENDER-BACKEND.onrender.com';
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  window.API_BASE = window.API_BASE || (isLocalHost ? localBase : deployedBase);
  window.STUDENT_API_BASE = window.STUDENT_API_BASE || window.API_BASE;
})();