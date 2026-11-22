/* Mediary — js/integrations/spotify.js */
// --- INTEGRACIÓN SPOTIFY (WEB API PKCE OAUTH & ESTADÍSTICAS) ---
var estadoSpotify = {
  currentTab: 'artists'
};

function escHtmlSpotify_(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function obtenerSpotifyRedirectUri() {
  if (window.location.hostname.includes('github.io')) {
    return 'https://cblackmann.github.io/MyMediary/';
  }
  let base = window.location.origin + window.location.pathname;
  if (base.endsWith('index.html')) {
    base = base.slice(0, -10);
  }
  if (!base.endsWith('/')) {
    base += '/';
  }
  return base;
}

function generarCadenaAleatoriaSpotify(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const values = new Uint8Array(length);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

async function generarCodeChallengeSpotify(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const bin = String.fromCharCode.apply(null, [...new Uint8Array(digest)]);
  return btoa(bin)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function abrirModalConectarSpotify() {
  if (typeof iniciarFlujoSpotifyAuth === 'function') {
    iniciarFlujoSpotifyAuth();
  }
}
window.abrirModalConectarSpotify = abrirModalConectarSpotify;

async function iniciarFlujoSpotifyAuth() {
  const clientIdInput = document.getElementById('spotify-input-client-id');
  let clientId = (clientIdInput && clientIdInput.value.trim()) || localStorage.getItem('mediary_spotify_client_id') || window.SPOTIFY_CLIENT_ID || '955a1a0ccb814981b647d24c54b38d60';
  localStorage.setItem('mediary_spotify_client_id', clientId);

  const verifier = generarCadenaAleatoriaSpotify(64);
  const challenge = await generarCodeChallengeSpotify(verifier);
  const state = generarCadenaAleatoriaSpotify(16);
  const redirectUri = obtenerSpotifyRedirectUri();

  localStorage.setItem('mediary_spotify_code_verifier', verifier);
  localStorage.setItem('mediary_spotify_auth_state', state);

  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-modify-playback-state'
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state: state,
    scope: scopes
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function procesarRetornoSpotifyAuth() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      console.warn('Spotify auth error:', error);
      mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Spotify connection cancelled' : 'Conexión con Spotify cancelada');
      limpiarSpotifyParamsUrl();
      actualizarUISpotify();
      return;
    }

    if (!code) {
      actualizarUISpotify();
      return;
    }

    const savedState = localStorage.getItem('mediary_spotify_auth_state');
    const verifier = localStorage.getItem('mediary_spotify_code_verifier');
    let clientId = localStorage.getItem('mediary_spotify_client_id') || window.SPOTIFY_CLIENT_ID || '955a1a0ccb814981b647d24c54b38d60';
    localStorage.setItem('mediary_spotify_client_id', clientId);
    const redirectUri = obtenerSpotifyRedirectUri();

    if (state && savedState && state !== savedState) {
      console.error('Spotify state mismatch');
      limpiarSpotifyParamsUrl();
      actualizarUISpotify();
      return;
    }

    if (!verifier || !clientId) {
      limpiarSpotifyParamsUrl();
      actualizarUISpotify();
      return;
    }

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: verifier
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('Error exchanging Spotify code:', errData);
      mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Failed to authorize Spotify' : 'Error al autorizar con Spotify');
      limpiarSpotifyParamsUrl();
      actualizarUISpotify();
      return;
    }

    const data = await res.json();
    const token = data.access_token;
    const refreshToken = data.refresh_token;
    const expSec = Number(data.expires_in) || 3600;
    const expiresAt = Date.now() + (expSec * 1000);

    localStorage.setItem('mediary_spotify_token', token);
    if (refreshToken) localStorage.setItem('mediary_spotify_refresh_token', refreshToken);
    localStorage.setItem('mediary_spotify_expires_at', String(expiresAt));

    localStorage.removeItem('mediary_spotify_code_verifier');
    localStorage.removeItem('mediary_spotify_auth_state');
    limpiarSpotifyParamsUrl();

    await actualizarDatosSpotify(false);
    mostrarToastPersonalizado(userPrefs.lang === 'en' ? ' Connected to Spotify successfully!' : ' ¡Conectado exitosamente con Spotify!');
    actualizarUISpotify();
    if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(true);
    }
  } catch (err) {
    console.error('Error procesando retorno Spotify:', err);
    limpiarSpotifyParamsUrl();
    actualizarUISpotify();
  }
}

function limpiarSpotifyParamsUrl() {
  try {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  } catch (e) {}
}

async function obtenerTokenSpotifyValido(forzarRefresh = false) {
  let token = localStorage.getItem('mediary_spotify_token');
  const expiresAt = Number(localStorage.getItem('mediary_spotify_expires_at')) || 0;
  const refreshToken = localStorage.getItem('mediary_spotify_refresh_token');
  const clientId = localStorage.getItem('mediary_spotify_client_id') || window.SPOTIFY_CLIENT_ID || '955a1a0ccb814981b647d24c54b38d60';

  if (!localStorage.getItem('mediary_spotify_client_id')) {
    localStorage.setItem('mediary_spotify_client_id', clientId);
  }

  const necesitaRefresco = forzarRefresh || !token || (expiresAt > 0 && Date.now() > expiresAt - 60000);

  if (necesitaRefresco && refreshToken && clientId) {
    try {
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId
        })
      });
      if (res.ok) {
        const data = await res.json();
        token = data.access_token;
        localStorage.setItem('mediary_spotify_token', token);
        if (data.refresh_token) localStorage.setItem('mediary_spotify_refresh_token', data.refresh_token);
        const expSec = Number(data.expires_in) || 3600;
        localStorage.setItem('mediary_spotify_expires_at', String(Date.now() + (expSec * 1000)));
        if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
          sincronizarPreferenciasYAppsHaciaNube(false);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn('Error renovando token Spotify (HTTP ' + res.status + '):', errData);
        if (res.status === 400 || res.status === 401) {
          localStorage.removeItem('mediary_spotify_token');
          localStorage.removeItem('mediary_spotify_refresh_token');
          localStorage.removeItem('mediary_spotify_expires_at');
          token = null;
        }
      }
    } catch (e) {
      console.warn('Error de red refrescando token Spotify:', e);
    }
  }
  return token;
}


let estadoPromptAlbum = {
  album: null,
  calificacion: 5.0
};

function renderizarEstrellasPromptAlbum(val) {
  const num = typeof val === 'number' ? val : (parseFloat(String(val || '').replace(',', '.')) || 0);
  const rounded = Math.round(num * 2) / 2;
  const box = document.getElementById('stars-disco-detectado');
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
      const isH = (e.clientX - s.getBoundingClientRect().left < s.getBoundingClientRect().width / 2);
      actualizarDisplayEstrellasPrompt(isH ? i - 0.5 : i);
    };
    s.onclick = e => {
      const isH = (e.clientX - s.getBoundingClientRect().left < s.getBoundingClientRect().width / 2);
      estadoPromptAlbum.calificacion = isH ? i - 0.5 : i;
      renderizarEstrellasPromptAlbum(estadoPromptAlbum.calificacion);
    };
    box.appendChild(s);
  }
  const lbl = document.getElementById('label-disco-detectado-rating');
  if (lbl) lbl.textContent = `${num.toFixed(1)} / 5`;
}

function restaurarHoverEstrellasPrompt() {
  actualizarDisplayEstrellasPrompt(estadoPromptAlbum.calificacion || 5.0);
}

function actualizarDisplayEstrellasPrompt(val) {
  const num = typeof val === 'number' ? val : (parseFloat(String(val || '').replace(',', '.')) || 0);
  const rounded = Math.round(num * 2) / 2;
  document.querySelectorAll('#stars-disco-detectado .star-box').forEach((s, idx) => {
    const isFull = rounded >= idx + 1;
    const isHalf = !isFull && (rounded >= idx + 0.5);
    s.className = `star-box ${isFull ? 'full' : (isHalf ? 'half' : '')}`;
    s.innerHTML = isHalf ? getHeroIcon('star-half', '', 16) : getHeroIcon('star', '', 16);
  });
  const lbl = document.getElementById('label-disco-detectado-rating');
  if (lbl) lbl.textContent = `${num.toFixed(1)} / 5`;
}

function procesarDeteccionAlbumesCompletosSpotify_(items) {
  let tracker = null;
  try {
    const raw = localStorage.getItem('mediary_spotify_album_tracker');
    if (raw) tracker = JSON.parse(raw);
  } catch (e) {}

  if (!tracker || typeof tracker !== 'object') {
    tracker = { albums: {}, pendingQueue: [] };
  }
  if (!tracker.albums) tracker.albums = {};
  if (!Array.isArray(tracker.pendingQueue)) tracker.pendingQueue = [];

  const hoyISO = new Date().toISOString().slice(0, 10);
  const regs = Array.isArray(estado.registros) ? estado.registros : [];

  (items || []).forEach(it => {
    const track = it.track;
    if (!track || !track.album) return;
    const alb = track.album;
    const albumId = alb.id;
    if (!albumId) return;

    const totalTracks = alb.total_tracks || 0;
    // Solo consideramos álbumes o EPs de al menos 4 canciones
    if (totalTracks < 4) return;

    if (!tracker.albums[albumId]) {
      tracker.albums[albumId] = {
        id: albumId,
        titulo: alb.name,
        artista: alb.artists?.map(a => a.name).join(', ') || (track.artists?.[0]?.name || 'Spotify'),
        poster: alb.images?.[0]?.url || '',
        totalTracks: totalTracks,
        releaseDate: alb.release_date || '',
        playedTracks: [],
        completed: false,
        completedDate: null,
        prompted: false,
        dismissed: false
      };
    }

    const albEntry = tracker.albums[albumId];

    // Si ya está registrado en Mediary, marcarlo como completado y no volver a pedir
    const yaRegistrado = regs.some(r =>
      r.categoria === 'Musica' &&
      r.titulo &&
      r.titulo.toLowerCase().trim() === alb.name.toLowerCase().trim()
    );
    if (yaRegistrado) {
      albEntry.completed = true;
      albEntry.prompted = true;
      return;
    }

    const tNum = track.track_number;
    if (tNum && !albEntry.playedTracks.includes(tNum)) {
      albEntry.playedTracks.push(tNum);
    }

    // Criterio de disco completado:
    // Todas las canciones escuchadas (o al menos totalTracks - 1 si tiene 8 o más canciones)
    const minRequerido = totalTracks >= 8 ? (totalTracks - 1) : totalTracks;
    if (!albEntry.completed && albEntry.playedTracks.length >= minRequerido) {
      albEntry.completed = true;
      albEntry.completedDate = it.played_at ? it.played_at.slice(0, 10) : hoyISO;
      if (!albEntry.prompted && !albEntry.dismissed) {
        if (!tracker.pendingQueue.includes(albumId)) {
          tracker.pendingQueue.push(albumId);
        }
      }
    }
  });

  try {
    localStorage.setItem('mediary_spotify_album_tracker', JSON.stringify(tracker));
  } catch (e) {}

  return tracker;
}

function obtenerFechaLocalFormateada(dObj = new Date()) {
  const dia = String(dObj.getDate()).padStart(2, '0');
  const mes = String(dObj.getMonth() + 1).padStart(2, '0');
  const anio = dObj.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

function verificarYMostrarPromptDiscoCompletado() {
  let tracker = null;
  try {
    const raw = localStorage.getItem('mediary_spotify_album_tracker');
    if (raw) tracker = JSON.parse(raw);
  } catch (e) {}
  if (!tracker || !Array.isArray(tracker.pendingQueue) || !tracker.pendingQueue.length) return;

  const albumId = tracker.pendingQueue[0];
  const album = tracker.albums?.[albumId];
  if (!album) {
    tracker.pendingQueue.shift();
    localStorage.setItem('mediary_spotify_album_tracker', JSON.stringify(tracker));
    return;
  }

  const regs = Array.isArray(estado.registros) ? estado.registros : [];
  const yaRegistrado = regs.some(r =>
    r.categoria === 'Musica' && r.titulo && r.titulo.toLowerCase().trim() === album.titulo.toLowerCase().trim()
  );
  if (yaRegistrado || album.dismissed) {
    album.prompted = true;
    tracker.pendingQueue.shift();
    localStorage.setItem('mediary_spotify_album_tracker', JSON.stringify(tracker));
    if (tracker.pendingQueue.length) verificarYMostrarPromptDiscoCompletado();
    return;
  }

  estadoPromptAlbum.album = album;
  estadoPromptAlbum.calificacion = 5.0;

  const modal = document.getElementById('modal-album-completado-spotify');
  if (!modal) return;

  const imgEl = document.getElementById('prompt-album-poster');
  const titEl = document.getElementById('prompt-album-titulo');
  const artEl = document.getElementById('prompt-album-artista');
  const infoEl = document.getElementById('prompt-album-pistas-info');
  const fechaInp = document.getElementById('input-disco-detectado-fecha');
  const comInp = document.getElementById('input-disco-detectado-comentario');
  const btnGuardar = document.getElementById('btn-guardar-disco-detectado');

  if (imgEl) imgEl.src = album.poster || './icon.png';
  if (titEl) titEl.textContent = album.titulo;
  if (artEl) artEl.textContent = album.artista;
  if (infoEl) infoEl.innerHTML = `<span class="emoji-dyn">${getHeroIcon('check', '', 13)}</span> ${album.playedTracks ? album.playedTracks.length : (album.totalTracks || tLang('Todas', 'All'))} ${tLang('canciones escuchadas', 'tracks listened')}`;
  if (comInp) comInp.value = '';
  if (btnGuardar) {
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = `<span>${tLang('Registrar disco', 'Log album')}</span>`;
  }

  // Detectar fecha local del país/dispositivo del usuario
  let fechaInicial = obtenerFechaLocalFormateada();
  if (album.completedDate) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(album.completedDate)) {
      const [y, m, d] = album.completedDate.split('-');
      fechaInicial = `${d}/${m}/${y}`;
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(album.completedDate)) {
      fechaInicial = album.completedDate;
    }
  }

  if (fechaInp) {
    fechaInp.value = fechaInicial;
  }

  // Actualizar banner conmemorativo y textos segun idioma
  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');
  const bannerTit = document.getElementById('prompt-album-banner-title');
  const bannerSub = document.getElementById('prompt-album-banner-sub');
  const lblFecha = document.getElementById('lbl-prompt-disco-fecha');
  if (bannerTit) bannerTit.textContent = isEn ? 'You listened to a new album!' : '¡Escuchaste un nuevo disco!';
  if (bannerSub) bannerSub.textContent = isEn ? 'Would you like to rate it and add it to your Mediary?' : '¿Quieres calificarlo y agregarlo a tu Mediary?';
  if (lblFecha) lblFecha.textContent = isEn ? 'Listen date:' : 'Fecha de escucha:';

  renderizarEstrellasPromptAlbum(5.0);
  modal.style.display = 'flex';

  // Integrar selector de fecha oficial de la app (flatpickr) con el modal ya visible
  if (typeof flatpickr !== 'undefined') {
    try {
      if (window.fpDiscoDetectado) {
        try { window.fpDiscoDetectado.destroy(); } catch (e) {}
      }
      window.fpDiscoDetectado = flatpickr('#input-disco-detectado-fecha', {
        locale: (isEn ? 'default' : 'es'),
        dateFormat: 'd/m/Y',
        defaultDate: fechaInicial,
        allowInput: false,
        disableMobile: true
      });
    } catch (_) {}
  }
}

function establecerFechaHoyDiscoDetectado() {
  const hoy = (typeof obtenerFechaLocalFormateada === 'function') ? obtenerFechaLocalFormateada() : (function() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  })();
  const inp = document.getElementById('input-disco-detectado-fecha');
  if (inp) {
    inp.value = hoy;
    if (window.fpDiscoDetectado) {
      try { window.fpDiscoDetectado.setDate(hoy, true, 'd/m/Y'); } catch (e) {}
    }
  }
}
window.establecerFechaHoyDiscoDetectado = establecerFechaHoyDiscoDetectado;

function guardarDiscoDetectadoEnMediary() {
  const album = estadoPromptAlbum.album;
  if (!album) return;

  const btnGuardar = document.getElementById('btn-guardar-disco-detectado');
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<span>Guardando...</span>';
  }

  const fechaInp = document.getElementById('input-disco-detectado-fecha');
  const comInp = document.getElementById('input-disco-detectado-comentario');

  let fechaVal = (fechaInp && fechaInp.value) ? fechaInp.value.trim() : '';
  if (!fechaVal) fechaVal = obtenerFechaLocalFormateada();

  let fechaFormateada = fechaVal;
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaVal)) {
    const [y, m, d] = fechaVal.split('-');
    fechaFormateada = `${d}/${m}/${y}`;
  }

  const comentario = comInp ? asegurarPuntoFinal(comInp.value.trim()) : '';
  const calif = Number(estadoPromptAlbum.calificacion) || 5.0;
  const estimacionHoras = ((Number(album.totalTracks) || 10) * 3.5 / 60).toFixed(1) + ' hrs';
  const savedId = (typeof window.uuid_ === 'function' ? window.uuid_() : (typeof uuid_ === 'function' ? uuid_() : 'reg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)));

  const nuevoRegistro = {
    id: savedId,
    categoria: 'Musica',
    subcategoria: 'Discos',
    titulo: album.titulo,
    tituloBase: album.titulo,
    subtitulo: '',
    creador: album.artista || 'Varios Artistas',
    anio: (album.releaseDate ? String(album.releaseDate).slice(0, 4) : ''),
    fechaInicio: fechaFormateada,
    fechaFin: fechaFormateada,
    calificacion: calif,
    comentario: comentario,
    poster: album.poster || '',
    horas: estimacionHoras,
    esRewatch: false
  };

  // 1. Guardado optimista en memoria local
  if (!Array.isArray(estado.registros)) estado.registros = [];
  estado.registros.unshift(nuevoRegistro);
  estado.ultimoRegistroGuardadoId = savedId;

  // 2. Marcar en tracker de Spotify como registrado
  let tracker = null;
  try {
    const raw = localStorage.getItem('mediary_spotify_album_tracker');
    if (raw) tracker = JSON.parse(raw);
  } catch (e) {}
  if (tracker) {
    if (tracker.albums && tracker.albums[album.id]) {
      tracker.albums[album.id].prompted = true;
      tracker.albums[album.id].registered = true;
    }
    tracker.pendingQueue = (tracker.pendingQueue || []).filter(id => id !== album.id);
    localStorage.setItem('mediary_spotify_album_tracker', JSON.stringify(tracker));
  }

  // 3. Persistir en backend (Supabase / Google Apps Script)
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.withSuccessHandler(res => {
      if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<span>Registrar disco</span>';
      }
      if (typeof cargarRegistros === 'function') cargarRegistros();
      if (album.artista && typeof recalcularYActualizarPromedioArtista === 'function') {
        recalcularYActualizarPromedioArtista(album.artista, nuevoRegistro).then(() => {
          if (typeof cargarRegistros === 'function') cargarRegistros();
        });
      }
    }).withFailureHandler(err => {
      console.warn('Error guardando registro en Supabase:', err);
      if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<span>Registrar disco</span>';
      }
    }).guardarRegistro(nuevoRegistro, estado.userEmail);
  } else {
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = '<span>Registrar disco</span>';
    }
  }

  // 4. Actualizar vistas activas
  if (estado.categoria === 'Musica') {
    if (typeof filtrarYMostrarHistorial === 'function') filtrarYMostrarHistorial();
  } else if (estado.categoria === 'inicio') {
    if (typeof renderizarResumenInicio === 'function') renderizarResumenInicio();
  }

  // 5. Cerrar modal y notificar al usuario
  cerrarModalPromptDiscoDetectado();
  mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en'
    ? `Album "${album.titulo}" registered in Mediary! `
    : `¡Álbum "${album.titulo}" registrado en Mediary! `
  );

  // 6. Verificar si queda otro disco en cola
  setTimeout(() => {
    verificarYMostrarPromptDiscoCompletado();
  }, 450);
}

function descartarPromptDiscoDetectado() {
  const album = estadoPromptAlbum.album;
  if (album) {
    let tracker = null;
    try {
      const raw = localStorage.getItem('mediary_spotify_album_tracker');
      if (raw) tracker = JSON.parse(raw);
    } catch (e) {}
    if (tracker) {
      if (tracker.albums && tracker.albums[album.id]) {
        tracker.albums[album.id].prompted = true;
        tracker.albums[album.id].dismissed = true;
      }
      tracker.pendingQueue = (tracker.pendingQueue || []).filter(id => id !== album.id);
      localStorage.setItem('mediary_spotify_album_tracker', JSON.stringify(tracker));
    }
  }
  cerrarModalPromptDiscoDetectado();
}

function cerrarModalPromptDiscoDetectado() {
  const modal = document.getElementById('modal-album-completado-spotify');
  if (modal) modal.style.display = 'none';
  if (window.fpDiscoDetectado) {
    try { window.fpDiscoDetectado.close(); } catch (e) {}
  }
  estadoPromptAlbum.album = null;
}

function procesarReproduccionesRecientesSpotify_(items) {
  let acc = null;
  try {
    const raw = localStorage.getItem('mediary_spotify_accumulator');
    if (raw) acc = JSON.parse(raw);
  } catch (e) {}

  if (!acc || typeof acc !== 'object') {
    acc = {
      totalMs: 0,
      totalTracks: 0,
      byYear: {},
      byMonth: {},
      seenKeys: [],
      firstSync: new Date().toISOString(),
      lastSync: new Date().toISOString()
    };
  }
  if (!acc.byYear) acc.byYear = {};
  if (!acc.byMonth) acc.byMonth = {};
  if (!Array.isArray(acc.seenKeys)) acc.seenKeys = [];

  const seenSet = new Set(acc.seenKeys);

  (items || []).forEach(it => {
    const track = it.track;
    if (!track) return;
    const key = it.played_at || (track.id + '_' + (it.played_at || ''));
    if (!key || seenSet.has(key)) return;

    seenSet.add(key);
    acc.seenKeys.push(key);

    const dur = Number(track.duration_ms) || 0;
    const playDate = it.played_at ? new Date(it.played_at) : new Date();
    const yr = String(playDate.getFullYear());
    const mo = yr + '-' + String(playDate.getMonth() + 1).padStart(2, '0');

    acc.totalMs = (acc.totalMs || 0) + dur;
    acc.totalTracks = (acc.totalTracks || 0) + 1;

    if (!acc.byYear[yr]) acc.byYear[yr] = { ms: 0, count: 0 };
    acc.byYear[yr].ms += dur;
    acc.byYear[yr].count++;

    if (!acc.byMonth[mo]) acc.byMonth[mo] = { ms: 0, count: 0 };
    acc.byMonth[mo].ms += dur;
    acc.byMonth[mo].count++;
  });

  if (acc.seenKeys.length > 5000) {
    acc.seenKeys = acc.seenKeys.slice(-5000);
  }
  acc.lastSync = new Date().toISOString();

  try {
    localStorage.setItem('mediary_spotify_accumulator', JSON.stringify(acc));
  } catch (e) {}

  return acc;
}

async function actualizarDatosSpotify(notificar = false) {
  const token = await obtenerTokenSpotifyValido();
  if (!token) {
    if (notificar) mostrarToastPersonalizado(tLang('No hay sesión activa de Spotify', 'No active Spotify session'));
    return;
  }

  try {
    const [
      meRes,
      recentRes,
      artShortRes, artMedRes, artLongRes,
      trkShortRes, trkMedRes, trkLongRes
    ] = await Promise.all([
      fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      fetch('https://api.spotify.com/v1/me/top/artists?limit=15&time_range=short_term', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      fetch('https://api.spotify.com/v1/me/top/artists?limit=15&time_range=medium_term', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      fetch('https://api.spotify.com/v1/me/top/artists?limit=15&time_range=long_term', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=15&time_range=short_term', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=15&time_range=medium_term', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=15&time_range=long_term', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
    ]);

    if (meRes && meRes.ok) {
      const me = await meRes.json();
      localStorage.setItem('mediary_spotify_user', JSON.stringify({
        id: me.id,
        display_name: me.display_name || me.id,
        avatar: me.images?.[0]?.url || '',
        followers: me.followers?.total || 0,
        product: me.product || 'free',
        country: me.country || ''
      }));
    }

    const mapperArt = (items) => (items || []).map(a => ({
      id: a.id,
      name: a.name,
      genres: (a.genres || []).slice(0, 3),
      image: a.images?.[0]?.url || '',
      popularity: a.popularity,
      url: a.external_urls?.spotify || ''
    }));

    const mapperTrk = (items) => (items || []).map(t => ({
      id: t.id,
      name: t.name,
      artist: t.artists?.map(x => x.name).join(', ') || '',
      album: t.album?.name || '',
      image: t.album?.images?.[0]?.url || '',
      duration_ms: t.duration_ms,
      url: t.external_urls?.spotify || ''
    }));

    let stats = {};
    try {
      const prevRaw = localStorage.getItem('mediary_spotify_stats');
      if (prevRaw) stats = JSON.parse(prevRaw);
    } catch(e) {}
    if (!stats.topArtistsByRange) stats.topArtistsByRange = {};
    if (!stats.topTracksByRange) stats.topTracksByRange = {};

    if (artShortRes && artShortRes.ok) {
      const d = await artShortRes.json();
      stats.topArtistsByRange.short_term = mapperArt(d.items);
    }
    if (artMedRes && artMedRes.ok) {
      const d = await artMedRes.json();
      stats.topArtistsByRange.medium_term = mapperArt(d.items);
    }
    if (artLongRes && artLongRes.ok) {
      const d = await artLongRes.json();
      stats.topArtistsByRange.long_term = mapperArt(d.items);
    }

    if (trkShortRes && trkShortRes.ok) {
      const d = await trkShortRes.json();
      stats.topTracksByRange.short_term = mapperTrk(d.items);
    }
    if (trkMedRes && trkMedRes.ok) {
      const d = await trkMedRes.json();
      stats.topTracksByRange.medium_term = mapperTrk(d.items);
    }
    if (trkLongRes && trkLongRes.ok) {
      const d = await trkLongRes.json();
      stats.topTracksByRange.long_term = mapperTrk(d.items);
    }

    const selRange = localStorage.getItem('mediary_spotify_selected_range') || 'medium_term';
    stats.selectedRange = selRange;
    stats.topArtists = stats.topArtistsByRange[selRange] || stats.topArtistsByRange.medium_term || stats.topArtistsByRange.short_term || stats.topArtists || [];
    stats.topTracks = stats.topTracksByRange[selRange] || stats.topTracksByRange.medium_term || stats.topTracksByRange.short_term || stats.topTracks || [];

    if (recentRes && recentRes.ok) {
      const recData = await recentRes.json();
      const items = recData.items || [];
      const totalMs = items.reduce((acc, it) => acc + (it.track?.duration_ms || 0), 0);
      stats.recentlyPlayedCount = items.length;
      stats.recentMinutes = Math.round(totalMs / 60000);
      stats.recentHours = (totalMs / 3600000).toFixed(1);

      // Guardar canciones recientemente escuchadas con played_at real
      stats.recentTracks = items.map(it => {
        const t = it.track;
        if (!t) return null;
        return {
          id: t.id,
          name: t.name,
          artist: t.artists?.map(x => x.name).join(', ') || '',
          album: t.album?.name || '',
          image: t.album?.images?.[0]?.url || '',
          url: t.external_urls?.spotify || '',
          duration_ms: t.duration_ms,
          played_at: it.played_at
        };
      }).filter(Boolean);

      const acc = procesarReproduccionesRecientesSpotify_(items);
      stats.accumulator = {
        totalMs: acc.totalMs,
        totalTracks: acc.totalTracks,
        byYear: acc.byYear,
        byMonth: acc.byMonth,
        lastSync: acc.lastSync
      };

      // Detectar discos completos escuchados
      procesarDeteccionAlbumesCompletosSpotify_(items);
    }

    stats.lastUpdated = new Date().toISOString();
    localStorage.setItem('mediary_spotify_stats', JSON.stringify(stats));

    if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(true);
    }

    actualizarUISpotify();
    renderizarContenidoModalSpotifyStats();
    if (notificar) mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Spotify stats updated!' : '¡Estadísticas de Spotify actualizadas!');
    setTimeout(() => {
      verificarYMostrarPromptDiscoCompletado();
    }, 600);
  } catch (err) {
    console.error('Error actualizando datos Spotify:', err);
    if (notificar) mostrarToastPersonalizado(tLang('Error al consultar Spotify', 'Error fetching Spotify data'));
  }
}

function cargarDatosDemoSpotify() {
  const demoUser = {
    id: 'spotify_demo_user',
    display_name: tLang('Cinéfilo & Melómano', 'Cinephile & Music Lover'),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    followers: 142,
    product: 'premium',
    country: 'CL'
  };

  const artistsShort = [
    { id: '1', name: 'The Weeknd', genres: ['pop', 'r&b'], image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=120&auto=format&fit=crop&q=80', popularity: 95 },
    { id: '2', name: 'Daft Punk', genres: ['electronic', 'french house'], image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80', popularity: 86 },
    { id: '3', name: 'Radiohead', genres: ['art rock', 'alternative rock'], image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80', popularity: 84 },
    { id: '4', name: 'Dua Lipa', genres: ['dance pop', 'pop'], image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', popularity: 89 },
    { id: '5', name: 'Arctic Monkeys', genres: ['indie rock', 'garage rock'], image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=120&auto=format&fit=crop&q=80', popularity: 87 }
  ];

  const artistsMedium = [
    { id: '1', name: 'Radiohead', genres: ['art rock', 'alternative rock'], image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80', popularity: 84 },
    { id: '2', name: 'Daft Punk', genres: ['electronic', 'french house'], image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80', popularity: 86 },
    { id: '3', name: 'Hans Zimmer', genres: ['soundtrack', 'orchestral'], image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=120&auto=format&fit=crop&q=80', popularity: 82 },
    { id: '4', name: 'Pink Floyd', genres: ['progressive rock', 'psychedelic'], image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&auto=format&fit=crop&q=80', popularity: 85 },
    { id: '5', name: 'The Weeknd', genres: ['pop', 'r&b'], image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=120&auto=format&fit=crop&q=80', popularity: 95 }
  ];

  const artistsLong = [
    { id: '4', name: 'Pink Floyd', genres: ['progressive rock', 'psychedelic'], image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&auto=format&fit=crop&q=80', popularity: 85 },
    { id: '1', name: 'Radiohead', genres: ['art rock', 'alternative rock'], image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80', popularity: 84 },
    { id: '6', name: 'David Bowie', genres: ['glam rock', 'art rock'], image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80', popularity: 81 },
    { id: '7', name: 'Queen', genres: ['classic rock', 'glam rock'], image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80', popularity: 88 },
    { id: '2', name: 'Daft Punk', genres: ['electronic', 'french house'], image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80', popularity: 86 }
  ];

  const tracksShort = [
    { id: 't1', name: 'Starboy', artist: 'The Weeknd, Daft Punk', album: 'Starboy', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80', duration_ms: 230453 },
    { id: 't6', name: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=120&auto=format&fit=crop&q=80', duration_ms: 200040 },
    { id: 't7', name: 'Get Lucky', artist: 'Daft Punk, Pharrell Williams', album: 'RAM', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80', duration_ms: 248000 },
    { id: 't4', name: 'One More Time', artist: 'Daft Punk', album: 'Discovery', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80', duration_ms: 320000 },
    { id: 't8', name: 'Creep', artist: 'Radiohead', album: 'Pablo Honey', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80', duration_ms: 238000 }
  ];

  const tracksMedium = [
    { id: 't1', name: 'Starboy', artist: 'The Weeknd, Daft Punk', album: 'Starboy', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80', duration_ms: 230453 },
    { id: 't2', name: 'Time', artist: 'Hans Zimmer', album: 'Inception (OST)', image: 'https://images.unsplash.com/photo-1442504028989-ab58b5f29a4a?w=120&auto=format&fit=crop&q=80', duration_ms: 275000 },
    { id: 't3', name: 'Paranoid Android', artist: 'Radiohead', album: 'OK Computer', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80', duration_ms: 383000 },
    { id: 't4', name: 'One More Time', artist: 'Daft Punk', album: 'Discovery', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80', duration_ms: 320000 },
    { id: 't5', name: 'Comfortably Numb', artist: 'Pink Floyd', album: 'The Wall', image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&auto=format&fit=crop&q=80', duration_ms: 382000 }
  ];

  const tracksLong = [
    { id: 't5', name: 'Comfortably Numb', artist: 'Pink Floyd', album: 'The Wall', image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&auto=format&fit=crop&q=80', duration_ms: 382000 },
    { id: 't9', name: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80', duration_ms: 354000 },
    { id: 't10', name: 'Heroes', artist: 'David Bowie', album: 'Heroes', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80', duration_ms: 367000 },
    { id: 't2', name: 'Time', artist: 'Hans Zimmer', album: 'Inception (OST)', image: 'https://images.unsplash.com/photo-1442504028989-ab58b5f29a4a?w=120&auto=format&fit=crop&q=80', duration_ms: 275000 },
    { id: 't3', name: 'Paranoid Android', artist: 'Radiohead', album: 'OK Computer', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80', duration_ms: 383000 }
  ];

  const now = new Date();
  const yr = String(now.getFullYear());
  const mo = yr + '-' + String(now.getMonth() + 1).padStart(2, '0');

  const demoAccumulator = {
    totalMs: 142 * 3600000,
    totalTracks: 2150,
    byYear: {
      [yr]: { ms: 118 * 3600000, count: 1820 },
      '2025': { ms: 24 * 3600000, count: 330 }
    },
    byMonth: {
      [mo]: { ms: 21.5 * 3600000, count: 340 }
    },
    seenKeys: [],
    firstSync: new Date(Date.now() - 90 * 86400000).toISOString(),
    lastSync: new Date().toISOString()
  };

  const selRange = localStorage.getItem('mediary_spotify_selected_range') || 'medium_term';
  const demoStats = {
    topArtistsByRange: {
      short_term: artistsShort,
      medium_term: artistsMedium,
      long_term: artistsLong
    },
    topTracksByRange: {
      short_term: tracksShort,
      medium_term: tracksMedium,
      long_term: tracksLong
    },
    selectedRange: selRange,
    topArtists: selRange === 'short_term' ? artistsShort : (selRange === 'long_term' ? artistsLong : artistsMedium),
    topTracks: selRange === 'short_term' ? tracksShort : (selRange === 'long_term' ? tracksLong : tracksMedium),
    recentlyPlayedCount: 50,
    recentMinutes: 185,
    recentHours: '3.1',
    recentTracks: tracksShort.map((t, idx) => ({
      ...t,
      played_at: new Date(Date.now() - (idx + 1) * 3600000).toISOString()
    })),
    accumulator: demoAccumulator,
    lastUpdated: new Date().toISOString()
  };

  localStorage.setItem('mediary_spotify_token', 'demo_token_' + Date.now());
  localStorage.setItem('mediary_spotify_expires_at', String(Date.now() + 86400000));
  localStorage.setItem('mediary_spotify_user', JSON.stringify(demoUser));
  localStorage.setItem('mediary_spotify_stats', JSON.stringify(demoStats));
  localStorage.setItem('mediary_spotify_accumulator', JSON.stringify(demoAccumulator));

  const hoyISO = new Date().toISOString().slice(0, 10);
  const demoTracker = {
    albums: {
      'demo_album_ok_computer': {
        id: 'demo_album_ok_computer',
        titulo: 'OK Computer',
        artista: 'Radiohead',
        poster: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
        totalTracks: 12,
        releaseDate: '1997-05-21',
        playedTracks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        completed: true,
        completedDate: hoyISO,
        prompted: false,
        dismissed: false
      }
    },
    pendingQueue: ['demo_album_ok_computer']
  };
  localStorage.setItem('mediary_spotify_album_tracker', JSON.stringify(demoTracker));
  setTimeout(() => {
    verificarYMostrarPromptDiscoCompletado();
  }, 700);

  cerrarModalConectarSpotify();
  actualizarUISpotify();
  mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Demo Spotify account loaded! ' : '¡Cuenta de prueba Spotify cargada! ');
}

function conectarSpotifyDemo() {
  cargarDatosDemoSpotify();
}

function actualizarUISpotify() {
  const token = localStorage.getItem('mediary_spotify_token');
  const userRaw = localStorage.getItem('mediary_spotify_user');
  let user = null;
  try { if (userRaw) user = JSON.parse(userRaw); } catch(e) {}
  const isConn = !!(token || user);

  const badge = document.getElementById('cfg-spotify-badge');
  const disBox = document.getElementById('cfg-spotify-disconnected-box');
  const connBox = document.getElementById('cfg-spotify-connected-box');
  const nameEl = document.getElementById('cfg-spotify-user-name');
  const avatarEl = document.getElementById('cfg-spotify-user-avatar');
  const subEl = document.getElementById('cfg-spotify-user-sub');

  if (isConn) {
    if (badge) badge.style.display = 'inline-flex';
    if (disBox) disBox.style.display = 'none';
    if (connBox) connBox.style.display = 'block';
    if (nameEl) nameEl.textContent = user?.display_name || tLang('Usuario Spotify', 'Spotify User');
    if (subEl) subEl.textContent = user?.product === 'premium' ? tLang('Spotify Premium · Conectado', 'Spotify Premium · Connected') : tLang('Conectado', 'Connected');
    if (avatarEl) {
      if (user?.avatar) {
        avatarEl.innerHTML = `<img loading="lazy" decoding="async" src="${user.avatar}" alt="Spotify Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        avatarEl.innerHTML = getHeroIcon('check', '', 18);
      }
    }
  } else {
    if (badge) badge.style.display = 'none';
    if (disBox) disBox.style.display = 'block';
    if (connBox) connBox.style.display = 'none';
  }
  if (typeof renderizarAppsVinculadasConfig === 'function') renderizarAppsVinculadasConfig();
}

function desconectarSpotify() {
  localStorage.removeItem('mediary_spotify_token');
  localStorage.removeItem('mediary_spotify_refresh_token');
  localStorage.removeItem('mediary_spotify_expires_at');
  localStorage.removeItem('mediary_spotify_user');
  localStorage.removeItem('mediary_spotify_stats');
  localStorage.removeItem('mediary_spotify_now_playing');
  if (typeof detenerPollingSpotifyLive === 'function') detenerPollingSpotifyLive();
  actualizarUISpotify();
  if (typeof renderizarEscuchandoAhoraInicio === 'function') {
    renderizarEscuchandoAhoraInicio(false);
  }
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
  mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'Spotify disconnected' : 'Spotify desconectado');
}


function abrirModalEstadisticasSpotify() {
  const modal = document.getElementById('modal-spotify-stats');
  if (!modal) return;
  modal.style.display = 'flex';
  renderizarContenidoModalSpotifyStats();
}

function cerrarModalEstadisticasSpotify() {
  const modal = document.getElementById('modal-spotify-stats');
  if (modal) modal.style.display = 'none';
}

function cambiarTabSpotifyStats(tab) {
  estadoSpotify.currentTab = tab;
  const btnArt = document.getElementById('sp-tab-artists');
  const btnTrk = document.getElementById('sp-tab-tracks');
  if (btnArt) btnArt.classList.toggle('active', tab === 'artists');
  if (btnTrk) btnTrk.classList.toggle('active', tab === 'tracks');
  renderizarContenidoModalSpotifyStats();
}

function renderizarContenidoModalSpotifyStats() {
  const statsRaw = localStorage.getItem('mediary_spotify_stats');
  const userRaw = localStorage.getItem('mediary_spotify_user');
  let stats = null;
  let user = null;
  try { if (statsRaw) stats = JSON.parse(statsRaw); } catch(e) {}
  try { if (userRaw) user = JSON.parse(userRaw); } catch(e) {}

  const l = userPrefs.lang || 'es';
  const displayUser = document.getElementById('spotify-stats-user-display');
  if (displayUser && user) {
    displayUser.textContent = `${user.display_name} (${user.product === 'premium' ? 'Premium' : 'Free'})`;
  }

  const minEl = document.getElementById('sp-stat-minutes');
  const countEl = document.getElementById('sp-stat-tracks-count');
  const genreEl = document.getElementById('sp-stat-top-genre');
  const syncTimeEl = document.getElementById('spotify-stats-sync-time');

  if (stats) {
    if (minEl) minEl.textContent = stats.recentMinutes ? `${stats.recentMinutes} min` : (stats.recentHours ? `${stats.recentHours} hrs` : '--');
    if (countEl) countEl.textContent = (stats.topTracks?.length || 0) + (stats.topArtists?.length || 0);
    const topG = stats.topArtists?.[0]?.genres?.[0];
    if (genreEl) genreEl.textContent = topG ? (topG.charAt(0).toUpperCase() + topG.slice(1)) : tLang('Música Variada', 'Varied Music');
    if (syncTimeEl && stats.lastUpdated) {
      try {
        const d = new Date(stats.lastUpdated);
        syncTimeEl.textContent = `${l === 'en' ? 'Synced at' : 'Sincronizado:'} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } catch (e) {}
    }
  }

  const listContainer = document.getElementById('spotify-stats-content-list');
  if (!listContainer) return;

  if (!stats) {
    listContainer.innerHTML = `
      <div style="text-align:center; padding:30px 20px; color:var(--muted); font-size:0.85rem;">
        <span style="display:block; margin-bottom:8px;">${getHeroIcon("musical-note", "", 32)}</span>
        ${l === 'en' ? 'No stats available yet. Click "Update" to fetch from Spotify.' : 'No hay estadísticas disponibles aún. Haz clic en "Actualizar" para consultar Spotify.'}
      </div>
    `;
    return;
  }

  if (estadoSpotify.currentTab === 'artists') {
    const artists = stats.topArtists || [];
    if (!artists.length) {
      listContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--muted); font-size:0.85rem;">${l === 'en' ? 'No artist data found.' : 'No se encontraron artistas.'}</div>`;
      return;
    }
    listContainer.innerHTML = artists.map((a, idx) => {
      const imgHtml = a.image
        ? `<img loading="lazy" decoding="async" src="${a.image}" alt="${escHtmlSpotify_(a.name)}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(29,185,84,0.4);">`
        : `<div style="width:42px;height:42px;border-radius:50%;background:var(--bg);border:1px solid var(--border);display:grid;place-items:center;font-size:1.2rem;">${getHeroIcon('microphone', '', 18)}</div>`;
      const genresHtml = (a.genres || []).map(g => `<span class="feed-cat-badge" style="font-size:0.68rem;padding:1px 6px;">${escHtmlSpotify_(g)}</span>`).join(' ');
      
      const payloadEnc = encodeURIComponent(JSON.stringify({
        titulo: a.name,
        tituloOriginal: a.name,
        creador: a.name,
        categoria: 'Musica',
        subcategoria: 'Álbum',
        poster: a.image
      }));

      return `
        <div class="spotify-item-row">
          <div class="spotify-rank-badge">#${idx + 1}</div>
          ${imgHtml}
          <div style="min-width:0; flex:1;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
              <strong style="font-size:0.88rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escHtmlSpotify_(a.name)}</strong>
              ${a.popularity ? `<span style="font-size:0.7rem; color:#10b981; font-weight:700; display:inline-flex; align-items:center; gap:2px;">${getHeroIcon('star', '', 10)} ${a.popularity}%</span>` : ''}
            </div>
            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:2px;">
              ${genresHtml || `<span style="font-size:0.7rem; color:var(--muted);">${tLang('Artista', 'Artist')}</span>`}
            </div>
          </div>
          <button type="button" class="btn-today-pill" style="height:28px; padding:0 8px; font-size:0.72rem; flex-shrink:0;" onclick="guardarItemSpotifyEnMediary('${payloadEnc}', this)" title="${l === 'en' ? 'Add artist album to Watchlist' : 'Guardar en mi Watchlist de música'}">
            <span>${getHeroIcon("bookmark", "", 14)}</span>
          </button>
        </div>
      `;
    }).join('');
  } else {
    const tracks = stats.topTracks || [];
    if (!tracks.length) {
      listContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--muted); font-size:0.85rem;">${l === 'en' ? 'No track data found.' : 'No se encontraron canciones.'}</div>`;
      return;
    }
    listContainer.innerHTML = tracks.map((t, idx) => {
      const min = Math.floor((t.duration_ms || 0) / 60000);
      const sec = Math.floor(((t.duration_ms || 0) % 60000) / 1000).toString().padStart(2, '0');
      const durationStr = `${min}:${sec}`;
      const imgHtml = t.image
        ? `<img loading="lazy" decoding="async" src="${t.image}" alt="${escHtmlSpotify_(t.name)}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;box-shadow:0 2px 6px rgba(0,0,0,0.3);">`
        : `<div style="width:40px;height:40px;border-radius:4px;background:var(--bg);border:1px solid var(--border);display:grid;place-items:center;font-size:1.1rem;">${getHeroIcon('musical-note', '', 18)}</div>`;

      const payloadEnc = encodeURIComponent(JSON.stringify({
        titulo: t.album || t.name,
        tituloOriginal: t.name,
        creador: t.artist,
        categoria: 'Musica',
        subcategoria: 'Canción',
        poster: t.image
      }));

      return `
        <div class="spotify-item-row">
          <div class="spotify-rank-badge">#${idx + 1}</div>
          ${imgHtml}
          <div style="min-width:0; flex:1;">
            <strong style="font-size:0.88rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlSpotify_(t.name)}</strong>
            <span style="font-size:0.74rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlSpotify_(t.artist)} ${t.album ? '· ' + escHtmlSpotify_(t.album) : ''}</span>
          </div>
          <span style="font-size:0.72rem; color:var(--muted); font-weight:600; flex-shrink:0;">${durationStr}</span>
          <button type="button" class="btn-today-pill" style="height:28px; padding:0 8px; font-size:0.72rem; flex-shrink:0;" onclick="guardarItemSpotifyEnMediary('${payloadEnc}', this)" title="${l === 'en' ? 'Add track to Watchlist' : 'Guardar canción en mi Watchlist'}">
            <span>${getHeroIcon("bookmark", "", 14)}</span>
          </button>
        </div>
      `;
    }).join('');
  }
}

function guardarItemSpotifyEnMediary(itemPayloadEnc, btnEl) {
  try {
    const item = JSON.parse(decodeURIComponent(itemPayloadEnc));
    if (btnEl) {
      btnEl.classList.add('added');
      btnEl.innerHTML = `<span>${getHeroIcon('check', '', 14)}</span>`;
      btnEl.style.color = '#10b981';
      btnEl.style.borderColor = 'rgba(16,185,129,0.4)';
      btnEl.disabled = true;
    }
    agregarAWatchlistDirecto(item, btnEl);
    mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Added to your Music Watchlist!' : '¡Agregado a tu Watchlist de Música! ');
  } catch (err) {
    console.error('Error guardando item de Spotify en Mediary:', err);
  }
}

// --- ESCUCHANDO AHORA (SPOTIFY LIVE) ---
let _spotifyUltimaConsultaLive = 0;
let _spotifyNowPlayingCache = null;
window.spotifyNowPlayingInterval = null;
window.spotifyTickerInterval = null;
window.spotifyCurrentTrackState = null;
window.spotifyActiveDeviceId = null;
window.spotifyActiveDeviceName = '';
window.spotifyActiveDeviceType = '';

function formatearMinSegSpotify(ms) {
  if (!ms || isNaN(ms) || ms < 0) return '0:00';
  const totalSeg = Math.floor(ms / 1000);
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;
  return `${min}:${seg < 10 ? '0' : ''}${seg}`;
}

function obtenerIconoTipoDispositivoSpotify(type) {
  const t = (type || '').toLowerCase();
  if (t === 'smartphone') return getHeroIcon('device-phone-mobile');
  if (t === 'computer') return getHeroIcon('tv');
  if (t === 'tablet') return getHeroIcon('device-phone-mobile');
  if (t === 'castvideo' || t === 'tv') return getHeroIcon('tv');
  if (t === 'speaker' || t === 'castaudio') return getHeroIcon('musical-note');
  if (t === 'gameconsole') return getHeroIcon('gamepad');
  return getHeroIcon('musical-note');
}

function rankearDispositivoSpotify(d, isMobile, preferredId) {
  let score = 0;
  if (preferredId && d.id === preferredId) score += 100;
  if (d.is_active) score += 40;
  
  const typeLow = (d.type || '').toLowerCase();
  const nameLow = (d.name || '').toLowerCase();
  const ua = navigator.userAgent.toLowerCase();

  if (isMobile) {
    if (typeLow === 'smartphone') score += 50;
    if (typeLow === 'tablet') score += 25;
    if (ua.includes('iphone') && nameLow.includes('iphone')) score += 35;
    if (ua.includes('ipad') && nameLow.includes('ipad')) score += 35;
    if (ua.includes('android') && (nameLow.includes('android') || nameLow.includes('galaxy') || nameLow.includes('pixel') || nameLow.includes('xiaomi') || nameLow.includes('redmi') || nameLow.includes('huawei') || nameLow.includes('motorola'))) score += 35;
    
    // Penalización drástica para NUNCA despertar una TV o consola o parlante ajeno por error
    if (typeLow === 'castvideo' || typeLow === 'tv' || nameLow.includes('tv') || nameLow.includes('chromecast') || typeLow === 'avr' || typeLow === 'gameconsole') {
      score -= 80;
    }
    if (typeLow === 'speaker' || typeLow === 'castaudio') {
      score -= 30;
    }
  } else {
    // Si estamos en Computadora / Laptop
    if (typeLow === 'computer') score += 50;
    if (ua.includes('mac') && (nameLow.includes('mac') || nameLow.includes('apple'))) score += 35;
    if (ua.includes('windows') && (nameLow.includes('pc') || nameLow.includes('laptop') || nameLow.includes('desktop') || nameLow.includes('windows'))) score += 35;
    if (typeLow === 'castvideo' || typeLow === 'tv' || nameLow.includes('tv')) score -= 70;
  }
  return score;
}

async function consultarSpotifyCurrentlyPlaying() {
  let token = await obtenerTokenSpotifyValido();
  if (!token) return { conectado: false };

  try {
    // 1. Intentar con /me/player para obtener el dispositivo y el track activo (soporta canciones y podcasts)
    let res = await fetch('https://api.spotify.com/v1/me/player?additional_types=track,episode', {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => null);

    // Si el token expiró (401), forzar renovación inmediata y reintentar
    if (res && res.status === 401) {
      token = await obtenerTokenSpotifyValido(true);
      if (token) {
        res = await fetch('https://api.spotify.com/v1/me/player?additional_types=track,episode', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);
      }
    }

    // 2. Si /me/player devuelve 204 (sin dispositivo activo), 202, o 403 (falta permiso player-state o Free),
    // consultar /currently-playing que solo requiere user-read-currently-playing
    if (!res || res.status === 204 || res.status === 202 || res.status === 403) {
      let resCurr = await fetch('https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (resCurr && resCurr.status === 401) {
        token = await obtenerTokenSpotifyValido(true);
        if (token) {
          resCurr = await fetch('https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null);
        }
      }

      if (resCurr && resCurr.ok && resCurr.status !== 204 && resCurr.status !== 202) {
        res = resCurr;
      } else if (resCurr && (resCurr.status === 204 || resCurr.status === 202)) {
        return { conectado: true, reproduciendo: false };
      }
    }

    if (!res || res.status === 204 || res.status === 202) {
      return { conectado: true, reproduciendo: false };
    }
    if (res.status === 401) {
      return { conectado: false, error: 'unauthorized' };
    }
    if (res.status === 403) {
      return { conectado: true, reproduciendo: false, error: 'forbidden_scopes' };
    }
    if (!res.ok) {
      return { conectado: true, reproduciendo: false };
    }
    const data = await res.json();
    if (!data || !data.item) {
      return { conectado: true, reproduciendo: false };
    }
    if (data.device) {
      window.spotifyActiveDeviceId = data.device.id;
      window.spotifyActiveDeviceName = data.device.name;
      window.spotifyActiveDeviceType = data.device.type;
    }
    return { conectado: true, reproduciendo: true, data };
  } catch (err) {
    console.warn('Error consultando currently-playing de Spotify:', err);
    return { conectado: true, reproduciendo: false, error: err };
  }
}

async function controlarSpotifyPlayback(accion) {
  let token = await obtenerTokenSpotifyValido();
  if (!token) {
    mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Connect Spotify first' : 'Conecta Spotify primero');
    return;
  }

  // Feedback optimista inmediato en la UI
  const playBtn = document.querySelector('.btn-spotify-ctrl-play');
  const statusPill = document.querySelector('.home-np-live-status-pill');
  if (playBtn) {
    if (accion === 'play') {
      playBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
      if (statusPill) {
        statusPill.classList.remove('paused');
        statusPill.innerHTML = `<span class="home-np-dot"></span><span>${(typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'Starting...' : 'Iniciando...'}</span>`;
      }
    } else if (accion === 'pause') {
      playBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
      if (statusPill) {
        statusPill.classList.add('paused');
        statusPill.innerHTML = `<span class="home-np-dot"></span><span>${(typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'Paused' : 'En pausa'}</span>`;
      }
    }
  }

  const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
  const preferredId = localStorage.getItem('mediary_spotify_preferred_device_id') || '';

  let deviceId = '';
  let devicesDisponibles = [];

  try {
    const devRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (devRes.ok) {
      const devData = await devRes.json();
      devicesDisponibles = devData.devices || [];
    }
  } catch (e) {}

  if (devicesDisponibles.length > 0) {
    const activo = devicesDisponibles.find(d => d.is_active);

    // Ordenar dispositivos por idoneidad para el usuario actual
    const ranked = [...devicesDisponibles].sort((a, b) => 
      rankearDispositivoSpotify(b, isMobile, preferredId) - rankearDispositivoSpotify(a, isMobile, preferredId)
    );

    const mejorDispositivo = ranked[0];
    const scoreMejor = rankearDispositivoSpotify(mejorDispositivo, isMobile, preferredId);

    // Si la acción es play y no hay nada reproduciéndose:
    if (accion === 'play' && (!activo || !activo.is_active)) {
      // Si el mejor dispositivo es un Cast lejano o Smart TV (score negativo) y estamos en celular:
      // NO activar la TV o parlante lejano de sorpresa
      if (scoreMejor < 0 && isMobile) {
        mostrarToastPersonalizado(userPrefs.lang === 'en'
          ? 'Open Spotify on your phone/headphones first '
          : 'Abre Spotify en tu celular para activar tus audífonos ');
        return;
      }
      deviceId = mejorDispositivo.id;
      window.spotifyActiveDeviceId = deviceId;
      window.spotifyActiveDeviceName = mejorDispositivo.name;
      window.spotifyActiveDeviceType = mejorDispositivo.type;
    } else if (activo) {
      deviceId = activo.id;
      window.spotifyActiveDeviceId = deviceId;
      window.spotifyActiveDeviceName = activo.name;
      window.spotifyActiveDeviceType = activo.type;
    } else {
      deviceId = mejorDispositivo ? mejorDispositivo.id : (window.spotifyActiveDeviceId || '');
    }
  } else {
    // Si no hay dispositivos visibles en Spotify Connect
    if (accion === 'play') {
      mostrarToastPersonalizado(userPrefs.lang === 'en'
        ? 'No active Spotify player. Open Spotify on your phone '
        : 'Abre Spotify en tu celular o audífonos para escuchar ');
      return;
    }
  }

  const queryDev = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
  let url = '';
  let method = 'POST';

  if (accion === 'next') {
    url = `https://api.spotify.com/v1/me/player/next${queryDev}`;
    method = 'POST';
  } else if (accion === 'previous') {
    url = `https://api.spotify.com/v1/me/player/previous${queryDev}`;
    method = 'POST';
  } else if (accion === 'play') {
    url = `https://api.spotify.com/v1/me/player/play${queryDev}`;
    method = 'PUT';
  } else if (accion === 'pause') {
    url = `https://api.spotify.com/v1/me/player/pause${queryDev}`;
    method = 'PUT';
  }

  try {
    let res = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401) {
      localStorage.removeItem('mediary_spotify_expires_at');
      token = await obtenerTokenSpotifyValido();
      if (token) {
        res = await fetch(url, {
          method: method,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      }
    }

    if (!res.ok && res.status !== 204) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = String(errData.error?.message || '').toLowerCase();
      console.warn('Spotify player control error:', res.status, errMsg);
      const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');

      if (res.status === 403) {
        if (errMsg.includes('scope') || errMsg.includes('permission')) {
          mostrarToastPersonalizado(isEn
            ? 'Reconnect Spotify in Settings to activate playback controls.'
            : 'Vuelve a conectar Spotify en Configuración para activar permisos de control.');
          abrirModalConectarSpotify();
        } else if (errMsg.includes('premium')) {
          mostrarToastPersonalizado(isEn
            ? 'Playback control requires a Spotify Premium account.'
            : 'Spotify requiere cuenta Premium para controlar la reproducción.');
        } else {
          mostrarToastPersonalizado(isEn ? 'Control requires Spotify Premium or active app.' : 'El control requiere Spotify Premium o app abierta.');
        }
      } else if (res.status === 404) {
        mostrarToastPersonalizado(isEn
          ? 'No active player found. Open Spotify on your device.'
          : 'No hay reproductor activo. Abre Spotify en tu dispositivo.');
      }
    }

    // Invalidar caché y ejecutar sondeo escalonado para reflejar de inmediato la reproducción en la tarjeta
    _spotifyNowPlayingCache = null;
    _spotifyUltimaConsultaLive = 0;

    const delays = [500, 1200, 2200, 3800];
    delays.forEach(delay => {
      setTimeout(async () => {
        _spotifyNowPlayingCache = null;
        _spotifyUltimaConsultaLive = 0;
        await renderizarEscuchandoAhoraInicio(true);
      }, delay);
    });
  } catch (err) {
    console.warn('Error en controlarSpotifyPlayback:', err);
  }
}

async function abrirSelectorDispositivosSpotify() {
  const modal = document.getElementById('modal-spotify-devices');
  const listEl = document.getElementById('spotify-devices-list');
  if (!modal || !listEl) return;

  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');
  listEl.innerHTML = `
    <div style="padding:22px; text-align:center; color:var(--muted); font-size:0.8rem;">
      <span class="spinning" style="display:inline-block;">${getHeroIcon('clock', '', 14)}</span> ${isEn ? 'Searching Spotify devices...' : 'Buscando dispositivos Spotify...'}
    </div>
  `;
  modal.style.display = 'flex';

  const token = await obtenerTokenSpotifyValido();
  if (!token) {
    listEl.innerHTML = `<div style="padding:16px; text-align:center; color:var(--muted); font-size:0.8rem;">${isEn ? 'Please connect Spotify first' : 'Conecta Spotify primero'}</div>`;
    return;
  }

  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch devices');
    const data = await res.json();
    const devices = data.devices || [];

    if (!devices.length) {
      listEl.innerHTML = `
        <div style="padding:18px 10px; text-align:center; color:var(--muted); font-size:0.82rem; line-height:1.45;">
          <div style="margin-bottom:8px;">${getHeroIcon("musical-note", "", 36)}</div>
          <strong style="color:var(--text); display:block; margin-bottom:6px;">${isEn ? 'No active devices found' : 'No se detectaron dispositivos abiertos'}</strong>
          <span>${isEn ? 'Open Spotify on your phone, headphones or computer to wake it up.' : 'Abre Spotify en tu celular o audífonos para activarlo.'}</span>
        </div>
      `;
      return;
    }

    const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
    const prefId = localStorage.getItem('mediary_spotify_preferred_device_id') || '';

    devices.sort((a, b) => rankearDispositivoSpotify(b, isMobile, prefId) - rankearDispositivoSpotify(a, isMobile, prefId));

    listEl.innerHTML = devices.map(d => {
      const icon = obtenerIconoTipoDispositivoSpotify(d.type);
      const isActive = !!d.is_active;
      const isPref = d.id === prefId;
      const badgeText = isActive ? (isEn ? 'Active now' : 'Activo ahora') : (isPref ? (isEn ? 'Preferred' : 'Preferido') : '');

      return `
        <div class="spotify-device-option ${isActive ? 'is-active' : ''}" onclick="transferirPlaybackSpotify('${d.id}', '${encodeURIComponent(d.name)}')" style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:var(--bg); border:1px solid ${isActive ? '#10b981' : 'var(--border)'}; border-radius:10px; cursor:pointer;">
          <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
            <span style="font-size:1.35rem; flex-shrink:0;">${icon}</span>
            <div style="min-width:0; flex:1;">
              <strong style="font-size:0.86rem; color:var(--text); display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escHtmlSpotify_(d.name)}</strong>
              <span style="font-size:0.72rem; color:var(--muted);">${d.type || 'Device'}${d.volume_percent !== null ? ` • Vol ${d.volume_percent}%` : ''}</span>
            </div>
          </div>
          ${badgeText ? `<span style="font-size:0.68rem; font-weight:700; color:${isActive ? '#10b981' : 'var(--accent)'}; background:rgba(${isActive ? '16,185,129' : '56,189,248'},0.12); border:1px solid rgba(${isActive ? '16,185,129' : '56,189,248'},0.3); padding:2px 8px; border-radius:8px; margin-left:8px; flex-shrink:0;">${badgeText}</span>` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    listEl.innerHTML = `<div style="padding:16px; text-align:center; color:var(--muted); font-size:0.8rem;">${tLang('Error consultando dispositivos.', 'Error loading devices.')}</div>`;
  }
}

function cerrarSelectorDispositivosSpotify() {
  const modal = document.getElementById('modal-spotify-devices');
  if (modal) modal.style.display = 'none';
}

async function transferirPlaybackSpotify(deviceId, nameEncoded) {
  const token = await obtenerTokenSpotifyValido();
  if (!token || !deviceId) return;
  const devName = nameEncoded ? decodeURIComponent(nameEncoded) : tLang('Dispositivo', 'Device');
  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');

  try {
    const res = await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_ids: [deviceId], play: true })
    });
    
    window.spotifyActiveDeviceId = deviceId;
    window.spotifyActiveDeviceName = devName;
    localStorage.setItem('mediary_spotify_preferred_device_id', deviceId);
    if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(false);
    }

    cerrarSelectorDispositivosSpotify();
    mostrarToastPersonalizado(isEn ? `Playing on ${devName} ` : `Reproduciendo en ${devName} `);

    setTimeout(() => {
      _spotifyNowPlayingCache = null;
      _spotifyUltimaConsultaLive = 0;
      renderizarEscuchandoAhoraInicio(true);
    }, 700);
  } catch (err) {
    console.warn('Error transfiriendo playback:', err);
  }
}

function registrarDiscoActualEnMediary(album, artista) {
  let busqueda = (album && album !== '—') ? album.trim() : '';
  if (artista) {
    busqueda = busqueda ? `${busqueda} ${artista.trim()}` : artista.trim();
  }
  if (!busqueda) return;
  cambiarCat('Musica', 'Discos');
  setTimeout(() => {
    const inSearch = document.getElementById('input-search');
    if (inSearch) {
      inSearch.value = busqueda;
      inSearch.focus();
      if (typeof buscarEnVivo === 'function') {
        buscarEnVivo(busqueda);
      }
    }
  }, 120);
}

function estaLiveCardExpandida(tipo) {
  if (tipo === 'spotify' || tipo === 'playstation') {
    if (typeof window.spotifyCardExpanded !== 'undefined') return !!window.spotifyCardExpanded;
    if (typeof window.psnCardExpanded !== 'undefined') return !!window.psnCardExpanded;
    const s = localStorage.getItem('mediary_spotify_card_expanded');
    const p = localStorage.getItem('mediary_psn_card_expanded');
    return (s === 'true' || p === 'true');
  } else if (tipo === 'friends_spotify' || tipo === 'friends_playstation') {
    if (typeof window.friendsSpCardExpanded !== 'undefined') return !!window.friendsSpCardExpanded;
    if (typeof window.friendsPsnCardExpanded !== 'undefined') return !!window.friendsPsnCardExpanded;
    const s = localStorage.getItem('mediary_friends_sp_card_expanded') || localStorage.getItem('mediary_friends_spotify_card_expanded');
    const p = localStorage.getItem('mediary_friends_psn_card_expanded');
    return (s === 'true' || p === 'true');
  }
  return false;
}
window.estaLiveCardExpandida = estaLiveCardExpandida;

function toggleLiveCardExpansion(tipo, ev) {
  if (ev) {
    if (ev.target.closest('button, a, input, select, .btn-spotify-ctrl, .btn-np-quick-add, .btn-psn-quick-add, .home-np-sp-logo-link, .home-psn-logo-link, .btn-spotify-sub-action')) return;
  }
  if (tipo === 'spotify' || tipo === 'playstation') {
    const nuevo = !estaLiveCardExpandida('spotify');
    window.spotifyCardExpanded = nuevo;
    window.psnCardExpanded = nuevo;
    try {
      localStorage.setItem('mediary_spotify_card_expanded', nuevo ? 'true' : 'false');
      localStorage.setItem('mediary_psn_card_expanded', nuevo ? 'true' : 'false');
    } catch(e) {}
    if (typeof guardarPreferenciasLocales === 'function') {
      guardarPreferenciasLocales(false);
    }

    const spCard = document.querySelector('#home-now-playing-container .home-spotify-card-compact');
    if (spCard) {
      spCard.classList.toggle('is-expanded', nuevo);
      spCard.classList.toggle('is-collapsed', !nuevo);
      const ind = spCard.querySelector('.live-card-expand-indicator');
      if (ind) ind.title = nuevo ? (userPrefs?.lang === 'en' ? 'Collapse' : 'Reducir') : (userPrefs?.lang === 'en' ? 'Expand' : 'Expandir');
    }
    const psnCard = document.querySelector('#home-psn-now-playing-container .home-playstation-card-compact');
    if (psnCard) {
      psnCard.classList.toggle('is-expanded', nuevo);
      psnCard.classList.toggle('is-collapsed', !nuevo);
      const ind = psnCard.querySelector('.live-card-expand-indicator');
      if (ind) ind.title = nuevo ? (userPrefs?.lang === 'en' ? 'Collapse' : 'Reducir') : (userPrefs?.lang === 'en' ? 'Expand' : 'Expandir');
    }

    // Centrar la tarjeta activa en el carrusel
    const carousel = document.getElementById('home-live-carousel');
    if (carousel) {
      const activeIdx = (tipo === 'playstation') ? 1 : 0;
      setTimeout(() => {
        carousel.scrollTo({ left: activeIdx * carousel.clientWidth, behavior: 'smooth' });
        actualizarPillsCarouselLive(activeIdx);
      }, 40);
    }
  } else if (tipo === 'friends_spotify' || tipo === 'friends_playstation') {
    const nuevo = !estaLiveCardExpandida('friends_spotify');
    window.friendsSpCardExpanded = nuevo;
    window.friendsPsnCardExpanded = nuevo;
    try {
      localStorage.setItem('mediary_friends_sp_card_expanded', nuevo ? 'true' : 'false');
      localStorage.setItem('mediary_friends_spotify_card_expanded', nuevo ? 'true' : 'false');
      localStorage.setItem('mediary_friends_psn_card_expanded', nuevo ? 'true' : 'false');
    } catch(e) {}
    if (typeof guardarPreferenciasLocales === 'function') {
      guardarPreferenciasLocales(false);
    }

    const spCard = document.querySelector('#home-friends-last-track-container .home-spotify-card-compact');
    if (spCard) {
      spCard.classList.toggle('is-expanded', nuevo);
      spCard.classList.toggle('is-collapsed', !nuevo);
      const ind = spCard.querySelector('.live-card-expand-indicator');
      if (ind) ind.title = nuevo ? (userPrefs?.lang === 'en' ? 'Collapse' : 'Reducir') : (userPrefs?.lang === 'en' ? 'Expand' : 'Expandir');
    }
    const psnCard = document.querySelector('#home-friends-psn-container .home-playstation-card-compact');
    if (psnCard) {
      psnCard.classList.toggle('is-expanded', nuevo);
      psnCard.classList.toggle('is-collapsed', !nuevo);
      const ind = psnCard.querySelector('.live-card-expand-indicator');
      if (ind) ind.title = nuevo ? (userPrefs?.lang === 'en' ? 'Collapse' : 'Reducir') : (userPrefs?.lang === 'en' ? 'Expand' : 'Expandir');
    }

    // Centrar la tarjeta activa en el carrusel de amigos
    const carousel = document.getElementById('home-friends-live-carousel');
    if (carousel) {
      const activeIdx = (tipo === 'friends_playstation') ? 1 : 0;
      setTimeout(() => {
        carousel.scrollTo({ left: activeIdx * carousel.clientWidth, behavior: 'smooth' });
        actualizarPillsCarouselFriendsLive(activeIdx);
      }, 40);
    }
  }
  setTimeout(() => {
    if (typeof ajustarMarqueeSpotify === 'function') ajustarMarqueeSpotify();
  }, 180);
}
window.toggleLiveCardExpansion = toggleLiveCardExpansion;

function cambiarSlideLive(idx) {
  const carousel = document.getElementById('home-live-carousel');
  if (!carousel) return;
  const w = carousel.clientWidth || 1;
  carousel.scrollTo({ left: idx * w, behavior: 'smooth' });
  actualizarPillsCarouselLive(idx);
}
window.cambiarSlideLive = cambiarSlideLive;

function actualizarPillsCarouselLive(idx) {
  const dotSp = document.getElementById('dot-live-spotify');
  const dotPsn = document.getElementById('dot-live-psn');
  if (dotSp) dotSp.classList.toggle('active', idx === 0);
  if (dotPsn) dotPsn.classList.toggle('active', idx === 1);
}
window.actualizarPillsCarouselLive = actualizarPillsCarouselLive;

function inicializarLiveCarouselScrollListener() {
  const carousel = document.getElementById('home-live-carousel');
  if (!carousel || carousel._hasLiveScrollListener) return;
  carousel._hasLiveScrollListener = true;
  let rafId = 0;
  carousel.addEventListener('scroll', () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      const w = carousel.clientWidth || 1;
      actualizarPillsCarouselLive(Math.round(carousel.scrollLeft / w));
    });
  }, { passive: true });
}
window.inicializarLiveCarouselScrollListener = inicializarLiveCarouselScrollListener;

function dibujarTarjetaSpotifyCompacta(data) {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const item = data.item || {};
  const isPlaying = !!data.is_playing;
  const progressMs = Number(data.progress_ms) || 0;
  const durationMs = Number(item.duration_ms) || 1;
  const progressPct = Math.min(100, Math.max(0, (progressMs / durationMs) * 100));

  const isEpisode = data.currently_playing_type === 'episode' || item.type === 'episode';
  const trackTitle = item.name || (l === 'en' ? 'Unknown track' : 'Canción desconocida');
  const artistNames = isEpisode
    ? (item.show?.name || (item.artists || []).map(a => a.name).join(', ') || 'Podcast')
    : ((item.artists || []).map(a => a.name).join(', ') || (l === 'en' ? 'Unknown artist' : 'Artista desconocido'));
  const epWord = l === 'en' ? 'Episode' : 'Episodio';
  const albumName = isEpisode
    ? (item.show?.publisher || (item.release_date ? `${epWord} · ${item.release_date}` : epWord))
    : (item.album?.name || '');
  const coverUrl = item.album?.images?.[0]?.url || item.album?.images?.[1]?.url || item.images?.[0]?.url || item.show?.images?.[0]?.url || '';

  window.spotifyCurrentTrackState = {
    isPlaying: isPlaying,
    progressMs: progressMs,
    durationMs: durationMs,
    lastUpdatedLocal: Date.now()
  };

  if (window.spotifyTickerInterval) {
    clearInterval(window.spotifyTickerInterval);
    window.spotifyTickerInterval = null;
  }

  if (isPlaying) {
    window.spotifyTickerInterval = setInterval(() => {
      if (document.hidden || !window.spotifyCurrentTrackState || !window.spotifyCurrentTrackState.isPlaying) return;
      const elapsed = Date.now() - window.spotifyCurrentTrackState.lastUpdatedLocal;
      const curMs = Math.min(window.spotifyCurrentTrackState.durationMs, window.spotifyCurrentTrackState.progressMs + elapsed);

      const fillEl = document.getElementById('home-np-prog-fill');
      const timeCurEl = document.getElementById('home-np-time-cur');
      if (fillEl && timeCurEl) {
        const pct = Math.min(100, Math.max(0, (curMs / window.spotifyCurrentTrackState.durationMs) * 100));
        fillEl.style.width = pct + '%';
        timeCurEl.textContent = formatearMinSegSpotify(curMs);
      }
    }, 1000);
  }

  const coverHtml = coverUrl
    ? `<img src="${escHtmlSpotify_(coverUrl)}" alt="Cover" loading="lazy">`
    : `<div style="width:100%;height:100%;display:grid;place-items:center;font-size:1.5rem;">${getHeroIcon('musical-note', '', 24)}</div>`;

  const albumParaRegistrar = albumName || trackTitle;
  const safeAlbumParam = encodeURIComponent(albumParaRegistrar);
  const safeArtistaParam = encodeURIComponent(artistNames);
  const isExp = estaLiveCardExpandida('spotify');

  return `
    <div class="home-spotify-card-compact home-live-expandable-card ${isExp ? 'is-expanded' : 'is-collapsed'}" onclick="toggleLiveCardExpansion('spotify', event)" title="${isExp ? (l === 'en' ? 'Tap to collapse' : 'Toca para reducir') : (l === 'en' ? 'Tap to expand' : 'Toca para expandir')}">
      <!-- i. A la izquierda: Portada de la canción -->
      <div class="home-np-cover-compact">
        ${coverHtml}
      </div>

      <!-- ii. Centro: Textos, barra de progreso y controlador multimedia -->
      <div class="home-np-center-compact">
        <!-- VISTA REDUCIDA (ESTILO NOTIFICACIÓN ANDROID) -->
        <div class="live-card-collapsed-only" style="width:100%; overflow:hidden;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div class="home-np-title-compact home-np-text-wrap" title="${escHtmlSpotify_(trackTitle)}">
              <span class="home-np-scrollable">${escHtmlSpotify_(trackTitle)}</span>
            </div>
            <div style="font-size:0.73rem; color:var(--accent); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:5px; margin-top:1px;">
              <span>${escHtmlSpotify_(artistNames)}</span>
              <span style="opacity:0.5;">·</span>
              <span style="color:${isPlaying ? '#10b981' : '#f59e0b'}; display:inline-flex; align-items:center; gap:3px; font-size:0.68rem; font-weight:700;">
                <span class="home-np-dot" style="${isPlaying ? '' : 'background:#f59e0b; box-shadow:none; animation:none;'}"></span>
                <span>${isPlaying ? (l === 'en' ? 'Live' : 'En vivo') : (l === 'en' ? 'Paused' : 'En pausa')}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- VISTA EXPANDIDA: DETALLES COMPLETOS -->
        <div class="live-card-expanded-only" style="width:100%; display:flex; flex-direction:column; gap:1.5px;">
          <div class="home-np-artist-compact home-np-text-wrap" title="${escHtmlSpotify_(artistNames)}">
            <span class="home-np-scrollable">${escHtmlSpotify_(artistNames)}</span>
          </div>
          <div class="home-np-album-compact home-np-text-wrap" title="${escHtmlSpotify_(albumName || '—')}">
            <span class="home-np-scrollable">${escHtmlSpotify_(albumName || '—')}</span>
          </div>
          <div class="home-np-title-compact home-np-text-wrap" title="${escHtmlSpotify_(trackTitle)}">
            <span class="home-np-scrollable">${escHtmlSpotify_(trackTitle)}</span>
          </div>

          <!-- Barra de progreso hasta poco antes del borde derecho -->
          <div class="home-np-prog-row-compact">
            <div class="home-np-prog-bg-compact">
              <div id="home-np-prog-fill" class="home-np-prog-fill-compact" style="width:${progressPct}%;"></div>
            </div>
            <div class="home-np-times-compact">
              <span id="home-np-time-cur">${formatearMinSegSpotify(progressMs)}</span>
              <span>/</span>
              <span id="home-np-time-tot">${formatearMinSegSpotify(durationMs)}</span>
            </div>
          </div>

          <!-- Debajo de la barra: controlador multimedia << > >> -->
          <div class="home-np-ctrls-compact">
            <button type="button" class="btn-spotify-ctrl" onclick="event.stopPropagation(); controlarSpotifyPlayback('previous')" title="${l === 'en' ? 'Previous' : 'Anterior'}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
            <button type="button" class="btn-spotify-ctrl btn-spotify-ctrl-play" onclick="event.stopPropagation(); controlarSpotifyPlayback('${isPlaying ? 'pause' : 'play'}')" title="${isPlaying ? (l === 'en' ? 'Pause' : 'Pausar') : (l === 'en' ? 'Play' : 'Reanudar')}">
              ${isPlaying
                ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
                : `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`}
            </button>
            <button type="button" class="btn-spotify-ctrl" onclick="event.stopPropagation(); controlarSpotifyPlayback('next')" title="${l === 'en' ? 'Next' : 'Siguiente'}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
            <button type="button" class="home-np-live-status-pill ${isPlaying ? '' : 'paused'}" onclick="event.stopPropagation(); forzarActualizacionSpotifyLive(this)" title="${l === 'en' ? 'Tap to sync now' : 'Toca para sincronizar ahora'}" style="background:none; border:none; cursor:pointer; padding:0; display:inline-flex; align-items:center; gap:5px;">
              <span class="home-np-dot"></span>
              <span>${isPlaying ? (l === 'en' ? 'Live' : 'En vivo') : (l === 'en' ? 'Paused' : 'En pausa')}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- iii. Borde derecho -->
      <div class="home-np-right-col">
        <div class="live-card-collapsed-only" style="margin-right:2px;">
          <button type="button" class="btn-spotify-ctrl btn-spotify-ctrl-play" onclick="event.stopPropagation(); controlarSpotifyPlayback('${isPlaying ? 'pause' : 'play'}')" title="${isPlaying ? (l === 'en' ? 'Pause' : 'Pausar') : (l === 'en' ? 'Play' : 'Reanudar')}">
            ${isPlaying
              ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
              : `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`}
          </button>
        </div>
        <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" class="home-np-sp-logo-link live-card-expanded-only" onclick="event.stopPropagation()" title="${l === 'en' ? 'Open Spotify' : 'Abrir Spotify'}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308c-.218.358-.684.471-1.042.253-2.855-1.745-6.449-2.14-10.682-1.173-.41.094-.817-.162-.911-.572-.094-.41.162-.817.572-.911 4.636-1.059 8.608-.611 11.81 1.361.358.218.471.684.253 1.042zm1.469-3.264c-.275.447-.86.59-1.307.315-3.268-2.008-8.25-2.591-12.115-1.417-.5.152-1.031-.132-1.183-.632-.152-.5.132-1.031.632-1.183 4.414-1.34 9.907-.687 13.658 1.62.447.275.59.86.315 1.307zm.126-3.41c-3.918-2.327-10.377-2.541-14.116-1.405-.6.182-1.238-.16-1.42-.76-.182-.6.16-1.238.76-1.42 4.298-1.305 11.434-1.055 15.932 1.614.54.32.716 1.02.396 1.56-.32.54-1.02.716-1.56.396z"/></svg>
        </a>
        <button type="button" class="btn-np-quick-add live-card-expanded-only" onclick="event.stopPropagation(); registrarDiscoActualEnMediary(decodeURIComponent('${safeAlbumParam}'), decodeURIComponent('${safeArtistaParam}'))" title="${l === 'en' ? 'Log album in Mediary' : 'Registrar disco en Mediary'}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:auto;"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <span class="live-card-expand-indicator" title="${isExp ? (l === 'en' ? 'Collapse' : 'Reducir') : (l === 'en' ? 'Expand' : 'Expandir')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>
    </div>
  `;
}

function dibujarTarjetaSpotifyCompactaIdle(isForbidden = false) {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const artistTxt = l === 'en' ? 'Spotify' : 'Spotify';
  const albumTxt = isForbidden
    ? (l === 'en' ? 'Permissions update needed' : 'Permisos desactualizados')
    : (l === 'en' ? 'Playback Inactive' : 'Sin reproducción activa');
  const titleTxt = isForbidden
    ? (l === 'en' ? 'Tap here to re-authorize account' : 'Toca aquí para re-sincronizar cuenta')
    : (l === 'en' ? 'No music playing right now' : 'Nada sonando en este momento');
  const statusTxt = isForbidden
    ? (l === 'en' ? 'Re-sync' : 'Re-vincular')
    : (l === 'en' ? 'Inactive' : 'Inactivo');
  const openTxt = l === 'en' ? 'Open Spotify' : 'Abrir Spotify';
  const clickAccion = isForbidden ? 'iniciarFlujoSpotifyAuth()' : 'forzarActualizacionSpotifyLive(this)';
  const isExp = estaLiveCardExpandida('spotify');

  return `
    <div class="home-spotify-card-compact home-live-expandable-card ${isExp ? 'is-expanded' : 'is-collapsed'}" onclick="toggleLiveCardExpansion('spotify', event)">
      <!-- i. A la izquierda: Portada placeholder -->
      <div class="home-np-cover-compact" style="display:grid; place-items:center; font-size:1.6rem; opacity:0.85; cursor:pointer;" onclick="event.stopPropagation(); ${clickAccion}">
        <span>${isForbidden ? getHeroIcon('exclamation-triangle', '', 24) : getHeroIcon('musical-note', '', 24)}</span>
      </div>

      <!-- ii. Centro -->
      <div class="home-np-center-compact">
        <div class="live-card-collapsed-only" style="width:100%; overflow:hidden;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div class="home-np-title-compact home-np-text-wrap" title="${artistTxt}">
              <span class="home-np-scrollable">${artistTxt}</span>
            </div>
            <div style="font-size:0.72rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              <span>${albumTxt}</span>
            </div>
          </div>
        </div>

        <div class="live-card-expanded-only" style="width:100%; display:flex; flex-direction:column; gap:1.5px;">
          <div class="home-np-artist-compact home-np-text-wrap">
            <span class="home-np-scrollable">${artistTxt}</span>
          </div>
          <div class="home-np-album-compact home-np-text-wrap" style="${isForbidden ? 'color:#f59e0b;' : ''}">
            <span class="home-np-scrollable">${albumTxt}</span>
          </div>
          <div class="home-np-title-compact home-np-text-wrap" style="cursor:pointer;" onclick="event.stopPropagation(); ${clickAccion}">
            <span class="home-np-scrollable">${titleTxt}</span>
          </div>
          <div class="home-np-ctrls-compact" style="margin-top:4px;">
            <button type="button" class="home-np-live-status-pill paused" onclick="event.stopPropagation(); ${clickAccion}" title="${isForbidden ? (l === 'en' ? 'Click to re-authorize' : 'Clic para re-vincular cuenta') : (l === 'en' ? 'Tap to sync now' : 'Toca para sincronizar ahora')}" style="background:none; border:none; cursor:pointer; padding:0; display:inline-flex; align-items:center; gap:5px;">
              <span class="home-np-dot" style="${isForbidden ? 'background:#f59e0b;' : ''}"></span>
              <span style="${isForbidden ? 'color:#f59e0b; font-weight:700;' : ''}">${statusTxt}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- iii. Borde derecho -->
      <div class="home-np-right-col">
        <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" class="home-np-sp-logo-link live-card-expanded-only" onclick="event.stopPropagation()" title="${openTxt}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308c-.218.358-.684.471-1.042.253-2.855-1.745-6.449-2.14-10.682-1.173-.41.094-.817-.162-.911-.572-.094-.41.162-.817.572-.911 4.636-1.059 8.608-.611 11.81 1.361.358.218.471.684.253 1.042zm1.469-3.264c-.275.447-.86.59-1.307.315-3.268-2.008-8.25-2.591-12.115-1.417-.5.152-1.031-.132-1.183-.632-.152-.5.132-1.031.632-1.183 4.414-1.34 9.907-.687 13.658 1.62.447.275.59.86.315 1.307zm.126-3.41c-3.918-2.327-10.377-2.541-14.116-1.405-.6.182-1.238-.16-1.42-.76-.182-.6.16-1.238.76-1.42 4.298-1.305 11.434-1.055 15.932 1.614.54.32.716 1.02.396 1.56-.32.54-1.02.716-1.56.396z"/></svg>
        </a>
        <span class="live-card-expand-indicator" title="${isExp ? (l === 'en' ? 'Collapse' : 'Reducir') : (l === 'en' ? 'Expand' : 'Expandir')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>
    </div>
  `;
}

function dibujarTarjetaSpotifyCompactaDesconectado() {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const artistTxt = l === 'en' ? 'Spotify' : 'Spotify';
  const albumTxt = l === 'en' ? 'Account disconnected' : 'Cuenta no conectada';
  const titleTxt = l === 'en' ? 'Connect Spotify to sync music' : 'Conectar Spotify para ver tu música';
  const connectBtnTxt = l === 'en' ? 'Connect' : 'Conectar';
  const isExp = estaLiveCardExpandida('spotify');

  return `
    <div class="home-spotify-card-compact home-live-expandable-card ${isExp ? 'is-expanded' : 'is-collapsed'}" onclick="toggleLiveCardExpansion('spotify', event)">
      <div class="home-np-cover-compact" style="display:grid; place-items:center; font-size:1.6rem; opacity:0.85; cursor:pointer;" onclick="event.stopPropagation(); abrirModalConectarSpotify()">
        <span>${getHeroIcon('musical-note', '', 14)}</span>
      </div>
      <div class="home-np-center-compact">
        <div class="live-card-collapsed-only" style="width:100%; overflow:hidden;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div class="home-np-title-compact home-np-text-wrap" title="${artistTxt}">
              <span class="home-np-scrollable">${artistTxt}</span>
            </div>
            <div style="font-size:0.72rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              <span>${albumTxt}</span>
            </div>
          </div>
        </div>
        <div class="live-card-expanded-only" style="width:100%; display:flex; flex-direction:column; gap:1.5px;">
          <div class="home-np-artist-compact home-np-text-wrap">
            <span class="home-np-scrollable">${artistTxt}</span>
          </div>
          <div class="home-np-album-compact home-np-text-wrap">
            <span class="home-np-scrollable">${albumTxt}</span>
          </div>
          <div class="home-np-title-compact home-np-text-wrap" style="cursor:pointer;" onclick="event.stopPropagation(); abrirModalConectarSpotify()">
            <span class="home-np-scrollable">${titleTxt}</span>
          </div>
          <div style="margin-top:4px;">
            <button type="button" class="btn-spotify-sub-action" onclick="event.stopPropagation(); abrirModalConectarSpotify()" style="height:24px; padding:0 10px; font-size:0.72rem; border-radius:3px; background:rgba(29,185,84,0.15); border:1px solid rgba(29,185,84,0.4); color:#10b981;">
              <span style="display:inline-flex; align-items:center; gap:4px;">${getHeroIcon('bolt', '', 12)} <span>${connectBtnTxt}</span></span>
            </button>
          </div>
        </div>
      </div>
      <div class="home-np-right-col">
        <span class="home-np-sp-logo-link live-card-expanded-only" style="cursor:pointer;" onclick="event.stopPropagation(); abrirModalConectarSpotify()" title="Spotify">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308c-.218.358-.684.471-1.042.253-2.855-1.745-6.449-2.14-10.682-1.173-.41.094-.817-.162-.911-.572-.094-.41.162-.817.572-.911 4.636-1.059 8.608-.611 11.81 1.361.358.218.471.684.253 1.042zm1.469-3.264c-.275.447-.86.59-1.307.315-3.268-2.008-8.25-2.591-12.115-1.417-.5.152-1.031-.132-1.183-.632-.152-.5.132-1.031.632-1.183 4.414-1.34 9.907-.687 13.658 1.62.447.275.59.86.315 1.307zm.126-3.41c-3.918-2.327-10.377-2.541-14.116-1.405-.6.182-1.238-.16-1.42-.76-.182-.6.16-1.238.76-1.42 4.298-1.305 11.434-1.055 15.932 1.614.54.32.716 1.02.396 1.56-.32.54-1.02.716-1.56.396z"/></svg>
        </span>
        <span class="live-card-expand-indicator" title="${isExp ? (l === 'en' ? 'Collapse' : 'Reducir') : (l === 'en' ? 'Expand' : 'Expandir')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>
    </div>
  `;
}

async function renderizarEscuchandoAhoraInicio(forzar = false) {
  const container = document.getElementById('home-now-playing-container');
  if (!container) return;

  const wrapper = document.getElementById('home-live-carousel-wrapper');
  if (wrapper) wrapper.style.display = 'flex';
  if (typeof inicializarLiveCarouselScrollListener === 'function') inicializarLiveCarouselScrollListener();

  const token = await obtenerTokenSpotifyValido();
  if (!token) {
    detenerPollingSpotifyLive();
    container.style.display = 'flex';
    container.innerHTML = dibujarTarjetaSpotifyCompactaDesconectado();
    return;
  }

  const ahora = Date.now();
  if (!forzar && _spotifyNowPlayingCache && (ahora - _spotifyUltimaConsultaLive < 5000)) {
    actualizarVistaSegunResultadoAct(_spotifyNowPlayingCache);
    return;
  }

  const resultado = await consultarSpotifyCurrentlyPlaying();
  _spotifyUltimaConsultaLive = Date.now();
  _spotifyNowPlayingCache = resultado;

  actualizarVistaSegunResultadoAct(resultado);
  iniciarPollingSpotifyLive();
}

function actualizarVistaSegunResultadoAct(resultado) {
  const container = document.getElementById('home-now-playing-container');
  if (!container) return;

  const wrapper = document.getElementById('home-live-carousel-wrapper');
  if (wrapper) wrapper.style.display = 'flex';
  if (typeof inicializarLiveCarouselScrollListener === 'function') inicializarLiveCarouselScrollListener();

  const isPlaying = !!(resultado && resultado.conectado && resultado.reproduciendo);
  const badgeSp = document.getElementById('badge-sp-live-pill');
  if (badgeSp) badgeSp.style.display = isPlaying ? 'inline-block' : 'none';

  container.style.display = 'flex';

  if (resultado && resultado.conectado && resultado.reproduciendo && resultado.data) {
    container.innerHTML = dibujarTarjetaSpotifyCompacta(resultado.data);
    try {
      const snap = {
        isPlaying: true,
        trackId: resultado.data.id || resultado.data.uri || '',
        name: resultado.data.name || '',
        artist: resultado.data.artist || '',
        album: resultado.data.album || '',
        image: resultado.data.image || '',
        url: resultado.data.url || '',
        updatedAt: Date.now()
      };
      const prevRaw = localStorage.getItem('mediary_spotify_now_playing');
      let prev = null;
      if (prevRaw) prev = JSON.parse(prevRaw);
      const cambioTrack = !prev || !prev.isPlaying || prev.name !== snap.name || prev.artist !== snap.artist;
      if (cambioTrack && snap.name) {
        localStorage.setItem('mediary_spotify_now_playing', JSON.stringify(snap));
        if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
          sincronizarPreferenciasYAppsHaciaNube(false);
        }
      }
    } catch (e) {}
  } else if (resultado && resultado.conectado) {
    const isForbidden = resultado.error === 'forbidden_scopes';
    container.innerHTML = dibujarTarjetaSpotifyCompactaIdle(isForbidden);
    try {
      const prevRaw = localStorage.getItem('mediary_spotify_now_playing');
      if (prevRaw) {
        const prev = JSON.parse(prevRaw);
        if (prev && prev.isPlaying) {
          localStorage.setItem('mediary_spotify_now_playing', JSON.stringify({
            ...prev,
            isPlaying: false,
            updatedAt: Date.now()
          }));
          if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
            sincronizarPreferenciasYAppsHaciaNube(false);
          }
        }
      }
    } catch (e) {}
    if (window.spotifyTickerInterval) {
      clearInterval(window.spotifyTickerInterval);
      window.spotifyTickerInterval = null;
    }
  } else {
    container.innerHTML = dibujarTarjetaSpotifyCompactaDesconectado();
    if (window.spotifyTickerInterval) {
      clearInterval(window.spotifyTickerInterval);
      window.spotifyTickerInterval = null;
    }
  }

  requestAnimationFrame(() => {
    setTimeout(ajustarMarqueeSpotify, 50);
  });
}

async function forzarActualizacionSpotifyLive(btnEl) {
  if (btnEl) {
    btnEl.style.opacity = '0.5';
    btnEl.style.pointerEvents = 'none';
  }
  _spotifyUltimaConsultaLive = 0;
  _spotifyNowPlayingCache = null;
  await renderizarEscuchandoAhoraInicio(true);
  if (btnEl) {
    btnEl.style.opacity = '1';
    btnEl.style.pointerEvents = 'auto';
  }
}
window.forzarActualizacionSpotifyLive = forzarActualizacionSpotifyLive;

function ajustarMarqueeSpotify() {
  const containers = [
    document.getElementById('home-now-playing-container'),
    document.getElementById('home-psn-now-playing-container'),
    document.getElementById('home-friends-last-track-container'),
    document.getElementById('home-friends-psn-container'),
    document.getElementById('lista-amigos-ultimas-canciones')
  ].filter(Boolean);
  containers.forEach(container => {
    const elements = container.querySelectorAll('.home-np-scrollable');
    elements.forEach(el => {
      const parent = el.parentElement;
      if (!parent) return;
      el.classList.remove('is-overflowing');
      parent.classList.remove('has-overflow');
      el.style.transform = '';
      const overflow = el.scrollWidth - parent.clientWidth;
      if (overflow > 6) {
        el.style.setProperty('--overflow-dist', `${overflow + 10}px`);
        const dur = Math.max(7, Math.min(16, 5 + overflow / 20));
        el.style.animationDuration = `${dur}s`;
        el.classList.add('is-overflowing');
        parent.classList.add('has-overflow');
      }
    });
  });
}
window.ajustarMarqueeSpotify = ajustarMarqueeSpotify;
let _spotifyResizeRaf = 0;
window.addEventListener('resize', () => {
  if (_spotifyResizeRaf) return;
  _spotifyResizeRaf = requestAnimationFrame(() => {
    _spotifyResizeRaf = 0;
    if (typeof estado !== 'undefined' && estado.categoria === 'inicio') {
      ajustarMarqueeSpotify();
    }
  });
}, { passive: true });
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    if (typeof estado !== 'undefined' && estado.categoria === 'inicio' && typeof ajustarMarqueeSpotify === 'function') {
      ajustarMarqueeSpotify();
    }
    if (typeof reposicionarIndicadorNavMovil === 'function') {
      reposicionarIndicadorNavMovil();
    }
  }, 180);
});

function iniciarPollingSpotifyLive() {
  if (window.spotifyNowPlayingInterval) return;
  window.spotifyNowPlayingInterval = setInterval(() => {
    if (typeof estado !== 'undefined' && estado.categoria === 'inicio' && !document.hidden) {
      renderizarEscuchandoAhoraInicio(false);
    }
  }, 10000);
}

function detenerPollingSpotifyLive() {
  if (window.spotifyNowPlayingInterval) {
    clearInterval(window.spotifyNowPlayingInterval);
    window.spotifyNowPlayingInterval = null;
  }
  if (window.spotifyTickerInterval) {
    clearInterval(window.spotifyTickerInterval);
    window.spotifyTickerInterval = null;
  }
}

function registrarMusicaActualEnMediary(titulo, artista) {
  if (!titulo) return;
  const busqueda = artista ? `${titulo} ${artista}` : titulo;
  cambiarCat('Musica', 'Discos');
  setTimeout(() => {
    const inSearch = document.getElementById('input-search');
    if (inSearch) {
      inSearch.value = busqueda;
      inSearch.focus();
      if (typeof buscarEnVivo === 'function') {
        buscarEnVivo(busqueda);
      }
    }
  }, 120);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    if (typeof intentarDesbloquearOrientacion === 'function') {
      intentarDesbloquearOrientacion();
    }
  }
});

