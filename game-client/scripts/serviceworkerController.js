if (navigator.serviceWorker){
    // REGISTER THE SERVICE WORKER, IF A SERVICE WORKER ALREADY EXISTS AND IT'S CURRENT, THEN THE EXISTING INSTANCE IS RETURNED
    navigator.serviceWorker.register('/serviceworker.js', { scope: '/'}).then(function(registration){
        console.log('ServiceWorker registration successful with scope: ', registration.scope);

        if (navigator.serviceWorker.controller) {   

            // CHECK IF NOTIFICATION PERMISSION IS GRANTED
            if(Notification && Notification.permission === 'default') {
                Notification.requestPermission(function (permission) {
                   if(!('permission' in Notification)) {
                     Notification.permission = permission;
                   }
                });
            }
            // IF THE NEW SERVICE WORKER HAS BEEN SUCCESSFULLY INSTALLED, WE'LL SEND A MESSAGE TO THE USER ASKING IF WE CAN
            // ACTIVATE THE NEW SERVICE WORKER SO IT CAN CONTROL THE CLIENTS
            if (registration.waiting) {
                updateReady(registration.waiting);
            }
            // IF A NEW SERVICE WORKER IS BEING INSTALLED, WE WAIT UNTIL THE STATE CHANGES TO INSTALLED, AND THEN WE'LL SEND
            // A MESSAGE TO THE USER ASKING IF WE CAN ACTIVATE THE NEW SERVICE WORKER SO IT CAN CONTROL THE CLIENTS
            else if (registration.installing) {
                trackInstalling(registration.installing);
            }
            // IF A NEW SERVICE WORKER EXISTS, WE WAIT UNTIL THE SERVICE WORKER IS INSTALLED, AND THEN WE'LL SEND
            // A MESSAGE TO THE USER ASKING IF WE CAN ACTIVATE THE NEW SERVICE WORKER SO IT CAN CONTROL THE CLIENTS
            else {
                registration.addEventListener('updatefound', function() {
                    trackInstalling(registration.installing);
                });
            }
        }

    }).catch(function(err) {
        // IF REGISTRATION FAILS, WE'LL LOG AN ERROR
        console.log('ServiceWorker registration failed: ', err);
    });
}

trackInstalling = function(worker) {
    console.log('A new ServiceWorker is installing');
    worker.addEventListener('statechange', function() {
      // CHECK IF THE SERVICE WORKER HAS BEEN INSTALLED 
      if (worker.state == 'installed') {
       updateReady(worker);
      }
    });
  };
  
updateReady = function (worker){
    console.log('A new ServiceWorker is waiting');
    // IF HIRZAMITZ.COM IS ALLOWED TO SEND NOTIFICATION, DISPLAY THE SKIP WAITING NOTIFICATION
    if (Notification.permission === 'granted') {
        var notification = new Notification('New ServiceWorker is Ready', {
            icon: 'images/Icon-512.png',
            body: 'Click close to update',
            tag: 'updateSW',
        });
        setTimeout(notification.close.bind(notification), 10000);
        notification.onclick = function(event) {
            worker.postMessage({
                action: 'skipWaiting'
            });
            window.console.log('Send skipWaiting message from onclick');
          }
        notification.onclose = function(event) {
            worker.postMessage({
                action: 'skipWaiting'
            });
            window.console.log('Send skipWaiting message from onclose');
        }
        notification.onerror = function(error){
            window.console.log('Notification error: ', error);
        }  
    }
};


