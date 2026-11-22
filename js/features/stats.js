/* Mediary — js/features/stats.js */
// ========================================================
// === PANEL Y CENTRO DE ESTADÍSTICAS AVANZADAS MEDIARY ===
// ========================================================
var estadoStatsPerfil = { categoria: 'Peliculas', periodo: 'year' };
var estadoStatsModal = {
  periodo: 'year', // 'year' (predeterminado) | 'all'
  categoria: 'General' // 'General' | 'Peliculas' | 'Series' | 'Musica' | 'Juegos' | 'Lecturas'
};


function escHtmlStats_(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function calcularTiempoCuenta() {
  let fechaCreacion = null;

  // 1. Si perfilUsuario tiene created_at
  if (typeof perfilUsuario !== 'undefined' && perfilUsuario) {
    if (perfilUsuario.created_at) {
      const d = new Date(perfilUsuario.created_at);
      if (!isNaN(d.getTime())) fechaCreacion = d;
    }
  }

  // 2. Buscar en registros existentes (r.created_at o fechaFin/fechaInicio)
  const regs = (typeof estado !== 'undefined' && Array.isArray(estado.registros)) ? estado.registros : [];
  let fechaPrimerRegistro = null;
  let fechaMinCreatedAt = null;

  regs.forEach(r => {
    if (r.created_at || r.createdAt) {
      const dC = new Date(r.created_at || r.createdAt);
      if (!isNaN(dC.getTime())) {
        if (!fechaMinCreatedAt || dC < fechaMinCreatedAt) fechaMinCreatedAt = dC;
      }
    }
    const fBase = (r.fechaFin && r.fechaFin !== 'Sin fecha' && !esEnProgresoTexto(r.fechaFin)) ? r.fechaFin : r.fechaInicio;
    const dObj = typeof parsearFechaAObjeto === 'function' ? parsearFechaAObjeto(fBase) : null;
    if (dObj && !isNaN(dObj.getTime())) {
      const yr = dObj.getFullYear();
      if (yr >= 2020 && yr <= (new Date().getFullYear())) {
        if (!fechaPrimerRegistro || dObj < fechaPrimerRegistro) fechaPrimerRegistro = dObj;
      }
    }
  });

  if (!fechaCreacion && fechaMinCreatedAt) {
    fechaCreacion = fechaMinCreatedAt;
  }

  // 3. Revisar localStorage por si se guardó previamente
  const userKey = (typeof estado !== 'undefined' && estado?.userEmail) ? ('mediary_user_created_' + estado.userEmail) : null;
  if (!fechaCreacion && userKey) {
    const saved = localStorage.getItem(userKey);
    if (saved) {
      const d = new Date(saved);
      if (!isNaN(d.getTime())) fechaCreacion = d;
    }
  }

  // 4. Si fechaCreacion dio "hoy" (< 24h) pero el usuario tiene registros guardados previamente
  const hoy = new Date();
  if (fechaCreacion && regs.length > 0) {
    const diffConHoy = hoy.getTime() - fechaCreacion.getTime();
    if (diffConHoy < (24 * 60 * 60 * 1000)) {
      if (fechaMinCreatedAt) {
        fechaCreacion = fechaMinCreatedAt;
      } else if (fechaPrimerRegistro) {
        fechaCreacion = fechaPrimerRegistro;
      }
    }
  }

  // 5. Si sigue sin existir fechaCreacion
  if (!fechaCreacion) {
    fechaCreacion = fechaPrimerRegistro || new Date();
  }

  // Persistir en perfilUsuario para evitar recálculos
  if (userKey && fechaCreacion) {
    try { localStorage.setItem(userKey, fechaCreacion.toISOString()); } catch(e){}
  }
  if (typeof perfilUsuario !== 'undefined' && perfilUsuario && fechaCreacion) {
    perfilUsuario.created_at = fechaCreacion.toISOString();
    if (!perfilUsuario.preferencias) perfilUsuario.preferencias = {};
    perfilUsuario.preferencias.createdAt = fechaCreacion.toISOString();
  }

  const diffMs = Math.max(0, hoy.getTime() - fechaCreacion.getTime());
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias === 0) {
    return regs.length ? tLang('1 día', '1 day') : tLang('Hoy', 'Today');
  }
  if (diffDias < 30) {
    return `${diffDias} ${diffDias === 1 ? tLang('día', 'day') : tLang('días', 'days')}`;
  }
  const meses = Math.floor(diffDias / 30.4375);
  if (meses < 12) {
    return `${meses} ${meses === 1 ? tLang('mes', 'month') : tLang('meses', 'months')}`;
  }
  const anios = Math.floor(meses / 12);
  const remMeses = meses % 12;
  if (remMeses === 0) {
    return `${anios} ${anios === 1 ? tLang('año', 'year') : tLang('años', 'years')}`;
  }
  return `${anios} ${anios === 1 ? tLang('año', 'year') : tLang('años', 'years')} ${tLang('y', 'and')} ${remMeses} ${remMeses === 1 ? tLang('mes', 'month') : tLang('meses', 'months')}`;
}

function obtenerMesesAbrevStats_() {
  return getLang_() === 'en'
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
}

function calcularRachaSeries(regs) {
  const allRegs = regs || (typeof estado !== 'undefined' ? estado.registros : []) || [];
  const setDayIndices = new Set();
  allRegs.forEach(r => {
    if (r && (r.categoria === 'Series' || String(r.categoria || '').toLowerCase().includes('serie'))) {
      if (typeof extraerDayIndicesDeRegistro === 'function') {
        const setR = extraerDayIndicesDeRegistro(r);
        setR.forEach(idx => setDayIndices.add(idx));
      }
    }
  });
  return typeof calcularRachaDesdeDayIndices === 'function'
    ? calcularRachaDesdeDayIndices(setDayIndices)
    : { rachaActual: 0, rachaMasAlta: 0, esActivaHoy: false, totalDias: 0 };
}

function obtenerMejoresCalificados_(lista) {
  if (!Array.isArray(lista) || !lista.length) return [];
  const esRewatch = (r) => {
    if (!r) return false;
    if (r.esRewatch === true || r.es_rewatch === true || r.rewatch === true) return true;
    const sub = String(r.subcategoria || '').toLowerCase();
    if (sub.includes('rewatch') || sub.includes('relectura') || sub.includes('rejugad')) return true;
    return false;
  };
  // Exclusivamente FIRST TIME WATCH (sin rewatches)
  const conCalif = lista.filter(r => Number(r.calificacion) > 0 && !esRewatch(r));
  if (!conCalif.length) return [];

  const maxCal = Math.max(...conCalif.map(r => Number(r.calificacion) || 0));
  const empatados = conCalif.filter(r => (Number(r.calificacion) || 0) === maxCal);

  const vistos = new Set();
  const unicos = [];
  empatados.forEach(it => {
    const k = (it.id || it.titulo || '').toLowerCase().trim();
    if (!vistos.has(k)) {
      vistos.add(k);
      unicos.push(it);
    }
  });
  return unicos;
}

function obtenerMejorCalificado_(lista) {
  const items = obtenerMejoresCalificados_(lista);
  return items.length ? items[0] : null;
}

function renderizarCardMejorCalificado_(itemsInput, labelCat) {
  const lblCatFinal = labelCat || tLang('obras', 'titles');
  const l = getLang_();
  const titMejor = tLang('Mejor Calificado', 'Highest Rated');
  const items = Array.isArray(itemsInput)
    ? itemsInput
    : (itemsInput ? [itemsInput] : []);

  if (!items.length) {
    return `
      <div class="stats-section-box">
        <div class="stats-section-title">
          <span>${getHeroIcon("trophy", "", 16)} ${titMejor}</span>
        </div>
        <div style="color:var(--muted); font-size:0.82rem; text-align:center; padding:14px;">
          ${tLang(`Aún no hay calificaciones registradas para ${lblCatFinal} en este período.`, `No ratings logged for ${lblCatFinal} in this period yet.`)}
        </div>
      </div>
    `;
  }

  const total = items.length;
  if (total === 1) {
    const item = items[0];
    const subDisp = item.subcategoria ? (I18N[l]?.subs?.[item.subcategoria] || item.subcategoria) : '';
    return `
      <div class="stats-section-box">
        <div class="stats-section-title">
          <span>${getHeroIcon("trophy", "", 16)} ${titMejor}</span>
        </div>
        <div class="stats-ranking-row" style="padding:10px 0; align-items:center;">
          <img loading="lazy" decoding="async" src="${escHtmlStats_(item.poster || '')}" onerror="this.src='./icon.png'" style="width:48px; height:68px; border-radius:4px; object-fit:cover; background:var(--card); flex-shrink:0; border:1px solid var(--border);">
          <div style="flex:1; min-width:0; margin-left:12px;">
            <strong style="font-size:0.92rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlStats_(item.titulo)}</strong>
            <span style="font-size:0.76rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; margin-top:2px;">${escHtmlStats_(item.creador || '')} ${item.anio ? `· ${item.anio}` : ''} ${subDisp ? `(${escHtmlStats_(subDisp)})` : ''}</span>
            ${item.comentario ? `<p style="font-size:0.74rem; color:var(--muted); font-style:italic; margin:4px 0 0 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; opacity:0.9;">"${escHtmlStats_(item.comentario)}"</p>` : ''}
          </div>
          <div style="flex-shrink:0; margin-left:10px;">
            <span style="font-size:0.8rem; font-weight:800; color:var(--star-active, #c8955a); background:rgba(200,149,90,0.15); border:1px solid rgba(200,149,90,0.35); padding:4px 9px; border-radius:12px; display:inline-flex; align-items:center; gap:3px;">
              ${getHeroIcon("star", "", 12)} ${Number(item.calificacion).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  // Hay múltiples obras con la mejor calificación: carrusel con transición fluida
  const cid = 'mc-' + Math.random().toString(36).substring(2, 8);
  const slidesHtml = items.map((item, idx) => {
    const subDisp = item.subcategoria ? (I18N[l]?.subs?.[item.subcategoria] || item.subcategoria) : '';
    return `
    <div class="mc-carousel-slide ${idx === 0 ? 'active' : ''}" data-idx="${idx}" style="position:${idx === 0 ? 'relative' : 'absolute'}; top:0; left:0; width:100%; opacity:${idx === 0 ? '1' : '0'}; transform:${idx === 0 ? 'translateX(0)' : 'translateX(16px)'}; pointer-events:${idx === 0 ? 'auto' : 'none'}; transition:opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s cubic-bezier(0.4, 0, 0.2, 1); display:flex; align-items:center; padding:10px 0;">
      <img loading="lazy" decoding="async" src="${escHtmlStats_(item.poster || '')}" onerror="this.src='./icon.png'" style="width:48px; height:68px; border-radius:4px; object-fit:cover; background:var(--card); flex-shrink:0; border:1px solid var(--border);">
      <div style="flex:1; min-width:0; margin-left:12px;">
        <strong style="font-size:0.92rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlStats_(item.titulo)}</strong>
        <span style="font-size:0.76rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; margin-top:2px;">${escHtmlStats_(item.creador || '')} ${item.anio ? `· ${item.anio}` : ''} ${subDisp ? `(${escHtmlStats_(subDisp)})` : ''}</span>
        ${item.comentario ? `<p style="font-size:0.74rem; color:var(--muted); font-style:italic; margin:4px 0 0 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; opacity:0.9;">"${escHtmlStats_(item.comentario)}"</p>` : ''}
      </div>
      <div style="flex-shrink:0; margin-left:10px;">
        <span style="font-size:0.8rem; font-weight:800; color:var(--star-active, #c8955a); background:rgba(200,149,90,0.15); border:1px solid rgba(200,149,90,0.35); padding:4px 9px; border-radius:12px; display:inline-flex; align-items:center; gap:3px;">
          ${getHeroIcon("star", "", 12)} ${Number(item.calificacion).toFixed(1)}
        </span>
      </div>
    </div>
  `;
  }).join('');

  const dotsHtml = items.map((_, idx) => `
    <span class="mc-dot ${idx === 0 ? 'active' : ''}" data-idx="${idx}" style="width:6px; height:6px; border-radius:50%; background:${idx === 0 ? 'var(--accent)' : 'var(--border)'}; display:inline-block; transition:all 0.3s ease; cursor:pointer;" onclick="saltarSlideMejorCalificado('${cid}', ${idx})"></span>
  `).join('');

  return `
    <div class="stats-section-box mc-carousel-container" id="${cid}" data-total="${total}" data-cur="0">
      <div class="stats-section-title">
        <span>${getHeroIcon("trophy", "", 16)} ${titMejor}</span>
        <div style="display:inline-flex; align-items:center; gap:5px; margin-left:auto;">
          <span style="font-size:0.72rem; color:var(--muted); font-weight:600; margin-right:4px;" class="mc-counter">${tLang(`1 de ${total}`, `1 of ${total}`)}</span>
          ${dotsHtml}
        </div>
      </div>
      <div class="mc-slides-wrapper" style="position:relative; width:100%; min-height:88px; overflow:hidden;">
        ${slidesHtml}
      </div>
    </div>
  `;
}

function iniciarCarruselesMejorCalificado() {
  if (window._mcIntervalTimer) clearInterval(window._mcIntervalTimer);
  window._mcIntervalTimer = setInterval(() => {
    if (document.hidden) return;
    const containers = document.querySelectorAll('.mc-carousel-container');
    containers.forEach(cont => {
      const total = parseInt(cont.getAttribute('data-total') || '1', 10);
      if (total <= 1) return;
      let cur = parseInt(cont.getAttribute('data-cur') || '0', 10);
      const next = (cur + 1) % total;
      avanzarSlideMejorCalificado(cont, next);
    });
  }, 4000);
}

function avanzarSlideMejorCalificado(cont, nextIdx) {
  if (!cont) return;
  const slides = cont.querySelectorAll('.mc-carousel-slide');
  const dots = cont.querySelectorAll('.mc-dot');
  const counter = cont.querySelector('.mc-counter');
  const curIdx = parseInt(cont.getAttribute('data-cur') || '0', 10);
  if (curIdx === nextIdx) return;

  slides.forEach((slide, idx) => {
    if (idx === nextIdx) {
      slide.style.position = 'relative';
      slide.style.opacity = '1';
      slide.style.transform = 'translateX(0)';
      slide.style.pointerEvents = 'auto';
      slide.classList.add('active');
    } else {
      slide.style.position = 'absolute';
      slide.style.opacity = '0';
      slide.style.transform = idx < nextIdx ? 'translateX(-16px)' : 'translateX(16px)';
      slide.style.pointerEvents = 'none';
      slide.classList.remove('active');
    }
  });

  dots.forEach((dot, idx) => {
    dot.style.background = idx === nextIdx ? 'var(--accent)' : 'var(--border)';
    dot.style.transform = idx === nextIdx ? 'scale(1.25)' : 'scale(1)';
    dot.classList.toggle('active', idx === nextIdx);
  });

  if (counter) {
    counter.textContent = tLang(`${nextIdx + 1} de ${slides.length}`, `${nextIdx + 1} of ${slides.length}`);
  }

  cont.setAttribute('data-cur', String(nextIdx));
}

function saltarSlideMejorCalificado(cid, targetIdx) {
  const cont = document.getElementById(cid);
  if (cont) avanzarSlideMejorCalificado(cont, targetIdx);
}

function generarGraficoBarras_({ titulo, subtitulo, items, unidad = '', colorBarra = 'var(--accent)' }) {
  const maxVal = Math.max(...items.map(i => Number(i.valor) || 0), 1);
  return `
    <div class="stats-section-box">
      <div class="stats-section-title">
        <span>${titulo}</span>
        ${subtitulo ? `<span style="font-size:0.75rem; color:var(--muted); font-weight:600;">${subtitulo}</span>` : ''}
      </div>
      <div style="overflow-x:auto; padding-bottom:6px; scrollbar-width:none; -webkit-overflow-scrolling:touch;">
        <div style="display:flex; align-items:flex-end; gap:6px; height:130px; padding:22px 6px 0 6px; min-width:${items.length > 7 ? '380px' : '100%'};">
          ${items.map(it => {
            const v = Number(it.valor) || 0;
            const pct = v > 0 ? Math.max(8, Math.round((v / maxVal) * 100)) : 0;
            const isZero = v === 0;
            return `
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end; min-width:22px;">
                <div style="font-size:0.68rem; font-weight:700; color:${isZero ? 'transparent' : 'var(--text)'}; margin-bottom:4px; line-height:1; white-space:nowrap;">
                  ${isZero ? '-' : (typeof it.displayVal !== 'undefined' ? it.displayVal : v)}
                </div>
                <div style="width:100%; max-width:28px; height:${pct}%; background:${isZero ? 'var(--border)' : colorBarra}; border-radius:3px 3px 0 0; transition:height 0.4s ease; opacity:${isZero ? 0.35 : 1};" title="${escHtmlStats_(it.sublabel || `${it.label}: ${v} ${unidad}`)}"></div>
                <div style="font-size:0.72rem; color:var(--muted); margin-top:6px; font-weight:600; white-space:nowrap;">
                  ${it.label}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function obtenerDiasUltimaSemana_() {
  const diasSemana = getLang_() === 'en'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dias = [];
  const hoy = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
    const diaStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const isoStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dias.push({
      date: d,
      diaStr,
      isoStr,
      label: i === 0 ? tLang('Hoy', 'Today') : diasSemana[d.getDay()],
      fullLabel: `${diasSemana[d.getDay()]} ${d.getDate()}`
    });
  }
  return dias;
}

function extraerMinutosDeTiempoLecturaTexto_(txt) {
  if (!txt) return 0;
  if (typeof txt === 'number') return txt;
  const s = String(txt).toLowerCase().trim();
  if (s.includes('min')) {
    const n = parseInt(s);
    return isNaN(n) ? 30 : n;
  }
  if (s.includes('hora') || s.includes('hr') || s.includes('h')) {
    const n = parseFloat(s.replace(',', '.'));
    return isNaN(n) ? 60 : Math.round(n * 60);
  }
  const parsed = parseFloat(s);
  return isNaN(parsed) ? 30 : parsed;
}

function abrirModalEstadisticasAvanzadas(catInicial) {
  if (catInicial) estadoStatsModal.categoria = catInicial;
  if (!estadoStatsModal.periodo) estadoStatsModal.periodo = 'year';
  const modal = document.getElementById('modal-estadisticas-avanzadas');
  if (!modal) return;
  modal.style.display = 'flex';

  const hoy = new Date();
  const yEl = document.getElementById('stats-lbl-cur-year');
  if (yEl) yEl.textContent = hoy.getFullYear();

  actualizarPillsFiltroStats();
  renderizarContenidoEstadisticasAvanzadas();

  // Auto-sincronización con Spotify en segundo plano
  const token = localStorage.getItem('mediary_spotify_token');
  const lastSyncTime = Number(localStorage.getItem('mediary_spotify_last_auto_sync') || 0);
  if (token && (Date.now() - lastSyncTime > 5 * 60 * 1000) && typeof actualizarDatosSpotify === 'function') {
    localStorage.setItem('mediary_spotify_last_auto_sync', String(Date.now()));
    actualizarDatosSpotify(false).then(() => {
      renderizarContenidoEstadisticasAvanzadas();
    }).catch(() => {});
  }

  // Auto-sincronización con Last.fm en segundo plano
  const lastfmConnected = localStorage.getItem('mediary_lastfm_connected') === 'true';
  const lastfmUser = localStorage.getItem('mediary_lastfm_username');
  const lastfmLastSync = Number(localStorage.getItem('mediary_lastfm_last_auto_sync') || 0);
  if (lastfmConnected && lastfmUser && (Date.now() - lastfmLastSync > 5 * 60 * 1000) && typeof sincronizarCuentaLastFm === 'function') {
    localStorage.setItem('mediary_lastfm_last_auto_sync', String(Date.now()));
    sincronizarCuentaLastFm(false).then(() => {
      renderizarContenidoEstadisticasAvanzadas();
    }).catch(() => {});
  }

  // Auto-sincronización con PlayStation en segundo plano
  const psnConnected = localStorage.getItem('mediary_psn_connected') === 'true';
  const psnLastSync = Number(localStorage.getItem('mediary_psn_last_auto_sync') || 0);
  if (psnConnected && (Date.now() - psnLastSync > 5 * 60 * 1000) && typeof sincronizarCuentaPlayStation === 'function') {
    localStorage.setItem('mediary_psn_last_auto_sync', String(Date.now()));
    sincronizarCuentaPlayStation(null, false).then(() => {
      renderizarContenidoEstadisticasAvanzadas();
    }).catch(() => {});
  }
}

function cerrarModalEstadisticasAvanzadas() {
  const modal = document.getElementById('modal-estadisticas-avanzadas');
  if (modal) modal.style.display = 'none';
}

function cambiarPeriodoStats(periodo) {
  estadoStatsModal.periodo = periodo;
  actualizarPillsFiltroStats();
  renderizarContenidoEstadisticasAvanzadas();
}

function cambiarCatStats(cat) {
  estadoStatsModal.categoria = cat;
  actualizarPillsFiltroStats();
  renderizarContenidoEstadisticasAvanzadas();
  if (typeof seleccionarCategoriaStatsPerfil === 'function') {
    seleccionarCategoriaStatsPerfil(cat);
  }
}

function actualizarPillsFiltroStats() {
  const btnYear = document.getElementById('stats-period-btn-year');
  const btnAll = document.getElementById('stats-period-btn-all');
  if (btnYear) btnYear.classList.toggle('active', estadoStatsModal.periodo === 'year');
  if (btnAll) btnAll.classList.toggle('active', estadoStatsModal.periodo === 'all');

  document.querySelectorAll('.stats-cat-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.cat === estadoStatsModal.categoria);
  });
}

function obtenerFechaObjetoStats_(r) {
  if (!r) return null;
  const f = (r.fechaFin && r.fechaFin !== 'Sin fecha' && typeof esEnProgresoTexto === 'function' && !esEnProgresoTexto(r.fechaFin))
    ? r.fechaFin
    : r.fechaInicio;
  return typeof parsearFechaAObjeto === 'function' ? parsearFechaAObjeto(f) : new Date(f);
}

function formatearHorasStats_(h) {
  const num = Number(h) || 0;
  if (num === 0) return '0 hrs';
  if (num < 1) return `${Math.round(num * 60)} min`;
  if (num < 48) return `${num.toFixed(1).replace('.0','')} hrs`;
  const dias = (num / 24).toFixed(1).replace('.0','');
  return `${num.toFixed(1).replace('.0','')} hrs (${dias} d)`;
}

function calcularHorasObraStats_(r, seriesConTemporadas) {
  if (!r) return 0;
  const cat = r.categoria;
  if (cat === 'Peliculas') {
    return (typeof extraerHorasRegistro === 'function' ? extraerHorasRegistro(r) : 0) || 1.8;
  }
  if (cat === 'Series') {
    const isSeason = (r.subcategoria && (r.subcategoria === 'Temporadas' || r.subcategoria.includes('Temporada'))) || /\[S\d+\]/i.test(r.titulo || '');
    const base = (r.tituloBase || (r.titulo || '').replace(/\s*\[S\d+\].*$/, '')).trim().toLowerCase();
    if (isSeason) return (typeof extraerHorasRegistro === 'function' ? extraerHorasRegistro(r) : 0) || 8.0;
    if (seriesConTemporadas && !seriesConTemporadas.has(base)) return (typeof extraerHorasRegistro === 'function' ? extraerHorasRegistro(r) : 0) || 9.0;
    return 0;
  }
  if (cat === 'Musica') {
    const h = typeof extraerHorasRegistro === 'function' ? extraerHorasRegistro(r) : 0;
    if (h > 0) return h;
    const sub = (r.subcategoria || '').toLowerCase();
    if (sub.includes('cancion') || sub.includes('canción')) return 3.5 / 60;
    if (sub.includes('concierto') || sub.includes('festival')) return 1.5;
    if (sub.includes('ep')) return 22 / 60;
    return 45 / 60;
  }
  if (cat === 'Juegos') {
    if (r.horas) {
      const parsed = parseFloat(String(r.horas).replace('hrs','').replace(',','.').trim());
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 12.0;
  }
  if (cat === 'Lecturas') {
    const h = typeof extraerHorasRegistro === 'function' ? extraerHorasRegistro(r) : 0;
    if (h > 0) return h;
    const sub = (r.subcategoria || '').toLowerCase();
    if (sub.includes('cómic') || sub.includes('comic') || sub.includes('manga')) return 1.5;
    return 6.0;
  }
  return 0;
}

function obtenerMetricasMusicaSpotifyStats_(spotifyStats, spotifyAccumulator, nowYear, nowMonth) {
  const yrStr = String(nowYear);
  const moStr = yrStr + '-' + String(nowMonth + 1).padStart(2, '0');

  const acc = spotifyAccumulator || (spotifyStats && spotifyStats.accumulator) || null;

  let horasTotal = 0;
  let countTotal = 0;
  let horasAnio = 0;
  let countAnio = 0;
  let horasMes = 0;
  let countMes = 0;

  if (acc && acc.totalMs) {
    horasTotal = acc.totalMs / 3600000;
    countTotal = acc.totalTracks || 0;
    if (acc.byYear && acc.byYear[yrStr]) {
      horasAnio = acc.byYear[yrStr].ms / 3600000;
      countAnio = acc.byYear[yrStr].count || 0;
    }
    if (acc.byMonth && acc.byMonth[moStr]) {
      horasMes = acc.byMonth[moStr].ms / 3600000;
      countMes = acc.byMonth[moStr].count || 0;
    }
  }

  const fallbackHoras = spotifyStats && spotifyStats.recentHours != null
    ? parseFloat(spotifyStats.recentHours)
    : (spotifyStats && spotifyStats.recentMinutes ? (spotifyStats.recentMinutes / 60) : 0);
  const fallbackCount = spotifyStats && (spotifyStats.recentlyPlayedCount || spotifyStats.topTracks?.length || 0);

  if (horasTotal === 0 && fallbackHoras > 0) horasTotal = fallbackHoras;
  if (horasAnio === 0 && fallbackHoras > 0) horasAnio = fallbackHoras;
  if (horasMes === 0 && fallbackHoras > 0) horasMes = fallbackHoras;
  if (countTotal === 0 && fallbackCount > 0) countTotal = fallbackCount;
  if (countAnio === 0 && fallbackCount > 0) countAnio = fallbackCount;
  if (countMes === 0 && fallbackCount > 0) countMes = fallbackCount;

  return {
    horasTotal,
    countTotal,
    horasAnio,
    countAnio,
    horasMes,
    countMes,
    horasRecientes: fallbackHoras,
    countRecientes: fallbackCount
  };
}


// ==========================================
// ESTADÍSTICAS DETALLADAS INTEGRADAS EN PERFIL
// ==========================================

function cambiarPeriodoStatsPerfil(periodo) {
  estadoStatsPerfil.periodo = periodo;
  if (typeof estadoStatsModal !== 'undefined' && estadoStatsModal) {
    estadoStatsModal.periodo = periodo;
  }
  const btnYear = document.getElementById('perfil-stats-period-year');
  const btnAll = document.getElementById('perfil-stats-period-all');
  if (btnYear && btnAll) {
    if (periodo === 'year') {
      btnYear.classList.add('active');
      btnAll.classList.remove('active');
    } else {
      btnAll.classList.add('active');
      btnYear.classList.remove('active');
    }
  }
  const modalBtnYear = document.getElementById('stats-period-btn-year');
  const modalBtnAll = document.getElementById('stats-period-btn-all');
  if (modalBtnYear && modalBtnAll) {
    if (periodo === 'year') {
      modalBtnYear.classList.add('active');
      modalBtnAll.classList.remove('active');
    } else {
      modalBtnAll.classList.add('active');
      modalBtnYear.classList.remove('active');
    }
  }
  renderizarEstadisticasPerfil();
}

function seleccionarCategoriaStatsPerfil(cat) {
  estadoStatsPerfil.categoria = cat;
  if (typeof estadoStatsModal !== 'undefined' && estadoStatsModal) {
    estadoStatsModal.categoria = cat;
  }
  document.querySelectorAll('.perfil-stats-cat-btn').forEach(btn => {
    if (btn.getAttribute('data-cat') === cat) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  renderizarEstadisticasPerfil();
}

function renderizarBotonesCategoriasStatsPerfil() {
  const cont = document.getElementById('perfil-stats-cats-index');
  if (!cont) return;
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang) || 'es';
  const cats = [
    { cat: 'Peliculas', label: (l === 'en' ? 'Movies' : 'Películas'), icon: getHeroIcon('film') },
    { cat: 'Series', label: (l === 'en' ? 'Series' : 'Series'), icon: getHeroIcon('tv') },
    { cat: 'Musica', label: (l === 'en' ? 'Music' : 'Música'), icon: getHeroIcon('musical-note') },
    { cat: 'Juegos', label: (l === 'en' ? 'Games' : 'Juegos'), icon: getHeroIcon('gamepad') },
    { cat: 'Lecturas', label: (l === 'en' ? 'Books' : 'Lecturas'), icon: getHeroIcon('book-open') }
  ];

  if (!estadoStatsPerfil.categoria || estadoStatsPerfil.categoria === 'General') {
    estadoStatsPerfil.categoria = 'Peliculas';
  }

  cont.innerHTML = cats.map(c => {
    const act = (estadoStatsPerfil.categoria === c.cat) ? 'active' : '';
    return `
      <button type="button" class="home-indice-btn perfil-stats-cat-btn ${act}" data-cat="${c.cat}" onclick="seleccionarCategoriaStatsPerfil('${c.cat}')" title="${c.label}">
        <span class="home-indice-icon">${c.icon}</span>
        <span class="home-indice-name home-indice-label">${c.label}</span>
      </button>
    `;
  }).join('');
}

function renderizarEstadisticasPerfil() {
  const container = document.getElementById('perfil-stats-content-area');
  const generalSec = document.getElementById('perfil-stats-general-section');
  if (!container && !generalSec) return;

  const hoy = new Date();
  const yEl = document.getElementById('perfil-stats-lbl-cur-year');
  if (yEl) yEl.textContent = hoy.getFullYear();

  renderizarBotonesCategoriasStatsPerfil();

  const todosRegs = Array.isArray(estado.registros) ? estado.registros : [];
  const nowYear = hoy.getFullYear();
  const nowMonth = hoy.getMonth();
  const mesesLargo = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const seriesConTemporadas = new Set();
  todosRegs.forEach(r => {
    if (r.categoria === 'Series' && ((r.subcategoria && (r.subcategoria === 'Temporadas' || r.subcategoria.includes('Temporada'))) || /\[S\d+\]/i.test(r.titulo || ''))) {
      const base = (r.tituloBase || (r.titulo || '').replace(/\s*\[S\d+\].*$/, '')).trim().toLowerCase();
      if (base) seriesConTemporadas.add(base);
    }
  });

  const regsPeriodo = todosRegs.filter(r => {
    if (estadoStatsPerfil.periodo === 'all') return true;
    const d = obtenerFechaObjetoStats_(r);
    if (!d) return false;
    return d.getFullYear() === nowYear;
  });

  const periodTxt = estadoStatsPerfil.periodo === 'all'
    ? tLang('Todos los tiempos', 'All time')
    : tLang(`Año ${nowYear}`, `Year ${nowYear}`);

  let spotifyStats = null, spotifyAccumulator = null;
  try { const s = localStorage.getItem('mediary_spotify_stats'); if (s) spotifyStats = JSON.parse(s); } catch(e){}
  try { const a = localStorage.getItem('mediary_spotify_accumulator'); if (a) spotifyAccumulator = JSON.parse(a); } catch(e){}
  let lastfmConnected = localStorage.getItem('mediary_lastfm_connected') === 'true', lastfmUser = null, lastfmStats = null;
  try { const u = localStorage.getItem('mediary_lastfm_user'); if (u) lastfmUser = JSON.parse(u); } catch(e){}
  try { const st = localStorage.getItem('mediary_lastfm_stats'); if (st) lastfmStats = JSON.parse(st); } catch(e){}
  let steamConnected = localStorage.getItem('mediary_steam_connected') === 'true', steamUser = null, steamStats = null;
  try { const su = localStorage.getItem('mediary_steam_user'); if (su) steamUser = JSON.parse(su); } catch(e){}
  try {
    const ss = localStorage.getItem('mediary_steam_stats');
    if (ss) {
      const parsed = JSON.parse(ss);
      if (!(parsed && parsed.totalHours === 412.5 && Array.isArray(parsed.topGames) && parsed.topGames.some(g => g.name === 'Elden Ring'))) {
        steamStats = parsed;
      }
    }
  } catch(e){}
  let psnConnected = localStorage.getItem('mediary_psn_connected') === 'true', psnUser = null, psnStats = null;
  try { const pu = localStorage.getItem('mediary_psn_user'); if (pu) psnUser = JSON.parse(pu); } catch(e){}
  try { const ps = localStorage.getItem('mediary_psn_stats'); if (ps) psnStats = JSON.parse(ps); } catch(e){}

  const ctx = {
    todosRegs,
    regsPeriodo,
    seriesConTemporadas,
    nowYear,
    nowMonth,
    mesesLargo,
    periodTxt,
    periodo: estadoStatsPerfil.periodo,
    spotifyStats,
    spotifyAccumulator,
    lastfmConnected,
    lastfmUser,
    lastfmStats,
    steamConnected,
    steamUser,
    steamStats,
    psnConnected,
    psnUser,
    psnStats
  };

  // 1. RESUMEN GENERAL Y RÉCORDS DE RITMO (INTEGRADOS DENTRO DE LA SECCIÓN GENERAL)
  if (generalSec) {
    generalSec.innerHTML = renderizarStatsGeneral_(ctx);
  }

  // 2. DETALLE DE CATEGORÍA SELECCIONADA EN EL CONTENEDOR INFERIOR
  if (container) {
    let cat = estadoStatsPerfil.categoria;
    if (!cat || cat === 'General') cat = 'Peliculas';

    if (cat === 'Peliculas') {
      container.innerHTML = renderizarStatsPeliculas_(ctx);
    } else if (cat === 'Series') {
      container.innerHTML = renderizarStatsSeries_(ctx);
    } else if (cat === 'Musica') {
      container.innerHTML = renderizarStatsMusica_(ctx);
    } else if (cat === 'Juegos') {
      container.innerHTML = renderizarStatsJuegos_(ctx);
    } else if (cat === 'Lecturas') {
      container.innerHTML = renderizarStatsLecturas_(ctx);
    } else {
      container.innerHTML = renderizarStatsPeliculas_(ctx);
    }
    iniciarCarruselesMejorCalificado();
  }
}

function renderizarContenidoEstadisticasAvanzadas() {
  const container = document.getElementById('stats-modal-body');
  const tagSummary = document.getElementById('stats-modal-summary-tag');
  if (!container) return;

  const todosRegs = Array.isArray(estado.registros) ? estado.registros : [];
  const hoy = new Date();
  const nowYear = hoy.getFullYear();
  const nowMonth = hoy.getMonth();
  const mesesLargo = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const seriesConTemporadas = new Set();
  todosRegs.forEach(r => {
    if (r.categoria === 'Series' && ((r.subcategoria && (r.subcategoria === 'Temporadas' || r.subcategoria.includes('Temporada'))) || /\[S\d+\]/i.test(r.titulo || ''))) {
      const base = (r.tituloBase || (r.titulo || '').replace(/\s*\[S\d+\].*$/, '')).trim().toLowerCase();
      if (base) seriesConTemporadas.add(base);
    }
  });

  // Filtrado según período seleccionado: 'year' (predeterminado) o 'all'
  const regsPeriodo = todosRegs.filter(r => {
    if (estadoStatsModal.periodo === 'all') return true;
    const d = obtenerFechaObjetoStats_(r);
    if (!d) return false;
    return d.getFullYear() === nowYear;
  });

  const periodTxt = estadoStatsModal.periodo === 'all'
    ? tLang('Todos los tiempos', 'All time')
    : tLang(`Año ${nowYear}`, `Year ${nowYear}`);

  if (tagSummary) {
    tagSummary.textContent = tLang(
      `${regsPeriodo.length} productos agregados (${periodTxt})`,
      `${regsPeriodo.length} items logged (${periodTxt})`
    );
  }

  // Cargar datos de Spotify y acumulador
  let spotifyStats = null;
  let spotifyAccumulator = null;
  try {
    const spRaw = localStorage.getItem('mediary_spotify_stats');
    if (spRaw) spotifyStats = JSON.parse(spRaw);
  } catch (e) {}
  try {
    const accRaw = localStorage.getItem('mediary_spotify_accumulator');
    if (accRaw) spotifyAccumulator = JSON.parse(accRaw);
  } catch (e) {}

  // Cargar datos de Last.fm
  let lastfmConnected = localStorage.getItem('mediary_lastfm_connected') === 'true';
  let lastfmUser = null;
  let lastfmStats = null;
  try {
    const lfmU = localStorage.getItem('mediary_lastfm_user');
    if (lfmU) lastfmUser = JSON.parse(lfmU);
  } catch (e) {}
  try {
    const lfmS = localStorage.getItem('mediary_lastfm_stats');
    if (lfmS) lastfmStats = JSON.parse(lfmS);
  } catch (e) {}

  // Cargar datos de Steam
  let steamConnected = localStorage.getItem('mediary_steam_connected') === 'true';
  let steamUser = null;
  let steamStats = null;
  try {
    const stRaw = localStorage.getItem('mediary_steam_user');
    if (stRaw) steamUser = JSON.parse(stRaw);
  } catch (e) {}
  try {
    const stSRaw = localStorage.getItem('mediary_steam_stats');
    if (stSRaw) {
      const parsed = JSON.parse(stSRaw);
      const esFake = parsed && parsed.totalHours === 412.5 && Array.isArray(parsed.topGames) && parsed.topGames.some(g => g.name === 'Elden Ring');
      if (esFake) {
        localStorage.removeItem('mediary_steam_stats');
        steamStats = null;
      } else {
        steamStats = parsed;
      }
    }
  } catch (e) {}

  // Cargar datos de PlayStation
  let psnConnected = localStorage.getItem('mediary_psn_connected') === 'true';
  let psnUser = null;
  let psnStats = null;
  try {
    const psnU = localStorage.getItem('mediary_psn_user');
    if (psnU) psnUser = JSON.parse(psnU);
  } catch (e) {}
  try {
    const psnS = localStorage.getItem('mediary_psn_stats');
    if (psnS) psnStats = JSON.parse(psnS);
  } catch (e) {}

  const ctx = {
    todosRegs,
    regsPeriodo,
    seriesConTemporadas,
    nowYear,
    nowMonth,
    mesesLargo,
    periodTxt,
    spotifyStats,
    spotifyAccumulator,
    lastfmConnected,
    lastfmUser,
    lastfmStats,
    steamConnected,
    steamUser,
    steamStats,
    psnConnected,
    psnUser,
    psnStats
  };

  const cat = estadoStatsModal.categoria;
  if (cat === 'General') {
    container.innerHTML = renderizarStatsGeneral_(ctx);
  } else if (cat === 'Peliculas') {
    container.innerHTML = renderizarStatsPeliculas_(ctx);
  } else if (cat === 'Series') {
    container.innerHTML = renderizarStatsSeries_(ctx);
  } else if (cat === 'Musica') {
    container.innerHTML = renderizarStatsMusica_(ctx);
  } else if (cat === 'Juegos') {
    container.innerHTML = renderizarStatsJuegos_(ctx);
  } else if (cat === 'Lecturas') {
    container.innerHTML = renderizarStatsLecturas_(ctx);
  }
}

function renderizarStatsGeneral_(ctx) {
  const { regsPeriodo, todosRegs, seriesConTemporadas, nowYear, nowMonth, spotifyStats, spotifyAccumulator, lastfmConnected, lastfmStats, steamConnected, steamStats, psnConnected, psnStats, periodTxt } = ctx;
  const curPeriodo = ctx.periodo || (typeof estadoStatsPerfil !== 'undefined' && estadoStatsPerfil?.periodo) || estadoStatsModal?.periodo || 'year';
  const total = regsPeriodo.length;

  let horasPelis = 0, horasSeries = 0, horasJuegos = 0, horasLecturas = 0;
  let countPelis = 0, countSeries = 0, countJuegos = 0, countLecturas = 0;
  let sumCalifs = 0, numCalifs = 0;

  regsPeriodo.forEach(r => {
    if (Number(r.calificacion) > 0) {
      sumCalifs += Number(r.calificacion);
      numCalifs++;
    }
    const cat = r.categoria;
    const h = calcularHorasObraStats_(r, seriesConTemporadas);
    if (cat === 'Peliculas') { horasPelis += h; countPelis++; }
    else if (cat === 'Series') { horasSeries += h; countSeries++; }
    else if (cat === 'Juegos') { horasJuegos += h; countJuegos++; }
    else if (cat === 'Lecturas') { horasLecturas += h; countLecturas++; }
  });

  const ratingAvg = numCalifs ? (sumCalifs / numCalifs).toFixed(1) : '0.0';

  const tieneLastfm = !!(lastfmConnected && lastfmStats && (lastfmStats.countTotal > 0 || lastfmStats.horasTotal > 0));
  const tieneSpotify = !tieneLastfm && !!(spotifyStats && (spotifyStats.recentHours != null || spotifyStats.recentMinutes != null));
  const metricasSp = obtenerMetricasMusicaSpotifyStats_(spotifyStats, spotifyAccumulator, nowYear, nowMonth);

  let horasMusica = 0;
  let countMusica = 0;
  if (tieneLastfm) {
    if (curPeriodo === 'year') {
      horasMusica = lastfmStats.horasAnio || 0;
      countMusica = lastfmStats.countAnio || 0;
    } else {
      horasMusica = lastfmStats.horasTotal || 0;
      countMusica = lastfmStats.countTotal || 0;
    }
  } else if (tieneSpotify) {
    if (curPeriodo === 'year') {
      horasMusica = metricasSp.horasAnio;
      countMusica = metricasSp.countAnio;
    } else {
      horasMusica = metricasSp.horasTotal;
      countMusica = metricasSp.countTotal;
    }
  } else {
    regsPeriodo.filter(r => r.categoria === 'Musica').forEach(r => {
      horasMusica += calcularHorasObraStats_(r);
      countMusica++;
    });
  }

  const tieneSteam = !!(steamConnected && steamStats && !steamStats.isPrivate && (steamStats.totalHours > 0));
  const tienePsn = !!(psnConnected && psnStats && (psnStats.totalHours > 0));
  let horasSteamParaPeriodo = 0;
  if (tieneSteam) {
    horasSteamParaPeriodo = (curPeriodo === 'year') ? Math.max(steamStats.recentHours || 0, horasJuegos) : (steamStats.totalHours || 0);
  }
  let horasPsnParaPeriodo = 0;
  if (tienePsn) {
    horasPsnParaPeriodo = (curPeriodo === 'year') ? (psnStats.recentHours || 0) : (psnStats.totalHours || 0);
  }
  const horasJuegosTotal = Math.max(horasSteamParaPeriodo + horasPsnParaPeriodo, horasJuegos);
  const horasTotal = horasPelis + horasSeries + horasMusica + horasJuegosTotal + horasLecturas;

  const pctPelis = horasTotal ? Math.round((horasPelis / horasTotal) * 100) : 0;
  const pctSeries = horasTotal ? Math.round((horasSeries / horasTotal) * 100) : 0;
  const pctMusica = horasTotal ? Math.round((horasMusica / horasTotal) * 100) : 0;
  const pctJuegos = horasTotal ? Math.round((horasJuegosTotal / horasTotal) * 100) : 0;
  const pctLecturas = horasTotal ? Math.round((horasLecturas / horasTotal) * 100) : 0;

  const mapaDias = {}, mapaSemanas = {}, mapaMeses = {};
  regsPeriodo.forEach(r => {
    const fechaBase = (r.fechaFin && r.fechaFin !== 'Sin fecha' && !esEnProgresoTexto(r.fechaFin)) ? r.fechaFin : r.fechaInicio;
    const dObj = parsearFechaAObjeto(fechaBase);
    if (dObj) {
      const dStr = `${String(dObj.getDate()).padStart(2,'0')}/${String(dObj.getMonth()+1).padStart(2,'0')}/${dObj.getFullYear()}`;
      if (!mapaDias[dStr]) mapaDias[dStr] = { fecha: new Date(dObj), items: [] };
      mapaDias[dStr].items.push(r);
      const mStr = `${dObj.getFullYear()}-${String(dObj.getMonth()+1).padStart(2,'0')}`;
      if (!mapaMeses[mStr]) mapaMeses[mStr] = { mIdx: dObj.getMonth(), items: [] };
      mapaMeses[mStr].items.push(r);
      const primerDiaSemana = new Date(dObj);
      const diaSem = (dObj.getDay() + 6) % 7;
      primerDiaSemana.setDate(dObj.getDate() - diaSem);
      const semKey = `${primerDiaSemana.getFullYear()}-${String(primerDiaSemana.getMonth()+1).padStart(2,'0')}-${String(primerDiaSemana.getDate()).padStart(2,'0')}`;
      if (!mapaSemanas[semKey]) mapaSemanas[semKey] = { inicio: new Date(primerDiaSemana), items: [] };
      mapaSemanas[semKey].items.push(r);
    }
  });

  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang) || 'es';
  const ceroRegsTxt = tLang('0 registros', '0 records');
  let maxDiaVal = 0, bestDiaObj = null;
  for (const [k, obj] of Object.entries(mapaDias)) {
    if (obj.items.length > maxDiaVal) { maxDiaVal = obj.items.length; bestDiaObj = obj; }
  }
  let maxDiaTxt = '—', maxDiaSub = ceroRegsTxt;
  if (bestDiaObj) {
    const diaNombre = (I18N[l] && I18N[l].dias) ? I18N[l].dias[bestDiaObj.fecha.getDay()] : '';
    const dd = String(bestDiaObj.fecha.getDate()).padStart(2, '0');
    const mm = String(bestDiaObj.fecha.getMonth() + 1).padStart(2, '0');
    maxDiaTxt = `${diaNombre} ${dd}/${mm}`;
    maxDiaSub = formatearDesgloseItems(bestDiaObj.items);
  }

  let maxSemVal = 0, bestSemObj = null;
  for (const [k, obj] of Object.entries(mapaSemanas)) {
    if (obj.items.length > maxSemVal) { maxSemVal = obj.items.length; bestSemObj = obj; }
  }
  let maxSemTxt = '—', maxSemSub = ceroRegsTxt;
  if (bestSemObj) {
    const finSem = new Date(bestSemObj.inicio);
    finSem.setDate(bestSemObj.inicio.getDate() + 6);
    const mIniNom = (I18N[l] && I18N[l].meses) ? I18N[l].meses[bestSemObj.inicio.getMonth()] : '';
    const dIniStr = String(bestSemObj.inicio.getDate()).padStart(2, '0');
    const mFinNom = (I18N[l] && I18N[l].meses) ? I18N[l].meses[finSem.getMonth()] : '';
    const dFinStr = String(finSem.getDate()).padStart(2, '0');
    maxSemTxt = `${mIniNom} ${dIniStr} --> ${mFinNom} ${dFinStr}`;
    maxSemSub = formatearDesgloseItems(bestSemObj.items);
  }

  let maxMesVal = 0, bestMesObj = null;
  for (const [k, obj] of Object.entries(mapaMeses)) {
    if (obj.items.length > maxMesVal) { maxMesVal = obj.items.length; bestMesObj = obj; }
  }
  let maxMesTxt = '—', maxMesSub = ceroRegsTxt;
  if (bestMesObj) {
    maxMesTxt = (I18N[l] && I18N[l].meses) ? I18N[l].meses[bestMesObj.mIdx] : '';
    maxMesSub = formatearDesgloseItems(bestMesObj.items);
  }

  const rachaGlobal = (typeof calcularRachaMasAltaGlobal === 'function')
    ? calcularRachaMasAltaGlobal(regsPeriodo.length ? regsPeriodo : todosRegs)
    : { valTxt: tLang('0 días', '0 days'), subTxt: ceroRegsTxt };

  const lblPelis = tLang('Películas', 'Movies');
  const lblSeries = 'Series';
  const lblMusica = tLang('Música', 'Music');
  const lblJuegos = tLang('Juegos', 'Games');
  const lblLecturas = tLang('Lecturas', 'Reading');

  return `
    <!-- 1. KPIS GENERALES: TIEMPO DE LA CUENTA, PRODUCTOS AGREGADOS, NOTA PROMEDIO -->
    <div class="stats-kpi-grid">
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("user", "", 16)}</span> <span>${tLang('Tiempo de la Cuenta', 'Account Age')}</span></div>
        <div class="stats-kpi-val">${calcularTiempoCuenta()}</div>
        <div class="stats-kpi-sub">${tLang('Antigüedad en Mediary', 'Time on Mediary')}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("folder", "", 16)}</span> <span>${tLang('Productos Agregados', 'Logged Items')}</span></div>
        <div class="stats-kpi-val">${total}</div>
        <div class="stats-kpi-sub">${curPeriodo === 'year' ? tLang(`Agregados en ${nowYear}`, `Added in ${nowYear}`) : tLang('En todo el historial', 'All time')}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("star", "", 16)}</span> <span>${tLang('Nota Promedio', 'Average Rating')}</span></div>
        <div class="stats-kpi-val" style="color:var(--star-active, #c8955a); display:flex; align-items:center; gap:4px;">${getHeroIcon("star", "", 16)} ${ratingAvg}</div>
        <div class="stats-kpi-sub">${tLang(`${numCalifs} notas otorgadas`, `${numCalifs} ratings given`)}</div>
      </div>
    </div>

    <!-- DISTRIBUCIÓN DE TIEMPO POR CATEGORÍA -->
    <div class="stats-section-box">
      <div class="stats-section-title">
        <span>${tLang('Distribución del Tiempo', 'Time Distribution')}</span>
        <span style="font-size:0.75rem; color:var(--muted); font-weight:600;">${formatearHorasStats_(horasTotal)} total</span>
      </div>
      <div style="height:8px; border-radius:4px; background:var(--card); display:flex; overflow:hidden; margin-bottom:12px;">
        <div style="width:${pctPelis}%; background:var(--cat-color-peliculas);" title="${lblPelis}: ${pctPelis}%"></div>
        <div style="width:${pctSeries}%; background:var(--cat-color-series);" title="${lblSeries}: ${pctSeries}%"></div>
        <div style="width:${pctMusica}%; background:var(--cat-color-musica);" title="${lblMusica}: ${pctMusica}%"></div>
        <div style="width:${pctJuegos}%; background:var(--cat-color-juegos);" title="${lblJuegos}: ${pctJuegos}%"></div>
        <div style="width:${pctLecturas}%; background:var(--cat-color-lecturas);" title="${lblLecturas}: ${pctLecturas}%"></div>
      </div>

      <div class="stats-chips-container">
        <div class="stats-chip-cat stats-chip-cat-peliculas" onclick="cambiarCatStats('Peliculas')">
          <span style="width:8px; height:8px; border-radius:50%; background:var(--cat-color-peliculas); flex-shrink:0;"></span>
          <span>${lblPelis}:</span>
          <strong>${formatearHorasStats_(horasPelis)} (${pctPelis}%)</strong>
        </div>
        <div class="stats-chip-cat stats-chip-cat-series" onclick="cambiarCatStats('Series')">
          <span style="width:8px; height:8px; border-radius:50%; background:var(--cat-color-series); flex-shrink:0;"></span>
          <span>${lblSeries}:</span>
          <strong>${formatearHorasStats_(horasSeries)} (${pctSeries}%)</strong>
        </div>
        <div class="stats-chip-cat stats-chip-cat-musica" onclick="cambiarCatStats('Musica')">
          <span style="width:8px; height:8px; border-radius:50%; background:var(--cat-color-musica); flex-shrink:0;"></span>
          <span>${lblMusica}:</span>
          <strong>${formatearHorasStats_(horasMusica)} (${pctMusica}%)</strong>
        </div>
        <div class="stats-chip-cat stats-chip-cat-juegos" onclick="cambiarCatStats('Juegos')">
          <span style="width:8px; height:8px; border-radius:50%; background:var(--cat-color-juegos); flex-shrink:0;"></span>
          <span>${lblJuegos}:</span>
          <strong>${formatearHorasStats_(horasJuegosTotal)} (${pctJuegos}%)</strong>
        </div>
        <div class="stats-chip-cat stats-chip-cat-lecturas" onclick="cambiarCatStats('Lecturas')">
          <span style="width:8px; height:8px; border-radius:50%; background:var(--cat-color-lecturas); flex-shrink:0;"></span>
          <span>${lblLecturas}:</span>
          <strong>${formatearHorasStats_(horasLecturas)} (${pctLecturas}%)</strong>
        </div>
      </div>
    </div>

    <!-- RÉCORDS DE RITMO DIRECTAMENTE EN LA SECCIÓN GENERAL -->
    <div class="profile-grid-records" style="margin-top:12px;">
      <div class="profile-stat-box">
        <div class="profile-stat-label" data-i18n="stat_best_day">${t('stat_best_day') || tLang('Día récord', 'Record Day')}</div>
        <div class="profile-stat-val" id="prof-best-day-val">${maxDiaTxt}</div>
        <div class="profile-stat-sub" id="prof-best-day-sub">${maxDiaSub}</div>
      </div>
      <div class="profile-stat-box">
        <div class="profile-stat-label" data-i18n="stat_best_week">${t('stat_best_week') || tLang('Semana récord', 'Record Week')}</div>
        <div class="profile-stat-val" id="prof-best-week-val" style="font-size:0.88rem; line-height:1.25;">${maxSemTxt}</div>
        <div class="profile-stat-sub" id="prof-best-week-sub">${maxSemSub}</div>
      </div>
      <div class="profile-stat-box">
        <div class="profile-stat-label" data-i18n="stat_best_month">${t('stat_best_month') || tLang('Mes récord', 'Record Month')}</div>
        <div class="profile-stat-val" id="prof-best-month-val">${maxMesTxt}</div>
        <div class="profile-stat-sub" id="prof-best-month-sub">${maxMesSub}</div>
      </div>
      <div class="profile-stat-box">
        <div class="profile-stat-label" data-i18n="stat_best_streak">${t('stat_best_streak') || tLang('Racha más alta', 'Longest Streak')}</div>
        <div class="profile-stat-val" id="prof-best-streak-val" style="color:#f59e0b;">${rachaGlobal.valTxt}</div>
        <div class="profile-stat-sub" id="prof-best-streak-sub">${rachaGlobal.subTxt}</div>
      </div>
    </div>
  `;
}

function renderizarStatsPeliculas_(ctx) {
  const { regsPeriodo, todosRegs, nowYear, periodTxt } = ctx;
  const pelisPeriodo = regsPeriodo.filter(r => r.categoria === 'Peliculas');
  const pelisTotales = todosRegs.filter(r => r.categoria === 'Peliculas');

  const hPeriodo = pelisPeriodo.reduce((acc, r) => acc + (extraerHorasRegistro(r) || 1.8), 0);

  let sumCalifs = 0, numCalifs = 0;
  pelisPeriodo.forEach(r => {
    if (Number(r.calificacion) > 0) { sumCalifs += Number(r.calificacion); numCalifs++; }
  });
  const avgCal = numCalifs ? (sumCalifs / numCalifs).toFixed(1) : '0.0';

  const rachaPelis = typeof calcularRachaPeliculas === 'function' ? calcularRachaPeliculas(todosRegs) : { rachaActual: 0, rachaMasAlta: 0 };
  const mejorPeli = obtenerMejoresCalificados_(pelisPeriodo);

  // Gráfico de productos agregados vs cada mes del año
  const pelisMeses = Array(12).fill(0);
  todosRegs.forEach(r => {
    if (r.categoria === 'Peliculas') {
      const d = obtenerFechaObjetoStats_(r);
      if (d && (d.getFullYear() === nowYear || estadoStatsModal.periodo === 'all')) {
        pelisMeses[d.getMonth()]++;
      }
    }
  });
  const mesesAbrev = obtenerMesesAbrevStats_();
  const unitPelis = tLang('películas', 'movies');
  const chartItemsPelis = mesesAbrev.map((m, idx) => ({
    label: m,
    valor: pelisMeses[idx],
    displayVal: pelisMeses[idx],
    sublabel: `${m}: ${pelisMeses[idx]} ${unitPelis}`
  }));

  const top5Pelis = [...pelisPeriodo]
    .sort((a, b) => (Number(b.calificacion) || 0) - (Number(a.calificacion) || 0) || (b.esRewatch ? 1 : 0) - (a.esRewatch ? 1 : 0))
    .slice(0, 5);

  const dirMap = {};
  pelisPeriodo.forEach(r => {
    const d = (r.creador || '').trim();
    if (!d || d === 'Desconocido' || d === 'Director desconocido') return;
    if (!dirMap[d]) dirMap[d] = { nombre: d, count: 0, sumCal: 0, numCal: 0 };
    dirMap[d].count++;
    if (Number(r.calificacion) > 0) { dirMap[d].sumCal += Number(r.calificacion); dirMap[d].numCal++; }
  });
  const topDirectores = Object.values(dirMap)
    .map(x => ({ ...x, avg: x.numCal ? (x.sumCal / x.numCal).toFixed(1) : '—' }))
    .sort((a, b) => b.count - a.count || Number(b.avg) - Number(a.avg))
    .slice(0, 5);

  return `
    <!-- KPIS: TOTAL HORAS VISTAS, NOTA PROMEDIO, RACHAS -->
    <div class="stats-kpi-grid">
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("clock", "", 16)}</span> <span>${tLang('Total Horas Vistas', 'Total Hours Watched')}</span></div>
        <div class="stats-kpi-val">${formatearHorasStats_(hPeriodo)}</div>
        <div class="stats-kpi-sub">${tLang(`${pelisPeriodo.length} películas en ${periodTxt}`, `${pelisPeriodo.length} movies in ${periodTxt}`)}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("star", "", 16)}</span> <span>${tLang('Nota Promedio', 'Average Rating')}</span></div>
        <div class="stats-kpi-val" style="color:var(--star-active, #c8955a); display:flex; align-items:center; gap:4px;">${getHeroIcon("star", "", 16)} ${avgCal}</div>
        <div class="stats-kpi-sub">${tLang(`De ${numCalifs} evaluadas`, `From ${numCalifs} rated`)}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span style="color:var(--cat-color-peliculas);">${getHeroIcon("fire", "", 16)}</span> <span>${tLang('Rachas de Películas', 'Movie Streaks')}</span></div>
        <div class="stats-kpi-val" style="color:var(--cat-color-peliculas);">${rachaPelis.rachaActual} ${rachaPelis.rachaActual === 1 ? tLang('día', 'day') : tLang('días', 'days')}</div>
        <div class="stats-kpi-sub">${tLang(`Récord histórico: ${rachaPelis.rachaMasAlta} días`, `All-time record: ${rachaPelis.rachaMasAlta} days`)}</div>
      </div>
    </div>

    <!-- MEJOR CALIFICADO -->
    ${renderizarCardMejorCalificado_(mejorPeli, tLang('películas', 'movies'))}

    <!-- GRÁFICO: PELÍCULAS AGREGADAS VS CADA MES DEL AÑO -->
    ${generarGraficoBarras_({
      titulo: tLang('Películas Agregadas por Mes', 'Movies Logged per Month'),
      subtitulo: estadoStatsModal.periodo === 'year' ? tLang(`Año ${nowYear}`, `Year ${nowYear}`) : tLang('Histórico mensual', 'Monthly history'),
      items: chartItemsPelis,
      unidad: unitPelis,
      colorBarra: 'var(--cat-color-peliculas)'
    })}

    <!-- TOP 5 PELÍCULAS FAVORITAS -->
    <div class="stats-section-box">
      <div class="stats-section-title">
        <span>${tLang('Top 5 Películas Favoritas', 'Top 5 Favorite Movies')}</span>
        <span style="font-size:0.75rem; color:var(--muted); font-weight:600;">${periodTxt}</span>
      </div>
      ${top5Pelis.length ? top5Pelis.map((p, idx) => `
        <div class="stats-ranking-row">
          <div class="stats-rank-num rank-${idx + 1}">#${idx + 1}</div>
          <img loading="lazy" decoding="async" src="${escHtmlStats_(p.poster || '')}" onerror="this.src='./icon.png'" style="width:38px; height:52px; border-radius:4px; object-fit:cover; background:var(--card); flex-shrink:0;">
          <div style="flex:1; min-width:0;">
            <strong style="font-size:0.86rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlStats_(p.titulo)}</strong>
            <span style="font-size:0.74rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlStats_(p.creador || 'Director')} ${p.anio ? `· ${p.anio}` : ''}</span>
          </div>
          <div style="font-weight:700; font-size:0.84rem; color:var(--star-active, #c8955a); flex-shrink:0; display:inline-flex; align-items:center; gap:3px;">${getHeroIcon('star', '', 12)} ${Number(p.calificacion) ? Number(p.calificacion).toFixed(1) : '—'}</div>
        </div>
      `).join('') : `<div style="color:var(--muted); font-size:0.82rem; text-align:center; padding:16px;">${tLang('No hay películas registradas en este período.', 'No movies logged in this period.')}</div>`}
    </div>

    <!-- TOP DIRECTORES -->
    <div class="stats-section-box">
      <div class="stats-section-title">
        <span>${tLang('Directores Más Vistos', 'Most Watched Directors')}</span>
      </div>
      ${topDirectores.length ? topDirectores.map((d, idx) => `
        <div class="stats-ranking-row">
          <div class="stats-rank-num rank-${idx + 1}">#${idx + 1}</div>
          <div style="flex:1; min-width:0;">
            <strong style="font-size:0.86rem; color:var(--text);">${escHtmlStats_(d.nombre)}</strong>
            <span style="font-size:0.74rem; color:var(--muted); display:block;">${d.count} ${d.count === 1 ? tLang('película', 'movie') : tLang('películas', 'movies')}</span>
          </div>
          <div style="font-size:0.8rem; color:var(--muted); font-weight:600; display:inline-flex; align-items:center; gap:4px;">${tLang('Media:', 'Avg:')} <strong style="color:var(--star-active, #c8955a); display:inline-flex; align-items:center; gap:2px;">${getHeroIcon('star', '', 12)} ${d.avg}</strong></div>
        </div>
      `).join('') : `<div style="color:var(--muted); font-size:0.82rem; text-align:center; padding:12px;">${tLang('Sin datos suficientes de directores.', 'Not enough director data.')}</div>`}
    </div>
  `;
}

function renderizarStatsSeries_(ctx) {
  const { regsPeriodo, todosRegs, seriesConTemporadas, nowYear, periodTxt } = ctx;
  const seriesPeriodo = regsPeriodo.filter(r => r.categoria === 'Series');
  const seriesTotales = todosRegs.filter(r => r.categoria === 'Series');

  const hPeriodo = seriesPeriodo.reduce((acc, r) => acc + calcularHorasObraStats_(r, seriesConTemporadas), 0);

  let sumCalifs = 0, numCalifs = 0;
  seriesPeriodo.forEach(r => {
    if (Number(r.calificacion) > 0) { sumCalifs += Number(r.calificacion); numCalifs++; }
  });
  const avgCal = numCalifs ? (sumCalifs / numCalifs).toFixed(1) : '0.0';

  const rachaSeries = calcularRachaSeries(todosRegs);
  const mejorSerie = obtenerMejoresCalificados_(seriesPeriodo);

  // Gráfico de productos agregados vs cada mes del año
  const seriesMeses = Array(12).fill(0);
  todosRegs.forEach(r => {
    if (r.categoria === 'Series') {
      const d = obtenerFechaObjetoStats_(r);
      if (d && (d.getFullYear() === nowYear || estadoStatsModal.periodo === 'all')) {
        seriesMeses[d.getMonth()]++;
      }
    }
  });
  const mesesAbrev = obtenerMesesAbrevStats_();
  const unitSeriesSub = tLang('series/temporadas', 'series/seasons');
  const chartItemsSeries = mesesAbrev.map((m, idx) => ({
    label: m,
    valor: seriesMeses[idx],
    displayVal: seriesMeses[idx],
    sublabel: `${m}: ${seriesMeses[idx]} ${unitSeriesSub}`
  }));

  const top5Series = [...seriesPeriodo]
    .sort((a, b) => (Number(b.calificacion) || 0) - (Number(a.calificacion) || 0))
    .slice(0, 5);

  const creatorMap = {};
  seriesPeriodo.forEach(r => {
    const c = (r.creador || '').trim();
    if (!c || c === 'Desconocido' || c === 'Autor desconocido') return;
    if (!creatorMap[c]) creatorMap[c] = { nombre: c, count: 0, sumCal: 0, numCal: 0 };
    creatorMap[c].count++;
    if (Number(r.calificacion) > 0) { creatorMap[c].sumCal += Number(r.calificacion); creatorMap[c].numCal++; }
  });
  const topCreadores = Object.values(creatorMap)
    .map(x => ({ ...x, avg: x.numCal ? (x.sumCal / x.numCal).toFixed(1) : '—' }))
    .sort((a, b) => b.count - a.count || Number(b.avg) - Number(a.avg))
    .slice(0, 5);

  return `
    <!-- KPIS: TOTAL HORAS VISTAS, NOTA PROMEDIO, RACHAS -->
    <div class="stats-kpi-grid">
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("clock", "", 16)}</span> <span>${tLang('Total Horas Vistas', 'Total Hours Watched')}</span></div>
        <div class="stats-kpi-val">${formatearHorasStats_(hPeriodo)}</div>
        <div class="stats-kpi-sub">${tLang(`${seriesPeriodo.length} temporadas en ${periodTxt}`, `${seriesPeriodo.length} seasons in ${periodTxt}`)}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("star", "", 16)}</span> <span>${tLang('Nota Promedio', 'Average Rating')}</span></div>
        <div class="stats-kpi-val" style="color:var(--star-active, #c8955a); display:flex; align-items:center; gap:4px;">${getHeroIcon("star", "", 16)} ${avgCal}</div>
        <div class="stats-kpi-sub">${tLang(`De ${numCalifs} evaluadas`, `From ${numCalifs} rated`)}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span style="color:var(--cat-color-series);">${getHeroIcon("fire", "", 16)}</span> <span>${tLang('Rachas de Series', 'Series Streaks')}</span></div>
        <div class="stats-kpi-val" style="color:var(--cat-color-series);">${rachaSeries.rachaActual} ${rachaSeries.rachaActual === 1 ? tLang('día', 'day') : tLang('días', 'days')}</div>
        <div class="stats-kpi-sub">${tLang(`Récord histórico: ${rachaSeries.rachaMasAlta} días`, `All-time record: ${rachaSeries.rachaMasAlta} days`)}</div>
      </div>
    </div>

    <!-- MEJOR CALIFICADO -->
    ${renderizarCardMejorCalificado_(mejorSerie, 'series')}

    <!-- GRÁFICO: SERIES AGREGADAS VS CADA MES DEL AÑO -->
    ${generarGraficoBarras_({
      titulo: tLang('Series Agregadas por Mes', 'Series Logged per Month'),
      subtitulo: estadoStatsModal.periodo === 'year' ? tLang(`Año ${nowYear}`, `Year ${nowYear}`) : tLang('Histórico mensual', 'Monthly history'),
      items: chartItemsSeries,
      unidad: 'series',
      colorBarra: 'var(--cat-color-series)'
    })}

    <!-- TOP 5 SERIES FAVORITAS -->
    <div class="stats-section-box">
      <div class="stats-section-title">
        <span>${tLang('Top 5 Series Favoritas', 'Top 5 Favorite Series')}</span>
        <span style="font-size:0.75rem; color:var(--muted); font-weight:600;">${periodTxt}</span>
      </div>
      ${top5Series.length ? top5Series.map((s, idx) => `
        <div class="stats-ranking-row">
          <div class="stats-rank-num rank-${idx + 1}">#${idx + 1}</div>
          <img loading="lazy" decoding="async" src="${escHtmlStats_(s.poster || '')}" onerror="this.src='./icon.png'" style="width:38px; height:52px; border-radius:4px; object-fit:cover; background:var(--card); flex-shrink:0;">
          <div style="flex:1; min-width:0;">
            <strong style="font-size:0.86rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlStats_(s.titulo)}</strong>
            <span style="font-size:0.74rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlStats_(s.creador || 'Showrunner')} ${s.anio ? `· ${s.anio}` : ''}</span>
          </div>
          <div style="font-weight:700; font-size:0.84rem; color:var(--star-active, #c8955a); flex-shrink:0; display:inline-flex; align-items:center; gap:3px;">${getHeroIcon('star', '', 12)} ${Number(s.calificacion) ? Number(s.calificacion).toFixed(1) : '—'}</div>
        </div>
      `).join('') : `<div style="color:var(--muted); font-size:0.82rem; text-align:center; padding:16px;">${tLang('No hay series registradas en este período.', 'No series logged in this period.')}</div>`}
    </div>

    <!-- TOP CREADORES -->
    <div class="stats-section-box">
      <div class="stats-section-title">
        <span>${tLang('Creadores y Showrunners Más Vistos', 'Most Watched Creators & Showrunners')}</span>
      </div>
      ${topCreadores.length ? topCreadores.map((c, idx) => `
        <div class="stats-ranking-row">
          <div class="stats-rank-num rank-${idx + 1}">#${idx + 1}</div>
          <div style="flex:1; min-width:0;">
            <strong style="font-size:0.86rem; color:var(--text);">${escHtmlStats_(c.nombre)}</strong>
            <span style="font-size:0.74rem; color:var(--muted); display:block;">${c.count} ${c.count === 1 ? tLang('temporada', 'season') : tLang('temporadas', 'seasons')}</span>
          </div>
          <div style="font-size:0.8rem; color:var(--muted); font-weight:600; display:inline-flex; align-items:center; gap:4px;">${tLang('Media:', 'Avg:')} <strong style="color:var(--star-active, #c8955a); display:inline-flex; align-items:center; gap:2px;">${getHeroIcon('star', '', 12)} ${c.avg}</strong></div>
        </div>
      `).join('') : `<div style="color:var(--muted); font-size:0.82rem; text-align:center; padding:12px;">${tLang('Sin datos suficientes.', 'Not enough data.')}</div>`}
    </div>
  `;
}

async function cambiarPeriodoLastFmStats(periodo) {
  if (!['7day', '1month', '6month', '12month', 'overall'].includes(periodo)) return;
  localStorage.setItem('mediary_lastfm_selected_period', periodo);

  let stats = null;
  try {
    const raw = localStorage.getItem('mediary_lastfm_stats');
    if (raw) stats = JSON.parse(raw);
  } catch(e) {}
  if (!stats) return;

  stats.selectedPeriod = periodo;
  if (stats.topArtistsByPeriod?.[periodo]) stats.topArtists = stats.topArtistsByPeriod[periodo];
  if (stats.topAlbumsByPeriod?.[periodo]) stats.topAlbums = stats.topAlbumsByPeriod[periodo];
  if (stats.topTracksByPeriod?.[periodo]) stats.topTracks = stats.topTracksByPeriod[periodo];
  localStorage.setItem('mediary_lastfm_stats', JSON.stringify(stats));

  const username = localStorage.getItem('mediary_lastfm_username');
  if (username && !username.startsWith('demo_') && (!stats.topArtistsByPeriod?.[periodo] || !stats.topAlbumsByPeriod?.[periodo] || !stats.topTracksByPeriod?.[periodo])) {
    if (typeof cargarPeriodoEspecificoLastFm === 'function') {
      await cargarPeriodoEspecificoLastFm(username, periodo);
    }
  }

  renderizarContenidoEstadisticasAvanzadas();
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(false);
  }
}

function cambiarRangoSpotifyStats(rango) {
  if (!['short_term', 'medium_term', 'long_term'].includes(rango)) return;
  localStorage.setItem('mediary_spotify_selected_range', rango);
  renderizarContenidoEstadisticasAvanzadas();
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(false);
  }
}

function renderizarStatsMusica_(ctx) {
  const { regsPeriodo, todosRegs, nowYear, nowMonth, lastfmConnected, lastfmUser, lastfmStats, spotifyStats, spotifyAccumulator, periodTxt } = ctx;

  const tieneLastfm = !!(lastfmConnected && lastfmStats);
  const tieneSpotify = !!(spotifyStats && (spotifyStats.recentHours != null || (spotifyStats.topArtists && spotifyStats.topArtists.length) || (spotifyStats.topTracks && spotifyStats.topTracks.length)));

  // Cálculos de horas, discos, artistas y calificaciones
  const musicaPeriodo = regsPeriodo.filter(r => r.categoria === 'Musica');
  let horasMediary = 0;
  let discosMediary = 0;
  const artistasMediarySet = new Set();
  let sumCal = 0, numCal = 0;

  musicaPeriodo.forEach(r => {
    horasMediary += calcularHorasObraStats_(r);
    const sub = String(r.subcategoria || '').toLowerCase();
    if (sub.includes('disco') || sub.includes('álbum') || sub.includes('album')) discosMediary++;
    if (r.creador && r.creador !== 'Desconocido') artistasMediarySet.add(r.creador.trim().toLowerCase());
    if (Number(r.calificacion) > 0) { sumCal += Number(r.calificacion); numCal++; }
  });

  const metricasSp = obtenerMetricasMusicaSpotifyStats_(spotifyStats, spotifyAccumulator, nowYear, nowMonth);

  let horasTotalNum = horasMediary;
  let totalDiscos = Math.max(discosMediary, (lastfmUser?.album_count || lastfmStats?.albumCount || 0));
  let totalArtistas = Math.max(artistasMediarySet.size, (lastfmUser?.artist_count || lastfmStats?.artistCount || (spotifyStats?.topArtists?.length || 0)));

  if (tieneLastfm) {
    if (estadoStatsModal.periodo === 'year') {
      horasTotalNum = (lastfmStats.horasAnio || 0) + horasMediary;
    } else {
      horasTotalNum = (lastfmStats.horasTotal || 0) + horasMediary;
    }
  } else if (tieneSpotify) {
    if (estadoStatsModal.periodo === 'year') {
      horasTotalNum = metricasSp.horasAnio + horasMediary;
    } else {
      horasTotalNum = metricasSp.horasTotal + horasMediary;
    }
  }

  const avgCalMusica = numCal ? (sumCal / numCal).toFixed(1) : (tieneLastfm ? '4.8' : '0.0');
  const rachaDiscos = typeof calcularRachaDiscos === 'function' ? calcularRachaDiscos(todosRegs) : { rachaActual: 0, rachaMasAlta: 0 };

  // GRÁFICO 1: Horas escuchadas la última semana (detallado para cada día)
  const diasSem = obtenerDiasUltimaSemana_();
  const semMusicaItems = diasSem.map(d => {
    let horas = 0;
    if (lastfmStats && Array.isArray(lastfmStats.recentTracks)) {
      lastfmStats.recentTracks.forEach(tr => {
        if (tr.uts) {
          const td = new Date(tr.uts * 1000);
          if (td.getFullYear() === d.date.getFullYear() && td.getMonth() === d.date.getMonth() && td.getDate() === d.date.getDate()) {
            horas += (tr.duration || 210) / 3600;
          }
        } else if (tr.date) {
          const td = new Date(tr.date);
          if (!isNaN(td.getTime()) && td.getFullYear() === d.date.getFullYear() && td.getMonth() === d.date.getMonth() && td.getDate() === d.date.getDate()) {
            horas += (tr.duration || 210) / 3600;
          }
        }
      });
    }
    if (spotifyAccumulator?.byDay) {
      const iso = d.isoStr;
      if (spotifyAccumulator.byDay[iso]) {
        horas += (spotifyAccumulator.byDay[iso].ms || 0) / 3600000;
      }
    }
    todosRegs.forEach(r => {
      if (r.categoria === 'Musica') {
        const dr = obtenerFechaObjetoStats_(r);
        if (dr && dr.getFullYear() === d.date.getFullYear() && dr.getMonth() === d.date.getMonth() && dr.getDate() === d.date.getDate()) {
          horas += calcularHorasObraStats_(r);
        }
      }
    });

    const roundedH = Math.round(horas * 10) / 10;
    let disp = '-';
    if (roundedH > 0) {
      disp = roundedH < 1 ? `${Math.round(roundedH * 60)}m` : `${roundedH.toFixed(1)}h`;
    }
    return {
      label: d.label,
      valor: roundedH,
      displayVal: disp,
      sublabel: `${d.fullLabel}: ${disp === '-' ? '0 hrs' : disp}`
    };
  });

  // GRÁFICO 2: Horas escuchadas cada mes
  const mesesMusica = Array(12).fill(0);
  if (spotifyAccumulator?.byMonth) {
    for (let m = 0; m < 12; m++) {
      const moStr = `${nowYear}-${String(m + 1).padStart(2, '0')}`;
      if (spotifyAccumulator.byMonth[moStr]) {
        mesesMusica[m] += (spotifyAccumulator.byMonth[moStr].ms || 0) / 3600000;
      }
    }
  }
  if (lastfmStats?.byMonth) {
    for (let m = 0; m < 12; m++) {
      const moStr = `${nowYear}-${String(m + 1).padStart(2, '0')}`;
      if (lastfmStats.byMonth[moStr]) {
        mesesMusica[m] += (lastfmStats.byMonth[moStr].hours || 0);
      }
    }
  }
  todosRegs.forEach(r => {
    if (r.categoria === 'Musica') {
      const d = obtenerFechaObjetoStats_(r);
      if (d && (d.getFullYear() === nowYear || estadoStatsModal.periodo === 'all')) {
        mesesMusica[d.getMonth()] += calcularHorasObraStats_(r);
      }
    }
  });
  if (mesesMusica[nowMonth] === 0 && lastfmStats?.horasMes) {
    mesesMusica[nowMonth] = lastfmStats.horasMes;
  }
  const mesesAbrev = obtenerMesesAbrevStats_();
  const chartItemsMesesMusica = mesesAbrev.map((lbl, idx) => {
    const h = Math.round(mesesMusica[idx] * 10) / 10;
    let disp = '-';
    if (h > 0) {
      disp = h < 1 ? `${Math.round(h * 60)}m` : `${h.toFixed(1)}h`;
    }
    return {
      label: lbl,
      valor: h,
      displayVal: disp,
      sublabel: `${lbl}: ${disp === '-' ? '0 hrs' : disp}`
    };
  });

  const periodoActivo = localStorage.getItem('mediary_lastfm_selected_period') || (lastfmStats && lastfmStats.selectedPeriod) || 'overall';
  const topArtistsList = (lastfmStats?.topArtistsByPeriod && lastfmStats.topArtistsByPeriod[periodoActivo]) || lastfmStats?.topArtists || (spotifyStats?.topArtists || []);
  const topAlbumsList = (lastfmStats?.topAlbumsByPeriod && lastfmStats.topAlbumsByPeriod[periodoActivo]) || lastfmStats?.topAlbums || [];
  const topTracksList = (lastfmStats?.topTracksByPeriod && lastfmStats.topTracksByPeriod[periodoActivo]) || lastfmStats?.topTracks || (spotifyStats?.topTracks || []);
  const recentTracksList = lastfmStats?.recentTracks || [];

  return `
    <!-- KPIS MÚSICA: TOTAL HORAS, TOTAL DISCOS, TOTAL ARTISTAS, NOTA PROMEDIO, RACHAS -->
    <div class="stats-kpi-grid">
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("clock", "", 16)}</span> <span>${tLang('Total Horas', 'Total Hours')}</span></div>
        <div class="stats-kpi-val" style="color:#d51007;">${formatearHorasStats_(horasTotalNum)}</div>
        <div class="stats-kpi-sub">${tLang(`Horas de música en ${periodTxt}`, `Hours of music in ${periodTxt}`)}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("disc", "", 16)}</span> <span>${tLang('Total Discos', 'Total Albums')}</span></div>
        <div class="stats-kpi-val">${totalDiscos.toLocaleString()}</div>
        <div class="stats-kpi-sub">${tLang('Álbumes escuchados', 'Albums listened')}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("microphone", "", 16)}</span> <span>${tLang('Total Artistas', 'Total Artists')}</span></div>
        <div class="stats-kpi-val" style="color:var(--accent);">${totalArtistas.toLocaleString()}</div>
        <div class="stats-kpi-sub">${tLang('Artistas descubiertos', 'Artists discovered')}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("star", "", 16)}</span> <span>${tLang('Nota Promedio', 'Average Rating')}</span></div>
        <div class="stats-kpi-val" style="color:var(--star-active, #c8955a); display:flex; align-items:center; gap:4px;">${getHeroIcon("star", "", 16)} ${avgCalMusica}</div>
        <div class="stats-kpi-sub">${numCal ? tLang(`${numCal} calificaciones`, `${numCal} ratings`) : tLang('En tu diario', 'In your diary')}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span style="color:var(--cat-color-musica);">${getHeroIcon("fire", "", 16)}</span> <span>${tLang('Rachas de Música', 'Music Streaks')}</span></div>
        <div class="stats-kpi-val" style="color:var(--cat-color-musica);">${rachaDiscos.rachaActual} ${rachaDiscos.rachaActual === 1 ? tLang('día', 'day') : tLang('días', 'days')}</div>
        <div class="stats-kpi-sub">${tLang(`Récord histórico: ${rachaDiscos.rachaMasAlta} días`, `All-time record: ${rachaDiscos.rachaMasAlta} days`)}</div>
      </div>
    </div>

    <!-- MEJOR CALIFICADO -->
    ${renderizarCardMejorCalificado_(obtenerMejoresCalificados_(musicaPeriodo), tLang('música/discos', 'music/albums'))}

    <!-- DOS GRÁFICOS: ÚLTIMA SEMANA Y CADA MES -->
    ${generarGraficoBarras_({
      titulo: tLang('Horas Escuchadas en la Última Semana', 'Hours Listened Last Week'),
      subtitulo: tLang('Detalle para cada día (últimos 7 días)', 'Daily breakdown (last 7 days)'),
      items: semMusicaItems,
      unidad: 'hrs',
      colorBarra: 'var(--cat-color-musica)'
    })}

    ${generarGraficoBarras_({
      titulo: tLang('Horas Escuchadas cada Mes', 'Hours Listened per Month'),
      subtitulo: estadoStatsModal.periodo === 'year' ? tLang(`Año ${nowYear}`, `Year ${nowYear}`) : tLang('Histórico mensual', 'Monthly history'),
      items: chartItemsMesesMusica,
      unidad: 'hrs',
      colorBarra: 'var(--cat-color-musica)'
    })}

    <!-- BANNERS O TOPS DE LAST.FM / SPOTIFY -->
    ${tieneLastfm ? `
      <div class="stats-section-box">
        <div class="stats-section-title">
          <span>${getHeroIcon("disc", "", 16)} ${tLang('Álbumes Más Escuchados', 'Most Played Albums')}</span>
          <span style="font-size:0.74rem; color:var(--muted); font-weight:600;">Last.fm</span>
        </div>
        ${topAlbumsList.slice(0, 5).map((alb, idx) => `
          <div class="stats-ranking-row" style="cursor:pointer;" onclick="${alb.url ? `window.open('${escHtmlStats_(alb.url)}', '_blank')` : ''}">
            <div class="stats-rank-num rank-${idx + 1}">#${idx + 1}</div>
            ${alb.image
              ? `<img loading="lazy" decoding="async" src="${escHtmlStats_(alb.image)}" alt="${escHtmlStats_(alb.name)}" style="width:40px; height:40px; border-radius:4px; object-fit:cover; border:1px solid var(--border); flex-shrink:0;">`
              : `<div style="width:40px; height:40px; border-radius:4px; background:var(--card); border:1px solid var(--border); display:grid; place-items:center; font-size:1.15rem; flex-shrink:0;">${getHeroIcon('disc', '', 20)}</div>`}
            <div style="flex:1; min-width:0;">
              <strong style="font-size:0.86rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlStats_(alb.name)}</strong>
              <span style="font-size:0.72rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlStats_(alb.artist || tLang('Artista', 'Artist'))}</span>
            </div>
            <div style="text-align:right; flex-shrink:0;">
              <span style="font-size:0.78rem; font-weight:700; color:#d51007; display:block;">${(alb.playcount || 0).toLocaleString()}</span>
              <span style="font-size:0.68rem; color:var(--muted);">scrobbles</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="stats-section-box" style="text-align:center; padding:20px 14px;">
        <span style="font-size:0.84rem; color:var(--muted); display:block; margin-bottom:10px;">${tLang('Conecta tu cuenta de Last.fm o Spotify para sincronizar álbumes, artistas y reproducciones automáticamente.', 'Connect your Last.fm or Spotify account to automatically sync albums, artists, and plays.')}</span>
        <button type="button" class="btn-primary" onclick="abrirModalConectarLastFm()" style="background:#d51007; color:#fff; border:none; padding:8px 18px; border-radius:3px; font-weight:700; font-size:0.82rem; cursor:pointer;">
          <span>${getHeroIcon("musical-note", "", 14)} ${tLang('Conectar Last.fm', 'Connect Last.fm')}</span>
        </button>
      </div>
    `}
  `;
}

function renderizarStatsJuegos_(ctx) {
  const { regsPeriodo, todosRegs, nowYear, steamConnected, steamStats, psnConnected, psnStats, periodTxt } = ctx;
  const juegosPeriodo = regsPeriodo.filter(r => r.categoria === 'Juegos');
  const juegosTotales = todosRegs.filter(r => r.categoria === 'Juegos');

  const hPeriodo = juegosPeriodo.reduce((acc, r) => acc + calcularHorasObraStats_(r), 0);

  let sumCalifs = 0, numCalifs = 0;
  juegosPeriodo.forEach(r => {
    if (Number(r.calificacion) > 0) { sumCalifs += Number(r.calificacion); numCalifs++; }
  });
  const avgCal = numCalifs ? (sumCalifs / numCalifs).toFixed(1) : '0.0';

  const horasSteamTotal = Number(steamStats?.totalHours) || 0;
  const horasPsnTotal = Number(psnStats?.totalHours) || 0;
  const horasGamingTotal = horasSteamTotal + horasPsnTotal + hPeriodo;

  const totalJuegosSteam = Number(steamStats?.gamesCount) || (Array.isArray(steamStats?.topGames) ? steamStats.topGames.length : 0);
  const totalJuegosPsn = Number(psnStats?.gamesCount) || (Array.isArray(psnStats?.topGames) ? psnStats.topGames.length : 0);
  const totalRegistrado = juegosPeriodo.length + totalJuegosSteam + totalJuegosPsn;

  // Gráfico de juegos registrados vs meses del año
  const juegosMeses = Array(12).fill(0);
  todosRegs.forEach(r => {
    if (r.categoria === 'Juegos') {
      const d = obtenerFechaObjetoStats_(r);
      if (d && (d.getFullYear() === nowYear || estadoStatsModal.periodo === 'all')) {
        juegosMeses[d.getMonth()]++;
      }
    }
  });
  const mesesAbrev = obtenerMesesAbrevStats_();
  const unitJuegos = tLang('juegos', 'games');
  const chartItemsJuegos = mesesAbrev.map((m, idx) => ({
    label: m,
    valor: juegosMeses[idx],
    displayVal: juegosMeses[idx],
    sublabel: `${m}: ${juegosMeses[idx]} ${unitJuegos}`
  }));

  const top5Juegos = [...juegosPeriodo]
    .sort((a, b) => (Number(b.calificacion) || 0) - (Number(a.calificacion) || 0) || (parseFloat(b.horas) || 0) - (parseFloat(a.horas) || 0))
    .slice(0, 5);

  const trofeos = psnStats?.trophies || { level: 0, platinum: 0, gold: 0, silver: 0, bronze: 0, total: 0 };

  return `
    <!-- KPIS JUEGOS: TOTAL REGISTRADO, HORAS JUGADAS, NOTA PROMEDIO -->
    <div class="stats-kpi-grid">
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("folder", "", 16)}</span> <span>${tLang('Total Registrado', 'Total Logged')}</span></div>
        <div class="stats-kpi-val">${totalRegistrado}</div>
        <div class="stats-kpi-sub">${tLang(`${juegosPeriodo.length} en diario`, `${juegosPeriodo.length} in diary`)} ${totalJuegosPsn || totalJuegosSteam ? `(${totalJuegosPsn} PSN · ${totalJuegosSteam} Steam)` : ''}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("clock", "", 16)}</span> <span>${tLang('Horas Jugadas', 'Hours Played')}</span></div>
        <div class="stats-kpi-val" style="color:#66c0f4;">${formatearHorasStats_(horasGamingTotal)}</div>
        <div class="stats-kpi-sub">${tLang(`${formatearHorasStats_(hPeriodo)} en Mediary`, `${formatearHorasStats_(hPeriodo)} on Mediary`)}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("star", "", 16)}</span> <span>${tLang('Nota Promedio', 'Average Rating')}</span></div>
        <div class="stats-kpi-val" style="color:var(--star-active, #c8955a); display:flex; align-items:center; gap:4px;">${getHeroIcon("star", "", 16)} ${avgCal}</div>
        <div class="stats-kpi-sub">${tLang(`De ${numCalifs} calificados`, `From ${numCalifs} rated`)}</div>
      </div>
    </div>

    <!-- MEJOR CALIFICADO -->
    ${renderizarCardMejorCalificado_(obtenerMejoresCalificados_(juegosPeriodo), tLang('videojuegos', 'video games'))}

    <!-- GRÁFICO: JUEGOS REGISTRADOS VS MESES DEL AÑO -->
    ${generarGraficoBarras_({
      titulo: tLang('Juegos Registrados por Mes', 'Games Logged per Month'),
      subtitulo: estadoStatsModal.periodo === 'year' ? tLang(`Año ${nowYear}`, `Year ${nowYear}`) : tLang('Histórico mensual', 'Monthly history'),
      items: chartItemsJuegos,
      unidad: unitJuegos,
      colorBarra: 'var(--cat-color-juegos)'
    })}

    <!-- INTEGRACIÓN PLAYSTATION (TROFEOS) -->
    ${psnConnected && psnStats ? `
      <div class="stats-section-box">
        <div class="stats-section-title">
          <span>${getHeroIcon("trophy", "", 16)} ${tLang('Trofeos de PlayStation', 'PlayStation Trophies')}</span>
          <span style="font-size:0.75rem; background:rgba(0,112,209,0.25); color:#60a5fa; font-weight:700; padding:2px 8px; border-radius:2px;">${tLang('Nivel', 'Level')} ${trofeos.level || 1}</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; margin-top:8px; text-align:center;">
          <div style="background:transparent; border:none; padding:6px 4px;">
            <div>${getHeroIcon("trophy", "", 24)}</div>
            <strong style="font-size:1.05rem; color:#c084fc; display:block;">${trofeos.platinum || 0}</strong>
            <span style="font-size:0.68rem; color:#a855f7; font-weight:700; text-transform:uppercase;">${tLang('Platino', 'Platinum')}</span>
          </div>
          <div style="background:transparent; border:none; padding:6px 4px;">
            <div>${getHeroIcon("trophy", "", 24)}</div>
            <strong style="font-size:1.05rem; color:#fde047; display:block;">${trofeos.gold || 0}</strong>
            <span style="font-size:0.68rem; color:#eab308; font-weight:700; text-transform:uppercase;">${tLang('Oro', 'Gold')}</span>
          </div>
          <div style="background:transparent; border:none; padding:6px 4px;">
            <div>${getHeroIcon("trophy", "", 24)}</div>
            <strong style="font-size:1.05rem; color:#e2e8f0; display:block;">${trofeos.silver || 0}</strong>
            <span style="font-size:0.68rem; color:#94a3b8; font-weight:700; text-transform:uppercase;">${tLang('Plata', 'Silver')}</span>
          </div>
          <div style="background:transparent; border:none; padding:6px 4px;">
            <div>${getHeroIcon("trophy", "", 24)}</div>
            <strong style="font-size:1.05rem; color:#fdba74; display:block;">${trofeos.bronze || 0}</strong>
            <span style="font-size:0.68rem; color:#d97706; font-weight:700; text-transform:uppercase;">${tLang('Bronce', 'Bronze')}</span>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- TOP VIDEOJUEGOS FAVORITOS EN MEDIARY -->
    <div class="stats-section-box">
      <div class="stats-section-title">
        <span>${getHeroIcon("star", "", 16)} ${tLang('Videojuegos Favoritos (Mediary)', 'Favorite Video Games (Mediary)')}</span>
        <span style="font-size:0.74rem; color:var(--muted); font-weight:600;">${periodTxt}</span>
      </div>
      ${top5Juegos.length ? top5Juegos.map((j, idx) => `
        <div class="stats-ranking-row">
          <div class="stats-rank-num rank-${idx + 1}">#${idx + 1}</div>
          <img loading="lazy" decoding="async" src="${escHtmlStats_(j.poster || '')}" onerror="this.src='./icon.png'" style="width:38px; height:52px; border-radius:4px; object-fit:cover; background:var(--card); flex-shrink:0;">
          <div style="flex:1; min-width:0;">
            <strong style="font-size:0.86rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlStats_(j.titulo)}</strong>
            <span style="font-size:0.74rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlStats_(j.creador || tLang('Estudio', 'Studio'))} ${j.horas ? `· ${j.horas}` : ''}</span>
          </div>
          <div style="font-weight:700; font-size:0.84rem; color:var(--star-active, #c8955a); flex-shrink:0; display:inline-flex; align-items:center; gap:3px;">${getHeroIcon('star', '', 12)} ${Number(j.calificacion) ? Number(j.calificacion).toFixed(1) : '—'}</div>
        </div>
      `).join('') : `<div style="color:var(--muted); font-size:0.82rem; text-align:center; padding:16px;">${tLang('Aún no has calificado videojuegos en este período.', 'You have not rated any video games in this period yet.')}</div>`}
    </div>
  `;
}

function renderizarStatsLecturas_(ctx) {
  const { regsPeriodo, todosRegs, nowYear, periodTxt } = ctx;
  const lecturasPeriodo = regsPeriodo.filter(r => r.categoria === 'Lecturas');
  const lecturasTotales = todosRegs.filter(r => r.categoria === 'Lecturas');

  let sumCalifs = 0, numCalifs = 0;
  lecturasPeriodo.forEach(r => {
    if (Number(r.calificacion) > 0) { sumCalifs += Number(r.calificacion); numCalifs++; }
  });
  const avgCal = numCalifs ? (sumCalifs / numCalifs).toFixed(1) : '0.0';

  const rachaLectura = typeof calcularRachaLectura === 'function' ? calcularRachaLectura() : { rachaActual: 0, rachaMasAlta: 0 };

  // Subcategorías: Libro, Cómic, Manga
  const libros = lecturasPeriodo.filter(r => {
    const s = String(r.subcategoria || '').toLowerCase();
    return !s.includes('comic') && !s.includes('cómic') && !s.includes('manga');
  });
  const comics = lecturasPeriodo.filter(r => {
    const s = String(r.subcategoria || '').toLowerCase();
    return s.includes('comic') || s.includes('cómic');
  });
  const mangas = lecturasPeriodo.filter(r => {
    const s = String(r.subcategoria || '').toLowerCase();
    return s.includes('manga');
  });

  const calcSubAvg = (arr) => {
    const cal = arr.filter(r => Number(r.calificacion) > 0);
    if (!cal.length) return '—';
    const sum = cal.reduce((acc, r) => acc + Number(r.calificacion), 0);
    return (sum / cal.length).toFixed(1);
  };
  const avgLibros = calcSubAvg(libros);
  const avgComics = calcSubAvg(comics);
  const avgMangas = calcSubAvg(mangas);

  // GRÁFICO 1: Tiempo leído última semana (detallado para cada día)
  const mapaTiempos = typeof obtenerMapaTiemposLectura === 'function' ? obtenerMapaTiemposLectura() : {};
  const diasSem = obtenerDiasUltimaSemana_();
  const semLecturaItems = diasSem.map(d => {
    let min = 0;
    const obj1 = mapaTiempos[d.diaStr];
    const obj2 = mapaTiempos[d.isoStr];
    if (obj1) min += extraerMinutosDeTiempoLecturaTexto_(obj1.texto || obj1);
    else if (obj2) min += extraerMinutosDeTiempoLecturaTexto_(obj2.texto || obj2);

    todosRegs.forEach(r => {
      if (r.categoria === 'Lecturas') {
        const fr = obtenerFechaObjetoStats_(r);
        if (fr && fr.getFullYear() === d.date.getFullYear() && fr.getMonth() === d.date.getMonth() && fr.getDate() === d.date.getDate()) {
          const hReg = extraerHorasRegistro(r);
          if (hReg > 0 && min === 0) min += Math.round(hReg * 60);
        }
      }
    });

    const hrs = min / 60;
    let disp = '-';
    if (min > 0) {
      disp = min >= 60 ? (hrs % 1 === 0 ? `${hrs}h` : `${hrs.toFixed(1)}h`) : `${min}m`;
    }
    return {
      label: d.label,
      valor: min,
      displayVal: disp,
      sublabel: `${d.fullLabel}: ${disp === '-' ? '0 min' : disp}`
    };
  });

  // GRÁFICO 2: Tiempo leído por meses del último año
  const mesesLectura = Array(12).fill(0);
  Object.entries(mapaTiempos).forEach(([fStr, val]) => {
    const d = (typeof parsearFechaAObjeto === 'function' ? parsearFechaAObjeto(fStr) : null) || (fStr.includes('-') ? new Date(fStr) : null);
    if (d && !isNaN(d.getTime())) {
      if (d.getFullYear() === nowYear || estadoStatsModal.periodo === 'all') {
        mesesLectura[d.getMonth()] += extraerMinutosDeTiempoLecturaTexto_(val?.texto || val);
      }
    }
  });
  todosRegs.forEach(r => {
    if (r.categoria === 'Lecturas') {
      const d = obtenerFechaObjetoStats_(r);
      if (d && (d.getFullYear() === nowYear || estadoStatsModal.periodo === 'all')) {
        const m = d.getMonth();
        const h = extraerHorasRegistro(r) || 6.0;
        if (mesesLectura[m] === 0) {
          mesesLectura[m] += Math.round(h * 60);
        }
      }
    }
  });

  const mesesAbrev = obtenerMesesAbrevStats_();
  const chartItemsMesesLectura = mesesAbrev.map((lbl, idx) => {
    const min = mesesLectura[idx];
    const hrs = min / 60;
    let disp = '-';
    if (min > 0) {
      disp = hrs >= 1 ? `${hrs.toFixed(1)}h` : `${min}m`;
    }
    return {
      label: lbl,
      valor: Math.round(hrs * 10) / 10,
      displayVal: disp,
      sublabel: `${lbl}: ${disp === '-' ? '0 min' : disp}`
    };
  });

  const top5Lecturas = [...lecturasPeriodo]
    .sort((a, b) => (Number(b.calificacion) || 0) - (Number(a.calificacion) || 0))
    .slice(0, 5);

  const lblLibros = tLang('Libros', 'Books');
  const lblComics = tLang('Cómics', 'Comics');
  const lblMangas = tLang('Mangas', 'Manga');
  const lblNotaMedia = tLang('Nota media:', 'Avg rating:');

  return `
    <!-- KPIS: PRODUCTOS TOTALES, NOTA PROMEDIO, RACHAS -->
    <div class="stats-kpi-grid">
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("book-open", "", 16)}</span> <span>${tLang('Productos Totales', 'Total Items')}</span></div>
        <div class="stats-kpi-val">${lecturasPeriodo.length}</div>
        <div class="stats-kpi-sub">${tLang(`Libros, cómics y mangas en ${periodTxt}`, `Books, comics & manga in ${periodTxt}`)}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span>${getHeroIcon("star", "", 16)}</span> <span>${tLang('Nota Promedio', 'Average Rating')}</span></div>
        <div class="stats-kpi-val" style="color:var(--star-active, #c8955a); display:flex; align-items:center; gap:4px;">${getHeroIcon("star", "", 16)} ${avgCal}</div>
        <div class="stats-kpi-sub">${tLang(`De ${numCalifs} evaluadas`, `From ${numCalifs} rated`)}</div>
      </div>
      <div class="stats-kpi-card">
        <div class="stats-kpi-label"><span style="color:var(--cat-color-lecturas);">${getHeroIcon("fire", "", 16)}</span> <span>${tLang('Rachas de Lectura', 'Reading Streaks')}</span></div>
        <div class="stats-kpi-val" style="color:var(--cat-color-lecturas);">${rachaLectura.rachaActual} ${rachaLectura.rachaActual === 1 ? tLang('día', 'day') : tLang('días', 'days')}</div>
        <div class="stats-kpi-sub">${tLang(`Récord histórico: ${rachaLectura.rachaMasAlta} días`, `All-time record: ${rachaLectura.rachaMasAlta} days`)}</div>
      </div>
    </div>

    <!-- MEJOR CALIFICADO -->
    ${renderizarCardMejorCalificado_(obtenerMejoresCalificados_(lecturasPeriodo), tLang('lecturas', 'readings'))}

    <!-- PRODUCTOS TOTALES Y NOTA PROMEDIO POR SUBCATEGORÍA (LIBRO, COMIC, MANGA) -->
    <div class="stats-section-box">
      <div class="stats-section-title">
        <span>${getHeroIcon("squares-2x2", "", 16)} ${tLang('Desglose por Subcategoría', 'Breakdown by Subcategory')}</span>
        <span style="font-size:0.75rem; color:var(--muted); font-weight:600;">${tLang('Libro, Cómic y Manga', 'Book, Comic & Manga')}</span>
      </div>
      ${lecturasPeriodo.length ? `
      <div style="height:6px; border-radius:3px; background:var(--card); display:flex; overflow:hidden; margin:8px 0 10px;">
        <div style="width:${Math.round((libros.length / lecturasPeriodo.length) * 100)}%; background:var(--cat-color-libros);" title="${lblLibros}: ${libros.length} (${Math.round((libros.length / lecturasPeriodo.length) * 100)}%)"></div>
        <div style="width:${Math.round((comics.length / lecturasPeriodo.length) * 100)}%; background:var(--cat-color-comics);" title="${lblComics}: ${comics.length} (${Math.round((comics.length / lecturasPeriodo.length) * 100)}%)"></div>
        <div style="width:${Math.round((mangas.length / lecturasPeriodo.length) * 100)}%; background:var(--cat-color-mangas);" title="${lblMangas}: ${mangas.length} (${Math.round((mangas.length / lecturasPeriodo.length) * 100)}%)"></div>
      </div>
      ` : ''}
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:10px; margin-top:4px;">
        <div style="background:transparent; border:none; padding:4px 6px; text-align:left;">
          <div style="font-size:0.76rem; color:var(--cat-color-libros); font-weight:700; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <span>${getHeroIcon("book-open", "", 14)}</span> <span>${lblLibros}</span>
          </div>
          <div style="font-size:1.35rem; font-weight:800; color:var(--text); line-height:1.2;">${libros.length}</div>
          <div style="font-size:0.75rem; color:var(--muted); margin-top:4px; display:flex; align-items:center; gap:4px;">
            <span>${lblNotaMedia}</span> <strong style="color:var(--star-active, #c8955a); display:inline-flex; align-items:center; gap:2px;">${getHeroIcon("star", "", 11)} ${avgLibros}</strong>
          </div>
        </div>
        <div style="background:transparent; border:none; padding:4px 6px; text-align:left;">
          <div style="font-size:0.76rem; color:var(--cat-color-comics); font-weight:700; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <span>${getHeroIcon("newspaper", "", 14)}</span> <span>${lblComics}</span>
          </div>
          <div style="font-size:1.35rem; font-weight:800; color:var(--text); line-height:1.2;">${comics.length}</div>
          <div style="font-size:0.75rem; color:var(--muted); margin-top:4px; display:flex; align-items:center; gap:4px;">
            <span>${lblNotaMedia}</span> <strong style="color:var(--star-active, #c8955a); display:inline-flex; align-items:center; gap:2px;">${getHeroIcon("star", "", 11)} ${avgComics}</strong>
          </div>
        </div>
        <div style="background:transparent; border:none; padding:4px 6px; text-align:left;">
          <div style="font-size:0.76rem; color:var(--cat-color-mangas); font-weight:700; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <span>${getHeroIcon("bookmark", "", 14)}</span> <span>${lblMangas}</span>
          </div>
          <div style="font-size:1.35rem; font-weight:800; color:var(--text); line-height:1.2;">${mangas.length}</div>
          <div style="font-size:0.75rem; color:var(--muted); margin-top:4px; display:flex; align-items:center; gap:4px;">
            <span>${lblNotaMedia}</span> <strong style="color:var(--star-active, #c8955a); display:inline-flex; align-items:center; gap:2px;">${getHeroIcon("star", "", 11)} ${avgMangas}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- DOS GRÁFICOS: TIEMPO LEÍDO ÚLTIMA SEMANA Y POR MESES -->
    ${generarGraficoBarras_({
      titulo: tLang('Tiempo Leído en la Última Semana', 'Reading Time Last Week'),
      subtitulo: tLang('Detalle diario de lectura (últimos 7 días)', 'Daily reading breakdown (last 7 days)'),
      items: semLecturaItems,
      unidad: 'min',
      colorBarra: 'var(--cat-color-lecturas)'
    })}

    ${generarGraficoBarras_({
      titulo: tLang('Tiempo Leído por Meses', 'Reading Time by Month'),
      subtitulo: estadoStatsModal.periodo === 'year' ? tLang(`Año ${nowYear}`, `Year ${nowYear}`) : tLang('Histórico mensual', 'Monthly history'),
      items: chartItemsMesesLectura,
      unidad: 'hrs',
      colorBarra: 'var(--cat-color-lecturas)'
    })}

    <!-- TOP 5 LECTURAS FAVORITAS -->
    <div class="stats-section-box">
      <div class="stats-section-title">
        <span>${tLang('Top 5 Lecturas Favoritas', 'Top 5 Favorite Reads')}</span>
        <span style="font-size:0.75rem; color:var(--muted); font-weight:600;">${periodTxt}</span>
      </div>
      ${top5Lecturas.length ? top5Lecturas.map((l, idx) => `
        <div class="stats-ranking-row">
          <div class="stats-rank-num rank-${idx + 1}">#${idx + 1}</div>
          <img loading="lazy" decoding="async" src="${escHtmlStats_(l.poster || '')}" onerror="this.src='./icon.png'" style="width:38px; height:52px; border-radius:4px; object-fit:cover; background:var(--card); flex-shrink:0;">
          <div style="flex:1; min-width:0;">
            <strong style="font-size:0.86rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlStats_(l.titulo)}</strong>
            <span style="font-size:0.74rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${escHtmlStats_(l.creador || tLang('Autor', 'Author'))} ${l.anio ? `· ${l.anio}` : ''} ${l.subcategoria ? `(${escHtmlStats_(typeof traducirSub === 'function' ? traducirSub(l.subcategoria) : l.subcategoria)})` : ''}</span>
          </div>
          <div style="font-weight:700; font-size:0.84rem; color:var(--star-active, #c8955a); flex-shrink:0; display:inline-flex; align-items:center; gap:3px;">${getHeroIcon('star', '', 12)} ${Number(l.calificacion) ? Number(l.calificacion).toFixed(1) : '—'}</div>
        </div>
      `).join('') : `<div style="color:var(--muted); font-size:0.82rem; text-align:center; padding:16px;">${tLang('No hay lecturas registradas en este período.', 'No readings logged in this period.')}</div>`}
    </div>
  `;
}

function obtenerTop5ArtistasStats_(musicaRegs, spotifyStats, lastfmStats) {
  if (!lastfmStats) {
    try {
      const raw = localStorage.getItem('mediary_lastfm_stats');
      if (raw) lastfmStats = JSON.parse(raw);
    } catch(e) {}
  }
  if (lastfmStats && Array.isArray(lastfmStats.topArtists) && lastfmStats.topArtists.length) {
    return lastfmStats.topArtists.slice(0, 5).map((a, idx) => ({
      nombre: a.name,
      poster: a.image || '',
      genres: a.genres || [],
      scrobbles: a.playcount || 0,
      url: a.url || '',
      score: (5 - idx) * 10
    }));
  }
  if (!spotifyStats || !Array.isArray(spotifyStats.topArtists) || !spotifyStats.topArtists.length) {
    return [];
  }
  return spotifyStats.topArtists.slice(0, 5).map((a, idx) => ({
    nombre: a.name,
    poster: a.image || '',
    genres: a.genres || [],
    popularity: a.popularity,
    url: a.url || '',
    score: (5 - idx) * 10
  }));
}

function obtenerTop5CancionesStats_(musicaRegs, spotifyStats, lastfmStats) {
  if (!lastfmStats) {
    try {
      const raw = localStorage.getItem('mediary_lastfm_stats');
      if (raw) lastfmStats = JSON.parse(raw);
    } catch(e) {}
  }
  if (lastfmStats && Array.isArray(lastfmStats.topTracks) && lastfmStats.topTracks.length) {
    return lastfmStats.topTracks.slice(0, 5).map((t, idx) => ({
      titulo: t.name,
      artista: t.artist || '',
      album: t.album || '',
      poster: t.image || '',
      duration_ms: (t.duration || 0) * 1000,
      url: t.url || '',
      calificacion: 5
    }));
  }
  if (!spotifyStats || !Array.isArray(spotifyStats.topTracks) || !spotifyStats.topTracks.length) {
    return [];
  }
  return spotifyStats.topTracks.slice(0, 5).map((t, idx) => ({
    titulo: t.name,
    artista: t.artist || '',
    album: t.album || '',
    poster: t.image || '',
    duration_ms: t.duration_ms,
    url: t.url || '',
    calificacion: 5
  }));
}

