(function () {
  "use strict";
  var CFG = window.RULETA_CONFIG || {};

  /* ---------- Datos ---------- */
  var D = window.RULETA_DATA;
  var CATS = D.CATS, Q = D.Q, CH = D.CH, FOODS = D.FOODS, CH_SECS = D.CH_SECS;

  var _cc = {};
  Q.forEach(function (x, i) { x.id = i; x.l = x.l || 1; _cc[x.c] = (_cc[x.c] || 0) + 1; x.k = x.c.toUpperCase() + (_cc[x.c] < 10 ? "0" : "") + _cc[x.c]; });

  /* ---------- Estado ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var SES = { evento: "", nivel: "", grupo: "" };
  try { var _s = JSON.parse(localStorage.getItem("cs61_ses") || "{}"); if (_s && typeof _s === "object") { SES.evento = String(_s.evento || "").slice(0, 80); SES.nivel = String(_s.nivel || ""); SES.grupo = String(_s.grupo || ""); } } catch (e) {}
  function saveSes() { try { localStorage.setItem("cs61_ses", JSON.stringify(SES)); } catch (e) {} }
  var state = { phase: "idle", rot: 0, spinning: false, used: {}, participant: 1, cur: null, attempt: 0, audUsed: false, audTimer: null, sound: true };
  var JOKER = { id: "jk", joker: true, name: ["Desafío", "del Chef"], full: "Desafío del Chef", icon: "🧑‍🍳", color: "#8e1f3a" };
  var SEGS = CATS.slice(0, 3).concat([JOKER], CATS.slice(3));
  var TAU = Math.PI * 2, SEG = TAU / SEGS.length;

  function remaining(seg) {
    var id = seg.id;
    var all = Q.filter(function (q) { return q.c === id && !state.used[q.id]; });
    var lv = SES.nivel ? all.filter(function (q) { return String(q.l) === SES.nivel; }) : all;
    return lv.length ? lv : all;
  }
  function totalLeft() { return Q.filter(function (q) { return !state.used[q.id] && (!SES.nivel || String(q.l) === SES.nivel); }).length; }
  function updateChips() { $("cPart").textContent = state.participant; $("cLeft").textContent = totalLeft(); }

  /* ---------- Sonido (opcional) ---------- */
  var actx = null;
  function ac() {
    if (!state.sound) return null;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      return actx;
    } catch (e) { return null; }
  }
  function tone(freq, dur, type, vol, delay) {
    var a = ac(); if (!a) return;
    var t0 = a.currentTime + (delay || 0);
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  var sfx = {
    tick: function () { tone(900, 0.04, "square", 0.05); },
    ok: function () { tone(523, 0.14, "triangle", 0.2); tone(659, 0.14, "triangle", 0.2, 0.12); tone(784, 0.3, "triangle", 0.2, 0.24); },
    no: function () { tone(220, 0.25, "sawtooth", 0.1); tone(180, 0.3, "sawtooth", 0.1, 0.2); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.22, "triangle", 0.2, i * 0.13); }); },
    land: function () { tone(400, 0.12, "sine", 0.18); tone(600, 0.2, "sine", 0.18, 0.1); }
  };

  /* ---------- Logo ---------- */
  var DEFAULT_LOGO = CFG.logo || "assets/logo-cs61.jpg";
  var logoImage = null;
  function applyLogo(src) {
    var im = new Image();
    im.onload = function () {
      logoImage = im;
      $("logoImg").src = src; $("heroLogo").src = src;
      $("logoImg").hidden = false; $("logoPh").hidden = true;
      $("btnLogoDel").hidden = (src === DEFAULT_LOGO);
      draw();
    };
    im.onerror = function () { if (src !== DEFAULT_LOGO) applyLogo(DEFAULT_LOGO); };
    im.src = src;
  }
  var savedLogo = null;
  try { savedLogo = localStorage.getItem("cs61_logo"); } catch (e) {}
  applyLogo(savedLogo || DEFAULT_LOGO);
  $("btnLogo").addEventListener("click", function () { $("logoFile").click(); });
  $("logoFile").addEventListener("change", function (ev) {
    var f = ev.target.files && ev.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      var im = new Image();
      im.onload = function () {
        var m = 360, k = Math.min(1, m / Math.max(im.width, im.height));
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        var url = c.toDataURL("image/png");
        try { localStorage.setItem("cs61_logo", url); } catch (e) {}
        applyLogo(url);
        toast("Logo cargado");
      };
      im.src = r.result;
    };
    r.readAsDataURL(f);
    ev.target.value = "";
  });
  $("btnLogoDel").addEventListener("click", function () {
    try { localStorage.removeItem("cs61_logo"); } catch (e) {}
    applyLogo(DEFAULT_LOGO);
  });

  /* ---------- Ruleta ---------- */
  var canvas = $("wheel"), ctx = canvas.getContext("2d"), W = 0;
  function resize() {
    var s = canvas.clientWidth || 400, dpr = window.devicePixelRatio || 1;
    W = s; canvas.width = Math.round(s * dpr); canvas.height = Math.round(s * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }
  function draw() {
    if (!W) return;
    var s = W, cx = s / 2, cy = s / 2 + s * 0.02, R = s / 2 - s * 0.055;
    ctx.clearRect(0, 0, s, s);
    // aro dorado
    ctx.beginPath(); ctx.arc(cx, cy, R + s * 0.022, 0, TAU); ctx.fillStyle = "#f4b836"; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, R + s * 0.006, 0, TAU); ctx.fillStyle = "#0b1a31"; ctx.fill();
    for (var i = 0; i < SEGS.length; i++) {
      var a0 = state.rot + i * SEG, a1 = a0 + SEG;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
      ctx.fillStyle = SEGS[i].color; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = Math.max(2, s * 0.006); ctx.stroke();
      // icono y nombre, siempre derechos
      var am = a0 + SEG / 2, px = cx + Math.cos(am) * R * 0.66, py = cy + Math.sin(am) * R * 0.66;
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff";
      ctx.font = Math.round(s * 0.085) + "px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
      ctx.fillText(SEGS[i].icon, px, py - s * 0.05);
      ctx.font = "800 " + Math.round(s * 0.032) + "px 'Baloo 2','Trebuchet MS',sans-serif";
      ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 4;
      ctx.fillText(SEGS[i].name[0], px, py + s * 0.028);
      ctx.fillText(SEGS[i].name[1], px, py + s * 0.028 + s * 0.036);
      ctx.shadowBlur = 0;
    }
    // centro con logo
    var hr = R * 0.27;
    ctx.beginPath(); ctx.arc(cx, cy, hr + s * 0.012, 0, TAU); ctx.fillStyle = "#f4b836"; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, hr, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill();
    if (logoImage) {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, hr - 2, 0, TAU); ctx.clip();
      var k = Math.min((hr * 2 - 6) / logoImage.width, (hr * 2 - 6) / logoImage.height);
      var iw = logoImage.width * k, ih = logoImage.height * k;
      ctx.drawImage(logoImage, cx - iw / 2, cy - ih / 2, iw, ih); ctx.restore();
    } else {
      ctx.fillStyle = "#0b1a31"; ctx.font = "800 " + Math.round(hr * 0.78) + "px 'Baloo 2','Trebuchet MS',sans-serif";
      ctx.fillText("CS", cx, cy - hr * 0.22);
      ctx.fillStyle = "#8e1f3a"; ctx.fillText("61", cx, cy + hr * 0.42);
    }
    // puntero
    ctx.beginPath();
    ctx.moveTo(cx, cy - R - s * 0.004); ctx.lineTo(cx - s * 0.04, cy - R - s * 0.075); ctx.lineTo(cx + s * 0.04, cy - R - s * 0.075); ctx.closePath();
    ctx.fillStyle = "#8e1f3a"; ctx.fill(); ctx.strokeStyle = "#f4b836"; ctx.lineWidth = Math.max(3, s * 0.008); ctx.stroke();
  }
  function indexUnderPointer(rot) {
    var rel = (((1.5 * Math.PI - rot) % TAU) + TAU) % TAU;
    return Math.floor(rel / SEG) % SEGS.length;
  }

  function spin() {
    if (state.spinning || state.phase !== "idle") return;
    if (totalLeft() === 0) { state.used = {}; toast("Se usaron las 30 preguntas. Empezamos de nuevo."); updateChips(); }
    var avail = [];
    for (var i = 0; i < SEGS.length; i++) {
      if (SEGS[i].joker ? !state.lastJoker : remaining(SEGS[i]).length) avail.push(i);
    }
    var idx = avail[Math.floor(Math.random() * avail.length)];
    var u = 0.2 + Math.random() * 0.6;
    var target = ((1.5 * Math.PI - (idx + u) * SEG) % TAU + TAU) % TAU;
    var delta = ((target - state.rot) % TAU + TAU) % TAU + TAU * (5 + Math.floor(Math.random() * 2));
    var start = state.rot, dur = 5200, t0 = null, lastIdx = indexUnderPointer(start);
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) dur = 900;
    state.spinning = true; $("btnSpin").disabled = true; ac();
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3.4);
      state.rot = start + delta * e; draw();
      var cur = indexUnderPointer(state.rot);
      if (cur !== lastIdx) { lastIdx = cur; sfx.tick(); }
      if (p < 1) requestAnimationFrame(step);
      else { state.spinning = false; state.rot = state.rot % TAU; sfx.land(); setTimeout(function () { if (SEGS[idx].joker) showChallenge(); else showQuestion(SEGS[idx]); }, 500); }
    }
    requestAnimationFrame(step);
  }

  /* ---------- Pantallas ---------- */
  function show(which) {
    $("vIdle").hidden = which !== "idle"; $("vQ").hidden = which !== "q"; $("vC").hidden = which !== "c"; $("vR").hidden = which !== "r";
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function showQuestion(cat) {
    state.lastJoker = false; state.curCat = cat.full;
    var pool = remaining(cat);
    var q = pool[Math.floor(Math.random() * pool.length)];
    state.used[q.id] = true; state.cur = q; state.attempt = 0; state.tShow = Date.now(); state.picks = []; state.audUsed = false; state.phase = "question";
    updateChips();
    var tag = $("qCat"); tag.style.background = cat.color; tag.innerHTML = '<span class="i">' + cat.icon + "</span>" + cat.full;
    $("qText").textContent = q.q;
    var opts = shuffle(q.o.map(function (t, i) { return { t: t, ok: i === 0 }; }));
    state.opts = opts;
    var ul = $("qOpts"); ul.innerHTML = "";
    opts.forEach(function (o, i) {
      var li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.className = "opt"; b.dataset.i = i;
      b.innerHTML = '<span class="k">' + "ABCD"[i] + '</span><span></span>';
      b.lastChild.textContent = o.t;
      b.addEventListener("click", function () { answer(i); });
      li.appendChild(b); ul.appendChild(li);
    });
    $("qHint").textContent = ""; $("audBox").hidden = true; $("btnAud").disabled = false;
    clearInterval(state.audTimer);
    show("q");
  }

  function btns() { return Array.prototype.slice.call($("qOpts").querySelectorAll(".opt")); }
  function answer(i) {
    if (state.phase !== "question") return;
    var b = btns(), o = state.opts[i];
    if (!o || !b[i] || b[i].disabled) return;
    state.picks.push(o.t);
    if (o.ok) {
      b[i].classList.add("right");
      b.forEach(function (x) { x.disabled = true; });
      sfx.ok();
      finish(state.attempt === 0 ? "good1" : "good2");
    } else {
      b[i].classList.add("wrong"); b[i].disabled = true; state.attempt++; sfx.no();
      if (state.attempt === 1) {
        $("qHint").textContent = "¡Casi! Tenés una segunda oportunidad.";
      } else {
        b.forEach(function (x, k) { x.disabled = true; if (state.opts[k].ok) x.classList.add("right"); });
        finish("learn");
      }
    }
  }
  function finish(kind) {
    state.phase = "result"; clearInterval(state.audTimer);
    logTurn(state.curCat, state.cur.q, RES[kind], kind === "good1" ? 1 : 2, state.audUsed, { qid: state.cur.k, lvq: state.cur.l, p1: state.picks[0] || "", p2: state.picks[1] || "", seg: Math.round((Date.now() - state.tShow) / 100) / 10 });
    var good = kind !== "learn", delay = good ? 2700 : 1100;
    if (good) cheer(kind === "good1" ? "¡Respuesta correcta!" : "¡Lo lograste a la segunda!");
    setTimeout(function () {
      var h = $("rHead");
      if (kind === "good1") { h.textContent = "¡Correcto!"; h.className = "result-head good"; }
      else if (kind === "good2") { h.textContent = "¡Muy bien, a la segunda!"; h.className = "result-head good"; }
      else { h.textContent = "¡Gracias por participar!"; h.className = "result-head learn"; }
      var ok = state.opts.filter(function (o) { return o.ok; })[0].t;
      $("rExp").textContent = (kind === "learn" ? "La respuesta era: " + ok + ". " : "") + state.cur.e;
      show("r"); if (!good) { sfx.win(); confetti(false); duckOn(); setTimeout(duckOff, 1800); }
      $("btnNext").focus({ preventScroll: true });
    }, delay);
  }
  function next() {
    if (state.phase !== "result" || $("vR").hidden) return;
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
    state.participant++; savePart(); state.phase = "idle"; $("btnSpin").disabled = false;
    updateChips(); show("idle");
  }

  /* ---------- Registro de participaciones ---------- */
  var LOGKEY = "cs61_log", PARTKEY = "cs61_part", sessionLog = [];
  function loadLog() {
    try { var r = localStorage.getItem(LOGKEY); var a = r ? JSON.parse(r) : []; return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  var gameLog = loadLog();
  (function restoreCounter() {
    var saved = 0;
    try { saved = parseInt(localStorage.getItem(PARTKEY) || "0", 10) || 0; } catch (e) {}
    var last = gameLog.length ? (gameLog[gameLog.length - 1].n || 0) : 0;
    state.participant = Math.max(1, saved, last + 1);
  })();
  function saveLog() { try { localStorage.setItem(LOGKEY, JSON.stringify(gameLog)); } catch (e) {} }
  function savePart() { try { localStorage.setItem(PARTKEY, String(state.participant)); } catch (e) {} }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  /* Envío a la planilla de Recursos (ver ../rec-sync.js). Si no está conectada, queda en cola. */
  function sendToSheet(row) { if (window.RecSync) { try { window.RecSync.send("ruleta", row); } catch (e) {} } }
  function logTurn(cat, what, result, tries, help, ex) {
    var d = new Date(); ex = ex || {};
    gameLog.push({
      id: (window.RecSync ? window.RecSync.newId() : String(Date.now())),
      n: state.participant,
      f: d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()),
      h: pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()),
      ev: SES.evento, g: SES.grupo, nv: SES.nivel, c: cat, qid: ex.qid || "", lq: ex.lvq || "", q: what, p1: ex.p1 || "", p2: ex.p2 || "",
      r: result, t: tries, a: help ? "Sí" : "No", s: ex.seg === undefined ? "" : ex.seg
    });
    saveLog();
    sendToSheet(gameLog[gameLog.length - 1]);
  }
  var RES = { good1: "Acertó a la primera", good2: "Acertó a la segunda", learn: "No acertó (aprendió la respuesta)", chOk: "Desafío cumplido", chNo: "Desafío no cumplido (tiempo)" };

  function csvCell(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }
  function buildCsv() {
    var head = ["Participante", "Fecha", "Hora", "Evento o lugar", "Grupo etario", "Nivel elegido", "Categoría", "ID pregunta", "Nivel de la pregunta", "Pregunta o desafío", "Opción 1.er intento", "Opción 2.º intento", "Resultado", "Intentos", "Ayuda del público", "Segundos hasta responder"];
    var rows = gameLog.map(function (x) { return [x.n, x.f, x.h, x.ev || "", x.g || "", x.nv || "", x.c, x.qid || "", x.lq || "", x.q, x.p1 || "", x.p2 || "", x.r, x.t, x.a, x.s === undefined ? "" : x.s]; });
    return "sep=;\r\n" + [head].concat(rows).map(function (r) { return r.map(csvCell).join(";"); }).join("\r\n");
  }
  function buildTsv() {
    var head = ["Participante", "Fecha", "Hora", "Evento o lugar", "Grupo etario", "Nivel elegido", "Categoría", "ID pregunta", "Nivel de la pregunta", "Pregunta o desafío", "Opción 1.er intento", "Opción 2.º intento", "Resultado", "Intentos", "Ayuda del público", "Segundos hasta responder"];
    return [head].concat(gameLog.map(function (x) { return [x.n, x.f, x.h, x.ev || "", x.g || "", x.nv || "", x.c, x.qid || "", x.lq || "", x.q, x.p1 || "", x.p2 || "", x.r, x.t, x.a, x.s === undefined ? "" : x.s]; }))
      .map(function (r) { return r.join("\t"); }).join("\n");
  }
  function renderResults() {
    var total = gameLog.length, c = { g1: 0, g2: 0, lr: 0, co: 0, cn: 0 };
    gameLog.forEach(function (x) {
      if (x.r === RES.good1) c.g1++; else if (x.r === RES.good2) c.g2++; else if (x.r === RES.learn) c.lr++;
      else if (x.r === RES.chOk) c.co++; else if (x.r === RES.chNo) c.cn++;
    });
    var st = $("resStats"); st.innerHTML = "";
    [["Participaciones registradas", total], ["Acertaron a la primera", c.g1], ["Acertaron a la segunda", c.g2], ["No acertaron", c.lr], ["Desafíos cumplidos", c.co], ["Desafíos no cumplidos", c.cn]].forEach(function (p) {
      var d = mk("div", "stat"), b = mk("b", "", String(p[1])), sp = mk("span", "", p[0]); d.appendChild(b); d.appendChild(sp); st.appendChild(d);
    });
    var tb = $("resRows"); tb.innerHTML = "";
    if (!total) {
      var tr0 = mk("tr"), td0 = mk("td", "", "Todavía no hay participaciones registradas. Aparecen acá apenas termina cada turno."); td0.colSpan = 4; td0.style.whiteSpace = "normal"; tr0.appendChild(td0); tb.appendChild(tr0);
    }
    gameLog.slice(-8).reverse().forEach(function (x) {
      var tr = mk("tr");
      [x.n, x.h.slice(0, 5), x.c, x.r].forEach(function (v) { tr.appendChild(mk("td", "", String(v))); });
      tb.appendChild(tr);
    });
    $("btnWipe").textContent = "Borrar registro"; wipeArmed = false;
    $("btnDl").disabled = $("btnCopy").disabled = !total; $("btnWipe").disabled = !total;
  }
  var wipeArmed = false;
  function openRes() { renderResults(); $("resModal").hidden = false; try { $("btnResClose").focus({ preventScroll: true }); } catch (e) {} }
  function closeRes() { $("resModal").hidden = true; }
  $("btnRes").addEventListener("click", openRes);
  $("btnResClose").addEventListener("click", closeRes);
  $("resModal").addEventListener("click", function (e) { if (e.target === this) closeRes(); });
  $("btnDl").addEventListener("click", function () {
    try {
      var blob = new Blob(["﻿" + buildCsv()], { type: "text/csv;charset=utf-8" });
      var a = document.createElement("a"), d = new Date();
      a.href = URL.createObjectURL(blob);
      a.download = "ruleta-saludable-CS61-" + d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + ".csv";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      $("resNote").textContent = "Se descargó el archivo. Buscalo en la carpeta Descargas y abrilo con Excel. Si no aparece, usá «Copiar datos» y pegalo en una hoja.";
    } catch (e) { $("resNote").textContent = "Este navegador no permitió la descarga. Usá «Copiar datos» y pegalo en una hoja de Excel."; }
  });
  $("btnCopy").addEventListener("click", function () {
    var txt = buildTsv();
    function ok() { $("resNote").textContent = "Datos copiados. Abrí Excel o una hoja de Google y pegá con Ctrl + V."; }
    function fail() {
      var ta = document.createElement("textarea"); ta.value = txt; ta.style.cssText = "position:fixed;left:-9999px;top:0"; document.body.appendChild(ta); ta.select();
      var done = false; try { done = document.execCommand("copy"); } catch (e) {}
      ta.remove(); if (done) ok(); else $("resNote").textContent = "No se pudo copiar automáticamente. Probá con «Descargar para Excel».";
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fail); else fail();
  });
  $("btnWipe").addEventListener("click", function () {
    if (!wipeArmed) { wipeArmed = true; this.textContent = "¿Seguro? Tocá de nuevo para borrar"; return; }
    gameLog = []; saveLog(); renderResults(); $("resNote").textContent = "Registro borrado. El número de participante sigue donde estaba.";
  });

  /* ---------- Ayuda del público ---------- */
  $("btnAud").addEventListener("click", function () {
    if (state.phase !== "question" || state.audUsed) return;
    state.audUsed = true; $("btnAud").disabled = true;
    var n = 15; $("audT").textContent = n; $("audBox").hidden = false;
    clearInterval(state.audTimer);
    state.audTimer = setInterval(function () {
      n--; $("audT").textContent = Math.max(n, 0);
      if (n <= 0) { clearInterval(state.audTimer); $("audBox").hidden = true; $("qHint").textContent = "Se terminó el tiempo. ¡Elegí tu respuesta!"; }
    }, 1000);
  });

  /* ---------- Confeti y cartel ---------- */
  var cv = $("confetti"), cx2 = cv.getContext("2d"), parts = [], raf = 0, cheerTimer = 0;
  function confetti(big) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cv.width = innerWidth; cv.height = innerHeight;
    var cols = ["#f4b836", "#1fb3a6", "#ef6a5e", "#3fc47a", "#ffffff", "#b25bd6", "#4aa3ff"];
    var emo = ["🎉", "⭐", "🍎", "🥕", "💚", "🎊"], n = big ? 240 : 110, life = big ? 200 : 130;
    for (var i = 0; i < n; i++) {
      var left = i % 2 === 0;
      parts.push({
        x: big ? (left ? 0 : innerWidth) : innerWidth / 2 + (Math.random() - .5) * 200,
        y: big ? innerHeight * 0.92 : innerHeight * 0.55,
        vx: big ? (left ? 1 : -1) * (4 + Math.random() * 13) : (Math.random() - .5) * 14,
        vy: -(big ? 13 + Math.random() * 20 : 4 + Math.random() * 15),
        s: 7 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
        c: cols[i % cols.length], e: (big && i % 7 === 0) ? emo[i % emo.length] : null, life: 0, max: life
      });
    }
    cancelAnimationFrame(raf);
    (function loop() {
      cx2.clearRect(0, 0, cv.width, cv.height);
      parts.forEach(function (p) {
        p.life++; p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        cx2.save(); cx2.translate(p.x, p.y); cx2.rotate(p.r); cx2.globalAlpha = Math.max(0, 1 - p.life / p.max);
        if (p.e) { cx2.font = Math.round(p.s * 3.2) + "px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif"; cx2.textAlign = "center"; cx2.textBaseline = "middle"; cx2.fillText(p.e, 0, 0); }
        else { cx2.fillStyle = p.c; cx2.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
        cx2.restore();
      });
      parts = parts.filter(function (p) { return p.life < p.max; });
      if (parts.length) raf = requestAnimationFrame(loop); else cx2.clearRect(0, 0, cv.width, cv.height);
    })();
  }
  function cheer(sub) {
    var el = $("cheer"); $("cheerS").textContent = sub;
    el.classList.add("on"); confetti(true); setTimeout(sfx.win, 350); duckOn(); setTimeout(duckOff, 3200);
    clearTimeout(cheerTimer); cheerTimer = setTimeout(function () { el.classList.remove("on"); }, 2500);
  }

  /* ---------- Controles ---------- */
  var toastEl = null;
  function toast(msg) {
    if (toastEl) toastEl.remove();
    toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.textContent = msg; document.body.appendChild(toastEl);
    var t = toastEl; setTimeout(function () { if (t.parentNode) t.remove(); }, 3200);
  }
  $("btnSpin").addEventListener("click", spin);
  $("btnNext").addEventListener("click", next);
  $("btnSound").addEventListener("click", function () {
    state.sound = !state.sound; this.setAttribute("aria-pressed", state.sound); this.textContent = "Efectos: " + (state.sound ? "sí" : "no");
    if (state.sound) sfx.tick();
  });
  $("btnFull").addEventListener("click", function () {
    try {
      if (document.fullscreenElement) { document.exitFullscreen(); return; }
      var p = document.documentElement.requestFullscreen();
      if (p && p.catch) p.catch(function () { toast("Este navegador no permite pantalla completa acá. Probá con F11."); });
    } catch (e) { toast("Este navegador no permite pantalla completa acá. Probá con F11."); }
  });
  document.addEventListener("fullscreenchange", function () {
    $("btnFull").textContent = document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa";
    setTimeout(resize, 120);
  });
  document.addEventListener("keydown", function (e) {
    if (!$("resModal").hidden) { if (e.key === "Escape") closeRes(); return; }
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    var k = e.key.toLowerCase();
    if (k === " " && state.phase === "idle") { e.preventDefault(); spin(); }
    else if ((k === "enter") && state.phase === "result") { e.preventDefault(); next(); }
    else if (state.phase === "challenge-intro" && (k === "enter" || k === " ")) { e.preventDefault(); startChallenge(); }
    else if (state.phase === "challenge" && chal && chal.add && (k === "f" || k === "v")) { chal.add(k, 1); }
    else if (state.phase === "question" && "abcd".indexOf(k) > -1 && k.length === 1) answer("abcd".indexOf(k));
    else if (state.phase === "question" && "1234".indexOf(k) > -1 && k.length === 1) answer(+k - 1);
  });
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);

  /* ---------- Música de fondo y de cuenta regresiva ---------- */
  var AUD = CFG.audio || {};
  var bg = new Audio(AUD.fondo || "assets/audio/musica-fondo.mp3"), tm = new Audio(AUD.cuentaRegresiva || "assets/audio/cuenta-regresiva.mp3");
  bg.loop = true; bg.volume = 0; bg.preload = "auto"; tm.preload = "auto";
  state.music = true; state.musicVol = 0.35; state.challengeRun = false; state.lastJoker = false;
  var musicStarted = false, duckCount = 0, rampT = 0, tmFade = 0;
  function bgTarget() { if (!state.music || state.challengeRun) return 0; return state.musicVol * (duckCount > 0 ? 0.12 : 1); }
  function musicApply() {
    if (!musicStarted) return;
    var target = bgTarget();
    clearInterval(rampT);
    if (target > 0 && bg.paused) { var pr = bg.play(); if (pr && pr.catch) pr.catch(function () {}); }
    rampT = setInterval(function () {
      var d = target - bg.volume;
      if (Math.abs(d) < 0.02) { bg.volume = Math.max(0, Math.min(1, target)); clearInterval(rampT); if (target === 0) bg.pause(); return; }
      bg.volume = Math.max(0, Math.min(1, bg.volume + d * 0.25));
    }, 50);
  }
  function duckOn() { duckCount++; musicApply(); }
  function duckOff() { duckCount = Math.max(0, duckCount - 1); musicApply(); }
  function firstGesture() { if (musicStarted) return; musicStarted = true; musicApply(); }
  document.addEventListener("pointerdown", firstGesture, true);
  document.addEventListener("keydown", firstGesture, true);
  function timerMusicStart() {
    clearInterval(tmFade);
    if (!state.music) return;
    try { tm.currentTime = 0; } catch (e) {}
    tm.volume = Math.min(1, state.musicVol * 2.4);
    var pr = tm.play(); if (pr && pr.catch) pr.catch(function () {});
  }
  function timerMusicStop() {
    clearInterval(tmFade);
    tmFade = setInterval(function () {
      if (tm.volume > 0.06) tm.volume = Math.max(0, tm.volume - 0.08);
      else { tm.volume = 0; tm.pause(); clearInterval(tmFade); }
    }, 40);
  }
  $("btnMusic").addEventListener("click", function () {
    state.music = !state.music; this.setAttribute("aria-pressed", state.music); this.textContent = "Música: " + (state.music ? "sí" : "no");
    musicStarted = true; musicApply();
    if (!state.music) { tm.pause(); } else if (state.phase === "challenge") { timerMusicStart(); }
  });
  $("vol").addEventListener("input", function () {
    state.musicVol = (+this.value) / 100; musicApply();
    if (!tm.paused) tm.volume = Math.min(1, state.musicVol * 2.4);
  });
  sfx.pop = function () { tone(660, 0.08, "triangle", 0.16); };
  sfx.joker = function () { [392, 494, 587, 784].forEach(function (f, i) { tone(f, 0.16, "triangle", 0.2, i * 0.1); }); };

  /* ---------- Desafíos del Chef Comodín ---------- */
  var chUsed = {}, chal = null, chTimer = 0;
  function mk(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }

  function showChallenge() {
    var pool = CH.filter(function (c) { return !chUsed[c.id]; });
    if (!pool.length) { chUsed = {}; pool = CH.slice(); }
    var c = pool[Math.floor(Math.random() * pool.length)];
    chUsed[c.id] = true; chal = { def: c, add: null };
    state.phase = "challenge-intro"; state.lastJoker = true;
    $("chefSay").textContent = c.say; $("cTitle").textContent = c.title; $("cInstr").textContent = c.instr; $("cInstr").hidden = false;
    $("cStage").innerHTML = ""; $("cStage").hidden = true;
    $("cTimerWrap").hidden = true; $("cTimerWrap").classList.remove("low");
    $("btnCStart").hidden = false; $("btnCEnd").hidden = true;
    show("c"); sfx.joker();
    try { $("btnCStart").focus({ preventScroll: true }); } catch (e) {}
  }

  function setTime(left) {
    $("cTime").textContent = Math.max(0, Math.ceil(left));
    $("cBar").style.width = Math.max(0, left / CH_SECS * 100) + "%";
    $("cTimerWrap").classList.toggle("low", left <= 8);
  }

  function startChallenge() {
    if (state.phase !== "challenge-intro") return;
    state.phase = "challenge"; state.challengeRun = true; musicApply();
    $("btnCStart").hidden = true; $("btnCEnd").hidden = false; $("cStage").hidden = false;
    var st = $("cStage"); st.innerHTML = "";
    if (chal.def.id === "fv5") buildFv5(st); else if (chal.def.id === "memo") buildMemo(st); else buildPlato(st);
    $("cTimerWrap").hidden = false; setTime(CH_SECS);
    timerMusicStart();
    var t0 = performance.now();
    clearInterval(chTimer);
    chTimer = setInterval(function () {
      var left = CH_SECS - (performance.now() - t0) / 1000;
      if (left <= 0) { setTime(0); endChallenge(false); } else setTime(left);
    }, 100);
  }

  function endChallenge(success) {
    if (state.phase !== "challenge") return;
    clearInterval(chTimer); timerMusicStop();
    state.phase = "result"; state.challengeRun = false;
    var def = chal.def;
    logTurn("Desafío del Chef", def.title, success ? RES.chOk : RES.chNo, 1, false, { qid: "CH-" + def.id, lvq: "", p1: "", p2: "", seg: "" });
    if (success) { cheer("¡Desafío cumplido!"); } else { sfx.no(); musicApply(); }
    setTimeout(function () {
      var h = $("rHead");
      if (success) { h.textContent = "¡Desafío cumplido!"; h.className = "result-head good"; }
      else { h.textContent = "¡Se acabó el tiempo!"; h.className = "result-head learn"; }
      $("rExp").textContent = success ? def.win : def.lose;
      show("r");
      if (!success) { sfx.win(); confetti(false); duckOn(); setTimeout(duckOff, 1800); }
      try { $("btnNext").focus({ preventScroll: true }); } catch (e) {}
    }, success ? 2700 : 1000);
  }
  $("btnCStart").addEventListener("click", startChallenge);
  $("btnCEnd").addEventListener("click", function () { endChallenge(false); });

  function buildFv5(st) {
    var cnt = { f: 0, v: 0 }, cards = {};
    var wrap = mk("div", "counters");
    [{ k: "f", em: "🍎", lb: "Frutas" }, { k: "v", em: "🥕", lb: "Verduras" }].forEach(function (sp) {
      var c = mk("div", "cnt"), dots = mk("div", "dots"), ds = [];
      for (var i = 0; i < 5; i++) { var d = mk("span", "dot"); dots.appendChild(d); ds.push(d); }
      var row = mk("div", "actions"), plus = mk("button", "ghost big", "+1"), minus = mk("button", "ghost", "−1");
      plus.type = "button"; minus.type = "button";
      plus.addEventListener("click", function () { add(sp.k, 1); });
      minus.addEventListener("click", function () { add(sp.k, -1); });
      row.appendChild(plus); row.appendChild(minus);
      c.appendChild(mk("div", "em", sp.em)); c.appendChild(mk("div", "lb", sp.lb)); c.appendChild(dots); c.appendChild(row);
      wrap.appendChild(c); cards[sp.k] = { c: c, ds: ds };
    });
    st.appendChild(wrap);
    function add(k, d) {
      if (state.phase !== "challenge") return;
      cnt[k] = Math.max(0, Math.min(5, cnt[k] + d));
      cards[k].ds.forEach(function (x, i) { x.classList.toggle("on", i < cnt[k]); });
      cards[k].c.classList.toggle("full", cnt[k] >= 5);
      if (d > 0) sfx.pop();
      if (cnt.f >= 5 && cnt.v >= 5) endChallenge(true);
    }
    chal.add = add;
  }

  function buildMemo(st) {
    var E = ["🍎", "🍌", "🥕", "🥦", "🍇"], deck = shuffle(E.concat(E)), first = null, lock = false, matched = 0;
    var grid = mk("div", "mem");
    deck.forEach(function (em) {
      var b = mk("button", "mcard", "?"); b.type = "button"; b.dataset.e = em;
      b.addEventListener("click", function () {
        if (lock || state.phase !== "challenge" || b.classList.contains("up")) return;
        b.classList.add("up"); b.textContent = em; sfx.pop();
        if (!first) { first = b; return; }
        var a = first; first = null;
        if (a.dataset.e === em) {
          a.classList.add("done"); b.classList.add("done"); matched++; sfx.ok();
          if (matched === E.length) endChallenge(true);
        } else {
          lock = true;
          setTimeout(function () { a.classList.remove("up"); b.classList.remove("up"); a.textContent = "?"; b.textContent = "?"; lock = false; }, 800);
        }
      });
      grid.appendChild(b);
    });
    st.appendChild(grid);
  }

  function buildPlato(st) {
    var foods = shuffle(FOODS.slice()), found = 0, note = mk("p", "hint", "Alimentos que hacen bien: 0 de 5");
    var grid = mk("div", "foods");
    foods.forEach(function (f) {
      var b = mk("button", "food"); b.type = "button";
      b.appendChild(mk("span", "e", f.e)); b.appendChild(mk("span", "", f.n));
      b.addEventListener("click", function () {
        if (b.disabled || state.phase !== "challenge") return;
        b.disabled = true;
        if (f.g) {
          b.classList.add("good"); found++; note.textContent = "Alimentos que hacen bien: " + found + " de 5"; sfx.ok();
          if (found === 5) endChallenge(true);
        } else { b.classList.add("bad"); sfx.no(); }
      });
      grid.appendChild(b);
    });
    st.appendChild(note); st.appendChild(grid);
  }

  function speak(text) {
    try {
      var sy = window.speechSynthesis;
      if (!sy) { toast("Este navegador no puede leer en voz alta."); return; }
      sy.cancel();
      var u = new SpeechSynthesisUtterance(text); u.lang = "es-AR"; u.rate = 0.92;
      var v = sy.getVoices().filter(function (x) { return /^es/i.test(x.lang); })[0]; if (v) u.voice = v;
      var on = false;
      u.onstart = function () { if (!on) { on = true; duckOn(); } };
      u.onend = u.onerror = function () { if (on) { on = false; duckOff(); } };
      sy.speak(u);
    } catch (e) { toast("No se pudo leer en voz alta."); }
  }
  $("btnRead").addEventListener("click", function () {
    if (!state.cur) return;
    speak(state.cur.q + " " + state.opts.map(function (o, i) { return "Opción " + "ABCD"[i] + ": " + o.t + "."; }).join(" "));
  });
  $("btnRead2").addEventListener("click", function () { speak($("rHead").textContent + " " + $("rExp").textContent); });

  /* ---------- Datos de la sesión (evento, nivel, grupo) ---------- */
  (function () {
    var ev = $("sesEv"), nv = $("sesNv"), gr = $("sesGr"), st = $("sesSync");
    if (!ev) return;
    ev.value = SES.evento; nv.value = SES.nivel; gr.value = SES.grupo;
    ev.addEventListener("input", function () { SES.evento = ev.value.trim().slice(0, 80); saveSes(); });
    nv.addEventListener("change", function () { SES.nivel = nv.value; saveSes(); updateChips(); });
    gr.addEventListener("change", function () { SES.grupo = gr.value; saveSes(); });
    function paint(s) {
      if (!st) return; s = s || (window.RecSync ? window.RecSync.status() : { url: "", pending: 0, sent: 0 });
      st.textContent = !s.url ? "Planilla no conectada: los datos quedan en este navegador (se pueden descargar en «Resultados»)." : (s.pending ? "Planilla conectada · " + s.pending + " registro(s) pendiente(s) de envío." : "Planilla conectada · " + s.sent + " registro(s) enviado(s).");
    }
    if (window.RecSync) window.RecSync.onChange(paint); paint();
  })();

  show("idle"); updateChips(); resize();
})();
