/* Mediary — js/core/state.js */
let userPrefs = { font: "'Lexend', sans-serif", fontSize: "75%", theme: "slate-dark", themeFamily: "slate", themeMode: "system", appTheme: "default", uiStyle: "modern", lang: "es", categoriasOrden: ['Peliculas', 'Series', 'Musica', 'Juegos', 'Lecturas'], categoriasOcultas: []
}; let perfilUsuario = { nickname: 'Cinéfilo & Lector', bio: 'Coleccionando historias en Mediary', avatar: '🦊', emailGoogle: '', logueadoGoogle: false, favoritos: {}, favoritosOcultos: {}
}; const AVATARES_PRESET = ['🦊', '🐱', '🐶', '🐼', '🦁', '🐯', '🐨', '🐸', '🦉', '🐻', '🐵', '🐰']; const TODAS_CATS_DISCOVER = ['peliculas', 'documentales', 'series', 'docuseries', 'musica', 'juegos', 'libros', 'comics', 'mangas'];
const WATCHLIST_ESTRUCTURA = [
 { cat: 'Peliculas', nombre: 'Películas', emoji: getHeroIcon('film'), subs: [
 { id: 'Películas', subWl: 'Watchlist', nombre: 'Películas', emoji: getHeroIcon('film') },
 { id: 'Documentales', subWl: 'Watchlist: Documentales', nombre: 'Documentales', emoji: getHeroIcon('film') }
 ] },
 { cat: 'Series', nombre: 'Series', emoji: getHeroIcon('tv'), subs: [
 { id: 'Series', subWl: 'Watchlist', nombre: 'Series', emoji: getHeroIcon('tv') },
 { id: 'Series Documentales', subWl: 'Watchlist: Docuseries', nombre: 'Docuseries', emoji: getHeroIcon('tv') }
 ] },
 { cat: 'Musica', nombre: 'Música', emoji: getHeroIcon('musical-note'), subs: [
 { id: 'Discos', subWl: 'To Listen', nombre: 'Discos / Música', emoji: getHeroIcon('musical-note') }
 ] },
 { cat: 'Juegos', nombre: 'Juegos', emoji: getHeroIcon('gamepad'), subs: [
 { id: 'Videojuegos', subWl: 'To Play', nombre: 'Videojuegos', emoji: getHeroIcon('gamepad') }
 ] },
 { cat: 'Lecturas', nombre: 'Lecturas', emoji: getHeroIcon('book-open'), subs: [
 { id: 'Libros', subWl: 'To Read: Libros', nombre: 'Libros', emoji: getHeroIcon('book-open') },
 { id: 'Cómics', subWl: 'To Read: Cómics', nombre: 'Cómics', emoji: getHeroIcon('book-open') },
 { id: 'Mangas', subWl: 'To Read: Mangas', nombre: 'Mangas', emoji: getHeroIcon('book-open') }
 ] }
];
const TODAS_LAS_WATCHLISTS = [
 { cat: 'Peliculas', sub: 'Watchlist', emoji: getHeroIcon('film'), label: 'Películas' },
 { cat: 'Peliculas', sub: 'Watchlist: Documentales', emoji: getHeroIcon('film'), label: 'Documentales' },
 { cat: 'Series', sub: 'Watchlist', emoji: getHeroIcon('tv'), label: 'Series' },
 { cat: 'Series', sub: 'Watchlist: Docuseries', emoji: getHeroIcon('tv'), label: 'Docuseries' },
 { cat: 'Musica', sub: 'To Listen', emoji: getHeroIcon('musical-note'), label: 'To Listen (Música)' },
 { cat: 'Juegos', sub: 'To Play', emoji: getHeroIcon('gamepad'), label: 'To Play (Juegos)' },
 { cat: 'Lecturas', sub: 'To Read: Libros', emoji: getHeroIcon('book-open'), label: 'To Read: Libros' },
 { cat: 'Lecturas', sub: 'To Read: Cómics', emoji: getHeroIcon('book-open'), label: 'To Read: Cómics' },
 { cat: 'Lecturas', sub: 'To Read: Mangas', emoji: getHeroIcon('book-open'), label: 'To Read: Mangas' }
];
const ANIO_MINIMO_SELECTOR = 2022;
const KEY_ULTIMO_ANIO_SISTEMA = 'mediary_ultimo_anio_sistema';
let _ultimoAnioRenderizadoSelector = null;
let _timerCambioAnio = null;
let _listenersCambioAnioRegistrados = false;

function obtenerAnioActualSistema() {
 return Math.max(ANIO_MINIMO_SELECTOR, new Date().getFullYear());
}

function obtenerFechaHoyStr() {
 const d = new Date();
 return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
window.obtenerFechaHoyStr = window.obtenerFechaHoyStr || obtenerFechaHoyStr;
function obtenerListaAniosSelector(anioActual = obtenerAnioActualSistema()) {
 const anios = [];
 for (let y = anioActual; y >= ANIO_MINIMO_SELECTOR; y--) {
  anios.push(String(y));
 }
 return anios;
}
function obtenerListaAniosFechaAproximada(anioActual = obtenerAnioActualSistema()) {
 const anios = [];
 for (let y = anioActual; y >= 2015; y--) {
  anios.push(String(y));
 }
 anios.push('2010', '2005', '2000');
 return anios;
}

let estado = { userEmail: '', anioActivo: String(obtenerAnioActualSistema()), modoAuthModal: 'login', categoria: 'inicio', subcategoria: 'Películas', wlCategoria: 'Peliculas', wlSubcategoria: 'Películas', ultimaWatchlist: { cat: 'Peliculas', sub: 'Watchlist' }, registros: [], watchlist: [], proximosEstrenos: [], modoVistaDashboard: localStorage.getItem('mediary_dashboard_view_mode') || 'lista', discoverData: null, discoverSeed: 1, discoverCatsActivas: [...TODAS_CATS_DISCOVER], discoverLimites: {},
discoverAutoRefresh: true, modoConfigurarFavs: false, seleccionado: null, calificacion: 0, tipoEventoConcierto: 'Concierto', artistasConciertoSeleccionados: [], ocultarRewatches: false, ultimoTerminoBuscado: '', artistaPendienteSugerido: null, subFavEnEdicion: null, registrosImportarPendientes: [], amigosFeedCache: [], amigosFeedFiltro: 'todas', amigos: [], amigosLiveCache: { music: [], games: [] }, amigosLiveIndex: { music: 0, game: 0 }
}; window.estado = estado; let cropState = { img: null, scale: 1, minScale: 1, offsetX: 0, offsetY: 0, dragging: false, startX: 0, startY: 0, confirmedDataUrl: null, listenersReady: false };
let fpInicio = null, fpFin = null; let timerDebounce = null, timerDebounceArtista = null, timerDebounceFav = null; let timerAutoDiscover = null; let carruselIntervalos = []; let serieCompletaPendiente = null, calificacionSerieCompleta = 0, idParaEliminar = null, regParaEliminar = null;
let _searchRequestId = 0; const _CLIENT_SEARCH_CACHE = new Map(); const _CLIENT_ARTISTA_CACHE = new Map();
function esSubcategoriaWatchlist(s) { if (!s) return false; return s === 'Watchlist' || s.startsWith('Watchlist:') || s === 'To Listen' || s === 'To Play' || s.startsWith('To Read') || s === 'todas_watchlists'; }

function renderizarOpcionesSelectorAnio(forzar = false) {
 const cont = document.getElementById('lista-anios-selector');
 if (!cont) return;
 const anioActualNum = obtenerAnioActualSistema();
 const anioActualStr = String(anioActualNum);
 if (!forzar && _ultimoAnioRenderizadoSelector === anioActualStr && cont.children.length > 0) return;
 const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang) ? userPrefs.lang : 'es';
 const badgeTxt = (typeof I18N !== 'undefined' && I18N[l] && I18N[l].year_current_badge) ? I18N[l].year_current_badge : (l === 'en' ? 'Current' : 'Actual');
 const svgSparkles = '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:-0.15em;margin-right:4px;"><path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/></svg>';
 const svgCalendar = '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:-0.15em;margin-right:4px;"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5m-9-3h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"/></svg>';
 const anios = obtenerListaAniosSelector(anioActualNum);
 cont.innerHTML = anios.map(anio => {
  const esActual = anio === anioActualStr;
  const icono = esActual ? svgSparkles : svgCalendar;
  const badge = esActual ? ` <span class="year-badge-active" data-i18n="year_current_badge">${badgeTxt}</span>` : '';
  const activeCls = estado.anioActivo === anio ? ' active' : '';
  return `<button type="button" class="year-dropdown-item${activeCls}" data-year="${anio}" onclick="cambiarAnioVisualizacion('${anio}')"><span>${icono}${anio}</span>${badge}</button>`;
 }).join('');
 _ultimoAnioRenderizadoSelector = anioActualStr;
}
function resolverAnioActivoInicial() {
 const anioActualNum = obtenerAnioActualSistema();
 const anioActualStr = String(anioActualNum);
 let anioGuardado = null;
 let ultimoAnioSistema = null;
 try {
  anioGuardado = localStorage.getItem('mediary_anio_activo');
  ultimoAnioSistema = localStorage.getItem(KEY_ULTIMO_ANIO_SISTEMA);
 } catch (e) {}

 const aniosValidos = new Set(obtenerListaAniosSelector(anioActualNum));
 aniosValidos.add('todos');

 const anioAnteriorRegistrado = ultimoAnioSistema || (anioActualNum > 2026 ? '2026' : anioActualStr);
 const cambioDeAnioDetectado = anioActualNum > Number(anioAnteriorRegistrado);

 if (!anioGuardado || !aniosValidos.has(anioGuardado)) {
  estado.anioActivo = anioActualStr;
 } else if (cambioDeAnioDetectado && anioGuardado === anioAnteriorRegistrado) {
  estado.anioActivo = anioActualStr;
  try { localStorage.setItem('mediary_anio_activo', anioActualStr); } catch (e) {}
 } else {
  estado.anioActivo = anioGuardado;
 }

 try { localStorage.setItem(KEY_ULTIMO_ANIO_SISTEMA, anioActualStr); } catch (e) {}
}
function verificarCambioDeAnioAutomatico() {
 const anioActualNum = obtenerAnioActualSistema();
 const anioActualStr = String(anioActualNum);
 if (_ultimoAnioRenderizadoSelector && _ultimoAnioRenderizadoSelector === anioActualStr) return false;

 let ultimoGuardado = null;
 try { ultimoGuardado = localStorage.getItem(KEY_ULTIMO_ANIO_SISTEMA); } catch (e) {}
 const anioBase = _ultimoAnioRenderizadoSelector || ultimoGuardado || anioActualStr;
 const huboCambioAnio = anioActualNum > Number(anioBase);

 if (huboCambioAnio && estado.anioActivo === anioBase) {
  estado.anioActivo = anioActualStr;
  try { localStorage.setItem('mediary_anio_activo', anioActualStr); } catch (e) {}
 }
 try { localStorage.setItem(KEY_ULTIMO_ANIO_SISTEMA, anioActualStr); } catch (e) {}

 renderizarOpcionesSelectorAnio(true);
 actualizarUISelectorAnio();

 if (typeof inicializarSelectoresFechasAproximadas === 'function') {
  inicializarSelectoresFechasAproximadas();
 }

 if (huboCambioAnio) {
  if (estado.categoria === 'inicio') {
   if (typeof renderizarResumenInicio === 'function') renderizarResumenInicio();
   if (typeof renderizarFeedAmigosResumidoInicio === 'function') renderizarFeedAmigosResumidoInicio();
   if (typeof renderizarDiscoverVista === 'function') renderizarDiscoverVista();
  } else if (estado.categoria === 'listas' && typeof renderizarStats === 'function') {
   renderizarStats();
  } else if (estado.categoria === 'perfil') {
   if (typeof renderizarFavoritosPerfil === 'function') renderizarFavoritosPerfil();
   if (typeof calcularYMostrarEstadisticasPerfil === 'function') calcularYMostrarEstadisticasPerfil();
  } else if (!esSubcategoriaWatchlist(estado.subcategoria) && typeof filtrarYMostrarHistorial === 'function') {
   filtrarYMostrarHistorial();
  }
 }
 return huboCambioAnio;
}
function programarVerificacionAnioNuevo() {
 if (_timerCambioAnio) {
  clearTimeout(_timerCambioAnio);
  _timerCambioAnio = null;
 }
 const ahora = new Date();
 const proximoAnioNuevo = new Date(ahora.getFullYear() + 1, 0, 1, 0, 0, 2);
 const msRestantes = proximoAnioNuevo.getTime() - ahora.getTime();
 // setTimeout tiene un límite máximo de ~24.8 días; reprogramar en bloques seguros hasta Año Nuevo
 const MAX_BLOQUE_MS = 12 * 60 * 60 * 1000;
 const delay = Math.max(1000, Math.min(msRestantes, MAX_BLOQUE_MS));
 _timerCambioAnio = setTimeout(() => {
  verificarCambioDeAnioAutomatico();
  programarVerificacionAnioNuevo();
 }, delay);

 if (!_listenersCambioAnioRegistrados) {
  _listenersCambioAnioRegistrados = true;
  document.addEventListener('visibilitychange', () => {
   if (document.visibilityState === 'visible') {
    verificarCambioDeAnioAutomatico();
    programarVerificacionAnioNuevo();
   }
  });
  window.addEventListener('focus', () => {
   verificarCambioDeAnioAutomatico();
  });
 }
}

function toggleMenuAniosApp(e) {
 if (e) { e.stopPropagation(); e.preventDefault(); }
 verificarCambioDeAnioAutomatico();
 const m = document.getElementById('menu-desplegable-anios');
 const arr = document.getElementById('arrow-selector-anio');
 if (!m) return;
 const estaAbierto = m.style.display !== 'none';
 m.style.display = estaAbierto ? 'none' : 'block';
 if (arr) arr.style.transform = estaAbierto ? 'rotate(0deg)' : 'rotate(180deg)';
}
function cerrarMenuAniosApp() {
 const m = document.getElementById('menu-desplegable-anios');
 const arr = document.getElementById('arrow-selector-anio');
 if (m) m.style.display = 'none';
 if (arr) arr.style.transform = 'rotate(0deg)';
}
function actualizarUISelectorAnio() {
 renderizarOpcionesSelectorAnio();
 const anioActualStr = String(obtenerAnioActualSistema());
 const lblStats = document.getElementById('stats-lbl-cur-year');
 if (lblStats) lblStats.textContent = anioActualStr;
 const lblPerfilStats = document.getElementById('perfil-stats-lbl-cur-year');
 if (lblPerfilStats) lblPerfilStats.textContent = anioActualStr;
 const l = userPrefs.lang || 'es';
 const label = document.getElementById('label-anio-activo');
 if (label) label.textContent = estado.anioActivo === 'todos' ? (l === 'en' ? 'All' : 'Todos') : estado.anioActivo;
 const btn = document.getElementById('btn-selector-anio');
 if (btn) btn.title = l === 'en' ? `Filter records by year (Active: ${estado.anioActivo === 'todos' ? 'All Time' : estado.anioActivo})` : `Filtrar registros por año (Activo: ${estado.anioActivo === 'todos' ? 'Todos los Tiempos' : estado.anioActivo})`;
 document.querySelectorAll('#menu-desplegable-anios .year-dropdown-item').forEach(btn => {
 btn.classList.toggle('active', btn.getAttribute('data-year') === estado.anioActivo);
 });
}
function cambiarAnioVisualizacion(anio) {
 estado.anioActivo = anio;
 try { localStorage.setItem('mediary_anio_activo', anio); } catch (e) {}
 actualizarUISelectorAnio();
 cerrarMenuAniosApp();
 if (estado.categoria === 'inicio') { renderizarResumenInicio(); renderizarFeedAmigosResumidoInicio(); renderizarDiscoverVista(); }
 else if (estado.categoria === 'listas') renderizarStats();
 else if (estado.categoria === 'perfil') { renderizarFavoritosPerfil(); calcularYMostrarEstadisticasPerfil(); }
 else if (!esSubcategoriaWatchlist(estado.subcategoria)) filtrarYMostrarHistorial();
 const l = userPrefs.lang || 'es';
 mostrarToastPersonalizado(anio === 'todos' ? (l === 'en' ? ' Displaying records of All Time' : ' Mostrando registros de Todos los Tiempos') : (l === 'en' ? ` Displaying records from year ${anio}` : ` Mostrando registros del año ${anio}`));
}
const _YEAR_PARSE_CACHE = new Map();
function extraerAnioDeRegistro(r) {
 if (!r) return '';
 const fFin = r.fechaFin;
 const fIni = r.fechaInicio;
 const finValida = fFin && fFin !== 'Sin fecha' && !esEnProgresoTexto(fFin);
 const iniValida = fIni && fIni !== 'Sin fecha';
 const f = finValida ? fFin : (iniValida ? fIni : '');
 if (!f) return '';
 const key = String(f);
 if (_YEAR_PARSE_CACHE.has(key)) return _YEAR_PARSE_CACHE.get(key);
 const m = key.match(/\b(20\d{2}|19\d{2})\b/);
 const res = m ? m[1] : '';
 if (_YEAR_PARSE_CACHE.size > 4000) _YEAR_PARSE_CACHE.clear();
 _YEAR_PARSE_CACHE.set(key, res);
 return res;
}
function obtenerRegistrosFiltradosPorAnio() {
 if (!estado.anioActivo || estado.anioActivo === 'todos') return estado.registros;
 return estado.registros.filter(r => extraerAnioDeRegistro(r) === estado.anioActivo);
}

function cargarPreferenciasLocales() { try { const p = (localStorage.getItem('Mediary_prefs_v1') || localStorage.getItem('MyMediary_prefs_v1')); if (p) { const parsed = JSON.parse(p); const customFontChosen = localStorage.getItem('mediary_user_custom_font'); if (!customFontChosen && (!parsed.font || parsed.font.includes('Plus Jakarta Sans'))) { parsed.font = "'Lexend', sans-serif"; } const customSizeChosen = localStorage.getItem('mediary_user_custom_font_size') === 'true'; if (!customSizeChosen && parsed.fontSize === '100%') { parsed.fontSize = '75%'; } userPrefs = Object.assign(userPrefs, parsed); } } catch (e) {} userPrefs.uiStyle = 'modern'; if (!userPrefs.appTheme || userPrefs.appTheme === 'minimalist') userPrefs.appTheme = 'default'; if (!userPrefs.fontSize || !['50%', '62%', '75%', '88%', '100%'].includes(userPrefs.fontSize)) userPrefs.fontSize = '75%';
if (!userPrefs.notificaciones || typeof userPrefs.notificaciones !== 'object') { userPrefs.notificaciones = { habilitadas: true, racha21: true, likesAmigos: true, novedadesAmigos: true }; }
resolverAnioActivoInicial();
try { const u = (localStorage.getItem('Mediary_active_user_v1') || localStorage.getItem('MyMediary_active_user_v1')); if (u) estado.userEmail = u.trim().toLowerCase(); } catch (e) {}
try { const pf = (localStorage.getItem('Mediary_perfil_v1') || localStorage.getItem('MyMediary_perfil_v1')); if (pf) { perfilUsuario = Object.assign(perfilUsuario, JSON.parse(pf)); if (!estado.userEmail && perfilUsuario.emailGoogle) estado.userEmail = perfilUsuario.emailGoogle.trim().toLowerCase(); if (!perfilUsuario.portada && perfilUsuario.preferencias?.portada) perfilUsuario.portada = perfilUsuario.preferencias.portada; if (!perfilUsuario.personajeFavorito && perfilUsuario.favoritos?.personajeFavorito) perfilUsuario.personajeFavorito = perfilUsuario.favoritos.personajeFavorito; if (!perfilUsuario.cancionFavorita && (perfilUsuario.favoritos?.cancionFavorita || perfilUsuario.preferencias?.cancionFavorita)) perfilUsuario.cancionFavorita = perfilUsuario.favoritos?.cancionFavorita || perfilUsuario.preferencias?.cancionFavorita; } } catch (e) {}
aplicarEstilosGlobales(); actualizarTextosInterfaz(); renderizarCabeceraPerfil(); actualizarUISelectorAnio(); if (typeof cargarProximosEstrenos === 'function') cargarProximosEstrenos();
const gn = document.getElementById('home-greeting-nickname');
if (gn && perfilUsuario && perfilUsuario.nickname) {
  gn.textContent = perfilUsuario.nickname;
}
}
let _timerSyncCloudPrefs = null;
let _tieneSyncPendienteNube = false;

function limpiarDatosCuentaEnDispositivo_() {
  const keys = [
    'mediary_spotify_token',
    'mediary_spotify_refresh_token',
    'mediary_spotify_expires_at',
    'mediary_spotify_user',
    'mediary_spotify_stats',
    'mediary_spotify_accumulator',
    'mediary_spotify_album_tracker',
    'mediary_spotify_selected_range',
    'mediary_spotify_preferred_device_id',
    'mediary_spotify_now_playing',
    'mediary_spotify_last_auto_sync',
    'mediary_lastfm_connected',
    'mediary_lastfm_username',
    'mediary_lastfm_user',
    'mediary_lastfm_stats',
    'mediary_lastfm_selected_period',
    'mediary_lastfm_last_auto_sync',
    'mediary_psn_connected',
    'mediary_psn_username',
    'mediary_psn_npsso',
    'mediary_psn_user',
    'mediary_psn_stats',
    'mediary_psn_now_playing',
    'mediary_psn_manual_state',
    'mediary_psn_last_auto_sync',
    'mediary_steam_connected',
    'mediary_steam_id',
    'mediary_steam_id64',
    'mediary_steam_api_key',
    'mediary_steam_user',
    'mediary_steam_stats',
    'mediary_steam_now_playing',
    'mediary_last_active_game_platform',
    'mediary_cuentas_sync_updated_at',
    'mediary_liked_reviews',
    'mediary_dias_lectura_default',
    'mediary_tiempos_lectura_default'
  ];
  keys.forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });

  if (typeof detenerPollingSpotifyLive === 'function') detenerPollingSpotifyLive();
  if (typeof detenerPollingSteamLive === 'function') detenerPollingSteamLive();
  if (typeof _spotifyNowPlayingCache !== 'undefined') _spotifyNowPlayingCache = null;
  if (typeof _spotifyUltimaConsultaLive !== 'undefined') _spotifyUltimaConsultaLive = 0;
  if (typeof _steamUltimaConsultaLive !== 'undefined') _steamUltimaConsultaLive = 0;
  window.spotifyCardExpanded = undefined;
  window.psnCardExpanded = undefined;
  window.friendsSpCardExpanded = undefined;
  window.friendsPsnCardExpanded = undefined;
}
window.limpiarDatosCuentaEnDispositivo_ = limpiarDatosCuentaEnDispositivo_;

function empaquetarPreferenciasYAppsEnPerfil_(opciones = {}) {
  if (!perfilUsuario) perfilUsuario = {};
  if (!perfilUsuario.preferencias) perfilUsuario.preferencias = {};

  const ahora = Date.now();
  const uiUpdatedAt = Number(userPrefs.updatedAt) || ahora;

  const friendsSpExp = localStorage.getItem('mediary_friends_sp_card_expanded') === 'true' ||
    localStorage.getItem('mediary_friends_spotify_card_expanded') === 'true';

  // 1. Empaquetar configuración visual completa (Themes, fonts, idioma, tamaños, notificaciones, vista)
  const configUI = {
    themeFamily: userPrefs.themeFamily || 'slate',
    themeMode: userPrefs.themeMode || 'dark',
    theme: userPrefs.theme || ((userPrefs.themeFamily || 'slate') + '-' + (userPrefs.themeMode || 'dark')),
    appTheme: userPrefs.appTheme || 'default',
    uiStyle: userPrefs.uiStyle || 'modern',
    font: userPrefs.font || "'Lexend', sans-serif",
    fontSize: userPrefs.fontSize || '75%',
    lang: userPrefs.lang || 'es',
    showEmojis: userPrefs.showEmojis !== false,
    categoriasOrden: Array.isArray(userPrefs.categoriasOrden) ? userPrefs.categoriasOrden : [],
    categoriasOcultas: Array.isArray(userPrefs.categoriasOcultas) ? userPrefs.categoriasOcultas : [],
    notificaciones: userPrefs.notificaciones || {},
    customFontChosen: localStorage.getItem('mediary_user_custom_font') === 'true',
    customFontSizeChosen: localStorage.getItem('mediary_user_custom_font_size') === 'true',
    dashboardViewMode: localStorage.getItem('mediary_dashboard_view_mode') || '',
    anioActivo: localStorage.getItem('mediary_anio_activo') || '',
    cardExpanded: {
      spotify: localStorage.getItem('mediary_spotify_card_expanded') === 'true',
      psn: localStorage.getItem('mediary_psn_card_expanded') === 'true',
      friends_spotify: friendsSpExp,
      friends_psn: localStorage.getItem('mediary_friends_psn_card_expanded') === 'true'
    },
    updatedAt: uiUpdatedAt
  };
  perfilUsuario.preferencias.configuracion_ui = configUI;
  perfilUsuario.preferencias.notificaciones = Object.assign({}, userPrefs.notificaciones || {});

  // 2. Empaquetar todas las cuentas y apps vinculadas (Spotify, Last.fm, PlayStation, Steam, API keys)
  let cuentasTs = Number(localStorage.getItem('mediary_cuentas_sync_updated_at')) || 0;
  if (!opciones.soloUI || !cuentasTs) {
    cuentasTs = ahora;
    try { localStorage.setItem('mediary_cuentas_sync_updated_at', String(cuentasTs)); } catch (e) {}
  }

  const spToken = localStorage.getItem('mediary_spotify_token') || '';
  const spRefresh = localStorage.getItem('mediary_spotify_refresh_token') || '';
  const cuentasVinculadas = {
    spotify: {
      connected: !!(spToken || spRefresh),
      token: spToken,
      refreshToken: spRefresh,
      expiresAt: localStorage.getItem('mediary_spotify_expires_at') || '',
      clientId: localStorage.getItem('mediary_spotify_client_id') || '',
      user: localStorage.getItem('mediary_spotify_user') || '',
      stats: localStorage.getItem('mediary_spotify_stats') || '',
      accumulator: localStorage.getItem('mediary_spotify_accumulator') || '',
      albumTracker: localStorage.getItem('mediary_spotify_album_tracker') || '',
      selectedRange: localStorage.getItem('mediary_spotify_selected_range') || '',
      preferredDeviceId: localStorage.getItem('mediary_spotify_preferred_device_id') || '',
      nowPlaying: localStorage.getItem('mediary_spotify_now_playing') || ''
    },
    lastfm: {
      connected: localStorage.getItem('mediary_lastfm_connected') === 'true',
      username: localStorage.getItem('mediary_lastfm_username') || '',
      user: localStorage.getItem('mediary_lastfm_user') || '',
      stats: localStorage.getItem('mediary_lastfm_stats') || '',
      selectedPeriod: localStorage.getItem('mediary_lastfm_selected_period') || 'overall'
    },
    playstation: {
      connected: localStorage.getItem('mediary_psn_connected') === 'true',
      username: localStorage.getItem('mediary_psn_username') || '',
      npsso: localStorage.getItem('mediary_psn_npsso') || '',
      user: localStorage.getItem('mediary_psn_user') || '',
      stats: localStorage.getItem('mediary_psn_stats') || '',
      nowPlaying: localStorage.getItem('mediary_psn_now_playing') || '',
      manualState: localStorage.getItem('mediary_psn_manual_state') || ''
    },
    steam: {
      connected: localStorage.getItem('mediary_steam_connected') === 'true',
      id: localStorage.getItem('mediary_steam_id') || '',
      id64: localStorage.getItem('mediary_steam_id64') || '',
      apiKey: localStorage.getItem('mediary_steam_api_key') || '',
      user: localStorage.getItem('mediary_steam_user') || '',
      stats: localStorage.getItem('mediary_steam_stats') || '',
      nowPlaying: localStorage.getItem('mediary_steam_now_playing') || ''
    },
    lastActiveGamePlatform: localStorage.getItem('mediary_last_active_game_platform') || '',
    apiKeys: {
      comicvine: localStorage.getItem('mediary_comicvine_key') || window.COMICVINE_K || '',
      marvel: localStorage.getItem('mediary_marvel_key') || window.MARVEL_K || '',
      lastfm: localStorage.getItem('mediary_lastfm_api_key') || window.LASTFM_API_KEY || '',
      igdbClientId: localStorage.getItem('mediary_igdb_client_id') || window.IGDB_CLIENT_ID || '',
      igdbToken: localStorage.getItem('mediary_igdb_token') || window.IGDB_TOKEN || ''
    },
    updatedAt: cuentasTs
  };
  perfilUsuario.preferencias.cuentas_vinculadas = cuentasVinculadas;
  perfilUsuario.preferencias.cuentasVinculadas = cuentasVinculadas;

  // 3. Empaquetar actividad en vivo unificada (juegos + música)
  perfilUsuario.preferencias.actividad = {
    playstationNowPlaying: cuentasVinculadas.playstation.nowPlaying,
    steamNowPlaying: cuentasVinculadas.steam.nowPlaying,
    lastActiveGamePlatform: cuentasVinculadas.lastActiveGamePlatform,
    spotifyNowPlaying: cuentasVinculadas.spotify.nowPlaying,
    updatedAt: cuentasTs
  };

  // 4. Empaquetar rachas (incluyendo racha manual de lectura y mapa de tiempos registrados)
  const listaDiasLectura = typeof obtenerListaDiasLectura === 'function' ? obtenerListaDiasLectura() : [];
  const mapaTiemposLectura = typeof obtenerMapaTiemposLectura === 'function' ? obtenerMapaTiemposLectura() : {};
  const rachasData = {
    diasLectura: Array.isArray(listaDiasLectura) ? listaDiasLectura : [],
    tiemposLectura: (typeof mapaTiemposLectura === 'object' && mapaTiemposLectura !== null) ? mapaTiemposLectura : {},
    updatedAt: ahora
  };
  perfilUsuario.preferencias.rachas = rachasData;
  perfilUsuario.diasLectura = rachasData.diasLectura;
  perfilUsuario.tiemposLectura = rachasData.tiemposLectura;
}

function sincronizarPreferenciasYAppsHaciaNube(forzarInmediato = false, opciones = {}) {
  if (!estado || !estado.userEmail) return;

  try {
    empaquetarPreferenciasYAppsEnPerfil_(opciones);
    guardarPerfilLocal();
  } catch (err) {
    console.error('Error empaquetando preferencias locales:', err);
  }

  const ejecutar = () => {
    _tieneSyncPendienteNube = false;
    _timerSyncCloudPrefs = null;
    try {
      empaquetarPreferenciasYAppsEnPerfil_(opciones);
      guardarPerfilLocal();
      if (typeof SERVER_API !== 'undefined' && SERVER_API?.guardarPerfilUsuario && estado?.userEmail) {
        SERVER_API.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
      }
      if (typeof google !== 'undefined' && google.script?.run) {
        google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
      }
    } catch(err) {
      console.error('Error sincronizando preferencias hacia la nube:', err);
    }
  };

  if (forzarInmediato) {
    if (_timerSyncCloudPrefs) clearTimeout(_timerSyncCloudPrefs);
    ejecutar();
  } else {
    _tieneSyncPendienteNube = true;
    if (_timerSyncCloudPrefs) clearTimeout(_timerSyncCloudPrefs);
    _timerSyncCloudPrefs = setTimeout(ejecutar, 350);
  }
}
window.sincronizarPreferenciasYAppsHaciaNube = sincronizarPreferenciasYAppsHaciaNube;

function flushSyncPreferenciasNube_() {
  if (_tieneSyncPendienteNube && estado && estado.userEmail) {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
}
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('pagehide', flushSyncPreferenciasNube_);
}
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushSyncPreferenciasNube_();
  });
}

function restaurarPreferenciasYAppsDesdeNube(prefs, opciones = {}) {
  if (!prefs || typeof prefs !== 'object') return false;
  const esInicioSesionNuevo = !!(opciones && opciones.esInicioSesionNuevo);
  let cambio = false;
  let idiomaCambio = false;
  let subirPendientesLocales = false;

  // 1. Restaurar configuración de UI (Theme, Font, Tamaño, Idioma, Notificaciones, Tarjetas)
  const configUI = prefs.configuracion_ui;
  if (configUI && typeof configUI === 'object') {
    const localUpdatedAt = Number(userPrefs.updatedAt) || 0;
    const cloudUpdatedAt = Number(configUI.updatedAt) || 0;
    const aplicarCloudUI = esInicioSesionNuevo || localUpdatedAt === 0 || cloudUpdatedAt >= localUpdatedAt;

    if (aplicarCloudUI) {
      const langAnterior = userPrefs.lang || 'es';
      const huboCambioVisual = esInicioSesionNuevo || (
        (configUI.themeFamily && configUI.themeFamily !== userPrefs.themeFamily) ||
        (configUI.themeMode && configUI.themeMode !== userPrefs.themeMode) ||
        (configUI.theme && configUI.theme !== userPrefs.theme) ||
        (configUI.appTheme && configUI.appTheme !== userPrefs.appTheme) ||
        (configUI.font && configUI.font !== userPrefs.font) ||
        (configUI.fontSize && configUI.fontSize !== userPrefs.fontSize) ||
        (configUI.lang && configUI.lang !== userPrefs.lang) ||
        (typeof configUI.showEmojis === 'boolean' && configUI.showEmojis !== userPrefs.showEmojis) ||
        (Array.isArray(configUI.categoriasOrden) && JSON.stringify(configUI.categoriasOrden) !== JSON.stringify(userPrefs.categoriasOrden)) ||
        (Array.isArray(configUI.categoriasOcultas) && JSON.stringify(configUI.categoriasOcultas) !== JSON.stringify(userPrefs.categoriasOcultas))
      );

      if (configUI.themeFamily) userPrefs.themeFamily = configUI.themeFamily;
      if (configUI.themeMode) userPrefs.themeMode = configUI.themeMode;
      if (configUI.theme) {
        userPrefs.theme = configUI.theme;
      } else if (configUI.themeFamily && configUI.themeMode) {
        userPrefs.theme = configUI.themeFamily + '-' + configUI.themeMode;
      }
      if (configUI.appTheme) userPrefs.appTheme = configUI.appTheme;
      if (configUI.uiStyle) userPrefs.uiStyle = configUI.uiStyle;
      if (configUI.font) {
        userPrefs.font = configUI.font;
        try {
          if (configUI.customFontChosen === false) localStorage.removeItem('mediary_user_custom_font');
          else localStorage.setItem('mediary_user_custom_font', 'true');
        } catch(e) {}
      }
      if (configUI.fontSize && ['50%', '62%', '75%', '88%', '100%'].includes(configUI.fontSize)) {
        userPrefs.fontSize = configUI.fontSize;
        try {
          if (configUI.customFontSizeChosen) localStorage.setItem('mediary_user_custom_font_size', 'true');
          else if (esInicioSesionNuevo) localStorage.removeItem('mediary_user_custom_font_size');
        } catch(e) {}
      }
      if (configUI.lang) {
        userPrefs.lang = configUI.lang;
        if (configUI.lang !== langAnterior) idiomaCambio = true;
      }
      if (typeof configUI.showEmojis === 'boolean') userPrefs.showEmojis = configUI.showEmojis;
      if (Array.isArray(configUI.categoriasOrden) && configUI.categoriasOrden.length) {
        userPrefs.categoriasOrden = configUI.categoriasOrden;
      }
      if (Array.isArray(configUI.categoriasOcultas)) {
        userPrefs.categoriasOcultas = configUI.categoriasOcultas;
      }
      if (configUI.notificaciones && typeof configUI.notificaciones === 'object') {
        userPrefs.notificaciones = Object.assign(userPrefs.notificaciones || {}, configUI.notificaciones);
      }
      if (configUI.dashboardViewMode) {
        try { localStorage.setItem('mediary_dashboard_view_mode', configUI.dashboardViewMode); } catch (e) {}
      }
      if (configUI.anioActivo) {
        try { localStorage.setItem('mediary_anio_activo', String(configUI.anioActivo)); } catch (e) {}
      }

      if (configUI.cardExpanded && typeof configUI.cardExpanded === 'object') {
        if (typeof configUI.cardExpanded.spotify === 'boolean') {
          localStorage.setItem('mediary_spotify_card_expanded', configUI.cardExpanded.spotify ? 'true' : 'false');
          window.spotifyCardExpanded = configUI.cardExpanded.spotify;
        }
        if (typeof configUI.cardExpanded.psn === 'boolean') {
          localStorage.setItem('mediary_psn_card_expanded', configUI.cardExpanded.psn ? 'true' : 'false');
          window.psnCardExpanded = configUI.cardExpanded.psn;
        }
        if (typeof configUI.cardExpanded.friends_spotify === 'boolean') {
          localStorage.setItem('mediary_friends_sp_card_expanded', configUI.cardExpanded.friends_spotify ? 'true' : 'false');
          localStorage.setItem('mediary_friends_spotify_card_expanded', configUI.cardExpanded.friends_spotify ? 'true' : 'false');
          window.friendsSpCardExpanded = configUI.cardExpanded.friends_spotify;
        }
        if (typeof configUI.cardExpanded.friends_psn === 'boolean') {
          localStorage.setItem('mediary_friends_psn_card_expanded', configUI.cardExpanded.friends_psn ? 'true' : 'false');
          window.friendsPsnCardExpanded = configUI.cardExpanded.friends_psn;
        }
      }

      userPrefs.updatedAt = cloudUpdatedAt || Date.now();
      try { localStorage.setItem('Mediary_prefs_v1', JSON.stringify(userPrefs)); } catch (e) {}

      // Sincronizar inputs ocultos del modal de configuración
      const elLang = document.getElementById('cfg-lang');
      const elFont = document.getElementById('cfg-font');
      const elSize = document.getElementById('cfg-font-size');
      const elTheme = document.getElementById('cfg-theme');
      const elAppTheme = document.getElementById('cfg-app-theme');
      if (elLang) elLang.value = userPrefs.lang || 'es';
      if (elFont) elFont.value = userPrefs.font || "'Lexend', sans-serif";
      if (elSize) elSize.value = userPrefs.fontSize || '75%';
      if (elTheme) elTheme.value = userPrefs.themeFamily || 'slate';
      if (elAppTheme) elAppTheme.value = userPrefs.appTheme || 'default';

      if (huboCambioVisual) {
        if (typeof aplicarEstilosGlobales === 'function') aplicarEstilosGlobales();
        if (typeof actualizarTextosInterfaz === 'function') actualizarTextosInterfaz();
        if (typeof inicializarSelectoresFechasAproximadas === 'function') inicializarSelectoresFechasAproximadas();
        if (typeof actualizarUISelectorAnio === 'function') actualizarUISelectorAnio();
        if (typeof actualizarTarjetasVisualesConfig === 'function') actualizarTarjetasVisualesConfig();
        if (typeof sincronizarSwitchesNotificaciones === 'function') sincronizarSwitchesNotificaciones();
        cambio = true;
      }
    } else if (localUpdatedAt > cloudUpdatedAt) {
      subirPendientesLocales = true;
    }
  } else if (!esInicioSesionNuevo) {
    // Cuenta antigua sin configuracion_ui aún en la nube -> subir preferencias actuales
    subirPendientesLocales = true;
  }

  // 2. Restaurar cuentas vinculadas y actividad en vivo (Spotify, Last.fm, PlayStation, Steam)
  const cuentas = prefs.cuentas_vinculadas || prefs.cuentasVinculadas;
  if (cuentas && typeof cuentas === 'object') {
    const localCuentasAt = Number(localStorage.getItem('mediary_cuentas_sync_updated_at')) || 0;
    const cloudCuentasAt = Number(cuentas.updatedAt) || 0;
    const aplicarCloudCuentas = esInicioSesionNuevo || localCuentasAt === 0 || cloudCuentasAt >= localCuentasAt;

    if (aplicarCloudCuentas) {
      const setOrRemove = (key, val) => {
        if (val !== undefined && val !== null && val !== '') {
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        } else {
          localStorage.removeItem(key);
        }
      };

      // Spotify
      if (cuentas.spotify && typeof cuentas.spotify === 'object') {
        const sp = cuentas.spotify;
        if (sp.token || sp.refreshToken) {
          setOrRemove('mediary_spotify_token', sp.token);
          setOrRemove('mediary_spotify_refresh_token', sp.refreshToken);
          setOrRemove('mediary_spotify_expires_at', sp.expiresAt ? String(sp.expiresAt) : '');
          if (sp.clientId) localStorage.setItem('mediary_spotify_client_id', sp.clientId);
          setOrRemove('mediary_spotify_user', sp.user);
          setOrRemove('mediary_spotify_stats', sp.stats);
          setOrRemove('mediary_spotify_accumulator', sp.accumulator);
          setOrRemove('mediary_spotify_album_tracker', sp.albumTracker);
          if (sp.selectedRange) localStorage.setItem('mediary_spotify_selected_range', sp.selectedRange);
          if (sp.preferredDeviceId) localStorage.setItem('mediary_spotify_preferred_device_id', sp.preferredDeviceId);
          setOrRemove('mediary_spotify_now_playing', sp.nowPlaying || prefs.actividad?.spotifyNowPlaying);
        } else {
          ['mediary_spotify_token', 'mediary_spotify_refresh_token', 'mediary_spotify_expires_at', 'mediary_spotify_user', 'mediary_spotify_stats', 'mediary_spotify_now_playing'].forEach(k => localStorage.removeItem(k));
          if (typeof detenerPollingSpotifyLive === 'function') detenerPollingSpotifyLive();
        }
      }

      // Last.fm
      if (cuentas.lastfm && typeof cuentas.lastfm === 'object') {
        const lfm = cuentas.lastfm;
        if (lfm.connected || lfm.username) {
          localStorage.setItem('mediary_lastfm_connected', 'true');
          setOrRemove('mediary_lastfm_username', lfm.username);
          setOrRemove('mediary_lastfm_user', lfm.user);
          setOrRemove('mediary_lastfm_stats', lfm.stats);
          if (lfm.selectedPeriod) localStorage.setItem('mediary_lastfm_selected_period', lfm.selectedPeriod);
        } else {
          ['mediary_lastfm_connected', 'mediary_lastfm_username', 'mediary_lastfm_user', 'mediary_lastfm_stats', 'mediary_lastfm_selected_period'].forEach(k => localStorage.removeItem(k));
        }
      }

      // PlayStation
      if (cuentas.playstation && typeof cuentas.playstation === 'object') {
        const ps = cuentas.playstation;
        if (ps.connected || ps.username) {
          localStorage.setItem('mediary_psn_connected', 'true');
          setOrRemove('mediary_psn_username', ps.username);
          setOrRemove('mediary_psn_npsso', ps.npsso);
          setOrRemove('mediary_psn_user', ps.user);
          setOrRemove('mediary_psn_stats', ps.stats);
          setOrRemove('mediary_psn_now_playing', ps.nowPlaying || prefs.actividad?.playstationNowPlaying);
          setOrRemove('mediary_psn_manual_state', ps.manualState);
        } else {
          ['mediary_psn_connected', 'mediary_psn_username', 'mediary_psn_npsso', 'mediary_psn_user', 'mediary_psn_stats', 'mediary_psn_now_playing', 'mediary_psn_manual_state'].forEach(k => localStorage.removeItem(k));
        }
      }

      // Steam
      if (cuentas.steam && typeof cuentas.steam === 'object') {
        const st = cuentas.steam;
        if (st.connected || st.id) {
          localStorage.setItem('mediary_steam_connected', 'true');
          setOrRemove('mediary_steam_id', st.id);
          setOrRemove('mediary_steam_id64', st.id64);
          setOrRemove('mediary_steam_api_key', st.apiKey);
          setOrRemove('mediary_steam_user', st.user);
          setOrRemove('mediary_steam_stats', st.stats);
          setOrRemove('mediary_steam_now_playing', st.nowPlaying || prefs.actividad?.steamNowPlaying);
        } else {
          ['mediary_steam_connected', 'mediary_steam_id', 'mediary_steam_id64', 'mediary_steam_api_key', 'mediary_steam_user', 'mediary_steam_stats', 'mediary_steam_now_playing'].forEach(k => localStorage.removeItem(k));
          if (typeof detenerPollingSteamLive === 'function') detenerPollingSteamLive();
        }
      }

      const lastGamePlat = cuentas.lastActiveGamePlatform || prefs.actividad?.lastActiveGamePlatform || '';
      setOrRemove('mediary_last_active_game_platform', lastGamePlat);

      // API Keys
      if (cuentas.apiKeys && typeof cuentas.apiKeys === 'object') {
        const ak = cuentas.apiKeys;
        if (ak.comicvine) {
          window.COMICVINE_K = COMICVINE_K = ak.comicvine;
          localStorage.setItem('mediary_comicvine_key', ak.comicvine);
        }
        if (ak.marvel) {
          window.MARVEL_K = MARVEL_K = ak.marvel;
          localStorage.setItem('mediary_marvel_key', ak.marvel);
        }
        if (ak.lastfm) {
          window.LASTFM_API_KEY = LASTFM_API_KEY = ak.lastfm;
          localStorage.setItem('mediary_lastfm_api_key', ak.lastfm);
        }
        if (ak.igdbClientId) {
          window.IGDB_CLIENT_ID = IGDB_CLIENT_ID = ak.igdbClientId;
          localStorage.setItem('mediary_igdb_client_id', ak.igdbClientId);
        }
        if (ak.igdbToken) {
          window.IGDB_TOKEN = IGDB_TOKEN = ak.igdbToken;
          localStorage.setItem('mediary_igdb_token', ak.igdbToken);
        }
      }

      if (cloudCuentasAt > 0) {
        try { localStorage.setItem('mediary_cuentas_sync_updated_at', String(cloudCuentasAt)); } catch (e) {}
      }

      // Invalidar cachés en vivo para que las tarjetas se refresquen con las cuentas restauradas
      if (typeof _spotifyNowPlayingCache !== 'undefined') _spotifyNowPlayingCache = null;
      if (typeof _spotifyUltimaConsultaLive !== 'undefined') _spotifyUltimaConsultaLive = 0;
      if (typeof _steamUltimaConsultaLive !== 'undefined') _steamUltimaConsultaLive = 0;

      // Refrescar componentes vinculados y tarjetas de actividad en Inicio
      if (typeof actualizarUISpotify === 'function') actualizarUISpotify();
      if (typeof actualizarUILastFm === 'function') actualizarUILastFm();
      if (typeof actualizarUIPlayStation === 'function') actualizarUIPlayStation();
      if (typeof actualizarUISteam === 'function') actualizarUISteam();
      if (typeof renderizarAppsVinculadasConfig === 'function') renderizarAppsVinculadasConfig();
      if (typeof renderizarEscuchandoAhoraInicio === 'function') renderizarEscuchandoAhoraInicio(true);
      if (typeof renderizarPlayStationNowPlayingInicio === 'function') renderizarPlayStationNowPlayingInicio(true);
      if (typeof renderizarFeedAmigosResumidoInicio === 'function') renderizarFeedAmigosResumidoInicio();
      const modalStats = document.getElementById('modal-estadisticas-avanzadas');
      if (modalStats && modalStats.style.display === 'flex' && typeof renderizarContenidoEstadisticasAvanzadas === 'function') {
        renderizarContenidoEstadisticasAvanzadas();
      }
      cambio = true;
    } else if (localCuentasAt > cloudCuentasAt) {
      subirPendientesLocales = true;
    }
  } else if (!esInicioSesionNuevo) {
    subirPendientesLocales = true;
  }

  // 3. Restaurar rachas (días de lectura y mapa de tiempos de sesión)
  const rachasCloud = prefs.rachas;
  const cloudDias = (rachasCloud && Array.isArray(rachasCloud.diasLectura)) ? rachasCloud.diasLectura : [];
  const cloudTiempos = (rachasCloud && typeof rachasCloud.tiemposLectura === 'object' && rachasCloud.tiemposLectura !== null) ? rachasCloud.tiemposLectura : {};

  const localesDias = (!esInicioSesionNuevo && typeof obtenerListaDiasLectura === 'function') ? obtenerListaDiasLectura() : [];
  const localesTiempos = (!esInicioSesionNuevo && typeof obtenerMapaTiemposLectura === 'function') ? obtenerMapaTiemposLectura() : {};

  const diasCombinados = Array.from(new Set([...localesDias, ...cloudDias])).filter(Boolean).sort();
  const tiemposCombinados = Object.assign({}, localesTiempos, cloudTiempos);

  const claveDias = 'mediary_dias_lectura_' + (estado.userEmail || 'default');
  const claveTiempos = 'mediary_tiempos_lectura_' + (estado.userEmail || 'default');

  try {
    localStorage.setItem(claveDias, JSON.stringify(diasCombinados));
    localStorage.setItem('mediary_dias_lectura_default', JSON.stringify(diasCombinados));
    localStorage.setItem(claveTiempos, JSON.stringify(tiemposCombinados));
    localStorage.setItem('mediary_tiempos_lectura_default', JSON.stringify(tiemposCombinados));
  } catch(e) {}

  if (perfilUsuario) {
    perfilUsuario.diasLectura = diasCombinados;
    perfilUsuario.tiemposLectura = tiemposCombinados;
    if (!perfilUsuario.preferencias) perfilUsuario.preferencias = {};
    if (!perfilUsuario.preferencias.rachas) perfilUsuario.preferencias.rachas = {};
    perfilUsuario.preferencias.rachas.diasLectura = diasCombinados;
    perfilUsuario.preferencias.rachas.tiemposLectura = tiemposCombinados;
  }

  if (typeof renderizarRachasActualesInicio === 'function') renderizarRachasActualesInicio();
  if (typeof actualizarBotonLecturaHoyInicio === 'function') actualizarBotonLecturaHoyInicio();
  if (typeof actualizarBotonLecturaHoyLibros === 'function') actualizarBotonLecturaHoyLibros();
  if (typeof renderizarBannerRachaSubcategoria === 'function' && estado.categoria === 'Lecturas') {
    renderizarBannerRachaSubcategoria(estado.categoria, estado.subcategoria);
  }
  cambio = true;

  if (idiomaCambio) {
    if (estado.categoria === 'inicio') {
      if (typeof renderizarResumenInicio === 'function') renderizarResumenInicio();
    } else if (estado.categoria === 'discover' && typeof renderizarDiscoverVista === 'function') {
      renderizarDiscoverVista();
    } else if (estado.categoria === 'perfil') {
      if (typeof renderizarCabeceraPerfil === 'function') renderizarCabeceraPerfil();
      if (typeof renderizarFavoritosPerfil === 'function') renderizarFavoritosPerfil();
      if (typeof calcularYMostrarEstadisticasPerfil === 'function') calcularYMostrarEstadisticasPerfil();
    } else if (typeof CONFIG !== 'undefined' && CONFIG[estado.categoria]) {
      if (typeof renderizarSubtabs === 'function') renderizarSubtabs();
      if (typeof esSubcategoriaWatchlist === 'function' && esSubcategoriaWatchlist(estado.subcategoria)) {
        if (typeof renderizarWatchlist === 'function') renderizarWatchlist();
      } else if (typeof filtrarYMostrarHistorial === 'function') {
        filtrarYMostrarHistorial();
      }
    }
  }

  const tieneNuevosDiasLocales = !esInicioSesionNuevo && localesDias.some(d => !cloudDias.includes(d));
  if ((subirPendientesLocales || tieneNuevosDiasLocales) && typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(false);
  }

  return cambio;
}
window.restaurarPreferenciasYAppsDesdeNube = restaurarPreferenciasYAppsDesdeNube;

function guardarPreferenciasLocales(inmediato = false) {
  try {
    userPrefs.updatedAt = Date.now();
    localStorage.setItem('Mediary_prefs_v1', JSON.stringify(userPrefs));
  } catch (e) {}
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(!!inmediato, { soloUI: true });
  }
}
function guardarPerfilLocal() { try { localStorage.setItem('Mediary_perfil_v1', JSON.stringify(perfilUsuario)); if (estado.userEmail) localStorage.setItem('Mediary_active_user_v1', estado.userEmail); } catch (e) {} }
function registrarCuentaEnDispositivo(email, nick, avatar) { if (!email) return; try { const lista = JSON.parse((localStorage.getItem('Mediary_saved_accounts_v1') || localStorage.getItem('MyMediary_saved_accounts_v1')) || '[]').filter(x => x.email !== email); lista.unshift({ email, nickname: nick || email.split('@')[0], avatar: avatar || '' });
localStorage.setItem('Mediary_saved_accounts_v1', JSON.stringify(lista.slice(0, 5))); } catch (e) {}
}
function aplicarSesionExitosa(res, mostrarSaludo = false) {
  const prevEmail = (estado.userEmail || '').trim().toLowerCase();
  const newEmail = (res.emailGoogle || estado.userEmail || '').trim().toLowerCase();
  const cambioDeCuenta = !!(prevEmail && newEmail && prevEmail !== newEmail);
  const esInicioSesionNuevo = !!mostrarSaludo || cambioDeCuenta || (!prevEmail && !!newEmail);

  if (cambioDeCuenta) {
    limpiarDatosCuentaEnDispositivo_();
  }

  estado.userEmail = newEmail;
  perfilUsuario.emailGoogle = estado.userEmail;
  perfilUsuario.logueadoGoogle = true;
  perfilUsuario.nickname = res.nickname || (estado.userEmail ? estado.userEmail.split('@')[0] : 'Cinéfilo & Lector');
  perfilUsuario.bio = res.bio || 'Coleccionando historias en Mediary';
  perfilUsuario.avatar = res.avatar || '';
  perfilUsuario.favoritos = res.favoritos || {};
  perfilUsuario.favoritosOcultos = res.favoritosOcultos || {};
  perfilUsuario.preferencias = res.preferencias || {};
  if (res.created_at) {
    perfilUsuario.created_at = res.created_at;
    try { localStorage.setItem('mediary_user_created_' + estado.userEmail, res.created_at); } catch(e){}
  }
  if (res.preferencias?.portada || res.favoritos?.portada) perfilUsuario.portada = res.preferencias?.portada || res.favoritos?.portada;
  if (res.favoritos?.personajeFavorito || res.preferencias?.personajeFavorito) perfilUsuario.personajeFavorito = res.favoritos?.personajeFavorito || res.preferencias?.personajeFavorito;
  if (res.favoritos?.cancionFavorita || res.preferencias?.cancionFavorita) perfilUsuario.cancionFavorita = res.favoritos?.cancionFavorita || res.preferencias?.cancionFavorita;
  if (!perfilUsuario.preferencias.userId && estado.userEmail) {
    perfilUsuario.preferencias.userId = generarOObtenerIdUsuario(estado.userEmail, perfilUsuario.nickname, perfilUsuario.preferencias);
  }
  if (res.preferencias?.likes_dados && Array.isArray(res.preferencias.likes_dados)) {
    try {
      const s = obtenerLikesResenasSet();
      res.preferencias.likes_dados.forEach(id => s.add(id));
      localStorage.setItem('mediary_liked_reviews', JSON.stringify(Array.from(s)));
    } catch (e) {}
  }
  if (res.preferencias?.likes_recibidos && typeof verificarNuevosLikesRecibidos === 'function') {
    verificarNuevosLikesRecibidos(res.preferencias.likes_recibidos);
  }
  if (res.preferencias?.notificaciones) {
    userPrefs.notificaciones = Object.assign(obtenerPreferenciasNotificaciones(), res.preferencias.notificaciones);
    try { localStorage.setItem('Mediary_prefs_v1', JSON.stringify(userPrefs)); } catch (e) {}
    if (typeof sincronizarSwitchesNotificaciones === 'function') sincronizarSwitchesNotificaciones();
  }

  // Restaurar configuración visual (theme, font, idioma), cuentas vinculadas y actividad desde la nube
  if (res.preferencias) {
    restaurarPreferenciasYAppsDesdeNube(res.preferencias, { esInicioSesionNuevo });
  }

  guardarPerfilLocal();
  registrarCuentaEnDispositivo(estado.userEmail, perfilUsuario.nickname, perfilUsuario.avatar);
  renderizarCabeceraPerfil();
  cerrarModalAuthSupabase();
  cargarRegistros();
  cargarWatchlist();
  if (esInicioSesionNuevo && estado.categoria === 'inicio') {
    if (typeof renderizarResumenInicio === 'function') renderizarResumenInicio();
    if (typeof renderizarFeedAmigosResumidoInicio === 'function') renderizarFeedAmigosResumidoInicio();
  }
  if (estado.categoria === 'perfil') renderizarFavoritosPerfil();
  if (mostrarSaludo) mostrarToastPersonalizado(userPrefs.lang === 'en' ? `Welcome, ${perfilUsuario.nickname}! (${estado.userEmail}) ` : `¡Bienvenido, ${perfilUsuario.nickname}! (${estado.userEmail}) `);
}
function sincronizarPerfilDesdeServidor() { google.script.run.withSuccessHandler(res => { if (res && res.exito) { aplicarSesionExitosa(res, false); } else if (res && res.sinSesion && !estado.userEmail) { abrirModalAuthSupabase(); } }).obtenerPerfilUsuario(estado.userEmail); }
function renderizarCabeceraPerfil() { const avBox = document.getElementById('perfil-avatar-render'); const btnHeader = document.getElementById('btn-profile');
const esImg = perfilUsuario.avatar && (perfilUsuario.avatar.startsWith('http') || perfilUsuario.avatar.startsWith('data:image')); if (avBox) {
avBox.setAttribute('data-avatar-zoom', perfilUsuario.avatar || ''); avBox.setAttribute('data-avatar-name', perfilUsuario.nickname || tLang('Mi Perfil', 'My Profile'));
avBox.innerHTML = `${esImg ? `<img loading="lazy" decoding="async" src="${perfilUsuario.avatar}" alt="Avatar">` : `<span>${perfilUsuario.avatar || ''}</span>`}<div class="profile-avatar-edit-badge">${tLang('Editar', 'Edit')}</div>`; }
if (btnHeader) { btnHeader.setAttribute('data-avatar-zoom', perfilUsuario.avatar || ''); btnHeader.setAttribute('data-avatar-name', perfilUsuario.nickname || tLang('Mi Perfil', 'My Profile')); btnHeader.innerHTML = esImg
? `<img loading="lazy" decoding="async" src="${perfilUsuario.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`
: `<span class="btn-icon-glyph">${perfilUsuario.avatar || ''}</span>`; }
const mBtnPerfilIcon = document.getElementById('m-btn-perfil-icon') || document.querySelector('#m-btn-perfil .icon');
if (mBtnPerfilIcon) {
 if (esImg) {
 mBtnPerfilIcon.innerHTML = `<img loading="lazy" decoding="async" src="${perfilUsuario.avatar}" alt="Avatar" style="width:22px; height:22px; border-radius:50%; object-fit:cover; display:block; border:1.5px solid currentColor;">`;
 mBtnPerfilIcon.classList.remove('emoji-dyn');
 } else {
 mBtnPerfilIcon.textContent = perfilUsuario.avatar || '';
 mBtnPerfilIcon.classList.add('emoji-dyn');
 }
}
const tabBtnPerfilIcon = document.querySelector('#tab-btn-perfil .emoji-dyn');
if (tabBtnPerfilIcon) {
 if (esImg) {
 tabBtnPerfilIcon.innerHTML = `<img loading="lazy" decoding="async" src="${perfilUsuario.avatar}" alt="Avatar" style="width:18px; height:18px; border-radius:50%; object-fit:cover; display:inline-block; vertical-align:middle; margin-right:2px;">`;
 } else {
 tabBtnPerfilIcon.textContent = perfilUsuario.avatar || '';
 }
}
const idTxtEl = document.getElementById('perfil-id-txt'); if (idTxtEl) { const miId = generarOObtenerIdUsuario(estado.userEmail || perfilUsuario.emailGoogle, perfilUsuario.nickname, perfilUsuario.preferencias); idTxtEl.textContent = miId; }
const rawNick = perfilUsuario.nickname || '';
const displayNick = (!rawNick || rawNick === 'Cinéfilo & Lector') ? tLang('Cinéfilo & Lector', 'Cinephile & Reader') : rawNick;
const rawBio = perfilUsuario.bio || '';
const displayBio = (!rawBio || rawBio === 'Coleccionando historias en Mediary') ? tLang('Coleccionando historias en Mediary', 'Collecting stories on Mediary') : rawBio;
const nickEl = document.getElementById('perfil-nick-render'); if (nickEl) nickEl.textContent = displayNick;
const bioEl = document.getElementById('perfil-bio-render'); if (bioEl) bioEl.textContent = displayBio;
const emailTxt = document.getElementById('perfil-email-txt'); const emailEl = document.getElementById('perfil-email-render'); const txtBtnG = document.getElementById('txt-btn-google'); const cfgBadge = document.getElementById('cfg-supabase-badge');
const userEmailActivo = estado.userEmail || perfilUsuario.emailGoogle;
if (userEmailActivo) {
 if (emailTxt) emailTxt.textContent = userEmailActivo;
 else if (emailEl) emailEl.textContent = userEmailActivo;
 if (txtBtnG) txtBtnG.textContent = `${userPrefs && userPrefs.lang === 'en' ? 'Switch account' : 'Cambiar cuenta'} (${userEmailActivo.split('@')[0]})`;
 if (cfgBadge) cfgBadge.style.display = 'inline-flex';
} else {
 const noAcctTxt = tLang('Sin cuenta vinculada', 'No account linked');
 if (emailTxt) emailTxt.textContent = noAcctTxt;
 else if (emailEl) emailEl.textContent = noAcctTxt;
 if (txtBtnG) txtBtnG.textContent = userPrefs && userPrefs.lang === 'en' ? 'Sign in / Create account' : 'Iniciar sesión / Crear cuenta';
 if (cfgBadge) cfgBadge.style.display = 'none';
}
aplicarPortadaEnHeroCard('perfil-hero-card');
renderizarCancionFavorita();
renderizarPersonajeFavorito();
if (typeof actualizarSaludoInicio === 'function') actualizarSaludoInicio();
}
function migrarTemaLegadoSiEsNecesario() {
 if (!userPrefs.themeFamily) {
 const t = userPrefs.theme || 'slate-dark';
 if (t === 'default' || t === 'slate-dark') { userPrefs.themeFamily = 'slate'; userPrefs.themeMode = userPrefs.themeMode || 'dark'; }
 else if (t === 'oled' || t === 'emerald-dark') { userPrefs.themeFamily = 'emerald'; userPrefs.themeMode = userPrefs.themeMode || 'dark'; }
 else if (t === 'dracula' || t === 'dracula-dark') { userPrefs.themeFamily = 'dracula'; userPrefs.themeMode = userPrefs.themeMode || 'dark'; }
 else if (t === 'espresso' || t === 'espresso-dark') { userPrefs.themeFamily = 'espresso'; userPrefs.themeMode = userPrefs.themeMode || 'dark'; }
 else if (t === 'nordic-light' || t === 'slate-light') { userPrefs.themeFamily = 'slate'; userPrefs.themeMode = userPrefs.themeMode || 'light'; }
 else if (t === 'creme-latte' || t === 'parchment' || t === 'espresso-light') { userPrefs.themeFamily = 'espresso'; userPrefs.themeMode = userPrefs.themeMode || 'light'; }
 else if (t === 'sage-garden' || t === 'emerald-light') { userPrefs.themeFamily = 'emerald'; userPrefs.themeMode = userPrefs.themeMode || 'light'; }
 else if (t.endsWith('-light')) { userPrefs.themeFamily = t.replace('-light', ''); userPrefs.themeMode = userPrefs.themeMode || 'light'; }
 else if (t.endsWith('-dark')) { userPrefs.themeFamily = t.replace('-dark', ''); userPrefs.themeMode = userPrefs.themeMode || 'dark'; }
 else { userPrefs.themeFamily = 'slate'; userPrefs.themeMode = userPrefs.themeMode || 'system'; }
 }
 if (!userPrefs.themeMode) {
 userPrefs.themeMode = 'system';
 }
}

function obtenerTemaEfectivo() {
 migrarTemaLegadoSiEsNecesario();
 const family = userPrefs.themeFamily || 'slate';
 let mode = userPrefs.themeMode || 'system';
 if (mode === 'system') {
 const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
 mode = isDark ? 'dark' : 'light';
 }
 return `${family}-${mode}`;
}

function actualizarMetaThemeColor() {
 try {
 const meta = document.querySelector('meta[name="theme-color"]');
 const metaCs = document.getElementById('meta-color-scheme') || document.querySelector('meta[name="color-scheme"]');
 const t = document.documentElement.getAttribute('data-theme') || '';
 const esClaro = t.endsWith('-light');
 if (metaCs) metaCs.setAttribute('content', esClaro ? 'only light' : 'dark');
 if (!meta) return;
 const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
 if (bg) {
 meta.setAttribute('content', bg);
 document.documentElement.style.backgroundColor = bg;
 }
 } catch(e) {}
}

function cargarFuenteMediary(fontValue, appTheme) {
 try {
  const urls = window._MEDIARY_FONT_URLS;
  const loaded = window._MEDIARY_LOADED_FONTS || (window._MEDIARY_LOADED_FONTS = {});
  if (!urls) return;
  let target = (appTheme === 'minimalist') ? 'DM Sans' : '';
  if (!target && fontValue) {
   for (const k in urls) {
    if (String(fontValue).indexOf(k) !== -1) { target = k; break; }
   }
  }
  if (!target || loaded[target] || !urls[target]) return;
  loaded[target] = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?' + urls[target] + '&display=swap';
  document.head.appendChild(link);
 } catch (_) {}
}
function cargarTodasFuentesMediary() {
 try {
  const urls = window._MEDIARY_FONT_URLS;
  const loaded = window._MEDIARY_LOADED_FONTS || (window._MEDIARY_LOADED_FONTS = {});
  if (!urls || window._MEDIARY_ALL_FONTS_LOADED) return;
  window._MEDIARY_ALL_FONTS_LOADED = true;
  const missing = Object.keys(urls).filter(k => !loaded[k]).map(k => { loaded[k] = true; return urls[k]; });
  if (!missing.length) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?' + missing.join('&') + '&display=swap';
  document.head.appendChild(link);
 } catch (_) {}
}
window.cargarFuenteMediary = cargarFuenteMediary;
window.cargarTodasFuentesMediary = cargarTodasFuentesMediary;

let _ultimoEstiloAplicadoSig = '';
function aplicarEstilosGlobales() {
 migrarTemaLegadoSiEsNecesario();
 const temaEfectivo = obtenerTemaEfectivo();
 userPrefs.theme = temaEfectivo;
 const appTheme = userPrefs.appTheme || 'default';
 const sig = `${userPrefs.font}|${userPrefs.fontSize}|${temaEfectivo}|${appTheme}|${userPrefs.showEmojis ? 1 : 0}`;
 if (sig === _ultimoEstiloAplicadoSig) return;
 _ultimoEstiloAplicadoSig = sig;

 const r = document.documentElement;
 r.style.setProperty('--font-family', userPrefs.font);
 r.style.setProperty('--font-scale', userPrefs.fontSize);
 cargarFuenteMediary(userPrefs.font, appTheme);

 r.setAttribute('data-app-theme', appTheme);
 r.setAttribute('data-theme', temaEfectivo);
 r.setAttribute('data-ui-style', 'modern');
 r.setAttribute('data-show-emojis', userPrefs.showEmojis ? 'true' : 'false');
 const esTemaClaro = temaEfectivo.endsWith('-light');
 r.style.setProperty('color-scheme', esTemaClaro ? 'only light' : 'dark', 'important');
 const metaCs = document.getElementById('meta-color-scheme') || document.querySelector('meta[name="color-scheme"]');
 if (metaCs) metaCs.setAttribute('content', esTemaClaro ? 'only light' : 'dark');
 actualizarMetaThemeColor();
}
function mostrarToastPersonalizado(txt) {
  const old = document.querySelector('.toast-popup');
  if (old) old.remove();
  const tBox = document.createElement('div');
  tBox.className = 'toast-popup';
  let cleanTxt = String(txt || '').trim();
  let toastIcon = (typeof getHeroIcon === 'function') ? getHeroIcon('sparkles', '', 18) : '';
  const m = cleanTxt.match(/^(\p{Extended_Pictographic}|[\u2600-\u27bf\u2300-\u23ff\u2b50-\u2b55★☆✓✕✖➔➕➖✅🔐☁✂🎯👑🗑🏷📋⭐💬])+\s*/u);
  if (m) {
    const emo = m[0].trim();
    if (typeof getHeroIcon === 'function') toastIcon = getHeroIcon(emo, '', 18);
    cleanTxt = cleanTxt.slice(m[0].length).trim();
  }
  cleanTxt = cleanTxt.replace(/[\p{Extended_Pictographic}\u2600-\u27bf\u2300-\u23ff\u2b50-\u2b55★☆✓✕✖➔➕➖✅🔐☁✂🎯👑🗑🏷📋⭐💬]/gu, '').trim();
  tBox.innerHTML = `<span class="emoji-dyn">${toastIcon}</span><span>${cleanTxt}</span>`;
  document.body.appendChild(tBox);
  setTimeout(() => {
    tBox.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    tBox.style.opacity = '0';
    tBox.style.transform = 'translateY(-20px)';
    setTimeout(() => tBox.remove(), 400);
  }, 3000);
}
function esEnProgresoTexto(str) {
  if (!str) return false;
  const s = String(str).toLowerCase().trim().replace(/^⏳\s*/, '');
  return s.startsWith('aún ') || s.startsWith('aun ') || s.startsWith('still ') ||
         s.includes('progreso') || s.includes('progress') ||
         s === 'aún viendo' || s === 'aun viendo' || s === 'still watching' ||
         s === 'aún escuchando' || s === 'aun escuchando' || s === 'still listening' ||
         s === 'aún jugando' || s === 'aun jugando' || s === 'still playing' ||
         s === 'aún leyendo' || s === 'aun leyendo' || s === 'still reading';
}
function subTieneRango(c, s) {
  if (!c) return false;
  const cat = String(c).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const sub = String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Watchlists de cualquier categoría nunca admiten rango
  if (sub.includes('watchlist') || sub.includes('to play') || sub.includes('to read') || sub.includes('to listen')) {
    return false;
  }

  // Películas y documentales: NUNCA admiten rango (solo 1 fecha única)
  if (cat.includes('pelicula') || cat.includes('movie') || cat.includes('film')) {
    return false;
  }

  // Música: Discos y Conciertos son fecha única; Artistas/Grupos admite rango
  if (cat.includes('musica') || cat.includes('music')) {
    if (sub.includes('disco') || sub.includes('concierto') || sub.includes('album') || sub.includes('concert')) {
      return false;
    }
    if (sub.includes('artista') || sub.includes('grupo') || sub.includes('artist') || sub.includes('band')) {
      return true;
    }
    return false;
  }

  // Series: Todas las subcategorías de series admiten rango de fechas (fecha inicio y fecha término)
  if (cat.includes('serie')) {
    return true;
  }

  // Juegos: Todos los videojuegos/juegos admiten rango de fechas (fecha inicio y fecha término)
  if (cat.includes('juego') || cat.includes('game')) {
    return true;
  }

  // Lecturas: Todos los libros, cómics, mangas admiten rango de fechas (fecha inicio y fecha término)
  if (cat.includes('lectura') || cat.includes('libro') || cat.includes('comic') || cat.includes('manga') || cat.includes('book') || cat.includes('read')) {
    return true;
  }

  return false;
}
function obtenerTextoEnProgreso(cat, sub) {
  const c = cat || estado.categoria;
  const s = (sub || estado.subcategoria || '');
  if (!subTieneRango(c, s)) return null;
  const cNorm = String(c).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const sNorm = String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const l = (typeof userPrefs !== 'undefined' && userPrefs.lang) ? userPrefs.lang : 'es';
  if (cNorm.includes('serie')) {
    return l === 'en' ? 'Still watching' : 'Aún viendo';
  }
  if (cNorm.includes('musica') || cNorm.includes('music')) {
    if (sNorm.includes('artista') || sNorm.includes('grupo') || sNorm.includes('artist') || sNorm.includes('band')) {
      return l === 'en' ? 'Still listening' : 'Aún escuchando';
    }
  }
  if (cNorm.includes('juego') || cNorm.includes('game')) {
    return l === 'en' ? 'Still playing' : 'Aún jugando';
  }
  if (cNorm.includes('lectura') || cNorm.includes('libro') || cNorm.includes('comic') || cNorm.includes('manga') || cNorm.includes('book') || cNorm.includes('read')) {
    return l === 'en' ? 'Still reading' : 'Aún leyendo';
  }
  return null;
}
