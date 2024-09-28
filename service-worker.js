const CACHE_NAME = 'gestor-gastos-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-gastos') {
    event.waitUntil(syncGastos());
  }
});

function syncGastos() {
  return getAllGastos().then(gastos => {
    return Promise.all(gastos.map(gasto => {
      return syncGasto(gasto);
    }));
  });
}

function getAllGastos() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gestor-gastos-db', 1);
    request.onerror = reject;
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['gastos'], 'readonly');
      const store = transaction.objectStore('gastos');
      const getAllRequest = store.getAll();
      getAllRequest.onerror = reject;
      getAllRequest.onsuccess = function(event) {
        resolve(event.target.result);
      };
    };
  });
}

function syncGasto(gasto) {
  // Aquí iría la lógica para sincronizar el gasto con el servidor
  // Por ahora, solo simularemos una sincronización exitosa
  console.log('Sincronizando gasto:', gasto);
  return Promise.resolve();
}

self.addEventListener('periodicsync', function(event) {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

function updateContent() {
  // Aquí iría la lógica para actualizar el contenido en segundo plano
  console.log('Actualizando contenido en segundo plano');
  return Promise.resolve();
}

self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: 'icon-192x192.png',
    badge: 'icon-192x192.png'
  };

  event.waitUntil(
    self.registration.showNotification('Gestor de Gastos', options)
  );
});