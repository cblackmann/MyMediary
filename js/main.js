/* Mediary — js/main.js */
window.onload = () => {
  const pAuthInit = document.getElementById('auth-input-pass');
  if (pAuthInit) pAuthInit.value = '';

  if (typeof reposicionarIndicadorNavMovil === 'function') {
    reposicionarIndicadorNavMovil(null, false);
  }
  precargarDiscoverEnSegundoPlano(1);
  iniciarLoopAutoActualizacionDiscover();
  if (typeof inicializarSistemaNotificaciones === 'function') {
    inicializarSistemaNotificaciones();
  }
  if (typeof procesarRetornoSpotifyAuth === 'function') {
    procesarRetornoSpotifyAuth();
  }
  if (typeof procesarRetornoSteamAuth === 'function') {
    procesarRetornoSteamAuth();
  }

  // Sincronización integrada de datos en segundo plano silencioso
  recargarYSincronizarApp(false);

  // Inicializar pull-to-refresh para recarga manual fluida en móviles
  if (typeof inicializarPullToRefresh === 'function') {
    inicializarPullToRefresh();
  }

  // Inicializar navegación por swipe y scroll horizontal entre pestañas principales
  if (typeof inicializarNavegacionHorizontalTabs === 'function') {
    inicializarNavegacionHorizontalTabs();
  }

  // Detección automática en boot de discos completados
  setTimeout(() => {
    if (typeof verificarYMostrarPromptDiscoCompletado === 'function') {
      verificarYMostrarPromptDiscoCompletado();
    }
  }, 1200);
};
inicializarLongPressAvatares();

inicializarEventosBuscadores();
if (typeof actualizarUILastFm === 'function') {
  try { actualizarUILastFm(); } catch (_) {}
}

function inicializarAppInmediata() {
  // 1. Cargar preferencias locales, tema, fuentes, textos y perfil sincrónicamente
  cargarPreferenciasLocales();
  const pAuthInit = document.getElementById('auth-input-pass');
  if (pAuthInit) pAuthInit.value = '';

  // 2. Cargar registros y watchlists desde la caché local sin esperar a la red
  if (typeof cargarRegistros === 'function') {
    cargarRegistros();
  }
  if (typeof cargarWatchlist === 'function') {
    cargarWatchlist();
  }

  // 3. Restaurar la última pestaña activa guardada o renderizar inicio por defecto
  const restauroPestana = (typeof restaurarPestanaGuardada === 'function') && restaurarPestanaGuardada();
  if (!restauroPestana) {
    if (typeof renderizarResumenInicio === 'function') {
      renderizarResumenInicio();
    }
    if (typeof renderizarFeedAmigosResumidoInicio === 'function') {
      renderizarFeedAmigosResumidoInicio();
    }
  }

  // 4. Posicionar la píldora de navegación móvil de inmediato SIN animación
  if (typeof reposicionarIndicadorNavMovil === 'function') {
    reposicionarIndicadorNavMovil(null, false);
  }

  // 5. Gestos e interacciones esenciales
  if (typeof inicializarGestosSwipeDownModales === 'function') {
    inicializarGestosSwipeDownModales();
  }
  if (typeof inicializarManejoBotonAtras === 'function') {
    inicializarManejoBotonAtras();
  }
  if (typeof inicializarSelectoresFechasAproximadas === 'function') {
    inicializarSelectoresFechasAproximadas();
  }
  if (typeof programarVerificacionAnioNuevo === 'function') {
    programarVerificacionAnioNuevo();
  }

  // Quitar la supresión de transiciones de arranque tras el renderizado inicial instantáneo
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('preload-no-transition');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAppInmediata);
} else {
  inicializarAppInmediata();
}

