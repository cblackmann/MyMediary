/* Mediary — js/features/notifications.js */
// ==========================================
// SISTEMA DE NOTIFICACIONES MEDIARY
// 1. Recordatorio 21:00 (Lectura / Música)
// 2. Likes en reseñas de amigos
// 3. Nuevos registros de amigos
// ==========================================

const NOTIF_STORAGE_KEY = 'mediary_in_app_notifs_v1';
const NOTIF_RACHA_LAST_KEY = 'mediary_notif_racha_21_last';
const NOTIF_SEEN_FEED_KEY = 'mediary_seen_friend_feed_ids';
const NOTIF_KNOWN_LIKES_KEY = 'mediary_known_likes_map';
const NOTIF_SEEN_REQUESTS_KEY = 'mediary_seen_friend_requests_v1';
const NOTIF_KNOWN_FRIENDS_KEY = 'mediary_known_friends_emails_v1';

function obtenerPreferenciasNotificaciones() {
  if (!userPrefs.notificaciones || typeof userPrefs.notificaciones !== 'object') {
    userPrefs.notificaciones = {
      habilitadas: true,
      racha21: true,
      likesAmigos: true,
      novedadesAmigos: true,
      amigosYSolicitudes: true
    };
  } else if (typeof userPrefs.notificaciones.amigosYSolicitudes === 'undefined') {
    userPrefs.notificaciones.amigosYSolicitudes = true;
  }
  return userPrefs.notificaciones;
}

function obtenerBandejaNotificaciones() {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return [];
}

function guardarBandejaNotificaciones(lista) {
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(lista.slice(0, 60)));
  } catch(e) {}
  actualizarBadgeNotificaciones();
}

function actualizarBadgeNotificaciones() {
  const lista = obtenerBandejaNotificaciones();
  const noLeidas = lista.filter(n => !n.leida).length;
  const badge = document.getElementById('badge-notif-count');
  if (badge) {
    if (noLeidas > 0) {
      badge.textContent = noLeidas > 99 ? '99+' : String(noLeidas);
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

async function lanzarNotificacion({ id, tipo, titulo, mensaje, icono, accion }) {
  const notifObj = {
    id: id || ('notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
    tipo: tipo || 'sistema',
    titulo: titulo || 'Mediary',
    mensaje: mensaje || '',
    icono: icono || getHeroIcon('bell'),
    fecha: new Date().toISOString(),
    leida: false,
    accion: accion || null
  };

  const lista = obtenerBandejaNotificaciones();
  if (!lista.some(n => n.id === notifObj.id)) {
    lista.unshift(notifObj);
    guardarBandejaNotificaciones(lista);
  }

  // Notificación del sistema (Web / PWA)
  const prefs = obtenerPreferenciasNotificaciones();
  if (prefs.habilitadas !== false && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(titulo, {
          body: mensaje,
          icon: './icon-192.png',
          badge: './icon.png',
          tag: notifObj.id,
          vibrate: [100, 50, 100],
          data: { url: './', tipo: notifObj.tipo }
        });
      } else {
        new Notification(titulo, {
          body: mensaje,
          icon: './icon-192.png',
          tag: notifObj.id
        });
      }
    } catch (e) {
      console.warn('Error al enviar Notificación Web:', e);
    }
  }
}

async function solicitarPermisoNotificaciones() {
  if (!('Notification' in window)) {
    mostrarToastPersonalizado(tLang('Este dispositivo/navegador no soporta notificaciones Web.', 'This device/browser does not support Web notifications.'));
    return false;
  }
  try {
    const perm = await Notification.requestPermission();
    actualizarUIPermisoNotificaciones();
    if (perm === 'granted') {
      mostrarToastPersonalizado(tLang(' ¡Notificaciones del sistema activadas!', 'System notifications enabled!'));
      return true;
    } else if (perm === 'denied') {
      mostrarToastPersonalizado(tLang('Las notificaciones están bloqueadas en los permisos del navegador.', 'Notifications are blocked in your browser permissions.'));
      return false;
    }
  } catch (e) {
    console.error('Error al solicitar permiso de notificaciones:', e);
  }
  return false;
}

function actualizarUIPermisoNotificaciones() {
  const banner = document.getElementById('banner-permiso-notif');
  const card = document.getElementById('notif-permiso-card');
  const statusTxt = document.getElementById('notif-permiso-status-txt');
  const descTxt = document.getElementById('notif-permiso-desc-txt');
  const btnPerm = document.getElementById('btn-solicitar-permiso-notif');

  const permGranted = ('Notification' in window) && Notification.permission === 'granted';
  const permDenied = ('Notification' in window) && Notification.permission === 'denied';

  if (banner) {
    banner.style.display = (!('Notification' in window) || permGranted) ? 'none' : 'flex';
  }

  if (card && statusTxt && descTxt && btnPerm) {
    if (!('Notification' in window)) {
      statusTxt.textContent = tLang('Notificaciones no soportadas', 'Notifications not supported');
      descTxt.textContent = tLang('Tu navegador no permite alertas Web', 'Your browser does not allow Web alerts');
      btnPerm.style.display = 'none';
      card.style.background = 'rgba(100,116,139,0.08)';
      card.style.borderColor = 'rgba(100,116,139,0.2)';
    } else if (permGranted) {
      statusTxt.innerHTML = `${getHeroIcon('check', '', 14)} ${tLang('Notificaciones activas', 'Notifications active')}`;
      descTxt.textContent = tLang('Recibirás avisos de rachas y amigos', "You'll receive streak and friend alerts");
      btnPerm.textContent = tLang('Activo', 'Active');
      btnPerm.style.display = 'inline-block';
      btnPerm.style.background = 'rgba(16,185,129,0.18)';
      btnPerm.style.color = '#34d399';
      btnPerm.style.borderColor = 'rgba(16,185,129,0.4)';
      btnPerm.disabled = true;
      card.style.background = 'rgba(16,185,129,0.06)';
      card.style.borderColor = 'rgba(16,185,129,0.25)';
    } else if (permDenied) {
      statusTxt.innerHTML = `${getHeroIcon('x-mark', '', 14)} ${tLang('Notificaciones bloqueadas', 'Notifications blocked')}`;
      descTxt.textContent = tLang('Habilítalas en los permisos de tu navegador', 'Enable them in your browser permissions');
      btnPerm.textContent = tLang('Bloqueado', 'Blocked');
      btnPerm.style.display = 'inline-block';
      btnPerm.style.background = 'rgba(239,68,68,0.15)';
      btnPerm.style.color = '#f87171';
      btnPerm.style.borderColor = 'rgba(239,68,68,0.35)';
      btnPerm.disabled = true;
      card.style.background = 'rgba(239,68,68,0.06)';
      card.style.borderColor = 'rgba(239,68,68,0.25)';
    } else {
      statusTxt.textContent = tLang('Permiso de Notificaciones', 'Notification Permission');
      descTxt.textContent = tLang('Activa alertas de rachas y amigos', 'Enable streak and friend alerts');
      btnPerm.textContent = tLang('Activar', 'Enable');
      btnPerm.style.display = 'inline-block';
      btnPerm.style.background = 'var(--accent)';
      btnPerm.style.color = '#0f172a';
      btnPerm.style.borderColor = 'var(--accent)';
      btnPerm.disabled = false;
      card.style.background = 'rgba(56,189,248,0.08)';
      card.style.borderColor = 'rgba(56,189,248,0.25)';
    }
  }
}

function sincronizarSwitchesNotificaciones() {
  const prefs = obtenerPreferenciasNotificaciones();
  const mapIds = {
    racha21: ['cfg-notif-racha', 'modal-notif-racha'],
    likesAmigos: ['cfg-notif-likes', 'modal-notif-likes'],
    novedadesAmigos: ['cfg-notif-amigos', 'modal-notif-amigos'],
    amigosYSolicitudes: ['cfg-notif-solicitudes', 'modal-notif-solicitudes']
  };

  Object.keys(mapIds).forEach(k => {
    mapIds[k].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = !!prefs[k];
    });
  });
}

function actualizarPreferenciaNotificacion(tipo, valor) {
  const prefs = obtenerPreferenciasNotificaciones();
  prefs[tipo] = !!valor;
  userPrefs.notificaciones = prefs;
  guardarPreferenciasLocales();

  if (valor && 'Notification' in window && Notification.permission === 'default') {
    solicitarPermisoNotificaciones();
  }

  sincronizarSwitchesNotificaciones();

  if (estado.userEmail && typeof sbFetch_ === 'function') {
    if (!perfilUsuario.preferencias) perfilUsuario.preferencias = {};
    perfilUsuario.preferencias.notificaciones = prefs;
    sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(normEm_(estado.userEmail)), 'PATCH', {
      preferencias: perfilUsuario.preferencias,
      updated_at: new Date().toISOString()
    }).catch(() => {});
  }
}

function cambiarTabNotificaciones(tab) {
  const btnInbox = document.getElementById('btn-tab-notif-inbox');
  const btnSettings = document.getElementById('btn-tab-notif-settings');
  const vistaInbox = document.getElementById('vista-notif-tab-inbox');
  const vistaSettings = document.getElementById('vista-notif-tab-settings');

  if (tab === 'settings') {
    if (btnInbox) btnInbox.classList.remove('active');
    if (btnSettings) btnSettings.classList.add('active');
    if (vistaInbox) vistaInbox.style.display = 'none';
    if (vistaSettings) vistaSettings.style.display = 'flex';
    actualizarUIPermisoNotificaciones();
    sincronizarSwitchesNotificaciones();
  } else {
    if (btnInbox) btnInbox.classList.add('active');
    if (btnSettings) btnSettings.classList.remove('active');
    if (vistaInbox) vistaInbox.style.display = 'flex';
    if (vistaSettings) vistaSettings.style.display = 'none';
    renderizarListaNotificacionesModal();
  }
}

function probarNotificacionSistema() {
  if (!('Notification' in window)) {
    mostrarToastPersonalizado(tLang('Tu navegador no admite notificaciones Web.', 'Your browser does not support Web notifications.'));
    return;
  }
  if (Notification.permission !== 'granted') {
    solicitarPermisoNotificaciones().then(ok => {
      if (ok) {
        lanzarNotificacion({
          id: 'test_' + Date.now(),
          tipo: 'sistema',
          titulo: tLang('¡Notificaciones activas en Mediary!', 'Notifications active in Mediary!'),
          mensaje: tLang('Tu dispositivo está listo para avisarte de rachas a las 21:00, actividad y solicitudes.', 'Your device is ready to notify you about 9:00 PM streaks, activity, and requests.'),
          icono: getHeroIcon('sparkles')
        });
        renderizarListaNotificacionesModal();
      }
    });
    return;
  }
  lanzarNotificacion({
    id: 'test_' + Date.now(),
    tipo: 'sistema',
    titulo: tLang('¡Notificaciones activas en Mediary!', 'Notifications active in Mediary!'),
    mensaje: tLang('Tu dispositivo está listo para avisarte de rachas a las 21:00, actividad y solicitudes.', 'Your device is ready to notify you about 9:00 PM streaks, activity, and requests.'),
    icono: getHeroIcon('sparkles')
  });
  renderizarListaNotificacionesModal();
  mostrarToastPersonalizado(tLang(' Notificación de prueba enviada', 'Test notification sent'));
}

function abrirModalNotificaciones() {
  const modal = document.getElementById('modal-notificaciones');
  if (!modal) return;
  cambiarTabNotificaciones('inbox');
  actualizarUIPermisoNotificaciones();
  sincronizarSwitchesNotificaciones();
  renderizarListaNotificacionesModal();
  modal.style.display = 'flex';
}

function cerrarModalNotificaciones() {
  const modal = document.getElementById('modal-notificaciones');
  if (modal) modal.style.display = 'none';
}

function escapeHtmlNotif(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderizarListaNotificacionesModal() {
  const cont = document.getElementById('lista-notificaciones-body');
  const resEl = document.getElementById('notif-bandeja-resumen');
  const subCount = document.getElementById('notif-subtitle-count');
  const tabCounter = document.getElementById('tab-notif-inbox-counter');
  if (!cont) return;

  const lista = obtenerBandejaNotificaciones();
  const noLeidas = lista.filter(n => !n.leida).length;

  if (tabCounter) {
    if (noLeidas > 0) {
      tabCounter.textContent = noLeidas > 99 ? '99+' : String(noLeidas);
      tabCounter.style.display = 'inline-block';
    } else {
      tabCounter.style.display = 'none';
    }
  }

  if (subCount) {
    if (noLeidas > 0) {
      subCount.textContent = getLang_() === 'en' ? (noLeidas === 1 ? '1 unread notification' : `${noLeidas} unread notifications`) : (noLeidas === 1 ? '1 notificación sin leer' : `${noLeidas} notificaciones sin leer`);
      subCount.style.color = 'var(--accent)';
    } else {
      subCount.textContent = tLang('Todo al día', 'All caught up');
      subCount.style.color = 'var(--muted)';
    }
  }

  if (resEl) {
    resEl.textContent = lista.length === 1 
      ? (getLang_() === 'en' ? `1 notification (${noLeidas} unread)` : `1 notificación (${noLeidas} sin leer)`)
      : (getLang_() === 'en' ? `${lista.length} notifications (${noLeidas} unread)` : `${lista.length} notificaciones (${noLeidas} sin leer)`);
  }

  if (!lista.length) {
    cont.innerHTML = `
      <div style="text-align:center; padding:38px 20px; color:var(--muted);">
        <div style="margin-bottom:8px;">${getHeroIcon('sparkles', '', 36)}</div>
        <div style="font-weight:700; color:var(--text); font-size:0.95rem; margin-bottom:4px;">${tLang('No tienes notificaciones', 'No notifications yet')}</div>
        <div style="font-size:0.8rem; max-width:320px; margin:0 auto 14px;">${tLang('Aquí verás recordatorios de rachas, likes de amigos, nuevos registros y solicitudes.', "Here you'll see streak reminders, friend likes, new records, and requests.")}</div>
        <button type="button" class="btn-today-pill" style="height:32px; font-size:0.75rem; margin:0 auto; padding:0 14px; display:inline-flex; align-items:center; gap:6px;" onclick="probarNotificacionSistema()"><span>${getHeroIcon('bell', '', 14)}</span> <span>${tLang('Probar notificación de muestra', 'Send sample notification')}</span></button>
      </div>
    `;
    return;
  }

  cont.innerHTML = lista.map(n => {
    const timeStr = formatearTiempoNotif(n.fecha);
    const tipoVal = ['racha', 'like', 'amigo', 'solicitud', 'sistema'].includes(n.tipo) ? n.tipo : 'sistema';
    return `
      <div class="notif-card ${n.leida ? '' : 'unread'}" onclick="clickEnNotificacion('${n.id}')">
        <div class="notif-card-icon-box ${tipoVal}">
          <span>${(n.icono && n.icono.includes('<svg')) ? n.icono : getHeroIcon(n.icono || 'bell')}</span>
        </div>
        <div class="notif-card-content">
          <div class="notif-card-header">
            <span class="notif-card-title">
              ${escapeHtmlNotif(n.titulo)}
              ${n.leida ? '' : `<span class="notif-unread-dot" title="${tLang('No leída', 'Unread')}"></span>`}
            </span>
            <div style="display:flex; align-items:center; gap:4px;">
              <span class="notif-card-time">${timeStr}</span>
              <button type="button" class="notif-dismiss-btn" onclick="eliminarNotificacion(event, '${n.id}')" title="${tLang('Eliminar', 'Delete')}">${getHeroIcon('x-mark', '', 14)}</button>
            </div>
          </div>
          <p class="notif-card-msg">${escapeHtmlNotif(n.mensaje)}</p>
        </div>
      </div>
    `;
  }).join('');
}

function formatearTiempoNotif(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  const isEn = getLang_() === 'en';
  if (diffSec < 60) return isEn ? 'Now' : 'Ahora';
  if (diffSec < 3600) return isEn ? `${Math.floor(diffSec / 60)}m ago` : `Hace ${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return isEn ? `${Math.floor(diffSec / 3600)}h ago` : `Hace ${Math.floor(diffSec / 3600)}h`;
  const dia = d.getDate();
  const meses = isEn ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return isEn ? `${meses[d.getMonth()]} ${dia}` : `${dia} ${meses[d.getMonth()]}`;
}

function clickEnNotificacion(notifId) {
  const lista = obtenerBandejaNotificaciones();
  const notif = lista.find(n => n.id === notifId);
  if (notif) {
    notif.leida = true;
    guardarBandejaNotificaciones(lista);
    renderizarListaNotificacionesModal();

    if (notif.accion === 'abrirLectura') {
      cerrarModalNotificaciones();
      cambiarCat('Lecturas', 'Libros');
    } else if (notif.accion === 'abrirMusica') {
      cerrarModalNotificaciones();
      cambiarCat('Musica', 'Discos');
    } else if (notif.accion === 'abrirFeedAmigos' || notif.accion === 'abrirAmigos') {
      cerrarModalNotificaciones();
      abrirVistaAmigos();
    }
  }
}

function eliminarNotificacion(e, notifId) {
  if (e && e.stopPropagation) e.stopPropagation();
  const lista = obtenerBandejaNotificaciones().filter(n => n.id !== notifId);
  guardarBandejaNotificaciones(lista);
  renderizarListaNotificacionesModal();
}

function marcarTodasNotificacionesLeidas() {
  const lista = obtenerBandejaNotificaciones();
  lista.forEach(n => n.leida = true);
  guardarBandejaNotificaciones(lista);
  renderizarListaNotificacionesModal();
  mostrarToastPersonalizado(tLang(' Notificaciones marcadas como leídas', 'All notifications marked as read'));
}

function vaciarBandejaNotificaciones() {
  guardarBandejaNotificaciones([]);
  renderizarListaNotificacionesModal();
}

// 1. RECORDATORIO DE RACHAS A LAS 21:00
function verificarRecordatorioRacha21() {
  const prefs = obtenerPreferenciasNotificaciones();
  if (!prefs.racha21) return;

  const now = new Date();
  const hora = now.getHours();
  if (hora < 21) return;

  const hoyStr = (typeof obtenerFechaHoyStr === 'function') ? obtenerFechaHoyStr() : now.toISOString().split('T')[0];
  const lastSent = localStorage.getItem(NOTIF_RACHA_LAST_KEY);
  if (lastSent === hoyStr) return;

  const leyoHoy = typeof haLeidoHoy === 'function' && haLeidoHoy();
  const rMusica = typeof calcularRachaDiscos === 'function' ? calcularRachaDiscos(estado.registros) : { esActivaHoy: false };
  const escuchoHoy = !!rMusica.esActivaHoy;

  if (leyoHoy && escuchoHoy) return;

  let tit = tLang('¡Recordatorio de rachas!', 'Streak reminder!');
  let msg = '';
  let icono = getHeroIcon('fire');
  let accion = 'abrirLectura';

  if (!leyoHoy && !escuchoHoy) {
    msg = tLang('¡Son las 21:00! Aún no has marcado lectura ni registrado un disco hoy. ¡Mantén tus rachas vivas!', "It's 9:00 PM! You haven't logged reading or an album today yet. Keep your streaks alive!");
    accion = 'abrirLectura';
  } else if (!leyoHoy) {
    tit = tLang('¡Recordatorio de lectura!', 'Reading reminder!');
    msg = tLang('¡Son las 21:00! Aún no has marcado tu lectura de hoy. Toca para registrarla y no perder tu racha.', "It's 9:00 PM! You haven't logged today's reading yet. Tap to log it and keep your streak.");
    icono = getHeroIcon('book-open');
    accion = 'abrirLectura';
  } else {
    tit = tLang('¡Recordatorio de música!', 'Music reminder!');
    msg = tLang('¡Son las 21:00! Aún no has registrado un disco hoy. Agrega un álbum para continuar tu racha musical.', "It's 9:00 PM! You haven't logged an album today yet. Add an album to continue your music streak.");
    icono = getHeroIcon('disc');
    accion = 'abrirMusica';
  }

  localStorage.setItem(NOTIF_RACHA_LAST_KEY, hoyStr);
  lanzarNotificacion({
    id: 'racha21_' + hoyStr,
    tipo: 'racha',
    titulo: tit,
    mensaje: msg,
    icono: icono,
    accion: accion
  });
}

function programarAlarmaRacha21() {
  verificarRecordatorioRacha21();
  setInterval(() => {
    if (!document.hidden) verificarRecordatorioRacha21();
  }, 60 * 1000);
}

// 2. LIKES EN RESEÑAS
function verificarNuevosLikesRecibidos(likesRecibidos) {
  const prefs = obtenerPreferenciasNotificaciones();
  if (!prefs.likesAmigos) return;
  if (!likesRecibidos || typeof likesRecibidos !== 'object') return;

  let conocidos = {};
  try {
    const raw = localStorage.getItem(NOTIF_KNOWN_LIKES_KEY);
    if (raw) conocidos = JSON.parse(raw);
  } catch(e) {}

  let huboNuevos = false;
  const regs = estado.registros || [];

  for (const regId of Object.keys(likesRecibidos)) {
    const listaEmails = likesRecibidos[regId];
    if (!Array.isArray(listaEmails)) continue;
    let conocidosParaEste = conocidos[regId] || [];

    for (const emailAmigo of listaEmails) {
      if (!conocidosParaEste.includes(emailAmigo)) {
        huboNuevos = true;
        conocidosParaEste.push(emailAmigo);

        const reg = regs.find(r => String(r.id) === String(regId));
        const tit = reg ? reg.titulo : tLang('tu reseña', 'your review');

        let nombreAmigo = emailAmigo.split('@')[0];
        if (estado.amigosCache && Array.isArray(estado.amigosCache)) {
          const am = estado.amigosCache.find(a => (a.email || '').toLowerCase() === emailAmigo.toLowerCase());
          if (am && am.nickname) nombreAmigo = am.nickname;
        }

        lanzarNotificacion({
          id: 'like_' + regId + '_' + emailAmigo,
          tipo: 'like',
          titulo: tLang('¡Nuevo Like en tu reseña!', 'New Like on your review!'),
          mensaje: tLang(`A ${nombreAmigo} le gustó tu reseña de "${tit}".`, `${nombreAmigo} liked your review of "${tit}".`),
          icono: getHeroIcon('heart'),
          accion: 'abrirAmigos'
        });
      }
    }
    conocidos[regId] = conocidosParaEste;
  }

  if (huboNuevos) {
    try {
      localStorage.setItem(NOTIF_KNOWN_LIKES_KEY, JSON.stringify(conocidos));
    } catch(e) {}
  }
}

async function verificarLikesRecibidosEnNube() {
  if (!estado.userEmail) return;
  const prefs = obtenerPreferenciasNotificaciones();
  if (!prefs.likesAmigos) return;
  try {
    const rows = await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(normEm_(estado.userEmail)) + '&select=preferencias', 'GET').catch(() => []);
    if (rows && rows.length > 0 && rows[0].preferencias) {
      const p = rows[0].preferencias;
      if (p.likes_recibidos) {
        verificarNuevosLikesRecibidos(p.likes_recibidos);
      }
    }
  } catch (e) {}
}

// 3. NUEVOS REGISTROS DE AMIGOS
function verificarNuevasActividadesAmigos(feed) {
  const prefs = obtenerPreferenciasNotificaciones();
  if (!prefs.novedadesAmigos) return;
  if (!Array.isArray(feed) || !feed.length) return;

  let vistos = new Set();
  try {
    const raw = localStorage.getItem(NOTIF_SEEN_FEED_KEY);
    if (raw) vistos = new Set(JSON.parse(raw));
  } catch(e) {}

  if (vistos.size === 0) {
    feed.forEach(it => { if (it.id) vistos.add(String(it.id)); });
    try {
      localStorage.setItem(NOTIF_SEEN_FEED_KEY, JSON.stringify(Array.from(vistos)));
    } catch(e) {}
    return;
  }

  let huboNuevos = false;
  const recientes = feed.filter(it => !esItemCancionMusica(it) && !(it.categoria === 'Musica' && (it.subcategoria === 'Canciones' || String(it.id || '').startsWith('sp_')))).slice(0, 10);
  for (const it of recientes) {
    if (!it || !it.id) continue;
    const idStr = String(it.id);
    if (!vistos.has(idStr)) {
      vistos.add(idStr);
      huboNuevos = true;

      const amigoNombre = it.amigoNickname || it.amigoNick || (it.userEmail ? it.userEmail.split('@')[0] : tLang('Un amigo', 'A friend'));
      const catIcon = it.categoria === 'Peliculas' ? 'film' : (it.categoria === 'Musica' ? 'disc' : (it.categoria === 'Lecturas' ? 'book-open' : (it.categoria === 'Series' ? 'tv' : 'gamepad')));

      lanzarNotificacion({
        id: 'amigo_' + idStr,
        tipo: 'amigo',
        titulo: tLang('Novedad de amigo', 'Friend update'),
        mensaje: tLang(`${amigoNombre} agregó "${it.titulo}".`, `${amigoNombre} logged "${it.titulo}".`),
        icono: catIcon,
        accion: 'abrirFeedAmigos'
      });
    }
  }

  if (huboNuevos) {
    try {
      localStorage.setItem(NOTIF_SEEN_FEED_KEY, JSON.stringify(Array.from(vistos).slice(-200)));
    } catch(e) {}
  }
}

// 4. NUEVOS AMIGOS Y SOLICITUDES DE AMISTAD
function verificarNuevosAmigosYSolicitudes(solicitudes, amigos) {
  const prefs = obtenerPreferenciasNotificaciones();
  if (!prefs.amigosYSolicitudes) return;

  // A) Solicitudes entrantes de amistad
  if (Array.isArray(solicitudes) && solicitudes.length > 0) {
    let vistas = new Set();
    let esPrimeraCargaReq = false;
    try {
      const raw = localStorage.getItem(NOTIF_SEEN_REQUESTS_KEY);
      if (raw !== null) {
        vistas = new Set(JSON.parse(raw));
      } else {
        esPrimeraCargaReq = true;
      }
    } catch (e) {}

    let huboNuevasReq = false;
    for (const s of solicitudes) {
      if (!s) continue;
      const emailReq = (typeof s === 'string' ? s : (s.email || s.userId || '')).toLowerCase();
      if (!emailReq) continue;

      if (!vistas.has(emailReq)) {
        vistas.add(emailReq);
        huboNuevasReq = true;

        const nick = (typeof s === 'object' && s.nickname) ? s.nickname : emailReq.split('@')[0];
        lanzarNotificacion({
          id: 'solicitud_' + emailReq,
          tipo: 'solicitud',
          titulo: tLang('Solicitud de amistad recibida', 'Friend request received'),
          mensaje: tLang(`${nick} te ha enviado una solicitud de amistad.`, `${nick} sent you a friend request.`),
          icono: getHeroIcon('users'),
          accion: 'abrirAmigos'
        });
      }
    }

    if (huboNuevasReq || esPrimeraCargaReq) {
      try {
        localStorage.setItem(NOTIF_SEEN_REQUESTS_KEY, JSON.stringify(Array.from(vistas)));
      } catch (e) {}
    }
  }

  // B) Nuevos amigos aceptados / conectados
  if (Array.isArray(amigos)) {
    let conocidos = new Set();
    let esPrimeraCargaAmigos = false;
    try {
      const raw = localStorage.getItem(NOTIF_KNOWN_FRIENDS_KEY);
      if (raw !== null) {
        conocidos = new Set(JSON.parse(raw));
      } else {
        esPrimeraCargaAmigos = true;
      }
    } catch (e) {}

    if (esPrimeraCargaAmigos) {
      // Primera vez: guardar amigos existentes para no alertar sobre el historial previo
      amigos.forEach(a => {
        const em = (typeof a === 'string' ? a : (a.email || '')).toLowerCase();
        if (em) conocidos.add(em);
      });
      try {
        localStorage.setItem(NOTIF_KNOWN_FRIENDS_KEY, JSON.stringify(Array.from(conocidos)));
      } catch (e) {}
    } else {
      let huboNuevosAmigos = false;
      for (const a of amigos) {
        if (!a) continue;
        const em = (typeof a === 'string' ? a : (a.email || '')).toLowerCase();
        if (!em) continue;

        if (!conocidos.has(em)) {
          conocidos.add(em);
          huboNuevosAmigos = true;

          const nick = (typeof a === 'object' && a.nickname) ? a.nickname : em.split('@')[0];
          lanzarNotificacion({
            id: 'nuevo_amigo_' + em,
            tipo: 'amigo',
            titulo: tLang('¡Nuevo amigo conectado!', 'New friend connected!'),
            mensaje: tLang(`¡Ahora eres amigo de ${nick}! Ya puedes explorar sus registros y mezclar watchlists.`, `You are now friends with ${nick}! You can explore their records and mix watchlists.`),
            icono: getHeroIcon('users'),
            accion: 'abrirAmigos'
          });
        }
      }

      if (huboNuevosAmigos) {
        try {
          localStorage.setItem(NOTIF_KNOWN_FRIENDS_KEY, JSON.stringify(Array.from(conocidos)));
        } catch (e) {}
      }
    }
  }
}

async function verificarAmigosYSolicitudesEnNube() {
  if (!estado.userEmail) return;
  const prefs = obtenerPreferenciasNotificaciones();
  if (!prefs.amigosYSolicitudes) return;
  try {
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run.withSuccessHandler(res => {
        if (res && res.exito && typeof verificarNuevosAmigosYSolicitudes === 'function') {
          verificarNuevosAmigosYSolicitudes(res.solicitudes || [], res.amigos || []);
        }
      }).obtenerDatosAmigosUsuario(estado.userEmail);
    }
  } catch (e) {}
}

function inicializarSistemaNotificaciones() {
  actualizarBadgeNotificaciones();
  sincronizarSwitchesNotificaciones();
  programarAlarmaRacha21();
  if (estado.userEmail) {
    verificarLikesRecibidosEnNube();
    verificarAmigosYSolicitudesEnNube();
  }
}

window.abrirModalNotificaciones = abrirModalNotificaciones;
window.cerrarModalNotificaciones = cerrarModalNotificaciones;
window.cambiarTabNotificaciones = cambiarTabNotificaciones;
window.solicitarPermisoNotificaciones = solicitarPermisoNotificaciones;
window.actualizarPreferenciaNotificacion = actualizarPreferenciaNotificacion;
window.probarNotificacionSistema = probarNotificacionSistema;
window.clickEnNotificacion = clickEnNotificacion;
window.eliminarNotificacion = eliminarNotificacion;
window.marcarTodasNotificacionesLeidas = marcarTodasNotificacionesLeidas;
window.vaciarBandejaNotificaciones = vaciarBandejaNotificaciones;
window.verificarNuevasActividadesAmigos = verificarNuevasActividadesAmigos;
window.verificarNuevosLikesRecibidos = verificarNuevosLikesRecibidos;
window.verificarLikesRecibidosEnNube = verificarLikesRecibidosEnNube;
window.verificarNuevosAmigosYSolicitudes = verificarNuevosAmigosYSolicitudes;
window.verificarAmigosYSolicitudesEnNube = verificarAmigosYSolicitudesEnNube;
window.inicializarSistemaNotificaciones = inicializarSistemaNotificaciones;

