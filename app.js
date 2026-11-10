// Dra. Sabrina Rangel — prévia conceitual (Bruno Luque).
// Ideia central: "Avaliação primeiro. Estratégia depois." A estratégia fica trancada (desfocada, carimbada
// "depois") até a avaliação percorrer Histórico, Necessidades e Objetivo.
// O conteúdo funciona sem este arquivo: estados escondidos só existem depois de `motion-ready`.
//
// Motion em 3 camadas
//  ASSINATURA  Hero: seletor de caminho (Presencial / On-line) troca foto, moldura (consultório ↔ tela),
//              mensagem do WhatsApp e destaques da página. Cena presa "A ordem certa" (~320svh, desktop):
//              três cartões acendem em sequência; com os três, a Estratégia sai do desfoque e o carimbo
//              "depois" vira "agora". Botões e teclado também avançam/voltam; mola interrompível.
//              [ix-segmented-morph, ed-lens-focus, ed-stamp-emboss, ix-process-rail, sticky]
//  NARRATIVA   (1) a "cópia" em papel carbono se desfaz na passagem para "Não copie protocolos";
//              (2) o vinho do hero clareia para rosa antigo na mesma passagem;
//              (3) em "Como funciona", as molduras (consultório / tela) se montam ao entrar.
//              [ed-ink-register (invertido: o registro se perde), ed-redaction (risco no título da folha)]
//  INTERFACE   pressão nos botões, cápsula elástica do seletor, cópia com troca de rótulo, CTA fixo no
//              celular, títulos em máscara de linhas, fio das frentes.
//              [press, ix-copy-confirm, ix-sticky-action, line-mask]

const root = document.documentElement;
const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
const fineMQ = matchMedia('(hover: hover) and (pointer: fine)');
const wideMQ = matchMedia('(min-width: 900px)');
const reduce = reduceMQ.matches;
if (reduce) root.classList.add('reduce');

// ---- tokens de motion (espelham o CSS) ----
const EASE_OUT = [0.23, 1, 0.32, 1];
const EASE_IN_OUT = [0.77, 0, 0.175, 1];
const DUR = { press: 0.13, ctl: 0.2, panel: 0.36 };
const SPRING = { k: 120, c: 22 };            // mola da cena (quase criticamente amortecida)
const SPRING_UI = { type: 'spring', stiffness: 420, damping: 32, mass: 0.9 }; // cápsula e carimbo
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const M = window.Motion || null;
if (!M) console.warn('Motion indisponível; página segue estática.');
const animated = !!M && !reduce;
const prog = (p) => (typeof p === 'number' ? p : p?.y?.progress ?? 0);

/* ------------------------------------------------------------------ */
/* WhatsApp: duas mensagens, uma por caminho                            */
/* ------------------------------------------------------------------ */
const WA = 'https://wa.me/5548991175501';
const MSG = {
  presencial: 'Olá, Dra. Sabrina! Gostaria de agendar uma avaliação presencial em Tubarão.',
  online: 'Olá, Dra. Sabrina! Gostaria de agendar uma consulta on-line.',
};
const waUrl = (k) => `${WA}?text=${encodeURIComponent(MSG[k])}`;

// mola 1D interrompível: mantém a velocidade ao mudar o alvo; para em repouso e com a aba oculta
function spring1(apply, { k = SPRING.k, c = SPRING.c } = {}) {
  const s = { x: 0, v: 0, t: 0, raf: 0, last: 0 };
  const tick = (now) => {
    const dt = Math.min(0.032, (now - (s.last || now)) / 1000 || 0.016); s.last = now;
    s.v += (-k * (s.x - s.t) - c * s.v) * dt; s.x += s.v * dt;
    if (Math.abs(s.x - s.t) + Math.abs(s.v) > 0.0008 && !document.hidden) { apply(s.x); s.raf = requestAnimationFrame(tick); }
    else { s.x = s.t; s.v = 0; s.raf = 0; s.last = 0; apply(s.x); }
  };
  return {
    to(t) { s.t = t; if (!s.raf) s.raf = requestAnimationFrame(tick); },
    set(x) { cancelAnimationFrame(s.raf); s.raf = 0; s.last = 0; s.x = s.t = x; s.v = 0; apply(x); },
    get x() { return s.x; },
    get target() { return s.t; },
  };
}

/* ------------------------------------------------------------------ */
/* Topo, rolagem contínua (só roda do mouse) e âncoras                  */
/* ------------------------------------------------------------------ */
const top = $('[data-top]');
const hero = $('[data-hero]');
const onScrollTop = () => top.classList.toggle('is-solid', scrollY > 24);
addEventListener('scroll', onScrollTop, { passive: true }); onScrollTop();

let lenis = null;
function startLenis() {
  if (reduce || !window.Lenis || lenis || !fineMQ.matches) return;
  lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95 });
  const raf = (t) => { if (!lenis) return; lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
if (window.Lenis) startLenis(); else addEventListener('load', startLenis, { once: true });
reduceMQ.addEventListener('change', () => { if (reduceMQ.matches && lenis) { lenis.destroy(); lenis = null; } });
const goTo = (y, instant) => {
  if (lenis) lenis.scrollTo(y, { duration: instant ? 0 : 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else scrollTo({ top: y, behavior: reduce || instant ? 'auto' : 'smooth' });
};
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = id === '#inicio' ? document.body : $(id);
  if (!target) return;
  e.preventDefault();
  const y = id === '#inicio' ? 0 : target.getBoundingClientRect().top + scrollY - (id === '#ordem' && pinned ? 0 : top.offsetHeight + 8);
  goTo(y);
  if (id !== '#inicio') { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
});

/* ------------------------------------------------------------------ */
/* ASSINATURA 1 · seletor de caminho (cápsula elástica)                 */
/* ------------------------------------------------------------------ */
const opts = $$('[data-path-opt]');
const cap = $('.path__cap');
const optsBox = $('.path__opts');
const imgs = { presencial: $('[data-img="presencial"]'), online: $('[data-img="online"]') };
let path = 'presencial';

function capRect(btn) {
  return { x: btn.offsetLeft, y: btn.offsetTop, w: btn.offsetWidth, h: btn.offsetHeight };
}
function placeCap(btn) {
  const r = capRect(btn);
  cap.style.setProperty('--cx', r.x + 'px'); cap.style.setProperty('--cy', r.y + 'px');
  cap.style.setProperty('--cw', r.w + 'px'); cap.style.setProperty('--ch', r.h + 'px');
  cap.style.transform = '';
}
let capAnim = null;
function morphCap(from, to) {
  if (!animated) { placeCap(to); return; }
  const a = capRect(from), b = capRect(to);
  // a cápsula se estica até cobrir as duas opções e então assume a nova medida
  const left = Math.min(a.x, b.x), topY = Math.min(a.y, b.y);
  const spanW = Math.max(a.x + a.w, b.x + b.w) - left, spanH = Math.max(a.y + a.h, b.y + b.h) - topY;
  placeCap(to);
  if (capAnim) capAnim.stop();
  const sx0 = a.w / b.w, sy0 = a.h / b.h;
  const dx0 = a.x - b.x, dy0 = a.y - b.y;
  const sxM = spanW / b.w, syM = spanH / b.h, dxM = left - b.x, dyM = topY - b.y;
  cap.style.transformOrigin = '0 0';
  capAnim = M.animate(cap, {
    transform: [
      `translate(${dx0}px, ${dy0}px) scale(${sx0}, ${sy0})`,
      `translate(${dxM}px, ${dyM}px) scale(${sxM}, ${syM})`,
      'translate(0px, 0px) scale(1, 1)',
    ],
  }, { duration: 0.46, times: [0, 0.42, 1], ease: [EASE_OUT, [0.34, 1.32, 0.64, 1]] });
}

let imgAnim = [];
function setPath(next, { focus = false, silent = false } = {}) {
  const prevBtn = opts.find((o) => o.dataset.pathOpt === path);
  const nextBtn = opts.find((o) => o.dataset.pathOpt === next);
  opts.forEach((o) => { const on = o === nextBtn; o.setAttribute('aria-checked', String(on)); o.tabIndex = on ? 0 : -1; });
  if (focus) nextBtn.focus();
  if (next === path && !silent) return;
  const prev = path;
  path = next;
  root.dataset.path = next;
  if (!silent) morphCap(prevBtn, nextBtn); else placeCap(nextBtn);
  // mensagem e links
  $$('[data-wa]').forEach((a) => (a.href = waUrl(next)));
  $$('[data-msg]').forEach((m) => (m.textContent = `“${MSG[next]}”`));
  const sk = $('[data-sticky-k]'); if (sk) sk.textContent = next === 'online' ? 'on-line' : 'presencial';
  $$('[data-via]').forEach((v) => v.classList.toggle('is-pick', v.dataset.via === next));
  $$('[data-c]').forEach((c) => c.classList.toggle('is-pick', c.dataset.c === next));
  // foto: a que sai cresce e some; a que entra sobe por uma cortina
  const out = imgs[prev], inn = imgs[next];
  out.classList.remove('is-on'); out.setAttribute('aria-hidden', 'true');
  inn.classList.add('is-on'); inn.removeAttribute('aria-hidden');
  if (silent || !animated || prev === next) return;
  imgAnim.forEach((a) => a.stop());
  const reset = (el) => { el.getAnimations().forEach((a) => a.cancel()); el.style.opacity = ''; el.style.transform = ''; el.style.clipPath = ''; el.style.zIndex = ''; };
  reset(out); reset(inn);
  out.style.zIndex = '2';
  imgAnim = [
    M.animate(out, { opacity: [1, 0], transform: ['scale(1)', 'scale(1.05)'] }, { duration: DUR.panel + 0.1, ease: EASE_OUT }),
    M.animate(inn, { opacity: [1, 1], clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'], transform: ['scale(1.08)', 'scale(1)'] }, { duration: 0.62, ease: EASE_IN_OUT }),
  ];
  const mine = imgAnim;
  imgAnim[0].then(() => { if (imgAnim === mine) reset(out); });
  imgAnim[1].then(() => { if (imgAnim === mine) reset(inn); });
}
opts.forEach((o) => o.addEventListener('click', () => setPath(o.dataset.pathOpt)));
if (optsBox) optsBox.addEventListener('keydown', (e) => {
  const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (!k) return;
  e.preventDefault();
  const i = opts.findIndex((o) => o.dataset.pathOpt === path);
  setPath(opts[(i + k + opts.length) % opts.length].dataset.pathOpt, { focus: true });
});
setPath('presencial', { silent: true });
addEventListener('resize', () => placeCap(opts.find((o) => o.dataset.pathOpt === path)));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => placeCap(opts.find((o) => o.dataset.pathOpt === path)));

/* ------------------------------------------------------------------ */
/* Contato: copiar a mensagem do caminho escolhido                      */
/* ------------------------------------------------------------------ */
const copyBtn = $('[data-copy]'), copyOk = $('[data-copy-ok]');
if (copyBtn) {
  let t = 0;
  copyBtn.addEventListener('click', async () => {
    const v = MSG[path];
    let ok = true;
    try { await navigator.clipboard.writeText(v); }
    catch {
      const ta = Object.assign(document.createElement('textarea'), { value: v });
      ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
    }
    copyOk.textContent = ok ? 'Mensagem copiada.' : 'Não foi possível copiar; selecione o texto da mensagem.';
    copyBtn.classList.toggle('is-done', ok);
    clearTimeout(t); t = setTimeout(() => { copyBtn.classList.remove('is-done'); copyOk.textContent = ''; }, 2400);
  });
}

/* ------------------------------------------------------------------ */
/* CTA fixo no celular: aparece depois do hero, some no contato         */
/* ------------------------------------------------------------------ */
const sticky = $('[data-sticky]');
if (sticky) {
  let pastHero = false, inContact = false;
  const upd = () => sticky.classList.toggle('is-on', pastHero && !inContact);
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; upd(); }, { threshold: 0 }).observe($('.hero__actions'));
  new IntersectionObserver(([e]) => { inContact = e.isIntersecting; upd(); }, { threshold: 0.1 }).observe($('[data-contato]'));
}

/* ------------------------------------------------------------------ */
/* ASSINATURA 2 · "A ordem certa"                                       */
/* valor x ∈ [0, 4]: 0–3 acende os cartões; 3–4 tira a Estratégia do    */
/* desfoque e troca o carimbo.                                          */
/* ------------------------------------------------------------------ */
const scene = $('[data-scene]');
const steps = $$('[data-step]');
const strat = $('[data-strat]');
const stamp = $('[data-stamp]');
const rail = $('[data-rail]');
const btnPrev = $('[data-prev]'), btnNext = $('[data-next]');
const live = $('[data-ordem-live]');
const NAMES = ['Histórico', 'Necessidades', 'Objetivo'];
let pinned = false, stampNow = null, stampAnim = null;

function setStamp(now) {
  if (now === stampNow) return;
  const first = stampNow === null;
  stampNow = now;
  stamp.classList.toggle('is-now', now);
  if (first || !animated) return;
  if (stampAnim) stampAnim.stop();
  // o carimbo desce, pressiona o papel e assenta (ed-stamp-emboss)
  stampAnim = M.animate(stamp, now
    ? { transform: ['rotate(-7deg) scale(1.55)', 'rotate(-9deg) scale(.92)', 'rotate(-7deg) scale(1)'], opacity: [0.2, 1, 1] }
    : { transform: ['rotate(-7deg) scale(1.12)', 'rotate(-7deg) scale(1)'], opacity: [0.5, 1] },
  { duration: now ? 0.5 : 0.3, times: now ? [0, 0.55, 1] : undefined, ease: EASE_OUT });
}
function render(x) {
  steps.forEach((s, i) => {
    const lit = clamp(x - i);
    s.style.setProperty('--lit', lit.toFixed(3));
    s.classList.toggle('is-lit', lit >= 0.5);
  });
  if (rail) rail.style.setProperty('--rail', clamp(x / 4).toFixed(3));
  const r = smooth(clamp(x - 3));
  strat.style.setProperty('--blur', ((1 - r) * 9).toFixed(2));
  strat.style.setProperty('--veil', (1 - r).toFixed(3));
  setStamp(r >= 0.6);
  const k = Math.round(x);
  if (btnPrev) btnPrev.setAttribute('aria-disabled', String(k <= 0));
  if (btnNext) btnNext.setAttribute('aria-disabled', String(k >= 4));
}
const sceneSpring = spring1(render);

// ---- modo preso (desktop): detentes por rolagem ----
const SPAN = 0.86;          // fração da cena usada pelas quatro passagens; o resto é descanso final
function xFromP(p) {
  const s = clamp(p / SPAN) * 4, k = Math.min(3, Math.floor(s)), l = s - k;
  if (s >= 4) return 4;
  return k + smooth(clamp((l - 0.35) / 0.65));   // cada etapa descansa no começo da sua zona
}
function pFromX(v) { return v >= 4 ? 0.93 : ((v + 0.15) / 4) * SPAN; }
let cancelPin = null, cancelFlow = null;
function pinOn() {
  if (pinned) return;
  flowOff();
  pinned = true;
  root.classList.add('pinned');
  cancelPin = M.scroll((p) => sceneSpring.to(xFromP(prog(p))), { target: scene, offset: ['start start', 'end end'] });
}
function pinOff() {
  if (!pinned) return;
  pinned = false;
  cancelPin && cancelPin(); cancelPin = null;
  root.classList.remove('pinned');
}
// ---- modo fluxo (celular e telas baixas): cada bloco acende ao cruzar a linha de leitura ----
let flowRaf = 0;
function flowRead() {
  flowRaf = 0;
  const vh = innerHeight;
  const blocks = [...steps, strat];
  let x = 0;
  blocks.forEach((b, i) => {
    const t = b.getBoundingClientRect().top;
    const line = i === 3 ? 0.78 : 0.74;
    x += clamp((vh * line - t) / (vh * 0.26));
  });
  sceneSpring.to(x);
}
const onFlow = () => { if (!flowRaf) flowRaf = requestAnimationFrame(flowRead); };
function flowOn() {
  if (cancelFlow) return;
  addEventListener('scroll', onFlow, { passive: true });
  cancelFlow = () => { removeEventListener('scroll', onFlow); cancelAnimationFrame(flowRaf); flowRaf = 0; };
  flowRead();
}
function flowOff() { cancelFlow && cancelFlow(); cancelFlow = null; }

// botões e teclado: vão ao detente seguinte/anterior; a mola acompanha e pode ser interrompida
function goStep(v) {
  v = clamp(v, 0, 4);
  if (pinned) {
    const y = scene.getBoundingClientRect().top + scrollY + pFromX(v) * (scene.offsetHeight - innerHeight);
    goTo(y);
  } else {
    const el = v === 0 ? scene : v === 4 ? strat : steps[v - 1];
    const y = el.getBoundingClientRect().top + scrollY - innerHeight * (v === 4 ? 0.3 : 0.4);
    goTo(y);
  }
  live.textContent = v === 0 ? 'Nenhuma etapa concluída.' : v < 4 ? `Etapa ${v} de 3 concluída: ${NAMES[v - 1]}.` : 'As três etapas concluídas. Estratégia liberada.';
}
const curStep = () => Math.round(sceneSpring.target);
if (btnNext) btnNext.addEventListener('click', () => goStep(curStep() + 1));
if (btnPrev) btnPrev.addEventListener('click', () => goStep(curStep() - 1));
if (scene) scene.addEventListener('keydown', (e) => {
  if (e.target.closest('a')) return;
  const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
  if (k && e.target.closest('[data-ctl]')) { e.preventDefault(); goStep(curStep() + k); }
});
// quem chega pelo teclado ao botão da Estratégia vê a etapa liberada
const stratCta = $('[data-strat-cta]');
if (stratCta) stratCta.addEventListener('focus', () => { if (animated && curStep() < 4) goStep(4); });

const canPin = () => animated && wideMQ.matches && innerHeight >= 640;
function applyMode() {
  if (!scene) return;
  if (!animated) { pinOff(); flowOff(); sceneSpring.set(4); return; }
  if (canPin()) pinOn(); else { pinOff(); flowOn(); }
}
let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(applyMode, 140); });
wideMQ.addEventListener('change', applyMode);

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */
if (animated) {
  const { animate, scroll, inView, stagger } = M;
  root.classList.add('motion-ready');
  sceneSpring.set(0);

  /* ---- ASSINATURA 1 · entrada do hero ---- */
  animate('.hero__title .line > span', { transform: ['translateY(110%)', 'translateY(0%)'] }, { duration: 0.95, delay: stagger(0.08), ease: EASE_OUT });
  animate('.frame__win', { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] }, { duration: 1.05, delay: 0.12, ease: EASE_IN_OUT });
  animate('.frame__img.is-on', { transform: ['scale(1.1)', 'scale(1)'] }, { duration: 1.4, delay: 0.12, ease: EASE_OUT });
  animate('.hero__lead, .path, .hero__actions', { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] }, { duration: 0.7, delay: stagger(0.08, { startDelay: 0.35 }), ease: EASE_OUT });
  animate('.hero__cap', { opacity: [0, 1] }, { duration: 0.5, delay: 1.1, ease: EASE_OUT });
  // a ordem em miniatura ao lado do retrato: três itens e o carimbo "depois" pressionado por último
  animate('.mini li', { opacity: [0, 1], transform: ['translateX(-10px)', 'translateX(0)'] }, { duration: 0.5, delay: stagger(0.11, { startDelay: 0.75 }), ease: EASE_OUT });
  animate('.stamp--mini', { transform: ['rotate(-6deg) scale(1.8)', 'rotate(-8deg) scale(.92)', 'rotate(-6deg) scale(1)'], opacity: [0, 1, 1] }, { duration: 0.5, delay: 1.3, times: [0, 0.55, 1], ease: EASE_OUT });

  /* ---- NARRATIVA 1 e 2 · a cópia se desfaz; o vinho clareia para rosa antigo ---- */
  const principio = $('[data-principio]');
  const passagem = $('[data-passagem]');
  const copia = $('[data-copia]');
  const risco = $('[data-risco]');
  const copyLines = $$('.folha__l', copia);
  const nota = $('.folha__nota');
  if (principio && passagem) {
    let B = passagem.offsetHeight;
    addEventListener('resize', () => (B = passagem.offsetHeight));
    const paint = (t) => {
      // vinho recua do alto da faixa até sumir
      principio.style.setProperty('--dawn', (lerp(0.95, -0.95, smooth(t)) * B).toFixed(1) + 'px');
      // registro que se perde: a cópia escorrega, borra e some
      const u = smooth(clamp(t / 0.85));
      const dx = lerp(0, 90, u), dy = lerp(0, -46, u), rot = lerp(0, -7, u);
      copia.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      copia.style.rotate = `${rot.toFixed(2)}deg`;
      copia.style.filter = `blur(${lerp(1.4, 14, u).toFixed(2)}px)`;
      copia.style.opacity = (0.7 * Math.pow(1 - u, 1.3)).toFixed(3);
      copyLines.forEach((l, i) => { l.style.transform = `scaleX(${(1 - clamp(u * 1.4 - i * 0.08) * 0.85).toFixed(3)})`; });
      // a folha original é riscada: não é a sua
      const s = smooth(clamp((t - 0.45) / 0.35));
      risco.style.transform = `scaleX(${s.toFixed(3)})`;
      nota.style.opacity = smooth(clamp((t - 0.62) / 0.3)).toFixed(3);
    };
    paint(0);
    scroll((p) => paint(clamp(prog(p))), { target: principio, offset: ['start end', 'start 0.05'] });
  }

  /* ---- NARRATIVA 3 · molduras de "Como funciona" se montam ao entrar ---- */
  $$('.via').forEach((v) => {
    const fr = $('.via__frame', v), img = $('.crop img', v);
    const isTela = fr.classList.contains('via__frame--tela');
    fr.style.opacity = '0';
    inView(v, () => {
      animate(fr, isTela
        ? { opacity: [0, 1], paddingTop: ['6px', '30px'], borderRadius: ['4px', '14px'] }
        : { opacity: [0, 1], padding: ['0px', '9px'] },
      { duration: 0.7, ease: EASE_OUT });
      animate(img, { scale: [1.08, 1] }, { duration: 1.1, ease: EASE_OUT });
    }, { amount: 0.35 });
  });

  /* ---- INTERFACE · títulos em máscara de linhas; fio das frentes ---- */
  $$('[data-mask]').forEach((h) => {
    const spans = $$('.line > span', h);
    inView(h, () => { animate(spans, { transform: ['translateY(110%)', 'translateY(0%)'] }, { duration: 0.9, delay: stagger(0.08), ease: EASE_OUT }); }, { amount: 0.4 });
  });
  $$('.fr__i').forEach((li) => {
    scroll((p) => li.style.setProperty('--fr', smooth(clamp(prog(p))).toFixed(3)), { target: li, offset: ['start 0.95', 'start 0.6'] });
  });
}

applyMode();
