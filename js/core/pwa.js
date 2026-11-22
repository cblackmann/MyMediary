/* Mediary — js/core/pwa.js */
// === MOTOR STANDALONE WEB / PWA + CONEXIÓN DIRECTA A SUPABASE (SIN DEPENDER DE APPS SCRIPT) ===
var deferredPwaPrompt = null;
window.IS_APPS_SCRIPT = !!(window.google && window.google.script && window.google.script.run);

// === PREVENCIÓN DE AUTOFILL INVASIVO (BRAVE EMAIL ALIASES / BITWARDEN / EXTENSIONES) ===
function desactivarAutofillInvasivo(root) {
  try {
    const contenedor = (root && root.querySelectorAll) ? root : document;
    const selectores = 'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="file"]):not([type="range"]), textarea';
    contenedor.querySelectorAll(selectores).forEach(el => {
      if (el.id === 'auth-input-email' || el.id === 'auth-input-pass') return;
      if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'off');
      if (!el.getAttribute('data-form-type')) el.setAttribute('data-form-type', 'other');
      el.setAttribute('data-lpignore', 'true');
      el.setAttribute('data-1p-ignore', 'true');
      el.setAttribute('data-bwignore', 'true');
    });
  } catch (_) {}
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => desactivarAutofillInvasivo(document));
} else {
  desactivarAutofillInvasivo(document);
}
document.addEventListener('focusin', function(e) {
  const el = e.target;
  if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) return;
  if (el.id === 'auth-input-email' || el.id === 'auth-input-pass') return;
  if (!el.getAttribute('data-form-type')) {
    if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'off');
    el.setAttribute('data-form-type', 'other');
    el.setAttribute('data-lpignore', 'true');
    el.setAttribute('data-1p-ignore', 'true');
    el.setAttribute('data-bwignore', 'true');
  }
}, true);

// Variables y Claves de APIs Globales (accesibles en toda la app)
function estaAppYaInstalada() {
  try {
    if (window.matchMedia && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches
    )) return true;
    if (window.navigator && window.navigator.standalone === true) return true;
    if (document.referrer && (document.referrer.startsWith('android-app://') || document.referrer.includes('android-app:'))) return true;
    if (localStorage.getItem('mediary_pwa_installed') === 'true') return true;
  } catch(e) {}
  return false;
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPwaPrompt = e;
  if (estaAppYaInstalada()) return;
  const wrap = document.getElementById('cfg-install-pwa-wrap');
  if (wrap) wrap.style.display = 'flex';
});

window.addEventListener('appinstalled', () => {
  deferredPwaPrompt = null;
  try { localStorage.setItem('mediary_pwa_installed', 'true'); } catch(_) {}
  const wrap = document.getElementById('cfg-install-pwa-wrap');
  if (wrap) wrap.style.display = 'none';
  const btn = document.getElementById('btn-install-pwa');
  if (btn) btn.style.display = 'none';
  if (typeof mostrarToastPersonalizado === 'function') {
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? ' Mediary installed as an App on your device!' : ' ¡Mediary instalada como App en tu dispositivo!');
  }
});

function instalarAppMediary() {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    deferredPwaPrompt.userChoice.then(choice => {
      if (choice && choice.outcome === 'accepted') {
        try { localStorage.setItem('mediary_pwa_installed', 'true'); } catch(_) {}
        const wrap = document.getElementById('cfg-install-pwa-wrap');
        if (wrap) wrap.style.display = 'none';
      }
      deferredPwaPrompt = null;
    });
  } else {
    mostrarToastPersonalizado(userPrefs && userPrefs.lang === 'en' ? `${getHeroIcon('device-phone-mobile', '', 14)} To install: open your browser menu (⋮ or Share) and select "Install app" or "Add to home screen".` : `${getHeroIcon('device-phone-mobile', '', 14)} Para instalar: abre el menú de tu navegador (⋮ o Compartir) y elige "Instalar aplicación" o "Agregar a pantalla de inicio".`);
  }
}
if (!window.IS_APPS_SCRIPT && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.update().catch(() => {});
    }).catch(() => {});
  });
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
async function limpiarCachePortadasApp() {
  try {
    if ('caches' in window) {
      await caches.delete('mediary-images-v1');
    }
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ action: 'CLEAR_IMAGE_CACHE' });
    }
    await actualizarIndicadorUsoAlmacenamiento();
    const l = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en') ? 'en' : 'es';
    if (typeof mostrarToastPersonalizado === 'function') {
      mostrarToastPersonalizado(l === 'en' ? '🧹 Cover image cache freed successfully!' : '🧹 ¡Caché de portadas liberada correctamente!');
    }
  } catch (err) {
    console.error('Error al limpiar caché de portadas:', err);
  }
}
window.limpiarCachePortadasApp = limpiarCachePortadasApp;

async function actualizarIndicadorUsoAlmacenamiento() {
  const el = document.getElementById('cfg-cache-size-hint');
  if (!el) return;
  const isEn = (typeof userPrefs !== 'undefined' && userPrefs && userPrefs.lang === 'en');
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const mb = ((estimate.usage || 0) / (1024 * 1024)).toFixed(1);
      el.textContent = isEn
        ? `Current disk usage: ~${mb} MB (Lightweight posters and automatic cap active).`
        : `Uso actual en disco: ~${mb} MB (Pósters ligeros y tope automático activo).`;
    } else {
      el.textContent = isEn
        ? 'Optimized with lightweight covers and automatic rotation (max 120 covers).'
        : 'Optimizado con tamaño ligero y rotación automática (máx 120 portadas).';
    }
  } catch (_) {
    el.textContent = isEn
      ? 'Optimized with lightweight covers and automatic rotation (max 120 covers).'
      : 'Optimizado con tamaño ligero y rotación automática (máx 120 portadas).';
  }
}
window.actualizarIndicadorUsoAlmacenamiento = actualizarIndicadorUsoAlmacenamiento;

