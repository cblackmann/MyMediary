/* Mediary — js/core/supabase-api.js */
if (!window.IS_APPS_SCRIPT) { window.addEventListener('DOMContentLoaded', () => { const btnMig = document.getElementById('btn-migrar-sheets'); if (btnMig) btnMig.style.display = 'none'; const pAuth = document.getElementById('auth-input-pass'); if (pAuth) pAuth.value = ''; }); const SB_URL = 'https://cpksupowjteqilsiklde.supabase.co/rest/v1';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3N1cG93anRlcWlsc2lrbGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NzIxMTUsImV4cCI6MjEwOTA0ODExNX0.-ojqwNdX7wXkCUGDU6wHComRNi2Uy-XrWket6zeEAVU';
const uuid_ = () => (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
window.uuid_ = uuid_;
const normEm_ = em => String(em || '').trim().toLowerCase(); const hashP_ = async raw => { if (!raw) return ''; const buf = new TextEncoder().encode(String(raw) + '_mb_salt_v1'); const dig = await crypto.subtle.digest('SHA-256', buf);
return Array.from(new Uint8Array(dig)).map(b => ('0' + b.toString(16)).slice(-2)).join(''); }; const sbFetch_ = async (endpoint, method = 'GET', payload = null, prefer = 'return=representation') => {
const opts = { method: method.toUpperCase(), headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Prefer': prefer } }; if (payload !== null) opts.body = JSON.stringify(payload); const r = await fetch(`${SB_URL}/${endpoint}`, opts);
const txt = await r.text(); if (r.ok) { if (!txt) return []; try { return JSON.parse(txt); } catch (e) { return []; } }
throw new Error(`Supabase (${r.status}): ${txt}`); }; const fmtFecha_ = v => { if (!v || v === 'Sin fecha' || v === '' || v === 'undefined') return 'Sin fecha'; if (v instanceof Date) return `${String(v.getDate()).padStart(2,'0')}/${String(v.getMonth()+1).padStart(2,'0')}/${v.getFullYear()}`; const s = String(v).trim(); if (s === 'Sin fecha') return 'Sin fecha';
if (s.startsWith('Aún ') || s.startsWith('Aun ') || s.startsWith('Still ') || s.includes('viendo') || s.includes('escuchando') || s.includes('jugando') || s.includes('leyendo')) return s;
if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) { const p = s.split('/'); return `${p[0].padStart(2,'0')}/${p[1].padStart(2,'0')}/${p[2]}`; }
if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const p = s.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }
if (s.includes('➔') || s.includes(' - ') || s.startsWith('Semana') || /^[a-záéíóúñ]+\s+\d{4}$/i.test(s) || /^\d{4}$/.test(s)) return s;
const d = new Date(s); return isNaN(d.getTime()) ? s : `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }; window.fmtFecha_ = fmtFecha_; const parseTs_ = v => timestampDeFecha(v); const fmtTitIdioma_ = (origTitle, engTitle, origLang) => { const tOrig = String(origTitle || engTitle || '').trim(), tEng = String(engTitle || '').trim(), lang = String(origLang || '').toLowerCase();
const mostrarIngles = (lang && lang !== 'en' && lang !== 'es') && tEng && tEng.toLowerCase() !== tOrig.toLowerCase(); return { titulo: tOrig, tituloOriginal: tOrig, tituloIngles: mostrarIngles ? tEng : '' }; };
const traducirRolMusical_ = (r) => {
  if (!r) return '';
  const s = String(r).toLowerCase().trim();
  const en = typeof getLang_ === 'function' && getLang_() === 'en';
  if (s.includes('lead vocals') || s.includes('lead vocal')) return en ? 'Lead vocals' : 'Vocalista principal';
  if (s.includes('backing vocals') || s.includes('background vocal')) return en ? 'Backing vocals' : 'Coros';
  if (s.includes('vocal') || s.includes('singer')) return en ? 'Vocals' : 'Vocalista';
  if (s.includes('lead guitar')) return en ? 'Lead guitar' : 'Guitarrista líder';
  if (s.includes('rhythm guitar')) return en ? 'Rhythm guitar' : 'Guitarrista rítmico';
  if (s.includes('acoustic guitar')) return en ? 'Acoustic guitar' : 'Guitarra acústica';
  if (s.includes('bass guitar') || s.includes('bass') || s.includes('bajo')) return en ? 'Bass' : 'Bajista';
  if (s.includes('guitar') || s.includes('guitarra')) return en ? 'Guitar' : 'Guitarrista';
  if (s.includes('drum') || s.includes('percussion') || s.includes('bater')) return en ? 'Drums' : 'Baterista';
  if (s.includes('keyboard') || s.includes('piano') || s.includes('organ') || s.includes('synthesizer') || s.includes('teclado')) return en ? 'Keyboards' : 'Tecladista';
  if (s.includes('saxophone') || s.includes('sax')) return en ? 'Saxophone' : 'Saxofonista';
  if (s.includes('trumpet') || s.includes('trompeta')) return en ? 'Trumpet' : 'Trompetista';
  if (s.includes('violin')) return en ? 'Violin' : 'Violinista';
  if (s.includes('producer') || s.includes('productor')) return en ? 'Producer' : 'Productor';
  if (s.includes('composer') || s.includes('songwriter') || s.includes('compositor')) return en ? 'Songwriter' : 'Compositor';
  return r.charAt(0).toUpperCase() + r.slice(1);
};
const SERVER_API = { async obtenerDatosAmigosUsuario(userEmail) { try { const email = normEm_(userEmail); if (!email) return { exito: false, error: tLang('Sin sesión', 'Not signed in') }; const myP = await SERVER_API.obtenerPerfilUsuario(email); const prefs = myP.preferencias || {}; const amigosEmails = prefs.amigos || []; const solicitudesEmails = prefs.solicitudes_recibidas || []; const [amigosRowsList, solicitudesRowsList, amigosRegsList] = await Promise.all([
  Promise.all(amigosEmails.map(aEmail => sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(normEm_(aEmail)) + '&select=*', 'GET').catch(() => []))),
  Promise.all(solicitudesEmails.map(sEmail => sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(normEm_(sEmail)) + '&select=*', 'GET').catch(() => []))),
  Promise.all(amigosEmails.map(aEmail => sbFetch_('registros?user_email=eq.' + encodeURIComponent(normEm_(aEmail)) + '&select=categoria,subcategoria,calificacion', 'GET').catch(() => [])))
]);
const amigosData = [];
amigosRowsList.forEach((rows, idx) => {
  const aEmail = amigosEmails[idx];
  const p = (rows && rows.length > 0) ? rows[0] : null;
  if (p) {
    const pPrefs = (typeof p.preferencias === 'string') ? (JSON.parse(p.preferencias) || {}) : (p.preferencias || {});
    const pFavs = (typeof p.favoritos === 'string') ? (JSON.parse(p.favoritos) || {}) : (p.favoritos || {});
    const priv = pPrefs.privacidad || {};
    const regs = (amigosRegsList && amigosRegsList[idx]) ? amigosRegsList[idx] : [];
    let sumC = 0, numC = 0;
    const catCount = {};
    regs.forEach(r => {
      const c = r.categoria || 'Otro';
      catCount[c] = (catCount[c] || 0) + 1;
      const cal = Number(r.calificacion);
      if (cal > 0) { sumC += cal; numC++; }
    });
    let topCatName = '';
    let maxCount = 0;
    Object.keys(catCount).forEach(k => {
      if (catCount[k] > maxCount) { maxCount = catCount[k]; topCatName = `${(typeof traducirNombreCat === 'function') ? traducirNombreCat(k) : k} (${maxCount})`; }
    });
    const stats = priv.ocultarEstadisticas ? null : {
      total: regs.length,
      promedio: (!priv.ocultarCalificaciones && numC) ? (sumC / numC).toFixed(1) : null,
      topCat: topCatName
    };
    let portAmigo = p.portada || pPrefs.portada || pFavs.portada || pPrefs.cover || 'predeterminada';
    if (typeof portAmigo === 'string' && portAmigo.startsWith('cover-')) portAmigo = portAmigo.replace(/^cover-/, '');
    amigosData.push({ email: p.user_email || aEmail, nickname: p.nickname || (p.user_email || aEmail).split('@')[0], bio: p.bio || '', avatar: p.avatar || '🦊', userId: pPrefs.userId || aEmail, portada: portAmigo, stats: stats });
  } else if (aEmail) {
    amigosData.push({ email: aEmail, nickname: aEmail.split('@')[0], bio: '', avatar: '🦊', userId: aEmail, portada: 'predeterminada', stats: null });
  }
}); const solicitudesData = []; solicitudesRowsList.forEach((rows, idx) => { const sEmail = solicitudesEmails[idx]; if (rows && rows.length > 0) { const p = rows[0]; solicitudesData.push({ email: p.user_email, nickname: p.nickname || p.user_email.split('@')[0], avatar: p.avatar || '🦊', userId: p.preferencias?.userId || sEmail }); } }); return { exito: true, amigos: amigosData, solicitudes: solicitudesData }; } catch (e) { return { exito: false, error: e.toString() }; } }, async enviarSolicitudAmistad(miEmail, idBuscado) { try { const miEm = normEm_(miEmail); const busq = String(idBuscado || '').trim(); if (!miEm) return { exito: false, error: tLang('Inicia sesión primero.', 'Please sign in first.') }; if (!busq) return { exito: false, error: tLang('Ingresa un ID válido.', 'Enter a valid ID.') }; let rows = await sbFetch_('perfiles?preferencias->>userId=eq.' + encodeURIComponent(busq) + '&select=*', 'GET'); if (!rows || !rows.length) { rows = await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(busq.toLowerCase()) + '&select=*', 'GET'); } if (!rows || !rows.length) { const todos = await sbFetch_('perfiles?select=*', 'GET') || []; rows = todos.filter(p => { const uId = p.preferencias?.userId || ''; return uId.toLowerCase() === busq.toLowerCase() || p.user_email.toLowerCase() === busq.toLowerCase(); }); } if (!rows || !rows.length) { return { exito: false, error: tLang('No se encontró ningún usuario con ese ID.', 'No user found with that ID.') }; } const targetUser = rows[0]; const targetEmail = targetUser.user_email; if (targetEmail.toLowerCase() === miEm.toLowerCase()) { return { exito: false, error: tLang('No puedes agregarte a ti mismo.', 'You cannot add yourself.') }; } const miPerfil = await SERVER_API.obtenerPerfilUsuario(miEm); const misPrefs = miPerfil.preferencias || {}; const misAmigos = misPrefs.amigos || []; if (misAmigos.includes(targetEmail)) { const tNick = targetUser.nickname || tLang('este usuario', 'this user'); return { exito: false, error: tLang('Ya tienes a ' + tNick + ' en tu lista de amigos.', tNick + ' is already on your friends list.') }; } const targetPrefs = targetUser.preferencias || {}; const targetRecibidas = targetPrefs.solicitudes_recibidas || []; if (!targetRecibidas.includes(miEm)) { targetRecibidas.push(miEm); targetPrefs.solicitudes_recibidas = targetRecibidas; await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(targetEmail), 'PATCH', { preferencias: targetPrefs, updated_at: new Date().toISOString() }); } const destName = targetUser.nickname || targetEmail; return { exito: true, mensaje: tLang('¡Solicitud enviada con éxito a ' + destName + '!', 'Friend request sent to ' + destName + '!') }; } catch (e) { return { exito: false, error: e.toString() }; } }, async procesarRespuestaSolicitud(miEmail, emailAmigo, aceptar) { try { const miEm = normEm_(miEmail); const amigoEm = normEm_(emailAmigo); if (!miEm || !amigoEm) return { exito: false, error: tLang('Datos incompletos', 'Incomplete data') }; const miPerfil = await SERVER_API.obtenerPerfilUsuario(miEm); const misPrefs = miPerfil.preferencias || {}; misPrefs.solicitudes_recibidas = (misPrefs.solicitudes_recibidas || []).filter(e => e !== amigoEm); if (aceptar) { const misAmigos = misPrefs.amigos || []; if (!misAmigos.includes(amigoEm)) misAmigos.push(amigoEm); misPrefs.amigos = misAmigos; } await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(miEm), 'PATCH', { preferencias: misPrefs, updated_at: new Date().toISOString() }); const rows = await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(amigoEm) + '&select=*', 'GET'); if (rows && rows.length > 0) { const amigoP = rows[0]; const amigoPrefs = amigoP.preferencias || {}; if (aceptar) { const suListaAmigos = amigoPrefs.amigos || []; if (!suListaAmigos.includes(miEm)) suListaAmigos.push(miEm); amigoPrefs.amigos = suListaAmigos; } else { amigoPrefs.amigos = (amigoPrefs.amigos || []).filter(e => e !== miEm); } await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(amigoEm), 'PATCH', { preferencias: amigoPrefs, updated_at: new Date().toISOString() }); } return { exito: true }; } catch (e) { return { exito: false, error: e.toString() }; } }, async obtenerRegistrosAmigo(emailAmigo) {
  try {
    const email = normEm_(emailAmigo);
    if (!email) return { exito: false, error: tLang('Email inválido', 'Invalid email') };
    const rows = await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(email) + '&select=*', 'GET').catch(() => []);
    const p = (rows && rows.length) ? rows[0] : {};
    const priv = p.preferencias?.privacidad || {};
    if (priv.ocultarRegistros) {
      return { exito: true, privado: true, registros: [] };
    }
    const data = await sbFetch_('registros?user_email=eq.' + encodeURIComponent(email) + '&select=*&order=created_at.desc', 'GET').catch(() => []) || [];
    const registros = (Array.isArray(data) ? data : []).map(r => {
      const fI = typeof sanitizarFechaFrontend === 'function' ? sanitizarFechaFrontend(r.fecha_inicio || r.fechaInicio) : (typeof fmtFecha_ === 'function' ? fmtFecha_(r.fecha_inicio || r.fechaInicio) : (r.fecha_inicio || r.fechaInicio || 'Sin fecha'));
      const fF = typeof sanitizarFechaFrontend === 'function' ? sanitizarFechaFrontend(r.fecha_fin || r.fechaFin) : (typeof fmtFecha_ === 'function' ? fmtFecha_(r.fecha_fin || r.fechaFin) : (r.fecha_fin || r.fechaFin || 'Sin fecha'));
      return {
        id: r.id,
        titulo: r.titulo || '',
        subtitulo: r.subtitulo || '',
        categoria: r.categoria || '',
        subcategoria: r.subcategoria || '',
        poster: r.poster || '',
        calificacion: priv.ocultarCalificaciones ? 0 : (r.calificacion || 0),
        fechaInicio: fI,
        fechaFin: fF,
        horas: r.horas || '',
        comentario: priv.ocultarComentarios ? '' : (r.comentario || ''),
        esRewatch: !!r.es_rewatch,
        creador: r.creador || '',
        anio: r.anio || '',
        created_at: r.created_at || '',
        likes: (p.preferencias?.likes_recibidos && p.preferencias.likes_recibidos[r.id]) ? p.preferencias.likes_recibidos[r.id] : []
      };
    });
    return { exito: true, privado: false, registros: registros, privacidad: priv, amigoPrefs: p.preferencias };
  } catch (e) {
    return { exito: false, error: e.toString() };
  }
},
async obtenerPerfilAmigoCompleto(emailAmigo) { try { const email = normEm_(emailAmigo); if (!email) return { exito: false, error: tLang('Email inválido', 'Invalid email') }; const rows = await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(email) + '&select=*', 'GET'); if (!rows || !rows.length) return { exito: false, error: tLang('Perfil no encontrado', 'Profile not found') }; const p = rows[0]; const regs = await sbFetch_('registros?user_email=eq.' + encodeURIComponent(email) + '&select=*', 'GET') || []; let totalHoras = 0, totalHorasVistas = 0, sumCalif = 0, nCalif = 0; regs.forEach(r => { if (Number(r.calificacion) > 0) { sumCalif += Number(r.calificacion); nCalif++; } if (r.categoria === 'Juegos' && r.horas) { const h = parseFloat(String(r.horas).replace('hrs','').trim()); if (!isNaN(h)) totalHoras += h; } if (r.categoria === 'Peliculas' && r.horas) { const h = parseFloat(String(r.horas).replace('hrs','').trim()); if (!isNaN(h)) totalHorasVistas += h; } else if (r.categoria === 'Series' && r.horas && (String(r.subcategoria||'').includes('Temporada') || /\[S\d+\]/i.test(r.titulo))) { const h = parseFloat(String(r.horas).replace('hrs','').trim()); if (!isNaN(h)) totalHorasVistas += h; } }); const priv = p.preferencias?.privacidad || {}; const desglose = { Peliculas: { total: 0, subs: {} }, Series: { total: 0, subs: {} }, Musica: { total: 0, subs: {} }, Juegos: { total: 0, subs: {} }, Lecturas: { total: 0, subs: {} } }; regs.forEach(r => { const c = r.categoria; if (desglose[c]) { desglose[c].total++; const s = r.subcategoria || 'General'; desglose[c].subs[s] = (desglose[c].subs[s] || 0) + 1; } }); const rawFavs = priv.ocultarFavoritos ? {} : (p.favoritos || {}); const favs = {}; Object.keys(rawFavs).forEach(k => { if (k !== 'portada' && k !== 'personajeFavorito' && k !== 'cancionFavorita' && k.includes('__') && rawFavs[k] && typeof rawFavs[k] === 'object' && rawFavs[k].titulo) { favs[k] = rawFavs[k]; } }); const charFav = (p.favoritos?.personajeFavorito || p.preferencias?.personajeFavorito || null); const songFav = (p.favoritos?.cancionFavorita || p.preferencias?.cancionFavorita || null); const portAmigo = (p.preferencias?.portada || p.favoritos?.portada || 'predeterminada'); return { exito: true, amigo: { email: p.user_email, nickname: p.nickname || email.split('@')[0], bio: p.bio || '', avatar: p.avatar || '🦊', userId: p.preferencias?.userId || email, favoritos: favs, portada: portAmigo, personajeFavorito: charFav, cancionFavorita: songFav }, privacidad: priv, desglose: priv.ocultarEstadisticas ? null : desglose, metricas: priv.ocultarEstadisticas ? null : { total: regs.length, promedio: (priv.ocultarCalificaciones || !nCalif) ? 0 : (sumCalif / nCalif), horasJuegos: totalHoras, horasVistas: (totalHorasVistas % 1 === 0) ? totalHorasVistas : parseFloat(totalHorasVistas.toFixed(1)) } }; } catch (e) { return { exito: false, error: e.toString() }; } }, async obtenerPerfilUsuario(userEmail) { try {
const email = normEm_(userEmail); if (!email) return { exito: false, sinSesion: true, emailGoogle: '', logueadoGoogle: false, nickname: tLang('Invitado', 'Guest'), avatar: '🦊', bio: tLang('Inicia sesión para guardar tus listas en Supabase', 'Sign in to save your lists in Supabase'), favoritos: {}, favoritosOcultos: {}, diasLectura: [], tiemposLectura: {} };
const rows = await sbFetch_(`perfiles?user_email=eq.${encodeURIComponent(email)}&select=*`, 'GET'); if (rows && rows.length > 0) { const p = rows[0];
const pPrefs = p.preferencias || {};
const dLect = pPrefs.rachas?.diasLectura || pPrefs.diasLectura || [];
const tLect = pPrefs.rachas?.tiemposLectura || pPrefs.tiemposLectura || {};
return { exito: true, emailGoogle: p.user_email, logueadoGoogle: true, nickname: p.nickname || email.split('@')[0], avatar: p.avatar || '🦊', bio: p.bio || 'Coleccionando historias en Mediary', favoritos: p.favoritos || {}, favoritosOcultos: p.favoritos_ocultos || {}, preferencias: pPrefs, diasLectura: dLect, tiemposLectura: tLect, created_at: p.created_at || pPrefs.createdAt || '' };
}
const nuevo = { user_email: email, nickname: email.includes('@') ? email.split('@')[0] : email, bio: 'Coleccionando historias en Mediary', avatar: '🦊', favoritos: {}, favoritos_ocultos: {}, preferencias: { authMethod: 'google' }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
await sbFetch_('perfiles?on_conflict=user_email', 'POST', nuevo, 'resolution=merge-duplicates,return=representation');
return { exito: true, emailGoogle: email, logueadoGoogle: true, nickname: nuevo.nickname, avatar: nuevo.avatar, bio: nuevo.bio, favoritos: {}, favoritos_ocultos: {}, preferencias: nuevo.preferencias, diasLectura: [], tiemposLectura: {}, created_at: nuevo.created_at };
} catch (e) { return { exito: false, error: e.toString(), emailGoogle: userEmail || '', logueadoGoogle: false }; }
}, async autenticarUsuarioSupabase(datos) { try { const modo = datos?.modo || 'login'; const email = normEm_(datos?.email); const pass = String(datos?.password || ''); if (!email) return { exito: false, error: tLang('Ingresa tu correo o nombre de usuario.', 'Enter your email or username.') };
const passHash = pass ? await hashP_(pass) : ''; const existentes = await sbFetch_(`perfiles?user_email=eq.${encodeURIComponent(email)}&select=*`, 'GET'); const actual = existentes && existentes[0] ? existentes[0] : null; if (modo === 'registro') {
if (actual && actual.preferencias?.passwordHash) return { exito: false, error: tLang('Esta cuenta ya existe. Inicia sesión con tu contraseña o con Google.', 'This account already exists. Sign in with your password or Google.') }; if (!pass || pass.length < 3) return { exito: false, error: tLang('Crea una contraseña de al menos 3 caracteres.', 'Create a password with at least 3 characters.') };
const nickDefault = (datos?.nickname || '').trim() || (email.includes('@') ? email.split('@')[0] : email); const prefs = Object.assign({}, actual?.preferencias || {}, { passwordHash: passHash, authMethod: email.endsWith('@gmail.com') ? 'google_password' : 'password' });
const nuevo = { user_email: email, nickname: nickDefault, bio: actual?.bio || 'Coleccionando historias en Mediary', avatar: actual?.avatar || '🦊', favoritos: actual?.favoritos || {}, favoritos_ocultos: actual?.favoritos_ocultos || {}, preferencias: prefs, updated_at: new Date().toISOString() };
await sbFetch_('perfiles?on_conflict=user_email', 'POST', nuevo, 'resolution=merge-duplicates,return=representation'); return await SERVER_API.obtenerPerfilUsuario(email); }
if (modo === 'google') { if (actual && actual.preferencias?.passwordHash && passHash && actual.preferencias.passwordHash !== passHash) return { exito: false, error: tLang('La contraseña de esta cuenta no coincide.', 'The password for this account does not match.') }; if (!actual) { const nickG = (datos?.nickname || '').trim() || email.split('@')[0];
const prefsG = passHash ? { passwordHash: passHash, authMethod: 'google' } : { authMethod: 'google' };
await sbFetch_('perfiles?on_conflict=user_email', 'POST', { user_email: email, nickname: nickG, bio: 'Coleccionando historias en Mediary', avatar: datos?.avatar || '🦊', favoritos: {}, favoritos_ocultos: {}, preferencias: prefsG, updated_at: new Date().toISOString() }, 'resolution=merge-duplicates,return=representation');
} else if (passHash && !actual.preferencias?.passwordHash) { const prefsUpd = Object.assign({}, actual.preferencias || {}, { passwordHash: passHash, authMethod: 'google' });
await sbFetch_(`perfiles?user_email=eq.${encodeURIComponent(email)}`, 'PATCH', { preferencias: prefsUpd, updated_at: new Date().toISOString() }); }
return await SERVER_API.obtenerPerfilUsuario(email); }
if (!actual) return { exito: false, error: tLang('No existe una cuenta con ese correo/usuario. Pulsa en "Crear Cuenta" o "Continuar con Google".', 'No account exists with that email/username. Click "Create Account" or "Continue with Google".') }; const savedHash = actual.preferencias?.passwordHash || ''; if (savedHash && savedHash !== passHash) return { exito: false, error: tLang('Contraseña incorrecta.', 'Incorrect password.') };
if (!savedHash && passHash) { const prefsUpd = Object.assign({}, actual.preferencias || {}, { passwordHash: passHash }); await sbFetch_(`perfiles?user_email=eq.${encodeURIComponent(email)}`, 'PATCH', { preferencias: prefsUpd, updated_at: new Date().toISOString() }); }
return await SERVER_API.obtenerPerfilUsuario(email); } catch (e) { return { exito: false, error: e.toString() }; }
}, async iniciarSesionConGoogle(emailManual, passwordOpcional) { const em = normEm_(emailManual); if (!em) return { exito: false, necesitaInputGoogle: true }; return await SERVER_API.autenticarUsuarioSupabase({ modo: 'google', email: em, password: passwordOpcional || '' });
}, async guardarPerfilUsuario(datos, userEmail) { try { const email = normEm_(userEmail || datos?.emailGoogle); if (!email) return { exito: false, error: tLang('Inicia sesión primero para guardar tu perfil.', 'Sign in first to save your profile.') };
const existentes = await sbFetch_(`perfiles?user_email=eq.${encodeURIComponent(email)}&select=*`, 'GET'); const actual = existentes && existentes[0] ? existentes[0] : {};
const actualPrefs = actual.preferencias || {};
const inPrefs = datos.preferencias || {};
const prefsObj = Object.assign({}, actualPrefs, inPrefs);
if (actualPrefs.configuracion_ui && inPrefs.configuracion_ui) {
  const prevTs = Number(actualPrefs.configuracion_ui.updatedAt) || 0;
  const nextTs = Number(inPrefs.configuracion_ui.updatedAt) || 0;
  if (prevTs > nextTs && nextTs > 0) {
    prefsObj.configuracion_ui = actualPrefs.configuracion_ui;
  }
}
const actualCuentas = actualPrefs.cuentas_vinculadas || actualPrefs.cuentasVinculadas;
const inCuentas = inPrefs.cuentas_vinculadas || inPrefs.cuentasVinculadas;
if (actualCuentas && inCuentas) {
  const prevCTs = Number(actualCuentas.updatedAt) || 0;
  const nextCTs = Number(inCuentas.updatedAt) || 0;
  if (prevCTs > nextCTs && nextCTs > 0) {
    prefsObj.cuentas_vinculadas = actualCuentas;
    prefsObj.cuentasVinculadas = actualCuentas;
  }
}
if (actualPrefs.actividad && inPrefs.actividad) {
  const prevATs = Number(actualPrefs.actividad.updatedAt) || 0;
  const nextATs = Number(inPrefs.actividad.updatedAt) || 0;
  if (prevATs > nextATs && nextATs > 0) {
    prefsObj.actividad = actualPrefs.actividad;
  }
}
if (datos.portada) prefsObj.portada = datos.portada;
if (datos.cancionFavorita !== undefined) {
  prefsObj.cancionFavorita = datos.cancionFavorita;
  if (!datos.favoritos) datos.favoritos = Object.assign({}, actual.favoritos || {});
  if (datos.cancionFavorita) {
    datos.favoritos.cancionFavorita = datos.cancionFavorita;
  } else {
    delete datos.favoritos.cancionFavorita;
  }
}
const prevDias = Array.isArray(actualPrefs.rachas?.diasLectura) ? actualPrefs.rachas.diasLectura : (Array.isArray(actualPrefs.diasLectura) ? actualPrefs.diasLectura : []);
const inDias = Array.isArray(datos.diasLectura) ? datos.diasLectura : (Array.isArray(inPrefs.rachas?.diasLectura) ? inPrefs.rachas.diasLectura : []);
const prevTiempos = (actualPrefs.rachas?.tiemposLectura && typeof actualPrefs.rachas.tiemposLectura === 'object') ? actualPrefs.rachas.tiemposLectura : ((actualPrefs.tiemposLectura && typeof actualPrefs.tiemposLectura === 'object') ? actualPrefs.tiemposLectura : {});
const inTiempos = (datos.tiemposLectura && typeof datos.tiemposLectura === 'object') ? datos.tiemposLectura : ((inPrefs.rachas?.tiemposLectura && typeof inPrefs.rachas.tiemposLectura === 'object') ? inPrefs.rachas.tiemposLectura : {});
if (datos.diasLectura || datos.tiemposLectura || inPrefs.rachas) {
  const mergedDias = Array.from(new Set([...prevDias, ...inDias])).filter(Boolean).sort();
  const mergedTiempos = Object.assign({}, prevTiempos, inTiempos);
  prefsObj.rachas = { diasLectura: mergedDias, tiemposLectura: mergedTiempos, updatedAt: Date.now() };
}
const payload = { user_email: email,
nickname: datos.nickname !== undefined ? String(datos.nickname) : (actual.nickname || email.split('@')[0]), bio: datos.bio !== undefined ? String(datos.bio) : (actual.bio || 'Coleccionando historias en Mediary'),
avatar: datos.avatar !== undefined ? String(datos.avatar) : (actual.avatar || '🦊'), favoritos: datos.favoritos !== undefined ? datos.favoritos : (actual.favoritos || {}), favoritos_ocultos: datos.favoritosOcultos !== undefined ? datos.favoritosOcultos : (actual.favoritos_ocultos || {}),
preferencias: prefsObj, updated_at: new Date().toISOString()
}; await sbFetch_('perfiles?on_conflict=user_email', 'POST', payload, 'resolution=merge-duplicates,return=representation'); return { exito: true, emailGoogle: email }; } catch (e) { return { exito: false, error: e.toString() }; }
}, async obtenerRegistros(userEmail) { try { const email = normEm_(userEmail); if (!email) return []; const data = await sbFetch_(`registros?user_email=eq.${encodeURIComponent(email)}&select=*&order=created_at.asc`, 'GET') || [];
const lista = data.map(r => {
let fIni = fmtFecha_(r.fecha_inicio);
let fFin = fmtFecha_(r.fecha_fin);
const cat = String(r.categoria || '');
const sub = String(r.subcategoria || '');
const tieneRango = subTieneRango(cat, sub);

if (!tieneRango) {
  // Subcategorías de una única fecha (Películas, Documentales, Discos, Conciertos)
  let fUnica = 'Sin fecha';
  if (fIni && fIni !== 'Sin fecha' && !esEnProgresoTexto(fIni)) {
    fUnica = fIni;
  } else if (fFin && fFin !== 'Sin fecha' && !esEnProgresoTexto(fFin)) {
    fUnica = fFin;
  }
  fIni = fUnica;
  fFin = fUnica;
} else {
  // Subcategorías que sí admiten rango (Series, Artistas/Grupos, Videojuegos, Libros, etc.)
  const fFinLower = String(fFin || '').trim().toLowerCase();
  const fIniLower = String(fIni || '').trim().toLowerCase();
  const esSinFechaFin = (!fFin || fFinLower === 'sin fecha' || fFinLower === '');
  const fIniValida = (fIni && fIniLower !== 'sin fecha');
  const tieneProgTexto = esEnProgresoTexto(r.fecha_fin || r.fechaFin || fFin);
  if ((esSinFechaFin && fIniValida) || tieneProgTexto) {
    fFin = obtenerTextoEnProgreso(cat, sub) || 'Aún viendo';
  }
}

return {
id: String(r.id || ''), categoria: cat, subcategoria: sub, titulo: String(r.titulo || ''), subtitulo: String(r.subtitulo || ''),
creador: String(r.creador || ''), anio: String(r.anio || ''), fechaInicio: fIni, fechaFin: fFin, calificacion: Number(r.calificacion) || 0, comentario: String(r.comentario || ''), poster: String(r.poster || ''), horas: String(r.horas || ''),
esRewatch: !!r.es_rewatch || String(r.subcategoria || '').includes('Rewatch'),
created_at: r.created_at || ''
};
});
return lista.sort((a, b) => {
  const vA = (a.fechaFin && a.fechaFin !== 'Sin fecha' && !esEnProgresoTexto(a.fechaFin)) ? parseTs_(a.fechaFin) : parseTs_(a.fechaInicio);
  const vB = (b.fechaFin && b.fechaFin !== 'Sin fecha' && !esEnProgresoTexto(b.fechaFin)) ? parseTs_(b.fechaFin) : parseTs_(b.fechaInicio);
  return vA - vB;
}); } catch (e) { return []; }
}, async guardarRegistro(d, userEmail) { try { const email = normEm_(userEmail || d?.userEmail); if (!email) return { exito: false, error: tLang('Inicia sesión para guardar registros.', 'Sign in to save records.') };
const genId = () => (typeof window.uuid_ === 'function' ? window.uuid_() : (typeof uuid_ === 'function' ? uuid_() : 'reg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)));
const buildObj = o => {
  const admiteRango = subTieneRango(o.categoria, o.subcategoria);
  let fIni = o.fechaInicio === 'Sin fecha' ? 'Sin fecha' : fmtFecha_(o.fechaInicio);
  let fFin = o.fechaFin === 'Sin fecha' ? 'Sin fecha' : fmtFecha_(o.fechaFin);
  if (!admiteRango) {
    const fUnica = (fIni && fIni !== 'Sin fecha' && !esEnProgresoTexto(fIni)) ? fIni : ((fFin && fFin !== 'Sin fecha' && !esEnProgresoTexto(fFin)) ? fFin : 'Sin fecha');
    fIni = fUnica;
    fFin = fUnica;
  }
  return {
    id: (o.id && typeof o.id === 'string' && o.id.length > 5) ? o.id : genId(), user_email: email, categoria: o.categoria || '', subcategoria: o.subcategoria || '', titulo: o.titulo || tLang('Sin título', 'Untitled'), subtitulo: o.subtitulo || '',
    creador: o.creador || '', anio: String(o.anio || ''), fecha_inicio: fIni, fecha_fin: fFin, calificacion: Number(o.calificacion) || 0, comentario: o.comentario || '',
    poster: o.poster || '', horas: o.horas || '', es_rewatch: !!o.esRewatch
  };
}; const rows = [buildObj(d)];
if (d.esTemporadaUnica && d.categoria === 'Series' && (d.subcategoria === 'Temporadas' || d.subcategoria.includes('Temporada'))) {
  const baseTitle = (d.tituloBase || d.titulo.replace(/\s*\[s\d+\]$/i, '')).trim();
  try {
    const wExisting = await sbFetch_(`registros?user_email=eq.${encodeURIComponent(email)}&categoria=eq.Series&subcategoria=eq.Series%20Completas&titulo=eq.${encodeURIComponent(baseTitle)}&select=id`, 'GET') || [];
    if (wExisting && wExisting.length > 0) {
      const patchObj = {
        fecha_inicio: d.fechaInicio === 'Sin fecha' ? 'Sin fecha' : fmtFecha_(d.fechaInicio),
        fecha_fin: d.fechaFin === 'Sin fecha' ? 'Sin fecha' : fmtFecha_(d.fechaFin),
        calificacion: Number(d.calificacion) || 0,
        comentario: d.comentario || '',
        es_rewatch: !!d.esRewatch
      };
      await sbFetch_(`registros?id=eq.${encodeURIComponent(wExisting[0].id)}&user_email=eq.${encodeURIComponent(email)}`, 'PATCH', patchObj);
    } else {
      rows.push(buildObj(Object.assign({}, d, { id: genId(), subcategoria: 'Series Completas', titulo: baseTitle })));
    }
  } catch (errSC) {
    rows.push(buildObj(Object.assign({}, d, { id: genId(), subcategoria: 'Series Completas', titulo: baseTitle })));
  }
}
const seenIds = new Set();
rows.forEach(r => {
  if (!r.id || seenIds.has(r.id)) {
    r.id = genId();
  }
  seenIds.add(r.id);
});
await sbFetch_('registros', 'POST', rows); let estabaEnWatchlist = false, tituloWatchlist = ''; try { const wData = await sbFetch_(`watchlist?user_email=eq.${encodeURIComponent(email)}&categoria=eq.${encodeURIComponent(d.categoria || '')}&select=*`, 'GET') || [];
const titNorm = String(d.tituloBase || d.titulo || '').toLowerCase().replace(/\s*\[s\d+\]$/i, '').trim(); for (const w of wData) { const itemTit = String(w.titulo || '').toLowerCase().trim(); if (itemTit === titNorm || (itemTit && (titNorm.startsWith(itemTit) || itemTit.startsWith(titNorm)))) {
estabaEnWatchlist = true; tituloWatchlist = String(w.titulo); await sbFetch_(`watchlist?id=eq.${encodeURIComponent(w.id)}&user_email=eq.${encodeURIComponent(email)}`, 'DELETE'); }
}
} catch (ew) {}
return { exito: true, id: rows[0].id, removidoDeWatchlist: estabaEnWatchlist, tituloRemovido: tituloWatchlist }; } catch (e) { return { exito: false, error: e.toString() }; }
}, async importarRegistrosMasivos(lista, userEmail) { try { const email = normEm_(userEmail); if (!email) return { exito: false, error: tLang('Inicia sesión primero para importar registros.', 'Sign in first to import records.') }; if (!Array.isArray(lista) || !lista.length) return { exito: false, error: tLang('Lista vacía', 'Empty list') };
const buscarPosterAuto = lista.length <= 20; const nuevasFilas = []; for (const o of lista) { const cat = String(o.categoria || 'Peliculas').trim(), sub = String(o.subcategoria || 'Películas').trim(); const tit = String(o.titulo || tLang('Sin título', 'Untitled')).trim(), subtit = String(o.subtitulo || '').trim();
const creador = String(o.creador || 'Desconocido').trim(), anio = String(o.anio || '').trim(); const fIni = (!o.fechaInicio || o.fechaInicio === 'Sin fecha') ? 'Sin fecha' : fmtFecha_(o.fechaInicio); const fFin = (!o.fechaFin || o.fechaFin === 'Sin fecha') ? fIni : fmtFecha_(o.fechaFin);
const calif = isNaN(Number(o.calificacion)) ? 0 : Number(o.calificacion); let com = String(o.comentario || '').trim(); if (com && !/[.!?:;]$/.test(com)) com += '.'; let poster = String(o.poster || '').trim();
if (!poster && buscarPosterAuto) { try { poster = await SERVER_API.buscarPortadaGenerica(tit, creador !== 'Desconocido' ? creador : '', cat) || ''; } catch (e) {} }
let horas = String(o.horas || '').trim(); if (horas && /^\d+(\.\d+)?$/.test(horas)) horas = `${horas} hrs`; const esRw = (o.esRewatch === true || /^(s[ií]|yes|true|1|rewatch)$/i.test(String(o.esRewatch || '').trim()));
nuevasFilas.push({ id: uuid_(), user_email: email, categoria: cat, subcategoria: sub, titulo: tit, subtitulo: subtit, creador, anio, fecha_inicio: fIni, fecha_fin: fFin, calificacion: calif, comentario: com, poster, horas, es_rewatch: esRw }); }
await sbFetch_('registros', 'POST', nuevasFilas); return { exito: true, insertados: nuevasFilas.length }; } catch (e) { return { exito: false, error: e.toString() }; }
}, async actualizarRegistro(id, c, userEmail) { try { const email = normEm_(userEmail); const target = String(id || '').trim(); if (!target) return { exito: false, error: tLang('ID inválido', 'Invalid ID') }; const patch = {};
if (c.fechaInicio !== undefined) patch.fecha_inicio = c.fechaInicio === 'Sin fecha' ? 'Sin fecha' : fmtFecha_(c.fechaInicio); if (c.fechaFin !== undefined) patch.fecha_fin = c.fechaFin === 'Sin fecha' ? 'Sin fecha' : fmtFecha_(c.fechaFin);
if (c.calificacion !== undefined) patch.calificacion = Number(c.calificacion) || 0; if (c.comentario !== undefined) patch.comentario = c.comentario; if (c.horas !== undefined) patch.horas = c.horas; if (c.esRewatch !== undefined) patch.es_rewatch = !!c.esRewatch;
const fEm = email ? `&user_email=eq.${encodeURIComponent(email)}` : ''; await sbFetch_(`registros?id=eq.${encodeURIComponent(target)}${fEm}`, 'PATCH', patch); return { exito: true }; } catch (e) { return { exito: false, error: e.toString() }; }
}, async eliminarRegistro(id, fallbackInfo, userEmail) { try { const email = normEm_(userEmail); const targetId = String(id || '').trim(); const fEm = email ? `&user_email=eq.${encodeURIComponent(email)}` : '';
if (targetId) { await sbFetch_(`registros?id=eq.${encodeURIComponent(targetId)}${fEm}`, 'DELETE'); return { exito: true }; }
if (fallbackInfo && fallbackInfo.titulo && email) { await sbFetch_(`registros?user_email=eq.${encodeURIComponent(email)}&titulo=eq.${encodeURIComponent(fallbackInfo.titulo)}`, 'DELETE'); return { exito: true }; }
return { exito: false, error: tLang('Registro no encontrado', 'Record not found') }; } catch (e) { return { exito: false, error: e.toString() }; }
}, async obtenerWatchlist(userEmail) { try { const email = normEm_(userEmail); if (!email) return []; const data = await sbFetch_(`watchlist?user_email=eq.${encodeURIComponent(email)}&select=*&order=created_at.asc`, 'GET') || []; return data.map(r => ({
id: String(r.id || ''), categoria: String(r.categoria || ''), subcategoria: String(r.subcategoria || ''), titulo: String(r.titulo || ''),
subtitulo: String(r.subtitulo || ''), creador: String(r.creador || ''), anio: String(r.anio || ''), poster: String(r.poster || ''), fechaAgregado: fmtFecha_(r.fecha_agregado)
})); } catch (e) { return []; }
}, async guardarEnWatchlist(item, userEmail) { try { const email = normEm_(userEmail || item?.userEmail); if (!email) return { exito: false, error: tLang('Inicia sesión para guardar en tu Watchlist.', 'Sign in to save to your Watchlist.') }; const hoy = new Date();
const fechaTxt = `${String(hoy.getDate()).padStart(2,'0')}/${String(hoy.getMonth()+1).padStart(2,'0')}/${hoy.getFullYear()}`;
await sbFetch_('watchlist', 'POST', { id: uuid_(), user_email: email, categoria: item.categoria || '', subcategoria: item.subcategoria || '', titulo: item.titulo || tLang('Sin título', 'Untitled'), subtitulo: item.subtitulo || '', creador: item.creador || '', anio: String(item.anio || ''), poster: item.poster || '', fecha_agregado: fechaTxt });
return { exito: true }; } catch (e) { return { exito: false, error: e.toString() }; }
}, async eliminarDeWatchlist(id, userEmail) { try { const email = normEm_(userEmail); const fEm = email ? `&user_email=eq.${encodeURIComponent(email)}` : ''; await sbFetch_(`watchlist?id=eq.${encodeURIComponent(String(id))}${fEm}`, 'DELETE'); return { exito: true };
} catch (e) { return { exito: false, error: e.toString() }; }
}, async sincronizarYRepararRegistros(userEmail) {
  try {
    const email = normEm_(userEmail);
    if (!email) return { reparados: 0, detalles: [] };
    const [data, wlData] = await Promise.all([
      sbFetch_(`registros?user_email=eq.${encodeURIComponent(email)}&select=*`, 'GET').catch(() => []),
      sbFetch_(`watchlist?user_email=eq.${encodeURIComponent(email)}&select=*`, 'GET').catch(() => [])
    ]);
    const registros = Array.isArray(data) ? data : [];
    const watchlists = Array.isArray(wlData) ? wlData : [];
    let reparados = 0;
    const detallesReparados = [];
    let resolucionesExternas = 0;

    // Helper para detectar creadores faltantes, genéricos o erróneos
    const esCreadorInvalido_ = (cr) => {
      if (!cr) return true;
      const s = String(cr).trim().toLowerCase();
      return ['desconocido', 'sin creador', 'n/d', 'nd', 'null', 'undefined', 'cine', 'documental', 'serie tv', 'docuserie', 'videojuego', 'artista', 'autor', 'manga', 'director desconocido', 'desconocida'].includes(s);
    };

    // Helper para normalizar formato fecha ISO YYYY-MM-DD -> DD/MM/YYYY
    const normalizarFechaFormato_ = (f) => {
      if (!f || f === 'Sin fecha' || f === 'null' || f === 'undefined') return 'Sin fecha';
      const mIso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(f).trim());
      if (mIso) {
        const dia = String(mIso[3]).padStart(2, '0');
        const mes = String(mIso[2]).padStart(2, '0');
        const anio = mIso[1];
        return `${dia}/${mes}/${anio}`;
      }
      return String(f).trim();
    };

    // Helper para resolver creador o director real consultando las APIs correspondientes
    const resolverCreadorFaltante_ = async (cat, sub, tit) => {
      if (!tit) return null;
      const q = encodeURIComponent(String(tit).replace(/\s*\[S\d+\]$/, '').split(':')[0].trim());
      try {
        if (cat === 'Peliculas') {
          const m = (await getJson_(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_K}&query=${q}&language=es-ES`))?.results?.[0];
          if (m) {
            const credits = await getJson_(`https://api.themoviedb.org/3/movie/${m.id}/credits?api_key=${TMDB_K}`).catch(() => null);
            const dirs = (credits?.crew || []).filter(x => x.job === 'Director').map(x => x.name);
            const cr = dirs.length ? dirs.slice(0, 2).join(', ') : null;
            const poster = m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : null;
            const anio = m.release_date ? m.release_date.substring(0, 4) : null;
            return { creador: cr, poster, anio };
          }
        } else if (cat === 'Series') {
          const s = (await getJson_(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_K}&query=${q}&language=es-ES`))?.results?.[0];
          if (s) {
            const det = await getJson_(`https://api.themoviedb.org/3/tv/${s.id}?api_key=${TMDB_K}`).catch(() => null);
            const crs = (det?.created_by || []).map(x => x.name);
            const net = (det?.networks || []).map(x => x.name).join(', ');
            const cr = crs.length ? crs.slice(0, 2).join(', ') : (net || null);
            const poster = s.poster_path ? `https://image.tmdb.org/t/p/w185${s.poster_path}` : null;
            const anio = s.first_air_date ? s.first_air_date.substring(0, 4) : null;
            return { creador: cr, poster, anio };
          }
        } else if (cat === 'Juegos') {
          const g = (await getJson_(`https://api.rawg.io/api/games?key=${RAWG_K}&search=${q}&page_size=1`))?.results?.[0];
          if (g) {
            const det = await getJson_(`https://api.rawg.io/api/games/${g.id}?key=${RAWG_K}`).catch(() => null);
            const devs = (det?.developers || []).map(x => x.name);
            const pubs = (det?.publishers || []).map(x => x.name);
            const cr = devs.length ? devs.slice(0, 2).join(', ') : (pubs.slice(0, 2).join(', ') || null);
            const poster = optimizarUrlPoster(g.background_image, "thumb") || null;
            const anio = g.released ? g.released.substring(0, 4) : null;
            return { creador: cr, poster, anio };
          }
          const stm = (await getSteamJson_(`https://store.steampowered.com/api/storesearch/?term=${q}&l=spanish&cc=US`))?.items?.[0];
          if (stm) {
            const stmDet = (await getSteamJson_(`https://store.steampowered.com/api/appdetails?appids=${stm.id}&l=spanish`))?.[stm.id]?.data;
            const devs = stmDet?.developers || [];
            const pubs = stmDet?.publishers || [];
            const cr = devs.length ? devs.slice(0, 2).join(', ') : (pubs.slice(0, 2).join(', ') || 'Steam');
            const poster = stmDet?.header_image || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${stm.id}/header.jpg`;
            const anio = stmDet?.release_date?.date ? (stmDet.release_date.date.match(/\d{4}/)?.[0] || null) : null;
            return { creador: cr, poster, anio };
          }
        } else if (cat === 'Lecturas') {
          const ol = await getJson_(`https://openlibrary.org/search.json?q=${q}&limit=1`).catch(() => null);
          const doc = ol?.docs?.[0];
          if (doc) {
            const cr = doc.author_name?.length ? doc.author_name.slice(0, 2).join(', ') : null;
            const poster = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null;
            const anio = doc.first_publish_year ? String(doc.first_publish_year) : null;
            return { creador: cr, poster, anio };
          }
        } else if (cat === 'Musica') {
          const it = (await getJson_(`https://itunes.apple.com/search?term=${q}&entity=album&limit=1`))?.results?.[0];
          if (it?.artistName) {
            return {
              creador: it.artistName,
              poster: (it.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
              anio: it.releaseDate ? it.releaseDate.substring(0, 4) : null
            };
          }
        }
      } catch (err) {}
      return null;
    };

    // 1. AUDITAR Y REPARAR TABLA DE REGISTROS
    for (const r of registros) {
      const patch = {};

      // A. Inconsistencias de formato de fechas (ISO YYYY-MM-DD -> DD/MM/YYYY)
      const fInorm = normalizarFechaFormato_(r.fecha_inicio);
      const fFnorm = normalizarFechaFormato_(r.fecha_fin);
      if (fInorm !== (r.fecha_inicio || 'Sin fecha')) patch.fecha_inicio = fInorm;
      if (fFnorm !== (r.fecha_fin || 'Sin fecha')) patch.fecha_fin = fFnorm;

      // B. Subcategorías que solo llevan 1 fecha (Películas, Documentales, Discos, Artistas/Grupos)
      const subLow = String(r.subcategoria || '').toLowerCase();
      const esFechaUnica = (r.categoria === 'Peliculas' && !subLow.includes('serie')) ||
                           (r.categoria === 'Musica') ||
                           subLow === 'película' || subLow === 'películas' || subLow === 'documental' || subLow === 'documentales' || subLow === 'discos' || subLow === 'artistas/grupos';
      if (esFechaUnica) {
        if (fInorm === 'Sin fecha' && fFnorm !== 'Sin fecha') {
          patch.fecha_inicio = fFnorm;
          patch.fecha_fin = 'Sin fecha';
        } else if (fFnorm !== 'Sin fecha') {
          patch.fecha_fin = 'Sin fecha';
        }
      }

      // C. Normalizar nombres antiguos o singulares de subcategoría
      if (subLow === 'pelicula') patch.subcategoria = 'Películas';
      else if (subLow === 'documental') patch.subcategoria = 'Documentales';
      else if (subLow === 'serie') patch.subcategoria = 'Series Completas';
      else if (subLow === 'docuserie') patch.subcategoria = 'Series Documentales';
      else if (subLow === 'videojuego') patch.subcategoria = 'Videojuegos';
      else if (subLow === 'disco') patch.subcategoria = 'Discos';
      else if (subLow === 'artista' || subLow === 'artistas') patch.subcategoria = 'Artistas/Grupos';
      else if (subLow === 'comic') patch.subcategoria = 'Cómics';
      else if (subLow === 'manga') patch.subcategoria = 'Mangas';
      else if (subLow === 'libro') patch.subcategoria = 'Libros';

      // D. Comentario con puntuación adecuada
      const com = String(r.comentario || '').trim();
      if (com !== '' && !/[.!?:;]$/.test(com)) {
        patch.comentario = `${com}.`;
      }

      // E. Creador / Director ausente, erróneo o genérico (máx 3 llamadas externas por auditoría para rapidez)
      if (resolucionesExternas < 3 && esCreadorInvalido_(r.creador)) {
        try {
          const info = await resolverCreadorFaltante_(r.categoria, r.subcategoria, r.titulo);
          resolucionesExternas++;
          if (info && info.creador) {
            patch.creador = info.creador;
            if (!r.poster && info.poster) patch.poster = info.poster;
            if (!r.anio && info.anio) patch.anio = info.anio;
          }
        } catch (e) {}
      }

      // F. Póster faltante si sigue vacío
      if (resolucionesExternas < 3 && !r.poster && !patch.poster) {
        try {
          const pGen = await SERVER_API.buscarPortadaGenerica(r.titulo, patch.creador || r.creador, r.categoria);
          resolucionesExternas++;
          if (pGen) patch.poster = pGen;
        } catch (e) {}
      }

      // Aplicar actualización si hubo correcciones
      if (Object.keys(patch).length > 0) {
        await sbFetch_(`registros?id=eq.${encodeURIComponent(r.id)}&user_email=eq.${encodeURIComponent(email)}`, 'PATCH', patch);
        reparados++;
        detallesReparados.push(r.titulo);
      }
    }

    // 2. AUDITAR Y REPARAR TABLA WATCHLIST
    for (const w of watchlists) {
      const wPatch = {};
      const subLow = String(w.subcategoria || '').toLowerCase();
      if (subLow === 'pelicula') wPatch.subcategoria = 'Películas';
      else if (subLow === 'comic') wPatch.subcategoria = 'Cómics';
      else if (subLow === 'manga') wPatch.subcategoria = 'Mangas';
      else if (subLow === 'libro') wPatch.subcategoria = 'Libros';

      if (resolucionesExternas < 5 && esCreadorInvalido_(w.creador)) {
        try {
          const info = await resolverCreadorFaltante_(w.categoria, w.subcategoria, w.titulo);
          resolucionesExternas++;
          if (info && info.creador) {
            wPatch.creador = info.creador;
            if (!w.poster && info.poster) wPatch.poster = info.poster;
          }
        } catch (e) {}
      }
      if (resolucionesExternas < 5 && !w.poster && !wPatch.poster) {
        try {
          const pGen = await SERVER_API.buscarPortadaGenerica(w.titulo, wPatch.creador || w.creador, w.categoria);
          resolucionesExternas++;
          if (pGen) wPatch.poster = pGen;
        } catch (e) {}
      }
      if (Object.keys(wPatch).length > 0) {
        await sbFetch_(`watchlist?id=eq.${encodeURIComponent(w.id)}&user_email=eq.${encodeURIComponent(email)}`, 'PATCH', wPatch);
        reparados++;
      }
    }

    // 3. AUDITAR Y ACTUALIZAR PROMEDIOS DE ARTISTAS Y SERIES COMPLETAS
    const discosMusica = registros.filter(r => r.categoria === 'Musica' && (r.subcategoria === 'Discos' || r.subcategoria === 'Disco'));
    const artistasMusica = registros.filter(r => r.categoria === 'Musica' && (r.subcategoria === 'Artistas/Grupos' || r.subcategoria === 'Artistas' || r.subcategoria.includes('Artista')));
    for (const art of artistasMusica) {
      const artNorm = String(art.titulo || art.creador || '').trim().toLowerCase();
      if (!artNorm) continue;
      const discosArt = discosMusica.filter(d => {
        const cr = String(d.creador || '').trim().toLowerCase();
        const ti = String(d.titulo || '').trim().toLowerCase();
        return (cr === artNorm || ti === artNorm) && Number(d.calificacion) > 0;
      });
      if (discosArt.length > 0) {
        const promArt = Math.round((discosArt.reduce((a, b) => a + Number(b.calificacion), 0) / discosArt.length) * 10) / 10;
        if (Number(art.calificacion) !== promArt) {
          await sbFetch_(`registros?id=eq.${encodeURIComponent(art.id)}&user_email=eq.${encodeURIComponent(email)}`, 'PATCH', { calificacion: promArt });
          reparados++;
          detallesReparados.push(`Calificación promedio de ${art.titulo} (${promArt})`);
        }
      }
    }

    const temporadasSeries = registros.filter(r => r.categoria === 'Series' && (r.subcategoria === 'Temporadas' || r.subcategoria.includes('Temporada')));
    const seriesCompletas = registros.filter(r => r.categoria === 'Series' && (r.subcategoria === 'Series Completas' || r.subcategoria.includes('Completa')));
    for (const sc of seriesCompletas) {
      const titNorm = String(sc.titulo || '').trim().toLowerCase();
      if (!titNorm) continue;
      const tempsSc = temporadasSeries.filter(t => {
        const tTit = String(t.titulo || '').trim().toLowerCase();
        return (tTit.startsWith(titNorm + ' [') || tTit === titNorm) && Number(t.calificacion) > 0;
      });
      if (tempsSc.length > 0) {
        const promSc = Math.round((tempsSc.reduce((a, b) => a + Number(b.calificacion), 0) / tempsSc.length) * 10) / 10;
        if (Number(sc.calificacion) !== promSc) {
          await sbFetch_(`registros?id=eq.${encodeURIComponent(sc.id)}&user_email=eq.${encodeURIComponent(email)}`, 'PATCH', { calificacion: promSc });
          reparados++;
          detallesReparados.push(`Calificación promedio de ${sc.titulo} (${promSc})`);
        }
      }
    }

    return { reparados, detalles: detallesReparados };
  } catch (e) {
    return { reparados: 0, error: e.toString() };
  }
}, async obtenerDescubrimientos(seedPage, gustosUsuario = null) {
  const isEn = (typeof getLang_ === 'function' && getLang_() === 'en');
  const tmdbLang = isEn ? 'en-US' : 'es-ES';
  const datos = {
    peliculas: [],
    documentales: [],
    series: [],
    docuseries: [],
    musica: [],
    juegos: [],
    libros: [],
    comics: [],
    mangas: [],
    timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
  const p1 = seedPage ? ((Number(seedPage) % 4) + 1) : 1;
  const p2 = p1 + 1;
  const offOl = (p1 - 1) * 12;
  const offK1 = (p1 - 1) * 20;

  const favPeli = gustosUsuario?.peliculas?.[0];
  const favSerie = gustosUsuario?.series?.[0];
  const favLibro = gustosUsuario?.libros?.[0];

  const peliQuery = favPeli?.cr ? `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_K}&query=${encodeURIComponent(favPeli.cr)}&language=${tmdbLang}` : null;
  const serieQuery = (favSerie?.cr || favSerie?.tit) ? `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_K}&query=${encodeURIComponent(favSerie.cr || favSerie.tit)}&language=${tmdbLang}` : null;
  const libroQuery = favLibro?.cr ? `https://openlibrary.org/search.json?author=${encodeURIComponent(favLibro.cr)}&limit=6` : null;

  const urls = [
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_K}&language=${tmdbLang}&page=${p1}`,
    `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_K}&primary_release_date.gte=1998-01-01&sort_by=vote_count.desc&language=${tmdbLang}&page=${p1}`,
    `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_K}&primary_release_date.gte=2024-01-01&sort_by=popularity.desc&vote_count.gte=25&language=${tmdbLang}&page=${p2}`,
    `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_K}&with_genres=99&primary_release_date.gte=2010-01-01&sort_by=vote_count.desc&language=${tmdbLang}&page=${p1}`,
    `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_K}&with_genres=99&primary_release_date.gte=2023-01-01&sort_by=popularity.desc&language=${tmdbLang}&page=${p2}`,
    `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_K}&language=${tmdbLang}&page=${p1}`,
    `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_K}&first_air_date.gte=1999-01-01&sort_by=vote_count.desc&language=${tmdbLang}&page=${p1}`,
    `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_K}&first_air_date.gte=2023-01-01&sort_by=popularity.desc&vote_count.gte=15&language=${tmdbLang}&page=${p2}`,
    `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_K}&with_genres=99&first_air_date.gte=2012-01-01&sort_by=vote_count.desc&language=${tmdbLang}&page=${p1}`,
    `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_K}&with_genres=99&first_air_date.gte=2022-01-01&sort_by=popularity.desc&language=${tmdbLang}&page=${p2}`,
    `https://api.deezer.com/chart/0/albums?index=${offOl}&limit=14`,
    `https://api.deezer.com/chart/0/artists?index=${offOl}&limit=14`,
    `https://api.rawg.io/api/games?key=${RAWG_K}&dates=2010-01-01,2026-12-31&ordering=-added&page_size=24&page=${p1}`,
    `https://openlibrary.org/search.json?q=bestseller+fiction&sort=editions&limit=24&offset=${offOl}`,
    `https://openlibrary.org/search.json?publisher=Marvel+Comics&sort=new&limit=35&offset=${offOl}`,
    `https://openlibrary.org/search.json?publisher=DC+Comics&sort=new&limit=35&offset=${offOl}`,
    `https://kitsu.io/api/edge/manga?sort=-user_count&page[limit]=20&page[offset]=${offK1}`
  ];

  try {
    const resps = await Promise.all([
      ...urls.map(u => getJson_(u)),
      peliQuery ? getJson_(peliQuery) : Promise.resolve(null),
      serieQuery ? getJson_(serieQuery) : Promise.resolve(null),
      libroQuery ? getJson_(libroQuery) : Promise.resolve(null)
    ]);

    const tmdbPeliTrend = resps[0], tmdbPeliPop = resps[1], tmdbPeliDisc = resps[2];
    const tmdbDocu1 = resps[3], tmdbDocu2 = resps[4];
    const tmdbTvTrend = resps[5], tmdbTvPop = resps[6], tmdbTvDisc = resps[7];
    const tmdbDocTv1 = resps[8], tmdbDocTv2 = resps[9];
    const dzAlbums = resps[10]?.data || [], dzArtists = resps[11]?.data || [];
    const rawgGames = resps[12]?.results || [];
    const olBooks = resps[13]?.docs || [];
    const olMarvel = resps[14]?.docs || [];
    const olDc = resps[15]?.docs || [];
    const kitsuManga = resps[16]?.data || [];
    const customPeli = resps[17]?.results || [];
    const customSerie = resps[18]?.results || [];
    const customLibro = resps[19]?.docs || [];

    // --- 1. PELÍCULAS (Tendencias + Populares/Aclamadas + Gustos) ---
    const vistosPeli = new Set();
    const agregarPeli = (m, motivo) => {
      if (!m || !m.poster_path || vistosPeli.has(m.id) || datos.peliculas.length >= 24) return;
      vistosPeli.add(m.id);
      const tits = fmtTitIdioma_(m.original_title, m.title, m.original_language);
      datos.peliculas.push({
        idRef: m.id,
        categoria: 'Peliculas',
        subcategoria: 'Películas',
        titulo: tits.titulo,
        tituloOriginal: tits.tituloOriginal,
        tituloIngles: tits.tituloIngles,
        creador: tLang('Cine', 'Cinema'),
        anio: m.release_date ? m.release_date.substring(0, 4) : '2026',
        sinopsis: m.overview || '',
        poster: `https://image.tmdb.org/t/p/w185${m.poster_path}`,
        motivo: motivo
      });
    };
    customPeli.forEach(m => agregarPeli(m, favPeli?.cr ? tLang(`Porque te gusta ${favPeli.cr}`, `Because you like ${favPeli.cr}`) : tLang('Recomendado', 'Recommended')));
    (tmdbPeliTrend?.results || []).slice(0, 8).forEach(m => agregarPeli(m, tLang('Tendencia', 'Trending')));
    (tmdbPeliPop?.results || []).slice(0, 10).forEach(m => agregarPeli(m, tLang('Popular / Aclamada', 'Popular / Acclaimed')));
    (tmdbPeliDisc?.results || []).forEach(m => agregarPeli(m, tLang('Estreno reciente', 'Recent release')));

    // --- 2. DOCUMENTALES ---
    const vistosDoc = new Set();
    const agregarDoc = (m, motivo = tLang('Aclamado', 'Acclaimed')) => {
      if (!m || !m.poster_path || vistosDoc.has(m.id) || datos.documentales.length >= 24) return;
      vistosDoc.add(m.id);
      const tits = fmtTitIdioma_(m.original_title, m.title, m.original_language);
      datos.documentales.push({
        idRef: m.id,
        categoria: 'Peliculas',
        subcategoria: 'Documentales',
        titulo: tits.titulo,
        tituloOriginal: tits.tituloOriginal,
        tituloIngles: tits.tituloIngles,
        creador: tLang('Documental', 'Documentary'),
        anio: m.release_date ? m.release_date.substring(0, 4) : '2025',
        sinopsis: m.overview || '',
        poster: `https://image.tmdb.org/t/p/w185${m.poster_path}`,
        motivo: motivo
      });
    };
    (tmdbDocu1?.results || []).slice(0, 12).forEach(m => agregarDoc(m, tLang('Documental Aclamado', 'Acclaimed Documentary')));
    (tmdbDocu2?.results || []).forEach(m => agregarDoc(m, tLang('Reciente', 'Recent')));

    // --- 3. SERIES (Tendencias + Populares/Aclamadas + Gustos) ---
    const vistosTv = new Set();
    const agregarTv = (s, motivo) => {
      if (!s || !s.poster_path || vistosTv.has(s.id) || datos.series.length >= 24) return;
      vistosTv.add(s.id);
      const tits = fmtTitIdioma_(s.original_name, s.name, s.original_language);
      datos.series.push({
        idRef: s.id,
        categoria: 'Series',
        subcategoria: 'Series Completas',
        titulo: tits.titulo,
        tituloOriginal: tits.tituloOriginal,
        tituloIngles: tits.tituloIngles,
        creador: tLang('Serie TV', 'TV Series'),
        anio: s.first_air_date ? s.first_air_date.substring(0, 4) : '2026',
        sinopsis: s.overview || '',
        poster: `https://image.tmdb.org/t/p/w185${s.poster_path}`,
        motivo: motivo
      });
    };
    customSerie.forEach(s => agregarTv(s, favSerie?.cr ? tLang(`Porque te gusta ${favSerie.cr}`, `Because you like ${favSerie.cr}`) : tLang('Recomendado', 'Recommended')));
    (tmdbTvTrend?.results || []).slice(0, 8).forEach(s => agregarTv(s, tLang('En emisión', 'Airing Now')));
    (tmdbTvPop?.results || []).slice(0, 10).forEach(s => agregarTv(s, tLang('Aclamada / Popular', 'Acclaimed / Popular')));
    (tmdbTvDisc?.results || []).forEach(s => agregarTv(s, tLang('Tendencia', 'Trending')));

    // --- 4. DOCUSERIES ---
    const vistosDocTv = new Set();
    [...(tmdbDocTv1?.results || []), ...(tmdbDocTv2?.results || [])].forEach(s => {
      if (!s || !s.poster_path || vistosDocTv.has(s.id) || datos.docuseries.length >= 24) return;
      vistosDocTv.add(s.id);
      const tits = fmtTitIdioma_(s.original_name, s.name, s.original_language);
      datos.docuseries.push({
        idRef: s.id,
        categoria: 'Series',
        subcategoria: 'Series Documentales',
        titulo: tits.titulo,
        tituloOriginal: tits.tituloOriginal,
        tituloIngles: tits.tituloIngles,
        creador: tLang('Docuserie', 'Docuseries'),
        anio: s.first_air_date ? s.first_air_date.substring(0, 4) : '2025',
        sinopsis: s.overview || '',
        poster: `https://image.tmdb.org/t/p/w185${s.poster_path}`,
        motivo: tLang('Docuserie', 'Docuseries')
      });
    });

    // --- ENRIQUECER CREADORES EN PELÍCULAS, DOCUMENTALES Y SERIES EN PARALELO ---
    try {
      const topPelis = datos.peliculas.slice(0, 10);
      const topDocs = datos.documentales.slice(0, 6);
      const topTvSeries = datos.series.slice(0, 10);
      const topDocSeries = datos.docuseries.slice(0, 6);

      const [peliCredits, docCredits, tvDetails, docTvDetails] = await Promise.all([
        Promise.all(topPelis.map(m => getJson_(`https://api.themoviedb.org/3/movie/${m.idRef}/credits?api_key=${TMDB_K}`).catch(() => null))),
        Promise.all(topDocs.map(m => getJson_(`https://api.themoviedb.org/3/movie/${m.idRef}/credits?api_key=${TMDB_K}`).catch(() => null))),
        Promise.all(topTvSeries.map(s => getJson_(`https://api.themoviedb.org/3/tv/${s.idRef}?api_key=${TMDB_K}`).catch(() => null))),
        Promise.all(topDocSeries.map(s => getJson_(`https://api.themoviedb.org/3/tv/${s.idRef}?api_key=${TMDB_K}`).catch(() => null)))
      ]);

      peliCredits.forEach((c, idx) => {
        const dirs = (c?.crew || []).filter(x => x.job === 'Director').map(x => x.name);
        if (dirs.length) topPelis[idx].creador = dirs.slice(0, 2).join(', ');
      });
      docCredits.forEach((c, idx) => {
        const dirs = (c?.crew || []).filter(x => x.job === 'Director').map(x => x.name);
        if (dirs.length) topDocs[idx].creador = dirs.slice(0, 2).join(', ');
      });
      tvDetails.forEach((det, idx) => {
        const crs = (det?.created_by || []).map(x => x.name);
        const net = (det?.networks || []).map(x => x.name).join(', ');
        if (crs.length) topTvSeries[idx].creador = crs.slice(0, 2).join(', ');
        else if (net) topTvSeries[idx].creador = net;
      });
      docTvDetails.forEach((det, idx) => {
        const crs = (det?.created_by || []).map(x => x.name);
        const net = (det?.networks || []).map(x => x.name).join(', ');
        if (crs.length) topDocSeries[idx].creador = crs.slice(0, 2).join(', ');
        else if (net) topDocSeries[idx].creador = net;
      });
    } catch(e) {}

    // --- 5. MÚSICA (Tendencias + Álbumes Aclamados y Populares) ---
    const ALBUMS_ICONICOS_POPULARES = [
      { titulo: 'Discovery', creador: 'Daft Punk', anio: '2001', poster: 'https://e-cdns-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/500x500.jpg', motivo: tLang('Álbum Aclamado', 'Acclaimed Album') },
      { titulo: 'DAMN.', creador: 'Kendrick Lamar', anio: '2017', poster: 'https://e-cdns-images.dzcdn.net/images/cover/9079f8fae54148e658ec9a187cbcf493/500x500.jpg', motivo: tLang('Ganador Pulitzer', 'Pulitzer Winner') },
      { titulo: 'OK Computer', creador: 'Radiohead', anio: '1997', poster: 'https://e-cdns-images.dzcdn.net/images/cover/018b14a8449e0c5213d2f9540b6e6815/500x500.jpg', motivo: tLang('Clásico Moderno', 'Modern Classic') },
      { titulo: 'MOTOMAMI', creador: 'Rosalía', anio: '2022', poster: 'https://e-cdns-images.dzcdn.net/images/cover/dc657fa4cb8547285513264ec4d9be2b/500x500.jpg', motivo: tLang('Tendencia Global', 'Global Trending') },
      { titulo: 'Demon Days', creador: 'Gorillaz', anio: '2005', poster: 'https://e-cdns-images.dzcdn.net/images/cover/3c4e17ef749b5c3be6d7d427d14b03ea/500x500.jpg', motivo: tLang('Álbum Aclamado', 'Acclaimed Album') },
      { titulo: 'AM', creador: 'Arctic Monkeys', anio: '2013', poster: 'https://e-cdns-images.dzcdn.net/images/cover/f04c6ca9c76c0ee78ddcfdbb5059d47d/500x500.jpg', motivo: 'Bestseller' },
      { titulo: 'The Dark Side of the Moon', creador: 'Pink Floyd', anio: '1973', poster: 'https://e-cdns-images.dzcdn.net/images/cover/6c62c2f6f4dcfbc0ef0528659d6e42b2/500x500.jpg', motivo: tLang('Hito Histórico', 'Historic Milestone') },
      { titulo: 'After Hours', creador: 'The Weeknd', anio: '2020', poster: 'https://e-cdns-images.dzcdn.net/images/cover/36a10738a9d166ec9d71fa5178f5f68b/500x500.jpg', motivo: tLang('Top Mundial', 'Global Top') }
    ];

    for (let i = 0; i < Math.max(dzAlbums.length, dzArtists.length); i++) {
      if (dzAlbums[i] && datos.musica.length < 24) {
        const al = dzAlbums[i];
        datos.musica.push({
          categoria: 'Musica',
          subcategoria: 'Discos',
          titulo: al.title,
          tituloOriginal: al.title,
          tituloIngles: '',
          creador: al.artist?.name || tLang('Artista', 'Artist'),
          anio: tLang('Disco', 'Album'),
          poster: al.cover_big || al.cover_medium || '',
          motivo: tLang('Álbum en Tendencia', 'Trending Album')
        });
      }
      if (dzArtists[i] && datos.musica.length < 24) {
        const a = dzArtists[i];
        datos.musica.push({
          categoria: 'Musica',
          subcategoria: 'Artistas/Grupos',
          titulo: a.name,
          tituloOriginal: a.name,
          tituloIngles: '',
          creador: tLang('Artista / Grupo', 'Artist / Band'),
          anio: '',
          poster: a.picture_big || a.picture_medium || '',
          motivo: tLang('Artista Top', 'Top Artist')
        });
      }
      if (ALBUMS_ICONICOS_POPULARES[i] && datos.musica.length < 24) {
        const iconico = ALBUMS_ICONICOS_POPULARES[i];
        datos.musica.push({
          categoria: 'Musica',
          subcategoria: 'Discos',
          titulo: iconico.titulo,
          tituloOriginal: iconico.titulo,
          tituloIngles: '',
          creador: iconico.creador,
          anio: iconico.anio,
          poster: iconico.poster,
          motivo: iconico.motivo
        });
      }
    }

    // --- 6. VIDEOJUEGOS (Populares + Tendencias) ---
    datos.juegos = rawgGames.slice(0, 24).map(g => ({
      idRef: g.id,
      categoria: 'Juegos',
      subcategoria: 'Videojuegos',
      titulo: g.name,
      tituloOriginal: g.name,
      tituloIngles: '',
      creador: (g.genres || []).map(x => x.name).slice(0, 2).join(', ') || tLang('Videojuego', 'Video Game'),
      anio: g.released ? g.released.substring(0, 4) : '2025',
      poster: optimizarUrlPoster(g.background_image, "thumb") || '',
      motivo: (g.rating && g.rating >= 4.2) || (g.added && g.added > 8000) ? tLang('Popular / Aclamado', 'Popular / Acclaimed') : tLang('Tendencia', 'Trending')
    }));

    // Obtener estudio desarrollador para los mejores juegos en paralelo
    try {
      const topGames = datos.juegos.slice(0, 8);
      const gameDets = await Promise.all(topGames.map(g => getJson_(`https://api.rawg.io/api/games/${g.idRef}?key=${RAWG_K}`).catch(() => null)));
      gameDets.forEach((det, idx) => {
        const devs = (det?.developers || []).map(d => d.name);
        const pubs = (det?.publishers || []).map(p => p.name);
        if (devs.length) topGames[idx].creador = devs.slice(0, 2).join(', ');
        else if (pubs.length) topGames[idx].creador = pubs.slice(0, 2).join(', ');
      });
    } catch(e) {}

    // --- 7. LIBROS (Bestsellers Populares y Novedades sin obras arcaicas) ---
    const vistosLibros = new Set();
    const agregarLibro = (b, motivo) => {
      if (!b || !b.title || vistosLibros.has(b.title.toLowerCase()) || datos.libros.length >= 24) return;
      const anioPub = Number(b.first_publish_year);
      // Obras modernas populares (>= 1975) evitando textos del siglo XIX
      if (anioPub && anioPub < 1975) return;
      vistosLibros.add(b.title.toLowerCase());
      datos.libros.push({
        categoria: 'Lecturas',
        subcategoria: 'Libros',
        titulo: b.title,
        tituloOriginal: b.title,
        tituloIngles: '',
        creador: b.author_name?.length ? b.author_name.slice(0, 2).join(', ') : tLang('Autor', 'Author'),
        anio: b.first_publish_year ? String(b.first_publish_year) : '2025',
        poster: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : '',
        motivo: motivo || tLang('Destacado', 'Featured')
      });
    };
    customLibro.forEach(b => agregarLibro(b, favLibro?.cr ? tLang(`Porque te gusta ${favLibro.cr}`, `Because you like ${favLibro.cr}`) : tLang('Recomendado', 'Recommended')));
    olBooks.forEach(b => agregarLibro(b, (b.edition_count > 60) ? tLang('Bestseller Popular', 'Popular Bestseller') : tLang('Destacado', 'Featured')));

    // --- 8. CÓMICS (Exclusivamente MARVEL y DC - Recientes y Tendencias) ---
    const COMICS_FALLBACK = [
      { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Absolute Batman Vol. 1', tituloOriginal: 'Absolute Batman Vol. 1', tituloIngles: '', creador: 'Scott Snyder, Nick Dragotta', anio: '2025', poster: 'https://covers.openlibrary.org/b/id/15113626-M.jpg', motivo: tLang('DC Comics • Novedad', 'DC Comics • New') },
      { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Thunderbolts', tituloOriginal: 'Thunderbolts', tituloIngles: '', creador: 'Collin Kelly, Jackson Lanzing', anio: '2024', poster: 'https://covers.openlibrary.org/b/id/15203284-M.jpg', motivo: tLang('Marvel Comics • Tendencia', 'Marvel Comics • Trending') },
      { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Absolute Superman, Vol. 1', tituloOriginal: 'Absolute Superman, Vol. 1', tituloIngles: '', creador: 'Jason Aaron, Rafa Sandoval', anio: '2025', poster: 'https://covers.openlibrary.org/b/id/15138771-M.jpg', motivo: tLang('DC Comics • Novedad', 'DC Comics • New') },
      { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Daredevil by Chip Zdarsky Omnibus, Vol. 1', tituloOriginal: 'Daredevil by Chip Zdarsky Omnibus, Vol. 1', tituloIngles: '', creador: 'Chip Zdarsky, Marco Checchetto', anio: '2024', poster: 'https://covers.openlibrary.org/b/id/15249017-M.jpg', motivo: tLang('Marvel Comics • Aclamado', 'Marvel Comics • Acclaimed') },
      { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Absolute Wonder Woman, Vol. 1', tituloOriginal: 'Absolute Wonder Woman, Vol. 1', tituloIngles: '', creador: 'Kelly Thompson, Hayden Sherman', anio: '2025', poster: 'https://covers.openlibrary.org/b/id/15108588-M.jpg', motivo: tLang('DC Comics • Novedad', 'DC Comics • New') },
      { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'King in Black', tituloOriginal: 'King in Black', tituloIngles: '', creador: 'Donny Cates, Ryan Stegman', anio: '2021', poster: 'https://covers.openlibrary.org/b/id/12381210-M.jpg', motivo: tLang('Marvel Comics • Tendencia', 'Marvel Comics • Trending') },
      { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Supergirl: Woman of Tomorrow', tituloOriginal: 'Supergirl: Woman of Tomorrow', tituloIngles: '', creador: 'Tom King, Bilquis Evely', anio: '2022', poster: 'https://covers.openlibrary.org/b/id/13195853-M.jpg', motivo: tLang('DC Comics • Aclamado', 'DC Comics • Acclaimed') },
      { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'House of X / Powers of X', tituloOriginal: 'House of X / Powers of X', tituloIngles: '', creador: 'Jonathan Hickman, Pepe Larraz', anio: '2020', poster: 'https://covers.openlibrary.org/b/id/9409849-M.jpg', motivo: tLang('Marvel Comics • Hito', 'Marvel Comics • Milestone') },
      { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Nightwing Vol. 1: Leaping into the Light', tituloOriginal: 'Nightwing Vol. 1: Leaping into the Light', tituloIngles: '', creador: 'Tom Taylor, Bruno Redondo', anio: '2021', poster: 'https://covers.openlibrary.org/b/id/12649586-M.jpg', motivo: tLang('DC Comics • Top Ventas', 'DC Comics • Bestseller') },
      { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Moon Knight Vol. 1: Midnight Mission', tituloOriginal: 'Moon Knight Vol. 1: Midnight Mission', tituloIngles: '', creador: 'Jed MacKay, Alessandro Cappuccio', anio: '2022', poster: 'https://covers.openlibrary.org/b/id/12780721-M.jpg', motivo: tLang('Marvel Comics • Novedad', 'Marvel Comics • New') },
      { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Dark Nights: Death Metal', tituloOriginal: 'Dark Nights: Death Metal', tituloIngles: '', creador: 'Scott Snyder, Greg Capullo', anio: '2022', poster: 'https://covers.openlibrary.org/b/id/13167440-M.jpg', motivo: tLang('DC Comics • Evento', 'DC Comics • Event') },
      { categoria: 'Lecturas', subcategoria: 'Cómics', titulo: 'Immortal Hulk Vol. 1', tituloOriginal: 'Immortal Hulk Vol. 1', tituloIngles: '', creador: 'Al Ewing, Joe Bennett', anio: '2019', poster: 'https://covers.openlibrary.org/b/id/8813267-M.jpg', motivo: tLang('Marvel Comics • Aclamado', 'Marvel Comics • Acclaimed') }
    ];

    const vistosComics = new Set();
    const mapearDocComic = (b, editorial, defCr) => {
      const cId = b?.cover_i || b?.cover_id;
      if (!b || !b.title || !cId) return null;
      const tit = (b.title || '').trim();
      const tLow = tit.toLowerCase();
      // Excluir libros que no correspondan a cómics reales o literatura clásica
      if (tLow.includes('coloring book') || tLow.includes('calendar') || tLow.includes('stationery') || tLow.includes('notebook') || tLow.includes('sensibility') || tLow.includes('treasure island') || tLow.includes('land of oz') || tLow.includes('war of the worlds') || tLow.includes('screwtape') || tLow.includes('novelization')) return null;

      const anioPub = Number(b.first_publish_year);
      // REGLA: Exclusivamente cómics recientes (>= 2018) o lanzamientos muy recientes sin año
      if (anioPub && anioPub < 2018) return null;

      let creador = '';
      if (b.author_name?.length) {
        creador = b.author_name.slice(0, 2).join(', ');
      } else if (b.authors?.[0]?.name) {
        creador = b.authors[0].name;
      } else {
        creador = defCr;
      }
      if (!creador || creador.length > 50) creador = defCr;

      return {
        categoria: 'Lecturas',
        subcategoria: 'Cómics',
        titulo: tit,
        tituloOriginal: tit,
        tituloIngles: '',
        creador: creador,
        anio: b.first_publish_year ? String(b.first_publish_year) : '2025',
        poster: `https://covers.openlibrary.org/b/id/${cId}-M.jpg`,
        motivo: editorial === 'Marvel' ? 'Marvel Comics' : 'DC Comics'
      };
    };

    const comicsMarvel = (olMarvel || []).map(b => mapearDocComic(b, 'Marvel', 'Marvel Comics')).filter(Boolean);
    const comicsDc = (olDc || []).map(b => mapearDocComic(b, 'DC', 'DC Comics')).filter(Boolean);

    // Intercalar Marvel y DC
    const maxComics = Math.max(comicsMarvel.length, comicsDc.length);
    for (let i = 0; i < maxComics; i++) {
      if (comicsMarvel[i] && !vistosComics.has(comicsMarvel[i].titulo.toLowerCase()) && datos.comics.length < 24) {
        vistosComics.add(comicsMarvel[i].titulo.toLowerCase());
        datos.comics.push(comicsMarvel[i]);
      }
      if (comicsDc[i] && !vistosComics.has(comicsDc[i].titulo.toLowerCase()) && datos.comics.length < 24) {
        vistosComics.add(comicsDc[i].titulo.toLowerCase());
        datos.comics.push(comicsDc[i]);
      }
    }

    // Complementar con cómics recientes y tendencias emblemáticas para asegurar variedad y alta calidad
    COMICS_FALLBACK.forEach(fb => {
      const k = fb.titulo.toLowerCase();
      if (!vistosComics.has(k) && datos.comics.length < 24) {
        vistosComics.add(k);
        datos.comics.push(fb);
      }
    });

    if (datos.comics.length === 0) {
      datos.comics = [...COMICS_FALLBACK];
    }

    // --- 9. MANGAS ---
    const mIds = new Set();
    kitsuManga.forEach(it => {
      if (!it || mIds.has(it.id) || datos.mangas.length >= 24) return;
      mIds.add(it.id);
      const a = it.attributes || {}, tOrig = a.titles?.en_jp || a.canonicalTitle || a.titles?.ja_jp || 'Manga', tEng = a.titles?.en || '';
      datos.mangas.push({
        categoria: 'Lecturas',
        subcategoria: 'Mangas',
        titulo: tOrig,
        tituloOriginal: tOrig,
        tituloIngles: (tEng && tEng.toLowerCase() !== tOrig.toLowerCase()) ? tEng : '',
        creador: a.status === 'current' ? tLang('Manga en emisión', 'Ongoing Manga') : tLang('Manga popular', 'Popular Manga'),
        anio: a.startDate ? a.startDate.substring(0, 4) : '2025',
        sinopsis: a.synopsis || '',
        poster: a.posterImage?.medium || a.posterImage?.small || '',
        motivo: tLang('Manga Top', 'Top Manga')
      });
    });
  } catch (e) {}
  return datos;
}, async obtenerDatosSerieInfo(showId, numTemp) { try { const seasons = await getJson_(`https://api.tvmaze.com/shows/${showId}/seasons`); if (seasons?.length) { const s = seasons.find(x => Number(x.number) === Number(numTemp));
return { anioFinTemp: (s?.endDate || s?.premiereDate || '').substring(0, 4), totalTemporadas: seasons.length }; }
} catch (e) {}
return { anioFinTemp: '', totalTemporadas: 0 }; }, async buscarPortadaGenerica(t, cr, cat) { if (!t) return ''; const q = encodeURIComponent(t.trim()), qC = encodeURIComponent(`${t} ${cr || ''}`.trim()); try { if (cat === 'Peliculas') {
const d = await getJson_(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_K}&query=${q}`); if (d?.results?.[0]?.poster_path) return `https://image.tmdb.org/t/p/w185${d.results[0].poster_path}`; } else if (cat === 'Series') {
const d = await getJson_(`https://api.tvmaze.com/search/shows?q=${q}`); if (d?.[0]?.show?.image) return d[0].show.image.original || d[0].show.image.medium || ''; } else if (cat === 'Musica') { const it = await getJson_(`https://itunes.apple.com/search?term=${qC}&entity=album&limit=1`);
if (it?.results?.[0]?.artworkUrl100) return it.results[0].artworkUrl100.replace('100x100bb', '600x600bb'); const d = await getJson_(`https://api.deezer.com/search?q=${qC}&limit=1`); return d?.data?.[0]?.album?.cover_big || d?.data?.[0]?.artist?.picture_big || ''; } else if (cat === 'Juegos') {
const d = await getJson_(`https://api.rawg.io/api/games?key=${RAWG_K}&search=${q}&page_size=1`); if (d?.results?.[0]?.background_image) return d.results[0].background_image;
const stm = (await getSteamJson_(`https://store.steampowered.com/api/storesearch/?term=${q}&l=spanish&cc=US`))?.items?.[0]; if (stm?.id) return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${stm.id}/header.jpg`;
const igdb = await getIgdbGames_(t, 1); if (igdb?.[0]?.cover?.url) return ('https:' + igdb[0].cover.url).replace('/t_thumb/', '/t_cover_big/');
return ''; } else if (cat === 'Lecturas') { const ol = await getJson_(`https://openlibrary.org/search.json?q=${qC}&limit=1`);
if (ol?.docs?.[0]?.cover_i) return `https://covers.openlibrary.org/b/id/${ol.docs[0].cover_i}-L.jpg`; const gb = await getJson_(`https://www.googleapis.com/books/v1/volumes?q=${qC}&maxResults=1`); return (gb?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail || '').replace('http://', 'https://'); }
} catch (e) {}
return ''; }, async obtenerDetalleTecnicoModal(titulo, creador, cat, sub) {
  const normCat = cat || '';
  const normSub = (sub || '').toLowerCase();
  let tipoFicha = 'peliculas';
  if (normCat === 'Peliculas') tipoFicha = 'peliculas';
  else if (normCat === 'Series') tipoFicha = 'series';
  else if (normCat === 'Musica') tipoFicha = (normSub.includes('artista') || normSub.includes('concierto')) ? 'artistas' : 'discos';
  else if (normCat === 'Juegos') tipoFicha = 'juegos';
  else if (normCat === 'Lecturas') {
    if (normSub.includes('manga')) tipoFicha = 'manga';
    else if (normSub.includes('cómic') || normSub.includes('comic')) tipoFicha = 'comics';
    else tipoFicha = 'libros';
  }

  const isEn = (typeof getLang_ === 'function' && getLang_() === 'en');
  const tmdbLang = isEn ? 'en-US' : 'es-ES';
  const steamLang = isEn ? 'english' : 'spanish';
  const wikiLang = isEn ? 'en' : 'es';
  const noReg = tLang('No registrada', 'Not recorded');
  const noEsp = tLang('No especificado', 'Not specified');
  const noEsps = tLang('No especificados', 'Not specified');
  const noEspF = tLang('No especificada', 'Not specified');
  const sinSinopsis = tLang('Sin sinopsis disponible.', 'No synopsis available.');

  const res = {
    tipoFicha: tipoFicha,
    titulo: titulo || '',
    subtitulo: '',
    poster: '',
    estreno: noReg,
    fechaSalida: noReg,
    director: noEsp,
    showrunner: noEsp,
    escritor: noEsp,
    escritores: noEsps,
    protagonista: noEsp,
    protagonistas: noEsps,
    artista: creador || tLang('Artista', 'Artist'),
    productor: noEsp,
    sello: noEsp,
    genero: '',
    integrantes: [],
    roles: '',
    desarrolladora: creador || noEspF,
    distribuidora: noEspF,
    editorial: noEspF,
    dibujantes: noEsp,
    mangaka: creador || noEsp,
    sinopsis: sinSinopsis,
    duracionHoras: ''
  };

  const cleanTit = String(titulo || '').replace(/\s*\[S\d+\]$/i, '').split(':')[0].trim();
  const q = encodeURIComponent(cleanTit);

  try {
    if (tipoFicha === 'peliculas') {
      const m = (await getJson_(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_K}&query=${q}&language=${tmdbLang}`))?.results?.[0];
      if (m) {
        res.poster = m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : '';
        const [det, creds] = await Promise.all([
          getJson_(`https://api.themoviedb.org/3/movie/${m.id}?api_key=${TMDB_K}&language=${tmdbLang}`),
          getJson_(`https://api.themoviedb.org/3/movie/${m.id}/credits?api_key=${TMDB_K}`)
        ]);
        res.estreno = fmtFecha_(det?.release_date || m.release_date) || noReg;
        res.sinopsis = det?.overview || m.overview || res.sinopsis;
        if (det?.runtime) res.duracionHoras = (det.runtime / 60).toFixed(1);
        if (creds) {
          const dirs = (creds.crew || []).filter(x => x.job === 'Director').map(x => x.name);
          const wrs = Array.from(new Set((creds.crew || []).filter(x => ['Screenplay', 'Writer', 'Story', 'Characters'].includes(x.job)).map(x => x.name)));
          const cast = (creds.cast || []).slice(0, 5).map(x => x.name);
          res.director = dirs.length ? dirs.join(', ') : (creador || tLang('Director desconocido', 'Unknown director'));
          res.escritor = wrs.length ? wrs.slice(0, 3).join(', ') : noEsp;
          res.protagonista = cast.length ? cast.join(', ') : noEsp;
        }
      }
    } else if (tipoFicha === 'series') {
      const s = (await getJson_(`https://api.tvmaze.com/search/shows?q=${q}`))?.[0]?.show;
      if (s) {
        res.poster = s.image?.original || s.image?.medium || '';
        res.estreno = s.premiered ? fmtFecha_(s.premiered) : (s.premiered || noReg);
        res.sinopsis = s.summary ? s.summary.replace(/<[^>]*>?/gm, '').trim() : res.sinopsis;
        const [crew, cast, episodes] = await Promise.all([
          getJson_(`https://api.tvmaze.com/shows/${s.id}/crew`),
          getJson_(`https://api.tvmaze.com/shows/${s.id}/cast`),
          getJson_(`https://api.tvmaze.com/shows/${s.id}/episodes`)
        ]);
        const showrunners = Array.from(new Set((crew || []).filter(x => x.type === 'Creator' || x.type === 'Showrunner').map(x => x.person?.name).filter(Boolean)));
        const writers = Array.from(new Set((crew || []).filter(x => /writer|story|screenplay/i.test(x.type || '')).map(x => x.person?.name).filter(Boolean)));
        const actors = (cast || []).slice(0, 5).map(x => x.person?.name).filter(Boolean);
        res.showrunner = showrunners.length ? showrunners.join(', ') : (creador || s.network?.name || noEsp);
        res.escritores = writers.length ? writers.slice(0, 4).join(', ') : noEsps;
        res.protagonistas = actors.length ? actors.join(', ') : noEsps;

        const sMatch = String(titulo).match(/\[S(\d+)\]/i);
        const sNum = sMatch ? parseInt(sMatch[1], 10) : 1;
        const sEps = (episodes || []).filter(e => e.season === sNum);
        if (sEps.length) {
          const totM = sEps.reduce((acc, ep) => acc + (ep.runtime || s.averageRuntime || s.runtime || 45), 0);
          res.duracionHoras = (totM / 60).toFixed(1);
        } else if (s.averageRuntime || s.runtime) {
          res.duracionHoras = ((8 * (s.averageRuntime || s.runtime)) / 60).toFixed(1);
        }

        if (res.showrunner === noEsp || res.escritores === noEsps) {
          const tmdbTv = (await getJson_(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_K}&query=${q}&language=${tmdbLang}`))?.results?.[0];
          if (tmdbTv) {
            const tmdbDet = await getJson_(`https://api.themoviedb.org/3/tv/${tmdbTv.id}?api_key=${TMDB_K}&append_to_response=credits&language=${tmdbLang}`);
            if (res.showrunner === noEsp && tmdbDet?.created_by?.length) {
              res.showrunner = tmdbDet.created_by.map(x => x.name).join(', ');
            }
            if (res.escritores === noEsps && tmdbDet?.credits?.crew?.length) {
              const tWrs = tmdbDet.credits.crew.filter(x => ['Writer', 'Story', 'Screenplay'].includes(x.job)).map(x => x.name);
              if (tWrs.length) res.escritores = Array.from(new Set(tWrs)).slice(0, 4).join(', ');
            }
            if (res.protagonistas === noEsps && tmdbDet?.credits?.cast?.length) {
              res.protagonistas = tmdbDet.credits.cast.slice(0, 5).map(x => x.name).join(', ');
            }
          }
        }
      }
    } else if (tipoFicha === 'discos') {
      const qDisc = encodeURIComponent(`${cleanTit} ${creador || ''}`.trim());
      const [itData, dzData] = await Promise.all([
        getJson_(`https://itunes.apple.com/search?term=${qDisc}&entity=album&limit=1`),
        getJson_(`https://api.deezer.com/search/album?q=${qDisc}&limit=1`)
      ]);
      const it = itData?.results?.[0];
      const dz = dzData?.data?.[0];
      const dzDet = dz?.id ? await getJson_(`https://api.deezer.com/album/${dz.id}`) : null;
      res.poster = (it?.artworkUrl100 || '').replace('100x100bb', '600x600bb') || dzDet?.cover_big || dz?.cover_big || '';
      res.fechaSalida = it?.releaseDate ? fmtFecha_(it.releaseDate.split('T')[0]) : (dzDet?.release_date ? fmtFecha_(dzDet.release_date) : (it?.releaseDate?.substring(0, 4) || noReg));
      res.artista = it?.artistName || dzDet?.artist?.name || creador || tLang('Artista desconocido', 'Unknown artist');
      res.sello = dzDet?.label || (it?.copyright ? it.copyright.replace(/^[℗©\d\s]+/i, '').trim() : '') || tLang('Discográfica no especificada', 'Record label not specified');
      res.genero = it?.primaryGenreName || dzDet?.genres?.data?.[0]?.name || tLang('Música', 'Music');
      let prod = '';
      if (dzDet?.contributors) {
        const prods = dzDet.contributors.filter(c => /producer/i.test(c.role || '')).map(c => c.name);
        if (prods.length) prod = prods.join(', ');
      }
      res.productor = prod || noEsp;
    } else if (tipoFicha === 'artistas') {
      const qArt = encodeURIComponent(String(cleanTit || creador || '').trim());
      const [mbRes, dzRes, wikiRes] = await Promise.all([
        getJson_(`https://musicbrainz.org/ws/2/artist?query=artist:${qArt}&fmt=json&limit=1`),
        getJson_(`https://api.deezer.com/search/artist?q=${qArt}&limit=1`),
        getJson_(`https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${qArt}`)
      ]);
      const artObj = mbRes?.artists?.[0];
      let integrantes = [];
      if (artObj?.id) {
        const mbRel = await getJson_(`https://musicbrainz.org/ws/2/artist/${artObj.id}?inc=artist-rels&fmt=json`);
        const rels = (mbRel?.relations || []).filter(r => r.type === 'member of band' && r.artist);
        const memberMap = new Map();
        rels.forEach(r => {
          const mName = r.artist.name;
          const attrs = (r.attributes || []).map(traducirRolMusical_).filter(Boolean);
          if (!memberMap.has(mName)) memberMap.set(mName, new Set(attrs));
          else attrs.forEach(a => memberMap.get(mName).add(a));
        });
        for (const [name, set] of memberMap.entries()) {
          const roles = Array.from(set);
          const roleTxt = roles.length ? roles.join(', ') : tLang('Integrante', 'Member');
          integrantes.push(`${roleTxt}: ${name}`);
        }
      }
      if (dzRes?.data?.[0]?.picture_big) res.poster = dzRes.data[0].picture_big;
      if (!integrantes.length) {
        const mainRole = wikiRes?.description || tLang('Voz principal, composición e instrumentos', 'Lead vocals, songwriting & instruments');
        integrantes.push(`${mainRole}: ${titulo || creador}`);
      }
      res.artista = titulo || creador;
      res.integrantes = integrantes;
      res.sinopsis = wikiRes?.extract || (artObj?.disambiguation ? tLang(`Artista musical (${artObj.disambiguation})`, `Music artist (${artObj.disambiguation})`) : tLang('Artista musical.', 'Music artist.'));
    } else if (tipoFicha === 'juegos') {
      const cleanTit = String(titulo || '').replace(/\s*\[S\d+\]$/i, '').split(':')[0].trim();
      const [steamSearch, igdbData, rawgSearch] = await Promise.all([
        getSteamJson_(`https://store.steampowered.com/api/storesearch/?term=${q}&l=${steamLang}&cc=US`).catch(() => null),
        getIgdbGames_(cleanTit, 1).catch(() => null),
        getJson_(`https://api.rawg.io/api/games?key=${RAWG_K}&search=${q}&page_size=1`).catch(() => null)
      ]);

      let steamDet = null;
      const steamAppId = steamSearch?.items?.[0]?.id;
      if (steamAppId) {
        const sDetails = await getSteamJson_(`https://store.steampowered.com/api/appdetails?appids=${steamAppId}&l=${steamLang}`).catch(() => null);
        if (sDetails && sDetails[steamAppId]?.success) {
          steamDet = sDetails[steamAppId].data;
        }
      }

      const igdbGame = (Array.isArray(igdbData) && igdbData.length) ? igdbData[0] : null;
      const g = rawgSearch?.results?.[0];
      let rawgDet = null, rawgTeam = null;
      if (g?.id) {
        [rawgDet, rawgTeam] = await Promise.all([
          getJson_(`https://api.rawg.io/api/games/${g.id}?key=${RAWG_K}`).catch(() => null),
          getJson_(`https://api.rawg.io/api/games/${g.id}/development-team?key=${RAWG_K}`).catch(() => null)
        ]);
      }

      // 1. Poster
      if (steamDet?.header_image) res.poster = steamDet.header_image;
      else if (igdbGame?.cover?.url) res.poster = ('https:' + igdbGame.cover.url).replace('/t_thumb/', '/t_cover_big/');
      else if (g?.background_image) res.poster = g.background_image;

      // 2. Fecha de salida
      if (steamDet?.release_date?.date) {
        res.fechaSalida = fmtFecha_(steamDet.release_date.date);
      } else if (igdbGame?.first_release_date) {
        try { res.fechaSalida = fmtFecha_(new Date(igdbGame.first_release_date * 1000)); } catch(e){}
      } else if (rawgDet?.released) {
        res.fechaSalida = fmtFecha_(rawgDet.released);
      }

      // 3. Desarrolladora
      const steamDevs = (steamDet?.developers || []).join(', ');
      const igdbDevs = (igdbGame?.involved_companies || []).filter(c => c.developer).map(c => c.company?.name).filter(Boolean).join(', ');
      const rawgDevs = (rawgDet?.developers || []).map(x => x.name).join(', ');
      res.desarrolladora = steamDevs || igdbDevs || rawgDevs || creador || noEspF;

      // 4. Distribuidora
      const steamPubs = (steamDet?.publishers || []).join(', ');
      const igdbPubs = (igdbGame?.involved_companies || []).filter(c => c.publisher).map(c => c.company?.name).filter(Boolean).join(', ');
      const rawgPubs = (rawgDet?.publishers || []).map(x => x.name).join(', ');
      res.distribuidora = steamPubs || igdbPubs || rawgPubs || noEspF;

      // 5. Director
      const dirs = (rawgTeam?.results || []).filter(p => (p.positions || []).some(pos => /director/i.test(pos.name))).map(p => p.name);
      res.director = dirs.length ? dirs.slice(0, 2).join(', ') : noEsp;

      // 6. Género
      const steamGenres = (steamDet?.genres || []).map(x => x.description).join(', ');
      const igdbGenres = (igdbGame?.genres || []).map(x => x.name).join(', ');
      const rawgGenres = (rawgDet?.genres || []).map(x => x.name).join(', ');
      res.genero = steamGenres || igdbGenres || rawgGenres || tLang('Videojuego', 'Video Game');

      // 7. Sinopsis
      const steamSin = steamDet?.short_description || (steamDet?.detailed_description ? steamDet.detailed_description.replace(/<[^>]*>?/gm, '').substring(0, 360) + '...' : null);
      const igdbSin = igdbGame?.summary || igdbGame?.storyline;
      const rawgSin = rawgDet?.description_raw ? rawgDet.description_raw.substring(0, 360) + '...' : null;
      res.sinopsis = steamSin || igdbSin || rawgSin || res.sinopsis;
    } else if (tipoFicha === 'libros') {
      const gb = await getJson_(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`);
      const b = gb?.items?.[0]?.volumeInfo || {};
      res.poster = (b.imageLinks?.thumbnail || b.imageLinks?.smallThumbnail || '').replace('http://', 'https://');
      res.fechaSalida = b.publishedDate ? fmtFecha_(b.publishedDate) : noReg;
      res.escritor = b.authors?.join(', ') || creador || tLang('Autor desconocido', 'Unknown author');
      res.genero = b.categories?.join(', ') || tLang('Literatura', 'Literature');
      res.sinopsis = b.description ? b.description.substring(0, 380) + '...' : res.sinopsis;
    } else if (tipoFicha === 'comics') {
      const [cvRes, mvRes, olDoc, gbItem] = await Promise.all([
        COMICVINE_K ? getJson_(`https://comicvine.gamespot.com/api/search/?api_key=${COMICVINE_K}&resources=volume,issue&query=${q}&limit=1`).catch(() => null) : Promise.resolve(null),
        MARVEL_K ? getJson_(`https://gateway.marvel.com/v1/public/comics?titleStartsWith=${q}&apikey=${MARVEL_K}&limit=1`).catch(() => null) : Promise.resolve(null),
        getJson_(`https://openlibrary.org/search.json?title=${q}&limit=1`).catch(() => null),
        getJson_(`https://www.googleapis.com/books/v1/volumes?q=${q}+comic&maxResults=1`).catch(() => null)
      ]);
      const cv = cvRes?.results?.[0];
      const mv = mvRes?.data?.results?.[0];
      const d = olDoc?.docs?.[0];
      const b = gbItem?.items?.[0]?.volumeInfo || {};

      if (mv) {
        res.editorial = 'Marvel Comics';
        const onSale = (mv.dates || []).find(x => x.type === 'onsaleDate')?.date;
        if (onSale) res.fechaSalida = fmtFecha_(onSale.substring(0, 10));
        const writers = (mv.creators?.items || []).filter(c => c.role === 'writer').map(c => c.name);
        const pencilers = (mv.creators?.items || []).filter(c => ['penciler', 'penciller', 'artist', 'inker'].includes(c.role)).map(c => c.name);
        if (writers.length) res.escritores = writers.join(', ');
        if (pencilers.length) res.dibujantes = pencilers.join(', ');
        if (mv.description) res.sinopsis = mv.description.replace(/<[^>]*>?/gm, '').trim();
        if (mv.thumbnail?.path && mv.thumbnail?.extension) res.poster = `${mv.thumbnail.path}/portrait_incredible.${mv.thumbnail.extension}`.replace('http://', 'https://');
      } else if (cv) {
        if (cv.publisher?.name) res.editorial = cv.publisher.name;
        const dateStr = cv.cover_date || (cv.start_year ? String(cv.start_year) : '');
        if (dateStr) res.fechaSalida = fmtFecha_(dateStr);
        if (cv.deck || cv.description) res.sinopsis = cv.deck || cv.description.replace(/<[^>]*>?/gm, '').trim();
        if (cv.image?.medium_url || cv.image?.original_url) res.poster = cv.image.medium_url || cv.image.original_url;
      }

      if (res.poster.includes('data:image') || !res.poster) {
        res.poster = (b.imageLinks?.thumbnail || '').replace('http://', 'https://') || (d?.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : res.poster);
      }
      if (res.fechaSalida === noReg) {
        res.fechaSalida = b.publishedDate ? fmtFecha_(b.publishedDate) : (d?.first_publish_year ? String(d.first_publish_year) : res.fechaSalida);
      }
      if (res.editorial === noEspF || !res.editorial) {
        res.editorial = b.publisher || d?.publisher?.[0] || (/marvel/i.test(cleanTit) ? 'Marvel Comics' : (/dc/i.test(cleanTit) ? 'DC Comics' : tLang('Editorial de cómics', 'Comic publisher')));
      }
      if (res.escritores === noEsps || !res.escritores) {
        const authors = b.authors || d?.author_name || [];
        res.escritores = authors[0] || creador || noEsp;
        if (authors.length > 1 && (res.dibujantes === noEsp || !res.dibujantes)) {
          res.dibujantes = authors.slice(1).join(', ');
        }
      }
      if (!res.sinopsis || res.sinopsis === sinSinopsis) {
        res.sinopsis = b.description || (d?.subject ? d.subject.slice(0, 4).join(', ') : tLang('Cómic / Novela gráfica.', 'Comic / Graphic novel.'));
      }
    } else if (tipoFicha === 'manga') {
      const kRes = await getJson_(`https://kitsu.io/api/edge/manga?filter[text]=${q}&include=genres,categories&page[limit]=1`);
      const mItem = kRes?.data?.[0];
      const a = mItem?.attributes || {};
      let mangakas = [];
      if (mItem?.id) {
        const st = await getJson_(`https://kitsu.io/api/edge/manga/${mItem.id}/staff`);
        const targets = (st?.data || []).slice(0, 2);
        for (const t of targets) {
          if (t.relationships?.person?.links?.related) {
            const p = await getJson_(t.relationships.person.links.related);
            if (p?.data?.attributes?.name) mangakas.push(p.data.attributes.name);
          }
        }
      }
      res.poster = a.posterImage?.original || a.posterImage?.medium || '';
      res.fechaSalida = a.startDate ? fmtFecha_(a.startDate) : noReg;
      res.mangaka = mangakas.length ? mangakas.join(', ') : (creador || tLang('Mangaka desconocido', 'Unknown mangaka'));
      const genres = (kRes?.included || []).filter(x => x.type === 'genres' || x.type === 'categories').map(x => x.attributes?.title || x.attributes?.name).slice(0, 4).join(', ');
      res.genero = genres || 'Manga, Shonen / Seinen';
      res.sinopsis = a.synopsis || res.sinopsis;
    }
  } catch (e) {}
  return res; }, async buscarEnServidor(qRaw, cat, sub) { if (!qRaw || qRaw.trim().length < 2) return []; const qTrim = qRaw.trim(); const curLang = (typeof getLang_ === 'function' ? getLang_() : 'es'); const tmdbLang = curLang === 'en' ? 'en-US' : 'es-ES'; const steamLang = curLang === 'en' ? 'english' : 'spanish'; const sinSinopsis = tLang('Sin sinopsis disponible.', 'No synopsis available.'); const videojuegoLbl = tLang('Videojuego', 'Video Game'); const cacheKey = `${curLang}_${cat}_${sub || ''}_${qTrim.toLowerCase()}`; if (!SERVER_API._searchMemCache) SERVER_API._searchMemCache = new Map(); if (SERVER_API._searchMemCache.has(cacheKey)) return SERVER_API._searchMemCache.get(cacheKey); const q = encodeURIComponent(qTrim); const _exec = async () => { if (cat === 'Peliculas') {
const list = ((await getJson_(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_K}&query=${q}&language=${tmdbLang}`))?.results || []).slice(0, 6); return await Promise.all(list.map(async m => { let dirs = [], durHoras = null; try { const [cr, det] = await Promise.all([Promise.race([getJson_(`https://api.themoviedb.org/3/movie/${m.id}/credits?api_key=${TMDB_K}`), new Promise(r => setTimeout(() => r(null), 850))]), Promise.race([getJson_(`https://api.themoviedb.org/3/movie/${m.id}?api_key=${TMDB_K}&language=${tmdbLang}`), new Promise(r => setTimeout(() => r(null), 850))])]); dirs = (cr?.crew || []).filter(x => x.job === "Director").map(x => x.name); if (det?.runtime) durHoras = (det.runtime / 60).toFixed(1); } catch(e){}
const noEs = m.original_language !== 'es' && m.original_language !== 'en';
return { idRef: m.id, tituloOriginal: m.original_title || m.title || '', tituloIngles: (noEs && m.title && m.title !== m.original_title) ? m.title : '', creador: dirs.length ? dirs.join(', ') : tLang('Director desconocido', 'Unknown director'), anio: m.release_date?.substring(0, 4) || '', sinopsis: m.overview || sinSinopsis, poster: m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : '', duracionHoras: durHoras };
})); }
if (cat === 'Series') { const list = ((await getJson_(`https://api.tvmaze.com/search/shows?q=${q}`)) || []).slice(0, 6); return await Promise.all(list.map(async it => { const s = it.show;
let crew = null, sList = null; try { [crew, sList] = await Promise.all([Promise.race([getJson_(`https://api.tvmaze.com/shows/${s.id}/crew`), new Promise(r => setTimeout(() => r(null), 850))]), Promise.race([getJson_(`https://api.tvmaze.com/shows/${s.id}/seasons`), new Promise(r => setTimeout(() => r(null), 850))])]); } catch(e){}
const crs = Array.from(new Set((crew || []).filter(x => x.type === 'Creator' || x.type === 'Showrunner').map(x => x.person?.name).filter(Boolean))); const aIni = s.premiered ? s.premiered.substring(0, 4) : '', aFin = s.ended ? s.ended.substring(0, 4) : (s.status === 'Running' ? tLang('presente', 'present') : '');
const avgRun = s.averageRuntime || s.runtime || 45;
let durHoras = null;
if (sList && sList.length && sList[0].episodeOrder) {
  durHoras = ((sList[0].episodeOrder * avgRun) / 60).toFixed(1);
} else {
  durHoras = ((8 * avgRun) / 60).toFixed(1);
}
return { idRef: s.id, tituloOriginal: s.name || '', tituloIngles: '', creador: crs.length ? crs.join(', ') : (s.network?.name || tLang('Showrunner desconocido', 'Unknown showrunner')), anio: (aIni && aFin && aIni !== aFin) ? `${aIni}-${aFin}` : aIni, totalSeasons: sList?.length || 0, estadoSerie: s.status || '', sinopsis: s.summary ? s.summary.replace(/<[^>]*>?/gm, '') : sinSinopsis, poster: s.image?.medium || s.image?.original || '', duracionHoras: durHoras, seasonsList: sList || [], avgRuntime: avgRun };
})); }
if (cat === 'Musica') { if (sub === 'Discos' || sub === 'Disco') { const resultados = [], vistos = new Set(); const itRes = (await getJson_(`https://itunes.apple.com/search?term=${q}&entity=album&limit=10`))?.results || []; itRes.forEach(al => {
const tit = al.collectionName || '', art = al.artistName || tLang('Artista', 'Artist'), k = `${tit.toLowerCase()}_${art.toLowerCase()}`;
if (!vistos.has(k)) { vistos.add(k); resultados.push({ tituloOriginal: tit, tituloIngles: '', creador: art, anio: al.releaseDate ? al.releaseDate.substring(0, 4) : '', sinopsis: tLang(`Álbum discográfico. Canciones: ${al.trackCount || 'N/D'}. Género: ${al.primaryGenreName || 'Música'}.`, `Studio album. Tracks: ${al.trackCount || 'N/A'}. Genre: ${al.primaryGenreName || 'Music'}.`), poster: (al.artworkUrl100 || '').replace('100x100bb', '600x600bb') }); }
}); if (resultados.length < 8) { const dzRes = (await getJson_(`https://api.deezer.com/search/album?q=${q}&limit=8`))?.data || []; dzRes.forEach(it => { const tit = it.title || '', art = it.artist?.name || tLang('Artista', 'Artist'), k = `${tit.toLowerCase()}_${art.toLowerCase()}`;
if (!vistos.has(k)) { vistos.add(k); resultados.push({ tituloOriginal: tit, tituloIngles: '', creador: art, anio: '', sinopsis: tLang('Álbum discográfico (Deezer)', 'Music album (Deezer)'), poster: it.cover_xl || it.cover_big || it.cover_medium || '' }); }
}); }
return resultados.slice(0, 10); }
const end = (sub.includes('Artista') || sub.includes('Concierto') || sub === 'To Listen') ? 'artist' : 'album'; const dzList = (await getJson_(`https://api.deezer.com/search/${end}?q=${q}&limit=6`))?.data || []; return dzList.map(it => ({
tituloOriginal: (end === 'artist' ? it.name : it.title) || '', tituloIngles: '', creador: (end === 'artist' ? it.name : it.artist?.name) || tLang('Artista', 'Artist'), anio: '',
sinopsis: end === 'artist' ? tLang(`Seguidores: ${(it.nb_fan || 0).toLocaleString()}`, `Followers: ${(it.nb_fan || 0).toLocaleString()}`) : tLang('Álbum discográfico', 'Music album'), poster: end === 'artist' ? (it.picture_medium || it.picture_big || '') : (it.cover_medium || it.cover_big || '')
})); }
if (cat === 'Juegos') {
  const qClean = qTrim;
  // RAWG es nuestra fuente principal y más completa (con soporte nativo CORS para juegos de todas las plataformas)
  const rawgPromise = getJson_(`https://api.rawg.io/api/games?key=${RAWG_K}&search=${q}&page_size=8`).catch(() => null);
  // Steam e IGDB con timeout estricto de 1200ms para evitar cuelgues o demoras
  const steamPromise = Promise.race([
    getSteamJson_(`https://store.steampowered.com/api/storesearch/?term=${q}&l=${steamLang}&cc=US`),
    new Promise(r => setTimeout(() => r(null), 1200))
  ]).catch(() => null);
  const igdbPromise = Promise.race([
    getIgdbGames_(qClean, 6),
    new Promise(r => setTimeout(() => r(null), 1200))
  ]).catch(() => null);

  const [rawgRes, steamRes, igdbRes] = await Promise.all([rawgPromise, steamPromise, igdbPromise]);

  const resultadosJuegos = [];
  const vistos = new Set();

  // 1. Priorizar resultados de RAWG (cubre Nintendo, PlayStation, Xbox, PC, etc.)
  if (rawgRes?.results?.length) {
    rawgRes.results.slice(0, 8).forEach(g => {
      const tit = g.name || '';
      if (!tit) return;
      const k = tit.toLowerCase().trim();
      const plats = (g.platforms || []).map(p => p.platform?.name).filter(Boolean).slice(0, 3).join(', ');
      const genres = (g.genres || []).map(x => x.name).filter(Boolean).slice(0, 2).join(' / ');
      const sin = plats ? `${tLang('Plataformas', 'Platforms')}: ${plats}${g.rating ? ` | ${tLang('Calificación', 'Rating')}: ${g.rating}/5` : ''}` : (genres || videojuegoLbl);
      if (!vistos.has(k)) {
        vistos.add(k);
        resultadosJuegos.push({
          idRef: g.id,
          tituloOriginal: tit,
          tituloIngles: '',
          creador: genres || videojuegoLbl,
          anio: g.released?.substring(0, 4) || '',
          sinopsis: sin,
          poster: optimizarUrlPoster(g.background_image, "thumb") || ''
        });
      }
    });
  }

  // 2. Complementar con Steam si hay resultados únicos o detalles adicionales
  if (steamRes?.items?.length) {
    steamRes.items.forEach(it => {
      const tit = it.name || '';
      if (!tit) return;
      const k = tit.toLowerCase().trim();
      const poster = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${it.id}/header.jpg`;
      const meta = it.metacritic ? ` | Metacritic: ${it.metacritic}` : '';
      if (!vistos.has(k)) {
        vistos.add(k);
        resultadosJuegos.push({
          idRef: `steam_${it.id}`,
          tituloOriginal: tit,
          tituloIngles: '',
          creador: 'Steam',
          anio: '',
          sinopsis: `${tLang('Disponible en Steam Store', 'Available on Steam Store')}${meta}`,
          poster: poster
        });
      } else {
        const exist = resultadosJuegos.find(x => x.tituloOriginal.toLowerCase().trim() === k);
        if (exist && !exist.poster && poster) exist.poster = poster;
      }
    });
  }

  // 3. Complementar con IGDB si está disponible
  if (Array.isArray(igdbRes) && igdbRes.length) {
    igdbRes.forEach(g => {
      const tit = g.name || '';
      if (!tit) return;
      const k = tit.toLowerCase().trim();
      const devs = (g.involved_companies || []).filter(c => c.developer).map(c => c.company?.name).filter(Boolean);
      const pubs = (g.involved_companies || []).filter(c => c.publisher).map(c => c.company?.name).filter(Boolean);
      const cr = devs.length ? devs.join(', ') : (pubs.length ? pubs.join(', ') : 'IGDB');
      let yr = '';
      if (g.first_release_date) {
        try { yr = String(new Date(g.first_release_date * 1000).getFullYear()); } catch(e){}
      }
      let cov = '';
      if (g.cover?.url) {
        cov = ('https:' + g.cover.url).replace('/t_thumb/', '/t_cover_big/');
      }
      const plats = (g.platforms || []).map(p => p.name).slice(0, 3).join(', ');
      const sin = g.summary ? g.summary.substring(0, 180) + '...' : (plats ? `${tLang('Plataformas', 'Platforms')}: ${plats}` : tLang('Videojuego (IGDB)', 'Video Game (IGDB)'));
      if (!vistos.has(k)) {
        vistos.add(k);
        resultadosJuegos.push({
          idRef: `igdb_${g.id}`,
          tituloOriginal: tit,
          tituloIngles: '',
          creador: cr,
          anio: yr,
          sinopsis: sin,
          poster: cov
        });
      } else {
        const exist = resultadosJuegos.find(x => x.tituloOriginal.toLowerCase().trim() === k);
        if (exist) {
          if ((!exist.creador || exist.creador === videojuegoLbl || exist.creador === 'Videojuego' || exist.creador === 'Steam') && cr !== 'IGDB') exist.creador = cr;
          if (!exist.anio && yr) exist.anio = yr;
          if (!exist.poster && cov) exist.poster = cov;
        }
      }
    });
  }

  return resultadosJuegos.slice(0, 10);
}
if (cat === 'Lecturas') { if (sub === 'Mangas' || sub === 'Manga' || sub === 'To Read: Mangas') { const list = ((await getJson_(`https://kitsu.io/api/edge/manga?filter[text]=${q}&page[limit]=6`))?.data || []); return await Promise.all(list.map(async it => {
const a = it.attributes || {}, titles = a.titles || {}, tRom = titles.en_jp || a.canonicalTitle || '', tEng = titles.en || '', mangakas = []; try { const st = await getJson_(`https://kitsu.io/api/edge/manga/${it.id}/staff`);
const rel = (st?.data || []).filter(s => /story|art|original|author/i.test(s.attributes?.role || '')); const targets = (rel.length ? rel : (st?.data || [])).slice(0, 2); const pList = await Promise.all(targets.map(x => x.relationships?.person?.links?.related ? Promise.race([getJson_(x.relationships.person.links.related), new Promise(r => setTimeout(() => r(null), 600))]) : Promise.resolve(null))); for (const p of pList) {
if (p?.data?.attributes?.name && !mangakas.includes(p.data.attributes.name)) mangakas.push(p.data.attributes.name); }
} catch (e) {}
return { tituloOriginal: tRom || 'Manga', tituloIngles: (tEng && tEng.toLowerCase() !== tRom.toLowerCase()) ? tEng : '', creador: mangakas.length ? mangakas.join(', ') : 'Mangaka', anio: a.startDate?.substring(0, 4) || '', sinopsis: a.synopsis ? a.synopsis.substring(0, 160) + '...' : tLang('Manga japonés.', 'Japanese manga.'), poster: a.posterImage?.medium || a.posterImage?.small || '' };
})); }
const isC = sub === 'Cómics' || sub === 'Cómic' || sub === 'To Read: Cómics';
if (isC) {
  const comicVinePromise = COMICVINE_K
    ? getJson_(`https://comicvine.gamespot.com/api/search/?api_key=${COMICVINE_K}&resources=volume,issue&query=${q}&limit=6`).catch(() => null)
    : Promise.resolve(null);
  const marvelPromise = MARVEL_K
    ? getJson_(`https://gateway.marvel.com/v1/public/comics?titleStartsWith=${q}&apikey=${MARVEL_K}&limit=6`).catch(() => null)
    : Promise.resolve(null);
  const olPromise = getJson_(`https://openlibrary.org/search.json?title=${q}&limit=6`).catch(() => null);
  const gbPromise = getJson_(`https://www.googleapis.com/books/v1/volumes?q=${q}+comic&maxResults=6`).catch(() => null);

  const [cvRes, mvRes, olRes, gbRes] = await Promise.all([
    comicVinePromise, marvelPromise, olPromise, gbPromise
  ]);

  const resultadosComics = [];
  const vistos = new Set();

  if (cvRes?.results?.length) {
    cvRes.results.forEach(it => {
      const tit = it.name || it.volume?.name || '';
      if (!tit) return;
      const pub = it.publisher?.name || tLang('Cómic', 'Comic');
      const anio = it.start_year || (it.cover_date ? it.cover_date.substring(0, 4) : '');
      const poster = it.image?.medium_url || it.image?.small_url || it.image?.original_url || '';
      const sin = it.deck || (it.description ? it.description.replace(/<[^>]*>?/gm, '').substring(0, 220) : `${tLang('Editorial', 'Publisher')}: ${pub}`);
      const k = tit.toLowerCase().trim();
      if (!vistos.has(k)) {
        vistos.add(k);
        resultadosComics.push({
          idRef: it.id,
          tituloOriginal: tit,
          tituloIngles: '',
          creador: pub,
          anio: anio ? String(anio) : '',
          sinopsis: sin,
          poster: poster
        });
      }
    });
  }

  if (mvRes?.data?.results?.length) {
    mvRes.data.results.forEach(it => {
      const tit = it.title || '';
      if (!tit) return;
      const creators = (it.creators?.items || []).filter(c => ['writer', 'penciler', 'penciller', 'artist'].includes(c.role)).map(c => c.name);
      const cr = creators.length ? creators.join(', ') : 'Marvel Comics';
      const onSale = (it.dates || []).find(d => d.type === 'onsaleDate')?.date;
      const anio = onSale ? onSale.substring(0, 4) : '';
      const poster = (it.thumbnail?.path && it.thumbnail?.extension) ? `${it.thumbnail.path}/portrait_incredible.${it.thumbnail.extension}`.replace('http://', 'https://') : '';
      const sin = it.description ? it.description.replace(/<[^>]*>?/gm, '').substring(0, 220) : `${tLang('Editorial', 'Publisher')}: Marvel Comics`;
      const k = tit.toLowerCase().trim();
      if (!vistos.has(k)) {
        vistos.add(k);
        resultadosComics.push({
          idRef: it.id,
          tituloOriginal: tit,
          tituloIngles: '',
          creador: cr,
          anio: anio,
          sinopsis: sin,
          poster: poster
        });
      }
    });
  }

  if (olRes?.docs?.length) {
    olRes.docs.forEach(d => {
      const tit = d.title || '';
      const k = tit.toLowerCase().trim();
      if (!vistos.has(k) && resultadosComics.length < 8) {
        vistos.add(k);
        resultadosComics.push({
          tituloOriginal: tit,
          tituloIngles: '',
          creador: d.author_name?.length ? d.author_name.join(', ') : tLang('Escritor / Dibujante', 'Writer / Artist'),
          anio: d.first_publish_year ? String(d.first_publish_year) : '',
          sinopsis: d.publisher ? `${tLang('Editorial', 'Publisher')}: ${d.publisher[0]}` : tLang('Cómic / Novela gráfica', 'Comic / Graphic novel'),
          poster: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : ''
        });
      }
    });
  }

  if (gbRes?.items?.length) {
    gbRes.items.forEach(b => {
      const inf = b.volumeInfo || {};
      const tit = inf.title || '';
      const k = tit.toLowerCase().trim();
      if (!vistos.has(k) && resultadosComics.length < 10) {
        vistos.add(k);
        resultadosComics.push({
          tituloOriginal: tit,
          tituloIngles: '',
          creador: inf.authors?.length ? inf.authors.join(', ') : tLang('Autor de cómic', 'Comic author'),
          anio: inf.publishedDate?.substring(0, 4) || '',
          sinopsis: inf.description ? inf.description.substring(0, 220) : tLang('Cómic / Novela gráfica', 'Comic / Graphic novel'),
          poster: (inf.imageLinks?.thumbnail || inf.imageLinks?.smallThumbnail || '').replace('http://', 'https://')
        });
      }
    });
  }

  return resultadosComics.slice(0, 8);
}
const ol = await getJson_(`https://openlibrary.org/search.json?q=${q}&limit=6`); if (ol?.docs?.length) { return ol.docs.slice(0, 6).map(d => ({
tituloOriginal: d.title || tLang('Sin título', 'Untitled'), tituloIngles: '', creador: d.author_name?.length ? d.author_name.join(', ') : tLang('Autor desconocido', 'Unknown author'),
anio: d.first_publish_year ? String(d.first_publish_year) : '', sinopsis: d.publisher ? `${tLang('Editorial', 'Publisher')}: ${d.publisher[0]}` : tLang('Libro literario', 'Literary book'), poster: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : ''
})); }
const gb = (await getJson_(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=6`))?.items || []; return gb.map(b => { const inf = b.volumeInfo || {};
return { tituloOriginal: inf.title || tLang('Sin título', 'Untitled'), tituloIngles: '', creador: inf.authors?.length ? inf.authors.join(', ') : tLang('Autor desconocido', 'Unknown author'), anio: inf.publishedDate?.substring(0, 4) || '', sinopsis: inf.description || sinSinopsis, poster: (inf.imageLinks?.thumbnail || inf.imageLinks?.smallThumbnail || '').replace('http://', 'https://') };
}); }
return []; }; const searchRes = await _exec(); if (searchRes && searchRes.length && SERVER_API._searchMemCache.size < 350) SERVER_API._searchMemCache.set(cacheKey, searchRes); return searchRes || []; }, async migrarDatosSheetsASupabase() { return { exito: false, error: tLang('Para migrar desde Google Sheets por única vez, haz clic en este botón desde tu enlace de Google Apps Script o usa "Importar (.txt)" en Configuración.', 'To perform a one-time migration from Google Sheets, click this button from your Google Apps Script link or use "Import (.txt)" in Settings.') }; }
, async guardarPrivacidadUsuario(userEmail, priv) {
  try {
    const em = normEm_(userEmail);
    if (!em) return { exito: false, error: tLang('Sin sesión', 'Not signed in') };
    const rows = await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(em) + '&select=*', 'GET');
    if (!rows || !rows.length) return { exito: false, error: tLang('Perfil no encontrado', 'Profile not found') };
    const p = rows[0];
    const prefs = p.preferencias || {};
    prefs.privacidad = priv;
    await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(em), 'PATCH', { preferencias: prefs, updated_at: new Date().toISOString() });
    return { exito: true };
  } catch (e) {
    return { exito: false, error: e.toString() };
  }
},
async obtenerRegistrosDeAmigo(emailAmigo, categoria) {
  try {
    const em = normEm_(emailAmigo);
    if (!em) return { exito: false, error: tLang('Email inválido', 'Invalid email') };
    const pRows = await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(em) + '&select=*', 'GET');
    if (!pRows || !pRows.length) return { exito: false, error: tLang('Amigo no encontrado', 'Friend not found') };
    const p = pRows[0];
    const priv = p.preferencias?.privacidad || {};
    if (priv.ocultarRegistros) {
      const fName = p.nickname || tLang('Este amigo', 'This friend');
      return { exito: false, privado: true, error: tLang(fName + ' ha configurado sus registros como privados.', fName + ' has set their records to private.') };
    }
    const catFiltro = (categoria && categoria !== 'todas' && categoria !== 'todas_watchlists') ? '&categoria=eq.' + encodeURIComponent(categoria) : '';
    const rows = await sbFetch_('registros?user_email=eq.' + encodeURIComponent(em) + catFiltro + '&select=*&order=created_at.asc', 'GET') || [];
    const lista = rows.map(r => ({
      id: String(r.id || ''),
      categoria: String(r.categoria || ''),
      subcategoria: String(r.subcategoria || ''),
      titulo: String(r.titulo || ''),
      subtitulo: String(r.subtitulo || ''),
      creador: String(r.creador || ''),
      anio: String(r.anio || ''),
      fechaInicio: fmtFecha_(r.fecha_inicio),
      fechaFin: fmtFecha_(r.fecha_fin),
      calificacion: priv.ocultarCalificaciones ? 0 : (Number(r.calificacion) || 0),
      comentario: priv.ocultarComentarios ? '' : String(r.comentario || ''),
      poster: String(r.poster || ''),
      horas: String(r.horas || ''),
      esRewatch: !!r.es_rewatch
    }));
    return { exito: true, registros: lista, amigoNombre: p.nickname || em.split('@')[0], avatar: p.avatar };
  } catch (e) {
    return { exito: false, error: e.toString() };
  }
},
async obtenerActividadAmigos(userEmail) {
  try {
    const email = normEm_(userEmail);
    if (!email) return { exito: false, actividad: {} };
    const myP = await SERVER_API.obtenerPerfilUsuario(email);
    const amigosEmails = myP.preferencias?.amigos || [];
    const mapa = {};
    const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const cleanTit = t => String(t || '').replace(/\s*\(\d{4}\)$/, '').trim();

    await Promise.all(amigosEmails.map(async aEmail => {
      try {
        const pRows = await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(aEmail) + '&select=*', 'GET').catch(() => []);
        if (!pRows || !pRows.length) return;
        const p = pRows[0];
        const priv = p.preferencias?.privacidad || {};
        const nick = p.nickname || p.user_email.split('@')[0];
        const avatar = p.avatar || '🦊';
        const tasks = [];
        if (!priv.ocultarRegistros) {
          tasks.push(sbFetch_('registros?user_email=eq.' + encodeURIComponent(aEmail) + '&select=id,titulo,subtitulo,creador,anio,categoria,subcategoria,calificacion,comentario,horas,poster,fecha_inicio,fecha_fin,created_at', 'GET').then(regs => {
            (regs || []).forEach(r => {
              const k1 = norm(r.titulo);
              const k2 = norm(cleanTit(r.titulo));
              const k3 = r.subtitulo ? norm(cleanTit(r.subtitulo)) : null;
              const itemData = {
                amigo: nick,
                amigoEmail: aEmail,
                amigoAvatar: avatar,
                amigoUserId: p.preferencias?.userId || aEmail,
                tipo: 'visto',
                cat: r.categoria,
                sub: r.subcategoria,
                titulo: r.titulo,
                subtitulo: r.subtitulo || '',
                creador: r.creador || '',
                anio: r.anio || '',
                poster: r.poster || '',
                calificacion: (!priv.ocultarCalificaciones && Number(r.calificacion) > 0) ? Number(r.calificacion) : null,
                comentario: (!priv.ocultarComentarios && r.comentario) ? r.comentario : '',
                horas: r.horas || '',
                fechaInicio: sanitizarFechaFrontend(r.fecha_inicio || r.fechaInicio),
                fechaFin: sanitizarFechaFrontend(r.fecha_fin || r.fechaFin),
                recordId: r.id
              };
              [k1, k2, k3].filter(Boolean).forEach(k => {
                if (!mapa[k]) mapa[k] = [];
                if (!mapa[k].some(x => x.amigoEmail === aEmail && x.tipo === 'visto')) {
                  mapa[k].push(itemData);
                }
              });
            });
          }).catch(() => {}));
        }
        if (!priv.ocultarWatchlist) {
          tasks.push(sbFetch_('watchlists?user_email=eq.' + encodeURIComponent(aEmail) + '&select=id,titulo,categoria,subcategoria,creador,anio,poster', 'GET').then(wls => {
            (wls || []).forEach(w => {
              const k1 = norm(w.titulo);
              const k2 = norm(cleanTit(w.titulo));
              const itemWlData = {
                amigo: nick,
                amigoEmail: aEmail,
                amigoAvatar: avatar,
                amigoUserId: p.preferencias?.userId || aEmail,
                tipo: 'pendiente',
                cat: w.categoria,
                sub: w.subcategoria,
                titulo: w.titulo,
                creador: w.creador || '',
                anio: w.anio || '',
                poster: w.poster || '',
                watchlistId: w.id
              };
              [k1, k2].filter(Boolean).forEach(k => {
                if (!mapa[k]) mapa[k] = [];
                if (!mapa[k].some(x => x.amigoEmail === aEmail && x.tipo === 'pendiente')) {
                  mapa[k].push(itemWlData);
                }
              });
            });
          }).catch(() => {}));
        }
        await Promise.all(tasks);
      } catch (err) {}
    }));
    return { exito: true, actividad: mapa };
  } catch (e) {
    return { exito: false, actividad: {} };
  }
},
async obtenerFeedAmigos(userEmail, limite = 30) {
  try {
    const email = normEm_(userEmail);
    if (!email) return { exito: false, feed: [] };
    const myP = await SERVER_API.obtenerPerfilUsuario(email);
    let prefs = myP.preferencias || {};
    if (typeof prefs === 'string') {
      try { prefs = JSON.parse(prefs); } catch(e) { prefs = {}; }
    }
    const amigosEmails = prefs.amigos || [];
    if (!amigosEmails.length) return { exito: true, feed: [] };

    const pRowsList = await Promise.all(
      amigosEmails.map(aEmail => sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(normEm_(aEmail)) + '&select=*', 'GET').catch(() => []))
    );

    const amigosMap = {};
    pRowsList.forEach((rows, idx) => {
      const aEmail = amigosEmails[idx];
      if (rows && rows.length > 0) {
        amigosMap[aEmail] = rows[0];
      }
    });

    const feedPromises = amigosEmails.map(async aEmail => {
      const p = amigosMap[aEmail];
      if (!p) return [];
      let pPrefs = p.preferencias || {};
      if (typeof pPrefs === 'string') {
        try { pPrefs = JSON.parse(pPrefs); } catch(e) { pPrefs = {}; }
      }
      const priv = pPrefs.privacidad || {};
      if (priv.ocultarRegistros) return [];

      const cleanEmail = normEm_(aEmail);
      // Consultar registros generales y registros de Música para que no queden tapados
      const [dataGeneral, dataMusica] = await Promise.all([
        sbFetch_('registros?user_email=eq.' + encodeURIComponent(cleanEmail) + '&select=*&order=created_at.desc&limit=15', 'GET').catch(() => []) || [],
        sbFetch_('registros?user_email=eq.' + encodeURIComponent(cleanEmail) + '&categoria=eq.Musica&select=*&order=created_at.desc&limit=15', 'GET').catch(() => []) || []
      ]);

      const seenRegIds = new Set();
      const combinedData = [];
      [...(dataGeneral || []), ...(dataMusica || [])].forEach(r => {
        if (r && r.id && !seenRegIds.has(r.id)) {
          seenRegIds.add(r.id);
          combinedData.push(r);
        }
      });

      const itemsAmigo = combinedData.map(r => ({
        id: r.id,
        userEmail: aEmail,
        amigoNickname: p.nickname || aEmail.split('@')[0],
        amigoAvatar: p.avatar || '🦊',
        amigoUserId: pPrefs.userId || aEmail,
        titulo: r.titulo,
        subtitulo: r.subtitulo || '',
        creador: r.creador || '',
        anio: r.anio || '',
        categoria: r.categoria,
        subcategoria: r.subcategoria,
        poster: r.poster || '',
        calificacion: priv.ocultarCalificaciones ? 0 : (Number(r.calificacion) || 0),
        comentario: priv.ocultarComentarios ? '' : (r.comentario || ''),
        horas: r.horas || '',
        esRewatch: !!r.es_rewatch,
        fechaInicio: sanitizarFechaFrontend(r.fecha_inicio || r.fechaInicio),
        fechaFin: sanitizarFechaFrontend(r.fecha_fin || r.fechaFin),
        createdAt: r.created_at || '',
        likes: (pPrefs.likes_recibidos && pPrefs.likes_recibidos[r.id]) ? pPrefs.likes_recibidos[r.id] : []
      }));

      // Las canciones escuchadas no deben figurar en los últimos añadidos del feed de amigos
      return itemsAmigo;
    });

    const allResults = await Promise.all(feedPromises);
    const feed = allResults.flat();
    feed.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : timestampDeFecha(a.fechaFin || a.fechaInicio);
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : timestampDeFecha(b.fechaFin || b.fechaInicio);
      return (tB || 0) - (tA || 0);
    });

    const liveData = (typeof SERVER_API.extraerActividadEnVivoDePerfiles_ === 'function')
      ? SERVER_API.extraerActividadEnVivoDePerfiles_(amigosEmails, amigosMap)
      : { music: [], recentMusic: [], games: [] };

    return { exito: true, feed: feed.slice(0, Math.max(limite || 30, 80)), live: liveData };
  } catch (e) {
    return { exito: false, error: e.toString(), feed: [], live: { music: [], recentMusic: [], games: [] } };
  }
},
extraerActividadEnVivoDePerfiles_(amigosEmails, amigosMap) {
  const liveMusic = [];
  const recentMusic = [];
  const liveGames = [];
  if (!Array.isArray(amigosEmails) || !amigosMap) return { music: liveMusic, recentMusic: recentMusic, games: liveGames };

  amigosEmails.forEach(aEmail => {
    const p = amigosMap[aEmail];
    if (!p) return;
    let pPrefs = p.preferencias || {};
    if (typeof pPrefs === 'string') {
      try { pPrefs = JSON.parse(pPrefs); } catch(e) { pPrefs = {}; }
    }
    const priv = pPrefs.privacidad || {};
    if (priv.ocultarRegistros) return;

    const nick = p.nickname || p.nombre || p.display_name || p.username || (aEmail ? aEmail.split('@')[0] : 'Amigo');
    const avatar = p.avatar || p.avatar_url || p.foto_perfil || '🦊';
    const userId = pPrefs.userId || p.user_id || p.id || aEmail;

    const act = pPrefs.actividad || {};
    const cuentas = pPrefs.cuentas_vinculadas || pPrefs.cuentasVinculadas || {};

    // 1. MÚSICA EN VIVO & HISTORIAL DE CANCIONES (Spotify / Last.fm)
    let spNow = act.spotifyNowPlaying || cuentas.spotify?.nowPlaying || pPrefs.spotify?.nowPlaying;
    if (typeof spNow === 'string' && spNow) {
      try { spNow = JSON.parse(spNow); } catch(e) { spNow = null; }
    }
    const spTitle = spNow ? (spNow.name || spNow.track || spNow.title || spNow.titleName || '') : '';
    const spArtist = spNow ? (spNow.artist || (Array.isArray(spNow.artists) ? spNow.artists.join(', ') : '') || '') : '';
    const spAlbum = spNow ? (spNow.album || '') : '';
    const spImage = spNow ? (spNow.image || spNow.albumArt || spNow.cover || '') : '';
    const spUrl = spNow ? (spNow.url || spNow.trackUrl || '') : '';
    const spUpAt = Number(spNow?.updatedAt || spNow?.timestamp) || 0;

    let agregadoLive = false;

    if (spNow && spNow.isPlaying && (spTitle || spNow.trackId)) {
      const diff = Date.now() - spUpAt;
      const fresca = (!spUpAt || diff <= 35 * 60 * 1000);
      if (fresca) {
        liveMusic.push({
          userEmail: aEmail,
          amigoEmail: aEmail,
          amigoNickname: nick,
          amigoAvatar: avatar,
          amigoUserId: userId,
          isPlaying: true,
          isLive: true,
          title: spTitle,
          track: spTitle,
          artist: spArtist,
          album: spAlbum,
          image: spImage,
          url: spUrl,
          source: 'spotify',
          updatedAt: spUpAt || Date.now()
        });
        agregadoLive = true;
      }
    }

    // Historial de canciones de Spotify: si no está en vivo pero tiene una canción previa escuchada
    if (!agregadoLive && spTitle) {
      recentMusic.push({
        userEmail: aEmail,
        amigoEmail: aEmail,
        amigoNickname: nick,
        amigoAvatar: avatar,
        amigoUserId: userId,
        isPlaying: false,
        isLive: false,
        title: spTitle,
        track: spTitle,
        artist: spArtist,
        album: spAlbum,
        image: spImage,
        url: spUrl,
        source: 'spotify',
        updatedAt: spUpAt || 0
      });
    }

    // Last.fm: soporte para reproducción actual y scrobbles recientes
    const lfm = cuentas.lastfm || pPrefs.lastfm;
    let lfmStats = lfm?.stats;
    if (typeof lfmStats === 'string' && lfmStats) {
      try { lfmStats = JSON.parse(lfmStats); } catch(e) {}
    }
    const rec = lfmStats?.recentTracks?.[0];
    if (rec) {
      const lfmTrack = rec.name || rec.title || '';
      const isLfmNow = !!(rec.isNowPlaying || rec['@attr']?.nowplaying === 'true');
      if (lfmTrack) {
        if (isLfmNow && !agregadoLive) {
          liveMusic.push({
            userEmail: aEmail,
            amigoEmail: aEmail,
            amigoNickname: nick,
            amigoAvatar: avatar,
            amigoUserId: userId,
            isPlaying: true,
            isLive: true,
            title: lfmTrack,
            track: lfmTrack,
            artist: rec.artist || '',
            album: rec.album || '',
            image: rec.image || '',
            url: rec.url || '',
            source: 'lastfm',
            updatedAt: Date.now()
          });
        } else if (!agregadoLive && !spTitle) {
          recentMusic.push({
            userEmail: aEmail,
            amigoEmail: aEmail,
            amigoNickname: nick,
            amigoAvatar: avatar,
            amigoUserId: userId,
            isPlaying: false,
            isLive: false,
            title: lfmTrack,
            track: lfmTrack,
            artist: rec.artist || '',
            album: rec.album || '',
            image: rec.image || '',
            url: rec.url || '',
            source: 'lastfm',
            updatedAt: Date.now()
          });
        }
      }
    }

    // 2. VIDEOJUEGOS EN VIVO (Steam & PlayStation)
    let steamNow = act.steamNowPlaying || cuentas.steam?.nowPlaying || pPrefs.steam?.nowPlaying;
    if (typeof steamNow === 'string' && steamNow) {
      try { steamNow = JSON.parse(steamNow); } catch(e) { steamNow = null; }
    }
    let psnNow = act.playstationNowPlaying || cuentas.playstation?.nowPlaying || pPrefs.playstation?.nowPlaying;
    if (typeof psnNow === 'string' && psnNow) {
      try { psnNow = JSON.parse(psnNow); } catch(e) { psnNow = null; }
    }

    const lastPlat = act.lastActiveGamePlatform || cuentas.lastActiveGamePlatform || pPrefs.lastActiveGamePlatform || '';

    const steamTitle = steamNow ? String(steamNow.titleName || steamNow.name || steamNow.gameTitle || '').trim() : '';
    const psnTitle = psnNow ? String(psnNow.titleName || psnNow.name || psnNow.gameTitle || '').trim() : '';

    const steamActive = !!(steamNow && steamNow.isPlaying && steamTitle);
    const psnActive = !!(psnNow && psnNow.isPlaying && psnTitle);

    const steamUp = steamActive ? (Number(steamNow.updatedAt || steamNow.timestamp) || 0) : 0;
    const psnUp = psnActive ? (Number(psnNow.updatedAt || psnNow.timestamp) || 0) : 0;

    const maxAgeGames = 3.5 * 60 * 60 * 1000;
    const steamFresh = steamActive && (!steamUp || (Date.now() - steamUp <= maxAgeGames));
    const psnFresh = psnActive && (!psnUp || (Date.now() - psnUp <= maxAgeGames));

    if (steamFresh && psnFresh) {
      const preferSteam = (lastPlat === 'steam' || steamUp >= psnUp);
      const chosen = preferSteam ? steamNow : psnNow;
      const isSt = preferSteam;
      const gTitle = isSt ? steamTitle : psnTitle;
      liveGames.push({
        userEmail: aEmail,
        amigoEmail: aEmail,
        amigoNickname: nick,
        amigoAvatar: avatar,
        amigoUserId: userId,
        isPlaying: true,
        isLive: true,
        title: gTitle,
        gameTitle: gTitle,
        platform: isSt ? 'Steam' : (chosen.platform || 'PS5'),
        source: isSt ? 'steam' : 'playstation',
        appid: chosen.appid || chosen.appId || '',
        image: chosen.image || chosen.gameIcon || '',
        url: chosen.gameUrl || chosen.url || '',
        updatedAt: (isSt ? steamUp : psnUp) || Date.now()
      });
    } else if (steamFresh) {
      liveGames.push({
        userEmail: aEmail,
        amigoEmail: aEmail,
        amigoNickname: nick,
        amigoAvatar: avatar,
        amigoUserId: userId,
        isPlaying: true,
        isLive: true,
        title: steamTitle,
        gameTitle: steamTitle,
        platform: 'Steam',
        source: 'steam',
        appid: steamNow.appid || steamNow.appId || '',
        image: steamNow.image || steamNow.gameIcon || '',
        url: steamNow.gameUrl || steamNow.url || '',
        updatedAt: steamUp || Date.now()
      });
    } else if (psnFresh) {
      liveGames.push({
        userEmail: aEmail,
        amigoEmail: aEmail,
        amigoNickname: nick,
        amigoAvatar: avatar,
        amigoUserId: userId,
        isPlaying: true,
        isLive: true,
        title: psnTitle,
        gameTitle: psnTitle,
        platform: psnNow.platform || 'PS5',
        source: 'playstation',
        image: psnNow.image || psnNow.gameIcon || '',
        url: psnNow.gameUrl || psnNow.url || '',
        updatedAt: psnUp || Date.now()
      });
    }
  });

  liveMusic.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  recentMusic.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  liveGames.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return { music: liveMusic, recentMusic: recentMusic, games: liveGames };
},
async obtenerActividadEnVivoAmigos(userEmail) {
  try {
    const email = normEm_(userEmail);
    if (!email) return { exito: false, live: { music: [], recentMusic: [], games: [] } };
    const myP = await SERVER_API.obtenerPerfilUsuario(email);
    let prefs = myP.preferencias || {};
    if (typeof prefs === 'string') {
      try { prefs = JSON.parse(prefs); } catch(e) { prefs = {}; }
    }
    const amigosEmails = prefs.amigos || [];
    if (!amigosEmails.length) return { exito: true, live: { music: [], recentMusic: [], games: [] } };

    const pRowsList = await Promise.all(
      amigosEmails.map(aEmail => sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(normEm_(aEmail)) + '&select=*', 'GET').catch(() => []))
    );

    const amigosMap = {};
    pRowsList.forEach((rows, idx) => {
      const aEmail = amigosEmails[idx];
      if (rows && rows.length > 0) {
        amigosMap[aEmail] = rows[0];
      }
    });

    const liveData = (typeof SERVER_API.extraerActividadEnVivoDePerfiles_ === 'function')
      ? SERVER_API.extraerActividadEnVivoDePerfiles_(amigosEmails, amigosMap)
      : { music: [], recentMusic: [], games: [] };
    return { exito: true, live: liveData };
  } catch (e) {
    return { exito: false, error: e.toString(), live: { music: [], recentMusic: [], games: [] } };
  }
}
}; window.SERVER_API = SERVER_API; const makeRunner_ = (onSuccess = null, onFailure = null) => new Proxy({}, { get(_, prop) { if (prop === 'withSuccessHandler') return fn => makeRunner_(fn, onFailure); if (prop === 'withFailureHandler') return fn => makeRunner_(onSuccess, fn); return (...args) => {
Promise.resolve().then(() => SERVER_API[prop](...args)).then(res => { if (onSuccess) onSuccess(res); }).catch(err => { console.error(`Error en ${String(prop)}:`, err); if (onFailure) onFailure(err); }); }; }
}); window.google = { script: { run: makeRunner_() } }; }
// === RECORTADOR INTERACTIVO 1:1 DE AVATAR (PAN, ZOOM, ROTACIÓN Y ENCUADRE) ===
