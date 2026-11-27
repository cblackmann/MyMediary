/* Mediary — js/features/catalog.js */

// [Unificado] obtenerFechaHoyStr() se encuentra disponible globalmente
let regPrecisionInicio = 'dia';
let regPrecisionFin = 'dia';
let regPrecisionActual = 'dia';

// --- CALENDARIO INTERACTIVO MEDIARY ---
let calSeccionActiva = 'inicio'; // 'inicio' | 'fin'
let calModoActivo = 'dia'; // 'dia' | 'mes' | 'anio'
let calAnioVisual = new Date().getFullYear();
let calMesVisual = new Date().getMonth(); // 0-11
let calDiaVisual = new Date().getDate();

const ICONS_CAL_MODO = {
  dia: `<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5"/></svg>`,
  mes: `<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5M8.25 12h1.5m3 0h1.5m3 0h1.5m-9 3.75h1.5m3 0h1.5m3 0h1.5"/></svg>`,
  anio: `<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`
};

function abrirCalendarioMediary(seccion = 'inicio') {
  calSeccionActiva = seccion;
  const chkNo = document.getElementById(seccion === 'inicio' ? 'chk-no-fecha' : 'chk-no-fecha-fin');
  if (chkNo && chkNo.checked) return;

  const inp = document.getElementById(`input-fecha-${seccion}`);
  const valActual = (inp?.value || '').trim();
  const hoy = new Date();

  // Deducir modo y fecha visual a partir del valor actual
  const mesesEsList = (typeof NOMBRES_MESES_ES !== 'undefined') ? NOMBRES_MESES_ES : ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const mesesEnList = (typeof NOMBRES_MESES_EN !== 'undefined') ? NOMBRES_MESES_EN : ['January','February','March','April','May','June','July','August','September','October','November','December'];

  if (!valActual || valActual === 'Sin fecha' || esEnProgresoTexto(valActual)) {
    calAnioVisual = hoy.getFullYear();
    calMesVisual = hoy.getMonth();
    calDiaVisual = hoy.getDate();
    calModoActivo = 'dia';
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valActual)) {
    const parts = valActual.split('/');
    calDiaVisual = parseInt(parts[0], 10) || hoy.getDate();
    calMesVisual = (parseInt(parts[1], 10) - 1);
    if (isNaN(calMesVisual) || calMesVisual < 0 || calMesVisual > 11) calMesVisual = hoy.getMonth();
    calAnioVisual = parseInt(parts[2], 10) || hoy.getFullYear();
    calModoActivo = 'dia';
  } else if (/^\d{4}$/.test(valActual)) {
    calAnioVisual = parseInt(valActual, 10) || hoy.getFullYear();
    calModoActivo = 'anio';
  } else {
    // Posible "Mes YYYY"
    const mAnio = valActual.match(/\b(20\d{2}|19\d{2})\b/);
    if (mAnio) calAnioVisual = parseInt(mAnio[1], 10);
    const lLower = valActual.toLowerCase();
    let mesDetectado = -1;
    for (let i = 0; i < 12; i++) {
      if (lLower.includes(mesesEsList[i].toLowerCase()) || lLower.includes(mesesEnList[i].toLowerCase())) {
        mesDetectado = i;
        break;
      }
    }
    calMesVisual = mesDetectado !== -1 ? mesDetectado : hoy.getMonth();
    calModoActivo = 'mes';
  }

  actualizarBotonModoCalendario();
  cerrarMenuModoCalendario();
  renderizarCalendarioMediary();

  const modal = document.getElementById('modal-calendario-mediary');
  if (modal) modal.style.display = 'flex';
}
window.abrirCalendarioMediary = abrirCalendarioMediary;

function cerrarCalendarioMediary() {
  const modal = document.getElementById('modal-calendario-mediary');
  if (modal) modal.style.display = 'none';
  cerrarMenuModoCalendario();
}
window.cerrarCalendarioMediary = cerrarCalendarioMediary;

function abrirMenuModoCalendario(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  actualizarBotonModoCalendario();
  const pop = document.getElementById('cal-mode-popup-overlay');
  if (pop) pop.style.display = 'flex';
}
window.abrirMenuModoCalendario = abrirMenuModoCalendario;
window.toggleMenuModoCalendario = abrirMenuModoCalendario;

function cerrarMenuModoCalendario(e) {
  if (e) e.stopPropagation();
  const pop = document.getElementById('cal-mode-popup-overlay');
  if (pop) pop.style.display = 'none';
}
window.cerrarMenuModoCalendario = cerrarMenuModoCalendario;
window.ocultarDropdownModoCalendario = cerrarMenuModoCalendario;

function actualizarBotonModoCalendario() {
  const txt = document.getElementById('txt-cal-mode');
  const ico = document.getElementById('ico-cal-mode');
  const l = (typeof userPrefs !== 'undefined' && userPrefs.lang === 'en') ? 'en' : 'es';

  if (ico) {
    ico.innerHTML = ICONS_CAL_MODO[calModoActivo] || ICONS_CAL_MODO.dia;
  }

  if (calModoActivo === 'dia') {
    if (txt) txt.textContent = l === 'en' ? 'Date' : 'Fecha';
  } else if (calModoActivo === 'mes') {
    if (txt) txt.textContent = l === 'en' ? 'Month' : 'Mes';
  } else if (calModoActivo === 'anio') {
    if (txt) txt.textContent = l === 'en' ? 'Year' : 'Año';
  }

  ['dia', 'mes', 'anio'].forEach(m => {
    const opt = document.getElementById(`opt-mode-${m}`);
    if (opt) opt.classList.toggle('active', calModoActivo === m);
  });
}

function seleccionarModoCalendario(modo, e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  calModoActivo = modo;
  actualizarBotonModoCalendario();
  cerrarMenuModoCalendario();
  renderizarCalendarioMediary();
}
window.seleccionarModoCalendario = seleccionarModoCalendario;

function navegarCalendario(dir) {
  if (calModoActivo === 'dia') {
    calMesVisual += dir;
    if (calMesVisual < 0) {
      calMesVisual = 11;
      calAnioVisual--;
    } else if (calMesVisual > 11) {
      calMesVisual = 0;
      calAnioVisual++;
    }
  } else if (calModoActivo === 'mes') {
    calAnioVisual += dir;
  } else if (calModoActivo === 'anio') {
    calAnioVisual += (dir * 12);
  }
  renderizarCalendarioMediary();
}
window.navegarCalendario = navegarCalendario;

function getMesesCalendario() {
  const l = (typeof userPrefs !== 'undefined' && userPrefs.lang === 'en') ? 'en' : 'es';
  if (l === 'en') {
    return (typeof NOMBRES_MESES_EN !== 'undefined' && Array.isArray(NOMBRES_MESES_EN))
      ? NOMBRES_MESES_EN
      : ['January','February','March','April','May','June','July','August','September','October','November','December'];
  }
  return (typeof NOMBRES_MESES_ES !== 'undefined' && Array.isArray(NOMBRES_MESES_ES))
    ? NOMBRES_MESES_ES
    : ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
}

function renderizarCalendarioMediary() {
  const l = (typeof userPrefs !== 'undefined' && userPrefs.lang === 'en') ? 'en' : 'es';
  const meses = getMesesCalendario();
  const hoy = new Date();
  const hoyDia = hoy.getDate(), hoyMes = hoy.getMonth(), hoyAnio = hoy.getFullYear();

  const titleEl = document.getElementById('cal-nav-title');
  const viewDia = document.getElementById('cal-view-dia');
  const viewMes = document.getElementById('cal-view-mes');
  const viewAnio = document.getElementById('cal-view-anio');

  if (viewDia) viewDia.style.display = (calModoActivo === 'dia') ? 'block' : 'none';
  if (viewMes) viewMes.style.display = (calModoActivo === 'mes') ? 'block' : 'none';
  if (viewAnio) viewAnio.style.display = (calModoActivo === 'anio') ? 'block' : 'none';

  const inpVal = (document.getElementById(`input-fecha-${calSeccionActiva}`)?.value || '').trim();

  if (calModoActivo === 'dia') {
    if (titleEl) titleEl.textContent = `${meses[calMesVisual]} ${calAnioVisual}`;

    const wkRow = document.getElementById('cal-weekdays-row');
    if (wkRow) {
      const diasSemana = (l === 'en') ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] : ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
      wkRow.innerHTML = diasSemana.map(d => `<div>${d}</div>`).join('');
    }

    const daysGrid = document.getElementById('cal-days-grid');
    if (daysGrid) {
      daysGrid.innerHTML = '';
      let primerDiaSemana = new Date(calAnioVisual, calMesVisual, 1).getDay();
      primerDiaSemana = (primerDiaSemana === 0) ? 6 : primerDiaSemana - 1;

      const totalDiasMes = new Date(calAnioVisual, calMesVisual + 1, 0).getDate();

      for (let b = 0; b < primerDiaSemana; b++) {
        const blank = document.createElement('div');
        blank.className = 'cal-day-cell is-empty';
        daysGrid.appendChild(blank);
      }

      for (let d = 1; d <= totalDiasMes; d++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cal-day-cell';
        cell.textContent = d;

        const isToday = (calAnioVisual === hoyAnio && calMesVisual === hoyMes && d === hoyDia);
        if (isToday) cell.classList.add('is-today');

        const dStr = `${String(d).padStart(2, '0')}/${String(calMesVisual + 1).padStart(2, '0')}/${calAnioVisual}`;
        if (inpVal === dStr) {
          cell.classList.add('is-selected');
        }

        cell.onclick = (e) => {
          if (e) e.stopPropagation();
          seleccionarDiaCalendario(d);
        };
        daysGrid.appendChild(cell);
      }
    }
  } else if (calModoActivo === 'mes') {
    if (titleEl) titleEl.textContent = `${calAnioVisual}`;

    const mesesGrid = document.getElementById('cal-months-grid');
    if (mesesGrid) {
      mesesGrid.innerHTML = '';
      const mesesAbrev = (l === 'en')
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      for (let m = 0; m < 12; m++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cal-month-cell';
        btn.textContent = mesesAbrev[m];

        const isCurrent = (calAnioVisual === hoyAnio && m === hoyMes);
        if (isCurrent) btn.classList.add('is-current');

        const valMesFull = `${meses[m]} ${calAnioVisual}`;
        if (inpVal.toLowerCase() === valMesFull.toLowerCase()) {
          btn.classList.add('is-selected');
        }

        btn.onclick = (e) => {
          if (e) e.stopPropagation();
          seleccionarMesCalendario(m);
        };
        mesesGrid.appendChild(btn);
      }
    }
  } else if (calModoActivo === 'anio') {
    const baseYear = Math.floor(calAnioVisual / 12) * 12;
    if (titleEl) titleEl.textContent = `${baseYear} - ${baseYear + 11}`;

    const yearsGrid = document.getElementById('cal-years-grid');
    if (yearsGrid) {
      yearsGrid.innerHTML = '';
      for (let y = baseYear; y < baseYear + 12; y++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cal-year-cell';
        btn.textContent = y;

        if (y === hoyAnio) btn.classList.add('is-current');
        if (inpVal === String(y)) btn.classList.add('is-selected');

        btn.onclick = (e) => {
          if (e) e.stopPropagation();
          seleccionarAnioCalendario(y);
        };
        yearsGrid.appendChild(btn);
      }
    }
  }
}
window.renderizarCalendarioMediary = renderizarCalendarioMediary;

function seleccionarDiaCalendario(dia) {
  const dStr = `${String(dia).padStart(2, '0')}/${String(calMesVisual + 1).padStart(2, '0')}/${calAnioVisual}`;
  aplicarFechaCalendario(calSeccionActiva, dStr);
}
window.seleccionarDiaCalendario = seleccionarDiaCalendario;

function seleccionarMesCalendario(mesIdx) {
  const meses = getMesesCalendario();
  const mStr = `${meses[mesIdx]} ${calAnioVisual}`;
  aplicarFechaCalendario(calSeccionActiva, mStr);
}
window.seleccionarMesCalendario = seleccionarMesCalendario;

function seleccionarAnioCalendario(anio) {
  aplicarFechaCalendario(calSeccionActiva, String(anio));
}
window.seleccionarAnioCalendario = seleccionarAnioCalendario;

function seleccionarHoyCalendario(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const hoy = new Date();
  const meses = getMesesCalendario();

  let valorFinal = '';
  if (calModoActivo === 'dia') {
    valorFinal = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  } else if (calModoActivo === 'mes') {
    valorFinal = `${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;
  } else if (calModoActivo === 'anio') {
    valorFinal = String(hoy.getFullYear());
  } else {
    valorFinal = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  }

  aplicarFechaCalendario(calSeccionActiva, valorFinal);
}
window.seleccionarHoyCalendario = seleccionarHoyCalendario;

function aplicarFechaCalendario(seccion, valor) {
  const inp = document.getElementById(`input-fecha-${seccion}`);
  if (inp) inp.value = valor;

  const txt = document.getElementById(`txt-fecha-${seccion}`);
  if (txt) {
    txt.removeAttribute('data-i18n');
    txt.textContent = valor;
    txt.classList.remove('is-placeholder');
  }

  if (seccion === 'inicio') {
    const chkNo = document.getElementById('chk-no-fecha');
    if (chkNo && chkNo.checked) {
      chkNo.checked = false;
    }
    const btn = document.getElementById('btn-trigger-fecha-inicio');
    if (btn) btn.classList.remove('disabled');
  } else {
    const chkNo = document.getElementById('chk-no-fecha-fin');
    if (chkNo && chkNo.checked) {
      chkNo.checked = false;
    }
    const btn = document.getElementById('btn-trigger-fecha-fin');
    if (btn) btn.classList.remove('disabled');

    const chkProg = document.getElementById('chk-en-progreso');
    if (chkProg && chkProg.checked) {
      chkProg.checked = false;
    }
  }

  cerrarCalendarioMediary();
}
window.aplicarFechaCalendario = aplicarFechaCalendario;

function limpiarFechaCalendario(seccion) {
  const inp = document.getElementById(`input-fecha-${seccion}`);
  if (inp) inp.value = '';

  const txt = document.getElementById(`txt-fecha-${seccion}`);
  if (txt) {
    txt.setAttribute('data-i18n', 'ph_select_date');
    const l = (typeof userPrefs !== 'undefined' && userPrefs.lang === 'en') ? 'en' : 'es';
    txt.textContent = l === 'en' ? 'Select date...' : 'Seleccionar fecha...';
    txt.classList.add('is-placeholder');
  }
}
window.limpiarFechaCalendario = limpiarFechaCalendario;

function establecerFechaHoyInicio(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const hoy = new Date();
  const dStr = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  aplicarFechaCalendario('inicio', dStr);
}
window.establecerFechaHoyInicio = establecerFechaHoyInicio;

function establecerFechaHoyFin(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const hoy = new Date();
  const dStr = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  aplicarFechaCalendario('fin', dStr);
}
window.establecerFechaHoyFin = establecerFechaHoyFin;

function establecerFechaHoy() {
  establecerFechaHoyInicio();
  const rango = subTieneRango(estado.categoria, estado.subcategoria);
  if (rango) establecerFechaHoyFin();
}
window.establecerFechaHoy = establecerFechaHoy;

function toggleRewatchFormulario() {
  const chk = document.getElementById('chk-es-rewatch');
  if (!chk) return;
  chk.checked = !chk.checked;
  document.querySelectorAll('.btn-rewatch-toggle').forEach(btn => {
    btn.classList.toggle('active', chk.checked);
  });
}
window.toggleRewatchFormulario = toggleRewatchFormulario;
function manejarEnterComentario(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guardarNuevoElemento(); }
}
function configurarFormularioFechas() {
  const rango = subTieneRango(estado.categoria, estado.subcategoria);
  const colFin = document.getElementById('col-fecha-fin');
  if (colFin) {
    colFin.style.display = rango ? 'block' : 'none';
  }
  const lblIni = document.getElementById('lbl-fecha-ini');
  if (lblIni) lblIni.textContent = rango ? (t('lbl_fecha_ini') || 'Fecha de inicio:') : (t('lbl_fecha_vis') || 'Fecha:');
  const lblFin = document.getElementById('lbl-fecha-fin');
  if (lblFin) lblFin.textContent = t('lbl_fecha_fin') || 'Fecha de término:';
}
function sanitizarRegistroFechasFrontend(r) {
  let fI = sanitizarFechaFrontend(r.fechaInicio || r.fecha_inicio);
  let fF = sanitizarFechaFrontend(r.fechaFin || r.fecha_fin);
  const cat = r.categoria || '';
  const sub = r.subcategoria || '';
  const tieneRango = subTieneRango(cat, sub);
  if (!tieneRango) {
    let fUnica = 'Sin fecha';
    if (fI && fI !== 'Sin fecha' && !esEnProgresoTexto(fI)) fUnica = fI;
    else if (fF && fF !== 'Sin fecha' && !esEnProgresoTexto(fF)) fUnica = fF;
    fI = fUnica;
    fF = fUnica;
  } else {
    const fFinLower = String(fF || '').trim().toLowerCase();
    const fIniLower = String(fI || '').trim().toLowerCase();
    const esSinFechaFin = (!fF || fFinLower === 'sin fecha' || fFinLower === '');
    const fIniValida = (fI && fIniLower !== 'sin fecha');
    const tieneProgTexto = esEnProgresoTexto(r.fechaFin || r.fecha_fin || fF);
    if ((esSinFechaFin && fIniValida) || tieneProgTexto) {
      fF = obtenerTextoEnProgreso(cat, sub) || 'Aún viendo';
    }
  }
  return { ...r, fechaInicio: fI, fechaFin: fF, poster: optimizarUrlPoster(r.poster || '', 'thumb') };
}
function cargarRegistros() { if (!estado.registros?.length && estado.userEmail) { try { const c = localStorage.getItem('mediary_cache_regs_' + estado.userEmail.toLowerCase()) || localStorage.getItem('mymediary_cache_regs_' + estado.userEmail.toLowerCase()); if (c) { estado.registros = JSON.parse(c).map(sanitizarRegistroFechasFrontend); if (estado.categoria === 'inicio') { renderizarResumenInicio(); renderizarFeedAmigosResumidoInicio(); renderizarDiscoverVista(); } else if (estado.categoria === 'listas') renderizarStats(); else if (estado.categoria === 'calendario' && typeof renderizarVistaCalendarioCompleta === 'function') renderizarVistaCalendarioCompleta(); } } catch(e) {} } google.script.run.withSuccessHandler(d => { estado.registros = (d || []).map(sanitizarRegistroFechasFrontend); if (estado.userEmail) { try { localStorage.setItem('mediary_cache_regs_' + estado.userEmail.toLowerCase(), JSON.stringify(estado.registros)); } catch(e) {} }
if (estado.categoria === 'inicio') { renderizarResumenInicio(); renderizarFeedAmigosResumidoInicio(); renderizarDiscoverVista(); } else if (estado.categoria === 'listas') renderizarStats(); else if (estado.categoria === 'discover') renderizarDiscoverVista(); else if (estado.categoria === 'calendario' && typeof renderizarVistaCalendarioCompleta === 'function') renderizarVistaCalendarioCompleta(); else if (estado.categoria === 'perfil') { renderizarFavoritosPerfil(); calcularYMostrarEstadisticasPerfil(); }
else { if (esSubcategoriaWatchlist(estado.subcategoria)) renderizarWatchlist(); else filtrarYMostrarHistorial(); }
}).obtenerRegistros(estado.userEmail); }
function cargarWatchlist() { if (!estado.watchlist?.length && estado.userEmail) { try { const c = localStorage.getItem('mediary_cache_wl_' + estado.userEmail.toLowerCase()) || localStorage.getItem('mymediary_cache_wl_' + estado.userEmail.toLowerCase()); if (c) estado.watchlist = JSON.parse(c); } catch(e) {} } google.script.run.withSuccessHandler(w => { estado.watchlist = (w || []).map(it => ({ ...it, poster: optimizarUrlPoster(it.poster || '', 'thumb') })); if (estado.userEmail) { try { localStorage.setItem('mediary_cache_wl_' + estado.userEmail.toLowerCase(), JSON.stringify(estado.watchlist)); } catch(e) {} } if (CONFIG[estado.categoria]) renderizarSubtabs(); if (esSubcategoriaWatchlist(estado.subcategoria)) renderizarWatchlist(); if (estado.categoria === 'watchlists') renderizarVistaWatchlistsDedicada(); const modalR = document.getElementById('modal-ruleta-amigo'); if (modalR && modalR.style.display === 'flex' && typeof actualizarVistaCandidatasRuleta === 'function') { actualizarVistaCandidatasRuleta(); } }).obtenerWatchlist(estado.userEmail); }
// --- AGREGADO RÁPIDO (+) EN MÓVIL ---
function abrirModalAgregadoRapido() { if (typeof renderizarOpcionesAgregadoRapido === 'function') renderizarOpcionesAgregadoRapido(); document.getElementById('modal-agregado-rapido').style.display = 'flex'; }
function cerrarModalAgregadoRapido() { document.getElementById('modal-agregado-rapido').style.display = 'none'; }
function ejecutarAgregadoRapido(cat, sub) { cerrarModalAgregadoRapido(); cambiarCat(cat, sub); setTimeout(() => { const inp = document.getElementById('input-search'); if (inp) { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}, 250); }
function ejecutarAgregadoRapidoWatchlists(cat = null) {
  const catPrevia = cat || (CONFIG[estado.categoria] ? estado.categoria : null);
  cerrarModalAgregadoRapido();
  abrirMenuWatchlistGlobal();
  if (catPrevia && typeof seleccionarCategoriaWl === 'function') {
    seleccionarCategoriaWl(catPrevia);
  }
  setTimeout(() => {
    const inp = document.getElementById('input-search-wl');
    if (inp) {
      inp.focus();
      inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 250);
}
window.ejecutarAgregadoRapidoWatchlists = ejecutarAgregadoRapidoWatchlists;
// --- ACCESO A WATCHLISTS DEDICADAS DESDE MÓVIL Y WEB ---
function abrirMenuWatchlistGlobal(pushNav = true, catInicial = null, subInicial = null) {
  if (pushNav) registrarNavegacionApp('watchlists');
  guardarEstadoNavegacionActual('watchlists', '');
  resetearBuscadoresYFormularios();
  const catPrevia = estado.categoria;
  if (catPrevia === 'listas') {
    estado.vistaPreviaWatchlists = 'listas';
  } else if (CONFIG[catPrevia] && catPrevia !== 'watchlists' && catPrevia !== 'inicio') {
    estado.vistaPreviaWatchlists = 'categoria';
    estado.categoriaPreviaWatchlist = catPrevia;
  } else if (catPrevia !== 'watchlists') {
    estado.vistaPreviaWatchlists = 'inicio';
  }
  estado.categoria = 'watchlists';
  estado.subcategoria = '';

  const catTarget = catInicial || (estado.vistaPreviaWatchlists === 'categoria' ? estado.categoriaPreviaWatchlist : 'Peliculas');
  if (catTarget && WATCHLIST_ESTRUCTURA.some(x => x.cat === catTarget)) {
    estado.wlCategoria = catTarget;
    const cfg = WATCHLIST_ESTRUCTURA.find(x => x.cat === catTarget);
    if (subInicial && cfg?.subs.some(s => s.id === subInicial)) {
      estado.wlSubcategoria = subInicial;
    } else {
      estado.wlSubcategoria = cfg?.subs[0]?.id || 'Películas';
    }
  } else {
    estado.wlCategoria = 'Peliculas';
    estado.wlSubcategoria = 'Películas';
  }
  actualizarBarraNavegacionMovil(null);
  actualizarNavWebActiva();
  if (typeof actualizarVisibilidadMenuInferior === 'function') {
    actualizarVisibilidadMenuInferior(false);
  }
  document.getElementById('vista-inicio').style.display = 'none';
  document.getElementById('vista-categoria').style.display = 'none';
  document.getElementById('vista-discover').style.display = 'none';
  const vPerf = document.getElementById('vista-perfil'); if (vPerf) vPerf.style.display = 'none';
  const vAm = document.getElementById('vista-amigos'); if (vAm) vAm.style.display = 'none';
  const vList = document.getElementById('vista-listas-extendida'); if (vList) vList.style.display = 'none';
  const vCal = document.getElementById('vista-calendario'); if (vCal) vCal.style.display = 'none';
  const vAmPerf = document.getElementById('vista-perfil-amigo'); if (vAmPerf) vAmPerf.style.display = 'none';
  const vAmRegs = document.getElementById('vista-registros-amigo'); if (vAmRegs) vAmRegs.style.display = 'none';
  const vWl = document.getElementById('vista-watchlists');
  if (vWl) {
    vWl.style.display = 'block';
    if (typeof animarEntradaSubtab === 'function') animarEntradaSubtab(vWl);
  }
  renderizarVistaWatchlistsDedicada();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function volverDesdeWatchlists() {
  if (window.history && window.history.length > 1 && typeof appNavHistory !== 'undefined' && appNavHistory.length > 1) {
    history.back();
    return;
  }
  const vWl = document.getElementById('vista-watchlists');
  const destino = estado.vistaPreviaWatchlists || 'inicio';
  let elDestino = document.getElementById('vista-inicio');
  if (destino === 'listas') {
    elDestino = document.getElementById('vista-listas-extendida');
  } else if (destino === 'categoria') {
    elDestino = document.getElementById('vista-categoria');
  }

  const fnVolver = () => {
    if (typeof actualizarVisibilidadMenuInferior === 'function') {
      actualizarVisibilidadMenuInferior(destino === 'inicio');
    }
    if (destino === 'listas') {
      if (typeof abrirVistaDashboardListas === 'function') abrirVistaDashboardListas(false);
      if (typeof actualizarBarraNavegacionMovil === 'function') actualizarBarraNavegacionMovil('m-btn-listas-ext');
    } else if (destino === 'categoria') {
      const catAtras = estado.categoriaPreviaWatchlist || 'Peliculas';
      if (typeof cambiarCat === 'function') cambiarCat(catAtras, null, false);
      if (typeof actualizarBarraNavegacionMovil === 'function') actualizarBarraNavegacionMovil(null);
    } else {
      if (typeof irInicio === 'function') irInicio(false);
      if (typeof actualizarBarraNavegacionMovil === 'function') actualizarBarraNavegacionMovil('m-btn-inicio');
    }
  };

  if (typeof animarSalidaVistaAtras === 'function' && vWl && elDestino) {
    animarSalidaVistaAtras(vWl, fnVolver, elDestino);
  } else {
    fnVolver();
  }
}
window.volverDesdeWatchlists = volverDesdeWatchlists;
function abrirMenuWatchlistMovil() { actualizarBarraNavegacionMovil(null); abrirMenuWatchlistGlobal(); }

function seleccionarCategoriaWl(cat) {
  estado.wlCategoria = cat;
  const cfg = WATCHLIST_ESTRUCTURA.find(x => x.cat === cat);
  estado.wlSubcategoria = cfg?.subs[0]?.id || 'Películas';
  const inSearch = document.getElementById('input-search-wl');
  if (inSearch) inSearch.value = '';
  const resBox = document.getElementById('search-results-wl');
  if (resBox) { resBox.innerHTML = ''; resBox.style.display = 'none'; }
  renderizarVistaWatchlistsDedicada();
  if (typeof animarEntradaSubtab === 'function') {
    animarEntradaSubtab(document.getElementById('grid-watchlist-dedicada'));
  }
}

function seleccionarSubcategoriaWl(subId) {
  estado.wlSubcategoria = subId;
  const inSearch = document.getElementById('input-search-wl');
  if (inSearch) inSearch.value = '';
  const resBox = document.getElementById('search-results-wl');
  if (resBox) { resBox.innerHTML = ''; resBox.style.display = 'none'; }
  renderizarVistaWatchlistsDedicada();
  if (typeof animarEntradaSubtab === 'function') {
    animarEntradaSubtab(document.getElementById('grid-watchlist-dedicada'));
  }
}

function renderizarVistaWatchlistsDedicada() {
  const catBar = document.getElementById('wl-categorias-bar');
  const subBar = document.getElementById('wl-subtabs-bar');
  const grid = document.getElementById('grid-watchlist-dedicada');
  const titEl = document.getElementById('titulo-wl-dedicada');
  const inSearch = document.getElementById('input-search-wl');
  if (!catBar || !subBar || !grid) return;

  const l = userPrefs.lang || 'es';
  const catActual = estado.wlCategoria || 'Peliculas';
  const subActualId = estado.wlSubcategoria || 'Películas';

  // 1. Renderizar Barra de Categorías (ordenadas similar al índice, cuadradas, solo icono, con scroll horizontal)
  catBar.innerHTML = '';
  const ordenCats = (typeof obtenerCategoriasOrdenadas === 'function')
    ? obtenerCategoriasOrdenadas(true)
    : ['Peliculas', 'Series', 'Musica', 'Juegos', 'Lecturas'];

  const listaCats = [...WATCHLIST_ESTRUCTURA].sort((a, b) => {
    const idxA = ordenCats.indexOf(a.cat);
    const idxB = ordenCats.indexOf(b.cat);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  listaCats.forEach(c => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const catKey = c.cat.toLowerCase();
    btn.className = `wl-cat-pill wl-pill-${catKey} ${c.cat === catActual ? 'active' : ''}`;
    btn.dataset.cat = c.cat;
    const catNom = I18N[l]?.cats?.[c.cat] || c.nombre;
    btn.title = catNom;
    btn.setAttribute('aria-label', catNom);
    btn.innerHTML = `<span class="emoji-dyn">${c.emoji}</span>`;
    btn.onclick = () => seleccionarCategoriaWl(c.cat);
    catBar.appendChild(btn);
  });

  // 2. Renderizar Subpestañas de la Categoría Activa (debajo de las categorías, sin su icono, solo el título)
  subBar.innerHTML = '';
  const cfgCat = WATCHLIST_ESTRUCTURA.find(x => x.cat === catActual) || WATCHLIST_ESTRUCTURA[0];
  let subObjActual = cfgCat.subs.find(s => s.id === subActualId);
  if (!subObjActual) {
    subObjActual = cfgCat.subs[0];
    estado.wlSubcategoria = subObjActual.id;
  }

  cfgCat.subs.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const metaSub = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(catActual, s.id) : null;
    const subColClass = metaSub ? `subtab-cat-${metaSub.key}` : '';
    btn.className = `subtab-btn ${s.id === estado.wlSubcategoria ? 'active' : ''} ${subColClass}`;
    const nomSub = I18N[l]?.subs?.[s.id] || s.nombre;
    btn.innerHTML = `<span>${nomSub}</span>`;
    btn.onclick = () => seleccionarSubcategoriaWl(s.id);
    subBar.appendChild(btn);
  });

  // 3. Actualizar Placeholder del buscador
  const nomSub = I18N[l]?.subs?.[subObjActual.id] || subObjActual.nombre;
  if (inSearch) {
    const esArt = String(subObjActual.id).toLowerCase().includes('artista');
    if (userPrefs.lang === 'en') {
      inSearch.placeholder = esArt
        ? 'Search artist or band to add to To Listen...'
        : `Search and add to Watchlist: ${nomSub}...`;
    } else {
      inSearch.placeholder = esArt
        ? 'Buscar artista o grupo para agregar a To Listen...'
        : `Buscar título para agregar a Watchlist de ${nomSub}...`;
    }
  }

  // 4. Renderizar Items de la subcategoría seleccionada
  const items = obtenerItemsWatchlistActuales();
  if (titEl) {
    titEl.innerHTML = `<span class="emoji-dyn">${subObjActual.emoji}</span> Watchlist: ${nomSub} (${items.length})`;
  }

  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:36px 20px; color:var(--muted); background:var(--card); border-radius:2px; border:1px solid var(--border); line-height:1.6;">${l === 'en' ? `No pending items in <strong>Watchlist: ${nomSub}</strong>.<br><span style="font-size:0.85rem;">Use the search bar above to add one to this list or explore Discover!</span>` : `No tienes elementos pendientes en <strong>Watchlist: ${nomSub}</strong>.<br><span style="font-size:0.85rem;">¡Usa el buscador de arriba para agregar uno a esta lista o explora Discover!</span>`}</div>`;
    aplicarEstilosGlobales();
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach(it => {
    const card = document.createElement('div');
    card.className = 'watchlist-card';
    const catLblWl = it.categoria ? ((typeof traducirNombreCat === 'function') ? traducirNombreCat(it.categoria) : it.categoria) : '';
    const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(it.categoria, it.subcategoria) : null;
    const catColorVar = metaCol ? `var(--cat-color-${metaCol.key})` : 'var(--accent)';
    card.innerHTML = `
      <img class="watchlist-poster" loading="lazy" src="${it.poster||'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'170\' height=\'255\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>'}" onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'170\\' height=\\'255\\' fill=\\'%23334155\\'><rect width=\\'100%\\' height=\\'100%\\'/></svg>'" onclick="abrirFichaTecnica('${it.id}')" title="${tLang('Ver ficha técnica', 'View details')}">
      <div class="watchlist-body">
        <div>
          <div class="watchlist-item-title" onclick="abrirFichaTecnica('${it.id}')" style="cursor:pointer;">${it.titulo}</div>
          <div class="watchlist-item-meta">${catLblWl ? `<span style="color:${catColorVar};font-weight:700;">${catLblWl}</span> · ` : ''}${it.creador} ${it.anio ? '(' + it.anio + ')' : ''}</div>
          ${obtenerBadgeAmigoActividad(it.titulo, it.categoria)}
        </div>
        <div class="watchlist-actions">
          <button type="button" class="btn-wl-play" onclick="consumirDesdeWatchlist('${it.id}')">${l === 'en' ? '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg> Log' : '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg> Registrar'}</button>
          <button type="button" class="btn-wl-del" title="${l === 'en' ? 'Remove from list' : 'Eliminar de lista'}" onclick="borrarItemWatchlist('${it.id}')"><svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18 18 6M6 6l12 12"/></svg></button>
        </div>
      </div>
    `;
    frag.appendChild(card);
  });
  grid.appendChild(frag);
  aplicarEstilosGlobales();
}

function buscarEnVivoWl(q) {
  clearTimeout(timerDebounce);
  const res = document.getElementById('search-results-wl');
  if (!res) return;
  estado.ultimoTerminoBuscado = q;
  if (!q || q.trim().length < 2) { res.style.display = 'none'; return; }
  const qClean = q.trim().toLowerCase();
  const cat = estado.wlCategoria || 'Peliculas';
  const sub = estado.wlSubcategoria || 'Películas';
  const cacheKey = `${cat}_${sub}_${qClean}`;
  if (_CLIENT_SEARCH_CACHE.has(cacheKey)) {
    mostrarResultadosBuscadorWl(_CLIENT_SEARCH_CACHE.get(cacheKey));
    return;
  }
  if (res.style.display !== 'block') {
    res.innerHTML = `<div style="padding:14px; color:var(--muted); font-size:.9rem;">${tLang('Buscando...', 'Searching...')}</div>`;
    res.style.display = 'block';
  }
  const currentReqId = ++_searchRequestId;
  timerDebounce = setTimeout(() => {
    google.script.run.withSuccessHandler(items => {
      if (currentReqId === _searchRequestId) {
        if (items && items.length && _CLIENT_SEARCH_CACHE.size < 400) _CLIENT_SEARCH_CACHE.set(cacheKey, items);
        mostrarResultadosBuscadorWl(items);
      }
    }).buscarEnServidor(q.trim(), cat, sub);
  }, 120);
}

function mostrarResultadosBuscadorWl(items) {
  const res = document.getElementById('search-results-wl');
  if (!res) return;
  res.innerHTML = '';
  if (!items?.length) {
    res.innerHTML = `<div style="padding:14px; color:var(--muted); font-size:.9rem; text-align:center;">${tLang('No se encontraron coincidencias.', 'No matches found.')}<br><button type="button" class="btn-action-manual" style="margin-top:8px;" onclick="abrirModalIngresoManual(estado.ultimoTerminoBuscado)">${getHeroIcon('pencil-square', '', 14)} ${t('btn_manual')}</button></div>`;
    res.style.display = 'block';
    return;
  }
  const cat = estado.wlCategoria || 'Peliculas';
  const sub = estado.wlSubcategoria || 'Películas';
  const frag = document.createDocumentFragment();
  items.forEach(it => {
    const itemConCat = { ...it, categoria: cat, subcategoria: sub };
    const d = document.createElement('div');
    d.className = 'result-item';
    d.setAttribute('role', 'button');
    d.innerHTML = `<img class="result-thumb" loading="lazy" src="${it.poster||'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'45\' height=\'65\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>'}" onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'45\\' height=\\'65\\' fill=\\'%23334155\\'><rect width=\\'100%\\' height=\\'100%\\'/></svg>'"><div style="flex:1;"><div style="font-weight:600;">${it.tituloOriginal || it.titulo || ''}</div>${it.tituloIngles ? `<div style="font-size:.78rem; color:var(--muted); font-style:italic;">(${it.tituloIngles})</div>` : ''}<div style="font-size:.8rem; color:var(--muted);">${it.creador || ''} ${it.anio ? '('+it.anio+')' : ''}</div>${obtenerBadgeAmigoActividad(it.tituloOriginal || it.titulo, cat)}</div><button type="button" class="btn-wl-play btn-item-add-wl" style="max-width:90px;">${tLang('+ Lista', '+ List')}</button>`;
    const btn = d.querySelector('.btn-item-add-wl');
    if (btn) {
      btn.onclick = e => {
        e.stopPropagation();
        agregarAWatchlistDirecto(itemConCat, btn);
      };
    }
    d.onclick = e => {
      e.stopPropagation();
      agregarAWatchlistDirecto(itemConCat, btn);
    };
    frag.appendChild(d);
  });
  res.appendChild(frag);
  res.style.display = 'block';
}
// --- VISTA DISCOVER MEJORADA Y RÁPIDA ---
function obtenerResumenGustosUsuario() {
  const gustos = { peliculas: [], series: [], musica: [], libros: [], comics: [], juegos: [] };
  const regs = Array.isArray(estado.registros) ? estado.registros : [];
  const buenos = regs.filter(r => (Number(r.calificacion) >= 4) || (Number(r.mi_calificacion) >= 4));
  buenos.forEach(r => {
    const c = r.categoria || '';
    const sub = (r.subcategoria || '').toLowerCase();
    const cr = (r.creador && r.creador !== 'Desconocido') ? r.creador.trim() : '';
    const tit = (r.titulo || r.tituloOriginal || '').trim();
    if (c === 'Peliculas' && cr) gustos.peliculas.push({ cr, tit });
    else if (c === 'Series' && (cr || tit)) gustos.series.push({ cr, tit });
    else if (c === 'Musica' && cr) gustos.musica.push({ cr, tit });
    else if (c === 'Lecturas' && (sub.includes('comic') || sub.includes('cómic')) && (cr || tit)) gustos.comics.push({ cr, tit });
    else if (c === 'Lecturas' && cr) gustos.libros.push({ cr, tit });
    else if (c === 'Juegos' && (cr || tit)) gustos.juegos.push({ cr, tit });
  });
  const favs = perfilUsuario?.favoritos || {};
  if (favs.pelicula?.creador) gustos.peliculas.unshift({ cr: favs.pelicula.creador, tit: favs.pelicula.titulo || '' });
  if (favs.serie?.titulo) gustos.series.unshift({ cr: favs.serie.creador || '', tit: favs.serie.titulo });
  if (favs.album?.creador) gustos.musica.unshift({ cr: favs.album.creador, tit: favs.album.titulo || '' });
  if (favs.libro?.creador) gustos.libros.unshift({ cr: favs.libro.creador, tit: favs.libro.titulo || '' });
  if (favs.juego?.titulo) gustos.juegos.unshift({ cr: favs.juego.creador || '', tit: favs.juego.titulo });
  return gustos;
}

function formatearCreadorConRol(cat, sub, creador) {
  if (!creador || creador === 'Desconocido') return '';
  const cLow = String(cat).toLowerCase();
  const sLow = String(sub).toLowerCase();
  if (cLow === 'peliculas') {
    if (sLow.includes('docu')) return `${getHeroIcon('film', '', 12)} Dir: ${creador}`;
    return `${getHeroIcon('film', '', 12)} Dir: ${creador}`;
  }
  if (cLow === 'series') {
    if (sLow.includes('docu')) return `${getHeroIcon('video-camera', '', 12)} ${tLang('Docuserie:', 'Docuseries:')} ${creador}`;
    return `${getHeroIcon('tv', '', 12)} ${tLang('Creador:', 'Creator:')} ${creador}`;
  }
  if (cLow === 'juegos') {
    return `${getHeroIcon('gamepad', '', 12)} Dev: ${creador}`;
  }
  if (cLow === 'musica') {
    return `${getHeroIcon('musical-note', '', 12)} ${tLang('Artista:', 'Artist:')} ${creador}`;
  }
  if (cLow === 'lecturas') {
    if (sLow.includes('comic') || sLow.includes('cómic')) return `${getHeroIcon('bolt', '', 12)} ${creador}`;
    if (sLow.includes('manga')) return `${getHeroIcon('bookmark-square', '', 12)} ${creador}`;
    return `${getHeroIcon('book-open', '', 12)} ${tLang('Autor:', 'Author:')} ${creador}`;
  }
  return creador;
}

function estaEnWatchlist(it) {
  if (!Array.isArray(estado.watchlist) || !it) return false;
  const t1 = (it.tituloOriginal || it.titulo || '').toLowerCase().trim();
  const c1 = (it.categoria || '').toLowerCase().trim();
  return estado.watchlist.some(w => {
    const t2 = (w.titulo || '').toLowerCase().trim();
    const c2 = (w.categoria || '').toLowerCase().trim();
    return t1 === t2 && (!c1 || !c2 || c1 === c2);
  });
}

const COMICS_FALLBACK_DEFAULT = [
  { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Absolute Batman Vol. 1', tituloOriginal: 'Absolute Batman Vol. 1', tituloIngles: '', creador: 'Scott Snyder, Nick Dragotta', anio: '2025', poster: 'https://covers.openlibrary.org/b/id/15113626-M.jpg', motivo: 'DC Comics • Novedad' },
  { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Thunderbolts', tituloOriginal: 'Thunderbolts', tituloIngles: '', creador: 'Collin Kelly, Jackson Lanzing', anio: '2024', poster: 'https://covers.openlibrary.org/b/id/15203284-M.jpg', motivo: 'Marvel Comics • Tendencia' },
  { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Absolute Superman, Vol. 1', tituloOriginal: 'Absolute Superman, Vol. 1', tituloIngles: '', creador: 'Jason Aaron, Rafa Sandoval', anio: '2025', poster: 'https://covers.openlibrary.org/b/id/15138771-M.jpg', motivo: 'DC Comics • Novedad' },
  { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Daredevil by Chip Zdarsky Omnibus, Vol. 1', tituloOriginal: 'Daredevil by Chip Zdarsky Omnibus, Vol. 1', tituloIngles: '', creador: 'Chip Zdarsky, Marco Checchetto', anio: '2024', poster: 'https://covers.openlibrary.org/b/id/15249017-M.jpg', motivo: 'Marvel Comics • Aclamado' },
  { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Absolute Wonder Woman, Vol. 1', tituloOriginal: 'Absolute Wonder Woman, Vol. 1', tituloIngles: '', creador: 'Kelly Thompson, Hayden Sherman', anio: '2025', poster: 'https://covers.openlibrary.org/b/id/15108588-M.jpg', motivo: 'DC Comics • Novedad' },
  { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'King in Black', tituloOriginal: 'King in Black', tituloIngles: '', creador: 'Donny Cates, Ryan Stegman', anio: '2021', poster: 'https://covers.openlibrary.org/b/id/12381210-M.jpg', motivo: 'Marvel Comics • Tendencia' },
  { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Supergirl: Woman of Tomorrow', tituloOriginal: 'Supergirl: Woman of Tomorrow', tituloIngles: '', creador: 'Tom King, Bilquis Evely', anio: '2022', poster: 'https://covers.openlibrary.org/b/id/13195853-M.jpg', motivo: 'DC Comics • Aclamado' },
  { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'House of X / Powers of X', tituloOriginal: 'House of X / Powers of X', tituloIngles: '', creador: 'Jonathan Hickman, Pepe Larraz', anio: '2020', poster: 'https://covers.openlibrary.org/b/id/9409849-M.jpg', motivo: 'Marvel Comics • Hito' },
  { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Nightwing Vol. 1: Leaping into the Light', tituloOriginal: 'Nightwing Vol. 1: Leaping into the Light', tituloIngles: '', creador: 'Tom Taylor, Bruno Redondo', anio: '2021', poster: 'https://covers.openlibrary.org/b/id/12649586-M.jpg', motivo: 'DC Comics • Top Ventas' },
  { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Moon Knight Vol. 1: Midnight Mission', tituloOriginal: 'Moon Knight Vol. 1: Midnight Mission', tituloIngles: '', creador: 'Jed MacKay, Alessandro Cappuccio', anio: '2022', poster: 'https://covers.openlibrary.org/b/id/12780721-M.jpg', motivo: 'Marvel Comics • Novedad' },
  { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Dark Nights: Death Metal', tituloOriginal: 'Dark Nights: Death Metal', tituloIngles: '', creador: 'Scott Snyder, Greg Capullo', anio: '2022', poster: 'https://covers.openlibrary.org/b/id/13167440-M.jpg', motivo: 'DC Comics • Evento' },
  { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Immortal Hulk Vol. 1', tituloOriginal: 'Immortal Hulk Vol. 1', tituloIngles: '', creador: 'Al Ewing, Joe Bennett', anio: '2019', poster: 'https://covers.openlibrary.org/b/id/8813267-M.jpg', motivo: 'Marvel Comics • Aclamado' }
];

function precargarDiscoverEnSegundoPlano(seed, resetearLimites = false) {
  if (!estado.discoverData) {
    try {
      const c = localStorage.getItem('mediary_cache_disc_v3') || localStorage.getItem('mediary_cache_disc_v2');
      if (c) {
        estado.discoverData = JSON.parse(c);
        if (estado.discoverData?.comics) {
          estado.discoverData.comics = estado.discoverData.comics.filter(it => {
            if (!it || !it.titulo || !it.poster) return false;
            const y = parseInt(it.anio, 10);
            if (y && y < 2018) return false;
            const t = (it.titulo || '').toLowerCase();
            if (t.includes('sensibility') || t.includes('treasure island') || t.includes('land of oz') || t.includes('war of the worlds') || t.includes('screwtape') || t.includes('coloring book')) return false;
            return true;
          });
        }
        if (!estado.discoverData?.comics || !estado.discoverData.comics.length) {
          if (estado.discoverData) estado.discoverData.comics = [...COMICS_FALLBACK_DEFAULT];
        }
        if (estado.categoria === 'discover' || estado.categoria === 'inicio') renderizarDiscoverVista();
      }
    } catch(e) {}
  }
  const gustos = obtenerResumenGustosUsuario();
  google.script.run.withSuccessHandler(d => {
    if (!d) return;
    if (d.comics) {
      d.comics = d.comics.filter(it => {
        if (!it || !it.titulo || !it.poster) return false;
        const y = parseInt(it.anio, 10);
        if (y && y < 2018) return false;
        const t = (it.titulo || '').toLowerCase();
        if (t.includes('sensibility') || t.includes('treasure island') || t.includes('land of oz') || t.includes('war of the worlds') || t.includes('screwtape') || t.includes('coloring book')) return false;
        return true;
      });
    }
    if (!d.comics || !d.comics.length) {
      d.comics = [...COMICS_FALLBACK_DEFAULT];
    }
    estado.discoverData = d;
    try { localStorage.setItem('mediary_cache_disc_v3', JSON.stringify(d)); } catch(e) {}
    if (resetearLimites) estado.discoverLimites = {};
    const stEl = document.getElementById('discover-status-txt');
    if (stEl) stEl.textContent = tLang(`Actualizado ${d.timestamp || 'ahora'}`, `Updated ${d.timestamp || 'just now'}`);
    if (estado.categoria === 'discover' || estado.categoria === 'inicio') renderizarDiscoverVista();
  }).obtenerDescubrimientos(seed || estado.discoverSeed, gustos);
}
function iniciarLoopAutoActualizacionDiscover() { if (timerAutoDiscover) clearInterval(timerAutoDiscover); timerAutoDiscover = setInterval(() => { if (!document.hidden && estado.discoverAutoRefresh && (estado.categoria === 'discover' || estado.categoria === 'inicio')) { estado.discoverSeed = (estado.discoverSeed % 4) + 1;
const stEl = document.getElementById('discover-status-txt'); if (stEl) stEl.textContent = tLang('Actualizando tendencias...', 'Updating trends...'); precargarDiscoverEnSegundoPlano(estado.discoverSeed, false); }
}, 45000); }
function toggleAutoRefreshDiscover() {
  estado.discoverAutoRefresh = !estado.discoverAutoRefresh;
  const btn = document.getElementById('btn-discover-autoupdate');
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  if (btn) {
    btn.classList.toggle('active', estado.discoverAutoRefresh);
    btn.innerHTML = estado.discoverAutoRefresh
      ? `<span class="emoji-dyn">${getHeroIcon('bolt', '', 14)}</span> <span>${l === 'en' ? 'Auto-update: ON' : 'Auto-actualizar: ON'}</span>`
      : `<span class="emoji-dyn">${getHeroIcon('pause', '', 14)}</span> <span>${l === 'en' ? 'Auto-update: OFF' : 'Auto-actualizar: OFF'}</span>`;
  }
  mostrarToastPersonalizado(l === 'en' ? (estado.discoverAutoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh paused') : (estado.discoverAutoRefresh ? 'Actualización constante activada' : 'Actualización automática en pausa'));
}
function recargarDiscoverManual() { estado.discoverSeed = (estado.discoverSeed % 4) + 1; const stEl = document.getElementById('discover-status-txt'); if (stEl) stEl.textContent = tLang('Explorando nuevos títulos...', 'Exploring new titles...'); precargarDiscoverEnSegundoPlano(estado.discoverSeed, true); }
function actualizarBotonesFiltroDiscoverUI() { const activas = estado.discoverCatsActivas || TODAS_CATS_DISCOVER; const todasActivas = activas.length === TODAS_CATS_DISCOVER.length; document.querySelectorAll('#discover-category-filters .subtab-btn').forEach(btn => {
const k = btn.dataset.dcat; if (k === 'todos') { btn.classList.toggle('active', todasActivas); } else { btn.classList.toggle('active', !todasActivas && activas.includes(k)); }
}); }
function toggleFiltroCategoriaDiscover(catKey) { if (catKey === 'todos') { estado.discoverCatsActivas = [...TODAS_CATS_DISCOVER]; } else { const todasEstabanActivas = estado.discoverCatsActivas.length === TODAS_CATS_DISCOVER.length; if (todasEstabanActivas) {
// Al pulsar una categoría estando en "Todas", seleccionamos esa categoría para empezar a elegir
estado.discoverCatsActivas = [catKey]; } else { if (estado.discoverCatsActivas.includes(catKey)) { estado.discoverCatsActivas = estado.discoverCatsActivas.filter(x => x !== catKey); if (!estado.discoverCatsActivas.length) { estado.discoverCatsActivas = [...TODAS_CATS_DISCOVER]; }
} else { estado.discoverCatsActivas.push(catKey); }
}
}
actualizarBotonesFiltroDiscoverUI(); renderizarDiscoverVista(); }
function desplazarCarruselDiscover(secKey, dir) {
  const el = document.getElementById('carousel-track-' + secKey);
  if (!el) return;
  const amt = Math.max(340, el.clientWidth * 0.75);
  el.scrollBy({ left: amt * dir, behavior: 'smooth' });
}
window.desplazarCarruselDiscover = desplazarCarruselDiscover;

function abrirVistaDiscover(pushNav = true) {
  irInicio(pushNav);
  actualizarBotonesFiltroDiscoverUI();
  if (estado.userEmail && (!estado.amigosActividad || !Object.keys(estado.amigosActividad).length)) {
    cargarActividadAmigos();
  }
  if (!estado.discoverData) {
    precargarDiscoverEnSegundoPlano(estado.discoverSeed);
  } else {
    renderizarDiscoverVista();
  }
  setTimeout(() => {
    const el = document.getElementById('seccion-discover-inicio');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 120);
}
function registrarDirectoDesdeDiscover(it) { let destCat = it.categoria || 'Peliculas'; let destSub = it.subcategoria || 'Películas'; if (destCat === 'Series' && destSub === 'Series Completas') destSub = 'Temporadas'; cambiarCat(destCat, destSub); setTimeout(() => { seleccionarItem({
tituloOriginal: it.tituloOriginal || it.titulo, tituloIngles: it.tituloIngles || '', creador: it.creador || 'Desconocido', anio: it.anio || '', sinopsis: it.sinopsis || '', poster: it.poster || ''
}); establecerFechaHoy(); }, 150); }
function formatearMotivoHeroicon(motivo) {
  if (!motivo) return '';
  let txt = String(motivo).replace(/^[\p{Extended_Pictographic}\u2600-\u27bf\u2300-\u23ff\u2b50-\u2b55★☆✓✕✖➔➕➖✅🔐☁✂🎯👑🗑🏷📋⭐💬]+\s*/u, '').trim();
  let iconName = 'sparkles';
  const mLower = txt.toLowerCase();
  if (mLower.includes('tenden') || mLower.includes('emisión') || mLower.includes('fuego')) iconName = 'fire';
  else if (mLower.includes('popular') || mLower.includes('aclamad') || mLower.includes('bestseller') || mLower.includes('gusta')) iconName = 'star';
  else if (mLower.includes('docu') || mLower.includes('reciente')) iconName = 'video-camera';
  else if (mLower.includes('álbum') || mLower.includes('disco')) iconName = 'disc';
  else if (mLower.includes('artista')) iconName = 'microphone';
  else if (mLower.includes('comic') || mLower.includes('cómic')) iconName = 'bolt';
  else if (mLower.includes('manga')) iconName = 'bookmark-square';
  else if (mLower.includes('libro')) iconName = 'book-open';
  else if (mLower.includes('juego')) iconName = 'gamepad';
  const iconSvg = (typeof getHeroIcon === 'function') ? getHeroIcon(iconName, '', 12) : '';
  return `${iconSvg} ${txt}`;
}
function renderizarDiscoverVista() {
  const box = document.getElementById('contenedor-discover-secciones');
  if (!estado.discoverData) return;
  box.innerHTML = '';
  const l = userPrefs.lang || 'es';
  const secTitulos = {
    peliculas: l === 'en' ? '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"/></svg> Trending & Popular Movies' : '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"/></svg> Películas en Tendencia y Populares',
    documentales: l === 'en' ? '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"/></svg> Featured & Acclaimed Documentaries' : '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"/></svg> Documentales Destacados y Aclamados',
    series: l === 'en' ? '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z"/></svg> Trending & Acclaimed Series' : '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z"/></svg> Series en Tendencia y Aclamadas',
    docuseries: l === 'en' ? '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"/></svg> Acclaimed & Popular Docuseries' : '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"/></svg> Docuseries Aclamadas y Populares',
    musica: l === 'en' ? '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg> Trending Music & Modern Classics' : '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg> Música en Tendencia y Álbumes Destacados',
    juegos: l === 'en' ? '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="6"/><path d="M6 12h4m-2-2v4M15 13h.01M18 11h.01"/></svg> Trending & Acclaimed Games' : '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="6"/><path d="M6 12h4m-2-2v4M15 13h.01M18 11h.01"/></svg> Juegos en Tendencia y Aclamados',
    libros: l === 'en' ? '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg> Bestsellers & Featured Books' : '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg> Libros Más Leídos y Novedades',
    comics: l === 'en' ? '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg> Graphic Novels & Comics (Marvel & DC)' : '<svg style="width:14px;height:14px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg> Cómics y Novelas Gráficas (Marvel & DC)',
    mangas: l === 'en' ? '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H7.5A2.25 2.25 0 0 0 5.25 6v12a2.25 2.25 0 0 0 2.25 2.25h9A2.25 2.25 0 0 0 18.75 18V6a2.25 2.25 0 0 0-2.25-2.25Z"/></svg> Popular & Trending Manga' : '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H7.5A2.25 2.25 0 0 0 5.25 6v12a2.25 2.25 0 0 0 2.25 2.25h9A2.25 2.25 0 0 0 18.75 18V6a2.25 2.25 0 0 0-2.25-2.25Z"/></svg> Mangas Más Leídos y Populares'
  };
  const secciones = [
    { key: 'peliculas', titulo: secTitulos.peliculas, cat: 'Peliculas', sub: 'Películas' },
    { key: 'documentales', titulo: secTitulos.documentales, cat: 'Peliculas', sub: 'Documentales' },
    { key: 'series', titulo: secTitulos.series, cat: 'Series', sub: 'Series Completas' },
    { key: 'docuseries', titulo: secTitulos.docuseries, cat: 'Series', sub: 'Series Documentales' },
    { key: 'musica', titulo: secTitulos.musica, cat: 'Musica', sub: 'Discos' },
    { key: 'juegos', titulo: secTitulos.juegos, cat: 'Juegos', sub: 'Videojuegos' },
    { key: 'libros', titulo: secTitulos.libros, cat: 'Lecturas', sub: 'Libros' },
    { key: 'comics', titulo: secTitulos.comics, cat: 'Lecturas', sub: 'Cómics' },
    { key: 'mangas', titulo: secTitulos.mangas, cat: 'Lecturas', sub: 'Mangas' }
  ];
  const activas = estado.discoverCatsActivas || TODAS_CATS_DISCOVER;
  const discFrag = document.createDocumentFragment();
  secciones.forEach(sec => {
    if (!activas.includes(sec.key)) return;
    let items = estado.discoverData[sec.key] || [];
    if (sec.key === 'musica' && !items.length && (estado.discoverData.discos || estado.discoverData.artistas)) {
      items = [...(estado.discoverData.discos || []), ...(estado.discoverData.artistas || [])];
    }
    if (sec.key === 'comics') {
      items = (items || []).filter(it => {
        if (!it || !it.titulo || !it.poster) return false;
        const anio = parseInt(it.anio, 10);
        if (anio && anio < 2018) return false;
        const t = (it.titulo || '').toLowerCase();
        if (t.includes('sensibility') || t.includes('treasure island') || t.includes('land of oz') || t.includes('war of the worlds') || t.includes('screwtape') || t.includes('coloring book')) return false;
        return true;
      });
      if (!items.length) {
        items = [...COMICS_FALLBACK_DEFAULT];
      }
    }
    if (!items.length) return;

    const itemsVisibles = items.slice(0, 24);

    const secWrapper = document.createElement('div');
    secWrapper.className = 'discover-carousel-wrapper';

    const header = document.createElement('div');
    header.className = 'discover-carousel-header';
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="discover-section-title" style="margin:0;padding:0;">${sec.titulo}</span>
      </div>
      <div class="discover-carousel-controls">
        <button type="button" class="btn-carousel-nav" onclick="desplazarCarruselDiscover('${sec.key}', -1)" title="${l === 'en' ? 'Previous' : 'Anterior'}">‹</button>
        <button type="button" class="btn-carousel-nav" onclick="desplazarCarruselDiscover('${sec.key}', 1)" title="${l === 'en' ? 'Next' : 'Siguiente'}">›</button>
      </div>
    `;
    secWrapper.appendChild(header);

    const track = document.createElement('div');
    track.className = 'discover-carousel-track';
    track.id = `carousel-track-${sec.key}`;

    const dGridFrag = document.createDocumentFragment();
    itemsVisibles.forEach(it => {
      const card = document.createElement('div');
      card.className = 'discover-card';
      const titOrig = it.tituloOriginal || it.titulo || tLang('Sin título', 'Untitled');
      const titEn = (it.tituloIngles && it.tituloIngles.toLowerCase() !== titOrig.toLowerCase()) ? it.tituloIngles : '';
      const posterFallback = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='240' fill='%23334155'><rect width='100%' height='100%'/></svg>";
      const yaEnLista = estaEnWatchlist(it);
      const creadorConRol = formatearCreadorConRol(sec.cat, sec.sub, it.creador);
      const btnAddTxt = yaEnLista ? (l === 'en' ? `${getHeroIcon('check', '', 13)} In List` : `${getHeroIcon('check', '', 13)} En Lista`) : (l === 'en' ? `${getHeroIcon('plus', '', 13)} Watchlist` : `${getHeroIcon('plus', '', 13)} Lista`);
      const btnLogTitle = l === 'en' ? 'Log in my history now' : 'Registrar ahora en mi historial';

      card.innerHTML = `
        ${it.motivo ? `<div class="discover-rec-badge">${formatearMotivoHeroicon(it.motivo)}</div>` : ''}
        ${it.anio ? `<div class="discover-year-badge">${it.anio}</div>` : ''}
        <img class="discover-poster" loading="lazy" src="${it.poster || posterFallback}">
        <div class="discover-body">
          <div>
            <div class="discover-item-title">${titOrig}</div>
            ${titEn ? `<div class="discover-item-en-sub">(${titEn})</div>` : ''}
            <div class="discover-item-meta">
              ${creadorConRol ? `<span class="discover-creator-tag">${creadorConRol}</span>` : ''}
              ${it.anio ? `<span class="discover-year-sub">(${it.anio})</span>` : ''}
            </div>
            ${renderizarInsigniasAmigosDiscover(it, sec.cat)}
          </div>
          <div class="discover-actions">
            <button type="button" class="btn-add-discover ${yaEnLista ? 'added' : ''}">${btnAddTxt}</button>
            <button type="button" class="btn-log-discover" title="${btnLogTitle}"><svg style="width:15px;height:15px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg></button>
          </div>
        </div>
      `;
      const btnAdd = card.querySelector('.btn-add-discover');
      btnAdd.onclick = () => {
        if (btnAdd.classList.contains('added')) return;
        btnAdd.classList.add('added');
        btnAdd.innerHTML = l === 'en' ? '<svg style="width:13px;height:13px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg> Added' : '<svg style="width:13px;height:13px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg> Agregado';
        agregarAWatchlistDirecto(it, btnAdd);
      };
      card.querySelector('.btn-log-discover').onclick = () => registrarDirectoDesdeDiscover(it);
      dGridFrag.appendChild(card);
    });

    track.appendChild(dGridFrag);
    secWrapper.appendChild(track);
    discFrag.appendChild(secWrapper);
  });
  box.appendChild(discFrag);
  aplicarEstilosGlobales();
}
// --- FUNCIONES WATCHLIST ---
function obtenerItemsWatchlistActuales() {
  if (estado.categoria === 'watchlists') {
    const cat = estado.wlCategoria || 'Peliculas';
    const sub = estado.wlSubcategoria || 'Películas';
    return (estado.watchlist || []).filter(w => itemPerteneceAWatchlist(w, cat, sub));
  }
  const c = estado.categoria, s = estado.subcategoria;
  return (estado.watchlist || []).filter(w => itemPerteneceAWatchlist(w, c, s));
}
function renderizarWatchlist() { const c = estado.categoria, s = estado.subcategoria; const grid = document.getElementById('grid-watchlist-items'); if (!grid) return; grid.innerHTML = ''; const items = obtenerItemsWatchlistActuales(); const l = userPrefs.lang || 'es';
const catNom = I18N[l]?.cats?.[c] || CONFIG[c]?.nombre || c; let titNombre = I18N[l]?.subs?.[s] || s; if (s === 'Watchlist') titNombre = `Watchlist: ${catNom}`; const titEl = document.getElementById('titulo-watchlist-nombre'); if (titEl) titEl.textContent = `${titNombre} (${items.length})`; if (!items.length) {
grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:32px; color:var(--muted); background:var(--card); border-radius:4px; border:1px solid var(--border);">${l === 'en' ? `No pending items in <strong>${titNombre}</strong>. Use the search bar above or explore Discover to add one!` : `No tienes elementos pendientes en <strong>${titNombre}</strong>. ¡Usa el buscador de arriba o explora Discover para agregar uno!`}</div>`; aplicarEstilosGlobales(); return; }
const wlFrag = document.createDocumentFragment(); items.forEach(it => { const card = document.createElement('div'); card.className = 'watchlist-card'; card.innerHTML = ` <img class="watchlist-poster" loading="lazy" src="${it.poster||'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'170\' height=\'255\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>'}" onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'170\\' height=\\'255\\' fill=\\'%23334155\\'><rect width=\\'100%\\' height=\\'100%\\'/></svg>'" onclick="abrirFichaTecnica('${it.id}')" title="Ver ficha técnica"> <div class="watchlist-body"> <div> <div class="watchlist-item-title" onclick="abrirFichaTecnica('${it.id}')" style="cursor:pointer;">${it.titulo}</div> <div class="watchlist-item-meta">${it.categoria ? `<span style="color:var(--accent);font-weight:700;">${it.categoria}</span> · ` : ''}${it.creador} ${it.anio ? '(' + it.anio + ')' : ''}</div> ${obtenerBadgeAmigoActividad(it.titulo, it.categoria)} </div> <div class="watchlist-actions"> <button type="button" class="btn-wl-play" onclick="consumirDesdeWatchlist('${it.id}')">${l === 'en' ? '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg> Log' : '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg> Registrar'}</button> <button type="button" class="btn-wl-del" title="${l === 'en' ? 'Remove from list' : 'Eliminar de lista'}" onclick="borrarItemWatchlist('${it.id}')"><svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18 18 6M6 6l12 12"/></svg></button> </div> </div> `;
wlFrag.appendChild(card); }); grid.appendChild(wlFrag); aplicarEstilosGlobales(); }
function agregarAWatchlistDirecto(it, btnEl = null) {
  if (!estado.userEmail) {
    if (btnEl) {
      btnEl.classList.remove('added');
      btnEl.textContent = '+ Lista';
    }
    abrirModalAuthSupabase('login');
    return alert(userPrefs.lang === 'en' ? 'Sign in first to save to your Watchlist.' : 'Inicia sesión en tu cuenta primero para guardar en tu Watchlist.');
  }
  let targetCat = it.categoria || (estado.categoria === 'watchlists' ? estado.wlCategoria : estado.categoria);
  if (!targetCat || targetCat === 'inicio' || targetCat === 'watchlists' || targetCat === 'todas_watchlists' || targetCat === 'discover') {
    targetCat = 'Peliculas';
  }
  let targetSub = it.subcategoria || (estado.categoria === 'watchlists' ? estado.wlSubcategoria : estado.subcategoria);
  if (targetCat === 'Peliculas') {
    if (String(targetSub).toLowerCase().includes('docu')) targetSub = 'Documentales';
    else targetSub = 'Películas';
  } else if (targetCat === 'Series') {
    if (String(targetSub).toLowerCase().includes('docu')) targetSub = 'Series Documentales';
    else targetSub = 'Temporadas';
  } else if (targetCat === 'Musica') {
    if (String(targetSub).toLowerCase().includes('artista')) targetSub = 'Artistas/Grupos';
    else targetSub = 'Discos';
  } else if (targetCat === 'Juegos') {
    targetSub = 'Videojuegos';
  } else if (targetCat === 'Lecturas') {
    const sLow = String(targetSub).toLowerCase();
    if (sLow.includes('comic') || sLow.includes('cómic')) targetSub = 'Cómics';
    else if (sLow.includes('manga')) targetSub = 'Mangas';
    else targetSub = 'Libros';
  }
  const payload = {
    categoria: targetCat,
    subcategoria: targetSub,
    titulo: it.tituloOriginal || it.titulo,
    subtitulo: it.tituloIngles || it.subtitulo || '',
    creador: it.creador || 'Desconocido',
    anio: it.anio || '',
    poster: it.poster || ''
  };
  ['search-results', 'search-results-wl'].forEach(id => {
    const resBox = document.getElementById(id);
    if (resBox) { resBox.innerHTML = ''; resBox.style.display = 'none'; }
  });
  ['input-search', 'input-search-wl'].forEach(id => {
    const inSearch = document.getElementById(id);
    if (inSearch) inSearch.value = '';
  });
  google.script.run.withSuccessHandler(res => {
    if (res?.exito) {
      mostrarToastPersonalizado(userPrefs.lang === 'en' ? `"${payload.titulo}" added to pending watchlist! ` : `¡"${payload.titulo}" añadido a pendientes en Supabase! `);
      cargarWatchlist();
      if (btnEl) {
        btnEl.classList.add('added');
        btnEl.innerHTML = '<svg style="width:13px;height:13px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg> En Lista';
      }
    } else {
      if (btnEl) {
        btnEl.classList.remove('added');
        btnEl.innerHTML = (typeof getHeroIcon === 'function' ? getHeroIcon('plus', '', 13) : '') + ' Lista';
      }
      alert('Error: ' + res?.error);
    }
  }).guardarEnWatchlist(payload, estado.userEmail);
}
function borrarItemWatchlist(id) { google.script.run.withSuccessHandler(() => { mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Removed from list' : 'Eliminado de la lista'); cargarWatchlist(); }).eliminarDeWatchlist(id, estado.userEmail); }
function consumirDesdeWatchlist(id) { const item = estado.watchlist.find(w => w.id === id); if (!item) return; let destCat = item.categoria || 'Peliculas'; let destSub = item.subcategoria;
if (destCat === 'Peliculas') {
  destSub = (String(destSub).toLowerCase().includes('docu')) ? 'Documentales' : 'Películas';
} else if (destCat === 'Series') {
  destSub = (String(destSub).toLowerCase().includes('docu')) ? 'Series Documentales' : 'Temporadas';
} else if (destCat === 'Musica') {
  destSub = (String(destSub).toLowerCase().includes('artista')) ? 'Artistas/Grupos' : 'Discos';
} else if (destCat === 'Juegos') {
  destSub = 'Videojuegos';
} else if (destCat === 'Lecturas') {
  const sLow = String(destSub).toLowerCase();
  if (sLow.includes('comic') || sLow.includes('cómic')) destSub = 'Cómics';
  else if (sLow.includes('manga')) destSub = 'Mangas';
  else destSub = 'Libros';
}
cambiarCat(destCat, destSub); setTimeout(() => { seleccionarItem({ tituloOriginal: item.titulo, tituloIngles: item.subtitulo, creador: item.creador, anio: item.anio, sinopsis: '', poster: item.poster
}); establecerFechaHoy(); }, 200); }
function cerrarModalFelicitacionWatchlist() { document.getElementById('modal-felicitaciones-watchlist').style.display = 'none'; }
function abrirMenuRuletaWl() {
  const cat = (typeof estado !== 'undefined' && estado.wlCategoria) ? estado.wlCategoria : 'Peliculas';
  const permiteAmigos = ['Peliculas', 'Series', 'Juegos'].includes(cat);

  if (!permiteAmigos) {
    iniciarRecomendacionAzar();
    return;
  }

  const m = document.getElementById('modal-menu-ruleta-wl');
  if (m) m.style.display = 'flex';
}
function cerrarMenuRuletaWl() {
  const m = document.getElementById('modal-menu-ruleta-wl');
  if (m) m.style.display = 'none';
}
function ejecutarRuletaWl(tipo) {
  cerrarMenuRuletaWl();
  if (tipo === 'individual') {
    iniciarRecomendacionAzar();
  } else if (tipo === 'amigos') {
    const cat = (typeof estado !== 'undefined' && estado.wlCategoria && ['Peliculas', 'Series', 'Juegos'].includes(estado.wlCategoria))
      ? estado.wlCategoria
      : 'Peliculas';
    if (typeof abrirModalRuleta === 'function') {
      abrirModalRuleta(cat);
    } else if (typeof abrirModalRuletaPeliculas === 'function') {
      abrirModalRuletaPeliculas();
    }
  }
}
window.abrirMenuRuletaWl = abrirMenuRuletaWl;
window.cerrarMenuRuletaWl = cerrarMenuRuletaWl;
window.ejecutarRuletaWl = ejecutarRuletaWl;
function iniciarRecomendacionAzar() { const items = obtenerItemsWatchlistActuales(); if (!items.length) return alert(userPrefs.lang === 'en' ? 'You have no items in this list to recommend.' : 'No tienes elementos en esta lista para recomendar.'); document.getElementById('modal-shuffle-recomendar').style.display = 'flex'; ejecutarShuffleAnimado(); }
function ejecutarShuffleAnimado() { const items = obtenerItemsWatchlistActuales(); const pImg = document.getElementById('shuffle-img');
const pTit = document.getElementById('shuffle-title'); const pSub = document.getElementById('shuffle-sub'); const btnOtro = document.getElementById('btn-shuffle-otro');
const btnListo = document.getElementById('btn-shuffle-listo'); btnOtro.style.display = 'none'; btnListo.style.display = 'none'; pTit.textContent = tLang('Mezclando...', 'Shuffling...');
pSub.textContent = tLang('Escogiendo lo mejor para hoy...', 'Picking the best for today...'); let count = 0; let delay = 60; const maxSpins = 25 + Math.floor(Math.random() * 10); const winnerIndex = Math.floor(Math.random() * items.length); function step() { const randItem = items[count % items.length];
pImg.src = randItem.poster || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'240\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>'; pImg.style.transform = `scale(${1 + Math.random() * 0.08})`;
count++; if (count >= maxSpins) { const winner = items[winnerIndex]; pImg.src = winner.poster || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'240\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>'; pImg.style.transform = 'scale(1)';
pTit.innerHTML = `${getHeroIcon('sparkles', '', 16)} <strong>${winner.titulo}</strong>`; pSub.textContent = `${winner.creador} (${winner.anio || tLang('N/D', 'N/A')})`; btnOtro.style.display = 'inline-block'; btnListo.style.display = 'inline-block'; } else { delay += 10; setTimeout(step, delay); }
}
step(); }
function cerrarModalShuffle() { document.getElementById('modal-shuffle-recomendar').style.display = 'none'; }
function iniciarRotacionEmpates(elementId, items, catDestino, subDestino) { if (!items || items.length <= 1) return; let currentIndex = 0; const timer = setInterval(() => {
if (document.hidden) return;
currentIndex = (currentIndex + 1) % items.length; const cur = items[currentIndex]; const cardEl = document.getElementById(elementId); const tEl = document.getElementById(`${elementId}-title`), sEl = document.getElementById(`${elementId}-sub`), indEl = document.getElementById(`${elementId}-ind`);
if (tEl && sEl) { tEl.style.opacity = '0'; sEl.style.opacity = '0'; setTimeout(() => { const f = (cur.fechaFin && cur.fechaFin !== 'Sin fecha') ? cur.fechaFin : cur.fechaInicio; tEl.textContent = cur.titulo;
const rotCalifHtml = (Number(cur.calificacion) > 0) ? renderEstrellasVisuales(cur.calificacion) : '';
const rotDateHtml = (f && f !== 'Sin fecha') ? `<span class="cat-hl-date">${f}</span>` : '';
sEl.innerHTML = (rotCalifHtml || rotDateHtml) ? `${rotCalifHtml}${rotDateHtml}` : `<span class="cat-hl-date">${t('stat_sin_fecha')}</span>`; if (indEl) indEl.textContent = `[${currentIndex + 1}/${items.length}]`;
if (cardEl) cardEl.setAttribute('onclick', `navegarARegistroDesdeInicio('${cur.id}', '${catDestino}', '${subDestino}')`); tEl.style.opacity = '1'; sEl.style.opacity = '1'; }, 200); }
}, 3000); carruselIntervalos.push(timer); }
function renderizarStats() {
  limpiarCarruselTimers();
  const box = document.getElementById('grid-stats');
  if (!box) return;
  box.innerHTML = '';
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang) || 'es';
  const regsAnio = obtenerRegistrosFiltradosPorAnio();
  box.className = 'dashboard-vertical-list';

  const catsAMostrar = obtenerCategoriasOrdenadas(false);
  if (!catsAMostrar.length) {
    box.innerHTML = `
      <div style="text-align:center; padding:36px 16px; color:var(--muted); font-size:0.9rem; background:var(--card); border:1px dashed var(--border); border-radius:4px;">
        <span class="emoji-dyn" style="display:block; margin-bottom:8px;"><svg style="width:32px;height:32px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"/></svg></span>
        ${l === 'en' ? 'All categories are hidden. Tap the button above to organize categories.' : 'Todas las categorías están ocultas. Toca el botón de arriba para organizarlas.'}
      </div>
    `;
    return;
  }

  catsAMostrar.forEach(cat => {
    const cfg = CONFIG[cat];
    if (!cfg) return;
    let tot = 0;
    if (cat === 'Series') {
      tot = regsAnio.filter(r => r.categoria === 'Series' && (r.subcategoria === 'Temporadas' || r.subcategoria.includes('Temporada'))).length;
    } else if (cat === 'Musica') {
      tot = regsAnio.filter(r => r.categoria === 'Musica' && (r.subcategoria === 'Discos' || r.subcategoria === 'Disco')).length;
    } else {
      tot = regsAnio.filter(r => r.categoria === cat).length;
    }

    const itemsConCalif = regsAnio.filter(r => r.categoria === cat && Number(r.calificacion) > 0);
    const promCat = itemsConCalif.length ? (itemsConCalif.reduce((acc, x) => acc + Number(x.calificacion), 0) / itemsConCalif.length).toFixed(1) : '0.0';
    const catNombre = (typeof I18N !== 'undefined' && I18N[l] && I18N[l].cats && I18N[l].cats[cat]) || cfg.nombre;

    let subsParaRender = cfg.subs.filter(s => !s.esWatchlist);
    if (cat === 'Lecturas' && typeof obtenerSubcategoriasLecturasOrdenadas === 'function') {
      const ordenLecturas = obtenerSubcategoriasLecturasOrdenadas(false);
      subsParaRender = subsParaRender.filter(s => ordenLecturas.includes(s.id));
      subsParaRender.sort((a, b) => ordenLecturas.indexOf(a.id) - ordenLecturas.indexOf(b.id));
    }

    let bodyContent = '';
    if (cat === 'Lecturas') {
      const lecturasBlocks = subsParaRender.map(s => {
        const sNombre = (typeof I18N !== 'undefined' && I18N[l] && I18N[l].subs && I18N[l].subs[s.id]) || s.nombre;
        const regsSub = obtenerRegistrosDeSubcategoria('Lecturas', s.id);
        const countTotal = regsSub.length;
        const metaSub = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria('Lecturas', s.id) : null;
        const subColor = metaSub ? metaSub.colorVar : 'var(--muted)';
        const subKey = metaSub ? metaSub.key : '';

        let rewatchHtml = '';
        if (s.admiteRewatch) {
          const countRewatches = regsSub.filter(r => r.esRewatch).length;
          if (countRewatches > 0) {
            rewatchHtml = `<span class="cat-subcat-row-rewatch">${countRewatches} ${getHeroIcon('arrow-path', '', 10)}</span>`;
          }
        }

        const uTerminados = regsSub.filter(r => esObraTerminada(r));
        const ult = uTerminados.length ? [...uTerminados].sort((a,b) => (timestampDeFecha(b.fechaFin || b.fechaInicio) || 0) - (timestampDeFecha(a.fechaFin || a.fechaInicio) || 0))[0] : null;
        let mejores = regsSub.length ? regsSub.filter(x => Number(x.calificacion) === Math.max(...regsSub.map(y => Number(y.calificacion)))) : [];
        const mej = mejores[0] || null, cId = `lectura-${s.id.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}-mej`;
        const uF = ult ? ((ult.fechaFin && ult.fechaFin !== 'Sin fecha') ? ult.fechaFin : ult.fechaInicio) : '';
        const mF = mej ? ((mej.fechaFin && mej.fechaFin !== 'Sin fecha') ? mej.fechaFin : mej.fechaInicio) : '';

        if (mejores.length > 1) setTimeout(() => iniciarRotacionEmpates(cId, mejores, 'Lecturas', s.id), 50);

        const ultCalifHtml = (ult && Number(ult.calificacion) > 0) ? renderEstrellasVisuales(ult.calificacion) : '';
        const ultDateHtml = (uF && uF !== 'Sin fecha') ? `<span class="cat-hl-date">${uF}</span>` : '';
        const ultSubTxt = (ultCalifHtml || ultDateHtml) ? `${ultCalifHtml}${ultDateHtml}` : (ult ? `<span class="cat-hl-date">${t('stat_sin_fecha')}</span>` : '');

        const mejCalifHtml = mej ? renderEstrellasVisuales(mej.calificacion) : '';
        const mejDateHtml = (mej && mF && mF !== 'Sin fecha') ? `<span class="cat-hl-date">${mF}</span>` : '';
        const mejSubTxt = (mejCalifHtml || mejDateHtml) ? `${mejCalifHtml}${mejDateHtml}` : (mej ? `<span class="cat-hl-date">${t('stat_sin_fecha')}</span>` : '');

        return `
          <div class="cat-lectura-subcat-block">
            <div class="cat-subcat-row cat-subcat-row-${subKey}" onclick="event.stopPropagation(); cambiarCat('Lecturas', '${s.id}')" title="${sNombre}">
              <div class="cat-subcat-row-main">
                <span class="cat-subcat-row-icon" style="color:${subColor};">${s.emoji}</span>
                <span class="cat-subcat-row-name" style="font-weight:700; color:var(--text);">${sNombre}</span>
              </div>
              <div class="cat-subcat-row-stats">
                ${rewatchHtml}
                <span class="cat-subcat-row-count">${countTotal}</span>
              </div>
            </div>
            <div class="cat-lectura-subcat-highlights">
              <div class="cat-highlights-grid-two">
                <div class="cat-highlight-box ${ult ? 'is-clickable' : ''}" ${ult ? `onclick="navegarARegistroDesdeInicio('${ult.id}', 'Lecturas', '${s.id}')"` : ''} style="${ult ? 'cursor:pointer;' : ''}">
                  <div class="cat-hl-tag">
                    <span class="emoji-dyn">${getHeroIcon('clock', '', 12)}</span>
                    <span>${t('stat_ultimo')}</span>
                  </div>
                  <div class="cat-hl-title ${!ult ? 'is-empty' : ''}" title="${ult ? ult.titulo : ''}">${ult ? ult.titulo : t('stat_sin_reg')}</div>
                  <div class="cat-hl-meta">${ultSubTxt}</div>
                </div>
                <div class="cat-highlight-box ${mej ? 'is-clickable' : ''}" id="${cId}" ${mej ? `onclick="navegarARegistroDesdeInicio('${mej.id}', 'Lecturas', '${s.id}')"` : ''} style="${mej ? 'cursor:pointer;' : ''}">
                  <div class="cat-hl-tag">
                    <span class="emoji-dyn">${getHeroIcon('star', '', 12)}</span>
                    <span>${t('stat_mejor')}</span>
                    ${mejores.length > 1 ? `<span id="${cId}-ind" class="cat-hl-ind">[1/${mejores.length}]</span>` : ''}
                  </div>
                  <div class="cat-hl-title ${!mej ? 'is-empty' : ''}" id="${cId}-title" title="${mej ? mej.titulo : ''}">${mej ? mej.titulo : t('stat_sin_reg')}</div>
                  <div class="cat-hl-meta" id="${cId}-sub">${mejSubTxt}</div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      bodyContent = `
        <div class="cat-wide-body cat-wide-body-lecturas">
          <div class="cat-lecturas-unified-list">${lecturasBlocks}</div>
        </div>
      `;
    } else {
      const pills = subsParaRender.map(s => {
        const sNombre = (typeof I18N !== 'undefined' && I18N[l] && I18N[l].subs && I18N[l].subs[s.id]) || s.nombre;
        const regsSub = obtenerRegistrosDeSubcategoria(cat, s.id);
        const countTotal = regsSub.length;
        const metaSub = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(cat, s.id) : null;
        const subColor = metaSub ? metaSub.colorVar : 'var(--muted)';
        const subKey = metaSub ? metaSub.key : '';

        let rewatchHtml = '';
        if (s.admiteRewatch) {
          const countRewatches = regsSub.filter(r => r.esRewatch).length;
          if (countRewatches > 0) {
            rewatchHtml = `<span class="cat-subcat-row-rewatch">${countRewatches} ${getHeroIcon('arrow-path', '', 10)}</span>`;
          }
        }
        return `
          <div class="cat-subcat-row cat-subcat-row-${subKey}" onclick="event.stopPropagation(); cambiarCat('${cat}', '${s.id}')" title="${sNombre}">
            <div class="cat-subcat-row-main">
              <span class="cat-subcat-row-icon" style="color:${subColor};">${s.emoji}</span>
              <span class="cat-subcat-row-name">${sNombre}</span>
            </div>
            <div class="cat-subcat-row-stats">
              ${rewatchHtml}
              <span class="cat-subcat-row-count">${countTotal}</span>
            </div>
          </div>
        `;
      }).join('');

      let uUltimo = [], uMejores = [], subDestino = CONFIG[cat].subs[0].id;
      if (cat === 'Peliculas') {
        subDestino = 'Películas';
        uUltimo = regsAnio.filter(r => r.categoria === 'Peliculas' && !r.esRewatch && r.subcategoria !== 'Rewatches' && esObraTerminada(r));
        uMejores = regsAnio.filter(r => r.categoria === 'Peliculas' && !r.esRewatch && r.subcategoria !== 'Rewatches');
      } else if (cat === 'Series') {
        subDestino = 'Temporadas';
        uUltimo = regsAnio.filter(r => r.categoria === 'Series' && !r.esRewatch && (r.subcategoria === 'Temporadas' || r.subcategoria.includes('Temporada')) && esObraTerminada(r));
        uMejores = regsAnio.filter(r => r.categoria === 'Series' && !r.esRewatch && (r.subcategoria === 'Temporadas' || r.subcategoria.includes('Temporada')));
      } else if (cat === 'Musica') {
        subDestino = 'Discos';
        uUltimo = regsAnio.filter(r => r.categoria === 'Musica' && (r.subcategoria === 'Discos' || r.subcategoria === 'Disco') && esObraTerminada(r));
        uMejores = regsAnio.filter(r => r.categoria === 'Musica' && (r.subcategoria === 'Discos' || r.subcategoria === 'Disco'));
      } else {
        subDestino = 'Videojuegos';
        uUltimo = regsAnio.filter(r => r.categoria === 'Juegos' && esObraTerminada(r));
        uMejores = regsAnio.filter(r => r.categoria === 'Juegos');
      }

      const ult = uUltimo.length ? [...uUltimo].sort((a,b) => (timestampDeFecha(b.fechaFin || b.fechaInicio) || 0) - (timestampDeFecha(a.fechaFin || a.fechaInicio) || 0))[0] : null;
      let mejores = uMejores.length ? uMejores.filter(x => Number(x.calificacion) === Math.max(...uMejores.map(y => Number(y.calificacion)))) : [];
      const mej = mejores[0] || null, cId = `cat-${cat.toLowerCase()}-mej`;
      const uF = ult ? ((ult.fechaFin && ult.fechaFin !== 'Sin fecha') ? ult.fechaFin : ult.fechaInicio) : '';
      const mF = mej ? ((mej.fechaFin && mej.fechaFin !== 'Sin fecha') ? mej.fechaFin : mej.fechaInicio) : '';

      if (mejores.length > 1) setTimeout(() => iniciarRotacionEmpates(cId, mejores, cat, subDestino), 50);

      const ultCalifHtml = (ult && Number(ult.calificacion) > 0) ? renderEstrellasVisuales(ult.calificacion) : '';
      const ultDateHtml = (uF && uF !== 'Sin fecha') ? `<span class="cat-hl-date">${uF}</span>` : '';
      const ultSubTxt = (ultCalifHtml || ultDateHtml) ? `${ultCalifHtml}${ultDateHtml}` : (ult ? `<span class="cat-hl-date">${t('stat_sin_fecha')}</span>` : '');

      const mejCalifHtml = mej ? renderEstrellasVisuales(mej.calificacion) : '';
      const mejDateHtml = (mej && mF && mF !== 'Sin fecha') ? `<span class="cat-hl-date">${mF}</span>` : '';
      const mejSubTxt = (mejCalifHtml || mejDateHtml) ? `${mejCalifHtml}${mejDateHtml}` : (mej ? `<span class="cat-hl-date">${t('stat_sin_fecha')}</span>` : '');

      const destacados = `
        <div class="cat-highlights-col">
          <div class="cat-highlights-grid-two">
            <div class="cat-highlight-box ${ult ? 'is-clickable' : ''}" ${ult ? `onclick="navegarARegistroDesdeInicio('${ult.id}', '${cat}', '${subDestino}')"` : ''} style="${ult ? 'cursor:pointer;' : ''}">
              <div class="cat-hl-tag">
                <span class="emoji-dyn">${getHeroIcon('clock', '', 12)}</span>
                <span>${t('stat_ultimo')}</span>
              </div>
              <div class="cat-hl-title ${!ult ? 'is-empty' : ''}" title="${ult ? ult.titulo : ''}">${ult ? ult.titulo : t('stat_sin_reg')}</div>
              <div class="cat-hl-meta">${ultSubTxt}</div>
            </div>
            <div class="cat-highlight-box ${mej ? 'is-clickable' : ''}" id="${cId}" ${mej ? `onclick="navegarARegistroDesdeInicio('${mej.id}', '${cat}', '${subDestino}')"` : ''} style="${mej ? 'cursor:pointer;' : ''}">
              <div class="cat-hl-tag">
                <span class="emoji-dyn">${getHeroIcon('star', '', 12)}</span>
                <span>${t('stat_mejor')}</span>
                ${mejores.length > 1 ? `<span id="${cId}-ind" class="cat-hl-ind">[1/${mejores.length}]</span>` : ''}
              </div>
              <div class="cat-hl-title ${!mej ? 'is-empty' : ''}" id="${cId}-title" title="${mej ? mej.titulo : ''}">${mej ? mej.titulo : t('stat_sin_reg')}</div>
              <div class="cat-hl-meta" id="${cId}-sub">${mejSubTxt}</div>
            </div>
          </div>
        </div>
      `;

      bodyContent = `
        <div class="cat-wide-body">
          <div class="cat-subcats-col">
            <div class="cat-subcat-list">${pills}</div>
          </div>
          ${destacados}
        </div>
      `;
    }

    const metaCat = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(cat, '') : null;
    const catCardClass = metaCat ? `cat-wide-${metaCat.key}` : '';
    const c = document.createElement('div');
    c.className = `cat-wide-card ${catCardClass}`;
    c.innerHTML = `
      <div class="cat-wide-header" onclick="cambiarCat('${cat}')" title="${tLang('Ir a ', 'Go to ')}${catNombre}">
        <div class="cat-wide-title"><span class="emoji-dyn">${cfg.emoji} </span>${catNombre}</div>
        <div class="cat-wide-stats-plain">
          <span class="cat-stat-score">${getHeroIcon("star", "", 13)} ${promCat}</span>
          <span class="cat-stat-sep">·</span>
          <span class="cat-stat-total">${t('total_prefix')} ${tot}</span>
        </div>
      </div>
      ${bodyContent}
    `;
    box.appendChild(c);
  });
  aplicarEstilosGlobales();
}
function seleccionarTipoEvento(tVal) { estado.tipoEventoConcierto = tVal; document.getElementById('btn-tipo-concierto').classList.toggle('active', tVal === 'Concierto'); document.getElementById('btn-tipo-festival').classList.toggle('active', tVal === 'Festival'); }
function limpiarModuloConcierto() { document.getElementById('concierto-gira').value = ''; document.getElementById('input-buscar-artista-concierto').value = '';
document.getElementById('search-results-artistas').style.display = 'none'; estado.artistasConciertoSeleccionados = []; renderizarEtiquetasArtistas(); }
function buscarArtistaEnVivoConcierto(q) {
  clearTimeout(timerDebounceArtista);
  const res = document.getElementById('search-results-artistas');
  if (!q || q.trim().length < 2) { res.style.display = 'none'; return; }
  const qClean = q.trim().toLowerCase();
  if (_CLIENT_ARTISTA_CACHE.has(qClean)) {
    renderizarResultadosArtistasConcierto(_CLIENT_ARTISTA_CACHE.get(qClean), q);
    return;
  }
  res.innerHTML = `<div style="padding:12px; color:var(--muted); font-size:.85rem;">${tLang('Buscando...', 'Searching...')}</div>`;
  res.style.display = 'block';
  timerDebounceArtista = setTimeout(() => {
    google.script.run.withSuccessHandler(items => {
      if (items && items.length && _CLIENT_ARTISTA_CACHE.size < 300) _CLIENT_ARTISTA_CACHE.set(qClean, items);
      renderizarResultadosArtistasConcierto(items, q);
    }).buscarEnServidor(q.trim(), 'Musica', 'Artistas/Grupos');
  }, 120);
}
function renderizarResultadosArtistasConcierto(items, q) {
  const res = document.getElementById('search-results-artistas');
  if (!res) return;
  res.innerHTML = '';
  if (!items?.length) {
    res.innerHTML = `<div style="padding:12px; color:var(--muted); font-size:.85rem;">${tLang('No encontrado.', 'Not found.')} <button type="button" class="btn-manual" onclick="agregarArtistaManualConcierto('${encodeURIComponent(q.trim())}')">${tLang('+ Agregar', '+ Add')} "${q.trim()}"</button></div>`;
    res.style.display = 'block';
    return;
  }
  const frag = document.createDocumentFragment();
  items.forEach(a => {
    const d = document.createElement('div');
    d.className = 'result-item';
    d.innerHTML = `<img loading="lazy" decoding="async" class="result-thumb" style="width:36px; height:36px; border-radius:50%;" src="${a.poster||'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'36\' height=\'36\' fill=\'%23334155\'><circle cx=\'18\' cy=\'18\' r=\'18\'/></svg>'}"><div><div style="font-weight:600; font-size:.9rem;">${a.tituloOriginal}</div><div style="font-size:.75rem; color:var(--muted);">${a.sinopsis || tLang('Artista', 'Artist')}</div></div>`;
    d.onclick = e => {
      e.stopPropagation();
      agregarArtistaConcierto(a.tituloOriginal, a.poster);
      res.style.display = 'none';
      document.getElementById('input-buscar-artista-concierto').value = '';
    };
    frag.appendChild(d);
  });
  res.appendChild(frag);
  res.style.display = 'block';
}
const cerrarModuloConcierto = () => { document.getElementById('modulo-concierto-manual').style.display = 'none'; limpiarModuloConcierto(); };
const agregarArtistaManualConcierto = qEnc => { agregarArtistaConcierto(decodeURIComponent(qEnc), ''); document.getElementById('search-results-artistas').style.display = 'none'; document.getElementById('input-buscar-artista-concierto').value = ''; };
function agregarArtistaConcierto(n, f) { if (!estado.artistasConciertoSeleccionados.some(x => x.nombre.toLowerCase() === n.toLowerCase())) { estado.artistasConciertoSeleccionados.push({ nombre: n, foto: f }); renderizarEtiquetasArtistas(); }
}
function quitarArtistaConcierto(i) { estado.artistasConciertoSeleccionados.splice(i, 1); renderizarEtiquetasArtistas(); }
function renderizarEtiquetasArtistas() { const w = document.getElementById('contenedor-artistas-etiquetas'); w.innerHTML = estado.artistasConciertoSeleccionados.length ? '' : `<span style="color:var(--muted); font-size:.85rem; font-style:italic;">${t('concierto_vacio')}</span>`;
estado.artistasConciertoSeleccionados.forEach((a, i) => { const d = document.createElement('div'); d.className = 'tag-artista';
d.innerHTML = `${a.foto ? `<img loading="lazy" decoding="async" src="${a.foto}">` : `<span class="emoji-dyn">${getHeroIcon("microphone")}</span>`}<span>${a.nombre}</span><span class="tag-artista-remove" onclick="quitarArtistaConcierto(${i})">${getHeroIcon('x-mark', '', 12)}</span>`; w.appendChild(d); }); aplicarEstilosGlobales(); }
function prepararFormularioConcierto() { const g = document.getElementById('concierto-gira').value.trim(); if (!g) return alert(userPrefs.lang === 'en' ? 'Please enter the tour or festival name.' : 'Por favor ingresa el nombre de la gira o festival.');
if (!estado.artistasConciertoSeleccionados.length) return alert(userPrefs.lang === 'en' ? 'Please add at least one artist using search.' : 'Por favor agrega al menos un artista usando el buscador.'); const cStr = estado.artistasConciertoSeleccionados.map(a => a.nombre).join(', ');
const evLbl = estado.tipoEventoConcierto === 'Festival' ? 'Festival' : tLang('Concierto', 'Concert');
seleccionarItem({ tituloOriginal: g, tituloIngles: '', creador: cStr, anio: '2026', sinopsis: tLang(`Evento: ${evLbl} | Artistas: ${cStr}`, `Event: ${evLbl} | Artists: ${cStr}`), poster: estado.artistasConciertoSeleccionados[0].foto || '' }); }
function buscarEnVivo(q) {
  clearTimeout(timerDebounce);
  const res = document.getElementById('search-results');
  estado.ultimoTerminoBuscado = q;
  if (!q || q.trim().length < 2) { res.style.display = 'none'; return; }
  const qClean = q.trim().toLowerCase();
  const cacheKey = `${estado.categoria}_${estado.subcategoria || ''}_${qClean}`;
  if (_CLIENT_SEARCH_CACHE.has(cacheKey)) {
    mostrarResultadosBuscador(_CLIENT_SEARCH_CACHE.get(cacheKey));
    return;
  }
  if (qClean.length >= 3) {
    for (let len = qClean.length - 1; len >= 2; len--) {
      const pKey = `${estado.categoria}_${estado.subcategoria || ''}_${qClean.slice(0, len)}`;
      if (_CLIENT_SEARCH_CACHE.has(pKey)) {
        const match = (_CLIENT_SEARCH_CACHE.get(pKey) || []).filter(it => (it.tituloOriginal || it.titulo || '').toLowerCase().includes(qClean) || (it.creador || '').toLowerCase().includes(qClean));
        if (match.length) {
          mostrarResultadosBuscador(match);
          break;
        }
      }
    }
  }
  if (res.style.display !== 'block') {
    res.innerHTML = `<div style="padding:14px; color:var(--muted); font-size:.9rem;">${tLang('Buscando...', 'Searching...')}</div>`;
    res.style.display = 'block';
  }
  const currentReqId = ++_searchRequestId;
  timerDebounce = setTimeout(() => {
    google.script.run.withSuccessHandler(items => {
      if (currentReqId === _searchRequestId) {
        if (items && items.length && _CLIENT_SEARCH_CACHE.size < 400) _CLIENT_SEARCH_CACHE.set(cacheKey, items);
        mostrarResultadosBuscador(items);
      }
    }).buscarEnServidor(q.trim(), estado.categoria, estado.subcategoria);
  }, 120);
}
function mostrarResultadosBuscador(items) {
  const res = document.getElementById('search-results');
  if (!res) return;
  res.innerHTML = '';
  const esWl = esSubcategoriaWatchlist(estado.subcategoria);
  if (!items?.length) {
    res.innerHTML = `<div style="padding:14px; color:var(--muted); font-size:.9rem; text-align:center;">${tLang('No se encontraron coincidencias.', 'No matches found.')}<br><button type="button" class="btn-action-manual" style="margin-top:8px;" onclick="abrirModalIngresoManual(estado.ultimoTerminoBuscado)">${getHeroIcon('pencil-square', '', 14)} ${t('btn_manual')}</button></div>`;
    res.style.display = 'block';
    return;
  }
  const frag = document.createDocumentFragment();
  items.forEach(it => {
    const d = document.createElement('div');
    d.className = 'result-item';
    d.setAttribute('role', 'button');
    d.innerHTML = `<img class="result-thumb" loading="lazy" src="${it.poster||'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'45\' height=\'65\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>'}" onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'45\\' height=\\'65\\' fill=\\'%23334155\\'><rect width=\\'100%\\' height=\\'100%\\'/></svg>'"><div style="flex:1;"><div style="font-weight:600;">${it.tituloOriginal || it.titulo || ''}</div>${it.tituloIngles ? `<div style="font-size:.78rem; color:var(--muted); font-style:italic;">(${it.tituloIngles})</div>` : ''}<div style="font-size:.8rem; color:var(--muted);">${it.creador || ''} ${it.anio ? '('+it.anio+')' : ''}</div>${obtenerBadgeAmigoActividad(it.tituloOriginal || it.titulo, estado.categoria)}</div>${esWl ? `<button type="button" class="btn-wl-play btn-item-add-wl" style="max-width:90px;">${tLang('+ Lista', '+ List')}</button>` : ''}`;
    const btn = d.querySelector('.btn-item-add-wl');
    if (btn) {
      btn.onclick = e => {
        e.stopPropagation();
        agregarAWatchlistDirecto(it, btn);
      };
    }
    d.onclick = e => {
      e.stopPropagation();
      if (esWl) agregarAWatchlistDirecto(it, btn);
      else seleccionarItem(it);
    };
    frag.appendChild(d);
  });
  res.appendChild(frag);
  res.style.display = 'block';
}
function abrirModalIngresoManual(tIni = '') { const c = estado.categoria, s = estado.subcategoria; let lbl = t('manual_lbl_creador'); if (c === 'Peliculas') lbl = tLang('Director(es):', 'Director(s):'); else if (c === 'Series') lbl = tLang('Showrunner(s) / Creador(es):', 'Showrunner(s) / Creator(s):');
else if (c === 'Musica') lbl = (s === 'Discos' || s === 'Disco') ? tLang('Artista / Banda:', 'Artist / Band:') : tLang('Artista / Grupo:', 'Artist / Group:'); else if (c === 'Juegos') lbl = tLang('Estudio(s) desarrollador(es):', 'Developer Studio(s):');
else if (c === 'Lecturas') lbl = (s === 'Mangas' || s === 'Manga' || s === 'To Read: Mangas') ? 'Mangaka(s):' : ((s === 'Cómics' || s === 'Cómic' || s === 'To Read: Cómics') ? tLang('Guionista(s) / Dibujante(s):', 'Writer(s) / Artist(s):') : tLang('Autor(es):', 'Author(s):'));
document.getElementById('manual-label-creador').textContent = lbl; document.getElementById('manual-input-titulo').value = tIni || ''; ['manual-input-subtitulo','manual-input-creador','manual-input-anio'].forEach(id => document.getElementById(id).value = '');
document.getElementById('modal-ingreso-manual').style.display = 'flex'; setTimeout(() => document.getElementById('manual-input-titulo').focus(), 100); }
const cerrarModalManual = () => document.getElementById('modal-ingreso-manual').style.display = 'none'; function procesarIngresoManual() { const tit = document.getElementById('manual-input-titulo').value.trim(); if (!tit) return alert(userPrefs.lang === 'en' ? 'Please enter at least the title.' : 'Por favor ingresa al menos el título.');
const sub = document.getElementById('manual-input-subtitulo').value.trim(); const cr = document.getElementById('manual-input-creador').value.trim() || tLang('Desconocido', 'Unknown');
const anio = document.getElementById('manual-input-anio').value.trim(); const btn = document.getElementById('btn-manual-confirmar'), txt = btn.textContent;
btn.innerHTML = `${tLang('Buscando portada...', 'Searching cover...')} <svg style="width:14px;height:14px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/></svg>`; btn.disabled = true; const finish = p => { btn.textContent = txt; btn.disabled = false; cerrarModalManual(); const obj = { tituloOriginal: tit, tituloIngles: sub, creador: cr, anio: anio, sinopsis: tLang('Registro manual.', 'Manual entry.'), poster: p || '' };
if (esSubcategoriaWatchlist(estado.subcategoria)) { agregarAWatchlistDirecto(obj); } else { seleccionarItem(obj); }
}; google.script.run .withSuccessHandler(p => finish(p)) .withFailureHandler(() => finish('')) .buscarPortadaGenerica(tit, cr, estado.categoria); }
function seleccionarItem(it) {
  if (!it) return;
  try {
    estado.seleccionado = it;
    const resBox = document.getElementById('search-results');
    if (resBox) resBox.style.display = 'none';
    const inSearch = document.getElementById('input-search');
    if (inSearch) inSearch.value = '';
    const formTit = document.getElementById('form-titulo');
    if (formTit) formTit.innerHTML = `<strong>${it.tituloOriginal || it.titulo || ''}</strong>`;
    const sEl = document.getElementById('form-subtitulo');
    if (sEl) {
      sEl.textContent = (it.tituloIngles && it.tituloIngles !== it.tituloOriginal) ? `(${it.tituloIngles})` : '';
      sEl.style.display = sEl.textContent ? 'block' : 'none';
    }
    const crAnio = document.getElementById('form-creador-anio');
    if (crAnio) crAnio.textContent = `(${it.creador || ''}${it.anio ? ', ' + it.anio : ''})`;
    const sinEl = document.getElementById('form-sinopsis');
    if (sinEl) sinEl.textContent = it.sinopsis || '';
    const fAmAct = document.getElementById('form-amigos-actividad');
    if (fAmAct) {
      const b = obtenerBadgeAmigoActividad(it.tituloOriginal || it.titulo, estado.categoria);
      fAmAct.innerHTML = b;
      fAmAct.style.display = b ? 'block' : 'none';
    }
    const formPost = document.getElementById('form-poster');
    if (formPost) formPost.src = it.poster || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'110\' height=\'160\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>';
    const chkNoF = document.getElementById('chk-no-fecha');
    if (chkNoF) chkNoF.checked = false;
    toggleSinFechaInicio(false);
    const chkNoFFin = document.getElementById('chk-no-fecha-fin');
    if (chkNoFFin) chkNoFFin.checked = false;
    toggleSinFechaFin(false);
    limpiarFechaCalendario('inicio');
    limpiarFechaCalendario('fin');
    ['input-comentario','input-temporada-num','input-arco','input-numeros-abarcados','input-horas-jugadas'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const chkTempU = document.getElementById('chk-temporada-unica');
    if (chkTempU) {
      chkTempU.checked = (it.totalSeasons === 1 || (Array.isArray(it.seasonsList) && it.seasonsList.length === 1));
      if (chkTempU.checked) {
        const inTempNum = document.getElementById('input-temporada-num');
        if (inTempNum && !inTempNum.value) inTempNum.value = '1';
      }
    }
    const chkRw = document.getElementById('chk-es-rewatch');
    if (chkRw) chkRw.checked = false;
    document.querySelectorAll('.btn-rewatch-toggle').forEach(btn => btn.classList.remove('active'));
    const chkProg = document.getElementById('chk-en-progreso');
    if (chkProg) {
      chkProg.checked = false;
      toggleEnProgresoFormulario();
    }
    actualizarVisibilidadCamposEspeciales();
    configurarFormularioFechas();
    crearEstrellasInteractivas();
    const dForm = document.getElementById('detail-form');
    if (dForm) {
      dForm.style.display = 'block';
      if (window.innerWidth <= 768) dForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    console.error('Error al seleccionar item:', err);
    const dForm = document.getElementById('detail-form');
    if (dForm) dForm.style.display = 'block';
  }
}
function ocultarFormulario() { document.getElementById('detail-form').style.display = 'none'; estado.seleccionado = null; }
function crearEstrellasInteractivas() { estado.calificacion = 0; actualizarDisplayEstrellas(0); }
function actualizarDisplayEstrellas(val) {
  const num = typeof val === 'number' ? val : (parseFloat(String(val || '').replace(',', '.')) || 0);
  const rounded = Math.round(num * 2) / 2;
  const box = document.getElementById('rating-stars');
  box.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const isFull = rounded >= i;
    const isHalf = !isFull && (rounded >= i - 0.5);
    const s = document.createElement('span');
    s.className = `star-box ${isFull ? 'full' : (isHalf ? 'half' : '')}`;
    s.innerHTML = isHalf ? getHeroIcon('star-half', '', 22) : getHeroIcon('star', '', 22);
    s.onmousemove = e => {
      const isH = (e.clientX - s.getBoundingClientRect().left < s.getBoundingClientRect().width / 2);
      dibujarHoverEstrellas(isH ? i - 0.5 : i);
    };
    s.onclick = e => {
      const isH = (e.clientX - s.getBoundingClientRect().left < s.getBoundingClientRect().width / 2);
      estado.calificacion = isH ? i - 0.5 : i;
      actualizarDisplayEstrellas(estado.calificacion);
    };
    box.appendChild(s);
  }
  document.getElementById('rating-label').textContent = `${num.toFixed(1)} / 5`;
}
function dibujarHoverEstrellas(val) {
  const num = typeof val === 'number' ? val : (parseFloat(String(val || '').replace(',', '.')) || 0);
  const rounded = Math.round(num * 2) / 2;
  document.querySelectorAll('#rating-stars .star-box').forEach((s, idx) => {
    const isFull = rounded >= idx + 1;
    const isHalf = !isFull && (rounded >= idx + 0.5);
    s.className = `star-box ${isFull ? 'full' : (isHalf ? 'half' : '')}`;
    s.innerHTML = isHalf ? getHeroIcon('star-half', '', 22) : getHeroIcon('star', '', 22);
  });
  document.getElementById('rating-label').textContent = `${num.toFixed(1)} / 5`;
}
function inicializarSelectoresFechasAproximadas() {
  const l = userPrefs.lang || 'es';
  const anios = obtenerListaAniosFechaAproximada();
  const meses = I18N[l]?.meses || ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const selSemAnio = document.getElementById('sel-semana-anio');
  const selSemMes = document.getElementById('sel-semana-mes');
  if (selSemAnio && selSemMes) {
    const curValAnio = selSemAnio.value;
    const curValMes = selSemMes.value;
    selSemAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');
    selSemMes.innerHTML = meses.map((m, idx) => `<option value="${idx}">${m}</option>`).join('');
    const hoy = new Date();
    selSemMes.value = (curValMes !== '' && curValMes !== null && curValMes !== undefined) ? curValMes : String(hoy.getMonth());
    if (curValAnio) selSemAnio.value = curValAnio;
    poblarSemanasDelMes();
    actualizarFechaDesdeSemana();
  }
  ['inicio', 'fin'].forEach(pref => {
    const selMesNom = document.getElementById(`sel-mes-nombre-${pref}`) || (pref === 'inicio' ? document.getElementById('sel-mes-nombre') : null);
    const selMesAnio = document.getElementById(`sel-mes-anio-${pref}`) || (pref === 'inicio' ? document.getElementById('sel-mes-anio') : null);
    if (selMesNom && selMesAnio) {
      const curValMesNom = selMesNom.value;
      const curValMesAnio = selMesAnio.value;
      selMesNom.innerHTML = meses.map(m => `<option value="${m}">${m}</option>`).join('');
      selMesAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');
      const hoy = new Date();
      selMesNom.value = curValMesNom || meses[hoy.getMonth()];
      if (curValMesAnio) selMesAnio.value = curValMesAnio;
      actualizarFechaDesdeMes(pref);
    }
    const selSoloAnio = document.getElementById(`sel-solo-anio-${pref}`) || (pref === 'inicio' ? document.getElementById('sel-solo-anio') : null);
    if (selSoloAnio) {
      const curValSolo = selSoloAnio.value;
      selSoloAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');
      if (curValSolo) selSoloAnio.value = curValSolo;
      actualizarFechaDesdeSoloAnio(pref);
    }
  });
}
function poblarSemanasDelMes() {
  const selAnio = document.getElementById('sel-semana-anio');
  const selMes = document.getElementById('sel-semana-mes');
  const selNum = document.getElementById('sel-semana-num');
  if (!selAnio || !selMes || !selNum) return;
  const l = userPrefs.lang || 'es';
  const anio = parseInt(selAnio.value, 10) || obtenerAnioActualSistema();
  const mes = parseInt(selMes.value, 10) || 0;
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const mm = String(mes + 1).padStart(2, '0');
  selNum.innerHTML = '';
  const semanas = [
    { num: 1, ini: 1, fin: 7 },
    { num: 2, ini: 8, fin: 14 },
    { num: 3, ini: 15, fin: 21 },
    { num: 4, ini: 22, fin: 28 }
  ];
  if (totalDias > 28) semanas.push({ num: 5, ini: 29, fin: totalDias });
  semanas.forEach(s => {
    const dIni = String(s.ini).padStart(2, '0');
    const dFin = String(s.fin).padStart(2, '0');
    const label = `${l === 'en' ? 'Week' : 'Semana'} ${s.num}: ${dIni}/${mm} ➔ ${dFin}/${mm}`;
    const value = `${dIni}/${mm}/${anio} ➔ ${dFin}/${mm}/${anio}`;
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    selNum.appendChild(opt);
  });
}
function cambiarPrecisionFechaFormulario(modo) {
  seleccionarTipoFecha('inicio', modo);
}
window.cambiarPrecisionFechaFormulario = cambiarPrecisionFechaFormulario;
function actualizarFechaDesdeSemana() {
  const selNum = document.getElementById('sel-semana-num');
  const badge = document.getElementById('semana-preview-badge');
  const l = userPrefs.lang || 'es';
  if (selNum && badge) badge.innerHTML = `${getHeroIcon("bookmark", "", 12)} ${l === 'en' ? 'Logging in:' : 'Registrando en:'} ${selNum.value}`;
}
function actualizarFechaDesdeMes(seccion = 'inicio') {
  const selMes = document.getElementById(`sel-mes-nombre-${seccion}`) || document.getElementById('sel-mes-nombre');
  const selAnio = document.getElementById(`sel-mes-anio-${seccion}`) || document.getElementById('sel-mes-anio');
  const badge = document.getElementById('mes-preview-badge');
  const l = userPrefs.lang || 'es';
  if (selMes && selAnio && badge) badge.innerHTML = `${getHeroIcon("bookmark", "", 12)} ${l === 'en' ? 'Logging in:' : 'Registrando en:'} ${selMes.value} ${selAnio.value}`;
}
function actualizarFechaDesdeSoloAnio(seccion = 'inicio') {
  const selAnio = document.getElementById(`sel-solo-anio-${seccion}`) || document.getElementById('sel-solo-anio');
  const badge = document.getElementById('anio-preview-badge');
  const l = userPrefs.lang || 'es';
  if (selAnio && badge) badge.innerHTML = `${getHeroIcon("bookmark", "", 12)} ${l === 'en' ? 'Logging in year:' : 'Registrando en el año:'} ${selAnio.value}`;
}
function obtenerFechasParaGuardarNuevo() {
  const admiteRango = subTieneRango(estado.categoria, estado.subcategoria);

  // 1. Fecha Inicio:
  let fI = 'Sin fecha';
  const sinFIni = document.getElementById('chk-no-fecha')?.checked;
  if (!sinFIni) {
    const v = document.getElementById('input-fecha-inicio')?.value;
    fI = sanitizarFechaFrontend(v) || 'Sin fecha';
  }

  // 2. Fecha Fin:
  let fF = 'Sin fecha';
  if (!admiteRango) {
    fF = fI;
  } else {
    const sinFFin = document.getElementById('chk-no-fecha-fin')?.checked;
    if (!sinFFin) {
      const inpFin = document.getElementById('input-fecha-fin');
      const v = inpFin?.value?.trim();
      if (esEnProgresoTexto(v)) {
        fF = v;
      } else {
        fF = sanitizarFechaFrontend(v) || 'Sin fecha';
      }
    }
  }

  return { fI, fF };
}
const restaurarHoverEstrellas = () => actualizarDisplayEstrellas(estado.calificacion);

function toggleSinFechaInicio(sinF) {
  const inp = document.getElementById('input-fecha-inicio');
  const txt = document.getElementById('txt-fecha-inicio');
  const btn = document.getElementById('btn-trigger-fecha-inicio');

  if (sinF) {
    if (inp) inp.value = 'Sin fecha';
    if (txt) {
      const l = (typeof userPrefs !== 'undefined' && userPrefs.lang === 'en') ? 'en' : 'es';
      txt.textContent = l === 'en' ? 'No date' : 'Sin fecha';
      txt.classList.add('is-placeholder');
    }
    if (btn) btn.classList.add('disabled');
  } else {
    if (btn) btn.classList.remove('disabled');
    if (inp && inp.value === 'Sin fecha') {
      limpiarFechaCalendario('inicio');
    }
  }
}

function toggleSinFechaFin(sinF) {
  const inp = document.getElementById('input-fecha-fin');
  const txt = document.getElementById('txt-fecha-fin');
  const btn = document.getElementById('btn-trigger-fecha-fin');

  if (sinF) {
    if (inp) inp.value = 'Sin fecha';
    if (txt) {
      const l = (typeof userPrefs !== 'undefined' && userPrefs.lang === 'en') ? 'en' : 'es';
      txt.textContent = l === 'en' ? 'No date' : 'Sin fecha';
      txt.classList.add('is-placeholder');
    }
    if (btn) btn.classList.add('disabled');
  } else {
    if (btn) btn.classList.remove('disabled');
    if (inp && inp.value === 'Sin fecha') {
      limpiarFechaCalendario('fin');
    }
  }
}

function toggleSinFecha(sinF) {
  const chkIni = document.getElementById('chk-no-fecha');
  if (chkIni) chkIni.checked = sinF;
  toggleSinFechaInicio(sinF);
}

window.toggleSinFechaInicio = toggleSinFechaInicio;
window.toggleSinFechaFin = toggleSinFechaFin;
window.toggleSinFecha = toggleSinFecha;
async function recalcularYActualizarPromedioArtista(nombreArtista, nuevoDisco = null) {
  if (!nombreArtista || !estado.userEmail) return null;
  const nombreNorm = String(nombreArtista).trim().toLowerCase();
  if (!nombreNorm || nombreNorm === 'desconocido' || nombreNorm === 'artista' || nombreNorm === 'various artists') return null;

  const artistaReg = (estado.registros || []).find(r => {
    if (r.categoria !== 'Musica') return false;
    const esSubArt = r.subcategoria && (r.subcategoria === 'Artistas/Grupos' || r.subcategoria.includes('Artista'));
    if (!esSubArt) return false;
    const tit = String(r.titulo || '').trim().toLowerCase();
    const cr = String(r.creador || '').trim().toLowerCase();
    return tit === nombreNorm || cr === nombreNorm;
  });
  if (!artistaReg) return null;

  const discos = (estado.registros || []).filter(r => {
    if (r.categoria !== 'Musica') return false;
    const esDisco = r.subcategoria && (r.subcategoria === 'Discos' || r.subcategoria === 'Disco');
    if (!esDisco) return false;
    const cr = String(r.creador || '').trim().toLowerCase();
    const tit = String(r.titulo || '').trim().toLowerCase();
    return cr === nombreNorm || tit === nombreNorm;
  });

  if (nuevoDisco) {
    const yaEsta = discos.some(d => (nuevoDisco.id && String(d.id) === String(nuevoDisco.id)) || (d.titulo === nuevoDisco.titulo && d.creador === nuevoDisco.creador));
    if (!yaEsta) discos.push(nuevoDisco);
  }

  const discosCalif = discos.filter(d => Number(d.calificacion) > 0);
  if (!discosCalif.length) return null;

  const suma = discosCalif.reduce((acc, d) => acc + Number(d.calificacion), 0);
  const nuevoPromedio = Math.round((suma / discosCalif.length) * 10) / 10;

  if (Number(artistaReg.calificacion) !== nuevoPromedio) {
    artistaReg.calificacion = nuevoPromedio;
    try {
      await google.script.run.actualizarRegistro(artistaReg.id, { calificacion: nuevoPromedio }, estado.userEmail);
    } catch (e) {
      console.warn('Error al actualizar calificación del artista:', e);
    }
  }
  return nuevoPromedio;
}
window.recalcularYActualizarPromedioArtista = recalcularYActualizarPromedioArtista;

async function recalcularYActualizarPromedioSerieCompleta(tituloBase) {
  if (!tituloBase || !estado.userEmail) return null;
  const tNorm = String(tituloBase).trim().toLowerCase();
  const serieCompReg = (estado.registros || []).find(r => 
    r.categoria === 'Series' && 
    (r.subcategoria === 'Series Completas' || r.subcategoria.includes('Completa')) &&
    String(r.titulo || '').trim().toLowerCase() === tNorm
  );
  if (!serieCompReg) return null;

  const temps = (estado.registros || []).filter(r => 
    r.categoria === 'Series' && 
    (r.subcategoria === 'Temporadas' || r.subcategoria.includes('Temporada')) &&
    (String(r.titulo || '').toLowerCase().startsWith(tNorm + ' [') || String(r.titulo || '').toLowerCase() === tNorm) &&
    Number(r.calificacion) > 0
  );
  if (!temps.length) return null;

  const suma = temps.reduce((a, b) => a + Number(b.calificacion), 0);
  const nuevoProm = Math.round((suma / temps.length) * 10) / 10;
  if (Number(serieCompReg.calificacion) !== nuevoProm) {
    serieCompReg.calificacion = nuevoProm;
    try {
      await google.script.run.actualizarRegistro(serieCompReg.id, { calificacion: nuevoProm }, estado.userEmail);
    } catch(e) {
      console.warn('Error al actualizar calificación de serie completa:', e);
    }
  }
  return nuevoProm;
}
window.recalcularYActualizarPromedioSerieCompleta = recalcularYActualizarPromedioSerieCompleta;

function abrirModalSerieCompleta(base, fI, fF, esRw, promCalif = 0, countTemps = 0) {
  serieCompletaPendiente = {
    categoria: 'Series',
    subcategoria: 'Series Completas',
    titulo: base.tituloBase,
    subtitulo: '',
    creador: base.creador,
    anio: base.anio,
    fechaInicio: fI,
    fechaFin: fF,
    poster: base.poster,
    esRewatch: esRw
  };
  calificacionSerieCompleta = promCalif || 0;
  const l = userPrefs.lang || 'es';
  const txtProm = promCalif > 0
    ? (l === 'en'
        ? `<div style="margin-top:6px; font-weight:700; color:var(--accent); display:flex; align-items:center; gap:4px;">${getHeroIcon("star", "", 14)} Average rating detected across ${countTemps} seasons: ${promCalif.toFixed(1)} / 5</div>`
        : `<div style="margin-top:6px; font-weight:700; color:var(--accent); display:flex; align-items:center; gap:4px;">${getHeroIcon("star", "", 14)} Calificación promedio calculada de sus ${countTemps} temporadas: ${promCalif.toFixed(1)} / 5</div>`)
    : '';

  document.getElementById('msg-serie-completa').innerHTML = `
    ${l === 'en' ? `You have completed <strong>${base.tituloBase}</strong> (Season ${base.numTempActual} of ${base.totalTempOficiales}).` : `Has completado <strong>${base.tituloBase}</strong> (Temporada ${base.numTempActual} de ${base.totalTempOficiales}).`}
    ${txtProm}
  `;
  document.getElementById('comentario-serie-completa').value = '';
  renderEstrellasSerieCompleta(calificacionSerieCompleta);
  document.getElementById('rating-label-completa').textContent = `${calificacionSerieCompleta.toFixed(1)} / 5`;
  document.getElementById('btn-confirmar-serie-completa').onclick = guardarSerieCompletaDetectada;
  document.getElementById('modal-serie-completa').style.display = 'flex';
  setTimeout(() => {
    const comEl = document.getElementById('comentario-serie-completa');
    if (comEl) comEl.focus();
  }, 100);
}
function renderEstrellasSerieCompleta(val) {
  const num = typeof val === 'number' ? val : (parseFloat(String(val || '').replace(',', '.')) || 0);
  const rounded = Math.round(num * 2) / 2;
  const box = document.getElementById('rating-stars-completa');
  box.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const isFull = rounded >= i;
    const isHalf = !isFull && (rounded >= i - 0.5);
    const s = document.createElement('span');
    s.className = `star-box ${isFull ? 'full' : (isHalf ? 'half' : '')}`;
    s.innerHTML = isHalf ? getHeroIcon('star-half', '', 16) : getHeroIcon('star', '', 16);
    s.onmousemove = e => {
      const p = (e.clientX - s.getBoundingClientRect().left < s.getBoundingClientRect().width / 2) ? i - 0.5 : i;
      const rP = Math.round(p * 2) / 2;
      document.querySelectorAll('#rating-stars-completa .star-box').forEach((st, idx) => {
        const isF = rP >= idx + 1;
        const isH = !isF && (rP >= idx + 0.5);
        st.className = `star-box ${isF ? 'full' : (isH ? 'half' : '')}`;
        st.innerHTML = isH ? getHeroIcon('star-half', '', 16) : getHeroIcon('star', '', 16);
      });
      document.getElementById('rating-label-completa').textContent = `${p.toFixed(1)} / 5`;
    };
    s.onclick = e => {
      calificacionSerieCompleta = (e.clientX - s.getBoundingClientRect().left < s.getBoundingClientRect().width / 2) ? i - 0.5 : i;
      renderEstrellasSerieCompleta(calificacionSerieCompleta);
    };
    box.appendChild(s);
  }
  box.onmouseleave = () => renderEstrellasSerieCompleta(calificacionSerieCompleta);
  document.getElementById('rating-label-completa').textContent = `${num.toFixed(1)} / 5`;
}
function omitirGuardadoSerieCompleta() {
  document.getElementById('modal-serie-completa').style.display = 'none';
  serieCompletaPendiente = null;
  cargarRegistros();
}
function guardarSerieCompletaDetectada() {
  if (!serieCompletaPendiente) return;
  const rec = Object.assign({}, serieCompletaPendiente, {
    calificacion: Number(calificacionSerieCompleta) || 0,
    comentario: asegurarPuntoFinal(document.getElementById('comentario-serie-completa').value)
  });
  document.getElementById('btn-confirmar-serie-completa').textContent = 'Guardando...';
  google.script.run.withSuccessHandler(() => {
    document.getElementById('btn-confirmar-serie-completa').textContent = t('btn_save_full_series');
    document.getElementById('modal-serie-completa').style.display = 'none';
    serieCompletaPendiente = null;
    mostrarToastPersonalizado(userPrefs.lang === 'en' ? `Full series "${rec.titulo}" saved with average rating ${rec.calificacion.toFixed(1)}!` : `¡Serie completa "${rec.titulo}" guardada con promedio de ${rec.calificacion.toFixed(1)}!`);
    cargarRegistros();
  }).guardarRegistro(rec, estado.userEmail);
}
function verificarSugerenciaNuevoArtista(nombreArtista, fechaIni, posterDisco, calificacionDisco = 0) {
  if (!nombreArtista) return false;
  const nombreNorm = nombreArtista.trim().toLowerCase();
  if (!nombreNorm || nombreNorm === 'desconocido' || nombreNorm === 'artista' || nombreNorm === 'various artists') return false;
  const existe = estado.registros.some(r => {
    if (r.categoria !== 'Musica') return false;
    const esSubArt = r.subcategoria && (r.subcategoria === 'Artistas/Grupos' || r.subcategoria.includes('Artista'));
    return esSubArt && (r.titulo.toLowerCase() === nombreNorm || r.creador.toLowerCase() === nombreNorm);
  });
  if (!existe) {
    const califInit = Number(calificacionDisco) || 0;
    estado.artistaPendienteSugerido = {
      categoria: 'Musica',
      subcategoria: 'Artistas/Grupos',
      titulo: nombreArtista.trim(),
      subtitulo: '',
      creador: nombreArtista.trim(),
      anio: '',
      fechaInicio: fechaIni,
      fechaFin: 'Sin fecha',
      calificacion: califInit,
      comentario: '',
      poster: posterDisco || '',
      horas: '',
      esRewatch: false
    };
    const l = userPrefs.lang || 'es';
    const txtCalif = califInit > 0
      ? (l === 'en'
          ? `<div style="margin-top:6px; color:var(--accent); font-weight:700; display:flex; align-items:center; gap:4px;">${getHeroIcon("star", "", 14)} Initial average rating: ${califInit.toFixed(1)} / 5 (based on this album)</div>`
          : `<div style="margin-top:6px; color:var(--accent); font-weight:700; display:flex; align-items:center; gap:4px;">${getHeroIcon("star", "", 14)} Calificación promedio inicial: ${califInit.toFixed(1)} / 5 (basada en este disco)</div>`)
      : '';
    document.getElementById('msg-nuevo-artista').innerHTML = `
      ${l === 'en' ? `You have started listening to <strong>"${nombreArtista.trim()}"</strong>.` : `Has comenzado a escuchar a <strong>"${nombreArtista.trim()}"</strong>.`}
      <br>${l === 'en' ? `Do you want to start tracking them in <em>Artists/Bands</em>?` : `¿Deseas comenzar su seguimiento en <em>Artistas/Grupos</em>?`}
      ${txtCalif}
    `;
    document.getElementById('btn-confirmar-nuevo-artista').onclick = confirmarCreacionNuevoArtista;
    document.getElementById('modal-nuevo-artista').style.display = 'flex';
    return true;
  }
  return false;
}
function cerrarModalNuevoArtista() {
  document.getElementById('modal-nuevo-artista').style.display = 'none';
  estado.artistaPendienteSugerido = null;
  cargarRegistros();
}
function confirmarCreacionNuevoArtista() {
  if (!estado.artistaPendienteSugerido) return;
  const payload = Object.assign({}, estado.artistaPendienteSugerido);
  document.getElementById('btn-confirmar-nuevo-artista').innerHTML = `${tLang('Agregando...', 'Adding...')} <svg style="width:14px;height:14px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`;
  google.script.run.withSuccessHandler(() => {
    document.getElementById('btn-confirmar-nuevo-artista').textContent = tLang('Sí, comenzar registro', 'Yes, start tracking');
    document.getElementById('modal-nuevo-artista').style.display = 'none';
    estado.artistaPendienteSugerido = null;
    mostrarToastPersonalizado(userPrefs.lang === 'en' ? `Artist "${payload.titulo}" added with average rating ${Number(payload.calificacion).toFixed(1)}!` : `¡Artista "${payload.titulo}" añadido con promedio de ${Number(payload.calificacion).toFixed(1)}!`);
    cargarRegistros();
  }).guardarRegistro(payload, estado.userEmail);
}
function toggleEnProgresoFormulario(e) {
  const c = estado.categoria, s = estado.subcategoria;
  const admiteRango = subTieneRango(c, s);
  const chk = document.getElementById('chk-en-progreso');
  if (!chk) return;
  if (!admiteRango) {
    chk.checked = false;
    const boxP = document.getElementById('grupo-en-progreso');
    if (boxP) boxP.style.display = 'none';
    return;
  }
  if (e && e.target) {
    if (e.target.id === 'chk-en-progreso') {
      // El navegador ya cambió chk.checked
    } else if (e.target.tagName === 'LABEL' || e.target.closest('label')) {
      // El label cambia el checkbox nativamente
      return;
    } else if (e.target.closest('button')) {
      return;
    } else {
      chk.checked = !chk.checked;
    }
  }
  const isChecked = chk.checked;
  const inpFin = document.getElementById('input-fecha-fin');
  const textoProg = obtenerTextoEnProgreso(c, s) || 'Aún viendo';
  const box = document.querySelector('.en-progreso-box');

  if (isChecked) {
    const inpIni = document.getElementById('input-fecha-inicio');
    if (inpIni && (!inpIni.value || inpIni.value === 'Sin fecha')) {
      establecerFechaHoyInicio();
    }
    if (inpFin) {
      inpFin.value = textoProg;
    }
    const txtFin = document.getElementById('txt-fecha-fin');
    if (txtFin) {
      txtFin.textContent = textoProg;
      txtFin.classList.remove('is-placeholder');
    }
    const btnFin = document.getElementById('btn-trigger-fecha-fin');
    if (btnFin) btnFin.classList.add('disabled');
    if (box) {
      box.style.borderColor = 'var(--accent)';
      box.style.background = 'rgba(56,189,248,0.16)';
      box.style.boxShadow = '0 0 12px rgba(56,189,248,0.25)';
    }
  } else {
    if (inpFin) {
      if (esEnProgresoTexto(inpFin.value)) {
        inpFin.value = '';
      }
    }
    const txtFin = document.getElementById('txt-fecha-fin');
    if (txtFin && esEnProgresoTexto(txtFin.textContent)) {
      limpiarFechaCalendario('fin');
    }
    const btnFin = document.getElementById('btn-trigger-fecha-fin');
    if (btnFin) btnFin.classList.remove('disabled');
    if (box) {
      box.style.borderColor = 'rgba(56,189,248,0.3)';
      box.style.background = 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(99,102,241,0.08) 100%)';
      box.style.boxShadow = 'none';
    }
  }
}
function quickGuardarEnProgreso() {
  const chk = document.getElementById('chk-en-progreso');
  if (chk) {
    chk.checked = true;
    toggleEnProgresoFormulario();
  }
  guardarNuevoElemento();
}
function marcarComoEnProgreso(e) {
  toggleEnProgresoFormulario(e);
}
function guardarNuevoElemento() {
  if (!estado.userEmail) {
    abrirModalAuthSupabase('login');
    return alert(userPrefs.lang === 'en' ? 'Please sign in to save records in Supabase.' : 'Por favor inicia sesión en tu cuenta para guardar registros en Supabase.');
  }
  if (!estado.seleccionado) {
    const searchVal = document.getElementById('input-search')?.value?.trim();
    const formTitEl = document.getElementById('form-titulo');
    const formTitVal = formTitEl ? formTitEl.textContent.trim() : '';
    const titFinal = (formTitVal && formTitVal !== 'Título' && formTitVal !== 'Title') ? formTitVal : (searchVal || '');
    if (titFinal) {
      estado.seleccionado = {
        tituloOriginal: titFinal,
        titulo: titFinal,
        creador: 'Desconocido',
        anio: String(new Date().getFullYear()),
        poster: document.getElementById('form-poster')?.src || ''
      };
    }
  }
  if (!estado.seleccionado) return alert(userPrefs.lang === 'en' ? 'Please select an item first or fill in the information.' : 'Por favor selecciona primero un elemento o completa la información.');
  const c = estado.categoria, s = estado.subcategoria;
  let tTit = estado.seleccionado.tituloOriginal || estado.seleccionado.titulo || tLang('Sin título', 'Untitled'),
      sub = estado.seleccionado.tituloIngles || '',
      tBase = estado.seleccionado.tituloOriginal || estado.seleccionado.titulo || tLang('Sin título', 'Untitled');
let esUnica = false, esUltima = false, numT = 0, totT = estado.seleccionado.totalSeasons || 0;
if (c === 'Series' && (s === 'Temporadas' || s.includes('Temporada'))) {
  const n = document.getElementById('input-temporada-num').value.trim();
  numT = Number(n) || 1;
  tTit = `${estado.seleccionado.tituloOriginal} [${n ? 'S' + n : 'S1'}]`;
  const chkU = document.getElementById('chk-temporada-unica')?.checked;
  esUnica = !!chkU || (totT === 1 && numT <= 1);
  if (totT > 0 && numT >= totT && !esUnica) esUltima = true;
}
if (c === 'Lecturas' && (s === 'Cómics' || s === 'Cómic' || s === 'Mangas' || s === 'Manga')) { const a = document.getElementById('input-arco').value.trim(), num = document.getElementById('input-numeros-abarcados').value.trim(); if (a) tTit = `${estado.seleccionado.tituloOriginal}: ${a}`;
if (num) sub = `${estado.seleccionado.tituloOriginal} #${num}`; }
const sinF = document.getElementById('chk-no-fecha').checked; const fechasG = obtenerFechasParaGuardarNuevo(); const fI = fechasG.fI; let fF = fechasG.fF;
let calificacionNum = Number(estado.calificacion)||0;
let comentarioConPunto = asegurarPuntoFinal(document.getElementById('input-comentario').value);
const chkProgEl = document.getElementById('chk-en-progreso');
if (chkProgEl && chkProgEl.checked && subTieneRango(c, s)) {
  const pTxt = obtenerTextoEnProgreso(c, s);
  if (pTxt) {
    fF = pTxt;
    calificacionNum = 0;
    comentarioConPunto = '';
  }
} else if (!subTieneRango(c, s)) {
  fF = fI;
}
const esRw = subAdmiteRewatch(c, s) && document.getElementById('chk-es-rewatch').checked; const btn = document.getElementById('btn-guardar');
btn.innerHTML = `${tLang('Guardando...', 'Saving...')} <svg style="width:14px;height:14px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`; btn.disabled = true;
let horasGuardar = '';
if (c === 'Juegos' && document.getElementById('input-horas-jugadas').value.trim()) {
  horasGuardar = `${document.getElementById('input-horas-jugadas').value.trim()} hrs`;
} else if ((c === 'Peliculas' || c === 'Series') && estado.seleccionado.duracionHoras) {
  horasGuardar = `${estado.seleccionado.duracionHoras} hrs`;
}
const savedId = (typeof window.uuid_ === 'function' ? window.uuid_() : (typeof uuid_ === 'function' ? uuid_() : 'reg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)));
const payload = { id: savedId, categoria: c, subcategoria: s, titulo: tTit, tituloBase: tBase, subtitulo: sub,
creador: estado.seleccionado.creador, anio: estado.seleccionado.anio, fechaInicio: fI, fechaFin: fF, calificacion: calificacionNum, comentario: comentarioConPunto,
poster: estado.seleccionado.poster, horas: horasGuardar, esTemporadaUnica: esUnica, numTempActual: numT, totalTempOficiales: totT, esRewatch: esRw
};
estado.ultimoRegistroGuardadoId = savedId;
const esDiscoMusica = c === 'Musica' && (s === 'Discos' || s === 'Disco'); const nombreArtistaDisco = estado.seleccionado.creador;
const posterDisco = estado.seleccionado.poster; google.script.run.withSuccessHandler(res => { btn.textContent = t('btn_guardar'); btn.disabled = false; if (res?.exito) {
const finalId = res.id || savedId;
estado.ultimoRegistroGuardadoId = finalId;
ocultarFormulario(); limpiarModuloConcierto();
const secHist = document.getElementById('seccion-historial-contenido');
if (secHist && estado.categoria !== 'inicio' && estado.categoria !== 'listas') {
  secHist.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
if (res.removidoDeWatchlist) {
const remTit = res.tituloRemovido || tBase;
document.getElementById('msg-felicitacion-watchlist').innerHTML = tLang(
  `¡Felicidades! Acabas de completar <strong>"${remTit}"</strong>, que estaba anotado en tus pendientes.`,
  `Congratulations! You just completed <strong>"${remTit}"</strong>, which was on your pending list.`
); document.getElementById('modal-felicitaciones-watchlist').style.display = 'flex'; cargarWatchlist(); }
if (esUltima) {
  const prev = estado.registros.filter(r => r.categoria === 'Series' && (r.subcategoria === 'Temporadas' || r.subcategoria.includes('Temporada')) && (r.titulo.startsWith(tBase + ' [') || r.titulo === tBase));
  const valid = prev.filter(r => r.fechaInicio && r.fechaInicio !== 'Sin fecha').sort((a,b) => timestampDeFecha(a.fechaInicio) - timestampDeFecha(b.fechaInicio));

  // Detectar calificaciones de todas las temporadas y calcular su promedio
  const todasCalif = [];
  prev.forEach(r => {
    const cl = Number(r.calificacion);
    if (cl > 0) todasCalif.push(cl);
  });
  if (Number(payload.calificacion) > 0) {
    todasCalif.push(Number(payload.calificacion));
  }
  const promCalif = todasCalif.length ? Math.round((todasCalif.reduce((a, b) => a + b, 0) / todasCalif.length) * 10) / 10 : 0;

  abrirModalSerieCompleta(payload, valid.length ? valid[0].fechaInicio : fI, fF, esRw, promCalif, todasCalif.length);
} else if (esDiscoMusica && verificarSugerenciaNuevoArtista(nombreArtistaDisco, fI, posterDisco, calificacionNum)) {
  // Se abrió modal de nuevo artista con calificación del primer disco
} else if (esDiscoMusica) {
  recalcularYActualizarPromedioArtista(nombreArtistaDisco, payload).then(nuevoProm => {
    cargarRegistros();
    if (nuevoProm !== null) {
      mostrarToastPersonalizado(userPrefs.lang === 'en' ? `Album saved! Rating of ${nombreArtistaDisco} updated to average: ${nuevoProm.toFixed(1)}` : `¡Disco guardado! Calificación de ${nombreArtistaDisco} actualizada al promedio: ${nuevoProm.toFixed(1)}`);
    } else if (!res.removidoDeWatchlist) {
      mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Record saved in Supabase!' : '¡Registro guardado en Supabase!');
    }
  });
} else {
  cargarRegistros();
  if (!res.removidoDeWatchlist) mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Record saved in Supabase!' : '¡Registro guardado en Supabase!');
}
} else { alert((userPrefs.lang === 'en' ? 'Error saving: ' : 'Error al guardar: ') + (res?.error || (userPrefs.lang === 'en' ? 'Unknown' : 'Desconocido'))); }
}).withFailureHandler(err => {
  btn.textContent = t('btn_guardar');
  btn.disabled = false;
  alert((userPrefs.lang === 'en' ? 'Connection error: ' : 'Error de conexión: ') + (err?.message || err));
}).guardarRegistro(payload, estado.userEmail); }
function confirmarEliminar(id, tTit) { idParaEliminar = id; const reg = estado.registros.find(r => String(r.id) === String(id)); regParaEliminar = reg ? { titulo: reg.titulo, categoria: reg.categoria, subcategoria: reg.subcategoria, creador: reg.creador } : (tTit ? { titulo: tTit, categoria: estado.categoria } : null);
const nombreMostrar = (reg && reg.titulo) ? reg.titulo : (tTit || tLang('este registro', 'this record')); document.getElementById('confirm-eliminar-mensaje').innerHTML = tLang(`¿Estás seguro de que deseas eliminar permanentemente <strong>"${nombreMostrar}"</strong> del historial?`, `Are you sure you want to permanently delete <strong>"${nombreMostrar}"</strong> from your history?`);
document.getElementById('btn-confirmar-eliminar-si').onclick = ejecutarEliminacionDefinitiva; document.getElementById('modal-confirmar-eliminar').style.display = 'flex'; }
function cerrarModalEliminar() { document.getElementById('modal-confirmar-eliminar').style.display = 'none'; idParaEliminar = null; regParaEliminar = null; }
function ejecutarEliminacionDefinitiva() { if (!idParaEliminar && !regParaEliminar) return; const idTarget = idParaEliminar; const fallbackTarget = regParaEliminar;
const eliminadoCat = fallbackTarget ? fallbackTarget.categoria : '';
const eliminadoSub = fallbackTarget ? fallbackTarget.subcategoria : '';
const eliminadoCreador = fallbackTarget ? fallbackTarget.creador : '';
const eliminadoTit = fallbackTarget ? fallbackTarget.titulo : '';
const btn = document.getElementById('btn-confirmar-eliminar-si'), txt = btn.textContent; btn.textContent = tLang('Eliminando...', 'Deleting...'); btn.disabled = true; google.script.run.withSuccessHandler(res => { btn.textContent = txt; btn.disabled = false; cerrarModalEliminar(); if (res?.exito) {
estado.registros = estado.registros.filter(r => String(r.id) !== String(idTarget));
filtrarYMostrarHistorial();
cargarRegistros();
if (eliminadoCat === 'Musica' && (eliminadoSub === 'Discos' || eliminadoSub === 'Disco') && eliminadoCreador) {
  recalcularYActualizarPromedioArtista(eliminadoCreador).then(() => cargarRegistros());
} else if (eliminadoCat === 'Series' && (eliminadoSub === 'Temporadas' || eliminadoSub?.includes('Temporada'))) {
  const tBase = eliminadoTit ? eliminadoTit.replace(/\s*\[S\d+\]$/i, '') : '';
  recalcularYActualizarPromedioSerieCompleta(tBase).then(() => cargarRegistros());
}
mostrarToastPersonalizado(userPrefs.lang === 'en' ? '<svg style="width:15px;height:15px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg> Record successfully deleted' : '<svg style="width:15px;height:15px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg> Registro eliminado correctamente'); } else {
alert((userPrefs.lang === 'en' ? 'Could not delete record: ' : 'No se pudo eliminar el registro: ') + (res?.error || (userPrefs.lang === 'en' ? 'Try refreshing the app' : 'Intenta refrescar la aplicación'))); }
}).withFailureHandler(err => { btn.textContent = txt; btn.disabled = false; cerrarModalEliminar(); alert((userPrefs.lang === 'en' ? 'Connection error while deleting: ' : 'Error de conexión al eliminar: ') + (err?.message || err)); }).eliminarRegistro(idTarget, fallbackTarget, estado.userEmail); }
function renderEstrellasVisuales(val) {
  const num = typeof val === 'number' ? val : (parseFloat(String(val || '').replace(',', '.')) || 0);
  const rounded = Math.round(num * 2) / 2;
  let h = '<div class="rating-badge">';
  for (let i = 1; i <= 5; i++) {
    const isFull = rounded >= i;
    const isHalf = !isFull && (rounded >= i - 0.5);
    const cls = isFull ? 'full' : (isHalf ? 'half' : '');
    const icon = isHalf ? getHeroIcon('star-half', '', 13) : getHeroIcon('star', '', 13);
    h += `<span class="h-star ${cls}">${icon}</span>`;
  }
  return `${h} <span style="font-size:.78rem; color:var(--muted); margin-left:3px;">(${num.toFixed(1)})</span></div>`;
}

function desplazarHaciaRegistroGuardado(id) {
  if (!id) return;
  setTimeout(() => {
    const elFila = document.getElementById(`fila-${id}`);
    const elCard = document.getElementById(`card-${id}`);
    const target = (window.innerWidth <= 768 && elCard) ? elCard : (elFila || elCard);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.remove('row-highlighted');
      void target.offsetWidth;
      target.classList.add('row-highlighted');
      setTimeout(() => {
        target.classList.remove('row-highlighted');
      }, 3000);
      estado.ultimoRegistroGuardadoId = null;
    } else {
      const secHist = document.getElementById('seccion-historial-contenido');
      if (secHist && estado.categoria !== 'inicio' && estado.categoria !== 'listas' && estado.categoria !== 'discover' && estado.categoria !== 'amigos' && estado.categoria !== 'perfil') {
        secHist.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, 180);
}


function desglosarFechaParaCuadro(fechaStr) {
  if (!fechaStr || fechaStr === 'Sin fecha' || esEnProgresoTexto(fechaStr)) {
    return null;
  }
  const s = String(fechaStr).trim();
  const mDate = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mDate) {
    const dia = parseInt(mDate[1], 10);
    const mesIdx = parseInt(mDate[2], 10) - 1;
    const anio = mDate[3];
    return { dia: dia, mesIdx: mesIdx, anio: anio, clave: `${anio}-${String(mesIdx).padStart(2, '0')}`, raw: s };
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const dia = d.getDate();
    const mesIdx = d.getMonth();
    const anio = String(d.getFullYear());
    return { dia: dia, mesIdx: mesIdx, anio: anio, clave: `${anio}-${String(mesIdx).padStart(2, '0')}`, raw: s };
  }
  return { dia: s, mesIdx: -1, anio: '', clave: '', raw: s, esTextoLibre: true };
}

const MESES_ABR_HISTORIAL_ES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const MESES_ABR_HISTORIAL_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function obtenerNombreMesAbrHistorial(mesIdx) {
  const lista = (userPrefs.lang === 'en' ? MESES_ABR_HISTORIAL_EN : MESES_ABR_HISTORIAL_ES);
  return lista[mesIdx] || '';
}

function renderizarCuadroFecha(infoFecha, mostrarMes, mesRefAnio) {
  if (!infoFecha) {
    return `<div class="m-date-box m-date-box-empty"><span class="m-date-box-day">—</span></div>`;
  }
  if (infoFecha.esTextoLibre) {
    return `<div class="m-date-box m-date-box-text" title="${infoFecha.raw}"><span class="m-date-box-day" style="font-size:0.75rem;">${infoFecha.dia}</span></div>`;
  }
  if (mostrarMes && infoFecha.mesIdx >= 0) {
    const abr = obtenerNombreMesAbrHistorial(infoFecha.mesIdx);
    const textoMes = (mesRefAnio && infoFecha.anio && infoFecha.anio !== mesRefAnio)
      ? `${abr} '${infoFecha.anio.slice(2)}`
      : abr;
    return `<div class="m-date-box m-date-box-with-month" title="${infoFecha.raw}"><span class="m-date-box-month">${textoMes}</span><span class="m-date-box-day">${infoFecha.dia}</span></div>`;
  }
  return `<div class="m-date-box" title="${infoFecha.raw}"><span class="m-date-box-day">${infoFecha.dia}</span></div>`;
}


function obtenerOrdenHistorialActual() {
  return estado.ordenHistorial || userPrefs.ordenHistorial || 'asc';
}

function actualizarBotonOrdenHistorial() {
  const btn = document.getElementById('btn-toggle-orden');
  const txt = document.getElementById('txt-orden-historial');
  const ico = document.getElementById('ico-orden-historial');
  if (!btn) return;
  const ord = obtenerOrdenHistorialActual();
  const l = userPrefs.lang || 'es';
  const label = ord === 'desc'
    ? (l === 'en' ? 'Latest first' : 'Del último al primero')
    : (l === 'en' ? 'Oldest first' : 'Del primero al último');
  btn.title = label;
  btn.setAttribute('aria-label', label);
  if (txt) {
    txt.textContent = label;
    txt.style.display = 'none';
  }
  if (ord === 'desc') {
    if (ico) ico.innerHTML = `<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v10.5m0 0L13.5 15m3.75 4.5 3.75-4.5"/></svg>`;
    btn.classList.add('active');
  } else {
    if (ico) ico.innerHTML = `<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v10.5"/></svg>`;
    btn.classList.remove('active');
  }
}

function toggleOrdenHistorial() {
  const actual = obtenerOrdenHistorialActual();
  const nuevo = (actual === 'desc') ? 'asc' : 'desc';
  estado.ordenHistorial = nuevo;
  userPrefs.ordenHistorial = nuevo;
  if (typeof guardarPreferenciasUsuario === 'function') guardarPreferenciasUsuario();
  actualizarBotonOrdenHistorial();
  if (estado.registrosAmigoViendo) {
    filtrarYMostrarHistorialAmigo();
  } else {
    filtrarYMostrarHistorial();
  }
}

function generarBadgeLikesResenaHtml(regId) {
  if (typeof perfilUsuario === 'undefined' || !perfilUsuario?.preferencias?.likes_recibidos) return '';
  const lista = perfilUsuario.preferencias.likes_recibidos[String(regId)] || perfilUsuario.preferencias.likes_recibidos[regId];
  if (!Array.isArray(lista) || !lista.length) return '';
  const resolveFn = (typeof obtenerDatosAmigoPorEmail === 'function')
    ? obtenerDatosAmigoPorEmail
    : (em => ({ nickname: em.split('@')[0], avatar: '🦊', email: em }));
  const amigos = lista.map(em => resolveFn(em));
  if (!amigos.length) return '';
  const primerAmigo = amigos[0];
  const l = userPrefs.lang || 'es';
  const tooltip = amigos.length === 1
    ? (l === 'en' ? `${primerAmigo.nickname} liked your review` : `A ${primerAmigo.nickname} le ha gustado tu reseña`)
    : (l === 'en' ? `${amigos.map(a => a.nickname).join(', ')} liked your review` : `A ${amigos.map(a => a.nickname).join(', ')} les ha gustado tu reseña`);

  const avatarContent = (primerAmigo.avatar && (primerAmigo.avatar.startsWith('http') || primerAmigo.avatar.startsWith('data:')))
    ? `<img src="${primerAmigo.avatar}" alt="${primerAmigo.nickname}" class="review-like-avatar-img">`
    : `<span class="review-like-avatar-emoji">${primerAmigo.avatar || '🦊'}</span>`;

  const extraCount = amigos.length > 1 ? `<span class="review-like-extra-count">+${amigos.length - 1}</span>` : '';

  return ` <span class="review-like-avatar-badge" onclick="event.stopPropagation(); mostrarCuadroLikeAmigo('${regId}', event)" title="${tooltip}" aria-label="${tooltip}"><span class="review-like-avatar-inner">${avatarContent}<span class="review-like-heart-pin">${getHeroIcon('heart', '', 10)}</span></span>${extraCount}</span>`;
}
window.generarBadgeLikesResenaHtml = generarBadgeLikesResenaHtml;

function filtrarYMostrarHistorial() { const th = document.getElementById('thead-historial'), tb = document.getElementById('tbody-historial'), mBox = document.getElementById('mobile-history-cards');
tb.innerHTML = ''; mBox.innerHTML = ''; const c = estado.categoria, s = estado.subcategoria, r = subTieneRango(c, s), isJ = c === 'Juegos';
renderizarBannerRachaSubcategoria(c, s);
th.innerHTML = `<tr>${r ? `<th style="width:110px;">${t('table_th_fecha_ini')}</th><th style="width:110px;">${t('table_th_fecha_fin')}</th>` : `<th style="width:110px;">${t('table_th_fecha')}</th>`}${isJ ? `<th style="width:80px; text-align:center;">${t('table_th_horas')}</th>` : ''}<th>${obtenerNombreColumnaTitulo(c, s)}</th><th style="width:150px;">${t('table_th_calif')}</th><th>${t('table_th_comentario')}</th><th style="width:40px; text-align:center;"></th></tr>`;
let l = obtenerRegistrosDeSubcategoria(c, s); if (estado.ocultarRewatches && subAdmiteRewatch(c, s)) { l = l.filter(x => !x.esRewatch && !x.subcategoria.includes('Rewatch')); }
actualizarBotonOrdenHistorial();
if (typeof actualizarBotonFiltroRewatches === 'function') actualizarBotonFiltroRewatches();
const esDesc = obtenerOrdenHistorialActual() === 'desc';
l.sort((a, b) => {
  const enProgA = r && (esEnProgresoTexto(a.fechaFin) || (!a.fechaFin || a.fechaFin === 'Sin fecha' || a.fechaFin === ''));
  const enProgB = r && (esEnProgresoTexto(b.fechaFin) || (!b.fechaFin || b.fechaFin === 'Sin fecha' || b.fechaFin === ''));
  if (!enProgA && enProgB) return -1;
  if (enProgA && !enProgB) return 1;
  if (enProgA && enProgB) {
    const tsA = timestampDeFecha(a.fechaInicio);
    const tsB = timestampDeFecha(b.fechaInicio);
    if (!tsA && tsB) return 1;
    if (tsA && !tsB) return -1;
    const diff = esDesc ? (tsB - tsA) : (tsA - tsB);
    return diff !== 0 ? diff : (a.titulo || '').localeCompare(b.titulo || '');
  }
  const fA = (!r) ? a.fechaInicio : ((a.fechaFin && a.fechaFin !== 'Sin fecha' && !esEnProgresoTexto(a.fechaFin)) ? a.fechaFin : a.fechaInicio);
  const fB = (!r) ? b.fechaInicio : ((b.fechaFin && b.fechaFin !== 'Sin fecha' && !esEnProgresoTexto(b.fechaFin)) ? b.fechaFin : b.fechaInicio);
  const diff = esDesc ? (timestampDeFecha(fB) - timestampDeFecha(fA)) : (timestampDeFecha(fA) - timestampDeFecha(fB));
  return diff !== 0 ? diff : (a.titulo || '').localeCompare(b.titulo || '');
});
document.getElementById('total-filtro').textContent = l.length; const cols = (r ? 2 : 1) + (isJ ? 1 : 0) + 4; if (!l.length) { tb.innerHTML = `<tr><td colspan="${cols}" style="text-align:center; padding:24px; color:var(--muted);">${t('stat_sin_reg')}</td></tr>`;
mBox.innerHTML = `<div style="text-align:center; padding:24px; color:var(--muted); background:var(--card); border-radius:4px; border:1px solid var(--border);">${t('stat_sin_reg')}</div>`; return; }
const conteosMes = {}; l.forEach(reg => {
  const fI = sanitizarFechaFrontend(reg.fechaInicio), fF = sanitizarFechaFrontend(reg.fechaFin);
  const enProg = r && (esEnProgresoTexto(fF) || (!fF || fF === 'Sin fecha' || fF === ''));
  const fechaParaMes = (!r) ? fI : ((fF && fF !== 'Sin fecha' && !esEnProgresoTexto(fF)) ? fF : fI);
  const mKey = enProg ? 'EN_PROGRESO' : extraerMesClave(fechaParaMes).clave;
  conteosMes[mKey] = (conteosMes[mKey] || 0) + 1;
});
let mesClaveActual = ''; let mesParidad = 0; const tbFrag = document.createDocumentFragment(); const mBoxFrag = document.createDocumentFragment();
l.forEach(reg => {
  let fI = sanitizarFechaFrontend(reg.fechaInicio), fF = sanitizarFechaFrontend(reg.fechaFin);
  if (!r) {
    const fUnica = (fI && fI !== 'Sin fecha' && !esEnProgresoTexto(fI)) ? fI : ((fF && fF !== 'Sin fecha' && !esEnProgresoTexto(fF)) ? fF : 'Sin fecha');
    fI = fUnica;
    fF = fUnica;
  }
  const enProg = r && (esEnProgresoTexto(fF) || (!fF || fF === 'Sin fecha' || fF === ''));
  const titPrincipal = reg.tituloOriginal || reg.titulo || tLang('Sin título', 'Untitled');
  let titEn = (reg.subtitulo || reg.tituloIngles || '').trim();
  if (titEn.startsWith('(') && titEn.endsWith(')')) {
    titEn = titEn.slice(1, -1).trim();
  }
  const tieneTitEn = titEn && (titEn.toLowerCase() !== titPrincipal.toLowerCase()) && (titEn.toLowerCase() !== (reg.titulo || '').trim().toLowerCase());
  const titEnDesktopHtml = tieneTitEn ? `<div style="font-size:.8rem; color:var(--muted); margin-top:2px;">(${titEn})</div>` : '';
  const titEnMobileHtml = tieneTitEn ? `<div class="m-card-title-en">(${titEn})</div>` : '';

  const metaPartes = [];
  if (reg.creador && reg.creador !== '—' && reg.creador.trim() !== '' && reg.creador.toLowerCase() !== 'desconocido') {
    metaPartes.push(reg.creador.trim());
  }
  if (reg.anio && reg.anio !== '—' && String(reg.anio).trim() !== '') {
    metaPartes.push(String(reg.anio).trim());
  }
  const metaTexto = metaPartes.length ? `(${metaPartes.join(', ')})` : '';
  const meta = metaTexto || (reg.creador ? `(${reg.creador}${reg.anio ? ', ' + reg.anio : ''})` : '');

  const stars = enProg
    ? `<span style="color:var(--accent); font-size:0.8rem; font-weight:700; font-style:italic; display:inline-flex; align-items:center; gap:3px;">${getHeroIcon('clock', '', 12)} ${userPrefs.lang === 'en' ? 'Pending' : 'Pendiente'}</span>`
    : renderEstrellasVisuales(reg.calificacion);
  const com = enProg
    ? `<span style="color:var(--muted); font-size:0.8rem; font-style:italic; display:inline-flex; align-items:center; gap:4px;">${getHeroIcon('clock', '', 12)} ${userPrefs.lang === 'en' ? 'Pending' : 'Pendiente'}</span>`
    : (reg.comentario ? `"${reg.comentario}"` : '<span style="color:var(--border)">—</span>');
  const badgeRwHtml = reg.esRewatch ? `<span class="badge-rewatch"><svg style="width:13px;height:13px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg> ${t('badge_rewatch')}</span>` : '';
  const fFDisplay = enProg
    ? `<span class="badge-en-progreso" style="background:rgba(56,189,248,0.12); color:var(--accent); font-weight:700; padding:2px 8px; border-radius:2px; font-size:0.75rem; border:1px solid rgba(56,189,248,0.3); white-space:nowrap;display:inline-flex;align-items:center;gap:3px;">${getHeroIcon('clock', '', 12)} ${obtenerTextoEnProgreso(c, s) || tLang('Aún viendo', 'Still watching')}</span>`
    : fF;
  const fechaParaMes = (!r) ? fI : ((fF && fF !== 'Sin fecha' && !esEnProgresoTexto(fF)) ? fF : fI);
  const mesData = enProg
    ? { clave: 'EN_PROGRESO', mesNombre: (obtenerTextoEnProgreso(c, s) || (userPrefs.lang === 'en' ? 'In progress' : 'En curso')), anio: '' }
    : extraerMesClave(fechaParaMes);
  if (mesData.clave !== mesClaveActual) {
    mesClaveActual = mesData.clave; mesParidad = (mesParidad + 1) % 2; const count = conteosMes[mesData.clave] || 1;
    const emojiSeparador = enProg ? `<span class="emoji-dyn">${getHeroIcon('clock', '', 13)} </span>` : '';
    const textoMesSolo = enProg
      ? mesData.mesNombre
      : (mesData.clave === 'SIN_FECHA' ? t('stat_sin_fecha') : (estado.anioActivo === 'todos' && mesData.anio ? `${mesData.mesNombre} ${mesData.anio}` : mesData.mesNombre));
    const textoConteo = (mesData.clave === 'SIN_FECHA' && !count) ? '' : `(${count})`;
    const textoMesContador = `${textoMesSolo} ${textoConteo}`.trim();
    const sepTr = document.createElement('tr'); sepTr.className = 'month-separator-tr';
    sepTr.innerHTML = `<td colspan="${cols}" class="month-separator-td">${emojiSeparador}${textoMesContador}</td>`; tbFrag.appendChild(sepTr);
    const sepCard = document.createElement('div'); sepCard.className = 'month-separator-card';
    sepCard.innerHTML = `<span class="m-sep-label">${emojiSeparador}${textoMesSolo}</span><span class="m-sep-count">${textoConteo}</span>`; mBoxFrag.appendChild(sepCard);
  }
  const infoI = desglosarFechaParaCuadro(fI);
  const infoF = desglosarFechaParaCuadro(fF);
  const mesClaveFin = infoF ? infoF.clave : mesData.clave;
  const mesAnioFin = infoF ? infoF.anio : mesData.anio;
  const inicioMesDistinto = enProg
    ? (infoI && infoI.mesIdx >= 0)
    : (infoI && (infoF ? (infoI.clave !== infoF.clave) : (infoI.clave !== mesData.clave)));
  const cuadroI = renderizarCuadroFecha(infoI, inicioMesDistinto, mesAnioFin);
  const cuadroF = renderizarCuadroFecha(infoF, inicioMesDistinto, infoI ? infoI.anio : mesAnioFin);
  const fechasMobileHtml = r
    ? (enProg ? `${cuadroI}<span class="m-date-arrow">➔</span>${fFDisplay}` : `${cuadroI}<span class="m-date-arrow">➔</span>${cuadroF}`)
    : cuadroI;
  const tituloFechaHover = r ? `${fI} ➔ ${fF}` : fI;

  const claseColorMes = mesParidad === 0 ? 'row-month-even' : 'row-month-odd';
  const tr = document.createElement('tr'); tr.className = claseColorMes; tr.id = `fila-${reg.id}`;
  const tVerFichaFull = tLang('Ver ficha técnica completa', 'View full details');
  const tVerFicha = tLang('Ver ficha técnica', 'View details');
  const tEditarFull = tLang('Editar registro completo', 'Edit full record');
  const tEliminarReg = tLang('Eliminar registro', 'Delete record');
  const tEliminarShort = tLang('Eliminar', 'Delete');
  const badgeLikesHtml = generarBadgeLikesResenaHtml(reg.id);
  tr.innerHTML = ` ${r ? `<td><div class="editable-cell col-fecha" onclick="abrirEditorFecha('${reg.id}')" title="${fI}">${cuadroI}</div></td><td><div class="editable-cell col-fecha" onclick="abrirEditorFecha('${reg.id}')" title="${fF}">${enProg ? fFDisplay : cuadroF}</div></td>` : `<td><div class="editable-cell col-fecha" onclick="abrirEditorFecha('${reg.id}')" title="${fI}">${cuadroI}</div></td>`} ${isJ ? `<td><div class="editable-cell col-horas" onclick="abrirEditorHoras('${reg.id}')">${reg.horas || '—'}</div></td>` : ''} <td><div class="col-titulo-wrapper clickable-title" title="${tVerFichaFull}" onclick="abrirFichaTecnica('${reg.id}')"><img class="col-thumb" loading="lazy" decoding="async" src="${optimizarUrlPoster(reg.poster, 'thumb')||'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'36\' height=\'50\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>'}"><div><div class="col-main-title">${reg.titulo}${badgeRwHtml}</div>${titEnDesktopHtml}<div class="col-sub-meta">${meta}</div></div></div></td> <td><div class="editable-cell" onclick="abrirEditorCalificacion('${reg.id}')">${stars}</div></td> <td><div class="editable-cell col-comment" onclick="abrirEditorComentario('${reg.id}')">${com}${badgeLikesHtml}</div></td> <td style="text-align:center; white-space:nowrap;">${enProg ? `<button type="button" class="btn-terminar-badge" onclick="event.stopPropagation(); abrirModalTerminarObra('${reg.id}')" title="${userPrefs.lang === 'en' ? 'I finished it!' : '¡Ya lo terminé!'}" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:4px 10px; border-radius:2px; font-size:0.75rem; font-weight:700; cursor:pointer; margin-right:6px; box-shadow:0 2px 6px rgba(16,185,129,0.3); display:inline-flex; align-items:center; gap:3px;"><svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg> ${userPrefs.lang === 'en' ? 'I finished it!' : '¡Ya lo terminé!'}</button>` : ''}<button type="button" class="btn-delete" title="${tEditarFull}" style="margin-right:6px; color:var(--accent);" onclick="abrirEditorRegistroCompleto('${reg.id}')"><svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg></button><button type="button" class="btn-delete" title="${tEliminarReg}" onclick="confirmarEliminar('${reg.id}')"><svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18 18 6M6 6l12 12"/></svg></button></td>`;
  tbFrag.appendChild(tr);

  const m = document.createElement('div'); m.className = 'mobile-history-card'; m.id = `card-${reg.id}`;
  const tieneHoras = (isJ || reg.categoria === 'Juegos' || reg.horas) && reg.horas && reg.horas !== '—' && reg.horas !== '0' && String(reg.horas).trim() !== '';
  const horasHtml = tieneHoras
    ? `<div class="m-card-horas editable-cell" onclick="abrirEditorHoras('${reg.id}')" title="${tLang('Editar horas', 'Edit hours')}"><span class="emoji-dyn">${getHeroIcon('clock', '', 12)} </span>${reg.horas}</div>`
    : '';

  m.innerHTML = `
    <div class="m-card-actions-col">
      <button type="button" class="m-card-btn-action btn-m-delete" title="${tEliminarShort}" onclick="confirmarEliminar('${reg.id}')"><svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18 18 6M6 6l12 12"/></svg></button>
      <button type="button" class="m-card-btn-action btn-m-edit" title="${tEditarFull}" onclick="abrirEditorRegistroCompleto('${reg.id}')"><svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg></button>
    </div>
    <div class="m-card-top">
      <img class="m-card-thumb" loading="lazy" decoding="async" style="cursor:pointer;" title="${tVerFicha}" onclick="abrirFichaTecnica('${reg.id}')" src="${optimizarUrlPoster(reg.poster, 'thumb')||'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'72\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>'}">
      <div class="m-card-info">
        <div class="m-card-title" title="${tVerFicha}" onclick="abrirFichaTecnica('${reg.id}')">${reg.titulo}</div>
        ${titEnMobileHtml}
        ${meta ? `<div class="m-card-meta">${meta}</div>` : ''}
        <div class="m-card-date-row">
          <div class="m-card-dates editable-cell" onclick="abrirEditorFecha('${reg.id}')" title="${tituloFechaHover}">${fechasMobileHtml}</div>
          ${horasHtml}
          ${badgeRwHtml}
        </div>
      </div>
    </div>
    <div class="m-card-bottom">
      <div class="m-card-rating editable-cell" onclick="abrirEditorCalificacion('${reg.id}')">${stars}</div>
      <div class="m-card-comment editable-cell" onclick="abrirEditorComentario('${reg.id}')">${com}${badgeLikesHtml}</div>
    </div>
    ${enProg ? `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border);"><button type="button" class="btn-terminar-card" onclick="event.stopPropagation(); abrirModalTerminarObra('${reg.id}')" style="width:100%; height:38px; border:none; border-radius:3px; background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-weight:700; font-size:0.86rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 2px 8px rgba(16,185,129,0.3); transition:all 0.15s ease;"><span>${getHeroIcon('check', '', 14)}</span><span>${userPrefs.lang === 'en' ? 'I finished it!' : '¡Ya lo terminé!'}</span></button></div>` : ''}
  `;
  mBoxFrag.appendChild(m); }); tb.appendChild(tbFrag); mBox.appendChild(mBoxFrag); aplicarEstilosGlobales();
if (estado.ultimoRegistroGuardadoId) {
  desplazarHaciaRegistroGuardado(estado.ultimoRegistroGuardadoId);
}
}
const cerrarModal = () => { document.getElementById('modal-edicion').style.display = 'none'; document.getElementById('modal-contenido').innerHTML = ''; };
let califSeleccionadaTerminar = 5;
let regIdParaTerminar = null;
let fpTerminarFin = null;

function abrirModalTerminarObra(id) {
  try {
    const reg = (estado.registros || []).find(r => String(r.id) === String(id)) ||
                (estado.registros || []).find(r => String(r.titulo) === String(id));
    if (!reg) {
      console.warn('Registro no encontrado para terminar con id:', id);
      return;
    }
    if (!subTieneRango(reg.categoria, reg.subcategoria)) {
      console.warn('Esta subcategoría solo admite una única fecha y no puede quedar como pendiente.');
      return;
    }
    regIdParaTerminar = reg.id;
    const l = userPrefs.lang || 'es';

    const modalEl = document.getElementById('modal-terminar-obra');
    if (!modalEl) {
      console.error('Modal modal-terminar-obra no encontrado en el DOM');
      return;
    }

    const posterEl = document.getElementById('terminar-poster');
    if (posterEl) posterEl.src = reg.poster || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'42\' height=\'60\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>';

    const titEl = document.getElementById('terminar-titulo');
    if (titEl) titEl.textContent = reg.titulo || tLang('Sin título', 'Untitled');

    const crEl = document.getElementById('terminar-creador');
    if (crEl) crEl.textContent = (reg.creador || '') + (reg.anio ? ` (${reg.anio})` : '');

    const badgeEl = document.getElementById('terminar-subcat-badge');
    if (badgeEl) {
      const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(reg.categoria, reg.subcategoria) : null;
      const catLbl = (typeof traducirNombreCat === 'function') ? traducirNombreCat(reg.categoria) : reg.categoria;
      const subLbl = I18N[l]?.subs?.[reg.subcategoria] || reg.subcategoria;
      badgeEl.textContent = `${catLbl} → ${subLbl}${reg.fechaInicio && reg.fechaInicio !== 'Sin fecha' ? tLang(' | Inicio: ', ' | Start: ') + reg.fechaInicio : ''}`;
      if (metaCol) badgeEl.style.color = metaCol.colorVar;
    }

    const hoyStr = (typeof obtenerFechaHoyStr === 'function') ? obtenerFechaHoyStr() : `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
    const inputFin = document.getElementById('terminar-fecha-fin');
    if (inputFin) inputFin.value = hoyStr;

    if (fpTerminarFin) {
      try { fpTerminarFin.destroy(); } catch(e) {}
      fpTerminarFin = null;
    }
    if (window.flatpickr && inputFin) {
      try {
        fpTerminarFin = flatpickr(inputFin, {
          locale: (l === 'en' ? 'default' : 'es'),
          dateFormat: 'd/m/Y',
          defaultDate: hoyStr,
          allowInput: false,
          disableMobile: true
        });
      } catch(e) {
        console.warn('Flatpickr init warning:', e);
      }
    }

    califSeleccionadaTerminar = (Number(reg.calificacion) > 0) ? Number(reg.calificacion) : 5;
    const valCalifInp = document.getElementById('terminar-val-calif');
    if (valCalifInp) valCalifInp.value = califSeleccionadaTerminar;
    renderEstrellasTerminar(califSeleccionadaTerminar);

    const comEl = document.getElementById('terminar-comentario');
    if (comEl) comEl.value = (reg.comentario && reg.comentario !== '—') ? reg.comentario : '';

    const esSerie = (reg.categoria === 'Series' && (reg.subcategoria === 'Temporadas' || String(reg.subcategoria || '').includes('Temporada')));
    const grupoSerieUnica = document.getElementById('terminar-grupo-serie-unica');
    const chkSerieUnica = document.getElementById('chk-terminar-serie-unica');
    if (grupoSerieUnica && chkSerieUnica) {
      if (esSerie) {
        grupoSerieUnica.style.display = 'block';
        const tBase = reg.tituloBase || reg.titulo.replace(/\s*\[s\d+\]$/i, '').trim();
        const tNorm = tBase.toLowerCase();
        const otrasTemps = (estado.registros || []).filter(r => 
          r.categoria === 'Series' && 
          (r.subcategoria === 'Temporadas' || String(r.subcategoria || '').includes('Temporada')) &&
          String(r.id) !== String(reg.id) &&
          (String(r.titulo || '').toLowerCase().startsWith(tNorm + ' [') || String(r.titulo || '').toLowerCase() === tNorm)
        );
        chkSerieUnica.checked = (otrasTemps.length === 0);
      } else {
        grupoSerieUnica.style.display = 'none';
        chkSerieUnica.checked = false;
      }
    }

    const btnConfirm = document.getElementById('btn-guardar-terminar-obra');
    if (btnConfirm) {
      btnConfirm.innerHTML = l === 'en' ? '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg> Save & Finish!' : '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg> ¡Guardar y Finalizar!';
      btnConfirm.disabled = false;
    }

    modalEl.style.display = 'flex';
    setTimeout(() => {
      if (comEl) comEl.focus();
    }, 120);
  } catch (err) {
    console.error('Error al abrir modal terminar obra:', err);
  }
}

function cerrarModalTerminarObra() {
  const modalEl = document.getElementById('modal-terminar-obra');
  if (modalEl) modalEl.style.display = 'none';
  regIdParaTerminar = null;
}

function establecerFechaHoyTerminarModal() {
  const hoyStr = (typeof obtenerFechaHoyStr === 'function') ? obtenerFechaHoyStr() : `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
  const inp = document.getElementById('terminar-fecha-fin');
  if (inp) inp.value = hoyStr;
  if (fpTerminarFin) {
    try { fpTerminarFin.setDate(hoyStr, true); } catch(e) {}
  }
}

function renderEstrellasTerminar(val) {
  const num = typeof val === 'number' ? val : (parseFloat(String(val || '').replace(',', '.')) || 0);
  const rounded = Math.round(num * 2) / 2;
  const box = document.getElementById('terminar-stars-wrapper');
  if (!box) return;
  box.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const isFull = rounded >= i;
    const isHalf = !isFull && (rounded >= i - 0.5);
    const s = document.createElement('span');
    s.className = `star-box ${isFull ? 'full' : (isHalf ? 'half' : '')}`;
    s.innerHTML = isHalf ? getHeroIcon('star-half', '', 16) : getHeroIcon('star', '', 16);
    s.style.cursor = 'pointer';
    s.onmousemove = e => {
      const p = (e.clientX - s.getBoundingClientRect().left < s.getBoundingClientRect().width / 2) ? i - 0.5 : i;
      const rP = Math.round(p * 2) / 2;
      document.querySelectorAll('#terminar-stars-wrapper .star-box').forEach((st, idx) => {
        const isF = rP >= idx + 1;
        const isH = !isF && (rP >= idx + 0.5);
        st.className = `star-box ${isF ? 'full' : (isH ? 'half' : '')}`;
        st.innerHTML = isH ? getHeroIcon('star-half', '', 16) : getHeroIcon('star', '', 16);
      });
      const lbl = document.getElementById('terminar-rating-label');
      if (lbl) lbl.textContent = `${p.toFixed(1)} / 5`;
    };
    s.onclick = e => {
      const p = (e.clientX - s.getBoundingClientRect().left < s.getBoundingClientRect().width / 2) ? i - 0.5 : i;
      califSeleccionadaTerminar = p;
      const vEl = document.getElementById('terminar-val-calif');
      if (vEl) vEl.value = p;
      renderEstrellasTerminar(p);
    };
    box.appendChild(s);
  }
  box.onmouseleave = () => {
    renderEstrellasTerminar(califSeleccionadaTerminar);
  };
  const lbl = document.getElementById('terminar-rating-label');
  if (lbl) lbl.textContent = `${num.toFixed(1)} / 5`;
}

function confirmarTerminarObra() {
  if (!regIdParaTerminar) return;
  const reg = (estado.registros || []).find(r => String(r.id) === String(regIdParaTerminar));
  if (!reg) return;

  const btn = document.getElementById('btn-guardar-terminar-obra');
  const txtOrig = btn ? btn.textContent : '';
  if (btn) {
    btn.innerHTML = 'Guardando... <svg style="width:14px;height:14px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>';
    btn.disabled = true;
  }

  const l = userPrefs.lang || 'es';
  const fFinVal = sanitizarFechaFrontend(document.getElementById('terminar-fecha-fin')?.value?.trim()) || obtenerFechaHoyStr();
  const califVal = Number(califSeleccionadaTerminar) || 0;
  const comVal = asegurarPuntoFinal(document.getElementById('terminar-comentario')?.value?.trim() || '');
  const esSerieUnicaTerminar = (reg.categoria === 'Series' && (reg.subcategoria === 'Temporadas' || String(reg.subcategoria || '').includes('Temporada')) && !!document.getElementById('chk-terminar-serie-unica')?.checked);

  google.script.run.withSuccessHandler(res => {
    if (btn) {
      btn.textContent = txtOrig;
      btn.disabled = false;
    }
    cerrarModalTerminarObra();

    if (res && res.exito) {
      reg.fechaFin = fFinVal;
      reg.calificacion = califVal;
      reg.comentario = comVal;

      mostrarToastPersonalizado(l === 'en' ? '<svg style="width:16px;height:16px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/></svg> Congratulations! Entry completed.' : ' ¡Felicidades! Obra marcada como terminada.');

      // Si es serie de temporada única, guardar o actualizar automáticamente en Series Completas
      if (esSerieUnicaTerminar) {
        const tBase = reg.tituloBase || reg.titulo.replace(/\s*\[s\d+\]$/i, '').trim();
        const tNorm = tBase.toLowerCase();
        const serieCompReg = (estado.registros || []).find(r => 
          r.categoria === 'Series' && 
          (r.subcategoria === 'Series Completas' || String(r.subcategoria || '').includes('Completa')) &&
          String(r.titulo || '').trim().toLowerCase() === tNorm
        );
        if (serieCompReg) {
          serieCompReg.fechaInicio = reg.fechaInicio;
          serieCompReg.fechaFin = fFinVal;
          serieCompReg.calificacion = califVal;
          serieCompReg.comentario = comVal;
          google.script.run.actualizarRegistro(serieCompReg.id, {
            fechaInicio: reg.fechaInicio,
            fechaFin: fFinVal,
            calificacion: califVal,
            comentario: comVal
          }, estado.userEmail);
        } else {
          const payloadSerieComp = {
            categoria: 'Series',
            subcategoria: 'Series Completas',
            titulo: tBase,
            subtitulo: reg.subtitulo || '',
            creador: reg.creador || '',
            anio: reg.anio || '',
            fechaInicio: reg.fechaInicio || fFinVal,
            fechaFin: fFinVal,
            calificacion: califVal,
            comentario: comVal,
            poster: reg.poster || '',
            horas: reg.horas || '',
            esRewatch: !!reg.esRewatch
          };
          google.script.run.guardarRegistro(payloadSerieComp, estado.userEmail);
        }
      }

      if (typeof renderizarObrasEnProgresoInicio === 'function') {
        renderizarObrasEnProgresoInicio();
      }

      estado.ultimoRegistroGuardadoId = reg.id;
      filtrarYMostrarHistorial();
      desplazarHaciaRegistroGuardado(reg.id);

      // Recalcular promedios o serie completa si corresponde
      if (reg.categoria === 'Musica' && (reg.subcategoria === 'Discos' || reg.subcategoria === 'Disco') && reg.creador) {
        recalcularYActualizarPromedioArtista(reg.creador).then(() => {
          cargarRegistros();
        });
      } else if (reg.categoria === 'Series' && (reg.subcategoria === 'Temporadas' || reg.subcategoria?.includes('Temporada'))) {
        const tBase = reg.tituloBase || reg.titulo.replace(/\s*\[S\d+\]$/i, '').trim();
        recalcularYActualizarPromedioSerieCompleta(tBase).then(() => {
          cargarRegistros();
        });
      } else {
        cargarRegistros();
      }
    } else {
      alert((userPrefs.lang === 'en' ? 'Error updating record: ' : 'Error al actualizar registro: ') + (res?.error || (userPrefs.lang === 'en' ? 'Unknown' : 'Desconocido')));
    }
  }).withFailureHandler(err => {
    if (btn) {
      btn.textContent = txtOrig;
      btn.disabled = false;
    }
    alert((userPrefs.lang === 'en' ? 'Error saving: ' : 'Error al guardar: ') + (err?.message || err));
  }).actualizarRegistro(reg.id, { fechaFin: fFinVal, calificacion: califVal, comentario: comVal }, estado.userEmail);
}

function terminarHoyEnEditorCompleto() {
  const hoyStr = (typeof obtenerFechaHoyStr === 'function') ? obtenerFechaHoyStr() : `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
  const inp = document.getElementById('edit-compl-fecha-fin');
  if (inp) {
    inp.value = hoyStr;
  }
  if (fpComplFin) {
    try {
      fpComplFin.setDate(hoyStr, true);
    } catch(e) {}
  }
}

function terminarHoyEnEditorFecha() {
  const hoyStr = (typeof obtenerFechaHoyStr === 'function') ? obtenerFechaHoyStr() : `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
  const inp = document.getElementById('edit-fecha-fin');
  if (inp) {
    inp.value = hoyStr;
  }
  if (fpFinSimple) {
    try {
      fpFinSimple.setDate(hoyStr, true);
    } catch(e) {}
  }
}

window.abrirModalTerminarObra = abrirModalTerminarObra;
window.cerrarModalTerminarObra = cerrarModalTerminarObra;
window.establecerFechaHoyTerminarModal = establecerFechaHoyTerminarModal;
window.renderEstrellasTerminar = renderEstrellasTerminar;
window.confirmarTerminarObra = confirmarTerminarObra;
window.terminarHoyEnEditorCompleto = terminarHoyEnEditorCompleto;
window.terminarHoyEnEditorFecha = terminarHoyEnEditorFecha;
let fpComplFin = null;
let fpFinSimple = null;
function mostrarFechaFinEnEditorCompl() {
  const wrap = document.getElementById('wrap-edit-compl-fecha-fin');
  const btn = document.getElementById('btn-toggle-fin-compl');
  if (wrap) wrap.style.display = 'block';
  if (btn) btn.style.display = 'none';
  const l = userPrefs.lang || 'es';
  if (typeof flatpickr !== 'undefined' && !fpComplFin) {
    try {
      fpComplFin = flatpickr('#edit-compl-fecha-fin', { locale: (l === 'en' ? 'default' : 'es'), dateFormat: 'd/m/Y', allowInput: false, disableMobile: true });
    } catch (_) {}
  }
}
function mostrarFechaFinSimple() {
  const wrap = document.getElementById('wrap-edit-fecha-fin');
  const btn = document.getElementById('btn-toggle-fin-simple');
  if (wrap) wrap.style.display = 'block';
  if (btn) btn.style.display = 'none';
  const l = userPrefs.lang || 'es';
  if (typeof flatpickr !== 'undefined' && !fpFinSimple) {
    try {
      fpFinSimple = flatpickr('#edit-fecha-fin', { locale: (l === 'en' ? 'default' : 'es'), dateFormat: 'd/m/Y', allowInput: false, disableMobile: true });
    } catch (_) {}
  }
}
window.mostrarFechaFinEnEditorCompl = mostrarFechaFinEnEditorCompl;
window.mostrarFechaFinSimple = mostrarFechaFinSimple;
function abrirEditorRegistroCompleto(id) {
  const reg = estado.registros.find(r => r.id === id);
  if (!reg) return;
  const l = userPrefs.lang || 'es';
  const c = reg.categoria, s = reg.subcategoria;
  const admiteRango = subTieneRango(c, s);
  const enProg = admiteRango && esEnProgresoTexto(reg.fechaFin);
  let r = admiteRango;
  const isJ = c === 'Juegos';
  document.getElementById('modal-titulo').textContent = l === 'en' ? 'Edit Entry' : 'Editar Registro';
  let html = '<div style="display:flex;gap:12px;align-items:center;margin-bottom:14px;background:var(--bg);padding:10px;border-radius:4px;border:1px solid var(--border);">';
  html += '<img loading="lazy" decoding="async" src="' + (reg.poster || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'45\' height=\'65\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>') + '" style="width:45px;height:65px;object-fit:cover;border-radius:4px;background:#334155;flex-shrink:0;">';
  html += '<div><strong style="font-size:0.95rem;color:var(--text);display:block;">' + reg.titulo + '</strong>';
  html += '<span style="font-size:0.78rem;color:var(--muted);">' + (reg.creador || '') + (reg.anio ? ' (' + reg.anio + ')' : '') + '</span>';
  html += '<div style="font-size:0.72rem;color:var(--accent);font-weight:700;margin-top:2px;">' + c + ' → ' + s + '</div></div></div>';
  html += '<div class="form-group"><label style="font-size:.82rem;color:var(--muted);">' + (l === 'en' ? 'Rating:' : 'Calificación:') + '</label>';
  html += '<div class="stars-wrapper" id="edit-stars-completo" style="font-size:1.8rem;margin:4px 0;"></div>';
  html += '<input type="hidden" id="edit-val-calif" value="' + (reg.calificacion || 0) + '"></div>';
  html += '<div class="form-group"><div class="date-row" style="display:flex;gap:10px;">';
  html += '<div style="flex:1;"><label style="font-size:.82rem;color:var(--muted);">' + (r ? (l === 'en' ? 'Start date:' : 'Fecha de inicio:') : (l === 'en' ? 'Date:' : 'Fecha:')) + '</label>';
  html += '<input type="text" id="edit-compl-fecha-ini" class="form-input date-input" placeholder="dd/mm/aaaa" value="' + (reg.fechaInicio !== 'Sin fecha' ? reg.fechaInicio : '') + '"></div>';
  html += '<div id="wrap-edit-compl-fecha-fin" style="flex:1;' + (r ? '' : 'display:none;') + '"><label style="font-size:.82rem;color:var(--muted);display:flex;justify-content:space-between;align-items:center;"><span>' + (l === 'en' ? 'End date:' : 'Fecha de término:') + '</span>' + (enProg ? '<button type="button" class="btn-ghost" style="padding:2px 8px;font-size:0.72rem;color:var(--accent);border:1px solid rgba(56,189,248,0.3);border-radius:3px;background:rgba(56,189,248,0.08);cursor:pointer;" onclick="terminarHoyEnEditorCompleto()"><span style="display:inline-flex;align-items:center;gap:3px;">' + getHeroIcon('check', '', 12) + ' ' + (l === 'en' ? 'Finish today' : 'Terminar hoy') + '</span></button>' : '') + '</label>';
  html += '<input type="text" id="edit-compl-fecha-fin" class="form-input date-input" placeholder="' + (enProg ? reg.fechaFin : 'dd/mm/aaaa') + '" value="' + (reg.fechaFin && reg.fechaFin !== 'Sin fecha' && !enProg ? reg.fechaFin : '') + '"></div>';
  html += '</div>';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">';
  html += '<div class="checkbox-row" style="margin:0;"><input type="checkbox" id="edit-compl-sin-fecha" ' + (reg.fechaInicio === 'Sin fecha' ? 'checked' : '') + '>';
  html += '<label for="edit-compl-sin-fecha" style="font-size:0.8rem;color:var(--muted);">' + (l === 'en' ? 'No registered date' : 'No registrada / Sin fecha') + '</label></div>';
  if (admiteRango && !r) {
    html += '<button type="button" id="btn-toggle-fin-compl" class="btn-ghost" style="font-size:0.75rem;padding:3px 8px;color:var(--accent);" onclick="mostrarFechaFinEnEditorCompl()">+ ' + (l === 'en' ? 'Add end date' : 'Agregar fecha de término') + '</button>';
  }
  html += '</div></div>';
  const isVideo = (c === 'Peliculas' || c === 'Series');
  if (isJ || isVideo) {
    const lblHoras = isJ ? (l === 'en' ? 'Hours played:' : 'Horas jugadas:') : (l === 'en' ? 'Duration / Watched hours (hrs):' : 'Duración / Horas vistas (hrs):');
    const curH = parseFloat(String(reg.horas || '').replace('hrs','').trim()) || '';
    html += '<div class="form-group"><label style="font-size:.82rem;color:var(--muted);">' + lblHoras + '</label>';
    html += '<input type="number" step="0.1" id="edit-compl-horas" class="form-input" style="max-width:140px;" value="' + curH + '"></div>';
  }
  if (subAdmiteRewatch(c, s)) {
    html += '<div class="checkbox-row" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:4px;padding:8px 12px;margin-bottom:12px;">';
    html += '<input type="checkbox" id="edit-compl-rewatch" ' + (reg.esRewatch ? 'checked' : '') + '>';
    html += '<label for="edit-compl-rewatch" style="color:var(--text);font-weight:600;font-size:0.85rem;margin:0;display:inline-flex;align-items:center;gap:4px;">' + getHeroIcon('arrow-path', '', 13) + ' ' + (l === 'en' ? 'Rewatch / Reread' : 'Ya la he visto antes (Rewatch)') + '</label></div>';
  }
  html += '<div class="form-group"><label style="font-size:.82rem;color:var(--muted);">' + (l === 'en' ? 'Review / Thoughts:' : 'Comentario / Reseña:') + '</label>';
  html += '<textarea id="edit-compl-comentario" class="comment-box" style="min-height:80px;" placeholder="' + (l === 'en' ? 'Write your review...' : 'Escribe tu reseña...') + '">' + (reg.comentario || '') + '</textarea></div>';
  document.getElementById('modal-contenido').innerHTML = html;
  const renderEditStars = val => {
    const num = typeof val === 'number' ? val : (parseFloat(String(val || '').replace(',', '.')) || 0);
    const rounded = Math.round(num * 2) / 2;
    let sHtml = '';
    for (let i = 1; i <= 5; i++) {
      const isFull = rounded >= i;
      const isHalf = !isFull && (rounded >= i - 0.5);
      const cls = isFull ? 'full' : (isHalf ? 'half' : '');
      const icon = isHalf ? getHeroIcon('star-half', '', 16) : getHeroIcon('star', '', 16);
      sHtml += '<span class="star-box ' + cls + '" style="cursor:pointer;" onclick="const p = (event.clientX - this.getBoundingClientRect().left < this.getBoundingClientRect().width / 2) ? ' + (i - 0.5) + ' : ' + i + '; document.getElementById(\'edit-val-calif\').value = p; renderEditStars(p);">' + icon + '</span>';
    }
    document.getElementById('edit-stars-completo').innerHTML = sHtml;
  };
  window.renderEditStars = renderEditStars;
  const flatOpts = { locale: (l === 'en' ? 'default' : 'es'), dateFormat: 'd/m/Y', allowInput: false, disableMobile: true };
  if (typeof flatpickr !== 'undefined') {
    try {
      flatpickr('#edit-compl-fecha-ini', flatOpts);
      fpComplFin = flatpickr('#edit-compl-fecha-fin', flatOpts);
    } catch (_) {}
  }
  document.getElementById('btn-modal-confirmar').onclick = () => {
    const sinF = document.getElementById('edit-compl-sin-fecha').checked;
    const fI = sinF ? 'Sin fecha' : sanitizarFechaFrontend(document.getElementById('edit-compl-fecha-ini').value);
    let fF = fI;
    if (sinF) {
      fF = 'Sin fecha';
    } else if (!admiteRango) {
      fF = fI;
    } else {
      const wrapFin = document.getElementById('wrap-edit-compl-fecha-fin');
      const inputFin = document.getElementById('edit-compl-fecha-fin');
      if (wrapFin && wrapFin.style.display !== 'none' && inputFin && inputFin.value.trim()) {
        fF = sanitizarFechaFrontend(inputFin.value.trim());
      } else if (enProg && (!inputFin || !inputFin.value.trim())) {
        fF = reg.fechaFin;
      } else if (r && inputFin && inputFin.value.trim()) {
        fF = sanitizarFechaFrontend(inputFin.value.trim());
      }
    }
    const calif = Number(document.getElementById('edit-val-calif').value) || 0;
    const com = document.getElementById('edit-compl-comentario').value.trim();
    let horas = reg.horas || '';
    if (isJ || isVideo) {
      const hVal = document.getElementById('edit-compl-horas')?.value?.trim();
      if (hVal && !isNaN(Number(hVal))) horas = hVal + ' hrs';
      else if (hVal === '') horas = '';
    }
    const chkRw = document.getElementById('edit-compl-rewatch');
    const esRw = chkRw ? chkRw.checked : reg.esRewatch;
    cerrarModal();
    const btn = document.getElementById('btn-refresh');
    if (btn) btn.classList.add('spinning');
    google.script.run.withSuccessHandler(res => {
      if (btn) btn.classList.remove('spinning');
      if (res && res.exito) {
        mostrarToastPersonalizado(l === 'en' ? 'Entry updated successfully' : 'Registro actualizado correctamente');
        reg.fechaInicio = fI;
        reg.fechaFin = fF;
        reg.calificacion = calif;
        reg.comentario = com;
        reg.horas = horas;
        reg.esRewatch = esRw;
        estado.ultimoRegistroGuardadoId = reg.id;
        filtrarYMostrarHistorial();
        if (reg.categoria === 'Musica' && (reg.subcategoria === 'Discos' || reg.subcategoria === 'Disco') && reg.creador) {
          recalcularYActualizarPromedioArtista(reg.creador).then(() => {
            cargarRegistros();
            filtrarYMostrarHistorial();
          });
        } else if (reg.categoria === 'Series' && (reg.subcategoria === 'Temporadas' || reg.subcategoria.includes('Temporada'))) {
          const tBase = reg.tituloBase || reg.titulo.replace(/\s*\[S\d+\]$/i, '');
          recalcularYActualizarPromedioSerieCompleta(tBase).then(() => {
            cargarRegistros();
            filtrarYMostrarHistorial();
          });
        }
      } else {
        alert(res?.error || (userPrefs.lang === 'en' ? 'Error updating record' : 'Error al actualizar registro'));
      }
    }).actualizarRegistro(reg.id, { fechaInicio: fI, fechaFin: fF, calificacion: calif, comentario: com, horas: horas, esRewatch: esRw }, estado.userEmail);
  };
  document.getElementById('modal-edicion').style.display = 'flex';
}
let editPrecisionActual = 'dia';
function cambiarPrecisionEdicion(modo) {
  editPrecisionActual = modo;
  document.querySelectorAll('#edit-prec-tabs .date-prec-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `btn-edit-prec-${modo}`);
  });
  ['dia', 'semana', 'mes', 'anio'].forEach(w => {
    const el = document.getElementById(`wrap-edit-prec-${w}`);
    if (el) el.style.display = (w === modo) ? 'block' : 'none';
  });
}
function poblarSemanasEdicion() {
  const selAnio = document.getElementById('edit-sel-semana-anio');
  const selMes = document.getElementById('edit-sel-semana-mes');
  const selNum = document.getElementById('edit-sel-semana-num');
  if (!selAnio || !selMes || !selNum) return;
  const anio = parseInt(selAnio.value, 10) || obtenerAnioActualSistema();
  const mes = parseInt(selMes.value, 10) || 0;
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const mm = String(mes + 1).padStart(2, '0');
  selNum.innerHTML = '';
  const semanas = [
    { num: 1, ini: 1, fin: 7 },
    { num: 2, ini: 8, fin: 14 },
    { num: 3, ini: 15, fin: 21 },
    { num: 4, ini: 22, fin: 28 }
  ];
  if (totalDias > 28) semanas.push({ num: 5, ini: 29, fin: totalDias });
  semanas.forEach(s => {
    const dIni = String(s.ini).padStart(2, '0');
    const dFin = String(s.fin).padStart(2, '0');
    const label = `${tLang('Semana', 'Week')} ${s.num}: ${dIni}/${mm} ➔ ${dFin}/${mm}`;
    const value = `${dIni}/${mm}/${anio} ➔ ${dFin}/${mm}/${anio}`;
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    selNum.appendChild(opt);
  });
}
window.cambiarPrecisionEdicion = cambiarPrecisionEdicion;
window.poblarSemanasEdicion = poblarSemanasEdicion;

function abrirEditorFecha(id) {
  const reg = estado.registros.find(r => r.id === id);
  if (!reg) return;
  const l = userPrefs.lang || 'es';
  const admiteRango = subTieneRango(reg.categoria, reg.subcategoria);
  const enProg = admiteRango && esEnProgresoTexto(reg.fechaFin);
  let r = admiteRango;
  document.getElementById('modal-titulo').textContent = l === 'en' ? 'Edit Date' : 'Editar Fecha';
  const phFecha = tLang('dd/mm/aaaa', 'dd/mm/yyyy');
  
  let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
    <span style="font-size:0.8rem;color:var(--muted);font-weight:600;">${tLang('Precisión:', 'Precision:')}</span>
    <div class="date-precision-tabs" id="edit-prec-tabs">
      <button type="button" class="date-prec-btn active" id="btn-edit-prec-dia" onclick="cambiarPrecisionEdicion('dia')"><svg style="width:14px;height:14px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5"/></svg> ${tLang('Día', 'Day')}</button>
      <button type="button" class="date-prec-btn" id="btn-edit-prec-semana" onclick="cambiarPrecisionEdicion('semana')"><svg style="width:14px;height:14px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5"/></svg> ${tLang('Semana', 'Week')}</button>
      <button type="button" class="date-prec-btn" id="btn-edit-prec-mes" onclick="cambiarPrecisionEdicion('mes')"><svg style="width:14px;height:14px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg> ${tLang('Mes', 'Month')}</button>
      <button type="button" class="date-prec-btn" id="btn-edit-prec-anio" onclick="cambiarPrecisionEdicion('anio')"><svg style="width:14px;height:14px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5"/></svg> ${tLang('Año', 'Year')}</button>
    </div>
  </div>`;
  html += `<div id="wrap-edit-prec-dia">
    <div style="margin-bottom:12px;"><label style="font-size:.85rem; color:var(--muted);">${r ? t('lbl_fecha_ini') : t('lbl_fecha_vis')}</label><input type="text" id="edit-fecha-ini" class="form-input date-input" placeholder="${phFecha}" value="${(reg.fechaInicio !== 'Sin fecha' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(reg.fechaInicio)) ? reg.fechaInicio : ''}"></div>
    <div id="wrap-edit-fecha-fin" style="margin-bottom:12px;${r ? '' : 'display:none;'}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <label style="font-size:.85rem; color:var(--muted); margin:0;">${t('lbl_fecha_fin')}</label>
        ${enProg ? `<button type="button" class="btn-ghost" style="padding:2px 8px;font-size:0.72rem;color:var(--accent);border:1px solid rgba(56,189,248,0.3);border-radius:3px;background:rgba(56,189,248,0.08);cursor:pointer;" onclick="terminarHoyEnEditorFecha()">${getHeroIcon('check', '', 12)} ${l === 'en' ? 'Finish today' : 'Terminar hoy'}</button>` : ''}
      </div>
      <input type="text" id="edit-fecha-fin" class="form-input date-input" placeholder="${enProg ? (obtenerTextoEnProgreso(reg.categoria, reg.subcategoria) || reg.fechaFin) : phFecha}" value="${(reg.fechaFin && reg.fechaFin !== 'Sin fecha' && !enProg && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(reg.fechaFin)) ? reg.fechaFin : ''}">
    </div>
  </div>`;
  html += `<div id="wrap-edit-prec-semana" style="display:none;margin-bottom:12px;">
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <div style="flex:1;min-width:90px;"><label style="font-size:0.75rem;color:var(--muted);">${tLang('Año:', 'Year:')}</label><select id="edit-sel-semana-anio" class="form-input" style="height:38px;padding:4px 8px;" onchange="poblarSemanasEdicion()"></select></div>
      <div style="flex:1.2;min-width:110px;"><label style="font-size:0.75rem;color:var(--muted);">${tLang('Mes:', 'Month:')}</label><select id="edit-sel-semana-mes" class="form-input" style="height:38px;padding:4px 8px;" onchange="poblarSemanasEdicion()"></select></div>
      <div style="flex:1.8;min-width:160px;"><label style="font-size:0.75rem;color:var(--muted);">${tLang('Semana:', 'Week:')}</label><select id="edit-sel-semana-num" class="form-input" style="height:38px;padding:4px 8px;"></select></div>
    </div>
  </div>`;
  html += `<div id="wrap-edit-prec-mes" style="display:none;margin-bottom:12px;">
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <div style="flex:1.2;min-width:130px;"><label style="font-size:0.75rem;color:var(--muted);">${tLang('Mes:', 'Month:')}</label><select id="edit-sel-mes-nombre" class="form-input" style="height:38px;padding:4px 8px;"></select></div>
      <div style="flex:1;min-width:100px;"><label style="font-size:0.75rem;color:var(--muted);">${tLang('Año:', 'Year:')}</label><select id="edit-sel-mes-anio" class="form-input" style="height:38px;padding:4px 8px;"></select></div>
    </div>
  </div>`;
  html += `<div id="wrap-edit-prec-anio" style="display:none;margin-bottom:12px;">
    <label style="font-size:0.75rem;color:var(--muted);">${tLang('Año:', 'Year:')}</label><select id="edit-sel-solo-anio" class="form-input" style="height:38px;padding:4px 8px;max-width:160px;"></select>
  </div>`;

  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;"><div class="checkbox-row"><input type="checkbox" id="edit-sin-fecha" ${reg.fechaInicio === 'Sin fecha' ? 'checked' : ''}><label for="edit-sin-fecha">${t('chk_no_fecha')}</label></div>`;
  if (admiteRango && !r) {
    html += `<button type="button" id="btn-toggle-fin-simple" class="btn-ghost" style="font-size:0.75rem;padding:3px 8px;color:var(--accent);" onclick="mostrarFechaFinSimple()">+ ${l === 'en' ? 'Add end date' : 'Agregar fecha de término'}</button>`;
  }
  html += `</div>`;
  document.getElementById('modal-contenido').innerHTML = html;

  const anios = obtenerListaAniosFechaAproximada();
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mesesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const mesesDisp = l === 'en' ? mesesEn : meses;
  
  const editSemAnio = document.getElementById('edit-sel-semana-anio');
  const editSemMes = document.getElementById('edit-sel-semana-mes');
  if (editSemAnio && editSemMes) {
    editSemAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');
    editSemMes.innerHTML = mesesDisp.map((m, idx) => `<option value="${idx}">${m}</option>`).join('');
    poblarSemanasEdicion();
  }
  const editMesNom = document.getElementById('edit-sel-mes-nombre');
  const editMesAnio = document.getElementById('edit-sel-mes-anio');
  if (editMesNom && editMesAnio) {
    editMesNom.innerHTML = meses.map((m, idx) => `<option value="${m}">${mesesDisp[idx]}</option>`).join('');
    editMesAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');
  }
  const editSoloAnio = document.getElementById('edit-sel-solo-anio');
  if (editSoloAnio) {
    editSoloAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');
  }

  const fIniVal = String(reg.fechaInicio || '').trim();
  if (fIniVal.includes('➔') || fIniVal.startsWith('Semana')) {
    cambiarPrecisionEdicion('semana');
    const mY = fIniVal.match(/\b(20\d{2}|19\d{2})\b/);
    if (mY && editSemAnio) editSemAnio.value = mY[1];
    poblarSemanasEdicion();
    const selNum = document.getElementById('edit-sel-semana-num');
    if (selNum) selNum.value = fIniVal;
  } else if (/^[a-záéíóúñ]+\s+\d{4}$/i.test(fIniVal)) {
    cambiarPrecisionEdicion('mes');
    const parts = fIniVal.split(' ');
    if (parts.length === 2) {
      if (editMesNom) editMesNom.value = parts[0];
      if (editMesAnio) editMesAnio.value = parts[1];
    }
  } else if (/^\d{4}$/.test(fIniVal)) {
    cambiarPrecisionEdicion('anio');
    if (editSoloAnio) editSoloAnio.value = fIniVal;
  } else {
    cambiarPrecisionEdicion('dia');
  }

  const flatOpts = { locale: (l === 'en' ? 'default' : 'es'), dateFormat: 'd/m/Y', allowInput: false, disableMobile: true };
  if (typeof flatpickr !== 'undefined') {
    try {
      flatpickr('#edit-fecha-ini', flatOpts);
      fpFinSimple = flatpickr('#edit-fecha-fin', flatOpts);
    } catch (_) {}
  }

  document.getElementById('btn-modal-confirmar').onclick = () => {
    const sinF = document.getElementById('edit-sin-fecha').checked;
    let fI = 'Sin fecha', fF = 'Sin fecha';
    if (!sinF) {
      if (editPrecisionActual === 'semana') {
        const val = document.getElementById('edit-sel-semana-num')?.value || '';
        fI = fF = val || 'Sin fecha';
      } else if (editPrecisionActual === 'mes') {
        const m = document.getElementById('edit-sel-mes-nombre')?.value || '';
        const y = document.getElementById('edit-sel-mes-anio')?.value || String(obtenerAnioActualSistema());
        fI = fF = `${m} ${y}`.trim();
      } else if (editPrecisionActual === 'anio') {
        const y = document.getElementById('edit-sel-solo-anio')?.value || String(obtenerAnioActualSistema());
        fI = fF = y;
      } else {
        fI = sanitizarFechaFrontend(document.getElementById('edit-fecha-ini').value);
        if (!admiteRango) {
          fF = fI;
        } else {
          const wrapFin = document.getElementById('wrap-edit-fecha-fin');
          const inputFin = document.getElementById('edit-fecha-fin');
          fF = fI;
          if (wrapFin && wrapFin.style.display !== 'none' && inputFin && inputFin.value.trim()) {
            fF = sanitizarFechaFrontend(inputFin.value.trim());
          } else if (enProg && (!inputFin || !inputFin.value.trim())) {
            fF = reg.fechaFin;
          } else if (r && inputFin && inputFin.value.trim()) {
            fF = sanitizarFechaFrontend(inputFin.value.trim());
          }
        }
      }
    }
    cerrarModal();
    google.script.run.withSuccessHandler(res => {
      if (res.exito) {
        reg.fechaInicio = fI;
        reg.fechaFin = fF;
        filtrarYMostrarHistorial();
      }
    }).actualizarRegistro(id, { fechaInicio: fI, fechaFin: fF }, estado.userEmail);
  };
  document.getElementById('modal-edicion').style.display = 'flex';
}function abrirEditorHoras(id) { const reg = estado.registros.find(r => r.id === id); if (!reg) return;
const l = userPrefs.lang || 'es'; const isJ = reg.categoria === 'Juegos';
const titModal = isJ ? (l === 'en' ? 'Edit Hours Played' : 'Editar Horas Jugadas') : (l === 'en' ? 'Edit Watched Hours' : 'Editar Horas Vistas');
const lblModal = isJ ? t('lbl_horas') : (l === 'en' ? 'Duration / Watched hours (hrs):' : 'Duración / Horas vistas (hrs):');
document.getElementById('modal-titulo').textContent = titModal;
document.getElementById('modal-contenido').innerHTML = `<div style="margin-bottom:12px;"><label style="font-size:.85rem; color:var(--muted);">${lblModal}</label><input type="number" step="0.1" id="edit-horas-input" class="form-input" placeholder="${tLang('Ej: 2.5', 'e.g. 2.5')}" value="${(reg.horas||'').replace(' hrs','').trim()}" min="0.1"></div>`;
document.getElementById('btn-modal-confirmar').onclick = () => { const hVal = document.getElementById('edit-horas-input').value.trim(); cerrarModal(); google.script.run.withSuccessHandler(res => { if (res.exito) cargarRegistros(); }).actualizarRegistro(id, { horas: hVal ? `${hVal} hrs` : '' }, estado.userEmail);
}; document.getElementById('modal-edicion').style.display = 'flex'; }
function abrirEditorCalificacion(id) { const reg = estado.registros.find(r => r.id === id); if (!reg) return; const l = userPrefs.lang || 'es'; let tempCal = Number(reg.calificacion) || 0; document.getElementById('modal-titulo').textContent = l === 'en' ? 'Edit Rating' : 'Editar Calificación';
document.getElementById('modal-contenido').innerHTML = `<div style="text-align:center; padding:15px 0;"><div class="stars-wrapper" id="modal-rating-stars"></div><div id="modal-rating-label" style="font-size:1.15rem; color:var(--accent); margin-top:10px; font-weight:700;">${tempCal.toFixed(1)} / 5</div></div>`;
const render = val => {
  const num = typeof val === 'number' ? val : (parseFloat(String(val || '').replace(',', '.')) || 0);
  const rounded = Math.round(num * 2) / 2;
  const w = document.getElementById('modal-rating-stars');
  w.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const isFull = rounded >= i;
    const isHalf = !isFull && (rounded >= i - 0.5);
    const s = document.createElement('span');
    s.className = `star-box ${isFull ? 'full' : (isHalf ? 'half' : '')}`;
    s.innerHTML = isHalf ? getHeroIcon('star-half', '', 16) : getHeroIcon('star', '', 16);
    s.onmousemove = e => {
      const p = (e.clientX - s.getBoundingClientRect().left < s.getBoundingClientRect().width / 2) ? i - 0.5 : i;
      const rP = Math.round(p * 2) / 2;
      document.querySelectorAll('#modal-rating-stars .star-box').forEach((st, idx) => {
        const isF = rP >= idx + 1;
        const isH = !isF && (rP >= idx + 0.5);
        st.className = `star-box ${isF ? 'full' : (isH ? 'half' : '')}`;
        st.innerHTML = isH ? getHeroIcon('star-half', '', 16) : getHeroIcon('star', '', 16);
      });
      document.getElementById('modal-rating-label').textContent = `${p.toFixed(1)} / 5`;
    };
    s.onclick = e => {
      tempCal = (e.clientX - s.getBoundingClientRect().left < s.getBoundingClientRect().width / 2) ? i - 0.5 : i;
      render(tempCal);
    };
    w.appendChild(s);
  }
  document.getElementById('modal-rating-label').textContent = `${num.toFixed(1)} / 5`;
}; render(tempCal); document.getElementById('modal-rating-stars').onmouseleave = () => render(tempCal); document.getElementById('btn-modal-confirmar').onclick = () => {
  cerrarModal();
  google.script.run.withSuccessHandler(res => {
    if (res.exito) {
      reg.calificacion = tempCal;
      if (reg.categoria === 'Musica' && (reg.subcategoria === 'Discos' || reg.subcategoria === 'Disco') && reg.creador) {
        recalcularYActualizarPromedioArtista(reg.creador).then(() => {
          cargarRegistros();
          filtrarYMostrarHistorial();
        });
      } else if (reg.categoria === 'Series' && (reg.subcategoria === 'Temporadas' || reg.subcategoria.includes('Temporada'))) {
        const tBase = reg.tituloBase || reg.titulo.replace(/\s*\[S\d+\]$/i, '');
        recalcularYActualizarPromedioSerieCompleta(tBase).then(() => {
          cargarRegistros();
          filtrarYMostrarHistorial();
        });
      } else {
        cargarRegistros();
      }
    }
  }).actualizarRegistro(id, { calificacion: tempCal }, estado.userEmail);
}; document.getElementById('modal-edicion').style.display = 'flex'; }
function abrirEditorComentario(id) { const reg = estado.registros.find(r => r.id === id); if (!reg) return; const l = userPrefs.lang || 'es'; document.getElementById('modal-titulo').textContent = l === 'en' ? 'Edit Review' : 'Editar Comentario';
document.getElementById('modal-contenido').innerHTML = `<div><textarea id="edit-comentario-txt" class="comment-box" style="min-height:110px;" placeholder="${l === 'en' ? 'Write your review...' : 'Escribe tu reseña...'}">${reg.comentario || ''}</textarea></div>`;
document.getElementById('btn-modal-confirmar').onclick = () => { const nCom = asegurarPuntoFinal(document.getElementById('edit-comentario-txt').value); cerrarModal(); google.script.run .withSuccessHandler(res => { if (res.exito) cargarRegistros(); }) .actualizarRegistro(id, { comentario: nCom }, estado.userEmail); };
document.getElementById('modal-edicion').style.display = 'flex'; }

// === AUTO-CIERRE AL TOCAR FUERA Y RE-APERTURA INTELIGENTE DE BUSCADORES ===
let eventosBuscadoresInicializados = false;
function inicializarEventosBuscadores() {
  if (eventosBuscadoresInicializados) return;
  eventosBuscadoresInicializados = true;
  const manejarCierreFuera = e => {
    // 1. Buscador general de categorÃ­as / subcategorÃ­as / watchlists
    const resGen = document.getElementById('search-results');
    if (resGen && resGen.style.display !== 'none') {
      if (!e.target.closest('.search-box')) {
        resGen.style.display = 'none';
        // Deja intacto lo que el usuario haya escrito en input-search
      }
    }
    // 2. Buscador de artistas en mÃ³dulo de conciertos
    const resArt = document.getElementById('search-results-artistas');
    if (resArt && resArt.style.display !== 'none') {
      const contArt = document.getElementById('input-buscar-artista-concierto')?.closest('.form-group');
      if (!e.target.closest('#search-results-artistas') && !e.target.closest('#input-buscar-artista-concierto') && !(contArt && contArt.contains(e.target))) {
        resArt.style.display = 'none';
        // Deja intacto lo que el usuario haya escrito en input-buscar-artista-concierto
      }
    }
    // 3. Buscador en vista dedicada de watchlists
    const resWl = document.getElementById('search-results-wl');
    if (resWl && resWl.style.display !== 'none') {
      if (!e.target.closest('#box-buscador-wl')) {
        resWl.style.display = 'none';
      }
    }
    // 4. Menú desplegable selector de año
    const contYear = document.querySelector('.year-picker-container');
    if (contYear && !contYear.contains(e.target)) {
      cerrarMenuAniosApp();
    }
    // 5. Menús desplegables de tipo de fecha
    if (!e.target.closest('.custom-date-type-dropdown')) {
      document.querySelectorAll('.date-type-dropdown-menu').forEach(m => m.style.display = 'none');
      document.querySelectorAll('.btn-tipo-fecha-integrated').forEach(b => b.classList.remove('open'));
    }
  };
  document.addEventListener('click', manejarCierreFuera);
  document.addEventListener('touchstart', manejarCierreFuera, { passive: true });

  const inSearch = document.getElementById('input-search');
  if (inSearch) {
    inSearch.addEventListener('focus', () => {
      const v = inSearch.value.trim();
      if (v.length >= 2) buscarEnVivo(v);
    });
  }
  const inSearchWl = document.getElementById('input-search-wl');
  if (inSearchWl) {
    inSearchWl.addEventListener('focus', () => {
      const v = inSearchWl.value.trim();
      if (v.length >= 2) buscarEnVivoWl(v);
    });
  }
  const inArt = document.getElementById('input-buscar-artista-concierto');
  if (inArt) {
    inArt.addEventListener('focus', () => {
      const v = inArt.value.trim();
      if (v.length >= 2) buscarArtistaEnVivoConcierto(v);
    });
  }
}
