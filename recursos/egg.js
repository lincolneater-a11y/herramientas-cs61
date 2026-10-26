/* Huevo de pascua: tocar 5 veces seguidas el logo (o escribir «ulises») muestra la autoría. */
(function () {
  var n = 0, t = 0, typed = "";
  function show() {
    if (document.getElementById("egg-ov")) return;
    var o = document.createElement("div"); o.id = "egg-ov";
    o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Autoría");
    o.style.cssText = "position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(8,20,36,.72);padding:16px";
    o.innerHTML = '<div style="background:#fff;color:#14304f;border-radius:18px;padding:26px 30px;max-width:420px;text-align:center;border-top:6px solid #a87615;font-family:system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.4)">' +
      '<div style="font-size:2.4rem">🥗🎡🍽️</div><div style="font-weight:800;font-size:1.3rem;margin:6px 0">Ulises Miranda Romero</div>' +
      '<div style="color:#0d7a85;font-weight:700">Practicante de Nutrición · 2026</div>' +
      '<p style="margin:12px 0 0;font-size:.9rem;color:#4a5d73">Centro de Salud N.º 61 · Barrio Solidaridad, Salta</p>' +
      '<button type="button" style="margin-top:16px;font:inherit;font-weight:700;padding:8px 20px;border-radius:10px;border:0;background:#14304f;color:#fff;cursor:pointer">¡Gracias por jugar!</button></div>';
    function close() { if (o.parentNode) o.parentNode.removeChild(o); }
    o.addEventListener("click", function (e) { if (e.target === o || e.target.tagName === "BUTTON") close(); });
    document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", k); } });
    document.body.appendChild(o);
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("#logoWrap,#heroLogo,header img,.nav .brand,.egg");
    if (!el) return;
    var now = Date.now(); n = (now - t < 1200) ? n + 1 : 1; t = now;
    if (n >= 5) { n = 0; show(); }
  }, true);
  document.addEventListener("keydown", function (e) {
    if (/input|textarea|select/i.test((e.target || {}).tagName || "") || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (typed === "ulises") { typed = ""; show(); }
  });
  try { console.log("%cUlises Miranda Romero · Practicante de Nutrición · 2026", "color:#0d7a85;font-weight:bold"); } catch (e) {}
  window.__egg = show;
})();
