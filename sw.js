const C = 'cs61-herramientas-v8';
const PRE = ['./', './index.html', './registro/', './registro/index.html', './nutricion/', './nutricion/index.html', './consulta/', './consulta/index.html', './calculadora/', './calculadora/index.html', './recursos/', './recursos/index.html', './recursos/rec-sync.js', './egg.js', './recursos/ruleta/assets/audio/musica-fondo.mp3', './recursos/ruleta/assets/audio/cuenta-regresiva.mp3', './recursos/ruleta/', './recursos/ruleta/index.html', './recursos/ruleta/css/styles.css', './recursos/ruleta/js/config.js', './recursos/ruleta/js/data.js', './recursos/ruleta/js/app.js', './recursos/ruleta/assets/logo-cs61.jpg', './recursos/plato/', './recursos/plato/index.html', './manifest.webmanifest', './config.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => Promise.allSettled(PRE.map(u => c.add(u)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  const ok = u.origin === location.origin || u.hostname === 'cdnjs.cloudflare.com' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!ok) return;
  e.respondWith(fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(m => m || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
