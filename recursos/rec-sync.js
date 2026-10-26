/* Envío de datos anónimos de los juegos a la planilla de Recursos (Google Sheets + Apps Script).
   - La dirección del script se guarda en este navegador (localStorage "cs61_rec_url") o viene de config.json ("recursos_url").
   - Si no hay conexión o no hay dirección, los registros quedan en cola y se envían cuando se pueda.
   - El script ignora los registros repetidos (mismo ID), así que reenviar es seguro. */
(function () {
  var KU = "cs61_rec_url", KQ = "cs61_rec_queue", KC = "cs61_rec_cfgurl", KS = "cs61_rec_sent";
  var SRC = (document.currentScript && document.currentScript.src) || "";
  var busy = false, listeners = [];
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  function ok(u) { return /^https:\/\/script\.google\.com\/.+\/exec/.test(u || ""); }
  function url() {
    var u = ls(KU) || ls(KC) || ((window.RULETA_CONFIG && window.RULETA_CONFIG.sheetsUrl) || "");
    return ok(u) ? u : "";
  }
  function queue() { try { var a = JSON.parse(ls(KQ) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveQ(a) { ls(KQ, JSON.stringify(a)); }
  function sentN() { return parseInt(ls(KS) || "0", 10) || 0; }
  function changed() { listeners.forEach(function (f) { try { f(status()); } catch (e) {} }); }
  function status() { return { url: url(), pending: queue().length, sent: sentN() }; }
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  async function post(u, items) {
    var body = JSON.stringify({ recursos: 1, items: items }), opt = { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body };
    try {
      var r = await fetch(u, opt), j = await r.json();
      if (j && j.ok) return true;
      return false;
    } catch (e1) {
      try { await fetch(u, { method: "POST", mode: "no-cors", headers: opt.headers, body: body }); return true; } catch (e2) { return false; }
    }
  }
  async function flush() {
    var u = url(), q = queue();
    if (!u || !q.length || busy || (navigator.onLine === false)) { changed(); return status(); }
    busy = true;
    try {
      while (q.length) {
        var batch = q.slice(0, 20);
        var good = await post(u, batch);
        if (!good) break;
        q = queue().filter(function (x) { return !batch.some(function (b) { return b.d.id === x.d.id; }); });
        saveQ(q); ls(KS, String(sentN() + batch.length));
      }
    } finally { busy = false; changed(); }
    return status();
  }
  function send(tipo, d) {
    if (!d.id) d.id = newId();
    var q = queue(); q.push({ tipo: tipo, d: d }); saveQ(q); changed();
    return flush();
  }
  function resendAll(tipo, list) {
    var q = queue();
    list.forEach(function (d) { if (d && d.id && !q.some(function (x) { return x.d.id === d.id; })) q.push({ tipo: tipo, d: d }); });
    saveQ(q); return flush();
  }
  function setUrl(u) { u = (u || "").trim(); if (u && !ok(u)) return false; ls(KU, u || null); changed(); flush(); return true; }
  function onChange(f) { listeners.push(f); }
  /* dirección central (config.json), si existe */
  try {
    if (SRC && window.fetch) fetch(new URL("../config.json", SRC).href, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
      if (c && ok(c.recursos_url)) { ls(KC, c.recursos_url); changed(); flush(); }
    }).catch(function () {});
  } catch (e) {}
  window.addEventListener("online", flush);
  window.RecSync = { url: url, send: send, flush: flush, status: status, setUrl: setUrl, onChange: onChange, resendAll: resendAll, newId: newId };
  setTimeout(flush, 1500);
})();
