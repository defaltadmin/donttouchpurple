const CACHE_NAME = 'dtp-v__SW_VERSION__-core';
const BG_CACHE = 'dtp-v__SW_VERSION__-bg';
const STATIC_CACHE = 'dtp-v__SW_VERSION__-static';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

function openScoreDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('dtp-pending-scores', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pendingScores')) {
        db.createObjectStore('pendingScores', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(c => c.addAll(CORE_ASSETS)),
      caches.open(BG_CACHE)
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== BG_CACHE && k !== STATIC_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'dtp-score-submit') {
    event.waitUntil(
      (async () => {
        try {
          const db = await openScoreDb();
          const allScores = await new Promise<any[]>((resolve, reject) => {
            const tx = db.transaction('pendingScores', 'readonly');
            const req = tx.objectStore('pendingScores').getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });

          for (const score of allScores) {
            try {
              // Validate score data from IndexedDB before using it
              const safeScore = Math.max(0, Math.min(9999, parseInt(score.score, 10) || 0));
              const safeInitials = String(score.initials || 'ANON').replace(/[^a-zA-Z0-9_ ]/g, '').slice(0, 8);
              const safeMode = ['classic', 'evolve'].includes(score.mode) ? score.mode : 'classic';
              const payload = {
                score: safeScore,
                initials: safeInitials,
                mode: safeMode,
                tick: typeof score.tick === 'number' ? score.tick : 0,
                sessionId: typeof score.sessionId === 'string' ? score.sessionId.slice(0, 64) : `sw-${Date.now()}`
              };
              // Only submit to same-origin endpoint
              const endpoint = new URL('/api/submit-score', self.location.origin).href;
              const res = await fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
              });
              if (res.ok) {
                const tx = db.transaction('pendingScores', 'readwrite');
                tx.objectStore('pendingScores').delete(score.id);
                await new Promise(r => { tx.oncomplete = r; });
              }
            } catch (e) {
              console.error('[SW] Sync failed for score', score.id, e);
            }
          }
          db.close();
        } catch (e) {
          console.error('[SW] Sync handler error', e);
        }
      })()
    );
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // HTML navigation: network-first so deploys are picked up immediately
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          if (resp.status === 200) {
            caches.open(STATIC_CACHE).then(c => c.put(event.request, resp.clone()));
          }
          return resp;
        })
        .catch(() => caches.match(event.request).then(c => c || fetch(event.request)))
    );
    return;
  }

  if (url.pathname.match(/\.(js|css|png|svg|webp|woff2|json)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return resp;
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkResp => {
        if (networkResp.status === 200) {
          caches.open(CACHE_NAME).then(c => c.put(event.request, networkResp.clone()));
        }
        return networkResp;
      });
      return cached || fetchPromise;
    })
  );
});
