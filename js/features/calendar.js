/* Mediary — js/features/calendar.js */
/* ============================================================
   LÓGICA DEL CALENDARIO Y PRÓXIMOS ESTRENOS
   ============================================================ */

let calAnioActivo = new Date().getFullYear();
let calMesActivo = new Date().getMonth(); // 0 - 11
let calDiaSeleccionadoKey = null; // 'YYYY-MM-DD'
let calModoSubvista = 'grid'; // 'grid' | 'estrenos'
let calFiltroEstrenosCat = 'todas';
let calBusquedaEstrenos = '';

function escapeHtmlCal(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizarFechaAKeyYYYYMMDD(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(val).trim();
  const mDmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mDmy) {
    const d = mDmy[1].padStart(2, '0');
    const m = mDmy[2].padStart(2, '0');
    const y = mDmy[3];
    return `${y}-${m}-${d}`;
  }
  const mYmd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (mYmd) {
    const y = mYmd[1];
    const m = mYmd[2].padStart(2, '0');
    const d = mYmd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
}

function obtenerFechaHoyKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function esSerieCompletaRegistro(r) {
  if (!r) return false;
  const c = String(r.categoria || '').trim();
  const s = String(r.subcategoria || '').trim().toLowerCase();
  return c === 'Series' && (s === 'series completas' || s.includes('completa'));
}
window.esSerieCompletaRegistro = esSerieCompletaRegistro;

function obtenerFechaKeyDeRegistro(r) {
  if (!r || esSerieCompletaRegistro(r)) return null;
  let fStr = (r.fechaFin && r.fechaFin !== 'Sin fecha' && typeof esEnProgresoTexto === 'function' && !esEnProgresoTexto(r.fechaFin))
    ? r.fechaFin
    : '';
  if (!fStr && r.fechaInicio && r.fechaInicio !== 'Sin fecha') {
    fStr = r.fechaInicio;
  }
  if (!fStr && r.fecha && r.fecha !== 'Sin fecha') {
    fStr = r.fecha;
  }
  if (fStr) {
    const key = normalizarFechaAKeyYYYYMMDD(fStr);
    if (key) return key;
  }
  if (r.created_at) {
    const key = normalizarFechaAKeyYYYYMMDD(r.created_at);
    if (key) return key;
  }
  return null;
}

function agruparRegistrosPorDia() {
  const mapa = {};
  const regs = Array.isArray(estado.registros) ? estado.registros : [];
  for (const r of regs) {
    if (esSerieCompletaRegistro(r)) continue;
    const key = obtenerFechaKeyDeRegistro(r);
    if (!key) continue;
    if (!mapa[key]) mapa[key] = [];
    mapa[key].push(r);
  }
  return mapa;
}

function agruparEstrenosPorDia() {
  const mapa = {};
  const estrenos = Array.isArray(estado.proximosEstrenos) ? estado.proximosEstrenos : [];
  for (const e of estrenos) {
    const key = normalizarFechaAKeyYYYYMMDD(e.fechaEstreno);
    if (!key) continue;
    if (!mapa[key]) mapa[key] = [];
    mapa[key].push(e);
  }
  return mapa;
}

function cargarProximosEstrenos() {
  try {
    let raw = null;
    if (estado.userEmail) {
      raw = localStorage.getItem('mediary_proximos_estrenos_' + estado.userEmail.toLowerCase());
    }
    if (!raw) {
      raw = localStorage.getItem('mediary_proximos_estrenos');
    }
    if (raw) {
      estado.proximosEstrenos = JSON.parse(raw);
      if (!Array.isArray(estado.proximosEstrenos)) estado.proximosEstrenos = [];
    } else {
      estado.proximosEstrenos = [];
    }
  } catch (err) {
    console.error('Error al cargar próximos estrenos:', err);
    estado.proximosEstrenos = [];
  }
  actualizarContadorEstrenosUI();
}
window.cargarProximosEstrenos = cargarProximosEstrenos;

function guardarProximosEstrenosStorage() {
  try {
    const json = JSON.stringify(estado.proximosEstrenos || []);
    localStorage.setItem('mediary_proximos_estrenos', json);
    if (estado.userEmail) {
      localStorage.setItem('mediary_proximos_estrenos_' + estado.userEmail.toLowerCase(), json);
    }
  } catch (err) {
    console.error('Error al guardar próximos estrenos en storage:', err);
  }
  actualizarContadorEstrenosUI();
}
window.guardarProximosEstrenosStorage = guardarProximosEstrenosStorage;

function actualizarContadorEstrenosUI() {
  const total = (estado.proximosEstrenos || []).length;
  const b1 = document.getElementById('cal-badge-estrenos-count');
  if (b1) b1.textContent = total;
  const b2 = document.getElementById('cal-count-estrenos-badge');
  if (b2) b2.textContent = total;
}
window.actualizarContadorEstrenosUI = actualizarContadorEstrenosUI;

function abrirVistaCalendario(pushNav = true) {
  try {
    if (pushNav) registrarNavegacionApp('calendario');
    guardarEstadoNavegacionActual('calendario', '');
    resetearBuscadoresYFormularios();
    if (estado.categoria === 'listas') {
      estado.vistaPreviaCalendario = 'listas';
    } else if (estado.categoria !== 'calendario') {
      estado.vistaPreviaCalendario = 'inicio';
    }
    estado.categoria = 'calendario';
    estado.subcategoria = '';
    actualizarNavWebActiva();
    if (typeof actualizarVisibilidadMenuInferior === 'function') actualizarVisibilidadMenuInferior(false);

    const vIni = document.getElementById('vista-inicio'); if (vIni) vIni.style.display = 'none';
    const vCat = document.getElementById('vista-categoria'); if (vCat) vCat.style.display = 'none';
    const vDis = document.getElementById('vista-discover'); if (vDis) vDis.style.display = 'none';
    const vAm = document.getElementById('vista-amigos'); if (vAm) vAm.style.display = 'none';
    const vPerf = document.getElementById('vista-perfil'); if (vPerf) vPerf.style.display = 'none';
    const vList = document.getElementById('vista-listas-extendida'); if (vList) vList.style.display = 'none';
    const vWl = document.getElementById('vista-watchlists'); if (vWl) vWl.style.display = 'none';
    const vAmPerf = document.getElementById('vista-perfil-amigo'); if (vAmPerf) vAmPerf.style.display = 'none';
    const vAmRegs = document.getElementById('vista-registros-amigo'); if (vAmRegs) vAmRegs.style.display = 'none';

    const vCal = document.getElementById('vista-calendario');
    if (vCal) vCal.style.display = 'block';

    if (!calDiaSeleccionadoKey) {
      calDiaSeleccionadoKey = obtenerFechaHoyKey();
    }
    const hoy = new Date();
    if (calAnioActivo === undefined || calAnioActivo === null) calAnioActivo = hoy.getFullYear();
    if (calMesActivo === undefined || calMesActivo === null) calMesActivo = hoy.getMonth();

    poblarSelectoresMesYAnio();
    renderizarVistaCalendarioCompleta();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error('Error al abrir vista calendario:', err);
  }
}
window.abrirVistaCalendario = abrirVistaCalendario;

function volverDesdeCalendario() {
  if (window.history && window.history.length > 1 && typeof appNavHistory !== 'undefined' && appNavHistory.length > 1) {
    history.back();
    return;
  }
  const vCal = document.getElementById('vista-calendario');
  const destino = (estado.vistaPreviaCalendario === 'listas') ? 'listas' : 'inicio';
  const elDestino = destino === 'listas' ? document.getElementById('vista-listas-extendida') : document.getElementById('vista-inicio');

  if (typeof animarSalidaVistaAtras === 'function') {
    animarSalidaVistaAtras(vCal, () => {
      if (typeof actualizarVisibilidadMenuInferior === 'function') {
        actualizarVisibilidadMenuInferior(true);
      }
      if (destino === 'listas') {
        if (typeof abrirVistaDashboardListas === 'function') abrirVistaDashboardListas(false);
      } else {
        if (typeof irInicio === 'function') irInicio(false);
      }
      const targetBtn = destino === 'listas' ? 'm-btn-listas-ext' : 'm-btn-inicio';
      if (typeof actualizarBarraNavegacionMovil === 'function') {
        actualizarBarraNavegacionMovil(targetBtn);
      }
    }, elDestino);
  } else {
    if (typeof actualizarVisibilidadMenuInferior === 'function') {
      actualizarVisibilidadMenuInferior(true);
    }
    if (destino === 'listas') {
      if (typeof abrirVistaDashboardListas === 'function') abrirVistaDashboardListas(false);
    } else {
      if (typeof irInicio === 'function') irInicio(false);
    }
    const targetBtn = destino === 'listas' ? 'm-btn-listas-ext' : 'm-btn-inicio';
    if (typeof actualizarBarraNavegacionMovil === 'function') {
      actualizarBarraNavegacionMovil(targetBtn);
    }
  }
}
window.volverDesdeCalendario = volverDesdeCalendario;

function cambiarModoSubvistaCalendario(modo) {
  calModoSubvista = modo || 'grid';
  const btnGrid = document.getElementById('btn-tab-cal-grid');
  const btnEstrenos = document.getElementById('btn-tab-cal-estrenos');
  const subGrid = document.getElementById('cal-subvista-grid');
  const subEstrenos = document.getElementById('cal-subvista-estrenos');

  if (btnGrid) btnGrid.classList.toggle('active', calModoSubvista === 'grid');
  if (btnEstrenos) btnEstrenos.classList.toggle('active', calModoSubvista === 'estrenos');
  if (subGrid) subGrid.style.display = calModoSubvista === 'grid' ? 'block' : 'none';
  if (subEstrenos) subEstrenos.style.display = calModoSubvista === 'estrenos' ? 'block' : 'none';

  renderizarVistaCalendarioCompleta();
}
window.cambiarModoSubvistaCalendario = cambiarModoSubvistaCalendario;

const CAL_MESES_FALLBACK_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const CAL_MESES_FALLBACK_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function obtenerNombreMesCalendario(idx) {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang) || 'es';
  const i18nArr = (typeof I18N !== 'undefined' && I18N[l]?.meses) || (typeof window.I18N !== 'undefined' && window.I18N[l]?.meses) || (typeof MEDIARY_I18N_ES !== 'undefined' && MEDIARY_I18N_ES.meses);
  if (Array.isArray(i18nArr) && i18nArr[idx]) return i18nArr[idx];
  const fallback = l === 'en' ? CAL_MESES_FALLBACK_EN : CAL_MESES_FALLBACK_ES;
  return fallback[idx] || `Mes ${idx + 1}`;
}
window.obtenerNombreMesCalendario = obtenerNombreMesCalendario;

function toggleDropdownMesCalendario(eventOrForce) {
  if (eventOrForce && typeof eventOrForce.stopPropagation === 'function') {
    eventOrForce.stopPropagation();
  }
  const menu = document.getElementById('cal-menu-mes');
  const trigger = document.getElementById('cal-trigger-mes');
  const menuAnio = document.getElementById('cal-menu-anio');
  const triggerAnio = document.getElementById('cal-trigger-anio');
  if (menuAnio) menuAnio.classList.remove('open');
  if (triggerAnio) {
    triggerAnio.classList.remove('active');
    triggerAnio.setAttribute('aria-expanded', 'false');
  }
  if (!menu || !trigger) return;
  const isOpen = (typeof eventOrForce === 'boolean') ? eventOrForce : !menu.classList.contains('open');
  menu.classList.toggle('open', isOpen);
  trigger.classList.toggle('active', isOpen);
  trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}
window.toggleDropdownMesCalendario = toggleDropdownMesCalendario;

function toggleDropdownAnioCalendario(eventOrForce) {
  if (eventOrForce && typeof eventOrForce.stopPropagation === 'function') {
    eventOrForce.stopPropagation();
  }
  const menu = document.getElementById('cal-menu-anio');
  const trigger = document.getElementById('cal-trigger-anio');
  const menuMes = document.getElementById('cal-menu-mes');
  const triggerMes = document.getElementById('cal-trigger-mes');
  if (menuMes) menuMes.classList.remove('open');
  if (triggerMes) {
    triggerMes.classList.remove('active');
    triggerMes.setAttribute('aria-expanded', 'false');
  }
  if (!menu || !trigger) return;
  const isOpen = (typeof eventOrForce === 'boolean') ? eventOrForce : !menu.classList.contains('open');
  menu.classList.toggle('open', isOpen);
  trigger.classList.toggle('active', isOpen);
  trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}
window.toggleDropdownAnioCalendario = toggleDropdownAnioCalendario;

function cerrarDropdownsCalendario() {
  const menuMes = document.getElementById('cal-menu-mes');
  const triggerMes = document.getElementById('cal-trigger-mes');
  const menuAnio = document.getElementById('cal-menu-anio');
  const triggerAnio = document.getElementById('cal-trigger-anio');
  if (menuMes) menuMes.classList.remove('open');
  if (triggerMes) {
    triggerMes.classList.remove('active');
    triggerMes.setAttribute('aria-expanded', 'false');
  }
  if (menuAnio) menuAnio.classList.remove('open');
  if (triggerAnio) {
    triggerAnio.classList.remove('active');
    triggerAnio.setAttribute('aria-expanded', 'false');
  }
}
window.cerrarDropdownsCalendario = cerrarDropdownsCalendario;

document.addEventListener('click', (e) => {
  const path = (e.composedPath && e.composedPath()) || [];
  const isInside = path.some(el => el && el.id && (el.id === 'cal-dd-mes' || el.id === 'cal-dd-anio'));
  const closestTarget = (e.target && typeof e.target.closest === 'function')
    ? (e.target.closest('#cal-dd-mes') || e.target.closest('#cal-dd-anio'))
    : null;
  if (!isInside && !closestTarget) {
    cerrarDropdownsCalendario();
  }
});

function seleccionarMesCalendario(val, e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  calMesActivo = parseInt(val, 10);
  cerrarDropdownsCalendario();
  poblarSelectoresMesYAnio();
  renderizarGridMesCalendario();
  renderizarDetalleDiaSeleccionado();
}
window.seleccionarMesCalendario = seleccionarMesCalendario;

function seleccionarAnioCalendario(val, e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  calAnioActivo = parseInt(val, 10);
  cerrarDropdownsCalendario();
  poblarSelectoresMesYAnio();
  renderizarGridMesCalendario();
  renderizarDetalleDiaSeleccionado();
}
window.seleccionarAnioCalendario = seleccionarAnioCalendario;

function poblarSelectoresMesYAnio() {
  const nombreMes = obtenerNombreMesCalendario(calMesActivo);

  const lblMes = document.getElementById('cal-lbl-mes');
  if (lblMes) lblMes.textContent = nombreMes;

  const lblAnio = document.getElementById('cal-lbl-anio');
  if (lblAnio) lblAnio.textContent = String(calAnioActivo);

  const menuMes = document.getElementById('cal-menu-mes');
  if (menuMes) {
    const mesesItems = [];
    for (let i = 0; i < 12; i++) {
      const nom = obtenerNombreMesCalendario(i);
      const isSel = Number(calMesActivo) === i;
      mesesItems.push(`
        <button type="button" class="cal-dd-item ${isSel ? 'selected' : ''}" onclick="event.stopPropagation(); seleccionarMesCalendario(${i}, event)" role="option" aria-selected="${isSel ? 'true' : 'false'}">
          <span>${nom}</span>
          ${isSel ? '<span style="font-size:0.75rem;color:var(--accent);">✓</span>' : ''}
        </button>
      `);
    }
    menuMes.innerHTML = mesesItems.join('');
  }

  const anioActual = new Date().getFullYear();
  const aniosSet = new Set([anioActual - 2, anioActual - 1, anioActual, anioActual + 1, anioActual + 2, anioActual + 3]);
  if (calAnioActivo) aniosSet.add(Number(calAnioActivo));

  if (typeof estado !== 'undefined' && estado) {
    if (Array.isArray(estado.registros)) {
      estado.registros.forEach(r => {
        const k = obtenerFechaKeyDeRegistro(r);
        if (k) {
          const y = parseInt(k.slice(0, 4), 10);
          if (y >= 1990 && y <= anioActual + 10) aniosSet.add(y);
        }
      });
    }
    if (Array.isArray(estado.proximosEstrenos)) {
      estado.proximosEstrenos.forEach(e => {
        const k = normalizarFechaAKeyYYYYMMDD(e.fechaEstreno);
        if (k) {
          const y = parseInt(k.slice(0, 4), 10);
          if (y >= 1990 && y <= anioActual + 10) aniosSet.add(y);
        }
      });
    }
  }

  const aniosArr = Array.from(aniosSet).sort((a, b) => b - a);
  const menuAnio = document.getElementById('cal-menu-anio');
  if (menuAnio) {
    menuAnio.innerHTML = aniosArr.map(y => {
      const isSel = Number(calAnioActivo) === y;
      return `
        <button type="button" class="cal-dd-item ${isSel ? 'selected' : ''}" onclick="event.stopPropagation(); seleccionarAnioCalendario(${y}, event)" role="option" aria-selected="${isSel ? 'true' : 'false'}">
          <span>${y}</span>
          ${isSel ? '<span style="font-size:0.75rem;color:var(--accent);">✓</span>' : ''}
        </button>
      `;
    }).join('');
  }

  // Soporte de compatibilidad con selects ocultos
  const selMes = document.getElementById('cal-select-mes');
  const selAnio = document.getElementById('cal-select-anio');
  if (selMes) selMes.value = String(calMesActivo);
  if (selAnio) {
    selAnio.innerHTML = aniosArr.map(y => `<option value="${y}" ${Number(calAnioActivo) === y ? 'selected' : ''}>${y}</option>`).join('');
    selAnio.value = String(calAnioActivo);
  }
}
window.poblarSelectoresMesYAnio = poblarSelectoresMesYAnio;

function onSelectMesCalendario(val) {
  seleccionarMesCalendario(val);
}
window.onSelectMesCalendario = onSelectMesCalendario;

function onSelectAnioCalendario(val) {
  seleccionarAnioCalendario(val);
}
window.onSelectAnioCalendario = onSelectAnioCalendario;

function cambiarMesCalendario(delta) {
  calMesActivo += delta;
  if (calMesActivo < 0) {
    calMesActivo = 11;
    calAnioActivo -= 1;
  } else if (calMesActivo > 11) {
    calMesActivo = 0;
    calAnioActivo += 1;
  }
  poblarSelectoresMesYAnio();
  renderizarGridMesCalendario();
}
window.cambiarMesCalendario = cambiarMesCalendario;

function irAHoyCalendario() {
  const hoy = new Date();
  calAnioActivo = hoy.getFullYear();
  calMesActivo = hoy.getMonth();
  calDiaSeleccionadoKey = obtenerFechaHoyKey();
  poblarSelectoresMesYAnio();
  renderizarGridMesCalendario();
  renderizarDetalleDiaSeleccionado();
}
window.irAHoyCalendario = irAHoyCalendario;

function renderizarVistaCalendarioCompleta() {
  actualizarContadorEstrenosUI();
  if (calModoSubvista === 'estrenos') {
    renderizarListaEstrenos();
  } else {
    renderizarGridMesCalendario();
    renderizarDetalleDiaSeleccionado();
  }
}
window.renderizarVistaCalendarioCompleta = renderizarVistaCalendarioCompleta;

function renderizarGridMesCalendario() {
  const gridEl = document.getElementById('cal-days-grid-cells');
  if (!gridEl) return;

  const y = Number(calAnioActivo);
  const m = Number(calMesActivo);
  const hoyKey = obtenerFechaHoyKey();

  const diasEnMes = new Date(y, m + 1, 0).getDate();
  const primerDiaSemana = (new Date(y, m, 1).getDay() + 6) % 7; // Lun=0 ... Dom=6

  const mapaRegs = agruparRegistrosPorDia();
  const mapaEsts = agruparEstrenosPorDia();

  let html = '';

  // Días previos de relleno (mes anterior)
  const diasMesAnterior = new Date(y, m, 0).getDate();
  const mesPrevIndex = m === 0 ? 11 : m - 1;
  const anioPrev = m === 0 ? y - 1 : y;

  for (let i = primerDiaSemana - 1; i >= 0; i--) {
    const diaNum = diasMesAnterior - i;
    const diaKey = `${anioPrev}-${String(mesPrevIndex + 1).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
    const itemsDia = mapaRegs[diaKey] || [];
    const estrenosDia = mapaEsts[diaKey] || [];
    const esHoy = diaKey === hoyKey;
    const esSel = diaKey === calDiaSeleccionadoKey;
    const tieneEstrenos = estrenosDia.length > 0;

    const dotsHtml = itemsDia.slice(0, 4).map(it => {
      const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(it.categoria, it.subcategoria) : null;
      const color = metaCol ? metaCol.colorVar : 'var(--accent)';
      const nom = metaCol ? metaCol.nombre : it.categoria;
      return `<span class="cal-dot" style="background:${color};" title="${escapeHtmlCal(it.titulo)} (${nom})"></span>`;
    }).join('') + (itemsDia.length > 4 ? `<span class="cal-dot-more">+${itemsDia.length - 4}</span>` : '');

    html += `
      <div class="cal-day-cell cal-dia-otro-mes ${esHoy ? 'cal-dia-hoy' : ''} ${esSel ? 'cal-dia-seleccionado' : ''}" onclick="seleccionarDiaCalendario('${diaKey}')">
        <div class="cal-day-cell-top">
          <span class="cal-day-num">${diaNum}</span>
          ${tieneEstrenos ? '<span class="cal-estreno-star" title="Tiene estreno">✦</span>' : ''}
        </div>
        <div class="cal-dots-container">
          ${dotsHtml}
        </div>
      </div>
    `;
  }

  // Días del mes activo
  for (let d = 1; d <= diasEnMes; d++) {
    const diaKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const itemsDia = mapaRegs[diaKey] || [];
    const estrenosDia = mapaEsts[diaKey] || [];
    const esHoy = diaKey === hoyKey;
    const esSel = diaKey === calDiaSeleccionadoKey;
    const tieneEstrenos = estrenosDia.length > 0;

    const dotsHtml = itemsDia.slice(0, 4).map(it => {
      const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(it.categoria, it.subcategoria) : null;
      const color = metaCol ? metaCol.colorVar : 'var(--accent)';
      const nom = metaCol ? metaCol.nombre : it.categoria;
      return `<span class="cal-dot" style="background:${color};" title="${escapeHtmlCal(it.titulo)} (${nom})"></span>`;
    }).join('') + (itemsDia.length > 4 ? `<span class="cal-dot-more">+${itemsDia.length - 4}</span>` : '');

    html += `
      <div class="cal-day-cell ${esHoy ? 'cal-dia-hoy' : ''} ${esSel ? 'cal-dia-seleccionado' : ''}" onclick="seleccionarDiaCalendario('${diaKey}')">
        <div class="cal-day-cell-top">
          <span class="cal-day-num">${d}</span>
          ${tieneEstrenos ? '<span class="cal-estreno-star" title="Tiene estreno">✦</span>' : ''}
        </div>
        <div class="cal-dots-container">
          ${dotsHtml}
        </div>
      </div>
    `;
  }

  // Días posteriores de relleno (mes siguiente) para completar múltiplos de 7
  const celdasUsadas = primerDiaSemana + diasEnMes;
  const celdasRestantes = (7 - (celdasUsadas % 7)) % 7;
  const mesPostIndex = m === 11 ? 0 : m + 1;
  const anioPost = m === 11 ? y + 1 : y;

  for (let d = 1; d <= celdasRestantes; d++) {
    const diaKey = `${anioPost}-${String(mesPostIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const itemsDia = mapaRegs[diaKey] || [];
    const estrenosDia = mapaEsts[diaKey] || [];
    const esHoy = diaKey === hoyKey;
    const esSel = diaKey === calDiaSeleccionadoKey;
    const tieneEstrenos = estrenosDia.length > 0;

    const dotsHtml = itemsDia.slice(0, 4).map(it => {
      const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(it.categoria, it.subcategoria) : null;
      const color = metaCol ? metaCol.colorVar : 'var(--accent)';
      const nom = metaCol ? metaCol.nombre : it.categoria;
      return `<span class="cal-dot" style="background:${color};" title="${escapeHtmlCal(it.titulo)} (${nom})"></span>`;
    }).join('') + (itemsDia.length > 4 ? `<span class="cal-dot-more">+${itemsDia.length - 4}</span>` : '');

    html += `
      <div class="cal-day-cell cal-dia-otro-mes ${esHoy ? 'cal-dia-hoy' : ''} ${esSel ? 'cal-dia-seleccionado' : ''}" onclick="seleccionarDiaCalendario('${diaKey}')">
        <div class="cal-day-cell-top">
          <span class="cal-day-num">${d}</span>
          ${tieneEstrenos ? '<span class="cal-estreno-star" title="Tiene estreno">✦</span>' : ''}
        </div>
        <div class="cal-dots-container">
          ${dotsHtml}
        </div>
      </div>
    `;
  }

  gridEl.innerHTML = html;
}
window.renderizarGridMesCalendario = renderizarGridMesCalendario;

function seleccionarDiaCalendario(diaKey) {
  calDiaSeleccionadoKey = diaKey;
  renderizarGridMesCalendario();
  renderizarDetalleDiaSeleccionado();
}
window.seleccionarDiaCalendario = seleccionarDiaCalendario;

function renderizarDetalleDiaSeleccionado() {
  const diaKey = calDiaSeleccionadoKey || obtenerFechaHoyKey();
  const labelEl = document.getElementById('cal-detail-date-label');
  const pillsWrap = document.getElementById('cal-detail-pills-wrap');
  const contentArea = document.getElementById('cal-detail-content-area');
  if (!contentArea) return;

  const [yStr, mStr, dStr] = diaKey.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  const fechaObj = new Date(y, m - 1, d);

  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');
  const diasSemana = isEn
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    : ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = isEn
    ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const nombreDia = diasSemana[fechaObj.getDay()] || '';
  const nombreMes = meses[m - 1] || '';
  const esHoy = diaKey === obtenerFechaHoyKey();
  const traducirCatCal = (nom) => {
    if (!isEn || !nom) return nom;
    const map = { 'Películas': 'Movies', 'Series': 'TV Shows', 'Música': 'Music', 'Juegos': 'Games', 'Lecturas': 'Readings', 'Libros': 'Books', 'Cómics': 'Comics', 'Mangas': 'Manga', 'Documentales': 'Documentaries', 'Temporadas': 'Seasons', 'Series Completas': 'Completed Series', 'Series Documentales': 'Docuseries', 'Discos': 'Albums', 'Conciertos': 'Concerts', 'Artistas/Grupos': 'Artists/Bands', 'Videojuegos': 'Video Games' };
    return map[nom] || nom;
  };

  if (labelEl) {
    labelEl.textContent = isEn
      ? `${nombreDia}, ${nombreMes} ${d}, ${y}${esHoy ? ' (Today)' : ''}`
      : `${nombreDia}, ${d} de ${nombreMes} de ${y}${esHoy ? ' (Hoy)' : ''}`;
  }

  const mapaRegs = agruparRegistrosPorDia();
  const mapaEsts = agruparEstrenosPorDia();
  const regs = mapaRegs[diaKey] || [];
  const ests = mapaEsts[diaKey] || [];

  if (pillsWrap) {
    let pillsHtml = '';
    if (regs.length > 0) {
      pillsHtml += `<span class="cal-detail-pill" style="background:rgba(56,189,248,0.15); color:var(--accent); border:1px solid rgba(56,189,248,0.3);">${regs.length} ${isEn ? (regs.length === 1 ? 'record' : 'records') : (regs.length === 1 ? 'registro' : 'registros')}</span>`;
    }
    if (ests.length > 0) {
      pillsHtml += `<span class="cal-detail-pill" style="background:rgba(251,191,36,0.18); color:#fbbf24; border:1px solid rgba(251,191,36,0.35);">✦ ${ests.length} ${isEn ? (ests.length === 1 ? 'release' : 'releases') : (ests.length === 1 ? 'estreno' : 'estrenos')}</span>`;
    }
    pillsWrap.innerHTML = pillsHtml;
  }

  if (regs.length === 0 && ests.length === 0) {
    contentArea.innerHTML = `
      <div class="cal-empty-state">
        <p style="margin:0 0 10px 0;">${isEn ? 'No records or releases saved for this day.' : 'No hay registros ni estrenos guardados para este día.'}</p>
        <button type="button" class="btn-agregar-estreno" onclick="abrirModalAgregarEstrenoConFecha('${diaKey}')">
          <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>${isEn ? '+ Schedule Release for this day' : '+ Agendar Estreno para este día'}</span>
        </button>
      </div>
    `;
    return;
  }

  let html = '';

  // 1. Estrenos agendados en este día
  if (ests.length > 0) {
    html += `
      <div style="margin-bottom:14px;">
        <div style="font-size:0.82rem; font-weight:700; color:#fbbf24; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <span>✦</span> <span>${isEn ? `Scheduled Upcoming Releases (${ests.length})` : `Próximos Estrenos programados (${ests.length})`}</span>
        </div>
        <div class="cal-cards-list">
    `;
    ests.forEach(e => {
      const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(e.categoria, '') : null;
      const nomCat = traducirCatCal(metaCol ? metaCol.nombre : e.categoria);
      const bgCat = metaCol ? metaCol.bgVar : 'rgba(56,189,248,0.15)';
      const colCat = metaCol ? metaCol.colorVar : 'var(--accent)';
      const borCat = metaCol ? metaCol.borderVar : 'transparent';
      const countdown = calcularBadgeCountdownEstreno(e.fechaEstreno);

      html += `
        <div class="cal-work-card">
          ${e.poster ? `<img loading="lazy" decoding="async" class="cal-work-poster" src="${escapeHtmlCal(e.poster)}" alt="${escapeHtmlCal(e.titulo)}" onerror="this.style.display='none'">` : `<div class="cal-work-poster-placeholder">✦</div>`}
          <div class="cal-work-info">
            <div class="cal-work-title" title="${escapeHtmlCal(e.titulo)}">${escapeHtmlCal(e.titulo)}</div>
            <div class="cal-work-meta">
              <span class="cal-cat-badge" style="background:${bgCat}; color:${colCat}; border:1px solid ${borCat};">${nomCat}</span>
              <span class="cal-countdown-pill ${countdown.clase}">${countdown.texto}</span>
              ${e.creador ? `<span>${escapeHtmlCal(e.creador)}</span>` : ''}
            </div>
            ${e.notas ? `<div style="font-size:0.75rem; color:var(--muted); margin-top:4px; font-style:italic;">${escapeHtmlCal(e.notas)}</div>` : ''}
          </div>
          <div class="cal-work-actions">
            <button type="button" class="cal-btn-action cal-btn-action-primary" onclick="registrarEstrenoEnMediary('${e.id}')" title="${isEn ? 'Log in Mediary' : 'Registrar en Mediary'}">
              <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
              <span>${isEn ? 'Log' : 'Registrar'}</span>
            </button>
            <button type="button" class="cal-btn-action cal-btn-action-danger" onclick="eliminarProximoEstreno('${e.id}')" title="${isEn ? 'Delete release' : 'Eliminar estreno'}">
              <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
            </button>
          </div>
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;
  }

  // 2. Registros guardados en este día
  if (regs.length > 0) {
    html += `
      <div style="margin-bottom:10px;">
        <div style="font-size:0.82rem; font-weight:700; color:var(--text); margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:var(--accent);"><path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
          <span>${isEn ? `Saved records (${regs.length})` : `Registros guardados (${regs.length})`}</span>
        </div>
        <div class="cal-cards-list">
    `;
    regs.forEach(r => {
      const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(r.categoria, r.subcategoria) : null;
      const nomCat = traducirCatCal(metaCol ? metaCol.nombre : (r.subcategoria || r.categoria));
      const bgCat = metaCol ? metaCol.bgVar : 'rgba(56,189,248,0.15)';
      const colCat = metaCol ? metaCol.colorVar : 'var(--accent)';
      const borCat = metaCol ? metaCol.borderVar : 'transparent';
      const posterSrc = r.poster || '';

      html += `
        <div class="cal-work-card">
          ${posterSrc ? `<img loading="lazy" decoding="async" class="cal-work-poster" src="${escapeHtmlCal(posterSrc)}" alt="${escapeHtmlCal(r.titulo)}" onerror="this.style.display='none'">` : `<div class="cal-work-poster-placeholder">🎬</div>`}
          <div class="cal-work-info">
            <div class="cal-work-title" title="${escapeHtmlCal(r.titulo)}">${escapeHtmlCal(r.titulo)}</div>
            <div class="cal-work-meta">
              <span class="cal-cat-badge" style="background:${bgCat}; color:${colCat}; border:1px solid ${borCat};">${nomCat}</span>
              ${r.calificacion && Number(r.calificacion) > 0 ? `<span style="color:#fbbf24; font-weight:700;">★ ${r.calificacion}</span>` : ''}
              ${r.creador ? `<span>${escapeHtmlCal(r.creador)}</span>` : ''}
            </div>
          </div>
          <div class="cal-work-actions">
            <button type="button" class="cal-btn-action" onclick="abrirFichaTecnica('${r.id}')" title="${isEn ? 'View details' : 'Ver ficha técnica'}">
              <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
              <span>${isEn ? 'View' : 'Ver'}</span>
            </button>
          </div>
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;
  }

  contentArea.innerHTML = html;
}
window.renderizarDetalleDiaSeleccionado = renderizarDetalleDiaSeleccionado;

function renderizarListaEstrenos() {
  const filterBox = document.getElementById('cal-estrenos-category-filters');
  const cardsBox = document.getElementById('cal-estrenos-cards-container');
  if (!cardsBox) return;

  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');
  const traducirCatCal = (nom) => {
    if (!isEn || !nom) return nom;
    const map = { 'Películas': 'Movies', 'Series': 'TV Shows', 'Música': 'Music', 'Juegos': 'Games', 'Lecturas': 'Readings', 'Libros': 'Books', 'Cómics': 'Comics', 'Mangas': 'Manga' };
    return map[nom] || nom;
  };
  const cats = [
    { id: 'todas', label: isEn ? 'All' : 'Todas' },
    { id: 'Peliculas', label: isEn ? 'Movies' : 'Películas' },
    { id: 'Series', label: isEn ? 'TV Shows' : 'Series' },
    { id: 'Musica', label: isEn ? 'Music' : 'Música' },
    { id: 'Juegos', label: isEn ? 'Games' : 'Juegos' },
    { id: 'Libros', label: isEn ? 'Books' : 'Libros' },
    { id: 'Comics', label: isEn ? 'Comics' : 'Cómics' },
    { id: 'Mangas', label: isEn ? 'Manga' : 'Mangas' }
  ];

  if (filterBox) {
    filterBox.innerHTML = cats.map(c => `
      <button type="button" class="cal-estreno-filter-btn ${calFiltroEstrenosCat === c.id ? 'active' : ''}" onclick="filtrarEstrenosCategoria('${c.id}')">${c.label}</button>
    `).join('');
  }

  let lista = Array.isArray(estado.proximosEstrenos) ? [...estado.proximosEstrenos] : [];

  if (calFiltroEstrenosCat !== 'todas') {
    lista = lista.filter(e => {
      const cat = String(e.categoria || '').toLowerCase();
      const target = calFiltroEstrenosCat.toLowerCase();
      if (target === 'lecturas') return cat.includes('lectura') || cat.includes('libro') || cat.includes('comic') || cat.includes('manga');
      return cat.includes(target) || target.includes(cat);
    });
  }

  if (calBusquedaEstrenos) {
    const q = calBusquedaEstrenos.toLowerCase().trim();
    lista = lista.filter(e =>
      (e.titulo && e.titulo.toLowerCase().includes(q)) ||
      (e.creador && e.creador.toLowerCase().includes(q)) ||
      (e.notas && e.notas.toLowerCase().includes(q))
    );
  }

  lista.sort((a, b) => {
    const ka = normalizarFechaAKeyYYYYMMDD(a.fechaEstreno) || '9999-99-99';
    const kb = normalizarFechaAKeyYYYYMMDD(b.fechaEstreno) || '9999-99-99';
    return ka.localeCompare(kb);
  });

  if (lista.length === 0) {
    cardsBox.innerHTML = `
      <div class="cal-empty-state" style="padding:40px 16px;">
        <p style="margin:0 0 12px 0; font-size:0.92rem;">${isEn ? 'No upcoming releases match this category or search.' : 'No hay próximos estrenos en esta categoría o búsqueda.'}</p>
        <button type="button" class="btn-agregar-estreno" onclick="abrirModalAgregarEstreno()">
          <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>${isEn ? '+ Add Upcoming Release' : '+ Añadir Próximo Estreno'}</span>
        </button>
      </div>
    `;
    return;
  }

  cardsBox.innerHTML = `
    <div class="cal-cards-list">
      ${lista.map(e => {
        const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(e.categoria, '') : null;
        const nomCat = traducirCatCal(metaCol ? metaCol.nombre : e.categoria);
        const bgCat = metaCol ? metaCol.bgVar : 'rgba(56,189,248,0.15)';
        const colCat = metaCol ? metaCol.colorVar : 'var(--accent)';
        const borCat = metaCol ? metaCol.borderVar : 'transparent';
        const countdown = calcularBadgeCountdownEstreno(e.fechaEstreno);
        const fechaHumana = formatearFechaEstrenoHumana(e.fechaEstreno);

        return `
          <div class="cal-work-card">
            ${e.poster ? `<img loading="lazy" decoding="async" class="cal-work-poster" src="${escapeHtmlCal(e.poster)}" alt="${escapeHtmlCal(e.titulo)}" onerror="this.style.display='none'">` : `<div class="cal-work-poster-placeholder">✦</div>`}
            <div class="cal-work-info">
              <div class="cal-work-title" title="${escapeHtmlCal(e.titulo)}">${escapeHtmlCal(e.titulo)}</div>
              <div class="cal-work-meta">
                <span class="cal-cat-badge" style="background:${bgCat}; color:${colCat}; border:1px solid ${borCat};">${nomCat}</span>
                <span class="cal-countdown-pill ${countdown.clase}">${countdown.texto}</span>
                <span style="display:inline-flex; align-items:center; gap:4px;">
                  <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;opacity:0.75;"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5"/></svg>
                  ${fechaHumana}
                </span>
                ${e.creador ? `<span>${escapeHtmlCal(e.creador)}</span>` : ''}
              </div>
              ${e.notas ? `<div style="font-size:0.75rem; color:var(--muted); margin-top:4px; font-style:italic;">${escapeHtmlCal(e.notas)}</div>` : ''}
            </div>
            <div class="cal-work-actions">
              <button type="button" class="cal-btn-action cal-btn-action-primary" onclick="registrarEstrenoEnMediary('${e.id}')" title="${isEn ? 'Log in Mediary' : 'Registrar en Mediary'}">
                <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
                <span>${isEn ? 'Log' : 'Registrar'}</span>
              </button>
              <button type="button" class="cal-btn-action cal-btn-action-danger" onclick="eliminarProximoEstreno('${e.id}')" title="${isEn ? 'Delete release' : 'Eliminar estreno'}">
                <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
window.renderizarListaEstrenos = renderizarListaEstrenos;

function filtrarEstrenosCategoria(cat) {
  calFiltroEstrenosCat = cat;
  renderizarListaEstrenos();
}
window.filtrarEstrenosCategoria = filtrarEstrenosCategoria;

function filtrarEstrenosLista(query) {
  calBusquedaEstrenos = query || '';
  renderizarListaEstrenos();
}
window.filtrarEstrenosLista = filtrarEstrenosLista;

function calcularBadgeCountdownEstreno(fechaStr) {
  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');
  if (!fechaStr) return { texto: isEn ? 'TBD' : 'Fecha por definir', clase: 'cal-countdown-future' };
  const keyHoy = obtenerFechaHoyKey();
  const keyEstreno = normalizarFechaAKeyYYYYMMDD(fechaStr);
  if (!keyEstreno) return { texto: fechaStr, clase: 'cal-countdown-future' };

  const [y1, m1, d1] = keyHoy.split('-').map(Number);
  const [y2, m2, d2] = keyEstreno.split('-').map(Number);
  const tHoy = new Date(y1, m1 - 1, d1).getTime();
  const tEstreno = new Date(y2, m2 - 1, d2).getTime();
  const diffDays = Math.round((tEstreno - tHoy) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return {
      texto: isEn
        ? (abs === 1 ? 'Released yesterday' : `Released ${abs} days ago`)
        : (abs === 1 ? 'Estrenado ayer' : `Estrenado hace ${abs} días`),
      clase: 'cal-countdown-past'
    };
  } else if (diffDays === 0) {
    return {
      texto: isEn ? 'Out today!' : '¡Se estrena hoy!',
      clase: 'cal-countdown-today'
    };
  } else if (diffDays === 1) {
    return {
      texto: isEn ? 'Out tomorrow!' : '¡Se estrena mañana!',
      clase: 'cal-countdown-soon'
    };
  } else if (diffDays <= 7) {
    return {
      texto: isEn ? `In ${diffDays} days` : `En ${diffDays} días`,
      clase: 'cal-countdown-soon'
    };
  } else if (diffDays <= 30) {
    return {
      texto: isEn ? `In ${diffDays} days` : `En ${diffDays} días`,
      clase: 'cal-countdown-future'
    };
  } else {
    const mesesAprox = Math.round(diffDays / 30.4);
    return {
      texto: isEn
        ? (mesesAprox === 1 ? 'In 1 month' : `In ~${mesesAprox} months (${diffDays} days)`)
        : (mesesAprox === 1 ? 'En 1 mes' : `En ~${mesesAprox} meses (${diffDays} días)`),
      clase: 'cal-countdown-future'
    };
  }
}

function formatearFechaEstrenoHumana(fechaStr) {
  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');
  const key = normalizarFechaAKeyYYYYMMDD(fechaStr);
  if (!key) return fechaStr || (isEn ? 'No date' : 'Sin fecha');
  const [y, m, d] = key.split('-').map(Number);
  const meses = isEn
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return isEn ? `${meses[m - 1]} ${d}, ${y}` : `${d} ${meses[m - 1]} ${y}`;
}

function abrirModalAgregarEstreno(fechaPrefill = null) {
  const form = document.getElementById('form-agregar-estreno');
  if (form) form.reset();
  const inpFecha = document.getElementById('estreno-input-fecha');
  if (inpFecha) {
    inpFecha.value = fechaPrefill || obtenerFechaHoyKey();
  }
  const modal = document.getElementById('modal-agregar-estreno');
  if (modal) modal.style.display = 'flex';
  const inpTit = document.getElementById('estreno-input-titulo');
  if (inpTit) setTimeout(() => inpTit.focus(), 80);
}
window.abrirModalAgregarEstreno = abrirModalAgregarEstreno;

function abrirModalAgregarEstrenoConFecha(diaKey) {
  abrirModalAgregarEstreno(diaKey);
}
window.abrirModalAgregarEstrenoConFecha = abrirModalAgregarEstrenoConFecha;

function cerrarModalAgregarEstreno() {
  const modal = document.getElementById('modal-agregar-estreno');
  if (modal) modal.style.display = 'none';
}
window.cerrarModalAgregarEstreno = cerrarModalAgregarEstreno;

function guardarEstrenoDesdeModal() {
  const titEl = document.getElementById('estreno-input-titulo');
  const catEl = document.getElementById('estreno-select-cat');
  const fecEl = document.getElementById('estreno-input-fecha');
  const creEl = document.getElementById('estreno-input-creador');
  const posEl = document.getElementById('estreno-input-poster');
  const notEl = document.getElementById('estreno-input-notas');

  const titulo = titEl ? titEl.value.trim() : '';
  const categoria = catEl ? catEl.value : 'Peliculas';
  const fechaEstreno = fecEl ? fecEl.value.trim() : '';
  const creador = creEl ? creEl.value.trim() : '';
  const poster = posEl ? posEl.value.trim() : '';
  const notas = notEl ? notEl.value.trim() : '';

  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');
  if (!titulo) {
    alert(isEn ? 'Please enter the title.' : 'Por favor ingresa el título de la obra.');
    return;
  }
  if (!fechaEstreno) {
    alert(isEn ? 'Please select a release date.' : 'Por favor selecciona la fecha de estreno.');
    return;
  }

  const nuevo = {
    id: 'estreno_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    titulo,
    categoria,
    fechaEstreno,
    creador,
    poster,
    notas,
    creadoEl: new Date().toISOString()
  };

  if (!Array.isArray(estado.proximosEstrenos)) estado.proximosEstrenos = [];
  estado.proximosEstrenos.push(nuevo);
  guardarProximosEstrenosStorage();
  cerrarModalAgregarEstreno();

  const keyAgregada = normalizarFechaAKeyYYYYMMDD(fechaEstreno);
  if (keyAgregada) {
    const [y, m] = keyAgregada.split('-').map(Number);
    calAnioActivo = y;
    calMesActivo = m - 1;
    calDiaSeleccionadoKey = keyAgregada;
    poblarSelectoresMesYAnio();
  }

  renderizarVistaCalendarioCompleta();
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  if (typeof mostrarToastPersonalizado === 'function') {
    mostrarToastPersonalizado(l === 'en' ? `Release "${titulo}" scheduled!` : `¡Estreno "${titulo}" agendado con éxito!`);
  }
}
window.guardarEstrenoDesdeModal = guardarEstrenoDesdeModal;

function eliminarProximoEstreno(id) {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const confirmMsg = l === 'en' ? 'Remove this upcoming release from your calendar?' : '¿Deseas eliminar este estreno de tu calendario?';
  if (!confirm(confirmMsg)) return;

  estado.proximosEstrenos = (estado.proximosEstrenos || []).filter(e => e.id !== id);
  guardarProximosEstrenosStorage();
  renderizarVistaCalendarioCompleta();
  if (typeof mostrarToastPersonalizado === 'function') {
    mostrarToastPersonalizado(l === 'en' ? 'Release removed' : 'Estreno eliminado');
  }
}
window.eliminarProximoEstreno = eliminarProximoEstreno;

function registrarEstrenoEnMediary(id) {
  const estreno = (estado.proximosEstrenos || []).find(e => e.id === id);
  if (!estreno) return;

  let destCat = 'Peliculas';
  let destSub = 'Películas';

  const c = String(estreno.categoria || '').toLowerCase();
  if (c.includes('peli') || c.includes('movie')) {
    destCat = 'Peliculas';
    destSub = 'Películas';
  } else if (c.includes('serie') || c.includes('show')) {
    destCat = 'Series';
    destSub = 'Temporadas';
  } else if (c.includes('music') || c.includes('musica')) {
    destCat = 'Musica';
    destSub = 'Discos';
  } else if (c.includes('juego') || c.includes('game')) {
    destCat = 'Juegos';
    destSub = 'Juegos';
  } else if (c.includes('comic')) {
    destCat = 'Lecturas';
    destSub = 'Cómics';
  } else if (c.includes('manga')) {
    destCat = 'Lecturas';
    destSub = 'Mangas';
  } else if (c.includes('libro') || c.includes('lectura')) {
    destCat = 'Lecturas';
    destSub = 'Libros';
  }

  cambiarCat(destCat, destSub);

  setTimeout(() => {
    if (typeof seleccionarItem === 'function') {
      seleccionarItem({
        tituloOriginal: estreno.titulo,
        tituloIngles: '',
        creador: estreno.creador || 'Desconocido',
        anio: estreno.fechaEstreno ? estreno.fechaEstreno.slice(0, 4) : '',
        sinopsis: estreno.notas || '',
        poster: estreno.poster || ''
      });
      if (typeof establecerFechaHoy === 'function') {
        establecerFechaHoy();
      }
    }
  }, 160);

  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  if (typeof mostrarToastPersonalizado === 'function') {
    mostrarToastPersonalizado(l === 'en' ? `Opening registration for "${estreno.titulo}"...` : `Abriendo registro para "${estreno.titulo}"...`);
  }
}
window.registrarEstrenoEnMediary = registrarEstrenoEnMediary;

