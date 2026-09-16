/**
 * Luxuria Safes - i18n (English / Arabic) + social buttons
 * ---------------------------------------------------------
 * Each page embeds its own `window.PAGE_I18N = { id: { en, ar }, ... }`
 * (see *.i18n.json / the inline <script id="page-i18n"> block).
 * This file provides the shared logic: language switch, RTL toggle,
 * persistence, and the header / floating social + language controls,
 * injected at runtime so every page stays in sync automatically.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'luxuria_lang';
    var SOCIAL = {
        instagram: 'https://www.instagram.com/luxuriasafes/',
        whatsapp: 'https://wa.me/message/GXRPRJPFWMYQB1',
        facebook: 'https://www.facebook.com/profile.php?id=61577718725888'
    };

    var ICONS = {
        instagram: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.3" stroke="currentColor" stroke-width="1.6"/><circle cx="17.4" cy="6.6" r="1.15" fill="currentColor"/></svg>',
        whatsapp: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12.04 2.5c-5.27 0-9.55 4.28-9.55 9.55 0 1.68.44 3.3 1.28 4.73L2.5 21.5l4.86-1.24a9.53 9.53 0 0 0 4.68 1.23h.01c5.27 0 9.55-4.28 9.55-9.55S17.31 2.5 12.04 2.5Zm0 17.36h-.01a7.9 7.9 0 0 1-4.03-1.1l-.29-.17-2.88.74.77-2.8-.19-.29a7.9 7.9 0 0 1-1.22-4.19c0-4.37 3.56-7.93 7.94-7.93 2.12 0 4.11.83 5.61 2.33a7.87 7.87 0 0 1 2.32 5.61c0 4.38-3.56 7.94-7.93 7.94Zm4.35-5.94c-.24-.12-1.41-.7-1.63-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.17-.7-.63-1.18-1.4-1.31-1.64-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.41-.58 1.61-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" fill="currentColor"/></svg>',
        facebook: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M14.5 21.5v-8h2.7l.4-3.1h-3.1V8.4c0-.9.25-1.5 1.55-1.5h1.65V4.14C17.4 4.1 16.44 4 15.32 4c-2.33 0-3.93 1.42-3.93 4.03v2.37H8.7v3.1h2.7v8h3.1Z" fill="currentColor"/></svg>'
    };

    function getLang() {
        try { return localStorage.getItem(STORAGE_KEY) || 'en'; } catch (e) { return 'en'; }
    }
    function setLang(lang) {
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
    }

    function applyDirection(lang) {
        var html = document.documentElement;
        html.setAttribute('lang', lang === 'ar' ? 'ar' : 'en');
        html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    }

    function applyTranslations(lang) {
        var dict = window.PAGE_I18N || {};

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var id = el.getAttribute('data-i18n');
            var entry = dict[id];
            if (!entry) return;
            var text = lang === 'ar' ? entry.ar : entry.en;
            if (el.tagName === 'TITLE') {
                document.title = text.trim();
            } else {
                el.textContent = text;
            }
        });

        document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
            var pairs = el.getAttribute('data-i18n-attr').split(',');
            pairs.forEach(function (pair) {
                var idx = pair.indexOf(':');
                if (idx === -1) return;
                var attr = pair.slice(0, idx);
                var id = pair.slice(idx + 1);
                var entry = dict[id];
                if (!entry) return;
                var text = (lang === 'ar' ? entry.ar : entry.en).trim();
                el.setAttribute(attr, text);
            });
        });
    }

    function updateToggleLabel(lang) {
        document.querySelectorAll('.lang-toggle').forEach(function (btn) {
            btn.setAttribute('aria-pressed', lang === 'ar' ? 'true' : 'false');
            var enSpan = btn.querySelector('.lang-en');
            var arSpan = btn.querySelector('.lang-ar');
            if (enSpan) enSpan.classList.toggle('active', lang === 'en');
            if (arSpan) arSpan.classList.toggle('active', lang === 'ar');
        });
    }

    function setLanguage(lang) {
        setLang(lang);
        applyDirection(lang);
        applyTranslations(lang);
        updateToggleLabel(lang);
    }
    window.setLuxuriaLanguage = setLanguage;

    function buildSocialLinks(className) {
        var wrap = document.createElement('div');
        wrap.className = className;
        Object.keys(SOCIAL).forEach(function (key) {
            var a = document.createElement('a');
            a.href = SOCIAL[key];
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'social-icon social-' + key;
            a.setAttribute('aria-label', key.charAt(0).toUpperCase() + key.slice(1));
            a.innerHTML = ICONS[key];
            wrap.appendChild(a);
        });
        return wrap;
    }

    function buildLangToggle() {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lang-toggle';
        btn.setAttribute('aria-label', 'Toggle language / تبديل اللغة');
        btn.innerHTML = '<span class="lang-en">EN</span><span class="lang-sep">/</span><span class="lang-ar">AR</span>';
        btn.addEventListener('click', function () {
            var next = getLang() === 'ar' ? 'en' : 'ar';
            setLanguage(next);
        });
        return btn;
    }

    function injectHeaderExtras() {
        var nav = document.querySelector('#masthead .main-navigation');
        if (!nav) return;

        var utility = document.createElement('div');
        utility.className = 'header-utility';
        utility.appendChild(buildSocialLinks('social-icons header-social'));
        utility.appendChild(buildLangToggle());

        nav.appendChild(utility);
    }

    function injectFloatingButtons() {
        var floating = buildSocialLinks('social-icons floating-social');
        document.body.appendChild(floating);
    }

    document.addEventListener('DOMContentLoaded', function () {
        injectHeaderExtras();
        injectFloatingButtons();
        var lang = getLang();
        applyDirection(lang);
        applyTranslations(lang);
        updateToggleLabel(lang);
    });
})();
