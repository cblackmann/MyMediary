/* Mediary — js/features/auth.js */
function abrirModalAuthSupabase(modoInicial = 'login') { cambiarModoModalAuth(modoInicial); const errBox = document.getElementById('auth-error-msg'); if (errBox) errBox.style.display = 'none'; document.getElementById('auth-input-email').value = estado.userEmail || '';
document.getElementById('auth-input-pass').value = ''; document.getElementById('auth-input-nick').value = ''; const btnLogout = document.getElementById('btn-auth-logout'); if (btnLogout) btnLogout.style.display = estado.userEmail ? 'inline-block' : 'none';
const savedBox = document.getElementById('auth-saved-accounts-box'); const savedList = document.getElementById('auth-saved-accounts-list'); try { const cuentas = JSON.parse((localStorage.getItem('Mediary_saved_accounts_v1') || localStorage.getItem('MyMediary_saved_accounts_v1')) || '[]'); if (cuentas.length && savedBox && savedList) {
savedBox.style.display = 'block'; savedList.innerHTML = ''; cuentas.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.className = `subtab-btn ${c.email === estado.userEmail ? 'active' : ''}`;
b.style.cssText = 'padding:5px 10px; font-size:0.76rem; display:inline-flex; align-items:center; gap:5px;';
b.innerHTML = `<span>${c.avatar && !c.avatar.startsWith('data:') && !c.avatar.startsWith('http') ? c.avatar : ''}</span><span>${c.nickname}</span><span style="opacity:0.7; font-size:0.7rem;">(${c.email})</span>`; b.onclick = () => { document.getElementById('auth-input-email').value = c.email;
document.getElementById('auth-input-pass').focus(); }; savedList.appendChild(b); }); } else if (savedBox) { savedBox.style.display = 'none'; }
} catch (e) {}
document.getElementById('modal-auth-supabase').style.display = 'flex'; }
function cerrarModalAuthSupabase() { const p = document.getElementById('auth-input-pass'); if (p) p.value = ''; document.getElementById('modal-auth-supabase').style.display = 'none'; }
function cambiarModoModalAuth(modo) { estado.modoAuthModal = modo; document.getElementById('btn-auth-tab-login')?.classList.toggle('active', modo === 'login'); document.getElementById('btn-auth-tab-registro')?.classList.toggle('active', modo === 'registro');
const grpNick = document.getElementById('auth-group-nick'); if (grpNick) grpNick.style.display = modo === 'registro' ? 'block' : 'none'; const btnSub = document.getElementById('btn-auth-submit');
const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');
if (btnSub) btnSub.textContent = modo === 'registro' ? (isEn ? 'Create Supabase account' : 'Crear cuenta en Supabase') : (isEn ? 'Sign in to my account' : 'Entrar a mi cuenta'); const errBox = document.getElementById('auth-error-msg'); if (errBox) errBox.style.display = 'none'; }
function mostrarErrorAuth(msg) { const errBox = document.getElementById('auth-error-msg'); if (errBox) { errBox.textContent = msg; errBox.style.display = 'block'; }
}
function iniciarFlujoGoogleAuth() { const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en'); const emailEscrito = document.getElementById('auth-input-email').value.trim().toLowerCase(); const passEscrita = document.getElementById('auth-input-pass').value; const txtBtn = document.getElementById('txt-auth-google-btn');
if (txtBtn) txtBtn.textContent = isEn ? 'Connecting with Google...' : 'Conectando con Google... '; google.script.run.withSuccessHandler(res => { if (txtBtn) txtBtn.textContent = isEn ? 'Continue with Google account' : 'Continuar con cuenta de Google'; if (res && res.exito) { aplicarSesionExitosa(res, true); } else if (res && res.necesitaInputGoogle) {
mostrarErrorAuth(isEn ? 'Enter your @gmail.com address below and click "Continue with Google account" again to sign in.' : 'Escribe tu correo @gmail.com en el campo de abajo y vuelve a pulsar "Continuar con cuenta de Google" para entrar.'); document.getElementById('auth-input-email').focus(); } else { mostrarErrorAuth(res?.error || (isEn ? 'Could not connect with Google.' : 'No se pudo conectar con Google.')); }
}).iniciarSesionConGoogle(emailEscrito, passEscrita); }
function enviarFormularioAuthSupabase() { const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en'); const email = document.getElementById('auth-input-email').value.trim().toLowerCase(); const password = document.getElementById('auth-input-pass').value; const nickname = document.getElementById('auth-input-nick').value.trim();
if (!email) return mostrarErrorAuth(isEn ? 'Please enter your email (e.g. user@gmail.com) or username.' : 'Por favor escribe tu correo (ej. usuario@gmail.com) o nombre de usuario.'); const btn = document.getElementById('btn-auth-submit'); const txtOrig = btn.textContent; btn.textContent = isEn ? 'Verifying on Supabase...' : 'Verificando en Supabase... '; btn.disabled = true;
google.script.run.withSuccessHandler(res => { btn.textContent = txtOrig; btn.disabled = false; if (res && res.exito) { aplicarSesionExitosa(res, true); } else { mostrarErrorAuth(res?.error || (isEn ? 'Error authenticating with Supabase.' : 'Error al autenticar con Supabase.')); }
}).withFailureHandler(err => { btn.textContent = txtOrig; btn.disabled = false; mostrarErrorAuth((isEn ? 'Network error: ' : 'Error de red: ') + (err?.message || err)); }).autenticarUsuarioSupabase({ modo: estado.modoAuthModal, email, password, nickname }); }
function cerrarSesionUsuarioActual() { const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en'); estado.userEmail = ''; estado.registros = []; estado.watchlist = [];
perfilUsuario = { nickname: isEn ? 'Guest' : 'Invitado', bio: isEn ? 'Sign in to view your collections in Supabase' : 'Inicia sesión para ver tus colecciones en Supabase ', avatar: '', emailGoogle: '', logueadoGoogle: false, favoritos: {}, favoritosOcultos: {}, portada: 'predeterminada', personajeFavorito: null, cancionFavorita: null };
try { localStorage.removeItem('Mediary_active_user_v1'); localStorage.removeItem('MyMediary_active_user_v1'); localStorage.removeItem('Mediary_perfil_v1'); localStorage.removeItem('MyMediary_perfil_v1'); } catch (e) {}
if (typeof limpiarDatosCuentaEnDispositivo_ === 'function') limpiarDatosCuentaEnDispositivo_();
if (typeof actualizarUISpotify === 'function') actualizarUISpotify();
if (typeof actualizarUILastFm === 'function') actualizarUILastFm();
if (typeof actualizarUIPlayStation === 'function') actualizarUIPlayStation();
if (typeof actualizarUISteam === 'function') actualizarUISteam();
if (typeof renderizarAppsVinculadasConfig === 'function') renderizarAppsVinculadasConfig();
if (typeof renderizarEscuchandoAhoraInicio === 'function') renderizarEscuchandoAhoraInicio(false);
if (typeof renderizarPlayStationNowPlayingInicio === 'function') renderizarPlayStationNowPlayingInicio(false);
renderizarCabeceraPerfil(); if (estado.categoria === 'inicio') renderizarStats(); else if (estado.categoria === 'perfil') { renderizarFavoritosPerfil(); calcularYMostrarEstadisticasPerfil(); }
else if (CONFIG[estado.categoria]) { if (esSubcategoriaWatchlist(estado.subcategoria)) renderizarWatchlist(); else filtrarYMostrarHistorial(); }
document.getElementById('auth-input-email').value = ''; document.getElementById('auth-input-pass').value = ''; document.getElementById('btn-auth-logout').style.display = 'none'; mostrarToastPersonalizado(isEn ? 'Signed out. You can log in with another account.' : 'Sesión cerrada. Puedes ingresar con otra cuenta.'); }
function conectarCuentaGoogle() { abrirModalAuthSupabase('login'); }
function ejecutarMigracionSheetsASupabase() { const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en'); if (!estado.userEmail) { abrirModalAuthSupabase('login'); return alert(isEn ? 'Please sign in first to migrate your Google Sheets data.' : 'Primero inicia sesión en tu cuenta para migrar tus datos de Google Sheets a ella.'); }
const btn = document.getElementById('btn-migrar-sheets'); const txtOrig = btn ? btn.textContent : ''; if (btn) { btn.textContent = isEn ? 'Migrating from Google Sheets to Supabase...' : ' Migrando desde Google Sheets a Supabase...'; btn.disabled = true; }
google.script.run.withSuccessHandler(res => { if (btn) { btn.textContent = txtOrig; btn.disabled = false; }
if (res && res.exito) { sincronizarPerfilDesdeServidor(); cargarRegistros(); cargarWatchlist(); mostrarToastPersonalizado(isEn ? `Migration successful! ${res.registrosMigrados} records and ${res.watchlistMigrados} watchlist items copied to Supabase.` : ` ¡Migración exitosa! ${res.registrosMigrados} registros y ${res.watchlistMigrados} pendientes copiados a Supabase.`); } else {
alert((isEn ? 'Migration error: ' : 'Error en la migración: ') + (res?.error || (isEn ? 'Unknown' : 'Desconocido'))); }
}).withFailureHandler(err => { if (btn) { btn.textContent = txtOrig; btn.disabled = false; }
alert((userPrefs.lang === 'en' ? 'Error migrating: ' : 'Error al migrar: ') + (err?.message || err)); }).migrarDatosSheetsASupabase(estado.userEmail); }
