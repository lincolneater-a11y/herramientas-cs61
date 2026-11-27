/* =====================================================================
   SISTEMA DE DISEÑO · sonido, música, tema y panel de ajustes
   Centro de Salud N.º 61 · Nodo Solidaridad
   - Todo se genera en el navegador (sin archivos de audio, sin derechos de autor).
   - Nada suena solo: la música y los sonidos arrancan con un toque del usuario.
   - Categorías independientes: interfaz, efectos de juegos, música; cada una con volumen.
   - Preferencias en localStorage (clave cs61_ds).
   API:  CS61DS.ui('tap'|'nav'|'back'|'toggle'|'open'|'close'|'ok'|'err')
         CS61DS.fx('ok'|'bad'|'dice'|'step'|'spin'|'medal'|'win'|'tick'|'pop'|'start', arg)
         CS61DS.music.start()/stop()/toggle()/playing()
         CS61DS.hold(true|false)   silencia todo (p. ej. mientras se graba una consulta)
   ===================================================================== */
(function () {
  'use strict';
  if (window.CS61DS) return;
  var NativeAC = window.AudioContext || window.webkitAudioContext;
  var KEY = 'cs61_ds';
  var DEF = { master: 1, ui: 1, clin: 0, fx: 1, mus: 1, vui: .45, vfx: .8, vmus: .5, theme: 'auto' };
  var D = {}, k;
  for (k in DEF) D[k] = DEF[k];
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv) for (k in sv) if (k in DEF) D[k] = sv[k]; } catch (e) { }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { } }

  var root = document.documentElement;
  var HELD = 0;
  /* ---------- tema (se aplica antes de pintar) ---------- */
  function applyTheme() {
    if (D.theme === 'light' || D.theme === 'dark') root.setAttribute('data-theme', D.theme);
    else root.removeAttribute('data-theme');
    try {
      var m = document.querySelector('meta[name=theme-color]');
      var dark = D.theme === 'dark' || (D.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
      if (m) m.setAttribute('content', dark ? '#0b2c52' : '#0f4c8a');
    } catch (e) { }
  }
  applyTheme();

  /* ---------- contexto de audio propio ---------- */
  var ctx = null, gMaster, gUI, gFX, gMUS, comp, wet, wetG;
  var extra = [];                                   // contextos de juegos viejos (se les aplica silencio general y volumen)
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    if (!NativeAC) return null;
    try {
      ctx = new NativeAC();
      comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3.5;
      gMaster = ctx.createGain(); gUI = ctx.createGain(); gFX = ctx.createGain(); gMUS = ctx.createGain();
      gUI.connect(gMaster); gFX.connect(gMaster); gMUS.connect(gMaster); gMaster.connect(comp); comp.connect(ctx.destination);
      // eco suave para la caja de música
      var dl = ctx.createDelay(1); dl.delayTime.value = .27; var fb = ctx.createGain(); fb.gain.value = .32;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      wet = ctx.createGain(); wet.gain.value = 1; wetG = ctx.createGain(); wetG.gain.value = .35;
      wet.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wetG); wetG.connect(gMUS);
      levels();
    } catch (e) { ctx = null; }
    return ctx;
  }
  function eff(v) { return Math.pow(v, 1.6); }
  function levels() {
    var m = (D.master && !HELD) ? 1 : 0;
    if (ctx) {
      var t = ctx.currentTime;
      gMaster.gain.setTargetAtTime(m, t, .03);
      gUI.gain.setTargetAtTime(D.ui ? eff(D.vui) : 0, t, .03);
      gFX.gain.setTargetAtTime(D.fx ? eff(D.vfx) : 0, t, .03);
      gMUS.gain.setTargetAtTime(D.mus ? eff(D.vmus) * .9 : 0, t, .08);
    }
    extra.forEach(function (e) { try { e.g.gain.value = m * (D.fx ? eff(D.vfx) : 0); } catch (x) { } });
    media.forEach(function (a) { try { a.muted = !(m && D.mus); a.volume = Math.min(1, eff(D.vmus) * 1.3); } catch (x) { } });
  }

  /* ---------- compatibilidad: juegos con su propio AudioContext ---------- */
  var media = [];
  if (NativeAC) {
    var Wrapped = function (o) {
      var c = new NativeAC(o), real = c.destination, g = c.createGain();
      g.connect(real);
      try { Object.defineProperty(c, 'destination', { value: g, configurable: true }); } catch (e) { }
      extra.push({ c: c, g: g }); levels();
      return c;
    };
    Wrapped.prototype = NativeAC.prototype;
    window.AudioContext = Wrapped; window.webkitAudioContext = Wrapped;
  }
  try {
    var origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (media.indexOf(this) < 0) { media.push(this); levels(); }
      return origPlay.apply(this, arguments);
    };
  } catch (e) { }

  /* ---------- sintetizadores ---------- */
  function now() { return ctx.currentTime; }
  function osc(dest, type, f, t, dur, vol, o) {
    o = o || {};
    var os = ctx.createOscillator(), g = ctx.createGain();
    os.type = type; os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    var a = o.a || .005;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    os.connect(g); g.connect(dest); if (o.send) g.connect(o.send);
    os.start(t); os.stop(t + dur + .03);
  }
  function bell(dest, f, t, dur, vol, send) {            // timbre de caja de música / campanita
    osc(dest, 'sine', f, t, dur, vol, { send: send });
    osc(dest, 'sine', f * 2.01, t, dur * .55, vol * .32, { send: send });
    osc(dest, 'sine', f * 3.9, t, dur * .22, vol * .12);
  }
  function noise(dest, t, dur, vol, f, q) {
    var n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ctx.createBufferSource(); s.buffer = b;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q || 3;
    var g = ctx.createGain(); g.gain.value = vol;
    s.connect(bp); bp.connect(g); g.connect(dest); s.start(t);
  }
  var U = {                                                // sonidos de interfaz (suaves, "premium")
    tap: function (t, d) { osc(d, 'sine', 880, t, .11, .22, { to: 700 }); osc(d, 'sine', 1760, t, .06, .06); },
    nav: function (t, d) { osc(d, 'sine', 523, t, .16, .2); osc(d, 'sine', 784, t + .07, .22, .2); osc(d, 'sine', 1568, t + .07, .1, .05); },
    back: function (t, d) { osc(d, 'sine', 740, t, .14, .2); osc(d, 'sine', 494, t + .07, .2, .2); },
    toggle: function (t, d) { osc(d, 'triangle', 620, t, .08, .2); osc(d, 'triangle', 930, t + .05, .1, .16); },
    open: function (t, d) { osc(d, 'sine', 440, t, .22, .16, { to: 660 }); osc(d, 'sine', 880, t + .05, .18, .08); },
    close: function (t, d) { osc(d, 'sine', 660, t, .2, .15, { to: 420 }); },
    ok: function (t, d) { bell(d, 784, t, .5, .2); bell(d, 1047, t + .09, .6, .18); },
    err: function (t, d) { osc(d, 'sine', 300, t, .22, .2, { to: 220 }); }
  };
  var STEPN = 0;
  var F = {                                                // efectos de juegos (más expresivos)
    pop: function (t, d) { osc(d, 'sine', 600, t, .1, .26, { to: 900 }); },
    tick: function (t, d) { osc(d, 'square', 1400, t, .03, .05); noise(d, t, .03, .12, 3000, 2); },
    ok: function (t, d) { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { bell(d, f, t + i * .085, .55, .22); }); },
    bad: function (t, d) { osc(d, 'triangle', 262, t, .28, .3, { to: 196 }); osc(d, 'triangle', 196, t + .17, .38, .28, { to: 147 }); },
    dice: function (t, d) {
      var at = t, gap = .045;
      for (var i = 0; i < 9; i++) { noise(d, at, .05, .5 + Math.random() * .3, 1500 + Math.random() * 1800, 2.2); osc(d, 'sine', 180 + Math.random() * 120, at, .05, .12); at += gap; gap *= 1.17; }
      osc(d, 'sine', 140, at + .02, .16, .4, { to: 80 }); noise(d, at + .02, .08, .5, 700, 1.4);
    },
    step: function (t, d, n) { var f = 392 * Math.pow(2, ((n == null ? STEPN++ : n) % 8) / 12 * 2); osc(d, 'sine', f, t, .13, .3); noise(d, t, .03, .18, 1800, 2); },
    spin: function (t, d, sec) {
      sec = sec || 3.6; var at = t, gap = .04, i = 0;
      while (at - t < sec) { osc(d, 'triangle', i % 2 ? 1250 : 1100, at, .035, .14); at += gap; gap *= 1.05; i++; }
      osc(d, 'sine', 330, at, .3, .22);
    },
    medal: function (t, d) {
      [1318.5, 1568, 2093, 2637, 3136].forEach(function (f, i) { bell(d, f, t + i * .075, .7, .17); });
      osc(d, 'sine', 523.25, t, .9, .12); osc(d, 'sine', 659.25, t, .9, .1); osc(d, 'sine', 784, t, .9, .1);
    },
    win: function (t, d) {
      var seq = [[523.25, 0], [659.25, .14], [783.99, .28], [1046.5, .42], [783.99, .62], [1046.5, .76], [1318.5, .9]];
      seq.forEach(function (n) { bell(d, n[0], t + n[1], .7, .24); });
      [261.63, 329.63, 392].forEach(function (f) { osc(d, 'triangle', f, t + .9, 1.4, .13, { a: .04 }); });
    },
    start: function (t, d) { bell(d, 659.25, t, .45, .2); bell(d, 987.77, t + .12, .55, .2); }
  };
  function chan(kind) { return kind === 'ui' ? gUI : gFX; }
  function allowed(kind) {
    if (!D.master || HELD) return false;
    if (kind === 'ui') { var cl = root.getAttribute('data-ds') === 'clinic'; return cl ? !!D.clin : !!D.ui; }
    return !!D.fx;
  }
  function play(kind, table, name, arg) {
    try {
      if (!allowed(kind) || !table[name]) return;
      if (!ensure()) return;
      table[name](now() + .005, chan(kind), arg);
    } catch (e) { }
  }
  /* ---------- música: nana generativa, original, en una caja de música ---------- */
  var M = { on: false, timer: null, nextT: 0, bar: 0, loop: 0 };
  var BEAT = .72;
  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  var C5 = 72, E5 = 76, G5 = 79, A5 = 81, F5 = 77, D5 = 74, B4 = 71, C6 = 84, D6 = 86, B5 = 83, A4 = 69, G4 = 67;
  var PH = [
    [[[E5, 1], [G5, 1], [E5, 1]], [[D5, 2], [C5, 1]], [[C5, 1], [E5, 1], [A5, 1]], [[G5, 2], [E5, 1]], [[A5, 1], [C6, 1], [A5, 1]], [[G5, 2], [F5, 1]], [[E5, 1], [D5, 1], [B4, 1]], [[C5, 3]]],
    [[[G5, 1.5], [E5, .5], [C5, 1]], [[D5, 1], [E5, 1], [G5, 1]], [[A5, 2], [G5, 1]], [[E5, 2], [C5, 1]], [[F5, 1], [A5, 1], [C6, 1]], [[A5, 2], [F5, 1]], [[G5, 1], [B5, 1], [D6, 1]], [[C6, 3]]]
  ];
  var CH = [[48, [64, 67]], [48, [64, 67]], [45, [60, 64]], [45, [60, 64]], [41, [57, 60]], [41, [57, 60]], [43, [59, 62]], [48, [64, 67]]];
  function schedBar(t) {
    var ph = PH[M.loop % 2], bar = ph[M.bar], ch = CH[M.bar], b = 0;
    bell(gMUS, mf(ch[0]), t, 1.6, .2, wet);                                        // bajo
    ch[1].forEach(function (n, i) { bell(gMUS, mf(n), t + BEAT * (1 + i * .02), 1.1, .075, wet); bell(gMUS, mf(n), t + BEAT * 2, 1.0, .06, wet); });
    bar.forEach(function (n) { bell(gMUS, mf(n[0]), t + b * BEAT, 1.6, .26, wet); b += n[1]; });
    M.bar++; if (M.bar >= 8) { M.bar = 0; M.loop++; }
  }
  function pump() {
    if (!M.on || !ctx) return;
    while (M.nextT < ctx.currentTime + .8) { schedBar(M.nextT); M.nextT += BEAT * 3; }
  }
  var music = {
    start: function () {
      if (M.on || !ensure()) return;
      M.on = true; M.bar = 0; M.nextT = ctx.currentTime + .15; pump();
      M.timer = setInterval(pump, 120); paintMusic();
    },
    stop: function () { M.on = false; clearInterval(M.timer); paintMusic(); },
    toggle: function () { M.on ? music.stop() : music.start(); return M.on; },
    playing: function () { return M.on; }
  };
  var musicBtns = [];
  function paintMusic() { musicBtns.forEach(function (b) { b.setAttribute('aria-pressed', M.on ? 'true' : 'false'); }); }
  document.addEventListener('visibilitychange', function () { if (document.hidden && M.on) { music.stop(); } });

  /* ---------- clics automáticos en botones, tarjetas e íconos ---------- */
  var SEL = 'button,a[href],[role=button],[role=tab],summary,label.chip,.tile,.tab,.chip,.c[data-t],.cd,.ds-fab';
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest && e.target.closest(SEL);
    if (!el || el.disabled || el.getAttribute('data-snd') === 'off' || el.closest('[data-snd=off]')) return;
    if (el.classList.contains('ds-fab')) return play('ui', U, 'open');
    var isGame = root.getAttribute('data-ds') === 'game';
    var nav = el.matches('a[href],[data-go],[data-view],[role=tab],.tab,.c[data-t],[data-p]') || el.closest('.tabs');
    var back = /volver|menú|menu|atrás|cambiar perfil|cambiar herramienta/i.test((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || ''));
    if (isGame) play('fx', F, 'pop'); else play('ui', U, back ? 'back' : nav ? 'nav' : 'tap');
  }, true);

  /* ---------- panel de apariencia y sonido ---------- */
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="__BASE__shared/icons.svg#i-sliders-horizontal"/></svg>';
  function base() { var s = document.currentScript || document.querySelector('script[src*="shared/ds.js"]'); var src = s ? s.getAttribute('src') : 'shared/ds.js'; return src.replace(/shared\/ds\.js.*$/, ''); }
  var BASE = base();
  function ui() {
    if (window.top !== window || document.getElementById('ds-fab')) return;
    var fab = document.createElement('button');
    fab.className = 'ds-fab'; fab.id = 'ds-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Apariencia y sonido'); fab.title = 'Apariencia y sonido';
    fab.innerHTML = ICON.replace('__BASE__', BASE);
    var p = document.createElement('div'); p.className = 'ds-panel'; p.id = 'ds-panel'; p.hidden = true; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Apariencia y sonido');
    p.innerHTML =
      '<h4>Apariencia y sonido <button class="ds-x" type="button" data-x aria-label="Cerrar">×</button></h4>' +
      '<h5>Tema</h5><div class="ds-seg" role="group" aria-label="Tema"><button type="button" data-th="auto">Automático</button><button type="button" data-th="light">Claro</button><button type="button" data-th="dark">Oscuro</button></div>' +
      '<h5>Sonido</h5>' +
      row('master', 'Sonido general', 'Apaga todo de una vez.') +
      row('ui', 'Sonidos de interfaz', 'Toques suaves en menús y botones.', 'vui') +
      row('clin', 'Sonidos en herramientas clínicas', 'Desactivado por defecto. Nunca suena mientras se graba una consulta.') +
      row('fx', 'Efectos de juegos', 'Aciertos, dados, fichas, ruletas y medallas.', 'vfx') +
      row('mus', 'Música ambiental', 'Melodía suave en los juegos de lactancia.', 'vmus') +
      '<button class="ds-test" type="button" id="ds-test">Probar sonidos</button>';
    function row(key, label, hint, vol) {
      return '<div class="ds-row"><label for="ds-' + key + '">' + label + '</label><input class="ds-sw" id="ds-' + key + '" data-k="' + key + '" type="checkbox">' +
        '<small>' + hint + '</small>' + (vol ? '<input type="range" min="0" max="1" step="0.05" data-v="' + vol + '" aria-label="Volumen: ' + label + '">' : '') + '</div>';
    }
    document.body.appendChild(fab); document.body.appendChild(p);
    if (!/\/ayuda\/?(index\.html)?$/.test(location.pathname) && !document.getElementById('ds-help')) {
      var hp = document.createElement('a'); hp.className = 'ds-help'; hp.id = 'ds-help'; hp.href = BASE + 'ayuda/'; hp.setAttribute('aria-label', 'Ayuda y manual de usuario'); hp.title = 'Ayuda y manual de usuario';
      hp.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.4a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.3-2.8 4"/><circle cx="12" cy="17.6" r=".6" fill="currentColor"/></svg>';
      document.body.appendChild(hp);
    }
    function paint() {
      p.querySelectorAll('[data-th]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-th') === D.theme ? 'true' : 'false'); });
      p.querySelectorAll('[data-k]').forEach(function (i) { i.checked = !!D[i.getAttribute('data-k')]; });
      p.querySelectorAll('[data-v]').forEach(function (i) { i.value = D[i.getAttribute('data-v')]; });
    }
    paint();
    fab.addEventListener('click', function () { p.hidden = !p.hidden; if (!p.hidden) paint(); });
    p.addEventListener('click', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-x')) p.hidden = true;
      if (t.hasAttribute('data-th')) { D.theme = t.getAttribute('data-th'); save(); applyTheme(); paint(); }
      if (t.id === 'ds-test') { ensure(); play('ui', U, 'ok'); setTimeout(function () { play('fx', F, 'medal'); }, 500); }
    });
    p.addEventListener('input', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-k')) { D[t.getAttribute('data-k')] = t.checked ? 1 : 0; save(); levels(); if (t.checked) { ensure(); play(t.getAttribute('data-k') === 'fx' ? 'fx' : 'ui', t.getAttribute('data-k') === 'fx' ? F : U, t.getAttribute('data-k') === 'fx' ? 'pop' : 'toggle'); } if (t.getAttribute('data-k') === 'mus' && !t.checked) { /* la música queda en pausa por volumen */ } }
      if (t.hasAttribute('data-v')) { D[t.getAttribute('data-v')] = +t.value; save(); levels(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') p.hidden = true; });
    document.addEventListener('click', function (e) { if (!p.hidden && !p.contains(e.target) && !fab.contains(e.target)) p.hidden = true; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui); else ui();

  /* ---------- API pública ---------- */
  window.CS61DS = {
    ui: function (n) { play('ui', U, n); },
    fx: function (n, a) { play('fx', F, n, a); },
    music: music,
    hold: function (f) { HELD = f ? 1 : 0; levels(); },
    get: function () { return D; },
    set: function (key, v) { D[key] = v; save(); levels(); },
    ensure: ensure, _t: { U: U, F: F, c: function () { return ctx; }, g: function () { return gFX; }, gu: function () { return gUI; } },
    bindMusicButton: function (b) { musicBtns.push(b); paintMusic(); },
    on: function (cat) { return !!D.master && !HELD && !!D[cat]; }
  };
})();
