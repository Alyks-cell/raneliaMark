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
    ? 'Today is the day! · December 1, 2026 · 3:00 PM Philippine Time'
    : 'Until we say “I do” · December 1, 2026 at 3:00 PM Philippine Time';
}

updateCountdown();
setInterval(updateCountdown, 1000);

const form = document.querySelector('#rsvp-form');
const message = document.querySelector('#rsvp-message');
const submitButton = form.querySelector('button[type="submit"]');
const config = window.WEDDING_SUPABASE_CONFIG;
const isConfigured = config?.url?.startsWith('https://') && !config.url.includes('YOUR-PROJECT') && config?.anonKey && !config.anonKey.includes('YOUR_SUPABASE');
const supabase = isConfigured && window.supabase ? window.supabase.createClient(config.url, config.anonKey) : null;

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
  if (!supabase) {
    showMessage('The RSVP form is not connected yet. Please add your Supabase project URL and anon/publishable key in supabase-config.js.', true);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'SENDING…';
  try {
    const { error } = await supabase.from('wedding_rsvps').insert({ guest_name: name, response });
    if (error) throw error;
    showMessage(response === 'yes'
      ? `Thank you, ${name}! We can’t wait to celebrate with you. Your RSVP has been received.`
      : `Thank you for letting us know, ${name}. You’ll be with us in spirit. Your RSVP has been received.`);
    form.hidden = true;
  } catch (error) {
    console.error('RSVP submission failed:', error);
    showMessage('We couldn’t submit your RSVP right now. Please try again in a moment.', true);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'SEND MY RSVP <span aria-hidden="true">↗</span>';
  }
});

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
  message.hidden = false;
}

form.elements.name.addEventListener('input', (event) => event.currentTarget.removeAttribute('aria-invalid'));
