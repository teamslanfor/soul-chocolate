/* Soul Chocolate – scripted chat assistant (no AI service, no dependencies). */
(function () {
  'use strict';
  const S = window.SITE || {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const css = `
  .lt-btn{position:fixed;right:18px;bottom:18px;z-index:70;display:flex;align-items:center;gap:10px;padding:8px 20px 8px 8px;border:0;border-radius:999px;background:#221e1f;color:#fff;font:800 .95rem 'Big Shoulders Display',Impact,sans-serif;cursor:pointer;box-shadow:0 14px 30px -12px rgba(34,30,31,.6);transition:transform .35s cubic-bezier(.22,.7,.2,1),box-shadow .35s}
  .lt-btn:hover{transform:translateY(-3px);box-shadow:0 18px 34px -12px rgba(34,30,31,.7)}
  .lt-btn i{width:40px;height:40px;border-radius:50%;background:#dcebfb;display:grid;place-items:center;font-style:normal;font-size:1.3rem}
  .lt-panel{position:fixed;right:18px;bottom:90px;z-index:71;width:min(370px,calc(100vw - 36px));height:min(540px,calc(100vh - 120px));background:#fff;border-radius:24px;box-shadow:0 30px 70px -24px rgba(43,27,46,.55);display:flex;flex-direction:column;overflow:hidden;transform:translateY(16px) scale(.97);opacity:0;pointer-events:none;transition:all .35s cubic-bezier(.22,.7,.2,1)}
  .lt-panel.open{transform:none;opacity:1;pointer-events:auto}
  .lt-head{background:#221e1f;color:#fff;padding:15px 18px;display:flex;align-items:center;gap:12px}
  .lt-head b{display:block;font:800 1.15rem 'Big Shoulders Display',Impact,sans-serif}
  .lt-head small{color:#dcebfb;font-size:.78rem}
  .lt-head .x{margin-left:auto;background:rgba(255,255,255,.15);border:0;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:1rem}
  .lt-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f7f3ee}
  .lt-m{max-width:86%;padding:10px 14px;border-radius:18px;font-size:.93rem;line-height:1.5;white-space:pre-line;animation:ltIn .35s ease both}
  .lt-m a{color:#221e1f;font-weight:800}
  .lt-bot{background:#fff;border:1px solid #e7e0d8;border-bottom-left-radius:5px;color:#3b3040}
  .lt-me{align-self:flex-end;background:#221e1f;color:#fff;border-bottom-right-radius:5px}
  .lt-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px;background:#f7f3ee}
  .lt-chips button{border:2px solid #221e1f;background:#fff;color:#221e1f;border-radius:999px;padding:5px 12px;font:700 .82rem 'Manrope',system-ui,sans-serif;cursor:pointer;transition:all .25s}
  .lt-chips button:hover{background:#221e1f;color:#dcebfb}
  .lt-form{display:flex;gap:8px;padding:12px;border-top:1px solid #e7e0d8;background:#fff}
  .lt-form input{flex:1;min-width:0;border:2px solid #e7e0d8;border-radius:14px;padding:10px 14px;font:inherit;font-size:.94rem}
  .lt-form input:focus{outline:none;border-color:#221e1f}
  .lt-form button{width:44px;height:44px;border-radius:14px;border:0;background:#221e1f;color:#fff;cursor:pointer;display:grid;place-items:center}
  .lt-form svg{width:18px;height:18px}
  .lt-typing{display:inline-flex;gap:4px}.lt-typing span{width:6px;height:6px;border-radius:50%;background:#c9b8cc;animation:ltDot 1s infinite}.lt-typing span:nth-child(2){animation-delay:.15s}.lt-typing span:nth-child(3){animation-delay:.3s}
  @keyframes ltIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  @keyframes ltDot{0%,80%,100%{opacity:.3}40%{opacity:1}}
  @media (max-width:640px){.lt-btn span{display:none}.lt-btn{padding:6px;bottom:88px;right:14px}.lt-panel{bottom:150px;right:14px;height:min(500px,calc(100vh - 180px))}}
  @media (prefers-reduced-motion:reduce){.lt-m,.lt-panel{animation:none;transition:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const sendI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>';
  const root = document.createElement('div');
  root.innerHTML = `
  <button class="lt-btn" aria-expanded="false" aria-controls="lt-panel"><i aria-hidden="true">🍫</i><span>Ask Soul</span></button>
  <section class="lt-panel" id="lt-panel" role="dialog" aria-label="Chat with Soul Chocolate">
    <div class="lt-head"><div><b>Soul Chocolate</b><small>Automated assistant · set answers</small></div><button class="x" aria-label="Close chat">✕</button></div>
    <div class="lt-body" aria-live="polite"></div>
    <div class="lt-chips"></div>
    <form class="lt-form"><label class="sr-only" for="lt-in">Type your message</label><input id="lt-in" autocomplete="off" placeholder="Ask about bars, hot chocolate, workshops…" maxlength="300"><button aria-label="Send">${sendI}</button></form>
  </section>`;
  document.body.appendChild(root);
  const btn = root.querySelector('.lt-btn'), panel = root.querySelector('.lt-panel'), body = root.querySelector('.lt-body'),
    chipBox = root.querySelector('.lt-chips'), form = root.querySelector('.lt-form'), input = root.querySelector('#lt-in');
  let started = false, busy = false;
  const add = (h, who = 'bot') => { const m = document.createElement('div'); m.className = 'lt-m lt-' + who; m.innerHTML = h; body.appendChild(m); body.scrollTop = body.scrollHeight; return m; };
  const say = (h, w = 420) => new Promise((r) => { const tp = add('<span class="lt-typing"><span></span><span></span><span></span></span>'); setTimeout(() => { tp.innerHTML = h; body.scrollTop = body.scrollHeight; r(); }, w); });
  const chips = (l) => { chipBox.innerHTML = ''; l.forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.onclick = () => handle(c); chipBox.appendChild(b); }); };
  const MAIN = ['Chocolate bars', 'Hot chocolate', 'Workshops', 'Wholesale', 'Visit us'];
  const tel = () => `<a href="${S.phoneHref}">${S.phone}</a>`;
  const shop = (h, t) => `<a href="${S.store}/products/${h}" target="_blank" rel="noopener">${t}</a>`;
  const contact = () => `✉️ <a href="mailto:${S.email}">${esc(S.email)}</a>\n📞 ${tel()}\n📍 ${esc(S.address)}`;
  const intents = [
    { re: /workshop|class|making|team|corporate event|birthday|group|experience|book/i, run: () => say(`Our hands-on chocolate making and tasting workshop is 2.5 hours, from cacao bean to your own finished bar. Tickets: $120 for one, $200 for two, $280 for three, $360 for four. <a href="workshops.html">Workshops & private groups</a>`).then(() => chips(['Visit us', 'Contact'])) },
    { re: /wholesale|\bstock (your|in)|retail|cafe|café|restaurant|bulk|private label|corporate gift/i, run: () => say(`Want to carry Soul in your shop, café or restaurant, or need corporate gifts? Email <a href="mailto:${S.sales}">${S.sales}</a> or use the <a href="contact.html?type=Wholesale#message">contact form</a>.`).then(() => chips(MAIN)) },
    { re: /hot ?choc|cocoa drink|mayan|peppermint|drink|mocha/i, run: () => say(`Our hot chocolate mixes are our highest-reviewed products: Classic, Mayan and Peppermint, in tins or single-serve pouches. <a href="shop.html?tab=drink">See hot chocolate</a>`).then(() => chips(['Chocolate bars', 'Shipping'])) },
    { re: /bake|baking|chip|disc|nib|cocoa powder|cookie|brownie/i, run: () => say(`For bakers: 70% dark and semi-sweet chocolate chips, 70% baking discs, organic cacao nibs and natural cocoa powder. <a href="shop.html?tab=baking">See baking chocolate</a>`).then(() => chips(MAIN)) },
    { re: /vegan|dairy|plant|mylk|sugar.?free|allerg|nut|gluten|organic/i, run: () => say(`Many of our dark bars are made with just organic cacao and organic cane sugar, and there’s a Plant Based Mylk bar too. Check each product for full ingredients and allergen info, or email <a href="mailto:${S.email}">${S.email}</a>.`).then(() => chips(MAIN)) },
    { re: /advent|gift|christmas|stocking|present|card/i, run: () => say(`Gift ideas: single-origin advent calendars, gift cards, workshop gift cards and bundles. <a href="shop.html?tab=gifts">See gifts</a>`).then(() => chips(MAIN)) },
    { re: /origin|source|sourcing|fair|ethical|farmer|trade|transparen|single/i, run: () => say(`We name our suppliers, like Camino Verde (Ecuador), Osito Coffee (Colombia) and Oko-Caribe (Dominican Republic), and publish what we pay above Fair Trade. <a href="origins.html">Sourcing & transparency</a>`).then(() => chips(MAIN)) },
    { re: /bar|dark|milk|white|salt|madagascar|colombia|ecuador|tanzania|flavou?r|best ?sell/i, run: () => say(`Our single-origin bars come from Colombia, Ecuador, Madagascar, Tanzania, the Dominican Republic and more. The best-seller is the Mountain Flake Salt 70% Dark. <a href="shop.html">See all bars</a>`).then(() => chips(['Hot chocolate', 'Workshops'])) },
    { re: /ship|deliver|order status|return|refund|track/i, run: () => say(`We ship our chocolate across Canada from our online shop. For order status or returns, email <a href="mailto:${S.orders}">${S.orders}</a>.`).then(() => chips(MAIN)) },
    { re: /where|visit|address|location|shop|store|open|hour|toronto|leslieville/i, run: () => say(`Our chocolate workshop is at 📍 ${esc(S.address)}. Call ${tel()} before visiting. <a href="contact.html#visit">Map & directions</a>`).then(() => chips(MAIN)) },
    { re: /contact|phone|call|email|talk|message|press/i, run: () => say(`You can reach us here:\n${contact()}`).then(() => chips(MAIN)) },
    { re: /^(hi|hello|hey|hiya|good (morning|afternoon|evening))\b/i, run: () => say('Hi there! 🍫 What can we help you with?').then(() => chips(MAIN)) },
    { re: /thank|cheers|great|perfect|love/i, run: () => say('You’re welcome! Enjoy your chocolate. 🍫').then(() => chips(MAIN)) },
  ];
  async function handle(text) {
    if (busy || !text.trim()) return;
    busy = true; add(esc(text), 'me');
    try {
      const map = { 'Chocolate bars': 'bars', 'Hot chocolate': 'hot chocolate', 'Workshops': 'workshop', 'Wholesale': 'wholesale', 'Shipping': 'shipping', 'Visit us': 'visit location', 'Contact': 'contact' };
      const q = map[text] || text, hit = intents.find((i) => i.re.test(q));
      if (hit) { await hit.run(); return; }
      await say(`I don’t have a set answer for that one, but we can help:\n${contact()}`); chips(MAIN);
    } finally { busy = false; }
  }
  const open = async (s) => {
    panel.classList.toggle('open', s); btn.setAttribute('aria-expanded', String(s));
    if (s) { input.focus(); if (!started) { started = true; await say('Hi! Welcome to <strong>Soul Chocolate</strong>, bean-to-bar chocolate made in Toronto. Ask me about our bars, hot chocolate, workshops or wholesale.', 300); chips(MAIN); } }
  };
  btn.addEventListener('click', () => open(!panel.classList.contains('open')));
  root.querySelector('.x').addEventListener('click', () => open(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) open(false); });
  form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; handle(v); });
})();
