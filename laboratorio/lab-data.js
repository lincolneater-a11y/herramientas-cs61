/* Laboratorio · CS 61 — estudios, rangos de referencia orientativos y calificación.
 * Los rangos son de referencia general (adulto, niño con rangos bien definidos, embarazo) y NO reemplazan el rango
 * impreso por el laboratorio que informó: cada valor admite un rango propio que tiene prioridad.
 * Funciona en el navegador (window.LAB) y en Node (module.exports) para poder probarlo. */
(function (root) {
  'use strict';
  function mn(a, b) { return a == null || b == null ? null : Math.min(a, b); }
  function mx(a, b) { return a == null || b == null ? null : Math.max(a, b); }
  // Rango según sexo; sin sexo informado se usa el rango combinado (el más amplio)
  function sx(c, m, f) {
    if (c.sex === 'M') return m; if (c.sex === 'F') return f;
    return [mn(m[0], f[0]), mx(m[1], f[1])];
  }
  function R(lo, hi, o) { o = o || {}; return { lo: lo, hi: hi, cl: o.cl == null ? null : o.cl, ch: o.ch == null ? null : o.ch, txt: o.txt || '' }; }
  function fx(n) { return String(n).replace('.', ','); }
  function txtRange(r) {
    if (r.txt) return r.txt;
    if (r.lo != null && r.hi != null) return fx(r.lo) + ' – ' + fx(r.hi);
    if (r.hi != null) return '≤ ' + fx(r.hi);
    if (r.lo != null) return '≥ ' + fx(r.lo);
    return '';
  }
  function adult(fn) { return function (c) { return c.grp === 'nino' ? null : fn(c); }; }
  function ped(a) { return a == null ? 0 : a; }

  var G = ['Glucemia y metabolismo', 'Perfil lipídico', 'Hepatograma', 'Estado proteico', 'Función renal', 'Ionograma y minerales', 'Hemograma', 'Hierro y vitaminas', 'Tiroides e inflamación'];

  var T = [
    /* ---- Glucemia y metabolismo ---- */
    { id: 'glu', n: 'Glucemia en ayunas', u: 'mg/dL', g: 0, d: 0, al: ['glucemia en ayunas', 'glucemia', 'glucosa', 'glicemia'],
      r: function (c) { return c.grp === 'emb' ? R(70, 91, { cl: 40, ch: 450, txt: '70 – 91 (embarazo)' }) : R(70, 99, { cl: 40, ch: 450 }); },
      L: function (v, c) {
        if (c.grp === 'emb') { return v >= 126 ? 'Compatible con diabetes manifiesta en el embarazo' : v >= 92 ? 'Diabetes gestacional (criterio IADPSG: ≥ 92 en ayunas)' : ''; }
        return v >= 126 ? 'Rango de diabetes (confirmar con una segunda determinación)' : v >= 100 ? 'Glucemia alterada en ayunas (prediabetes)' : '';
      } },
    { id: 'a1c', n: 'Hemoglobina glicosilada (HbA1c)', u: '%', g: 0, d: 1, al: ['hemoglobina glicosilada', 'hemoglobina glicada', 'hba1c', 'a1c', 'hb a1c', 'glicosilada'],
      r: function () { return R(4.0, 5.6); },
      L: function (v) { return v >= 6.5 ? 'Rango de diabetes' : v >= 5.7 ? 'Prediabetes' : ''; } },
    { id: 'ins', n: 'Insulina basal', u: 'µUI/mL', g: 0, d: 1, al: ['insulina basal', 'insulinemia', 'insulina'],
      r: adult(function () { return R(2, 25); }) },
    { id: 'homa', n: 'HOMA-IR (calculado)', u: '', g: 0, d: 2, calc: true, need: ['glu', 'ins'],
      f: function (v) { return v.glu * v.ins / 405; },
      r: adult(function () { return R(null, 2.5, { txt: '< 2,5 (el corte varía según la población)' }); }),
      L: function (v) { return v > 2.5 ? 'Sugiere resistencia a la insulina' : ''; } },

    /* ---- Perfil lipídico ---- */
    { id: 'ct', n: 'Colesterol total', u: 'mg/dL', g: 1, d: 0, al: ['colesterol total', 'colesterolemia', 'col total'],
      r: function (c) { return c.grp === 'nino' ? R(null, 169.9, { txt: '< 170' }) : R(null, 199.9, { txt: '< 200' }); },
      L: function (v, c) { return c.grp === 'nino' ? (v >= 200 ? 'Alto' : v >= 170 ? 'Limítrofe' : '') : (v >= 240 ? 'Alto' : v >= 200 ? 'Limítrofe alto' : ''); } },
    { id: 'ldl', n: 'Colesterol LDL', u: 'mg/dL', g: 1, d: 0, al: ['colesterol ldl', 'ldl colesterol', 'ldl-c', 'ldl'],
      r: function (c) { return c.grp === 'nino' ? R(null, 109.9, { txt: '< 110' }) : R(null, 129.9, { txt: '< 130 (la meta depende del riesgo cardiovascular)' }); },
      L: function (v, c) {
        if (c.grp === 'nino') { return v >= 130 ? 'Alto' : v >= 110 ? 'Limítrofe' : ''; }
        return v >= 190 ? 'Muy alto' : v >= 160 ? 'Alto' : v >= 130 ? 'Limítrofe alto' : v < 100 ? 'Óptimo' : 'Cercano al óptimo';
      } },
    { id: 'hdl', n: 'Colesterol HDL', u: 'mg/dL', g: 1, d: 0, al: ['colesterol hdl', 'hdl colesterol', 'hdl-c', 'hdl'],
      r: function (c) { if (c.grp === 'nino') { return R(45, null, { txt: '> 45' }); } var x = sx(c, [40, null], [50, null]); return R(x[0], null, { txt: '≥ ' + (c.sex === 'M' ? '40' : c.sex === 'F' ? '50' : '40 (varón) / 50 (mujer)') }); },
      L: function (v) { return v >= 60 ? 'Protector' : ''; } },
    { id: 'tg', n: 'Triglicéridos', u: 'mg/dL', g: 1, d: 0, al: ['trigliceridos', 'triglicéridos', 'trigliceridemia', 'tgc', 'tag'],
      r: function (c) {
        if (c.grp === 'nino') { return (c.age != null && c.age < 10) ? R(null, 74.9, { txt: '< 75', ch: 1000 }) : R(null, 89.9, { txt: '< 90', ch: 1000 }); }
        return R(null, 149.9, { txt: '< 150', ch: 1000 });
      },
      L: function (v, c) { if (c.grp === 'nino') { return ''; } return v >= 500 ? 'Muy alto (riesgo de pancreatitis)' : v >= 200 ? 'Alto' : v >= 150 ? 'Limítrofe' : ''; } },
    { id: 'nohdl', n: 'Colesterol no-HDL (calculado)', u: 'mg/dL', g: 1, d: 0, calc: true, need: ['ct', 'hdl'],
      f: function (v) { return v.ct - v.hdl; },
      r: function (c) { return c.grp === 'nino' ? R(null, 119.9, { txt: '< 120' }) : R(null, 129.9, { txt: '< 130' }); } },
    { id: 'ldlc', n: 'LDL calculado (Friedewald)', u: 'mg/dL', g: 1, d: 0, calc: true, need: ['ct', 'hdl', 'tg'], skipIf: 'ldl', max: { tg: 399.9 },
      f: function (v) { return v.ct - v.hdl - v.tg / 5; },
      r: function (c) { return c.grp === 'nino' ? R(null, 109.9, { txt: '< 110' }) : R(null, 129.9, { txt: '< 130' }); },
      L: function (v, c) { return c.grp === 'nino' ? '' : (v >= 190 ? 'Muy alto' : v >= 160 ? 'Alto' : v >= 130 ? 'Limítrofe alto' : ''); } },
    { id: 'cthdl', n: 'Relación colesterol total / HDL', u: '', g: 1, d: 1, calc: true, need: ['ct', 'hdl'],
      f: function (v) { return v.ct / v.hdl; },
      r: adult(function () { return R(null, 5, { txt: '< 5' }); }) },

    /* ---- Hepatograma ---- */
    { id: 'ast', n: 'GOT / AST', u: 'U/L', g: 2, d: 0, al: ['got', 'ast', 'transaminasa oxalacetica', 'aspartato'],
      r: adult(function (c) { var x = sx(c, [null, 40], [null, 32]); return R(x[0], x[1]); }) },
    { id: 'alt', n: 'GPT / ALT', u: 'U/L', g: 2, d: 0, al: ['gpt', 'alt', 'transaminasa piruvica', 'alanino'],
      r: adult(function (c) { var x = sx(c, [null, 41], [null, 33]); return R(x[0], x[1]); }) },
    { id: 'ggt', n: 'Gamma glutamil transferasa (GGT)', u: 'U/L', g: 2, d: 0, al: ['gamma glutamil transferasa', 'gamma glutamil', 'gamma gt', 'ggt'],
      r: adult(function (c) { var x = sx(c, [10, 71], [6, 42]); return R(x[0], x[1]); }) },
    { id: 'fal', n: 'Fosfatasa alcalina (FAL)', u: 'U/L', g: 2, d: 0, al: ['fosfatasa alcalina', 'fal'],
      r: adult(function (c) { var x = sx(c, [40, 129], [35, 104]); return R(x[0], x[1]); }) },
    { id: 'bilt', n: 'Bilirrubina total', u: 'mg/dL', g: 2, d: 1, al: ['bilirrubina total', 'bilirrubina'],
      r: adult(function () { return R(0.2, 1.2); }) },
    { id: 'bild', n: 'Bilirrubina directa', u: 'mg/dL', g: 2, d: 1, al: ['bilirrubina directa'],
      r: adult(function () { return R(0, 0.3); }) },

    /* ---- Estado proteico ---- */
    { id: 'alb', n: 'Albúmina', u: 'g/dL', g: 3, d: 1, al: ['albumina serica', 'albumina'],
      r: function () { return R(3.5, 5.2, { cl: 2.0 }); },
      L: function (v) { return v < 2.8 ? 'Hipoalbuminemia marcada' : v < 3.5 ? 'Hipoalbuminemia' : ''; } },
    { id: 'prot', n: 'Proteínas totales', u: 'g/dL', g: 3, d: 1, al: ['proteinas totales', 'proteinemia'],
      r: adult(function () { return R(6.4, 8.3); }) },
    { id: 'prealb', n: 'Prealbúmina', u: 'mg/dL', g: 3, d: 0, al: ['prealbumina', 'transtiretina'],
      r: adult(function () { return R(20, 40); }) },

    /* ---- Función renal ---- */
    { id: 'crea', n: 'Creatinina', u: 'mg/dL', g: 4, d: 2, al: ['creatinina serica', 'creatinina', 'creatininemia'],
      r: adult(function (c) { if (c.grp === 'emb') { return R(0.4, 0.8, { txt: '0,4 – 0,8 (embarazo)' }); } var x = sx(c, [0.7, 1.3], [0.6, 1.1]); return R(x[0], x[1], { ch: 10 }); }) },
    { id: 'urea', n: 'Urea', u: 'mg/dL', g: 4, d: 0, al: ['uremia', 'urea'],
      r: adult(function () { return R(15, 45); }) },
    { id: 'ua', n: 'Ácido úrico', u: 'mg/dL', g: 4, d: 1, al: ['acido urico', 'uricemia'],
      r: adult(function (c) { var x = sx(c, [3.5, 7.2], [2.6, 6.0]); return R(x[0], x[1]); }) },
    { id: 'egfr', n: 'Filtrado glomerular estimado (CKD-EPI 2021)', u: 'mL/min/1,73 m²', g: 4, d: 0, calc: true, need: ['crea'], needCtx: true,
      f: function (v, c) {
        if (c.age == null || c.age < 18 || (c.sex !== 'M' && c.sex !== 'F')) { return null; }
        var k = c.sex === 'F' ? 0.7 : 0.9, a = c.sex === 'F' ? -0.241 : -0.302, s = v.crea / k;
        return 142 * Math.pow(Math.min(s, 1), a) * Math.pow(Math.max(s, 1), -1.200) * Math.pow(0.9938, c.age) * (c.sex === 'F' ? 1.012 : 1);
      },
      r: adult(function () { return R(60, null, { cl: 15, txt: '≥ 60 (ERC: < 60 durante 3 meses o más)' }); }),
      L: function (v) { return v >= 90 ? 'G1 (normal o alto)' : v >= 60 ? 'G2 (levemente disminuido)' : v >= 45 ? 'G3a (leve a moderadamente disminuido)' : v >= 30 ? 'G3b (moderada a gravemente disminuido)' : v >= 15 ? 'G4 (gravemente disminuido)' : 'G5 (falla renal)'; } },
    { id: 'acr', n: 'Albuminuria / creatininuria', u: 'mg/g', g: 4, d: 0, al: ['relacion albuminuria creatininuria', 'albuminuria/creatininuria', 'microalbuminuria', 'albuminuria'],
      r: function () { return R(null, 29.9, { txt: '< 30' }); },
      L: function (v) { return v > 300 ? 'A3 (gravemente aumentada)' : v >= 30 ? 'A2 (moderadamente aumentada)' : ''; } },

    /* ---- Ionograma y minerales ---- */
    { id: 'na', n: 'Sodio', u: 'mEq/L', g: 5, d: 0, al: ['sodio', 'natremia'], r: function () { return R(135, 145, { cl: 120, ch: 160 }); } },
    { id: 'k', n: 'Potasio', u: 'mEq/L', g: 5, d: 1, al: ['potasio', 'kalemia'], r: adult(function () { return R(3.5, 5.0, { cl: 2.5, ch: 6.5 }); }) },
    { id: 'cl', n: 'Cloro', u: 'mEq/L', g: 5, d: 0, al: ['cloro', 'cloremia'], r: function () { return R(98, 107); } },
    { id: 'ca', n: 'Calcio total', u: 'mg/dL', g: 5, d: 1, al: ['calcio total', 'calcemia', 'calcio'], r: adult(function () { return R(8.6, 10.2, { cl: 6.5, ch: 13 }); }) },
    { id: 'p', n: 'Fósforo', u: 'mg/dL', g: 5, d: 1, al: ['fosforo', 'fosfatemia', 'fosforemia'], r: adult(function () { return R(2.5, 4.5); }) },
    { id: 'mg', n: 'Magnesio', u: 'mg/dL', g: 5, d: 1, al: ['magnesio', 'magnesemia'], r: function () { return R(1.7, 2.4); } },

    /* ---- Hemograma ---- */
    { id: 'hb', n: 'Hemoglobina', u: 'g/dL', g: 6, d: 1, al: ['hemoglobina', 'hb'],
      r: function (c) {
        if (c.grp === 'emb') { var l = c.tri === 2 ? 10.5 : 11; return R(l, 15.5, { cl: 7, ch: 20, txt: '≥ ' + fx(l) + ' (anemia en el embarazo: < ' + fx(l) + ')' }); }
        if (c.grp === 'nino') { if (c.age == null || c.age < 0.5) { return null; } var lo = c.age < 5 ? 11 : c.age < 12 ? 11.5 : c.age < 15 ? 12 : (c.sex === 'M' ? 13 : 12); return R(lo, 16, { cl: 7, ch: 20, txt: '≥ ' + fx(lo) + ' (OMS: anemia < ' + fx(lo) + ')' }); }
        var x = sx(c, [13.5, 17.5], [12.0, 15.5]); return R(x[0], x[1], { cl: 7, ch: 20 });
      },
      L: function (v, c) { return (c.grp === 'adulto' && v < (c.sex === 'M' ? 13 : 12)) ? 'Anemia' : ''; } },
    { id: 'hto', n: 'Hematocrito', u: '%', g: 6, d: 0, al: ['hematocrito', 'hto'],
      r: function (c) { if (c.grp === 'nino') { return null; } if (c.grp === 'emb') { var l = c.tri === 2 ? 32 : 33; return R(l, 46); } var x = sx(c, [41, 53], [36, 46]); return R(x[0], x[1]); } },
    { id: 'gb', n: 'Glóbulos blancos', u: '×10³/µL', g: 6, d: 1, al: ['globulos blancos', 'leucocitos', 'recuento de globulos blancos', 'gb'],
      r: function (c) { return c.grp === 'nino' ? null : R(4.0, 10.0, { cl: 2.0, ch: 30 }); } },
    { id: 'plq', n: 'Plaquetas', u: '×10³/µL', g: 6, d: 0, al: ['plaquetas', 'recuento de plaquetas', 'plq'], r: function () { return R(150, 400, { cl: 20, ch: 1000 }); } },
    { id: 'vcm', n: 'VCM', u: 'fL', g: 6, d: 0, al: ['vcm', 'volumen corpuscular medio'], r: adult(function () { return R(80, 100); }),
      L: function (v) { return v < 80 ? 'Microcitosis' : v > 100 ? 'Macrocitosis' : ''; } },
    { id: 'hcm', n: 'HCM', u: 'pg', g: 6, d: 0, al: ['hcm', 'hemoglobina corpuscular media'], r: adult(function () { return R(27, 33); }) },
    { id: 'chcm', n: 'CHCM', u: 'g/dL', g: 6, d: 0, al: ['chcm', 'concentracion de hemoglobina corpuscular'], r: adult(function () { return R(32, 36); }) },
    { id: 'rdw', n: 'RDW', u: '%', g: 6, d: 1, al: ['rdw'], r: adult(function () { return R(11.5, 14.5); }) },

    /* ---- Hierro y vitaminas ---- */
    { id: 'fe', n: 'Hierro sérico', u: 'µg/dL', g: 7, d: 0, al: ['hierro serico', 'sideremia', 'hierro'], r: adult(function () { return R(60, 170); }) },
    { id: 'tibc', n: 'Capacidad total de fijación del hierro (CTFH)', u: 'µg/dL', g: 7, d: 0, al: ['capacidad total de fijacion', 'ctfh', 'tibc', 'transferrina'], r: adult(function () { return R(250, 450); }) },
    { id: 'ist', n: 'Saturación de transferrina (calculada)', u: '%', g: 7, d: 0, calc: true, need: ['fe', 'tibc'],
      f: function (v) { return v.fe / v.tibc * 100; }, r: adult(function () { return R(20, 50); }),
      L: function (v) { return v < 20 ? 'Sugiere déficit de hierro' : ''; } },
    { id: 'ferr', n: 'Ferritina', u: 'ng/mL', g: 7, d: 0, al: ['ferritina'],
      r: function (c) {
        if (c.grp === 'nino') { var l = (c.age != null && c.age < 5) ? 12 : 15; return R(l, 150, { txt: '≥ ' + l + ' (OMS)' }); }
        if (c.grp === 'emb') { return R(15, 150, { txt: '15 – 150 (algunas guías usan < 30 en el embarazo)' }); }
        var x = sx(c, [30, 400], [15, 150]); return R(x[0], x[1]);
      },
      L: function (v, c) { return v < 15 ? 'Déficit de depósitos de hierro' : ''; } },
    { id: 'b12', n: 'Vitamina B12', u: 'pg/mL', g: 7, d: 0, al: ['vitamina b12', 'cobalamina', 'b12'], r: adult(function () { return R(200, 900); }),
      L: function (v) { return v >= 200 && v < 300 ? 'Límite bajo: considerar homocisteína o ácido metilmalónico' : ''; } },
    { id: 'fol', n: 'Ácido fólico (folato)', u: 'ng/mL', g: 7, d: 1, al: ['acido folico', 'folatos', 'folato'], r: adult(function () { return R(4, 20); }) },
    { id: 'vitd', n: 'Vitamina D (25-OH)', u: 'ng/mL', g: 7, d: 0, al: ['vitamina d', '25 oh', '25-oh', '25 hidroxi', '25-hidroxivitamina d'],
      r: function () { return R(30, 100, { txt: '30 – 100 (suficiente; algunas guías aceptan ≥ 20)' }); },
      L: function (v) { return v < 10 ? 'Deficiencia grave' : v < 20 ? 'Deficiencia' : v < 30 ? 'Insuficiencia' : v > 100 ? 'Por encima del rango habitual' : ''; } },

    /* ---- Tiroides e inflamación ---- */
    { id: 'tsh', n: 'TSH', u: 'µUI/mL', g: 8, d: 2, al: ['tsh', 'tirotrofina', 'hormona estimulante de la tiroides'],
      r: function (c) { if (c.grp === 'nino') { return null; } return c.grp === 'emb' ? R(0.1, 4.0, { txt: '0,1 – 4,0 (embarazo; usar el rango del laboratorio si lo tiene)' }) : R(0.4, 4.0); },
      L: function (v, c) { return c.grp === 'emb' ? '' : (v > 4.0 ? 'Sugiere hipotiroidismo (confirmar con T4 libre)' : v < 0.4 ? 'Sugiere hipertiroidismo (confirmar con T4 libre)' : ''); } },
    { id: 't4l', n: 'T4 libre', u: 'ng/dL', g: 8, d: 2, al: ['t4 libre', 'tiroxina libre', 't4l'], r: adult(function () { return R(0.8, 1.8); }) },
    { id: 'pcr', n: 'Proteína C reactiva (PCR)', u: 'mg/L', g: 8, d: 1, al: ['proteina c reactiva', 'pcr', 'crp'],
      r: function () { return R(null, 5, { txt: '< 5' }); },
      L: function (v) { return v > 10 ? 'Elevada: sugiere inflamación o infección activa' : ''; } },
    { id: 'hcis', n: 'Homocisteína', u: 'µmol/L', g: 8, d: 1, al: ['homocisteina'], r: adult(function () { return R(5, 15); }) }
  ];

  var BY = {}; T.forEach(function (t) { BY[t.id] = t; });

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  // Contexto clínico a partir de sexo, edad, embarazo
  function ctx(o) {
    var age = o.age == null || isNaN(o.age) ? null : o.age;
    var grp = o.emb ? 'emb' : (age != null && age < 18 ? 'nino' : 'adulto');
    return { sex: o.sex === 'M' || o.sex === 'F' ? o.sex : '', age: age, grp: grp, tri: o.tri || 0 };
  }

  // Califica un valor. own = {lo,hi} del laboratorio (tiene prioridad sobre el rango general).
  function evalV(t, v, c, own) {
    if (v == null || isNaN(v)) { return null; }
    var r = t.r(c), custom = false;
    if (own && (own.lo != null || own.hi != null)) { r = { lo: own.lo, hi: own.hi, cl: r ? r.cl : null, ch: r ? r.ch : null, txt: '' }; custom = true; }
    if (!r) { return { st: 'sinrango', lab: 'Sin rango de referencia pediátrico en esta herramienta: cargue el rango del laboratorio', txt: '' }; }
    var st = 'normal';
    if (r.lo != null && v < r.lo) { st = 'bajo'; }
    if (r.hi != null && v > r.hi) { st = 'alto'; }
    if (r.cl != null && v < r.cl) { st = 'critbajo'; }
    if (r.ch != null && v > r.ch) { st = 'crithigh'; }
    var lab = (!custom && t.L) ? (t.L(v, c) || '') : '';
    if (lab && lab.toLowerCase() === (ST[st] || '').toLowerCase()) { lab = ''; }
    return { st: st, lab: lab, txt: txtRange(r), custom: custom };
  }

  // Valores calculados a partir de los cargados
  function derived(vals, c) {
    var out = {};
    T.forEach(function (t) {
      if (!t.calc) { return; }
      if (t.skipIf && vals[t.skipIf] != null && !isNaN(vals[t.skipIf])) { return; }
      for (var i = 0; i < t.need.length; i++) { var x = vals[t.need[i]]; if (x == null || isNaN(x) || x <= 0) { return; } }
      if (t.max) { for (var k in t.max) { if (vals[k] > t.max[k]) { return; } } }
      var v = t.f(vals, c);
      if (v == null || isNaN(v) || !isFinite(v) || v < 0) { return; }
      out[t.id] = v;
    });
    return out;
  }

  function fmt(v, d) { if (v == null || isNaN(v)) { return ''; } var s = (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); return s.replace('.', ','); }

  // Número de un texto del informe: "5,6" "1.200" "250.000"
  function num(s, t) {
    s = String(s).trim();
    if (t && (t.id === 'gb' || t.id === 'plq') && /^\d{1,3}(\.\d{3})+$/.test(s)) { return parseFloat(s.replace(/\./g, '')) / 1000; }
    if (/^\d{1,3}(\.\d{3})+,\d+$/.test(s)) { s = s.replace(/\./g, ''); }
    var v = parseFloat(s.replace(',', '.'));
    if (t && (t.id === 'gb' || t.id === 'plq') && v >= 1000) { v = v / 1000; }
    return v;
  }

  // Lee texto pegado del informe: una línea por estudio («Glucemia 92 mg/dl»). Devuelve [{id, v, linea}]
  function parse(text) {
    var out = [], seen = {};
    String(text || '').split(/\r?\n/).forEach(function (raw) {
      var line = norm(raw).replace(/\s+/g, ' ').trim(); if (!line) { return; }
      var best = null;
      T.forEach(function (t) {
        if (t.calc || !t.al) { return; }
        t.al.forEach(function (a) {
          var al = norm(a), i = line.indexOf(al);
          while (i >= 0) {
            var pre = i === 0 ? ' ' : line.charAt(i - 1), post = line.charAt(i + al.length) || ' ';
            if (!/[a-z0-9]/.test(pre) && !/[a-z]/.test(post)) { if (!best || al.length > best.len) { best = { t: t, len: al.length, end: i + al.length }; } break; }
            i = line.indexOf(al, i + 1);
          }
        });
      });
      if (!best) { return; }
      var m = /(-?\d+(?:[.,]\d+)*)/.exec(line.slice(best.end)); if (!m) { return; }
      var v = num(m[1], best.t); if (isNaN(v) || seen[best.t.id]) { return; }
      seen[best.t.id] = 1; out.push({ id: best.t.id, v: v, linea: raw.trim() });
    });
    return out;
  }

  var ST = { normal: 'Normal', bajo: 'Bajo', alto: 'Alto', critbajo: 'Muy bajo (crítico)', crithigh: 'Muy alto (crítico)', sinrango: 'Sin rango' };

  function rangeTxt(t, c) { var r = t.r(c); return r ? txtRange(r) : null; }
  function ownTxt(o) { var f = function (x) { return fmt(x, 3).replace(/,?0+$/, ''); }; return o.lo != null && o.hi != null ? f(o.lo) + ' – ' + f(o.hi) : o.hi != null ? '≤ ' + f(o.hi) : '≥ ' + f(o.lo); }

  var LAB = { rangeTxt: rangeTxt, ownTxt: ownTxt, T: T, G: G, BY: BY, ST: ST, ctx: ctx, evalV: evalV, derived: derived, fmt: fmt, parse: parse, num: num, norm: norm };
  if (typeof module !== 'undefined' && module.exports) { module.exports = LAB; } else { root.LAB = LAB; }
})(typeof window !== 'undefined' ? window : this);
