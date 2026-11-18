const CACHE = 'atril-pwa-v1';

const NUCLEO = [
  './',
  './index.html',
  './practica.html',
  './lecciones.html',
  './estilo.css',
  './practica.css',
  './lecciones.css',
  './app.js',
  './cifrado.js',
  './curriculo.js',
  './guitarra.js',
  './lecciones-datos.js',
  './lecciones-ministrar.js',
  './lecciones.js',
  './metodo.js',
  './piano.js',
  './practica.js',
  './practicar.js',
  './rollo.js',
  './sonido.js',
  './transportar.js',
  './visuales.js',
  './manifest.json',
  './icono-192.png',
  './icono-512.png',
  './icono-maskable-512.png',
  './silencio.mp4',
  './silencio.webm',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(NUCLEO)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Las llamadas a la API local y las peticiones por rango de los MP3 de pistas
  // van directo por red para no interferir con la sincronia ni con los saltos (206).
  if (url.pathname.includes('/api/') || url.pathname.includes('/tono/')) return;
  if (req.headers.has('range')) return;
  if (url.pathname.includes('/canciones/') && url.pathname.endsWith('.mp3')) return;

  // Red primero con respaldo en cache: siempre trae los acordes e interfaz mas
  // recientes cuando hay conexion, y funciona sin conexion con lo ya guardado.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
