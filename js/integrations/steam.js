/* Mediary — js/integrations/steam.js */
// --- INTEGRACIÓN STEAM (PERFIL, HORAS JUGADAS & LOGROS) ---
function abrirModalConectarSteam() {
  const modal = document.getElementById('modal-conectar-steam');
  if (!modal) return;
  const input = document.getElementById('steam-input-profile');
  if (input) {
    const savedId = localStorage.getItem('mediary_steam_id') || '';
    input.value = savedId;
  }
  modal.style.display = 'flex';
}

function cerrarModalConectarSteam() {
  const modal = document.getElementById('modal-conectar-steam');
  if (modal) modal.style.display = 'none';
}

function iniciarFlujoSteamOpenID() {
  try {
    const returnTo = window.location.origin + window.location.pathname;
    const realm = window.location.origin;
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnTo,
      'openid.realm': realm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    });
    window.location.href = `https://steamcommunity.com/openid/login?${params.toString()}`;
  } catch (err) {
    console.error('Error al iniciar Steam OpenID:', err);
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'Could not redirect to Steam' : 'No se pudo redirigir a Steam');
  }
}

async function procesarRetornoSteamAuth() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const claimedId = urlParams.get('openid.claimed_id') || urlParams.get('openid.identity');
    if (!claimedId) return;

    // Formato de claimedId: https://steamcommunity.com/openid/id/76561198...
    const match = claimedId.match(/\/openid\/id\/(\d+)/);
    const steamId = match ? match[1] : null;

    if (steamId) {
      limpiarSteamParamsUrl();
      mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? ' Steam authenticated. Syncing your profile...' : ' Steam conectado. Sincronizando tu perfil y juegos...');
      await sincronizarCuentaSteam(steamId, true);
    }
  } catch (err) {
    console.error('Error procesando retorno de Steam:', err);
  }
}

function limpiarSteamParamsUrl() {
  try {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  } catch (e) {}
}

async function fetchSteamProxyContent_(targetUrl) {
  if (!targetUrl) return null;
  const sep = targetUrl.includes('?') ? '&' : '?';
  const urlConBuster = `${targetUrl}${sep}_cb=${Date.now()}`;
  const enc = encodeURIComponent(urlConBuster);
  const nowTs = Date.now();
  const proxies = [
    { url: `https://api.allorigins.win/raw?url=${enc}`, type: 'raw' },
    { url: `https://api.allorigins.win/get?url=${enc}&_ts=${nowTs}`, type: 'allorigins' },
    { url: `https://api.codetabs.com/v1/proxy?quest=${enc}&_ts=${nowTs}`, type: 'raw' },
    { url: `https://thingproxy.freeboard.io/fetch/${urlConBuster}`, type: 'raw' }
  ];

  for (const p of proxies) {
    try {
      const res = await fetch(p.url, { signal: AbortSignal.timeout(3800), cache: 'no-store' });
      if (!res.ok) continue;
      if (p.type === 'allorigins') {
        const json = await res.json().catch(() => null);
        if (json && json.contents && typeof json.contents === 'string' && json.contents.length > 5) {
          return json.contents;
        }
      } else {
        const text = await res.text().catch(() => null);
        if (text && typeof text === 'string' && text.length > 5) {
          if (text.includes('Too Many Requests') || text.includes('Error 502') || text.includes('Cloudflare') || text.includes('API key is required')) continue;
          return text;
        }
      }
    } catch(e) {}
  }
  return null;
}

async function obtenerSteamMiniprofile_(steamId64) {
  if (!steamId64 || !/^\d{17}$/.test(steamId64)) return null;
  try {
    const accId = (BigInt(steamId64) - 76561197960265728n).toString();
    const url = `https://steamcommunity.com/miniprofile/${accId}/json`;
    const raw = await fetchSteamProxyContent_(url);
    if (!raw) return null;
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch(e) {
      const m = raw.match(/"persona_name"\s*:\s*"([^"]+)"/);
      const mAv = raw.match(/"avatar_url"\s*:\s*"([^"]+)"/);
      if (m) {
        data = { persona_name: m[1], avatar_url: mAv ? mAv[1] : null };
      }
    }
    if (data && data.persona_name) {
      let inGame = null;
      const ig = data.in_game;
      if (ig && typeof ig === 'object' && ig.name) {
        const appid = ig.appid ? String(ig.appid) : '';
        inGame = {
          isPlaying: true,
          titleName: String(ig.name).trim(),
          appid,
          image: appid
            ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`
            : (ig.logo || ig.icon || '')
        };
      } else if (typeof data.in_game_name === 'string' && data.in_game_name.trim()) {
        inGame = {
          isPlaying: true,
          titleName: data.in_game_name.trim(),
          appid: data.in_game_appid ? String(data.in_game_appid) : '',
          image: data.in_game_appid
            ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${data.in_game_appid}/header.jpg`
            : ''
        };
      } else {
        inGame = { isPlaying: false };
      }
      return {
        personaName: data.persona_name,
        avatar: data.avatar_url,
        inGame: inGame,
        hasPresenceInfo: true
      };
    }
  } catch (e) {
    console.warn('Error obteniendo miniprofile de Steam:', e);
  }
  return null;
}

function extraerSteamNowPlayingDesdeXml_(profileXmlRaw) {
  if (!profileXmlRaw || typeof profileXmlRaw !== 'string') return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(profileXmlRaw, 'text/xml');
    if (doc.querySelector('parsererror')) return null;

    const inGameNode = doc.querySelector('inGameInfo');
    if (inGameNode) {
      const gameName = (inGameNode.querySelector('gameName')?.textContent || '').trim();
      const gameLink = (inGameNode.querySelector('gameLink')?.textContent || '').trim();
      const mApp = gameLink.match(/\/app\/(\d+)/);
      const appid = mApp ? mApp[1] : '';
      const logo = (inGameNode.querySelector('gameLogo')?.textContent || inGameNode.querySelector('gameIcon')?.textContent || '').trim();
      if (gameName) {
        return {
          isPlaying: true,
          titleName: gameName,
          appid,
          image: appid
            ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`
            : logo
        };
      }
    }

    // Si es un XML de Steam válido pero no tiene inGameInfo activo, está en reposo (no jugando)
    if (doc.querySelector('profile') || doc.querySelector('steamID') || doc.querySelector('steamID64') || doc.querySelector('onlineState')) {
      return { isPlaying: false };
    }
  } catch(e) {}
  return null;
}

function extraerSteamNowPlayingDesdeHtml_(profileHtmlRaw, gamesCatalog = []) {
  if (!profileHtmlRaw || typeof profileHtmlRaw !== 'string') return null;
  try {
    let gameName = '';
    let appid = '';

    try {
      const parser = new DOMParser();
      const docH = parser.parseFromString(profileHtmlRaw, 'text/html');
      const nameEl = docH.querySelector('.profile_in_game_name');
      if (nameEl && nameEl.textContent) {
        gameName = nameEl.textContent.trim();
      }
      if (gameName) {
        const linkEl = docH.querySelector('.profile_in_game a[href*="/app/"], .profile_in_game_header a[href*="/app/"]');
        const href = linkEl ? (linkEl.getAttribute('href') || '') : '';
        const mHref = href.match(/\/app\/(\d+)/);
        if (mHref) appid = mHref[1];
      } else {
        const statusEl = docH.querySelector('.profile_in_game');
        if (statusEl && (statusEl.classList.contains('offline') || statusEl.classList.contains('online'))) {
          return { isPlaying: false };
        }
      }
    } catch(e) {}

    if (!gameName) {
      const mName = profileHtmlRaw.match(/class="profile_in_game_name"[^>]*>([^<]+)<\/div>/i);
      if (mName && mName[1]) gameName = mName[1].trim();
    }

    if (gameName) {
      if (!appid && Array.isArray(gamesCatalog) && gamesCatalog.length) {
        const lower = gameName.toLowerCase();
        const found = gamesCatalog.find(g => g && g.name && g.name.toLowerCase() === lower && g.appid);
        if (found) appid = String(found.appid);
      }
      return {
        isPlaying: true,
        titleName: gameName,
        appid,
        image: appid ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg` : ''
      };
    }

    if (/class="profile_in_game\s+(?:offline|online)"/i.test(profileHtmlRaw) || profileHtmlRaw.includes('actual_persona_name') || profileHtmlRaw.includes('profile_header') || profileHtmlRaw.includes('responsive_page_template_content')) {
      return { isPlaying: false };
    }
  } catch(e) {}
  return null;
}

async function resolverSteamId64_(cleanId, apiKey) {
  if (!cleanId) return null;
  if (/^\d{17}$/.test(cleanId)) return cleanId;

  // 1. Verificar si está en caché
  try {
    const cached = localStorage.getItem('mediary_steam_id64');
    if (cached && /^\d{17}$/.test(cached)) return cached;
  } catch(e) {}

  // 2. Si hay API Key, consultar endpoint oficial ResolveVanityURL
  if (apiKey) {
    try {
      const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${encodeURIComponent(apiKey)}&vanityurl=${encodeURIComponent(cleanId)}`;
      const raw = await fetchSteamProxyContent_(url);
      if (raw) {
        const json = JSON.parse(raw);
        if (json?.response?.success === 1 && json?.response?.steamid) {
          localStorage.setItem('mediary_steam_id64', json.response.steamid);
          return json.response.steamid;
        }
      }
    } catch(e) {}
  }

  // 3. Fallback: Parsear XML de perfil
  try {
    const xmlUrl = `https://steamcommunity.com/id/${encodeURIComponent(cleanId)}/?xml=1`;
    const xmlRaw = await fetchSteamProxyContent_(xmlUrl);
    if (xmlRaw) {
      const m = xmlRaw.match(/<steamID64>(\d{17})<\/steamID64>/i);
      if (m && m[1]) {
        localStorage.setItem('mediary_steam_id64', m[1]);
        return m[1];
      }
    }
  } catch(e) {}

  // 4. Fallback: Parsear HTML de perfil
  try {
    const htmlUrl = `https://steamcommunity.com/id/${encodeURIComponent(cleanId)}/`;
    const htmlRaw = await fetchSteamProxyContent_(htmlUrl);
    if (htmlRaw) {
      const m = htmlRaw.match(/"steamid"\s*:\s*"(\d{17})"/i) ||
                htmlRaw.match(/g_rgProfileData\s*=\s*\{[^}]*"steamid"\s*:\s*"(\d{17})"/i) ||
                htmlRaw.match(/data-miniprofile="(\d+)"/);
      if (m && m[1]) {
        let id64 = m[1];
        if (id64.length !== 17) {
          try {
            id64 = (76561197960265728n + BigInt(id64)).toString();
          } catch(e) {}
        }
        if (/^\d{17}$/.test(id64)) {
          localStorage.setItem('mediary_steam_id64', id64);
          return id64;
        }
      }
    }
  } catch(e) {}

  return null;
}

async function obtenerDatosSteamViaWebApi_(apiKey, steamId64) {
  if (!apiKey || !steamId64) return null;
  try {
    const ownedUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${encodeURIComponent(apiKey)}&steamid=${steamId64}&include_appinfo=1&include_played_free_games=1&format=json`;
    const recentUrl = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${encodeURIComponent(apiKey)}&steamid=${steamId64}&format=json`;
    const playerUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${encodeURIComponent(apiKey)}&steamids=${steamId64}`;

    const [ownedRaw, recentRaw, playerRaw] = await Promise.all([
      fetchSteamProxyContent_(ownedUrl),
      fetchSteamProxyContent_(recentUrl),
      fetchSteamProxyContent_(playerUrl)
    ]);

    let ownedData = null, recentData = null, playerData = null;
    try { if (ownedRaw) ownedData = JSON.parse(ownedRaw); } catch(e) {}
    try { if (recentRaw) recentData = JSON.parse(recentRaw); } catch(e) {}
    try { if (playerRaw) playerData = JSON.parse(playerRaw); } catch(e) {}

    let personaName = null;
    let avatar = null;
    let privacyState = 'public';
    let isPrivate = false;
    let nowPlaying = null;

    if (playerData?.response?.players?.[0]) {
      const p = playerData.response.players[0];
      personaName = p.personaname || null;
      avatar = p.avatarfull || p.avatarmedium || null;
      if (p.communityvisibilitystate === 1) {
        privacyState = 'private';
        isPrivate = true;
      }
      if (p.gameextrainfo && String(p.gameextrainfo).trim()) {
        const appid = p.gameid ? String(p.gameid) : '';
        nowPlaying = {
          isPlaying: true,
          titleName: String(p.gameextrainfo).trim(),
          appid,
          image: appid ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg` : ''
        };
      } else {
        nowPlaying = { isPlaying: false };
      }
    }

    const gamesList = ownedData?.response?.games || [];
    const recentList = recentData?.response?.games || [];
    const recentMap = new Map();
    let totalRecentMinutes = 0;
    recentList.forEach(rg => {
      const recM = rg.playtime_2weeks || 0;
      recentMap.set(rg.appid, recM);
      totalRecentMinutes += recM;
    });

    let totalLifetimeMinutes = 0;
    const allGames = [];

    gamesList.forEach(g => {
      const foreverMin = g.playtime_forever || 0;
      const recMin = recentMap.get(g.appid) || g.playtime_2weeks || 0;
      totalLifetimeMinutes += foreverMin;

      const hours = Number((foreverMin / 60).toFixed(1));
      const recHours = Number((recMin / 60).toFixed(1));
      if (hours > 0 || recHours > 0) {
        allGames.push({
          name: g.name || `App ${g.appid}`,
          hours: hours,
          recentHours: recHours,
          appid: String(g.appid),
          header: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${g.appid}/header.jpg`
        });
      }
    });

    allGames.sort((a, b) => b.hours - a.hours);
    const topGames = allGames.slice(0, 10);

    return {
      personaName,
      avatar,
      steamID64: steamId64,
      isPrivate: isPrivate,
      privacyState: privacyState,
      gamesCount: ownedData?.response?.game_count || gamesList.length,
      totalHours: Number((totalLifetimeMinutes / 60).toFixed(1)),
      recentHours: Number((totalRecentMinutes / 60).toFixed(1)),
      topGames,
      nowPlaying
    };
  } catch(e) {
    console.warn('Error en obtenerDatosSteamViaWebApi_:', e);
    return null;
  }
}

async function obtenerDatosSteamPublico_(steamIdOrCustom, knownSteamId64 = null) {
  if (!steamIdOrCustom) return null;
  const isId64 = /^\d{17}$/.test(steamIdOrCustom);
  const cleanId = steamIdOrCustom;

  const profileHtmlUrl = isId64
    ? `https://steamcommunity.com/profiles/${cleanId}/`
    : `https://steamcommunity.com/id/${cleanId}/`;

  const profileXmlUrl = isId64
    ? `https://steamcommunity.com/profiles/${cleanId}/?xml=1`
    : `https://steamcommunity.com/id/${cleanId}/?xml=1`;

  const [profileHtmlRaw, profileXmlRaw, miniData] = await Promise.all([
    fetchSteamProxyContent_(profileHtmlUrl),
    fetchSteamProxyContent_(profileXmlUrl),
    knownSteamId64 ? obtenerSteamMiniprofile_(knownSteamId64) : (isId64 ? obtenerSteamMiniprofile_(cleanId) : Promise.resolve(null))
  ]);

  let personaName = miniData?.personaName || null;
  let avatar = miniData?.avatar || null;
  let steamID64 = knownSteamId64 || (isId64 ? cleanId : null);
  let customURL = !isId64 ? cleanId : null;
  let isPrivate = false;
  let privacyState = 'public';
  let gamesCount = 0;
  const allGames = [];
  let totalHours = 0;
  let recentHours = 0;

  // 1. Analizar Privacidad Real (solo marcar si explícitamente es privado)
  if (profileHtmlRaw) {
    const esHtmlPrivado = profileHtmlRaw.includes('profile_private_info') ||
      /This profile is private/i.test(profileHtmlRaw) ||
      /Este perfil es privado/i.test(profileHtmlRaw);
    if (esHtmlPrivado) {
      isPrivate = true;
      privacyState = 'private';
    }
  }

  if (profileXmlRaw) {
    if (/<privacyState>\s*(?:private|friendsonly)\s*<\/privacyState>/i.test(profileXmlRaw) ||
        /<error>.*private.*<\/error>/i.test(profileXmlRaw)) {
      isPrivate = true;
      privacyState = 'private';
    }
  }

  // 2. Extraer SteamID64 si no lo teníamos
  if (!steamID64 && profileHtmlRaw) {
    const mId64 = profileHtmlRaw.match(/"steamid"\s*:\s*"(\d{17})"/i) ||
                  profileHtmlRaw.match(/g_rgProfileData\s*=\s*\{[^}]*"steamid"\s*:\s*"(\d{17})"/i) ||
                  profileHtmlRaw.match(/data-miniprofile="(\d+)"/);
    if (mId64 && mId64[1]) {
      if (mId64[1].length === 17) {
        steamID64 = mId64[1];
      } else {
        try {
          steamID64 = (76561197960265728n + BigInt(mId64[1])).toString();
        } catch(e) {}
      }
    }
  }
  if (!steamID64 && profileXmlRaw) {
    const mXmlId64 = profileXmlRaw.match(/<steamID64>(\d{17})<\/steamID64>/i);
    if (mXmlId64 && mXmlId64[1]) steamID64 = mXmlId64[1];
  }

  // 3. Extraer personaName y avatar si faltan
  if (!personaName && profileHtmlRaw) {
    const mName = profileHtmlRaw.match(/<span\s+class="actual_persona_name"[^>]*>([^<]+)<\/span>/i) ||
                  profileHtmlRaw.match(/<title>Steam Community\s*::\s*([^<]+)<\/title>/i);
    if (mName && mName[1]) personaName = mName[1].trim();
  }
  if (!avatar && profileHtmlRaw) {
    const mAv = profileHtmlRaw.match(/<div\s+class="playerAvatarAutoSizeInner"[^>]*>[\s\S]*?<img loading="lazy" decoding="async"\s+src="([^"]+)"/i) ||
                profileHtmlRaw.match(/<div\s+class="avatarHolder"[^>]*>[\s\S]*?<img loading="lazy" decoding="async"\s+src="([^"]+)"/i) ||
                profileHtmlRaw.match(/"avatar_url"\s*:\s*"([^"]+)"/i);
    if (mAv && mAv[1]) avatar = mAv[1].replace(/_medium\./, '_full.').trim();
  }

  const parser = new DOMParser();

  // 4. Analizar XML
  if (profileXmlRaw) {
    try {
      const docP = parser.parseFromString(profileXmlRaw, 'text/xml');
      if (!docP.querySelector('parsererror')) {
        const idXml = docP.querySelector('steamID')?.textContent?.trim();
        if (idXml && !personaName) personaName = idXml;
        const avXml = docP.querySelector('avatarFull')?.textContent?.trim() || docP.querySelector('avatarMedium')?.textContent?.trim();
        if (avXml && !avatar) avatar = avXml;
        const custXml = docP.querySelector('customURL')?.textContent?.trim();
        if (custXml && !customURL) customURL = custXml;

        const mostPlayed = docP.querySelectorAll('mostPlayedGame');
        mostPlayed.forEach(g => {
          const name = g.querySelector('gameName')?.textContent?.trim();
          const link = g.querySelector('gameLink')?.textContent?.trim() || '';
          const m = link.match(/\/app\/(\d+)/);
          const appid = m ? m[1] : '';
          const rec = parseFloat(g.querySelector('hoursPlayed')?.textContent || 0) || 0;
          const h = parseFloat((g.querySelector('hoursOnRecord')?.textContent || '0').replace(/,/g, '')) || 0;
          const logo = g.querySelector('gameLogo')?.textContent?.trim() || '';

          if (name) {
            const finalH = h > 0 ? h : rec;
            allGames.push({
              name,
              hours: Number(finalH.toFixed(1)),
              recentHours: Number(rec.toFixed(1)),
              appid,
              header: appid ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg` : logo
            });
          }
        });
      }
    } catch(e) {}
  }

  // 5. Analizar HTML para total de títulos en biblioteca y juegos recientes
  if (profileHtmlRaw) {
    const mCount = profileHtmlRaw.match(/class="profile_count_link_total"[^>]*>\s*([0-9.,]+)\s*</i) ||
                   profileHtmlRaw.match(/href="[^"]*\/games[^"]*"[^>]*>[\s\S]*?<span class="profile_count_link_total"[^>]*>\s*([0-9.,]+)\s*<\/span>/i) ||
                   profileHtmlRaw.match(/([0-9.,]+)\s*(?:juegos|games)\b/i);
    if (mCount && mCount[1]) {
      const parsed = parseInt(mCount[1].replace(/[,.]/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) gamesCount = parsed;
    }

    try {
      const docH = parser.parseFromString(profileHtmlRaw, 'text/html');
      const gameRows = docH.querySelectorAll('.recent_games .recent_game, .recentgame_quicklinks, .gameListRow');
      if (gameRows.length) {
        gameRows.forEach(row => {
          const nameEl = row.querySelector('.game_name a, .game_name');
          const name = nameEl?.textContent?.trim() || '';
          const link = row.querySelector('a[href*="/app/"]')?.getAttribute('href') || '';
          const mApp = link.match(/\/app\/(\d+)/);
          const appid = mApp ? mApp[1] : '';

          const textAll = row.textContent || '';
          let h = 0;
          let rec = 0;

          const mTot = textAll.match(/([\d.,]+)\s*(?:hrs?|hours?|horas?|h)\s*(?:on record|registradas|totales)/i) ||
                       textAll.match(/(?:on record|registradas|totales)[\s:]*([\d.,]+)/i);
          if (mTot) {
            h = parseFloat(mTot[1].replace(',', '.')) || 0;
          }

          const mRec = textAll.match(/([\d.,]+)\s*(?:hrs?|hours?|horas?|h)\s*(?:past 2 weeks|en las últimas 2 semanas|ultimas 2 semanas|últimas 2 semanas)/i) ||
                       textAll.match(/(?:past 2 weeks|últimas 2 semanas|ultimas 2 semanas)[\s:]*([\d.,]+)/i);
          if (mRec) {
            rec = parseFloat(mRec[1].replace(',', '.')) || 0;
          }

          if (name) {
            const finalH = h > 0 ? h : rec;
            const existing = allGames.find(item => item.name.toLowerCase() === name.toLowerCase() || (appid && item.appid === appid));
            if (!existing) {
              allGames.push({
                name,
                hours: Number(finalH.toFixed(1)),
                recentHours: Number(rec.toFixed(1)),
                appid,
                header: appid ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg` : ''
              });
            } else {
              if (finalH > existing.hours) existing.hours = Number(finalH.toFixed(1));
              if (rec > existing.recentHours) existing.recentHours = Number(rec.toFixed(1));
            }
          }
        });
      }
    } catch(e) {}
  }

  // 6. Si aún no teníamos avatar, nombre o estado en vivo y tenemos steamID64, consultar miniprofile
  let miniFinal = miniData || null;
  if ((!personaName || !avatar || !miniFinal) && steamID64) {
    const mini2 = await obtenerSteamMiniprofile_(steamID64);
    if (mini2) {
      miniFinal = mini2;
      if (mini2.personaName && !personaName) personaName = mini2.personaName;
      if (mini2.avatar && !avatar) avatar = mini2.avatar;
    }
  }

  // 6b. Extraer actividad en vivo actual de Steam (Miniprofile en tiempo real > XML > HTML)
  let nowPlaying = null;
  const npMini = miniFinal?.inGame ? miniFinal.inGame : (miniFinal?.hasPresenceInfo ? { isPlaying: false } : null);
  const npXml = extraerSteamNowPlayingDesdeXml_(profileXmlRaw);
  const npHtml = extraerSteamNowPlayingDesdeHtml_(profileHtmlRaw, allGames);

  if (npMini && typeof npMini.isPlaying === 'boolean') {
    nowPlaying = npMini;
  } else if (npXml && npXml.isPlaying) {
    nowPlaying = npXml;
  } else if (npHtml && npHtml.isPlaying) {
    nowPlaying = npHtml;
  } else if (npXml || npHtml || npMini) {
    nowPlaying = { isPlaying: false };
  }

  // 7. Calcular horas totales y recientes
  allGames.forEach(g => {
    totalHours += (g.hours || 0);
    recentHours += (g.recentHours || 0);
  });

  allGames.sort((a, b) => (b.hours || 0) - (a.hours || 0));
  const topGames = allGames.slice(0, 10);

  // ¡NUNCA forzar isPrivate = true solo porque allGames esté vacío!
  if (privacyState === 'private' || privacyState === 'friendsonly') {
    isPrivate = true;
  }

  return {
    personaName,
    avatar,
    steamID64,
    customURL,
    isPrivate,
    privacyState,
    gamesCount: gamesCount || allGames.length,
    totalHours: Number(totalHours.toFixed(1)),
    recentHours: Number(recentHours.toFixed(1)),
    topGames,
    nowPlaying
  };
}

let _steamUltimaConsultaLive = 0;
let _steamLiveFetchEnCurso = false;
window.steamNowPlayingInterval = null;

function guardarEstadoEnVivoSteam_(rawNowPlaying, opciones = {}) {
  if (!rawNowPlaying || typeof rawNowPlaying !== 'object') return false;
  let prev = null;
  try {
    const pRaw = localStorage.getItem('mediary_steam_now_playing');
    if (pRaw) prev = JSON.parse(pRaw);
  } catch (e) {}

  const titleName = String(rawNowPlaying.titleName || rawNowPlaying.name || '').trim();
  const isPlaying = !!(rawNowPlaying.isPlaying && titleName);

  if (isPlaying) {
    let appid = rawNowPlaying.appid ? String(rawNowPlaying.appid).trim() : '';
    let image = rawNowPlaying.image || '';
    if (!image && appid) {
      image = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;
    }
    if (!image) {
      try {
        const stRaw = localStorage.getItem('mediary_steam_stats');
        if (stRaw) {
          const st = JSON.parse(stRaw);
          const match = (st?.topGames || []).find(g => g && g.name && g.name.toLowerCase() === titleName.toLowerCase());
          if (match) {
            if (!appid && match.appid) appid = String(match.appid);
            image = match.header || (appid ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg` : '');
          }
        }
      } catch (e) {}
    }

    const mismoJuegoActivo = !!(prev && prev.isPlaying && (prev.titleName || '').trim().toLowerCase() === titleName.toLowerCase());
    const updatedAt = (mismoJuegoActivo && Number(prev.updatedAt) > 0)
      ? Number(prev.updatedAt)
      : Date.now();

    const nuevoObj = {
      isPlaying: true,
      titleName,
      appid,
      platform: 'Steam',
      source: 'steam',
      image,
      updatedAt
    };

    const cambio = !mismoJuegoActivo || prev.image !== nuevoObj.image || prev.appid !== nuevoObj.appid;
    localStorage.setItem('mediary_steam_now_playing', JSON.stringify(nuevoObj));
    if (!mismoJuegoActivo) {
      localStorage.setItem('mediary_last_active_game_platform', 'steam');
    }
    if (cambio && !opciones.silenciarNube && typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(true);
    }
    if (cambio && typeof iniciarPollingSteamLive === 'function') {
      iniciarPollingSteamLive();
    }
    return cambio;
  } else {
    const estabaJugando = !!(prev && prev.isPlaying);
    const nuevoObj = {
      isPlaying: false,
      source: 'steam',
      updatedAt: estabaJugando ? Date.now() : (Number(prev?.updatedAt) || Date.now())
    };
    localStorage.setItem('mediary_steam_now_playing', JSON.stringify(nuevoObj));
    if (estabaJugando && !opciones.silenciarNube && typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(true);
    }
    // IMPORTANTE: Al dejar de jugar, actualizar de inmediato la tarjeta de juego para volver a estado idle
    if (estabaJugando && typeof renderizarPlayStationNowPlayingInicio === 'function') {
      renderizarPlayStationNowPlayingInicio(false);
    }
    if (estabaJugando && typeof iniciarPollingSteamLive === 'function') {
      iniciarPollingSteamLive();
    }
    return estabaJugando;
  }
}

async function consultarActividadEnVivoSteam_(forzar = false) {
  if (localStorage.getItem('mediary_steam_connected') !== 'true') return null;
  const steamId = (localStorage.getItem('mediary_steam_id') || '').trim();
  if (!steamId || steamId === '76561198000000000') return null;

  let prevSt = null;
  try {
    const pRaw = localStorage.getItem('mediary_steam_now_playing');
    if (pRaw) prevSt = JSON.parse(pRaw);
  } catch (e) {}
  const jugandoActualmente = !!(prevSt && prevSt.isPlaying);

  const ahora = Date.now();
  // Cuando se está jugando activamente, permitir consultar cada 12s para detectar de inmediato cuando se cierra el juego
  const intervaloMinimo = jugandoActualmente ? 12000 : 35000;
  if (!forzar && (ahora - _steamUltimaConsultaLive < intervaloMinimo)) return null;
  if (_steamLiveFetchEnCurso) return null;

  _steamLiveFetchEnCurso = true;
  _steamUltimaConsultaLive = ahora;

  try {
    const apiKey = (localStorage.getItem('mediary_steam_api_key') || '').trim();
    const isId64 = /^\d{17}$/.test(steamId);
    let steamId64 = isId64 ? steamId : (localStorage.getItem('mediary_steam_id64') || '').trim();
    if (!/^\d{17}$/.test(steamId64)) {
      steamId64 = await resolverSteamId64_(steamId, apiKey);
    }

    let liveResult = null;

    // 1. Si hay API key + steamId64, GetPlayerSummaries es la fuente más rápida y exacta
    if (apiKey && steamId64) {
      try {
        const playerUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${encodeURIComponent(apiKey)}&steamids=${steamId64}`;
        const raw = await fetchSteamProxyContent_(playerUrl);
        if (raw) {
          const json = JSON.parse(raw);
          const p = json?.response?.players?.[0];
          if (p) {
            if (p.gameextrainfo && String(p.gameextrainfo).trim()) {
              const appid = p.gameid ? String(p.gameid) : '';
              liveResult = {
                isPlaying: true,
                titleName: String(p.gameextrainfo).trim(),
                appid,
                image: appid ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg` : ''
              };
            } else {
              liveResult = { isPlaying: false };
            }
          }
        }
      } catch (e) {}
    }

    // 2. Fallback sin API key: Miniprofile JSON en tiempo real
    if (liveResult === null) {
      if (steamId64) {
        const mini = await obtenerSteamMiniprofile_(steamId64);
        if (mini?.inGame?.isPlaying) {
          liveResult = mini.inGame;
        } else if (mini?.hasPresenceInfo) {
          // Si el miniprofile respondió correctamente y no hay juego activo, SABEMOS que no está jugando
          liveResult = { isPlaying: false };
        }
      }

      // 3. Fallback de XML ÚNICAMENTE si el miniprofile falló completamente (liveResult sigue siendo null).
      // Si el miniprofile ya constató que no está jugando, NUNCA sobrescribir con XML potencialmente cacheado
      if (liveResult === null) {
        const xmlUrl = isId64
          ? `https://steamcommunity.com/profiles/${steamId}/?xml=1`
          : `https://steamcommunity.com/id/${steamId}/?xml=1`;
        const xmlRaw = await fetchSteamProxyContent_(xmlUrl);
        const npXml = extraerSteamNowPlayingDesdeXml_(xmlRaw);
        if (npXml) {
          liveResult = npXml;
        }
      }
    }

    if (liveResult) {
      const cambio = guardarEstadoEnVivoSteam_(liveResult, { manual: false });
      if ((cambio || forzar) && typeof renderizarPlayStationNowPlayingInicio === 'function') {
        renderizarPlayStationNowPlayingInicio(false);
      }
    } else {
      // Si fallaron las consultas remotas y antes estaba jugando, verificar si la sesión ya expiró
      if (jugandoActualmente && !prevSt.manual) {
        const upAt = Number(prevSt.updatedAt) || 0;
        if (Date.now() - upAt > 15 * 60 * 1000) {
          guardarEstadoEnVivoSteam_({ isPlaying: false }, { manual: false });
          if (typeof renderizarPlayStationNowPlayingInicio === 'function') {
            renderizarPlayStationNowPlayingInicio(false);
          }
        }
      }
    }
    return liveResult;
  } catch (e) {
    console.warn('Error consultando actividad en vivo de Steam:', e);
    return null;
  } finally {
    _steamLiveFetchEnCurso = false;
  }
}

let _steamIntervalCadencia = 0;
function iniciarPollingSteamLive() {
  if (localStorage.getItem('mediary_steam_connected') !== 'true') return;
  const steamId = (localStorage.getItem('mediary_steam_id') || '').trim();
  if (!steamId || steamId === '76561198000000000') return;

  let prev = null;
  try {
    const raw = localStorage.getItem('mediary_steam_now_playing');
    if (raw) prev = JSON.parse(raw);
  } catch(e) {}
  const jugando = !!(prev && prev.isPlaying);
  // 15 segundos si está jugando para detectar de inmediato cuando cierra el juego; 35s si está en reposo
  const nuevoIntervaloMs = jugando ? 15000 : 35000;

  if (window.steamNowPlayingInterval) {
    if (_steamIntervalCadencia === nuevoIntervaloMs) return;
    clearInterval(window.steamNowPlayingInterval);
    window.steamNowPlayingInterval = null;
  }

  _steamIntervalCadencia = nuevoIntervaloMs;
  window.steamNowPlayingInterval = setInterval(() => {
    if (!document.hidden && typeof estado !== 'undefined' && estado.categoria === 'inicio') {
      consultarActividadEnVivoSteam_(false);
    }
  }, nuevoIntervaloMs);
}

function detenerPollingSteamLive() {
  if (window.steamNowPlayingInterval) {
    clearInterval(window.steamNowPlayingInterval);
    window.steamNowPlayingInterval = null;
    _steamIntervalCadencia = 0;
  }
}

async function forzarActualizacionJuegosLive(btnEl) {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  let originalBtnText = '';
  if (btnEl && btnEl.tagName === 'BUTTON') {
    originalBtnText = btnEl.textContent;
    btnEl.textContent = l === 'en' ? 'Syncing...' : 'Sincronizando...';
    btnEl.disabled = true;
  }
  const allSyncBtns = document.querySelectorAll('.btn-psn-sync-prominent, .btn-psn-sync-quick, .btn-psn-sync-compact');
  allSyncBtns.forEach(b => {
    b.classList.add('is-syncing');
    b.style.pointerEvents = 'none';
  });
  const labelSpans = document.querySelectorAll('.btn-psn-sync-prominent .btn-sync-text');
  labelSpans.forEach(s => { s.textContent = l === 'en' ? 'Syncing...' : 'Sincronizando...'; });

  const isSteamConn = localStorage.getItem('mediary_steam_connected') === 'true';
  const tasks = [];
  if (isSteamConn && typeof consultarActividadEnVivoSteam_ === 'function') {
    _steamUltimaConsultaLive = 0;
    tasks.push(consultarActividadEnVivoSteam_(true));
  }
  if (tasks.length > 0) {
    try { await Promise.allSettled(tasks); } catch (_) {}
  }
  if (typeof renderizarPlayStationNowPlayingInicio === 'function') {
    renderizarPlayStationNowPlayingInicio(false);
  }

  allSyncBtns.forEach(b => {
    b.classList.remove('is-syncing');
    b.style.pointerEvents = 'auto';
  });
  labelSpans.forEach(s => { s.textContent = l === 'en' ? 'Sync status' : 'Sincronizar estado'; });
  if (btnEl && btnEl.tagName === 'BUTTON' && originalBtnText) {
    btnEl.textContent = originalBtnText;
    btnEl.disabled = false;
  }

  // Notificación de estado con diagnóstico útil
  const estadoActual = typeof obtenerEstadoJuegoActivoInicio === 'function' ? obtenerEstadoJuegoActivoInicio() : null;
  if (estadoActual && estadoActual.status === 'playing') {
    const d = estadoActual.data || {};
    const tit = d.titleName || d.name || 'Juego';
    mostrarToastPersonalizado(`🎮 Steam: ${l === 'en' ? 'Playing' : 'Jugando a'} ${tit}`);
  } else {
    mostrarToastPersonalizado(l === 'en'
      ? '🎮 Steam synced · In rest mode'
      : '🎮 Steam sincronizado · En reposo');
  }
}
window.forzarActualizacionJuegosLive = forzarActualizacionJuegosLive;
window.forzarActualizacionSteamLive = forzarActualizacionJuegosLive;

function detenerJuegoSteam() {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
  let prevTitle = '';
  try {
    const pRaw = localStorage.getItem('mediary_steam_now_playing');
    if (pRaw) {
      const p = JSON.parse(pRaw);
      if (p && p.isPlaying && p.titleName) prevTitle = p.titleName;
    }
  } catch (e) {}

  guardarEstadoEnVivoSteam_({ isPlaying: false }, { manual: true, manualStoppedTitle: prevTitle });
  if (typeof cerrarModalSeleccionarJuegoPsn === 'function') cerrarModalSeleccionarJuegoPsn();
  if (typeof renderizarPlayStationNowPlayingInicio === 'function') renderizarPlayStationNowPlayingInicio(false);
  mostrarToastPersonalizado(l === 'en' ? '💤 Steam activity paused' : '💤 Actividad de Steam en reposo');

  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(false);
  }
}
window.detenerJuegoSteam = detenerJuegoSteam;

async function obtenerDatosSteamCompletos(steamIdOrCustom) {
  if (!steamIdOrCustom) return null;
  const isId64 = /^\d{17}$/.test(steamIdOrCustom);
  const apiKey = (localStorage.getItem('mediary_steam_api_key') || '').trim();

  let steamId64 = isId64 ? steamIdOrCustom : null;
  if (!steamId64) {
    steamId64 = await resolverSteamId64_(steamIdOrCustom, apiKey);
  }

  // 1. Si tenemos API key y steamId64, intentar Web API oficial de Steam
  if (apiKey && steamId64) {
    const webApiData = await obtenerDatosSteamViaWebApi_(apiKey, steamId64);
    if (webApiData && (webApiData.gamesCount > 0 || webApiData.topGames.length > 0 || webApiData.personaName)) {
      if (!webApiData.personaName || !webApiData.avatar || !webApiData.nowPlaying) {
        const mini = await obtenerSteamMiniprofile_(steamId64);
        if (mini) {
          if (!webApiData.personaName && mini.personaName) webApiData.personaName = mini.personaName;
          if (!webApiData.avatar && mini.avatar) webApiData.avatar = mini.avatar;
          if (!webApiData.nowPlaying && mini.inGame) webApiData.nowPlaying = mini.inGame;
        }
      }
      return webApiData;
    }
  }

  // 2. Método público vía Web Scraping (HTML + XML + Miniprofile)
  const pubData = await obtenerDatosSteamPublico_(steamIdOrCustom, steamId64);
  return pubData;
}

async function sincronizarCuentaSteam(idManual = null, notificar = false) {
  let steamId = idManual || localStorage.getItem('mediary_steam_id') || '';

  let cleanId = steamId.trim();
  if (cleanId.includes('steamcommunity.com/profiles/')) {
    const m = cleanId.match(/profiles\/(\d+)/);
    if (m) cleanId = m[1];
  } else if (cleanId.includes('steamcommunity.com/id/')) {
    const m = cleanId.match(/id\/([a-zA-Z0-9_\-]+)/);
    if (m) cleanId = m[1];
  }

  if (!cleanId) {
    if (notificar) mostrarToastPersonalizado(tLang('No hay cuenta de Steam para sincronizar', 'No Steam account to sync'));
    return false;
  }

  localStorage.setItem('mediary_steam_connected', 'true');
  localStorage.setItem('mediary_steam_id', cleanId);

  let prevUser = null;
  try {
    const uRaw = localStorage.getItem('mediary_steam_user');
    if (uRaw) prevUser = JSON.parse(uRaw);
  } catch(e) {}

  let prevStats = null;
  try {
    const sRaw = localStorage.getItem('mediary_steam_stats');
    if (sRaw) {
      const parsed = JSON.parse(sRaw);
      const esFake = parsed && parsed.totalHours === 412.5 && Array.isArray(parsed.topGames) && parsed.topGames.some(g => g.name === 'Elden Ring');
      if (!esFake) prevStats = parsed;
    }
  } catch(e) {}

  const steamData = await obtenerDatosSteamCompletos(cleanId);

  let personaName = steamData?.personaName || prevUser?.personaName || '';
  let avatar = steamData?.avatar || prevUser?.avatar || '';
  const isId64 = /^\d{17}$/.test(cleanId);

  if (!personaName || personaName.startsWith('Steam User') || personaName.startsWith('Jugador (')) {
    personaName = (!isId64 && cleanId) ? cleanId : (cleanId ? `Gamer (${cleanId.slice(-4)})` : tLang('Jugador Steam', 'Steam Player'));
  }

  if (!avatar || avatar.includes('fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb')) {
    avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(personaName)}&background=171a21&color=66c0f4&bold=true`;
  }

  let topGames = steamData?.topGames || [];
  let totalHours = steamData?.totalHours || 0;
  let recentHours = steamData?.recentHours || 0;
  let gamesCount = steamData?.gamesCount || 0;
  let isPrivate = !!steamData?.isPrivate;

  if (!topGames.length && prevStats && Array.isArray(prevStats.topGames) && prevStats.topGames.length) {
    topGames = prevStats.topGames;
    totalHours = prevStats.totalHours || totalHours;
    recentHours = prevStats.recentHours || recentHours;
    gamesCount = prevStats.gamesCount || gamesCount;
    isPrivate = false;
  }

  const user = {
    id: cleanId,
    personaName: personaName,
    avatar: avatar,
    profileUrl: isId64 ? `https://steamcommunity.com/profiles/${cleanId}` : `https://steamcommunity.com/id/${cleanId}`,
    gamesCount: gamesCount || topGames.length,
    totalHours: totalHours,
    connectedAt: prevUser?.connectedAt || new Date().toISOString()
  };

  const newStats = {
    isPrivate: isPrivate,
    totalHours: totalHours,
    recentHours: recentHours,
    gamesCount: gamesCount || topGames.length,
    lastSync: new Date().toISOString(),
    topGames: topGames
  };

  localStorage.setItem('mediary_steam_user', JSON.stringify(user));
  localStorage.setItem('mediary_steam_stats', JSON.stringify(newStats));
  if (steamData?.steamID64 && /^\d{17}$/.test(steamData.steamID64)) {
    localStorage.setItem('mediary_steam_id64', steamData.steamID64);
  }
  if (steamData?.nowPlaying) {
    guardarEstadoEnVivoSteam_(steamData.nowPlaying, { manual: false });
    _steamUltimaConsultaLive = Date.now();
  }

  actualizarUISteam();
  if (typeof renderizarPlayStationNowPlayingInicio === 'function') {
    renderizarPlayStationNowPlayingInicio(false);
  }
  iniciarPollingSteamLive();
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(false);
  }

  const modalStats = document.getElementById('modal-estadisticas-avanzadas');
  if (modalStats && modalStats.style.display === 'flex' && typeof renderizarContenidoEstadisticasAvanzadas === 'function') {
    renderizarContenidoEstadisticasAvanzadas();
  }

  if (notificar) {
    if (isPrivate && !topGames.length) {
      mostrarToastPersonalizado(tLang(` Steam conectado: ${personaName} (Biblioteca en privado en Steam)`, ` Steam connected: ${personaName} (Steam library set to private)`));
    } else if (topGames.length > 0) {
      mostrarToastPersonalizado(tLang(` Steam sincronizado: ${personaName} (${topGames.length} títulos · ${totalHours} hrs en Steam)`, ` Steam synced: ${personaName} (${topGames.length} titles · ${totalHours} hrs on Steam)`));
    } else {
      mostrarToastPersonalizado(tLang(` Steam conectado: ${personaName} (${gamesCount || 0} juegos en biblioteca)`, ` Steam connected: ${personaName} (${gamesCount || 0} games in library)`));
    }
  }
}

function generarStatsSteamPorDefecto(personaName = 'Gamer Steam', gamesCount = 84, totalHours = 412.5) {
  return {
    totalHours: Number(totalHours) || 412.5,
    recentHours: 28.4,
    gamesCount: Number(gamesCount) || 84,
    lastSync: new Date().toISOString(),
    topGames: [
      { name: 'Elden Ring', hours: 142.0, appid: '1245620', header: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg' },
      { name: 'Cyberpunk 2077', hours: 94.5, appid: '1091500', header: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg' },
      { name: 'The Witcher 3: Wild Hunt', hours: 86.2, appid: '292030', header: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg' },
      { name: "Baldur's Gate 3", hours: 78.4, appid: '1086940', header: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg' },
      { name: 'Hades', hours: 54.0, appid: '1145360', header: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg' }
    ]
  };
}

function guardarJuegoSteamEnMediary(titulo, horas, poster) {
  try {
    if (typeof cerrarModalEstadisticasAvanzadas === 'function') {
      cerrarModalEstadisticasAvanzadas();
    }
    if (typeof cambiarCat === 'function') {
      cambiarCat('Juegos', 'Videojuegos');
    }
    const horasNum = parseFloat(horas) || 0;
    const obj = {
      tituloOriginal: titulo,
      titulo: titulo,
      creador: 'Steam',
      anio: '',
      poster: poster || '',
      sinopsis: horasNum > 0 ? `Videojuego jugado en Steam (${horasNum} hrs de juego en Steam).` : 'Videojuego de tu biblioteca de Steam.'
    };
    if (typeof seleccionarItem === 'function') {
      seleccionarItem(obj);
      setTimeout(() => {
        const inpH = document.getElementById('input-horas-jugadas');
        if (inpH && horasNum > 0) inpH.value = `${horasNum}`;
      }, 200);
    } else if (typeof ejecutarAgregadoRapido === 'function') {
      ejecutarAgregadoRapido('Juegos', 'Videojuegos');
    }
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? `Opening "${titulo}" to log...` : `Abriendo registro de "${titulo}"... `);
  } catch(e) {
    console.error('Error al guardar juego Steam en Mediary:', e);
  }
}

function registrarTopSteamByIndex(index) {
  try {
    let stats = null;
    const raw = localStorage.getItem('mediary_steam_stats');
    if (raw) stats = JSON.parse(raw);
    const game = stats && stats.topGames && stats.topGames[index];
    if (game) {
      guardarJuegoSteamEnMediary(game.name, game.hours, game.header);
    }
  } catch (e) {
    console.error('Error registrando juego Steam por índice:', e);
  }
}

async function conectarSteamPerfil(inputVal) {
  if (!inputVal) {
    const inp = document.getElementById('steam-input-profile');
    inputVal = inp ? inp.value.trim() : '';
  }

  if (!inputVal) {
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'Please enter your Steam username, ID or profile link' : 'Ingresa tu usuario, Steam ID o enlace de perfil');
    return;
  }

  mostrarToastPersonalizado(' Conectando y sincronizando con Steam...');
  cerrarModalConectarSteam();

  await sincronizarCuentaSteam(inputVal, true);
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
  if (typeof cambiarSlideLive === 'function') {
    setTimeout(() => cambiarSlideLive(1), 120);
  }
}

function conectarSteamDemo() {
  const demoUser = {
    id: '76561198000000000',
    personaName: 'Gamer Mediary',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80',
    profileUrl: 'https://steamcommunity.com/id/mediary_gamer',
    gamesCount: 84,
    totalHours: 412.5,
    connectedAt: new Date().toISOString()
  };
  localStorage.setItem('mediary_steam_connected', 'true');
  localStorage.setItem('mediary_steam_id', demoUser.id);
  localStorage.setItem('mediary_steam_user', JSON.stringify(demoUser));
  localStorage.setItem('mediary_steam_stats', JSON.stringify(generarStatsSteamPorDefecto('Gamer Mediary', 84, 412.5)));
  guardarEstadoEnVivoSteam_({
    isPlaying: true,
    titleName: 'Elden Ring',
    appid: '1245620',
    image: 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg'
  }, { manual: true });

  cerrarModalConectarSteam();
  actualizarUISteam();
  if (typeof renderizarPlayStationNowPlayingInicio === 'function') {
    renderizarPlayStationNowPlayingInicio(false);
  }
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
  if (typeof cambiarSlideLive === 'function') {
    setTimeout(() => cambiarSlideLive(1), 120);
  }
  mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? ' Demo Steam profile connected!' : ' ¡Perfil demo de Steam conectado!');
}

function desconectarSteam() {
  localStorage.removeItem('mediary_steam_connected');
  localStorage.removeItem('mediary_steam_id');
  localStorage.removeItem('mediary_steam_id64');
  localStorage.removeItem('mediary_steam_user');
  localStorage.removeItem('mediary_steam_stats');
  localStorage.removeItem('mediary_steam_now_playing');
  localStorage.removeItem('mediary_steam_api_key');
  detenerPollingSteamLive();
  actualizarUISteam();
  if (typeof renderizarPlayStationNowPlayingInicio === 'function') {
    renderizarPlayStationNowPlayingInicio(false);
  }
  const modalStats = document.getElementById('modal-estadisticas-avanzadas');
  if (modalStats && modalStats.style.display === 'flex' && typeof renderizarContenidoEstadisticasAvanzadas === 'function') {
    renderizarContenidoEstadisticasAvanzadas();
  }
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
  mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'Steam disconnected' : 'Steam desconectado');
}

function actualizarUISteam() {
  const isConn = localStorage.getItem('mediary_steam_connected') === 'true';
  const badge = document.getElementById('cfg-steam-badge');
  const disBox = document.getElementById('cfg-steam-disconnected-box');
  const connBox = document.getElementById('cfg-steam-connected-box');
  const nameEl = document.getElementById('cfg-steam-user-name');
  const avatarEl = document.getElementById('cfg-steam-user-avatar');
  const subEl = document.getElementById('cfg-steam-user-sub');

  if (isConn) {
    if (badge) badge.style.display = 'inline-flex';
    if (disBox) disBox.style.display = 'none';
    if (connBox) connBox.style.display = 'block';

    let user = null;
    try {
      const u = localStorage.getItem('mediary_steam_user');
      if (u) user = JSON.parse(u);
    } catch (e) {}

    let stats = null;
    try {
      const s = localStorage.getItem('mediary_steam_stats');
      if (s) stats = JSON.parse(s);
    } catch (e) {}

    const steamId = localStorage.getItem('mediary_steam_id') || '';
    if (nameEl) nameEl.textContent = (user && user.personaName) || steamId || tLang('Usuario Steam', 'Steam User');

    const totalH = stats?.totalHours || user?.totalHours || 0;
    const gCount = stats?.gamesCount || user?.gamesCount || 0;
    if (subEl) {
      if (gCount || totalH) {
        subEl.textContent = `${gCount ? gCount + tLang(' juegos', ' games') : tLang('Conectado', 'Connected')} · ${totalH ? totalH + tLang(' hrs en Steam', ' hrs on Steam') : 'Steam'}`;
      } else {
        subEl.textContent = steamId ? `ID: ${steamId}` : tLang('Conectado', 'Connected');
      }
    }

    if (avatarEl) {
      if (user && user.avatar) {
        avatarEl.innerHTML = `<img loading="lazy" decoding="async" src="${user.avatar}" alt="Steam Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        avatarEl.innerHTML = getHeroIcon('gamepad', '', 18);
      }
    }

    const keyBtn = document.getElementById('btn-toggle-steam-key');
    const keyInp = document.getElementById('cfg-steam-api-key-input');
    const hasKey = !!localStorage.getItem('mediary_steam_api_key');
    if (keyBtn) keyBtn.innerHTML = hasKey ? `${getHeroIcon('check', '', 12)} ${tLang('Clave API activa', 'API Key active')}` : tLang('+ Configurar clave', '+ Set key');
    if (keyInp && hasKey && !keyInp.value) keyInp.value = localStorage.getItem('mediary_steam_api_key');
  } else {
    if (badge) badge.style.display = 'none';
    if (disBox) disBox.style.display = 'block';
    if (connBox) connBox.style.display = 'none';
  }
  if (typeof renderizarAppsVinculadasConfig === 'function') renderizarAppsVinculadasConfig();
}

function toggleSteamApiKeyInput() {
  const wrap = document.getElementById('cfg-steam-apikey-wrap');
  if (wrap) {
    wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
  }
}

function solicitarSteamApiKeyPrompt() {
  const currentKey = localStorage.getItem('mediary_steam_api_key') || '';
  const msg = userPrefs?.lang === 'en'
    ? 'Enter your free Steam Web API Key (from steamcommunity.com/dev/apikey) to synchronize your entire lifetime game catalog and exact playtime hours:'
    : 'Ingresa tu clave gratuita de Steam Web API (obtenla en steamcommunity.com/dev/apikey) para sincronizar todo tu catálogo histórico y horas exactas:';
  const val = prompt(msg, currentKey);
  if (val !== null) {
    if (val.trim()) {
      localStorage.setItem('mediary_steam_api_key', val.trim());
      mostrarToastPersonalizado(tLang(' Clave de Steam guardada. Sincronizando biblioteca completa...', ' Steam key saved. Syncing full library...'));
      actualizarDatosSteam(true);
    } else {
      localStorage.removeItem('mediary_steam_api_key');
      mostrarToastPersonalizado(tLang('Clave de Steam eliminada', 'Steam key removed'));
      actualizarDatosSteam(true);
    }
  }
}

function guardarSteamApiKeyDesdeInput(inputId) {
  const el = document.getElementById(inputId);
  const val = el ? el.value.trim() : '';
  if (val) {
    localStorage.setItem('mediary_steam_api_key', val);
    mostrarToastPersonalizado(tLang(' Clave de Steam guardada. Sincronizando biblioteca completa...', ' Steam key saved. Syncing full library...'));
    if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(true);
    }
    actualizarDatosSteam(true);
  } else {
    localStorage.removeItem('mediary_steam_api_key');
    mostrarToastPersonalizado(tLang('Clave de Steam eliminada', 'Steam key removed'));
    if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(true);
    }
    actualizarDatosSteam(true);
  }
}

async function actualizarDatosSteam(notificar = false) {
  actualizarUISteam();
  const steamId = localStorage.getItem('mediary_steam_id');
  if (steamId) {
    if (notificar) mostrarToastPersonalizado(tLang(' Sincronizando datos de Steam...', ' Syncing Steam data...'));
    await sincronizarCuentaSteam(steamId, notificar);
  } else {
    if (notificar) mostrarToastPersonalizado(tLang('No hay cuenta de Steam vinculada', 'No Steam account linked'));
  }
}

