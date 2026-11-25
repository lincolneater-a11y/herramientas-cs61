/**
 * Planilla del Centro de Salud N.º 61 – Nodo Solidaridad
 * Sirve a las dos herramientas (nutrición y registro cardiovascular).
 *
 * - Registro cardiovascular: escribe en las hojas «Pacientes», «ECV» y «FINDRISC» de la planilla
 *   «Registro compartido CS61». El DNI y el nombre van SÓLO en «Pacientes»; en ECV y FINDRISC se usa el CÓDIGO
 *   (CS61-0001, CS61-0002…), que el script asigna solo a cada DNI nuevo.
 * - Nutrición: escribe en la hoja «Controles». Si se envían DNI y nombre (con consentimiento), la persona queda en
 *   «Pacientes» con el mismo código que en ECV y FINDRISC; sin DNI el control queda anónimo.
 *
 * ANTES DE IMPLEMENTAR: en la línea de CLAVE escriba su clave propia. NO cambie nada más.
 */
var CLAVE = 'CAMBIAR_ESTA_CLAVE';
var HOJA = 'Controles';
var COLUMNAS = ['id', 'registrado', 'fecha_control', 'modulo', 'codigo', 'profesional', 'sexo', 'edad_anios', 'edad_meses', 'peso_kg', 'talla_cm', 'pc_cm', 'imc', 'cintura_cm', 'z_peso_edad', 'z_talla_edad', 'z_pc_edad', 'z_peso_talla', 'z_imc_edad', 'clasificacion', 'semanas_gest', 'peso_pregest_kg', 'imc_pregest', 'vel_talla_cm_anio', 'vel_centilo', 'talla_blanco_cm', 'detalle', 'condicion'];

function respuesta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Nutrición (hoja «Controles») ---------- */
function hoja_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA);
  if (!sh) { sh = ss.insertSheet(HOJA); }
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLUMNAS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold').setBackground('#14304f').setFontColor('#ffffff');
  } else {
    if (sh.getMaxColumns() < COLUMNAS.length) { sh.insertColumnsAfter(sh.getMaxColumns(), COLUMNAS.length - sh.getMaxColumns()); }
    // hojas ya existentes: agrega el título de columnas nuevas (p. ej. «condicion») al final
    for (var c = 1; c <= COLUMNAS.length; c++) {
      if (String(sh.getRange(1, c).getValue() || '') === '') { sh.getRange(1, c).setValue(COLUMNAS[c - 1]).setFontWeight('bold').setBackground('#14304f').setFontColor('#ffffff'); }
    }
  }
  return sh;
}
function limpio_(v) {
  if (v === undefined || v === null) { return ''; }
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) { v = "'" + v; } // evita fórmulas inyectadas
  return v;
}
function guardarNutricion_(rec) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = hoja_();
  var ult = sh.getLastRow();
  if (ult > 1 && rec.id) {
    var hallado = sh.getRange(2, 1, ult - 1, 1).createTextFinder(String(rec.id)).matchEntireCell(true).findNext();
    if (hallado) { return { ok: true, dup: true }; }
  }
  // Si llegan DNI y nombre, se vincula con la hoja «Pacientes» (mismo código que en ECV y FINDRISC)
  if (dniNum_(rec.dni)) {
    var shP = ss.getSheetByName('Pacientes');
    if (!shP) { return { ok: false, error: 'faltan_hojas' }; }
    var c = codigoPara_(shP, rec);
    if (c.error) { return { ok: false, error: c.error }; }
    rec.codigo = c.codigo;
  }
  var fila = COLUMNAS.map(function (k) {
    if (k === 'fecha_control') { return fecha_(rec.fecha_control) || new Date(); }
    if (k === 'registrado') { var d = new Date(rec.registrado); return isNaN(d.getTime()) ? new Date() : d; }
    return limpio_(rec[k]);
  });
  var f = primeraVacia_(sh, 1);
  sh.getRange(f, 1, 1, COLUMNAS.length).setValues([fila]);
  var nh = 0;
  if (rec.codigo && rec.hist && rec.hist.length) { nh = guardarHist_(sh, rec); }
  return { ok: true, codigo: rec.codigo || '', hist: nh };
}
// Controles anteriores cargados a mano en la herramienta: se guardan una sola vez (misma persona, módulo y fecha)
function fechaTxt_(v) {
  if (v instanceof Date) { return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
  var m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v || '')); return m ? m[1] : '';
}
function guardarHist_(sh, rec) {
  var ult = sh.getLastRow(), vistos = {}, n = 0;
  if (ult > 1) {
    sh.getRange(2, 1, ult - 1, 5).getValues().forEach(function (r) { vistos[String(r[4]) + '|' + fechaTxt_(r[2]) + '|' + String(r[3])] = true; });
  }
  rec.hist.slice(0, 30).forEach(function (h) {
    var fx = fechaTxt_(h.fecha); if (!fx) { return; }
    var k = rec.codigo + '|' + fx + '|' + String(h.modulo || rec.modulo);
    if (vistos[k]) { return; }
    vistos[k] = true;
    var o = { id: 'h' + Utilities.getUuid().replace(/-/g, '').slice(0, 14), registrado: new Date(), fecha_control: fecha_(fx), modulo: h.modulo || rec.modulo, codigo: rec.codigo,
      profesional: rec.profesional, sexo: h.sexo, edad_anios: h.edad_anios, edad_meses: h.edad_meses, peso_kg: h.peso_kg, talla_cm: h.talla_cm, pc_cm: h.pc_cm, imc: h.imc,
      semanas_gest: h.semanas_gest, peso_pregest_kg: h.peso_pregest_kg, imc_pregest: h.imc_pregest, detalle: 'Control anterior cargado a mano desde la herramienta' };
    var f = primeraVacia_(sh, 1);
    sh.getRange(f, 1, 1, COLUMNAS.length).setValues([COLUMNAS.map(function (c) { return limpio_(o[c]); })]);
    n++;
  });
  return n;
}
// Datos de una persona (por DNI o código) y sus controles anteriores, para completar la herramienta y dibujar su trayectoria.
// El nombre sólo se devuelve si en «Pacientes» figura el consentimiento = SI. No devuelve el DNI.
function historial_(ss, q) {
  var shP = ss.getSheetByName('Pacientes'), sh = ss.getSheetByName(HOJA);
  if (!shP || !sh) { return { ok: false, error: 'faltan_hojas' }; }
  hoja_();
  var dni = dniNum_(q.dni), cod = String(q.codigo || '').toUpperCase().trim(), codigo = '', nombre = '', fnac = '';
  var P = shP.getRange(2, 1, Math.max(shP.getMaxRows() - 1, 1), 7).getValues();
  for (var i = 0; i < P.length; i++) {
    if ((dni && dniNum_(P[i][1]) === dni) || (!dni && cod && String(P[i][0]).toUpperCase() === cod)) {
      codigo = String(P[i][0]); fnac = fechaTxt_(P[i][6]);
      if (String(P[i][3]).toUpperCase() === 'SI') { nombre = String(P[i][2] || ''); }
      break;
    }
  }
  if (!codigo) { return { ok: true, codigo: '', filas: [] }; }
  var n = sh.getLastRow() - 1; if (n < 1) { return { ok: true, codigo: codigo, nombre: nombre, fnac: fnac, filas: [] }; }
  var v = sh.getRange(2, 1, n, COLUMNAS.length).getValues(), out = [];
  var ix = {}; COLUMNAS.forEach(function (c, k) { ix[c] = k; });
  v.forEach(function (r) {
    if (String(r[ix.codigo]) !== codigo) { return; }
    out.push({ fecha: fechaTxt_(r[ix.fecha_control]), modulo: r[ix.modulo], sexo: r[ix.sexo], edad_anios: r[ix.edad_anios], edad_meses: r[ix.edad_meses], peso_kg: r[ix.peso_kg],
      talla_cm: r[ix.talla_cm], pc_cm: r[ix.pc_cm], imc: r[ix.imc], cintura_cm: r[ix.cintura_cm], semanas_gest: r[ix.semanas_gest], peso_pregest_kg: r[ix.peso_pregest_kg], condicion: r[ix.condicion] });
  });
  out.sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
  var sexo = '', condicion = ''; out.forEach(function (o) { if (o.sexo) { sexo = o.sexo; } if (o.condicion) { condicion = String(o.condicion); } });
  return { ok: true, codigo: codigo, nombre: nombre, fnac: fnac, sexo: sexo, condicion: condicion, filas: out.slice(-40) };
}

/* ---------- Visita domiciliaria (hoja «Visitas», se crea sola) ----------
 * Guarda el resumen de la visita SIN domicilio, SIN apellido de la familia y SIN nombres. Las personas con DNI (y consentimiento)
 * quedan en «Pacientes» y su valoración nutricional en «Controles» (módulo «Visita domiciliaria»). */
var VIS_ENC = ['ID de registro', 'Registrado (fecha y hora)', 'Fecha de la visita', 'Hora', 'Agente', 'Zona / manzana / sector', 'Tipo de visita', 'Resultado', 'Prioridad sugerida', 'Puntaje', 'Personas valoradas', 'Personas con DNI guardadas', 'Hallazgos', 'Acciones', 'Próxima visita', 'Prioridad del equipo', 'Observaciones'];
function guardarVisita_(ss, rec) {
  var sh = ss.getSheetByName('Visitas');
  if (!sh) { sh = ss.insertSheet('Visitas'); sh.getRange(1, 1, 1, VIS_ENC.length).setValues([VIS_ENC]).setFontWeight('bold').setBackground('#14304f').setFontColor('#ffffff'); sh.setFrozenRows(1); }
  var n = sh.getLastRow() - 1;
  if (n > 0 && rec.id) { var hit = sh.getRange(2, 1, n, 1).createTextFinder(String(rec.id)).matchEntireCell(true).findNext(); if (hit) { return { ok: true, dup: true }; } }
  var t = function (v, m) { return limpio_(String(v === undefined || v === null ? '' : v).slice(0, m || 2000)); };
  var d = new Date(rec.registrado); if (isNaN(d.getTime())) { d = new Date(); }
  var fila = [t(rec.id, 60), d, fecha_(rec.fecha) || '', t(rec.hora, 8), t(rec.agente, 60), t(rec.zona, 80), t(rec.tipo_v, 200), t(rec.res, 200), t(rec.prio, 20), n_(rec.pts), n_(rec.npers), n_(rec.ndni), t(rec.hall, 4000), t(rec.acc, 3000), fecha_(rec.prox) || '', t(rec.prio_eq, 100), t(rec.obs, 3000)];
  var f = sh.getLastRow() + 1; sh.getRange(f, 1, 1, fila.length).setValues([fila]);
  return { ok: true };
}

/* ---------- Registro cardiovascular (planilla compartida) ---------- */
function n_(v) { return v === undefined || v === null ? '' : v; }
function fecha_(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  // a las 12:00 (no a medianoche) para que ninguna diferencia de zona horaria entre el script y la planilla corra el día
  return m ? new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0) : '';
}
function primeraVacia_(sh, col) {
  var n = sh.getMaxRows() - 1;
  if (n < 1) { return sh.getLastRow() + 1; }
  var v = sh.getRange(2, col, n, 1).getValues();
  for (var i = 0; i < v.length; i++) { if (v[i][0] === '' || v[i][0] === null) { return i + 2; } }
  sh.insertRowAfter(sh.getMaxRows());
  return sh.getMaxRows();
}
function dniNum_(v) { return String(v === null || v === undefined ? '' : v).replace(/\D/g, ''); }
// Fecha de nacimiento: columna G de «Pacientes» (el script le pone el título la primera vez)
function colFnac_(shP) {
  if (String(shP.getRange(1, 7).getValue() || '') === '') { shP.getRange(1, 7).setValue('Fecha de nacimiento').setFontWeight('bold'); }
  shP.getRange(2, 7, Math.max(shP.getMaxRows() - 1, 1), 1).setNumberFormat('dd/mm/yyyy');
}
function codigoPara_(shP, rec) {
  var ult = Math.max(shP.getMaxRows(), 2);
  var datos = shP.getRange(2, 1, ult - 1, 7).getValues(), fn = fecha_(rec.fnac);
  var dni = dniNum_(rec.dni), cod = String(rec.codigo || '').toUpperCase().trim(), max = 0, fila = -1;
  for (var i = 0; i < datos.length; i++) {
    var c = String(datos[i][0] || '');
    var mm = /^CS61-(\d+)$/.exec(c); if (mm) { max = Math.max(max, +mm[1]); }
    if (fila < 0 && ((dni && dniNum_(datos[i][1]) === dni) || (!dni && cod && c === cod))) { fila = i; }
  }
  if (fila >= 0) {
    if (rec.consent && String(datos[fila][3]).toUpperCase() !== 'SI') {
      shP.getRange(fila + 2, 4, 1, 2).setValues([['SI', fecha_(rec.fecha_consent) || new Date()]]);
    }
    if (fn && datos[fila][6] === '') { colFnac_(shP); shP.getRange(fila + 2, 7).setValue(fn); }
    return { codigo: datos[fila][0], nuevo: false };
  }
  if (!dni) { return { error: 'sin_dni' }; }
  if (!rec.consent) { return { error: 'sin_consentimiento' }; }
  var nuevo = 'CS61-' + ('0000' + (max + 1)).slice(-4);
  var r = primeraVacia_(shP, 1);
  shP.getRange(r, 1, 1, 6).setValues([[nuevo, Number(dni), limpio_(rec.nombre), 'SI', fecha_(rec.fecha_consent) || new Date(), limpio_(rec.profesional)]]);
  if (fn) { colFnac_(shP); shP.getRange(r, 7).setValue(fn); }
  return { codigo: nuevo, nuevo: true };
}
function guardarCV_(ss, rec) {
  var shP = ss.getSheetByName('Pacientes'), shE = ss.getSheetByName('ECV'), shF = ss.getSheetByName('FINDRISC');
  if (!shP || !shE || !shF) { return { ok: false, error: 'faltan_hojas' }; }
  // evita duplicados si la herramienta reintenta un envío
  var props = PropertiesService.getDocumentProperties(), ids = JSON.parse(props.getProperty('ids') || '[]');
  if (rec.id && ids.indexOf(rec.id) >= 0) { return { ok: true, dup: true }; }
  var c = codigoPara_(shP, rec);
  if (c.error) { return { ok: false, error: c.error }; }
  if (rec.tipo === 'ecv') {
    var u = shE.getRange(2, 1, Math.max(shE.getMaxRows() - 1, 1), 1).getValues(), fila = -1;
    for (var i = 0; i < u.length; i++) { if (u[i][0] === c.codigo) { fila = i + 2; break; } }
    if (fila < 0) { fila = primeraVacia_(shE, 1); }
    var X = function (b) { return b ? 'X' : ''; };
    shE.getRange(fila, 1).setValue(c.codigo);
    shE.getRange(fila, 2, 1, 1).setValue(fecha_(rec.fpa));
    shE.getRange(fila, 3, 1, 2).setValues([[n_(rec.tas), n_(rec.tad)]]);
    shE.getRange(fila, 6, 1, 1).setValue(fecha_(rec.fcm));
    shE.getRange(fila, 7, 1, 1).setValue(limpio_(rec.med));
    shE.getRange(fila, 8, 1, 2).setValues([[X(rec.dos), X(rec.est)]]);
    shE.getRange(fila, 10, 1, 1).setValue(rec.os === 'SI' || rec.os === 'NO' ? rec.os : '');
    shE.getRange(fila, 11, 1, 4).setValues([[X(rec.sumar), X(rec.dbt), X(rec.acv), X(rec.ecv)]]);
    shE.getRange(fila, 15, 1, 2).setValues([[fecha_(rec.frec) || new Date(), limpio_(rec.profesional)]]);
  } else {
    var f = primeraVacia_(shF, 2);
    var hd = shF.getRange(1, 1, 1, shF.getLastColumn()).getValues()[0].map(function (t) {
      return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    });
    var col = function (pref) { for (var i = 0; i < hd.length; i++) { if (hd[i].indexOf(pref) === 0) { return i + 1; } } return 0; };
    var mapa = [['fecha', fecha_(rec.fecha) || new Date()], ['codigo', c.codigo], ['sexo', n_(rec.sexo)], ['edad', n_(rec.edad)], ['peso', n_(rec.peso)],
      ['talla', n_(rec.talla)], ['cintura (cm)', n_(rec.cintura)], ['actividad', n_(rec.act)], ['verduras', n_(rec.veg)], ['medicacion', n_(rec.med)],
      ['glucemia', n_(rec.glu)], ['antecedentes', n_(rec.fam)], ['profesional', limpio_(rec.profesional)]];
    var faltan = mapa.filter(function (m) { return !col(m[0]); }).map(function (m) { return m[0]; });
    if (faltan.length) { return { ok: false, error: 'faltan_columnas: ' + faltan.join(', ') }; }
    mapa.forEach(function (m) { shF.getRange(f, col(m[0])).setValue(m[1]); });
  }
  if (rec.id) { ids.push(rec.id); props.setProperty('ids', JSON.stringify(ids.slice(-300))); }
  return { ok: true, codigo: c.codigo, nuevo: c.nuevo };
}


// Consulta de tests FINDRISC ya cargados (por DNI o código). Sólo lectura: no modifica la planilla.
function frGet_(ss, q) {
  var shP = ss.getSheetByName('Pacientes'), shF = ss.getSheetByName('FINDRISC');
  if (!shP || !shF) { return { ok: false, error: 'faltan_hojas' }; }
  var dni = dniNum_(q.dni), cod = String(q.codigo || '').toUpperCase().trim(), codigo = '', nombre = '';
  if (!dni && !cod) { return { ok: false, error: 'sin_dni' }; }
  var P = shP.getRange(2, 1, Math.max(shP.getMaxRows() - 1, 1), 3).getValues();
  for (var i = 0; i < P.length; i++) {
    if ((dni && dniNum_(P[i][1]) === dni) || (!dni && cod && String(P[i][0]).toUpperCase() === cod)) { codigo = String(P[i][0]); nombre = String(P[i][2] || ''); break; }
  }
  if (!codigo) { return { ok: true, codigo: '', tests: [] }; }
  var n = shF.getLastRow() - 1; if (n < 1) { return { ok: true, codigo: codigo, nombre: nombre, tests: [] }; }
  var hd = shF.getRange(1, 1, 1, shF.getLastColumn()).getValues()[0].map(function (t) {
    return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  });
  var col = function (pref) { for (var k = 0; k < hd.length; k++) { if (hd[k].indexOf(pref) === 0) { return k; } } return -1; };
  var C = { fecha: col('fecha'), cod: col('codigo'), sexo: col('sexo'), edad: col('edad'), peso: col('peso'), talla: col('talla'), cint: col('cintura (cm)'), imc: col('imc'),
    act: col('actividad'), veg: col('verduras'), med: col('medicacion'), glu: col('glucemia'), fam: col('antecedentes'), pts: col('puntaje'), cat: col('categoria'), prof: col('profesional') };
  var v = shF.getRange(2, 1, n, shF.getLastColumn()).getValues(), out = [];
  v.forEach(function (r) {
    if (String(r[C.cod]) !== codigo) { return; }
    out.push({ fecha: fechaTxt_(r[C.fecha]), sexo: r[C.sexo], edad: r[C.edad], peso: r[C.peso], talla: r[C.talla], cintura: r[C.cint], imc: r[C.imc],
      act: r[C.act], veg: r[C.veg], med: r[C.med], glu: r[C.glu], fam: r[C.fam], puntaje: r[C.pts], categoria: r[C.cat], profesional: C.prof >= 0 ? r[C.prof] : '' });
  });
  out.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
  return { ok: true, codigo: codigo, nombre: nombre, tests: out.slice(0, 10) };
}


/* ---------- Calendario de vacunación: historial por persona (hoja «Vacunas», se crea sola) ---------- */
var VAC_ENC = ['Fecha de la consulta', 'Código de atención', 'Fecha de nacimiento', 'Embarazada', 'Semanas de gestación', 'Puérpera', 'Personal de salud', 'Zona de riesgo', 'Factor de riesgo', 'Marcas del carnet (datos)', 'Aplicadas en la consulta', 'Pendientes', 'Profesional'];
function guardarVac_(ss, rec) {
  var shP = ss.getSheetByName('Pacientes');
  if (!shP) { return { ok: false, error: 'faltan_hojas' }; }
  var props = PropertiesService.getDocumentProperties(), ids = JSON.parse(props.getProperty('ids') || '[]');
  if (rec.id && ids.indexOf(rec.id) >= 0) { return { ok: true, dup: true }; }
  var c = codigoPara_(shP, rec);
  if (c.error) { return { ok: false, error: c.error }; }
  var sh = ss.getSheetByName('Vacunas');
  if (!sh) { sh = ss.insertSheet('Vacunas'); sh.getRange(1, 1, 1, VAC_ENC.length).setValues([VAC_ENC]).setFontWeight('bold'); sh.setFrozenRows(1); }
  var fecha = fecha_(rec.fecha) || new Date(), X = function (b) { return b ? 'X' : ''; };
  var marcas = JSON.stringify(rec.marcas || {}); if (marcas.length > 40000) { return { ok: false, error: 'datos_largos' }; }
  var vals = [fecha, c.codigo, fecha_(rec.fnac), X(rec.emb), n_(rec.sem), X(rec.pue), X(rec.ps), X(rec.zr), X(rec.fr), marcas, limpio_(String(rec.aplicadas || '').slice(0, 2000)), limpio_(String(rec.pend || '').slice(0, 2000)), limpio_(rec.profesional)];
  var iso = fechaTxt_(fecha), n = sh.getLastRow() - 1, fila = -1;
  if (n > 0) {
    var A = sh.getRange(2, 1, n, 2).getValues();
    for (var i = 0; i < A.length; i++) { if (String(A[i][1]) === String(c.codigo) && fechaTxt_(A[i][0]) === iso) { fila = i + 2; break; } }
  }
  if (fila < 0) { fila = sh.getLastRow() + 1; }
  sh.getRange(fila, 1, 1, vals.length).setValues([vals]);
  if (rec.id) { ids.push(rec.id); props.setProperty('ids', JSON.stringify(ids.slice(-300))); }
  return { ok: true, codigo: c.codigo, nuevo: c.nuevo };
}
// Historial de vacunación de una persona (por DNI o código). Sólo lectura.
function vacGet_(ss, q) {
  var shP = ss.getSheetByName('Pacientes');
  if (!shP) { return { ok: false, error: 'faltan_hojas' }; }
  var dni = dniNum_(q.dni), cod = String(q.codigo || '').toUpperCase().trim(), codigo = '', nombre = '', fnac = '';
  if (!dni && !cod) { return { ok: false, error: 'sin_dni' }; }
  var P = shP.getRange(2, 1, Math.max(shP.getMaxRows() - 1, 1), 7).getValues();
  for (var i = 0; i < P.length; i++) {
    if ((dni && dniNum_(P[i][1]) === dni) || (!dni && cod && String(P[i][0]).toUpperCase() === cod)) { codigo = String(P[i][0]); nombre = String(P[i][2] || ''); fnac = fechaTxt_(P[i][6]); break; }
  }
  if (!codigo) { return { ok: true, codigo: '', visitas: [] }; }
  var sh = ss.getSheetByName('Vacunas'), n = sh ? sh.getLastRow() - 1 : 0;
  if (n < 1) { return { ok: true, codigo: codigo, nombre: nombre, visitas: [] }; }
  var v = sh.getRange(2, 1, n, VAC_ENC.length).getValues(), out = [];
  v.forEach(function (r) {
    if (String(r[1]) !== codigo) { return; }
    var m = {}; try { m = JSON.parse(r[9] || '{}'); } catch (e) { }
    out.push({ fecha: fechaTxt_(r[0]), fnac: fechaTxt_(r[2]), emb: r[3] === 'X', sem: r[4], pue: r[5] === 'X', ps: r[6] === 'X', zr: r[7] === 'X', fr: r[8] === 'X', marcas: m, prof: String(r[12] || '') });
  });
  out.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
  return { ok: true, codigo: codigo, nombre: nombre, fnac: fnac, visitas: out.slice(0, 15) };
}

/* ---------- Estadísticas para jefatura (sólo recuentos; NUNCA devuelve DNI, nombres ni domicilios) ----------
 * Lee las hojas Pacientes, ECV, FINDRISC, Controles, Vacunas y Visitas. La lista «codigos» contiene únicamente
 * el código anónimo (CS61-0001…) y en qué módulos tiene registros. */
function stats_(ss, q) {
  var hoy = new Date(), tz = Session.getScriptTimeZone();
  var iso = function (d) { return Utilities.formatDate(d, tz, 'yyyy-MM-dd'); };
  var hoyIso = iso(hoy);
  var desde = fechaTxt_(q && q.desde) || '', hasta = fechaTxt_(q && q.hasta) || '';
  var enRango = function (f) { return !(desde && f && f < desde) && !(hasta && f && f > hasta); };
  var meses = []; for (var i = 11; i >= 0; i--) { var d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1); meses.push(Utilities.formatDate(d, tz, 'yyyy-MM')); }
  var serie = function (arr) { var o = {}; meses.forEach(function (m) { o[m] = 0; }); arr.forEach(function (f) { var m = String(f).slice(0, 7); if (o[m] !== undefined) { o[m]++; } }); return meses.map(function (m) { return { mes: m, n: o[m] }; }); };
  var datos = function (nom, cols) { var sh = ss.getSheetByName(nom); if (!sh) { return null; } var n = sh.getLastRow() - 1; if (n < 1) { return []; } return sh.getRange(2, 1, n, cols).getValues(); };
  var X = function (v) { return String(v).toUpperCase() === 'X'; };
  var num = function (v) { return typeof v === 'number' && !isNaN(v) ? v : (v === '' || v === null ? NaN : parseFloat(String(v).replace(',', '.'))); };
  var cod = {}; // código -> {pac, ecv, fr, ctl, vac, ult}
  var marca = function (c, k, f) { c = String(c || '').trim(); if (!c) { return; } var o = cod[c] || (cod[c] = { pac: 0, ecv: 0, fr: 0, ctl: 0, vac: 0, ult: '' }); o[k]++; if (f && f > o.ult) { o.ult = f; } };
  var out = { ok: true, generado: hoyIso, desde: desde, hasta: hasta, faltan: [] };

  // Pacientes
  var P = datos('Pacientes', 7);
  if (P) {
    var pc = 0, cons = 0, fn = 0;
    P.forEach(function (r) { if (!String(r[0]).trim()) { return; } pc++; marca(r[0], 'pac', ''); if (String(r[3]).toUpperCase() === 'SI') { cons++; } if (r[6] !== '') { fn++; } });
    out.pacientes = { total: pc, con_consentimiento: cons, con_fnac: fn };
  } else { out.faltan.push('Pacientes'); }

  // ECV
  var E = datos('ECV', 16);
  if (E) {
    var e = { personas: 0, con_pa: 0, pa_no_controlada: 0, pa_controlada: 0, sist_sum: 0, diast_sum: 0, med: 0, dos: 0, est: 0, dbt: 0, acv: 0, evento: 0, acv_o_evento: 0, hta: 0, hta_no_ctrl: 0, dbt_pa_no: 0, os_si: 0, os_no: 0, os_sd: 0, sumar: 0, pa6: 0, pa12: 0, pa_mas12: 0, pa_sin: 0, cm12: 0, cm_sin: 0, prev_sec: 0 };
    var h6 = iso(new Date(hoy.getFullYear(), hoy.getMonth() - 6, hoy.getDate())), h12 = iso(new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate()));
    E.forEach(function (r) {
      var c = String(r[0] || '').trim(); if (!c) { return; }
      var fr = fechaTxt_(r[14]); if (!enRango(fr)) { return; }
      marca(c, 'ecv', fr); e.personas++;
      var s = num(r[2]), d = num(r[3]), pa = !isNaN(s) && !isNaN(d), noCtl = X(r[4]) || (pa && (s >= 140 || d >= 90));
      if (pa) { e.con_pa++; e.sist_sum += s; e.diast_sum += d; if (noCtl) { e.pa_no_controlada++; } else { e.pa_controlada++; } }
      var med = String(r[6] || '').trim() !== '', dbt = X(r[11]), acv = X(r[12]), ev = X(r[13]);
      if (med) { e.med++; } if (X(r[7])) { e.dos++; } if (X(r[8])) { e.est++; }
      if (dbt) { e.dbt++; } if (acv) { e.acv++; } if (ev) { e.evento++; }
      if (acv || ev) { e.acv_o_evento++; if (X(r[8])) { e.prev_sec++; } }
      // Criterio operativo de HTA: medicación registrada o PA ≥ 140/90 (no es un diagnóstico)
      if (med || (pa && (s >= 140 || d >= 90))) { e.hta++; if (noCtl) { e.hta_no_ctrl++; } }
      if (dbt && noCtl) { e.dbt_pa_no++; }
      var os = String(r[9]).toUpperCase(); if (os === 'SI') { e.os_si++; } else if (os === 'NO') { e.os_no++; } else { e.os_sd++; }
      if (X(r[10])) { e.sumar++; }
      var fpa = fechaTxt_(r[1]); if (!fpa) { e.pa_sin++; } else if (fpa >= h6) { e.pa6++; } else if (fpa >= h12) { e.pa12++; } else { e.pa_mas12++; }
      var fcm = fechaTxt_(r[5]); if (!fcm) { e.cm_sin++; } else if (fcm >= h12) { e.cm12++; }
    });
    out.ecv = e;
  } else { out.faltan.push('ECV'); }

  // FINDRISC (último test por código para las categorías; total de tests aparte)
  var F = datos('FINDRISC', 18);
  if (F) {
    var ult = {}, tests = 0, fechas = [];
    F.forEach(function (r) {
      var c = String(r[1] || '').trim(); if (!c) { return; }
      var f = fechaTxt_(r[0]); if (!enRango(f)) { return; }
      marca(c, 'fr', f); tests++; fechas.push(f);
      if (!ult[c] || f >= ult[c].f) { ult[c] = { f: f, r: r }; }
    });
    var cat = { 'Riesgo bajo': 0, 'Ligeramente elevado': 0, 'Riesgo moderado': 0, 'Riesgo alto': 0, 'Riesgo muy alto': 0, 'Sin categoría': 0 };
    var fr = { tests: tests, personas: 0, sum: 0, np: 0, imc_sum: 0, imc_n: 0, alto: 0, varon: 0, mujer: 0, e45: 0, imc25: 0, imc30: 0, cint: 0, sinact: 0, sinveg: 0, antihip: 0, gluc: 0, fam: 0 };
    Object.keys(ult).forEach(function (c) {
      var r = ult[c].r; fr.personas++;
      var p = num(r[13]); if (!isNaN(p)) { fr.sum += p; fr.np++; if (p >= 15) { fr.alto++; } }
      var k = String(r[14] || ''); if (cat[k] !== undefined) { cat[k]++; } else { cat['Sin categoría']++; }
      var im = num(r[7]); if (!isNaN(im) && im > 0) { fr.imc_sum += im; fr.imc_n++; if (im >= 25) { fr.imc25++; } if (im >= 30) { fr.imc30++; } }
      if (r[2] === 'Varón') { fr.varon++; } else if (r[2] === 'Mujer') { fr.mujer++; }
      var ed = num(r[3]); if (!isNaN(ed) && ed >= 45) { fr.e45++; }
      if (X(r[17])) { fr.cint++; } if (r[8] === 'No') { fr.sinact++; } if (r[9] === 'No') { fr.sinveg++; }
      if (r[10] === 'Sí') { fr.antihip++; } if (r[11] === 'Sí') { fr.gluc++; } if (r[12] !== '' && r[12] !== 'No') { fr.fam++; }
    });
    fr.categorias = cat; fr.serie = serie(fechas); out.findrisc = fr;
  } else { out.faltan.push('FINDRISC'); }

  // Controles (nutrición, crecimiento, embarazo, visita domiciliaria)
  if (ss.getSheetByName(HOJA)) { hoja_(); }
  var C = datos(HOJA, COLUMNAS.length);
  if (C) {
    var ix = {}; COLUMNAS.forEach(function (c, k) { ix[c] = k; });
    var mod = {}, sexo = { Mujer: 0, Varón: 0, 'Sin dato': 0 }, cl = {}, ctotal = 0, cf = [], anon = 0, edades = { '0-5': 0, '6-11': 0, '12-17': 0, '18-59': 0, '60+': 0, 'Sin dato': 0 };
    C = C.filter(function (r) { return String(r[ix.id] || '').trim() || String(r[ix.modulo] || '').trim() || String(r[ix.fecha_control] || '').trim() || String(r[ix.peso_kg] || '').trim() || String(r[ix.talla_cm] || '').trim(); }); // descarta filas vacías
    var sexoDe = {}, sexoNorm = function (v) { v = String(v || ''); return /^(m|f)/i.test(v) ? 'Mujer' : /^(v|h)/i.test(v) ? 'Varón' : ''; }, sinMod = {}, rellenados = 0, personas = {};
    C.forEach(function (r) { var c = String(r[ix.codigo] || '').trim(), x = sexoNorm(r[ix.sexo]); if (c && x) { sexoDe[c] = x; } });  // el sexo de una persona sirve para todos sus controles
    C.forEach(function (r) {
      var f = fechaTxt_(r[ix.fecha_control]) || fechaTxt_(r[ix.registrado]); if (!enRango(f)) { return; }
      ctotal++; cf.push(f); var cc0 = String(r[ix.codigo] || '').trim(); if (cc0) { personas[cc0] = 1; }
      var m = String(r[ix.modulo] || 'Sin módulo'); mod[m] = (mod[m] || 0) + 1;
      var c = String(r[ix.codigo] || '').trim(); if (c) { marca(c, 'ctl', f); } else { anon++; }
      var sx = sexoNorm(r[ix.sexo]); if (!sx && c && sexoDe[c]) { sx = sexoDe[c]; rellenados++; }
      if (sx) { sexo[sx]++; } else { sexo['Sin dato']++; sinMod[m] = (sinMod[m] || 0) + 1; }
      var k = String(r[ix.clasificacion] || '').trim(); if (k) { k = k.slice(0, 60); cl[k] = (cl[k] || 0) + 1; }
      var a = num(r[ix.edad_anios]); var g = isNaN(a) ? 'Sin dato' : a < 6 ? '0-5' : a < 12 ? '6-11' : a < 18 ? '12-17' : a < 60 ? '18-59' : '60+'; edades[g]++;
    });
    var top = Object.keys(cl).map(function (k) { return { k: k, n: cl[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 12);
    out.controles = { personas: Object.keys(personas).length, sin_sexo_por_modulo: sinMod, sexo_completado: rellenados, total: ctotal, anonimos: anon, por_modulo: mod, sexo: sexo, edades: edades, clasificaciones: top, serie: serie(cf) };
  } else { out.faltan.push(HOJA); }

  // Vacunas
  var V = datos('Vacunas', 13);
  if (V) {
    var vf = [], vm = { emb: 0, pue: 0, ps: 0, zr: 0, fr: 0 }, vt = 0;
    V.forEach(function (r) {
      var c = String(r[1] || '').trim(); if (!c) { return; }
      var f = fechaTxt_(r[0]); if (!enRango(f)) { return; }
      marca(c, 'vac', f); vt++; vf.push(f);
      if (X(r[3])) { vm.emb++; } if (X(r[5])) { vm.pue++; } if (X(r[6])) { vm.ps++; } if (X(r[7])) { vm.zr++; } if (X(r[8])) { vm.fr++; }
    });
    out.vacunas = { consultas: vt, grupos: vm, serie: serie(vf) };
  } else { out.faltan.push('Vacunas'); }

  // Visitas domiciliarias
  var Vi = datos('Visitas', 17);
  if (Vi) {
    var pr = {}, zn = {}, vif = [], vit = 0, pers = 0, tipo = {};
    Vi.forEach(function (r) {
      var f = fechaTxt_(r[2]); if (!String(r[0] || '').trim() && !f) { return; } if (!enRango(f)) { return; }
      vit++; vif.push(f); pers += (num(r[10]) || 0);
      var p = String(r[8] || 'Sin dato'); pr[p] = (pr[p] || 0) + 1;
      var z = String(r[5] || 'Sin zona').slice(0, 40); zn[z] = (zn[z] || 0) + 1;
      var t = String(r[6] || 'Sin dato').slice(0, 60); tipo[t] = (tipo[t] || 0) + 1;
    });
    var topz = Object.keys(zn).map(function (k) { return { k: k, n: zn[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 10);
    out.visitas = { total: vit, personas_valoradas: pers, prioridad: pr, zonas: topz, tipos: tipo, serie: serie(vif) };
  } else { out.faltan.push('Visitas'); }

  // Clasificación por código: en qué módulos tiene registros cada código anónimo
  var lista = [], comb = {}, cob = { ecv: 0, fr: 0, ctl: 0, vac: 0, total: 0 };
  Object.keys(cod).forEach(function (c) {
    var o = cod[c]; if (!o.ecv && !o.fr && !o.ctl && !o.vac) { return; }
    cob.total++; if (o.ecv) { cob.ecv++; } if (o.fr) { cob.fr++; } if (o.ctl) { cob.ctl++; } if (o.vac) { cob.vac++; }
    var k = [o.ecv ? 'ECV' : '', o.fr ? 'FINDRISC' : '', o.ctl ? 'Controles' : '', o.vac ? 'Vacunas' : ''].filter(String).join(' + ');
    comb[k] = (comb[k] || 0) + 1;
    lista.push({ c: c, ecv: o.ecv, fr: o.fr, ctl: o.ctl, vac: o.vac, ult: o.ult });
  });
  lista.sort(function (a, b) { return a.c < b.c ? -1 : 1; });
  out.cobertura = cob; out.combinaciones = comb; out.codigos = lista.slice(0, 3000);
  return out;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var body = JSON.parse(e.postData.contents);
    if (!body || CLAVE === 'CAMBIAR_ESTA_CLAVE') { return respuesta_({ ok: false, error: 'clave' }); }
    // Panel de jefatura: acepta la clave de jefatura (propiedad JEFATURA_KEY, SOLO lectura de recuentos) o la clave general.
    if (body.stats) {
      var jk = PropertiesService.getScriptProperties().getProperty('JEFATURA_KEY') || '';
      if (body.k !== CLAVE && !(jk && body.k === jk)) { return respuesta_({ ok: false, error: 'clave' }); }
      return respuesta_(stats_(SpreadsheetApp.getActiveSpreadsheet(), body.stats));
    }
    // Laboratorio: además de la clave general, acepta el CÓDIGO DE LABORATORIO (propiedad LAB_KEY) para bioquímicas/os.
    // Con ese código sólo se puede cargar/verificar laboratorio y adjuntar informes; no se accede a nada más.
    var restr = false;
    if (body.k !== CLAVE) {
      var lk = PropertiesService.getScriptProperties().getProperty('LAB_KEY') || '';
      var rr = body.rec || {};
      if (lk && body.k === lk && (body.labget || body.labpdf || rr.tipo === 'lab')) { restr = true; } else { return respuesta_({ ok: false, error: 'clave' }); }
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (restr) {
      if (body.labget) { return respuesta_(labGet_(ss, body.labget, true)); }
      lock.waitLock(20000);
      if (body.labpdf) { return respuesta_(labPdf_(ss, body.labpdf, true)); }
      return respuesta_(guardarLab_(ss, body.rec, true));
    }
    if (body.ping) { return respuesta_({ ok: true, hoja: ss.getName() }); }
    if (body.nota) { return respuesta_(generarNota_(body.nota)); }
    if (body.hist) { return respuesta_(historial_(ss, body.hist)); }
    if (body.frget) { return respuesta_(frGet_(ss, body.frget)); }
    if (body.vacget) { return respuesta_(vacGet_(ss, body.vacget)); }
    if (body.bancoget) { return respuesta_(bancoGet_(ss)); }
    if (body.labget) { return respuesta_(labGet_(ss, body.labget, false)); }
    var rec = body.rec || {};
    lock.waitLock(20000);
    if (body.labpdf) { return respuesta_(labPdf_(ss, body.labpdf, false)); }
    if (body.bancoadd) { return respuesta_(bancoAdd_(ss, body.bancoadd)); }
    if (rec.tipo === 'ecv' || rec.tipo === 'fr') { return respuesta_(guardarCV_(ss, rec)); }
    if (rec.tipo === 'vac') { return respuesta_(guardarVac_(ss, rec)); }
    if (rec.tipo === 'lab') { return respuesta_(guardarLab_(ss, rec, false)); }
    if (rec.tipo === 'visita') { return respuesta_(guardarVisita_(ss, rec)); }
    return respuesta_(guardarNutricion_(rec));
  } catch (err) {
    return respuesta_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) { }
  }
}


/* ---------- Banco de términos compartido (hoja «Banco», se crea sola) ----------
 * Guarda vocabulario y correcciones («escuchado → correcto») de la Consulta asistida para que todo el equipo use el mismo.
 * NO guarda texto de consultas ni datos de pacientes. Columnas: tipo (t = término, c = corrección), escuchado, correcto, agregado por, fecha. */
function bancoSheet_(ss) {
  var sh = ss.getSheetByName('Banco');
  if (!sh) {
    sh = ss.insertSheet('Banco');
    sh.getRange(1, 1, 1, 5).setValues([['tipo', 'escuchado / término', 'correcto', 'agregado por', 'fecha']]).setFontWeight('bold').setBackground('#14304f').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}
function bancoGet_(ss) {
  var sh = bancoSheet_(ss), n = sh.getLastRow() - 1;
  if (n < 1) { return { ok: true, items: [] }; }
  var v = sh.getRange(2, 1, n, 3).getValues(), out = [];
  v.forEach(function (r) { var t = String(r[0] || ''), a = String(r[1] || '').trim(), b = String(r[2] || '').trim(); if ((t === 't' && a) || (t === 'c' && a && b)) { out.push(t === 't' ? ['t', a] : ['c', a, b]); } });
  return { ok: true, items: out };
}
function bancoAdd_(ss, q) {
  var sh = bancoSheet_(ss), items = (q.items || []).slice(0, 5000), n = sh.getLastRow() - 1, seen = {};
  if (n > 0) { sh.getRange(2, 1, n, 3).getValues().forEach(function (r) { seen[String(r[0]) + '|' + String(r[1]).toLowerCase() + '|' + String(r[2]).toLowerCase()] = 1; }); }
  var prof = limpio_(String(q.prof || '').slice(0, 60)), hoy = new Date(), rows = [];
  items.forEach(function (it) {
    var t = it[0] === 'c' ? 'c' : 't', a = String(it[1] || '').trim().slice(0, 80), b = t === 'c' ? String(it[2] || '').trim().slice(0, 80) : '';
    if (!a || (t === 'c' && !b)) { return; }
    var k = t + '|' + a.toLowerCase() + '|' + b.toLowerCase(); if (seen[k]) { return; } seen[k] = 1;
    rows.push([t, limpio_(a), limpio_(b), prof, hoy]);
  });
  if (rows.length) { sh.getRange(sh.getLastRow() + 1, 1, rows.length, 5).setValues(rows); }
  return { ok: true, nuevos: rows.length };
}

/* ---------- Consulta asistida (nota generada por IA) ----------
 * Configuración del proyecto (engranaje) > Propiedades del script. Agregue UNA de estas propiedades:
 *   GEMINI_KEY     clave gratuita de Google AI Studio (aistudio.google.com > Get API key). Sin costo, con límites de uso.
 *   ANTHROPIC_KEY  clave de la API de Claude (de pago por uso).
 * Si están las dos, se usa la de Claude. Sin ninguna, la consulta funciona en modo manual (copiar y pegar).
 * IMPORTANTE: en el plan gratuito de Gemini, Google puede usar el texto enviado para mejorar sus productos.
 * Por eso la página pide no escribir nombre ni DNI del paciente. */
var MODELO_NOTA = 'claude-sonnet-5-5';
var MODELO_GEMINI = 'gemini-3.6-flash';
function generarNota_(nota) {
  var props = PropertiesService.getScriptProperties();
  var kA = props.getProperty('ANTHROPIC_KEY'), kG = props.getProperty('GEMINI_KEY');
  if (!kA && !kG) { return { ok: false, error: 'sin_api' }; }
  var prompt = String(nota.prompt || '');
  if (!prompt || prompt.length > 120000) { return { ok: false, error: 'texto' }; }
  var r, j, t;
  if (kA) {
    r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': kA, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({ model: MODELO_NOTA, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
    });
    j = JSON.parse(r.getContentText());
    if (r.getResponseCode() !== 200 || !j.content) { return { ok: false, error: 'api', detalle: (j.error && j.error.message) || r.getResponseCode() }; }
    return { ok: true, text: j.content.map(function (c) { return c.text || ''; }).join('') };
  }
  r = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + MODELO_GEMINI + ':generateContent', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-goog-api-key': kG },
    payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } })
  });
  j = JSON.parse(r.getContentText());
  if (r.getResponseCode() !== 200 || !j.candidates || !j.candidates[0] || !j.candidates[0].content) {
    return { ok: false, error: 'api', detalle: (j.error && j.error.message) || r.getResponseCode() };
  }
  t = j.candidates[0].content.parts.map(function (c) { return c.text || ''; }).join('');
  return { ok: true, text: t };
}


/* ---------- Laboratorio (hoja «Laboratorio», se crea sola) + informes en una carpeta de Drive ----------
 * Un estudio por fila (código + fecha de extracción + origen + laboratorio). El DNI y el nombre NO van en esta hoja: sólo el código.
 * Origen: «profesional» (cargado por el equipo de salud) o «bioquimica» (cargado por el laboratorio con el código LAB_KEY).
 * Los informes (PDF/JPG/PNG) se guardan en la carpeta «CS61 Laboratorio (PDF)» del Drive de quien publicó el script, sin compartir. */
var LAB_ENC = ['Fecha de extracción', 'Código', 'Origen', 'Laboratorio', 'Fecha del informe', 'Solicitante', 'Valores (datos)', 'Rangos del laboratorio (datos)', 'Observaciones', 'Archivos (datos)', 'Cargado por', 'Registrado', 'Embarazo (trimestre)', 'Sexo'];
function labHoja_(ss) {
  var sh = ss.getSheetByName('Laboratorio');
  if (!sh) { sh = ss.insertSheet('Laboratorio'); sh.getRange(1, 1, 1, LAB_ENC.length).setValues([LAB_ENC]).setFontWeight('bold').setBackground('#14304f').setFontColor('#ffffff'); sh.setFrozenRows(1); }
  return sh;
}
function labNorm_(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
function labFila_(sh, codigo, iso, origen, lab) {
  var n = sh.getLastRow() - 1; if (n < 1) { return -1; }
  var A = sh.getRange(2, 1, n, 4).getValues();
  for (var i = 0; i < A.length; i++) {
    if (String(A[i][1]) === String(codigo) && fechaTxt_(A[i][0]) === iso && String(A[i][2]) === origen && labNorm_(A[i][3]) === labNorm_(lab)) { return i + 2; }
  }
  return -1;
}
function guardarLab_(ss, rec, restr) {
  var shP = ss.getSheetByName('Pacientes');
  if (!shP) { return { ok: false, error: 'faltan_hojas' }; }
  rec = rec || {};
  var props = PropertiesService.getDocumentProperties(), ids = JSON.parse(props.getProperty('ids') || '[]');
  if (rec.id && ids.indexOf(rec.id) >= 0) { return { ok: true, dup: true }; }
  var c = codigoPara_(shP, rec);
  if (c.error) { return { ok: false, error: c.error }; }
  var origen = restr || rec.origen === 'bioquimica' ? 'bioquimica' : 'profesional';
  var fecha = fecha_(rec.fecha); if (!fecha) { return { ok: false, error: 'fecha' }; }
  var iso = fechaTxt_(fecha), lab = limpio_(String(rec.lab || '').slice(0, 80));
  var val = {}, ran = {}, k;
  var V = rec.valores || {}, Rg = rec.rangos || {};
  for (k in V) { if (/^[a-z0-9]{1,12}$/.test(k) && typeof V[k] === 'number' && isFinite(V[k])) { val[k] = V[k]; } }
  for (k in Rg) {
    if (val[k] === undefined || !(Rg[k] instanceof Array)) { continue; }
    var lo = typeof Rg[k][0] === 'number' && isFinite(Rg[k][0]) ? Rg[k][0] : null, hi = typeof Rg[k][1] === 'number' && isFinite(Rg[k][1]) ? Rg[k][1] : null;
    if (lo !== null || hi !== null) { ran[k] = [lo, hi]; }
  }
  var jv = JSON.stringify(val), jr = JSON.stringify(ran);
  if (jv.length > 20000 || jr.length > 20000) { return { ok: false, error: 'datos_largos' }; }
  var sh = labHoja_(ss), fila = labFila_(sh, c.codigo, iso, origen, lab), arch = '[]';
  if (fila > 0) { arch = String(sh.getRange(fila, 10).getValue() || '[]'); }
  var vals = [fecha, c.codigo, origen, lab, fecha_(rec.informe) || '', limpio_(String(rec.sol || '').slice(0, 80)), jv, jr, limpio_(String(rec.obs || '').slice(0, 1500)), arch, limpio_(String(rec.profesional || '').slice(0, 60)), new Date(), limpio_(String(rec.emb || '').slice(0, 1)), rec.sexo === 'M' || rec.sexo === 'F' ? rec.sexo : ''];
  if (fila < 0) { fila = sh.getLastRow() + 1; }
  sh.getRange(fila, 1, 1, vals.length).setValues([vals]);
  if (rec.id) { ids.push(rec.id); props.setProperty('ids', JSON.stringify(ids.slice(-300))); }
  return { ok: true, codigo: c.codigo, nuevo: c.nuevo };
}
// Estudios de una persona (por DNI o código). Con restr (código de laboratorio) NO devuelve nombre ni valores: sólo fecha, laboratorio y cantidad.
function labGet_(ss, q, restr) {
  var shP = ss.getSheetByName('Pacientes');
  if (!shP) { return { ok: false, error: 'faltan_hojas' }; }
  q = q || {};
  var dni = dniNum_(q.dni), cod = String(q.codigo || '').toUpperCase().trim(), codigo = '', nombre = '', fnac = '';
  if (!dni && !cod) { return { ok: false, error: 'sin_dni' }; }
  var P = shP.getRange(2, 1, Math.max(shP.getMaxRows() - 1, 1), 7).getValues();
  for (var i = 0; i < P.length; i++) {
    if ((dni && dniNum_(P[i][1]) === dni) || (!dni && cod && String(P[i][0]).toUpperCase() === cod)) { codigo = String(P[i][0]); nombre = String(P[i][2] || ''); fnac = fechaTxt_(P[i][6]); break; }
  }
  if (!codigo) { return { ok: true, codigo: '', estudios: [] }; }
  var sh = ss.getSheetByName('Laboratorio'), n = sh ? sh.getLastRow() - 1 : 0, out = [], sexo = '';
  if (n >= 1) {
    var v = sh.getRange(2, 1, n, LAB_ENC.length).getValues();
    v.forEach(function (r) {
      if (String(r[1]) !== codigo) { return; }
      var va = {}, ra = {}, ar = [];
      try { va = JSON.parse(r[6] || '{}'); } catch (e) { } try { ra = JSON.parse(r[7] || '{}'); } catch (e) { } try { ar = JSON.parse(r[9] || '[]'); } catch (e) { }
      var e = { fecha: fechaTxt_(r[0]), origen: String(r[2]), lab: String(r[3] || ''), informe: fechaTxt_(r[4]), sol: String(r[5] || ''), valores: va, rangos: ra, obs: String(r[8] || ''), archivos: ar, prof: String(r[10] || ''), sexo: String(r[13] || '') };
      if (restr) { if (e.origen !== 'bioquimica') { return; } e = { fecha: e.fecha, origen: e.origen, lab: e.lab, n: Object.keys(va).length, archivos: [] }; }
      out.push(e);
    });
  }
  out.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
  for (var j = 0; j < out.length && !restr; j++) { if (out[j].sexo) { sexo = out[j].sexo; break; } }
  out = out.slice(0, 30);
  if (restr) { return { ok: true, codigo: codigo, estudios: out }; }
  return { ok: true, codigo: codigo, nombre: nombre, fnac: fnac, sexo: sexo, estudios: out };
}
// Ejecutar UNA vez desde el editor de Apps Script (menú ▶ Ejecutar) para dar permiso de Drive y crear la carpeta de informes.
function autorizarDrive() { var f = carpetaLab_(); Logger.log('Carpeta de informes: ' + f.getUrl()); }
function carpetaLab_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('LAB_FOLDER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { } }
  var it = DriveApp.getFoldersByName('CS61 Laboratorio (PDF)'), f = it.hasNext() ? it.next() : DriveApp.createFolder('CS61 Laboratorio (PDF)');
  props.setProperty('LAB_FOLDER', f.getId());
  return f;
}
// Adjunta un informe a un estudio ya guardado (PDF, JPG o PNG de hasta 5 MB). El nombre del archivo lleva sólo el código, nunca el DNI ni el nombre.
function labPdf_(ss, q, restr) {
  q = q || {};
  var mime = String(q.mime || ''), ext = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png' }[mime];
  if (!ext || !q.b64 || String(q.b64).length > 7200000) { return { ok: false, error: 'archivo' }; }
  var codigo = String(q.codigo || '').toUpperCase().trim(), iso = String(q.fecha || '').slice(0, 10), origen = restr || q.origen === 'bioquimica' ? 'bioquimica' : 'profesional';
  if (!/^CS61-\d+$/.test(codigo) || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) { return { ok: false, error: 'sin_estudio' }; }
  var sh = ss.getSheetByName('Laboratorio'); if (!sh) { return { ok: false, error: 'sin_estudio' }; }
  var fila = labFila_(sh, codigo, iso, origen, q.lab);
  if (fila < 0) { return { ok: false, error: 'sin_estudio' }; }
  var arch = []; try { arch = JSON.parse(sh.getRange(fila, 10).getValue() || '[]'); } catch (e) { }
  if (arch.length >= 5) { return { ok: false, error: 'archivo' }; }
  var bytes = Utilities.base64Decode(String(q.b64));
  if (bytes.length > 5 * 1048576 + 1024) { return { ok: false, error: 'archivo' }; }
  var nombre = codigo + '_' + iso + '_' + origen + '_' + (arch.length + 1) + ext;
  var file = carpetaLab_().createFile(Utilities.newBlob(bytes, mime, nombre));
  arch.push({ n: nombre, id: file.getId(), url: file.getUrl() });
  sh.getRange(fila, 10).setValue(JSON.stringify(arch));
  return { ok: true, url: file.getUrl(), id: file.getId() };
}

function doGet() {
  return respuesta_({ ok: true, servicio: 'Planilla CS 61' });
}
