self.addEventListener('install', (event) => {
  self.skipWaiting(); // Bekleme yapma, direkt yüklen
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Hemen kontrolü ele al
});

// v2

