
var cache_name = 'tasks';
var files_to_cache = [
    '/',
    '/index.html',
    '/stylesheets/main.css',
    '/stylesheets/icofont/icofont.min.css',
    '/stylesheets/icofont/fonts/icofont.woff',
    '/stylesheets/icofont/fonts/icofont.woff2',
    '/img/logo.png',
    '/img/checkbox_checked.png',
    '/img/checkbox_empty.png',
    '/scripts/task_loader.js'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(cache_name).then(function (cache) {
            return cache.addAll(files_to_cache);
        })
    );
});

/* Serve cached content when offline */
self.addEventListener('fetch', function (e) {
    e.respondWith(
        caches.match(e.request).then(function (response) {
            return response || fetch(e.request);
        })
    );
});

/* Delete old caches on update */
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((key_list) => {
            return Promise.all(key_list.map((key) => {
                if (key !== cache_name) {
                    return caches.delete(key);
                }
            }));
        })
    );
});
