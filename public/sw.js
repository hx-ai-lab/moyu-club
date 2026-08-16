const CACHE = 'moyu-club-v3'
const BASE = new URL('./', self.location).pathname
const INDEX = `${BASE}index.html`
const CORE = [BASE, INDEX, `${BASE}manifest.webmanifest`, `${BASE}icons/icon.svg`, `${BASE}pwa-assets.json`]

self.addEventListener('install', event => event.waitUntil((async () => {
  const response = await fetch(`${BASE}pwa-assets.json`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to load the PWA asset manifest')
  const assets = await response.json()
  const cache = await caches.open(CACHE)
  await cache.addAll([...new Set([...CORE, ...assets.map(asset => `${BASE}${asset}`)])])
  await self.skipWaiting()
})()))

self.addEventListener('activate', event => event.waitUntil((async () => {
  await self.clients.claim()
  await Promise.all((await caches.keys()).filter(key => key.startsWith('moyu-club-') && key !== CACHE).map(key => caches.delete(key)))
})()))

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(INDEX).then(cached => cached || fetch(event.request))))
    return
  }
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()))
    return response
  })))
})

self.addEventListener('message', event => {
  if (event.data?.type === 'GET_DEBUG_INFO') event.source?.postMessage({ type: 'SW_DEBUG_INFO', cacheVersion: CACHE, scope: self.registration.scope })
})
