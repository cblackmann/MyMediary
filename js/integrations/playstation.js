/* Mediary — js/integrations/playstation.js */
// ==========================================
// --- PLAYSTATION NETWORK (PSN) INTEGRATION ---
// ==========================================
// Actividad en tiempo real de PlayStation y Discord retirada a petición del usuario.
// Se mantiene la sincronización de cuenta (trofeos, horas y estadísticas de perfil).
function guardarEstadoEnVivoPlayStation_() { return false; }
window.guardarEstadoEnVivoPlayStation_ = guardarEstadoEnVivoPlayStation_;

async function sincronizarCuentaPlayStation(onlineIdManual = null, notificar = false) {
  const username = (onlineIdManual || localStorage.getItem('mediary_psn_username') || '').trim();
  if (!username) {
    if (notificar) mostrarToastPersonalizado(tLang('No hay cuenta de PlayStation para sincronizar', 'No PlayStation account to sync'));
    return false;
  }

  if (username === 'Gamer_Mediary') {
    conectarPlayStationDemo();
    return true;
  }

  try {
    let avatar = '';
    let topGames = [];
    let trophies = { platinum: 0, gold: 0, silver: 0, bronze: 0, level: 1 };
    let totalHours = 0;

    const profUrl = `https://psnprofiles.com/${encodeURIComponent(username)}`;
    const html = await fetchSteamProxyContent_(profUrl);
    if (html) {
      const mAv = html.match(/<img[^>]*class="[^"]*avatar[^"]*"[^>]*src="([^"]+)"/i) || html.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*avatar/i);
      if (mAv && mAv[1]) avatar = mAv[1];

      const mPlat = html.match(/class="platinum"[^>]*>([^<]+)</i);
      const mGold = html.match(/class="gold"[^>]*>([^<]+)</i);
      const mSilver = html.match(/class="silver"[^>]*>([^<]+)</i);
      const mBronze = html.match(/class="bronze"[^>]*>([^<]+)</i);
      const mLevel = html.match(/class="level"[^>]*>([^<]+)</i);

      if (mPlat) trophies.platinum = parseInt(mPlat[1].replace(/,/g, ''), 10) || 0;
      if (mGold) trophies.gold = parseInt(mGold[1].replace(/,/g, ''), 10) || 0;
      if (mSilver) trophies.silver = parseInt(mSilver[1].replace(/,/g, ''), 10) || 0;
      if (mBronze) trophies.bronze = parseInt(mBronze[1].replace(/,/g, ''), 10) || 0;
      if (mLevel) trophies.level = parseInt(mLevel[1].replace(/,/g, ''), 10) || 1;

      const rows = [...html.matchAll(/<tr[^>]*class="[^"]*game[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi)];
      rows.slice(0, 10).forEach(r => {
        const rowHtml = r[1];
        const mTitle = rowHtml.match(/<a class="title"[^>]*>([^<]+)<\/a>/i);
        const mPlatf = rowHtml.match(/<span class="platform"[^>]*>([^<]+)<\/span>/i);
        const mImg = rowHtml.match(/<img[^>]*src="([^"]+)"/i);
        if (mTitle) {
          topGames.push({
            name: mTitle[1].trim(),
            platform: mPlatf ? mPlatf[1].trim() : 'PS5',
            image: mImg ? mImg[1] : '',
            hours: 0,
            trophies: 'Trophy'
          });
        }
      });
    }

    if (!avatar) {
      avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=003791&color=38bdf8&bold=true`;
    }

    const userData = {
      onlineId: username,
      avatar: avatar,
      plus: true,
      trophies: trophies
    };

    const statsData = {
      totalHours: totalHours || (topGames.length * 8.5),
      recentHours: 12.0,
      gamesCount: topGames.length || 1,
      lastSync: new Date().toISOString(),
      topGames: topGames
    };

    localStorage.setItem('mediary_psn_user', JSON.stringify(userData));
    localStorage.setItem('mediary_psn_stats', JSON.stringify(statsData));

    actualizarUIPlayStation();
    if (typeof renderizarPlayStationNowPlayingInicio === 'function') {
      renderizarPlayStationNowPlayingInicio(false);
    }
    if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(true);
    }
    if (notificar) {
      mostrarToastPersonalizado(tLang(`🎮 PlayStation sincronizado: ${username}`, `🎮 PlayStation synced: ${username}`));
    }
    return true;
  } catch (err) {
    console.error('Error sincronizando PlayStation:', err);
    if (notificar) mostrarToastPersonalizado(tLang('Error al sincronizar PlayStation', 'Error syncing PlayStation'));
    return false;
  }
}
window.sincronizarCuentaPlayStation = sincronizarCuentaPlayStation;

function generarStatsPlayStationDemo() {
  const platLbl = tLang('Platino', 'Platinum');
  return {
    user: {
      onlineId: 'Gamer_Mediary',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      plus: true,
      trophies: {
        platinum: 14,
        gold: 86,
        silver: 312,
        bronze: 1420,
        level: 348
      }
    },
    stats: {
      totalHours: 385.5,
      recentHours: 24.0,
      gamesCount: 46,
      lastSync: new Date().toISOString(),
      topGames: [
        { name: 'God of War Ragnarök', platform: 'PS5', hours: 56.5, trophies: platLbl, image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.jpg' },
        { name: 'Elden Ring', platform: 'PS5', hours: 142.0, trophies: platLbl, image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg' },
        { name: "Marvel's Spider-Man 2", platform: 'PS5', hours: 32.0, trophies: platLbl, image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co7327.jpg' },
        { name: 'The Last of Us Part I', platform: 'PS5', hours: 26.5, trophies: platLbl, image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co514i.jpg' },
        { name: 'Horizon Forbidden West', platform: 'PS5', hours: 68.0, trophies: '92%', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2kcd.jpg' },
        { name: 'Final Fantasy VII Rebirth', platform: 'PS5', hours: 60.5, trophies: '65%', image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co7j5m.jpg' }
      ]
    },
    nowPlaying: {
      isPlaying: true,
      titleName: 'God of War Ragnarök',
      platform: 'PS5',
      source: 'playstation',
      studio: 'Santa Monica Studio · PlayStation Studios',
      status: tLang('Explorando las Tierras del Cráter en Vanaheim', 'Exploring The Crater in Vanaheim'),
      hours: 56.5,
      image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.jpg',
      trophyProgress: '78%',
      updatedAt: Date.now()
    }
  };
}

function abrirModalConectarPsn() {
  const modal = document.getElementById('modal-conectar-psn');
  if (modal) modal.style.display = 'flex';
  const inp = document.getElementById('psn-input-online-id');
  if (inp) {
    const cur = localStorage.getItem('mediary_psn_username') || '';
    inp.value = cur;
    setTimeout(() => inp.focus(), 100);
  }
  const npssoInp = document.getElementById('psn-input-npsso-modal');
  if (npssoInp) {
    npssoInp.value = localStorage.getItem('mediary_psn_npsso') || '';
  }
}

function cerrarModalConectarPsn() {
  const modal = document.getElementById('modal-conectar-psn');
  if (modal) modal.style.display = 'none';
}

function conectarPlayStationDemo() {
  const demoData = generarStatsPlayStationDemo();
  localStorage.setItem('mediary_psn_connected', 'true');
  localStorage.setItem('mediary_psn_username', demoData.user.onlineId);
  localStorage.setItem('mediary_psn_user', JSON.stringify(demoData.user));
  localStorage.setItem('mediary_psn_stats', JSON.stringify(demoData.stats));
  localStorage.setItem('mediary_psn_now_playing', JSON.stringify(demoData.nowPlaying));
  localStorage.setItem('mediary_last_active_game_platform', 'playstation');

  cerrarModalConectarPsn();
  actualizarUIPlayStation();
  renderizarPlayStationNowPlayingInicio(false);
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
  const modalStats = document.getElementById('modal-estadisticas-avanzadas');
  if (modalStats && modalStats.style.display === 'flex' && typeof renderizarContenidoEstadisticasAvanzadas === 'function') {
    renderizarContenidoEstadisticasAvanzadas();
  }
  if (typeof cambiarSlideLive === 'function') {
    setTimeout(() => cambiarSlideLive(1), 120);
  }
  mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? '🎮 Demo PlayStation profile connected!' : '🎮 ¡Perfil demo de PlayStation conectado!');
}

function conectarPlayStationPerfil() {
  const inp = document.getElementById('psn-input-online-id');
  let raw = (inp?.value || '').trim();
  if (!raw) {
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'Please enter a PSN Online ID' : 'Ingresa un PSN Online ID');
    return;
  }
  raw = raw.replace(/^https?:\/\/(?:www\.)?(?:psnprofiles\.com\/|my\.playstation\.com\/profile\/)/i, '').replace(/\/.*$/, '').replace(/^@/, '').trim();
  if (!raw) {
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'Invalid PSN ID' : 'ID de PSN inválido');
    return;
  }

  const npssoInp = document.getElementById('psn-input-npsso-modal');
  const npsso = (npssoInp?.value || '').trim();

  localStorage.setItem('mediary_psn_connected', 'true');
  localStorage.setItem('mediary_psn_username', raw);
  if (npsso) {
    localStorage.setItem('mediary_psn_npsso', npsso);
  }

  cerrarModalConectarPsn();
  actualizarUIPlayStation();
  renderizarPlayStationNowPlayingInicio(false);
  if (typeof sincronizarCuentaPlayStation === 'function') {
    sincronizarCuentaPlayStation(raw, true);
  }
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
  if (typeof cambiarSlideLive === 'function') {
    setTimeout(() => cambiarSlideLive(1), 120);
  }
}

function desconectarPlayStation() {
  localStorage.removeItem('mediary_psn_connected');
  localStorage.removeItem('mediary_psn_username');
  localStorage.removeItem('mediary_psn_user');
  localStorage.removeItem('mediary_psn_stats');
  localStorage.removeItem('mediary_psn_now_playing');
  localStorage.removeItem('mediary_psn_npsso');
  localStorage.removeItem('mediary_psn_last_auto_sync');
  actualizarUIPlayStation();
  renderizarPlayStationNowPlayingInicio(true);
  if (typeof renderizarAppsVinculadasConfig === 'function') {
    renderizarAppsVinculadasConfig();
  }
  const modalStats = document.getElementById('modal-estadisticas-avanzadas');
  if (modalStats && modalStats.style.display === 'flex' && typeof renderizarContenidoEstadisticasAvanzadas === 'function') {
    renderizarContenidoEstadisticasAvanzadas();
  }
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
  mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'PlayStation disconnected' : 'PlayStation desconectado');
}

function actualizarUIPlayStation() {
  const isConn = localStorage.getItem('mediary_psn_connected') === 'true';
  const badge = document.getElementById('cfg-psn-badge');
  const disBox = document.getElementById('cfg-psn-disconnected-box');
  const connBox = document.getElementById('cfg-psn-connected-box');
  const nameEl = document.getElementById('cfg-psn-user-name');
  const avatarEl = document.getElementById('cfg-psn-user-avatar');
  const subEl = document.getElementById('cfg-psn-user-sub');

  if (isConn) {
    if (badge) badge.style.display = 'inline-flex';
    if (disBox) disBox.style.display = 'none';
    if (connBox) connBox.style.display = 'block';

    let user = null;
    try {
      const u = localStorage.getItem('mediary_psn_user');
      if (u) user = JSON.parse(u);
    } catch (e) {}

    let stats = null;
    try {
      const s = localStorage.getItem('mediary_psn_stats');
      if (s) stats = JSON.parse(s);
    } catch (e) {}

    const username = localStorage.getItem('mediary_psn_username') || user?.onlineId || tLang('Jugador PSN', 'PSN Player');
    if (nameEl) nameEl.textContent = username;

    const totalHours = stats?.totalHours || 0;
    const trophies = user?.trophies;
    if (subEl) {
      if (trophies && trophies.platinum != null) {
        subEl.textContent = tLang(
          `${trophies.platinum} Platinos · ${trophies.gold} Oro · ${trophies.silver} Plata · ${totalHours} hrs`,
          `${trophies.platinum} Platinum · ${trophies.gold} Gold · ${trophies.silver} Silver · ${totalHours} hrs`
        );
      } else if (totalHours > 0) {
        subEl.textContent = tLang(`${totalHours} hrs en PlayStation`, `${totalHours} hrs on PlayStation`);
      } else {
        subEl.textContent = tLang('Conectado', 'Connected');
      }
    }

    if (avatarEl) {
      if (user?.avatar) {
        avatarEl.innerHTML = `<img loading="lazy" decoding="async" src="${escHtmlSpotify_(user.avatar)}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        avatarEl.innerHTML = getHeroIcon('gamepad', '', 18);
      }
    }
  } else {
    if (badge) badge.style.display = 'none';
    if (disBox) disBox.style.display = 'block';
    if (connBox) connBox.style.display = 'none';
  }
  if (typeof renderizarAppsVinculadasConfig === 'function') renderizarAppsVinculadasConfig();
}

function togglePsnNpssoInput() {
  const wrap = document.getElementById('cfg-psn-npsso-wrap');
  const btn = document.getElementById('btn-toggle-psn-npsso');
  if (!wrap) return;
  const isHidden = wrap.style.display === 'none' || !wrap.style.display;
  wrap.style.display = isHidden ? 'block' : 'none';
  if (btn) btn.textContent = isHidden ? tLang('— Ocultar', '— Hide') : tLang('+ Configurar token', '+ Set token');
  if (isHidden) {
    const inp = document.getElementById('cfg-psn-npsso-input');
    if (inp) {
      inp.value = localStorage.getItem('mediary_psn_npsso') || '';
      setTimeout(() => inp.focus(), 80);
    }
  }
}

function guardarPsnNpssoDesdeInput(inputId) {
  const inp = document.getElementById(inputId);
  const val = (inp?.value || '').trim();
  if (val) {
    localStorage.setItem('mediary_psn_npsso', val);
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'NPSSO Token saved!' : 'Token NPSSO guardado');
    if (typeof sincronizarCuentaPlayStation === 'function') {
      sincronizarCuentaPlayStation(null, true);
    }
  } else {
    localStorage.removeItem('mediary_psn_npsso');
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'NPSSO Token cleared' : 'Token NPSSO eliminado');
  }
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
  const wrap = document.getElementById('cfg-psn-npsso-wrap');
  if (wrap) wrap.style.display = 'none';
  const btn = document.getElementById('btn-toggle-psn-npsso');
  if (btn) btn.textContent = tLang('+ Configurar token', '+ Set token');
}



function obtenerJuegoEnProgresoPlayStation() {
  // Las tarjetas de juego en tiempo real no deben vincularse a registros del diario
  return null;
}

function obtenerTodosJuegosPlayStation() {
  if (!window.estado || !Array.isArray(estado.registros)) return [];
  return estado.registros.filter(r => {
    if (!r) return false;
    const c = String(r.categoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const s = String(r.subcategoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const esJuego = c.includes('juego') || c.includes('game') || s.includes('juego') || s.includes('consola') || s.includes('playstation');
    if (!esJuego) return false;
    if (s.includes('watchlist') || s.includes('to play')) return false;
    return true;
  });
}

let _modalJuegoPlataformaActiva = 'playstation';

function seleccionarPlataformaModalJuego(plat) {
  _modalJuegoPlataformaActiva = (plat === 'steam') ? 'steam' : 'playstation';
  const btnPsn = document.getElementById('btn-live-plat-psn');
  const btnSteam = document.getElementById('btn-live-plat-steam');
  if (btnPsn) btnPsn.classList.toggle('active', _modalJuegoPlataformaActiva === 'playstation');
  if (btnSteam) btnSteam.classList.toggle('active', _modalJuegoPlataformaActiva === 'steam');
  renderizarListaJuegosModalEnVivo_();
}
window.seleccionarPlataformaModalJuego = seleccionarPlataformaModalJuego;

function renderizarListaJuegosModalEnVivo_() {
  const listaCont = document.getElementById('psn-lista-juegos-selector');
  if (!listaCont) return;

  const esSteam = _modalJuegoPlataformaActiva === 'steam';
  const items = [];
  const vistos = new Set();

  const agregarItem = (tit, cover, plat, source) => {
    const cleanTit = String(tit || '').trim();
    if (!cleanTit) return;
    const key = cleanTit.toLowerCase();
    if (vistos.has(key)) return;
    vistos.add(key);
    items.push({ tit: cleanTit, cover: cover || '', plat, source });
  };

  if (esSteam) {
    try {
      const stRaw = localStorage.getItem('mediary_steam_stats');
      if (stRaw) {
        const st = JSON.parse(stRaw);
        (st?.topGames || []).forEach(g => {
          agregarItem(g.name, g.header || (g.appid ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${g.appid}/header.jpg` : ''), 'Steam', 'steam');
        });
      }
    } catch (e) {}
    const todosJuegos = typeof obtenerTodosJuegosPlayStation === 'function' ? obtenerTodosJuegosPlayStation() : [];
    todosJuegos.forEach(j => {
      agregarItem(j.tituloBase || j.titulo, j.poster || '', 'Steam', 'steam');
    });
  } else {
    const todosJuegos = typeof obtenerTodosJuegosPlayStation === 'function' ? obtenerTodosJuegosPlayStation() : [];
    todosJuegos.forEach(j => {
      const plat = (j.creador && j.creador.includes('PS4')) ? 'PS4' : 'PS5';
      agregarItem(j.tituloBase || j.titulo, j.poster || '', plat, 'playstation');
    });
    try {
      const psRaw = localStorage.getItem('mediary_psn_stats');
      if (psRaw) {
        const ps = JSON.parse(psRaw);
        (ps?.topGames || []).forEach(g => {
          agregarItem(g.name, g.image || g.icon || '', g.platform || 'PS5', 'playstation');
        });
      }
    } catch (e) {}
  }

  const popularesPsn = [
    { tit: 'Astro Bot', cover: 'https://media.rawg.io/media/games/6b6/6b6a695be2e0ff36b04da102e3dc41dd.jpg', plat: 'PS5', source: 'playstation' },
    { tit: "Marvel's Spider-Man 2", cover: 'https://media.rawg.io/media/games/043/043329aaeb7b63fbc19c991e604f7f6f.jpg', plat: 'PS5', source: 'playstation' },
    { tit: 'God of War Ragnarök', cover: 'https://media.rawg.io/media/games/9aa/9aa42d16d425fa6f170459708643867a.jpg', plat: 'PS5', source: 'playstation' },
    { tit: 'EA SPORTS FC 25', cover: 'https://media.rawg.io/media/games/c52/c529a6a81577c3855a90ad15570e3034.jpg', plat: 'PS5', source: 'playstation' },
    { tit: 'Elden Ring', cover: 'https://media.rawg.io/media/games/b29/b2960c74da93519d11484042807e8577.jpg', plat: 'PS5', source: 'playstation' },
    { tit: 'Black Myth: Wukong', cover: 'https://media.rawg.io/media/games/f8c/f8c6aed1916bed8648386c63c3e672e0.jpg', plat: 'PS5', source: 'playstation' },
    { tit: 'The Last of Us Part I', cover: 'https://media.rawg.io/media/games/4be/4be6e471e695d7e52a8a816c27e85cfa.jpg', plat: 'PS5', source: 'playstation' },
    { tit: 'Helldivers 2', cover: 'https://media.rawg.io/media/games/53c/53c07e056961474ecae2d1921c569f1a.jpg', plat: 'PS5', source: 'playstation' },
    { tit: 'Silent Hill 2', cover: 'https://media.rawg.io/media/games/119/119a0f00225e36466399a9b0c5cb29c4.jpg', plat: 'PS5', source: 'playstation' },
    { tit: 'Grand Theft Auto V', cover: 'https://media.rawg.io/media/games/456/456dea5e1c7e3cd0702502577319ea0a.jpg', plat: 'PS5', source: 'playstation' }
  ];

  const popularesSteam = [
    { tit: 'Counter-Strike 2', cover: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/730/header.jpg', plat: 'Steam', source: 'steam' },
    { tit: 'Dota 2', cover: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/570/header.jpg', plat: 'Steam', source: 'steam' },
    { tit: "Baldur's Gate 3", cover: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg', plat: 'Steam', source: 'steam' },
    { tit: 'Cyberpunk 2077', cover: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg', plat: 'Steam', source: 'steam' },
    { tit: 'Elden Ring', cover: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg', plat: 'Steam', source: 'steam' },
    { tit: 'Black Myth: Wukong', cover: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg', plat: 'Steam', source: 'steam' },
    { tit: 'Helldivers 2', cover: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/553850/header.jpg', plat: 'Steam', source: 'steam' },
    { tit: 'Hades II', cover: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1145350/header.jpg', plat: 'Steam', source: 'steam' }
  ];

  if (items.length < 8) {
    const listPop = esSteam ? popularesSteam : popularesPsn;
    listPop.forEach(p => agregarItem(p.tit, p.cover, p.plat, p.source));
  }

  if (items.length === 0) {
    listaCont.innerHTML = `
      <div style="font-size:0.8rem; color:var(--muted); text-align:center; padding:12px; background:var(--bg); border:1px dashed var(--border); border-radius:4px;">
        No tienes videojuegos registrados en tu historial todavía. Escribe abajo el título que estás jugando.
      </div>
    `;
    return;
  }

  const accentColor = esSteam ? '#66c0f4' : '#38bdf8';
  listaCont.innerHTML = items.map(it => {
    const safeTit = encodeURIComponent(it.tit);
    const safeCov = encodeURIComponent(it.cover);
    const safePlat = encodeURIComponent(it.plat);
    const safeSrc = encodeURIComponent(it.source);
    return `
      <div style="display:flex; align-items:center; gap:10px; padding:7px 10px; background:var(--bg); border:1px solid var(--border); border-radius:4px; cursor:pointer; transition:var(--tr);"
           onmouseover="this.style.borderColor='${accentColor}'" onmouseout="this.style.borderColor='var(--border)'"
           onclick="seleccionarJuegoParaEnVivo('${safeTit}', '${safeCov}', '${safePlat}', '${safeSrc}')">
        <div style="width:36px; height:36px; border-radius:3px; overflow:hidden; background:var(--card); flex-shrink:0; display:grid; place-items:center;">
          ${it.cover ? `<img loading="lazy" decoding="async" src="${escHtmlSpotify_(it.cover)}" style="width:100%; height:100%; object-fit:cover;">` : `<svg style="width:18px;height:18px;color:${accentColor};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="20" height="12" x="2" y="6" rx="6"/><path d="M6 12h4m-2-2v4M15 13h.01M18 11h.01"/></svg>`}
        </div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:0.84rem; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escHtmlSpotify_(it.tit)}</div>
          <div style="font-size:0.7rem; color:${accentColor}; font-weight:600;">${escHtmlSpotify_(it.plat)}</div>
        </div>
        <button type="button" class="btn-psn-sync-compact" style="pointer-events:none; ${esSteam ? 'color:#66c0f4;border-color:rgba(102,192,244,0.3);background:rgba(102,192,244,0.12);' : ''}">
          Jugar ▶
        </button>
      </div>
    `;
  }).join('');
}

function abrirModalSeleccionarJuegoPsn() {
  const modal = document.getElementById('modal-seleccionar-juego-psn');
  if (!modal) return;

  const isPsnConn = localStorage.getItem('mediary_psn_connected') === 'true';
  const isSteamConn = localStorage.getItem('mediary_steam_connected') === 'true';
  const switchWrap = document.getElementById('game-live-platform-switch-wrap');

  if (switchWrap) {
    switchWrap.style.display = (isPsnConn && isSteamConn) ? 'block' : 'none';
  }

  const estadoActual = typeof obtenerEstadoJuegoActivoInicio === 'function' ? obtenerEstadoJuegoActivoInicio() : null;
  if (isSteamConn && !isPsnConn) {
    _modalJuegoPlataformaActiva = 'steam';
  } else if (isPsnConn && !isSteamConn) {
    _modalJuegoPlataformaActiva = 'playstation';
  } else if (estadoActual && estadoActual.status === 'playing' && estadoActual.source === 'steam') {
    _modalJuegoPlataformaActiva = 'steam';
  } else {
    _modalJuegoPlataformaActiva = 'playstation';
  }

  seleccionarPlataformaModalJuego(_modalJuegoPlataformaActiva);

  const inp = document.getElementById('input-psn-otro-juego');
  if (inp) inp.value = '';
  modal.style.display = 'flex';
}

function cerrarModalSeleccionarJuegoPsn() {
  const modal = document.getElementById('modal-seleccionar-juego-psn');
  if (modal) modal.style.display = 'none';
}

function seleccionarJuegoParaEnVivo(safeTit, safeCov, safePlat, safeSource) {
  const tit = decodeURIComponent(safeTit || '');
  const cov = decodeURIComponent(safeCov || '');
  const plat = decodeURIComponent(safePlat || (_modalJuegoPlataformaActiva === 'steam' ? 'Steam' : 'PS5'));
  const source = decodeURIComponent(safeSource || (plat.toLowerCase() === 'steam' ? 'steam' : 'playstation'));
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';

  if (source === 'steam') {
    guardarEstadoEnVivoSteam_({
      isPlaying: true,
      titleName: tit,
      image: cov
    }, { manual: true });
    cerrarModalSeleccionarJuegoPsn();
    renderizarPlayStationNowPlayingInicio(false);
    mostrarToastPersonalizado(l === 'en' ? `🎮 Steam: Now playing "${tit}"` : `🎮 Steam: Ahora jugando a "${tit}"`);
  } else {
    const data = {
      isPlaying: true,
      titleName: tit,
      platform: plat,
      source: 'playstation',
      studio: 'PlayStation',
      status: l === 'en' ? 'Playing now' : 'Jugando ahora',
      hours: 0,
      image: cov,
      manual: true,
      trophyProgress: '',
      updatedAt: Date.now()
    };

    guardarEstadoEnVivoPlayStation_(data, { manual: true });
    cerrarModalSeleccionarJuegoPsn();
    renderizarPlayStationNowPlayingInicio(false);
    mostrarToastPersonalizado(l === 'en' ? `🎮 PlayStation: Now playing "${tit}"` : `🎮 PlayStation: Ahora jugando a "${tit}"`);
  }

  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
}

async function iniciarJuegoManualPsn() {
  const inp = document.getElementById('input-psn-otro-juego');
  const val = (inp?.value || '').trim();
  if (!val) {
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'Enter a game title' : 'Ingresa el nombre del juego');
    return;
  }
  const isSteam = _modalJuegoPlataformaActiva === 'steam';
  const plat = isSteam ? 'Steam' : 'PS5';
  const source = isSteam ? 'steam' : 'playstation';

  // Respuesta instantánea al usuario
  seleccionarJuegoParaEnVivo(encodeURIComponent(val), '', encodeURIComponent(plat), encodeURIComponent(source));

  // Búsqueda en segundo plano de carátula en alta resolución en RAWG
  try {
    if (typeof RAWG_K !== 'undefined' && RAWG_K) {
      const q = encodeURIComponent(val);
      const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_K}&search=${q}&page_size=1`, {
        signal: AbortSignal.timeout(3500)
      }).then(r => r.json()).catch(() => null);

      const coverImg = res?.results?.[0]?.background_image;
      if (coverImg) {
        if (source === 'steam') {
          const rawSt = localStorage.getItem('mediary_steam_now_playing');
          if (rawSt) {
            const stObj = JSON.parse(rawSt);
            if (stObj && stObj.isPlaying && stObj.titleName === val) {
              stObj.image = coverImg;
              guardarEstadoEnVivoSteam_(stObj, { manual: true });
              if (typeof renderizarPlayStationNowPlayingInicio === 'function') {
                renderizarPlayStationNowPlayingInicio(false);
              }
            }
          }
        } else {
          const rawPs = localStorage.getItem('mediary_psn_now_playing');
          if (rawPs) {
            const psObj = JSON.parse(rawPs);
            if (psObj && psObj.isPlaying && psObj.titleName === val) {
              psObj.image = coverImg;
              guardarEstadoEnVivoPlayStation_(psObj, { manual: true });
              if (typeof renderizarPlayStationNowPlayingInicio === 'function') {
                renderizarPlayStationNowPlayingInicio(false);
              }
            }
          }
        }
      }
    }
  } catch (_) {}
}

function detenerJuegoPsn() {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  localStorage.setItem('mediary_psn_now_playing', JSON.stringify({ isPlaying: false, source: 'playstation', updatedAt: Date.now() }));
  localStorage.setItem('mediary_psn_manual_state', 'idle');
  cerrarModalSeleccionarJuegoPsn();
  renderizarPlayStationNowPlayingInicio(false);
  mostrarToastPersonalizado(l === 'en' ? '💤 Console in rest mode · Not playing anything' : '💤 Consola en reposo · No estás jugando a nada');

  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(false);
  }
}

function detenerJuegoActivoInicio() {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const est = obtenerEstadoJuegoActivoInicio();
  if (est && est.status === 'playing') {
    if (est.source === 'steam') {
      detenerJuegoSteam();
      return;
    }
    if (est.source === 'playstation') {
      detenerJuegoPsn();
      return;
    }
  }
  // Si se pulsó desde el modal en estado mixto o reposo, dejar ambas plataformas en reposo
  localStorage.setItem('mediary_psn_now_playing', JSON.stringify({ isPlaying: false, source: 'playstation', updatedAt: Date.now() }));
  localStorage.setItem('mediary_psn_manual_state', 'idle');
  if (localStorage.getItem('mediary_steam_connected') === 'true') {
    guardarEstadoEnVivoSteam_({ isPlaying: false }, { manual: true });
  }
  cerrarModalSeleccionarJuegoPsn();
  renderizarPlayStationNowPlayingInicio(false);
  mostrarToastPersonalizado(l === 'en' ? '💤 Rest mode · Not playing anything' : '💤 En reposo · No estás jugando a nada');
}
window.detenerJuegoActivoInicio = detenerJuegoActivoInicio;

function alternarEstadoEnVivoPlayStation(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const isPsnConn = localStorage.getItem('mediary_psn_connected') === 'true';
  const isSteamConn = localStorage.getItem('mediary_steam_connected') === 'true';
  if (!isPsnConn && !isSteamConn) {
    if (typeof abrirModalConectarPsn === 'function') abrirModalConectarPsn();
    return;
  }

  const estadoActual = obtenerEstadoJuegoActivoInicio();
  if (estadoActual && estadoActual.status === 'playing') {
    if (estadoActual.source === 'steam') {
      detenerJuegoSteam();
    } else {
      detenerJuegoPsn();
    }
  } else {
    abrirModalSeleccionarJuegoPsn();
  }
}

function alternarJuegoUsuarioPlayStation(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const isDemo = localStorage.getItem('mediary_psn_username') === 'Gamer_Mediary';
  if (isDemo && typeof alternarJuegoDemoPlayStation === 'function') {
    alternarJuegoDemoPlayStation();
    return;
  }
  abrirModalSeleccionarJuegoPsn();
}

function obtenerEstadoJuegoActivoInicio() {
  const isSteamConn = localStorage.getItem('mediary_steam_connected') === 'true';

  if (!isSteamConn) {
    return { status: 'disconnected', isSteamConn: false, isPsnConn: false };
  }

  let steamNP = null;
  try {
    const raw = localStorage.getItem('mediary_steam_now_playing');
    if (raw) steamNP = JSON.parse(raw);
  } catch (e) {}

  let steamPlaying = !!(steamNP && steamNP.isPlaying && (steamNP.titleName || steamNP.name));

  // Salvaguarda de expiración si la sesión de Steam quedó obsoleta sin confirmación
  if (steamPlaying && !steamNP.manual) {
    const upAt = Number(steamNP.updatedAt) || 0;
    if (upAt > 0 && (Date.now() - upAt > 25 * 60 * 1000)) {
      steamPlaying = false;
      try {
        steamNP.isPlaying = false;
        localStorage.setItem('mediary_steam_now_playing', JSON.stringify(steamNP));
      } catch (e) {}
    }
  }

  // Si está jugando en Steam y pasaron más de 12s desde la última consulta, refrescar en segundo plano
  if (steamPlaying && !steamNP.manual && (Date.now() - _steamUltimaConsultaLive > 12000)) {
    if (typeof consultarActividadEnVivoSteam_ === 'function') {
      setTimeout(() => consultarActividadEnVivoSteam_(false), 80);
    }
  }

  const steamData = steamPlaying ? Object.assign({ source: 'steam', platform: 'Steam' }, steamNP, { source: 'steam', platform: 'Steam' }) : null;

  if (steamPlaying) {
    return {
      status: 'playing',
      source: 'steam',
      data: steamData,
      isSteamConn: true
    };
  }

  return {
    status: 'idle',
    idlePlatform: 'steam',
    isSteamConn: true
  };
}
window.obtenerEstadoJuegoActivoInicio = obtenerEstadoJuegoActivoInicio;

function renderizarPlayStationNowPlayingInicio(forzar = false) {
  const container = document.getElementById('home-psn-now-playing-container');
  const wrapper = document.getElementById('home-live-carousel-wrapper');
  if (!container) return;

  if (wrapper) wrapper.style.display = 'flex';
  container.style.display = 'flex';
  inicializarLiveCarouselScrollListener();

  const estadoJuego = obtenerEstadoJuegoActivoInicio();
  const badgePsn = document.getElementById('badge-psn-live-pill');

  if (estadoJuego.status === 'disconnected') {
    if (badgePsn) badgePsn.style.display = 'none';
    detenerPollingSteamLive();
    container.innerHTML = dibujarTarjetaPlayStationCompactaDesconectado();
    return;
  }

  const isPlaying = estadoJuego.status === 'playing';
  if (isPlaying) {
    if (badgePsn) badgePsn.style.display = 'inline-block';
    container.innerHTML = dibujarTarjetaPlayStationCompacta(estadoJuego.data);
  } else {
    if (badgePsn) badgePsn.style.display = 'none';
    container.innerHTML = dibujarTarjetaPlayStationCompactaIdle(estadoJuego);
  }

  if (estadoJuego.isSteamConn) {
    iniciarPollingSteamLive();
    if (typeof consultarActividadEnVivoSteam_ === 'function') {
      consultarActividadEnVivoSteam_(!!forzar);
    }
  } else {
    detenerPollingSteamLive();
  }

  const spToken = localStorage.getItem('mediary_spotify_token');
  if (!spToken || isPlaying) {
    const carousel = document.getElementById('home-live-carousel');
    if (carousel && carousel.scrollLeft === 0 && !spToken) {
      setTimeout(() => {
        if (typeof cambiarSlideLive === 'function') cambiarSlideLive(1);
      }, 100);
    }
  }

  requestAnimationFrame(() => {
    setTimeout(ajustarMarqueeSpotify, 50);
  });
}

function obtenerSvgLogoPlataformaJuego_(plataforma, size = 20) {
  if (plataforma === 'steam') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#66c0f4"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 14.819C1.868 20.089 6.48 24 11.979 24c6.627 0 12-5.373 12-12S18.606 0 11.979 0zM7.558 16.323c-.325.795-1.109 1.344-2.021 1.344-.127 0-.251-.013-.374-.035l2.455 1.015c.677-.384 1.187-1.026 1.393-1.802-.458-.137-.96-.341-1.453-.522zm8.384-9.619c-1.246 0-2.26 1.014-2.26 2.26s1.014 2.26 2.26 2.26 2.26-1.014 2.26-2.26-1.014-2.26-2.26-2.26zm0 3.616c-.748 0-1.356-.607-1.356-1.356s.608-1.356 1.356-1.356c.748 0 1.355.607 1.355 1.356s-.607 1.356-1.355 1.356z"/></svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#0070d1"><path d="M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.505v5.875c2.441 1.193 4.362-.002 4.362-3.152 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.39-1.502zm4.656 16.241l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5V14.98l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.04 1.472 1.576 2.072-.465.6-1.622 1.036-1.622 1.036l-8.544 3.107V18.86zM1.807 18.6c-1.9-.545-2.214-1.668-1.352-2.32.801-.586 2.16-1.052 2.16-1.052l5.615-2.013v2.313L4.205 17c-.705.271-.825.632-.239.826.586.195 1.637.15 2.343-.12L8.247 17v2.074c-.12.03-.256.044-.39.073-1.939.331-3.996.196-6.038-.479z"/></svg>`;
}

function dibujarTarjetaPlayStationCompacta(data) {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const titleName = data.titleName || data.name || (l === 'en' ? 'Steam Game' : 'Juego de Steam');
  const coverUrl = data.image || '';
  const isExp = estaLiveCardExpandida('playstation');
  const accentColor = '#66c0f4';
  const placeholderBg = 'linear-gradient(135deg,rgba(23,26,33,0.92),rgba(27,40,56,0.92))';

  let brandHref = data.appid ? `https://store.steampowered.com/app/${encodeURIComponent(data.appid)}` : 'https://store.steampowered.com';
  try {
    if (!data.appid) {
      const uRaw = localStorage.getItem('mediary_steam_user');
      if (uRaw) {
        const u = JSON.parse(uRaw);
        if (u && u.profileUrl) brandHref = u.profileUrl;
      }
    }
  } catch (e) {}

  const coverHtml = coverUrl
    ? `<img src="${escHtmlSpotify_(coverUrl)}" alt="${escHtmlSpotify_(titleName)}" loading="lazy"><span class="home-psn-platform-badge">Steam</span>`
    : `<div style="width:100%;height:100%;display:grid;place-items:center;background:${placeholderBg};color:${accentColor};"><svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><rect width="20" height="12" x="2" y="6" rx="6"/><path d="M6 12h4m-2-2v4M15 13h.01M18 11h.01"/></svg></div>`;

  return `
    <div class="home-playstation-card-compact is-steam-active home-live-expandable-card ${isExp ? 'is-expanded' : 'is-collapsed'}" data-game-platform="steam" onclick="toggleLiveCardExpansion('playstation', event)" title="${isExp ? (l === 'en' ? 'Tap to collapse' : 'Toca para reducir') : (l === 'en' ? 'Tap to expand' : 'Toca para expandir')}">
      <!-- i. Portada -->
      <div class="home-psn-cover-compact">
        ${coverHtml}
      </div>

      <!-- ii. Centro -->
      <div class="home-psn-center-compact">
        <!-- VISTA REDUCIDA (COLLAPSED) -->
        <div class="live-card-collapsed-only" style="width:100%; overflow:hidden;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div class="home-psn-title-compact home-np-text-wrap" title="${escHtmlSpotify_(titleName)}">
              <span class="home-np-scrollable">${escHtmlSpotify_(titleName)}</span>
            </div>
            <div style="font-size:0.72rem; color:${accentColor}; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:5px;">
              <span>Steam</span>
              <span style="opacity:0.5;">·</span>
              <span style="color:#10b981; display:inline-flex; align-items:center; gap:3px; font-size:0.68rem; font-weight:700;">
                <span class="home-np-dot" style="background:#10b981;"></span>
                <span>${l === 'en' ? 'Live' : 'En vivo'}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- VISTA EXPANDIDA (EXPANDED - SIMPLE Y LIMPIA) -->
        <div class="live-card-expanded-only" style="width:100%; display:flex; flex-direction:column; gap:2px;">
          <div class="home-psn-platform-label">
            <span>Steam</span>
          </div>
          <div class="home-psn-title-compact home-np-text-wrap" title="${escHtmlSpotify_(titleName)}">
            <span class="home-np-scrollable">${escHtmlSpotify_(titleName)}</span>
          </div>
          <div class="home-psn-status-row" style="margin-top:2px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <div class="home-psn-live-pill" title="${l === 'en' ? 'Playing now' : 'Jugando ahora'}">
              <span class="home-np-dot" style="background:#10b981;"></span>
              <span>${l === 'en' ? 'Live' : 'En vivo'}</span>
            </div>
            <button type="button" class="btn-psn-sync-prominent" onclick="event.stopPropagation(); forzarActualizacionJuegosLive(this)" title="${l === 'en' ? 'Sync gaming status' : 'Sincronizar estado'}">
              <svg class="btn-sync-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              <span class="btn-sync-text">${l === 'en' ? 'Sync status' : 'Sincronizar estado'}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- iii. Borde derecho: logo Steam, botón de sincronización rápida y chevron -->
      <div class="home-psn-right-col">
        <a href="${escHtmlSpotify_(brandHref)}" target="_blank" rel="noopener noreferrer" class="home-psn-logo-link live-card-expanded-only" onclick="event.stopPropagation()" title="${l === 'en' ? 'Open Steam' : 'Abrir Steam'}">
          ${obtenerSvgLogoPlataformaJuego_('steam', 20)}
        </a>
        <button type="button" class="btn-psn-sync-quick" onclick="event.stopPropagation(); forzarActualizacionJuegosLive(this)" title="${l === 'en' ? 'Sync gaming status' : 'Sincronizar estado'}">
          <svg class="btn-sync-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
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

function dibujarTarjetaPlayStationCompactaIdle(estadoJuego = null) {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const isExp = estaLiveCardExpandida('playstation');
  const titleTxt = l === 'en' ? 'Not playing anything right now' : 'No estás jugando a nada';
  const accentColor = '#66c0f4';
  const coverStyle = 'background:linear-gradient(135deg,rgba(23,26,33,0.92),rgba(27,40,56,0.92)); color:#66c0f4; border:1px solid rgba(102,192,244,0.3);';

  return `
    <div class="home-playstation-card-compact is-steam-active home-live-expandable-card ${isExp ? 'is-expanded' : 'is-collapsed'}" data-game-platform="steam" onclick="toggleLiveCardExpansion('playstation', event)" title="${isExp ? (l === 'en' ? 'Tap to collapse' : 'Toca para reducir') : (l === 'en' ? 'Tap to expand' : 'Toca para expandir')}">
      <!-- i. Portada con mando de Steam -->
      <div class="home-psn-cover-compact" style="display:grid; place-items:center; ${coverStyle}">
        <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:24px; height:24px;"><rect width="20" height="12" x="2" y="6" rx="6"/><path d="M6 12h4m-2-2v4M15 13h.01M18 11h.01"/></svg>
      </div>

      <!-- ii. Centro -->
      <div class="home-psn-center-compact">
        <!-- VISTA REDUCIDA (COLLAPSED) -->
        <div class="live-card-collapsed-only" style="width:100%; overflow:hidden;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div class="home-psn-title-compact home-np-text-wrap" title="${titleTxt}">
              <span class="home-np-scrollable" style="color:var(--muted); font-weight:700;">${titleTxt}</span>
            </div>
            <div style="font-size:0.72rem; color:var(--muted); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:5px;">
              <span>Steam</span>
              <span style="opacity:0.5;">·</span>
              <span style="display:inline-flex; align-items:center; gap:3px; font-size:0.68rem;">
                <span class="home-np-dot" style="background:#64748b; box-shadow:none; animation:none;"></span>
                <span>${l === 'en' ? 'Rest mode' : 'En reposo'}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- VISTA EXPANDIDA (EXPANDED - SIMPLE Y LIMPIA) -->
        <div class="live-card-expanded-only" style="width:100%; display:flex; flex-direction:column; gap:2px;">
          <div class="home-psn-platform-label" style="color:${accentColor};">
            <span>Steam</span>
          </div>
          <div class="home-psn-title-compact home-np-text-wrap" title="${titleTxt}">
            <span class="home-np-scrollable" style="color:var(--text); font-weight:700;">${titleTxt}</span>
          </div>
          <div class="home-psn-status-row" style="margin-top:2px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <div class="home-psn-live-pill idle" title="${l === 'en' ? 'Rest Mode' : 'En reposo'}">
              <span class="home-np-dot" style="background:#64748b; box-shadow:none; animation:none;"></span>
              <span>${l === 'en' ? 'Rest mode' : 'En reposo'}</span>
            </div>
            <button type="button" class="btn-psn-sync-prominent" onclick="event.stopPropagation(); forzarActualizacionJuegosLive(this)" title="${l === 'en' ? 'Sync gaming status' : 'Sincronizar estado'}">
              <svg class="btn-sync-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              <span class="btn-sync-text">${l === 'en' ? 'Sync status' : 'Sincronizar estado'}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- iii. Borde derecho: logo Steam, botón de sincronización rápida y chevron -->
      <div class="home-psn-right-col">
        <a href="https://store.steampowered.com" target="_blank" rel="noopener noreferrer" class="home-psn-logo-link live-card-expanded-only" onclick="event.stopPropagation()" title="Steam">
          ${obtenerSvgLogoPlataformaJuego_('steam', 20)}
        </a>
        <button type="button" class="btn-psn-sync-quick" onclick="event.stopPropagation(); forzarActualizacionJuegosLive(this)" title="${l === 'en' ? 'Sync gaming status' : 'Sincronizar estado'}">
          <svg class="btn-sync-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
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

function dibujarTarjetaPlayStationCompactaDesconectado() {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  const isExp = estaLiveCardExpandida('playstation');
  return `
    <div class="home-playstation-card-compact home-live-expandable-card ${isExp ? 'is-expanded' : 'is-collapsed'}" data-game-platform="disconnected" onclick="toggleLiveCardExpansion('playstation', event)" title="${isExp ? (l === 'en' ? 'Tap to collapse' : 'Toca para reducir') : (l === 'en' ? 'Tap to expand' : 'Toca para expandir')}">
      <div class="home-psn-cover-compact" style="display:grid; place-items:center; background:linear-gradient(135deg,rgba(23,26,33,0.92),rgba(27,40,56,0.92)); color:#66c0f4; cursor:pointer;" onclick="event.stopPropagation(); abrirModalConectarSteam()">
        <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:24px; height:24px;"><rect width="20" height="12" x="2" y="6" rx="6"/><path d="M6 12h4m-2-2v4M15 13h.01M18 11h.01"/></svg>
      </div>

      <div class="home-psn-center-compact">
        <!-- VISTA REDUCIDA (COLLAPSED) -->
        <div class="live-card-collapsed-only" style="width:100%; overflow:hidden;">
          <div style="flex:1; min-width:0; overflow:hidden;">
            <div class="home-psn-title-compact home-np-text-wrap" style="color:#66c0f4; cursor:pointer;" onclick="event.stopPropagation(); abrirModalConectarSteam()">
              <span class="home-np-scrollable">${l === 'en' ? 'Connect Steam' : 'Conectar Steam'}</span>
            </div>
            <div style="font-size:0.72rem; color:var(--muted); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              <span>Steam</span>
            </div>
          </div>
        </div>

        <!-- VISTA EXPANDIDA -->
        <div class="live-card-expanded-only" style="width:100%; display:flex; flex-direction:column; gap:2px;">
          <div class="home-psn-platform-label">
            <span>Steam</span>
          </div>
          <div class="home-psn-title-compact home-np-text-wrap" style="cursor:pointer;" onclick="event.stopPropagation(); abrirModalConectarSteam()">
            <span class="home-np-scrollable" style="color:#66c0f4;">${l === 'en' ? 'Connect Steam account' : 'Conecta tu cuenta de Steam'}</span>
          </div>
          <div class="home-psn-status-row" style="margin-top:2px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn-psn-sync-compact" onclick="event.stopPropagation(); abrirModalConectarSteam()" style="color:#66c0f4;border-color:rgba(102,192,244,0.3);background:rgba(102,192,244,0.12);">
              + <span>Steam</span>
            </button>
            <button type="button" class="btn-psn-sync-compact" onclick="event.stopPropagation(); abrirModalConectarPsn()">
              + <span>PlayStation</span>
            </button>
          </div>
        </div>
      </div>

      <div class="home-psn-right-col">
        <span class="home-psn-logo-link live-card-expanded-only" style="width:auto; display:inline-flex; align-items:center; gap:4px; cursor:pointer;" onclick="event.stopPropagation(); abrirModalConectarSteam()" title="Steam">
          ${obtenerSvgLogoPlataformaJuego_('steam', 18)}
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

function registrarJuegoActualEnMediary(titulo, plataforma = 'PS5') {
  const busqueda = (titulo && titulo !== '—') ? titulo.trim() : '';
  if (!busqueda) return;
  cambiarCat('Juegos', 'Consolas');
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

function guardarJuegoPsnEnMediary(titulo, horas, poster, plataforma = 'PS5') {
  try {
    if (typeof cerrarModalEstadisticasAvanzadas === 'function') {
      cerrarModalEstadisticasAvanzadas();
    }
    if (typeof cambiarCat === 'function') {
      cambiarCat('Juegos', 'Consolas');
    }
    const horasNum = parseFloat(horas) || 0;
    const obj = {
      tituloOriginal: titulo,
      titulo: titulo,
      creador: `PlayStation (${plataforma || 'PS5'})`,
      anio: '',
      poster: poster || '',
      sinopsis: horasNum > 0 ? `Videojuego jugado en PlayStation ${plataforma} (${horasNum} hrs registradas en PSN).` : `Videojuego de PlayStation Network (${plataforma}).`
    };
    if (typeof seleccionarItem === 'function') {
      seleccionarItem(obj);
      setTimeout(() => {
        const inpH = document.getElementById('input-horas-jugadas');
        if (inpH && horasNum > 0) inpH.value = `${horasNum}`;
      }, 200);
    } else if (typeof ejecutarAgregadoRapido === 'function') {
      ejecutarAgregadoRapido('Juegos', 'Consolas');
    }
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? `Opening "${titulo}" to log...` : `Abriendo registro de "${titulo}"... `);
  } catch(e) {
    console.error('Error al guardar juego PlayStation en Mediary:', e);
  }
}

function registrarTopPsnByIndex(index) {
  try {
    let stats = null;
    const raw = localStorage.getItem('mediary_psn_stats');
    if (raw) stats = JSON.parse(raw);
    const game = stats && stats.topGames && stats.topGames[index];
    if (game) {
      guardarJuegoPsnEnMediary(game.name, game.hours, game.icon || game.image, game.platform || 'PS5');
    }
  } catch(e) {
    console.error('Error registrando juego PlayStation por índice:', e);
  }
}

// Limpieza de datos residuales de Goodreads / Kindle
try {
  localStorage.removeItem("mediary_goodreads_id");
  localStorage.removeItem("mediary_goodreads_user");
  localStorage.removeItem("mediary_goodreads_rss_custom");
  localStorage.removeItem("mediary_goodreads_last_sync");
} catch (e) {}

