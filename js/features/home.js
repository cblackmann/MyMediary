/* Mediary — js/features/home.js */
const cerrarModalPerfil = () => {}; function parsearFechaAObjeto(str) { if (!str || str === 'Sin fecha') return null; const s = String(str).trim(); const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])); const ts = timestampDeFecha(s); return ts > 0 ? new Date(ts) : null; }
function normalizarNombreParaDesglose(cat, sub) {
  const c = cat || '', s = sub || '';
  if (c === 'Peliculas') { if (s.toLowerCase().includes('docu')) return tLang('documental', 'documentary'); return tLang('película', 'movie'); }
  if (c === 'Series') { if (s.toLowerCase().includes('docu')) return tLang('serie documental', 'docuseries'); if (s.toLowerCase().includes('completa')) return tLang('serie completa', 'full series'); return tLang('temporada', 'season'); }
  if (c === 'Musica') { if (s.toLowerCase().includes('disco')) return tLang('disco', 'album'); if (s.toLowerCase().includes('concierto')) return tLang('concierto', 'concert'); return tLang('artista', 'artist'); }
  if (c === 'Juegos') return tLang('videojuego', 'game');
  if (c === 'Lecturas') { if (s.toLowerCase().includes('cómic') || s.toLowerCase().includes('comic')) return tLang('cómic', 'comic'); if (s.toLowerCase().includes('manga')) return 'manga'; return tLang('libro', 'book'); }
  return tLang('registro', 'entry');
}
function formatearDesgloseItems(items) {
  if (!items || !items.length) return tLang('0 registros', '0 entries');
  const conteo = {};
  items.forEach(it => { const nom = normalizarNombreParaDesglose(it.categoria, it.subcategoria); conteo[nom] = (conteo[nom] || 0) + 1; });
  const partes = Object.entries(conteo).map(([nom, cant]) => `${cant} ${nom}`);
  return `${items.length} ${tLang('registros', 'entries')} (${partes.join(', ')})`;
}
function extraerHorasRegistro(r) {
  if (!r) return 0;
  if (r.horas) {
    const h = parseFloat(String(r.horas).replace('hrs', '').replace(',', '.').trim());
    if (!isNaN(h) && h > 0) return h;
  }
  try {
    const key = `mediary_dur_${r.id || (r.categoria + '_' + r.titulo)}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      const h = parseFloat(cached);
      if (!isNaN(h) && h > 0) return h;
    }
  } catch (e) {}
  return 0;
}
let _resolviendoHorasVistas = false;
async function resolverHorasVistasFaltantes(regs) {
  if (_resolviendoHorasVistas || !regs || !regs.length) return;
  const faltantes = regs.filter(r => (r.categoria === 'Peliculas' || r.categoria === 'Series') && extraerHorasRegistro(r) === 0);
  if (!faltantes.length) return;
  _resolviendoHorasVistas = true;
  let cambio = false;
  for (const r of faltantes.slice(0, 5)) {
    try {
      const dur = await resolverDuracionObraApi_(r.categoria, r.subcategoria, r.titulo, r.creador, r.anio);
      if (dur && dur > 0) {
        r.horas = `${dur} hrs`;
        cambio = true;
        try {
          localStorage.setItem(`mediary_dur_${r.id || (r.categoria + '_' + r.titulo)}`, String(dur));
        } catch(e) {}
        if (r.id && estado.userEmail) {
          google.script.run.actualizarRegistro(r.id, { horas: `${dur} hrs` }, estado.userEmail);
        }
      }
    } catch(err) {
      console.warn('Error resolviendo duracion para:', r.titulo, err);
    }
  }
  _resolviendoHorasVistas = false;
  if (cambio) {
    calcularYMostrarEstadisticasPerfil();
  }
}
async function resolverDuracionObraApi_(cat, sub, titulo, creador, anio) {
  try {
    const titLimpio = (titulo || '').replace(/\s*\[S\d+\].*$/, '').trim();
    if (cat === 'Peliculas') {
      const q = encodeURIComponent(titLimpio);
      const m = (await getJson_(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_K}&query=${q}&language=es-ES`))?.results?.[0];
      if (m?.id) {
        const det = await getJson_(`https://api.themoviedb.org/3/movie/${m.id}?api_key=${TMDB_K}&language=es-ES`);
        if (det?.runtime) return parseFloat((det.runtime / 60).toFixed(1));
      }
    } else if (cat === 'Series') {
      const q = encodeURIComponent(titLimpio);
      const matchS = (titulo || '').match(/\[S(\d+)\]/i);
      const seasonNum = matchS ? parseInt(matchS[1], 10) : 1;
      const sh = (await getJson_(`https://api.tvmaze.com/singlesearch/shows?q=${q}&embed=episodes`));
      if (sh?._embedded?.episodes?.length) {
        const eps = sh._embedded.episodes.filter(e => e.season === seasonNum);
        if (eps.length) {
          const totMin = eps.reduce((acc, e) => acc + (e.runtime || sh.averageRuntime || sh.runtime || 45), 0);
          return parseFloat((totMin / 60).toFixed(1));
        }
      }
      const tmdbTv = (await getJson_(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_K}&query=${q}&language=es-ES`))?.results?.[0];
      if (tmdbTv?.id) {
        const sDet = await getJson_(`https://api.themoviedb.org/3/tv/${tmdbTv.id}/season/${seasonNum}?api_key=${TMDB_K}&language=es-ES`).catch(() => null);
        if (sDet?.episodes?.length) {
          const avg = tmdbTv.episode_run_time?.[0] || 45;
          const totMin = sDet.episodes.reduce((acc, ep) => acc + (ep.runtime || avg), 0);
          return parseFloat((totMin / 60).toFixed(1));
        }
      }
    }
  } catch(e) {}
  return 0;
}

// --- SISTEMA DE RACHAS (STREAKS) MULTI-CATEGORÍA Y PERFIL ---
function extraerDayIndicesDeRegistro(r) {
  const indices = new Set();
  if (!r) return indices;
  const fI = sanitizarFechaFrontend(r.fechaInicio);
  const fF = sanitizarFechaFrontend(r.fechaFin);
  const enProg = esEnProgresoTexto(fF);
  if (enProg && (!fI || fI === 'Sin fecha')) return indices;

  const dI = parsearFechaAObjeto(fI);
  const dF = (!enProg && fF && fF !== 'Sin fecha') ? parsearFechaAObjeto(fF) : null;

  if (dI && dF && dF >= dI) {
    const dMidI = new Date(dI.getFullYear(), dI.getMonth(), dI.getDate());
    const dMidF = new Date(dF.getFullYear(), dF.getMonth(), dF.getDate());
    const diffDays = Math.round((dMidF.getTime() - dMidI.getTime()) / 86400000);
    if (diffDays <= 31) {
      const cur = new Date(dMidI);
      while (cur <= dMidF) {
        indices.add(Math.round(cur.getTime() / 86400000));
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      indices.add(Math.round(dMidF.getTime() / 86400000));
    }
  } else if (dF) {
    const dMidF = new Date(dF.getFullYear(), dF.getMonth(), dF.getDate());
    indices.add(Math.round(dMidF.getTime() / 86400000));
  } else if (dI) {
    const dMidI = new Date(dI.getFullYear(), dI.getMonth(), dI.getDate());
    indices.add(Math.round(dMidI.getTime() / 86400000));
  }
  return indices;
}

function obtenerTextoAccionSubcategoria(cat, sub) {
  const l = userPrefs.lang || 'es';
  const subNorm = (sub || '').toLowerCase().trim();

  if (l === 'en') {
    if (subNorm.includes('disco')) return 'listening to albums';
    if (subNorm.includes('concierto')) return 'watching concerts';
    if (subNorm.includes('película') || subNorm.includes('pelicula')) return 'watching movies';
    if (subNorm.includes('documental')) return 'watching documentaries';
    if (subNorm.includes('temporada')) return 'watching series seasons';
    if (subNorm.includes('serie') && subNorm.includes('complet')) return 'completing series';
    if (subNorm.includes('docuserie') || (subNorm.includes('serie') && subNorm.includes('doc'))) return 'watching docuseries';
    if (subNorm.includes('videojuego') || cat === 'Juegos') return 'playing video games';
    if (subNorm.includes('libro')) return 'reading books';
    if (subNorm.includes('cómic') || subNorm.includes('comic')) return 'reading comics';
    if (subNorm.includes('manga')) return 'reading manga';
    return `logging ${sub.toLowerCase()}`;
  }

  // Español
  if (subNorm.includes('disco')) return 'escuchando discos';
  if (subNorm.includes('concierto')) return 'viendo conciertos';
  if (subNorm.includes('película') || subNorm.includes('pelicula')) return 'viendo películas';
  if (subNorm.includes('documental')) return 'viendo documentales';
  if (subNorm.includes('temporada')) return 'viendo temporadas de series';
  if (subNorm.includes('serie') && subNorm.includes('complet')) return 'completando series';
  if (subNorm.includes('docuserie') || (subNorm.includes('serie') && subNorm.includes('doc'))) return 'viendo docuseries';
  if (subNorm.includes('videojuego') || cat === 'Juegos') return 'jugando videojuegos';
  if (subNorm.includes('libro')) return 'leyendo libros';
  if (subNorm.includes('cómic') || subNorm.includes('comic')) return 'leyendo cómics';
  if (subNorm.includes('manga')) return 'leyendo mangas';
  return `registrando ${sub.toLowerCase()}`;
}

// ==========================================
// SISTEMA DE RACHAS: Películas, Discos y Lecturas
// (Series y Juegos NO se cuentan para rachas)
// ==========================================
function esCategoriaValidaParaRachas(cat) {
  if (!cat) return false;
  const c = String(cat).toLowerCase().trim();
  return c === 'peliculas' || c === 'musica' || c === 'lecturas';
}

function fechaStrToDayIndex(str) {
  if (!str || typeof str !== 'string') return null;
  if (str.includes('/')) {
    const parts = str.split('/').map(Number);
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const dt = new Date(parts[2], parts[1] - 1, parts[0]);
      return Math.round(dt.getTime() / 86400000);
    }
  }
  const parts = str.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null;
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  return Math.round(dt.getTime() / 86400000);
}

function obtenerListaDiasLectura() {
  const setDias = new Set();
  const claveActual = 'mediary_dias_lectura_' + (estado.userEmail || 'default');

  // 1. Clave actual de usuario
  try {
    const raw = localStorage.getItem(claveActual);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) arr.forEach(d => { if (d) setDias.add(d); });
    }
  } catch (e) {}

  // 2. Clave default siempre (por si se marcaron días offline o antes de iniciar sesión)
  try {
    const raw = localStorage.getItem('mediary_dias_lectura_default');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) arr.forEach(d => { if (d) setDias.add(d); });
    }
  } catch (e) {}

  // 3. Clave base sin sufijo
  try {
    const raw = localStorage.getItem('mediary_dias_lectura');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) arr.forEach(d => { if (d) setDias.add(d); });
    }
  } catch (e) {}

  // 4. Escaneo exhaustivo de todas las claves en localStorage que comiencen con mediary_dias_lectura
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('mediary_dias_lectura')) {
        try {
          const arr = JSON.parse(localStorage.getItem(k));
          if (Array.isArray(arr)) arr.forEach(d => { if (d) setDias.add(d); });
        } catch(e) {}
      }
    }
  } catch (e) {}

  // 5. Perfil de usuario en memoria
  if (Array.isArray(perfilUsuario?.diasLectura)) {
    perfilUsuario.diasLectura.forEach(d => { if (d) setDias.add(d); });
  }
  if (Array.isArray(perfilUsuario?.preferencias?.rachas?.diasLectura)) {
    perfilUsuario.preferencias.rachas.diasLectura.forEach(d => { if (d) setDias.add(d); });
  }

  // 6. Perfiles guardados en localStorage
  ['Mediary_perfil_v1', 'MyMediary_perfil_v1'].forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const obj = JSON.parse(raw);
        if (Array.isArray(obj?.diasLectura)) obj.diasLectura.forEach(d => { if (d) setDias.add(d); });
        if (Array.isArray(obj?.preferencias?.rachas?.diasLectura)) obj.preferencias.rachas.diasLectura.forEach(d => { if (d) setDias.add(d); });
      }
    } catch(e) {}
  });

  const combinado = Array.from(setDias).filter(Boolean).sort();
  if (perfilUsuario) perfilUsuario.diasLectura = combinado;

  // Persistir en ambas claves para que nunca se desvinculen
  try {
    localStorage.setItem(claveActual, JSON.stringify(combinado));
    if (claveActual !== 'mediary_dias_lectura_default') {
      localStorage.setItem('mediary_dias_lectura_default', JSON.stringify(combinado));
    }
  } catch (e) {}

  return combinado;
}

function haLeidoHoy() {
  const hoyStr = (typeof obtenerFechaHoyStr === 'function') ? obtenerFechaHoyStr() : '';
  const lista = (typeof obtenerListaDiasLectura === 'function') ? obtenerListaDiasLectura() : [];
  if (lista.includes(hoyStr)) return true;
  if (!hoyStr) return false;
  const hoyIdx = fechaStrToDayIndex(hoyStr);
  if (hoyIdx === null) return false;
  return lista.some(f => fechaStrToDayIndex(f) === hoyIdx);
}

function obtenerDayIndicesDeLecturaDiaria() {
  const set = new Set();
  const lista = (typeof obtenerListaDiasLectura === 'function') ? obtenerListaDiasLectura() : [];
  lista.forEach(fStr => {
    const idx = fechaStrToDayIndex(fStr);
    if (idx !== null) set.add(idx);
  });
  return set;
}

const LISTA_TIEMPOS_LECTURA = [
  '10 minutos',
  '15 minutos',
  '20 minutos',
  '30 minutos',
  '45 minutos',
  '1 hora',
  '1 hora y 30 minutos',
  '2 horas',
  '3 horas',
  '4 horas'
];

let tiempoLecturaSeleccionadoActual = '30 minutos';

function normalizarTiempoLectura(t) {
  if (!t) return '30 minutos';
  const str = String(t).trim();
  if (str === '10m' || str === '10 min' || str.startsWith('10 min')) return '10 minutos';
  if (str === '15m' || str === '15 min' || str.startsWith('15 min')) return '15 minutos';
  if (str === '20m' || str === '20 min' || str.startsWith('20 min')) return '20 minutos';
  if (str === '30m' || str === '30 min' || str.startsWith('30 min')) return '30 minutos';
  if (str === '45m' || str === '45 min' || str.startsWith('45 min')) return '45 minutos';
  if (str === '1h' || str === '1 hora' || str === '1 hour' || (str.startsWith('1 h') && !str.includes('30'))) return '1 hora';
  if (str === '1h 30m' || str === '1 hora 30 minutos' || (str.includes('1') && str.includes('30'))) return '1 hora y 30 minutos';
  if (str === '2h' || str === '2 horas' || str === '2 hours' || (str.startsWith('2') && (str.includes('h') || str.includes('hora')))) return '2 horas';
  if (str === '3h' || str === '3 horas' || str === '3 hours' || str.startsWith('3')) return '3 horas';
  if (str === '4h' || str === '4 horas' || str === '4 hours' || str.startsWith('4')) return '4 horas';
  return str;
}

function formatTiempoPill(txt) {
  if (!txt) return '';
  return String(txt)
    .replace(' minutos', 'm')
    .replace(' minuto', 'm')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' y ', ' ')
    .replace(' and ', ' ')
    .replace(' horas', 'h')
    .replace(' hora', 'h')
    .replace(' hours', 'h')
    .replace(' hour', 'h');
}

function obtenerMapaTiemposLectura() {
  const mapa = {};
  const incorporar = obj => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(f => {
        const val = obj[f];
        if (typeof val === 'string') {
          if (!mapa[f]) {
            mapa[f] = { texto: val, ts: Date.now() };
          }
        } else if (val && typeof val === 'object' && val.texto) {
          if (!mapa[f] || (val.ts && (!mapa[f].ts || val.ts > mapa[f].ts))) {
            mapa[f] = val;
          }
        }
      });
    }
  };

  const claveActual = 'mediary_tiempos_lectura_' + (estado.userEmail || 'default');
  try {
    const raw = localStorage.getItem(claveActual);
    if (raw) incorporar(JSON.parse(raw));
  } catch (e) {}

  try {
    const raw = localStorage.getItem('mediary_tiempos_lectura_default');
    if (raw) incorporar(JSON.parse(raw));
  } catch (e) {}

  try {
    const raw = localStorage.getItem('mediary_tiempos_lectura');
    if (raw) incorporar(JSON.parse(raw));
  } catch (e) {}

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('mediary_tiempos_lectura')) {
        try { incorporar(JSON.parse(localStorage.getItem(k))); } catch(e) {}
      }
    }
  } catch (e) {}

  if (perfilUsuario?.tiemposLectura) incorporar(perfilUsuario.tiemposLectura);
  if (perfilUsuario?.preferencias?.rachas?.tiemposLectura) incorporar(perfilUsuario.preferencias.rachas.tiemposLectura);

  ['Mediary_perfil_v1', 'MyMediary_perfil_v1'].forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj?.tiemposLectura) incorporar(obj.tiemposLectura);
        if (obj?.preferencias?.rachas?.tiemposLectura) incorporar(obj.preferencias.rachas.tiemposLectura);
      }
    } catch(e) {}
  });

  if (perfilUsuario) perfilUsuario.tiemposLectura = mapa;

  try {
    localStorage.setItem(claveActual, JSON.stringify(mapa));
    if (claveActual !== 'mediary_tiempos_lectura_default') {
      localStorage.setItem('mediary_tiempos_lectura_default', JSON.stringify(mapa));
    }
  } catch(e) {}

  return mapa;
}

function guardarTiempoLecturaFecha(fechaStr, tiempoTexto) {
  const mapa = obtenerMapaTiemposLectura();
  if (tiempoTexto) {
    mapa[fechaStr] = { texto: tiempoTexto, ts: Date.now() };
  } else {
    delete mapa[fechaStr];
  }

  const uEmail = (typeof estado !== 'undefined' && estado?.userEmail) ? estado.userEmail : 'default';
  const clave = 'mediary_tiempos_lectura_' + uEmail;
  try {
    localStorage.setItem(clave, JSON.stringify(mapa));
    localStorage.setItem('mediary_tiempos_lectura_default', JSON.stringify(mapa));
    localStorage.setItem('mediary_tiempos_lectura', JSON.stringify(mapa));
    if (!tiempoTexto) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('mediary_tiempos_lectura')) {
          try {
            const m = JSON.parse(localStorage.getItem(k));
            if (m && typeof m === 'object' && m[fechaStr]) {
              delete m[fechaStr];
              localStorage.setItem(k, JSON.stringify(m));
            }
          } catch(e) {}
        }
      }
    }
  } catch (e) {}

  if (perfilUsuario) {
    perfilUsuario.tiemposLectura = mapa;
    if (!perfilUsuario.preferencias) perfilUsuario.preferencias = {};
    if (!perfilUsuario.preferencias.rachas) perfilUsuario.preferencias.rachas = {};
    perfilUsuario.preferencias.rachas.tiemposLectura = mapa;
    guardarPerfilLocal();
    if (typeof SERVER_API !== 'undefined' && SERVER_API?.guardarPerfilUsuario && estado?.userEmail) {
      SERVER_API.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
    }
    if (typeof google !== 'undefined' && google.script?.run?.guardarPerfilUsuario && estado?.userEmail) {
      google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
    }
  }

  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
}

function abrirModalTiempoLectura() {
  try {
    const hoyStr = (typeof obtenerFechaHoyStr === 'function') ? obtenerFechaHoyStr() : `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
    const mapa = (typeof obtenerMapaTiemposLectura === 'function') ? obtenerMapaTiemposLectura() : {};
    let infoHoy = mapa[hoyStr];
    if (!infoHoy && hoyStr) {
      const hoyIdx = (typeof fechaStrToDayIndex === 'function') ? fechaStrToDayIndex(hoyStr) : null;
      if (hoyIdx !== null) {
        for (const k of Object.keys(mapa)) {
          if (fechaStrToDayIndex(k) === hoyIdx) {
            infoHoy = mapa[k];
            break;
          }
        }
      }
    }
    const yaLeyo = (typeof haLeidoHoy === 'function') ? haLeidoHoy() : false;

    if (infoHoy) {
      const val = (typeof infoHoy === 'string') ? infoHoy : (infoHoy.texto || '');
      tiempoLecturaSeleccionadoActual = normalizarTiempoLectura(val);
    } else {
      tiempoLecturaSeleccionadoActual = '30 minutos';
    }

    const strip = document.getElementById('reading-time-chip-strip');
    if (strip) {
      strip.innerHTML = LISTA_TIEMPOS_LECTURA.map(t => {
        const isSel = (t === tiempoLecturaSeleccionadoActual);
        return `<button type="button" class="reading-time-chip ${isSel ? 'selected' : ''}" data-tiempo="${t}" onclick="seleccionarTiempoLectura('${t}')">${formatearTiempoLecturaIdioma_(t)}</button>`;
      }).join('');

      if (!strip._hasWheelListener) {
        strip.addEventListener('wheel', (e) => {
          if (e.deltaY !== 0) {
            e.preventDefault();
            strip.scrollLeft += e.deltaY;
          }
        }, { passive: false });
        strip._hasWheelListener = true;
      }
    }

    actualizarDisplayTiempoLectura(tiempoLecturaSeleccionadoActual);

    const btnUnmark = document.getElementById('btn-desmarcar-lectura');
    if (btnUnmark) {
      btnUnmark.style.display = yaLeyo ? 'block' : 'none';
    }

    const modal = document.getElementById('modal-tiempo-lectura');
    if (modal) {
      modal.style.display = 'flex';
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
      modal.style.pointerEvents = 'auto';
      const box = modal.querySelector('.modal-box');
      if (box) {
        box.style.transform = '';
        box.style.transition = '';
        box.style.opacity = '1';
        box.classList.remove('swiping-down');
      }
      setTimeout(() => {
        const activeChip = strip?.querySelector('.reading-time-chip.selected');
        if (activeChip) {
          activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 60);
    }
  } catch (err) {
    console.error('Error al abrir modal de tiempo de lectura:', err);
  }
}
window.abrirModalTiempoLectura = abrirModalTiempoLectura;

function seleccionarTiempoLectura(tiempo) {
  tiempoLecturaSeleccionadoActual = tiempo;
  const strip = document.getElementById('reading-time-chip-strip');
  if (strip) {
    strip.querySelectorAll('.reading-time-chip').forEach(btn => {
      if (btn.getAttribute('data-tiempo') === tiempo) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }
  actualizarDisplayTiempoLectura(tiempo);

  const hoyStr = (typeof obtenerFechaHoyStr === 'function') ? obtenerFechaHoyStr() : `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
  guardarTiempoLecturaFecha(hoyStr, tiempo);

  if (typeof actualizarBotonLecturaHoyInicio === 'function') actualizarBotonLecturaHoyInicio();
  if (typeof actualizarBotonLecturaHoyLibros === 'function') actualizarBotonLecturaHoyLibros();
  if (typeof renderizarRachasActualesInicio === 'function') renderizarRachasActualesInicio();
  if (typeof estado !== 'undefined' && estado.categoria === 'Lecturas' && typeof renderizarBannerRachaSubcategoria === 'function') {
    renderizarBannerRachaSubcategoria(estado.categoria, estado.subcategoria || 'Libros');
  }
}
window.seleccionarTiempoLectura = seleccionarTiempoLectura;

function formatearTiempoLecturaIdioma_(tiempo) {
  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');
  if (!isEn || !tiempo) return tiempo;
  return String(tiempo)
    .replace(/minutos/g, 'minutes')
    .replace(/minuto/g, 'minute')
    .replace(/horas/g, 'hours')
    .replace(/hora/g, 'hour')
    .replace(/ y /g, ' and ');
}

function actualizarDisplayTiempoLectura(tiempo) {
  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');
  const tiempoDisp = formatearTiempoLecturaIdioma_(tiempo);
  const disp = document.getElementById('reading-time-val-display');
  if (disp) disp.textContent = tiempoDisp;

  const sub = document.getElementById('reading-time-sub-display');
  if (sub) {
    let msg = isEn ? 'Great reading pace today!' : '¡Buen ritmo de lectura hoy!';
    if (tiempo === '10 minutos' || tiempo === '15 minutos' || tiempo === '20 minutos') {
      msg = isEn ? 'Every minute counts to strengthen your habit!' : '¡Cada minuto cuenta para fortalecer tu hábito!';
    } else if (tiempo === '30 minutos' || tiempo === '45 minutos') {
      msg = isEn ? 'Great progress and focus in your reading!' : '¡Gran progreso y concentración en tu lectura!';
    } else if (tiempo === '1 hora' || tiempo === '1 hora y 30 minutos' || tiempo === '1 hora 30 minutos') {
      msg = isEn ? 'Excellent reading time and immersion!' : '¡Excelente tiempo de lectura e inmersión!';
    } else {
      msg = isEn ? 'Impressive reading marathon today!' : '¡Maratón de lectura impresionante hoy!';
    }
    sub.textContent = msg;
  }

  const btnConfirmTxt = document.getElementById('btn-confirmar-tiempo-txt');
  if (btnConfirmTxt) {
    btnConfirmTxt.textContent = isEn ? `Confirm (${tiempoDisp})` : `Confirmar (${tiempoDisp})`;
  }
}
window.actualizarDisplayTiempoLectura = actualizarDisplayTiempoLectura;

function cerrarModalTiempoLectura() {
  const modal = document.getElementById('modal-tiempo-lectura');
  if (modal) {
    modal.style.display = 'none';
    modal.style.opacity = '';
    const box = modal.querySelector('.modal-box');
    if (box) {
      box.style.transform = '';
      box.style.transition = '';
      box.style.opacity = '';
      box.classList.remove('swiping-down');
    }
  }
}
window.cerrarModalTiempoLectura = cerrarModalTiempoLectura;

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal-tiempo-lectura');
    if (modal && modal.style.display !== 'none') {
      cerrarModalTiempoLectura();
    }
    const modalRuletaMenu = document.getElementById('modal-menu-ruleta-wl');
    if (modalRuletaMenu && modalRuletaMenu.style.display !== 'none') {
      if (typeof cerrarMenuRuletaWl === 'function') cerrarMenuRuletaWl();
      else modalRuletaMenu.style.display = 'none';
    }
  }
});

function marcarLecturaHoy(tiempoDeseado, mostrarToast = false) {
  try {
    const tiempo = tiempoDeseado || tiempoLecturaSeleccionadoActual || '30 minutos';
    const hoyStr = (typeof obtenerFechaHoyStr === 'function') ? obtenerFechaHoyStr() : `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
    let lista = (typeof obtenerListaDiasLectura === 'function') ? obtenerListaDiasLectura() : [];
    if (!lista.includes(hoyStr)) {
      lista.push(hoyStr);
    }

    const uEmail = (typeof estado !== 'undefined' && estado?.userEmail) ? estado.userEmail : 'default';
    const claveDias = 'mediary_dias_lectura_' + uEmail;
    try {
      localStorage.setItem(claveDias, JSON.stringify(lista));
      localStorage.setItem('mediary_dias_lectura_default', JSON.stringify(lista));
      localStorage.setItem('mediary_dias_lectura', JSON.stringify(lista));
    } catch (e) {}

    if (typeof perfilUsuario !== 'undefined' && perfilUsuario) {
      perfilUsuario.diasLectura = lista;
      if (!perfilUsuario.preferencias) perfilUsuario.preferencias = {};
      if (!perfilUsuario.preferencias.rachas) perfilUsuario.preferencias.rachas = {};
      perfilUsuario.preferencias.rachas.diasLectura = lista;
      if (typeof guardarPerfilLocal === 'function') guardarPerfilLocal();
      if (typeof SERVER_API !== 'undefined' && SERVER_API?.guardarPerfilUsuario && estado?.userEmail) {
        SERVER_API.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
      }
      if (typeof google !== 'undefined' && google.script?.run?.guardarPerfilUsuario && estado?.userEmail) {
        google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
      }
    }

    guardarTiempoLecturaFecha(hoyStr, tiempo);

    if (mostrarToast) {
      const l = (typeof userPrefs !== 'undefined' && userPrefs?.lang) || 'es';
      const dispTiempo = (typeof formatearTiempoLecturaIdioma_ === 'function') ? formatearTiempoLecturaIdioma_(tiempo) : tiempo;
      if (typeof mostrarToastPersonalizado === 'function') {
        mostrarToastPersonalizado(l === 'en' ? `Reading session logged: ${dispTiempo}! Streak on fire 🔥` : `¡Lectura registrada (${dispTiempo})! Tu racha sigue encendida 🔥`);
      }
    }

    if (typeof actualizarBotonLecturaHoyInicio === 'function') actualizarBotonLecturaHoyInicio();
    if (typeof actualizarBotonLecturaHoyLibros === 'function') actualizarBotonLecturaHoyLibros();
    if (typeof renderizarRachasActualesInicio === 'function') renderizarRachasActualesInicio();
    if (typeof estado !== 'undefined' && estado.categoria === 'Lecturas' && typeof renderizarBannerRachaSubcategoria === 'function') {
      renderizarBannerRachaSubcategoria(estado.categoria, estado.subcategoria || 'Libros');
    }
    if (typeof renderizarStats === 'function') {
      renderizarStats();
    }
    if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(true);
    }
  } catch (err) {
    console.error('Error al marcar tiempo de lectura:', err);
  }
}
window.marcarLecturaHoy = marcarLecturaHoy;

function confirmarTiempoLectura() {
  const tiempo = tiempoLecturaSeleccionadoActual || '30 minutos';
  marcarLecturaHoy(tiempo, true);
  cerrarModalTiempoLectura();
}
window.confirmarTiempoLectura = confirmarTiempoLectura;

function desmarcarLecturaHoy() {
  try {
    const hoyStr = (typeof obtenerFechaHoyStr === 'function') ? obtenerFechaHoyStr() : `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
    let lista = (typeof obtenerListaDiasLectura === 'function') ? obtenerListaDiasLectura() : [];
    lista = lista.filter(f => f !== hoyStr);

    const uEmail = (typeof estado !== 'undefined' && estado?.userEmail) ? estado.userEmail : 'default';
    const claveDias = 'mediary_dias_lectura_' + uEmail;
    try {
      localStorage.setItem(claveDias, JSON.stringify(lista));
      localStorage.setItem('mediary_dias_lectura_default', JSON.stringify(lista));
      localStorage.setItem('mediary_dias_lectura', JSON.stringify(lista));
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('mediary_dias_lectura')) {
          try {
            const arr = JSON.parse(localStorage.getItem(k));
            if (Array.isArray(arr) && arr.includes(hoyStr)) {
              localStorage.setItem(k, JSON.stringify(arr.filter(f => f !== hoyStr)));
            }
          } catch(e) {}
        }
      }
      ['Mediary_perfil_v1', 'MyMediary_perfil_v1'].forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const obj = JSON.parse(raw);
            let mod = false;
            if (Array.isArray(obj?.diasLectura) && obj.diasLectura.includes(hoyStr)) {
              obj.diasLectura = obj.diasLectura.filter(f => f !== hoyStr);
              mod = true;
            }
            if (Array.isArray(obj?.preferencias?.rachas?.diasLectura) && obj.preferencias.rachas.diasLectura.includes(hoyStr)) {
              obj.preferencias.rachas.diasLectura = obj.preferencias.rachas.diasLectura.filter(f => f !== hoyStr);
              mod = true;
            }
            if (mod) localStorage.setItem(k, JSON.stringify(obj));
          }
        } catch(e) {}
      });
    } catch (e) {}

    if (typeof perfilUsuario !== 'undefined' && perfilUsuario) {
      perfilUsuario.diasLectura = lista;
      if (!perfilUsuario.preferencias) perfilUsuario.preferencias = {};
      if (!perfilUsuario.preferencias.rachas) perfilUsuario.preferencias.rachas = {};
      perfilUsuario.preferencias.rachas.diasLectura = lista;
      if (typeof guardarPerfilLocal === 'function') guardarPerfilLocal();
      if (typeof SERVER_API !== 'undefined' && SERVER_API?.guardarPerfilUsuario && estado?.userEmail) {
        SERVER_API.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
      }
      if (typeof google !== 'undefined' && google.script?.run?.guardarPerfilUsuario && estado?.userEmail) {
        google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
      }
    }

    guardarTiempoLecturaFecha(hoyStr, null);

    cerrarModalTiempoLectura();

    const l = (typeof userPrefs !== 'undefined' && userPrefs?.lang) || 'es';
    if (typeof mostrarToastPersonalizado === 'function') {
      mostrarToastPersonalizado(l === 'en' ? 'Reading session for today unmarked.' : 'Lectura de hoy desmarcada.');
    }

    if (typeof actualizarBotonLecturaHoyInicio === 'function') actualizarBotonLecturaHoyInicio();
    if (typeof actualizarBotonLecturaHoyLibros === 'function') actualizarBotonLecturaHoyLibros();
    if (typeof renderizarRachasActualesInicio === 'function') renderizarRachasActualesInicio();
    if (typeof estado !== 'undefined' && estado.categoria === 'Lecturas' && typeof renderizarBannerRachaSubcategoria === 'function') {
      renderizarBannerRachaSubcategoria(estado.categoria, estado.subcategoria || 'Libros');
    }
    if (typeof renderizarStats === 'function') {
      renderizarStats();
    }
    if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(true);
    }
  } catch (err) {
    console.error('Error al desmarcar lectura:', err);
    cerrarModalTiempoLectura();
  }
}
window.desmarcarLecturaHoy = desmarcarLecturaHoy;

function toggleLecturaHoy(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  const ya = (typeof haLeidoHoy === 'function') ? haLeidoHoy() : false;
  if (!ya) {
    marcarLecturaHoy(tiempoLecturaSeleccionadoActual || '30 minutos', false);
  }
  abrirModalTiempoLectura();
}
window.toggleLecturaHoy = toggleLecturaHoy;

function actualizarBotonLecturaHoyInicio() {
  const box = document.getElementById('home-reading-quick-box');
  if (box) {
    box.style.display = 'none';
    box.innerHTML = '';
  }
}
window.actualizarBotonLecturaHoyInicio = actualizarBotonLecturaHoyInicio;

function actualizarBotonLecturaHoyLibros() {
  const box = document.getElementById('box-lectura-hoy-libros');
  if (!box) return;
  const c = (typeof estado !== 'undefined' && estado?.categoria) ? estado.categoria : '';
  const esLectura = (c === 'Lecturas');

  if (!esLectura) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }

  box.style.display = 'block';
  const l = (typeof userPrefs !== 'undefined' && userPrefs?.lang) || 'es';
  const ya = (typeof haLeidoHoy === 'function') ? haLeidoHoy() : false;
  const mapaTiempos = (typeof obtenerMapaTiemposLectura === 'function') ? obtenerMapaTiemposLectura() : {};
  const hoyStr = (typeof obtenerFechaHoyStr === 'function') ? obtenerFechaHoyStr() : '';
  const tiempoHoyObj = mapaTiempos[hoyStr];
  const tiempoHoyTxt = (typeof tiempoHoyObj === 'string') ? tiempoHoyObj : (tiempoHoyObj?.texto || '');

  if (ya) {
    box.innerHTML = `
      <div class="books-reading-strip active-read">
        <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
          <span class="emoji-dyn" style="color:#10b981;">${getHeroIcon('check-circle', '', 24)}</span>
          <div style="min-width:0; flex:1;">
            <strong style="font-size:0.86rem; color:var(--text); display:block;">${l === 'en' ? 'You read today!' : '¡Ya leíste hoy!'}</strong>
            <span style="font-size:0.75rem; color:var(--muted);">${tiempoHoyTxt ? (l === 'en' ? `Session time: ${tiempoHoyTxt}` : `Tiempo registrado: ${tiempoHoyTxt}`) : (l === 'en' ? 'Session logged into your streak.' : 'Tu sesión de hoy está sumada a tu racha.')}</span>
          </div>
        </div>
        <button type="button" class="btn-read-today done" onclick="event.stopPropagation(); toggleLecturaHoy(event)" style="padding:8px 18px; font-size:0.84rem;" title="${l === 'en' ? 'Click to adjust time or unmark' : 'Toca para ver/ajustar tiempo o desmarcar'}">
          <span>${getHeroIcon("check", "", 14)}</span> <span>${tiempoHoyTxt ? (typeof formatTiempoPill === 'function' ? formatTiempoPill(tiempoHoyTxt) : tiempoHoyTxt) : (l === 'en' ? 'Read today' : 'Ya leí hoy')}</span>
        </button>
      </div>
    `;
  } else {
    box.innerHTML = `
      <div class="books-reading-strip">
        <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
          <span class="emoji-dyn">${getHeroIcon('book-open', '', 24)}</span>
          <div style="min-width:0; flex:1;">
            <strong style="font-size:0.86rem; color:var(--text); display:block;">${l === 'en' ? 'Did you read today?' : '¿Avanzaste en tu lectura hoy?'}</strong>
            <span style="font-size:0.75rem; color:var(--muted);">${l === 'en' ? 'Keep your daily reading streak alive.' : 'Suma tu avance diario tocando el botón.'}</span>
          </div>
        </div>
        <button type="button" class="btn-read-today" onclick="event.stopPropagation(); toggleLecturaHoy(event)" style="padding:8px 18px; font-size:0.84rem;">
          <span>${getHeroIcon('plus', '', 14)}</span> <span>${l === 'en' ? 'I read today' : 'Ya leí hoy'}</span>
        </button>
      </div>
    `;
  }
}
window.actualizarBotonLecturaHoyLibros = actualizarBotonLecturaHoyLibros;

function calcularRachaDesdeDayIndices(setDayIndices) {
  if (!setDayIndices || !setDayIndices.size) {
    return {
      rachaActual: 0,
      rachaMasAlta: 0,
      esActivaHoy: false,
      totalDias: 0
    };
  }

  const sortedDays = Array.from(setDayIndices).sort((a, b) => a - b);
  let bestStreak = 0;
  let curStreak = 0;
  let lastDayIdx = null;

  for (let i = 0; i < sortedDays.length; i++) {
    const dayIdx = sortedDays[i];
    if (lastDayIdx === null || dayIdx === lastDayIdx + 1) {
      curStreak++;
    } else {
      curStreak = 1;
    }
    lastDayIdx = dayIdx;
    if (curStreak > bestStreak) {
      bestStreak = curStreak;
    }
  }

  const now = new Date();
  const hoyMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hoyIdx = Math.round(hoyMid.getTime() / 86400000);
  const ayerIdx = hoyIdx - 1;

  let rachaActual = 0;
  let esActivaHoy = false;

  if (setDayIndices.has(hoyIdx)) {
    esActivaHoy = true;
    let check = hoyIdx;
    while (setDayIndices.has(check)) {
      rachaActual++;
      check--;
    }
  } else if (setDayIndices.has(ayerIdx)) {
    esActivaHoy = false;
    let check = ayerIdx;
    while (setDayIndices.has(check)) {
      rachaActual++;
      check--;
    }
  }

  return {
    rachaActual,
    rachaMasAlta: bestStreak,
    esActivaHoy,
    totalDias: setDayIndices.size
  };
}

// 1. Racha de Películas (automática según días registrados de películas)
function calcularRachaPeliculas(regs) {
  const allRegs = regs || estado.registros || [];
  const setDayIndices = new Set();
  allRegs.forEach(r => {
    if (r && perteneceASub(r, 'Peliculas', 'Películas')) {
      const setR = extraerDayIndicesDeRegistro(r);
      setR.forEach(idx => setDayIndices.add(idx));
    }
  });
  return calcularRachaDesdeDayIndices(setDayIndices);
}

// 2. Racha de Discos (automática según días registrados de discos)
function calcularRachaDiscos(regs) {
  const allRegs = regs || estado.registros || [];
  const setDayIndices = new Set();
  allRegs.forEach(r => {
    if (r && perteneceASub(r, 'Musica', 'Discos')) {
      const setR = extraerDayIndicesDeRegistro(r);
      setR.forEach(idx => setDayIndices.add(idx));
    }
  });
  return calcularRachaDesdeDayIndices(setDayIndices);
}

// 3. Racha de Lecturas (manual exclusivamente con botón "Ya leí hoy")
function calcularRachaLectura() {
  const setDayIndices = obtenerDayIndicesDeLecturaDiaria();
  return calcularRachaDesdeDayIndices(setDayIndices);
}

function calcularRachaSubcategoria(cat, sub) {
  const cNorm = String(cat || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const sNorm = String(sub || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (cNorm.includes('pelicula')) {
    if (sNorm.includes('pelicula') || sNorm.includes('nueva') || sNorm.includes('rewatch')) {
      const info = calcularRachaPeliculas();
      return { ...info, textoAccion: obtenerTextoAccionSubcategoria('Peliculas', 'Películas') };
    }
    return { rachaActual: 0, rachaMasAlta: 0, esActivaHoy: false, totalDias: 0, textoAccion: '' };
  }

  if (cNorm.includes('musica')) {
    if (sNorm.includes('disco')) {
      const info = calcularRachaDiscos();
      return { ...info, textoAccion: obtenerTextoAccionSubcategoria('Musica', 'Discos') };
    }
    return { rachaActual: 0, rachaMasAlta: 0, esActivaHoy: false, totalDias: 0, textoAccion: '' };
  }

  if (cNorm.includes('lectura')) {
    const info = calcularRachaLectura();
    return { ...info, textoAccion: obtenerTextoAccionSubcategoria('Lecturas', 'Libros') };
  }

  return { rachaActual: 0, rachaMasAlta: 0, esActivaHoy: false, totalDias: 0, textoAccion: '' };
}

function calcularRachaGlobalActual(regs) {
  const allRegs = regs || estado.registros || [];
  const setDayIndices = new Set();

  allRegs.forEach(r => {
    if (r && (perteneceASub(r, 'Peliculas', 'Películas') || perteneceASub(r, 'Musica', 'Discos'))) {
      const setR = extraerDayIndicesDeRegistro(r);
      setR.forEach(idx => setDayIndices.add(idx));
    }
  });

  const diasLectura = obtenerDayIndicesDeLecturaDiaria();
  diasLectura.forEach(idx => setDayIndices.add(idx));

  return calcularRachaDesdeDayIndices(setDayIndices);
}

function actualizarSaludoInicio() {
  const nickEl = document.getElementById('home-greeting-nickname');
  if (!nickEl) return;
  let nick = '';
  if (typeof perfilUsuario !== 'undefined' && perfilUsuario && perfilUsuario.nickname) {
    nick = perfilUsuario.nickname;
  } else if (typeof estado !== 'undefined' && estado.userEmail) {
    nick = estado.userEmail.split('@')[0];
  }
  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');
  if (!nick || !nick.trim() || nick.trim() === 'Cinéfilo') {
    nick = isEn ? 'Cinephile' : 'Cinéfilo';
  } else if (nick.trim() === 'Cinéfilo & Lector') {
    nick = isEn ? 'Cinephile & Reader' : 'Cinéfilo & Lector';
  }
  nickEl.textContent = nick;
}
window.actualizarSaludoInicio = actualizarSaludoInicio;



function renderizarResumenInicio() {
  actualizarSaludoInicio();
  renderizarObrasEnProgresoInicio();
  renderizarRachasActualesInicio();
  renderizarSubcategoriasResumenInicio();
  renderizarEscuchandoAhoraInicio();
  if (typeof renderizarPlayStationNowPlayingInicio === 'function') {
    renderizarPlayStationNowPlayingInicio();
  }
  if (typeof renderizarDiscoverVista === 'function' && estado.discoverData) {
    renderizarDiscoverVista();
  }
}

function clasificarSubcatOnGoing(r) {
  if (!r) return null;
  const c = String(r.categoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const s = String(r.subcategoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const tit = String(r.titulo || '').trim();
  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');

  // Excluir watchlists
  if (s.includes('watchlist') || s.includes('to play') || s.includes('to read') || s.includes('to listen')) return null;

  // Excluir explícitamente música y artistas
  if (c.includes('musica') || c.includes('music') || s.includes('artista') || s.includes('grupo') || s.includes('disco')) return null;

  // Excluir explícitamente películas
  if (c.includes('pelicula') || c.includes('movie') || c.includes('film')) return null;

  // Excluir explícitamente series completas y documentales
  if (s.includes('completa') || s.includes('documental')) return null;

  // 1. Temporadas de series: SOLO temporadas individuales, jamás series completas ni series sin temporada
  if (c.includes('serie')) {
    const tieneSeasonEnTitulo = /\[s\d+\]$/i.test(tit) || /\b(temporada|season)\s*\d+/i.test(tit) || /#\d+$/.test(tit);
    const tieneTemporadaEnSub = s.includes('temporada') || s.includes('season');
    if (!tieneTemporadaEnSub && !tieneSeasonEnTitulo) return null;
    return { orden: 1, grupo: 'temporadas', label: isEn ? 'Season' : 'Temporada', emoji: getHeroIcon('tv'), catKey: 'series' };
  }

  // 2. Juegos
  if (c.includes('juego') || c.includes('game')) {
    return { orden: 2, grupo: 'juegos', label: isEn ? 'Game' : 'Juego', emoji: getHeroIcon('gamepad'), catKey: 'juegos' };
  }

  // 3. Lecturas
  if (c.includes('lectura') || c.includes('libro') || c.includes('comic') || c.includes('manga') || c.includes('book') || c.includes('read')) {
    const isComic = s.includes('comic');
    const isManga = s.includes('manga');
    const lbl = isComic ? (isEn ? 'Comic' : 'Cómic') : (isManga ? 'Manga' : (isEn ? 'Book' : 'Libro'));
    const catKey = isComic ? 'comics' : (isManga ? 'mangas' : 'libros');
    return { orden: 3, grupo: 'lecturas', label: lbl, emoji: getHeroIcon('book-open'), catKey };
  }

  return null;
}

function renderizarObrasEnProgresoInicio() {
  const listEl = document.getElementById('home-en-progreso-list');
  const countEl = document.getElementById('home-en-progreso-count');
  if (!listEl) return;

  const l = userPrefs.lang || 'es';
  // Filtrar y clasificar obras On Going: temporadas, juegos y lecturas (sin series completas ni artistas)
  const candidatosCrudos = (estado.registros || []).filter(r => {
    if (!r) return false;
    const info = clasificarSubcatOnGoing(r);
    if (!info) return false;
    const fFin = r.fechaFin || r.fecha_fin;
    const fIni = r.fechaInicio || r.fecha_inicio;
    const fFinLower = String(fFin || '').trim().toLowerCase();
    const fIniLower = String(fIni || '').trim().toLowerCase();
    const esSinFechaFin = (!fFin || fFinLower === 'sin fecha' || fFinLower === '');
    const fIniValida = (fIni && fIniLower !== 'sin fecha');
    return (typeof esEnProgresoTexto === 'function' && esEnProgresoTexto(fFin)) || (esSinFechaFin && fIniValida);
  });

  // Identificar qué series tienen una temporada específica con formato [S1] o Temporada X
  const seriesConTemporadaEspecifica = new Set();
  for (const r of candidatosCrudos) {
    const c = String(r.categoria || '').toLowerCase();
    if (c.includes('serie')) {
      const tit = String(r.titulo || '').trim();
      if (/\[s\d+\]$/i.test(tit) || /\b(temporada|season)\s*\d+/i.test(tit) || /#\d+$/.test(tit)) {
        const baseTit = tit.replace(/\s*\[s\d+\]$/i, '').replace(/\s*-\s*(temporada|season)\s*\d+$/i, '').trim().toLowerCase();
        seriesConTemporadaEspecifica.add(baseTit);
      }
    }
  }

  // Deduplicar: ID único, y descartar títulos base de series si ya existe su temporada específica
  const seenIds = new Set();
  const candidatos = [];
  for (const r of candidatosCrudos) {
    if (!r || !r.id || seenIds.has(r.id)) continue;
    const c = String(r.categoria || '').toLowerCase();
    if (c.includes('serie')) {
      const tit = String(r.titulo || '').trim();
      const tieneSeason = /\[s\d+\]$/i.test(tit) || /\b(temporada|season)\s*\d+/i.test(tit) || /#\d+$/.test(tit);
      const baseTit = tit.replace(/\s*\[s\d+\]$/i, '').replace(/\s*-\s*(temporada|season)\s*\d+$/i, '').trim().toLowerCase();
      if (!tieneSeason && seriesConTemporadaEspecifica.has(baseTit)) {
        continue;
      }
    }
    seenIds.add(r.id);
    candidatos.push(r);
  }

  // Ordenar de más nuevo a más antiguo (el último comenzado a la izquierda, el comenzado antes a la derecha)
  candidatos.sort((a, b) => {
    const fA = a.fechaInicio || a.fecha_inicio;
    const fB = b.fechaInicio || b.fecha_inicio;
    return (timestampDeFecha(fB) || 0) - (timestampDeFecha(fA) || 0);
  });

  if (countEl) countEl.textContent = String(candidatos.length);

  if (!candidatos.length) {
    listEl.innerHTML = `
      <div style="text-align:center; padding:18px 12px; color:var(--muted); font-size:0.82rem; background:var(--bg); border:1px dashed var(--border); border-radius:4px; width:100%; box-sizing:border-box;">
        <span class="emoji-dyn" style="font-size:1.35rem; display:block; margin-bottom:4px;">${getHeroIcon('sparkles', '', 24)}</span>
        <span data-i18n="home_en_progreso_empty">${l === 'en' ? 'You have no titles in progress right now.' : 'No tienes obras en curso en este momento.'}</span>
      </div>
    `;
    return;
  }

  const esTodosLosTiempos = (typeof estado !== 'undefined' && estado.anioActivo === 'todos');

  listEl.innerHTML = candidatos.map(r => {
    const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(r.categoria, r.subcategoria) : null;
    const info = clasificarSubcatOnGoing(r) || { emoji: getHeroIcon('film'), label: r.subcategoria || r.categoria, catKey: metaCol ? metaCol.key : 'peliculas' };
    const posterSrc = r.poster || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'140\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>';
    const fechaIniRaw = (r.fechaInicio && r.fechaInicio !== 'Sin fecha') ? r.fechaInicio : (r.fecha_inicio && r.fecha_inicio !== 'Sin fecha' ? r.fecha_inicio : '');
    const creadorStr = r.creador ? `${r.creador} ${r.anio ? `(${r.anio})` : ''}` : (r.anio ? `(${r.anio})` : '');
    let fechaIniDisplay = '';
    if (fechaIniRaw) {
      const prefix = l === 'en' ? 'Since: ' : 'Desde: ';
      let d = '', m = '', y = '';
      const str = String(fechaIniRaw).trim();
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          d = parts[0].padStart(2, '0');
          m = parts[1].padStart(2, '0');
          y = parts[2];
        }
      } else if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            y = parts[0];
            m = parts[1].padStart(2, '0');
            d = parts[2].padStart(2, '0');
          } else {
            d = parts[0].padStart(2, '0');
            m = parts[1].padStart(2, '0');
            y = parts[2];
          }
        }
      }
      if (d && m) {
        fechaIniDisplay = (esTodosLosTiempos && y) ? `${prefix}${d}/${m}/${y}` : `${prefix}${d}/${m}`;
      } else {
        fechaIniDisplay = `${prefix}${str}`;
      }
    }

    return `
      <div class="home-en-progreso-item-wrap" id="home-prog-wrap-${r.id}">
        <div class="home-en-progreso-item-date">${fechaIniDisplay || '&nbsp;'}</div>
        <div class="home-en-progreso-card" id="home-prog-${r.id}">
          <div class="home-en-progreso-poster-wrap" onclick="abrirFichaTecnica('${r.id}')" title="${l === 'en' ? 'View details' : 'Ver ficha técnica'}">
            <span class="home-en-progreso-card-badge-overlay cat-overlay-${info.catKey || 'default'}"><span class="emoji-dyn">${info.emoji}</span> ${info.label}</span>
            <img src="${optimizarUrlPoster(posterSrc, 'thumb')}" class="home-en-progreso-card-poster" alt="${r.titulo}" loading="lazy" decoding="async">
          </div>
          <div class="home-en-progreso-card-title" onclick="abrirFichaTecnica('${r.id}')" title="${r.titulo}">${r.titulo}</div>
          <div class="home-en-progreso-card-sub" title="${creadorStr}">${creadorStr || '—'}</div>
          <button type="button" class="btn-terminar-card-carousel" onclick="event.stopPropagation(); abrirModalTerminarObra('${r.id}')" title="${l === 'en' ? 'Mark as finished & review' : 'Completar y calificar obra'}">
            <span class="emoji-dyn">${getHeroIcon('check', '', 11)}</span> <span>${l === 'en' ? 'Finish' : 'Terminar'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}
window.renderizarObrasEnProgresoInicio = renderizarObrasEnProgresoInicio;


const CATS_DEFECTO = ['Peliculas', 'Series', 'Musica', 'Juegos', 'Lecturas'];

function obtenerCategoriasOrdenadas(incluirOcultas = false) {
  let orden = (typeof userPrefs !== 'undefined' && userPrefs && Array.isArray(userPrefs.categoriasOrden)) ? [...userPrefs.categoriasOrden] : [...CATS_DEFECTO];
  CATS_DEFECTO.forEach(c => {
    if (!orden.includes(c)) orden.push(c);
  });
  orden = orden.filter(c => (typeof CONFIG !== 'undefined' && CONFIG[c]));
  if (!orden.length) orden = [...CATS_DEFECTO];

  const ocultas = (typeof userPrefs !== 'undefined' && userPrefs && Array.isArray(userPrefs.categoriasOcultas)) ? userPrefs.categoriasOcultas : [];
  if (incluirOcultas) {
    return orden;
  }
  return orden.filter(c => !ocultas.includes(c));
}
window.obtenerCategoriasOrdenadas = obtenerCategoriasOrdenadas;

function esObraTerminada(r) {
  if (!r) return false;
  const fFin = r.fechaFin || r.fecha_fin;
  const fFinStr = String(fFin || '').trim();
  const fFinLower = fFinStr.toLowerCase();
  if (typeof esEnProgresoTexto === 'function' && esEnProgresoTexto(fFin)) return false;
  if (fFinLower.startsWith('aún') || fFinLower.startsWith('aun') || fFinLower.startsWith('still') || fFinLower.includes('progreso') || fFinLower.includes('progress')) return false;
  
  const admiteRango = (typeof subTieneRango === 'function') ? subTieneRango(r.categoria, r.subcategoria) : Boolean(r.fechaFin && r.fechaInicio);
  if (admiteRango) {
    if (!fFin || fFinLower === 'sin fecha' || fFinStr === '') return false;
    return true;
  }
  const fIni = r.fechaInicio || r.fecha_inicio;
  const fIniLower = String(fIni || '').trim().toLowerCase();
  if (typeof esEnProgresoTexto === 'function' && esEnProgresoTexto(fIni)) return false;
  if (fIniLower.startsWith('aún') || fIniLower.startsWith('aun') || fIniLower.startsWith('still')) return false;
  return Boolean((fFin && fFinLower !== 'sin fecha' && fFinStr !== '') || (fIni && fIniLower !== 'sin fecha' && String(fIni).trim() !== ''));
}
window.esObraTerminada = esObraTerminada;

let modoReordenarListasActivo = false;

function toggleModoReordenarListas() {
  modoReordenarListasActivo = !modoReordenarListasActivo;
  const btn = document.getElementById('btn-toggle-reordenar-listas');
  const panel = document.getElementById('contenedor-modo-reordenar-listas');
  const grid = document.getElementById('grid-stats');
  const iconIdle = document.getElementById('icon-reordenar-listas-idle');
  const iconActive = document.getElementById('icon-reordenar-listas-active');

  if (modoReordenarListasActivo) {
    if (btn) btn.classList.add('active');
    if (iconIdle) iconIdle.style.display = 'none';
    if (iconActive) iconActive.style.display = 'block';
    if (panel) {
      panel.style.display = 'block';
      renderizarPanelReordenarListas();
    }
    if (grid) grid.style.display = 'none';
  } else {
    if (btn) btn.classList.remove('active');
    if (iconIdle) iconIdle.style.display = 'block';
    if (iconActive) iconActive.style.display = 'none';
    if (panel) panel.style.display = 'none';
    if (grid) grid.style.display = 'grid';
    guardarPreferenciasLocales();
    renderizarStats();
    renderizarSubcategoriasResumenInicio();
    renderizarOpcionesAgregadoRapido();
  }
}
window.toggleModoReordenarListas = toggleModoReordenarListas;

function renderizarPanelReordenarListas() {
  const panel = document.getElementById('contenedor-modo-reordenar-listas');
  if (!panel) return;
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang) || 'es';
  const todasCats = obtenerCategoriasOrdenadas(true);
  const ocultas = new Set((typeof userPrefs !== 'undefined' && userPrefs && userPrefs.categoriasOcultas) || []);

  panel.innerHTML = `
    <div class="reorder-panel-box">
      <div class="reorder-panel-header">
        <div class="reorder-panel-title">
          <span class="emoji-dyn"><svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg></span>
          <span>${l === 'en' ? 'Organize Categories' : 'Organizar Categorías'}</span>
        </div>
        <p class="reorder-panel-sub">
          ${l === 'en' ? 'Drag categories to reorder them or tap the eye to show/hide. Changes apply to Lists, Home Index, and Quick Add.' : 'Arrastra para reordenar las categorías o toca el ojo para ocultar o mostrar. Se reflejará en Listas, Inicio y Agregado Rápido.'}
        </p>
      </div>
      <div class="reorder-items-list" id="lista-reordenar-items">
        ${todasCats.map((cat, idx) => {
          const cfg = CONFIG[cat] || { emoji: getHeroIcon('folder'), nombre: cat };
          const catNombre = (typeof I18N !== 'undefined' && I18N[l] && I18N[l].cats && I18N[l].cats[cat]) || cfg.nombre;
          const esOculta = ocultas.has(cat);
          return `
            <div class="reorder-item-row ${esOculta ? 'is-hidden' : ''}" draggable="true" data-cat="${cat}" data-idx="${idx}">
              <div class="reorder-handle" title="${l === 'en' ? 'Drag to move' : 'Arrastra para mover'}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="6" r="1.5"></circle>
                  <circle cx="15" cy="6" r="1.5"></circle>
                  <circle cx="9" cy="12" r="1.5"></circle>
                  <circle cx="15" cy="12" r="1.5"></circle>
                  <circle cx="9" cy="18" r="1.5"></circle>
                  <circle cx="15" cy="18" r="1.5"></circle>
                </svg>
              </div>
              <div class="reorder-cat-info">
                <span class="reorder-cat-emoji emoji-dyn">${cfg.emoji}</span>
                <span class="reorder-cat-name">${catNombre}</span>
                ${esOculta ? `<span class="reorder-badge-hidden">${l === 'en' ? 'Hidden' : 'Oculta'}</span>` : ''}
              </div>
              <div class="reorder-item-actions">
                <button type="button" class="btn-reorder-move" onclick="moverCategoriaPaso('${cat}', -1)" title="${l === 'en' ? 'Move up' : 'Subir'}" ${idx === 0 ? 'disabled' : ''}>
                  ${getHeroIcon('chevron-up', '', 14)}
                </button>
                <button type="button" class="btn-reorder-move" onclick="moverCategoriaPaso('${cat}', 1)" title="${l === 'en' ? 'Move down' : 'Bajar'}" ${idx === todasCats.length - 1 ? 'disabled' : ''}>
                  ${getHeroIcon('chevron-down', '', 14)}
                </button>
                <button type="button" class="btn-reorder-eye ${esOculta ? 'hidden-state' : ''}" onclick="toggleVisibilidadCategoria('${cat}')" title="${esOculta ? (l === 'en' ? 'Show category' : 'Mostrar categoría') : (l === 'en' ? 'Hide category' : 'Ocultar categoría')}">
                  ${esOculta ? `
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ` : `
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  `}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="reorder-panel-footer">
        <button type="button" class="btn-reorder-done" onclick="toggleModoReordenarListas()">
          <span class="emoji-dyn">${getHeroIcon('check', '', 14)}</span>
          <span>${l === 'en' ? 'Done' : 'Listo'}</span>
        </button>
      </div>
    </div>
  `;

  iniciarEventosDragDropReordenar();
}
window.renderizarPanelReordenarListas = renderizarPanelReordenarListas;

function iniciarEventosDragDropReordenar() {
  const container = document.getElementById('lista-reordenar-items');
  if (!container) return;
  const items = container.querySelectorAll('.reorder-item-row');
  let draggedItem = null;

  items.forEach(item => {
    item.addEventListener('dragstart', e => {
      draggedItem = item;
      item.classList.add('is-dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.cat || '');
      }
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('is-dragging');
      items.forEach(it => it.classList.remove('drag-over-top', 'drag-over-bottom'));
      guardarNuevoOrdenDesdeDOM();
    });

    item.addEventListener('dragover', e => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      if (!draggedItem || draggedItem === item) return;
      const rect = item.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        item.classList.add('drag-over-top');
        item.classList.remove('drag-over-bottom');
      } else {
        item.classList.add('drag-over-bottom');
        item.classList.remove('drag-over-top');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    item.addEventListener('drop', e => {
      e.preventDefault();
      if (!draggedItem || draggedItem === item) return;
      const rect = item.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        container.insertBefore(draggedItem, item);
      } else {
        container.insertBefore(draggedItem, item.nextSibling);
      }
      guardarNuevoOrdenDesdeDOM();
      renderizarPanelReordenarListas();
    });
  });

  // Touch drag support para móviles
  let touchDraggedItem = null;
  items.forEach(item => {
    const handle = item.querySelector('.reorder-handle');
    if (!handle) return;
    handle.addEventListener('touchstart', () => {
      touchDraggedItem = item;
      item.classList.add('is-dragging');
    }, { passive: true });

    handle.addEventListener('touchmove', e => {
      if (!touchDraggedItem) return;
      const touch = e.touches[0];
      const targetElem = document.elementFromPoint(touch.clientX, touch.clientY);
      const row = targetElem?.closest('.reorder-item-row');
      if (row && row !== touchDraggedItem && row.parentNode === container) {
        const rect = row.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (touch.clientY < mid) {
          container.insertBefore(touchDraggedItem, row);
        } else {
          container.insertBefore(touchDraggedItem, row.nextSibling);
        }
      }
    }, { passive: true });

    handle.addEventListener('touchend', () => {
      if (touchDraggedItem) {
        touchDraggedItem.classList.remove('is-dragging');
        touchDraggedItem = null;
        guardarNuevoOrdenDesdeDOM();
        renderizarPanelReordenarListas();
      }
    });
  });
}

function guardarNuevoOrdenDesdeDOM() {
  const container = document.getElementById('lista-reordenar-items');
  if (!container) return;
  const rows = container.querySelectorAll('.reorder-item-row');
  const nuevoOrden = Array.from(rows).map(r => r.dataset.cat).filter(Boolean);
  if (nuevoOrden.length) {
    if (typeof userPrefs === 'undefined' || !userPrefs) userPrefs = {};
    userPrefs.categoriasOrden = nuevoOrden;
    guardarPreferenciasLocales();
  }
}

function moverCategoriaPaso(cat, paso) {
  const todas = obtenerCategoriasOrdenadas(true);
  const idx = todas.indexOf(cat);
  if (idx === -1) return;
  const nuevoIdx = idx + paso;
  if (nuevoIdx < 0 || nuevoIdx >= todas.length) return;
  todas.splice(idx, 1);
  todas.splice(nuevoIdx, 0, cat);
  if (typeof userPrefs === 'undefined' || !userPrefs) userPrefs = {};
  userPrefs.categoriasOrden = todas;
  guardarPreferenciasLocales();
  renderizarPanelReordenarListas();
}
window.moverCategoriaPaso = moverCategoriaPaso;

function toggleVisibilidadCategoria(cat) {
  if (typeof userPrefs === 'undefined' || !userPrefs) userPrefs = {};
  if (!Array.isArray(userPrefs.categoriasOcultas)) userPrefs.categoriasOcultas = [];
  const idx = userPrefs.categoriasOcultas.indexOf(cat);
  if (idx !== -1) {
    userPrefs.categoriasOcultas.splice(idx, 1);
  } else {
    const todas = obtenerCategoriasOrdenadas(true);
    if (userPrefs.categoriasOcultas.length >= todas.length - 1) {
      if (typeof mostrarToastPersonalizado === 'function') {
        mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'At least one category must remain visible' : 'Al menos una categoría debe permanecer visible');
      }
      return;
    }
    userPrefs.categoriasOcultas.push(cat);
  }
  guardarPreferenciasLocales();
  renderizarPanelReordenarListas();
}
window.toggleVisibilidadCategoria = toggleVisibilidadCategoria;

function renderizarOpcionesAgregadoRapido() {
  const grid = document.getElementById('modal-quick-add-grid');
  if (!grid) return;
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang) || 'es';
  const catsVisibles = obtenerCategoriasOrdenadas(false);

  const opciones = [
    { cat: 'Peliculas', sub: 'Películas', emoji: getHeroIcon('clapperboard'), label: (l === 'en' ? 'Movie' : 'Película') },
    { cat: 'Peliculas', sub: 'Documentales', emoji: getHeroIcon('video-camera'), label: (l === 'en' ? 'Documentary' : 'Documental') },
    { cat: 'Series', sub: 'Temporadas', emoji: getHeroIcon('rectangle-stack'), label: (l === 'en' ? 'Series / Season' : 'Serie / Temp.') },
    { cat: 'Series', sub: 'Series Documentales', emoji: getHeroIcon('docuseries'), label: (l === 'en' ? 'Docuseries' : 'Docuserie') },
    { cat: 'Musica', sub: 'Discos', emoji: getHeroIcon('disc'), label: (l === 'en' ? 'Album' : 'Disco') },
    { cat: 'Musica', sub: 'Artistas/Grupos', emoji: getHeroIcon('microphone'), label: (l === 'en' ? 'Artist' : 'Artista') },
    { cat: 'Juegos', sub: 'Videojuegos', emoji: getHeroIcon('gamepad'), label: (l === 'en' ? 'Video Game' : 'Videojuego') },
    { cat: 'Lecturas', sub: 'Libros', emoji: getHeroIcon('book-open'), label: (l === 'en' ? 'Book' : 'Libro') },
    { cat: 'Lecturas', sub: 'Cómics', emoji: getHeroIcon('bolt'), label: (l === 'en' ? 'Comic' : 'Cómic') },
    { cat: 'Lecturas', sub: 'Mangas', emoji: getHeroIcon('bookmark-square'), label: (l === 'en' ? 'Manga' : 'Manga') }
  ];

  const opsFiltradas = opciones.filter(op => catsVisibles.includes(op.cat));
  opsFiltradas.sort((a, b) => catsVisibles.indexOf(a.cat) - catsVisibles.indexOf(b.cat));

  grid.innerHTML = opsFiltradas.map(op => {
    const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(op.cat, op.sub) : null;
    const catClass = metaCol ? `btn-quick-${metaCol.key}` : '';
    return `<button type="button" class="btn-quick-sub ${catClass}" onclick="ejecutarAgregadoRapido('${op.cat}', '${op.sub}')"><span class="emoji-dyn">${op.emoji}</span> <span>${op.label}</span></button>`;
  }).join('');
}
window.renderizarOpcionesAgregadoRapido = renderizarOpcionesAgregadoRapido;

function renderizarSubcategoriasResumenInicio() {
  const cont = document.getElementById('home-subcats-summary-pills');
  if (!cont) return;
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang) || 'es';
  const catsVisibles = obtenerCategoriasOrdenadas(false);
  const listaSubcats = [
    { cat: 'Peliculas', sub: 'Películas', emoji: getHeroIcon('clapperboard'), label: (l === 'en' ? 'Movies' : 'Películas') },
    { cat: 'Series', sub: 'Temporadas', emoji: getHeroIcon('rectangle-stack'), label: (l === 'en' ? 'Series' : 'Series') },
    { cat: 'Musica', sub: 'Discos', emoji: getHeroIcon('musical-note'), label: (l === 'en' ? 'Music' : 'Música') },
    { cat: 'Juegos', sub: 'Videojuegos', emoji: getHeroIcon('gamepad'), label: (l === 'en' ? 'Games' : 'Juegos') },
    { cat: 'Lecturas', sub: 'Libros', emoji: getHeroIcon('book-open'), label: (l === 'en' ? 'Books' : 'Libros') },
    { cat: 'Lecturas', sub: 'Cómics', emoji: getHeroIcon('bolt'), label: (l === 'en' ? 'Comics' : 'Cómics') },
    { cat: 'Lecturas', sub: 'Mangas', emoji: getHeroIcon('bookmark-square'), label: (l === 'en' ? 'Manga' : 'Mangas') }
  ];

  const subcatsFiltradas = listaSubcats.filter(s => catsVisibles.includes(s.cat));
  subcatsFiltradas.sort((a, b) => catsVisibles.indexOf(a.cat) - catsVisibles.indexOf(b.cat));

  cont.innerHTML = subcatsFiltradas.map(s => {
    const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(s.cat, s.sub) : null;
    const catClass = metaCol ? `home-indice-${metaCol.key}` : '';
    return `
      <button type="button" class="home-indice-btn ${catClass}" onclick="cambiarCat('${s.cat}', '${s.sub}')" title="${s.label}">
        <span class="home-indice-icon emoji-dyn">${s.emoji}</span>
        <span class="home-indice-name">${s.label}</span>
      </button>
    `;
  }).join('');
}

function renderizarRachasActualesInicio() {
  const cont = document.getElementById('home-streaks-summary-cards');
  const badgeGlobal = document.getElementById('home-streaks-global-badge');
  if (!cont) return;

  const l = userPrefs.lang || 'es';
  if (badgeGlobal) {
    badgeGlobal.textContent = (l === 'en' ? 'Movies · Music · Reading' : 'Películas · Música · Lectura');
  }

  const rPeliculas = calcularRachaPeliculas(estado.registros);
  const rMusica = calcularRachaDiscos(estado.registros);
  const rLectura = calcularRachaLectura();

  const mapaTiempos = typeof obtenerMapaTiemposLectura === 'function' ? obtenerMapaTiemposLectura() : {};
  const hoyStr = (typeof obtenerFechaHoyStr === 'function') ? obtenerFechaHoyStr() : '';
  let tiempoHoyObj = mapaTiempos[hoyStr];
  if (!tiempoHoyObj && hoyStr) {
    const hoyIdx = (typeof fechaStrToDayIndex === 'function') ? fechaStrToDayIndex(hoyStr) : null;
    if (hoyIdx !== null) {
      for (const k of Object.keys(mapaTiempos)) {
        if (fechaStrToDayIndex(k) === hoyIdx) {
          tiempoHoyObj = mapaTiempos[k];
          break;
        }
      }
    }
  }
  const tiempoHoyTxt = (typeof tiempoHoyObj === 'string') ? tiempoHoyObj : (tiempoHoyObj?.texto || '');

  cont.innerHTML = `
    <div class="home-streaks-strip">
      <!-- 1. Películas -->
      <div class="home-streak-col col-pelis ${rPeliculas.esActivaHoy ? 'active' : ''}" onclick="cambiarCat('Peliculas', 'Películas')" title="${l === 'en' ? 'View movies' : 'Ver películas'}">
        <div class="home-streak-col-header">
          <span class="home-streak-cat-icon icon-pelis">${getHeroIcon("film", "", 13)}</span>
          <span class="home-streak-cat-name">${l === 'en' ? 'Movies' : 'Películas'}</span>
        </div>
        <div class="home-streak-col-stat">
          <span class="home-streak-flame ${rPeliculas.esActivaHoy ? 'active' : ''}">${getHeroIcon("fire", "", 15)}</span>
          <span class="home-streak-val">${rPeliculas.rachaActual}</span>
          <span class="home-streak-unit">${rPeliculas.rachaActual === 1 ? (l === 'en' ? 'day' : 'día') : (l === 'en' ? 'days' : 'días')}</span>
        </div>
        <div class="home-streak-col-action">
          <button type="button" class="btn-streak-pill ${rPeliculas.esActivaHoy ? 'done' : ''}" onclick="event.stopPropagation(); ejecutarAgregadoRapido('Peliculas', 'Películas')" title="${rPeliculas.esActivaHoy ? (l === 'en' ? 'Movie logged today! Click to log another' : '¡Película vista hoy! Toca para registrar otra') : (l === 'en' ? 'Log movie' : 'Anotar película')}">
            ${rPeliculas.esActivaHoy ? getHeroIcon('check', '', 11) : getHeroIcon('plus', '', 11)}
            <span>${rPeliculas.esActivaHoy ? (l === 'en' ? 'Today' : 'Hoy') : (l === 'en' ? 'Log' : 'Anotar')}</span>
          </button>
        </div>
      </div>

      <!-- 2. Música -->
      <div class="home-streak-col col-musica ${rMusica.esActivaHoy ? 'active' : ''}" onclick="cambiarCat('Musica', 'Discos')" title="${l === 'en' ? 'View albums' : 'Ver discos'}">
        <div class="home-streak-col-header">
          <span class="home-streak-cat-icon icon-musica">${getHeroIcon("disc", "", 13)}</span>
          <span class="home-streak-cat-name">${l === 'en' ? 'Music' : 'Música'}</span>
        </div>
        <div class="home-streak-col-stat">
          <span class="home-streak-flame ${rMusica.esActivaHoy ? 'active' : ''}">${getHeroIcon("fire", "", 15)}</span>
          <span class="home-streak-val">${rMusica.rachaActual}</span>
          <span class="home-streak-unit">${rMusica.rachaActual === 1 ? (l === 'en' ? 'day' : 'día') : (l === 'en' ? 'days' : 'días')}</span>
        </div>
        <div class="home-streak-col-action">
          <button type="button" class="btn-streak-pill ${rMusica.esActivaHoy ? 'done' : ''}" onclick="event.stopPropagation(); ejecutarAgregadoRapido('Musica', 'Discos')" title="${rMusica.esActivaHoy ? (l === 'en' ? 'Album logged today! Click to log another' : '¡Disco escuchado hoy! Toca para registrar otro') : (l === 'en' ? 'Log album' : 'Anotar disco')}">
            ${rMusica.esActivaHoy ? getHeroIcon('check', '', 11) : getHeroIcon('plus', '', 11)}
            <span>${rMusica.esActivaHoy ? (l === 'en' ? 'Today' : 'Hoy') : (l === 'en' ? 'Log' : 'Anotar')}</span>
          </button>
        </div>
      </div>

      <!-- 3. Lectura -->
      <div class="home-streak-col col-lectura ${rLectura.esActivaHoy ? 'active' : ''}" onclick="toggleLecturaHoy(event)" style="cursor:pointer;" title="${rLectura.esActivaHoy ? (tiempoHoyTxt ? (l === 'en' ? `Read today: ${tiempoHoyTxt}. Click to adjust or unmark` : `Leído hoy: ${tiempoHoyTxt}. Toca para ajustar tiempo o desmarcar`) : (l === 'en' ? 'Read today! Click to adjust or unmark' : '¡Leído hoy! Toca para ajustar tiempo o desmarcar')) : (l === 'en' ? 'Mark reading today' : 'Registrar lectura de hoy')}">
        <div class="home-streak-col-header">
          <span class="home-streak-cat-icon icon-lectura">${getHeroIcon("book-open", "", 13)}</span>
          <span class="home-streak-cat-name">${l === 'en' ? 'Reading' : 'Lectura'}</span>
        </div>
        <div class="home-streak-col-stat">
          <span class="home-streak-flame ${rLectura.esActivaHoy ? 'active' : ''}">${getHeroIcon("fire", "", 15)}</span>
          <span class="home-streak-val">${rLectura.rachaActual}</span>
          <span class="home-streak-unit">${rLectura.rachaActual === 1 ? (l === 'en' ? 'day' : 'día') : (l === 'en' ? 'days' : 'días')}</span>
        </div>
        <div class="home-streak-col-action" onclick="event.stopPropagation(); toggleLecturaHoy(event)">
          <button type="button" class="btn-streak-pill ${rLectura.esActivaHoy ? 'done' : ''}" onclick="event.stopPropagation(); toggleLecturaHoy(event)" title="${rLectura.esActivaHoy ? (tiempoHoyTxt ? (l === 'en' ? `Read today: ${tiempoHoyTxt}. Click to adjust or unmark` : `Leído hoy: ${tiempoHoyTxt}. Toca para ajustar tiempo o desmarcar`) : (l === 'en' ? 'Read today! Click to adjust or unmark' : '¡Leído hoy! Toca para ajustar tiempo o desmarcar')) : (l === 'en' ? 'Mark reading today' : 'Marcar lectura de hoy')}">
            ${rLectura.esActivaHoy ? getHeroIcon('check', '', 11) : getHeroIcon('plus', '', 11)}
            <span>${rLectura.esActivaHoy ? (tiempoHoyTxt ? formatTiempoPill(tiempoHoyTxt) : (l === 'en' ? 'Today' : 'Hoy')) : (l === 'en' ? 'Mark' : 'Marcar')}</span>
          </button>
        </div>
      </div>
    </div>
  `;

  actualizarBotonLecturaHoyInicio();
}
window.renderizarRachasActualesInicio = renderizarRachasActualesInicio;

function calcularRachaMasAltaGlobal(regs) {
  const l = userPrefs.lang || 'es';
  const allRegs = regs || estado.registros || [];
  const setDayIndices = new Set();

  allRegs.forEach(r => {
    // Solo Películas y Discos desde registros (Series y Juegos NO cuentan)
    if (r && (perteneceASub(r, 'Peliculas', 'Películas') || perteneceASub(r, 'Musica', 'Discos'))) {
      const setR = extraerDayIndicesDeRegistro(r);
      setR.forEach(idx => setDayIndices.add(idx));
    }
  });

  // Sumar días de lectura diaria
  const diasLectura = obtenerDayIndicesDeLecturaDiaria();
  diasLectura.forEach(idx => setDayIndices.add(idx));

  if (!setDayIndices.size) {
    return {
      maxStreak: 0,
      valTxt: '—',
      subTxt: (l === 'en' ? '0 consecutive days' : '0 días seguidos')
    };
  }

  const sortedDays = Array.from(setDayIndices).sort((a, b) => a - b);
  let bestStreak = 0;
  let bestStreakStartIdx = null;
  let bestStreakEndIdx = null;
  let curStreak = 0;
  let curStreakStartIdx = null;
  let lastDayIdx = null;

  for (let i = 0; i < sortedDays.length; i++) {
    const dayIdx = sortedDays[i];
    if (lastDayIdx === null || dayIdx === lastDayIdx + 1) {
      if (curStreak === 0) curStreakStartIdx = dayIdx;
      curStreak++;
    } else {
      curStreak = 1;
      curStreakStartIdx = dayIdx;
    }
    lastDayIdx = dayIdx;

    if (curStreak > bestStreak) {
      bestStreak = curStreak;
      bestStreakStartIdx = curStreakStartIdx;
      bestStreakEndIdx = dayIdx;
    }
  }

  if (bestStreak <= 0) {
    return {
      maxStreak: 0,
      valTxt: '—',
      subTxt: (l === 'en' ? '0 consecutive days' : '0 días seguidos')
    };
  }

  const dStart = new Date(bestStreakStartIdx * 86400000);
  const dEnd = new Date(bestStreakEndIdx * 86400000);
  const fmtD = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  const valTxt = `${bestStreak} ${bestStreak === 1 ? (l === 'en' ? 'day' : 'día') : (l === 'en' ? 'days' : 'días')}`;
  let subTxt = '';
  if (bestStreak === 1) {
    subTxt = (l === 'en' ? `Single day (${fmtD(dEnd)})` : `Racha de 1 día (${fmtD(dEnd)})`);
  } else {
    subTxt = `${fmtD(dStart)} → ${fmtD(dEnd)}`;
  }

  return {
    maxStreak: bestStreak,
    valTxt,
    subTxt,
    startDate: dStart,
    endDate: dEnd
  };
}

function renderizarBannerRachaSubcategoria(cat, sub) {
  const container = document.getElementById('banner-racha-subcategoria');
  const badgeHeader = document.getElementById('badge-racha-header');
  if (container) {
    container.style.display = 'none';
    container.innerHTML = '';
  }

  // NO mostrar insignias de racha en Series ni en Juegos, ni en Watchlists
  if (!cat || !sub || !esCategoriaValidaParaRachas(cat) || (typeof esSubcategoriaWatchlist === 'function' && esSubcategoriaWatchlist(sub))) {
    if (badgeHeader) {
      badgeHeader.style.display = 'none';
      badgeHeader.innerHTML = '';
    }
    if (cat === 'Lecturas' && typeof actualizarBotonLecturaHoyLibros === 'function') {
      actualizarBotonLecturaHoyLibros();
    }
    return;
  }

  const { rachaActual, rachaMasAlta, esActivaHoy } = calcularRachaSubcategoria(cat, sub);
  const l = userPrefs.lang || 'es';
  const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(cat, sub) : null;

  if (badgeHeader) {
    badgeHeader.style.display = 'inline-flex';
    if (rachaActual >= 1) {
      badgeHeader.className = 'badge-racha-header badge-racha-activa';
      if (metaCol) {
        badgeHeader.style.color = metaCol.colorVar;
        badgeHeader.style.background = metaCol.bgVar;
        badgeHeader.style.borderColor = metaCol.borderVar;
      } else {
        badgeHeader.style.color = '#f59e0b';
        badgeHeader.style.background = 'rgba(245, 158, 11, 0.16)';
        badgeHeader.style.borderColor = 'rgba(245, 158, 11, 0.38)';
      }
      badgeHeader.innerHTML = `${getHeroIcon('fire', '', 13)} <span>${rachaActual}d</span>`;
      const txtRecord = (rachaActual >= rachaMasAlta)
        ? (l === 'en' ? 'New record!' : '¡Nuevo récord!')
        : `${l === 'en' ? 'Record' : 'Récord'}: ${rachaMasAlta}d`;
      badgeHeader.title = (l === 'en' ? `Active streak: ${rachaActual}d · ${txtRecord}` : `Racha activa: ${rachaActual}d · ${txtRecord}`);
    } else {
      badgeHeader.className = 'badge-racha-header badge-racha-cero';
      badgeHeader.style.color = 'var(--muted)';
      badgeHeader.style.background = 'rgba(148, 163, 184, 0.1)';
      badgeHeader.style.borderColor = 'rgba(148, 163, 184, 0.25)';
      badgeHeader.innerHTML = `${getHeroIcon('bolt', '', 13)} <span>0d</span>`;
      const txtRecord = rachaMasAlta > 0 ? ` · ${l === 'en' ? 'Record' : 'Récord'}: ${rachaMasAlta}d` : '';
      badgeHeader.title = (l === 'en' ? `No active streak today${txtRecord}` : `Sin racha activa hoy${txtRecord}`);
    }
  }

  if (cat === 'Lecturas' && typeof actualizarBotonLecturaHoyLibros === 'function') {
    actualizarBotonLecturaHoyLibros();
  }
}
window.renderizarBannerRachaSubcategoria = renderizarBannerRachaSubcategoria;

function calcularYMostrarEstadisticasPerfil() {
  try {
    const regs = estado.registros;
    setTimeout(() => {
      if (typeof resolverHorasVistasFaltantes === "function") resolverHorasVistasFaltantes(regs);
    }, 150);
    if (typeof renderizarEstadisticasPerfil === "function") {
      renderizarEstadisticasPerfil();
    }
    if (typeof aplicarEstilosGlobales === "function") {
      aplicarEstilosGlobales();
    }
  } catch(err) {
    console.error("Error en calcularYMostrarEstadisticasPerfil:", err);
  }
}

