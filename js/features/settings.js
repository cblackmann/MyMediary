/* Mediary — js/features/settings.js */
function cerrarModalConfiguracion() { if (typeof cerrarDropdownsConfig === 'function') cerrarDropdownsConfig(); guardarPreferenciasLocales(); document.getElementById('modal-configuracion').style.display = 'none'; }

const CFG_FONT_LABELS = {
  "'Lexend', sans-serif": 'Lexend',
  "'Plus Jakarta Sans', sans-serif": 'Plus Jakarta Sans',
  "'Inter', sans-serif": 'Inter',
  "'Cinzel', serif": 'Cinzel',
  "'Outfit', sans-serif": 'Outfit',
  "'Space Grotesk', sans-serif": 'Space Grotesk',
  "'Playfair Display', serif": 'Playfair Display'
};

let _cfgAppGestionActiva = null;

function cerrarDropdownsConfig() {
  ['lang', 'font'].forEach(tipo => {
    const menu = document.getElementById(`menu-cfg-${tipo}`);
    const btn = document.getElementById(`btn-cfg-${tipo}-dropdown`);
    if (menu) menu.style.display = 'none';
    if (btn) {
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

function toggleCfgDropdown(tipo, e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById(`menu-cfg-${tipo}`);
  const btn = document.getElementById(`btn-cfg-${tipo}-dropdown`);
  if (!menu || !btn) return;
  const estaAbierto = menu.style.display !== 'none';
  cerrarDropdownsConfig();
  if (!estaAbierto) {
    menu.style.display = 'block';
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

function obtenerEstadoAppsVinculadasConfig() {
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang) ? userPrefs.lang : 'es';

  const spToken = localStorage.getItem('mediary_spotify_token');
  let spUser = null;
  try { const r = localStorage.getItem('mediary_spotify_user'); if (r) spUser = JSON.parse(r); } catch (e) {}
  const spConn = !!(spToken || spUser);

  const lfmConn = localStorage.getItem('mediary_lastfm_connected') === 'true';
  let lfmUser = null;
  try { const r = localStorage.getItem('mediary_lastfm_user'); if (r) lfmUser = JSON.parse(r); } catch (e) {}
  const lfmName = (lfmUser && (lfmUser.realname || lfmUser.name)) || localStorage.getItem('mediary_lastfm_username') || 'Last.fm';

  const steamConn = localStorage.getItem('mediary_steam_connected') === 'true';
  let steamUser = null;
  try { const r = localStorage.getItem('mediary_steam_user'); if (r) steamUser = JSON.parse(r); } catch (e) {}
  const steamName = (steamUser && steamUser.personaName) || localStorage.getItem('mediary_steam_id') || 'Steam';

  const psnConn = localStorage.getItem('mediary_psn_connected') === 'true';
  let psnUser = null;
  try { const r = localStorage.getItem('mediary_psn_user'); if (r) psnUser = JSON.parse(r); } catch (e) {}
  const psnName = localStorage.getItem('mediary_psn_username') || (psnUser && psnUser.onlineId) || 'PlayStation';

  return [
    {
      id: 'spotify',
      name: 'Spotify',
      category: 'musica',
      color: '#1DB954',
      bg: 'rgba(29,185,84,0.12)',
      connected: spConn,
      userName: (spUser && spUser.display_name) || 'Spotify',
      avatar: (spUser && spUser.avatar) || '',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.218.358-.684.472-1.042.254-2.858-1.746-6.455-2.14-10.693-1.173-.41.094-.82-.162-.914-.572-.094-.41.162-.82.572-.914 4.636-1.059 8.607-.611 11.823 1.354.358.218.472.684.254 1.051zm1.468-3.262c-.274.446-.86.588-1.306.314-3.272-2.011-8.261-2.594-12.133-1.418-.501.152-1.033-.133-1.185-.634-.152-.501.133-1.033.634-1.185 4.417-1.34 9.913-.687 13.676 1.617.446.274.588.86.314 1.306zm.126-3.41c-3.924-2.33-10.395-2.545-14.154-1.403-.601.183-1.242-.164-1.425-.765-.183-.601.164-1.242.765-1.425 4.316-1.31 11.455-1.062 15.967 1.617.541.321.717 1.026.396 1.567-.321.541-1.026.717-1.549.409z"/></svg>',
      syncFn: 'actualizarDatosSpotify(true)',
      disconnectFn: 'desconectarSpotify()',
      connectFn: () => { if (typeof iniciarFlujoSpotifyAuth === 'function') iniciarFlujoSpotifyAuth(); }
    },
    {
      id: 'lastfm',
      name: 'Last.fm',
      category: 'musica',
      color: '#d51007',
      bg: 'rgba(213,16,7,0.12)',
      connected: lfmConn,
      userName: lfmName,
      avatar: (lfmUser && lfmUser.avatar) || '',
      svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#d51007"><path d="M10.584 17.21l-.88-2.392s-1.43 1.594-3.573 1.594c-1.897 0-3.244-1.649-3.244-4.288 0-3.381 1.704-4.591 3.381-4.591 2.42 0 3.189 1.567 3.849 3.574l.88 2.749c.88 2.666 2.529 4.81 7.285 4.81 3.409 0 5.718-1.044 5.718-3.793 0-2.227-1.265-3.381-3.63-3.931l-1.758-.385c-1.21-.275-1.567-.77-1.567-1.595 0-.934.742-1.484 1.952-1.484 1.32 0 2.034.495 2.144 1.677l2.749-.33c-.22-2.474-1.924-3.492-4.729-3.492-2.474 0-4.893.935-4.893 3.932 0 1.87.907 3.051 3.189 3.601l1.87.44c1.402.33 1.869.907 1.869 1.704 0 1.017-.99 1.43-2.86 1.43-2.776 0-3.93-1.457-4.59-3.464l-.907-2.75c-1.155-3.573-2.997-4.893-6.653-4.893C2.144 5.333 0 7.89 0 12.233c0 4.18 2.144 6.434 5.993 6.434 3.106 0 4.591-1.457 4.591-1.457z"/></svg>',
      syncFn: 'sincronizarCuentaLastFm(null, true)',
      disconnectFn: 'desconectarLastFm()',
      connectFn: () => { if (typeof abrirModalConectarLastFm === 'function') abrirModalConectarLastFm(); }
    },
    {
      id: 'steam',
      name: 'Steam',
      category: 'juegos',
      color: '#66c0f4',
      bg: 'rgba(102,192,244,0.12)',
      connected: steamConn,
      userName: steamName,
      avatar: (steamUser && steamUser.avatar) || '',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#66c0f4"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 14.819C1.868 20.089 6.48 24 11.979 24c6.627 0 12-5.373 12-12S18.606 0 11.979 0zM7.558 16.323c-.325.795-1.109 1.344-2.021 1.344-.127 0-.251-.013-.374-.035l2.455 1.015c.677-.384 1.187-1.026 1.393-1.802-.458-.137-.96-.341-1.453-.522zm8.384-9.619c-1.246 0-2.26 1.014-2.26 2.26s1.014 2.26 2.26 2.26 2.26-1.014 2.26-2.26-1.014-2.26-2.26-2.26zm0 3.616c-.748 0-1.356-.607-1.356-1.356s.608-1.356 1.356-1.356c.748 0 1.355.607 1.355 1.356s-.607 1.356-1.355 1.356z"/></svg>',
      syncFn: 'actualizarDatosSteam(true)',
      disconnectFn: 'desconectarSteam()',
      connectFn: () => { if (typeof abrirModalConectarSteam === 'function') abrirModalConectarSteam(); },
      extraLabel: l === 'en' ? 'Steam Web API Key' : 'Clave Steam Web API'
    },
    {
      id: 'playstation',
      name: 'PlayStation',
      category: 'juegos',
      color: '#0070d1',
      bg: 'rgba(0,112,209,0.14)',
      connected: psnConn,
      userName: psnName,
      avatar: (psnUser && psnUser.avatar) || '',
      svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#0070d1"><path d="M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.505v5.875c2.441 1.193 4.362-.002 4.362-3.152 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.39-1.502zm4.656 16.241l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5V14.98l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.04 1.472 1.576 2.072-.465.6-1.622 1.036-1.622 1.036l-8.544 3.107V18.86zM1.807 18.6c-1.9-.545-2.214-1.668-1.352-2.32.801-.586 2.16-1.052 2.16-1.052l5.615-2.013v2.313L4.205 17c-.705.271-.825.632-.239.826.586.195 1.637.15 2.343-.12L8.247 17v2.074c-.12.03-.256.044-.39.073-1.939.331-3.996.196-6.038-.479z"/></svg>',
      syncFn: 'sincronizarCuentaPlayStation(null, true)',
      disconnectFn: 'desconectarPlayStation()',
      connectFn: () => { if (typeof abrirModalConectarPsn === 'function') abrirModalConectarPsn(); },
      extraLabel: 'Token NPSSO'
    }
  ];
}

function renderizarAppsVinculadasConfig() {
  const logosRow = document.getElementById('cfg-linked-apps-logos');
  const manageBox = document.getElementById('cfg-linked-app-manage');
  if (!logosRow) return;
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang) ? userPrefs.lang : 'es';
  const apps = obtenerEstadoAppsVinculadasConfig();
  const conectadas = apps.filter(a => a.connected);

  if (conectadas.length === 0) {
    logosRow.innerHTML = `<span style="font-size:0.78rem; color:var(--muted);">${l === 'en' ? 'No linked accounts' : 'Sin cuentas vinculadas'}</span>`;
  } else {
    logosRow.innerHTML = conectadas.map(app => {
      const selCls = _cfgAppGestionActiva === app.id ? ' is-selected' : '';
      const safeTitle = `${app.name}${app.userName && app.userName !== app.name ? ' · ' + app.userName : ''}`.replace(/"/g, '&quot;');
      return `<button type="button" class="cfg-app-logo-btn is-connected${selCls}" style="--app-brand:${app.color};--app-brand-bg:${app.bg};" onclick="abrirGestionAppVinculadaConfig('${app.id}')" title="${safeTitle}" aria-label="${safeTitle}">${app.svg}<span class="cfg-app-linked-dot">✓</span></button>`;
    }).join('');
  }

  apps.forEach(app => {
    const optBtn = document.getElementById(`cfg-opt-logo-${app.id}`);
    if (!optBtn) return;
    optBtn.classList.toggle('is-connected', app.connected);
    const existingDot = optBtn.querySelector('.cfg-app-linked-dot');
    if (app.connected && !existingDot) {
      const dot = document.createElement('span');
      dot.className = 'cfg-app-linked-dot';
      dot.textContent = '✓';
      optBtn.appendChild(dot);
    } else if (!app.connected && existingDot) {
      existingDot.remove();
    }
  });

  if (manageBox) {
    const appSel = _cfgAppGestionActiva ? apps.find(a => a.id === _cfgAppGestionActiva && a.connected) : null;
    if (!appSel) {
      _cfgAppGestionActiva = null;
      manageBox.style.display = 'none';
      manageBox.innerHTML = '';
    } else {
      const safeUser = String(appSel.userName || appSel.name).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      let extraHtml = '';
      if (appSel.id === 'steam') {
        const hasKey = !!localStorage.getItem('mediary_steam_api_key');
        extraHtml = `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);"><div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:0.74rem;color:var(--muted);">Steam Web API Key</span><button type="button" onclick="toggleSteamApiKeyInput()" id="btn-toggle-steam-key" style="background:none;border:none;color:#66c0f4;font-size:0.74rem;cursor:pointer;font-weight:600;">${hasKey ? (l === 'en' ? 'Active' : 'Activa') : (l === 'en' ? '+ Configure' : '+ Configurar')}</button></div><div id="cfg-steam-apikey-wrap" style="display:none;margin-top:8px;"><div class="app-connect-input-row"><input type="text" id="cfg-steam-api-key-input" name="steam_api_key_input" class="form-input" placeholder="Steam Web API Key" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" style="-webkit-text-security:disc;text-security:disc;" value="${(localStorage.getItem('mediary_steam_api_key') || '').replace(/"/g, '&quot;')}"><button type="button" class="btn-connect-action btn-connect-steam" onclick="guardarSteamApiKeyDesdeInput('cfg-steam-api-key-input')">${l === 'en' ? 'Save' : 'Guardar'}</button></div></div></div>`;
      } else if (appSel.id === 'playstation') {
        const hasTok = !!localStorage.getItem('mediary_psn_npsso');
        extraHtml = `
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.74rem;color:var(--muted);">${l === 'en' ? 'NPSSO Token (Sony)' : 'Token NPSSO (Sony)'}</span>
              <button type="button" onclick="togglePsnNpssoInput()" id="btn-toggle-psn-npsso" style="background:none;border:none;color:#38bdf8;font-size:0.74rem;cursor:pointer;font-weight:600;">${hasTok ? (l === 'en' ? 'Active' : 'Activo') : (l === 'en' ? '+ Configure' : '+ Configurar')}</button>
            </div>
            <div id="cfg-psn-npsso-wrap" style="display:none;margin-top:8px;">
              <div class="app-connect-input-row">
                <input type="text" id="cfg-psn-npsso-input" name="psn_npsso_input" class="form-input" placeholder="${l === 'en' ? 'NPSSO Token' : 'Token NPSSO'}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" style="-webkit-text-security:disc;text-security:disc;" value="${(localStorage.getItem('mediary_psn_npsso') || '').replace(/"/g, '&quot;')}"><button type="button" class="btn-connect-action btn-connect-psn" onclick="guardarPsnNpssoDesdeInput('cfg-psn-npsso-input')">${l === 'en' ? 'Save' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        `;
      }
      manageBox.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;"><div style="display:flex;align-items:center;gap:10px;min-width:0;">${appSel.svg}<div style="min-width:0;"><strong style="font-size:0.86rem;color:var(--text);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${safeUser}</strong></div></div><button type="button" onclick="abrirGestionAppVinculadaConfig(null)" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem;line-height:1;padding:4px;" aria-label="${l === 'en' ? 'Close' : 'Cerrar'}">✕</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"><button type="button" class="btn-spotify-sub-action" style="background:${appSel.bg};color:${appSel.color};border:1px solid ${appSel.color};" onclick="${appSel.syncFn}">${l === 'en' ? 'Sync' : 'Sincronizar'}</button><button type="button" class="btn-spotify-sub-action" style="background:rgba(239,68,68,0.08);color:#f87171;border:1px solid rgba(239,68,68,0.25);" onclick="${appSel.disconnectFn}">${l === 'en' ? 'Disconnect' : 'Desconectar'}</button></div>${extraHtml}`;
      manageBox.style.display = 'block';
    }
  }
}

function toggleOpcionesVinculacionConfig() {
  const panel = document.getElementById('cfg-link-options-panel');
  const btn = document.getElementById('btn-cfg-toggle-link-options');
  if (!panel) return;
  const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang) ? userPrefs.lang : 'es';
  const abrir = panel.style.display === 'none';
  panel.style.display = abrir ? 'flex' : 'none';
  if (btn) {
    btn.textContent = abrir ? (l === 'en' ? 'Close' : 'Cerrar') : (l === 'en' ? '+ Link' : '+ Vincular');
  }
}

function abrirGestionAppVinculadaConfig(serviceId, forzarAbrir = false) {
  if (!serviceId) {
    _cfgAppGestionActiva = null;
  } else if (!forzarAbrir && _cfgAppGestionActiva === serviceId) {
    _cfgAppGestionActiva = null;
  } else {
    _cfgAppGestionActiva = serviceId;
  }
  renderizarAppsVinculadasConfig();
}

function clickAppVinculacionConfig(serviceId) {
  const apps = obtenerEstadoAppsVinculadasConfig();
  const app = apps.find(a => a.id === serviceId);
  if (!app) return;
  if (app.connected) {
    abrirGestionAppVinculadaConfig(serviceId, true);
  } else {
    app.connectFn();
  }
}

function actualizarTarjetasVisualesConfig() {
  migrarTemaLegadoSiEsNecesario();

  // Themes de la App (oculto)
  const curAppTheme = userPrefs.appTheme || 'default';
  document.querySelectorAll('#cfg-app-theme-cards .app-theme-card').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.apptheme === curAppTheme);
  });

  // Selector desplegable de Idioma
  const curLang = userPrefs.lang || 'es';
  const langLabelEl = document.getElementById('cfg-lang-selected-label');
  if (langLabelEl) langLabelEl.textContent = curLang === 'en' ? 'English' : 'Español';
  document.querySelectorAll('#menu-cfg-lang .cfg-dropdown-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === curLang);
  });

  // Selector desplegable de Tipografía
  const curFont = userPrefs.font || "'Lexend', sans-serif";
  const fontLabelEl = document.getElementById('cfg-font-selected-label');
  if (fontLabelEl) {
    fontLabelEl.textContent = CFG_FONT_LABELS[curFont] || 'Lexend';
    fontLabelEl.style.fontFamily = curFont;
  }
  document.querySelectorAll('#menu-cfg-font .cfg-dropdown-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === curFont);
  });

  // Tamaños (predeterminado al medio: 75%)
  const sizeOrder = ['50%', '62%', '75%', '88%', '100%'];
  let curFontSize = userPrefs.fontSize || '75%';
  if (!sizeOrder.includes(curFontSize)) {
    curFontSize = '75%';
    userPrefs.fontSize = '75%';
  }
  const curIdx = Math.max(0, sizeOrder.indexOf(curFontSize));
  const fillEl = document.getElementById('size-line-fill');
  if (fillEl) fillEl.style.width = `${(curIdx / 4) * 100}%`;
  document.querySelectorAll('#cfg-size-slider-box .size-line-node').forEach(node => {
    const nIdx = Number(node.dataset.idx);
    node.classList.toggle('active', nIdx === curIdx);
    node.classList.toggle('reached', nIdx <= curIdx);
  });
  document.querySelectorAll('#cfg-size-labels .size-line-lbl-btn').forEach(lbl => {
    lbl.classList.toggle('active', lbl.dataset.val === curFontSize);
  });

  // Modo de apariencia (Sistema / Claro / Oscuro)
  const mode = userPrefs.themeMode || 'system';
  const btnSys = document.getElementById('btn-mode-system');
  const btnLight = document.getElementById('btn-mode-light');
  const btnDark = document.getElementById('btn-mode-dark');
  if (btnSys) btnSys.classList.toggle('active', mode === 'system');
  if (btnLight) btnLight.classList.toggle('active', mode === 'light');
  if (btnDark) btnDark.classList.toggle('active', mode === 'dark');

  // Los 6 Themes (Cinéfilo, Melómano, Gamer, Lector, Nerd, Otaku)
  const curPersona = userPrefs.personaTheme || 'none';
  const usingPersonaColors = (curPersona !== 'none' && userPrefs.personaThemeColors !== false);
  document.querySelectorAll('#cfg-persona-theme-cards .persona-theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.persona === curPersona);
  });
  const btnResetPersona = document.getElementById('btn-reset-persona-theme');
  if (btnResetPersona) btnResetPersona.style.display = curPersona !== 'none' ? 'inline-flex' : 'none';

  // Los 4 Colores en círculos horizontales
  const curFamily = userPrefs.themeFamily || 'slate';
  document.querySelectorAll('#cfg-theme-cards .theme-family-card').forEach(card => {
    card.classList.toggle('active', !usingPersonaColors && card.dataset.family === curFamily);
  });

  // Tarjeta de aplicaciones y cuentas vinculadas
  renderizarAppsVinculadasConfig();
}

function clickEnLineaTamano(e) {
  const wrap = e.currentTarget;
  const rect = wrap.getBoundingClientRect();
  const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const sizes = ['50%', '62%', '75%', '88%', '100%'];
  const idx = Math.min(4, Math.max(0, Math.round(relX * 4)));
  seleccionarSizeVisual(sizes[idx]);
}

function seleccionarIdiomaVisual(lang) {
  const hidden = document.getElementById('cfg-lang');
  if (hidden) hidden.value = lang;
  userPrefs.lang = lang;
  cerrarDropdownsConfig();
  guardarPreferenciasLocales();
  actualizarTarjetasVisualesConfig();
  cambiarIdiomaEnVivo();
}
function seleccionarUiStyleVisual(style) {
  userPrefs.uiStyle = 'modern'; if (!userPrefs.appTheme) userPrefs.appTheme = 'default';
}
function seleccionarFontVisual(val) {
  const hidden = document.getElementById('cfg-font');
  if (hidden) hidden.value = val;
  try { localStorage.setItem('mediary_user_custom_font', 'true'); } catch (e) {}
  cerrarDropdownsConfig();
  aplicarConfiguracionEnVivo();
  actualizarTarjetasVisualesConfig();
  guardarPreferenciasLocales();
}
function seleccionarSizeVisual(val) {
  const hidden = document.getElementById('cfg-font-size');
  if (hidden) hidden.value = val;
  try { localStorage.setItem('mediary_user_custom_font_size', 'true'); } catch (e) {}
  aplicarConfiguracionEnVivo();
  actualizarTarjetasVisualesConfig();
  guardarPreferenciasLocales();
}

function seleccionarAppThemeVisual(themeKey) {
  if (themeKey === 'playful') {
    const l = userPrefs && userPrefs.lang ? userPrefs.lang : 'es';
    mostrarToastPersonalizado(l === 'en' ? 'Playful theme coming soon! (In stand-by)' : '¡Theme Juguetón próximamente! (En stand by)');
    return;
  }
  userPrefs.appTheme = themeKey;
  const hidden = document.getElementById('cfg-app-theme');
  if (hidden) hidden.value = themeKey;
  aplicarConfiguracionEnVivo();
  actualizarTarjetasVisualesConfig();
  guardarPreferenciasLocales();
}

function seleccionarPersonaTheme(themeId) {
  migrarTemaLegadoSiEsNecesario();
  if (!themeId || themeId === 'none') {
    userPrefs.personaTheme = 'none';
    userPrefs.personaThemeColors = false;
  } else {
    userPrefs.personaTheme = themeId;
    userPrefs.personaThemeColors = true;
  }
  aplicarEstilosGlobales();
  actualizarTarjetasVisualesConfig();
  guardarPreferenciasLocales();
}
window.seleccionarPersonaTheme = seleccionarPersonaTheme;

function seleccionarThemeFamily(family) {
  migrarTemaLegadoSiEsNecesario();
  userPrefs.themeFamily = family;
  userPrefs.personaThemeColors = false;
  if (document.getElementById('cfg-theme')) document.getElementById('cfg-theme').value = family;
  aplicarConfiguracionEnVivo();
  actualizarTarjetasVisualesConfig();
  guardarPreferenciasLocales();
}

function seleccionarThemeMode(mode) {
  migrarTemaLegadoSiEsNecesario();
  userPrefs.themeMode = mode;
  aplicarConfiguracionEnVivo();
  actualizarTarjetasVisualesConfig();
  guardarPreferenciasLocales();
}

function seleccionarThemePill(family, mode) {
  userPrefs.themeFamily = family;
  userPrefs.themeMode = mode;
  if (document.getElementById('cfg-theme')) document.getElementById('cfg-theme').value = family;
  aplicarConfiguracionEnVivo();
  actualizarTarjetasVisualesConfig();
  guardarPreferenciasLocales();
}

function seleccionarThemeVisual(val) {
  if (val && val.includes('-')) {
    const parts = val.split('-');
    seleccionarThemePill(parts[0], parts[1]);
  } else if (val) {
    seleccionarThemeFamily(val);
  }
}

function abrirModalConfiguracion() {
  if (typeof cargarTodasFuentesMediary === 'function') cargarTodasFuentesMediary();
  if (typeof actualizarIndicadorUsoAlmacenamiento === 'function') setTimeout(actualizarIndicadorUsoAlmacenamiento, 50); 
  try {
    cerrarDropdownsConfig();
    _cfgAppGestionActiva = null;
    const linkPanel = document.getElementById('cfg-link-options-panel');
    if (linkPanel) linkPanel.style.display = 'none';
    const linkBtn = document.getElementById('btn-cfg-toggle-link-options');
    if (linkBtn) linkBtn.textContent = (userPrefs && userPrefs.lang === 'en') ? '+ Link' : '+ Vincular';
    if (userPrefs) {
      migrarTemaLegadoSiEsNecesario();
      if (document.getElementById('cfg-lang')) document.getElementById('cfg-lang').value = userPrefs.lang || 'es';
      if (document.getElementById('cfg-font')) document.getElementById('cfg-font').value = userPrefs.font || "'Lexend', sans-serif";
      if (document.getElementById('cfg-font-size')) document.getElementById('cfg-font-size').value = userPrefs.fontSize || '75%';
      if (document.getElementById('cfg-theme')) document.getElementById('cfg-theme').value = userPrefs.themeFamily || 'slate';
      if (document.getElementById('cfg-app-theme')) document.getElementById('cfg-app-theme').value = userPrefs.appTheme || 'default';
    }
    const cvInp = document.getElementById('cfg-comicvine-key');
    if (cvInp) cvInp.value = window.COMICVINE_K || COMICVINE_K || '';
    const mvInp = document.getElementById('cfg-marvel-key');
    if (mvInp) mvInp.value = window.MARVEL_K || MARVEL_K || '';
    const igdbIdInp = document.getElementById('cfg-igdb-client-id');
    if (igdbIdInp) igdbIdInp.value = window.IGDB_CLIENT_ID || IGDB_CLIENT_ID || '';
    const igdbTokInp = document.getElementById('cfg-igdb-token');
    if (igdbTokInp) igdbTokInp.value = window.IGDB_TOKEN || IGDB_TOKEN || '';
    actualizarTarjetasVisualesConfig(); 
    if (typeof sincronizarSwitchesNotificaciones === 'function') sincronizarSwitchesNotificaciones();
    if (typeof actualizarUISpotify === 'function') actualizarUISpotify();
    if (typeof actualizarUISteam === 'function') actualizarUISteam();
    if (typeof actualizarUILastFm === 'function') actualizarUILastFm();
    if (typeof actualizarUIPlayStation === 'function') actualizarUIPlayStation();
    renderizarAppsVinculadasConfig();
    const pwaWrap = document.getElementById('cfg-install-pwa-wrap');
    if (pwaWrap) {
      pwaWrap.style.display = (typeof estaAppYaInstalada === 'function' && estaAppYaInstalada()) ? 'none' : (deferredPwaPrompt ? 'flex' : 'none');
    }
    const modalCfg = document.getElementById('modal-configuracion');
    if (modalCfg) modalCfg.style.display = 'flex';
  } catch(err) {
    console.error('Error al abrir modal configuracion:', err);
  }
}

function aplicarConfiguracionEnVivo() {
  userPrefs.font = document.getElementById('cfg-font').value;
  userPrefs.fontSize = document.getElementById('cfg-font-size').value;
  userPrefs.showEmojis = true;
  aplicarEstilosGlobales();
}

if (window.matchMedia) {
  try {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChangeThemeScheme = () => {
      if (userPrefs && userPrefs.themeMode === 'system') {
        aplicarEstilosGlobales();
        actualizarTarjetasVisualesConfig();
      }
    };
    if (mql.addEventListener) {
      mql.addEventListener('change', onChangeThemeScheme);
    } else if (mql.addListener) {
      mql.addListener(onChangeThemeScheme);
    }
  } catch(e) {}
}
function cambiarIdiomaEnVivo(langOverride) {
  const sel = document.getElementById('cfg-lang');
  if (langOverride === 'es' || langOverride === 'en') {
    if (sel) sel.value = langOverride;
    userPrefs.lang = langOverride;
  } else if (sel) {
    userPrefs.lang = sel.value;
  }
  actualizarTextosInterfaz();
  inicializarSelectoresFechasAproximadas();
  actualizarUISelectorAnio();
  if (typeof actualizarUISpotify === 'function') actualizarUISpotify();
  if (typeof actualizarUISteam === 'function') actualizarUISteam();
  if (typeof actualizarUILastFm === 'function') actualizarUILastFm();
  if (typeof actualizarUIPlayStation === 'function') actualizarUIPlayStation();
  if (typeof actualizarIndicadorUsoAlmacenamiento === 'function') actualizarIndicadorUsoAlmacenamiento();
  renderizarAppsVinculadasConfig();
  const linkPanel = document.getElementById('cfg-link-options-panel');
  const linkBtn = document.getElementById('btn-cfg-toggle-link-options');
  if (linkBtn && linkPanel) {
    const isOpen = linkPanel.style.display !== 'none';
    linkBtn.textContent = isOpen ? tLang('Cerrar', 'Close') : tLang('+ Vincular', '+ Link');
  }
  if (estado.categoria === 'inicio') {
    renderizarResumenInicio();
    renderizarFeedAmigosResumidoInicio();
    if (typeof renderizarEscuchandoAhoraInicio === 'function') renderizarEscuchandoAhoraInicio(false);
    if (typeof renderizarPlayStationNowPlayingInicio === 'function') renderizarPlayStationNowPlayingInicio(false);
  }
  else if (estado.categoria === 'calendario') {
    if (typeof renderizarCalendarioEstrenos === 'function') renderizarCalendarioEstrenos();
  }
  else if (estado.categoria === 'discover') renderizarDiscoverVista();
  else if (estado.categoria === 'amigos') cargarAmigosYSolicitudes(false);
  else if (estado.categoria === 'perfil') { renderizarCabeceraPerfil(); renderizarFavoritosPerfil(); calcularYMostrarEstadisticasPerfil(); }
  else if (estado.categoria === 'listas' || estado.categoria === 'watchlists') {
    if (typeof renderizarWatchlist === 'function') renderizarWatchlist();
  }
  else { renderizarSubtabs(); if (esSubcategoriaWatchlist(estado.subcategoria)) renderizarWatchlist(); else filtrarYMostrarHistorial(); }
  const modalR = document.getElementById('modal-ruleta-amigo');
  if (modalR && modalR.style.display === 'flex' && typeof actualizarVistaCandidatasRuleta === 'function') {
    actualizarBotonesModoRuleta();
    actualizarVistaCandidatasRuleta();
  }
  const modalStats = document.getElementById('modal-estadisticas-avanzadas');
  if (modalStats && modalStats.style.display === 'flex' && typeof renderizarContenidoEstadisticasAvanzadas === 'function') {
    renderizarContenidoEstadisticasAvanzadas();
  }
}
function guardarYCerrarConfiguracion() { 
  try {
    cerrarDropdownsConfig();
    aplicarConfiguracionEnVivo(); 
    if (document.getElementById('cfg-lang')) {
      userPrefs.lang = document.getElementById('cfg-lang').value;
    }
    userPrefs.uiStyle = 'modern'; if (!userPrefs.appTheme) userPrefs.appTheme = 'default';
    guardarPreferenciasLocales();
    const cvInp = document.getElementById('cfg-comicvine-key');
    if (cvInp) {
      window.COMICVINE_K = COMICVINE_K = cvInp.value.trim();
      localStorage.setItem('mediary_comicvine_key', COMICVINE_K);
    }
    const mvInp = document.getElementById('cfg-marvel-key');
    if (mvInp) {
      window.MARVEL_K = MARVEL_K = mvInp.value.trim();
      localStorage.setItem('mediary_marvel_key', MARVEL_K);
    }
    const igdbIdInp = document.getElementById('cfg-igdb-client-id');
    if (igdbIdInp) {
      window.IGDB_CLIENT_ID = IGDB_CLIENT_ID = igdbIdInp.value.trim();
      localStorage.setItem('mediary_igdb_client_id', IGDB_CLIENT_ID);
    }
    const igdbTokInp = document.getElementById('cfg-igdb-token');
    if (igdbTokInp) {
      window.IGDB_TOKEN = IGDB_TOKEN = igdbTokInp.value.trim();
      localStorage.setItem('mediary_igdb_token', IGDB_TOKEN);
    }
    if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
      sincronizarPreferenciasYAppsHaciaNube(true);
    }
    const mCfg = document.getElementById('modal-configuracion');
    if (mCfg) mCfg.style.display = 'none'; 
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? 'Settings saved!' : '¡Configuración guardada!'); 
  } catch(err) {
    console.error('Error al guardar configuracion:', err);
  }
}
function restablecerConfiguracionPorDefecto() {
  try { localStorage.removeItem('mediary_user_custom_font'); } catch (e) {}
  try { localStorage.removeItem('mediary_user_custom_font_size'); } catch (e) {}
  userPrefs = Object.assign(userPrefs || {}, { font: "'Lexend', sans-serif", fontSize: "75%", theme: "slate-dark", themeFamily: "slate", themeMode: "system", appTheme: "default", personaTheme: "none", personaThemeColors: false, uiStyle: "modern", lang: "es" });
  guardarPreferenciasLocales();
  abrirModalConfiguracion();
  aplicarEstilosGlobales();
  actualizarTextosInterfaz();
}

