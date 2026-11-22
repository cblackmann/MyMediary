/* Mediary — js/core/config.js */
var TMDB_K = '15d2ea6d0dc1d476efbca3eba2b9bbfb';
var RAWG_K = 'c542e67aec3a4340908f9de9e86038af';
var COMICVINE_K = '6a65faa0799e008b056e5883d0c3183048419314';
var MARVEL_K = localStorage.getItem('mediary_marvel_key') || '';
var IGDB_CLIENT_ID = localStorage.getItem('mediary_igdb_client_id') || '';
var IGDB_TOKEN = localStorage.getItem('mediary_igdb_token') || '';
var SPOTIFY_CLIENT_ID = '955a1a0ccb814981b647d24c54b38d60';
var LASTFM_API_KEY = localStorage.getItem('mediary_lastfm_api_key') || 'b25b959554ed76058ac220b7b2e0a026';
window.TMDB_K = TMDB_K; window.RAWG_K = RAWG_K;
window.COMICVINE_K = COMICVINE_K; window.MARVEL_K = MARVEL_K;
window.IGDB_CLIENT_ID = IGDB_CLIENT_ID; window.IGDB_TOKEN = IGDB_TOKEN;
window.SPOTIFY_CLIENT_ID = SPOTIFY_CLIENT_ID;
window.LASTFM_API_KEY = LASTFM_API_KEY;

function optimizarUrlPoster(url, tipo = 'thumb') {
  if (!url || typeof url !== 'string') return '';
  url = url.trim();
  if (url.startsWith('data:image')) return url;

  // Limpiar posibles URLs dañadas previamente con .jpgjpg
  if (url.includes('.jpgjpg')) {
    url = url.replace(/\.jpgjpg+/gi, '.jpg');
  }

  // 1. TMDB (Películas, Series, Documentales)
  if (url.includes('image.tmdb.org/t/p/')) {
    const tmdbTam = (tipo === 'modal') ? 'w342' : 'w185';
    return url.replace(/\/t\/p\/(w500|original|w780|w1280)\//, `/t/p/${tmdbTam}/`);
  }

  // 2. RAWG (Videojuegos)
  if (url.includes('media.rawg.io/media/') && !url.includes('/crop/')) {
    return url.replace('media.rawg.io/media/', 'media.rawg.io/media/crop/600/400/');
  }

  // 3. Deezer (Música)
  if (url.includes('e-cdns-images.dzcdn.net/images/cover/')) {
    const dzTam = (tipo === 'modal') ? '500x500.jpg' : '250x250.jpg';
    return url.replace(/\/(?:1000x1000|500x500|250x250|120x120|56x56)(?:-[0-9\-]+)?\.jpg/i, `/${dzTam}`);
  }

  // 4. OpenLibrary (Libros)
  if (url.includes('covers.openlibrary.org/b/id/') && url.endsWith('-L.jpg')) {
    if (tipo !== 'modal') {
      return url.replace('-L.jpg', '-M.jpg');
    }
  }

  // 5. Apple / iTunes (Música y Canciones)
  if (url.includes('mzstatic.com/image/thumb/')) {
    const itTam = (tipo === 'modal') ? '600x600bb.jpg' : '300x300bb.jpg';
    return url.replace(/\/\d+x\d+bb\.(?:jpg|png|webp)?/i, `/${itTam}`);
  }

  // 6. Google Books
  if (url.includes('books.google.com/books')) {
    let u = url.replace('http://', 'https://');
    if (tipo === 'thumb' && u.includes('zoom=2')) {
      u = u.replace('zoom=2', 'zoom=1');
    }
    return u;
  }

  return url;
}
window.optimizarUrlPoster = optimizarUrlPoster;

var JSON_CACHE_ = new Map();
var getJson_ = async u => {
  if (JSON_CACHE_.has(u)) return JSON_CACHE_.get(u);
  try {
    if (u.includes('api.deezer.com')) {
      return await new Promise(resolve => {
        const cb = 'dz_cb_' + Math.random().toString(36).slice(2);
        const s = document.createElement('script');
        const timer = setTimeout(() => { delete window[cb]; s.remove(); resolve(null); }, 4500);
        window[cb] = data => { clearTimeout(timer); delete window[cb]; s.remove(); resolve(data); };
        s.onerror = () => { clearTimeout(timer); delete window[cb]; s.remove(); resolve(null); };
        s.src = u + (u.includes('?') ? '&' : '?') + 'output=jsonp&callback=' + cb;
        document.body.appendChild(s);
      });
    }
    if (u.includes('comicvine.gamespot.com')) {
      return await new Promise(resolve => {
        const cb = 'cv_cb_' + Math.random().toString(36).slice(2);
        const s = document.createElement('script');
        const timer = setTimeout(() => { delete window[cb]; s.remove(); resolve(null); }, 5000);
        window[cb] = data => { clearTimeout(timer); delete window[cb]; s.remove(); resolve(data); };
        s.onerror = () => { clearTimeout(timer); delete window[cb]; s.remove(); resolve(null); };
        s.src = u + (u.includes('?') ? '&' : '?') + 'format=jsonp&json_callback=' + cb;
        document.body.appendChild(s);
      });
    }
    const r = await fetch(u);
    const d = r.ok ? await r.json() : null;
    if (d && JSON_CACHE_.size < 350) JSON_CACHE_.set(u, d);
    return d;
  } catch (e) { return null; }
};
window.getJson_ = getJson_;

var getSteamJson_ = async u => {
  if (JSON_CACHE_.has(u)) return JSON_CACHE_.get(u);
  try {
    const ctrl1 = new AbortController();
    const t1 = setTimeout(() => ctrl1.abort(), 1200);
    const r = await fetch(u, { signal: ctrl1.signal });
    clearTimeout(t1);
    if (r.ok) {
      const d = await r.json();
      if (d && JSON_CACHE_.size < 350) JSON_CACHE_.set(u, d);
      return d;
    }
  } catch (e) {}
  try {
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 1200);
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`;
    const r2 = await fetch(proxyUrl, { signal: ctrl2.signal });
    clearTimeout(t2);
    if (r2.ok) {
      const d2 = await r2.json();
      if (d2 && JSON_CACHE_.size < 350) JSON_CACHE_.set(u, d2);
      return d2;
    }
  } catch (e2) {}
  return null;
};
window.getSteamJson_ = getSteamJson_;

var getIgdbGames_ = async (query, limit = 6) => {
  const cId = window.IGDB_CLIENT_ID || IGDB_CLIENT_ID;
  const tok = window.IGDB_TOKEN || IGDB_TOKEN;
  if (!cId || !tok) return null;
  const cacheK = `igdb_${query}_${limit}`;
  if (JSON_CACHE_.has(cacheK)) return JSON_CACHE_.get(cacheK);
  try {
    const cleanQ = String(query || '').replace(/"/g, '\\"').trim();
    const body = `search "${cleanQ}"; fields name, summary, storyline, first_release_date, cover.url, involved_companies.developer, involved_companies.publisher, involved_companies.company.name, genres.name, platforms.name; limit ${limit};`;
    const opts = {
      method: 'POST',
      headers: {
        'Client-ID': cId,
        'Authorization': 'Bearer ' + tok,
        'Accept': 'application/json'
      },
      body: body
    };
    let r = null;
    try {
      const ctrl1 = new AbortController();
      const t1 = setTimeout(() => ctrl1.abort(), 1200);
      r = await fetch('https://api.igdb.com/v4/games', { ...opts, signal: ctrl1.signal });
      clearTimeout(t1);
    } catch (e) {
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), 1200);
      const pUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.igdb.com/v4/games')}`;
      r = await fetch(pUrl, { ...opts, signal: ctrl2.signal }).catch(() => null);
      clearTimeout(t2);
    }
    if (r && r.ok) {
      const data = await r.json();
      if (data && JSON_CACHE_.size < 350) JSON_CACHE_.set(cacheK, data);
      return data;
    }
  } catch (err) {}
  return null;
};
window.getIgdbGames_ = getIgdbGames_;

/* ==========================================================================
   HEROICONS OUTLINE VECTOR ICON REGISTRY (Tailwind Labs)
   ========================================================================== */
const HEROICONS = {
  'home': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>',
  'star': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/></svg>',
  'star-half': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v14.15L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L12 3.5Z" fill="currentColor" stroke="none"/><path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" fill="none"/></svg>',
  'users': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/></svg>',
  'user': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>',
  'bookmark': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"/></svg>',
  'bookmark-square': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H7.5A2.25 2.25 0 0 0 5.25 6v12a2.25 2.25 0 0 0 2.25 2.25h9A2.25 2.25 0 0 0 18.75 18V6a2.25 2.25 0 0 0-2.25-2.25Z"/></svg>',
  'film': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>',
  'tv': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z"/></svg>',
  'musical-note': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>',
  'gamepad': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="6"/><path d="M6 12h4m-2-2v4M15 13h.01M18 11h.01"/></svg>',
  'book-open': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>',
  'sparkles': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/></svg>',
  'fire': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"/></svg>',
  'calendar': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5m-9-3h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"/></svg>',
  'bell': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/></svg>',
  'cog-6-tooth': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"/><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>',
  'arrow-path': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>',
  'bolt': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>',
  'trophy': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 18.75h-9m9 0a3 3 0 0 1 3-3h1.5a1.5 1.5 0 0 0 1.5-1.5v-1.125c0-.828-.672-1.5-1.5-1.5H18m-1.5 7.125v1.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5v-1.5m0 0a3 3 0 0 1-3-3H4.5A1.5 1.5 0 0 1 3 13.125V12c0-.828.672-1.5 1.5-1.5H6m10.5 8.25H7.5m9-8.25V4.875A1.875 1.875 0 0 0 14.625 3H9.375A1.875 1.875 0 0 0 7.5 4.875V10.5a4.5 4.5 0 0 0 9 0Z"/></svg>',
  'clock': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>',
  'chart-bar': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>',
  'check': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.75 6 6 9-13.5"/></svg>',
  'x-mark': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18 18 6M6 6l12 12"/></svg>',
  'magnifying-glass': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>',
  'pencil-square': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>',
  'trash': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>',
  'plus': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>',
  'video-camera': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>',
  'microphone': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"/></svg>',
  'ticket': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"/></svg>',
  'disc': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/><path d="M12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"/></svg>',
  'inbox': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"/></svg>',
  'arrow-right': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>',
  'chevron-down': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>',
  'chevron-right': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>',
  'chevron-left': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15.75 19.5-7.5-7.5 7.5-7.5"/></svg>',
  'globe-alt': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/></svg>',
  'shield-check': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>',
  'arrow-path-rounded-square': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"/></svg>',
  'heart': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/></svg>',
  'folder': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"/></svg>',
  'eye': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>',
  'eye-slash': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>',
  'paint-brush': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.39m3.42 3.42 6.84-6.84a2.25 2.25 0 1 0-3.182-3.182l-6.84 6.84m3.182 3.182-3.182-3.182"/></svg>',
  'chat-bubble-bottom-center-text': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/></svg>',
  'clipboard-document': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"/></svg>',
  'lock-closed': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>',
  'tag': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/><path d="M6 6h.008v.008H6V6Z"/></svg>',
  'device-phone-mobile': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/></svg>',
  'sun': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>',
  'moon': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg>',
  'cloud': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"/></svg>',
  'scissors': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.848 8.25l1.536.887m1.536.887 4.964 2.866M5.568 5.636a3 3 0 1 1 4.242 4.243L7.848 8.25m-2.28-2.614 2.28 2.614m0 0L3 13.5m4.848-5.25 4.964-2.866M5.568 18.364a3 3 0 1 0 4.242-4.243L7.848 15.75m-2.28 2.614 2.28-2.614m0 0L3 10.5m14.25 7.5 3.75-3.75m0 0L17.25 10.5"/></svg>',
  'camera': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"/><path d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"/></svg>',
  'link': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/></svg>',
  'identification': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15A2.25 2.25 0 0 0 2.25 6.75v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.364a4.125 4.125 0 0 0-6.338 0"/></svg>',
  'envelope': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/></svg>',
  'arrow-trending-up': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"/></svg>',
  'exclamation-triangle': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>',
  'information-circle': '<svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/></svg>'
};

const EMOJI_TO_HEROICON = {
  '🎬': 'film', '📺': 'tv', '🎵': 'musical-note', '🎮': 'gamepad',
  '📚': 'book-open', '📖': 'book-open', '📹': 'video-camera', '📽️': 'video-camera', '📽': 'video-camera',
  '⏳': 'clock', '🕒': 'clock', '⏱️': 'clock', '⏱': 'clock',
  '🏆': 'trophy', '👑': 'trophy', '💿': 'disc', '🎙️': 'microphone', '🎙': 'microphone',
  '🎤': 'microphone', '🎸': 'ticket', '🎪': 'ticket', '🎧': 'musical-note', '🕹️': 'gamepad', '🕹': 'gamepad',
  '💥': 'bolt', '⚡': 'bolt', '⛩️': 'bookmark-square', '⛩': 'bookmark-square',
  '🏠': 'home', '⭐': 'star', '★': 'star', '☆': 'star', '🌟': 'star',
  '👥': 'users', '👤': 'user', '🤝': 'users',
  '📌': 'bookmark', '✨': 'sparkles', '🎉': 'sparkles', '🎯': 'sparkles',
  '🔥': 'fire', '📅': 'calendar', '🗓️': 'calendar', '🗓': 'calendar', '📆': 'calendar',
  '🔔': 'bell', '⚙️': 'cog-6-tooth', '⚙': 'cog-6-tooth',
  '🔄': 'arrow-path', '🔁': 'arrow-path', '🔍': 'magnifying-glass',
  '✏️': 'pencil-square', '✏': 'pencil-square', '✍️': 'pencil-square', '✍': 'pencil-square',
  '🗑️': 'trash', '🗑': 'trash', '✓': 'check', '✅': 'check',
  '✕': 'x-mark', '✖': 'x-mark', '➕': 'plus', '＋': 'plus',
  '📊': 'chart-bar', '📈': 'arrow-trending-up', '📬': 'inbox', '📥': 'inbox',
  '🌐': 'globe-alt', '📁': 'folder', '➔': 'arrow-right', '→': 'arrow-right',
  '🍿': 'film', '🎲': 'arrow-path-rounded-square', '🎰': 'arrow-path-rounded-square',
  '👁️': 'eye', '👁': 'eye', '🚫': 'eye-slash', '🙈': 'eye-slash',
  '🔒': 'lock-closed', '🔐': 'lock-closed', '🎨': 'paint-brush',
  '💬': 'chat-bubble-bottom-center-text', '📋': 'clipboard-document',
  '❤': 'heart', '❤️': 'heart', '🤍': 'heart',
  '📱': 'device-phone-mobile', '📲': 'device-phone-mobile',
  '☀️': 'sun', '🌙': 'moon', '☁️': 'cloud', '☁': 'cloud',
  '✂️': 'scissors', '✂': 'scissors', '📷': 'camera',
  '🏷️': 'tag', '🏷': 'tag', '🔗': 'link',
  '🆔': 'identification', '✉️': 'envelope', '✉': 'envelope',
  '⚠️': 'exclamation-triangle', '⚠': 'exclamation-triangle',
  'ℹ️': 'information-circle', 'ℹ': 'information-circle',
  '🤷‍♂️': 'information-circle', '🔴': 'sparkles', '🔵': 'sparkles', '🟢': 'sparkles', '◽': 'sparkles'
};

function getHeroIcon(nameOrEmoji, extraClass = '', size = null) {
  if (!nameOrEmoji) return '';
  let key = String(nameOrEmoji).trim();
  if (EMOJI_TO_HEROICON[key]) {
    key = EMOJI_TO_HEROICON[key];
  }
  let svg = HEROICONS[key] || HEROICONS['sparkles'];
  if (extraClass) {
    svg = svg.replace('class="h-icon"', 'class="h-icon ' + extraClass + '"');
  }
  if (size) {
    svg = svg.replace('<svg ', '<svg style="width:' + size + 'px;height:' + size + 'px;" ');
  }
  return svg;
}
window.HEROICONS = HEROICONS;
window.getHeroIcon = getHeroIcon;


const CONFIG = {
  Peliculas: {
    nombre: 'Películas',
    emoji: getHeroIcon('film'),
    colorKey: 'peliculas',
    colorVar: 'var(--cat-color-peliculas)',
    subs: [
      { id: 'Películas', nombre: 'Películas', emoji: getHeroIcon('film'), colorKey: 'peliculas', rangoFechas: false, admiteRewatch: true },
      { id: 'Documentales', nombre: 'Documentales', emoji: getHeroIcon('video-camera'), colorKey: 'peliculas', rangoFechas: false, admiteRewatch: false },
      { id: 'Watchlist', nombre: 'Watchlist: Películas', emoji: getHeroIcon('bookmark'), colorKey: 'peliculas', esWatchlist: true, targetSub: 'Películas', rangoFechas: false },
      { id: 'Watchlist: Documentales', nombre: 'Watchlist: Documentales', emoji: getHeroIcon('bookmark'), colorKey: 'peliculas', esWatchlist: true, targetSub: 'Documentales', rangoFechas: false }
    ]
  },
  Series: {
    nombre: 'Series',
    emoji: getHeroIcon('tv'),
    colorKey: 'series',
    colorVar: 'var(--cat-color-series)',
    subs: [
      { id: 'Temporadas', nombre: 'Temporadas', emoji: getHeroIcon('clock'), colorKey: 'series', rangoFechas: true, admiteRewatch: true },
      { id: 'Series Completas', nombre: 'Series Completas', emoji: getHeroIcon('trophy'), colorKey: 'series', rangoFechas: true, admiteRewatch: true },
      { id: 'Series Documentales', nombre: 'Series Documentales', emoji: getHeroIcon('video-camera'), colorKey: 'series', rangoFechas: true, admiteRewatch: false },
      { id: 'Watchlist', nombre: 'Watchlist: Series', emoji: getHeroIcon('bookmark'), colorKey: 'series', esWatchlist: true, targetSub: 'Series', rangoFechas: false },
      { id: 'Watchlist: Docuseries', nombre: 'Watchlist: Docuseries', emoji: getHeroIcon('bookmark'), colorKey: 'series', esWatchlist: true, targetSub: 'Series Documentales', rangoFechas: false }
    ]
  },
  Musica: {
    nombre: 'Música',
    emoji: getHeroIcon('musical-note'),
    colorKey: 'musica',
    colorVar: 'var(--cat-color-musica)',
    subs: [
      { id: 'Discos', nombre: 'Discos', emoji: getHeroIcon('disc'), colorKey: 'musica', rangoFechas: false, admiteRewatch: false },
      { id: 'Artistas/Grupos', nombre: 'Artistas/Grupos', emoji: getHeroIcon('microphone'), colorKey: 'musica', rangoFechas: true, admiteRewatch: false },
      { id: 'Conciertos', nombre: 'Conciertos', emoji: getHeroIcon('ticket'), colorKey: 'musica', rangoFechas: false, admiteRewatch: false },
      { id: 'To Listen', nombre: 'To Listen', emoji: getHeroIcon('bookmark'), colorKey: 'musica', esWatchlist: true, targetSub: 'Discos', rangoFechas: false }
    ]
  },
  Juegos: {
    nombre: 'Juegos',
    emoji: getHeroIcon('gamepad'),
    colorKey: 'juegos',
    colorVar: 'var(--cat-color-juegos)',
    subs: [
      { id: 'Videojuegos', nombre: 'Videojuegos', emoji: getHeroIcon('gamepad'), colorKey: 'juegos', rangoFechas: true, admiteRewatch: true },
      { id: 'To Play', nombre: 'To Play', emoji: getHeroIcon('bookmark'), colorKey: 'juegos', esWatchlist: true, targetSub: 'Videojuegos', rangoFechas: false }
    ]
  },
  Lecturas: {
    nombre: 'Lecturas',
    emoji: getHeroIcon('book-open'),
    colorKey: 'lecturas',
    colorVar: 'var(--cat-color-lecturas)',
    subs: [
      { id: 'Libros', nombre: 'Libros', emoji: getHeroIcon('book-open'), colorKey: 'libros', rangoFechas: true, admiteRewatch: true },
      { id: 'Cómics', nombre: 'Cómics', emoji: getHeroIcon('bolt'), colorKey: 'comics', rangoFechas: true, admiteRewatch: true },
      { id: 'Mangas', nombre: 'Mangas', emoji: getHeroIcon('bookmark-square'), colorKey: 'mangas', rangoFechas: true, admiteRewatch: true },
      { id: 'To Read: Libros', nombre: 'To Read: Libros', emoji: getHeroIcon('bookmark'), colorKey: 'libros', esWatchlist: true, targetSub: 'Libros', rangoFechas: false },
      { id: 'To Read: Cómics', nombre: 'To Read: Cómics', emoji: getHeroIcon('bookmark'), colorKey: 'comics', esWatchlist: true, targetSub: 'Cómics', rangoFechas: false },
      { id: 'To Read: Mangas', nombre: 'To Read: Mangas', emoji: getHeroIcon('bookmark'), colorKey: 'mangas', esWatchlist: true, targetSub: 'Mangas', rangoFechas: false }
    ]
  }
};

function obtenerMetaColorCategoria(categoria, subcategoria) {
  const c = String(categoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const s = String(subcategoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // 1. Cómics (Naranjo)
  if (s.includes('comic') || c.includes('comic')) {
    return {
      key: 'comics',
      nombre: 'Cómics',
      colorVar: 'var(--cat-color-comics)',
      bgVar: 'var(--cat-bg-comics)',
      borderVar: 'var(--cat-border-comics)',
      hexDark: '#fb923c',
      hexLight: '#ea580c'
    };
  }
  // 2. Mangas (Rojo)
  if (s.includes('manga') || c.includes('manga')) {
    return {
      key: 'mangas',
      nombre: 'Mangas',
      colorVar: 'var(--cat-color-mangas)',
      bgVar: 'var(--cat-bg-mangas)',
      borderVar: 'var(--cat-border-mangas)',
      hexDark: '#f87171',
      hexLight: '#dc2626'
    };
  }
  // 3. Libros (Amarillo)
  if (s.includes('libro') || s.includes('book')) {
    return {
      key: 'libros',
      nombre: 'Libros',
      colorVar: 'var(--cat-color-libros)',
      bgVar: 'var(--cat-bg-libros)',
      borderVar: 'var(--cat-border-libros)',
      hexDark: '#facc15',
      hexLight: '#ca8a04'
    };
  }
  // 4. Lecturas (Café)
  if (c.includes('lectura') || c.includes('read')) {
    return {
      key: 'lecturas',
      nombre: 'Lecturas',
      colorVar: 'var(--cat-color-lecturas)',
      bgVar: 'var(--cat-bg-lecturas)',
      borderVar: 'var(--cat-border-lecturas)',
      hexDark: '#d97706',
      hexLight: '#92400e'
    };
  }
  // 5. Películas (Morado)
  if (c.includes('pelicula') || c.includes('movie') || c.includes('film')) {
    return {
      key: 'peliculas',
      nombre: 'Películas',
      colorVar: 'var(--cat-color-peliculas)',
      bgVar: 'var(--cat-bg-peliculas)',
      borderVar: 'var(--cat-border-peliculas)',
      hexDark: '#c084fc',
      hexLight: '#9333ea'
    };
  }
  // 6. Series (Celeste)
  if (c.includes('serie') || c.includes('show') || c.includes('tv')) {
    return {
      key: 'series',
      nombre: 'Series',
      colorVar: 'var(--cat-color-series)',
      bgVar: 'var(--cat-bg-series)',
      borderVar: 'var(--cat-border-series)',
      hexDark: '#38bdf8',
      hexLight: '#0284c7'
    };
  }
  // 7. Música (Rosado)
  if (c.includes('musica') || c.includes('music') || s.includes('disco') || s.includes('album') || s.includes('artista') || s.includes('concierto')) {
    return {
      key: 'musica',
      nombre: 'Música',
      colorVar: 'var(--cat-color-musica)',
      bgVar: 'var(--cat-bg-musica)',
      borderVar: 'var(--cat-border-musica)',
      hexDark: '#f472b6',
      hexLight: '#db2777'
    };
  }
  // 8. Juegos (Azul)
  if (c.includes('juego') || c.includes('game')) {
    return {
      key: 'juegos',
      nombre: 'Juegos',
      colorVar: 'var(--cat-color-juegos)',
      bgVar: 'var(--cat-bg-juegos)',
      borderVar: 'var(--cat-border-juegos)',
      hexDark: '#60a5fa',
      hexLight: '#2563eb'
    };
  }

  return {
    key: 'default',
    nombre: categoria || '',
    colorVar: 'var(--accent)',
    bgVar: 'rgba(56,189,248,0.12)',
    borderVar: 'rgba(56,189,248,0.28)',
    hexDark: '#38bdf8',
    hexLight: '#0284c7'
  };
}
function obtenerColorCategoria(categoria, subcategoria) {
  return obtenerMetaColorCategoria(categoria, subcategoria);
}
window.obtenerMetaColorCategoria = obtenerMetaColorCategoria;
window.obtenerColorCategoria = obtenerColorCategoria;

