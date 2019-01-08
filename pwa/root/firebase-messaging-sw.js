// JavaScript source code
var cacheName = 'weatherPWA-step-6-1';
var dataCacheName = 'weatherData-v1';
var fontCacheName = 'FontCache';
var filesToCache = ['/',
    '/index.html',
    '/scripts/app.js',
    '/styles/inline.css',
    '/images/clear.png',
    '/images/cloudy-scattered-showers.png',
    '/images/cloudy.png',
    '/images/fog.png',
    '/images/ic_add_white_24px.svg',
    '/images/ic_refresh_white_24px.svg',
    '/images/partly-cloudy.png',
    '/images/rain.png',
    '/images/scattered-showers.png',
    '/images/sleet.png',
    '/images/snow.png',
    '/images/thunderstorm.png',
    '/images/wind.png'];



importScripts('/__/firebase/5.5.6/firebase-app.js');
importScripts('/__/firebase/5.5.6/firebase-messaging.js');
importScripts('/__/firebase/init.js');

var messaging = firebase.messaging();
console.log(messaging);
messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  var notificationTitle ='Hey!'//payload['data']['notification']['title'];
  var notificationOptions = {
    body: 'Background Message body.',
    icon: '/images/icons/icon-144x144.png'
  };
  return self.registration.showNotification(notificationTitle,notificationOptions);
});


self.addEventListener('install', function (e) {
    console.log('[service Worker] Installation');
    e.waitUntil(caches.open(cacheName).then(function (cache) {
        console.log('[service Worker] caching app shell');
        cache.addAll(filesToCache);
    }));
});

self.addEventListener('activate', function (e) {
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== cacheName && key !== dataCacheName) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});
self.addEventListener('fetch', function (e) {
    console.log('[Service Worker] Fetch', e.request.url);
    var dataUrl = 'https://query.yahooapis.com/v1/public/yql';
    var fontUrl = 'https://fonts.googleapis.com';
    if (e.request.url.indexOf(dataUrl) > -1) {
        /*
         * When the request URL contains dataUrl, the app is asking for fresh
         * weather data. In this case, the service worker always goes to the
         * network and then caches the response. This is called the "Cache then
         * network" strategy:
         * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
         */
        e.respondWith(
            caches.open(dataCacheName).then(function (cache) {
                return fetch(e.request).then(function (response) {
                    cache.put(e.request.url, response.clone());
                    return response;
                });
            })
        );
    }
    else if (e.request.url.indexOf(fontUrl) > -1) {
        e.respondWith(caches.open(fontCacheName).then(function (cache) {
            return fetch(e.request).then(function (response) {
                cache.put(e.request.url, response.clone());
                return response;
            });
        })
        );
    }
    else {
        /*
         * The app is asking for app shell files. In this scenario the app uses the
         * "Cache, falling back to the network" offline strategy:
         * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
         */
        e.respondWith(
            caches.match(e.request).then(function (response) {
                return response || fetch(e.request);
            })
        );
    }
});


