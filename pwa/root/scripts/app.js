// Copyright 2016 Google Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var isSubscribed = false;
var pushButton = document.querySelector('#butSubscribe');
var swRegistration = null;
const applicationServerPublicKey = 'BGcdDBag08O8cyoWC_b_RqH7k4nUPPA1rkhRvFRo70vMMQ - KsMepzqyuAVf_rrmz3_LbLW26eL - _WpavRYLcFL8';
let showPrompt;
(function () {
    'use strict';

    var app = {
        isLoading: true,
        visibleCards: {},
        selectedCities: [],
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialog: document.querySelector('.dialog-container'),
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    };


    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    
    
     /*function install(showPrompt){
        showPrompt.prompt();
        showPrompt.userChoice
          .then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the A2HS prompt');
              gtag('event','click',{'event_category':"homescreen",'event_action':"accepted"});
            } else {
              console.log('User dismissed the A2HS prompt');
            }
            showPrompt = null;
    });
    }
    
   */
    
    window.addEventListener('beforeinstallprompt',(event)=>{
        event.preventDefault();
        showPrompt=event
        console.log('beforeInstallPrompt');
        document.querySelector('#HomescreenBtn').style.display='block';
      //  setTimeout(install(event),3000);
    });
    
   
    
    
    window.addEventListener('appinstalled',(event)=>{
      console.log('Already Added to HomeScreen');  
    })
    
    
    document.querySelector('#HomescreenBtn').addEventListener('click',(event)=>{
         showPrompt.prompt();
        showPrompt.userChoice
          .then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the A2HS prompt');
              gtag('event','click',{'event_category':"homescreen",'event_action':"accepted"});
            } else {
              console.log('User dismissed the A2HS prompt');
            }
            showPrompt = null;
    });
    });

    document.getElementById('Tok').addEventListener('click', function () {
        // Refresh all of the forecasts
        deleteToken();
    });

    document.getElementById('Per').addEventListener('click', function () {
        // Refresh all of the forecasts
        requestPermission()
    });
    
    document.getElementById('butRefresh').addEventListener('click', function () {
        // Refresh all of the forecasts
        app.updateForecasts();
    });
    
    document.getElementById('butAdd').addEventListener('click', function () {
        // Open/show the add new city dialog
        app.toggleAddDialog(true);
    });

    document.getElementById('butAddCity').addEventListener('click', function () {
        // Add the newly selected city
        var select = document.getElementById('selectCityToAdd');
        var selected = select.options[select.selectedIndex];
        var key = selected.value;
        var label = selected.textContent;
        // TODO init the app.selectedCities array here
        if (!app.selectedCities) {
            app.selectedCities=[]
        }
        app.getForecast(key, label);
        // TODO push the selected city to the array and save here
        app.selectedCities.push({ key: key, label: label });
        app.saveSelectedCities();
        app.toggleAddDialog(false);
    });

    document.getElementById('butAddCancel').addEventListener('click', function () {
        // Close the add new city dialog
        app.toggleAddDialog(false);
    });


    /*****************************************************************************
     *
     * Methods to update/refresh the UI
     *
     ****************************************************************************/

    // Toggles the visibility of the add new city dialog.
    app.toggleAddDialog = function (visible) {
        if (visible) {
            app.addDialog.classList.add('dialog-container--visible');
        } else {
            app.addDialog.classList.remove('dialog-container--visible');
        }
    };

    // Updates a weather card with the latest weather forecast. If the card
    // doesn't already exist, it's cloned from the template.
    app.updateForecastCard = function (data) {
        var dataLastUpdated = new Date(data.created);
        var sunrise = data.channel.astronomy.sunrise;
        var sunset = data.channel.astronomy.sunset;
        var current = data.channel.item.condition;
        var humidity = data.channel.atmosphere.humidity;
        var wind = data.channel.wind;

        var card = app.visibleCards[data.key];
        if (!card) {
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove('cardTemplate');
            card.querySelector('.location').textContent = data.label;
            card.removeAttribute('hidden');
            app.container.appendChild(card);
            app.visibleCards[data.key] = card;
        }

        // Verifies the data provide is newer than what's already visible
        // on the card, if it's not bail, if it is, continue and update the
        // time saved in the card
        var cardLastUpdatedElem = card.querySelector('.card-last-updated');
        var cardLastUpdated = cardLastUpdatedElem.textContent;
        if (cardLastUpdated) {
            cardLastUpdated = new Date(cardLastUpdated);
            // Bail if the card has more recent data then the data
            if (dataLastUpdated.getTime() < cardLastUpdated.getTime()) {
                return;
            }
        }
        cardLastUpdatedElem.textContent = data.created;

        card.querySelector('.description').textContent = current.text;
        card.querySelector('.date').textContent = current.date;
        card.querySelector('.current .icon').classList.add(app.getIconClass(current.code));
        card.querySelector('.current .temperature .value').textContent =
            Math.round(current.temp);
        card.querySelector('.current .sunrise').textContent = sunrise;
        card.querySelector('.current .sunset').textContent = sunset;
        card.querySelector('.current .humidity').textContent =
            Math.round(humidity) + '%';
        card.querySelector('.current .wind .value').textContent =
            Math.round(wind.speed);
        card.querySelector('.current .wind .direction').textContent = wind.direction;
        var nextDays = card.querySelectorAll('.future .oneday');
        var today = new Date();
        today = today.getDay();
        for (var i = 0; i < 7; i++) {
            var nextDay = nextDays[i];
            var daily = data.channel.item.forecast[i];
            if (daily && nextDay) {
                nextDay.querySelector('.date').textContent =
                    app.daysOfWeek[(i + today) % 7];
                nextDay.querySelector('.icon').classList.add(app.getIconClass(daily.code));
                nextDay.querySelector('.temp-high .value').textContent =
                    Math.round(daily.high);
                nextDay.querySelector('.temp-low .value').textContent =
                    Math.round(daily.low);
            }
        }
        if (app.isLoading) {
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
        }
    };


    /*****************************************************************************
     *
     * Methods for dealing with the model
     *
     ****************************************************************************/

    /*
     * Gets a forecast for a specific city and updates the card with the data.
     * getForecast() first checks if the weather data is in the cache. If so,
     * then it gets that data and populates the card with the cached data.
     * Then, getForecast() goes to the network for fresh data. If the network
     * request goes through, then the card gets updated a second time with the
     * freshest data.
     */
    app.getForecast = function (key, label) {
        var statement = 'select * from weather.forecast where woeid=' + key;
        var url = 'https://query.yahooapis.com/v1/public/yql?format=json&q=' +
            statement;
        // TODO add cache logic here

        if ('caches' in window) {
            /*
             * Check if the service worker has already cached this city's weather
             * data. If the service worker has the data, then display the cached
             * data while the app fetches the latest data.
             */
            caches.match(url).then(function (response) {
                if (response) {
                    response.json().then(function updateFromCache(json) {
                        var results = json.query.results;
                        results.key = key;
                        results.label = label;
                        results.created = json.query.created;
                        app.updateForecastCard(results);
                    });
                }
            });
        }

        // Fetch the latest data.
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    var response = JSON.parse(request.response);
                    var results = response.query.results;
                    results.key = key;
                    results.label = label;
                    results.created = response.query.created;
                    app.updateForecastCard(results);
                }
            } else {
                // Return the initial weather forecast since no data is available.
                app.updateForecastCard(initialWeatherForecast);
            }
        };
        request.open('GET', url);
        request.send();
    };

    // Iterate all of the cards and attempt to get the latest forecast data
    app.updateForecasts = function () {
        var keys = Object.keys(app.visibleCards);
        keys.forEach(function (key) {
            app.getForecast(key);
        });
    };

    // TODO add saveSelectedCities function here
    //adding the saved cities to the local storage.
    app.saveSelectedCities = function () {
        var selectedCities = JSON.stringify(app.selectedCities);
        localStorage.selectedCities = selectedCities;
    };

    app.getIconClass = function (weatherCode) {
        // Weather codes: https://developer.yahoo.com/weather/documentation.html#codes
        weatherCode = parseInt(weatherCode);
        switch (weatherCode) {
            case 25: // cold
            case 32: // sunny
            case 33: // fair (night)
            case 34: // fair (day)
            case 36: // hot
            case 3200: // not available
                return 'clear-day';
            case 0: // tornado
            case 1: // tropical storm
            case 2: // hurricane
            case 6: // mixed rain and sleet
            case 8: // freezing drizzle
            case 9: // drizzle
            case 10: // freezing rain
            case 11: // showers
            case 12: // showers
            case 17: // hail
            case 35: // mixed rain and hail
            case 40: // scattered showers
                return 'rain';
            case 3: // severe thunderstorms
            case 4: // thunderstorms
            case 37: // isolated thunderstorms
            case 38: // scattered thunderstorms
            case 39: // scattered thunderstorms (not a typo)
            case 45: // thundershowers
            case 47: // isolated thundershowers
                return 'thunderstorms';
            case 5: // mixed rain and snow
            case 7: // mixed snow and sleet
            case 13: // snow flurries
            case 14: // light snow showers
            case 16: // snow
            case 18: // sleet
            case 41: // heavy snow
            case 42: // scattered snow showers
            case 43: // heavy snow
            case 46: // snow showers
                return 'snow';
            case 15: // blowing snow
            case 19: // dust
            case 20: // foggy
            case 21: // haze
            case 22: // smoky
                return 'fog';
            case 24: // windy
            case 23: // blustery
                return 'windy';
            case 26: // cloudy
            case 27: // mostly cloudy (night)
            case 28: // mostly cloudy (day)
            case 31: // clear (night)
                return 'cloudy';
            case 29: // partly cloudy (night)
            case 30: // partly cloudy (day)
            case 44: // partly cloudy
                return 'partly-cloudy-day';
        }
    };

    /*
     * Fake weather data that is presented when the user first uses the app,
     * or when the user has not saved any cities. See startup code for more
     * discussion.
     */

    function urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }


    function updateBtn() {
        if (Notification.permission === 'denied') {
            pushButton.textContent = 'Blocked';
            //update
        }
        if (isSubscribed) {
            pushButton.textContent = 'Unsubscribe';
        }
        else {
            pushButton.textContent = 'subscribe';
        }
    }
    
    
    
  /*  function updateSubscriptionOnServer(subscription) {
        // TODO: Send subscription to application server

        const subscriptionJson = document.querySelector('.js-subscription-json');
        const subscriptionDetails =
            document.querySelector('.js-subscription-details');

        if (subscription) {
            subscriptionJson.textContent = JSON.stringify(subscription);
            subscriptionDetails.classList.remove('is-invisible');
        } else {
            subscriptionDetails.classList.add('is-invisible');
        }
    */

   /* function subscribeUser() {

        const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
        swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        })
            .then(function (subscription) {
                console.log('User is subscribed');

               // updateSubscriptionOnServer(subscription);

                isSubscribed = true;
                updateBtn();
                //gtag('send','event','SubscribeButtonClick','henceSubscribed');
                 gtag('event', 'click', {
  'event_category': 'SubscribeButtonClick',
  'event_action': 'henceSubscribed'
});    
            console.log('calling GA tracker');
        
            })
            .catch(function (err) {
                console.log('Failed to subscribe the user: ', err);
                updateBtn();
            });
    }


    function unsubscribe() { 

    swRegistration.pushManager.getSubscription().then(function (subscription) {
        if (subscription) {
            subscription.unsubscribe();
        }
    }).catch(function () {
        console.error('error in unsubscribing the user');
    }).then(function () {
        isSubscribed = false;
        console.log('user has unsubscribed');
        updateBtn();
    });


    }



    function callSubscription() {

        pushButton.addEventListener('click', function () {

            if (isSubscribed) {
                unsubscribe();
            }
            else {
                subscribeUser();
            }


        });

        swRegistration.pushManager.getSubscription().then(function (subscription) {
            isSubscribed = !(subscription === null)
            if (isSubscribed) {
                console.log('user is Subscribed');
            }
            else {
                console.log('user is not subscribed');
            }
        })

    }
*/
    var initialWeatherForecast = {
        key: '2459115',
        label: 'New York, NY',
        created: '2016-07-22T01:00:00Z',
        channel: {
            astronomy: {
                sunrise: "5:43 am",
                sunset: "8:21 pm"
            },
            item: {
                condition: {
                    text: "Windy",
                    date: "Thu, 21 Jul 2016 09:00 PM EDT",
                    temp: 56,
                    code: 24
                },
                forecast: [
                    { code: 44, high: 86, low: 70 },
                    { code: 44, high: 94, low: 73 },
                    { code: 4, high: 95, low: 78 },
                    { code: 24, high: 75, low: 89 },
                    { code: 24, high: 89, low: 77 },
                    { code: 44, high: 92, low: 79 },
                    { code: 44, high: 89, low: 77 }
                ]
            },
            atmosphere: {
                humidity: 56
            },
            wind: {
                speed: 25,
                direction: 195
            }
        }
    };
    // TODO uncomment line below to test app with fake data
    //app.updateForecastCard(initialWeatherForecast);

    // TODO add startup code here
    app.selectedCities = localStorage.selectedCities;
    if (app.selectedCities) {
        app.selectedCities = JSON.parse(app.selectedCities);
        app.selectedCities.forEach(function (city) {
            app.getForecast(city.key, city.label);
        });
    }
    else {
        app.updateForecastCard(initialWeatherForecast);
        app.selectedCities = [{ key: initialWeatherForecast.key, label: initialWeatherForecast.label }];
        app.saveSelectedCities();
    }
    // TODO add service worker code here
    if ('serviceWorker' in navigator && 'PushManager' in window) {

        console.log('Service Worker and PushManager Both are Supported');
        navigator.serviceWorker.register('../firebase-messaging-sw.js').then(function (sw) {
            console.log('service worker has been registered', sw);
            swRegistration = sw;
            callSubscription();
        });
        
    }
    else {
        console.warn('PushManager is not Existing!');
    
    }
    
const messaging = firebase.messaging();
    
  // [END get_messaging_object]
  // [START set_public_vapid_key]
  // Add the public key generated from the console here.
  messaging.usePublicVapidKey('BAebWRZzN-tu7bPUiAhxDKo0sFwcXOselDK9CGQTqdm7pRlQ5fJUv_hkjWNl_qJDCe292LOZQY74TsukoAIcmhk');
  // [END set_public_vapid_key]
  // IDs of divs that display Instance ID token UI or request permission UI.
  const tokenDivId = 'token_div';
  const permissionDivId = 'permission_div';
  // [START refresh_token]
  // Callback fired if Instance ID token is updated.
  messaging.onTokenRefresh(function() {
    messaging.getToken().then(function(refreshedToken) {
      console.log('Token refreshed.');
      // Indicate that the new Instance ID token has not yet been sent to the
      // app server.
      setTokenSentToServer(false);
      // Send Instance ID token to app server.
      sendTokenToServer(refreshedToken);
      // [START_EXCLUDE]
      // Display new Instance ID token and clear UI of all previous messages.
      resetUI();
      // [END_EXCLUDE]
    }).catch(function(err) {
      console.log('Unable to retrieve refreshed token ', err);
      showToken('Unable to retrieve refreshed token ', err);
    });
  });
    
    
  // [END refresh_token]
  // [START receive_message]
  // Handle incoming messages. Called when:
  // - a message is received while the app has focus
  // - the user clicks on an app notification created by a service worker
  //   `messaging.setBackgroundMessageHandler` handler.
    
    
  messaging.onMessage(function(payload) {
    console.log('Message received. ', payload);
    // [START_EXCLUDE]
    // Update the UI to include the received message.
    appendMessage(payload);
    // [END_EXCLUDE]
  });
    
    
  // [END receive_message]
  function resetUI() {
    clearMessages();
    showToken('loading...');
    // [START get_token]
    // Get Instance ID token. Initially this makes a network call, once retrieved
    // subsequent calls to getToken will return from cache.
    messaging.getToken().then(function(currentToken) {
      if (currentToken) {
        sendTokenToServer(currentToken);
        updateUIForPushEnabled(currentToken);
      } else {
        // Show permission request.
        console.log('No Instance ID token available. Request permission to generate one.');
        // Show permission UI.
        updateUIForPushPermissionRequired();
        setTokenSentToServer(false);
      }
    }).catch(function(err) {
      console.log('An error occurred while retrieving token. ', err);
      showToken('Error retrieving Instance ID token. ', err);
      setTokenSentToServer(false);
    });
    // [END get_token]
  }
    
    
  function showToken(currentToken) {
    // Show token in console and UI.
    var tokenElement = document.querySelector('#token');
    tokenElement.textContent = currentToken;
  }
    
    
  // Send the Instance ID token your application server, so that it can:
  // - send messages back to this app
  // - subscribe/unsubscribe the token from topics
  function sendTokenToServer(currentToken) {
    if (!isTokenSentToServer()) {
      console.log('Sending token to server...');
      // TODO(developer): Send the current token to your server.
      setTokenSentToServer(true);
    } else {
      console.log('Token already sent to server so won\'t send it again ' +
          'unless it changes');
    }
  }
    
  function isTokenSentToServer() {   
    return window.localStorage.getItem('sentToServer') === '1';
  }
    
  function setTokenSentToServer(sent) {
    window.localStorage.setItem('sentToServer', sent ? '1' : '0');
  }
    
  function showHideDiv(divId, show) {
    const div = document.querySelector('#' + divId);
    if (show) {
      div.style = 'display: visible';
    } else {
      div.style = 'display: none';
    }
  }
  function requestPermission() {
    console.log('Requesting permission...');
    // [START request_permission]
    messaging.requestPermission().then(function() {
      console.log('Notification permission granted.');
      // TODO(developer): Retrieve an Instance ID token for use with FCM.
      // [START_EXCLUDE]
      // In many cases once an app has been granted notification permission, it
      // should update its UI reflecting this.
      resetUI();
      // [END_EXCLUDE]
    }).catch(function(err) {
      console.log('Unable to get permission to notify.', err);
    });
    // [END request_permission]
  }
  function deleteToken() {
    // Delete Instance ID token.
    // [START delete_token]
    messaging.getToken().then(function(currentToken) {
      messaging.deleteToken(currentToken).then(function() {
        console.log('Token deleted.');
        setTokenSentToServer(false);
        // [START_EXCLUDE]
        // Once token is deleted update UI.
        resetUI();
        // [END_EXCLUDE]
      }).catch(function(err) {
        console.log('Unable to delete token. ', err);
      });
      // [END delete_token]
    }).catch(function(err) {
      console.log('Error retrieving Instance ID token. ', err);
      showToken('Error retrieving Instance ID token. ', err);
    });
  }
  // Add a message to the messages element.
  function appendMessage(payload) {
    const messagesElement = document.querySelector('#messages');
    const dataHeaderELement = document.createElement('h5');
    const dataElement = document.createElement('pre');
    dataElement.style = 'overflow-x:hidden;';
    dataHeaderELement.textContent = 'Received message:';
    dataElement.textContent = JSON.stringify(payload, null, 2);
    messagesElement.appendChild(dataHeaderELement);
    messagesElement.appendChild(dataElement);
  }
  // Clear the messages element of all children.
  function clearMessages() {
    const messagesElement = document.querySelector('#messages');
    while (messagesElement.hasChildNodes()) {
      messagesElement.removeChild(messagesElement.lastChild);
    }
  }
  function updateUIForPushEnabled(currentToken) {
    showHideDiv(tokenDivId, true);
    showHideDiv('Per', false);
    showToken(currentToken);
  }
  function updateUIForPushPermissionRequired() {
    showHideDiv(tokenDivId, false);
    showHideDiv('Per', true);
  }
  resetUI();


})();



































