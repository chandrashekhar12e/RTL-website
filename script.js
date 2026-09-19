/* =====================================================
   EXACT LAB LOCATION (paste your coordinates here)
   How to get them (30 seconds):
   1. Open Google Maps and find your lab.
   2. Right-click exactly on the lab building.
   3. Click the first item (numbers like 28.3921, 77.3125) - it copies.
   4. Paste the first number in LAB_LAT and the second in LAB_LNG.
   Example:  var LAB_LAT = '28.392100';  var LAB_LNG = '77.312500';
   ===================================================== */
var LAB_LAT = '28.358052731199088';
var LAB_LNG = '77.29958326496605';

/* ---- RUNS FIRST: sets the saved theme before the page is drawn (no flash) ----
   Default = light (your original design). */
(function () {
  var theme = 'light';
  try {
    var saved = localStorage.getItem('rtl-theme');
    if (saved === 'dark' || saved === 'light') { theme = saved; }
  } catch (e) { /* storage blocked - keep default */ }
  document.documentElement.setAttribute('data-theme', theme);
})();

/* ---- RUNS AFTER THE PAGE IS LOADED: menu, theme button, form, animations ---- */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var root = document.documentElement;

  /* ---------------- MAP: use exact coordinates when provided ---------------- */
  var mapFrame = document.getElementById('mapFrame');
  var mapLink = document.getElementById('mapLink');
  var lat = parseFloat(LAB_LAT), lng = parseFloat(LAB_LNG);
  if (mapFrame && mapLink && isFinite(lat) && isFinite(lng) &&
      Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    var pin = encodeURIComponent(lat + ',' + lng);
    mapFrame.src = 'https://www.google.com/maps?q=' + pin + '&z=18&output=embed';
    mapLink.href = 'https://www.google.com/maps/search/?api=1&query=' + pin;
  }

  /* ---------------- FOOTER YEAR ---------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  /* ---------------- DARK / LIGHT THEME ---------------- */
  var themeBtn = document.getElementById('themeBtn');

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeBtn) {
      var label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      themeBtn.setAttribute('aria-label', label);
      themeBtn.setAttribute('title', label);
    }
  }

  applyTheme(currentTheme());

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('rtl-theme', next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------------- MOBILE MENU ---------------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('primaryNav');

  function closeMenu() {
    if (!nav || !menuBtn) { return; }
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenu(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) { closeMenu(); }
    });
  }

  /* ---------------- QUOTE FORM -> GOOGLE SHEET ---------------- */
  var SHEET_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbzf44rlmGJ83zdhMikSU7_hDqOhf9fKMKCbSye5RQBa9pjMYSBIbpQkUoqKD7x9DUKPhw/exec';
  var COOLDOWN_MS = 30000;   // one submit every 30 seconds
  var lastSent = 0;

  var quoteForm = document.getElementById('quoteForm');
  var formStatus = document.getElementById('formStatus');
  var submitBtn = document.getElementById('quoteSubmitBtn');

  function setStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = 'form-status show ' + type;
  }

  /* Removes hidden/control characters, limits length, and stops
     spreadsheet "formula injection" (values starting with = + - @). */
  function clean(value, max, keepLines) {
    var v = String(value || '');
    v = keepLines
      ? v.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ')
      : v.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ');
    v = v.trim().slice(0, max);
    if (/^[=+\-@]/.test(v)) { v = "'" + v; }
    return v;
  }

  if (quoteForm && formStatus && submitBtn) {
    var phoneEl = document.getElementById('fphone');
    var testEl = document.getElementById('ftest');

    // Phone: only digits, max 10 (works for typing and pasting)
    if (phoneEl) {
      phoneEl.addEventListener('input', function () {
        phoneEl.value = phoneEl.value.replace(/[^0-9]/g, '').slice(0, 10);
      });
    }

    var allowedTests = Array.prototype.map.call(testEl.options, function (o) { return o.value; });

    quoteForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Anti-spam trap: real people never fill this hidden field
      var trap = quoteForm.elements['Website'];
      if (trap && trap.value) {
        setStatus('Thanks — your request has been received. We will get back to you shortly.', 'success');
        quoteForm.reset();
        return;
      }

      var data = {
        Name: clean(document.getElementById('fname').value, 80),
        Phone: clean(phoneEl.value, 10),
        Company: clean(document.getElementById('fcompany').value, 100),
        Test: clean(testEl.value, 80),
        Message: clean(document.getElementById('fmsg').value, 1000, true),
        Timestamp: new Date().toISOString()
      };

      if (!data.Name) { setStatus('Please enter your name.', 'error'); return; }
      if (!/^[6-9][0-9]{9}$/.test(data.Phone)) {
        setStatus('Please enter a valid 10-digit mobile number.', 'error');
        return;
      }
      if (allowedTests.indexOf(testEl.value) === -1) {
        setStatus('Please choose a test from the list.', 'error');
        return;
      }
      if (Date.now() - lastSent < COOLDOWN_MS) {
        setStatus('Please wait a few seconds before sending another request.', 'error');
        return;
      }

      submitBtn.disabled = true;
      setStatus('Sending your request…', 'loading');

      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 15000);

      try {
        // Apps Script does not return readable CORS responses, so we use
        // no-cors and treat a finished request (no network error) as success.
        await fetch(SHEET_ENDPOINT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data),
          signal: controller.signal
        });
        lastSent = Date.now();
        setStatus('Thanks — your request has been received. We will get back to you shortly.', 'success');
        quoteForm.reset();
      } catch (err) {
        setStatus('Something went wrong sending your request. Please try again or email us directly.', 'error');
      } finally {
        clearTimeout(timer);
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------------- SCROLL REVEAL ---------------- */
  if ('IntersectionObserver' in window) {
    var revealEls = document.querySelectorAll('.plate, .step, .accred-item');
    revealEls.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  }
});