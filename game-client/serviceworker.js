var staticHostName = 'WordPlay';
var staticCacheName = staticHostName + '-static-v1';

var SERVER_URL = 'https://hp-word-guessing-game.herokuapp.com';
var DICTIONARY_URL = SERVER_URL + '/words?difficulty=';
var LEADERBOARD_URL = SERVER_URL + '/leaderboard';
var ADDSCORE_URL = SERVER_URL + '/addscore';

// A LIST OF RESOURCES WE WANT TO BE CACHED IN THE BACKGROUND
const PRECACHE_URLS_BK = [
  DICTIONARY_URL + '1',
  DICTIONARY_URL + '2',
  DICTIONARY_URL + '3',
  DICTIONARY_URL + '4',
  DICTIONARY_URL + '5',
  DICTIONARY_URL + '6',
  DICTIONARY_URL + '7',
  DICTIONARY_URL + '8',
  DICTIONARY_URL + '9',
  DICTIONARY_URL + '10',
  LEADERBOARD_URL,
];

// A LIST OF LOCAL RESOURCES WE ALWAYS WANT TO BE CACHED
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/scripts/serviceworkerController.js',
  '/scripts/idb.js',
  '/scripts/app.js',
  '/stylesheets/app.css',
  '/stylesheets/fonts/Baloo_Bhai/BalooBhai-Regular.ttf',
  '/stylesheets/fonts/Chango/Chango-Regular.ttf',
  '/favicon.ico',
  '/manifest.json',
  '/images/Icon-512.png'
];

// ADD THE RESOURCES TO THE CACHE WHEN THE SERVICE WORKER IS INSTALLED
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      // WE ARE CACHING SOME OF THE ITEMS HERE SO THEY'LL GET ADDED TO THE CACHE IN THEIR OWN GOOD TIME AND WILL NOT
      // DELAY THE INSTALLATION OF THE SERVICE WORKER.
        cache.addAll(PRECACHE_URLS_BK);
      // THE ITEMS BELOW ARE PART OF THE RETURN STATEMENT FOR THE PROMISE CREATED BY CACHES.OPEN. SINCE THE SERVICE WORKER
      // WILL NOT INSTALL UNTIL ALL THESE ITEMS ARE IN THE CACHE, WE TRY TO KEEP THEM TO A MINIMUM.
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

// THIS FIRES ONCE THE OLD SERVICE WORKER IS GONE, AND YOUR NEW SERVICE WORKER IS ABLE TO CONTROL THE CLIENT
// AT THIS POINT, WE CAN DELETE THE OLD CACHE
self.addEventListener('activate', function(event) {
    event.waitUntil(
        self.clients.claim(),
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                return cacheName.startsWith(staticHostName + '-') &&
                        cacheName != staticCacheName;
                }).map(function(cacheName) {
                return caches.delete(cacheName);
                })
            );
        })
    );
});

// THIS INTERCEPTS THE REQUESTS MADE TO THE DOMAIN
self.addEventListener('fetch', function (event) {

  var request = event.request;
  var requestMethod = request.method;
  var requestUrl = new URL(request.url);

  if (requestUrl.origin === SERVER_URL){
    if (requestMethod == 'POST'){
        return;
    }
    if (requestMethod == 'GET'){
        // Fetch the leaderboard from cache
        if (requestUrl.pathname.startsWith('/leaderboard')){
            event.respondWith(
                // Fetch the leaderboard from the network
                fetch(request)
                .then(function(response) {
                    return caches.open(staticCacheName)
                        .then(function(cache) {
                        // Put in cache if succeeds
                        cache.put(requestUrl, response.clone());
                        return response;
                        })
                })
                .catch(function(error) {
                    // Fallback to cache if a fetch error occurs
                    return caches.match(request)
                        .then(function (response) {
                            return response;
                        })
                })
            );
        }
        return;
    }
  }

  // FOR HTML REQUESTS
  if (request.headers.get('Accept').indexOf('text/html') !== -1) {
      event.respondWith(
          fetch(request)
              .then(function (response) {
                // CHECK THE CACHE FIRST  
                if (response) {
                    return response;
                }  
                // OTHERWISE, FETCH FROM THE NETWORK, IF AVAILABLE
                return fetch(request);
              })
              .catch(function () {
                  return caches.match(request)
                      .then(function (response) {
                          return response;
                      })
              })
      );
      return;
  }

  

  // FOR NON-HTML REQUESTS
  event.respondWith(
      caches.match(request)
          .then(function (response) {
                if (response) {
                    return response;
                }  
                // OTHERWISE, FETCH FROM THE NETWORK, IF AVAILABLE
                return fetch(request);
          }).catch(function () {
            return caches.match(request)
                .then(function (response) {
                    return response;
                })
        })
    );
});

// THIS MESSAGE WILL CAUSE THE SERVICE WORKER TO KICK OUT THE CURRENT ACTIVE WORKER AND ACTIVATE ITSELF
self.addEventListener('message', function (event) {
    console.log('skipWaiting message is received ' + event.data.action)
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});


