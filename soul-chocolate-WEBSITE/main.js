/* Soul Chocolate – site interactions (no dependencies).
   Forms are emailed through FormSubmit when SITE.email is set; until then the message is handed to a phone call or Facebook Messenger. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = window.SITE || {};
  const params = new URLSearchParams(location.search);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Header + mobile menu */
  const hdr = $('.hdr');
  const onScroll = () => hdr && hdr.classList.toggle('scrolled', window.scrollY > 10);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const burger = $('.burger'), nav = $('.nav');
  if (burger && nav) {
    const close = () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); document.body.style.overflow = ''; };
    burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', String(o)); burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); document.body.style.overflow = o ? 'hidden' : ''; });
    $$('a', nav).forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* Reveal on scroll – never leaves content hidden */
  const rv = $$('.rv, .rv-img'); const show = (el) => el.classList.add('in');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    rv.forEach((el) => io.observe(el));
    let tk = false;
    addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(() => { tk = false; rv.forEach((el) => { if (!el.classList.contains('in') && el.getBoundingClientRect().top < innerHeight) show(el); }); }); } }, { passive: true });
  } else rv.forEach(show);
  setTimeout(() => rv.forEach(show), 2500);

  /* Tabs with sliding underline + arrow keys */
  $$('[role=tablist]').forEach((list) => {
    const tabs = $$('[role=tab]', list), ind = $('.ind', list);
    const cur = () => tabs.find((x) => x.getAttribute('aria-selected') === 'true');
    const move = (tb) => { if (ind && tb) { ind.style.width = tb.offsetWidth + 'px'; ind.style.transform = `translateX(${tb.offsetLeft}px)`; } };
    const select = (tb, focus) => {
      tabs.forEach((x) => { const on = x === tb; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; const p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on; });
      move(tb); if (focus) tb.focus();
    };
    tabs.forEach((tb, i) => {
      tb.addEventListener('click', () => select(tb));
      tb.addEventListener('keydown', (e) => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); } });
    });
    select(tabs.find((x) => x.dataset.id === params.get('tab') || '#' + x.dataset.id === location.hash) || cur() || tabs[0]);
    addEventListener('resize', () => move(cur())); addEventListener('load', () => move(cur()));
    if (document.fonts) document.fonts.ready.then(() => move(cur()));
  });

  /* Opening hours: highlight today (Saskatchewan time) */
  const hrs = $$('.hours li[data-day]');
  if (hrs.length) {
    let day = new Date().getDay();
    try { day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', weekday: 'short' }).format(new Date())); } catch (e) {}
    hrs.forEach((li) => li.classList.toggle('today', li.dataset.day.split(',').includes(String(day))));
  }

  /* Pre-fill selects / pills from links (?type=wedding) */
  const type = params.get('type');
  if (type) { const r = $(`input[name="topic"][value="${type}"], input[name="event_type"][value="${type}"]`); if (r) r.checked = true; }
  $$('input[type=date]').forEach((d) => { const t = new Date(); t.setDate(t.getDate() + 1); d.min = t.toISOString().slice(0, 10); });

  /* Forms */
  const rules = {
    name: (v) => v.trim().length >= 2 || 'Please enter your name.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
    phone: (v) => { const d = v.replace(/\D/g, ''); return (d.length >= 10 && d.length <= 13) || 'Please enter a valid phone number, e.g. 416 672 0113.'; },
    event_date: (v) => !!v || 'Please choose a date.',
    postcode: (v) => /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/.test(v.trim()) || 'Please enter a valid postcode, e.g. CF32 0HA.',
    address: (v) => v.trim().length >= 5 || 'Please enter your address.',
    guests: (v) => !!v || 'Please choose your group size.',
    details: (v) => v.trim().length >= 3 || 'Please tell us what you’d like.',
    message: (v) => v.trim().length >= 5 || 'Please tell us a little more.',
  };
  $$('form[data-send]').forEach((form) => {
    const fields = $$('input, textarea, select', form).filter((el) => rules[el.name] && el.required);
    const check = (el) => { const r = rules[el.name](el.value), box = el.closest('.f'), err = box && $('.err', box), ok = r === true; if (box) box.classList.toggle('bad', !ok); if (err) err.textContent = ok ? '' : r; el.setAttribute('aria-invalid', String(!ok)); return ok; };
    fields.forEach((el) => {
      el.addEventListener('blur', (e) => { if (e.relatedTarget && e.relatedTarget.closest('.form-foot')) return; const bx = el.closest('.f'); if (!el.value.trim() && !(bx && bx.classList.contains('bad'))) return; check(el); });
      el.addEventListener('input', () => { const bx = el.closest('.f'); if (bx && bx.classList.contains('bad')) check(el); });
      el.addEventListener('change', () => { const bx = el.closest('.f'); if (bx && bx.classList.contains('bad')) check(el); });
    });
    const file = $('input[type=file]', form);
    if (file) file.addEventListener('change', () => { const f = file.files[0], hint = $('.hint', file.closest('.f')); if (f && f.size > 5 * 1024 * 1024) { file.value = ''; if (hint) hint.textContent = 'That photo is over 5 MB. Please choose a smaller one.'; } else if (hint && f) hint.textContent = `Attached: ${f.name}`; });
    const status = $('.status', form), btn = $('button[type=submit]', form);
    const valid = () => { if (form.elements._honey && form.elements._honey.value) return false; if (fields.map(check).includes(false)) { status.className = 'status bad'; status.textContent = 'Please fix the highlighted fields and try again.'; const f = $('.f.bad input, .f.bad textarea, .f.bad select', form); if (f) f.focus(); return false; } return true; };
    const summary = () => {
      const lines = [], seen = new Set();
      new FormData(form).forEach((v, k) => {
        if (seen.has(k) || k.startsWith('_') || typeof v !== 'string' || !v.trim()) return; seen.add(k);
        const el = form.querySelector(`[name="${k}"]`); let lab = (el && el.closest('.f') && el.closest('.f').querySelector('label, legend') || {}).textContent || k;
        lab = lab.replace(/\*|\(optional\)/g, '').trim();
        if (el && el.type === 'date') { try { v = new Date(v + 'T12:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); } catch (x) {} }
        lines.push(`${lab}: ${v}`);
      });
      return lines;
    };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!valid()) return;
      if (!S.email) {
        const text = `${form.dataset.send}\n\n${summary().join('\n')}`;
        let copied = false;
        try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); copied = true; } } catch (x) {}
        status.className = 'status ok';
        status.innerHTML = `<strong>Almost done!</strong> ${copied ? 'Your message has been copied. ' : ''}Please call us on <a href="${S.phoneHref}">${S.phone}</a> or send it to us on <a href="${S.messenger}" target="_blank" rel="noopener">Facebook Messenger</a>${copied ? ' (just paste it in)' : ''}.<pre class="handoff">${esc(text)}</pre>`;
        status.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        return;
      }
      const fd = new FormData(form); fd.delete('_honey');
      $$('fieldset[data-multi]', form).forEach((fs) => { const n = fs.dataset.multi, vals = fd.getAll(n); fd.delete(n); if (vals.length) fd.append(n, vals.join(', ')); });
      fd.append('_subject', `${form.dataset.send}${fd.get('topic') ? ' (' + fd.get('topic') + ')' : ''} from ${fd.get('name')} – website`); fd.append('_template', 'table'); fd.append('_captcha', 'false');
      if (fd.get('email')) fd.append('_replyto', fd.get('email'));
      const first = String(fd.get('name')).trim().split(' ')[0];
      btn.disabled = true; form.classList.add('loading');
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${S.email}`, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || String(j.success) === 'false') throw new Error('send');
        form.reset(); $$('.f.bad', form).forEach((b) => b.classList.remove('bad'));
        $$('.hint[data-default]', form).forEach((h) => { h.textContent = h.dataset.default; });
        status.className = 'status ok';
        status.innerHTML = `<strong>Thank you, ${esc(first)}!</strong> Your ${esc(form.dataset.send.toLowerCase())} has been sent. We’ll be in touch soon. Thanks for adding some soul to your day!`;
        status.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      } catch (err) {
        const text = `${form.dataset.send}\n\n${summary().join('\n')}`;
        status.className = 'status bad';
        status.innerHTML = `Sorry, that didn’t send automatically. Please <a href="mailto:${S.email}?subject=${encodeURIComponent(form.dataset.send)}&body=${encodeURIComponent(text)}">email it</a> (filled in for you) or call <a href="${S.phoneHref}">${S.phone}</a>.`;
      } finally { btn.disabled = false; form.classList.remove('loading'); }
    });
  });

  /* Open now / closed (Saskatchewan time, no daylight saving) */
  const openEl = $('[data-open]');
  if (openEl && S.hoursData) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      const get = (t) => (parts.find((x) => x.type === t) || {}).value;
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      const now = (parseInt(get('hour'), 10) % 24) + parseInt(get('minute'), 10) / 60;
      const h = S.hoursData[String(day)];
      const fmt = (f) => { const hh = Math.floor(f), mm = Math.round((f % 1) * 60); return `${((hh + 11) % 12) + 1}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${hh < 12 ? 'am' : 'pm'}`; };
      const dot = $('.topbar .dot');
      if (h && now >= h[0] && now < h[1]) { openEl.textContent = `Open now · until ${fmt(h[1])}`; if (dot) dot.classList.add('on'); }
      else if (h && now < h[0]) openEl.textContent = `Closed now · opens today at ${fmt(h[0])}`;
      else openEl.textContent = 'Closed now · see hours below';
    } catch (e) {}
  }

  const month = new Date().getMonth();
  /* Christmas notices: shown automatically from October to December */
  const xmas = month >= 9;
  $$('[data-xmas]').forEach((el) => { el.hidden = !xmas; });
  $$('[data-not-xmas]').forEach((el) => { el.hidden = xmas; });

  /* Cookie notice + year */
  const ck = $('.cookie');
  if (ck) {
    let seen = false; try { seen = localStorage.getItem('soul-cookie-ok') === '1'; } catch (e) {}
    if (!seen) ck.hidden = false;
    $('button', ck).addEventListener('click', () => { ck.hidden = true; try { localStorage.setItem('soul-cookie-ok', '1'); } catch (e) {} });
  }
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
