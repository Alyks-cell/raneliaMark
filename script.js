const intro = document.querySelector('#invite-intro');
const introOpen = document.querySelector('#intro-open');
if (intro && introOpen) {
  intro.classList.add('is-visible');
  intro.setAttribute('aria-hidden', 'false');
  document.body.classList.add('intro-active');
  document.querySelectorAll('body > header, body > main, body > footer').forEach((element) => { element.inert = true; });
  introOpen.focus({ preventScroll: true });

  intro.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      introOpen.focus();
    }
  });

  const closeIntro = () => {
    intro.classList.add('is-complete');
    window.setTimeout(() => {
      intro.remove();
      document.body.classList.remove('intro-active');
      document.querySelectorAll('body > header, body > main, body > footer').forEach((element) => { element.inert = false; });
      const heroTitle = document.querySelector('#couple-names');
      heroTitle?.setAttribute('tabindex', '-1');
      heroTitle?.focus({ preventScroll: true });
    }, 700);
  };

  introOpen.addEventListener('click', () => {
    if (intro.classList.contains('is-opening')) return;
    intro.classList.add('is-opening');
    introOpen.disabled = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.setTimeout(closeIntro, 1500);
      return;
    }
    window.setTimeout(closeIntro, 5800);
  });
}

const weddingDate = new Date('2026-12-01T15:00:00+08:00');
const parts = { days: document.querySelector('#days'), hours: document.querySelector('#hours'), minutes: document.querySelector('#minutes'), seconds: document.querySelector('#seconds') };

function updateCountdown() {
  const remaining = Math.max(0, weddingDate.getTime() - Date.now());
  const values = {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining % 86400000) / 3600000),
    minutes: Math.floor((remaining % 3600000) / 60000),
    seconds: Math.floor((remaining % 60000) / 1000)
  };
  Object.entries(values).forEach(([key, value]) => { parts[key].textContent = String(value).padStart(2, '0'); });
  document.querySelector('.count-note').textContent = remaining === 0
    ? 'Today is the day! - December 1, 2026 - 3:00 PM Philippine Time'
    : 'Until we say I do - December 1, 2026 at 3:00 PM Philippine Time';
}

updateCountdown();
setInterval(updateCountdown, 1000);

const form = document.querySelector('#rsvp-form');
const message = document.querySelector('#rsvp-message');
const submitButton = form.querySelector('button[type="submit"]');
const config = window.WEDDING_SUPABASE_CONFIG;
const isConfigured = config?.url?.startsWith('https://') && !config.url.includes('YOUR-PROJECT') && config?.anonKey && !config.anonKey.includes('YOUR_SUPABASE');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = form.elements.name.value.trim();
  const response = form.elements.response.value;
  if (!name) {
    form.elements.name.setAttribute('aria-invalid', 'true');
    form.elements.name.focus();
    return;
  }
  form.elements.name.removeAttribute('aria-invalid');
  if (!response) {
    form.querySelector('fieldset').scrollIntoView({ behavior: 'smooth', block: 'center' });
    form.querySelector('input[name="response"]').focus({ preventScroll: true });
    return;
  }
  if (!isConfigured) {
    showMessage('The RSVP form is not connected yet. Please add your Supabase project URL and anon/publishable key in supabase-config.js.', true);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'SENDING...';
  try {
    const table = response === 'yes' ? 'wedding_rsvps_yes' : 'wedding_rsvps_no';
    const result = await fetch(`${config.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ guest_name: name, response })
    });
    if (!result.ok) {
      const error = await result.json().catch(() => ({}));
      throw new Error(error.message || `RSVP request failed (${result.status}).`);
    }
    showMessage(response === 'yes'
      ? `Thank you, ${name}! We can't wait to celebrate with you. Your RSVP has been received.`
      : `Thank you for letting us know, ${name}. We will be with you in spirit. Your RSVP has been received.`);
    form.hidden = true;
    if (response === 'yes') {
      document.querySelector('#accepted-guest-name').textContent = name;
      openSaveDatePopup();
    }
  } catch (error) {
    console.error('RSVP submission failed:', error);
    showMessage("We could not submit your RSVP right now. Please try again in a moment.", true);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'SEND MY RSVP';
  }
});

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
  message.hidden = false;
}

form.elements.name.addEventListener('input', (event) => event.currentTarget.removeAttribute('aria-invalid'));

const coupleStack = document.querySelector('.couple-stack');
if (coupleStack) {
  const couplePhotos = [...coupleStack.querySelectorAll('.couple-photo')];
  const coupleCount = document.querySelector('.couple-count');
  let currentPhoto = 0;
  const showCouplePhoto = (next) => {
    currentPhoto = (next + couplePhotos.length) % couplePhotos.length;
    couplePhotos.forEach((photo, index) => {
      photo.classList.toggle('is-current', index === currentPhoto);
      photo.style.zIndex = String(couplePhotos.length - ((index - currentPhoto + couplePhotos.length) % couplePhotos.length));
    });
    coupleCount.textContent = `${currentPhoto + 1} / ${couplePhotos.length}`;
  };
  document.querySelector('.couple-prev').addEventListener('click', () => showCouplePhoto(currentPhoto - 1));
  document.querySelector('.couple-next').addEventListener('click', () => showCouplePhoto(currentPhoto + 1));
  coupleStack.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showCouplePhoto(currentPhoto - 1);
    if (event.key === 'ArrowRight') showCouplePhoto(currentPhoto + 1);
  });
  let swipeStart = null;
  coupleStack.addEventListener('pointerdown', (event) => { swipeStart = event.clientX; });
  coupleStack.addEventListener('pointerup', (event) => {
    if (swipeStart === null) return;
    const distance = event.clientX - swipeStart;
    if (Math.abs(distance) > 40) showCouplePhoto(currentPhoto + (distance < 0 ? 1 : -1));
    swipeStart = null;
  });
  coupleStack.addEventListener('pointercancel', () => { swipeStart = null; });
}

const saveDatePopup = document.querySelector('#save-date-popup');
const saveDateClose = saveDatePopup?.querySelector('.save-date-close');
function openSaveDatePopup() {
  if (!saveDatePopup) return;
  saveDatePopup.hidden = false;
  saveDatePopup.setAttribute('aria-hidden', 'false');
  saveDateClose.focus();
}
function closeSaveDatePopup() {
  if (!saveDatePopup) return;
  saveDatePopup.hidden = true;
  saveDatePopup.setAttribute('aria-hidden', 'true');
  document.querySelector('#rsvp h2')?.focus();
}
saveDateClose?.addEventListener('click', closeSaveDatePopup);
saveDatePopup?.addEventListener('click', (event) => {
  if (event.target === saveDatePopup) closeSaveDatePopup();
});
saveDatePopup?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSaveDatePopup();
});