/* Mediary — js/integrations/lastfm.js */
/* ==========================================================================
   INTEGRACIÓN LAST.FM (ESTADÍSTICAS MUSICALES Y HISTORIAL PERMANENTE)
   ========================================================================== */

function limpiarNombreUsuarioLastFm(str) {
  if (!str) return '';
  str = str.trim();
  const m = str.match(/last\.fm\/user\/([^/?#]+)/i);
  if (m && m[1]) return m[1].trim();
  return str.replace(/^@/, '').trim();
}

function abrirModalConectarLastFm() {
  const m = document.getElementById('modal-conectar-lastfm');
  if (m) {
    m.style.display = 'flex';
    const inp = document.getElementById('lastfm-input-profile');
    if (inp) {
      inp.value = localStorage.getItem('mediary_lastfm_username') || '';
      setTimeout(() => inp.focus(), 150);
    }
  }
}

function cerrarModalConectarLastFm() {
  const m = document.getElementById('modal-conectar-lastfm');
  if (m) m.style.display = 'none';
}

async function conectarLastFmPerfil(inputVal) {
  if (!inputVal) {
    const inp = document.getElementById('lastfm-input-profile');
    inputVal = inp ? inp.value.trim() : '';
  }
  if (!inputVal) {
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'Please enter your Last.fm username or profile link' : 'Ingresa tu usuario o enlace de perfil de Last.fm');
    return;
  }
  const cleanUsername = limpiarNombreUsuarioLastFm(inputVal);
  if (!cleanUsername) {
    mostrarToastPersonalizado(tLang('Usuario de Last.fm no válido', 'Invalid Last.fm username'));
    return;
  }
  mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? ' Connecting & syncing with Last.fm...' : ' Conectando y sincronizando con Last.fm...');
  cerrarModalConectarLastFm();

  const ok = await sincronizarCuentaLastFm(cleanUsername, true);
  if (ok) {
    if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(true);
    }
    const modalStats = document.getElementById('modal-estadisticas-avanzadas');
    if (modalStats && modalStats.style.display === 'flex' && typeof renderizarContenidoEstadisticasAvanzadas === 'function') {
      renderizarContenidoEstadisticasAvanzadas();
    }
  }
}

function generarStatsLastFmDemo() {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const demoUser = {
    name: 'Melomano_Mediary',
    realname: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    url: 'https://www.last.fm',
    playcount: 48920,
    artist_count: 1420,
    album_count: 2850,
    track_count: 11400,
    registered: '2021-03-15'
  };

  const artistsOverall = [
    { rank: '1', name: 'Radiohead', playcount: 3420, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm/music/Radiohead' },
    { rank: '2', name: 'Pink Floyd', playcount: 2890, image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm/music/Pink+Floyd' },
    { rank: '3', name: 'Daft Punk', playcount: 2450, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm/music/Daft+Punk' },
    { rank: '4', name: 'David Bowie', playcount: 1980, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm/music/David+Bowie' },
    { rank: '5', name: 'The Weeknd', playcount: 1750, image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm/music/The+Weeknd' }
  ];

  const albumsOverall = [
    { rank: '1', name: 'OK Computer', artist: 'Radiohead', playcount: 890, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm/music/Radiohead/OK+Computer' },
    { rank: '2', name: 'The Dark Side of the Moon', artist: 'Pink Floyd', playcount: 780, image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm/music/Pink+Floyd/The+Dark+Side+of+the+Moon' },
    { rank: '3', name: 'Discovery', artist: 'Daft Punk', playcount: 670, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm/music/Daft+Punk/Discovery' },
    { rank: '4', name: 'Random Access Memories', artist: 'Daft Punk', playcount: 610, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm/music/Daft+Punk/Random+Access+Memories' },
    { rank: '5', name: 'In Rainbows', artist: 'Radiohead', playcount: 590, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm/music/Radiohead/In+Rainbows' }
  ];

  const tracksOverall = [
    { rank: '1', name: 'Paranoid Android', artist: 'Radiohead', album: 'OK Computer', playcount: 245, duration: 383, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm' },
    { rank: '2', name: 'One More Time', artist: 'Daft Punk', album: 'Discovery', playcount: 210, duration: 320, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm' },
    { rank: '3', name: 'Time', artist: 'Pink Floyd', album: 'The Dark Side of the Moon', playcount: 198, duration: 425, image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm' },
    { rank: '4', name: 'Starboy', artist: 'The Weeknd', album: 'Starboy', playcount: 182, duration: 230, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm' },
    { rank: '5', name: 'Heroes', artist: 'David Bowie', album: 'Heroes', playcount: 165, duration: 367, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80', url: 'https://www.last.fm' }
  ];

  const recentTracks = [
    { name: 'Let Down', artist: 'Radiohead', album: 'OK Computer', isNowPlaying: true, date: tLang('Ahora mismo', 'Just now'), image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80' },
    { name: 'Harder, Better, Faster, Stronger', artist: 'Daft Punk', album: 'Discovery', isNowPlaying: false, date: tLang('Hace 8 minutos', '8 minutes ago'), image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80' },
    { name: 'Comfortably Numb', artist: 'Pink Floyd', album: 'The Wall', isNowPlaying: false, date: tLang('Hace 24 minutos', '24 minutes ago'), image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&auto=format&fit=crop&q=80' },
    { name: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', isNowPlaying: false, date: tLang('Hace 1 hora', '1 hour ago'), image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=120&auto=format&fit=crop&q=80' },
    { name: 'Karma Police', artist: 'Radiohead', album: 'OK Computer', isNowPlaying: false, date: tLang('Hace 2 horas', '2 hours ago'), image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80' }
  ];

  const countTotal = 48920;
  const countAnio = 9480;
  const countMes = 760;

  const demoStats = {
    selectedPeriod: 'overall',
    totalScrobbles: countTotal,
    countTotal,
    countAnio,
    countMes,
    horasTotal: Math.round((countTotal * 3.5 / 60) * 10) / 10,
    horasAnio: Math.round((countAnio * 3.5 / 60) * 10) / 10,
    horasMes: Math.round((countMes * 3.5 / 60) * 10) / 10,
    artistCount: 1420,
    albumCount: 2850,
    topArtists: artistsOverall,
    topAlbums: albumsOverall,
    topTracks: tracksOverall,
    topArtistsByPeriod: { overall: artistsOverall, '12month': artistsOverall, '6month': artistsOverall, '1month': artistsOverall, '7day': artistsOverall },
    topAlbumsByPeriod: { overall: albumsOverall, '12month': albumsOverall, '6month': albumsOverall, '1month': albumsOverall, '7day': albumsOverall },
    topTracksByPeriod: { overall: tracksOverall, '12month': tracksOverall, '6month': tracksOverall, '1month': tracksOverall, '7day': tracksOverall },
    recentTracks,
    lastSync: new Date().toISOString()
  };

  return { user: demoUser, stats: demoStats };
}

function conectarLastFmDemo() {
  const demoData = generarStatsLastFmDemo();
  localStorage.setItem('mediary_lastfm_connected', 'true');
  localStorage.setItem('mediary_lastfm_username', demoData.user.name);
  localStorage.setItem('mediary_lastfm_user', JSON.stringify(demoData.user));
  localStorage.setItem('mediary_lastfm_stats', JSON.stringify(demoData.stats));
  localStorage.setItem('mediary_lastfm_selected_period', 'overall');

  cerrarModalConectarLastFm();
  actualizarUILastFm();
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
  const modalStats = document.getElementById('modal-estadisticas-avanzadas');
  if (modalStats && modalStats.style.display === 'flex' && typeof renderizarContenidoEstadisticasAvanzadas === 'function') {
    renderizarContenidoEstadisticasAvanzadas();
  }
  mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? ' Demo Last.fm profile connected!' : ' ¡Perfil demo de Last.fm conectado!');
}

function desconectarLastFm() {
  localStorage.removeItem('mediary_lastfm_connected');
  localStorage.removeItem('mediary_lastfm_username');
  localStorage.removeItem('mediary_lastfm_user');
  localStorage.removeItem('mediary_lastfm_stats');
  localStorage.removeItem('mediary_lastfm_selected_period');
  actualizarUILastFm();
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
  const modalStats = document.getElementById('modal-estadisticas-avanzadas');
  if (modalStats && modalStats.style.display === 'flex' && typeof renderizarContenidoEstadisticasAvanzadas === 'function') {
    renderizarContenidoEstadisticasAvanzadas();
  }
  mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'Last.fm disconnected' : 'Last.fm desconectado');
}

function actualizarUILastFm() {
  const isConn = localStorage.getItem('mediary_lastfm_connected') === 'true';
  const badge = document.getElementById('cfg-lastfm-badge');
  const disBox = document.getElementById('cfg-lastfm-disconnected-box');
  const connBox = document.getElementById('cfg-lastfm-connected-box');
  const nameEl = document.getElementById('cfg-lastfm-user-name');
  const avatarEl = document.getElementById('cfg-lastfm-user-avatar');
  const subEl = document.getElementById('cfg-lastfm-user-sub');

  if (isConn) {
    if (badge) badge.style.display = 'inline-flex';
    if (disBox) disBox.style.display = 'none';
    if (connBox) connBox.style.display = 'block';

    let user = null;
    try {
      const u = localStorage.getItem('mediary_lastfm_user');
      if (u) user = JSON.parse(u);
    } catch (e) {}

    let stats = null;
    try {
      const s = localStorage.getItem('mediary_lastfm_stats');
      if (s) stats = JSON.parse(s);
    } catch (e) {}

    const username = localStorage.getItem('mediary_lastfm_username') || user?.name || '';
    if (nameEl) nameEl.textContent = (user && (user.realname || user.name)) || username || tLang('Usuario Last.fm', 'Last.fm User');

    const totalScrobbles = stats?.totalScrobbles || user?.playcount || 0;
    const totalH = stats?.horasTotal || 0;
    if (subEl) {
      if (totalScrobbles) {
        subEl.textContent = `${totalScrobbles.toLocaleString()} scrobbles · ${totalH ? totalH + ' hrs' : 'Last.fm'}`;
      } else {
        subEl.textContent = username ? `@${username}` : tLang('Conectado', 'Connected');
      }
    }
    if (avatarEl) {
      if (user?.avatar) {
        avatarEl.innerHTML = `<img loading="lazy" decoding="async" src="${escHtmlStats_(user.avatar)}" alt="Last.fm Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        avatarEl.innerHTML = getHeroIcon('musical-note', '', 18);
      }
    }
  } else {
    if (badge) badge.style.display = 'none';
    if (disBox) disBox.style.display = 'block';
    if (connBox) connBox.style.display = 'none';
  }
  if (typeof renderizarAppsVinculadasConfig === 'function') renderizarAppsVinculadasConfig();
}

async function sincronizarCuentaLastFm(username, notificar = false) {
  if (typeof username === 'boolean') {
    notificar = username;
    username = null;
  }
  if (!username) {
    username = localStorage.getItem('mediary_lastfm_username');
  }
  if (!username) {
    if (notificar) mostrarToastPersonalizado(tLang('No hay usuario de Last.fm configurado', 'No Last.fm username configured'));
    return false;
  }

  if (username.toLowerCase() === 'demo' || username.startsWith('demo_') || username === 'Melomano_Mediary') {
    conectarLastFmDemo();
    return true;
  }

  const apiKey = window.LASTFM_API_KEY || localStorage.getItem('mediary_lastfm_api_key') || 'b25b959554ed76058ac220b7b2e0a026';
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const startOfYear = Math.floor(new Date(nowYear, 0, 1).getTime() / 1000);
  const startOfMonth = Math.floor(new Date(nowYear, nowMonth, 1).getTime() / 1000);

  try {
    const encodedUser = encodeURIComponent(username);
    const baseUrl = 'https://ws.audioscrobbler.com/2.0/';

    const infoRes = await fetch(`${baseUrl}?method=user.getinfo&user=${encodedUser}&api_key=${apiKey}&format=json`).catch(() => null);
    if (!infoRes || !infoRes.ok) {
      if (notificar) mostrarToastPersonalizado(tLang('No se encontró el usuario en Last.fm', 'Last.fm user not found'));
      return false;
    }
    const infoData = await infoRes.json();
    if (infoData.error || !infoData.user) {
      if (notificar) mostrarToastPersonalizado(infoData.message || tLang('Error al consultar perfil de Last.fm', 'Error fetching Last.fm profile'));
      return false;
    }

    const u = infoData.user;
    const realUser = {
      name: u.name,
      realname: u.realname || u.name,
      avatar: Array.isArray(u.image) ? (u.image.find(i => i.size === 'extralarge' || i.size === 'large')?.['#text'] || '') : '',
      url: u.url || `https://www.last.fm/user/${u.name}`,
      playcount: parseInt(u.playcount) || 0,
      artist_count: parseInt(u.artist_count) || 0,
      album_count: parseInt(u.album_count) || 0,
      track_count: parseInt(u.track_count) || 0,
      registered: u.registered?.['#text'] || ''
    };

    const [yearRes, monthRes, recentRes, artOverallRes, artYearRes, albOverallRes, albYearRes, trkOverallRes, trkYearRes] = await Promise.all([
      fetch(`${baseUrl}?method=user.getrecenttracks&user=${encodedUser}&from=${startOfYear}&limit=1&api_key=${apiKey}&format=json`).catch(() => null),
      fetch(`${baseUrl}?method=user.getrecenttracks&user=${encodedUser}&from=${startOfMonth}&limit=1&api_key=${apiKey}&format=json`).catch(() => null),
      fetch(`${baseUrl}?method=user.getrecenttracks&user=${encodedUser}&limit=20&api_key=${apiKey}&format=json`).catch(() => null),
      fetch(`${baseUrl}?method=user.gettopartists&user=${encodedUser}&period=overall&limit=10&api_key=${apiKey}&format=json`).catch(() => null),
      fetch(`${baseUrl}?method=user.gettopartists&user=${encodedUser}&period=12month&limit=10&api_key=${apiKey}&format=json`).catch(() => null),
      fetch(`${baseUrl}?method=user.gettopalbums&user=${encodedUser}&period=overall&limit=10&api_key=${apiKey}&format=json`).catch(() => null),
      fetch(`${baseUrl}?method=user.gettopalbums&user=${encodedUser}&period=12month&limit=10&api_key=${apiKey}&format=json`).catch(() => null),
      fetch(`${baseUrl}?method=user.gettoptracks&user=${encodedUser}&period=overall&limit=10&api_key=${apiKey}&format=json`).catch(() => null),
      fetch(`${baseUrl}?method=user.gettoptracks&user=${encodedUser}&period=12month&limit=10&api_key=${apiKey}&format=json`).catch(() => null)
    ]);

    const countTotal = realUser.playcount;
    let countAnio = 0;
    let countMes = 0;

    if (yearRes && yearRes.ok) {
      const yData = await yearRes.json().catch(() => null);
      countAnio = parseInt(yData?.recenttracks?.['@attr']?.total) || 0;
    }
    if (monthRes && monthRes.ok) {
      const mData = await monthRes.json().catch(() => null);
      countMes = parseInt(mData?.recenttracks?.['@attr']?.total) || 0;
    }

    const horasTotal = Math.round((countTotal * 3.5 / 60) * 10) / 10;
    const horasAnio = Math.round((countAnio * 3.5 / 60) * 10) / 10;
    const horasMes = Math.round((countMes * 3.5 / 60) * 10) / 10;

    let recentTracks = [];
    if (recentRes && recentRes.ok) {
      const recData = await recentRes.json().catch(() => null);
      const rawList = recData?.recenttracks?.track;
      if (Array.isArray(rawList)) {
        recentTracks = rawList.map(t => {
          const isNowPlaying = t['@attr']?.nowplaying === 'true';
          const img = Array.isArray(t.image) ? (t.image.find(i => i.size === 'large' || i.size === 'medium')?.['#text'] || '') : '';
          return {
            name: t.name,
            artist: typeof t.artist === 'object' ? (t.artist['#text'] || '') : String(t.artist || ''),
            album: typeof t.album === 'object' ? (t.album['#text'] || '') : String(t.album || ''),
            isNowPlaying,
            date: isNowPlaying ? 'Reproduciendo ahora' : (t.date?.['#text'] || ''),
            image: (img && !img.includes('2a96cbd8b46e442fc41c2b86b821562f')) ? img : '',
            url: t.url || ''
          };
        });
      }
    }

    const mapArtists = (arr) => (Array.isArray(arr) ? arr.map(a => {
      const img = Array.isArray(a.image) ? (a.image.find(i => i.size === 'extralarge' || i.size === 'large')?.['#text'] || '') : '';
      return {
        rank: a['@attr']?.rank || '1',
        name: a.name,
        playcount: parseInt(a.playcount) || 0,
        image: (img && !img.includes('2a96cbd8b46e442fc41c2b86b821562f')) ? img : '',
        url: a.url || ''
      };
    }) : []);

    const mapAlbums = (arr) => (Array.isArray(arr) ? arr.map(al => {
      const img = Array.isArray(al.image) ? (al.image.find(i => i.size === 'extralarge' || i.size === 'large')?.['#text'] || '') : '';
      return {
        rank: al['@attr']?.rank || '1',
        name: al.name,
        artist: typeof al.artist === 'object' ? (al.artist.name || al.artist['#text'] || '') : String(al.artist || ''),
        playcount: parseInt(al.playcount) || 0,
        image: (img && !img.includes('2a96cbd8b46e442fc41c2b86b821562f')) ? img : '',
        url: al.url || ''
      };
    }) : []);

    const mapTracks = (arr) => (Array.isArray(arr) ? arr.map(tr => {
      const img = Array.isArray(tr.image) ? (tr.image.find(i => i.size === 'extralarge' || i.size === 'large')?.['#text'] || '') : '';
      return {
        rank: tr['@attr']?.rank || '1',
        name: tr.name,
        artist: typeof tr.artist === 'object' ? (tr.artist.name || tr.artist['#text'] || '') : String(tr.artist || ''),
        album: typeof tr.album === 'object' ? (tr.album.name || tr.album['#text'] || '') : String(tr.album || ''),
        duration: parseInt(tr.duration) || 0,
        playcount: parseInt(tr.playcount) || 0,
        image: (img && !img.includes('2a96cbd8b46e442fc41c2b86b821562f')) ? img : '',
        url: tr.url || ''
      };
    }) : []);

    let stats = {};
    try {
      const prev = localStorage.getItem('mediary_lastfm_stats');
      if (prev) stats = JSON.parse(prev);
    } catch (e) {}

    if (!stats.topArtistsByPeriod) stats.topArtistsByPeriod = {};
    if (!stats.topAlbumsByPeriod) stats.topAlbumsByPeriod = {};
    if (!stats.topTracksByPeriod) stats.topTracksByPeriod = {};

    if (artOverallRes && artOverallRes.ok) {
      const d = await artOverallRes.json().catch(() => null);
      stats.topArtistsByPeriod.overall = mapArtists(d?.topartists?.artist);
    }
    if (artYearRes && artYearRes.ok) {
      const d = await artYearRes.json().catch(() => null);
      stats.topArtistsByPeriod['12month'] = mapArtists(d?.topartists?.artist);
    }

    if (albOverallRes && albOverallRes.ok) {
      const d = await albOverallRes.json().catch(() => null);
      stats.topAlbumsByPeriod.overall = mapAlbums(d?.topalbums?.album);
    }
    if (albYearRes && albYearRes.ok) {
      const d = await albYearRes.json().catch(() => null);
      stats.topAlbumsByPeriod['12month'] = mapAlbums(d?.topalbums?.album);
    }

    if (trkOverallRes && trkOverallRes.ok) {
      const d = await trkOverallRes.json().catch(() => null);
      stats.topTracksByPeriod.overall = mapTracks(d?.toptracks?.track);
    }
    if (trkYearRes && trkYearRes.ok) {
      const d = await trkYearRes.json().catch(() => null);
      stats.topTracksByPeriod['12month'] = mapTracks(d?.toptracks?.track);
    }

    const selPeriod = localStorage.getItem('mediary_lastfm_selected_period') || 'overall';
    stats.selectedPeriod = selPeriod;
    stats.topArtists = stats.topArtistsByPeriod[selPeriod] || stats.topArtistsByPeriod.overall || [];
    stats.topAlbums = stats.topAlbumsByPeriod[selPeriod] || stats.topAlbumsByPeriod.overall || [];
    stats.topTracks = stats.topTracksByPeriod[selPeriod] || stats.topTracksByPeriod.overall || [];

    stats.totalScrobbles = countTotal;
    stats.countTotal = countTotal;
    stats.countAnio = countAnio;
    stats.countMes = countMes;
    stats.horasTotal = horasTotal;
    stats.horasAnio = horasAnio;
    stats.horasMes = horasMes;
    stats.artistCount = realUser.artist_count;
    stats.albumCount = realUser.album_count;
    stats.recentTracks = recentTracks;
    stats.lastSync = new Date().toISOString();

    localStorage.setItem('mediary_lastfm_connected', 'true');
    localStorage.setItem('mediary_lastfm_username', u.name);
    localStorage.setItem('mediary_lastfm_user', JSON.stringify(realUser));
    localStorage.setItem('mediary_lastfm_stats', JSON.stringify(stats));

    actualizarUILastFm();
    if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(false);
    }
    if (notificar) mostrarToastPersonalizado(userPrefs?.lang === 'en' ? 'Last.fm stats synchronized! ' : '¡Estadísticas de Last.fm sincronizadas! ');
    return true;
  } catch (err) {
    console.error('Error sincronizando Last.fm:', err);
    if (notificar) mostrarToastPersonalizado(tLang('Error al sincronizar con Last.fm', 'Error syncing with Last.fm'));
    return false;
  }
}

async function cargarPeriodoEspecificoLastFm(username, periodo) {
  const apiKey = window.LASTFM_API_KEY || localStorage.getItem('mediary_lastfm_api_key') || 'b25b959554ed76058ac220b7b2e0a026';
  const encodedUser = encodeURIComponent(username);
  const baseUrl = 'https://ws.audioscrobbler.com/2.0/';

  let stats = {};
  try {
    const raw = localStorage.getItem('mediary_lastfm_stats');
    if (raw) stats = JSON.parse(raw);
  } catch(e) {}

  if (!stats.topArtistsByPeriod) stats.topArtistsByPeriod = {};
  if (!stats.topAlbumsByPeriod) stats.topAlbumsByPeriod = {};
  if (!stats.topTracksByPeriod) stats.topTracksByPeriod = {};

  try {
    const [artRes, albRes, trkRes] = await Promise.all([
      fetch(`${baseUrl}?method=user.gettopartists&user=${encodedUser}&period=${periodo}&limit=10&api_key=${apiKey}&format=json`).catch(() => null),
      fetch(`${baseUrl}?method=user.gettopalbums&user=${encodedUser}&period=${periodo}&limit=10&api_key=${apiKey}&format=json`).catch(() => null),
      fetch(`${baseUrl}?method=user.gettoptracks&user=${encodedUser}&period=${periodo}&limit=10&api_key=${apiKey}&format=json`).catch(() => null)
    ]);

    const mapArt = (arr) => (Array.isArray(arr) ? arr.map(a => ({
      rank: a['@attr']?.rank || '1',
      name: a.name,
      playcount: parseInt(a.playcount) || 0,
      image: (Array.isArray(a.image) ? (a.image.find(i => i.size === 'extralarge' || i.size === 'large')?.['#text'] || '') : '') || '',
      url: a.url || ''
    })) : []);

    const mapAlb = (arr) => (Array.isArray(arr) ? arr.map(al => ({
      rank: al['@attr']?.rank || '1',
      name: al.name,
      artist: typeof al.artist === 'object' ? (al.artist.name || al.artist['#text'] || '') : String(al.artist || ''),
      playcount: parseInt(al.playcount) || 0,
      image: (Array.isArray(al.image) ? (al.image.find(i => i.size === 'extralarge' || i.size === 'large')?.['#text'] || '') : '') || '',
      url: al.url || ''
    })) : []);

    const mapTrk = (arr) => (Array.isArray(arr) ? arr.map(tr => ({
      rank: tr['@attr']?.rank || '1',
      name: tr.name,
      artist: typeof tr.artist === 'object' ? (tr.artist.name || tr.artist['#text'] || '') : String(tr.artist || ''),
      duration: parseInt(tr.duration) || 0,
      playcount: parseInt(tr.playcount) || 0,
      image: (Array.isArray(tr.image) ? (tr.image.find(i => i.size === 'extralarge' || i.size === 'large')?.['#text'] || '') : '') || '',
      url: tr.url || ''
    })) : []);

    if (artRes && artRes.ok) {
      const d = await artRes.json();
      stats.topArtistsByPeriod[periodo] = mapArt(d?.topartists?.artist);
    }
    if (albRes && albRes.ok) {
      const d = await albRes.json();
      stats.topAlbumsByPeriod[periodo] = mapAlb(d?.topalbums?.album);
    }
    if (trkRes && trkRes.ok) {
      const d = await trkRes.json();
      stats.topTracksByPeriod[periodo] = mapTrk(d?.toptracks?.track);
    }

    stats.selectedPeriod = periodo;
    stats.topArtists = stats.topArtistsByPeriod[periodo] || [];
    stats.topAlbums = stats.topAlbumsByPeriod[periodo] || [];
    stats.topTracks = stats.topTracksByPeriod[periodo] || [];

    localStorage.setItem('mediary_lastfm_stats', JSON.stringify(stats));
  } catch(e) {
    console.error('Error cargando período Last.fm:', e);
  }
}

