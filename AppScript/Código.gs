const TMDB_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb'; const RAWG_KEY = 'c542e67aec3a4340908f9de9e86038af'; const SUPABASE_URL = 'https://cpksupowjteqilsiklde.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3N1cG93anRlcWlsc2lrbGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NzIxMTUsImV4cCI6MjEwOTA0ODExNX0.-ojqwNdX7wXkCUGDU6wHComRNi2Uy-XrWket6zeEAVU';
const SUPABASE_PUB_KEY = 'sb_publishable_fMwiM4Uz3zjIfpVYADlPcw_JqNiBEHo'; const doGet = () => HtmlService.createHtmlOutputFromFile('Index') .setTitle('✨ MediaBook') .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); function sbReq_(endpoint, method = 'get', payload = null, prefer = 'return=representation') { const opts = { method: method.toLowerCase(), muteHttpExceptions: true, headers: { 'apikey': SUPABASE_KEY,
'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': prefer
}
}; if (payload !== null) opts.payload = JSON.stringify(payload); const res = UrlFetchApp.fetch(`${SUPABASE_URL}/${endpoint}`, opts); const code = res.getResponseCode(); const txt = res.getContentText(); if (code >= 200 && code < 300) { if (!txt) return [];
try { return JSON.parse(txt); } catch (e) { return []; }
}
throw new Error(`Supabase (${code}): ${txt}`); }
function normEmail_(em) { return String(em || '').trim().toLowerCase(); }
function hashPass_(raw) { if (!raw) return ''; const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(raw) + '_mb_salt_v1', Utilities.Charset.UTF_8); return digest.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join(''); }
function obtenerEmailGoogleActivo_() { try { const active = Session.getActiveUser().getEmail(); if (active) return normEmail_(active); } catch (e) {}
return ''; }
function resolverUserEmail_(userEmailParam) { const limpio = normEmail_(userEmailParam); if (limpio) return limpio; const gActivo = obtenerEmailGoogleActivo_(); if (gActivo) return gActivo; return ''; }
function autenticarUsuarioSupabase(datos) { try { const modo = datos?.modo || 'login'; const email = normEmail_(datos?.email); const pass = String(datos?.password || ''); if (!email) return { exito: false, error: 'Ingresa tu correo o nombre de usuario.' };
const passHash = pass ? hashPass_(pass) : ''; const q = `perfiles?user_email=eq.${encodeURIComponent(email)}&select=*`; const existentes = sbReq_(q, 'get'); const actual = existentes && existentes[0] ? existentes[0] : null; if (modo === 'registro') {
if (actual && actual.preferencias?.passwordHash) { return { exito: false, error: 'Esta cuenta ya existe. Inicia sesión con tu contraseña o con Google.' }; }
if (!pass || pass.length < 3) { return { exito: false, error: 'Crea una contraseña de al menos 3 caracteres.' }; }
const nickDefault = (datos?.nickname || '').trim() || (email.includes('@') ? email.split('@')[0] : email); const prefs = Object.assign({}, actual?.preferencias || {}, { passwordHash: passHash, authMethod: email.endsWith('@gmail.com') ? 'google_password' : 'password' }); const nuevo = {
user_email: email, nickname: nickDefault, bio: actual?.bio || 'Coleccionando historias en MediaBook ✨', avatar: actual?.avatar || '🎬', favoritos: actual?.favoritos || {}, favoritos_ocultos: actual?.favoritos_ocultos || {}, preferencias: prefs, updated_at: new Date().toISOString()
}; sbReq_('perfiles?on_conflict=user_email', 'post', nuevo, 'resolution=merge-duplicates,return=representation'); return obtenerPerfilUsuario(email); }
if (modo === 'google') { const emailG = email || obtenerEmailGoogleActivo_(); if (!emailG) { return { exito: false, necesitaInputGoogle: true, error: 'Confirma tu correo de Google para vincular tu sesión.' }; }
if (actual && actual.preferencias?.passwordHash && passHash && actual.preferencias.passwordHash !== passHash) { return { exito: false, error: 'La contraseña de esta cuenta no coincide.' }; }
if (!actual) { const nickG = (datos?.nickname || '').trim() || emailG.split('@')[0]; const prefsG = passHash ? { passwordHash: passHash, authMethod: 'google' } : { authMethod: 'google' }; sbReq_('perfiles?on_conflict=user_email', 'post', { user_email: emailG, nickname: nickG,
bio: 'Coleccionando historias en MediaBook ✨', avatar: datos?.avatar || '🎬', favoritos: {}, favoritos_ocultos: {}, preferencias: prefsG, updated_at: new Date().toISOString()
}, 'resolution=merge-duplicates,return=representation'); } else if (passHash && !actual.preferencias?.passwordHash) { const prefsUpd = Object.assign({}, actual.preferencias || {}, { passwordHash: passHash, authMethod: 'google' });
sbReq_(`perfiles?user_email=eq.${encodeURIComponent(emailG)}`, 'patch', { preferencias: prefsUpd, updated_at: new Date().toISOString() }); }
return obtenerPerfilUsuario(emailG); }
// modo === 'login'
if (!actual) { return { exito: false, error: 'No existe una cuenta con ese correo/usuario. Pulsa en "Crear cuenta" o "Continuar con Google".' }; }
const savedHash = actual.preferencias?.passwordHash || ''; if (savedHash && savedHash !== passHash) { return { exito: false, error: 'Contraseña incorrecta.' }; }
if (!savedHash && passHash) { const prefsUpd = Object.assign({}, actual.preferencias || {}, { passwordHash: passHash }); sbReq_(`perfiles?user_email=eq.${encodeURIComponent(email)}`, 'patch', { preferencias: prefsUpd, updated_at: new Date().toISOString() }); }
return obtenerPerfilUsuario(email); } catch (e) { return { exito: false, error: e.toString() }; }
}
function obtenerPerfilUsuario(userEmail) { try { const email = resolverUserEmail_(userEmail); if (!email) {
return { exito: false, sinSesion: true, emailGoogle: '', logueadoGoogle: false, nickname: 'Invitado', avatar: '👤', bio: 'Inicia sesión para guardar tus listas en Supabase ✨', favoritos: {}, favoritosOcultos: {} }; }
const rows = sbReq_(`perfiles?user_email=eq.${encodeURIComponent(email)}&select=*`, 'get'); if (rows && rows.length > 0) { const p = rows[0]; return { exito: true, emailGoogle: p.user_email, logueadoGoogle: true, nickname: p.nickname || email.split('@')[0], avatar: p.avatar || '🎬',
bio: p.bio || 'Coleccionando historias en MediaBook ✨', favoritos: p.favoritos || {}, favoritosOcultos: p.favoritos_ocultos || {}, preferencias: p.preferencias || {}
}; }
const nuevo = { user_email: email, nickname: email.includes('@') ? email.split('@')[0] : email, bio: 'Coleccionando historias en MediaBook ✨', avatar: '🎬', favoritos: {}, favoritos_ocultos: {}, preferencias: { authMethod: 'google' }, updated_at: new Date().toISOString()
}; sbReq_('perfiles?on_conflict=user_email', 'post', nuevo, 'resolution=merge-duplicates,return=representation'); return { exito: true, emailGoogle: email, logueadoGoogle: true, nickname: nuevo.nickname, avatar: nuevo.avatar, bio: nuevo.bio, favoritos: {}, favoritosOcultos: {},
preferencias: nuevo.preferencias
}; } catch (e) { return { exito: false, error: e.toString(), emailGoogle: userEmail || '', logueadoGoogle: false, nickname: 'Usuario MediaBook', avatar: '🎬', bio: '', favoritos: {}, favoritosOcultos: {} }; }
}
function iniciarSesionConGoogle(emailManual, passwordOpcional) { const emailDetectado = normEmail_(emailManual) || obtenerEmailGoogleActivo_(); if (!emailDetectado) { return { exito: false, necesitaInputGoogle: true }; }
return autenticarUsuarioSupabase({ modo: 'google', email: emailDetectado, password: passwordOpcional || '' }); }
function guardarPerfilUsuario(datos, userEmail) { try { const email = resolverUserEmail_(userEmail || datos?.emailGoogle); if (!email) return { exito: false, error: 'Inicia sesión primero para guardar tu perfil.' };
const existentes = sbReq_(`perfiles?user_email=eq.${encodeURIComponent(email)}&select=*`, 'get'); const actual = existentes && existentes[0] ? existentes[0] : {}; const payload = { user_email: email,
nickname: datos.nickname !== undefined ? String(datos.nickname) : (actual.nickname || email.split('@')[0]), bio: datos.bio !== undefined ? String(datos.bio) : (actual.bio || 'Coleccionando historias en MediaBook ✨'),
avatar: datos.avatar !== undefined ? String(datos.avatar) : (actual.avatar || '🎬'), favoritos: datos.favoritos !== undefined ? datos.favoritos : (actual.favoritos || {}), favoritos_ocultos: datos.favoritosOcultos !== undefined ? datos.favoritosOcultos : (actual.favoritos_ocultos || {}),
preferencias: datos.preferencias !== undefined ? Object.assign({}, actual.preferencias || {}, datos.preferencias) : (actual.preferencias || {}), updated_at: new Date().toISOString()
}; sbReq_('perfiles?on_conflict=user_email', 'post', payload, 'resolution=merge-duplicates,return=representation'); return { exito: true, emailGoogle: email }; } catch (e) { return { exito: false, error: e.toString() }; }
}
function formatearAFechaChilena(v) { if (!v || v === 'Sin fecha' || v === '') return 'Sin fecha'; if (v instanceof Date) return `${String(v.getDate()).padStart(2,'0')}/${String(v.getMonth()+1).padStart(2,'0')}/${v.getFullYear()}`; const s = String(v).trim();
if (s === 'Sin fecha') return 'Sin fecha'; if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) { const p = s.split('/'); return `${p[0].padStart(2,'0')}/${p[1].padStart(2,'0')}/${p[2]}`; }
if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const p = s.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }
const d = new Date(s); return isNaN(d.getTime()) ? s : `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }
const parsearTimestampFecha = v => { if (!v || v === 'Sin fecha') return 0; const p = String(v).split('/'); return p.length === 3 ? new Date(p[2], p[1] - 1, p[0]).getTime() : (new Date(v).getTime() || 0); }; function guardarRegistro(d, userEmail) { try {
const email = resolverUserEmail_(userEmail || d?.userEmail); if (!email) return { exito: false, error: 'Inicia sesión para guardar registros.' }; const rows = []; const buildObj = o => ({ id: Utilities.getUuid(), user_email: email, categoria: o.categoria || '', subcategoria: o.subcategoria || '',
titulo: o.titulo || 'Sin título', subtitulo: o.subtitulo || '', creador: o.creador || '', anio: String(o.anio || ''), fecha_inicio: o.fechaInicio === 'Sin fecha' ? 'Sin fecha' : formatearAFechaChilena(o.fechaInicio),
fecha_fin: o.fechaFin === 'Sin fecha' ? 'Sin fecha' : formatearAFechaChilena(o.fechaFin), calificacion: Number(o.calificacion) || 0, comentario: o.comentario || '', poster: o.poster || '', horas: o.horas || '', es_rewatch: !!o.esRewatch
}); rows.push(buildObj(d)); if (d.esTemporadaUnica && d.categoria === 'Series' && (d.subcategoria === 'Temporadas' || d.subcategoria.includes('Temporada'))) {
rows.push(buildObj(Object.assign({}, d, { subcategoria: 'Series Completas', titulo: d.tituloBase || d.titulo.replace(/\s*\[S\d+\]$/, '') }))); }
sbReq_('registros', 'post', rows); let estabaEnWatchlist = false, tituloWatchlist = ''; try { const wData = sbReq_(`watchlist?user_email=eq.${encodeURIComponent(email)}&categoria=eq.${encodeURIComponent(d.categoria || '')}&select=*`, 'get') || [];
const titNorm = String(d.tituloBase || d.titulo || '').toLowerCase().replace(/\s*\[s\d+\]$/i, '').trim(); wData.forEach(w => { const itemTit = String(w.titulo || '').toLowerCase().trim(); if (itemTit === titNorm || (itemTit && (titNorm.startsWith(itemTit) || itemTit.startsWith(titNorm)))) {
estabaEnWatchlist = true; tituloWatchlist = String(w.titulo); sbReq_(`watchlist?id=eq.${encodeURIComponent(w.id)}&user_email=eq.${encodeURIComponent(email)}`, 'delete'); }
}); } catch (eWatch) {}
return { exito: true, removidoDeWatchlist: estabaEnWatchlist, tituloRemovido: tituloWatchlist }; } catch (e) { return { exito: false, error: e.toString() }; }
}
function importarRegistrosMasivos(lista, userEmail) { try { const email = resolverUserEmail_(userEmail); if (!email) return { exito: false, error: 'Inicia sesión primero para importar registros.' }; if (!Array.isArray(lista) || !lista.length) return { exito: false, error: 'Lista vacía' };
const buscarPosterAuto = lista.length <= 20; const nuevasFilas = lista.map(o => { const cat = String(o.categoria || 'Peliculas').trim(), sub = String(o.subcategoria || 'Películas').trim(); const tit = String(o.titulo || 'Sin título').trim(), subtit = String(o.subtitulo || '').trim();
const creador = String(o.creador || 'Desconocido').trim(), anio = String(o.anio || '').trim(); const fIni = (!o.fechaInicio || o.fechaInicio === 'Sin fecha') ? 'Sin fecha' : formatearAFechaChilena(o.fechaInicio);
const fFin = (!o.fechaFin || o.fechaFin === 'Sin fecha') ? fIni : formatearAFechaChilena(o.fechaFin); const calif = isNaN(Number(o.calificacion)) ? 0 : Number(o.calificacion); let com = String(o.comentario || '').trim(); if (com && !/[.!?:;]$/.test(com)) com += '.';
let poster = String(o.poster || '').trim(); if (!poster && buscarPosterAuto) { try { poster = buscarPortadaGenerica(tit, creador !== 'Desconocido' ? creador : '', cat) || ''; } catch (e) {}
}
let horas = String(o.horas || '').trim(); if (horas && /^\d+(\.\d+)?$/.test(horas)) horas = `${horas} hrs`; const esRw = (o.esRewatch === true || /^(s[ií]|yes|true|1|rewatch)$/i.test(String(o.esRewatch || '').trim())); return { id: Utilities.getUuid(), user_email: email, categoria: cat,
subcategoria: sub, titulo: tit, subtitulo: subtit, creador: creador, anio: anio, fecha_inicio: fIni, fecha_fin: fFin, calificacion: calif, comentario: com, poster: poster, horas: horas, es_rewatch: esRw
}; }); sbReq_('registros', 'post', nuevasFilas); return { exito: true, insertados: nuevasFilas.length }; } catch (e) { return { exito: false, error: e.toString() }; }
}
function actualizarRegistro(id, c, userEmail) { try { const email = resolverUserEmail_(userEmail); const target = String(id || '').trim(); if (!target) return { exito: false, error: 'ID inválido' }; const patch = {};
if (c.fechaInicio !== undefined) patch.fecha_inicio = c.fechaInicio === 'Sin fecha' ? 'Sin fecha' : formatearAFechaChilena(c.fechaInicio); if (c.fechaFin !== undefined) patch.fecha_fin = c.fechaFin === 'Sin fecha' ? 'Sin fecha' : formatearAFechaChilena(c.fechaFin);
if (c.calificacion !== undefined) patch.calificacion = Number(c.calificacion) || 0; if (c.comentario !== undefined) patch.comentario = c.comentario; if (c.horas !== undefined) patch.horas = c.horas; if (c.esRewatch !== undefined) patch.es_rewatch = !!c.esRewatch;
const filtroEmail = email ? `&user_email=eq.${encodeURIComponent(email)}` : ''; sbReq_(`registros?id=eq.${encodeURIComponent(target)}${filtroEmail}`, 'patch', patch); return { exito: true }; } catch (e) { return { exito: false, error: e.toString() }; }
}
function eliminarRegistro(id, fallbackInfo, userEmail) { try { const email = resolverUserEmail_(userEmail); const targetId = String(id || '').trim(); const filtroEmail = email ? `&user_email=eq.${encodeURIComponent(email)}` : ''; if (targetId) {
sbReq_(`registros?id=eq.${encodeURIComponent(targetId)}${filtroEmail}`, 'delete'); return { exito: true }; }
if (fallbackInfo && fallbackInfo.titulo && email) { sbReq_(`registros?user_email=eq.${encodeURIComponent(email)}&titulo=eq.${encodeURIComponent(fallbackInfo.titulo)}`, 'delete'); return { exito: true }; }
return { exito: false, error: 'Registro no encontrado' }; } catch (e) { return { exito: false, error: e.toString() }; }
}
function obtenerRegistros(userEmail) { try { const email = resolverUserEmail_(userEmail); if (!email) return []; const data = sbReq_(`registros?user_email=eq.${encodeURIComponent(email)}&select=*&order=created_at.asc`, 'get') || []; const lista = data.map(r => ({ id: String(r.id || ''),
categoria: String(r.categoria || ''), subcategoria: String(r.subcategoria || ''), titulo: String(r.titulo || ''), subtitulo: String(r.subtitulo || ''), creador: String(r.creador || ''), anio: String(r.anio || ''), fechaInicio: formatearAFechaChilena(r.fecha_inicio),
fechaFin: formatearAFechaChilena(r.fecha_fin), calificacion: Number(r.calificacion) || 0, comentario: String(r.comentario || ''), poster: String(r.poster || ''), horas: String(r.horas || ''), esRewatch: !!r.es_rewatch || String(r.subcategoria || '').includes('Rewatch')
})); return lista.sort((a, b) => { const vA = (a.fechaFin && a.fechaFin !== 'Sin fecha') ? parsearTimestampFecha(a.fechaFin) : parsearTimestampFecha(a.fechaInicio); const vB = (b.fechaFin && b.fechaFin !== 'Sin fecha') ? parsearTimestampFecha(b.fechaFin) : parsearTimestampFecha(b.fechaInicio);
return vA - vB; }); } catch (e) { return []; }
}
function obtenerWatchlist(userEmail) { try { const email = resolverUserEmail_(userEmail); if (!email) return []; const data = sbReq_(`watchlist?user_email=eq.${encodeURIComponent(email)}&select=*&order=created_at.asc`, 'get') || []; return data.map(r => ({ id: String(r.id || ''),
categoria: String(r.categoria || ''), subcategoria: String(r.subcategoria || ''), titulo: String(r.titulo || ''), subtitulo: String(r.subtitulo || ''), creador: String(r.creador || ''), anio: String(r.anio || ''), poster: String(r.poster || ''),
fechaAgregado: formatearAFechaChilena(r.fecha_agregado)
})); } catch (e) { return []; }
}
function guardarEnWatchlist(item, userEmail) { try { const email = resolverUserEmail_(userEmail || item?.userEmail); if (!email) return { exito: false, error: 'Inicia sesión para guardar en tu Watchlist.' }; const hoy = new Date();
const fechaTxt = `${String(hoy.getDate()).padStart(2,'0')}/${String(hoy.getMonth()+1).padStart(2,'0')}/${hoy.getFullYear()}`; sbReq_('watchlist', 'post', { id: Utilities.getUuid(), user_email: email, categoria: item.categoria || '', subcategoria: item.subcategoria || '',
titulo: item.titulo || 'Sin título', subtitulo: item.subtitulo || '', creador: item.creador || '', anio: String(item.anio || ''), poster: item.poster || '', fecha_agregado: fechaTxt
}); return { exito: true }; } catch (e) { return { exito: false, error: e.toString() }; }
}
function eliminarDeWatchlist(id, userEmail) { try { const email = resolverUserEmail_(userEmail); const filtroEmail = email ? `&user_email=eq.${encodeURIComponent(email)}` : ''; sbReq_(`watchlist?id=eq.${encodeURIComponent(String(id))}${filtroEmail}`, 'delete'); return { exito: true }; } catch (e) {
return { exito: false, error: e.toString() }; }
}
// --- MIGRACIÓN EN 1 CLIC DESDE GOOGLE SHEETS ACTUAL A SUPABASE ---
function migrarDatosSheetsASupabase(userEmail) { try { const email = resolverUserEmail_(userEmail); if (!email) return { exito: false, error: 'Debes iniciar sesión en una cuenta antes de migrar.' }; const ss = SpreadsheetApp.getActiveSpreadsheet();
if (!ss) return { exito: false, error: 'No se encontró un Google Sheet activo vinculado.' }; let regCount = 0, wlCount = 0;
// 1. Migrar hoja Registros
const sReg = ss.getSheetByName('Registros'); if (sReg && sReg.getLastRow() > 1) { const d = sReg.getDataRange().getValues(); const payloadRegs = d.slice(1).filter(r => r[1] || r[3]).map(r => { const rwVal = String(r[13] || '').toUpperCase(); return {
id: String(r[0] || '').trim() || Utilities.getUuid(), user_email: email, categoria: String(r[1] || 'Peliculas'), subcategoria: String(r[2] || 'Películas'), titulo: String(r[3] || 'Sin título'), subtitulo: String(r[4] || ''), creador: String(r[5] || 'Desconocido'), anio: String(r[6] || ''),
fecha_inicio: formatearAFechaChilena(r[7]), fecha_fin: formatearAFechaChilena(r[8]), calificacion: Number(r[9]) || 0, comentario: String(r[10] || ''), poster: String(r[11] || ''), horas: String(r[12] || ''),
es_rewatch: rwVal === 'SÍ' || rwVal === 'SI' || rwVal === 'YES' || String(r[2] || '').includes('Rewatch')
}; }); if (payloadRegs.length) { sbReq_('registros?on_conflict=id', 'post', payloadRegs, 'resolution=merge-duplicates,return=representation'); regCount = payloadRegs.length; }
}
// 2. Migrar hoja Watchlist
const sWl = ss.getSheetByName('Watchlist'); if (sWl && sWl.getLastRow() > 1) { const w = sWl.getDataRange().getValues(); const payloadWl = w.slice(1).filter(r => r[1] || r[3]).map(r => ({ id: String(r[0] || '').trim() || Utilities.getUuid(), user_email: email, categoria: String(r[1] || 'Peliculas'),
subcategoria: String(r[2] || 'Watchlist'), titulo: String(r[3] || 'Sin título'), subtitulo: String(r[4] || ''), creador: String(r[5] || 'Desconocido'), anio: String(r[6] || ''), poster: String(r[7] || ''), fecha_agregado: formatearAFechaChilena(r[8])
})); if (payloadWl.length) { sbReq_('watchlist?on_conflict=id', 'post', payloadWl, 'resolution=merge-duplicates,return=representation'); wlCount = payloadWl.length; }
}
// 3. Migrar hoja Perfil (si existe)
const sPerf = ss.getSheetByName('Perfil'); if (sPerf && sPerf.getLastRow() > 1) { const pData = sPerf.getDataRange().getValues(), mapa = {}; for (let i = 1; i < pData.length; i++) if (pData[i][0]) mapa[String(pData[i][0])] = String(pData[i][1] || ''); let favs = {}, favsOc = {};
try { if (mapa.favoritos) favs = JSON.parse(mapa.favoritos); } catch (e) {}
try { if (mapa.favoritosOcultos) favsOc = JSON.parse(mapa.favoritosOcultos); } catch (e) {}
const existentes = sbReq_(`perfiles?user_email=eq.${encodeURIComponent(email)}&select=*`, 'get'); const actual = existentes && existentes[0] ? existentes[0] : {}; sbReq_('perfiles?on_conflict=user_email', 'post', { user_email: email, nickname: mapa.nickname || actual.nickname || email.split('@')[0],
bio: mapa.bio || actual.bio || 'Coleccionando historias en MediaBook ✨', avatar: mapa.avatar || actual.avatar || '🎬', favoritos: Object.assign({}, actual.favoritos || {}, favs), favoritos_ocultos: Object.assign({}, actual.favoritos_ocultos || {}, favsOc), preferencias: actual.preferencias || {},
updated_at: new Date().toISOString()
}, 'resolution=merge-duplicates,return=representation'); }
return { exito: true, registrosMigrados: regCount, watchlistMigrados: wlCount }; } catch (e) { return { exito: false, error: e.toString() }; }
}
function fetchJson(u, headers = {}) { try { const r = UrlFetchApp.fetch(u, { method: 'get', muteHttpExceptions: true, headers }); return r.getResponseCode() === 200 ? JSON.parse(r.getContentText()) : null; } catch (e) { return null; }
}
function formatearTitulosIdioma(origTitle, engTitle, origLang) { const tOrig = String(origTitle || engTitle || '').trim(), tEng = String(engTitle || '').trim(), lang = String(origLang || '').toLowerCase();
const mostrarIngles = (lang && lang !== 'en' && lang !== 'es') && tEng && tEng.toLowerCase() !== tOrig.toLowerCase(); return { titulo: tOrig, tituloOriginal: tOrig, tituloIngles: mostrarIngles ? tEng : '' }; }
function obtenerDescubrimientos(seedPage) { const datos = { peliculas: [], documentales: [], series: [], docuseries: [], musica: [], juegos: [], libros: [], comics: [], mangas: [], timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
const p1 = seedPage ? ((Number(seedPage) % 4) + 1) : 1, p2 = p1 + 1, offK1 = (p1 - 1) * 20, offOl = (p1 - 1) * 12; const urls = [ `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&language=en-US&page=${p1}`,
`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&primary_release_date.gte=2024-01-01&sort_by=popularity.desc&vote_count.gte=40&language=en-US&page=${p2}`,
`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=99&primary_release_date.gte=2022-01-01&sort_by=popularity.desc&language=en-US&page=${p1}`, `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=99&sort_by=vote_count.desc&language=en-US&page=${p2}`,
`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}&language=en-US&page=${p1}`, `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY}&first_air_date.gte=2023-01-01&sort_by=popularity.desc&vote_count.gte=30&language=en-US&page=${p2}`,
`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY}&with_genres=99&first_air_date.gte=2021-01-01&sort_by=popularity.desc&language=en-US&page=${p1}`, `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY}&with_genres=99&sort_by=vote_count.desc&language=en-US&page=${p2}`,
`https://api.deezer.com/chart/0/albums?index=${offOl}&limit=14`, `https://api.deezer.com/chart/0/artists?index=${offOl}&limit=14`, `https://api.rawg.io/api/games?key=${RAWG_KEY}&dates=2023-01-01,2026-12-31&ordering=-added&page_size=24&page=${p1}`,
`https://openlibrary.org/subjects/fiction.json?limit=24&offset=${offOl}`, `https://openlibrary.org/subjects/graphic_novels.json?limit=24&offset=${offOl}`, `https://kitsu.io/api/edge/manga?sort=-user_count&page[limit]=20&page[offset]=${offK1}`,
`https://kitsu.io/api/edge/manga?sort=-user_count&page[limit]=10&page[offset]=${offK1 + 20}` ]; try { const responses = UrlFetchApp.fetchAll(urls.map(u => ({ url: u, method: 'get', muteHttpExceptions: true })));
const parseRes = idx => { try { const r = responses[idx]; return (r && r.getResponseCode() === 200) ? JSON.parse(r.getContentText()) : null; } catch (e) { return null; } }; const pushTmdb = (i1, i2, arr, cat, sub, defCr, isTv) => { const vistos = new Set();
[...(parseRes(i1)?.results || []), ...(parseRes(i2)?.results || [])].forEach(x => { if (!x || !x.poster_path || vistos.has(x.id) || arr.length >= 24) return; vistos.add(x.id);
const tits = formatearTitulosIdioma(isTv ? x.original_name : x.original_title, isTv ? x.name : x.title, x.original_language); const f = isTv ? x.first_air_date : x.release_date;
arr.push({ categoria: cat, subcategoria: sub, titulo: tits.titulo, tituloOriginal: tits.tituloOriginal, tituloIngles: tits.tituloIngles, creador: defCr, anio: f ? f.substring(0, 4) : '', sinopsis: x.overview || '', poster: `https://image.tmdb.org/t/p/w500${x.poster_path}` }); }); };
pushTmdb(0, 1, datos.peliculas, 'Peliculas', 'Películas', 'Cine', false); pushTmdb(2, 3, datos.documentales, 'Peliculas', 'Documentales', 'Documental', false); pushTmdb(4, 5, datos.series, 'Series', 'Series Completas', 'Serie TV', true);
pushTmdb(6, 7, datos.docuseries, 'Series', 'Series Documentales', 'Docuserie', true); const dzAlbums = parseRes(8)?.data || [], dzArtists = parseRes(9)?.data || []; for (let i = 0; i < Math.max(dzAlbums.length, dzArtists.length); i++) { if (dzAlbums[i] && datos.musica.length < 24) {
const al = dzAlbums[i]; datos.musica.push({ categoria: 'Musica', subcategoria: 'Discos', titulo: al.title, tituloOriginal: al.title, tituloIngles: '', creador: al.artist?.name || 'Artista', anio: 'Disco', poster: al.cover_big || al.cover_medium || '' }); }
if (dzArtists[i] && datos.musica.length < 24) { const a = dzArtists[i]; datos.musica.push({ categoria: 'Musica', subcategoria: 'Artistas/Grupos', titulo: a.name, tituloOriginal: a.name, tituloIngles: '', creador: 'Artista / Grupo', anio: '', poster: a.picture_big || a.picture_medium || '' }); }
}
datos.juegos = (parseRes(10)?.results || []).slice(0, 24).map(g => ({ categoria: 'Juegos', subcategoria: 'Videojuegos', titulo: g.name, tituloOriginal: g.name, tituloIngles: '',
creador: (g.genres || []).map(x => x.name).slice(0, 2).join(', ') || 'Videojuego', anio: g.released ? g.released.substring(0, 4) : '', poster: g.background_image || ''
})); const mapOl = (idx, sub, defTit, defCr) => (parseRes(idx)?.works || []).slice(0, 24).map(b => ({ categoria: 'Lecturas', subcategoria: sub, titulo: b.title || defTit, tituloOriginal: b.title || defTit, tituloIngles: '',
creador: b.authors?.[0]?.name || defCr, anio: b.first_publish_year ? String(b.first_publish_year) : '', poster: b.cover_id ? `https://covers.openlibrary.org/b/id/${b.cover_id}-M.jpg` : ''
})); datos.libros = mapOl(11, 'Libros', 'Libro', 'Autor'); datos.comics = mapOl(12, 'Cómics', 'Cómic', 'Escritor / Artista'); const mIds = new Set(); [...(parseRes(13)?.data || []), ...(parseRes(14)?.data || [])].forEach(it => { if (!it || mIds.has(it.id) || datos.mangas.length >= 24) return;
mIds.add(it.id); const a = it.attributes || {}, tOrig = a.titles?.en_jp || a.canonicalTitle || a.titles?.ja_jp || 'Manga', tEng = a.titles?.en || ''; datos.mangas.push({
categoria: 'Lecturas', subcategoria: 'Mangas', titulo: tOrig, tituloOriginal: tOrig, tituloIngles: (tEng && tEng.toLowerCase() !== tOrig.toLowerCase()) ? tEng : '', creador: a.status === 'current' ? 'Manga en publicación' : 'Manga',
anio: a.startDate ? a.startDate.substring(0, 4) : '', sinopsis: a.synopsis || '', poster: a.posterImage?.medium || a.posterImage?.small || ''
}); }); } catch (e) {}
return datos; }
function obtenerDatosSerieInfo(showId, numTemp) { try { const seasons = fetchJson(`https://api.tvmaze.com/shows/${showId}/seasons`); if (seasons?.length) { const s = seasons.find(x => Number(x.number) === Number(numTemp));
return { anioFinTemp: (s?.endDate || s?.premiereDate || '').substring(0, 4), totalTemporadas: seasons.length }; }
} catch (e) {}
return { anioFinTemp: '', totalTemporadas: 0 }; }
function buscarPortadaGenerica(t, cr, cat) { if (!t) return ''; const q = encodeURIComponent(t.trim()), qC = encodeURIComponent(`${t} ${cr||''}`.trim()); try { if (cat === 'Peliculas') { const d = fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${q}`);
if (d?.results?.[0]?.poster_path) return `https://image.tmdb.org/t/p/w500${d.results[0].poster_path}`; } else if (cat === 'Series') { const d = fetchJson(`https://api.tvmaze.com/search/shows?q=${q}`); if (d?.[0]?.show?.image) return d[0].show.image.original || d[0].show.image.medium || '';
} else if (cat === 'Musica') { const it = fetchJson(`https://itunes.apple.com/search?term=${qC}&entity=album&limit=1`); if (it?.results?.[0]?.artworkUrl100) return it.results[0].artworkUrl100.replace('100x100bb', '600x600bb'); const d = fetchJson(`https://api.deezer.com/search?q=${qC}&limit=1`);
return d?.data?.[0]?.album?.cover_big || d?.data?.[0]?.artist?.picture_big || ''; } else if (cat === 'Juegos') { const d = fetchJson(`https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${q}&page_size=1`); return d?.results?.[0]?.background_image || ''; } else if (cat === 'Lecturas') {
const ol = fetchJson(`https://openlibrary.org/search.json?q=${qC}&limit=1`); if (ol?.docs?.[0]?.cover_i) return `https://covers.openlibrary.org/b/id/${ol.docs[0].cover_i}-L.jpg`; const gb = fetchJson(`https://www.googleapis.com/books/v1/volumes?q=${qC}&maxResults=1`);
return (gb?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail || '').replace('http://', 'https://'); }
} catch (e) {}
return ''; }
function obtenerDetalleTecnicoModal(titulo, creador, cat, sub) { const res = { titulo: titulo || '', subtitulo: '', poster: '', fechaEstreno: 'No registrada', directores: '', escritores: '', actores: '', sinopsis: 'Sin sinopsis disponible.' };
const q = encodeURIComponent(titulo.replace(/\s*\[S\d+\]$/, '').split(':')[0].trim()); try { if (cat === 'Peliculas') { const m = fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${q}&language=es-ES`)?.results?.[0]; if (m) {
res.poster = m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : ''; res.fechaEstreno = m.release_date ? formatearAFechaChilena(m.release_date) : ''; res.sinopsis = m.overview || res.sinopsis;
const credits = fetchJson(`https://api.themoviedb.org/3/movie/${m.id}/credits?api_key=${TMDB_KEY}`); if (credits) { const dirs = (credits.crew || []).filter(x => x.job === 'Director').map(x => x.name);
const writers = (credits.crew || []).filter(x => ['Screenplay','Writer','Story'].includes(x.job)).map(x => x.name); res.directores = dirs.length ? dirs.join(', ') : creador; res.escritores = Array.from(new Set(writers)).join(', ');
res.actores = (credits.cast || []).slice(0, 5).map(x => x.name).join(', '); }
}
} else if (cat === 'Series') { const s = fetchJson(`https://api.tvmaze.com/search/shows?q=${q}`)?.[0]?.show; if (s) { res.poster = s.image?.original || s.image?.medium || ''; res.fechaEstreno = s.premiered ? formatearAFechaChilena(s.premiered) : '';
res.sinopsis = s.summary ? s.summary.replace(/<[^>]*>?/gm, '') : res.sinopsis; const crew = fetchJson(`https://api.tvmaze.com/shows/${s.id}/crew`) || [], cast = fetchJson(`https://api.tvmaze.com/shows/${s.id}/cast`) || [];
const crs = crew.filter(x => x.type === 'Creator' || x.type === 'Showrunner').map(x => x.person?.name).filter(Boolean); const wrs = crew.filter(x => /writer|story/i.test(x.type || '')).map(x => x.person?.name).filter(Boolean);
res.directores = crs.length ? Array.from(new Set(crs)).join(', ') : creador; res.escritores = Array.from(new Set(wrs)).join(', '); res.actores = cast.slice(0, 5).map(x => x.person?.name).filter(Boolean).join(', '); }
} else if (cat === 'Juegos') { const g = fetchJson(`https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${q}&page_size=1`)?.results?.[0]; if (g) { res.poster = g.background_image || ''; res.fechaEstreno = g.released ? formatearAFechaChilena(g.released) : '';
const det = fetchJson(`https://api.rawg.io/api/games/${g.id}?key=${RAWG_KEY}`); if (det) { res.sinopsis = det.description_raw ? det.description_raw.substring(0, 320) + '...' : res.sinopsis; res.directores = (det.developers || []).map(x => x.name).join(', ') || creador;
res.escritores = (det.publishers || []).map(x => x.name).join(', '); res.actores = (det.platforms || []).map(p => p.platform?.name).join(', '); }
}
} else if (cat === 'Lecturas') { if (sub === 'Mangas' || sub === 'Manga' || sub === 'To Read: Mangas') { const a = fetchJson(`https://kitsu.io/api/edge/manga?filter[text]=${q}&page[limit]=1`)?.data?.[0]?.attributes; if (a) { res.poster = a.posterImage?.original || a.posterImage?.medium || '';
res.fechaEstreno = a.startDate ? formatearAFechaChilena(a.startDate) : ''; res.sinopsis = a.synopsis || res.sinopsis; res.directores = creador; }
} else { const isC = sub === 'Cómics' || sub === 'Cómic' || sub === 'To Read: Cómics'; const d = fetchJson(`https://openlibrary.org/search.json?${isC ? 'title=' + q : 'q=' + q}&limit=1`)?.docs?.[0]; if (d) { res.poster = d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : '';
res.fechaEstreno = d.first_publish_year ? String(d.first_publish_year) : ''; res.directores = d.author_name ? d.author_name.join(', ') : creador; res.escritores = d.publisher ? d.publisher.join(', ') : ''; }
}
} else if (cat === 'Musica') { const it = fetchJson(`https://itunes.apple.com/search?term=${q}&entity=album&limit=1`)?.results?.[0]; if (it) { res.poster = (it.artworkUrl100 || '').replace('100x100bb', '600x600bb'); res.directores = it.artistName || creador;
res.fechaEstreno = it.releaseDate ? it.releaseDate.substring(0, 4) : ''; res.sinopsis = `Álbum discográfico: ${it.collectionName}. Género: ${it.primaryGenreName || 'Música'}.`; } else { const dz = fetchJson(`https://api.deezer.com/search?q=${q}&limit=1`)?.data?.[0]; if (dz) {
res.poster = dz.album?.cover_big || dz.artist?.picture_big || ''; res.directores = dz.artist?.name || creador; res.sinopsis = `Álbum / Pista musical. Artista: ${dz.artist?.name || creador}`; }
}
}
} catch (e) {}
return res; }
function sincronizarYRepararRegistros(userEmail) { try { const email = resolverUserEmail_(userEmail); if (!email) return { reparados: 0 }; const data = sbReq_(`registros?user_email=eq.${encodeURIComponent(email)}&select=*`, 'get') || []; if (!data.length) return { reparados: 0 }; let reparados = 0;
data.forEach(r => { const patch = {}; const com = String(r.comentario || '').trim(); if (com !== '' && !/[.!?:;]$/.test(com)) patch.comentario = `${com}.`; if (r.categoria === 'Musica' && (String(r.subcategoria).includes('Artista') || String(r.subcategoria).includes('Grupos'))) {
const fI = formatearAFechaChilena(r.fecha_inicio), fF = formatearAFechaChilena(r.fecha_fin); if (fI === 'Sin fecha' && fF !== 'Sin fecha') { patch.fecha_inicio = fF; patch.fecha_fin = 'Sin fecha'; }
}
if (Object.keys(patch).length > 0) { sbReq_(`registros?id=eq.${encodeURIComponent(r.id)}&user_email=eq.${encodeURIComponent(email)}`, 'patch', patch); reparados++; }
}); return { reparados }; } catch (e) { return { reparados: 0 }; }
}
function buscarEnServidor(qRaw, cat, sub) { if (!qRaw || qRaw.trim().length < 2) return []; const q = encodeURIComponent(qRaw.trim()); if (cat === 'Peliculas') { return (fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${q}`)?.results || []).slice(0, 6).map(m => {
const dirs = (fetchJson(`https://api.themoviedb.org/3/movie/${m.id}/credits?api_key=${TMDB_KEY}`)?.crew || []).filter(x => x.job === 'Director').map(x => x.name); const noEs = m.original_language !== 'es' && m.original_language !== 'en'; return {
idRef: m.id, tituloOriginal: m.original_title || m.title || '', tituloIngles: (noEs && m.title && m.title !== m.original_title) ? m.title : '', creador: dirs.length ? dirs.join(', ') : 'Director desconocido',
anio: m.release_date?.substring(0, 4) || '', sinopsis: m.overview || 'Sin sinopsis disponible.', poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : ''
}; }); }
if (cat === 'Series') { return (fetchJson(`https://api.tvmaze.com/search/shows?q=${q}`) || []).slice(0, 6).map(it => {
const s = it.show, crs = Array.from(new Set((fetchJson(`https://api.tvmaze.com/shows/${s.id}/crew`) || []).filter(x => x.type === 'Creator' || x.type === 'Showrunner').map(x => x.person?.name).filter(Boolean)));
const aIni = s.premiered ? s.premiered.substring(0, 4) : '', aFin = s.ended ? s.ended.substring(0, 4) : (s.status === 'Running' ? 'presente' : ''); const sList = fetchJson(`https://api.tvmaze.com/shows/${s.id}/seasons`); return {
idRef: s.id, tituloOriginal: s.name || '', tituloIngles: '', creador: crs.length ? crs.join(', ') : (s.network?.name || 'Showrunner desconocido'), anio: (aIni && aFin && aIni !== aFin) ? `${aIni}-${aFin}` : aIni,
totalSeasons: sList?.length || 0, estadoSerie: s.status || '', sinopsis: s.summary ? s.summary.replace(/<[^>]*>?/gm, '') : 'Sin sinopsis disponible.', poster: s.image?.medium || s.image?.original || ''
}; }); }
if (cat === 'Musica') { if (sub === 'Discos' || sub === 'Disco') { const resultados = [], vistos = new Set(); (fetchJson(`https://itunes.apple.com/search?term=${q}&entity=album&limit=10`)?.results || []).forEach(al => {
const tit = al.collectionName || '', art = al.artistName || 'Artista', k = `${tit.toLowerCase()}_${art.toLowerCase()}`; if (!vistos.has(k)) { vistos.add(k);
resultados.push({ tituloOriginal: tit, tituloIngles: '', creador: art, anio: al.releaseDate ? al.releaseDate.substring(0, 4) : '', sinopsis: `Álbum discográfico. Canciones: ${al.trackCount || 'N/D'}. Género: ${al.primaryGenreName || 'Música'}.`, poster: (al.artworkUrl100 || '').replace('100x100bb', '600x600bb') });
}
}); if (resultados.length < 8) { (fetchJson(`https://api.deezer.com/search/album?q=${q}&limit=8`)?.data || []).forEach(it => { const tit = it.title || '', art = it.artist?.name || 'Artista', k = `${tit.toLowerCase()}_${art.toLowerCase()}`; if (!vistos.has(k)) { vistos.add(k);
resultados.push({ tituloOriginal: tit, tituloIngles: '', creador: art, anio: '', sinopsis: 'Álbum discográfico (Deezer)', poster: it.cover_xl || it.cover_big || it.cover_medium || '' }); }
}); }
return resultados.slice(0, 10); }
const end = (sub.includes('Artista') || sub.includes('Concierto') || sub === 'To Listen') ? 'artist' : 'album'; return (fetchJson(`https://api.deezer.com/search/${end}?q=${q}&limit=6`)?.data || []).map(it => ({
tituloOriginal: (end === 'artist' ? it.name : it.title) || '', tituloIngles: '', creador: (end === 'artist' ? it.name : it.artist?.name) || 'Artista', anio: '', sinopsis: end === 'artist' ? `Seguidores: ${(it.nb_fan||0).toLocaleString()}` : 'Álbum discográfico',
poster: end === 'artist' ? (it.picture_medium || it.picture_big || '') : (it.cover_medium || it.cover_big || '')
})); }
if (cat === 'Juegos') { return (fetchJson(`https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${q}&page_size=6`)?.results || []).map(g => { let dev = 'Estudio desarrollador';
try { const det = fetchJson(`https://api.rawg.io/api/games/${g.id}?key=${RAWG_KEY}`); if (det?.developers?.length) dev = det.developers.map(d => d.name).join(', '); } catch (e) {}
const plats = (g.platforms || []).map(p => p.platform?.name).slice(0, 3).join(', ');
return { tituloOriginal: g.name || '', tituloIngles: '', creador: dev, anio: g.released?.substring(0, 4) || '', sinopsis: plats ? `Plataformas: ${plats} | Calificación: ${g.rating || 'N/D'}/5` : 'Videojuego', poster: g.background_image || '' }; }); }
if (cat === 'Lecturas') { if (sub === 'Mangas' || sub === 'Manga' || sub === 'To Read: Mangas') { return (fetchJson(`https://kitsu.io/api/edge/manga?filter[text]=${q}&page[limit]=6`)?.data || []).map(it => {
const a = it.attributes || {}, titles = a.titles || {}, tRom = titles.en_jp || a.canonicalTitle || '', tEng = titles.en || '', mangakas = []; try {
const st = fetchJson(`https://kitsu.io/api/edge/manga/${it.id}/staff`), rel = (st?.data || []).filter(s => /story|art|original|author/i.test(s.attributes?.role || '')); (rel.length ? rel : (st?.data || [])).forEach(x => { const p = fetchJson(x.relationships?.person?.links?.related);
if (p?.data?.attributes?.name && !mangakas.includes(p.data.attributes.name)) mangakas.push(p.data.attributes.name); }); } catch (e) {}
return { tituloOriginal: tRom || 'Manga', tituloIngles: (tEng && tEng.toLowerCase() !== tRom.toLowerCase()) ? tEng : '', creador: mangakas.length ? mangakas.join(', ') : 'Mangaka', anio: a.startDate?.substring(0, 4) || '', sinopsis: a.synopsis ? a.synopsis.substring(0, 160) + '...' : 'Manga japonés.', poster: a.posterImage?.medium || a.posterImage?.small || '' };
}); }
const isC = sub === 'Cómics' || sub === 'Cómic' || sub === 'To Read: Cómics'; const ol = fetchJson(`https://openlibrary.org/search.json?${isC ? 'title=' + q : 'q=' + q}&limit=6`); if (ol?.docs?.length) { return ol.docs.slice(0, 6).map(d => ({
tituloOriginal: d.title || 'Sin título', tituloIngles: '', creador: d.author_name?.length ? d.author_name.join(', ') : (isC ? 'Escritor / Dibujante' : 'Autor desconocido'), anio: d.first_publish_year ? String(d.first_publish_year) : '',
sinopsis: d.publisher ? `Editorial: ${d.publisher[0]}` : (isC ? 'Cómic / Novela gráfica' : 'Libro literario'), poster: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-${isC ? 'L' : 'M'}.jpg` : ''
})); }
return (fetchJson(`https://www.googleapis.com/books/v1/volumes?q=${q}${isC ? '+comic' : ''}&maxResults=6`)?.items || []).map(b => { const inf = b.volumeInfo || {};
return { tituloOriginal: inf.title || 'Sin título', tituloIngles: '', creador: inf.authors?.length ? inf.authors.join(', ') : 'Autor desconocido', anio: inf.publishedDate?.substring(0, 4) || '', sinopsis: inf.description || 'Sin sinopsis disponible.', poster: (inf.imageLinks?.thumbnail || inf.imageLinks?.smallThumbnail || '').replace('http://', 'https://') };
}); }
return []; }