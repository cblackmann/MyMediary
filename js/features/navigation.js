/* Mediary — js/features/navigation.js */
function asegurarPuntoFinal(str) { if (!str) return ''; const s = str.trim(); if (!s) return ''; if (!/[.!?:;]$/.test(s)) return `${s}.`; return s; }
function actualizarNavWebActiva() { const c = estado.categoria, s = estado.subcategoria, enWl = !!CONFIG[c] && esSubcategoriaWatchlist(s); document.querySelectorAll('.nav-sec-btn').forEach(b => b.classList.remove('active'));
document.querySelectorAll('.nav-cat-card').forEach(b => b.classList.toggle('active', b.dataset.cat === c)); if (c === 'inicio') document.getElementById('tab-btn-inicio')?.classList.add('active'); else if (c === 'listas') document.getElementById('tab-btn-listas-ext')?.classList.add('active'); else if (c === 'discover') document.getElementById('tab-btn-discover')?.classList.add('active');
else if (c === 'amigos') document.getElementById('tab-btn-amigos')?.classList.add('active'); else if (c === 'perfil') document.getElementById('tab-btn-perfil')?.classList.add('active'); else if (c === 'watchlists' || enWl) document.getElementById('tab-btn-listas')?.classList.add('active');
document.getElementById('home-fab-calendario')?.classList.toggle('active', c === 'calendario');
document.getElementById('btn-header-calendario')?.classList.toggle('active', c === 'calendario'); }
function abrirVistaPerfil(pushNav = true) {
  try {
    if (pushNav) registrarNavegacionApp('perfil');
    guardarEstadoNavegacionActual('perfil', '');
    resetearBuscadoresYFormularios();
    estado.categoria = 'perfil';
    actualizarBarraNavegacionMovil('m-btn-perfil');
    actualizarNavWebActiva();
    const vIni = document.getElementById('vista-inicio'); if (vIni) vIni.style.display = 'none';
    const vCat = document.getElementById('vista-categoria'); if (vCat) vCat.style.display = 'none';
    const vDis = document.getElementById('vista-discover'); if (vDis) vDis.style.display = 'none';
    const vAm = document.getElementById('vista-amigos'); if (vAm) vAm.style.display = 'none';
    const vWl = document.getElementById('vista-watchlists'); if (vWl) vWl.style.display = 'none';
    const vList = document.getElementById('vista-listas-extendida'); if (vList) vList.style.display = 'none';
    const vCal = document.getElementById('vista-calendario'); if (vCal) vCal.style.display = 'none';
    const vAmPerf = document.getElementById('vista-perfil-amigo'); if (vAmPerf) vAmPerf.style.display = 'none';
    const vAmRegs = document.getElementById('vista-registros-amigo'); if (vAmRegs) vAmRegs.style.display = 'none';
    const vPer = document.getElementById('vista-perfil'); if (vPer) vPer.style.display = 'block';
    if (typeof animarCambioTabVista === 'function') animarCambioTabVista('perfil');
    renderizarCabeceraPerfil();
    renderizarFavoritosPerfil();
    if (typeof renderizarCancionFavorita === 'function') renderizarCancionFavorita();
    if (typeof renderizarPersonajeFavorito === 'function') renderizarPersonajeFavorito();
        calcularYMostrarEstadisticasPerfil();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error('Error al abrir vista perfil:', err);
  }
}
function abrirModalPerfil() { abrirVistaPerfil(); }
function esSubcategoriaEnProgresoPermitida(cat, sub) {
  return subTieneRango(cat, sub) && obtenerTextoEnProgreso(cat, sub) !== null;
}
function subAdmiteRewatch(c, s) { return !!CONFIG[c]?.subs?.find(x => x.id === s)?.admiteRewatch; }
function obtenerFechaHoyStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
window.obtenerFechaHoyStr = obtenerFechaHoyStr;

function fmtFechaGlobal(v) {
  if (!v || v === 'Sin fecha' || v === '' || v === 'undefined') return 'Sin fecha';
  if (v instanceof Date) return `${String(v.getDate()).padStart(2, '0')}/${String(v.getMonth() + 1).padStart(2, '0')}/${v.getFullYear()}`;
  const s = String(v).trim();
  if (s === 'Sin fecha') return 'Sin fecha';
  if (typeof esEnProgresoTexto === 'function' && esEnProgresoTexto(s)) return s;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) { const p = s.split('/'); return `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[2]}`; }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const p = s.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }
  if (s.includes('➔') || s.includes(' - ') || s.startsWith('Semana') || /^[a-záéíóúñ]+\s+\d{4}$/i.test(s) || /^\d{4}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
window.fmtFecha_ = window.fmtFecha_ || fmtFechaGlobal;
if (typeof fmtFecha_ === 'undefined') {
  var fmtFecha_ = window.fmtFecha_;
}
function sanitizarFechaFrontend(v) { if (!v || v === 'Sin fecha' || v === 'undefined') return 'Sin fecha'; const s = String(v).trim();
if (esEnProgresoTexto(s)) return s;
if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s; if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) { const p = s.split('/');
return `${p[0].padStart(2,'0')}/${p[1].padStart(2,'0')}/${p[2]}`; }
if (s.includes('➔') || s.includes(' - ') || s.startsWith('Semana') || /^[a-záéíóúñ]+\s+\d{4}$/i.test(s) || /^\d{4}$/.test(s)) return s;
const d = new Date(s); return isNaN(d.getTime()) ? s : `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }
const NOMBRES_MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const NOMBRES_MESES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
window.NOMBRES_MESES_ES = NOMBRES_MESES_ES;
window.NOMBRES_MESES_EN = NOMBRES_MESES_EN;
const timestampDeFecha = v => {
  if (!v || v === 'Sin fecha' || esEnProgresoTexto(v)) return 0;
  const s = String(v).trim();
  const mDate = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mDate) return new Date(Number(mDate[3]), Number(mDate[2]) - 1, Number(mDate[1])).getTime();
  for (let idx = 0; idx < 12; idx++) {
    const es = NOMBRES_MESES_ES[idx].toLowerCase();
    const en = NOMBRES_MESES_EN[idx].toLowerCase();
    const sLower = s.toLowerCase();
    if (sLower.includes(es) || sLower.includes(en)) {
      const mAnio = s.match(/\b(20\d{2}|19\d{2})\b/);
      const anio = mAnio ? Number(mAnio[1]) : 2026;
      return new Date(anio, idx, 15).getTime();
    }
  }
  const mYearOnly = s.match(/\b(20\d{2}|19\d{2})\b/);
  if (mYearOnly) return new Date(Number(mYearOnly[1]), 5, 15).getTime();
  return new Date(s).getTime() || 0;
};
function extraerMesClave(fechaStr) {
  if (!fechaStr || fechaStr === 'Sin fecha') return { clave: 'SIN_FECHA', mesNombre: t('stat_sin_fecha'), anio: '' };
  const s = String(fechaStr).trim();
  const lang = userPrefs.lang || 'es';
  const mesesLista = I18N[lang]?.meses || NOMBRES_MESES_ES;
  const mDate = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mDate) {
    const mIdx = parseInt(mDate[2], 10) - 1;
    const anio = mDate[3];
    const mesNom = mesesLista[mIdx] || NOMBRES_MESES_ES[mIdx] || 'Mes';
    return { clave: `${anio}-${String(mIdx).padStart(2, '0')}`, mesNombre: mesNom, anio: anio };
  }
  for (let idx = 0; idx < 12; idx++) {
    const es = NOMBRES_MESES_ES[idx].toLowerCase();
    const en = NOMBRES_MESES_EN[idx].toLowerCase();
    const sLower = s.toLowerCase();
    if (sLower.includes(es) || sLower.includes(en)) {
      const mAnio = s.match(/\b(20\d{2}|19\d{2})\b/);
      const anio = mAnio ? mAnio[1] : '';
      const mesNom = mesesLista[idx] || NOMBRES_MESES_ES[idx];
      return { clave: `${anio}-${String(idx).padStart(2, '0')}`, mesNombre: mesNom, anio: anio };
    }
  }
  const mYearOnly = s.match(/\b(20\d{2}|19\d{2})\b/);
  if (mYearOnly) {
    const anio = mYearOnly[1];
    return { clave: `${anio}-YEAR`, mesNombre: anio, anio: anio };
  }
  return { clave: 'OTRO', mesNombre: 'Otras fechas', anio: '' };
}
function obtenerNombreColumnaTitulo(c, s) { const l = userPrefs.lang || 'es'; return (CONFIG[c]?.emoji ? (CONFIG[c].emoji + ' ') : '') + (I18N[l]?.subs?.[s] || s); }
let appNavHistory = ['inicio'];
let isHandlingPopState = false;

function guardarEstadoNavegacionActual(cat, sub) {
  try {
    const c = cat || (typeof estado !== 'undefined' && estado ? estado.categoria : 'inicio');
    const s = (sub !== undefined && sub !== null && sub !== '') ? sub : ((typeof estado !== 'undefined' && estado) ? (estado.subcategoria || '') : '');
    sessionStorage.setItem('mediary_pestana_sesion_activa', JSON.stringify({ cat: c, sub: s }));
  } catch (e) {}
}

function restaurarPestanaGuardada() {
  try {
    try { localStorage.removeItem('mediary_ultima_pestana_activa'); } catch (e) {}
    const raw = sessionStorage.getItem('mediary_pestana_sesion_activa');
    if (!raw) return false;
    const { cat, sub } = JSON.parse(raw);
    if (!cat || cat === 'inicio') return false;

    if (cat === 'listas') {
      if (typeof abrirVistaDashboardListas === 'function') {
        abrirVistaDashboardListas(false);
        return true;
      }
    } else if (cat === 'calendario') {
      if (typeof abrirVistaCalendario === 'function') {
        abrirVistaCalendario(false);
        return true;
      }
    } else if (cat === 'amigos') {
      if (typeof abrirVistaAmigos === 'function') {
        abrirVistaAmigos(false);
        return true;
      }
    } else if (cat === 'perfil') {
      if (typeof abrirVistaPerfil === 'function') {
        abrirVistaPerfil(false);
        return true;
      }
    } else if (cat === 'watchlists') {
      if (typeof abrirMenuWatchlistGlobal === 'function') {
        abrirMenuWatchlistGlobal(false);
        return true;
      }
    } else if (cat === 'discover') {
      if (typeof abrirVistaDiscover === 'function') {
        abrirVistaDiscover(false);
        return true;
      }
    } else if (cat === 'amigo-perfil') {
      if (typeof abrirVistaPerfilAmigo === 'function' && sub) {
        abrirVistaPerfilAmigo(sub, false);
        return true;
      }
    } else if (cat === 'amigo-registros') {
      if (typeof abrirVistaRegistrosAmigo === 'function' && sub) {
        abrirVistaRegistrosAmigo(sub, null, 'todas', 'todas', false);
        return true;
      }
    } else if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG[cat]) {
      if (typeof cambiarCat === 'function') {
        cambiarCat(cat, sub || null, false);
        return true;
      }
    }
  } catch (e) {
    console.error('Error al restaurar pestaña guardada:', e);
  }
  return false;
}

function registrarNavegacionApp(destino) {
  if (isHandlingPopState) return;
  const actual = appNavHistory[appNavHistory.length - 1];
  if (actual !== destino) {
    appNavHistory.push(destino);
    try { history.pushState({ appView: destino, depth: appNavHistory.length }, '', ''); } catch (e) {}
  }
}
function obtenerElementoVistaActual() {
  const ids = [
    'vista-registros-amigo',
    'vista-perfil-amigo',
    'vista-calendario',
    'vista-watchlists',
    'vista-listas-extendida',
    'vista-categoria',
    'vista-amigos',
    'vista-perfil',
    'vista-discover',
    'vista-inicio'
  ];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el && el.style.display !== 'none' && el.style.display !== '') {
      return el;
    }
  }
  return null;
}
window.obtenerElementoVistaActual = obtenerElementoVistaActual;

function obtenerElementoVistaDestino(vista) {
  if (vista === 'inicio') return document.getElementById('vista-inicio');
  if (vista === 'listas') return document.getElementById('vista-listas-extendida');
  if (vista === 'calendario') return document.getElementById('vista-calendario');
  if (vista === 'watchlists') return document.getElementById('vista-watchlists');
  if (vista === 'amigos') return document.getElementById('vista-amigos');
  if (vista === 'perfil') return document.getElementById('vista-perfil');
  if (vista === 'discover') return document.getElementById('vista-discover');
  if (vista === 'amigo-perfil') return document.getElementById('vista-perfil-amigo');
  if (vista === 'amigo-registros') return document.getElementById('vista-registros-amigo');
  if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG[vista]) return document.getElementById('vista-categoria');
  return document.getElementById('vista-inicio');
}
window.obtenerElementoVistaDestino = obtenerElementoVistaDestino;

function ejecutarCambioVista(vista) {
  if (vista === 'inicio') irInicio(false);
  else if (vista === 'listas') abrirVistaDashboardListas(false);
  else if (vista === 'calendario') abrirVistaCalendario(false);
  else if (vista === 'discover') abrirVistaDiscover(false);
  else if (vista === 'amigos') abrirVistaAmigos(false);
  else if (vista === 'perfil') abrirVistaPerfil(false);
  else if (vista === 'watchlists') abrirMenuWatchlistGlobal(false);
  else if (vista === 'amigo-perfil') {
    if (typeof abrirVistaPerfilAmigo === 'function' && amigoSeleccionadoActual?.email) {
      abrirVistaPerfilAmigo(amigoSeleccionadoActual.email, false);
    } else if (typeof abrirVistaAmigos === 'function') {
      abrirVistaAmigos(false);
    }
  } else if (vista === 'amigo-registros') {
    if (typeof abrirVistaRegistrosAmigo === 'function' && amigoRegsEmailActual) {
      abrirVistaRegistrosAmigo(amigoRegsEmailActual, null, amigoRegsFiltroCat, amigoRegsFiltroSub, false);
    } else if (typeof abrirVistaAmigos === 'function') {
      abrirVistaAmigos(false);
    }
  } else {
    cambiarCat(vista, null, false);
  }
}
function inicializarManejoBotonAtras() {
  const initView = (typeof estado !== 'undefined' && estado && estado.categoria) ? estado.categoria : 'inicio';
  appNavHistory = [initView];
  try { history.replaceState({ appView: initView, depth: 1 }, '', ''); } catch (e) {}
  window.addEventListener('popstate', function(e) {
    // 0. Si hay dropdowns de calendario abiertos, cerrarlos primero
    const ddsAbiertos = Array.from(document.querySelectorAll('.cal-dd-menu.open, .cal-dd-menu.show, .custom-year-menu.show'));
    if (ddsAbiertos.length > 0) {
      if (typeof cerrarDropdownsCalendario === 'function') cerrarDropdownsCalendario();
      ddsAbiertos.forEach(d => { d.classList.remove('open'); d.classList.remove('show'); });
      try { history.pushState({ appView: estado?.categoria || 'inicio', depth: appNavHistory.length }, '', ''); } catch (err) {}
      return;
    }

    // 1. Comprobar si hay algún modal, overlay o menú que se desliza hacia abajo (swipe-down) abierto actualmente
    const overlaysAbiertos = Array.from(document.querySelectorAll('.modal-overlay, .crop-modal-overlay, .modal')).filter(m => {
      if (!m) return false;
      const s = window.getComputedStyle(m);
      return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    });

    if (overlaysAbiertos.length > 0) {
      // Ordenar por z-index descendente para cerrar el que esté visible encima
      overlaysAbiertos.sort((a, b) => {
        const za = parseInt(window.getComputedStyle(a).zIndex, 10) || 0;
        const zb = parseInt(window.getComputedStyle(b).zIndex, 10) || 0;
        return zb - za;
      });
      const topOverlay = overlaysAbiertos[0];
      if (typeof cerrarModalGenerico === 'function') {
        cerrarModalGenerico(topOverlay);
      } else {
        topOverlay.style.display = 'none';
      }
      try { history.pushState({ appView: estado?.categoria || 'inicio', depth: appNavHistory.length }, '', ''); } catch (err) {}
      return;
    }

    const catActual = (typeof estado !== 'undefined' && estado && estado.categoria) ? estado.categoria : 'inicio';

    // Si ya estamos en inicio, avisar para salir
    if (catActual === 'inicio') {
      const l = userPrefs.lang || 'es';
      mostrarToastPersonalizado(l === 'en' ? 'Press back again to exit' : 'Presiona atrás nuevamente para salir');
      return;
    }

    // Pestañas principales de navegación horizontal
    const PESTANAS_PRINCIPALES = ['inicio', 'listas', 'amigos', 'perfil'];

    // 1. REGLA 1: Si estamos en una pestaña principal (Listas, Amigos, Perfil),
    // retroceder debe volver a Inicio con animación fluida de scroll lateral entre pestañas,
    // sincronizando inmediatamente la barra inferior para que quede marcado Inicio.
    if (PESTANAS_PRINCIPALES.includes(catActual)) {
      if (appNavHistory.length > 1) {
        appNavHistory.pop();
      }
      isHandlingPopState = true;
      try {
        irInicio(false);
      } finally {
        isHandlingPopState = false;
      }
      return;
    }

    // 2. REGLA 2: Estamos dentro de una sub-pantalla (Calendario, Watchlists, Categoría de registros).
    // Aquí SÍ se aplica la animación de retroceso que me "saca" de esa pantalla hacia la vista anterior.
    let anterior = 'inicio';
    if (appNavHistory.length > 1) {
      appNavHistory.pop();
      anterior = appNavHistory[appNavHistory.length - 1] || 'inicio';
    } else {
      anterior = 'inicio';
      try { history.pushState({ appView: 'inicio', depth: 1 }, '', ''); } catch (err) {}
    }

    const elActual = (typeof obtenerElementoVistaActual === 'function') ? obtenerElementoVistaActual() : null;
    const elDestino = (typeof obtenerElementoVistaDestino === 'function') ? obtenerElementoVistaDestino(anterior) : document.getElementById('vista-inicio');

    const fnEjecutar = () => {
      isHandlingPopState = true;
      try {
        ejecutarCambioVista(anterior);
      } finally {
        isHandlingPopState = false;
      }

      const mapaBtns = {
        'inicio': 'm-btn-inicio',
        'listas': 'm-btn-listas-ext',
        'amigos': 'm-btn-amigos',
        'perfil': 'm-btn-perfil'
      };
      const targetBtnId = mapaBtns[anterior] || null;
      if (typeof actualizarBarraNavegacionMovil === 'function') {
        actualizarBarraNavegacionMovil(targetBtnId);
      }
      if (typeof actualizarVisibilidadMenuInferior === 'function') {
        actualizarVisibilidadMenuInferior(Boolean(targetBtnId));
      }
    };

    if (typeof animarSalidaVistaAtras === 'function' && elActual && elDestino && elActual !== elDestino) {
      animarSalidaVistaAtras(elActual, fnEjecutar, elDestino);
    } else {
      fnEjecutar();
    }
  });
}

/* ============================================================
   GESTOS MOBILE: DESLIZAR HACIA ABAJO PARA CERRAR MODALES (SWIPE-DOWN)
   Y PROTECCIÓN DE BÚSQUEDA ACCIDENTAL EN GOOGLE
   ============================================================ */
function cerrarModalGenerico(overlay) {
  if (!overlay) return;
  const mId = overlay.id;
  const mapaCierres = {
    'modal-perfil-amigo': typeof cerrarModalPerfilAmigo === 'function' ? cerrarModalPerfilAmigo : null,
    'modal-ruleta-amigo': typeof cerrarModalRuleta === 'function' ? cerrarModalRuleta : null,
    'modal-registros-amigo': typeof cerrarModalRegistrosAmigo === 'function' ? cerrarModalRegistrosAmigo : null,
    'modal-amigo-registro-detalle': typeof cerrarModalDetalleActividadAmigo === 'function' ? cerrarModalDetalleActividadAmigo : null,
    'modal-privacidad-amigos': typeof cerrarModalPrivacidadAmigos === 'function' ? cerrarModalPrivacidadAmigos : null,
    'modal-configuracion': typeof cerrarModalConfiguracion === 'function' ? cerrarModalConfiguracion : null,
    'modal-conectar-google': typeof cerrarModalConectarGoogle === 'function' ? cerrarModalConectarGoogle : null,
    'modal-agregar-estreno': typeof cerrarModalAgregarEstreno === 'function' ? cerrarModalAgregarEstreno : null,
    'modal-edicion': typeof cerrarModal === 'function' ? cerrarModal : null,
    'modal-terminar-obra': typeof cerrarModalTerminarObra === 'function' ? cerrarModalTerminarObra : null,
    'modal-confirmar-eliminar': typeof cerrarModalEliminar === 'function' ? cerrarModalEliminar : null,
    'modal-agregado-rapido': typeof cerrarModalAgregadoRapido === 'function' ? cerrarModalAgregadoRapido : null,
    'modal-ficha-tecnica': typeof cerrarModalFicha === 'function' ? cerrarModalFicha : null,
    'modal-ingreso-manual': typeof cerrarModalManual === 'function' ? cerrarModalManual : null,
    'modal-felicitaciones-watchlist': typeof cerrarModalFelicitacionWatchlist === 'function' ? cerrarModalFelicitacionWatchlist : null,
    'modal-shuffle-recomendar': typeof cerrarModalShuffle === 'function' ? cerrarModalShuffle : null,
    'modal-lightbox-avatar': typeof cerrarLightboxAvatar === 'function' ? cerrarLightboxAvatar : null,
    'modal-nuevo-artista': typeof cerrarModalNuevoArtista === 'function' ? cerrarModalNuevoArtista : null,
    'modal-editar-perfil': typeof cerrarModalEditarPerfil === 'function' ? cerrarModalEditarPerfil : null,
    'modal-recortar-avatar': typeof cerrarModalRecorteAvatar === 'function' ? cerrarModalRecorteAvatar : null,
    'modal-elegir-portada': typeof cerrarModalElegirPortada === 'function' ? cerrarModalElegirPortada : null,
    'modal-seleccionar-personaje': typeof cerrarModalSeleccionarPersonaje === 'function' ? cerrarModalSeleccionarPersonaje : null,
    'modal-confirmar-quitar-personaje': typeof cerrarModalConfirmarQuitarPersonaje === 'function' ? cerrarModalConfirmarQuitarPersonaje : null,
    'modal-seleccionar-favorito': typeof cerrarModalSeleccionarFavorito === 'function' ? cerrarModalSeleccionarFavorito : null,
    'modal-serie-completa': typeof omitirGuardadoSerieCompleta === 'function' ? omitirGuardadoSerieCompleta : null,
    'modal-auth-supabase': typeof cerrarModalAuthSupabase === 'function' ? cerrarModalAuthSupabase : null,
    'modal-like-detalle-resena': typeof cerrarModalLikeDetalleResena === 'function' ? cerrarModalLikeDetalleResena : null,
    'modal-tiempo-lectura': typeof cerrarModalTiempoLectura === 'function' ? cerrarModalTiempoLectura : null,
    'modal-spotify-connect': typeof cerrarModalConectarSpotify === 'function' ? cerrarModalConectarSpotify : null,
    'modal-conectar-steam': typeof cerrarModalConectarSteam === 'function' ? cerrarModalConectarSteam : null,
    'modal-conectar-lastfm': typeof cerrarModalConectarLastFm === 'function' ? cerrarModalConectarLastFm : null,
    'modal-conectar-psn': typeof cerrarModalConectarPsn === 'function' ? cerrarModalConectarPsn : null,
    'modal-seleccionar-juego-psn': typeof cerrarModalSeleccionarJuegoPsn === 'function' ? cerrarModalSeleccionarJuegoPsn : null,
    'modal-album-completado-spotify': typeof descartarPromptDiscoDetectado === 'function' ? descartarPromptDiscoDetectado : null,
    'modal-spotify-stats': typeof cerrarModalEstadisticasSpotify === 'function' ? cerrarModalEstadisticasSpotify : null,
    'modal-estadisticas-avanzadas': typeof cerrarModalEstadisticasAvanzadas === 'function' ? cerrarModalEstadisticasAvanzadas : null
  };

  if (mapaCierres[mId]) {
    mapaCierres[mId]();
  } else {
    overlay.style.display = 'none';
  }
}
window.cerrarModalGenerico = cerrarModalGenerico;

function inicializarGestosSwipeDownModales() {
  const modales = document.querySelectorAll('.modal-overlay');

  modales.forEach(overlay => {
    const box = overlay.querySelector('.modal-box') || overlay.querySelector('.crop-modal-content');
    if (!box) return;

    if (!box.querySelector('.modal-swipe-handle')) {
      const handle = document.createElement('div');
      handle.className = 'modal-swipe-handle';
      box.insertBefore(handle, box.firstChild);
    }

    let startY = 0;
    let startX = 0;
    let currentDiffY = 0;
    let isTracking = false;
    let startTime = 0;

    box.addEventListener('touchstart', e => {
      if (window.innerWidth > 768) return;
      if (e.touches.length !== 1) return;
      const target = e.target;
      if (target.closest('input, textarea, select, .switch-toggle, button, .star-box')) {
        return;
      }
      if (target.closest('#amigo-regs-grid') && !target.closest('.modal-swipe-handle')) {
        return;
      }
      const isHandleTouch = !!(target.closest('.modal-swipe-handle') || target.closest('.sticky-cfg-header'));
      if (box.scrollTop > 5 && !isHandleTouch) {
        return;
      }
      // Si el elemento interno donde se inició el toque tiene scroll acumulado, no interceptar
      let scrollCheck = target;
      while (scrollCheck && scrollCheck !== overlay && scrollCheck !== box) {
        if (scrollCheck.scrollTop > 5 && !isHandleTouch) {
          return;
        }
        scrollCheck = scrollCheck.parentElement;
      }
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      currentDiffY = 0;
      isTracking = true;
      startTime = Date.now();
      box.style.transition = 'none';
    }, { passive: true });

    box.addEventListener('touchmove', e => {
      if (!isTracking || window.innerWidth > 768) return;
      if (e.touches.length !== 1) return;
      const clientY = e.touches[0].clientY;
      const clientX = e.touches[0].clientX;
      const diffY = clientY - startY;
      const diffX = Math.abs(clientX - startX);

      const isHandleTouch = !!(e.target.closest('.modal-swipe-handle') || e.target.closest('.sticky-cfg-header'));
      if (!isHandleTouch) {
        let hasInnerScroll = false;
        let el = e.target;
        while (el && el !== overlay && el !== box) {
          if (el.scrollTop > 4) {
            hasInnerScroll = true;
            break;
          }
          el = el.parentElement;
        }

        if (box.scrollTop > 4 || hasInnerScroll || (e.target.closest('#amigo-regs-grid') && !e.target.closest('.modal-swipe-handle'))) {
          startY = clientY;
          if (isTracking) {
            isTracking = false;
            box.classList.remove('swiping-down');
            box.style.transform = '';
            overlay.style.backgroundColor = '';
          }
          return;
        }
      } else {
        if (box.scrollTop > 0 && diffY > 0) {
          box.scrollTop = 0;
        }
      }

      if (diffY > 0 && diffY > diffX) {
        currentDiffY = diffY;
        if (e.cancelable) e.preventDefault();
        box.classList.add('swiping-down');
        const dampY = Math.pow(diffY, 0.95);
        box.style.transform = `translateY(${dampY}px)`;
        const opacity = Math.max(0.15, 0.75 * (1 - diffY / 450));
        overlay.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
      } else if (diffY < 0) {
        box.style.transform = '';
      }
    }, { passive: false });

    const finalizarArrastre = () => {
      if (!isTracking) return;
      isTracking = false;
      box.classList.remove('swiping-down');

      const elapsed = Date.now() - startTime;
      const velocity = currentDiffY / Math.max(elapsed, 1);

      if (currentDiffY > 95 || (currentDiffY > 40 && velocity > 0.45)) {
        box.style.transition = 'transform 0.24s cubic-bezier(0.32, 1, 0.23, 1), opacity 0.24s ease-out';
        box.style.transform = 'translateY(115%)';
        overlay.style.transition = 'opacity 0.22s ease-out';
        overlay.style.opacity = '0';

        setTimeout(() => {
          cerrarModalGenerico(overlay);
          box.style.transform = '';
          box.style.transition = '';
          overlay.style.opacity = '';
          overlay.style.backgroundColor = '';
        }, 230);
      } else {
        box.style.transition = 'transform 0.22s cubic-bezier(0.34, 1.25, 0.64, 1)';
        box.style.transform = 'translateY(0)';
        overlay.style.transition = 'background-color 0.2s ease-out';
        overlay.style.backgroundColor = '';
        setTimeout(() => {
          box.style.transition = '';
        }, 220);
      }
      currentDiffY = 0;
    };

    box.addEventListener('touchend', finalizarArrastre, { passive: true });
    box.addEventListener('touchcancel', finalizarArrastre, { passive: true });
  });
}
window.inicializarGestosSwipeDownModales = inicializarGestosSwipeDownModales;

// Protección contra menús contextuales y "Touch to Search" de Google en móviles
document.addEventListener('contextmenu', function(e) {
  if (e.target && (e.target.tagName === 'IMG' || e.target.closest('.user-avatar') || e.target.closest('.ruleta-amigo-avatar') || e.target.closest('.friend-card-avatar') || e.target.closest('.profile-avatar-box') || e.target.closest('#amigo-modal-avatar') || e.target.closest('.feed-user-avatar') || e.target.closest('.friend-avatar-wrap'))) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('dragstart', function(e) {
  if (e.target && e.target.tagName === 'IMG') {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('selectionchange', function() {
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
    return;
  }
  const sel = window.getSelection();
  if (sel && sel.toString().trim().length > 0) {
    if (!sel.anchorNode?.parentElement?.classList?.contains('selectable-text')) {
      sel.removeAllRanges();
    }
  }
});


function inicializarPullToRefresh() {
  let touchStartY = 0;
  let isPulling = false;
  window.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0 && e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      isPulling = true;
    } else {
      isPulling = false;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    if (currentY - touchStartY > 95 && window.scrollY === 0) {
      isPulling = false;
      recargarYSincronizarApp(true);
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isPulling = false;
  }, { passive: true });
}

function inicializarNavegacionHorizontalTabs() {
  const PESTANAS_PRINCIPALES_NAV = [
    { id: 'inicio', nav: (p) => irInicio(p) },
    { id: 'listas', nav: (p) => abrirVistaDashboardListas(p) },
    { id: 'amigos', nav: (p) => abrirVistaAmigos(p) },
    { id: 'perfil', nav: (p) => abrirVistaPerfil(p) }
  ];

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let touchStartTarget = null;
  let ultimaNavegacionHorizontal = 0;

  function hayModalAbierto() {
    const modales = document.querySelectorAll('.modal, .modal-overlay, #modal-configuracion, #modal-perfil, #modal-buscar-global, #modal-estadisticas-avanzadas, #modal-reseña, #modal-editar-disco, #modal-seleccionar-juego-psn, #modal-seleccionar-cancion');
    for (const m of modales) {
      if (m && m.style && m.style.display && m.style.display !== 'none') return true;
    }
    return false;
  }

  function obtenerIndicePestanaActual() {
    const cat = (typeof estado !== 'undefined' && estado && estado.categoria) ? estado.categoria : 'inicio';
    return PESTANAS_PRINCIPALES_NAV.findIndex(p => p.id === cat);
  }

  function estaEnScrollHorizontalInterno(target, direccionX) {
    let el = target;
    while (el && el !== document.body && el !== document.documentElement) {
      if (el.classList && (
        el.classList.contains('home-live-carousel') ||
        el.classList.contains('home-en-progreso-carousel') ||
        el.classList.contains('home-indice-carousel') ||
        el.classList.contains('tabs-scroll-horizontal') ||
        el.classList.contains('chips-scroll')
      )) {
        if (direccionX > 0 && el.scrollLeft < (el.scrollWidth - el.clientWidth - 5)) return true;
        if (direccionX < 0 && el.scrollLeft > 5) return true;
      }
      if (el.scrollWidth > (el.clientWidth + 8)) {
        const style = window.getComputedStyle(el);
        const ox = style.overflowX;
        if (ox === 'auto' || ox === 'scroll') {
          if (direccionX > 0 && el.scrollLeft < (el.scrollWidth - el.clientWidth - 5)) return true;
          if (direccionX < 0 && el.scrollLeft > 5) return true;
        }
      }
      el = el.parentElement;
    }
    return false;
  }

  function animarTransicionPestana(direccion, elDestino) {
    if (!elDestino) return;
    const cls = (direccion === 'right' || direccion > 0) ? 'tab-anim-slide-right' : 'tab-anim-slide-left';
    elDestino.classList.remove('tab-anim-slide-right', 'tab-anim-slide-left');
    void elDestino.offsetWidth;
    elDestino.classList.add(cls);
    setTimeout(() => {
      elDestino.classList.remove('tab-anim-slide-right', 'tab-anim-slide-left');
    }, 320);
  }
  window.animarTransicionPestana = animarTransicionPestana;

  let _animacionAtrasEnCurso = false;
  function animarSalidaVistaAtras(elActual, fnDestino, elDestino) {
    if (_animacionAtrasEnCurso) {
      if (typeof fnDestino === 'function') fnDestino();
      return;
    }
    if (!elActual) {
      if (typeof fnDestino === 'function') fnDestino();
      if (elDestino) {
        elDestino.classList.remove('view-anim-enter-back');
        void elDestino.offsetWidth;
        elDestino.classList.add('view-anim-enter-back');
        setTimeout(() => elDestino.classList.remove('view-anim-enter-back'), 280);
      }
      return;
    }

    _animacionAtrasEnCurso = true;
    window.__animacionAtrasEnCurso = true;
    elActual.classList.remove('view-anim-exit-back');
    void elActual.offsetWidth;
    elActual.classList.add('view-anim-exit-back');

    setTimeout(() => {
      elActual.classList.remove('view-anim-exit-back');
      if (typeof fnDestino === 'function') {
        try {
          fnDestino();
        } catch (err) {
          console.error('Error en transición atrás:', err);
        }
      }
      _animacionAtrasEnCurso = false;
      window.__animacionAtrasEnCurso = false;
      if (elDestino) {
        elDestino.classList.remove('view-anim-enter-back');
        void elDestino.offsetWidth;
        elDestino.classList.add('view-anim-enter-back');
        setTimeout(() => elDestino.classList.remove('view-anim-enter-back'), 280);
      }
    }, 180);
  }
  window.animarSalidaVistaAtras = animarSalidaVistaAtras;

  function animarEntradaSubtab(el) {
    if (!el) return;
    el.classList.remove('anim-subtab-transition');
    void el.offsetWidth;
    el.classList.add('anim-subtab-transition');
    setTimeout(() => {
      try { el.classList.remove('anim-subtab-transition'); } catch (e) {}
    }, 260);
  }
  window.animarEntradaSubtab = animarEntradaSubtab;

  function obtenerElementoVistaTab(id) {
    if (id === 'inicio') return document.getElementById('vista-inicio');
    if (id === 'listas') return document.getElementById('vista-listas-extendida');
    if (id === 'amigos') return document.getElementById('vista-amigos');
    if (id === 'perfil') return document.getElementById('vista-perfil');
    return null;
  }
  window.obtenerElementoVistaTab = obtenerElementoVistaTab;

  function cambiarPestanaRelativa(offset) {
    const curIdx = obtenerIndicePestanaActual();
    if (curIdx === -1) return;
    const nuevoIdx = curIdx + offset;
    if (nuevoIdx >= 0 && nuevoIdx < PESTANAS_PRINCIPALES_NAV.length) {
      ultimaNavegacionHorizontal = Date.now();
      const targetItem = PESTANAS_PRINCIPALES_NAV[nuevoIdx];
      targetItem.nav(true);
      const targetEl = obtenerElementoVistaTab(targetItem.id);
      if (targetEl) {
        animarTransicionPestana(offset > 0 ? 'right' : 'left', targetEl);
      }
    }
  }

  // 1. GESTOS TOUCH (Móviles y Tablets)
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      touchStartTarget = e.target;
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!e.changedTouches || e.changedTouches.length !== 1) return;
    if (hayModalAbierto()) return;
    const curIdx = obtenerIndicePestanaActual();
    if (curIdx === -1) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    const duration = Date.now() - touchStartTime;

    if (duration > 650) return;
    if (Math.abs(deltaX) < 55) return;
    if (Math.abs(deltaX) < Math.abs(deltaY) * 1.4) return;
    if (Date.now() - ultimaNavegacionHorizontal < 420) return;

    const direccionX = deltaX < 0 ? 1 : -1;
    if (estaEnScrollHorizontalInterno(touchStartTarget, direccionX)) return;

    if (deltaX < -55) {
      cambiarPestanaRelativa(1); // Swipe izquierda -> siguiente pestaña
    } else if (deltaX > 55) {
      cambiarPestanaRelativa(-1); // Swipe derecha -> pestaña anterior
    }
  }, { passive: true });

  // 2. SCROLL HORIZONTAL CON TRACKPAD / RUEDA
  window.addEventListener('wheel', (e) => {
    if (hayModalAbierto()) return;
    if (Math.abs(e.deltaX) < 45) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.4) return;
    if (Date.now() - ultimaNavegacionHorizontal < 550) return;

    const direccionX = e.deltaX > 0 ? 1 : -1;
    if (estaEnScrollHorizontalInterno(e.target, direccionX)) return;

    if (e.deltaX > 45) {
      cambiarPestanaRelativa(1);
    } else if (e.deltaX < -45) {
      cambiarPestanaRelativa(-1);
    }
  }, { passive: true });
}
window.inicializarNavegacionHorizontalTabs = inicializarNavegacionHorizontalTabs;

function actualizarVisibilidadMenuInferior(visible) {
  const nav = document.getElementById('mobile-bottom-nav') || document.querySelector('.mobile-bottom-nav');
  if (!nav) return;
  if (visible) {
    nav.classList.remove('mobile-nav-hidden');
    nav.classList.remove('mobile-bottom-nav-hidden');
  } else {
    nav.classList.add('mobile-nav-hidden');
  }
}
window.actualizarVisibilidadMenuInferior = actualizarVisibilidadMenuInferior;

window.__tabActualIndice = 0;
function animarCambioTabVista(targetId) {
  if (window.__animacionAtrasEnCurso) return;
  const tabs = ['inicio', 'listas', 'amigos', 'perfil'];
  const nuevoIdx = tabs.indexOf(targetId);
  if (nuevoIdx === -1) return;
  const viejoIdx = (typeof window.__tabActualIndice === 'number') ? window.__tabActualIndice : 0;
  window.__tabActualIndice = nuevoIdx;
  if (nuevoIdx === viejoIdx) return;
  const targetEl = (typeof obtenerElementoVistaTab === 'function') ? obtenerElementoVistaTab(targetId) : null;
  if (targetEl && typeof animarTransicionPestana === 'function') {
    animarTransicionPestana(nuevoIdx > viejoIdx ? 'right' : 'left', targetEl);
  }
}
window.animarCambioTabVista = animarCambioTabVista;

const irInicio = (pushNav = true) => {
  if (pushNav) registrarNavegacionApp('inicio');
  guardarEstadoNavegacionActual('inicio', '');
  actualizarVisibilidadMenuInferior(true);
  cambiarCat('inicio', null, false);
  actualizarBarraNavegacionMovil('m-btn-inicio');
  animarCambioTabVista('inicio');
};

function reposicionarIndicadorNavMovil(el, animar = true) {
  const nav = document.getElementById('mobile-bottom-nav') || document.querySelector('.mobile-bottom-nav');
  const ind = document.getElementById('mobile-nav-indicator');
  if (!nav || !ind) return;
  const targetBtn = el || nav.querySelector('.mobile-nav-btn.active');
  if (!targetBtn) {
    if (ind) ind.style.opacity = '0';
    return;
  }
  const navRect = nav.getBoundingClientRect();
  const btnRect = targetBtn.getBoundingClientRect();
  let left = 0;
  let width = 0;
  if (btnRect.width > 0 && navRect.width > 0) {
    left = btnRect.left - navRect.left;
    width = btnRect.width;
  } else if (targetBtn.offsetWidth > 0) {
    left = targetBtn.offsetLeft;
    width = targetBtn.offsetWidth;
  } else {
    return;
  }

  if (!animar) {
    const prevTrans = ind.style.transition;
    ind.style.transition = 'none';
    ind.style.width = `${width}px`;
    ind.style.transform = `translateX(${left}px)`;
    ind.style.opacity = '1';
    void ind.offsetWidth;
    ind.style.transition = prevTrans || '';
  } else {
    ind.style.width = `${width}px`;
    ind.style.transform = `translateX(${left}px)`;
    ind.style.opacity = '1';
  }
}

function actualizarBarraNavegacionMovil(btnId) {
  document.querySelectorAll('.mobile-nav-btn').forEach(b => {
    b.classList.remove('active');
    try { b.blur(); } catch(e) {}
  });
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    try { document.activeElement.blur(); } catch(e) {}
  }
  const el = btnId ? document.getElementById(btnId) : null;
  if (el) {
    el.classList.add('active');
    reposicionarIndicadorNavMovil(el, true);
    requestAnimationFrame(() => reposicionarIndicadorNavMovil(el, true));
    setTimeout(() => reposicionarIndicadorNavMovil(el, true), 60);
    setTimeout(() => reposicionarIndicadorNavMovil(el, true), 180);
  } else {
    const ind = document.getElementById('mobile-nav-indicator');
    if (ind) ind.style.opacity = '0';
  }
}
let _navResizeRaf = 0;
window.addEventListener('resize', () => {
  if (_navResizeRaf) return;
  _navResizeRaf = requestAnimationFrame(() => {
    _navResizeRaf = 0;
    reposicionarIndicadorNavMovil();
  });
}, { passive: true });
async function recargarYSincronizarApp(notificar = false) {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  if (notificar) {
    mostrarToastPersonalizado(l === 'en' ? 'Syncing data, media and statistics...' : 'Sincronizando datos, productos y estadísticas...');
  }

  // 1. SINCRONIZACIÓN DE DATOS (Supabase / Perfil / Registros / Watchlist / Amigos / Rachas)
  try {
    if (typeof sincronizarPerfilDesdeServidor === 'function') {
      sincronizarPerfilDesdeServidor();
    }
    if (estado && estado.userEmail) {
      if (typeof cargarWatchlist === 'function') cargarWatchlist();
      if (typeof cargarFeedActividadAmigos === 'function') cargarFeedActividadAmigos(false);
      if (typeof verificarLikesRecibidosEnNube === 'function') verificarLikesRecibidosEnNube();
      if (typeof verificarRecordatorioRacha21 === 'function') verificarRecordatorioRacha21();

      if (window.google && google.script && google.script.run && typeof google.script.run.obtenerRegistros === 'function') {
        google.script.run
          .withSuccessHandler(d => {
            estado.registros = (d || []).map(r => ({
              ...r,
              fechaInicio: sanitizarFechaFrontend(r.fechaInicio),
              fechaFin: sanitizarFechaFrontend(r.fechaFin)
            }));
            recalcularYActualizarVistasTrasSync();
          })
          .withFailureHandler(err => {
            console.error('Error al sincronizar registros:', err);
          })
          .obtenerRegistros(estado.userEmail);

        if (typeof google.script.run.sincronizarYRepararRegistros === 'function') {
          google.script.run
            .withSuccessHandler(res => {
              if (res && res.reparados > 0 && typeof cargarRegistros === 'function') cargarRegistros();
            })
            .withFailureHandler(() => {})
            .sincronizarYRepararRegistros(estado.userEmail);
        }
      } else if (typeof cargarRegistros === 'function') {
        cargarRegistros();
      }
    } else {
      recalcularYActualizarVistasTrasSync();
    }
  } catch (err) {
    console.error('Error en sincronización de datos:', err);
  }

  // 2. SINCRONIZACIÓN DE PRODUCTOS Y SERVICIOS CONECTADOS (Spotify, Last.fm, Steam, PlayStation)
  const promesasServicios = [];

  // A. Spotify
  try {
    const spTok = localStorage.getItem('mediary_spotify_token');
    if (spTok) {
      if (typeof actualizarNowPlayingSpotify === 'function') {
        promesasServicios.push(actualizarNowPlayingSpotify().catch(() => null));
      }
      if (typeof sincronizarReproduccionesRecientesSpotify === 'function') {
        promesasServicios.push(sincronizarReproduccionesRecientesSpotify(false).catch(() => null));
      }
      if (typeof actualizarDatosSpotify === 'function') {
        promesasServicios.push(actualizarDatosSpotify(false).catch(() => null));
      }
    }
  } catch(e) {}

  // B. Last.fm
  try {
    const lfmUser = localStorage.getItem('mediary_lastfm_user') || localStorage.getItem('mediary_lastfm_username');
    if (lfmUser && typeof sincronizarCuentaLastFm === 'function') {
      promesasServicios.push(sincronizarCuentaLastFm(lfmUser, false).catch(() => null));
    }
  } catch(e) {}

  // C. Steam
  try {
    const isSteamConn = localStorage.getItem('mediary_steam_connected') === 'true';
    const steamId = localStorage.getItem('mediary_steam_id');
    if (isSteamConn && steamId && typeof sincronizarCuentaSteam === 'function') {
      promesasServicios.push(sincronizarCuentaSteam(steamId, false).catch(() => null));
    }
  } catch(e) {}

  // D. PlayStation Network
  try {
    const isPsnConn = localStorage.getItem('mediary_psn_connected') === 'true';
    const psnUser = localStorage.getItem('mediary_psn_username');
    if (isPsnConn && psnUser && typeof sincronizarCuentaPlayStation === 'function') {
      promesasServicios.push(sincronizarCuentaPlayStation(psnUser, false).catch(() => null));
    }
  } catch(e) {}

  if (promesasServicios.length > 0) {
    try { await Promise.allSettled(promesasServicios); } catch (_) {}
  }

  // 3. SINCRONIZACIÓN Y RECALCULO DE ESTADÍSTICAS Y VISTAS
  recalcularYActualizarVistasTrasSync();

  if (notificar) {
    mostrarToastPersonalizado(l === 'en' ? ' Mediary synchronized: data, products & statistics updated!' : ' Mediary al día: datos, productos y estadísticas actualizados.');
  }
}

function recalcularYActualizarVistasTrasSync() {
  try {
    if (typeof renderizarResumenInicio === 'function') renderizarResumenInicio();
    if (typeof renderizarFeedAmigosResumidoInicio === 'function') renderizarFeedAmigosResumidoInicio();
    if (typeof renderizarPlayStationNowPlayingInicio === 'function') renderizarPlayStationNowPlayingInicio(true);
    if (typeof actualizarUIPlayStation === 'function') actualizarUIPlayStation();
    if (typeof actualizarUILastFm === 'function') actualizarUILastFm();
    if (typeof actualizarUISteam === 'function') actualizarUISteam();
    if (typeof actualizarMetricasResumenInicio === 'function') actualizarMetricasResumenInicio();

    if (estado) {
      if (estado.categoria === 'perfil') {
        if (typeof renderizarFavoritosPerfil === 'function') renderizarFavoritosPerfil();
        if (typeof calcularYMostrarEstadisticasPerfil === 'function') calcularYMostrarEstadisticasPerfil();
      } else if (estado.categoria === 'listas') {
        if (typeof renderizarStats === 'function') renderizarStats();
      } else if (estado.categoria === 'discover') {
        if (typeof renderizarDiscoverVista === 'function') renderizarDiscoverVista();
      } else if (estado.categoria === 'calendario') {
        if (typeof renderizarVistaCalendarioCompleta === 'function') renderizarVistaCalendarioCompleta();
      } else if (estado.categoria && estado.categoria !== 'inicio') {
        if (typeof esSubcategoriaWatchlist === 'function' && esSubcategoriaWatchlist(estado.subcategoria)) {
          if (typeof renderizarWatchlist === 'function') renderizarWatchlist();
        } else if (typeof filtrarYMostrarHistorial === 'function') {
          filtrarYMostrarHistorial();
        }
      }
    }

    const modalStats = document.getElementById('modal-estadisticas-avanzadas');
    if (modalStats && modalStats.style.display === 'flex' && typeof renderizarContenidoEstadisticasAvanzadas === 'function') {
      renderizarContenidoEstadisticasAvanzadas();
    }
  } catch (err) {
    console.error('Error al actualizar vistas tras sincronizar:', err);
  }
}

function refrescarDatosApp() {
  return recargarYSincronizarApp(true);
}
function obtenerTipoFicha(categoria, subcategoria) {
  const c = categoria || '';
  const s = (subcategoria || '').toLowerCase();
  if (c === 'Peliculas') return 'peliculas';
  if (c === 'Series') return 'series';
  if (c === 'Musica') {
    if (s.includes('artista') || s.includes('concierto')) return 'artistas';
    return 'discos';
  }
  if (c === 'Juegos') return 'juegos';
  if (c === 'Lecturas') {
    if (s.includes('manga')) return 'manga';
    if (s.includes('cómic') || s.includes('comic')) return 'comics';
    return 'libros';
  }
  return 'peliculas';
}

function renderizarFichaTecnicaEsqueleto(reg, l) {
  const tipo = obtenerTipoFicha(reg.categoria, reg.subcategoria);
  const metaBox = document.getElementById('ficha-modal-meta-container');
  const bottomBox = document.getElementById('ficha-modal-bottom-container');
  if (!metaBox || !bottomBox) return;

  let metaHtml = '';
  let bottomHtml = '';

  if (tipo === 'peliculas') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release:' : 'Estreno:'}</strong> <span>${reg.anio || '...'}</span></div>
      <div class="ficha-meta-item"><strong>Director:</strong> <span>${reg.creador || '...'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Writer:' : 'Escritor:'}</strong> <span>...</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Protagonist:' : 'Protagonista:'}</strong> <span>...</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:6px;">${l === 'en' ? 'Synopsis:' : 'Sinopsis:'}</label>
        <div class="ficha-sinopsis-box">${l === 'en' ? 'Loading synopsis...' : 'Cargando sinopsis...'}</div>
      </div>
    `;
  } else if (tipo === 'series') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release:' : 'Estreno:'}</strong> <span>${reg.anio || '...'}</span></div>
      <div class="ficha-meta-item"><strong>Showrunner:</strong> <span>${reg.creador || '...'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Writers:' : 'Escritores:'}</strong> <span>...</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Protagonists:' : 'Protagonistas:'}</strong> <span>...</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:6px;">${l === 'en' ? 'Synopsis:' : 'Sinopsis:'}</label>
        <div class="ficha-sinopsis-box">${l === 'en' ? 'Loading synopsis...' : 'Cargando sinopsis...'}</div>
      </div>
    `;
  } else if (tipo === 'discos') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release Date:' : 'Fecha de salida:'}</strong> <span>${reg.anio || '...'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Artist/Band:' : 'Artista/Grupo:'}</strong> <span>${reg.creador || '...'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Producer:' : 'Productor:'}</strong> <span>...</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Record Label:' : 'Sello/Discográfica:'}</strong> <span>...</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Genre:' : 'Género:'}</strong> <span>...</span></div>
    `;
    bottomHtml = '';
  } else if (tipo === 'artistas') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Artist/Band:' : 'Artista/Grupo:'}</strong> <span>${reg.titulo || reg.creador}</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--accent);margin-bottom:6px;">${l === 'en' ? 'Members and Roles:' : 'Integrantes y roles:'}</label>
        <div class="ficha-sinopsis-box" style="max-height:160px; line-height:1.6;">${l === 'en' ? 'Loading members and roles...' : 'Cargando integrantes y roles...'}</div>
      </div>
    `;
  } else if (tipo === 'juegos') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release Date:' : 'Fecha de salida:'}</strong> <span>${reg.anio || '...'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Developer:' : 'Desarrolladora:'}</strong> <span>${reg.creador || '...'}</span></div>
      <div class="ficha-meta-item"><strong>Director:</strong> <span>...</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Publisher:' : 'Distribuidora:'}</strong> <span>...</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Genre:' : 'Género:'}</strong> <span>...</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:6px;">${l === 'en' ? 'Synopsis:' : 'Sinopsis:'}</label>
        <div class="ficha-sinopsis-box">${l === 'en' ? 'Loading synopsis...' : 'Cargando sinopsis...'}</div>
      </div>
    `;
  } else if (tipo === 'libros') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release Date:' : 'Fecha de salida:'}</strong> <span>${reg.anio || '...'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Writer:' : 'Escritor:'}</strong> <span>${reg.creador || '...'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Genre:' : 'Género:'}</strong> <span>...</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:6px;">${l === 'en' ? 'Synopsis:' : 'Sinopsis:'}</label>
        <div class="ficha-sinopsis-box">${l === 'en' ? 'Loading synopsis...' : 'Cargando sinopsis...'}</div>
      </div>
    `;
  } else if (tipo === 'comics') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release Date:' : 'Fecha de salida:'}</strong> <span>${reg.anio || '...'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Publisher:' : 'Editorial:'}</strong> <span>...</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Writer(s):' : 'Escritor(es):'}</strong> <span>${reg.creador || '...'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Artist(s):' : 'Dibujante(s):'}</strong> <span>...</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:6px;">${l === 'en' ? 'Synopsis:' : 'Sinopsis:'}</label>
        <div class="ficha-sinopsis-box">${l === 'en' ? 'Loading synopsis...' : 'Cargando sinopsis...'}</div>
      </div>
    `;
  } else if (tipo === 'manga') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release Date:' : 'Fecha de salida:'}</strong> <span>${reg.anio || '...'}</span></div>
      <div class="ficha-meta-item"><strong>Mangaka:</strong> <span>${reg.creador || '...'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Genre:' : 'Género:'}</strong> <span>...</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:6px;">${l === 'en' ? 'Synopsis:' : 'Sinopsis:'}</label>
        <div class="ficha-sinopsis-box">${l === 'en' ? 'Loading synopsis...' : 'Cargando sinopsis...'}</div>
      </div>
    `;
  }

  metaBox.innerHTML = metaHtml;
  bottomBox.innerHTML = bottomHtml;
}

function renderizarFichaTecnicaContenido(reg, info, l) {
  const tipo = info.tipoFicha || obtenerTipoFicha(reg.categoria, reg.subcategoria);
  const metaBox = document.getElementById('ficha-modal-meta-container');
  const bottomBox = document.getElementById('ficha-modal-bottom-container');
  if (!metaBox || !bottomBox) return;

  let metaHtml = '';
  let bottomHtml = '';

  if (tipo === 'peliculas') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release:' : 'Estreno:'}</strong> <span>${info.estreno || info.fechaEstreno || reg.anio || 'No registrada'}</span></div>
      <div class="ficha-meta-item"><strong>Director:</strong> <span>${info.director || info.directores || reg.creador || 'No especificado'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Writer:' : 'Escritor:'}</strong> <span>${info.escritor || info.escritores || 'No especificado'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Protagonist:' : 'Protagonista:'}</strong> <span>${info.protagonista || info.protagonistas || info.actores || 'No especificado'}</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:6px;">${l === 'en' ? 'Synopsis:' : 'Sinopsis:'}</label>
        <div class="ficha-sinopsis-box">${info.sinopsis || 'Sin sinopsis disponible.'}</div>
      </div>
    `;
  } else if (tipo === 'series') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release:' : 'Estreno:'}</strong> <span>${info.estreno || info.fechaEstreno || reg.anio || 'No registrada'}</span></div>
      <div class="ficha-meta-item"><strong>Showrunner:</strong> <span>${info.showrunner || info.directores || reg.creador || 'No especificado'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Writers:' : 'Escritores:'}</strong> <span>${info.escritores || 'No especificados'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Protagonists:' : 'Protagonistas:'}</strong> <span>${info.protagonistas || info.actores || 'No especificados'}</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:6px;">${l === 'en' ? 'Synopsis:' : 'Sinopsis:'}</label>
        <div class="ficha-sinopsis-box">${info.sinopsis || 'Sin sinopsis disponible.'}</div>
      </div>
    `;
  } else if (tipo === 'discos') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release Date:' : 'Fecha de salida:'}</strong> <span>${info.fechaSalida || info.estreno || reg.anio || 'No registrada'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Artist/Band:' : 'Artista/Grupo:'}</strong> <span>${info.artista || reg.creador || 'No especificado'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Producer:' : 'Productor:'}</strong> <span>${info.productor || 'No especificado'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Record Label:' : 'Sello/Discográfica:'}</strong> <span>${info.sello || 'No especificado'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Genre:' : 'Género:'}</strong> <span>${info.genero || 'Música'}</span></div>
    `;
    bottomHtml = '';
  } else if (tipo === 'artistas') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Artist/Band:' : 'Artista/Grupo:'}</strong> <span>${info.artista || reg.titulo}</span></div>
    `;
    const integrantesList = (info.integrantes && info.integrantes.length)
      ? info.integrantes.map(it => {
          const parts = it.split(':');
          const rol = parts[0]?.trim();
          const nom = parts.slice(1).join(':')?.trim();
          return `<div style="margin-bottom:4px;">• <strong>${rol}:</strong> ${nom || rol}</div>`;
        }).join('')
      : `<div>${info.roles || (l === 'en' ? 'Vocals & instrumentation: ' : 'Voz e instrumentación: ') + reg.titulo}</div>`;

    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--accent);margin-bottom:6px;">${l === 'en' ? 'Members and Roles:' : 'Integrantes y roles:'}</label>
        <div class="ficha-sinopsis-box" style="max-height:160px; line-height:1.6;">
          ${integrantesList}
        </div>
      </div>
    `;
  } else if (tipo === 'juegos') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release Date:' : 'Fecha de salida:'}</strong> <span>${info.fechaSalida || reg.anio || 'No registrada'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Developer:' : 'Desarrolladora:'}</strong> <span>${info.desarrolladora || reg.creador || 'No especificada'}</span></div>
      <div class="ficha-meta-item"><strong>Director:</strong> <span>${info.director || 'No especificado'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Publisher:' : 'Distribuidora:'}</strong> <span>${info.distribuidora || 'No especificada'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Genre:' : 'Género:'}</strong> <span>${info.genero || 'Videojuego'}</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:6px;">${l === 'en' ? 'Synopsis:' : 'Sinopsis:'}</label>
        <div class="ficha-sinopsis-box">${info.sinopsis || 'Sin sinopsis disponible.'}</div>
      </div>
    `;
  } else if (tipo === 'libros') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release Date:' : 'Fecha de salida:'}</strong> <span>${info.fechaSalida || reg.anio || 'No registrada'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Writer:' : 'Escritor:'}</strong> <span>${info.escritor || reg.creador || 'No especificado'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Genre:' : 'Género:'}</strong> <span>${info.genero || 'Literatura'}</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:6px;">${l === 'en' ? 'Synopsis:' : 'Sinopsis:'}</label>
        <div class="ficha-sinopsis-box">${info.sinopsis || 'Sin sinopsis disponible.'}</div>
      </div>
    `;
  } else if (tipo === 'comics') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release Date:' : 'Fecha de salida:'}</strong> <span>${info.fechaSalida || reg.anio || 'No registrada'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Publisher:' : 'Editorial:'}</strong> <span>${info.editorial || 'No especificada'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Writer(s):' : 'Escritor(es):'}</strong> <span>${info.escritores || reg.creador || 'No especificado'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Artist(s):' : 'Dibujante(s):'}</strong> <span>${info.dibujantes || 'No especificado'}</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:6px;">${l === 'en' ? 'Synopsis:' : 'Sinopsis:'}</label>
        <div class="ficha-sinopsis-box">${info.sinopsis || 'Sin sinopsis disponible.'}</div>
      </div>
    `;
  } else if (tipo === 'manga') {
    metaHtml = `
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Release Date:' : 'Fecha de salida:'}</strong> <span>${info.fechaSalida || reg.anio || 'No registrada'}</span></div>
      <div class="ficha-meta-item"><strong>Mangaka:</strong> <span>${info.mangaka || reg.creador || 'No especificado'}</span></div>
      <div class="ficha-meta-item"><strong>${l === 'en' ? 'Genre:' : 'Género:'}</strong> <span>${info.genero || 'Manga'}</span></div>
    `;
    bottomHtml = `
      <div class="form-group" style="margin-top:12px;">
        <label style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:6px;">${l === 'en' ? 'Synopsis:' : 'Sinopsis:'}</label>
        <div class="ficha-sinopsis-box">${info.sinopsis || 'Sin sinopsis disponible.'}</div>
      </div>
    `;
  }

  metaBox.innerHTML = metaHtml;
  bottomBox.innerHTML = bottomHtml;
}

function abrirFichaTecnica(id) {
  let reg = null;
  if (typeof id === 'object' && id !== null) {
    reg = id;
  } else {
    reg = (estado.registros || []).find(r => String(r.id) === String(id)) ||
          (estado.watchlist || []).find(w => String(w.id) === String(id)) ||
          (typeof amigoRegistrosCache !== 'undefined' && Array.isArray(amigoRegistrosCache) ? amigoRegistrosCache.find(r => String(r.id) === String(id)) : null);
  }
  if (!reg) return;
  document.getElementById('ficha-modal-title').textContent = reg.titulo;
  document.getElementById('ficha-modal-poster').src = optimizarUrlPoster(reg.poster, 'modal') || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'125\' height=\'180\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>';
  const l = userPrefs.lang || 'es';
  renderizarFichaTecnicaEsqueleto(reg, l);
  document.getElementById('modal-ficha-tecnica').style.display = 'flex';
  if (typeof actualizarVisibilidadMenuInferior === 'function') actualizarVisibilidadMenuInferior(false);

  const onDetalle = info => {
    if (!info) return;
    if (info.poster) document.getElementById('ficha-modal-poster').src = optimizarUrlPoster(info.poster, 'modal');
    renderizarFichaTecnicaContenido(reg, info, l);
  };

  if (typeof SERVER_API !== 'undefined' && SERVER_API.obtenerDetalleTecnicoModal) {
    SERVER_API.obtenerDetalleTecnicoModal(reg.titulo, reg.creador, reg.categoria, reg.subcategoria).then(onDetalle);
  } else if (window.google?.script?.run) {
    google.script.run
      .withSuccessHandler(onDetalle)
      .obtenerDetalleTecnicoModal(reg.titulo, reg.creador, reg.categoria, reg.subcategoria);
  }
}
const cerrarModalFicha = () => {
  const m = document.getElementById('modal-ficha-tecnica');
  if (m) m.style.display = 'none';
  if (['inicio', 'listas', 'amigos', 'perfil'].includes(estado.categoria)) {
    if (typeof actualizarVisibilidadMenuInferior === 'function') actualizarVisibilidadMenuInferior(true);
  }
};
function resetearBuscadoresYFormularios() { ['input-search', 'input-buscar-artista-concierto'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
['search-results', 'search-results-artistas'].forEach(id => { const el = document.getElementById(id); if (el) { el.innerHTML = ''; el.style.display = 'none'; } });
ocultarFormulario(); cerrarModalManual(); cerrarModalFicha(); cerrarModalNuevoArtista(); cerrarModalShuffle(); cerrarModalAgregadoRapido(); limpiarCarruselTimers(); }
function limpiarCarruselTimers() { carruselIntervalos.forEach(t => clearInterval(t)); carruselIntervalos = []; }
function cambiarCat(cat, subDestino = null, pushNav = true) {
  if (cat !== 'inicio') {
    if (typeof detenerPollingSpotifyLive === 'function') detenerPollingSpotifyLive();
  }
  if (cat === 'listas') return abrirVistaDashboardListas(pushNav);
  if (cat === 'watchlists') return (typeof abrirMenuWatchlistGlobal === 'function' ? abrirMenuWatchlistGlobal(pushNav) : null);
  if (subDestino && esSubcategoriaWatchlist(subDestino)) {
    return (typeof abrirMenuWatchlistGlobal === 'function' ? abrirMenuWatchlistGlobal(pushNav, cat, subDestino) : null);
  }
  if (pushNav) registrarNavegacionApp(cat);
  resetearBuscadoresYFormularios();
  estado.categoria = cat;
  if (typeof actualizarVisibilidadMenuInferior === 'function') {
    actualizarVisibilidadMenuInferior(cat === 'inicio');
  }
  if (typeof actualizarBarraNavegacionMovil === 'function') {
    actualizarBarraNavegacionMovil(cat === 'inicio' ? 'm-btn-inicio' : null);
  }
  const vIni = document.getElementById('vista-inicio'),
        vCat = document.getElementById('vista-categoria'),
        vDisc = document.getElementById('vista-discover'),
        vPerf = document.getElementById('vista-perfil'),
        vAm = document.getElementById('vista-amigos'),
        vWl = document.getElementById('vista-watchlists'),
        vList = document.getElementById('vista-listas-extendida'),
        vCal = document.getElementById('vista-calendario');
  if (vDisc) vDisc.style.display = 'none';
  if (vPerf) vPerf.style.display = 'none';
  if (vAm) vAm.style.display = 'none';
  if (vWl) vWl.style.display = 'none';
  if (vList) vList.style.display = 'none';
  if (vCal) vCal.style.display = 'none';
  const vAmPerf = document.getElementById('vista-perfil-amigo'); if (vAmPerf) vAmPerf.style.display = 'none';
  const vAmRegs = document.getElementById('vista-registros-amigo'); if (vAmRegs) vAmRegs.style.display = 'none';
  if (cat === 'inicio') {
    estado.subcategoria = '';
    guardarEstadoNavegacionActual('inicio', '');
    actualizarNavWebActiva();
    if (vIni) vIni.style.display = 'block';
    if (vCat) vCat.style.display = 'none';
    renderizarResumenInicio();
    renderizarFeedAmigosResumidoInicio();
    if (!estado.amigosFeedCache || !estado.amigosFeedCache.length) cargarFeedActividadAmigos();
    if (estado.discoverData) renderizarDiscoverVista();
    else precargarDiscoverEnSegundoPlano(1);
  } else {
    if (vIni) vIni.style.display = 'none';
    if (vCat) vCat.style.display = 'block';
    if (cat === 'Lecturas' && typeof obtenerSubcategoriasLecturasOrdenadas === 'function') {
      const ordLecturas = obtenerSubcategoriasLecturasOrdenadas(false);
      if (!subDestino || (!esSubcategoriaWatchlist(subDestino) && !ordLecturas.includes(subDestino))) {
        subDestino = ordLecturas[0] || 'Libros';
      }
    }
    estado.subcategoria = subDestino || CONFIG[cat].subs[0].id;
    guardarEstadoNavegacionActual(cat, estado.subcategoria);
    if (esSubcategoriaWatchlist(estado.subcategoria)) {
      return (typeof abrirMenuWatchlistGlobal === 'function' ? abrirMenuWatchlistGlobal(pushNav, cat, estado.subcategoria) : null);
    }
    actualizarNavWebActiva();
    renderizarSubtabs();
    actualizarVisibilidadCamposEspeciales();
    configurarFormularioFechas();
    filtrarYMostrarHistorial();
    if (typeof animarEntradaSubtab === 'function' && vCat) {
      animarEntradaSubtab(vCat);
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cambiarModoVistaDashboard(modo) {
  estado.modoVistaDashboard = 'lista';
  renderizarStats();
}

function actualizarBotonesModoVistaDashboardUI() {}

function abrirVistaDashboardListas(pushNav = true) {
  if (pushNav) registrarNavegacionApp('listas');
  guardarEstadoNavegacionActual('listas', '');
  resetearBuscadoresYFormularios();
  estado.categoria = 'listas';
  estado.subcategoria = '';
  actualizarBarraNavegacionMovil('m-btn-listas-ext');
  actualizarNavWebActiva();
  if (typeof actualizarVisibilidadMenuInferior === 'function') actualizarVisibilidadMenuInferior(true);
  const vIni = document.getElementById('vista-inicio'); if (vIni) vIni.style.display = 'none';
  const vCat = document.getElementById('vista-categoria'); if (vCat) vCat.style.display = 'none';
  const vDisc = document.getElementById('vista-discover'); if (vDisc) vDisc.style.display = 'none';
  const vPerf = document.getElementById('vista-perfil'); if (vPerf) vPerf.style.display = 'none';
  const vAm = document.getElementById('vista-amigos'); if (vAm) vAm.style.display = 'none';
  const vWl = document.getElementById('vista-watchlists'); if (vWl) vWl.style.display = 'none';
  const vCal = document.getElementById('vista-calendario'); if (vCal) vCal.style.display = 'none';
  const vAmPerf = document.getElementById('vista-perfil-amigo'); if (vAmPerf) vAmPerf.style.display = 'none';
  const vAmRegs = document.getElementById('vista-registros-amigo'); if (vAmRegs) vAmRegs.style.display = 'none';
  const vList = document.getElementById('vista-listas-extendida');
  if (vList) {
    vList.style.display = 'block';
    if (typeof animarEntradaSubtab === 'function') animarEntradaSubtab(vList);
  }
  if (typeof animarCambioTabVista === 'function') animarCambioTabVista('listas');
  if (modoReordenarListasActivo && typeof toggleModoReordenarListas === 'function') {
    toggleModoReordenarListas();
  }
  actualizarBotonesModoVistaDashboardUI();
  renderizarStats();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.cambiarModoVistaDashboard = cambiarModoVistaDashboard;
window.abrirVistaDashboardListas = abrirVistaDashboardListas;
function navegarARegistroDesdeInicio(id, cat, sub) { cambiarCat(cat, sub); setTimeout(() => { const el = document.getElementById(`fila-${id}`) || document.getElementById(`card-${id}`);
if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('row-highlighted'); setTimeout(() => el.classList.remove('row-highlighted'), 2600); }
abrirFichaTecnica(id); }, 350); }
function itemPerteneceAWatchlist(w, cat, sub) {
  if (!w) return false;
  const wCat = String(w.categoria || '').trim();
  const wSub = String(w.subcategoria || '').trim().toLowerCase();
  const subNorm = String(sub || '').trim().toLowerCase();
  if (cat && cat !== 'todas_watchlists' && cat !== 'watchlists') {
    if (wCat && wCat !== cat) return false;
  }
  if (cat === 'Peliculas' || wCat === 'Peliculas') {
    const esDocu = wSub.includes('docu');
    const pideDocu = subNorm.includes('docu');
    return pideDocu ? esDocu : !esDocu;
  }
  if (cat === 'Series' || wCat === 'Series') {
    const esDocu = wSub.includes('docu');
    const pideDocu = subNorm.includes('docu');
    return pideDocu ? esDocu : !esDocu;
  }
  if (cat === 'Musica' || wCat === 'Musica') {
    const esArtista = wSub.includes('artista');
    const pideArtista = subNorm.includes('artista');
    return pideArtista ? esArtista : !esArtista;
  }
  if (cat === 'Juegos' || wCat === 'Juegos') {
    return wCat === 'Juegos' || cat === 'Juegos';
  }
  if (cat === 'Lecturas' || wCat === 'Lecturas') {
    if (subNorm.includes('comic') || subNorm.includes('cómic')) {
      return wSub.includes('comic') || wSub.includes('cómic');
    }
    if (subNorm.includes('manga')) {
      return wSub.includes('manga');
    }
    return !wSub.includes('comic') && !wSub.includes('cómic') && !wSub.includes('manga');
  }
  return true;
}
function contarItemsWatchlistDe(cat, subWl) {
  if (!estado.watchlist || !estado.watchlist.length) return 0;
  if (cat === 'todas_watchlists' || subWl === 'todas_watchlists' || subWl === 'todas') return estado.watchlist.length;
  return estado.watchlist.filter(w => itemPerteneceAWatchlist(w, cat, subWl)).length;
}
function obtenerSubWatchlistDeCategoria(cat, subActual) {
  if (cat === 'Peliculas') {
    if (String(subActual).toLowerCase().includes('docu')) return 'Watchlist: Documentales';
    return 'Watchlist';
  }
  if (cat === 'Series') {
    if (String(subActual).toLowerCase().includes('docu')) return 'Watchlist: Docuseries';
    return 'Watchlist';
  }
  if (cat === 'Musica') {
    if (String(subActual).toLowerCase().includes('artista')) return 'To Listen: Artistas';
    return 'To Listen';
  }
  if (cat === 'Juegos') return 'To Play';
  if (cat === 'Lecturas') {
    const sLow = String(subActual).toLowerCase();
    if (sLow.includes('comic') || sLow.includes('cómic')) return 'To Read: Cómics';
    if (sLow.includes('manga')) return 'To Read: Mangas';
    return 'To Read: Libros';
  }
  return 'Watchlist';
}
function volverAHistorialDesdeWatchlist() {
  const c = estado.categoria;
  if (!CONFIG[c]) return cambiarCat('Peliculas', 'Películas');
  let subHist = 'Películas';
  if (c === 'Peliculas') {
    subHist = String(estado.subcategoria).toLowerCase().includes('docu') ? 'Documentales' : 'Películas';
  } else if (c === 'Series') {
    subHist = String(estado.subcategoria).toLowerCase().includes('docu') ? 'Series Documentales' : 'Temporadas';
  } else if (c === 'Musica') {
    subHist = String(estado.subcategoria).toLowerCase().includes('artista') ? 'Artistas/Grupos' : 'Discos';
  } else if (c === 'Juegos') {
    subHist = 'Videojuegos';
  } else if (c === 'Lecturas') {
    const sLow = String(estado.subcategoria).toLowerCase();
    if (sLow.includes('comic') || sLow.includes('cómic')) subHist = 'Cómics';
    else if (sLow.includes('manga')) subHist = 'Mangas';
    else subHist = 'Libros';
  }
  const vCat = document.getElementById('vista-categoria');
  if (typeof animarSalidaVistaAtras === 'function') {
    animarSalidaVistaAtras(vCat, () => cambiarCat(c, subHist), vCat);
  } else {
    cambiarCat(c, subHist);
  }
}
function renderizarSubtabs() { const box = document.getElementById('subtabs-bar'); const wlBox = document.getElementById('watchlist-dedicated-box'); const backWrap = document.getElementById('cat-back-wrap'); if (box) box.innerHTML = ''; if (wlBox) wlBox.innerHTML = ''; if (backWrap) backWrap.innerHTML = ''; const l = userPrefs.lang || 'es'; const c = estado.categoria; if (!CONFIG[c]) return;
const targetBack = backWrap || box;
if (targetBack) {
  const btnBackListas = document.createElement('button');
  btnBackListas.type = 'button';
  btnBackListas.className = 'btn-subtabs-back-listas btn-mediary-back';
  btnBackListas.title = l === 'en' ? 'Back' : 'Volver';
  btnBackListas.setAttribute('aria-label', l === 'en' ? 'Back' : 'Volver');
  btnBackListas.innerHTML = `<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;"><path d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/></svg>`;
  btnBackListas.onclick = () => {
    const vCat = document.getElementById('vista-categoria');
    const vList = document.getElementById('vista-listas-extendida');
    if (typeof animarSalidaVistaAtras === 'function') {
      animarSalidaVistaAtras(vCat, () => abrirVistaDashboardListas(), vList);
    } else {
      abrirVistaDashboardListas();
    }
  };
  targetBack.appendChild(btnBackListas);
}
const enWl = esSubcategoriaWatchlist(estado.subcategoria);
let subItemsNav = CONFIG[c].subs.filter(s => !s.esWatchlist);
if (c === 'Lecturas' && typeof obtenerSubcategoriasLecturasOrdenadas === 'function') {
  const ordLecturas = obtenerSubcategoriasLecturasOrdenadas(false);
  subItemsNav = subItemsNav.filter(s => ordLecturas.includes(s.id));
  subItemsNav.sort((a, b) => ordLecturas.indexOf(a.id) - ordLecturas.indexOf(b.id));
  if (!enWl && !ordLecturas.includes(estado.subcategoria) && subItemsNav.length > 0) {
    estado.subcategoria = subItemsNav[0].id;
    guardarEstadoNavegacionActual(c, estado.subcategoria);
  }
}
subItemsNav.forEach(s => { const btn = document.createElement('button');
const metaSub = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(c, s.id) : null;
const subClass = metaSub ? `subtab-cat-${metaSub.key}` : '';
const subColor = metaSub ? metaSub.colorVar : 'currentColor';
btn.className = `subtab-btn ${!enWl && estado.subcategoria === s.id ? 'active' : ''} ${subClass}`;
btn.innerHTML = `<span class="subtotal-pill-icon" style="color:${subColor};">${s.emoji}</span><span>${I18N[l]?.subs?.[s.id] || s.nombre}</span>`;
btn.onclick = () => {
  resetearBuscadoresYFormularios();
  estado.subcategoria = s.id;
  guardarEstadoNavegacionActual(estado.categoria, s.id);
  actualizarNavWebActiva();
  renderizarSubtabs();
  actualizarVisibilidadCamposEspeciales();
  configurarFormularioFechas();
  filtrarYMostrarHistorial();
  if (typeof animarEntradaSubtab === 'function') {
    animarEntradaSubtab(document.getElementById('seccion-historial-contenido') || document.getElementById('historial-cards'));
  }
};
if (box) box.appendChild(btn); }); if (wlBox) {
const targetWl = obtenerSubWatchlistDeCategoria(c, estado.subcategoria); const wlMeta = CONFIG[c].subs.find(x => x.id === targetWl) || CONFIG[c].subs.find(x => x.esWatchlist); const countThisWl = contarItemsWatchlistDe(c, targetWl); if (enWl) {
const btnBack = document.createElement('button'); btnBack.type = 'button'; btnBack.className = 'btn-watchlist-special active-wl btn-watchlist-icon-only';
const labelWl = I18N[l]?.subs?.[wlMeta?.id] || wlMeta?.nombre || 'Watchlist';
btnBack.title = `${labelWl} (${countThisWl})`;
btnBack.setAttribute('aria-label', `${labelWl} (${countThisWl})`);
btnBack.innerHTML = `<span class="subtotal-pill-icon" style="color:#f59e0b;">${wlMeta ? wlMeta.emoji : getHeroIcon('bookmark')}</span>`;
btnBack.onclick = () => volverAHistorialDesdeWatchlist(); wlBox.appendChild(btnBack); } else if (wlMeta) { const btnWl = document.createElement('button'); btnWl.type = 'button'; btnWl.className = 'btn-watchlist-special btn-watchlist-icon-only'; const labelWl = I18N[l]?.subs?.[wlMeta.id] || wlMeta.nombre;
btnWl.title = `${labelWl} (${countThisWl})`;
btnWl.setAttribute('aria-label', `${labelWl} (${countThisWl})`);
btnWl.innerHTML = `<span class="subtotal-pill-icon" style="color:#f59e0b;">${wlMeta.emoji}</span>`;
btnWl.onclick = () => {
  if (typeof abrirMenuWatchlistGlobal === 'function') {
    abrirMenuWatchlistGlobal(true, c, targetWl);
  } else {
    cambiarCat(c, targetWl);
  }
};
wlBox.appendChild(btnWl); }
}
aplicarEstilosGlobales(); }
function renderizarBarraTodasWatchlists() { const panel = document.getElementById('all-watchlists-panel'); if (panel) panel.style.display = esSubcategoriaWatchlist(estado.subcategoria) ? 'block' : 'none'; const bar = document.getElementById('all-watchlists-bar'); if (!bar) return; bar.innerHTML = ''; const l = userPrefs.lang || 'es'; TODAS_LAS_WATCHLISTS.forEach(w => { const cant = contarItemsWatchlistDe(w.cat, w.sub);
const activo = estado.categoria === w.cat && estado.subcategoria === w.sub; const btn = document.createElement('button'); btn.type = 'button'; btn.className = `all-wl-pill ${activo ? 'active' : ''}`; const nom = w.sub === 'Watchlist' ? `${w.label}` : (I18N[l].subs[w.sub] || w.label);
btn.innerHTML = `<span class="subtotal-pill-icon">${w.emoji}</span><span>${nom}</span><span class="wl-pill-count">${cant}</span>`; btn.onclick = () => { estado.ultimaWatchlist = { cat: w.cat, sub: w.sub }; cambiarCat(w.cat, w.sub); }; bar.appendChild(btn); }); }
function actualizarBotonFiltroRewatches() {
  const btn = document.getElementById('btn-filtro-rewatches');
  if (!btn) return;
  const l = (typeof userPrefs !== 'undefined' && userPrefs?.lang) || 'es';
  const ocultar = !!(typeof estado !== 'undefined' && estado?.ocultarRewatches);
  btn.classList.toggle('active', ocultar);
  const label = ocultar
    ? (l === 'en' ? 'Show rewatches' : 'Mostrar Rewatches')
    : (l === 'en' ? 'Hide rewatches' : 'Ocultar Rewatches');
  btn.title = label;
  btn.setAttribute('aria-label', label);
  const eyeIcon = ocultar
    ? (typeof getHeroIcon === 'function' ? getHeroIcon('eye-slash', '', 15) : '')
    : (typeof getHeroIcon === 'function' ? getHeroIcon('eye', '', 15) : '');
  const rwIcon = (typeof getHeroIcon === 'function') ? getHeroIcon('arrow-path', '', 15) : '';
  btn.innerHTML = `<span class="rw-btn-icons" style="display:inline-flex;align-items:center;gap:4px;">${rwIcon}${eyeIcon}</span><span id="txt-filtro-rewatches" style="display:none;">${label}</span>`;
}
window.actualizarBotonFiltroRewatches = actualizarBotonFiltroRewatches;

function actualizarVisibilidadCamposEspeciales() { const c = estado.categoria, s = estado.subcategoria; const esWl = esSubcategoriaWatchlist(s);
const isCon = c === 'Musica' && (s === 'Conciertos' || s === 'Concierto'); document.getElementById('seccion-historial-contenido').style.display = esWl ? 'none' : 'block'; document.getElementById('seccion-watchlist-contenido').style.display = esWl ? 'block' : 'none';
const bBusc = document.getElementById('box-buscador-general'); if (bBusc) bBusc.style.display = isCon ? 'none' : 'flex'; const mCon = document.getElementById('modulo-concierto-manual'); if (mCon) mCon.style.display = isCon ? 'block' : 'none'; if (isCon) limpiarModuloConcierto();
const esTemp = c === 'Series' && (s === 'Temporadas' || s.includes('Temporada')); document.getElementById('grupo-temporada').style.display = esTemp ? 'block' : 'none';
if (!esTemp) { document.getElementById('input-temporada-num').value = ''; document.getElementById('chk-temporada-unica').checked = false; }
const admiteRw = subAdmiteRewatch(c, s);
const boxRw = document.getElementById('grupo-rewatch-checkbox');
if (boxRw) {
  boxRw.style.display = (admiteRw && !esTemp) ? 'block' : 'none';
  const chkRw = document.getElementById('chk-es-rewatch');
  if (chkRw) chkRw.checked = false;
  document.querySelectorAll('.btn-rewatch-toggle').forEach(btn => btn.classList.remove('active'));
}
const boxRwSeries = document.getElementById('box-rewatch-series');
if (boxRwSeries) {
  boxRwSeries.style.display = (admiteRw && esTemp) ? 'inline-flex' : 'none';
}
const btnFiltroRw = document.getElementById('btn-filtro-rewatches');
if (btnFiltroRw) {
  btnFiltroRw.style.display = (admiteRw && !esWl) ? 'inline-flex' : 'none';
  if (admiteRw && !esWl) actualizarBotonFiltroRewatches();
}
document.getElementById('grupo-comic-manga').style.display = (c === 'Lecturas' && (s === 'Cómics' || s === 'Cómic' || s === 'Mangas' || s === 'Manga')) ? 'block' : 'none'; document.getElementById('grupo-horas-juegos').style.display = (c === 'Juegos') ? 'block' : 'none';
const admiteRangoForm = subTieneRango(c, s);
const textoProg = admiteRangoForm ? obtenerTextoEnProgreso(c, s) : null;
const boxProg = document.getElementById('grupo-en-progreso');
if (boxProg) {
  if (textoProg && admiteRangoForm) {
    boxProg.style.display = 'block';
    const txtEl = document.getElementById('texto-en-progreso');
    if (txtEl) txtEl.textContent = textoProg;
    const icnEl = document.getElementById('icono-en-progreso');
    if (icnEl) {
      if (c === 'Series') icnEl.innerHTML = getHeroIcon('tv');
      else if (c === 'Musica') icnEl.innerHTML = getHeroIcon('musical-note');
      else if (c === 'Juegos') icnEl.innerHTML = getHeroIcon('gamepad');
      else if (c === 'Lecturas') icnEl.innerHTML = getHeroIcon('book-open');
    }
    const chkProg = document.getElementById('chk-en-progreso');
    if (chkProg) { chkProg.checked = false; toggleEnProgresoFormulario(); }
  } else {
    boxProg.style.display = 'none';
    const chkProg = document.getElementById('chk-en-progreso');
    if (chkProg) chkProg.checked = false;
  }
}
  const inSearch = document.getElementById('input-search');
  if (inSearch) {
    const l = userPrefs.lang || 'es';
    if (esWl) {
      const esArt = String(s).toLowerCase().includes('artista');
      inSearch.placeholder = l === 'en'
        ? (esArt ? 'Search artist or band to add to To Listen...' : `Search to add to ${I18N[l]?.subs?.[s] || s}...`)
        : (esArt ? 'Buscar artista o grupo para agregar a To Listen...' : `Buscar título para agregar a ${I18N[l]?.subs?.[s] || s}...`);
    } else if (c === 'Musica' && (s === 'Artistas/Grupos' || s === 'Artistas')) {
      inSearch.placeholder = l === 'en' ? 'Search artist or band...' : 'Buscar artista o grupo...';
    } else {
      inSearch.placeholder = l === 'en' ? 'Search title in real time...' : 'Buscar título en tiempo real...';
    }
  }
  actualizarBotonLecturaHoyLibros();
}
function toggleOcultarRewatches() {
  estado.ocultarRewatches = !estado.ocultarRewatches;
  actualizarBotonFiltroRewatches();
  filtrarYMostrarHistorial();
}
function actualizarAnioTemporada(num) { if (estado.categoria === 'Series' && estado.seleccionado?.idRef && num) { google.script.run.withSuccessHandler(info => { if (info && estado.seleccionado) { if (info.anioFinTemp) { estado.seleccionado.anio = info.anioFinTemp;
document.getElementById('form-creador-anio').textContent = `(${estado.seleccionado.creador}, ${info.anioFinTemp})`; }
if (info.totalTemporadas) estado.seleccionado.totalSeasons = info.totalTemporadas; }
}).obtenerDatosSerieInfo(estado.seleccionado.idRef, num); }
}
