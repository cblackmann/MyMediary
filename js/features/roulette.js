/* Mediary — js/features/roulette.js */
/* ============================================================
   MEZCLAR WATCHLISTS CON UN AMIGO (CO-OP WATCHLIST & RULETA)
   ============================================================ */
let ruletaAmigoSeleccionadoEmail = '';
let ruletaAmigosSeleccionadosEmails = [];
let ruletaCategoriaActual = 'Peliculas'; // 'Peliculas' | 'Series' | 'Juegos'
let ruletaModoActual = 'comun'; // 'comun' | 'suma'
let ruletaCandidatasActuales = [];
let ruletaAmigoWatchlistCache = {}; // email -> array of items
let ruletaTimerAnim = null;
let ruletaObraElegidaActual = null;
let ruletaCargandoAmigos = false;

function categorizarItemWatchlist(item) {
  if (!item) return null;
  const cat = String(item.categoria || '').trim().toLowerCase();
  const sub = String(item.subcategoria || '').trim().toLowerCase();

  // Películas
  if (cat.includes('peli') || sub.includes('peli') || sub.includes('movie') || (cat === 'peliculas' && !sub.includes('serie'))) return 'Peliculas';
  // Series
  if (cat.includes('serie') || sub.includes('serie') || sub.includes('temporada') || sub.includes('docuserie')) return 'Series';
  // Música
  if (cat.includes('music') || cat.includes('música') || sub.includes('music') || sub.includes('disco') || sub.includes('to listen') || sub.includes('concierto') || sub.includes('album') || sub.includes('álbum') || sub.includes('artista')) return 'Musica';
  // Juegos
  if (cat.includes('juego') || sub.includes('juego') || sub.includes('game') || sub.includes('videojuego') || sub.includes('to play')) return 'Juegos';
  // Lecturas
  if (cat.includes('lectur') || cat.includes('libro') || cat.includes('book') || sub.includes('libro') || sub.includes('comic') || sub.includes('cómic') || sub.includes('manga') || sub.includes('to read')) return 'Lecturas';

  if (item.categoria && ['Peliculas', 'Series', 'Musica', 'Juegos', 'Lecturas'].includes(item.categoria)) {
    return item.categoria;
  }
  return null;
}

function normalizarTituloObra(t) {
  return String(t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\[s\d+\]/gi, '')
    .replace(/\s*temporada\s*\d+/gi, '')
    .replace(/\s*season\s*\d+/gi, '')
    .replace(/\s*\(\d{4}\)$/, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function obtenerClavesItem(item) {
  const claves = new Set();
  const k1 = normalizarTituloObra(item.titulo);
  if (k1) claves.add(k1);
  const k2 = normalizarTituloObra(item.subtitulo);
  if (k2 && k2.length >= 3) claves.add(k2);
  const k3 = normalizarTituloObra(item.tituloOriginal);
  if (k3 && k3.length >= 3) claves.add(k3);
  const k4 = normalizarTituloObra(item.tituloIngles);
  if (k4 && k4.length >= 3) claves.add(k4);
  return Array.from(claves);
}

function sonObrasCoincidentes(itemA, itemB) {
  if (!itemA || !itemB) return false;
  const catA = itemA.categoriaDetectada;
  const catB = itemB.categoriaDetectada;
  if (catA && catB && catA !== catB) return false;

  const clavesA = obtenerClavesItem(itemA);
  const clavesB = obtenerClavesItem(itemB);
  for (const ka of clavesA) {
    if (clavesB.includes(ka)) return true;
  }
  if (itemA.anio && itemB.anio && String(itemA.anio).trim() === String(itemB.anio).trim()) {
    const kA = normalizarTituloObra(itemA.titulo);
    const kB = normalizarTituloObra(itemB.titulo);
    if (kA && kB && (kA.includes(kB) || kB.includes(kA))) return true;
  }
  return false;
}

function obtenerEmojiYNombreCategoria(cat) {
  const l = userPrefs.lang || 'es';
  if (cat === 'Peliculas') return { emoji: getHeroIcon('film'), label: l === 'en' ? 'Movie' : 'Película' };
  if (cat === 'Series') return { emoji: getHeroIcon('tv'), label: l === 'en' ? 'Series' : 'Serie' };
  if (cat === 'Musica') return { emoji: getHeroIcon('musical-note'), label: l === 'en' ? 'Music' : 'Música' };
  if (cat === 'Juegos') return { emoji: getHeroIcon('gamepad'), label: l === 'en' ? 'Game' : 'Juego' };
  if (cat === 'Lecturas') return { emoji: getHeroIcon('book-open'), label: l === 'en' ? 'Reading' : 'Lectura' };
  return { emoji: getHeroIcon('sparkles'), label: l === 'en' ? 'Item' : 'Obra' };
}

function abrirModalRuletaConAmigoActual() {
  const email = (amigoSeleccionadoActual ? (amigoSeleccionadoActual.email || amigoSeleccionadoActual.user_email) : '') || (typeof amigoRegsEmailActual !== 'undefined' ? amigoRegsEmailActual : '') || (typeof amigoPerfilEmailActual !== 'undefined' ? amigoPerfilEmailActual : '');
  cerrarModalPerfilAmigo();
  abrirModalRuleta('Peliculas', email);
}

function abrirModalRuletaPeliculas(amigoEmailInicial = '') {
  abrirModalRuleta('Peliculas', amigoEmailInicial);
}

function abrirModalRuleta(catInicial = 'Peliculas', amigoEmailInicial = '') {
  const modal = document.getElementById('modal-ruleta-amigo');
  if (!modal) return;

  if (!estado.userEmail) {
    if (typeof mostrarToastPersonalizado === 'function') {
      mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Sign in to your account to use co-op roulette with a friend.' : 'Inicia sesión en tu cuenta para usar la ruleta con un amigo.');
    }
    if (typeof abrirModalAuthSupabase === 'function') abrirModalAuthSupabase('login');
    return;
  }

  // Restaurar amigos de localStorage si aún no se han cargado en estado.amigos
  if (!estado.amigos?.length && estado.userEmail) {
    try {
      const c = localStorage.getItem('mediary_cache_amigos_' + estado.userEmail.toLowerCase());
      if (c) estado.amigos = JSON.parse(c);
    } catch(e) {}
  }

  ruletaCategoriaActual = (catInicial && ['Peliculas', 'Series', 'Juegos'].includes(catInicial)) ? catInicial : 'Peliculas';
  ruletaModoActual = 'comun';
  ruletaObraElegidaActual = null;

  if (amigoEmailInicial) {
    ruletaAmigosSeleccionadosEmails = [amigoEmailInicial];
  } else if (!ruletaAmigosSeleccionadosEmails.length) {
    ruletaAmigosSeleccionadosEmails = estado.amigos?.length ? [estado.amigos[0].email] : [];
  }
  ruletaAmigoSeleccionadoEmail = ruletaAmigosSeleccionadosEmails[0] || '';

  // Reset UI
  const wCard = document.getElementById('ruleta-winner-card');
  const sCard = document.getElementById('ruleta-spinning-card');
  const eBox = document.getElementById('ruleta-empty-box');
  if (wCard) wCard.style.display = 'none';
  if (sCard) sCard.style.display = 'none';
  if (eBox) eBox.style.display = 'none';
  const det = document.getElementById('ruleta-details-candidatas');
  if (det) det.open = false;

  actualizarBotonesCategoriaRuleta();
  actualizarBotonesModoRuleta();
  modal.style.display = 'flex';

  renderizarAmigosSelectorRuleta(amigoEmailInicial);

  // Si no tenemos amigos en caché o memoria, cargar desde el servidor
  if (!estado.amigos?.length) {
    recargarAmigosRuleta(amigoEmailInicial);
  } else {
    // Si tenemos amigos, cargar la watchlist de los seleccionados
    cargarDatosRuleta();
  }
}

function recargarAmigosRuleta(amigoEmailInicial = '') {
  const loadingEl = document.getElementById('ruleta-amigos-loading');
  if (loadingEl) loadingEl.style.display = 'block';

  google.script.run.withSuccessHandler(res => {
    if (loadingEl) loadingEl.style.display = 'none';
    if (!res || !res.exito) return;
    estado.amigos = res.amigos || [];
    if (estado.userEmail) {
      try {
        localStorage.setItem('mediary_cache_amigos_' + estado.userEmail.toLowerCase(), JSON.stringify(estado.amigos));
      } catch(e) {}
    }
    renderizarAmigosSelectorRuleta(amigoEmailInicial);
    if (estado.amigos.length) {
      cargarDatosRuleta();
    }
  }).withFailureHandler(() => {
    if (loadingEl) loadingEl.style.display = 'none';
    renderizarAmigosSelectorRuleta(amigoEmailInicial);
  }).obtenerDatosAmigosUsuario(estado.userEmail);
}

function renderizarAmigosSelectorRuleta(amigoEmailInicial = '') {
  const amigos = estado.amigos || [];
  const chipsCont = document.getElementById('ruleta-amigos-chips');
  const countBadge = document.getElementById('ruleta-amigos-count-badge');
  const noAmigosAlert = document.getElementById('ruleta-sin-amigos-alert');
  const btnGirar = document.getElementById('btn-ruleta-girar-principal');

  if (!amigos.length) {
    if (chipsCont) chipsCont.style.display = 'none';
    if (countBadge) countBadge.textContent = '0 amigos';
    if (noAmigosAlert) noAmigosAlert.style.display = 'block';
    if (btnGirar) btnGirar.style.display = 'none';
    return;
  }

  if (noAmigosAlert) noAmigosAlert.style.display = 'none';

  // Si viene inicial, fijarlo
  if (amigoEmailInicial && amigos.some(a => a.email === amigoEmailInicial)) {
    ruletaAmigosSeleccionadosEmails = [amigoEmailInicial];
  } else {
    // Filtrar válidos
    ruletaAmigosSeleccionadosEmails = (ruletaAmigosSeleccionadosEmails || []).filter(em => amigos.some(a => a.email === em));
    if (!ruletaAmigosSeleccionadosEmails.length) {
      ruletaAmigosSeleccionadosEmails = [amigos[0].email];
    }
  }
  ruletaAmigoSeleccionadoEmail = ruletaAmigosSeleccionadosEmails[0] || '';

  if (countBadge) {
    const cnt = ruletaAmigosSeleccionadosEmails.length;
    countBadge.textContent = tLang(
      `${cnt} de ${amigos.length} seleccionado${cnt > 1 ? 's' : ''}`,
      `${cnt} of ${amigos.length} selected`
    );
  }

  // Render carrusel de tarjetas de amigos para selección múltiple
  if (chipsCont) {
    chipsCont.style.display = 'flex';
    chipsCont.innerHTML = amigos.map(a => {
      const isAct = ruletaAmigosSeleccionadosEmails.includes(a.email);
      const nick = a.nickname || tLang('Amigo', 'Friend');
      const isImg = a.avatar && (a.avatar.startsWith('http') || a.avatar.startsWith('data:'));
      const avatarHtml = isImg
        ? `<img loading="lazy" decoding="async" src="${a.avatar}" alt="${nick}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<span>${a.avatar || '🦊'}</span>`;
      return `
        <div class="ruleta-amigo-chip ${isAct ? 'active' : ''}" data-email="${a.email}" onclick="toggleAmigoRuleta('${a.email.replace(/'/g, "\\'")}')">
          <div class="ruleta-amigo-avatar">${avatarHtml}</div>
          <span class="ruleta-amigo-nick">${nick}</span>
          <span class="ruleta-amigo-check">${getHeroIcon('check', '', 14)}</span>
        </div>
      `;
    }).join('');
  }

  if (btnGirar) btnGirar.style.display = 'inline-flex';
}

function toggleAmigoRuleta(email) {
  if (!email) return;
  const idx = ruletaAmigosSeleccionadosEmails.indexOf(email);
  if (idx >= 0) {
    if (ruletaAmigosSeleccionadosEmails.length > 1) {
      ruletaAmigosSeleccionadosEmails.splice(idx, 1);
    }
  } else {
    ruletaAmigosSeleccionadosEmails.push(email);
  }
  ruletaAmigoSeleccionadoEmail = ruletaAmigosSeleccionadosEmails[0] || '';

  // Actualizar chips activos
  document.querySelectorAll('#ruleta-amigos-chips .ruleta-amigo-chip').forEach(ch => {
    const em = ch.getAttribute('data-email');
    ch.classList.toggle('active', ruletaAmigosSeleccionadosEmails.includes(em));
  });

  const countBadge = document.getElementById('ruleta-amigos-count-badge');
  const amigos = estado.amigos || [];
  if (countBadge) {
    const cnt = ruletaAmigosSeleccionadosEmails.length;
    countBadge.textContent = tLang(
      `${cnt} de ${amigos.length} seleccionado${cnt > 1 ? 's' : ''}`,
      `${cnt} of ${amigos.length} selected`
    );
  }

  ruletaObraElegidaActual = null;
  const wCard = document.getElementById('ruleta-winner-card');
  const sCard = document.getElementById('ruleta-spinning-card');
  if (wCard) wCard.style.display = 'none';
  if (sCard) sCard.style.display = 'none';

  actualizarBotonesModoRuleta();
  cargarDatosRuleta();
}

function seleccionarAmigoRuleta(email) {
  toggleAmigoRuleta(email);
}

function alCambiarAmigoRuletaSelect(val) {
  toggleAmigoRuleta(val);
}

function cerrarModalRuleta() {
  if (ruletaTimerAnim) {
    clearInterval(ruletaTimerAnim);
    ruletaTimerAnim = null;
  }
  const modal = document.getElementById('modal-ruleta-amigo');
  if (modal) modal.style.display = 'none';
}

function cambiarCategoriaRuleta(cat) {
  ruletaCategoriaActual = cat || 'todas';
  actualizarBotonesCategoriaRuleta();
  ruletaObraElegidaActual = null;
  const wCard = document.getElementById('ruleta-winner-card');
  const sCard = document.getElementById('ruleta-spinning-card');
  if (wCard) wCard.style.display = 'none';
  if (sCard) sCard.style.display = 'none';
  actualizarVistaCandidatasRuleta();
}

function actualizarBotonesCategoriaRuleta() {
  const cats = ['Peliculas', 'Series', 'Juegos'];
  cats.forEach(c => {
    const btn = document.getElementById(`btn-cat-ruleta-${c}`);
    if (btn) {
      btn.classList.toggle('active', ruletaCategoriaActual === c);
    }
  });
}

function cambiarModoRuleta(modo) {
  if (modo !== 'comun' && modo !== 'suma') return;
  ruletaModoActual = modo;
  actualizarBotonesModoRuleta();
  ruletaObraElegidaActual = null;
  const wCard = document.getElementById('ruleta-winner-card');
  const sCard = document.getElementById('ruleta-spinning-card');
  if (wCard) wCard.style.display = 'none';
  if (sCard) sCard.style.display = 'none';
  actualizarVistaCandidatasRuleta();
}

function actualizarBotonesModoRuleta() {
  const btnComun = document.getElementById('btn-modo-ruleta-comun');
  const btnSuma = document.getElementById('btn-modo-ruleta-suma');
  const desc = document.getElementById('ruleta-modo-descripcion');

  if (ruletaModoActual === 'comun') {
    if (btnComun) btnComun.classList.add('active');
    if (btnSuma) btnSuma.classList.remove('active');
  } else {
    if (btnComun) btnComun.classList.remove('active');
    if (btnSuma) btnSuma.classList.add('active');
  }
  if (desc) desc.style.display = 'none';
}

function cargarDatosRuleta() {
  if (!ruletaAmigosSeleccionadosEmails.length) return;

  const loading = document.getElementById('ruleta-loading-box');
  const empty = document.getElementById('ruleta-empty-box');
  const btnGirar = document.getElementById('btn-ruleta-girar-principal');

  const misWlCargada = Boolean(estado.watchlist && Array.isArray(estado.watchlist));
  const todosAmigosEnCache = ruletaAmigosSeleccionadosEmails.every(em => Array.isArray(ruletaAmigoWatchlistCache[em]));

  if (misWlCargada && todosAmigosEnCache) {
    if (loading) loading.style.display = 'none';
    actualizarVistaCandidatasRuleta();
    return;
  }

  if (loading) loading.style.display = 'block';
  if (empty) empty.style.display = 'none';
  if (btnGirar) btnGirar.disabled = true;

  const promMio = (!estado.watchlist || !estado.watchlist.length)
    ? new Promise(resolve => {
        google.script.run.withSuccessHandler(w => {
          estado.watchlist = Array.isArray(w) ? w : [];
          if (estado.userEmail) {
            try { localStorage.setItem('mediary_cache_wl_' + estado.userEmail.toLowerCase(), JSON.stringify(estado.watchlist)); } catch(e) {}
          }
          resolve(estado.watchlist);
        }).withFailureHandler(() => resolve([])).obtenerWatchlist(estado.userEmail);
      })
    : Promise.resolve(estado.watchlist);

  const promesasAmigos = ruletaAmigosSeleccionadosEmails.map(em => {
    if (Array.isArray(ruletaAmigoWatchlistCache[em])) {
      return Promise.resolve(ruletaAmigoWatchlistCache[em]);
    }
    return new Promise(resolve => {
      google.script.run.withSuccessHandler(w => {
        ruletaAmigoWatchlistCache[em] = Array.isArray(w) ? w : [];
        resolve(ruletaAmigoWatchlistCache[em]);
      }).withFailureHandler(() => {
        ruletaAmigoWatchlistCache[em] = [];
        resolve([]);
      }).obtenerWatchlist(em);
    });
  });

  Promise.all([promMio, ...promesasAmigos]).then(() => {
    if (loading) loading.style.display = 'none';
    if (btnGirar) btnGirar.disabled = false;
    actualizarVistaCandidatasRuleta();
  }).catch(() => {
    if (loading) loading.style.display = 'none';
    if (btnGirar) btnGirar.disabled = false;
    actualizarVistaCandidatasRuleta();
  });
}

function actualizarVistaCandidatasRuleta() {
  const amigosSel = (estado.amigos || []).filter(a => ruletaAmigosSeleccionadosEmails.includes(a.email));
  const nomAmigos = amigosSel.map(a => a.nickname).join(', ') || tLang('tus amigos', 'your friends');

  // Filtrar según categoría seleccionada (Películas, Series o Juegos)
  const filtroCategoria = item => {
    const cat = item.categoriaDetectada || categorizarItemWatchlist(item);
    if (!cat) return false;
    return cat === ruletaCategoriaActual;
  };

  // Obtener obras de mi watchlist
  const misObras = (estado.watchlist || []).map(it => ({ ...it, categoriaDetectada: categorizarItemWatchlist(it) })).filter(filtroCategoria);

  // Obtener obras de cada amigo seleccionado
  const amigosListas = ruletaAmigosSeleccionadosEmails.map(em => {
    const amObj = amigosSel.find(a => a.email === em);
    const wl = ruletaAmigoWatchlistCache[em] || [];
    return {
      email: em,
      nickname: amObj ? amObj.nickname : tLang('Amigo', 'Friend'),
      obras: wl.map(it => ({ ...it, categoriaDetectada: categorizarItemWatchlist(it) })).filter(filtroCategoria)
    };
  });

  let candidatas = [];

  if (ruletaModoActual === 'comun') {
    // Intersección: están en mi lista Y en la de todos los amigos seleccionados
    misObras.forEach(itemMio => {
      const presenteEnTodos = amigosListas.length > 0 && amigosListas.every(am => am.obras.some(itemAmigo => sonObrasCoincidentes(itemMio, itemAmigo)));
      if (presenteEnTodos) {
        const cat = itemMio.categoriaDetectada || 'Peliculas';
        const metaCat = obtenerEmojiYNombreCategoria(cat);
        candidatas.push({
          titulo: itemMio.titulo,
          creador: itemMio.creador || '',
          anio: itemMio.anio || '',
          poster: itemMio.poster || '',
          categoria: cat,
          catEmoji: metaCat.emoji,
          catLabel: metaCat.label,
          origen: 'ambos',
          origenLabel: (userPrefs.lang === 'en' ? `${getHeroIcon('sparkles', '', 14)} In Common` : `${getHeroIcon('sparkles', '', 14)} En común`)
        });
      }
    });
  } else {
    // Unión: sumando listas sin duplicados
    const unificadas = [];

    // Agregar las mías
    misObras.forEach(itemMio => {
      const cat = itemMio.categoriaDetectada || 'Peliculas';
      const metaCat = obtenerEmojiYNombreCategoria(cat);
      const amigosQueLaTienen = amigosListas.filter(am => am.obras.some(itemAmigo => sonObrasCoincidentes(itemMio, itemAmigo)));
      const coincideConTodos = amigosListas.length > 0 && amigosQueLaTienen.length === amigosListas.length;

      unificadas.push({
        titulo: itemMio.titulo,
        creador: itemMio.creador || '',
        anio: itemMio.anio || '',
        poster: itemMio.poster || '',
        categoria: cat,
        catEmoji: metaCat.emoji,
        catLabel: metaCat.label,
        origen: coincideConTodos ? 'ambos' : 'mio',
        origenLabel: coincideConTodos
          ? (userPrefs.lang === 'en' ? `${getHeroIcon('sparkles', '', 14)} In Common` : `${getHeroIcon('sparkles', '', 14)} En común`)
          : (userPrefs.lang === 'en' ? `${getHeroIcon('user', '', 14)} From your Watchlist` : `${getHeroIcon('user', '', 14)} De tu Watchlist`)
      });
    });

    // Agregar las de cada amigo si no han sido agregadas aún
    amigosListas.forEach(am => {
      am.obras.forEach(itemAmigo => {
        const yaExiste = unificadas.some(u => sonObrasCoincidentes(u, itemAmigo));
        if (!yaExiste) {
          const cat = itemAmigo.categoriaDetectada || 'Peliculas';
          const metaCat = obtenerEmojiYNombreCategoria(cat);
          unificadas.push({
            titulo: itemAmigo.titulo,
            creador: itemAmigo.creador || '',
            anio: itemAmigo.anio || '',
            poster: itemAmigo.poster || '',
            categoria: cat,
            catEmoji: metaCat.emoji,
            catLabel: metaCat.label,
            origen: 'amigo',
            origenLabel: `${getHeroIcon('users', '', 14)} ${(userPrefs.lang === 'en' ? 'From ' : 'De ') + am.nickname}`
          });
        }
      });
    });

    candidatas = unificadas;
  }

  ruletaCandidatasActuales = candidatas;

  // Actualizar UI de contador
  const countBadge = document.getElementById('ruleta-count-candidatas');
  if (countBadge) countBadge.textContent = String(candidatas.length);

  // Vista rápida horizontal de productos (Requirement 6.iv)
  const carouselEl = document.getElementById('ruleta-preview-carousel');
  if (carouselEl) {
    if (!candidatas.length) {
      carouselEl.innerHTML = `<div style="color:var(--muted); font-size:0.75rem; padding:10px 4px; font-style:italic;">${(userPrefs.lang === 'en' ? 'No titles available to mix in this category.' : 'No hay obras disponibles para mezclar en esta categoría.')}</div>`;
    } else {
      carouselEl.innerHTML = candidatas.map(c => {
        const posterSrc = c.poster || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'64\' height=\'92\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>';
        return `
          <div style="flex:0 0 68px; min-width:68px; display:flex; flex-direction:column; align-items:center; text-align:center;">
            <img loading="lazy" decoding="async" src="${posterSrc}" alt="${c.titulo.replace(/"/g, '&quot;')}" style="width:64px; height:90px; object-fit:cover; border-radius:4px; background:var(--card); border:1px solid var(--border); box-shadow:0 2px 6px rgba(0,0,0,0.22);" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'64\\' height=\\'90\\' fill=\\'%23334155\\'><rect width=\\'100%\\' height=\\'100%\\'/></svg>'">
            <span style="font-size:0.66rem; font-weight:600; color:var(--text); width:64px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:3px;" title="${c.titulo.replace(/"/g, '&quot;')}">${c.titulo}</span>
          </div>
        `;
      }).join('');
    }
  }

  // Lista detallada (si existe)
  const listaEl = document.getElementById('ruleta-lista-candidatas');
  if (listaEl) {
    if (!candidatas.length) {
      listaEl.innerHTML = `<div style="color:var(--muted); font-size:0.75rem; text-align:center; padding:10px 0;">${(userPrefs.lang === 'en' ? 'No titles to display in this mode or category.' : 'No hay obras para mostrar en este modo o categoría.')}</div>`;
    } else {
      listaEl.innerHTML = candidatas.map(c => {
        const pillClass = c.origen === 'ambos' ? 'ambos' : (c.origen === 'mio' ? 'mio' : 'amigo');
        const posterSrc = c.poster || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'30\' height=\'40\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>';
        return `
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:7px 10px; border-radius:4px; background:var(--bg); border:1px solid var(--border);">
            <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
              <img loading="lazy" decoding="async" src="${posterSrc}" style="width:28px; height:38px; object-fit:cover; border-radius:3px; flex-shrink:0;">
              <div style="min-width:0;">
                <div style="font-weight:700; font-size:0.82rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.titulo}</div>
                <div style="font-size:0.72rem; color:var(--muted);">${c.creador || ''} ${c.anio ? `(${c.anio})` : ''}</div>
              </div>
            </div>
            <div style="display:flex; gap:5px; align-items:center; flex-shrink:0;">
              <span class="ruleta-origin-pill cat-pill">${c.catEmoji} ${c.catLabel}</span>
              <span class="ruleta-origin-pill ${pillClass}">${c.origenLabel}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Manejar estado vacío (sin alterar dimensiones del modal)
  const emptyBox = document.getElementById('ruleta-empty-box');
  const btnGirar = document.getElementById('btn-ruleta-girar-principal');
  if (emptyBox) emptyBox.style.display = 'none';

  if (!candidatas.length) {
    if (btnGirar) btnGirar.style.opacity = '0.5';
  } else {
    if (btnGirar) {
      btnGirar.style.opacity = '1';
      btnGirar.style.display = 'inline-flex';
    }
  }
}

function tirarRuletaPeliculas() {
  if (!ruletaCandidatasActuales.length) {
    if (typeof mostrarToastPersonalizado === 'function') {
      mostrarToastPersonalizado(userPrefs.lang === 'en' ? ' No titles available with this category and mode. Try changing category or using "Combining both".' : ' No hay obras disponibles con esta categoría y modo. Prueba cambiando de categoría o usando "Sumando ambas".');
    }
    return;
  }

  const spinningCard = document.getElementById('ruleta-spinning-card');
  const winnerCard = document.getElementById('ruleta-winner-card');
  const spinTitle = document.getElementById('ruleta-spin-title');
  const spinMeta = document.getElementById('ruleta-spin-meta');
  const spinStatus = document.getElementById('ruleta-spin-status');
  const btnGirar = document.getElementById('btn-ruleta-girar-principal');

  if (winnerCard) winnerCard.style.display = 'none';
  if (spinningCard) spinningCard.style.display = 'block';
  if (btnGirar) btnGirar.disabled = true;

  // Elegir un ganador asegurando que no repita si hay más de 1 candidata
  let pool = [...ruletaCandidatasActuales];
  if (pool.length > 1 && ruletaObraElegidaActual) {
    const keyActual = normalizarTituloObra(ruletaObraElegidaActual.titulo);
    const filtradas = pool.filter(c => normalizarTituloObra(c.titulo) !== keyActual);
    if (filtradas.length) pool = filtradas;
  }

  const ganador = pool[Math.floor(Math.random() * pool.length)];
  ruletaObraElegidaActual = ganador;

  // Animación de Shuffling
  let steps = 0;
  const maxSteps = 16;
  if (ruletaTimerAnim) clearInterval(ruletaTimerAnim);

  ruletaTimerAnim = setInterval(() => {
    steps++;
    const randomPick = ruletaCandidatasActuales[Math.floor(Math.random() * ruletaCandidatasActuales.length)];
    if (spinTitle) spinTitle.innerHTML = `${randomPick.catEmoji || getHeroIcon("film")} ${randomPick.titulo}`;
    if (spinMeta) spinMeta.textContent = randomPick.creador ? `${randomPick.creador} (${randomPick.anio || ''})` : `${randomPick.catLabel}`;
    if (spinStatus) spinStatus.textContent = (userPrefs.lang === 'en' ? 'Picking at random...' : 'Eligiendo al azar...');

    if (steps >= maxSteps) {
      clearInterval(ruletaTimerAnim);
      ruletaTimerAnim = null;
      setTimeout(() => {
        mostrarResultadoRuletaGanadora(ganador);
        if (btnGirar) btnGirar.disabled = false;
      }, 150);
    }
  }, 85);
}

function mostrarResultadoRuletaGanadora(obra) {
  const spinningCard = document.getElementById('ruleta-spinning-card');
  const winnerCard = document.getElementById('ruleta-winner-card');
  if (spinningCard) spinningCard.style.display = 'none';
  if (!winnerCard || !obra) return;

  const posterEl = document.getElementById('ruleta-winner-poster');
  const titleEl = document.getElementById('ruleta-winner-title');
  const dirEl = document.getElementById('ruleta-winner-director');
  const yearEl = document.getElementById('ruleta-winner-year');
  const provEl = document.getElementById('ruleta-winner-provenance');
  const catBadgeEl = document.getElementById('ruleta-winner-cat-badge');
  const noteEl = document.getElementById('ruleta-winner-note');

  if (posterEl) {
    posterEl.src = obra.poster || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'120\' fill=\'%23334155\'><rect width=\'100%\' height=\'100%\'/></svg>';
  }
  if (titleEl) titleEl.textContent = obra.titulo || 'Obra';
  const lRuleta = userPrefs.lang || 'es';
  if (dirEl) {
    let lblCreador = lRuleta === 'en' ? 'Director / Creator:' : 'Director / Creador:';
    if (obra.categoria === 'Juegos') lblCreador = lRuleta === 'en' ? 'Developer / Studio:' : 'Desarrollador / Estudio:';
    else if (obra.categoria === 'Series') lblCreador = lRuleta === 'en' ? 'Creator / Network:' : 'Creador / Cadena:';
    else if (obra.categoria === 'Musica') lblCreador = lRuleta === 'en' ? 'Artist / Band:' : 'Artista / Banda:';
    else if (obra.categoria === 'Lecturas') lblCreador = lRuleta === 'en' ? 'Author / Publisher:' : 'Autor(a) / Editorial:';
    dirEl.textContent = obra.creador ? `${lblCreador} ${obra.creador}` : '';
  }
  if (yearEl) yearEl.textContent = obra.anio ? `${lRuleta === 'en' ? 'Year' : 'Año'}: ${obra.anio}` : '';

  if (catBadgeEl) {
    const metaCol = (typeof obtenerMetaColorCategoria === 'function') ? obtenerMetaColorCategoria(obra.categoria, obra.subcategoria) : null;
    catBadgeEl.innerHTML = `${obra.catEmoji || getHeroIcon("film")} ${obra.catLabel || 'Obra'}`;
    catBadgeEl.className = `ruleta-origin-pill cat-pill ${metaCol ? 'cat-badge-' + metaCol.key : ''}`;
  }

  if (provEl) {
    provEl.className = `ruleta-origin-pill ${obra.origen === 'ambos' ? 'ambos' : (obra.origen === 'mio' ? 'mio' : 'amigo')}`;
    provEl.textContent = obra.origenLabel || 'Watchlist';
  }

  if (noteEl) {
    const amigosSel = (estado.amigos || []).filter(a => ruletaAmigosSeleccionadosEmails.includes(a.email));
    const nomAmigos = amigosSel.map(a => a.nickname).join(', ') || (lRuleta === 'en' ? 'your friends' : 'tus amigos');
    if (obra.origen === 'ambos') {
      noteEl.innerHTML = lRuleta === 'en'
        ? `Great! This title was on everyone's Watchlist.`
        : `¡Genial! Esta obra estaba en la lista de todos.`;
    } else if (obra.origen === 'mio') {
      noteEl.innerHTML = lRuleta === 'en'
        ? `This title was on <strong>your</strong> list. Time to show it to <strong>${nomAmigos}</strong>!`
        : `Esta obra estaba en <strong>tu</strong> lista. ¡Momento de presentársela a <strong>${nomAmigos}</strong>!`;
    } else {
      noteEl.innerHTML = lRuleta === 'en'
        ? `This title was on <strong>${nomAmigos}</strong>'s list. Time to give it a shot!`
        : `Esta obra estaba en la lista de <strong>${nomAmigos}</strong>. ¡Hora de darle la oportunidad!`;
    }
  }

  winnerCard.style.display = 'block';
  winnerCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function celebrarYElegirPelicula() {
  if (!ruletaObraElegidaActual) return;
  const l = userPrefs.lang || 'es';
  const amigosSel = (estado.amigos || []).filter(a => ruletaAmigosSeleccionadosEmails.includes(a.email));
  const nomAmigos = amigosSel.map(a => a.nickname).join(', ') || (l === 'en' ? 'your friends' : 'tus amigos');

  if (typeof mostrarToastPersonalizado === 'function') {
    let verbo = l === 'en' ? "Let's watch" : 'A ver';
    if (ruletaObraElegidaActual.categoria === 'Juegos') verbo = l === 'en' ? "Let's play" : 'A jugar';
    else if (ruletaObraElegidaActual.categoria === 'Lecturas') verbo = l === 'en' ? "Let's read" : 'A leer';
    else if (ruletaObraElegidaActual.categoria === 'Musica') verbo = l === 'en' ? "Let's listen to" : 'A escuchar';
    mostrarToastPersonalizado(l === 'en'
      ? `Decided! ${verbo} "${ruletaObraElegidaActual.titulo}" with ${nomAmigos}`
      : `¡Decidido! ${verbo} "${ruletaObraElegidaActual.titulo}" con ${nomAmigos}`);
  }
  cerrarModalRuleta();
}


