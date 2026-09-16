document.getElementById('year').textContent = new Date().getFullYear();

  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('primaryNav');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  // ---------------- QUOTE FORM -> GOOGLE SHEET ----------------
  // 1. Deploy the accompanying Apps Script (see google-apps-script.gs) as a Web App.
  // 2. Paste the deployment URL below.
  const SHEET_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbzf44rlmGJ83zdhMikSU7_hDqOhf9fKMKCbSye5RQBa9pjMYSBIbpQkUoqKD7x9DUKPhw/exec';

  const quoteForm = document.getElementById('quoteForm');
  const formStatus = document.getElementById('formStatus');
  const submitBtn = document.getElementById('quoteSubmitBtn');

  function setStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = 'form-status show ' + type;
  }

  if (quoteForm) {
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!SHEET_ENDPOINT_URL || SHEET_ENDPOINT_URL.startsWith('PASTE_')) {
        setStatus('Form is not connected to the sheet yet. Please set SHEET_ENDPOINT_URL in script.js.', 'error');
        return;
      }

      const data = {
        Name: document.getElementById('fname').value.trim(),
        Phone: document.getElementById('fphone').value.trim(),
        Company: document.getElementById('fcompany').value.trim(),
        Test: document.getElementById('ftest').value,
        Message: document.getElementById('fmsg').value.trim(),
        Timestamp: new Date().toISOString()
      };

      if (!data.Name) {
        setStatus('Please enter your name.', 'error');
        return;
      }

      submitBtn.disabled = true;
      setStatus('Sending your request…', 'loading');

      try {
        // Apps Script web apps don't send back CORS headers for a readable
        // response when called with a simple POST, so we use no-cors and
        // treat a completed fetch (no network error) as success.
        await fetch(SHEET_ENDPOINT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data)
        });

        setStatus('Thanks — your request has been received. We will get back to you shortly.', 'success');
        quoteForm.reset();
      } catch (err) {
        setStatus('Something went wrong sending your request. Please try again or email us directly.', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  const revealEls = document.querySelectorAll('.plate, .step, .accred-item');
  revealEls.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));