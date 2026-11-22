/* Mediary — js/i18n/i18n.js */
const I18N = { es: window.MEDIARY_I18N_ES, en: window.MEDIARY_I18N_EN };

function getLang_() {
  return (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
}

function t(k, vars) {
  const l = getLang_();
  let val = (I18N[l] && I18N[l][k] !== undefined) ? I18N[l][k] : ((I18N.es && I18N.es[k] !== undefined) ? I18N.es[k] : k);
  if (vars && typeof val === 'string') {
    for (const key in vars) {
      val = val.replace(new RegExp('\\{' + key + '\\}', 'g'), String(vars[key]));
    }
  }
  return val;
}

function tLang(esText, enText) {
  return getLang_() === 'en' ? enText : esText;
}
function traducirSub(sub) {
  if (!sub) return '';
  const l = getLang_();
  return (I18N[l] && I18N[l].subs && I18N[l].subs[sub]) || sub;
}
window.t = t;
window.tLang = tLang;
window.traducirSub = traducirSub;
window.getLang_ = getLang_;

function sincronizarLocaleFlatpickr_(lang) {
  if (typeof flatpickr === 'undefined') return;
  const loc = lang === 'en' ? 'default' : 'es';
  try {
    if (typeof fpInicio !== 'undefined' && fpInicio && fpInicio.config && fpInicio.config.locale !== loc) {
      const val = fpInicio.input ? fpInicio.input.value : '';
      fpInicio.set('locale', loc);
      if (val) fpInicio.input.value = val;
    }
    if (typeof fpFin !== 'undefined' && fpFin && fpFin.config && fpFin.config.locale !== loc) {
      const val = fpFin.input ? fpFin.input.value : '';
      fpFin.set('locale', loc);
      if (val) fpFin.input.value = val;
    }
  } catch (_) {}
}

function actualizarTextosInterfaz() {
  const l = getLang_();
  const dict = I18N[l] || I18N.es || {};
  document.documentElement.lang = l;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    const txt = dict[k];
    if (typeof txt !== 'string') return;
    const existingSvg = el.querySelector('svg.h-icon, svg.heroicon');
    if (existingSvg) {
      const svgClone = existingSvg.cloneNode(true);
      el.textContent = txt;
      el.insertBefore(svgClone, el.firstChild);
      if (el.childNodes.length > 1 && el.childNodes[1].nodeType === Node.TEXT_NODE) {
        el.childNodes[1].textContent = ' ' + el.childNodes[1].textContent.trim();
      }
    } else if (txt.includes('<svg') || txt.includes('<span')) {
      el.innerHTML = txt;
    } else {
      el.textContent = txt;
    }
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const k = el.getAttribute('data-i18n-html');
    if (typeof dict[k] === 'string') el.innerHTML = dict[k];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.getAttribute('data-i18n-placeholder');
    if (typeof dict[k] === 'string') el.placeholder = dict[k];
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const k = el.getAttribute('data-i18n-title');
    if (typeof dict[k] === 'string') el.title = dict[k];
  });

  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    const k = el.getAttribute('data-i18n-aria-label');
    if (typeof dict[k] === 'string') el.setAttribute('aria-label', dict[k]);
  });

  // Legacy / dynamic placeholder overrides (kept synced for inputs created dynamically or via IDs)
  const phMap = {
    'cfg-comicvine-key': ['Pega tu API key de Comic Vine aquí...', 'Paste your Comic Vine API key here...'],
    'cfg-marvel-key': ['Pega tu Public Key de Marvel aquí...', 'Paste your Marvel Public Key here...'],
    'cfg-igdb-client-id': ['Pega tu Client ID de Twitch / IGDB...', 'Paste your Twitch / IGDB Client ID...'],
    'cfg-igdb-token': ['Pega tu Access Token de IGDB...', 'Paste your IGDB Access Token...'],
    'char-input-nombre': ['Ej: Batman / Spike Spiegel', 'e.g. Batman / Spike Spiegel'],
    'char-input-obra': ['Ej: DC Comics / Cowboy Bebop', 'e.g. DC Comics / Cowboy Bebop'],
    'char-input-url': ['https://ejemplo.com/foto.jpg', 'https://example.com/photo.jpg'],
    'char-input-cita': ['Ej: Soy la venganza / See you space cowboy...', 'e.g. I am vengeance...'],
    'char-obra-input-nombre': ['Ej: Neo / Ellen Ripley', 'e.g. Neo / Ellen Ripley'],
    'char-obra-input-cita': ['Ej: No hay cuchara', 'e.g. There is no spoon']
  };
  for (const id in phMap) {
    const el = document.getElementById(id);
    if (el) el.placeholder = l === 'en' ? phMap[id][1] : phMap[id][0];
  }

  // Font Cards titles and subtitles
  const fontCards = document.querySelectorAll('#cfg-font-cards .cfg-option-card');
  if (fontCards.length >= 7) {
    const fontData = [
      { t: l === 'en' ? 'Lexend (Default)' : 'Lexend (Predeterminada)', s: l === 'en' ? 'Aa Bb Cc — Fluent reading 123' : 'Aa Bb Cc — Lectura fluida 123' },
      { t: 'Plus Jakarta Sans', s: l === 'en' ? 'Aa Bb Cc — The art of cinema 123' : 'Aa Bb Cc — El arte del cine 123' },
      { t: l === 'en' ? 'Inter Modern' : 'Inter Moderna', s: l === 'en' ? 'Aa Bb Cc — Clean reading 123' : 'Aa Bb Cc — Lectura limpia 123' },
      { t: l === 'en' ? 'Cinzel Classic' : 'Cinzel Clásica', s: l === 'en' ? 'AA BB CC — EPIC AESTHETIC 123' : 'AA BB CC — ESTÉTICA ÉPICA 123' },
      { t: l === 'en' ? 'Outfit Geometric' : 'Outfit Geométrica', s: l === 'en' ? 'Aa Bb Cc — Modern stroke 123' : 'Aa Bb Cc — Trazo moderno 123' },
      { t: 'Space Grotesk', s: l === 'en' ? 'Aa Bb Cc — Tech typography 123' : 'Aa Bb Cc — Tipografía tech 123' },
      { t: 'Playfair Display', s: l === 'en' ? 'Aa Bb Cc — Editorial elegance 123' : 'Aa Bb Cc — Elegancia editorial 123' }
    ];
    fontCards.forEach((card, idx) => {
      if (fontData[idx]) {
        const strong = card.querySelector('strong');
        const span = card.querySelector('span');
        if (strong) strong.textContent = fontData[idx].t;
        if (span) span.textContent = fontData[idx].s;
      }
    });
  }

  // 5 Size Labels (muestra visual Aa)
  const sizeLabels = document.querySelectorAll('#cfg-size-labels .size-line-lbl-btn');
  const sizeSamples = ['8px', '9.5px', '11px', '13px', '15px'];
  sizeLabels.forEach((btn, idx) => {
    btn.innerHTML = `<span style="font-size:${sizeSamples[idx] || '15px'}; font-weight:800; display:inline-block; line-height:1;">Aa</span>`;
  });

  // 4 Temas y botones de modo
  const themeCards = document.querySelectorAll('#cfg-theme-cards .theme-family-card');
  const tTexts = {
    'slate': { t: l === 'en' ? 'Nordic Slate' : 'Pizarra Nórdica', s: l === 'en' ? 'Slate + Sky Blue' : 'Pizarra + Celeste' },
    'emerald': { t: l === 'en' ? 'Emerald & Sage' : 'Esmeralda & Salvia', s: l === 'en' ? 'Emerald + Salvia Jade' : 'Esmeralda + Salvia Jade' },
    'espresso': { t: l === 'en' ? 'Espresso & Parchment' : 'Café & Pergamino', s: l === 'en' ? 'Terracotta + Amber Honey' : 'Terracota + Ámbar Miel' },
    'dracula': { t: l === 'en' ? 'Dracula & Lavender' : 'Drácula & Lavanda', s: l === 'en' ? 'Purple Night + Lavender' : 'Púrpura Noche + Amatista' }
  };
  themeCards.forEach(card => {
    const fam = card.dataset.family;
    if (tTexts[fam]) {
      const strong = card.querySelector('.theme-title');
      const span = card.querySelector('.theme-subtitle');
      if (strong) strong.textContent = tTexts[fam].t;
      if (span) span.textContent = tTexts[fam].s;
    }
    const pL = card.querySelector('.pill-light');
    if (pL) pL.innerHTML = `<span class="emoji-dyn">${getHeroIcon('sun', '', 13)}</span> ${l === 'en' ? 'Light' : 'Claro'}`;
    const pD = card.querySelector('.pill-dark');
    if (pD) pD.innerHTML = `<span class="emoji-dyn">${getHeroIcon('moon', '', 13)}</span> ${l === 'en' ? 'Dark' : 'Oscuro'}`;
  });

  const btnSys = document.getElementById('btn-mode-system');
  if (btnSys) { const st = btnSys.querySelector('strong'); if (st) st.textContent = l === 'en' ? 'System Theme' : 'Del sistema'; }
  const btnLight = document.getElementById('btn-mode-light');
  if (btnLight) { const st = btnLight.querySelector('strong'); if (st) st.textContent = l === 'en' ? 'Light Mode' : 'Modo Claro'; }
  const btnDark = document.getElementById('btn-mode-dark');
  if (btnDark) { const st = btnDark.querySelector('strong'); if (st) st.textContent = l === 'en' ? 'Dark Mode' : 'Modo Oscuro'; }

  // Supabase badge
  const sbBadge = document.getElementById('cfg-supabase-badge');
  if (sbBadge) sbBadge.innerHTML = `<span class="emoji-dyn">${getHeroIcon('check', '', 13)}</span> ${l === 'en' ? 'Supabase Cloud Active' : 'Supabase Cloud Activo'}`;

  // Discover Live status & Auto-update
  const dStatus = document.getElementById('discover-status-txt');
  if (dStatus) dStatus.textContent = l === 'en' ? 'Live Updated' : 'Actualizado';
  const btnAuto = document.getElementById('btn-discover-autoupdate');
  if (btnAuto) {
    btnAuto.innerHTML = estado.discoverAutoRefresh
      ? `<span class="emoji-dyn">${getHeroIcon('bolt', '', 14)}</span> <span>${l === 'en' ? 'Auto-update: ON' : 'Auto-actualizar: ON'}</span>`
      : `<span class="emoji-dyn">${getHeroIcon('pause', '', 14)}</span> <span>${l === 'en' ? 'Auto-update: OFF' : 'Auto-actualizar: OFF'}</span>`;
  }

  // Profile email & configure favs button title
  const pEmail = document.getElementById('perfil-email-txt');
  if (pEmail && (!perfilUsuario.emailGoogle || !perfilUsuario.logueadoGoogle)) {
    pEmail.textContent = l === 'en' ? 'No linked account' : 'Sin cuenta vinculada';
  }
  const btnModoFavs = document.getElementById('btn-modo-mostrar-favs');
  if (btnModoFavs) {
    btnModoFavs.title = estado.modoConfigurarFavs
      ? (l === 'en' ? 'Done' : 'Listo (guardar)')
      : (l === 'en' ? 'Configure which to show' : 'Configurar cuáles mostrar');
    btnModoFavs.setAttribute('aria-label', btnModoFavs.title);
  }

  // Tooltips / Titles of icon buttons
  const titleMap = {
    'btn-refresh': ['Sincronizar y reparar datos', 'Sync & repair data'],
    'btn-settings': ['Configuración', 'Settings'],
    'btn-profile': ['Perfil y Estadísticas', 'Profile & Statistics'],
    'btn-install-pwa': ['Instalar aplicación Mediary en tu dispositivo', 'Install Mediary app on your device']
  };
  for (const id in titleMap) {
    const el = document.getElementById(id);
    if (el) el.title = l === 'en' ? titleMap[id][1] : titleMap[id][0];
  }

  sincronizarLocaleFlatpickr_(l);
  actualizarUISelectorAnio();
  if (typeof actualizarSaludoInicio === 'function') actualizarSaludoInicio();
  if (typeof actualizarBotonOrdenHistorial === 'function') actualizarBotonOrdenHistorial();
  if (typeof renderizarAppsVinculadasConfig === 'function') renderizarAppsVinculadasConfig();
  if (typeof actualizarUISpotify === 'function') actualizarUISpotify();
  if (typeof actualizarUISteam === 'function') actualizarUISteam();
  if (typeof actualizarUILastFm === 'function') actualizarUILastFm();
  if (typeof actualizarUIPlayStation === 'function') actualizarUIPlayStation();
  if (typeof actualizarIndicadorUsoAlmacenamiento === 'function') actualizarIndicadorUsoAlmacenamiento();
  if (typeof estado !== 'undefined' && estado && estado.categoria === 'calendario' && typeof renderizarVistaCalendarioCompleta === 'function') {
    renderizarVistaCalendarioCompleta();
  }
}
