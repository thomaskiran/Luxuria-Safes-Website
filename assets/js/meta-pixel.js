/**
 * Luxuria Safes — Meta Pixel.
 *
 * Loaded on every page by i18n.js. Sends PageView; the enquiry form sends
 * Lead (with the same event ID the server uses, so Meta de-duplicates).
 *
 * PIXEL_ID is the Events Manager dataset ID — public by design, not a secret.
 * While it is empty the pixel does nothing.
 */
(function () {
  'use strict';

  var PIXEL_ID = '';

  if (!PIXEL_ID || window.fbq) return;

  /* Meta's standard base code. */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
    n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
})();
