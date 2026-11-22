/* Mediary — js/features/friends.js */
function toggleSubOpcionesPrivacidad() { const chkRegs = document.getElementById('priv-opt-regs'); const subBox = document.getElementById('sub-opciones-priv-regs'); if (subBox && chkRegs) subBox.style.opacity = chkRegs.checked ? '1' : '0.4'; }
function abrirModalPrivacidadAmigos() { const priv = perfilUsuario.preferencias?.privacidad || {}; document.getElementById('priv-opt-stats').checked = priv.ocultarEstadisticas !== true; document.getElementById('priv-opt-wl').checked = priv.ocultarWatchlist !== true; document.getElementById('priv-opt-favs').checked = priv.ocultarFavoritos !== true; document.getElementById('priv-opt-regs').checked = priv.ocultarRegistros !== true; document.getElementById('priv-opt-calif').checked = priv.ocultarCalificaciones !== true; document.getElementById('priv-opt-comentarios').checked = priv.ocultarComentarios !== true; toggleSubOpcionesPrivacidad(); document.getElementById('modal-privacidad-amigos').style.display = 'flex'; }
function cerrarModalPrivacidadAmigos() { document.getElementById('modal-privacidad-amigos').style.display = 'none'; }
function guardarPrivacidadAmigos() { if (!estado.userEmail) return alert(userPrefs.lang === 'en' ? 'Sign in to save your privacy settings.' : 'Inicia sesión para guardar tu privacidad.'); const priv = { ocultarEstadisticas: !document.getElementById('priv-opt-stats').checked, ocultarWatchlist: !document.getElementById('priv-opt-wl').checked, ocultarFavoritos: !document.getElementById('priv-opt-favs').checked, ocultarRegistros: !document.getElementById('priv-opt-regs').checked, ocultarCalificaciones: !document.getElementById('priv-opt-calif').checked, ocultarComentarios: !document.getElementById('priv-opt-comentarios').checked }; if (!perfilUsuario.preferencias) perfilUsuario.preferencias = {}; perfilUsuario.preferencias.privacidad = priv; guardarPerfilLocal(); google.script.run.withSuccessHandler(res => { cerrarModalPrivacidadAmigos(); mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Privacy settings saved!' : '¡Preferencias de privacidad guardadas! '); }).guardarPrivacidadUsuario(estado.userEmail, priv); }
function cargarActividadAmigos() {
  if (!estado.userEmail) return;
  google.script.run.withSuccessHandler(res => {
    if (res && res.exito) {
      estado.amigosActividad = res.actividad || {};
      if (estado.categoria === 'discover' || estado.categoria === 'inicio') {
        renderizarDiscoverVista();
      }
    }
  }).obtenerActividadAmigos(estado.userEmail);
}
function obtenerAmigosActividadItem(it, catFallback) {
  if (!estado.amigosActividad) return [];
  const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const cleanTit = t => String(t || '').replace(/\s*\(\d{4}\)$/, '').trim();
  const keys = new Set();
  if (typeof it === 'string') {
    keys.add(norm(it));
    keys.add(norm(cleanTit(it)));
  } else if (it) {
    if (it.titulo) {
      keys.add(norm(it.titulo));
      keys.add(norm(cleanTit(it.titulo)));
    }
    if (it.tituloOriginal) {
      keys.add(norm(it.tituloOriginal));
      keys.add(norm(cleanTit(it.tituloOriginal)));
    }
    if (it.tituloIngles) {
      keys.add(norm(it.tituloIngles));
      keys.add(norm(cleanTit(it.tituloIngles)));
    }
  }
  const encontrados = [];
  const vistos = new Set();
  keys.forEach(k => {
    if (!k) return;
    const lista = estado.amigosActividad[k] || [];
    lista.forEach(act => {
      const uKey = `${act.amigoEmail || act.amigo}_${act.tipo}`;
      if (!vistos.has(uKey)) {
        vistos.add(uKey);
        encontrados.push(act);
      }
    });
  });
  return encontrados;
}
function renderizarInsigniasAmigosDiscover(it, cat) {
  const acts = obtenerAmigosActividadItem(it, cat);
  if (!acts || !acts.length) return '';
  const l = userPrefs.lang || 'es';
  const visibles = acts.slice(0, 3);
  const extra = acts.length - visibles.length;

  return `
    <div class="discover-friends-tag-row" onclick="event.stopPropagation()">
      <div class="discover-friends-avatars">
        ${visibles.map((act) => {
          const isVisto = act.tipo === 'visto';
          const subIcon = isVisto ? getHeroIcon('check', '', 14) : getHeroIcon('bookmark', '', 14);
          const badgeClass = isVisto ? 'badge-visto' : 'badge-pendiente';
          const avHtml = act.amigoAvatar && (act.amigoAvatar.startsWith('http') || act.amigoAvatar.startsWith('data:'))
            ? `<img loading="lazy" decoding="async" src="${act.amigoAvatar}" alt="${escHtmlFeed_(act.amigo)}">`
            : `<span>${act.amigoAvatar || '🦊'}</span>`;
          const actKey = encodeURIComponent(JSON.stringify(act));
          const verb = isVisto
            ? (cat === 'Musica' ? (l === 'en' ? 'listened to this' : 'ya lo escuchó')
              : (cat === 'Juegos' ? (l === 'en' ? 'played this' : 'ya lo jugó')
              : (cat === 'Lecturas' ? (l === 'en' ? 'read this' : 'ya lo leyó')
              : (l === 'en' ? 'watched this' : 'ya la vio'))))
            : (l === 'en' ? 'in their Watchlist' : 'en sus pendientes');
          const califTxt = (isVisto && act.calificacion) ? ` (${act.calificacion})` : '';
          const tooltip = `${escHtmlFeed_(act.amigo)} ${verb}${califTxt}`;
          return `
            <div class="discover-friend-avatar-btn" data-act="${actKey}" onclick="abrirModalDetalleActividadAmigo(this)" title="${tooltip}">
              <div class="discover-avatar-circle">${avHtml}</div>
              <span class="discover-friend-mini-badge ${badgeClass}">${subIcon}</span>
            </div>
          `;
        }).join('')}
      </div>
      <span class="discover-friends-caption" onclick="this.previousElementSibling.querySelector('.discover-friend-avatar-btn')?.click()">${escHtmlFeed_(visibles[0].amigo)}${extra > 0 ? ` +${extra}` : (acts.length > 1 ? ` y ${escHtmlFeed_(acts[1].amigo)}` : '')}</span>
    </div>
  `;
}
function abrirModalDetalleActividadAmigo(btnOrAct) {
  let act = btnOrAct;
  if (btnOrAct && btnOrAct.closest && !btnOrAct.dataset?.act) {
    const elWithAct = btnOrAct.closest('[data-act]');
    if (elWithAct) btnOrAct = elWithAct;
  }
  if (btnOrAct && btnOrAct.dataset && btnOrAct.dataset.act) {
    try { act = JSON.parse(decodeURIComponent(btnOrAct.dataset.act)); } catch(e){}
  }
  if (!act) return;
  const l = userPrefs.lang || 'es';
  const m = document.getElementById('modal-amigo-registro-detalle');
  if (!m) return;

  const avEl = document.getElementById('act-modal-friend-avatar');
  if (act.amigoAvatar && (act.amigoAvatar.startsWith('http') || act.amigoAvatar.startsWith('data:'))) {
    avEl.innerHTML = `<img loading="lazy" decoding="async" src="${act.amigoAvatar}" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    avEl.innerHTML = `<span>${act.amigoAvatar || '🦊'}</span>`;
  }

  document.getElementById('act-modal-friend-nick').textContent = act.amigo || tLang('Amigo', 'Friend');

  const isVisto = act.tipo ? (act.tipo === 'visto') : true;
  const typeBadge = document.getElementById('act-modal-type-badge');
  const phraseEl = document.getElementById('act-modal-status-phrase');

  let verbo = '';
  if (act.cat === 'Musica') verbo = isVisto ? (l === 'en' ? 'Listened' : 'Ya lo escuchó') : (l === 'en' ? 'Wants to listen' : 'Por escuchar');
  else if (act.cat === 'Juegos') verbo = isVisto ? (l === 'en' ? 'Played' : 'Ya lo jugó') : (l === 'en' ? 'Wants to play' : 'Por jugar');
  else if (act.cat === 'Lecturas') verbo = isVisto ? (l === 'en' ? 'Read' : 'Ya lo leyó') : (l === 'en' ? 'Wants to read' : 'Por leer');
  else verbo = isVisto ? (l === 'en' ? 'Watched' : 'Ya la vio') : (l === 'en' ? 'Wants to watch' : 'Por ver');

  if (isVisto) {
    typeBadge.className = 'act-type-badge visto';
    typeBadge.innerHTML = (l === 'en' ? `${getHeroIcon('check', '', 12)} Completed` : `${getHeroIcon('check', '', 12)} Completado`);
    phraseEl.textContent = `${act.amigo} ${verbo.toLowerCase()}`;
  } else {
    typeBadge.className = 'act-type-badge pendiente';
    typeBadge.innerHTML = (l === 'en' ? `${getHeroIcon('bookmark', '', 12)} Watchlist` : `${getHeroIcon('bookmark', '', 12)} En Watchlist`);
    phraseEl.textContent = l === 'en' ? `${act.amigo} has this in pending watchlist` : `${act.amigo} la tiene en su lista de pendientes`;
  }

  document.getElementById('act-modal-item-title').textContent = act.titulo || tLang('Sin título', 'Untitled');
  document.getElementById('act-modal-item-creator').textContent = act.creador ? `${act.creador} ${act.anio ? '(' + act.anio + ')' : ''}` : (act.anio ? `(${act.anio})` : '');
  const actSubDisp = (act.sub && I18N[l]?.subs?.[act.sub]) || act.sub || (act.cat && (typeof traducirNombreCat === 'function' ? traducirNombreCat(act.cat) : act.cat)) || 'Mediary';
  document.getElementById('act-modal-item-subcat').textContent = actSubDisp;
  const postEl = document.getElementById('act-modal-item-poster');
  if (act.poster) {
    postEl.src = act.poster;
    postEl.style.display = 'block';
  } else {
    postEl.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="88" fill="%23334155"><rect width="100%" height="100%"/></svg>';
  }

  const ratingBox = document.getElementById('act-modal-item-rating');
  if (isVisto && act.calificacion) {
    ratingBox.innerHTML = `
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(234,179,8,0.12);border:1px solid rgba(234,179,8,0.3);padding:3px 8px;border-radius:4px;">
        <span>${renderEstrellasVisuales(act.calificacion)}</span>
        <strong style="color:var(--star-active);font-size:0.85rem;">${Number(act.calificacion).toFixed(1)}</strong>
      </div>
    `;
    ratingBox.style.display = 'flex';
  } else {
    ratingBox.style.display = 'none';
  }

  const revSec = document.getElementById('act-modal-review-section');
  if (isVisto && act.comentario && act.comentario.trim()) {
    document.getElementById('act-modal-review-nick').textContent = act.amigo;
    document.getElementById('act-modal-review-text').textContent = `"${act.comentario.trim()}"`;
    revSec.style.display = 'block';
  } else {
    revSec.style.display = 'none';
  }

  const metaDates = document.getElementById('act-modal-meta-dates');
  const metaHours = document.getElementById('act-modal-meta-hours');
  if (isVisto && (act.fechaInicio || act.fechaFin)) {
    const fStr = (act.fechaFin && act.fechaFin !== 'Sin fecha')
      ? (act.fechaInicio && act.fechaInicio !== 'Sin fecha' ? `${getHeroIcon('calendar', '', 12)} ${act.fechaInicio} <span class="date-arrow">&rarr;</span> ${act.fechaFin}` : `${getHeroIcon('calendar', '', 12)} ${act.fechaFin}`)
      : (act.fechaInicio && act.fechaInicio !== 'Sin fecha' ? `${getHeroIcon('calendar', '', 12)} ${tLang('Inicio:', 'Start:')} ${act.fechaInicio}` : '');
    metaDates.innerHTML = fStr;
    metaDates.style.display = fStr ? 'inline-block' : 'none';
  } else {
    metaDates.style.display = 'none';
  }
  const hActLimpia = (typeof limpiarTextoHoras === 'function') ? limpiarTextoHoras(act.horas) : '';
  if (isVisto && hActLimpia) {
    metaHours.innerHTML = `${getHeroIcon('clock', '', 12)} ${hActLimpia} ${tLang('jugadas', 'played')}`;
    metaHours.style.display = 'inline-block';
  } else {
    metaHours.style.display = 'none';
  }

  const btnFriendRegs = document.getElementById('act-modal-btn-friend-regs');
  btnFriendRegs.onclick = () => {
    cerrarModalDetalleActividadAmigo();
    abrirModalRegistrosAmigo(act.amigoEmail, act.amigo, act.cat);
  };
  btnFriendRegs.innerHTML = `${getHeroIcon('user', '', 14)} ${(l === 'en' ? 'View records of ' : 'Ver registros de ') + act.amigo}`;

  const btnAddWl = document.getElementById('act-modal-btn-add-wl');
  btnAddWl.onclick = () => {
    agregarAWatchlistDirecto({
      titulo: act.titulo,
      tituloOriginal: act.titulo,
      tituloIngles: act.subtitulo || '',
      creador: act.creador || '',
      anio: act.anio || '',
      categoria: act.cat || 'Peliculas',
      subcategoria: act.sub || 'Películas',
      poster: act.poster || ''
    }, btnAddWl);
  };

  m.style.display = 'flex';
}
function cerrarModalDetalleActividadAmigo() {
  const m = document.getElementById('modal-amigo-registro-detalle');
  if (m) m.style.display = 'none';
}
window.abrirModalDetalleActividadAmigo = abrirModalDetalleActividadAmigo;
window.cerrarModalDetalleActividadAmigo = cerrarModalDetalleActividadAmigo;
window.renderizarInsigniasAmigosDiscover = renderizarInsigniasAmigosDiscover;
window.obtenerAmigosActividadItem = obtenerAmigosActividadItem;

function obtenerBadgeAmigoActividad(titulo, catFallback) {
  if (!titulo || !estado.amigosActividad) return '';
  const acts = obtenerAmigosActividadItem(titulo, catFallback);
  if (!acts.length) return '';
  return acts.slice(0, 2).map(act => {
    if (act.tipo === 'pendiente') {
      return `<div class="amigo-activity-pill amigo-wl-pill">${getHeroIcon('bookmark', '', 12)} <strong>${escHtmlFeed_(act.amigo)}</strong> ${tLang('en pendientes', 'on watchlist')}</div>`;
    }
    const c = act.cat || catFallback || estado.categoria;
    let verbo = tLang('ya la vio', 'watched it');
    if (c === 'Musica') verbo = tLang('ya lo escuchó', 'listened to it');
    else if (c === 'Juegos') verbo = tLang('ya lo jugó', 'played it');
    else if (c === 'Lecturas') verbo = tLang('ya lo leyó', 'read it');
    const califStr = act.calificacion ? ` (${act.calificacion})` : '';
    return `<div class="amigo-activity-pill">${getHeroIcon('user', '', 12)} <strong>${escHtmlFeed_(act.amigo)}</strong> ${verbo}${califStr}</div>`;
  }).join(' ');
}
function cambiarAmigoRegistrosLista(emailAmigo) { if (!emailAmigo) { volverAMisRegistrosDesdeAmigo(); return; } google.script.run.withSuccessHandler(res => { if (!res || !res.exito) { document.getElementById('select-amigo-historial').value = ''; return alert(res?.error || (userPrefs.lang === 'en' ? 'Could not load records for this friend.' : 'No se pudieron cargar los registros de este amigo.')); } estado.registrosAmigoViendo = res.registros || []; estado.viendoAmigoNombre = res.amigoNombre || tLang('Amigo', 'Friend'); const banner = document.getElementById('amigo-lista-banner'); if (banner) { document.getElementById('amigo-nombre-banner').textContent = estado.viendoAmigoNombre; banner.style.display = 'flex'; } filtrarYMostrarHistorialAmigo(); }).obtenerRegistrosDeAmigo(emailAmigo, estado.categoria); }
function volverAMisRegistrosDesdeAmigo() { estado.registrosAmigoViendo = null; estado.viendoAmigoNombre = null; const banner = document.getElementById('amigo-lista-banner'); if (banner) banner.style.display = 'none'; const sel = document.getElementById('select-amigo-historial'); if (sel) sel.value = ''; filtrarYMostrarHistorial(); }
function filtrarYMostrarHistorialAmigo() {
  if (!estado.registrosAmigoViendo) return filtrarYMostrarHistorial();
  actualizarBotonOrdenHistorial();
  const c = estado.categoria, sub = estado.subcategoria;
  const r = subTieneRango(c, sub);
  const isDesc = obtenerOrdenHistorialActual() === 'desc';
  let regs = (estado.registrosAmigoViendo || []).filter(item => item.subcategoria === sub);
  regs.sort((a, b) => {
    const fA = (!r) ? a.fechaInicio : ((a.fechaFin && a.fechaFin !== 'Sin fecha' && !esEnProgresoTexto(a.fechaFin)) ? a.fechaFin : a.fechaInicio);
    const fB = (!r) ? b.fechaInicio : ((b.fechaFin && b.fechaFin !== 'Sin fecha' && !esEnProgresoTexto(b.fechaFin)) ? b.fechaFin : b.fechaInicio);
    const diff = isDesc ? (timestampDeFecha(fB) - timestampDeFecha(fA)) : (timestampDeFecha(fA) - timestampDeFecha(fB));
    return diff !== 0 ? diff : (a.titulo || '').localeCompare(b.titulo || '');
  });

  const tbody = document.getElementById('tbody-historial');
  const mobileList = document.getElementById('mobile-history-cards');
  document.getElementById('total-filtro').textContent = regs.length;

  const txtEnCurso = tLang('🕒 En curso', '🕒 In progress');
  if (tbody) {
    tbody.innerHTML = regs.map(reg => {
      const fI = sanitizarFechaFrontend(reg.fechaInicio), fF = sanitizarFechaFrontend(reg.fechaFin);
      const enProg = r && (esEnProgresoTexto(fF) || (!fF || fF === 'Sin fecha' || fF === ''));
      const infoI = desglosarFechaParaCuadro(fI);
      const infoF = desglosarFechaParaCuadro(fF);
      const inicioMesDistinto = enProg ? (infoI && infoI.mesIdx >= 0) : (infoI && infoF && (infoI.clave !== infoF.clave));
      const cI = renderizarCuadroFecha(infoI, inicioMesDistinto, infoF ? infoF.anio : '');
      const cF = renderizarCuadroFecha(infoF, inicioMesDistinto, infoI ? infoI.anio : '');
      const fDisplay = r ? (enProg ? `${cI} <span class="m-date-arrow">➔</span> <span class="badge-en-progreso" style="background:rgba(56,189,248,0.12); color:var(--accent); font-weight:700; padding:2px 8px; border-radius:6px; font-size:0.75rem; border:1px solid rgba(56,189,248,0.3); white-space:nowrap;">${txtEnCurso}</span>` : `${cI} <span class="m-date-arrow">➔</span> ${cF}`) : cI;
      return `<tr><td style="width:48px;"><img loading="lazy" decoding="async" src="${optimizarUrlPoster(reg.poster, 'thumb')||''}" style="width:36px;height:52px;border-radius:4px;object-fit:cover;"></td><td><strong>${reg.titulo}</strong><div style="font-size:0.75rem;color:var(--muted);">${reg.creador||''} ${reg.anio ? '('+reg.anio+')' : ''}</div></td><td>${renderEstrellasVisuales(reg.calificacion)}</td><td style="font-size:0.8rem;color:var(--muted);">${reg.comentario || '—'}</td><td>${fDisplay}</td></tr>`;
    }).join('');
  }

  if (mobileList) {
    mobileList.innerHTML = regs.map(reg => {
      const fI = sanitizarFechaFrontend(reg.fechaInicio), fF = sanitizarFechaFrontend(reg.fechaFin);
      const enProg = r && (esEnProgresoTexto(fF) || (!fF || fF === 'Sin fecha' || fF === ''));
      const infoI = desglosarFechaParaCuadro(fI);
      const infoF = desglosarFechaParaCuadro(fF);
      const inicioMesDistinto = enProg ? (infoI && infoI.mesIdx >= 0) : (infoI && infoF && (infoI.clave !== infoF.clave));
      const cI = renderizarCuadroFecha(infoI, inicioMesDistinto, infoF ? infoF.anio : '');
      const cF = renderizarCuadroFecha(infoF, inicioMesDistinto, infoI ? infoI.anio : '');
      const fDisplay = r ? (enProg ? `${cI}<span class="m-date-arrow">➔</span><span class="badge-en-progreso" style="background:rgba(56,189,248,0.12); color:var(--accent); font-weight:700; padding:2px 8px; border-radius:6px; font-size:0.75rem; border:1px solid rgba(56,189,248,0.3); white-space:nowrap;">${txtEnCurso}</span>` : `${cI}<span class="m-date-arrow">➔</span>${cF}`) : cI;
      const rwBadge = reg.esRewatch ? `<span class="badge-rewatch"><svg style="width:13px;height:13px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg> ${t('badge_rewatch')}</span>` : '';
      return `
        <div class="mobile-history-card" style="margin-bottom:10px;">
          <div class="m-card-top">
            <img loading="lazy" decoding="async" class="m-card-thumb" src="${optimizarUrlPoster(reg.poster, 'thumb')||''}" style="cursor:pointer;" onclick="abrirFichaTecnicaDirecta(${JSON.stringify(reg).replace(/"/g, '&quot;')})">
            <div class="m-card-info" style="padding-right:0;">
              <div class="m-card-title">${reg.titulo}</div>
              ${reg.subtitulo ? `<div style="font-size:.75rem; color:var(--muted); margin-bottom:2px;">(${reg.subtitulo})</div>` : ''}
              <div class="m-card-meta">(${reg.creador||''}${reg.anio ? ', ' + reg.anio : ''})</div>
              <div class="m-card-date-row" style="display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-top:3px;">
                <div class="m-card-dates" title="${r ? `${fI} ➔ ${fF}` : fI}">${fDisplay}</div>
                ${rwBadge}
                ${c === 'Juegos' && reg.horas ? `<div class="m-card-horas"><span class="emoji-dyn">${getHeroIcon('clock', '', 12)} </span>${reg.horas}</div>` : ''}
              </div>
            </div>
          </div>
          <div class="m-card-bottom">
            <div>${renderEstrellasVisuales(reg.calificacion)}</div>
            <div class="m-card-comment">${reg.comentario ? `"${reg.comentario}"` : '<span style="color:var(--border)">—</span>'}</div>
          </div>
        </div>
      `;
    }).join('');
  }
}
// === FUNCIONES DEL SISTEMA DE AMIGOS Y PERFILES ===
let amigoSeleccionadoActual = null;
function generarOObtenerIdUsuario(email, nick, prefs) {
  if (prefs && prefs.userId) return prefs.userId;
  const limpioNick = (nick || (email ? email.split('@')[0] : 'USER')).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'USER';
  let hashNum = 0;
  for (let i = 0; i < (email || '').length; i++) hashNum = (hashNum * 31 + email.charCodeAt(i)) % 9000;
  return `${limpioNick}-${1000 + Math.abs(hashNum)}`;
}
function copiarMiIdUsuario() {
  const miId = perfilUsuario?.preferencias?.userId || document.getElementById('perfil-id-txt')?.textContent;
  if (!miId || miId === '...') {
    abrirModalAuthSupabase('login');
    return mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Sign in to view and share your friend ID.' : 'Inicia sesión para ver y compartir tu ID de amigo.');
  }
  navigator.clipboard.writeText(miId).then(() => {
    mostrarToastPersonalizado(userPrefs.lang === 'en' ? ` ID ${miId} copied to clipboard!` : ` ¡ID ${miId} copiado al portapapeles!`);
  }).catch(() => {
    prompt(tLang('Tu ID de Mediary es (cópialo):', 'Your Mediary ID is (copy it):'), miId);
  });
}
function abrirVistaAmigos(pushNav = true) {
  if (pushNav) registrarNavegacionApp('amigos');
  guardarEstadoNavegacionActual('amigos', '');
  resetearBuscadoresYFormularios();
  estado.categoria = 'amigos';
  actualizarBarraNavegacionMovil('m-btn-amigos');
  if (typeof actualizarVisibilidadMenuInferior === 'function') actualizarVisibilidadMenuInferior(true);
  const vIni = document.getElementById('vista-inicio'); if (vIni) vIni.style.display = 'none';
  const vCat = document.getElementById('vista-categoria'); if (vCat) vCat.style.display = 'none';
  const vDisc = document.getElementById('vista-discover'); if (vDisc) vDisc.style.display = 'none';
  const vPerf = document.getElementById('vista-perfil'); if (vPerf) vPerf.style.display = 'none';
  const vList = document.getElementById('vista-listas-extendida'); if (vList) vList.style.display = 'none';
  const vWl = document.getElementById('vista-watchlists'); if (vWl) vWl.style.display = 'none';
  const vCal = document.getElementById('vista-calendario'); if (vCal) vCal.style.display = 'none';
  const vAm = document.getElementById('vista-amigos');
  if (vAm) vAm.style.display = 'block';
  if (typeof animarCambioTabVista === 'function') animarCambioTabVista('amigos');
  estado.amigosFeedFiltro = 'todas';
  cargarAmigosYSolicitudes();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function cargarAmigosYSolicitudes(mostrarToast = false) {
  ruletaAmigoWatchlistCache = {};
  if (!estado.userEmail) {
    document.getElementById('lista-mis-amigos').innerHTML = `<div style="color:var(--muted);padding:20px 0;">${tLang('Inicia sesión con tu cuenta para ver y agregar amigos.', 'Sign in to your account to view and add friends.')}</div>`;
    document.getElementById('seccion-solicitudes-pendientes').style.display = 'none';
    const feedCont = document.getElementById('lista-feed-amigos');
    if (feedCont) feedCont.innerHTML = `<div style="color:var(--muted);padding:20px 0;text-align:center;">${tLang('Inicia sesión con tu cuenta para ver la actividad de tus amigos.', 'Sign in to your account to see your friends\' activity.')}</div>`;
    return;
  }
  google.script.run.withSuccessHandler(res => {
    if (!res || !res.exito) return;
    estado.amigos = res.amigos || [];
    if (estado.userEmail) {
      try {
        localStorage.setItem('mediary_cache_amigos_' + estado.userEmail.toLowerCase(), JSON.stringify(estado.amigos));
      } catch(e) {}
    }
    renderizarListaSolicitudes(res.solicitudes || []);
    renderizarListaAmigos(res.amigos || []);
    const selAm = document.getElementById('select-amigo-historial');
    if (selAm) {
      selAm.innerHTML = `<option value="">${tLang('(Mis registros - Yo)', '(My records - Me)')}</option>` + (res.amigos || []).map(a => `<option value="${a.email}">${a.nickname}</option>`).join('');
    }
    cargarActividadAmigos();
    cargarFeedActividadAmigos();
    if (typeof verificarNuevosAmigosYSolicitudes === 'function') {
      verificarNuevosAmigosYSolicitudes(res.solicitudes || [], res.amigos || []);
    }
    if (mostrarToast) mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Friends list and updates refreshed ' : 'Lista de amigos y novedades actualizada ');
  }).obtenerDatosAmigosUsuario(estado.userEmail);
}

// === RESOLUCIÓN DE DATOS DE AMIGO Y POPUP DE LIKES ===
function obtenerDatosAmigoPorEmail(email) {
  if (!email) return { nickname: (userPrefs.lang === 'en' ? 'Friend' : 'Amigo'), avatar: '🦊', email: '' };
  const emNorm = String(email).trim().toLowerCase();

  // 1. Check estado.amigos
  let lista = estado.amigos || [];
  if (!lista.length && estado.userEmail) {
    try {
      const c = localStorage.getItem('mediary_cache_amigos_' + estado.userEmail.toLowerCase());
      if (c) lista = JSON.parse(c);
    } catch(e) {}
  }
  const am = lista.find(a => (a.email || '').toLowerCase() === emNorm);
  if (am) {
    return {
      nickname: am.nickname || am.email?.split('@')[0] || (userPrefs.lang === 'en' ? 'Friend' : 'Amigo'),
      avatar: am.avatar || '🦊',
      email: am.email
    };
  }
  // 2. Check estado.amigosFeedCache
  const feed = estado.amigosFeedCache || [];
  const fi = feed.find(f => (f.userEmail || '').toLowerCase() === emNorm);
  if (fi) {
    return {
      nickname: fi.amigoNickname || fi.userEmail?.split('@')[0] || (userPrefs.lang === 'en' ? 'Friend' : 'Amigo'),
      avatar: fi.amigoAvatar || '🦊',
      email: fi.userEmail
    };
  }
  // Fallback
  return {
    nickname: email.split('@')[0] || (userPrefs.lang === 'en' ? 'Friend' : 'Amigo'),
    avatar: '🦊',
    email: email
  };
}
window.obtenerDatosAmigoPorEmail = obtenerDatosAmigoPorEmail;

function mostrarCuadroLikeAmigo(regId, event) {
  if (event && event.stopPropagation) event.stopPropagation();
  const reg = (estado.registros || []).find(r => String(r.id) === String(regId));
  const likesAmigos = (perfilUsuario?.preferencias?.likes_recibidos && (perfilUsuario.preferencias.likes_recibidos[String(regId)] || perfilUsuario.preferencias.likes_recibidos[regId])) || [];
  if (!Array.isArray(likesAmigos) || !likesAmigos.length) return;
  const l = userPrefs.lang || 'es';

  const amigos = likesAmigos.map(em => obtenerDatosAmigoPorEmail(em));
  const m = document.getElementById('modal-like-detalle-resena');
  if (!m) return;

  const avBox = document.getElementById('like-popup-avatar-container');
  if (avBox) {
    avBox.innerHTML = `
      <div style="position:relative; display:inline-flex; align-items:center;">
        ${amigos.slice(0, 3).map((am, i) => {
          const offset = i > 0 ? 'margin-left:-14px;' : '';
          const imgOrEmoji = (am.avatar && (am.avatar.startsWith('http') || am.avatar.startsWith('data:')))
            ? `<img src="${am.avatar}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--card);background:var(--bg);">`
            : `<div style="width:48px;height:48px;border-radius:50%;display:grid;place-items:center;font-size:1.5rem;border:2px solid var(--card);background:var(--bg);">${am.avatar || '🦊'}</div>`;
          return `<div style="${offset} z-index:${10 - i}; position:relative;">${imgOrEmoji}</div>`;
        }).join('')}
        <span style="position:absolute; bottom:-3px; right:-6px; width:22px; height:22px; border-radius:50%; background:#f43f5e; color:#fff; display:grid; place-items:center; border:2px solid var(--card); box-shadow:0 2px 6px rgba(244,63,94,0.4); z-index:15;">
          ${getHeroIcon('heart', '', 12)}
        </span>
      </div>
    `;
  }

  const txtBox = document.getElementById('like-popup-texto');
  if (txtBox) {
    const nombres = amigos.map(a => a.nickname);
    let frase = '';
    if (nombres.length === 1) {
      frase = l === 'en' ? `${nombres[0]} liked your review` : `A ${nombres[0]} le ha gustado tu reseña`;
    } else if (nombres.length === 2) {
      frase = l === 'en' ? `${nombres[0]} and ${nombres[1]} liked your review` : `A ${nombres[0]} y ${nombres[1]} les ha gustado tu reseña`;
    } else {
      frase = l === 'en' ? `${nombres[0]} and ${nombres.length - 1} others liked your review` : `A ${nombres[0]} y a ${nombres.length - 1} más les ha gustado tu reseña`;
    }
    txtBox.textContent = frase;
  }

  const itemInfoBox = document.getElementById('like-popup-item-info');
  if (itemInfoBox) {
    if (reg && reg.titulo) {
      itemInfoBox.textContent = `"${reg.titulo}"`;
      itemInfoBox.style.display = 'block';
    } else {
      itemInfoBox.style.display = 'none';
    }
  }

  m.style.display = 'flex';
}
function cerrarModalLikeDetalleResena() {
  const m = document.getElementById('modal-like-detalle-resena');
  if (m) m.style.display = 'none';
}
window.mostrarCuadroLikeAmigo = mostrarCuadroLikeAmigo;
window.cerrarModalLikeDetalleResena = cerrarModalLikeDetalleResena;

// === SISTEMA DE LIKES EN RESEÑAS DE AMIGOS ===
let cacheLikesAmigosCount = {};

function obtenerLikesResenasSet() {
  try {
    const raw = localStorage.getItem('mediary_liked_reviews');
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  if (typeof perfilUsuario !== 'undefined' && perfilUsuario?.preferencias?.likes_dados && Array.isArray(perfilUsuario.preferencias.likes_dados)) {
    return new Set(perfilUsuario.preferencias.likes_dados);
  }
  return new Set();
}

function guardarLikesResenasSet(setObj) {
  const arr = Array.from(setObj);
  try {
    localStorage.setItem('mediary_liked_reviews', JSON.stringify(arr));
  } catch (e) {}
  if (typeof perfilUsuario !== 'undefined' && perfilUsuario) {
    if (!perfilUsuario.preferencias) perfilUsuario.preferencias = {};
    perfilUsuario.preferencias.likes_dados = arr;
    guardarPerfilLocal();
  }
  if (typeof estado !== 'undefined' && estado.userEmail && typeof sbFetch_ === 'function') {
    sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(estado.userEmail), 'PATCH', {
      preferencias: perfilUsuario.preferencias,
      updated_at: new Date().toISOString()
    }).catch(() => {});
  }
}

function esResenaLikeada(regId) {
  if (!regId) return false;
  const s = obtenerLikesResenasSet();
  return s.has(String(regId));
}

function obtenerConteoLikesResena(regId, amigoEmail, likesIniciales = null) {
  if (!regId) return 0;
  const idStr = String(regId);
  if (cacheLikesAmigosCount[idStr] !== undefined) {
    return cacheLikesAmigosCount[idStr];
  }
  let count = 0;
  if (Array.isArray(likesIniciales)) {
    count = likesIniciales.length;
  }
  const miEmail = (typeof estado !== 'undefined' && estado.userEmail ? estado.userEmail : (typeof perfilUsuario !== 'undefined' ? perfilUsuario?.emailGoogle : '') || '').toLowerCase();
  const yoDiLike = esResenaLikeada(idStr);
  if (yoDiLike && Array.isArray(likesIniciales) && miEmail && !likesIniciales.includes(miEmail)) {
    count++;
  } else if (yoDiLike && !Array.isArray(likesIniciales)) {
    count = Math.max(count, 1);
  }
  cacheLikesAmigosCount[idStr] = count;
  return count;
}

async function toggleLikeResenaAmigo(regId, amigoEmail, btnEl) {
  if (!regId) return;
  const idStr = String(regId);
  const setLikes = obtenerLikesResenasSet();
  const estabaLikeado = setLikes.has(idStr);
  const l = (typeof userPrefs !== 'undefined' && userPrefs.lang) ? userPrefs.lang : 'es';
  const miEmail = (typeof estado !== 'undefined' && estado.userEmail ? estado.userEmail : (typeof perfilUsuario !== 'undefined' ? perfilUsuario?.emailGoogle : '') || '').toLowerCase();

  let count = cacheLikesAmigosCount[idStr] !== undefined ? cacheLikesAmigosCount[idStr] : 0;
  if (estabaLikeado) {
    setLikes.delete(idStr);
    count = Math.max(0, count - 1);
  } else {
    setLikes.add(idStr);
    count = count + 1;
  }
  cacheLikesAmigosCount[idStr] = count;
  guardarLikesResenasSet(setLikes);

  const ahoraLikeado = !estabaLikeado;
  document.querySelectorAll(`[data-like-id="${idStr}"]`).forEach(el => {
    el.classList.toggle('liked', ahoraLikeado);
    el.title = ahoraLikeado ? (l === 'en' ? 'Unlike review' : 'Ya no me gusta') : (l === 'en' ? 'Like review' : 'Me gusta la reseña');
    const heart = el.querySelector('.like-heart-icon');
    const counter = el.querySelector('.like-counter');
    const text = el.querySelector('.like-text');
    if (heart) heart.innerHTML = ahoraLikeado ? getHeroIcon('heart', 'active-liked', 16) : getHeroIcon('heart', '', 16);
    if (counter) counter.textContent = count > 0 ? count : '';
    if (text) text.textContent = ahoraLikeado ? (l === 'en' ? 'Liked' : 'Te gusta') : (l === 'en' ? 'Like' : 'Me gusta');
    if (ahoraLikeado) {
      el.classList.remove('like-pop-anim');
      void el.offsetWidth;
      el.classList.add('like-pop-anim');
    }
  });

  if (ahoraLikeado && typeof mostrarToastPersonalizado === 'function') {
    mostrarToastPersonalizado(l === 'en' ? ' Liked friend\'s review' : ' ¡Te gustó la reseña!');
  }

  if (amigoEmail && miEmail && typeof sbFetch_ === 'function') {
    try {
      const pRows = await sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(amigoEmail) + '&select=*', 'GET').catch(() => []);
      if (pRows && pRows.length > 0) {
        const amigoP = pRows[0];
        const amigoPrefs = amigoP.preferencias || {};
        if (!amigoPrefs.likes_recibidos) amigoPrefs.likes_recibidos = {};
        let listaQuien = amigoPrefs.likes_recibidos[idStr] || [];
        if (!Array.isArray(listaQuien)) listaQuien = [];
        if (ahoraLikeado) {
          if (!listaQuien.includes(miEmail)) listaQuien.push(miEmail);
        } else {
          listaQuien = listaQuien.filter(e => e !== miEmail);
        }
        amigoPrefs.likes_recibidos[idStr] = listaQuien;
        sbFetch_('perfiles?user_email=eq.' + encodeURIComponent(amigoEmail), 'PATCH', {
          preferencias: amigoPrefs,
          updated_at: new Date().toISOString()
        }).catch(() => {});
      }
    } catch (e) {}
  }
}
window.toggleLikeResenaAmigo = toggleLikeResenaAmigo;

function cargarFeedActividadAmigos(mostrarToast = false) {
  const contenedor = document.getElementById('lista-feed-amigos');
  const l = userPrefs.lang || 'es';
  if (!estado.userEmail) {
    if (contenedor) contenedor.innerHTML = `<div style="color:var(--muted);padding:20px 0;text-align:center;">${l === 'en' ? 'Log in to see your friends\' recent activity.' : 'Inicia sesión con tu cuenta para ver la actividad de tus amigos.'}</div>`;
    renderizarFeedAmigosResumidoInicio();
    return;
  }
  if ((!estado.amigosFeedCache || !estado.amigosFeedCache.length) && estado.userEmail) {
    try {
      const cached = localStorage.getItem('mediary_cache_friends_feed_' + estado.userEmail.toLowerCase());
      if (cached) {
        estado.amigosFeedCache = JSON.parse(cached);
      }
      const cachedLive = localStorage.getItem('mediary_cache_friends_live_' + estado.userEmail.toLowerCase());
      if (cachedLive) {
        estado.amigosLiveCache = JSON.parse(cachedLive);
      }
      if (cached || cachedLive) {
        actualizarContadoresFeedAmigos();
        renderizarFeedAmigosResumidoInicio();
      }
    } catch(e) {}
  }
  if (contenedor && (!estado.amigosFeedCache || !estado.amigosFeedCache.length)) {
    contenedor.innerHTML = `<div style="color:var(--muted);font-size:0.86rem;padding:24px 0;text-align:center;"><span class="spinning" style="display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px;">${getHeroIcon('clock', '', 20)}</span><div>${l === 'en' ? 'Loading friends updates...' : 'Cargando novedades de tus amigos...'}</div></div>`;
  }
  google.script.run.withSuccessHandler(res => {
    if (!res || !res.exito) {
      if (contenedor) contenedor.innerHTML = `<div style="color:var(--muted);font-size:0.86rem;padding:20px 0;text-align:center;">${l === 'en' ? 'Could not load friends activity.' : 'No se pudo cargar la actividad de amigos.'}</div>`;
      renderizarFeedAmigosResumidoInicio();
      return;
    }
    estado.amigosFeedCache = res.feed || [];
    if (res.live) {
      estado.amigosLiveCache = res.live;
    }
    try {
      if (estado.userEmail) {
        localStorage.setItem('mediary_cache_friends_feed_' + estado.userEmail.toLowerCase(), JSON.stringify(estado.amigosFeedCache));
        if (res.live) {
          localStorage.setItem('mediary_cache_friends_live_' + estado.userEmail.toLowerCase(), JSON.stringify(res.live));
        }
      }
    } catch(e) {}
    actualizarContadoresFeedAmigos();
    renderizarFeedAmigos();
    renderizarFeedAmigosResumidoInicio();
    if (typeof iniciarPollingFriendsLive === 'function') {
      iniciarPollingFriendsLive();
    }
    if (typeof verificarNuevasActividadesAmigos === 'function') {
      verificarNuevasActividadesAmigos(estado.amigosFeedCache);
    }
    if (mostrarToast) mostrarToastPersonalizado(l === 'en' ? 'Friends feed updated ' : 'Actividad de amigos actualizada ');
  }).obtenerFeedAmigos(estado.userEmail);
}
function actualizarContadoresFeedAmigos() {
  const feed = (estado.amigosFeedCache || []).filter(it => !esItemCancionMusica(it) && !String(it.id || '').startsWith('sp_rec_') && it.subcategoria !== 'Canciones' && (typeof esActividadAmigoReciente === 'function' ? esActividadAmigoReciente(it) : true));
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt('badge-feed-count', feed.length);
  setTxt('count-feed-todas', feed.length);
  setTxt('count-feed-pelis', feed.filter(x => x.categoria === 'Peliculas').length);
  setTxt('count-feed-series', feed.filter(x => x.categoria === 'Series').length);
  setTxt('count-feed-musica', feed.filter(x => x.categoria === 'Musica').length);
  setTxt('count-feed-juegos', feed.filter(x => x.categoria === 'Juegos').length);
  setTxt('count-feed-lecturas', feed.filter(x => x.categoria === 'Lecturas').length);
}
function filtrarFeedAmigos(cat) {
  estado.amigosFeedFiltro = cat || 'todas';
  const btns = document.querySelectorAll('#feed-amigos-filtros .subtab-btn');
  btns.forEach(b => {
    if (b.getAttribute('data-fcat') === estado.amigosFeedFiltro) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
  renderizarFeedAmigos();
}
function escHtmlFeed_(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function limpiarTextoHoras(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (!str || str === '0' || str === '0 hrs' || str === '0h' || str === 'Sin horas') return '';
  const clean = str.replace(/hrs?/gi, '').replace(/horas?/gi, '').trim();
  const match = clean.match(/\d+(?:[.,]\d+)?/);
  if (!match) return '';
  if (parseFloat(match[0].replace(',', '.')) <= 0) return '';
  return `${match[0]} hrs`;
}
window.limpiarTextoHoras = limpiarTextoHoras;

function formatearTiempoRelativoFeed(val, lang = 'es') {
  if (!val || val === 'Sin fecha') return '';
  const l = lang || 'es';
  let dateObj = null;
  if (typeof val === 'string' && val.includes('T')) {
    dateObj = new Date(val);
  } else if (typeof val === 'string' && val.includes('/')) {
    const parts = val.split('/');
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  } else {
    dateObj = new Date(val);
  }
  if (!dateObj || isNaN(dateObj.getTime())) return String(val);

  const diffMs = Date.now() - dateObj.getTime();
  if (diffMs < 0) return dateObj.toLocaleDateString(l === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric' });
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 2) return l === 'en' ? 'Just now' : 'Hace un momento';
  if (diffMin < 60) return l === 'en' ? `${diffMin}m ago` : `Hace ${diffMin} min`;
  if (diffHrs < 24) return l === 'en' ? `${diffHrs}h ago` : `Hace ${diffHrs} h`;
  if (diffDays === 1) return l === 'en' ? 'Yesterday' : 'Ayer';
  if (diffDays < 7) return l === 'en' ? `${diffDays}d ago` : `Hace ${diffDays} días`;
  return dateObj.toLocaleDateString(l === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric', year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}
function generarFraseActividadAmigo(item, lang = 'es') {
  const l = lang || 'es';
  const nick = escHtmlFeed_(item.amigoNickname || (item.userEmail ? item.userEmail.split('@')[0] : (l === 'en' ? 'A friend' : 'Un amigo')));
  const enProg = esEnProgresoTexto(item.fechaFin);
  const cat = item.categoria || '';
  const sub = (item.subcategoria || '').toLowerCase();
  const rw = !!item.esRewatch;

  if (l === 'en') {
    if (cat === 'Musica') {
      if (sub.includes('canc') || sub.includes('single') || sub.includes('song')) {
        return enProg ? `<strong>${nick}</strong> is listening to a new song!` : `<strong>${nick}</strong> listened to a new song!`;
      }
      if (sub.includes('concierto') || sub.includes('festival') || sub.includes('concert')) {
        return `<strong>${nick}</strong> attended a concert!`;
      }
      if (sub.includes('ep')) {
        return `<strong>${nick}</strong> listened to a new EP!`;
      }
      if (sub.includes('artista') || sub.includes('artist')) {
        return `<strong>${nick}</strong> started listening to a new artist!`;
      }
      return enProg ? `<strong>${nick}</strong> is listening to a new album!` : `<strong>${nick}</strong> listened to a new album!`;
    }
    if (cat === 'Lecturas') {
      if (sub.includes('comic') || sub.includes('manga') || sub.includes('novela gr') || sub.includes('graphic')) {
        return enProg ? `<strong>${nick}</strong> started reading a new comic/manga!` : (rw ? `<strong>${nick}</strong> re-read a comic/manga!` : `<strong>${nick}</strong> read a new comic/manga!`);
      }
      if (sub.includes('audio')) {
        return enProg ? `<strong>${nick}</strong> started listening to an audiobook!` : `<strong>${nick}</strong> finished an audiobook!`;
      }
      return enProg ? `<strong>${nick}</strong> started reading a new book!` : (rw ? `<strong>${nick}</strong> re-read a book!` : `<strong>${nick}</strong> finished reading a new book!`);
    }
    if (cat === 'Peliculas') {
      if (sub.includes('docu')) {
        return enProg ? `<strong>${nick}</strong> is watching a documentary!` : (rw ? `<strong>${nick}</strong> rewatched a documentary!` : `<strong>${nick}</strong> watched a documentary!`);
      }
      if (sub.includes('corto') || sub.includes('short')) {
        return rw ? `<strong>${nick}</strong> rewatched a short film!` : `<strong>${nick}</strong> watched a short film!`;
      }
      return enProg ? `<strong>${nick}</strong> started watching a movie!` : (rw ? `<strong>${nick}</strong> rewatched a movie!` : `<strong>${nick}</strong> watched a new movie!`);
    }
    if (cat === 'Series') {
      if (sub.includes('anime')) {
        return enProg ? `<strong>${nick}</strong> started watching an anime!` : (rw ? `<strong>${nick}</strong> rewatched an anime!` : `<strong>${nick}</strong> finished an anime!`);
      }
      if (sub.includes('docu')) {
        return enProg ? `<strong>${nick}</strong> started watching a docuseries!` : `<strong>${nick}</strong> completed a docuseries!`;
      }
      return enProg ? `<strong>${nick}</strong> started watching a series!` : (rw ? `<strong>${nick}</strong> rewatched a series!` : `<strong>${nick}</strong> completed a series!`);
    }
    if (cat === 'Juegos') {
      if (sub.includes('mesa') || sub.includes('board')) {
        return enProg ? `<strong>${nick}</strong> is playing a board game!` : `<strong>${nick}</strong> played a board game!`;
      }
      if (sub.includes('dlc') || sub.includes('expansi')) {
        return enProg ? `<strong>${nick}</strong> is playing a new DLC/expansion!` : `<strong>${nick}</strong> completed an expansion!`;
      }
      return enProg ? `<strong>${nick}</strong> started playing a new game!` : `<strong>${nick}</strong> completed a new video game!`;
    }
    return `<strong>${nick}</strong> added a new item!`;
  }

  // Español
  if (cat === 'Musica') {
    if (sub.includes('canc') || sub.includes('single')) {
      return enProg ? `¡<strong>${nick}</strong> está escuchando una nueva canción!` : `¡<strong>${nick}</strong> escuchó una nueva canción!`;
    }
    if (sub.includes('concierto') || sub.includes('festival')) {
      return `¡<strong>${nick}</strong> asistió a un concierto/festival!`;
    }
    if (sub.includes('ep')) {
      return `¡<strong>${nick}</strong> escuchó un nuevo EP!`;
    }
    if (sub.includes('artista')) {
      return `¡<strong>${nick}</strong> ha comenzado a escuchar a un nuevo artista!`;
    }
    return enProg ? `¡<strong>${nick}</strong> está escuchando un nuevo álbum!` : `¡<strong>${nick}</strong> escuchó un nuevo disco!`;
  }
  if (cat === 'Lecturas') {
    if (sub.includes('comic') || sub.includes('manga') || sub.includes('novela gr')) {
      return enProg ? `¡<strong>${nick}</strong> ha comenzado a leer un nuevo cómic/manga!` : (rw ? `¡<strong>${nick}</strong> volvió a leer un cómic/manga!` : `¡<strong>${nick}</strong> leyó un nuevo cómic/manga!`);
    }
    if (sub.includes('audio')) {
      return enProg ? `¡<strong>${nick}</strong> ha comenzado a escuchar un audiolibro!` : `¡<strong>${nick}</strong> terminó de escuchar un audiolibro!`;
    }
    return enProg ? `¡<strong>${nick}</strong> ha comenzado a leer un libro nuevo!` : (rw ? `¡<strong>${nick}</strong> volvió a leer un libro!` : `¡<strong>${nick}</strong> terminó de leer un libro nuevo!`);
  }
  if (cat === 'Peliculas') {
    if (sub.includes('docu')) {
      return enProg ? `¡<strong>${nick}</strong> está viendo un documental!` : (rw ? `¡<strong>${nick}</strong> volvió a ver un documental!` : `¡<strong>${nick}</strong> vio un nuevo documental!`);
    }
    if (sub.includes('corto')) {
      return rw ? `¡<strong>${nick}</strong> volvió a ver un cortometraje!` : `¡<strong>${nick}</strong> vio un nuevo cortometraje!`;
    }
    return enProg ? `¡<strong>${nick}</strong> comenzó a ver una película!` : (rw ? `¡<strong>${nick}</strong> volvió a ver una película!` : `¡<strong>${nick}</strong> vio una nueva película!`);
  }
  if (cat === 'Series') {
    if (sub.includes('anime')) {
      return enProg ? `¡<strong>${nick}</strong> ha comenzado a ver un nuevo anime!` : (rw ? `¡<strong>${nick}</strong> volvió a ver un anime!` : `¡<strong>${nick}</strong> completó un anime!`);
    }
    if (sub.includes('docu')) {
      return enProg ? `¡<strong>${nick}</strong> ha comenzado a ver una docuserie!` : `¡<strong>${nick}</strong> terminó una docuserie!`;
    }
    return enProg ? `¡<strong>${nick}</strong> ha comenzado a ver una serie!` : (rw ? `¡<strong>${nick}</strong> volvió a ver una serie!` : `¡<strong>${nick}</strong> completó una serie!`);
  }
  if (cat === 'Juegos') {
    if (sub.includes('mesa')) {
      return enProg ? `¡<strong>${nick}</strong> está jugando un juego de mesa!` : `¡<strong>${nick}</strong> jugó un juego de mesa!`;
    }
    if (sub.includes('dlc') || sub.includes('expansi')) {
      return enProg ? `¡<strong>${nick}</strong> está jugando una nueva expansión!` : `¡<strong>${nick}</strong> completó una expansión!`;
    }
    return enProg ? `¡<strong>${nick}</strong> ha comenzado a jugar un nuevo juego!` : `¡<strong>${nick}</strong> completó un videojuego!`;
  }
  return `¡<strong>${nick}</strong> agregó un nuevo registro!`;
}
function usuarioYaTieneObra(it) {
  if (!it) return false;
  const titBuscado = (typeof normalizarTituloObra === 'function')
    ? normalizarTituloObra(it.titulo || it.tituloOriginal)
    : String(it.titulo || it.tituloOriginal || '').trim().toLowerCase();
  if (!titBuscado) return false;
  const catBuscada = String(it.categoria || '').trim().toLowerCase();

  const enRegistros = Array.isArray(estado.registros) && estado.registros.some(r => {
    const t = (typeof normalizarTituloObra === 'function')
      ? normalizarTituloObra(r.titulo || r.tituloOriginal)
      : String(r.titulo || r.tituloOriginal || '').trim().toLowerCase();
    const c = String(r.categoria || '').trim().toLowerCase();
    return t === titBuscado && (!catBuscada || !c || catBuscada === c);
  });
  if (enRegistros) return true;

  const enWl = Array.isArray(estado.watchlist) && estado.watchlist.some(w => {
    const t = (typeof normalizarTituloObra === 'function')
      ? normalizarTituloObra(w.titulo || w.tituloOriginal)
      : String(w.titulo || w.tituloOriginal || '').trim().toLowerCase();
    const c = String(w.categoria || '').trim().toLowerCase();
    return t === titBuscado && (!catBuscada || !c || catBuscada === c);
  });
  return Boolean(enWl);
}

function renderizarFeedAmigos() {
  const contenedor = document.getElementById('lista-feed-amigos');
  if (!contenedor) return;
  const l = userPrefs.lang || 'es';
  const filtro = estado.amigosFeedFiltro || 'todas';
  const todos = (estado.amigosFeedCache || []).filter(it => !esItemCancionMusica(it) && !String(it.id || '').startsWith('sp_rec_') && it.subcategoria !== 'Canciones' && (typeof esActividadAmigoReciente === 'function' ? esActividadAmigoReciente(it) : true));
  const items = todos.filter(it => filtro === 'todas' || it.categoria === filtro);

  if (!todos.length) {
    contenedor.innerHTML = `
      <div style="background:var(--card);border:1px dashed var(--border);border-radius:4px;padding:32px 20px;text-align:center;color:var(--muted);">
        <div style="margin-bottom:8px;">${getHeroIcon('users', '', 36)}</div>
        <div style="font-size:0.95rem;font-weight:700;color:var(--text);margin-bottom:4px;">${l === 'en' ? 'No friends activity yet' : 'Aún no hay actividad de amigos'}</div>
        <div style="font-size:0.82rem;max-width:420px;margin:0 auto 14px;">${l === 'en' ? 'When you and your friends add movies, books, music or games, their latest reviews and ratings will show up here!' : 'Cuando tus amigos agreguen películas, discos, libros o juegos, verás aquí qué opinan, qué calificaron y qué están disfrutando.'}</div>
        <button type="button" class="btn-today-pill" style="height:34px;padding:0 14px;font-size:0.8rem;margin:0 auto;" onclick="copiarMiIdUsuario()"><span style="display:inline-flex;align-items:center;gap:6px;">${getHeroIcon('clipboard-document', '', 14)} <span>${l === 'en' ? 'Copy My ID to Share' : 'Copiar mi ID para compartir'}</span></span></button>
      </div>
    `;
    return;
  }

  if (!items.length) {
    contenedor.innerHTML = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:3px;padding:26px 20px;text-align:center;color:var(--muted);font-size:0.88rem;">
        ${l === 'en' ? `No recent activity in <strong>${I18N[l]?.cats?.[filtro] || filtro}</strong>.` : `No hay actividad reciente en <strong>${I18N[l]?.cats?.[filtro] || filtro}</strong>.`}
      </div>
    `;
    return;
  }

  const catIcons = { Peliculas: getHeroIcon('film'), Series: getHeroIcon('tv'), Musica: getHeroIcon('musical-note'), Juegos: getHeroIcon('gamepad'), Lecturas: getHeroIcon('book-open') };

  contenedor.innerHTML = items.map((it, idx) => {
    const frase = generarFraseActividadAmigo(it, l);
    const timeStr = formatearTiempoRelativoFeed(it.createdAt || it.fechaFin || it.fechaInicio, l);
    const enProg = esEnProgresoTexto(it.fechaFin);
    const avatarHtml = it.amigoAvatar && (it.amigoAvatar.startsWith('http') || it.amigoAvatar.startsWith('data:'))
      ? `<img loading="lazy" decoding="async" src="${it.amigoAvatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;">`
      : `<span>${it.amigoAvatar || '🦊'}</span>`;
    const catNom = I18N[l]?.cats?.[it.categoria] || it.categoria || '';
    const subNom = I18N[l]?.subs?.[it.subcategoria] || it.subcategoria || '';
    const catIcon = catIcons[it.categoria] || getHeroIcon('sparkles', '', 16);

    const posterHtml = it.poster
      ? `<img src="${escHtmlFeed_(it.poster)}" loading="lazy" alt="${escHtmlFeed_(it.titulo)}" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='grid';"><div class="feed-poster-placeholder" style="width:100%;height:100%;display:none;place-items:center;font-size:1.6rem;background:var(--bg);">${catIcon}</div>`
      : `<div class="feed-poster-placeholder" style="width:100%;height:100%;display:grid;place-items:center;font-size:1.6rem;background:var(--bg);">${catIcon}</div>`;

    const califNum = Number(it.calificacion) || 0;
    let secondBadge = '';
    if (enProg) {
      secondBadge = `<span class="feed-status-inprog"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;opacity:0.9;"></span><span>${obtenerTextoEnProgreso(it.categoria, it.subcategoria)}</span></span>`;
    } else if (califNum > 0) {
      secondBadge = `
        <div style="display:inline-flex;align-items:center;background:var(--bg);border:1px solid var(--border);padding:2px 7px;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,0.06);font-size:0.75rem;">
          ${renderEstrellasVisuales(califNum)}
        </div>
      `;
    }

    const horasLimpia = (typeof limpiarTextoHoras === 'function') ? limpiarTextoHoras(it.horas) : '';
    const metaPartes = [];
    if (it.creador && String(it.creador).trim()) metaPartes.push(escHtmlFeed_(it.creador));
    if (it.anio && String(it.anio).trim()) metaPartes.push(`(${escHtmlFeed_(it.anio)})`);
    if (horasLimpia) metaPartes.push(`${getHeroIcon('clock', '', 11)} ${horasLimpia}`);
    const metaTxt = metaPartes.join(' · ');

    const isLiked = esResenaLikeada(it.id);
    const likeCount = obtenerConteoLikesResena(it.id, it.userEmail, it.likes);
    const likeBtnHtml = `
      <button type="button" class="btn-like-resena ${isLiked ? 'liked' : ''}" data-like-id="${it.id}" onclick="event.stopPropagation(); toggleLikeResenaAmigo('${it.id}', '${escHtmlFeed_(it.userEmail)}', this)" style="background:transparent;border:none;padding:0 4px;font-size:1.15rem;cursor:pointer;display:inline-flex;align-items:center;gap:4px;line-height:1;" title="${isLiked ? (l === 'en' ? 'Unlike review' : 'Ya no me gusta') : (l === 'en' ? 'Like review' : 'Me gusta la reseña')}">
        <span class="like-heart-icon">${isLiked ? getHeroIcon('heart', 'active-liked', 16) : getHeroIcon('heart', '', 16)}</span>
        <span class="like-counter" style="font-size:0.75rem;font-weight:700;color:var(--muted);">${likeCount > 0 ? likeCount : ''}</span>
      </button>
    `;

    const actPayload = encodeURIComponent(JSON.stringify({
      amigo: it.amigoNickname || it.amigoNick || (it.userEmail ? it.userEmail.split('@')[0] : 'Amigo'),
      amigoAvatar: it.amigoAvatar || '🦊',
      amigoEmail: it.userEmail || '',
      tipo: it.tipo || ((it.fechaFin && !esEnProgresoTexto(it.fechaFin)) || it.calificacion ? 'visto' : 'pendiente'),
      cat: it.categoria || 'Peliculas',
      sub: it.subcategoria || '',
      titulo: it.titulo || '',
      subtitulo: it.subtitulo || '',
      creador: it.creador || '',
      anio: it.anio || '',
      poster: it.poster || '',
      calificacion: it.calificacion || '',
      comentario: it.comentario || '',
      fechaInicio: it.fechaInicio || '',
      fechaFin: it.fechaFin || '',
      horas: it.horas || ''
    }));

    const reviewHtml = (it.comentario && it.comentario.trim() !== '')
      ? `
        <div class="feed-review-box" data-act="${actPayload}" onclick="event.stopPropagation(); abrirModalDetalleActividadAmigo(this)" style="cursor:pointer;" title="${l === 'en' ? 'View record details' : 'Ver detalle del registro'}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:6px;">
            <div class="feed-review-title" style="font-size:0.75rem;font-weight:800;color:var(--accent);display:flex;align-items:center;gap:5px;"><span>${getHeroIcon('chat-bubble-bottom-center-text', '', 13)}</span> <span>${l === 'en' ? 'Comment' : 'Comentario'}</span></div>
            ${likeBtnHtml}
          </div>
          <div class="feed-review-text">"${escHtmlFeed_(it.comentario)}"</div>
        </div>
      `
      : '';

    const yaTengoEsteProducto = usuarioYaTieneObra(it);
    const btnWatchlistTopRight = !yaTengoEsteProducto ? `
      <button type="button" class="btn-today-pill" style="width:30px;min-width:30px;height:30px;padding:0;margin:0;flex-shrink:0;border-radius:2px;display:inline-flex;align-items:center;justify-content:center;background:var(--bg);border:1px solid var(--border);color:var(--accent);font-size:0.92rem;cursor:pointer;box-sizing:border-box;box-shadow:0 1px 3px rgba(0,0,0,0.06);transition:var(--tr);" onclick="agregarFeedItemAWatchlist(${idx}, this)" title="${l === 'en' ? 'Add to Watchlist' : 'Agregar a Watchlist'}">
        <span>${getHeroIcon("bookmark", "", 14)}</span>
      </button>
    ` : '';

    const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(it.categoria, it.subcategoria) : null;
    const catBadgeClass = metaCol ? `cat-badge-${metaCol.key}` : '';
    const catBadgeText = `${catIcon} ${subNom || catNom}${it.esRewatch ? ' · Rewatch' : ''}`;

    return `
      <div class="amigo-feed-card">
        <div class="feed-card-header">
          <div class="feed-card-user-info">
            <div class="feed-user-avatar friend-avatar-wrap" data-avatar-zoom="${it.amigoAvatar || '🦊'}" data-avatar-name="${escHtmlFeed_(it.amigoNickname)}" onclick="verPerfilDeAmigo('${it.userEmail}')" title="${l === 'en' ? 'View Profile' : 'Ver Perfil'}">
              ${avatarHtml}
            </div>
            <div style="min-width:0;flex:1;">
              <div class="feed-card-phrase">${frase}</div>
              <div class="feed-card-time">
                <span>${getHeroIcon('clock', '', 11)} ${timeStr}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="feed-card-body">
          <div class="feed-card-poster-wrap">
            ${posterHtml}
          </div>
          <div class="feed-card-info">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span class="feed-cat-badge ${catBadgeClass}">${catBadgeText}</span>
                ${secondBadge}
              </div>
              ${btnWatchlistTopRight}
            </div>
            <div class="feed-card-title">${escHtmlFeed_(it.titulo)}</div>
            ${it.subtitulo && it.subtitulo !== it.titulo ? `<div style="font-size:0.78rem;color:var(--muted);font-style:italic;margin-top:-2px;margin-bottom:3px;">${escHtmlFeed_(it.subtitulo)}</div>` : ''}
            ${metaTxt ? `<div class="feed-card-meta" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;font-size:0.79rem;color:var(--muted);margin-bottom:6px;">${metaTxt}</div>` : ''}
            ${reviewHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');
}
function agregarFeedItemAWatchlist(idx, btnEl) {
  const todos = (estado.amigosFeedCache || []).filter(it => !esItemCancionMusica(it) && !String(it.id || '').startsWith('sp_rec_') && it.subcategoria !== 'Canciones' && (typeof esActividadAmigoReciente === 'function' ? esActividadAmigoReciente(it) : true));
  const filtro = estado.amigosFeedFiltro || 'todas';
  const items = todos.filter(it => filtro === 'todas' || it.categoria === filtro);
  const it = items[idx];
  if (!it) return;
  const itemConCat = {
    titulo: it.titulo,
    tituloOriginal: it.titulo,
    tituloIngles: it.subtitulo || '',
    creador: it.creador || '',
    anio: it.anio || '',
    categoria: it.categoria,
    subcategoria: it.subcategoria || (it.categoria === 'Peliculas' ? 'Película' : (it.categoria === 'Series' ? 'Serie' : (it.categoria === 'Musica' ? 'Álbum' : (it.categoria === 'Juegos' ? 'Videojuego' : 'Libro')))),
    poster: it.poster || ''
  };
  if (btnEl) {
    btnEl.classList.add('added');
    btnEl.innerHTML = `<span>${getHeroIcon('check', '', 14)}</span>`;
    btnEl.style.color = '#10b981';
    btnEl.style.borderColor = 'rgba(16,185,129,0.4)';
    btnEl.disabled = true;
  }
  agregarAWatchlistDirecto(itemConCat, btnEl);
}
window.cargarFeedActividadAmigos = cargarFeedActividadAmigos;
window.filtrarFeedAmigos = filtrarFeedAmigos;
window.renderizarFeedAmigos = renderizarFeedAmigos;
window.agregarFeedItemAWatchlist = agregarFeedItemAWatchlist;

function esActividadAmigoReciente(it, maxDias = 10) {
  if (!it) return false;
  const maxMs = maxDias * 24 * 60 * 60 * 1000;
  const ahora = Date.now();

  // 1. Verificar fecha de término/completado (fechaFin)
  const fFin = it.fechaFin || it.fecha_fin;
  if (fFin && fFin !== 'Sin fecha') {
    if (typeof esEnProgresoTexto === 'function' && esEnProgresoTexto(fFin)) {
      const fIni = it.fechaInicio || it.fecha_inicio;
      if (fIni && fIni !== 'Sin fecha') {
        const tIni = (typeof timestampDeFecha === 'function') ? timestampDeFecha(fIni) : 0;
        if (tIni > 0 && (ahora - tIni > maxMs * 3)) return false;
      }
      if (it.createdAt) {
        const tCre = new Date(it.createdAt).getTime();
        if (!isNaN(tCre) && (ahora - tCre > maxMs * 3)) return false;
      }
      return true;
    }
    const tFin = (typeof timestampDeFecha === 'function') ? timestampDeFecha(fFin) : 0;
    if (tFin > 0) {
      const diff = ahora - tFin;
      // Si la fecha consumida fue hace más de maxDias (ej: 1 mes atrás o 2022), NO es reciente
      if (diff < -86400000 || diff > maxMs) return false;
    } else {
      const mYear = String(fFin).match(/\b(19\d{2}|20\d{2})\b/);
      if (mYear && Number(mYear[1]) < new Date().getFullYear()) return false;
    }
  }

  // 2. Verificar fecha de inicio si no hubo fecha de término
  const fIni = it.fechaInicio || it.fecha_inicio;
  if ((!fFin || fFin === 'Sin fecha') && fIni && fIni !== 'Sin fecha') {
    const tIni = (typeof timestampDeFecha === 'function') ? timestampDeFecha(fIni) : 0;
    if (tIni > 0) {
      const diff = ahora - tIni;
      if (diff < -86400000 || diff > maxMs) return false;
    } else {
      const mYear = String(fIni).match(/\b(19\d{2}|20\d{2})\b/);
      if (mYear && Number(mYear[1]) < new Date().getFullYear()) return false;
    }
  }

  // 3. Verificar propiedad fecha genérica si existe
  if (it.fecha && it.fecha !== 'Sin fecha' && !(typeof esEnProgresoTexto === 'function' && esEnProgresoTexto(it.fecha))) {
    const tF = (typeof timestampDeFecha === 'function') ? timestampDeFecha(it.fecha) : 0;
    if (tF > 0) {
      const diff = ahora - tF;
      if (diff < -86400000 || diff > maxMs) return false;
    }
  }

  // 4. Verificar fecha de registro en la base de datos (createdAt)
  if (it.createdAt) {
    const tCre = new Date(it.createdAt).getTime();
    if (!isNaN(tCre)) {
      const diffCre = ahora - tCre;
      if (diffCre > maxMs * 1.5) return false;
    }
  }

  // 5. Si no tiene ninguna fecha de consumo indicada
  if ((!fFin || fFin === 'Sin fecha') && (!fIni || fIni === 'Sin fecha')) {
    if (it.createdAt) {
      const tCre = new Date(it.createdAt).getTime();
      if (!isNaN(tCre)) {
        const diffCre = ahora - tCre;
        if (diffCre >= 0 && diffCre <= maxMs) return true;
      }
    }
    return false;
  }

  return true;
}
const esFechaDeUltimaSemana = esActividadAmigoReciente;
window.esActividadAmigoReciente = esActividadAmigoReciente;
window.esFechaDeUltimaSemana = esActividadAmigoReciente;

// Las tarjetas de actividad de amigos en tiempo real NO deben vincularse a registros ni discos agregados del catálogo.
// Se vinculan EXCLUSIVAMENTE a actividad en vivo (Spotify, Steam, PSN) y al historial de canciones de Spotify.
function obtenerUltimaCancionAmigos() {
  return null;
}

function obtenerUltimoJuegoAmigos() {
  return null;
}

function dibujarTarjetaUltimaCancionAmigos(it) {
  if (!it) return '';
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const timeStr = it.updatedAt ? formatearTiempoRelativoFeed(it.updatedAt, l) : (it.createdAt || it.fechaFin || it.fechaInicio ? formatearTiempoRelativoFeed(it.createdAt || it.fechaFin || it.fechaInicio, l) : '');
  const artist = it.artist || it.creador || (l === 'en' ? 'Artist' : 'Artista');
  const album = it.album || it.subtitulo || (l === 'en' ? 'Spotify History' : 'Historial de Spotify');
  const title = it.title || it.track || it.titulo || (l === 'en' ? 'Untitled' : 'Sin título');
  const nick = it.amigoNickname || (it.userEmail ? it.userEmail.split('@')[0] : (l === 'en' ? 'Friend' : 'Amigo'));
  const coverUrl = it.image || it.poster || '';
  const isExp = (typeof estaLiveCardExpandida === 'function') ? estaLiveCardExpandida('friends_spotify') : false;

  const coverHtml = coverUrl
    ? `<img src="${escHtmlFeed_(coverUrl)}" alt="${escHtmlFeed_(title)}" loading="lazy" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='grid';"><div class="cover-music-placeholder" style="width:100%;height:100%;display:none;place-items:center;font-size:1.5rem;background:var(--bg);color:#10b981;">${getHeroIcon('musical-note', '', 24)}</div>`
    : `<div class="cover-music-placeholder" style="width:100%;height:100%;display:grid;place-items:center;font-size:1.5rem;background:var(--bg);color:#10b981;">${getHeroIcon('musical-note', '', 24)}</div>`;

  const avatarHtml = (it.amigoAvatar && (it.amigoAvatar.startsWith('http') || it.amigoAvatar.startsWith('data:')))
    ? `<img loading="lazy" decoding="async" src="${escHtmlFeed_(it.amigoAvatar)}" style="width:100%;height:100%;object-fit:cover;">`
    : `<span>${escHtmlFeed_(it.amigoAvatar || '🦊')}</span>`;

  const safeTitle = encodeURIComponent(title);
  const safeArtist = encodeURIComponent(artist);
  const spotifySearchUrl = it.url || `https://open.spotify.com/search/${encodeURIComponent((title + ' ' + artist).trim())}`;
  const modalAccion = it.userEmail ? `abrirModalRegistrosAmigo('${escHtmlFeed_(it.userEmail)}', '${escHtmlFeed_(nick)}', 'Musica')` : '';
  const perfilAccion = it.userEmail ? `verPerfilDeAmigo('${escHtmlFeed_(it.userEmail)}')` : '';

  return `
    <div class="home-spotify-card-compact home-friend-music-card home-live-expandable-card ${isExp ? 'is-expanded' : 'is-collapsed'}" onclick="toggleLiveCardExpansion('friends_spotify', event)" title="${isExp ? (l === 'en' ? 'Tap to collapse' : 'Toca para reducir') : (l === 'en' ? 'Tap to expand' : 'Toca para expandir')}">
      <!-- Portada con mini-avatar superpuesto del amigo -->
      <div class="home-np-cover-compact" style="position:relative; cursor:pointer;" onclick="event.stopPropagation(); ${modalAccion}" title="${l === 'en' ? 'View friend details' : 'Ver actividad del amigo'}">
        ${coverHtml}
        <div class="home-np-friend-avatar-badge" title="${escHtmlFeed_(nick)}">
          ${avatarHtml}
        </div>
      </div>

      <!-- Centro: Vistas reducida y expandida -->
      <div class="home-np-center-compact">
        <!-- VISTA REDUCIDA (ESTILO NOTIFICACIÓN ANDROID) -->
        <div class="live-card-collapsed-only" style="width:100%; overflow:hidden;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div class="home-np-title-compact home-np-text-wrap" title="${escHtmlFeed_(title)}">
              <span class="home-np-scrollable">${escHtmlFeed_(title)}</span>
            </div>
            <div style="font-size:0.73rem; color:#10b981; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; justify-content:center; gap:5px; margin-top:1px;">
              <span>${escHtmlFeed_(nick)}</span>
              <span style="opacity:0.5;">·</span>
              <span style="color:var(--accent); display:inline-flex; align-items:center; gap:3px; font-size:0.68rem; font-weight:700;">
                <span class="home-np-dot" style="background:var(--accent); box-shadow:none; animation:none;"></span>
                <span>${l === 'en' ? 'Listened' : 'Escuchó'}</span>
              </span>
              ${timeStr ? `<span style="opacity:0.5;">·</span><span style="color:var(--muted); font-size:0.68rem;">${timeStr}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- VISTA EXPANDIDA -->
        <div class="live-card-expanded-only" style="width:100%; display:flex; flex-direction:column; gap:1.5px;">
          <!-- Fila de identificación del amigo -->
          <div style="display:flex; align-items:center; gap:5px; font-size:0.72rem; line-height:1.2; margin-bottom:1px; overflow:hidden;">
            <span style="width:15px; height:15px; border-radius:50%; overflow:hidden; display:inline-grid; place-items:center; flex-shrink:0; border:1px solid var(--border); font-size:0.65rem; cursor:pointer;" onclick="event.stopPropagation(); ${perfilAccion}">
              ${avatarHtml}
            </span>
            <strong style="color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px; cursor:pointer;" onclick="event.stopPropagation(); ${perfilAccion}" title="${escHtmlFeed_(nick)}">
              ${escHtmlFeed_(nick)}
            </strong>
            <span style="color:var(--muted); font-size:0.68rem; white-space:nowrap;">
              ${l === 'en' ? 'listened to (Spotify history)' : 'escuchó (historial de Spotify)'}
            </span>
            ${timeStr ? `<span style="color:var(--muted); font-size:0.66rem; margin-left:auto; flex-shrink:0; white-space:nowrap; display:inline-flex; align-items:center; gap:3px;">${getHeroIcon('clock', '', 11)} ${timeStr}</span>` : ''}
          </div>

          <!-- Artista -->
          <div class="home-np-artist-compact home-np-text-wrap" title="${escHtmlFeed_(artist)}">
            <span class="home-np-scrollable">${escHtmlFeed_(artist)}</span>
          </div>

          <!-- Disco / Álbum -->
          <div class="home-np-album-compact home-np-text-wrap" title="${escHtmlFeed_(album)}">
            <span class="home-np-scrollable">${escHtmlFeed_(album)}</span>
          </div>

          <!-- Título de la canción -->
          <div class="home-np-title-compact home-np-text-wrap" style="cursor:pointer;" onclick="${modalAccion}" title="${escHtmlFeed_(title)}">
            <span class="home-np-scrollable">${escHtmlFeed_(title)}</span>
          </div>

          <!-- Fila inferior: Estado de escucha -->
          <div class="home-np-ctrls-compact" style="margin-top:2px; gap:6px; flex-wrap:nowrap; overflow:hidden;">
            <span class="home-np-live-status-pill paused" style="font-size:0.68rem; color:var(--accent); display:inline-flex; align-items:center; gap:4px; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.25); border-radius:2px; padding:2px 7px; flex-shrink:0;">
              <span>${getHeroIcon('musical-note', '', 12)}</span>
              <span>${l === 'en' ? 'Spotify History' : 'Historial de Spotify'}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Borde derecho: Logo de Spotify arriba, botón rápido de agregar abajo -->
      <div class="home-np-right-col">
        <a href="${spotifySearchUrl}" target="_blank" rel="noopener noreferrer" class="home-np-sp-logo-link live-card-expanded-only" onclick="event.stopPropagation()" title="${l === 'en' ? 'Search on Spotify' : 'Escuchar en Spotify'}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308c-.218.358-.684.471-1.042.253-2.855-1.745-6.449-2.14-10.682-1.173-.41.094-.817-.162-.911-.572-.094-.41.162-.817.572-.911 4.636-1.059 8.608-.611 11.81 1.361.358.218.471.684.253 1.042zm1.469-3.264c-.275.447-.86.59-1.307.315-3.268-2.008-8.25-2.591-12.115-1.417-.5.152-1.031-.132-1.183-.632-.152-.5.132-1.031.632-1.183 4.414-1.34 9.907-.687 13.658 1.62.447.275.59.86.315 1.307zm.126-3.41c-3.918-2.327-10.377-2.541-14.116-1.405-.6.182-1.238-.16-1.42-.76-.182-.6.16-1.238.76-1.42 4.298-1.305 11.434-1.055 15.932 1.614.54.32.716 1.02.396 1.56-.32.54-1.02.716-1.56.396z"/></svg>
        </a>
        <button type="button" class="btn-np-quick-add live-card-expanded-only" onclick="event.stopPropagation(); registrarDiscoActualEnMediary(decodeURIComponent('${safeTitle}'), decodeURIComponent('${safeArtist}'))" title="${l === 'en' ? 'Log in Mediary' : 'Registrar en Mediary'}">
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

function dibujarTarjetaUltimaCancionAmigosIdle() {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const artistTxt = l === 'en' ? 'Friends Activity' : 'Actividad de Amigos';
  const albumTxt = l === 'en' ? 'No recent songs' : 'Sin canciones recientes';
  const titleTxt = l === 'en' ? 'No friends listening to music right now' : 'Ningún amigo ha escuchado canciones recientemente';
  const btnTxt = l === 'en' ? 'Explore Music' : 'Explorar Música';
  const isExp = (typeof estaLiveCardExpandida === 'function') ? estaLiveCardExpandida('friends_spotify') : false;

  return `
    <div class="home-spotify-card-compact home-friend-music-card home-live-expandable-card ${isExp ? 'is-expanded' : 'is-collapsed'}" onclick="toggleLiveCardExpansion('friends_spotify', event)" title="${isExp ? (l === 'en' ? 'Tap to collapse' : 'Toca para reducir') : (l === 'en' ? 'Tap to expand' : 'Toca para expandir')}">
      <div class="home-np-cover-compact" style="display:grid; place-items:center; font-size:1.6rem; opacity:0.85; cursor:pointer;" onclick="event.stopPropagation(); cambiarCat('Musica', 'Discos')">
        <span>${getHeroIcon('musical-note', '', 14)}</span>
      </div>
      <div class="home-np-center-compact">
        <div class="live-card-collapsed-only" style="width:100%; overflow:hidden;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div class="home-np-title-compact home-np-text-wrap" title="${artistTxt}">
              <span class="home-np-scrollable">${artistTxt}</span>
            </div>
            <div style="font-size:0.73rem; color:#10b981; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; justify-content:center; gap:5px; margin-top:1px;">
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
          <div class="home-np-title-compact home-np-text-wrap" style="cursor:pointer;" onclick="cambiarCat('Musica', 'Discos')">
            <span class="home-np-scrollable">${titleTxt}</span>
          </div>
          <div style="margin-top:3px;">
            <button type="button" class="btn-spotify-sub-action" onclick="event.stopPropagation(); cambiarCat('Musica', 'Discos')" style="height:24px; padding:0 10px; font-size:0.72rem; border-radius:3px; background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.35); color:var(--accent);">
              <span>${getHeroIcon('musical-note', '', 14)} ${btnTxt}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="home-np-right-col">
        <span class="home-np-sp-logo-link" style="cursor:pointer;" onclick="event.stopPropagation(); cambiarCat('Musica', 'Discos')" title="Música">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308c-.218.358-.684.471-1.042.253-2.855-1.745-6.449-2.14-10.682-1.173-.41.094-.817-.162-.911-.572-.094-.41.162-.817.572-.911 4.636-1.059 8.608-.611 11.81 1.361.358.218.471.684.253 1.042zm1.469-3.264c-.275.447-.86.59-1.307.315-3.268-2.008-8.25-2.591-12.115-1.417-.5.152-1.031-.132-1.183-.632-.152-.5.132-1.031.632-1.183 4.414-1.34 9.907-.687 13.658 1.62.447.275.59.86.315 1.307zm.126-3.41c-3.918-2.327-10.377-2.541-14.116-1.405-.6.182-1.238-.16-1.42-.76-.182-.6.16-1.238.76-1.42 4.298-1.305 11.434-1.055 15.932 1.614.54.32.716 1.02.396 1.56-.32.54-1.02.716-1.56.396z"/></svg>
        </span>
        <button type="button" class="btn-np-quick-add" onclick="event.stopPropagation(); cambiarCat('Musica', 'Discos')" title="${l === 'en' ? 'Go to Music' : 'Ir a Música'}">
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

let _amigosLiveMusicIdx = 0;
let _amigosLiveGameIdx = 0;

function obtenerEstadoAmigosMusicaActivo() {
  const liveList = (estado && estado.amigosLiveCache && Array.isArray(estado.amigosLiveCache.music))
    ? estado.amigosLiveCache.music
    : [];

  const ahora = Date.now();
  const maxAgeMusica = 35 * 60 * 1000;
  const activos = liveList.filter(item => {
    if (!item || !item.isPlaying) return false;
    const upAt = Number(item.updatedAt) || 0;
    return (!upAt || (ahora - upAt <= maxAgeMusica));
  });

  if (activos.length > 0) {
    const idx = _amigosLiveMusicIdx % activos.length;
    return {
      status: 'playing',
      tipo: 'live',
      data: activos[idx],
      total: activos.length,
      index: idx
    };
  }

  // Si ningún amigo está escuchando música en vivo, buscar en el historial de canciones de Spotify de amigos
  const recentList = (estado && estado.amigosLiveCache && Array.isArray(estado.amigosLiveCache.recentMusic))
    ? estado.amigosLiveCache.recentMusic
    : [];

  if (recentList.length > 0) {
    const idx = _amigosLiveMusicIdx % recentList.length;
    return {
      status: 'recent',
      tipo: 'recent',
      data: recentList[idx],
      total: recentList.length,
      index: idx
    };
  }

  // En reposo (nunca vinculada a discos o álbumes agregados en el catálogo)
  return { status: 'idle', tipo: 'idle', data: null, total: 0, index: 0 };
}
window.obtenerEstadoAmigosMusicaActivo = obtenerEstadoAmigosMusicaActivo;

function obtenerEstadoAmigosJuegosActivo() {
  const liveList = (estado && estado.amigosLiveCache && Array.isArray(estado.amigosLiveCache.games))
    ? estado.amigosLiveCache.games
    : [];

  const ahora = Date.now();
  const maxAgeJuegos = 3.5 * 60 * 60 * 1000;
  const activos = liveList.filter(item => {
    if (!item || !item.isPlaying) return false;
    const upAt = Number(item.updatedAt) || 0;
    return (!upAt || (ahora - upAt <= maxAgeJuegos));
  });

  if (activos.length > 0) {
    const idx = _amigosLiveGameIdx % activos.length;
    const item = activos[idx];
    const isSteam = !!(item && (item.source === 'steam' || String(item.platform || '').toLowerCase() === 'steam'));
    return {
      status: 'playing',
      tipo: 'live',
      data: item,
      total: activos.length,
      index: idx,
      isSteam
    };
  }

  // Tarjeta de juegos de amigos EXCLUSIVAMENTE en vivo (nunca vinculada a registros ni al catálogo)
  return { status: 'idle', tipo: 'idle', data: null, total: 0, index: 0, isSteam: false };
}
window.obtenerEstadoAmigosJuegosActivo = obtenerEstadoAmigosJuegosActivo;

function ciclarAmigoLiveMusica(ev) {
  if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
  _amigosLiveMusicIdx++;
  renderizarLiveCardsAmigosInicio();
}
window.ciclarAmigoLiveMusica = ciclarAmigoLiveMusica;

function ciclarAmigoLiveJuego(ev) {
  if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
  _amigosLiveGameIdx++;
  renderizarLiveCardsAmigosInicio();
}
window.ciclarAmigoLiveJuego = ciclarAmigoLiveJuego;

function dibujarTarjetaAmigoMusicaLive(data, opciones = {}) {
  if (!data) return '';
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const isExp = (typeof estaLiveCardExpandida === 'function') ? estaLiveCardExpandida('friends_spotify') : false;

  const title = data.title || (l === 'en' ? 'Untitled' : 'Sin título');
  const artist = data.artist || (l === 'en' ? 'Artist' : 'Artista');
  const album = data.album || (l === 'en' ? 'Music' : 'Música');
  const nick = data.amigoNickname || (data.userEmail ? data.userEmail.split('@')[0] : (l === 'en' ? 'Friend' : 'Amigo'));
  const userEmail = data.userEmail || '';
  const coverUrl = data.image || '';
  const source = data.source || 'spotify';
  const isLastFm = source === 'lastfm';

  const coverHtml = coverUrl
    ? `<img src="${escHtmlFeed_(coverUrl)}" alt="${escHtmlFeed_(title)}" loading="lazy" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='grid';"><div class="cover-music-placeholder" style="width:100%;height:100%;display:none;place-items:center;font-size:1.5rem;background:var(--bg);color:#10b981;">${getHeroIcon('musical-note', '', 24)}</div>`
    : `<div class="cover-music-placeholder" style="width:100%;height:100%;display:grid;place-items:center;font-size:1.5rem;background:var(--bg);color:#10b981;">${getHeroIcon('musical-note', '', 24)}</div>`;

  const avatarHtml = (data.amigoAvatar && (data.amigoAvatar.startsWith('http') || data.amigoAvatar.startsWith('data:')))
    ? `<img loading="lazy" decoding="async" src="${escHtmlFeed_(data.amigoAvatar)}" style="width:100%;height:100%;object-fit:cover;">`
    : `<span>${escHtmlFeed_(data.amigoAvatar || '🦊')}</span>`;

  const safeTitle = encodeURIComponent(title);
  const safeArtist = encodeURIComponent(artist);
  const searchUrl = data.url || `https://open.spotify.com/search/${encodeURIComponent((title + ' ' + artist).trim())}`;
  const modalAccion = userEmail ? `abrirModalRegistrosAmigo('${escHtmlFeed_(userEmail)}', '${escHtmlFeed_(nick)}', 'Musica')` : '';
  const perfilAccion = userEmail ? `verPerfilDeAmigo('${escHtmlFeed_(userEmail)}')` : '';

  const total = opciones.total || opciones.totalLiveCount || 1;
  const index = opciones.index !== undefined ? opciones.index : (opciones.currentIndex || 0);
  const switcherHtml = total > 1
    ? `<button type="button" class="btn-psn-sync-compact" onclick="event.stopPropagation(); ciclarAmigoLiveMusica(event)" title="${l === 'en' ? 'View next friend' : 'Ver siguiente amigo'}" style="margin-left:auto; font-size:0.68rem; padding:1px 6px; height:20px;">${index + 1}/${total} ▶</button>`
    : '';

  return `
    <div class="home-spotify-card-compact home-friend-music-card home-live-expandable-card ${isExp ? 'is-expanded' : 'is-collapsed'}" onclick="toggleLiveCardExpansion('friends_spotify', event)" title="${isExp ? (l === 'en' ? 'Tap to collapse' : 'Toca para reducir') : (l === 'en' ? 'Tap to expand' : 'Toca para expandir')}">
      <!-- Portada con mini-avatar superpuesto del amigo -->
      <div class="home-np-cover-compact" style="position:relative; cursor:pointer;" onclick="event.stopPropagation(); ${modalAccion}" title="${l === 'en' ? 'View friend details' : 'Ver actividad del amigo'}">
        ${coverHtml}
        <div class="home-np-friend-avatar-badge" title="${escHtmlFeed_(nick)}">
          ${avatarHtml}
        </div>
      </div>

      <!-- Centro: Vistas reducida y expandida -->
      <div class="home-np-center-compact">
        <!-- VISTA REDUCIDA (ESTILO NOTIFICACIÓN ANDROID) -->
        <div class="live-card-collapsed-only" style="width:100%; overflow:hidden;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div class="home-np-title-compact home-np-text-wrap" title="${escHtmlFeed_(title)}">
              <span class="home-np-scrollable">${escHtmlFeed_(title)}</span>
            </div>
            <div style="font-size:0.73rem; color:#10b981; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; justify-content:center; gap:5px; margin-top:1px;">
              <span>${escHtmlFeed_(nick)}</span>
              <span style="opacity:0.5;">·</span>
              <span style="color:#10b981; display:inline-flex; align-items:center; gap:3px; font-size:0.68rem; font-weight:700;">
                <span class="home-np-dot" style="background:#10b981;"></span>
                <span>${l === 'en' ? 'Live' : 'En vivo'}</span>
              </span>
              <span style="opacity:0.5;">·</span>
              <span style="color:var(--muted); font-size:0.68rem;">${escHtmlFeed_(artist)}</span>
              ${total > 1 ? `<span style="opacity:0.5;">·</span><span style="color:var(--accent); font-size:0.66rem; font-weight:700;">(${index + 1}/${total})</span>` : ''}
            </div>
          </div>
        </div>

        <!-- VISTA EXPANDIDA -->
        <div class="live-card-expanded-only" style="width:100%; display:flex; flex-direction:column; gap:1.5px;">
          <!-- Fila de identificación del amigo -->
          <div style="display:flex; align-items:center; gap:5px; font-size:0.72rem; line-height:1.2; margin-bottom:1px; overflow:hidden;">
            <span style="width:15px; height:15px; border-radius:50%; overflow:hidden; display:inline-grid; place-items:center; flex-shrink:0; border:1px solid var(--border); font-size:0.65rem; cursor:pointer;" onclick="event.stopPropagation(); ${perfilAccion}">
              ${avatarHtml}
            </span>
            <strong style="color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px; cursor:pointer;" onclick="event.stopPropagation(); ${perfilAccion}" title="${escHtmlFeed_(nick)}">
              ${escHtmlFeed_(nick)}
            </strong>
            <span style="color:var(--muted); font-size:0.68rem; white-space:nowrap;">
              ${l === 'en' ? 'is listening now to' : 'está escuchando ahora'}
            </span>
            ${switcherHtml}
          </div>

          <!-- Artista -->
          <div class="home-np-artist-compact home-np-text-wrap" title="${escHtmlFeed_(artist)}">
            <span class="home-np-scrollable">${escHtmlFeed_(artist)}</span>
          </div>

          <!-- Disco / Álbum -->
          <div class="home-np-album-compact home-np-text-wrap" title="${escHtmlFeed_(album)}">
            <span class="home-np-scrollable">${escHtmlFeed_(album)}</span>
          </div>

          <!-- Título de la canción -->
          <div class="home-np-title-compact home-np-text-wrap" style="cursor:pointer;" onclick="${modalAccion}" title="${escHtmlFeed_(title)}">
            <span class="home-np-scrollable">${escHtmlFeed_(title)}</span>
          </div>

          <!-- Fila inferior: Estado de escucha en vivo -->
          <div class="home-np-ctrls-compact" style="margin-top:2px; gap:6px; flex-wrap:nowrap; overflow:hidden;">
            <span class="home-np-live-status-pill" style="font-size:0.68rem; color:#10b981; display:inline-flex; align-items:center; gap:4px; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); border-radius:2px; padding:2px 7px; flex-shrink:0;">
              <span class="home-np-dot" style="width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
              <span>${l === 'en' ? 'Listening now' : 'Escuchando ahora'}</span>
            </span>
            ${isLastFm ? `
              <span style="font-size:0.68rem; color:#d51007; font-weight:700; background:rgba(213,16,7,0.12); border:1px solid rgba(213,16,7,0.3); border-radius:2px; padding:1px 6px;">
                Last.fm
              </span>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Borde derecho: Logo de Spotify / Last.fm arriba, botón rápido de agregar abajo -->
      <div class="home-np-right-col">
        <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="home-np-sp-logo-link live-card-expanded-only" onclick="event.stopPropagation()" title="${isLastFm ? 'Last.fm' : (l === 'en' ? 'Listen on Spotify' : 'Escuchar en Spotify')}">
          ${isLastFm ? `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#d51007"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.782 17.587c-1.423 0-2.434-.698-2.766-1.74l-.271.855h-2.348l1.455-7.382h2.327l-.604 3.064c.542-.782 1.45-1.298 2.502-1.298 1.956 0 3.327 1.579 2.977 3.351-.351 1.776-1.897 3.15-3.272 3.15zm-7.669-.885h-2.42l2.457-7.382h2.42l-2.457 7.382z"/></svg>
          ` : `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308c-.218.358-.684.471-1.042.253-2.855-1.745-6.449-2.14-10.682-1.173-.41.094-.817-.162-.911-.572-.094-.41.162-.817.572-.911 4.636-1.059 8.608-.611 11.81 1.361.358.218.471.684.253 1.042zm1.469-3.264c-.275.447-.86.59-1.307.315-3.268-2.008-8.25-2.591-12.115-1.417-.5.152-1.031-.132-1.183-.632-.152-.5.132-1.031.632-1.183 4.414-1.34 9.907-.687 13.658 1.62.447.275.59.86.315 1.307zm.126-3.41c-3.918-2.327-10.377-2.541-14.116-1.405-.6.182-1.238-.16-1.42-.76-.182-.6.16-1.238.76-1.42 4.298-1.305 11.434-1.055 15.932 1.614.54.32.716 1.02.396 1.56-.32.54-1.02.716-1.56.396z"/></svg>
          `}
        </a>
        <button type="button" class="btn-np-quick-add live-card-expanded-only" onclick="event.stopPropagation(); registrarDiscoActualEnMediary(decodeURIComponent('${safeTitle}'), decodeURIComponent('${safeArtist}'))" title="${l === 'en' ? 'Log in Mediary' : 'Registrar en Mediary'}">
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

function dibujarTarjetaAmigoJuegoLive(data, opciones = {}) {
  if (!data) return '';
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const isExp = (typeof estaLiveCardExpandida === 'function') ? estaLiveCardExpandida('friends_playstation') : false;

  const isSteam = !!(data && (data.source === 'steam' || String(data.platform || '').toLowerCase() === 'steam'));
  const title = data.title || (isSteam ? (l === 'en' ? 'Steam Game' : 'Juego de Steam') : (l === 'en' ? 'PlayStation Game' : 'Juego de PlayStation'));
  const platform = isSteam ? 'Steam' : (data.platform || 'PS5');
  const nick = data.amigoNickname || (data.userEmail ? data.userEmail.split('@')[0] : (l === 'en' ? 'Friend' : 'Amigo'));
  const userEmail = data.userEmail || '';
  const coverUrl = data.image || '';
  const accentColor = isSteam ? '#66c0f4' : '#38bdf8';
  const platformHeader = isSteam ? 'Steam' : (platform.includes('PS5') ? 'PlayStation 5' : (platform.includes('PS4') ? 'PlayStation 4' : 'PlayStation'));

  const coverHtml = coverUrl
    ? `<img src="${escHtmlFeed_(coverUrl)}" alt="${escHtmlFeed_(title)}" loading="lazy" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='grid';"><div class="cover-game-placeholder" style="width:100%;height:100%;display:none;place-items:center;font-size:1.5rem;background:${isSteam ? 'linear-gradient(135deg,#171a21,#1b2838)' : 'linear-gradient(135deg,#003791,#001a44)'};color:${accentColor};">${getHeroIcon('gamepad', '', 24)}</div>`
    : `<div class="cover-game-placeholder" style="width:100%;height:100%;display:grid;place-items:center;font-size:1.5rem;background:${isSteam ? 'linear-gradient(135deg,#171a21,#1b2838)' : 'linear-gradient(135deg,#003791,#001a44)'};color:${accentColor};">${getHeroIcon('gamepad', '', 24)}</div>`;

  const avatarHtml = (data.amigoAvatar && (data.amigoAvatar.startsWith('http') || data.amigoAvatar.startsWith('data:')))
    ? `<img loading="lazy" decoding="async" src="${escHtmlFeed_(data.amigoAvatar)}" style="width:100%;height:100%;object-fit:cover;">`
    : `<span>${escHtmlFeed_(data.amigoAvatar || '🦊')}</span>`;

  const safeTitle = encodeURIComponent(title);
  const safePlatform = encodeURIComponent(platform);
  let storeUrl = isSteam
    ? (data.appid ? `https://store.steampowered.com/app/${encodeURIComponent(data.appid)}` : `https://store.steampowered.com/search/?term=${encodeURIComponent(title)}`)
    : `https://store.playstation.com/search/${encodeURIComponent(title)}`;

  const modalAccion = userEmail ? `abrirModalRegistrosAmigo('${escHtmlFeed_(userEmail)}', '${escHtmlFeed_(nick)}', 'Juegos')` : '';
  const perfilAccion = userEmail ? `verPerfilDeAmigo('${escHtmlFeed_(userEmail)}')` : '';

  const total = opciones.total || opciones.totalLiveCount || 1;
  const index = opciones.index !== undefined ? opciones.index : (opciones.currentIndex || 0);
  const switcherHtml = total > 1
    ? `<button type="button" class="btn-psn-sync-compact" onclick="event.stopPropagation(); ciclarAmigoLiveJuego(event)" title="${l === 'en' ? 'View next friend' : 'Ver siguiente amigo'}" style="margin-left:auto; font-size:0.68rem; padding:1px 6px; height:20px;">${index + 1}/${total} ▶</button>`
    : '';

  return `
    <div class="home-playstation-card-compact home-friend-game-card ${isSteam ? 'is-steam-active' : ''} home-live-expandable-card ${isExp ? 'is-expanded' : 'is-collapsed'}" onclick="toggleLiveCardExpansion('friends_playstation', event)" title="${isExp ? (l === 'en' ? 'Tap to collapse' : 'Toca para reducir') : (l === 'en' ? 'Tap to expand' : 'Toca para expandir')}">
      <!-- Portada con mini-avatar superpuesto del amigo -->
      <div class="home-psn-cover-compact" style="position:relative; cursor:pointer;" onclick="event.stopPropagation(); ${modalAccion}" title="${l === 'en' ? 'View friend details' : 'Ver actividad del amigo'}">
        ${coverHtml}
        <span class="home-psn-platform-badge ${isSteam ? 'home-psn-badge-steam' : ''}">${isSteam ? 'Steam' : (platform.includes('PS5') ? 'PS5' : (platform.includes('PS4') ? 'PS4' : 'PLAY'))}</span>
        <div class="home-np-friend-avatar-badge" title="${escHtmlFeed_(nick)}">
          ${avatarHtml}
        </div>
      </div>

      <!-- Centro: Vistas reducida y expandida -->
      <div class="home-psn-center-compact">
        <!-- VISTA REDUCIDA (ESTILO NOTIFICACIÓN ANDROID) -->
        <div class="live-card-collapsed-only" style="width:100%; overflow:hidden;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div class="home-psn-title-compact home-np-text-wrap" title="${escHtmlFeed_(title)}">
              <span class="home-np-scrollable">${escHtmlFeed_(title)}</span>
            </div>
            <div style="font-size:0.73rem; color:${accentColor}; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; justify-content:center; gap:5px; margin-top:1px;">
              <span>${escHtmlFeed_(nick)}</span>
              <span style="opacity:0.5;">·</span>
              <span style="color:#10b981; display:inline-flex; align-items:center; gap:3px; font-size:0.68rem; font-weight:700;">
                <span class="home-np-dot" style="background:#10b981;"></span>
                <span>${l === 'en' ? 'Live' : 'En vivo'}</span>
              </span>
              <span style="opacity:0.5;">·</span>
              <span style="color:var(--muted); font-size:0.68rem;">${escHtmlFeed_(platform)}</span>
              ${total > 1 ? `<span style="opacity:0.5;">·</span><span style="color:var(--accent); font-size:0.66rem; font-weight:700;">(${index + 1}/${total})</span>` : ''}
            </div>
          </div>
        </div>

        <!-- VISTA EXPANDIDA -->
        <div class="live-card-expanded-only" style="width:100%; display:flex; flex-direction:column; gap:1.5px;">
          <!-- Fila de identificación del amigo -->
          <div style="display:flex; align-items:center; gap:5px; font-size:0.72rem; line-height:1.2; margin-bottom:1px; overflow:hidden;">
            <span style="width:15px; height:15px; border-radius:50%; overflow:hidden; display:inline-grid; place-items:center; flex-shrink:0; border:1px solid var(--border); font-size:0.65rem; cursor:pointer;" onclick="event.stopPropagation(); ${perfilAccion}">
              ${avatarHtml}
            </span>
            <strong style="color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px; cursor:pointer;" onclick="event.stopPropagation(); ${perfilAccion}" title="${escHtmlFeed_(nick)}">
              ${escHtmlFeed_(nick)}
            </strong>
            <span style="color:var(--muted); font-size:0.68rem; white-space:nowrap;">
              ${l === 'en' ? 'is playing now' : 'está jugando ahora'}
            </span>
            ${switcherHtml}
          </div>

          <!-- Plataforma y estudio / red -->
          <div class="home-psn-platform-label">
            ${obtenerSvgLogoPlataformaJuego_(isSteam ? 'steam' : 'playstation', 13)}
            <span>${platformHeader}</span>
          </div>

          <!-- Título del juego -->
          <div class="home-psn-title-compact home-np-text-wrap" style="cursor:pointer;" onclick="${modalAccion}" title="${escHtmlFeed_(title)}">
            <span class="home-np-scrollable">${escHtmlFeed_(title)}</span>
          </div>

          <!-- Fila inferior: Estado de juego en vivo -->
          <div class="home-psn-status-row" style="margin-top:2px; gap:6px; flex-wrap:nowrap; overflow:hidden;">
            <span class="home-psn-live-pill" style="font-size:0.68rem; color:#10b981; display:inline-flex; align-items:center; gap:4px; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); border-radius:2px; padding:2px 7px; flex-shrink:0;">
              <span class="home-np-dot" style="width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
              <span>${l === 'en' ? 'Playing now' : 'Jugando ahora'}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Borde derecho: Logo oficial (Steam o PlayStation) y botón rápido -->
      <div class="home-psn-right-col">
        <a href="${storeUrl}" target="_blank" rel="noopener noreferrer" class="home-psn-logo-link live-card-expanded-only" onclick="event.stopPropagation()" title="${isSteam ? (l === 'en' ? 'Search on Steam' : 'Ver en Steam') : (l === 'en' ? 'Search on PlayStation Store' : 'Buscar en PlayStation Store')}">
          ${obtenerSvgLogoPlataformaJuego_(isSteam ? 'steam' : 'playstation', 20)}
        </a>
        <button type="button" class="btn-psn-quick-add live-card-expanded-only" onclick="event.stopPropagation(); registrarJuegoActualEnMediary(decodeURIComponent('${safeTitle}'), decodeURIComponent('${safePlatform}'))" title="${l === 'en' ? 'Log in Mediary' : 'Registrar en Mediary'}">
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

function dibujarTarjetaUltimoJuegoAmigos(it) {
  if (!it) return '';
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const enProg = esEnProgresoTexto(it.fechaFin);
  const timeStr = formatearTiempoRelativoFeed(it.createdAt || it.fechaFin || it.fechaInicio, l);
  const studio = it.creador || '';
  const title = it.titulo || (l === 'en' ? 'Untitled Game' : 'Juego sin título');
  const nick = it.amigoNickname || (it.userEmail ? it.userEmail.split('@')[0] : (l === 'en' ? 'Friend' : 'Amigo'));
  const califNum = Number(it.calificacion) || 0;
  const subStr = String(it.subcategoria || '').toLowerCase();
  const subTitStr = String(it.subtitulo || '').toLowerCase();
  const isSteam = !!(subStr.includes('steam') || subTitStr.includes('steam') || String(it.plataforma || '').toLowerCase().includes('steam'));
  const platform = isSteam ? 'Steam' : (it.subcategoria || it.subtitulo || 'PlayStation');
  const accentColor = isSteam ? '#66c0f4' : '#38bdf8';
  const horasLimpia = (typeof limpiarTextoHoras === 'function') ? limpiarTextoHoras(it.horas) : '';

  const coverHtml = it.poster
    ? `<img src="${escHtmlFeed_(it.poster)}" alt="${escHtmlFeed_(title)}" loading="lazy" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='grid';"><div class="cover-game-placeholder" style="width:100%;height:100%;display:none;place-items:center;font-size:1.5rem;background:${isSteam ? 'linear-gradient(135deg,#171a21,#1b2838)' : 'linear-gradient(135deg,#003791,#001a44)'};color:${accentColor};">${getHeroIcon('gamepad', '', 24)}</div>`
    : `<div class="cover-game-placeholder" style="width:100%;height:100%;display:grid;place-items:center;font-size:1.5rem;background:${isSteam ? 'linear-gradient(135deg,#171a21,#1b2838)' : 'linear-gradient(135deg,#003791,#001a44)'};color:${accentColor};">${getHeroIcon('gamepad', '', 24)}</div>`;

  const avatarHtml = (it.amigoAvatar && (it.amigoAvatar.startsWith('http') || it.amigoAvatar.startsWith('data:')))
    ? `<img loading="lazy" decoding="async" src="${escHtmlFeed_(it.amigoAvatar)}" style="width:100%;height:100%;object-fit:cover;">`
    : `<span>${escHtmlFeed_(it.amigoAvatar || '🦊')}</span>`;

  const safeTitle = encodeURIComponent(title);
  const safePlatform = encodeURIComponent(platform);
  const storeSearchUrl = isSteam
    ? `https://store.steampowered.com/search/?term=${encodeURIComponent(title)}`
    : `https://store.playstation.com/search/${encodeURIComponent(title)}`;
  const modalAccion = `abrirModalRegistrosAmigo('${escHtmlFeed_(it.userEmail)}', '${escHtmlFeed_(nick)}', 'Juegos')`;
  const perfilAccion = `verPerfilDeAmigo('${escHtmlFeed_(it.userEmail)}')`;
  const isExp = (typeof estaLiveCardExpandida === 'function') ? estaLiveCardExpandida('friends_playstation') : false;

  return `
    <div class="home-playstation-card-compact home-friend-game-card ${isSteam ? 'is-steam-active' : ''} home-live-expandable-card ${isExp ? 'is-expanded' : 'is-collapsed'}" onclick="toggleLiveCardExpansion('friends_playstation', event)" title="${isExp ? (l === 'en' ? 'Tap to collapse' : 'Toca para reducir') : (l === 'en' ? 'Tap to expand' : 'Toca para expandir')}">
      <!-- Portada con mini-avatar superpuesto del amigo -->
      <div class="home-psn-cover-compact" style="position:relative; cursor:pointer;" onclick="event.stopPropagation(); ${modalAccion}" title="${l === 'en' ? 'View friend details' : 'Ver actividad del amigo'}">
        ${coverHtml}
        <span class="home-psn-platform-badge">${isSteam ? 'Steam' : (platform.includes('PS5') ? 'PS5' : (platform.includes('PS4') ? 'PS4' : 'PLAY'))}</span>
        <div class="home-np-friend-avatar-badge" title="${escHtmlFeed_(nick)}">
          ${avatarHtml}
        </div>
      </div>

      <!-- Centro: Vistas reducida y expandida -->
      <div class="home-psn-center-compact">
        <!-- VISTA REDUCIDA (ESTILO NOTIFICACIÓN ANDROID) -->
        <div class="live-card-collapsed-only" style="width:100%; overflow:hidden;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div class="home-psn-title-compact home-np-text-wrap" title="${escHtmlFeed_(title)}">
              <span class="home-np-scrollable">${escHtmlFeed_(title)}</span>
            </div>
            <div style="font-size:0.73rem; color:${accentColor}; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; justify-content:center; gap:5px; margin-top:1px;">
              <span>${escHtmlFeed_(nick)}</span>
              <span style="opacity:0.5;">·</span>
              <span style="color:${enProg ? '#10b981' : accentColor}; display:inline-flex; align-items:center; gap:3px; font-size:0.68rem; font-weight:700;">
                <span class="home-np-dot" style="${enProg ? 'background:#10b981;' : `background:${accentColor}; box-shadow:none; animation:none;`}"></span>
                <span>${enProg ? (l === 'en' ? 'Playing' : 'Jugando') : (l === 'en' ? 'Played' : 'Jugó')}</span>
              </span>
              ${horasLimpia ? `<span style="opacity:0.5;">·</span><span style="color:var(--muted); font-size:0.68rem; display:inline-flex; align-items:center; gap:2px;">${getHeroIcon('clock', '', 11)} ${horasLimpia}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- VISTA EXPANDIDA -->
        <div class="live-card-expanded-only" style="width:100%; display:flex; flex-direction:column; gap:1.5px;">
          <!-- Fila de identificación del amigo -->
          <div style="display:flex; align-items:center; gap:5px; font-size:0.72rem; line-height:1.2; margin-bottom:1px; overflow:hidden;">
            <span style="width:15px; height:15px; border-radius:50%; overflow:hidden; display:inline-grid; place-items:center; flex-shrink:0; border:1px solid var(--border); font-size:0.65rem; cursor:pointer;" onclick="event.stopPropagation(); ${perfilAccion}">
              ${avatarHtml}
            </span>
            <strong style="color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px; cursor:pointer;" onclick="event.stopPropagation(); ${perfilAccion}" title="${escHtmlFeed_(nick)}">
              ${escHtmlFeed_(nick)}
            </strong>
            <span style="color:var(--muted); font-size:0.68rem; white-space:nowrap;">
              ${enProg ? (l === 'en' ? 'is playing' : 'está jugando a') : (l === 'en' ? 'played' : 'jugó a')}
            </span>
            ${timeStr ? `<span style="color:var(--muted); font-size:0.66rem; margin-left:auto; flex-shrink:0; white-space:nowrap; display:inline-flex; align-items:center; gap:3px;">${getHeroIcon('clock', '', 11)} ${timeStr}</span>` : ''}
          </div>

          <!-- Plataforma y estudio -->
          <div class="home-psn-platform-label">
            ${obtenerSvgLogoPlataformaJuego_(isSteam ? 'steam' : 'playstation', 13)}
            <span>${platform}</span>
            ${studio ? `<span style="opacity:0.65; font-size:0.68rem; font-weight:500;">· ${escHtmlFeed_(studio)}</span>` : ''}
          </div>

          <!-- Título del juego -->
          <div class="home-psn-title-compact home-np-text-wrap" style="cursor:pointer;" onclick="${modalAccion}" title="${escHtmlFeed_(title)}">
            <span class="home-np-scrollable">${escHtmlFeed_(title)}</span>
          </div>

          <!-- Fila inferior: Estado, Horas y calificación -->
          <div class="home-psn-status-row" style="margin-top:2px; gap:6px; flex-wrap:nowrap; overflow:hidden;">
            ${enProg ? `
              <span class="home-psn-live-pill" style="font-size:0.68rem; color:#10b981; display:inline-flex; align-items:center; gap:4px; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); border-radius:2px; padding:2px 7px; flex-shrink:0;">
                <span class="home-np-dot" style="width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
                <span>${l === 'en' ? 'Playing now' : 'Jugando ahora'}</span>
              </span>
            ` : `
              <span class="home-psn-live-pill idle" style="font-size:0.68rem; color:${accentColor}; display:inline-flex; align-items:center; gap:4px; background:${isSteam ? 'rgba(102,192,244,0.12)' : 'rgba(0,112,209,0.12)'}; border:1px solid ${isSteam ? 'rgba(102,192,244,0.3)' : 'rgba(0,112,209,0.28)'}; border-radius:2px; padding:2px 7px; flex-shrink:0;">
                ${obtenerSvgLogoPlataformaJuego_(isSteam ? 'steam' : 'playstation', 12)}
                <span>${l === 'en' ? 'Friends latest game' : 'Último juego de amigos'}</span>
              </span>
            `}
            ${horasLimpia ? `
              <span style="font-size:0.68rem; color:var(--muted); font-weight:600; display:inline-flex; align-items:center; gap:3px; background:var(--bg); border:1px solid var(--border); border-radius:2px; padding:2px 6px; flex-shrink:0;">
                ${getHeroIcon('clock', '', 11)} ${horasLimpia}
              </span>
            ` : ''}
            ${califNum > 0 ? `
              <div style="display:inline-flex; align-items:center; background:var(--bg); border:1px solid var(--border); padding:1px 6px; border-radius:4px; font-size:0.68rem; line-height:1; flex-shrink:0;">
                ${renderEstrellasVisuales(califNum)}
              </div>
            ` : ''}
            ${it.comentario ? `
              <span style="cursor:pointer; font-size:0.72rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px; line-height:1;" onclick="${modalAccion}" title="${escHtmlFeed_(it.comentario)}">
                ${getHeroIcon('chat-bubble-bottom-center-text', '', 12)} "${escHtmlFeed_(it.comentario)}"
              </span>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Borde derecho: Logo oficial y botón rápido -->
      <div class="home-psn-right-col">
        <a href="${storeSearchUrl}" target="_blank" rel="noopener noreferrer" class="home-psn-logo-link live-card-expanded-only" onclick="event.stopPropagation()" title="${isSteam ? (l === 'en' ? 'Search on Steam' : 'Buscar en Steam') : (l === 'en' ? 'Search on PlayStation Store' : 'Buscar en PlayStation Store')}">
          ${obtenerSvgLogoPlataformaJuego_(isSteam ? 'steam' : 'playstation', 20)}
        </a>
        <button type="button" class="btn-psn-quick-add live-card-expanded-only" onclick="event.stopPropagation(); registrarJuegoActualEnMediary(decodeURIComponent('${safeTitle}'), decodeURIComponent('${safePlatform}'))" title="${l === 'en' ? 'Log in Mediary' : 'Registrar en Mediary'}">
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

function dibujarTarjetaUltimoJuegoAmigosIdle() {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const gameTxt = l === 'en' ? 'Friends Gaming' : 'Videojuegos Amigos';
  const subTxt = l === 'en' ? 'PlayStation & Steam · Idle' : 'PlayStation y Steam · Sin actividad';
  const titleTxt = l === 'en' ? 'No friends playing games right now' : 'Ningún amigo está jugando en este momento';
  const btnTxt = l === 'en' ? 'Explore Games' : 'Explorar Juegos';
  const isExp = (typeof estaLiveCardExpandida === 'function') ? estaLiveCardExpandida('friends_playstation') : false;

  return `
    <div class="home-playstation-card-compact home-friend-game-card home-live-expandable-card ${isExp ? 'is-expanded' : 'is-collapsed'}" onclick="toggleLiveCardExpansion('friends_playstation', event)" title="${isExp ? (l === 'en' ? 'Tap to collapse' : 'Toca para reducir') : (l === 'en' ? 'Tap to expand' : 'Toca para expandir')}">
      <div class="home-psn-cover-compact" style="display:grid; place-items:center; font-size:1.6rem; opacity:0.85; cursor:pointer;" onclick="event.stopPropagation(); cambiarCat('Juegos', 'Consolas')">
        <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="6"/><path d="M6 12h4m-2-2v4M15 13h.01M18 11h.01"/></svg>
      </div>
      <div class="home-psn-center-compact">
        <div class="live-card-collapsed-only" style="width:100%; overflow:hidden;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div class="home-psn-title-compact home-np-text-wrap" title="${gameTxt}">
              <span class="home-np-scrollable">${gameTxt}</span>
            </div>
            <div style="font-size:0.73rem; color:#38bdf8; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; justify-content:center; gap:5px; margin-top:1px;">
              <span>${subTxt}</span>
            </div>
          </div>
        </div>
        <div class="live-card-expanded-only" style="width:100%; display:flex; flex-direction:column; gap:1.5px;">
          <div class="home-psn-platform-label">
            <span>PlayStation / Steam</span>
          </div>
          <div class="home-psn-title-compact home-np-text-wrap" style="cursor:pointer;" onclick="cambiarCat('Juegos', 'Consolas')">
            <span class="home-np-scrollable">${titleTxt}</span>
          </div>
          <div style="margin-top:3px;">
            <button type="button" class="btn-spotify-sub-action" onclick="event.stopPropagation(); cambiarCat('Juegos', 'Consolas')" style="height:24px; padding:0 10px; font-size:0.72rem; border-radius:3px; background:rgba(0,112,209,0.14); border:1px solid rgba(0,112,209,0.35); color:#38bdf8;">
              <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><rect width="20" height="12" x="2" y="6" rx="6"/><path d="M6 12h4m-2-2v4M15 13h.01M18 11h.01"/></svg> <span>${btnTxt}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="home-psn-right-col">
        <span class="home-psn-logo-link" style="cursor:pointer;" onclick="event.stopPropagation(); cambiarCat('Juegos', 'Consolas')" title="Videojuegos">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#0070d1">
            <path d="M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.505v5.875c2.441 1.193 4.362-.002 4.362-3.152 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.39-1.502zm4.656 16.241l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5V14.98l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.04 1.472 1.576 2.072-.465.6-1.622 1.036-1.622 1.036l-8.544 3.107V18.86zM1.807 18.6c-1.9-.545-2.214-1.668-1.352-2.32.801-.586 2.16-1.052 2.16-1.052l5.615-2.013v2.313L4.205 17c-.705.271-.825.632-.239.826.586.195 1.637.15 2.343-.12L8.247 17v2.074c-.12.03-.256.044-.39.073-1.939.331-3.996.196-6.038-.479z"/>
          </svg>
        </span>
        <button type="button" class="btn-psn-quick-add" onclick="event.stopPropagation(); cambiarCat('Juegos', 'Consolas')" title="${l === 'en' ? 'Go to Games' : 'Ir a Juegos'}">
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

function cambiarSlideFriendsLive(idx) {
  const carousel = document.getElementById('home-friends-live-carousel');
  if (!carousel) return;
  carousel.scrollTo({ left: idx * carousel.clientWidth, behavior: 'smooth' });
  actualizarPillsCarouselFriendsLive(idx);
}

function actualizarPillsCarouselFriendsLive(idx) {
  const dotSp = document.getElementById('dot-friends-live-spotify');
  const dotPsn = document.getElementById('dot-friends-live-psn');
  if (dotSp) dotSp.classList.toggle('active', idx === 0);
  if (dotPsn) dotPsn.classList.toggle('active', idx === 1);
}

function inicializarFriendsLiveCarouselScrollListener() {
  const carousel = document.getElementById('home-friends-live-carousel');
  if (!carousel || carousel._hasFriendsScrollListener) return;
  carousel._hasFriendsScrollListener = true;
  let rafId = 0;
  carousel.addEventListener('scroll', () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      const w = carousel.clientWidth || 1;
      actualizarPillsCarouselFriendsLive(Math.round(carousel.scrollLeft / w));
    });
  }, { passive: true });
}

function esItemCancionMusica(it) {
  if (!it) return false;
  if (it.id && String(it.id).startsWith('sp_')) return true;
  const cat = String(it.categoria || '').trim().toLowerCase();
  const sub = String(it.subcategoria || '').trim().toLowerCase();
  if (cat === 'musica') {
    if (sub.includes('canc') || sub.includes('single') || sub.includes('song') || sub.includes('track') || sub.includes('pista') || sub.includes('tema')) {
      return true;
    }
    if (sub.includes('disco') || sub.includes('album') || sub.includes('álbum') || sub.includes('ep') || sub.includes('vinil') || sub.includes('lp') || sub.includes('artista') || sub.includes('concierto') || sub.includes('festival')) {
      return false;
    }
    return false;
  }
  return false;
}
window.esItemCancionMusica = esItemCancionMusica;

function obtenerUltimasCancionesAmigos(limite = 10) {
  const feed = estado.amigosFeedCache || [];
  if (!feed.length) return [];

  // Los discos agregados no deben salir en la parte de música escuchada recientemente, solo canciones
  const itemsMusica = feed.filter(it => it && esItemCancionMusica(it));
  if (!itemsMusica.length) return [];

  const copia = [...itemsMusica].sort((a, b) => {
    const tA = a.createdAt ? new Date(a.createdAt).getTime() : timestampDeFecha(a.fechaFin || a.fechaInicio);
    const tB = b.createdAt ? new Date(b.createdAt).getTime() : timestampDeFecha(b.fechaFin || b.fechaInicio);
    return (tB || 0) - (tA || 0);
  });

  const vistos = new Set();
  const canciones = [];

  for (const it of copia) {
    const tit = (it.titulo || '').toLowerCase().trim();
    const art = (it.creador || '').toLowerCase().trim();
    const clave = `${it.userEmail || ''}_${tit}_${art}`;
    if (!vistos.has(clave)) {
      vistos.add(clave);
      canciones.push(it);
      if (canciones.length >= limite) break;
    }
  }

  return canciones;
}

function renderizarUltimasCancionesAmigosInicio() {
  const contenedor = document.getElementById('lista-amigos-ultimas-canciones');
  const seccion = document.getElementById('seccion-amigos-ultimas-canciones');
  if (!contenedor) return;

  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';

  if (!estado.userEmail) {
    if (seccion) seccion.style.display = 'none';
    contenedor.innerHTML = '';
    return;
  }

  const canciones = obtenerUltimasCancionesAmigos(10);

  if (!canciones.length) {
    const feed = estado.amigosFeedCache || [];
    if (!feed.length) {
      if (seccion) seccion.style.display = 'none';
      contenedor.innerHTML = '';
      return;
    }
    if (seccion) seccion.style.display = 'block';
    contenedor.innerHTML = `
      <div style="background:var(--card); border:1px dashed var(--border); border-radius:10px; padding:18px 14px; text-align:center; color:var(--muted); font-size:0.83rem;">
        <span style="display:inline-block; margin-bottom:4px; color:#10b981;">${getHeroIcon('musical-note', '', 20)}</span>
        <div>${l === 'en' ? 'No songs listened to by your friends recently.' : 'Tus amigos aún no han escuchado canciones recientemente.'}</div>
      </div>
    `;
    return;
  }

  if (seccion) seccion.style.display = 'block';

  let html = `<div class="home-friend-songs-scroll">`;
  canciones.forEach(it => {
    const timeStr = formatearTiempoRelativoFeed(it.createdAt || it.fechaFin || it.fechaInicio, l);
    const artist = it.creador || (l === 'en' ? 'Artist' : 'Artista');
    const album = it.subtitulo || it.subcategoria || (l === 'en' ? 'Music' : 'Música');
    const title = it.titulo || (l === 'en' ? 'Untitled' : 'Sin título');
    const nick = it.amigoNickname || (it.userEmail ? it.userEmail.split('@')[0] : (l === 'en' ? 'Friend' : 'Amigo'));
    const califNum = Number(it.calificacion) || 0;

    const coverHtml = it.poster
      ? `<img src="${escHtmlFeed_(it.poster)}" alt="${escHtmlFeed_(title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='grid';"><div class="cover-music-placeholder" style="width:100%;height:100%;display:none;place-items:center;font-size:1.3rem;background:var(--bg);color:#10b981;">${getHeroIcon('musical-note', '', 22)}</div>`
      : `<div class="cover-music-placeholder" style="width:100%;height:100%;display:grid;place-items:center;font-size:1.3rem;background:var(--bg);color:#10b981;">${getHeroIcon('musical-note', '', 22)}</div>`;

    const avatarHtml = (it.amigoAvatar && (it.amigoAvatar.startsWith('http') || it.amigoAvatar.startsWith('data:')))
      ? `<img loading="lazy" decoding="async" src="${escHtmlFeed_(it.amigoAvatar)}" style="width:100%;height:100%;object-fit:cover;">`
      : `<span>${escHtmlFeed_(it.amigoAvatar || '🦊')}</span>`;

    const safeTitle = encodeURIComponent(title);
    const safeArtist = encodeURIComponent(artist);
    const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent((title + ' ' + (it.creador || '')).trim())}`;
    const modalAccion = `abrirModalRegistrosAmigo('${escHtmlFeed_(it.userEmail)}', '${escHtmlFeed_(nick)}', 'Musica')`;
    const perfilAccion = `verPerfilDeAmigo('${escHtmlFeed_(it.userEmail)}')`;

    html += `
      <div class="home-friend-song-card" onclick="${modalAccion}" title="${escHtmlFeed_(title)} · ${escHtmlFeed_(artist)}">
        <!-- Portada con mini-avatar superpuesto del amigo -->
        <div class="home-friend-song-cover-box" style="width:58px; height:58px; min-width:58px; max-width:58px; border-radius:8px; overflow:hidden; position:relative; background:var(--card); border:1px solid var(--border); box-shadow:0 2px 6px rgba(0,0,0,0.15); flex-shrink:0;">
          ${coverHtml}
          <div class="home-np-friend-avatar-badge" style="position:absolute; bottom:2px; right:2px; width:20px; height:20px; border-radius:50%; border:1.5px solid var(--card); overflow:hidden; display:grid; place-items:center; background:var(--bg); box-shadow:0 1px 4px rgba(0,0,0,0.3); font-size:0.75rem; cursor:pointer;" onclick="event.stopPropagation(); ${perfilAccion}" title="${escHtmlFeed_(nick)}">
            ${avatarHtml}
          </div>
        </div>

        <!-- Info central -->
        <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; overflow:hidden;">
          <!-- Fila de usuario y tiempo escuchado -->
          <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:0.71rem; line-height:1.2; overflow:hidden;">
            <strong style="color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:115px; cursor:pointer;" onclick="event.stopPropagation(); ${perfilAccion}" title="${escHtmlFeed_(nick)}">
              ${escHtmlFeed_(nick)}
            </strong>
            <span style="color:var(--muted); font-size:0.67rem; display:inline-flex; align-items:center; gap:3px; flex-shrink:0; white-space:nowrap;">
              ${getHeroIcon('clock', '', 11)} <span>${timeStr || (l === 'en' ? 'Recently' : 'Reciente')}</span>
            </span>
          </div>

          <!-- Título canción -->
          <div class="home-np-text-wrap" style="width:100%; overflow:hidden;">
            <div class="home-np-scrollable" style="font-size:0.88rem; font-weight:800; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.25;" title="${escHtmlFeed_(title)}">
              ${escHtmlFeed_(title)}
            </div>
          </div>

          <!-- Artista y Álbum -->
          <div style="font-size:0.74rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.2;" title="${escHtmlFeed_(artist)}${album ? ' · ' + escHtmlFeed_(album) : ''}">
            <span style="color:var(--text); opacity:0.85;">${escHtmlFeed_(artist)}</span>${album ? ` <span style="opacity:0.5;">·</span> <span>${escHtmlFeed_(album)}</span>` : ''}
          </div>

          <!-- Rating o comentario si tiene -->
          ${califNum > 0 || it.comentario ? `
            <div style="display:flex; align-items:center; gap:5px; margin-top:2px; overflow:hidden;">
              ${califNum > 0 ? `
                <div style="display:inline-flex; align-items:center; background:var(--bg); border:1px solid var(--border); padding:1px 5px; border-radius:3px; font-size:0.64rem; line-height:1; flex-shrink:0;">
                  ${renderEstrellasVisuales(califNum)}
                </div>
              ` : ''}
              ${it.comentario ? `
                <span style="font-size:0.68rem; color:var(--muted); font-style:italic; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escHtmlFeed_(it.comentario)}">
                  "${escHtmlFeed_(it.comentario)}"
                </span>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- Columna derecha: Spotify + botón rápido -->
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:space-between; gap:6px; flex-shrink:0;">
          <a href="${spotifySearchUrl}" target="_blank" rel="noopener noreferrer" style="display:grid; place-items:center; width:22px; height:22px; transition:var(--tr);" onclick="event.stopPropagation()" title="${l === 'en' ? 'Listen on Spotify' : 'Escuchar en Spotify'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308c-.218.358-.684.471-1.042.253-2.855-1.745-6.449-2.14-10.682-1.173-.41.094-.817-.162-.911-.572-.094-.41.162-.817.572-.911 4.636-1.059 8.608-.611 11.81 1.361.358.218.471.684.253 1.042zm1.469-3.264c-.275.447-.86.59-1.307.315-3.268-2.008-8.25-2.591-12.115-1.417-.5.152-1.031-.132-1.183-.632-.152-.5.132-1.031.632-1.183 4.414-1.34 9.907-.687 13.658 1.62.447.275.59.86.315 1.307zm.126-3.41c-3.918-2.327-10.377-2.541-14.116-1.405-.6.182-1.238-.16-1.42-.76-.182-.6.16-1.238.76-1.42 4.298-1.305 11.434-1.055 15.932 1.614.54.32.716 1.02.396 1.56-.32.54-1.02.716-1.56.396z"/></svg>
          </a>
          <button type="button" class="btn-np-quick-add" style="width:24px; height:24px; border-radius:4px; padding:0; display:grid; place-items:center;" onclick="event.stopPropagation(); registrarDiscoActualEnMediary(decodeURIComponent('${safeTitle}'), decodeURIComponent('${safeArtist}'))" title="${l === 'en' ? 'Log in Mediary' : 'Registrar en Mediary'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:auto;"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  contenedor.innerHTML = html;

  requestAnimationFrame(() => {
    setTimeout(ajustarMarqueeSpotify, 60);
  });
}

let _amigosLivePollingInterval = null;
let _amigosLiveFetchEnCurso = false;

function renderizarLiveCardsAmigosInicio() {
  const wrapper = document.getElementById('home-friends-live-carousel-wrapper');
  const contMusica = document.getElementById('home-friends-last-track-container');
  const contJuego = document.getElementById('home-friends-psn-container');

  if (!estado || !estado.userEmail) {
    if (wrapper) wrapper.style.display = 'none';
    renderizarUltimasCancionesAmigosInicio();
    return;
  }

  if (wrapper) wrapper.style.display = 'flex';
  if (typeof inicializarFriendsLiveCarouselScrollListener === 'function') {
    inicializarFriendsLiveCarouselScrollListener();
  }
  if (typeof iniciarPollingFriendsLive === 'function') {
    iniciarPollingFriendsLive();
  }

  const estMusica = obtenerEstadoAmigosMusicaActivo();
  const estJuego = obtenerEstadoAmigosJuegosActivo();

  // Actualizar dots y badges en vivo
  const badgeSp = document.getElementById('badge-friends-sp-live-pill');
  if (badgeSp) badgeSp.style.display = (estMusica.status === 'playing') ? 'inline-block' : 'none';

  const badgePsn = document.getElementById('badge-friends-psn-live-pill');
  if (badgePsn) badgePsn.style.display = (estJuego.status === 'playing') ? 'inline-block' : 'none';

  if (contMusica) {
    if (estMusica.status === 'playing') {
      contMusica.innerHTML = dibujarTarjetaAmigoMusicaLive(estMusica.data, { total: estMusica.total, index: estMusica.index });
    } else if (estMusica.status === 'recent') {
      contMusica.innerHTML = dibujarTarjetaUltimaCancionAmigos(estMusica.data);
    } else {
      contMusica.innerHTML = dibujarTarjetaUltimaCancionAmigosIdle();
    }
  }

  if (contJuego) {
    if (estJuego.status === 'playing') {
      contJuego.innerHTML = dibujarTarjetaAmigoJuegoLive(estJuego.data, { total: estJuego.total, index: estJuego.index });
    } else {
      contJuego.innerHTML = dibujarTarjetaUltimoJuegoAmigosIdle();
    }
  }

  renderizarUltimasCancionesAmigosInicio();

  requestAnimationFrame(() => {
    if (typeof ajustarMarqueeSpotify === 'function') ajustarMarqueeSpotify();
  });
}
window.renderizarLiveCardsAmigosInicio = renderizarLiveCardsAmigosInicio;
window.renderizarUltimaCancionAmigosInicio = renderizarLiveCardsAmigosInicio;
window.cambiarSlideFriendsLive = cambiarSlideFriendsLive;

async function consultarActividadEnVivoAmigos_(mostrarToast = false) {
  if (!estado || !estado.userEmail || _amigosLiveFetchEnCurso) return;
  _amigosLiveFetchEnCurso = true;
  try {
    const res = await new Promise(resolve => {
      if (typeof SERVER_API !== 'undefined' && typeof SERVER_API.obtenerActividadEnVivoAmigos === 'function') {
        SERVER_API.obtenerActividadEnVivoAmigos(estado.userEmail).then(resolve).catch(err => resolve({ exito: false, error: err }));
      } else if (typeof google !== 'undefined' && google.script?.run?.obtenerActividadEnVivoAmigos) {
        google.script.run.withSuccessHandler(resolve).withFailureHandler(err => resolve({ exito: false, error: err })).obtenerActividadEnVivoAmigos(estado.userEmail);
      } else {
        resolve({ exito: false });
      }
    });

    if (res && res.exito && res.live) {
      estado.amigosLiveCache = res.live;
      try {
        if (estado.userEmail) {
          localStorage.setItem('mediary_cache_friends_live_' + estado.userEmail.toLowerCase(), JSON.stringify(res.live));
        }
      } catch(e) {}
      renderizarLiveCardsAmigosInicio();
      if (mostrarToast) {
        const l = userPrefs?.lang === 'en' ? 'en' : 'es';
        mostrarToastPersonalizado(l === 'en' ? 'Friends live activity refreshed' : 'Actividad en vivo de amigos actualizada');
      }
    }
  } catch(e) {
  } finally {
    _amigosLiveFetchEnCurso = false;
  }
}
window.consultarActividadEnVivoAmigos_ = consultarActividadEnVivoAmigos_;

function iniciarPollingFriendsLive() {
  // Desactivado el polling continuo en segundo plano para evitar sincronizaciones constantes
  if (_amigosLivePollingInterval) {
    clearInterval(_amigosLivePollingInterval);
    _amigosLivePollingInterval = null;
  }
}
window.iniciarPollingFriendsLive = iniciarPollingFriendsLive;

function detenerPollingFriendsLive() {
  if (_amigosLivePollingInterval) {
    clearInterval(_amigosLivePollingInterval);
    _amigosLivePollingInterval = null;
  }
}
window.detenerPollingFriendsLive = detenerPollingFriendsLive;

function renderizarFeedAmigosResumidoInicio() {
  renderizarLiveCardsAmigosInicio();
  if (typeof consultarActividadEnVivoAmigos_ === 'function' && estado && estado.userEmail) {
    consultarActividadEnVivoAmigos_(false);
  }
  const contenedor = document.getElementById('lista-comunidad-resumen-inicio');
  if (!contenedor) return;
  const l = userPrefs.lang || 'es';
  if (!estado.userEmail) {
    contenedor.innerHTML = `
      <div style="background:rgba(15,23,42,0.4);border:1px dashed var(--border);border-radius:4px;padding:20px;text-align:center;color:var(--muted);font-size:0.85rem;">
        <span style="display:block;margin-bottom:6px;">${getHeroIcon('users', '', 28)}</span>
        ${l === 'en' ? 'Sign in to see what your friends logged in the last 7 days.' : 'Inicia sesión con tu cuenta para ver qué han registrado tus amigos en la última semana.'}
        <div style="margin-top:10px;">
          <button type="button" class="btn-today-pill" style="height:32px;padding:0 14px;font-size:0.8rem;margin:0 auto;" onclick="abrirModalAuthSupabase('login')">
            ${l === 'en' ? 'Sign In' : 'Iniciar Sesión'}
          </button>
        </div>
      </div>
    `;
    return;
  }

  const feed = estado.amigosFeedCache || [];
  if (!feed.length) {
    contenedor.innerHTML = `
      <div style="background:rgba(15,23,42,0.4);border:1px dashed var(--border);border-radius:3px;padding:20px;text-align:center;color:var(--muted);font-size:0.85rem;">
        <span style="display:block;margin-bottom:6px;">${getHeroIcon('users', '', 28)}</span>
        ${l === 'en' ? 'No friend updates logged yet.' : 'Aún no hay actividad de tus amigos en esta semana.'}
        <div style="margin-top:10px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button type="button" class="btn-today-pill" style="height:32px;padding:0 12px;font-size:0.78rem;" onclick="abrirVistaAmigos()">
            ${getHeroIcon('users', '', 14)} ${l === 'en' ? 'Manage Friends' : 'Buscar Amigos'}
          </button>
          <button type="button" class="btn-today-pill" style="height:32px;padding:0 12px;font-size:0.78rem;" onclick="copiarMiIdUsuario()">
            ${getHeroIcon('clipboard-document', '', 14)} ${l === 'en' ? 'Copy My ID' : 'Copiar mi ID'}
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Las canciones escuchadas NO deben salir en las tarjetas de agregados, pero SÍ los discos
  const feedAgregados = feed.filter(it => !esItemCancionMusica(it) && !String(it.id || '').startsWith('sp_rec_') && it.subcategoria !== 'Canciones' && (typeof esActividadAmigoReciente === 'function' ? esActividadAmigoReciente(it) : true));

  if (!feedAgregados.length) {
    contenedor.innerHTML = `
      <div style="background:rgba(15,23,42,0.4);border:1px dashed var(--border);border-radius:3px;padding:20px;text-align:center;color:var(--muted);font-size:0.85rem;">
        <span style="display:block;margin-bottom:6px;">${getHeroIcon('users', '', 28)}</span>
        ${l === 'en' ? 'No recent activity from friends.' : 'Aún no hay actividad reciente de tus amigos en estos días.'}
        <div style="margin-top:10px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button type="button" class="btn-today-pill" style="height:32px;padding:0 12px;font-size:0.78rem;" onclick="abrirVistaAmigos()">
            ${getHeroIcon('users', '', 14)} ${l === 'en' ? 'Manage Friends' : 'Buscar Amigos'}
          </button>
          <button type="button" class="btn-today-pill" style="height:32px;padding:0 12px;font-size:0.78rem;" onclick="copiarMiIdUsuario()">
            ${getHeroIcon('clipboard-document', '', 14)} ${l === 'en' ? 'Copy My ID' : 'Copiar mi ID'}
          </button>
        </div>
      </div>
    `;
    return;
  }

  const itemsSemana = feedAgregados.slice(0, 15);

  const catIcons = { Peliculas: getHeroIcon('film'), Series: getHeroIcon('tv'), Musica: getHeroIcon('musical-note'), Juegos: getHeroIcon('gamepad'), Lecturas: getHeroIcon('book-open') };

  let html = `<div class="home-friend-feed-scroll">`;
  itemsSemana.forEach(it => {
    const frase = generarFraseActividadAmigo(it, l);
    const timeStr = formatearTiempoRelativoFeed(it.createdAt || it.fechaFin || it.fechaInicio, l);
    const enProg = esEnProgresoTexto(it.fechaFin);
    const avatarHtml = (it.amigoAvatar && (it.amigoAvatar.startsWith('http') || it.amigoAvatar.startsWith('data:')))
      ? `<img loading="lazy" decoding="async" src="${escHtmlFeed_(it.amigoAvatar)}" style="width:100%;height:100%;object-fit:cover;">`
      : `<span>${escHtmlFeed_(it.amigoAvatar || '🦊')}</span>`;
    const catNom = I18N[l]?.cats?.[it.categoria] || it.categoria || '';
    const subNom = I18N[l]?.subs?.[it.subcategoria] || it.subcategoria || '';
    const catIcon = catIcons[it.categoria] || getHeroIcon('sparkles', '', 16);

    const posterHtml = it.poster
      ? `<img src="${escHtmlFeed_(it.poster)}" loading="lazy" alt="${escHtmlFeed_(it.titulo)}" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='grid';"><div class="feed-poster-placeholder" style="width:100%;height:100%;display:none;place-items:center;font-size:1.6rem;background:var(--bg);">${catIcon}</div>`
      : `<div class="feed-poster-placeholder" style="width:100%;height:100%;display:grid;place-items:center;font-size:1.6rem;background:var(--bg);">${catIcon}</div>`;

    const califNum = Number(it.calificacion) || 0;
    let secondBadge = '';
    if (enProg) {
      secondBadge = `<span class="feed-status-inprog"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;opacity:0.9;"></span><span>${obtenerTextoEnProgreso(it.categoria, it.subcategoria)}</span></span>`;
    } else if (califNum > 0) {
      secondBadge = `
        <div style="display:inline-flex;align-items:center;background:var(--bg);border:1px solid var(--border);padding:2px 7px;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,0.06);font-size:0.75rem;">
          ${renderEstrellasVisuales(califNum)}
        </div>
      `;
    }

    const horasLimpia = (typeof limpiarTextoHoras === 'function') ? limpiarTextoHoras(it.horas) : '';
    const metaPartes = [];
    if (it.creador && String(it.creador).trim()) metaPartes.push(escHtmlFeed_(it.creador));
    if (it.anio && String(it.anio).trim()) metaPartes.push(`(${escHtmlFeed_(it.anio)})`);
    if (horasLimpia) metaPartes.push(`${getHeroIcon('clock', '', 11)} ${horasLimpia}`);
    const metaTxt = metaPartes.join(' · ');

    const isLiked = esResenaLikeada(it.id);
    const likeCount = obtenerConteoLikesResena(it.id, it.userEmail, it.likes);
    const likeBtnHtml = `
      <button type="button" class="btn-like-resena ${isLiked ? 'liked' : ''}" data-like-id="${it.id}" onclick="event.stopPropagation(); toggleLikeResenaAmigo('${it.id}', '${escHtmlFeed_(it.userEmail)}', this)" style="background:transparent;border:none;padding:0 4px;font-size:1.15rem;cursor:pointer;display:inline-flex;align-items:center;gap:4px;line-height:1;" title="${isLiked ? (l === 'en' ? 'Unlike review' : 'Ya no me gusta') : (l === 'en' ? 'Like review' : 'Me gusta la reseña')}">
        <span class="like-heart-icon">${isLiked ? getHeroIcon('heart', 'active-liked', 16) : getHeroIcon('heart', '', 16)}</span>
        <span class="like-counter" style="font-size:0.75rem;font-weight:700;color:var(--muted);">${likeCount > 0 ? likeCount : ''}</span>
      </button>
    `;

    const actPayload = encodeURIComponent(JSON.stringify({
      amigo: it.amigoNickname || it.amigoNick || (it.userEmail ? it.userEmail.split('@')[0] : 'Amigo'),
      amigoAvatar: it.amigoAvatar || '🦊',
      amigoEmail: it.userEmail || '',
      tipo: it.tipo || ((it.fechaFin && !esEnProgresoTexto(it.fechaFin)) || it.calificacion ? 'visto' : 'pendiente'),
      cat: it.categoria || 'Peliculas',
      sub: it.subcategoria || '',
      titulo: it.titulo || '',
      subtitulo: it.subtitulo || '',
      creador: it.creador || '',
      anio: it.anio || '',
      poster: it.poster || '',
      calificacion: it.calificacion || '',
      comentario: it.comentario || '',
      fechaInicio: it.fechaInicio || '',
      fechaFin: it.fechaFin || '',
      horas: it.horas || ''
    }));

    const reviewHtml = (it.comentario && it.comentario.trim() !== '')
      ? `
        <div class="feed-review-box" data-act="${actPayload}" onclick="event.stopPropagation(); abrirModalDetalleActividadAmigo(this)" style="cursor:pointer;" title="${l === 'en' ? 'View record details' : 'Ver detalle del registro'}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:6px;">
            <div class="feed-review-title" style="font-size:0.75rem;font-weight:800;color:var(--accent);display:flex;align-items:center;gap:5px;"><span>${getHeroIcon('chat-bubble-bottom-center-text', '', 13)}</span> <span>${l === 'en' ? 'Comment' : 'Comentario'}</span></div>
            ${likeBtnHtml}
          </div>
          <div class="feed-review-text">"${escHtmlFeed_(it.comentario)}"</div>
        </div>
      `
      : '';

    const yaTengoEsteProducto = usuarioYaTieneObra(it);
    const itemPayload = encodeURIComponent(JSON.stringify({
      titulo: it.titulo,
      tituloOriginal: it.titulo,
      creador: it.creador,
      anio: it.anio,
      categoria: it.categoria,
      subcategoria: it.subcategoria,
      poster: it.poster
    }));
    const btnWatchlistTopRight = !yaTengoEsteProducto ? `
      <button type="button" class="btn-today-pill" style="width:30px;min-width:30px;height:30px;padding:0;margin:0;flex-shrink:0;border-radius:2px;display:inline-flex;align-items:center;justify-content:center;background:var(--bg);border:1px solid var(--border);color:var(--accent);font-size:0.92rem;cursor:pointer;box-sizing:border-box;box-shadow:0 1px 3px rgba(0,0,0,0.06);transition:var(--tr);" onclick="event.stopPropagation(); agregarFeedItemDirectoDesdeHome(this, '${itemPayload}')" title="${l === 'en' ? 'Add to Watchlist' : 'Agregar a Watchlist'}">
        <span>${getHeroIcon("bookmark", "", 14)}</span>
      </button>
    ` : '';

    const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(it.categoria, it.subcategoria) : null;
    const catBadgeClass = metaCol ? `cat-badge-${metaCol.key}` : '';
    const catBadgeText = `${catIcon} ${subNom || catNom}${it.esRewatch ? ' · Rewatch' : ''}`;

    html += `
      <div class="amigo-feed-card home-friend-card" onclick="abrirModalRegistrosAmigo('${escHtmlFeed_(it.userEmail)}', '${escHtmlFeed_(it.amigoNickname)}', '${escHtmlFeed_(it.categoria)}')">
        <div class="feed-card-header">
          <div class="feed-card-user-info">
            <div class="feed-user-avatar friend-avatar-wrap" data-avatar-zoom="${it.amigoAvatar || '🦊'}" data-avatar-name="${escHtmlFeed_(it.amigoNickname)}" onclick="event.stopPropagation(); verPerfilDeAmigo('${it.userEmail}')" title="${l === 'en' ? 'View Profile' : 'Ver Perfil'}">
              ${avatarHtml}
            </div>
            <div style="min-width:0;flex:1;">
              <div class="feed-card-phrase">${frase}</div>
              <div class="feed-card-time">
                <span>${getHeroIcon('clock', '', 11)} ${timeStr}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="feed-card-body">
          <div class="feed-card-poster-wrap">
            ${posterHtml}
          </div>
          <div class="feed-card-info">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span class="feed-cat-badge ${catBadgeClass}">${catBadgeText}</span>
                ${secondBadge}
              </div>
              ${btnWatchlistTopRight}
            </div>
            <div class="feed-card-title">${escHtmlFeed_(it.titulo)}</div>
            ${it.subtitulo && it.subtitulo !== it.titulo ? `<div style="font-size:0.78rem;color:var(--muted);font-style:italic;margin-top:-2px;margin-bottom:3px;">${escHtmlFeed_(it.subtitulo)}</div>` : ''}
            ${metaTxt ? `<div class="feed-card-meta" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;font-size:0.79rem;color:var(--muted);margin-bottom:6px;">${metaTxt}</div>` : ''}
            ${reviewHtml}
          </div>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  contenedor.innerHTML = html;
  renderizarUltimasCancionesAmigosInicio();
}

function agregarFeedItemDirectoDesdeHome(btnEl, payloadEnc) {
  try {
    const item = JSON.parse(decodeURIComponent(payloadEnc));
    if (btnEl) {
      btnEl.classList.add('added');
      btnEl.innerHTML = `<span>${getHeroIcon('check', '', 14)}</span>`;
      btnEl.style.color = '#10b981';
      btnEl.style.borderColor = 'rgba(16,185,129,0.4)';
      btnEl.disabled = true;
    }
    agregarAWatchlistDirecto(item, btnEl);
  } catch (err) {
    console.error('Error al agregar desde feed home:', err);
  }
}

window.renderizarFeedAmigosResumidoInicio = renderizarFeedAmigosResumidoInicio;
window.agregarFeedItemDirectoDesdeHome = agregarFeedItemDirectoDesdeHome;

function renderizarListaSolicitudes(solicitudes) {
  const seccion = document.getElementById('seccion-solicitudes-pendientes');
  const countEl = document.getElementById('count-solicitudes-amigos');
  const contenedor = document.getElementById('lista-solicitudes-amigos');
  countEl.textContent = solicitudes.length;
  if (!solicitudes.length) { seccion.style.display = 'none'; return; }
  seccion.style.display = 'block';
  contenedor.innerHTML = solicitudes.map(s => `
    <div class="fav-slot-card" style="justify-content:space-between;padding:12px 16px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:42px;height:42px;border-radius:50%;border:2px solid var(--accent);overflow:hidden;background:var(--bg);display:grid;place-items:center;font-size:1.3rem;">
          ${s.avatar && (s.avatar.startsWith('http') || s.avatar.startsWith('data:')) ? `<img loading="lazy" decoding="async" src="${s.avatar}" style="width:100%;height:100%;object-fit:cover;">` : `<span>${s.avatar || '🦊'}</span>`}
        </div>
        <div>
          <strong style="font-size:0.95rem;color:var(--text);display:block;">${s.nickname}</strong>
          <span style="font-size:0.75rem;color:var(--accent);font-weight:700;">${getHeroIcon('identification', '', 12)} ${s.userId || 'ID'}</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button type="button" class="btn-save" style="padding:6px 14px;min-height:36px;font-size:0.8rem;" onclick="responderSolicitudAmistad('${s.email}', true)">Aceptar</button>
        <button type="button" class="btn-modal-cancel" style="padding:6px 12px;font-size:0.8rem;" onclick="responderSolicitudAmistad('${s.email}', false)">Rechazar</button>
      </div>
    </div>
  `).join('');
}
function renderizarListaAmigos(amigos) {
  const countEl = document.getElementById('count-mis-amigos');
  const contenedor = document.getElementById('lista-mis-amigos');
  const l = userPrefs.lang || 'es';
  if (countEl) countEl.textContent = amigos.length;
  if (!amigos.length) {
    contenedor.innerHTML = `<div style="color:var(--muted);font-size:0.88rem;padding:20px 0;text-align:center;">${l === 'en' ? 'You have no friends added yet. Share your ID so they can add you!' : 'No tienes amigos agregados aún. ¡Comparte tu ID para que te agreguen!'}</div>`;
    return;
  }
  contenedor.innerHTML = amigos.map(a => {
    const isImg = a.avatar && (a.avatar.startsWith('http') || a.avatar.startsWith('data:'));
    const avatarHtml = isImg
      ? `<img loading="lazy" decoding="async" src="${a.avatar}" alt="${a.nickname}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
      : `<span>${a.avatar || '🦊'}</span>`;

    const totalRegs = a.stats ? (a.stats.total || 0) : 0;
    const avgRating = a.stats && a.stats.promedio ? a.stats.promedio : '-';
    const emailEscaped = (a.email || '').replace(/'/g, "\\'");
    const nickEscaped = (a.nickname || '').replace(/'/g, "\\'");
    let coverId = String(a.portada || 'predeterminada').trim().toLowerCase();
    if (coverId.startsWith('cover-')) coverId = coverId.replace(/^cover-/, '');
    const hasCustomCover = !!(coverId && coverId !== 'predeterminada');
    const coverClass = hasCustomCover ? `cover-${coverId} has-custom-cover` : '';

    return `
      <div class="amigo-wide-card ${coverClass}" style="${hasCustomCover ? '' : 'background:var(--card); border:1px solid var(--border);'} border-radius:14px; padding:16px; display:flex; flex-direction:column; gap:12px; transition:var(--tr); box-shadow:0 2px 8px rgba(0,0,0,0.06); position:relative; overflow:hidden;">
        <!-- Fila superior: Foto + Nickname interactivo + Bio a la izquierda; Calificación promedio en la esquina superior derecha -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; position:relative; z-index:2;">
          <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
            <!-- Foto de perfil interactiva -->
            <div class="friend-avatar-wrap" data-avatar-zoom="${a.avatar || '🦊'}" data-avatar-name="${nickEscaped}" onclick="verPerfilDeAmigo('${emailEscaped}')" style="width:52px; height:52px; border-radius:50%; border:2px solid var(--accent); overflow:hidden; background:var(--bg); display:grid; place-items:center; font-size:1.6rem; flex-shrink:0; cursor:pointer;" title="${l === 'en' ? 'View profile' : 'Ver perfil'}">
              ${avatarHtml}
            </div>
            <!-- Nickname interactivo (más grande, sin ID) y Bio -->
            <div style="min-width:0; flex:1;">
              <div class="amigo-card-nick" style="font-size:1.15rem; font-weight:800; color:var(--text); cursor:pointer; text-decoration:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.25;" onclick="verPerfilDeAmigo('${emailEscaped}')" title="${l === 'en' ? 'View profile' : 'Ver perfil'}">${a.nickname}</div>
              <div class="amigo-card-bio" style="font-size:0.8rem; color:var(--muted); margin-top:3px; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${a.bio || (l === 'en' ? 'Collecting stories on Mediary' : 'Coleccionando historias en Mediary')}</div>
            </div>
          </div>

          <!-- Calificación promedio en la esquina superior derecha -->
          <div class="amigo-card-avg-badge" style="background:var(--bg); border:1px solid var(--border); border-radius:2px; padding:4px 10px; font-size:0.82rem; display:inline-flex; align-items:center; gap:5px; flex-shrink:0; box-shadow:0 1px 3px rgba(0,0,0,0.06);" title="${l === 'en' ? 'Average Rating' : 'Calificación Promedio'}">
            <span class="amigo-card-avg-star" style="font-size:0.95rem; line-height:1;">${getHeroIcon('star', '', 14)}</span>
            <span class="amigo-card-avg-val" style="font-weight:800; line-height:1;">${avgRating}</span>
          </div>
        </div>

        <!-- Botón intermedio: "Ver Registros (N)" -->
        <button type="button" class="btn-today-pill amigo-card-regs-btn" style="height:36px; padding:0 14px; font-size:0.82rem; margin:0; background:var(--bg); border:1px solid var(--border); color:var(--text); border-radius:2px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; font-weight:700; width:100%; transition:var(--tr); box-sizing:border-box; position:relative; z-index:2;" onclick="abrirModalRegistrosAmigo('${emailEscaped}', '${nickEscaped}')" title="${l === 'en' ? 'View friend records' : 'Ver registros de ' + nickEscaped}">
          <span>${getHeroIcon('book-open', '', 16)}</span>
          <span>${l === 'en' ? `View Records (${totalRegs})` : `Ver Registros (${totalRegs})`}</span>
        </button>

        <!-- Botón inferior: "Mezclar Watchlists" con colores de acento claros y alta legibilidad -->
        <button type="button" class="ruleta-btn-girar-banner" style="height:38px; padding:0 14px; font-size:0.82rem; margin:0; width:100%; border-radius:3px; display:inline-flex; align-items:center; justify-content:center; gap:8px; font-weight:700; background:var(--accent); color:var(--accent-contrast); border:none; box-shadow:0 2px 8px rgba(var(--accent-rgb),0.25); cursor:pointer; box-sizing:border-box; position:relative; z-index:2;" onclick="abrirModalRuleta('Peliculas', '${emailEscaped}')" title="${l === 'en' ? 'Mix Watchlists with ' + nickEscaped : 'Mezclar Watchlists con ' + nickEscaped}">
          <span>${getHeroIcon('film', '', 16)}</span>
          <span>${l === 'en' ? 'Mix Watchlists' : 'Mezclar Watchlists'}</span>
          <span>${getHeroIcon('arrow-path-rounded-square', '', 16)}</span>
        </button>
      </div>
    `;
  }).join('');
}
function enviarSolicitudAmistadPorId() {
  const idInput = document.getElementById('input-buscar-amigo-id').value.trim();
  const feedback = document.getElementById('msg-buscar-amigo-feedback');
  feedback.style.display = 'none';
  if (!estado.userEmail) { abrirModalAuthSupabase('login'); return; }
  if (!idInput) {
    feedback.textContent = tLang('Por favor ingresa el ID del usuario.', 'Please enter the user ID.');
    feedback.style.background = 'rgba(239,68,68,0.15)';
    feedback.style.color = '#f87171';
    feedback.style.display = 'block';
    return;
  }
  feedback.textContent = tLang('Buscando usuario y enviando solicitud...', 'Searching user and sending request...');
  feedback.style.background = 'rgba(56,189,248,0.12)';
  feedback.style.color = 'var(--accent)';
  feedback.style.display = 'block';
  google.script.run.withSuccessHandler(res => {
    if (res && res.exito) {
      feedback.textContent = res.mensaje || tLang('¡Solicitud enviada con éxito!', 'Friend request sent successfully!');
      feedback.style.background = 'rgba(16,185,129,0.15)';
      feedback.style.color = '#34d399';
      document.getElementById('input-buscar-amigo-id').value = '';
      cargarAmigosYSolicitudes();
    } else {
      feedback.textContent = res?.error || tLang('No se encontró ningún usuario con ese ID.', 'No user found with that ID.');
      feedback.style.background = 'rgba(239,68,68,0.15)';
      feedback.style.color = '#f87171';
    }
  }).enviarSolicitudAmistad(estado.userEmail, idInput);
}
function responderSolicitudAmistad(emailAmigo, aceptar) {
  google.script.run.withSuccessHandler(res => {
    if (res && res.exito) {
      mostrarToastPersonalizado(userPrefs.lang === 'en' ? (aceptar ? 'Request accepted! You are now friends' : 'Request declined.') : (aceptar ? '¡Solicitud aceptada! Ahora son amigos' : 'Solicitud rechazada.'));
      cargarAmigosYSolicitudes();
    } else {
      mostrarToastPersonalizado(res?.error || (userPrefs.lang === 'en' ? 'Error processing request' : 'Error al procesar solicitud'));
    }
  }).procesarRespuestaSolicitud(estado.userEmail, emailAmigo, aceptar);
}
function verPerfilDeAmigo(emailAmigo) {
  const l = userPrefs.lang || 'es';
  if (!emailAmigo) {
    mostrarToastPersonalizado(l === 'en' ? 'Friend not found.' : 'Amigo no encontrado.');
    return;
  }
  google.script.run.withSuccessHandler(res => {
    if (!res || !res.exito) {
      return mostrarToastPersonalizado(res?.error || (l === 'en' ? 'Could not load friend profile.' : 'No se pudo cargar el perfil del amigo.'));
    }
    amigoSeleccionadoActual = res.amigo;
    const a = res.amigo;
    const avEl = document.getElementById('amigo-modal-avatar');
    if (avEl) {
      avEl.setAttribute('data-avatar-zoom', a.avatar || '🦊');
      avEl.setAttribute('data-avatar-name', a.nickname || tLang('Amigo', 'Friend'));
      avEl.title = l === 'en' ? 'Hold down to view enlarged photo' : 'Mantén presionado para ver foto en grande';
      if (a.avatar && (a.avatar.startsWith('http') || a.avatar.startsWith('data:'))) {
        avEl.innerHTML = `<img loading="lazy" decoding="async" src="${a.avatar}" style="width:100%;height:100%;object-fit:cover;">`;
      } else {
        avEl.innerHTML = `<span>${a.avatar || '🦊'}</span>`;
      }
    }
    document.getElementById('amigo-modal-nick').textContent = a.nickname;
    document.getElementById('amigo-modal-bio').textContent = a.bio || (l === 'en' ? 'Collecting stories in Mediary' : 'Coleccionando historias en Mediary');
    const idTxtEl = document.getElementById('amigo-modal-id-txt');
    if (idTxtEl) {
      idTxtEl.textContent = a.userId || 'ID';
    } else {
      const idBadgeEl = document.getElementById('amigo-modal-id-badge');
      if (idBadgeEl) idBadgeEl.innerHTML = `${getHeroIcon('identification', '', 14)} <span>${a.userId || 'ID'}</span>`;
    }
    const amHero = document.getElementById('amigo-modal-hero-card');
    if (amHero) {
      PORTADAS_DISPONIBLES.forEach(p => amHero.classList.remove(`cover-${p.id}`));
      amHero.classList.remove('has-custom-cover');
      const coverAmigo = a.portada || 'predeterminada';
      if (coverAmigo && coverAmigo !== 'predeterminada') {
        amHero.classList.add(`cover-${coverAmigo}`, 'has-custom-cover');
      } else {
        amHero.classList.add('cover-predeterminada');
      }
    }
    // Canción favorita del amigo
    const amSongBox = document.getElementById('amigo-modal-song-container');
    if (amSongBox) {
      if (a.cancionFavorita && a.cancionFavorita.titulo) {
        const s = a.cancionFavorita;
        const tPlayPreview = l === 'en' ? 'Play audio preview' : 'Reproducir muestra';
        amSongBox.innerHTML = `
          <div class="home-clean-section-header" style="margin:4px 0 8px;">
            <div class="home-clean-title">
              <span class="emoji-dyn"><svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:#10b981;"><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg></span>
              <span>${l === 'en' ? 'Favorite Song' : 'Canción Favorita'}</span>
            </div>
          </div>
          <div class="profile-fav-song-card" style="margin-bottom:0;">
            <div class="fav-song-main-row" style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:4px 0 8px 0;">
              <div style="display:flex; align-items:center; gap:14px; min-width:0; flex:1;">
                <div class="fav-song-cover-box" style="width:54px; height:54px; min-width:54px; max-width:54px; border-radius:8px; overflow:hidden; border:2px solid #10b981; box-shadow:0 0 12px rgba(16,185,129,0.25); position:relative; flex-shrink:0; background:var(--bg);">
                  <img loading="lazy" decoding="async" src="${escHtmlFeed_(typeof optimizarUrlPoster === 'function' ? optimizarUrlPoster(s.poster || '', 'thumb') : (s.poster || ''))}" alt="${escHtmlFeed_(s.titulo)}" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.onerror=null;this.parentElement.innerHTML='🎵';">
                  ${s.previewUrl ? `
                    <button type="button" class="btn-play-song-badge" onclick="event.stopPropagation(); toggleReproducirMuestraCancion('${s.previewUrl}', this)" title="${tPlayPreview}" aria-label="${tPlayPreview}" style="position:absolute; inset:0; margin:auto; width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,0.65); border:1.5px solid #10b981; color:#fff; display:grid; place-items:center; cursor:pointer; backdrop-filter:blur(3px);">
                      <svg class="icon-play-state" viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;margin-left:2px;"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  ` : ''}
                </div>
                <div class="fav-song-text-block" style="flex:1; min-width:0;">
                  <h4 class="fav-song-title-txt" style="font-size:1rem; font-weight:800; color:var(--text); line-height:1.25; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:0;" title="${s.titulo}">${s.titulo}</h4>
                  <div class="fav-song-artist-txt" style="font-size:0.8rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:3px;" title="${s.artista || ''}">
                    <span style="opacity:0.75;">${l === 'en' ? 'By:' : 'De:'}</span> <strong>${s.artista || ''}</strong>
                    ${s.album ? ` · <span style="opacity:0.8;">${s.album}</span>` : ''}
                  </div>
                  ${s.previewUrl ? `
                    <div style="font-size:0.72rem; color:#10b981; display:flex; align-items:center; gap:4px; margin-top:3px; font-weight:600;">
                      <svg class="h-icon" viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px;"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                      <span>${l === 'en' ? 'Audio sample (30s)' : 'Muestra de audio (30s)'}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
              ${s.previewUrl ? `
                <div class="fav-song-actions-wrap" style="flex-shrink:0;">
                  <button type="button" class="btn-song-action-icon btn-song-play-main" onclick="toggleReproducirMuestraCancion('${s.previewUrl}', this)" title="${tPlayPreview}" aria-label="${tPlayPreview}">
                    <svg class="icon-play-state" viewBox="0 0 24 24" fill="currentColor" style="width:15px;height:15px;color:#10b981;"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        `;
        amSongBox.style.display = 'block';
      } else {
        amSongBox.innerHTML = '';
        amSongBox.style.display = 'none';
      }
    }
    const amCharBox = document.getElementById('amigo-modal-character-container');
    if (amCharBox) {
      if (a.personajeFavorito && a.personajeFavorito.nombre) {
        const c = a.personajeFavorito;
        const esImg = c.imagen && (c.imagen.startsWith('http') || c.imagen.startsWith('data:'));
        amCharBox.innerHTML = `
          <div class="home-clean-section-header" style="margin:4px 0 8px;">
            <div class="home-clean-title">
              <span class="emoji-dyn"><svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 18.75h-9m9 0a3 3 0 0 1 3-3h1.5a1.5 1.5 0 0 0 1.5-1.5v-1.125c0-.828-.672-1.5-1.5-1.5H18m-1.5 7.125v1.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5v-1.5m0 0a3 3 0 0 1-3-3H4.5A1.5 1.5 0 0 1 3 13.125V12c0-.828.672-1.5 1.5-1.5H6m10.5 8.25H7.5m9-8.25V4.875A1.875 1.875 0 0 0 14.625 3H9.375A1.875 1.875 0 0 0 7.5 4.875V10.5a4.5 4.5 0 0 0 9 0Z"/></svg></span>
              <span>${l === 'en' ? 'Favorite Character' : 'Personaje Favorito'}</span>
            </div>
          </div>
          <div class="profile-fav-char-card" style="margin-bottom:0;">
            <div class="fav-char-main-row">
              <div class="fav-char-avatar-box">
                ${esImg ? `<img loading="lazy" decoding="async" src="${escHtmlFeed_(c.imagen)}" alt="${escHtmlFeed_(c.nombre)}" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='inline-flex';"><span style="display:none;" class="emoji-dyn">${getHeroIcon('trophy', '', 20)}</span>` : `<span>${escHtmlFeed_(c.imagen) || getHeroIcon('trophy', '', 20)}</span>`}
              </div>
              <div class="fav-char-text-block">
                <h4 class="fav-char-name-txt" title="${c.nombre}">${c.nombre}</h4>
                <div class="fav-char-work-txt" title="${c.obra || ''}">
                  <span style="opacity:0.75;">${l === 'en' ? 'From:' : 'De:'}</span> <strong>${c.obra || ''}</strong>
                </div>
                ${c.cita ? `<div class="fav-char-quote-txt" title="${c.cita}">“${c.cita}”</div>` : ''}
              </div>
            </div>
          </div>
        `;
        amCharBox.style.display = 'block';
      } else {
        amCharBox.innerHTML = '';
        amCharBox.style.display = 'none';
      }
    }
    // Métricas del amigo
    const totalRegs = res.metricas?.total || 0;
    document.getElementById('amigo-stat-total').textContent = totalRegs;
    document.getElementById('amigo-stat-promedio').innerHTML = `${getHeroIcon('star', '', 14)} ${(res.metricas?.promedio || 0).toFixed(1)}`;
    document.getElementById('amigo-stat-horas').textContent = `${res.metricas?.horasJuegos || 0} hrs`;
    const elAmigoWatched = document.getElementById('amigo-stat-watched-horas');
    if (elAmigoWatched) elAmigoWatched.textContent = `${res.metricas?.horasVistas || 0} hrs`;

    // Actualizar texto del botón Ver Registros con el conteo
    const txtRegsBtn = document.getElementById('txt-ver-regs-amigo-btn');
    if (txtRegsBtn) {
      txtRegsBtn.textContent = l === 'en' ? `View Records (${totalRegs})` : `Ver Registros (${totalRegs})`;
    }

    // Favoritos del amigo (excluyendo portada y personaje favorito)
    const favGrid = document.getElementById('amigo-grid-favoritos');
    const favs = a.favoritos || {};
    const favKeys = Object.keys(favs).filter(k => k && k.includes('__') && k !== 'portada' && k !== 'personajeFavorito' && favs[k] && typeof favs[k] === 'object' && favs[k].titulo);
    if (!favKeys.length) {
      favGrid.innerHTML = `<div style="color:var(--muted);font-size:0.82rem;text-align:center;padding:12px 0;">${l === 'en' ? 'This friend has not configured their favorite works yet.' : 'Este amigo aún no ha configurado sus obras favoritas.'}</div>`;
    } else {
      favGrid.innerHTML = favKeys.map(k => {
        const item = favs[k];
        const [cat, sub] = k.split('__');
        const subI18n = I18N[l]?.subs?.[sub] || sub;
        const catEmo = CONFIG[cat]?.emoji || getHeroIcon('trophy');
        return `
          <div class="fav-slot-card">
            <div class="fav-slot-poster" title="${item.titulo}">
              ${item.poster ? `<img loading="lazy" decoding="async" src="${item.poster}" alt="${item.titulo}">` : `<span style="font-size:1.3rem;">${catEmo}</span>`}
            </div>
            <div class="fav-slot-info">
              <div class="fav-slot-subcat" title="${subI18n}">${subI18n}</div>
              <div class="fav-slot-title" title="${item.titulo}">${item.titulo}</div>
              <div class="fav-slot-meta">${item.calificacion ? `★ ${Number(item.calificacion).toFixed(1)}` : '&nbsp;'}</div>
            </div>
          </div>
        `;
      }).join('');
    }
    const desgloseBox = document.getElementById('amigo-desglose-categorias');
    if (desgloseBox) {
      if (res.privacidad?.ocultarEstadisticas) {
        desgloseBox.innerHTML = `<div style="color:var(--muted);font-size:0.8rem;font-style:italic;padding:8px 0;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px;"><span>${getHeroIcon('lock-closed', '', 14)}</span> <span>${l === 'en' ? 'This friend has set their statistics to private.' : 'Este amigo ha configurado sus estadísticas como privadas.'}</span></div>`;
      } else {
        const cats = [
          { k: 'Peliculas', n: l === 'en' ? 'Movies' : 'Películas', e: getHeroIcon('film') },
          { k: 'Series', n: 'Series', e: getHeroIcon('tv') },
          { k: 'Musica', n: l === 'en' ? 'Music' : 'Música', e: getHeroIcon('musical-note') },
          { k: 'Juegos', n: l === 'en' ? 'Games' : 'Juegos', e: getHeroIcon('gamepad') },
          { k: 'Lecturas', n: l === 'en' ? 'Books' : 'Lecturas', e: getHeroIcon('book-open') }
        ];
        const desg = res.desglose || {};
        desgloseBox.innerHTML = cats.map(c => {
          const metaCat = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(c.k) : null;
          const d = desg[c.k] || { total: 0, subs: {} };
          const subPills = Object.keys(d.subs).map(s => {
            const nomSubI18n = I18N[l]?.subs?.[s] || s;
            const metaSub = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(c.k, s) : null;
            return `<span class="amigo-sub-pill" style="${metaSub ? `border-color:${metaSub.borderVar}; background:${metaSub.bgVar};` : ''}" onclick="event.stopPropagation(); abrirModalRegistrosAmigo('${a.user_email || a.email}', '${a.nickname}', '${c.k}', '${s.replace(/'/g, "\\'")}')" title="${l === 'en' ? `View records of ${nomSubI18n}` : `Ver registros de ${nomSubI18n}`}">${nomSubI18n}: <strong style="${metaSub ? `color:${metaSub.colorVar};` : ''}">${d.subs[s]}</strong></span>`;
          }).join('');
          return `
            <div class="amigo-cat-stat-card" style="cursor:pointer; ${metaCat ? `border-color:${metaCat.borderVar};` : ''}" onclick="abrirModalRegistrosAmigo('${a.user_email || a.email}', '${a.nickname}', '${c.k}')" title="${l === 'en' ? `View records of ${c.n}` : `Ver registros de ${c.n}`}">
              <div class="amigo-cat-stat-head">
                <span style="display:flex;align-items:center;gap:6px;"><span style="${metaCat ? `color:${metaCat.colorVar};` : ''}">${c.e}</span> <span>${c.n}</span></span>
                <span class="amigo-cat-count-badge" style="${metaCat ? `color:${metaCat.colorVar}; border-color:${metaCat.borderVar}; background:${metaCat.bgVar};` : ''}">${d.total} ${l === 'en' ? 'records' : 'registros'} <span style="font-size:0.68rem;opacity:0.8;">${getHeroIcon('arrow-right', '', 10)}</span></span>
              </div>
              <div class="amigo-sub-pills-wrap">${subPills || `<span style="font-size:0.75rem;color:var(--muted);">${l === 'en' ? 'No records yet' : 'Sin registros aún'}</span>`}</div>
            </div>
          `;
        }).join('');
      }
    }
    const m = document.getElementById('modal-perfil-amigo');
    if (m) m.style.display = 'flex';
  }).obtenerPerfilAmigoCompleto(emailAmigo);
}
window.verPerfilDeAmigo = verPerfilDeAmigo;
function cerrarModalPerfilAmigo() {
  document.getElementById('modal-perfil-amigo').style.display = 'none';
  amigoSeleccionadoActual = null;
  if (_audioMuestraCancionFav && !_audioMuestraCancionFav.paused) {
    _audioMuestraCancionFav.pause();
    _audioMuestraCancionFav = null;
    actualizarTodosIconosPlay(false);
  }
}
function copiarIdAmigoDesdeModal() {
  if (!amigoSeleccionadoActual || !amigoSeleccionadoActual.userId) return;
  copiarTextoAlPortapapeles(amigoSeleccionadoActual.userId);
  const l = userPrefs.lang || 'es';
  mostrarToastPersonalizado(l === 'en' ? 'Friend ID copied to clipboard!' : '¡ID de amigo copiado al portapapeles!');
}
function eliminarAmigoSeleccionado() {
  if (!amigoSeleccionadoActual || !estado.userEmail) return;
  const confMsg = userPrefs.lang === 'en' ? `Remove ${amigoSeleccionadoActual.nickname} from your friends list?` : `¿Eliminar a ${amigoSeleccionadoActual.nickname} de tu lista de amigos?`;
  if (!confirm(confMsg)) return;
  google.script.run.withSuccessHandler(res => {
    cerrarModalPerfilAmigo();
    mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Friend removed.' : 'Amigo eliminado.');
    cargarAmigosYSolicitudes();
  }).procesarRespuestaSolicitud(estado.userEmail, amigoSeleccionadoActual.email, false);
}
let amigoRegistrosCache = [];
let amigoRegsFiltroCat = 'todas';
let amigoRegsFiltroSub = 'todas';
let amigoRegsEmailActual = '';
function abrirModalRegistrosAmigo(email, nickname, catInicial = 'todas', subInicial = 'todas') {
  const amEmail = (email || (amigoSeleccionadoActual ? amigoSeleccionadoActual.email : '') || '').trim();
  amigoRegsEmailActual = amEmail;
  const amFriend = (estado.amigos || []).find(x => (x.email || '').toLowerCase() === amEmail.toLowerCase());
  const amNick = nickname || (amFriend ? amFriend.nickname : (amigoSeleccionadoActual ? amigoSeleccionadoActual.nickname : tLang('Amigo', 'Friend')));
  if (!amEmail) return;
  const l = userPrefs.lang || 'es';
  const modal = document.getElementById('modal-registros-amigo');
  const title = document.getElementById('amigo-regs-modal-title');
  const grid = document.getElementById('amigo-regs-grid');
  const inSearch = document.getElementById('input-buscar-regs-amigo');
  if (title) title.innerHTML = `${getHeroIcon("book-open", "", 20)} <span>${l === 'en' ? `Records of ${amNick}` : `Registros de ${amNick}`}</span>`;
  if (inSearch) {
    inSearch.value = '';
    inSearch.placeholder = l === 'en' ? "Search in this friend's records..." : "Buscar en los registros de este amigo...";
  }
  amigoRegsFiltroCat = catInicial || 'todas';
  amigoRegsFiltroSub = subInicial || 'todas';
  amigoRegistrosCache = [];
  renderizarTabsCategoriasAmigo();
  const subTabs = document.getElementById('amigo-regs-subcat-tabs');
  if (subTabs) {
    subTabs.style.display = 'none';
    subTabs.innerHTML = '';
  }
  if (grid) {
    grid.innerHTML = `<div style="text-align:center;padding:30px 10px;color:var(--muted);"><span class="spinning" style="display:inline-block;margin-bottom:8px;">${getHeroIcon('clock', '', 20)}</span><div>${l === 'en' ? 'Loading records...' : 'Cargando registros...'}</div></div>`;
  }
  if (modal) modal.style.display = 'flex';

  const onExito = res => {
    try {
      if (!res || !res.exito) {
        if (grid) grid.innerHTML = `<div style="color:var(--danger);padding:20px;text-align:center;">${res?.error || (l === 'en' ? 'Error loading records' : 'Error al cargar registros')}</div>`;
        return;
      }
      if (res.privado) {
        if (grid) grid.innerHTML = `<div style="text-align:center;padding:30px 20px;color:var(--muted);"><span style="display:block;margin-bottom:10px;">${getHeroIcon('lock-closed', '', 28)}</span><strong>${l === 'en' ? 'Private Records' : 'Registros Privados'}</strong><div style="font-size:0.85rem;margin-top:4px;">${l === 'en' ? `${amNick} has set their records to private.` : `${amNick} ha configurado sus registros como privados.`}</div></div>`;
        return;
      }
      amigoRegistrosCache = res.registros || [];
      renderizarTabsCategoriasAmigo();
      renderizarTabsSubcategoriasAmigo();
      filtrarRegistrosAmigoModal();
    } catch (e) {
      console.error('Error al procesar registros de amigo:', e);
      if (grid) grid.innerHTML = `<div style="color:var(--danger);padding:20px;text-align:center;">Error: ${e.message}</div>`;
    }
  };

  const onFallo = err => {
    console.error('Error al obtener registros de amigo:', err);
    if (grid) grid.innerHTML = `<div style="color:var(--danger);padding:20px;text-align:center;">${err?.message || err || (l === 'en' ? 'Error loading records' : 'Error al cargar registros')}</div>`;
  };

  if (typeof SERVER_API !== 'undefined' && SERVER_API.obtenerRegistrosAmigo) {
    SERVER_API.obtenerRegistrosAmigo(amEmail).then(onExito).catch(onFallo);
  } else if (window.google?.script?.run) {
    if (window.google.script.run.obtenerRegistrosAmigo) {
      google.script.run.withSuccessHandler(onExito).withFailureHandler(onFallo).obtenerRegistrosAmigo(amEmail);
    } else if (window.google.script.run.obtenerRegistrosDeAmigo) {
      google.script.run.withSuccessHandler(onExito).withFailureHandler(onFallo).obtenerRegistrosDeAmigo(amEmail, 'todas');
    }
  }
}
function renderizarTabsCategoriasAmigo() {
  const tabs = document.getElementById('amigo-regs-cat-tabs');
  if (!tabs) return;
  const l = userPrefs.lang || 'es';
  const hasCache = amigoRegistrosCache && amigoRegistrosCache.length > 0;
  const cats = [
    { id: 'todas', label: l === 'en' ? 'All' : 'Todas', emoji: getHeroIcon('sparkles'), count: amigoRegistrosCache.length },
    { id: 'Peliculas', label: l === 'en' ? 'Movies' : 'Películas', emoji: getHeroIcon('film'), count: amigoRegistrosCache.filter(r => r.categoria === 'Peliculas').length },
    { id: 'Series', label: 'Series', emoji: getHeroIcon('tv'), count: amigoRegistrosCache.filter(r => r.categoria === 'Series').length },
    { id: 'Musica', label: l === 'en' ? 'Music' : 'Música', emoji: getHeroIcon('musical-note'), count: amigoRegistrosCache.filter(r => r.categoria === 'Musica').length },
    { id: 'Juegos', label: l === 'en' ? 'Games' : 'Juegos', emoji: getHeroIcon('gamepad'), count: amigoRegistrosCache.filter(r => r.categoria === 'Juegos').length },
    { id: 'Lecturas', label: l === 'en' ? 'Books' : 'Lecturas', emoji: getHeroIcon('book-open'), count: amigoRegistrosCache.filter(r => r.categoria === 'Lecturas').length }
  ];
  tabs.innerHTML = cats.map(c => `
    <button type="button" class="subtab-btn ${c.id === amigoRegsFiltroCat ? 'active' : ''}" onclick="cambiarFiltroCatAmigo('${c.id}', this)" style="flex-shrink:0;">
      <span class="emoji-dyn">${c.emoji}</span> ${c.label} ${hasCache ? `<span style="opacity:0.75;font-size:0.75rem;font-weight:600;">(${c.count})</span>` : ''}
    </button>
  `).join('');
}
function renderizarTabsSubcategoriasAmigo() {
  const subTabsEl = document.getElementById('amigo-regs-subcat-tabs');
  if (!subTabsEl) return;
  const l = userPrefs.lang || 'es';

  // Si está en "todas", no mostrar subcategorías (solo mostrar todas directamente)
  if (amigoRegsFiltroCat === 'todas') {
    subTabsEl.style.display = 'none';
    subTabsEl.innerHTML = '';
    amigoRegsFiltroSub = 'todas';
    return;
  }

  const pool = amigoRegistrosCache.filter(r => r.categoria === amigoRegsFiltroCat);

  let subList = [];
  if (CONFIG[amigoRegsFiltroCat]) {
    const cfgSubs = (CONFIG[amigoRegsFiltroCat].subs || []).filter(s => !s.esWatchlist);
    cfgSubs.forEach(s => {
      const count = pool.filter(r => r.subcategoria === s.id).length;
      if (count > 0 || pool.length === 0) {
        subList.push({ id: s.id, label: I18N[l]?.subs?.[s.id] || s.nombre, emoji: s.emoji || getHeroIcon('folder'), count });
      }
    });
    const knownIds = new Set(cfgSubs.map(s => s.id));
    const extraSubs = [...new Set(pool.map(r => r.subcategoria).filter(Boolean))].filter(s => !knownIds.has(s));
    extraSubs.forEach(s => {
      const count = pool.filter(r => r.subcategoria === s).length;
      subList.push({ id: s, label: I18N[l]?.subs?.[s] || s, emoji: getHeroIcon('folder'), count });
    });
  }

  if (subList.length === 0) {
    subTabsEl.style.display = 'none';
    subTabsEl.innerHTML = '';
    return;
  }

  if (amigoRegsFiltroSub !== 'todas' && !subList.some(s => s.id === amigoRegsFiltroSub)) {
    amigoRegsFiltroSub = 'todas';
  }

  subTabsEl.style.display = 'flex';
  const todasCount = pool.length;
  let html = `
    <button type="button" class="subtab-btn ${amigoRegsFiltroSub === 'todas' ? 'active' : ''}" onclick="cambiarFiltroSubAmigo('todas', this)" style="flex-shrink:0;font-size:0.8rem;padding:5px 12px;border-radius:3px;">
      <span class="emoji-dyn">${getHeroIcon('star')}</span> ${l === 'en' ? 'All subcategories' : 'Todas las subcategorías'} <span style="opacity:0.75;font-size:0.72rem;font-weight:600;">(${todasCount})</span>
    </button>
  `;
  subList.forEach(s => {
    html += `
      <button type="button" class="subtab-btn ${amigoRegsFiltroSub === s.id ? 'active' : ''}" onclick="cambiarFiltroSubAmigo('${s.id.replace(/'/g, "\\'")}', this)" style="flex-shrink:0;font-size:0.8rem;padding:5px 12px;border-radius:3px;">
        <span class="emoji-dyn">${s.emoji}</span> ${s.label} <span style="opacity:0.75;font-size:0.72rem;font-weight:600;">(${s.count})</span>
      </button>
    `;
  });
  subTabsEl.innerHTML = html;
}
function cambiarFiltroSubAmigo(subId, btnEl) {
  amigoRegsFiltroSub = subId;
  const subTabs = document.getElementById('amigo-regs-subcat-tabs');
  if (subTabs) {
    subTabs.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
  }
  if (btnEl) btnEl.classList.add('active');
  filtrarRegistrosAmigoModal();
}
function cambiarFiltroCatAmigo(catId, btnEl) {
  amigoRegsFiltroCat = catId;
  amigoRegsFiltroSub = 'todas';
  renderizarTabsCategoriasAmigo();
  renderizarTabsSubcategoriasAmigo();
  filtrarRegistrosAmigoModal();
}
function filtrarRegistrosAmigoModal() {
  const l = userPrefs.lang || 'es';
  const grid = document.getElementById('amigo-regs-grid');
  if (!grid) return;
  const q = (document.getElementById('input-buscar-regs-amigo')?.value || '').toLowerCase().trim();

  const parseDateForSort = r => {
    const f = (r.fechaFin && r.fechaFin !== 'Sin fecha' && !esEnProgresoTexto(r.fechaFin)) ? r.fechaFin : (r.fechaInicio && r.fechaInicio !== 'Sin fecha' ? r.fechaInicio : null);
    if (!f) return 0;
    const parts = f.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime() || 0;
    }
    return new Date(f).getTime() || 0;
  };

  let lista = [...amigoRegistrosCache];

  if (q) {
    lista = lista.filter(r => {
      const tit = (r.titulo || '').toLowerCase();
      const cre = (r.creador || '').toLowerCase();
      const sub = (r.subcategoria || '').toLowerCase();
      const com = (r.comentario || '').toLowerCase();
      return tit.includes(q) || cre.includes(q) || sub.includes(q) || com.includes(q);
    });
  }

  if (amigoRegsFiltroCat !== 'todas') {
    lista = lista.filter(r => r.categoria === amigoRegsFiltroCat);
  }

  if (amigoRegsFiltroSub !== 'todas') {
    lista = lista.filter(r => r.subcategoria === amigoRegsFiltroSub);
  }

  if (!lista.length) {
    grid.innerHTML = `
      <div style="text-align:center;padding:36px 14px;color:var(--muted);background:var(--card);border-radius:4px;border:1px dashed var(--border);">
        <span style="display:block;margin-bottom:8px;">${getHeroIcon("magnifying-glass", "", 32)}</span>
        <strong>${l === 'en' ? 'No records match this filter' : 'No se encontraron registros con este filtro'}</strong>
        <div style="font-size:0.82rem;margin-top:4px;">${l === 'en' ? 'Try choosing another tab or clearing the search.' : 'Prueba a seleccionar otra pestaña o borrar la búsqueda.'}</div>
      </div>
    `;
    return;
  }

  const CATEGORIAS_DEFINIDAS = [
    { key: 'Peliculas', nombre: l === 'en' ? 'Movies' : 'Películas', emoji: getHeroIcon('film') },
    { key: 'Series', nombre: 'Series', emoji: getHeroIcon('tv') },
    { key: 'Musica', nombre: l === 'en' ? 'Music' : 'Música', emoji: getHeroIcon('musical-note') },
    { key: 'Juegos', nombre: l === 'en' ? 'Games' : 'Juegos', emoji: getHeroIcon('gamepad') },
    { key: 'Lecturas', nombre: l === 'en' ? 'Books' : 'Lecturas', emoji: getHeroIcon('book-open') }
  ];

  const catsEncontradas = [];
  CATEGORIAS_DEFINIDAS.forEach(c => {
    const itemsCat = lista.filter(r => r.categoria === c.key);
    if (itemsCat.length > 0) {
      catsEncontradas.push({ key: c.key, nombre: c.nombre, emoji: c.emoji, items: itemsCat });
    }
  });

  const knownCatKeys = new Set(CATEGORIAS_DEFINIDAS.map(c => c.key));
  const customCatKeys = [...new Set(lista.map(r => r.categoria).filter(c => c && !knownCatKeys.has(c)))];
  customCatKeys.forEach(k => {
    const itemsCat = lista.filter(r => r.categoria === k);
    catsEncontradas.push({ key: k, nombre: k, emoji: getHeroIcon('folder'), items: itemsCat });
  });

  let fullHtml = '';

  catsEncontradas.forEach(catGroup => {
    const catCfg = CONFIG[catGroup.key];
    const cfgSubs = (catCfg?.subs || []).filter(s => !s.esWatchlist);

    const subGroups = [];
    cfgSubs.forEach(s => {
      const itemsSub = catGroup.items.filter(r => r.subcategoria === s.id);
      if (itemsSub.length > 0) {
        itemsSub.sort((a, b) => {
          const diff = parseDateForSort(b) - parseDateForSort(a);
          return diff !== 0 ? diff : (a.titulo || '').localeCompare(b.titulo || '');
        });
        subGroups.push({ id: s.id, nombre: I18N[l]?.subs?.[s.id] || s.nombre, emoji: s.emoji || getHeroIcon('folder'), items: itemsSub });
      }
    });

    const knownSubIds = new Set(cfgSubs.map(s => s.id));
    const extraSubIds = [...new Set(catGroup.items.map(r => r.subcategoria).filter(s => s && !knownSubIds.has(s)))];
    extraSubIds.forEach(sId => {
      const itemsSub = catGroup.items.filter(r => r.subcategoria === sId);
      if (itemsSub.length > 0) {
        itemsSub.sort((a, b) => {
          const diff = parseDateForSort(b) - parseDateForSort(a);
          return diff !== 0 ? diff : (a.titulo || '').localeCompare(b.titulo || '');
        });
        subGroups.push({ id: sId, nombre: I18N[l]?.subs?.[sId] || sId, emoji: getHeroIcon('folder'), items: itemsSub });
      }
    });

    // Asegurar que ningún registro quede fuera si no tiene subcategoría
    const itemsSinSub = catGroup.items.filter(r => !subGroups.some(g => g.items.includes(r)));
    if (itemsSinSub.length > 0) {
      itemsSinSub.sort((a, b) => {
        const diff = parseDateForSort(b) - parseDateForSort(a);
        return diff !== 0 ? diff : (a.titulo || '').localeCompare(b.titulo || '');
      });
      subGroups.push({ id: 'general', nombre: l === 'en' ? 'General' : 'General', emoji: getHeroIcon('folder'), items: itemsSinSub });
    }

    const metaCat = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(catGroup.key, '') : null;
    const catBadgeStyle = metaCat ? `style="background:${metaCat.bgVar}; color:${metaCat.colorVar}; border-color:${metaCat.borderVar};"` : '';
    const catIconStyle = metaCat ? `style="color:${metaCat.colorVar}; font-size:1.25rem;"` : 'style="font-size:1.25rem;"';

    fullHtml += `
      <div class="amigo-cat-block">
        <div class="amigo-cat-group-header">
          <div class="amigo-cat-group-title">
            <span ${catIconStyle}>${catGroup.emoji}</span>
            <span>${catGroup.nombre}</span>
          </div>
          <span class="amigo-cat-group-badge" ${catBadgeStyle}>
            ${catGroup.items.length} ${catGroup.items.length === 1 ? (l === 'en' ? 'record' : 'registro') : (l === 'en' ? 'records' : 'registros')}
          </span>
        </div>
    `;

    const esDescAmigo = (typeof obtenerOrdenHistorialActual === 'function' ? obtenerOrdenHistorialActual() : 'asc') === 'desc';
    subGroups.forEach(subG => {
      subG.items.sort((a, b) => {
        const tsA = timestampDeFecha(a.fechaFin !== 'Sin fecha' ? a.fechaFin : a.fechaInicio);
        const tsB = timestampDeFecha(b.fechaFin !== 'Sin fecha' ? b.fechaFin : b.fechaInicio);
        return esDescAmigo ? (tsB - tsA) : (tsA - tsB);
      });
      const metaSub = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(catGroup.key, subG.nombre || subG.id) : null;
      const subIconStyle = metaSub ? `style="color:${metaSub.colorVar}; font-size:1rem;"` : 'style="font-size:1rem;"';
      fullHtml += `
        <div class="amigo-subcat-block">
          <div class="amigo-subcat-group-header">
            <div class="amigo-subcat-group-title">
              <span ${subIconStyle}>${subG.emoji}</span>
              <span>${subG.nombre}</span>
            </div>
            <span class="amigo-subcat-group-badge">
              ${subG.items.length} ${subG.items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
      `;

      subG.items.forEach(r => {
        const poster = r.poster || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'72\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>';
        const calif = Number(r.calificacion) || 0;
        const enProg = esEnProgresoTexto(r.fechaFin);
        const starsHtml = enProg
          ? `<span class="badge-en-progreso" style="background:rgba(245,158,11,0.12); color:var(--star-active); font-weight:700; padding:2px 8px; border-radius:2px; font-size:0.75rem; border:1px solid rgba(245,158,11,0.3); white-space:nowrap;display:inline-flex;align-items:center;gap:3px;">${getHeroIcon('clock', '', 12)} ${obtenerTextoEnProgreso(r.categoria, r.subcategoria) || (l === 'en' ? 'In progress' : 'En curso')}</span>`
          : (calif > 0 ? renderEstrellasVisuales(calif) : `<span style="color:var(--muted); font-size:0.78rem;">${l === 'en' ? 'No rating' : 'Sin calificar'}</span>`);
        const subTieneR = (typeof subTieneRango === 'function') ? subTieneRango(r.categoria, r.subcategoria) : false;
        const fI_am = sanitizarFechaFrontend(r.fechaInicio), fF_am = sanitizarFechaFrontend(r.fechaFin);
        const infoI_am = desglosarFechaParaCuadro(fI_am);
        const infoF_am = desglosarFechaParaCuadro(fF_am);
        const cI_am = renderizarCuadroFecha(infoI_am, true, infoF_am ? infoF_am.anio : '');
        const cF_am = renderizarCuadroFecha(infoF_am, true, infoI_am ? infoI_am.anio : '');
        const fechaHtml = subTieneR
          ? (enProg ? `<div class="m-card-dates" title="${fI_am}">${cI_am}<span class="m-date-arrow">➔</span><span class="badge-en-progreso" style="background:rgba(56,189,248,0.12); color:var(--accent); font-weight:700; padding:2px 8px; border-radius:6px; font-size:0.75rem; border:1px solid rgba(56,189,248,0.3); white-space:nowrap;">${l === 'en' ? '🕒 In progress' : '🕒 En curso'}</span></div>` : `<div class="m-card-dates" title="${fI_am} ➔ ${fF_am}">${cI_am}<span class="m-date-arrow">➔</span>${cF_am}</div>`)
          : `<div class="m-card-dates" title="${fI_am}">${cI_am}</div>`;
        const hRegLimpia = (typeof limpiarTextoHoras === 'function') ? limpiarTextoHoras(r.horas) : '';
        const horasHtml = hRegLimpia ? `<div class="m-card-horas" style="font-size:0.75rem; color:var(--accent); font-weight:600;"><span class="emoji-dyn">${getHeroIcon('clock', '', 12)} </span>${hRegLimpia}</div>` : '';
        const rwBadge = r.esRewatch ? `<span class="badge-rewatch"><svg style="width:13px;height:13px;" class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg> ${l === 'en' ? 'Rewatch' : 'Revisita'}</span>` : '';
        const isLiked = (typeof esResenaLikeada === 'function') ? esResenaLikeada(r.id) : false;
        const likeCount = (typeof obtenerConteoLikesResena === 'function') ? obtenerConteoLikesResena(r.id, amigoRegsEmailActual, r.likes) : 0;
        const likeBtnHtml = `
          <button type="button" class="btn-like-resena ${isLiked ? 'liked' : ''}" data-like-id="${r.id}" onclick="event.stopPropagation(); toggleLikeResenaAmigo('${r.id}', '${amigoRegsEmailActual}', this)" style="background:transparent; border:none; padding:0 4px; font-size:1.1rem; cursor:pointer; display:inline-flex; align-items:center; gap:4px; line-height:1;" title="${isLiked ? (l === 'en' ? 'Unlike review' : 'Ya no me gusta') : (l === 'en' ? 'Like review' : 'Me gusta la reseña')}">
            <span class="like-heart-icon">${isLiked ? getHeroIcon('heart', 'active-liked', 16) : getHeroIcon('heart', '', 16)}</span>
            ${likeCount > 0 ? `<span class="like-counter" style="font-size:0.75rem; font-weight:700; color:var(--muted);">${likeCount}</span>` : ''}
          </button>
        `;
        const meta = `(${r.creador || ''}${r.anio ? ', ' + r.anio : ''})`;
        const comHtml = r.comentario ? `
          <div class="feed-review-box" style="margin-top:6px; padding:8px 12px; font-size:0.82rem; border-left:3px solid var(--accent); border-radius:3px 8px 8px 4px;">
            <div style="font-size:0.7rem; font-weight:800; color:var(--accent); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:2px;">
              <span>${getHeroIcon('chat-bubble-bottom-center-text', '', 13)} ${l === 'en' ? 'Comment' : 'Comentario'}</span>
            </div>
            <div style="font-style:italic;">"${r.comentario}"</div>
          </div>
        ` : '';

        fullHtml += `
          <div class="mobile-history-card amigo-reg-item-card" style="margin-bottom:0; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <div class="m-card-top">
              <img class="m-card-thumb" src="${poster}" loading="lazy" alt="${escHtmlFeed_(r.titulo)}" onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'50\\' height=\\'72\\' fill=\\'%23334155\\'><rect width=\\'100%\\' height=\\'100%\\'/></svg>'">
              <div class="m-card-info" style="padding-right:0;">
                <div class="m-card-title">${r.titulo}</div>
                ${r.subtitulo && r.subtitulo !== r.titulo ? `<div style="font-size:0.75rem; color:var(--muted); margin-bottom:2px;">(${r.subtitulo})</div>` : ''}
                <div class="m-card-meta">${meta}</div>
                <div class="m-card-date-row" style="display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:4px;">
                  ${fechaHtml}
                  ${rwBadge}
                  ${horasHtml}
                </div>
              </div>
            </div>
            <div class="m-card-bottom" style="margin-top:2px;">
              <div style="display:flex; align-items:center; gap:6px;">
                ${starsHtml}
              </div>
              ${likeBtnHtml}
            </div>
            ${comHtml}
          </div>
        `;
      });

      fullHtml += `
          </div>
        </div>
      `;
    });

    fullHtml += `
      </div>
    `;
  });

  grid.innerHTML = fullHtml;
}
function cerrarModalRegistrosAmigo() {
  const m = document.getElementById('modal-registros-amigo');
  if (m) m.style.display = 'none';
}

