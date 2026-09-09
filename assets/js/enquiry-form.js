/**
 * Luxuria Safes — enquiry form behaviour.
 *
 * Two jobs:
 *   1. Remember where a visitor came from, on their first page view, so the
 *      attribution survives them browsing the collections before enquiring.
 *   2. Submit the form to /api/enquiry and report the result honestly.
 */
(function () {
  'use strict';

  var STORE_KEY = 'lux_attribution';
  var ATTR_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'fbclid', 'campaign_id', 'adset_id', 'ad_id'
  ];

  /* ------------------------------------------------ attribution capture */

  function readStored() {
    try {
      return JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function captureAttribution() {
    var stored = readStored();
    var params = new URLSearchParams(window.location.search);
    var touched = false;

    ATTR_KEYS.forEach(function (key) {
      var value = params.get(key);
      // First touch wins — don't let a later internal link overwrite the
      // campaign that actually brought them here.
      if (value && !stored[key]) {
        stored[key] = value.slice(0, 255);
        touched = true;
      }
    });

    if (!stored.landing_page) {
      stored.landing_page = window.location.href.slice(0, 450);
      touched = true;
    }
    if (!stored.referrer && document.referrer) {
      stored.referrer = document.referrer.slice(0, 450);
      touched = true;
    }

    if (touched) {
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(stored)); } catch (e) { /* private mode */ }
    }
    return stored;
  }

  var attribution = captureAttribution();

  /* ------------------------------------------------------ product picker */

  function fillProducts(select) {
    var groups = window.LUXURIA_PRODUCTS;
    if (!select || !groups) return;

    groups.forEach(function (group) {
      var optgroup = document.createElement('optgroup');
      optgroup.label = group.label;
      group.items.forEach(function (item) {
        var option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        optgroup.appendChild(option);
      });
      select.appendChild(optgroup);
    });

    // If the visitor arrived from a product page, preselect that model.
    var fromPage = (attribution.landing_page || '') + ' ' + window.location.href;
    groups.some(function (group) {
      return group.items.some(function (item) {
        var slug = item.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
        if (fromPage.replace(/[^a-z0-9]/gi, '').toLowerCase().indexOf(slug) !== -1) {
          select.value = item.id;
          return true;
        }
        return false;
      });
    });
  }

  /* -------------------------------------------------------------- submit */

  function submissionId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'lux-' + Date.now() + '-' + Math.random().toString(16).slice(2, 10);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('#enquiry-form');
    if (!form) return;

    var status = form.querySelector('#enquiry-status');
    var button = form.querySelector('button[type="submit"]');
    var select = form.querySelector('#product');
    var renderedAt = Date.now();
    var token = submissionId();

    fillProducts(select);

    function setStatus(text, kind) {
      if (!status) return;
      status.textContent = text;
      status.className = 'form-status' + (kind ? ' is-' + kind : '');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (button.disabled) return;

      var data = new FormData(form);
      var payload = {
        name: data.get('name') || '',
        email: data.get('email') || '',
        phone: data.get('phone') || '',
        whatsapp: data.get('whatsapp') || '',
        company: data.get('company') || '',
        message: data.get('message') || '',
        product_id: data.get('product') || '',
        product_name: select && select.selectedIndex > 0 ? select.options[select.selectedIndex].text : '',
        company_website: data.get('company_website') || '',
        submission_id: token,
        rendered_at: renderedAt
      };
      ATTR_KEYS.concat(['landing_page']).forEach(function (key) {
        if (attribution[key]) payload[key] = attribution[key];
      });

      button.disabled = true;
      setStatus('Sending your enquiry…', 'pending');

      fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().then(function (body) { return { ok: res.ok, body: body }; });
        })
        .then(function (result) {
          if (result.body && result.body.ok) {
            form.reset();
            setStatus(
              'Thank you — your enquiry has reached our team. We will be in touch shortly.',
              'success'
            );
            // A fresh token, so a second genuine enquiry is not treated as a repeat.
            token = submissionId();
            button.disabled = false;
            return;
          }

          setStatus(
            (result.body && result.body.message) ||
              'Something went wrong. Please email info@luxuriasafes.com and we will pick it up.',
            'error'
          );
          button.disabled = false;
        })
        .catch(function () {
          setStatus(
            'We could not reach our server. Please check your connection, or email info@luxuriasafes.com.',
            'error'
          );
          button.disabled = false;
        });
    });
  });
})();
