/* Mediary — js/features/profile.js */
let avatarCropperState = {
  img: null,
  canvas: null,
  ctx: null,
  stageSize: 280,
  scale: 1,
  minScale: 1,
  maxScale: 4,
  offsetX: 140,
  offsetY: 140,
  rotation: 0,
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
  initialTouchDist: 0,
  initialScale: 1,
  eventsAttached: false
};
let avatarSeleccionadoTemp = null;

function procesarSubidaFotoPerfil(e) {
  const file = e.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => abrirModalRecorteAvatar(img);
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function abrirModalRecorteAvatar(imgObj) {
  avatarCropperState.img = imgObj;
  avatarCropperState.rotation = 0;
  const canvas = document.getElementById('canvas-crop-avatar');
  if (!canvas) return;
  avatarCropperState.canvas = canvas;
  avatarCropperState.ctx = canvas.getContext('2d');
  
  const stageSize = 280;
  canvas.width = stageSize;
  canvas.height = stageSize;
  avatarCropperState.stageSize = stageSize;
  
  centrarAvatarCropper(true);
  
  const modal = document.getElementById('modal-recortar-avatar');
  if (modal) modal.style.display = 'flex';
  
  conectarEventosCropperAvatar();
  redibujarCropperAvatar();
}

function cerrarModalRecorteAvatar() {
  const modal = document.getElementById('modal-recortar-avatar');
  if (modal) modal.style.display = 'none';
  avatarCropperState.img = null;
}

function obtenerDimensionesRotadas(img, rot) {
  const isRotated = (rot % 180 !== 0);
  return {
    w: isRotated ? img.naturalHeight : img.naturalWidth,
    h: isRotated ? img.naturalWidth : img.naturalHeight
  };
}

function centrarAvatarCropper(resetScale = false) {
  const img = avatarCropperState.img;
  if (!img) return;
  const { w, h } = obtenerDimensionesRotadas(img, avatarCropperState.rotation);
  const S = avatarCropperState.stageSize;
  
  const coverScale = Math.max(S / w, S / h);
  avatarCropperState.minScale = Math.max(0.2, coverScale * 0.7);
  avatarCropperState.maxScale = Math.max(coverScale * 4, 3.5);
  
  if (resetScale || avatarCropperState.scale < avatarCropperState.minScale) {
    avatarCropperState.scale = coverScale;
  }
  
  avatarCropperState.offsetX = S / 2;
  avatarCropperState.offsetY = S / 2;
  
  actualizarSliderZoomAvatar();
  redibujarCropperAvatar();
}

function redibujarCropperAvatar() {
  const { canvas, ctx, img, scale, offsetX, offsetY, rotation, stageSize } = avatarCropperState;
  if (!canvas || !ctx || !img) return;
  
  ctx.save();
  ctx.clearRect(0, 0, stageSize, stageSize);
  
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, stageSize, stageSize);
  
  ctx.translate(offsetX, offsetY);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();
}

function actualizarSliderZoomAvatar() {
  const slider = document.getElementById('slider-crop-avatar-zoom');
  if (!slider) return;
  slider.min = avatarCropperState.minScale;
  slider.max = avatarCropperState.maxScale;
  slider.step = ((avatarCropperState.maxScale - avatarCropperState.minScale) / 100).toFixed(4);
  slider.value = avatarCropperState.scale;
}

function onCambiarZoomSliderAvatar(val) {
  avatarCropperState.scale = Math.max(avatarCropperState.minScale, Math.min(avatarCropperState.maxScale, val));
  redibujarCropperAvatar();
}

function ajustarZoomAvatar(delta) {
  const nuevo = avatarCropperState.scale + delta * (avatarCropperState.maxScale - avatarCropperState.minScale);
  onCambiarZoomSliderAvatar(nuevo);
  actualizarSliderZoomAvatar();
}

function rotarAvatarCropper(grados = 90) {
  avatarCropperState.rotation = (avatarCropperState.rotation + grados) % 360;
  centrarAvatarCropper(false);
}

function conectarEventosCropperAvatar() {
  if (avatarCropperState.eventsAttached) return;
  avatarCropperState.eventsAttached = true;
  
  const stage = document.getElementById('avatar-cropper-stage');
  if (!stage) return;
  
  stage.addEventListener('mousedown', e => {
    e.preventDefault();
    avatarCropperState.dragging = true;
    avatarCropperState.dragStartX = e.clientX - avatarCropperState.offsetX;
    avatarCropperState.dragStartY = e.clientY - avatarCropperState.offsetY;
  });
  
  window.addEventListener('mousemove', e => {
    if (!avatarCropperState.dragging) return;
    avatarCropperState.offsetX = e.clientX - avatarCropperState.dragStartX;
    avatarCropperState.offsetY = e.clientY - avatarCropperState.dragStartY;
    redibujarCropperAvatar();
  });
  
  window.addEventListener('mouseup', () => {
    avatarCropperState.dragging = false;
  });
  
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    avatarCropperState.scale = Math.max(avatarCropperState.minScale, Math.min(avatarCropperState.maxScale, avatarCropperState.scale * factor));
    actualizarSliderZoomAvatar();
    redibujarCropperAvatar();
  }, { passive: false });
  
  stage.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      avatarCropperState.dragging = true;
      avatarCropperState.dragStartX = e.touches[0].clientX - avatarCropperState.offsetX;
      avatarCropperState.dragStartY = e.touches[0].clientY - avatarCropperState.offsetY;
    } else if (e.touches.length === 2) {
      avatarCropperState.dragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      avatarCropperState.initialTouchDist = Math.hypot(dx, dy);
      avatarCropperState.initialScale = avatarCropperState.scale;
    }
  }, { passive: false });
  
  stage.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && avatarCropperState.dragging) {
      avatarCropperState.offsetX = e.touches[0].clientX - avatarCropperState.dragStartX;
      avatarCropperState.offsetY = e.touches[0].clientY - avatarCropperState.dragStartY;
      redibujarCropperAvatar();
    } else if (e.touches.length === 2 && avatarCropperState.initialTouchDist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / avatarCropperState.initialTouchDist;
      avatarCropperState.scale = Math.max(avatarCropperState.minScale, Math.min(avatarCropperState.maxScale, avatarCropperState.initialScale * ratio));
      actualizarSliderZoomAvatar();
      redibujarCropperAvatar();
    }
  }, { passive: false });
  
  stage.addEventListener('touchend', e => {
    if (e.touches.length === 0) {
      avatarCropperState.dragging = false;
      avatarCropperState.initialTouchDist = 0;
    } else if (e.touches.length === 1) {
      avatarCropperState.dragging = true;
      avatarCropperState.dragStartX = e.touches[0].clientX - avatarCropperState.offsetX;
      avatarCropperState.dragStartY = e.touches[0].clientY - avatarCropperState.offsetY;
      avatarCropperState.initialTouchDist = 0;
    }
  });
}

function confirmarRecorteAvatar() {
  const { img, scale, offsetX, offsetY, rotation, stageSize } = avatarCropperState;
  if (!img) return;
  
  const outSize = 360;
  const factor = outSize / stageSize;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = outSize;
  outCanvas.height = outSize;
  const outCtx = outCanvas.getContext('2d');
  
  outCtx.fillStyle = '#090d16';
  outCtx.fillRect(0, 0, outSize, outSize);
  
  outCtx.translate(offsetX * factor, offsetY * factor);
  outCtx.rotate((rotation * Math.PI) / 180);
  outCtx.scale(scale * factor, scale * factor);
  outCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  
  const dataUrl = outCanvas.toDataURL('image/jpeg', 0.9);
  avatarSeleccionadoTemp = dataUrl;
  
  const prevBox = document.getElementById('crop-confirmed-preview');
  const prevImg = document.getElementById('crop-confirmed-img');
  if (prevImg) prevImg.src = dataUrl;
  if (prevBox) prevBox.style.display = 'flex';
  
  document.querySelectorAll('#avatar-presets-box .avatar-preset-btn').forEach(b => b.classList.remove('selected'));
  
  cerrarModalRecorteAvatar();
  mostrarToastPersonalizado(userPrefs.lang === 'en' ? ' 1:1 crop ready. Click "Save Profile" to apply.' : ' Recorte 1:1 listo. Pulsa "Guardar Perfil" para aplicar.');
}

function quitarFotoPersonalizada() {
  avatarSeleccionadoTemp = '🦊';
  const prevBox = document.getElementById('crop-confirmed-preview');
  if (prevBox) prevBox.style.display = 'none';
  document.querySelectorAll('#avatar-presets-box .avatar-preset-btn').forEach(b => {
    b.classList.toggle('selected', b.textContent === '🦊');
  });
}

// ==========================================
// SISTEMA DE PORTADAS DE PERFIL
// ==========================================
const PORTADAS_DISPONIBLES = [
 {
 id: 'predeterminada',
 nombre: 'Predeterminada',
 nombreEn: 'Default',
 icono: '✨',
 descripcion: 'Diseño limpio y sobrio adaptado al tema visual activo de Mediary.',
 descripcionEn: 'Clean and sleek design adapted to your active Mediary visual theme.',
 previewClass: 'cover-predeterminada',
 gradientePreview: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))'
 },
 {
 id: 'espacio',
 nombre: '1. Espacio & Cosmos',
 nombreEn: '1. Space & Cosmos',
 icono: '🌌',
 descripcion: 'Universo estelar profundo con nebulosa cósmica violeta/azul y constelaciones.',
 descripcionEn: 'Deep starry universe with violet/blue cosmic nebula and constellations.',
 previewClass: 'cover-espacio',
 gradientePreview: 'radial-gradient(ellipse at 30% 20%, rgba(168,85,247,0.45) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(56,189,248,0.4) 0%, transparent 55%), #050816'
 },
 {
 id: 'arcade',
 nombre: '2. Gaming / Arcade Retro',
 nombreEn: '2. Retro Gaming / Arcade',
 icono: '🕹️',
 descripcion: 'Estética synthwave 80s con rejilla neón magenta y cian retro-futurista.',
 descripcionEn: '80s synthwave aesthetic with retro-futuristic magenta and cyan neon grid.',
 previewClass: 'cover-arcade',
 gradientePreview: 'linear-gradient(180deg, #130924 0%, #2a0845 55%, #f43f5e 100%)'
 },
 {
 id: 'bosque',
 nombre: '3. Bosque con Río',
 nombreEn: '3. Forest & River',
 icono: '🌲',
 descripcion: 'Naturaleza viva con follaje esmeralda profundo, destellos y agua cristalina.',
 descripcionEn: 'Vibrant nature with deep emerald foliage, sparkles, and crystal-clear water.',
 previewClass: 'cover-bosque',
 gradientePreview: 'linear-gradient(145deg, #06231a 0%, #0d4432 50%, #115e59 100%)'
 },
 {
 id: 'castillo',
 nombre: '4. Castillo de Fantasía',
 nombreEn: '4. Fantasy Castle',
 icono: '🏰',
 descripcion: 'Reino místico crepuscular con torres doradas, aurora y magia medieval.',
 descripcionEn: 'Mystic twilight kingdom with golden towers, aurora, and medieval magic.',
 previewClass: 'cover-castillo',
 gradientePreview: 'linear-gradient(140deg, #1a0b2e 0%, #3b135c 45%, #6b21a8 80%, #d97706 100%)'
 }
];

function esPortadaImagenPersonalizada(cover) {
  return typeof cover === 'string' && (cover.startsWith('data:image/') || cover.startsWith('http://') || cover.startsWith('https://'));
}

function obtenerPortadaActual() {
  return perfilUsuario?.portada || perfilUsuario?.preferencias?.portada || perfilUsuario?.favoritos?.portada || 'predeterminada';
}

function aplicarPortadaEnHeroCard(targetElId = 'perfil-hero-card', idCover = null) {
  const el = typeof targetElId === 'string' ? document.getElementById(targetElId) : targetElId;
  if (!el) return;
  const cover = (idCover !== null && idCover !== undefined) ? idCover : obtenerPortadaActual();
  PORTADAS_DISPONIBLES.forEach(p => el.classList.remove(`cover-${p.id}`));
  el.classList.remove('has-custom-cover', 'has-custom-image-cover');

  if (esPortadaImagenPersonalizada(cover)) {
    el.classList.add('has-custom-cover', 'has-custom-image-cover');
    el.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.72)), url("${cover}")`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
  } else if (cover && cover !== 'predeterminada') {
    el.style.backgroundImage = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundRepeat = '';
    el.classList.add(`cover-${cover}`, 'has-custom-cover');
  } else {
    el.style.backgroundImage = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundRepeat = '';
    el.classList.add('cover-predeterminada');
  }
}

function abrirModalElegirPortada() {
  renderizarOpcionesPortadas();
  const m = document.getElementById('modal-elegir-portada');
  if (m) m.style.display = 'flex';
}

function cerrarModalElegirPortada() {
  const m = document.getElementById('modal-elegir-portada');
  if (m) m.style.display = 'none';
}

function procesarSubidaPortadaCustom(inputEl) {
  if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
  const archivo = inputEl.files[0];
  if (!archivo.type || !archivo.type.startsWith('image/')) {
    mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Please select an image file' : 'Por favor selecciona un archivo de imagen');
    inputEl.value = '';
    return;
  }

  const lector = new FileReader();
  lector.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      try {
        const maxAncho = 1200;
        const maxAlto = 675;
        let w = img.width;
        let h = img.height;
        if (w > maxAncho || h > maxAlto) {
          const ratio = Math.min(maxAncho / w, maxAlto / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        seleccionarPortadaPerfil(dataUrl);
      } catch (err) {
        console.error('Error al redimensionar portada personalizada:', err);
        seleccionarPortadaPerfil(e.target.result);
      }
      inputEl.value = '';
    };
    img.onerror = function() {
      mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Could not read image file' : 'No se pudo leer el archivo de imagen');
      inputEl.value = '';
    };
    img.src = e.target.result;
  };
  lector.onerror = function() {
    mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Could not read image file' : 'No se pudo leer el archivo de imagen');
    inputEl.value = '';
  };
  lector.readAsDataURL(archivo);
}

function quitarPortadaPersonalizada() {
  seleccionarPortadaPerfil('predeterminada');
}

function renderizarOpcionesPortadas() {
  const c = document.getElementById('profile-covers-options-list');
  if (!c) return;
  const actual = obtenerPortadaActual();
  const esCustom = esPortadaImagenPersonalizada(actual);

  let customActiveHtml = '';
  if (esCustom) {
    customActiveHtml = `
      <div class="cover-option-card active selected has-custom-image-cover" style="grid-column: 1 / -1; margin-bottom: 8px;">
        <div class="cover-preview-stage" style="background: linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.65)), url('${actual}') center/cover no-repeat; min-height: 90px; border-radius: 4px; position:relative;">
          <div class="cover-selected-badge">${tLang('✓ Activa', '✓ Active')}</div>
        </div>
        <div class="cover-meta-wrap" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <strong class="cover-name-txt" data-i18n="profile_cover_custom_title">${tLang('Portada personalizada', 'Custom Cover')}</strong>
            <p class="cover-desc-txt" data-i18n="profile_cover_custom_desc">${tLang('Tu foto subida para la tarjeta superior de tu perfil.', 'Your uploaded photo for your profile header card.')}</p>
          </div>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn-today-pill" style="font-size:0.75rem; padding:4px 10px; margin:0;" onclick="document.getElementById('input-subir-portada-custom').click()" data-i18n="btn_change_photo">${tLang('Cambiar', 'Change')}</button>
            <button type="button" class="btn-modal-cancel" style="font-size:0.75rem; padding:4px 10px; border-color:rgba(239,68,68,0.4); color:#f87171;" onclick="quitarPortadaPersonalizada()" data-i18n="profile_cover_remove_btn">${tLang('Quitar portada', 'Remove cover')}</button>
          </div>
        </div>
      </div>
    `;
  }

  const uploadCtaHtml = `
    <div class="cover-option-card cover-upload-card" onclick="document.getElementById('input-subir-portada-custom').click()" style="cursor:pointer; border:1.5px dashed var(--accent); background:rgba(var(--accent-rgb, 56,189,248), 0.05); transition:all 0.18s ease; ${esCustom ? 'display:none;' : ''}">
      <div class="cover-preview-stage" style="background:linear-gradient(135deg, rgba(var(--accent-rgb, 56,189,248), 0.15), rgba(99,102,241,0.15)); display:grid; place-items:center; min-height:85px;">
        <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;color:var(--accent);"><path d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"/></svg>
      </div>
      <div class="cover-meta-wrap">
        <strong class="cover-name-txt" style="color:var(--accent);" data-i18n="profile_cover_upload_action">${tLang('Subir foto personalizada', 'Upload custom photo')}</strong>
        <p class="cover-desc-txt" data-i18n="profile_cover_upload_hint">${tLang('Sube una imagen desde tu dispositivo (JPG, PNG o WebP)', 'Upload an image from your device (JPG, PNG or WebP)')}</p>
      </div>
    </div>
  `;

  const presetsHtml = PORTADAS_DISPONIBLES.map(p => {
    const isAct = (!esCustom && p.id === actual);
    return `
      <div class="cover-option-card ${isAct ? 'active selected' : ''}" onclick="seleccionarPortadaPerfil('${p.id}')">
        <div class="cover-preview-stage ${p.previewClass}" style="background:${p.gradientePreview};">
          <div style="font-size:1.85rem; text-shadow:0 2px 8px rgba(0,0,0,0.6);">${p.icono}</div>
          ${isAct ? `<div class="cover-selected-badge">${tLang('✓ Activa', '✓ Active')}</div>` : ''}
        </div>
        <div class="cover-meta-wrap">
          <strong class="cover-name-txt">${tLang(p.nombre, p.nombreEn)}</strong>
          <p class="cover-desc-txt">${tLang(p.descripcion, p.descripcionEn)}</p>
        </div>
      </div>
    `;
  }).join('');

  c.innerHTML = customActiveHtml + uploadCtaHtml + presetsHtml;
}

function seleccionarPortadaPerfil(idCover) {
  perfilUsuario.portada = idCover;
  if (!perfilUsuario.preferencias) perfilUsuario.preferencias = {};
  perfilUsuario.preferencias.portada = idCover;
  if (!perfilUsuario.favoritos) perfilUsuario.favoritos = {};
  perfilUsuario.favoritos.portada = idCover;
  guardarPerfilLocal();
  aplicarPortadaEnHeroCard('perfil-hero-card', idCover);
  renderizarOpcionesPortadas();

  const esImg = esPortadaImagenPersonalizada(idCover);
  const pObj = PORTADAS_DISPONIBLES.find(x => x.id === idCover);
  const pNom = esImg ? tLang('Personalizada', 'Custom') : (pObj ? tLang(pObj.nombre, pObj.nombreEn) : idCover);
  mostrarToastPersonalizado(userPrefs.lang === 'en' ? `Cover "${pNom}" applied` : `Portada "${pNom}" aplicada`);

  if (typeof SERVER_API !== 'undefined' && SERVER_API.guardarPerfilUsuario && estado.userEmail) {
    SERVER_API.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
  }
  if (window.google?.script?.run) {
    google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
  }
  if (typeof sincronizarPreferenciasYAppsHaciaNube === 'function') {
    sincronizarPreferenciasYAppsHaciaNube(true);
  }
}

// ==========================================
// SLOT DESTACADO: CANCIÓN FAVORITA CON MUESTRA DE AUDIO
// ==========================================
let _audioMuestraCancionFav = null;
let _audioCancionUrlActual = null;
let _btnMuestraCancionActual = null;
let debounceTimerSong = null;
window.resultadosCancionesCache = [];

function toggleReproducirMuestraCancion(url, btnEl) {
  const l = userPrefs?.lang || 'es';
  if (!url) {
    mostrarToastPersonalizado(l === 'en' ? 'No audio preview available for this song.' : 'No hay muestra de audio disponible para esta canción.');
    return;
  }
  if (_audioMuestraCancionFav) {
    if (_audioCancionUrlActual === url) {
      if (!_audioMuestraCancionFav.paused) {
        _audioMuestraCancionFav.pause();
        actualizarTodosIconosPlay(false);
        return;
      } else {
        _audioMuestraCancionFav.play().catch(e => console.warn(e));
        _btnMuestraCancionActual = btnEl;
        actualizarTodosIconosPlay(true);
        return;
      }
    } else {
      _audioMuestraCancionFav.pause();
      _audioMuestraCancionFav = null;
      actualizarTodosIconosPlay(false);
    }
  }
  _audioCancionUrlActual = url;
  _btnMuestraCancionActual = btnEl;
  _audioMuestraCancionFav = new Audio(url);
  actualizarTodosIconosPlay(true);
  _audioMuestraCancionFav.onended = () => {
    actualizarTodosIconosPlay(false);
  };
  _audioMuestraCancionFav.onerror = () => {
    actualizarTodosIconosPlay(false);
    mostrarToastPersonalizado(l === 'en' ? 'Could not play audio preview.' : 'No se pudo reproducir la muestra de audio.');
  };
  _audioMuestraCancionFav.play().catch(e => {
    console.warn(e);
    actualizarTodosIconosPlay(false);
  });
}

function actualizarIconoPlayAudio(btnEl, isPlaying) {
  if (!btnEl) return;
  const icon = btnEl.querySelector('.icon-play-state');
  if (isPlaying) {
    btnEl.classList.add('playing');
    if (icon) {
      icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
      icon.style.marginLeft = '0px';
    }
  } else {
    btnEl.classList.remove('playing');
    if (icon) {
      icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
      icon.style.marginLeft = '2px';
    }
  }
}

function actualizarTodosIconosPlay(isPlaying) {
  document.querySelectorAll('.btn-play-song-badge, .btn-song-play-main, .btn-preview-listen').forEach(b => {
    actualizarIconoPlayAudio(b, false);
  });
  if (isPlaying && _btnMuestraCancionActual) {
    actualizarIconoPlayAudio(_btnMuestraCancionActual, true);
    const parentCard = _btnMuestraCancionActual.closest('.profile-fav-song-card, .song-result-item');
    if (parentCard) {
      parentCard.querySelectorAll('.btn-play-song-badge, .btn-song-play-main, .btn-preview-listen').forEach(b => {
        actualizarIconoPlayAudio(b, true);
      });
    }
  }
}

function renderizarCancionFavorita() {
  const cont = document.getElementById('perfil-song-card-container');
  if (!cont) return;
  const song = perfilUsuario?.cancionFavorita || perfilUsuario?.favoritos?.cancionFavorita || null;
  const l = userPrefs?.lang || 'es';

  if (!song || !song.titulo) {
    cont.innerHTML = `
      <div class="fav-song-empty-box" onclick="abrirModalSeleccionarCancionFavorita()" title="${l === 'en' ? 'Click to choose your favorite song' : 'Click para elegir tu canción favorita'}" style="padding:10px 12px; border-radius:6px; display:flex; align-items:center; justify-content:space-between; gap:12px; cursor:pointer; background:transparent; border:1px dashed var(--border);">
        <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
          <div class="fav-song-empty-icon" style="width:38px; height:38px; border-radius:50%; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.35); display:grid; place-items:center; color:#10b981; flex-shrink:0;">
            <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
          </div>
          <div style="min-width:0; flex:1;">
            <div style="font-weight:700; font-size:0.85rem; color:var(--text);">
              ${l === 'en' ? 'Choose your Favorite Song' : 'Elige tu Canción Favorita'}
            </div>
            <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">
              ${l === 'en' ? 'Showcase your soundtrack with a 30s audio preview' : 'Destaca la canción de tu vida con muestra de audio'}
            </div>
          </div>
        </div>
        <button type="button" class="btn-choose-char-cta" onclick="event.stopPropagation(); abrirModalSeleccionarCancionFavorita()" style="font-size:0.75rem; padding:4px 10px; display:inline-flex; align-items:center; gap:4px; border-radius:4px; border:1px solid var(--border); background:var(--card); color:var(--text); cursor:pointer;">
          <span>+</span> <span>${l === 'en' ? 'Choose' : 'Elegir'}</span>
        </button>
      </div>
    `;
    return;
  }

  let urlPosterCancion = song.poster || '';
  if (typeof optimizarUrlPoster === 'function') {
    urlPosterCancion = optimizarUrlPoster(urlPosterCancion, 'thumb');
  }
  if (urlPosterCancion && urlPosterCancion.includes('.jpgjpg')) {
    urlPosterCancion = urlPosterCancion.replace(/\.jpgjpg+/gi, '.jpg');
  }
  if (song.poster && song.poster !== urlPosterCancion && song.poster.includes('.jpgjpg')) {
    song.poster = urlPosterCancion;
    try { localStorage.setItem('mediary_perfil_v1', JSON.stringify(perfilUsuario)); } catch(e) {}
  }
  const esImg = urlPosterCancion && (urlPosterCancion.startsWith('http') || urlPosterCancion.startsWith('data:'));
  cont.innerHTML = `
    <div class="profile-fav-song-card" style="padding:6px 0; border-radius:0; margin-bottom:0; position:relative;">
      <div class="fav-song-main-row" style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
        <div style="display:flex; align-items:center; gap:14px; min-width:0; flex:1;">
          <div class="fav-song-cover-box" style="width:54px; height:54px; min-width:54px; max-width:54px; border-radius:8px; overflow:hidden; border:2px solid #10b981; box-shadow:0 0 12px rgba(16,185,129,0.25); position:relative; flex-shrink:0; background:var(--bg);">
            ${esImg ? `<img loading="lazy" decoding="async" src="${urlPosterCancion}" alt="${song.titulo}" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.onerror=null;this.parentElement.innerHTML='🎵';">` : `<div style="width:100%; height:100%; display:grid; place-items:center; font-size:1.6rem;">🎵</div>`}
            ${song.previewUrl ? `
              <button type="button" class="btn-play-song-badge" onclick="event.stopPropagation(); toggleReproducirMuestraCancion('${song.previewUrl}', this)" title="${l === 'en' ? 'Play audio preview' : 'Reproducir muestra'}" aria-label="Reproducir muestra" style="position:absolute; inset:0; margin:auto; width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,0.65); border:1.5px solid #10b981; color:#fff; display:grid; place-items:center; cursor:pointer; backdrop-filter:blur(3px);">
                <svg class="icon-play-state" viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;margin-left:2px;"><path d="M8 5v14l11-7z"/></svg>
              </button>
            ` : ''}
          </div>
          <div class="fav-song-text-block" style="flex:1; min-width:0;">
            <h4 class="fav-song-title-txt" style="font-size:1rem; font-weight:800; color:var(--text); line-height:1.25; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:0;" title="${song.titulo}">${song.titulo}</h4>
            <div class="fav-song-artist-txt" style="font-size:0.8rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:3px;" title="${song.artista || ''}">
              <span style="opacity:0.75;">${l === 'en' ? 'By:' : 'De:'}</span> <strong>${song.artista || 'Artista'}</strong>
              ${song.album ? ` · <span style="opacity:0.8;">${song.album}</span>` : ''}
            </div>
            ${song.previewUrl ? `
              <div style="font-size:0.72rem; color:#10b981; display:flex; align-items:center; gap:4px; margin-top:3px; font-weight:600;">
                <svg class="h-icon" viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px;"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                <span>${l === 'en' ? 'Audio sample (30s)' : 'Muestra de audio (30s)'}</span>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="fav-song-actions-wrap" style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          ${song.previewUrl ? `
            <button type="button" class="btn-song-action-icon btn-song-play-main" onclick="toggleReproducirMuestraCancion('${song.previewUrl}', this)" title="${l === 'en' ? 'Play audio preview' : 'Reproducir muestra'}" aria-label="Reproducir muestra">
              <svg class="icon-play-state" viewBox="0 0 24 24" fill="currentColor" style="width:15px;height:15px;color:#10b981;"><path d="M8 5v14l11-7z"/></svg>
            </button>
          ` : ''}
          <button type="button" class="btn-song-action-icon" onclick="abrirModalSeleccionarCancionFavorita()" title="${l === 'en' ? 'Change song' : 'Cambiar canción'}" aria-label="Cambiar canción">
            <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>
          </button>
          <button type="button" class="btn-song-action-icon btn-song-delete" onclick="abrirModalConfirmarQuitarCancion()" title="${l === 'en' ? 'Remove song' : 'Quitar canción'}" aria-label="Quitar canción">
            <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function abrirModalSeleccionarCancionFavorita() {
  const m = document.getElementById('modal-seleccionar-cancion');
  if (!m) return;
  cambiarTabSelectorCancion('online');
  const btnQuitar = document.getElementById('btn-quitar-cancion-fav');
  const tieneCancion = !!(perfilUsuario?.cancionFavorita && perfilUsuario.cancionFavorita.titulo);
  if (btnQuitar) btnQuitar.style.display = tieneCancion ? 'inline-flex' : 'none';
  const inp = document.getElementById('input-buscar-cancion-online');
  if (inp && !inp.value.trim()) {
    cargarCancionesSugeridasIniciales();
  }
  m.style.display = 'flex';
}

function cerrarModalSeleccionarCancionFavorita() {
  const m = document.getElementById('modal-seleccionar-cancion');
  if (m) m.style.display = 'none';
}

function cambiarTabSelectorCancion(tab) {
  const tabs = ['online', 'misobras', 'manual'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-song-${t}`);
    const pane = document.getElementById(`tab-song-content-${t}`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (pane) pane.style.display = (t === tab) ? 'block' : 'none';
  });
  if (tab === 'misobras') {
    cargarCancionesDeMisRegistros();
  }
}

async function cargarCancionesSugeridasIniciales() {
  const resBox = document.getElementById('song-search-results');
  if (!resBox) return;
  const loading = document.getElementById('song-search-loading');
  if (loading) loading.style.display = 'block';
  resBox.innerHTML = '';
  try {
    const resp = await fetch('https://itunes.apple.com/search?term=Queen+Bohemian+Rhapsody&entity=song&limit=10');
    const data = await resp.json();
    if (loading) loading.style.display = 'none';
    if (data.results && data.results.length) {
      renderizarResultadosBusquedaCancion(data.results);
    }
  } catch (e) {
    if (loading) loading.style.display = 'none';
  }
}

async function ejecutarBuscarCancionOnline(query) {
  const q = (query || document.getElementById('input-buscar-cancion-online')?.value || '').trim();
  const resBox = document.getElementById('song-search-results');
  const loading = document.getElementById('song-search-loading');
  if (!resBox) return;
  if (!q) {
    cargarCancionesSugeridasIniciales();
    return;
  }
  if (loading) loading.style.display = 'block';
  resBox.innerHTML = '';
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=15`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (loading) loading.style.display = 'none';
    if (!data.results || !data.results.length) {
      resBox.innerHTML = `<div style="padding:24px; text-align:center; color:var(--muted); font-size:0.85rem;">${tLang(`No se encontraron canciones para "${q}". Intenta con otro término o artista.`, `No songs found for "${q}". Try another search term or artist.`)}</div>`;
      return;
    }
    renderizarResultadosBusquedaCancion(data.results);
  } catch (err) {
    if (loading) loading.style.display = 'none';
    resBox.innerHTML = `<div style="padding:24px; text-align:center; color:var(--muted); font-size:0.85rem;">${tLang(`Error al buscar canciones en línea: ${err.message || err}. Puedes ingresarla en la pestaña Personalizada.`, `Error searching songs online: ${err.message || err}. You can enter it manually in the Custom tab.`)}</div>`;
  }
}

function renderizarResultadosBusquedaCancion(items) {
  const resBox = document.getElementById('song-search-results');
  if (!resBox) return;
  const l = userPrefs?.lang || 'es';
  window.resultadosCancionesCache = items;
  resBox.innerHTML = items.map((it, idx) => {
    const tit = it.trackName || tLang('Sin título', 'Untitled');
    const art = it.artistName || tLang('Artista desconocido', 'Unknown artist');
    const alb = it.collectionName || '';
    const img = it.artworkUrl100 ? it.artworkUrl100.replace('100x100bb', '300x300bb') : '';
    const prev = it.previewUrl || '';
    return `
      <div class="song-result-item" style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px; border-radius:8px; border:1px solid var(--border); background:var(--card); transition:var(--tr);">
        <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
          <div style="width:48px; height:48px; min-width:48px; border-radius:6px; overflow:hidden; position:relative; background:var(--bg); flex-shrink:0;">
            ${img ? `<img loading="lazy" decoding="async" src="${img}" alt="${tit}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.parentElement.innerHTML='🎵';">` : `<div style="width:100%;height:100%;display:grid;place-items:center;">🎵</div>`}
            ${prev ? `
              <button type="button" class="btn-preview-listen" onclick="event.stopPropagation(); toggleReproducirMuestraCancion('${prev}', this)" title="${l === 'en' ? 'Listen preview' : 'Escuchar muestra'}" style="position:absolute; inset:0; margin:auto; width:26px; height:26px; border-radius:50%; background:rgba(0,0,0,0.65); border:1px solid #10b981; color:#fff; display:grid; place-items:center; cursor:pointer;">
                <svg class="icon-play-state" viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px;margin-left:2px;"><path d="M8 5v14l11-7z"/></svg>
              </button>
            ` : ''}
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:0.88rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${tit}</div>
            <div style="font-size:0.75rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">
              <span>${art}</span> ${alb ? `· <span style="opacity:0.8;">${alb}</span>` : ''}
            </div>
            ${prev ? `
              <div style="font-size:0.68rem; color:#10b981; margin-top:2px; font-weight:600;">
                ▶ ${l === 'en' ? '30s Preview available' : 'Muestra 30s disponible'}
              </div>
            ` : ''}
          </div>
        </div>
        <button type="button" class="btn-save" style="margin:0; width:auto; padding:6px 14px; font-size:0.78rem; flex-shrink:0;" onclick="seleccionarCancionCatalogo(${idx})">
          ${l === 'en' ? 'Choose' : 'Elegir'}
        </button>
      </div>
    `;
  }).join('');
}

function seleccionarCancionCatalogo(idx) {
  const it = window.resultadosCancionesCache ? window.resultadosCancionesCache[idx] : null;
  if (!it) return;
  const songObj = {
    titulo: it.trackName || tLang('Sin título', 'Untitled'),
    artista: it.artistName || tLang('Artista desconocido', 'Unknown artist'),
    album: it.collectionName || '',
    poster: it.artworkUrl100 ? it.artworkUrl100.replace('100x100bb', '500x500bb') : '',
    previewUrl: it.previewUrl || '',
    anio: it.releaseDate ? it.releaseDate.substring(0, 4) : ''
  };
  asignarCancionFavorita(songObj);
}

function cargarCancionesDeMisRegistros() {
  const box = document.getElementById('song-misobras-list');
  if (!box) return;
  const l = userPrefs?.lang || 'es';
  const regs = (estado.registros || []).filter(r => r.categoria === 'Musica');
  if (!regs.length) {
    box.innerHTML = `<div style="padding:20px; text-align:center; color:var(--muted); font-size:0.84rem;">${l === 'en' ? 'You have no registered songs in Mediary yet. Use online search above!' : 'No tienes registros en Música todavía. ¡Busca en línea arriba!'}</div>`;
    return;
  }
  const vistos = new Set();
  box.innerHTML = regs.map((r) => {
    const k = (r.titulo || '').toLowerCase().trim();
    if (vistos.has(k)) return '';
    vistos.add(k);
    return `
      <div class="song-result-item" style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px; border-radius:8px; border:1px solid var(--border); background:var(--card); transition:var(--tr);">
        <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
          <div style="width:48px; height:48px; min-width:48px; border-radius:6px; overflow:hidden; background:var(--bg); flex-shrink:0;">
            ${r.poster ? `<img loading="lazy" decoding="async" src="${r.poster}" alt="${r.titulo}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="width:100%; height:100%; display:grid; place-items:center; font-size:1.4rem;">🎵</div>`}
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:0.88rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.titulo}</div>
            <div style="font-size:0.75rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">
              <span>${r.creador || ''}</span> ${r.subcategoria ? `· <span style="opacity:0.8;">${r.subcategoria}</span>` : ''}
            </div>
          </div>
        </div>
        <button type="button" class="btn-save" style="margin:0; width:auto; padding:6px 14px; font-size:0.78rem; flex-shrink:0;" onclick="seleccionarCancionDeRegistro('${r.id}')">
          ${l === 'en' ? 'Choose' : 'Elegir'}
        </button>
      </div>
    `;
  }).filter(Boolean).join('');
}

async function seleccionarCancionDeRegistro(regId) {
  const r = (estado.registros || []).find(x => x.id === regId);
  if (!r) return;
  const l = userPrefs?.lang || 'es';
  let prevUrl = '';
  let posterFinal = r.poster || '';
  let albumFinal = r.subcategoria || '';
  try {
    const q = `${r.titulo} ${r.creador || ''}`.trim();
    const resp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=3`);
    const data = await resp.json();
    if (data.results && data.results.length > 0) {
      const match = data.results[0];
      prevUrl = match.previewUrl || '';
      if (!posterFinal && match.artworkUrl100) posterFinal = match.artworkUrl100.replace('100x100bb', '500x500bb');
      if (!albumFinal) albumFinal = match.collectionName || '';
    }
  } catch (e) {
    console.warn(e);
  }
  const songObj = {
    titulo: r.titulo,
    artista: r.creador || '',
    album: albumFinal,
    poster: posterFinal,
    previewUrl: prevUrl,
    anio: r.anio || ''
  };
  asignarCancionFavorita(songObj);
}

function actualizarPreviewCancionManual() {
  // Can be expanded if needed
}

async function buscarMuestraParaCancionManual() {
  const tit = document.getElementById('input-song-manual-titulo')?.value.trim();
  const art = document.getElementById('input-song-manual-artista')?.value.trim();
  const l = userPrefs?.lang || 'es';
  if (!tit) {
    mostrarToastPersonalizado(l === 'en' ? 'Enter a song title first.' : 'Escribe primero el título de la canción.');
    return;
  }
  mostrarToastPersonalizado(l === 'en' ? 'Searching sample in iTunes...' : 'Buscando muestra en iTunes...');
  try {
    const q = `${tit} ${art}`.trim();
    const resp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=3`);
    const data = await resp.json();
    if (data.results && data.results.length > 0) {
      const match = data.results[0];
      if (match.previewUrl) {
        document.getElementById('input-song-manual-audio').value = match.previewUrl;
      }
      if (!document.getElementById('input-song-manual-poster').value && match.artworkUrl100) {
        document.getElementById('input-song-manual-poster').value = match.artworkUrl100.replace('100x100bb', '500x500bb');
      }
      mostrarToastPersonalizado(l === 'en' ? 'Sample found!' : '¡Muestra de audio encontrada!');
    } else {
      mostrarToastPersonalizado(l === 'en' ? 'No preview sample found in iTunes.' : 'No se encontró muestra en iTunes.');
    }
  } catch (e) {
    mostrarToastPersonalizado(l === 'en' ? 'Error searching iTunes.' : 'Error al buscar en iTunes.');
  }
}

function guardarCancionManual() {
  const tit = document.getElementById('input-song-manual-titulo')?.value.trim();
  const art = document.getElementById('input-song-manual-artista')?.value.trim();
  const alb = document.getElementById('input-song-manual-album')?.value.trim();
  const img = document.getElementById('input-song-manual-poster')?.value.trim();
  const aud = document.getElementById('input-song-manual-audio')?.value.trim();
  const l = userPrefs?.lang || 'es';
  if (!tit || !art) {
    mostrarToastPersonalizado(l === 'en' ? 'Title and artist are required.' : 'El título y artista son requeridos.');
    return;
  }
  const songObj = {
    titulo: tit,
    artista: art,
    album: alb || '',
    poster: img || '',
    previewUrl: aud || ''
  };
  asignarCancionFavorita(songObj);
}

function asignarCancionFavorita(songObj) {
  if (!perfilUsuario) perfilUsuario = {};
  perfilUsuario.cancionFavorita = songObj;
  if (!perfilUsuario.favoritos) perfilUsuario.favoritos = {};
  perfilUsuario.favoritos.cancionFavorita = songObj;
  if (!perfilUsuario.preferencias) perfilUsuario.preferencias = {};
  perfilUsuario.preferencias.cancionFavorita = songObj;
  guardarPerfilLocal();
  renderizarCancionFavorita();
  cerrarModalSeleccionarCancionFavorita();
  if (typeof google !== 'undefined' && google.script?.run && estado.userEmail) {
    google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
  }
  const l = userPrefs?.lang || 'es';
  mostrarToastPersonalizado(l === 'en' ? `"${songObj.titulo}" set as favorite song 🎵` : `"${songObj.titulo}" guardada como tu canción favorita 🎵`);
}

function abrirModalConfirmarQuitarCancion() {
  const m = document.getElementById('modal-confirmar-quitar-cancion');
  if (m) m.style.display = 'flex';
}

function cerrarModalConfirmarQuitarCancion() {
  const m = document.getElementById('modal-confirmar-quitar-cancion');
  if (m) m.style.display = 'none';
}

function ejecutarQuitarCancionFavorita() {
  if (perfilUsuario) {
    perfilUsuario.cancionFavorita = null;
    if (perfilUsuario.favoritos) delete perfilUsuario.favoritos.cancionFavorita;
    if (perfilUsuario.preferencias) perfilUsuario.preferencias.cancionFavorita = null;
    guardarPerfilLocal();
    renderizarCancionFavorita();
    if (typeof google !== 'undefined' && google.script?.run && estado.userEmail) {
      google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
    }
  }
  cerrarModalConfirmarQuitarCancion();
  cerrarModalSeleccionarCancionFavorita();
  if (_audioMuestraCancionFav && !_audioMuestraCancionFav.paused) {
    _audioMuestraCancionFav.pause();
    _audioMuestraCancionFav = null;
    actualizarTodosIconosPlay(false);
  }
  const l = userPrefs?.lang || 'es';
  mostrarToastPersonalizado(l === 'en' ? 'Favorite song removed' : 'Canción favorita retirada');
}
window.abrirModalSeleccionarCancionFavorita = abrirModalSeleccionarCancionFavorita;
window.cerrarModalSeleccionarCancionFavorita = cerrarModalSeleccionarCancionFavorita;
window.cambiarTabSelectorCancion = cambiarTabSelectorCancion;
window.ejecutarBuscarCancionOnline = ejecutarBuscarCancionOnline;
window.seleccionarCancionCatalogo = seleccionarCancionCatalogo;
window.seleccionarCancionDeRegistro = seleccionarCancionDeRegistro;
window.asignarCancionFavorita = asignarCancionFavorita;
window.toggleReproducirMuestraCancion = toggleReproducirMuestraCancion;
window.abrirModalConfirmarQuitarCancion = abrirModalConfirmarQuitarCancion;
window.cerrarModalConfirmarQuitarCancion = cerrarModalConfirmarQuitarCancion;
window.ejecutarQuitarCancionFavorita = ejecutarQuitarCancionFavorita;
window.guardarCancionManual = guardarCancionManual;
window.buscarMuestraParaCancionManual = buscarMuestraParaCancionManual;

// ==========================================
// SLOT DESTACADO: PERSONAJE FAVORITO
// ==========================================
let debounceTimerChar = null;
let obraSeleccionadaParaChar = null;

function renderizarPersonajeFavorito() {
  const cont = document.getElementById('perfil-character-card-container');
  if (!cont) return;
  const char = perfilUsuario?.personajeFavorito || perfilUsuario?.favoritos?.personajeFavorito || null;
  const l = userPrefs?.lang || 'es';

  if (!char || !char.nombre) {
    cont.innerHTML = `
      <div class="fav-char-empty-box" onclick="abrirModalSeleccionarPersonaje()" title="${l === 'en' ? 'Click to choose your favorite character' : 'Click para elegir tu personaje favorito'}" style="padding:10px 12px; border-radius:6px; display:flex; align-items:center; justify-content:space-between; gap:12px; cursor:pointer; background:transparent; border:1px dashed var(--border);">
        <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
          <div class="fav-char-empty-icon" style="width:36px; height:36px; border-radius:50%; background:var(--card); border:1px dashed var(--border); display:grid; place-items:center; color:var(--muted); flex-shrink:0;">
            <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M16.5 18.75h-9m9 0a3 3 0 0 1 3-3h1.5a1.5 1.5 0 0 0 1.5-1.5v-1.125c0-.828-.672-1.5-1.5-1.5H18m-1.5 7.125v1.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5v-1.5m0 0a3 3 0 0 1-3-3H4.5A1.5 1.5 0 0 1 3 13.125V12c0-.828.672-1.5 1.5-1.5H6m10.5 8.25H7.5m9-8.25V4.875A1.875 1.875 0 0 0 14.625 3H9.375A1.875 1.875 0 0 0 7.5 4.875V10.5a4.5 4.5 0 0 0 9 0Z"/></svg>
          </div>
          <div style="min-width:0; flex:1;">
            <div style="font-weight:700; font-size:0.85rem; color:var(--text);">
              ${l === 'en' ? 'Choose your Favorite Character' : 'Elige tu Personaje Favorito'}
            </div>
            <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">
              ${l === 'en' ? 'Highlight your hero or cultural icon' : 'Destaca a tu personaje predilecto en tu perfil'}
            </div>
          </div>
        </div>
        <button type="button" class="btn-choose-char-cta" onclick="event.stopPropagation(); abrirModalSeleccionarPersonaje()" style="font-size:0.75rem; padding:4px 10px; display:inline-flex; align-items:center; gap:4px; border-radius:4px; border:1px solid var(--border); background:var(--card); color:var(--text); cursor:pointer;">
          <span>+</span> <span>${l === 'en' ? 'Choose' : 'Elegir'}</span>
        </button>
      </div>
    `;
    return;
  }

  const esImg = char.imagen && (char.imagen.startsWith('http') || char.imagen.startsWith('data:'));
  cont.innerHTML = `
    <div class="profile-fav-char-card" style="padding:6px 0; border-radius:0; margin-bottom:0; position:relative;">
      <div class="fav-char-main-row" style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
        <div style="display:flex; align-items:center; gap:14px; min-width:0; flex:1;">
          <div class="fav-char-avatar-box" style="width:54px; height:54px; min-width:54px; max-width:54px; border-radius:50%; overflow:hidden; border:2px solid #f59e0b; box-shadow:0 0 12px rgba(245,158,11,0.25); display:grid; place-items:center; flex-shrink:0;">
            ${esImg ? `<img loading="lazy" decoding="async" src="${char.imagen}" alt="${char.nombre}" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.onerror=null;this.parentElement.innerHTML='👤';">` : `<span style="font-size:1.6rem;">${char.imagen || '👤'}</span>`}
          </div>
          <div class="fav-char-text-block" style="flex:1; min-width:0;">
            <h4 class="fav-char-name-txt" style="font-size:1rem; font-weight:800; color:var(--text); line-height:1.25; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:0;" title="${char.nombre}">${char.nombre}</h4>
            <div class="fav-char-work-txt" style="font-size:0.8rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:3px;" title="${char.obra || ''}">
              <span style="opacity:0.75;">${l === 'en' ? 'From:' : 'De:'}</span> <strong>${char.obra || 'Obra predilecta'}</strong>
            </div>
            ${char.cita ? `<div class="fav-char-quote-txt" style="font-size:0.76rem; color:#f59e0b; font-style:italic; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:3px;" title="${char.cita}">“${char.cita}”</div>` : ''}
          </div>
        </div>
        <div class="fav-char-actions-wrap" style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <button type="button" class="btn-char-action-icon" onclick="abrirModalSeleccionarPersonaje()" title="${l === 'en' ? 'Change character' : 'Cambiar personaje'}" aria-label="Cambiar personaje">
            <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>
          </button>
          <button type="button" class="btn-char-action-icon btn-char-delete" onclick="abrirModalConfirmarQuitarPersonaje()" title="${l === 'en' ? 'Remove character' : 'Quitar personaje'}" aria-label="Quitar personaje">
            <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

const PERSONAJES_CATALOGO_CURADO = [
 { nombre: 'Batman / Bruce Wayne', obra: 'DC Comics · Cómics & Cine', obraEn: 'DC Comics · Comics & Film', imagen: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Batman_in_Justice_League_TV_series.png/330px-Batman_in_Justice_League_TV_series.png', categoria: 'comics' },
 { nombre: 'Son Goku', obra: 'Dragon Ball · Anime & Manga', obraEn: 'Dragon Ball · Anime & Manga', imagen: 'https://s4.anilist.co/file/anilistcdn/character/large/246-wsRRr6z1kii8.png', categoria: 'anime' },
 { nombre: 'Monkey D. Luffy', obra: 'One Piece · Anime & Manga', obraEn: 'One Piece · Anime & Manga', imagen: 'https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png', categoria: 'anime' },
 { nombre: 'Spider-Man / Peter Parker', obra: 'Marvel · Cómics & Cine', obraEn: 'Marvel · Comics & Film', imagen: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/Spiderman_%282714533036%29.jpg/330px-Spiderman_%282714533036%29.jpg', categoria: 'comics' },
 { nombre: 'Walter White', obra: 'Breaking Bad · Serie de TV', obraEn: 'Breaking Bad · TV Series', imagen: 'https://thumb.wikimedia.org/wikipedia/en/thumb/0/03/Walter_White_S5B.png/330px-Walter_White_S5B.png', categoria: 'cine' },
 { nombre: 'Geralt de Rivia', nombreEn: 'Geralt of Rivia', obra: 'The Witcher · Videojuegos & Saga', obraEn: 'The Witcher · Video Games & Saga', imagen: 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/c9/Geralt_of_Rivia_Witcher_3.png/330px-Geralt_of_Rivia_Witcher_3.png', categoria: 'juegos' },
 { nombre: 'Arthur Morgan', obra: 'Red Dead Redemption 2 · Videojuegos', obraEn: 'Red Dead Redemption 2 · Video Games', imagen: 'https://thumb.wikimedia.org/wikipedia/en/thumb/e/e0/Arthur_Morgan_RDR2.jpg/330px-Arthur_Morgan_RDR2.jpg', categoria: 'juegos' },
 { nombre: 'Joel Miller', obra: 'The Last of Us · Videojuegos & Serie', obraEn: 'The Last of Us · Video Games & Series', imagen: 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/46/Video_Game_Cover_-_The_Last_of_Us.jpg/330px-Video_Game_Cover_-_The_Last_of_Us.jpg', categoria: 'juegos' },
 { nombre: 'Darth Vader', obra: 'Star Wars · Saga Galáctica', obraEn: 'Star Wars · Galactic Saga', imagen: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/76/Darth_Vader_%285042831388%29.jpg/330px-Darth_Vader_%285042831388%29.jpg', categoria: 'cine' },
 { nombre: 'Satoru Gojo', obra: 'Jujutsu Kaisen · Anime & Manga', obraEn: 'Jujutsu Kaisen · Anime & Manga', imagen: 'https://s4.anilist.co/file/anilistcdn/character/large/b127691-9zqh1xpIubn7.png', categoria: 'anime' },
 { nombre: 'Levi Ackerman', obra: 'Shingeki no Kyojin · Anime & Manga', obraEn: 'Attack on Titan · Anime & Manga', imagen: 'https://s4.anilist.co/file/anilistcdn/character/large/b45627-CR68RyZmddGG.png', categoria: 'anime' },
 { nombre: 'Joker', obra: 'DC Comics · Cómics & Cine', obraEn: 'DC Comics · Comics & Film', imagen: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/Cosplay_of_The_Joker_at_MCM_London_Comic_Con.jpg/330px-Cosplay_of_The_Joker_at_MCM_London_Comic_Con.jpg', categoria: 'comics' }
];

window.resultadosPersonajesCache = [];
let filtroCategoriaPersonajesActivo = 'todos';

function abrirModalSeleccionarPersonaje() {
 const m = document.getElementById('modal-seleccionar-personaje');
 if (!m) return;
 cambiarTabSelectorPersonaje('online');
 const btnQuitar = document.getElementById('btn-quitar-personaje-fav');
 const tieneChar = !!(perfilUsuario?.personajeFavorito && perfilUsuario.personajeFavorito.nombre);
 if (btnQuitar) btnQuitar.style.display = tieneChar ? 'inline-flex' : 'none';
 cargarCatalogoPersonajesIniciales();
 m.style.display = 'flex';
}

function cerrarModalSeleccionarPersonaje() {
 const m = document.getElementById('modal-seleccionar-personaje');
 if (m) m.style.display = 'none';
}

function cambiarTabSelectorPersonaje(tab) {
 const tabs = ['online', 'manual', 'misobras'];
 tabs.forEach(t => {
 document.getElementById(`tab-char-${t}`)?.classList.toggle('active', t === tab);
 const pane = document.getElementById(`tab-char-content-${t}`);
 if (pane) pane.style.display = (t === tab) ? 'block' : 'none';
 });
 if (tab === 'online') {
 if (!window.resultadosPersonajesCache || !window.resultadosPersonajesCache.length) {
 cargarCatalogoPersonajesIniciales();
 }
 } else if (tab === 'misobras') {
 cargarObrasParaPersonaje();
 } else if (tab === 'manual') {
 actualizarPreviewPersonajeManual();
 }
}

function cargarCatalogoPersonajesIniciales() {
 const input = document.getElementById('input-buscar-personaje-online');
 if (input) input.value = '';
 filtrarCatalogoPersonajes('todos');
}

function filtrarCatalogoPersonajes(cat) {
 filtroCategoriaPersonajesActivo = cat;
 ['todos', 'anime', 'comics', 'juegos', 'cine'].forEach(c => {
 const btn = document.getElementById(`char-filter-${c}`);
 if (btn) btn.classList.toggle('active', c === cat);
 });
 const filtrados = (cat === 'todos')
 ? PERSONAJES_CATALOGO_CURADO
 : PERSONAJES_CATALOGO_CURADO.filter(p => p.categoria === cat);
 window.resultadosPersonajesCache = filtrados;
 renderizarResultadosBusquedaPersonaje(filtrados, '');
}

function ejecutarBuscarPersonajeOnline() {
 const input = document.getElementById('input-buscar-personaje-online');
 const q = String(input ? input.value : '').trim();
 if (q.length < 2) {
 cargarCatalogoPersonajesIniciales();
 return;
 }
 buscarPersonajeEnVivo(q);
}

function debouncedBuscarPersonaje(val) {
 clearTimeout(debounceTimerChar);
 const q = String(val || '').trim();
 if (q.length < 2) {
 cargarCatalogoPersonajesIniciales();
 return;
 }
 const loadEl = document.getElementById('char-search-loading');
 if (loadEl) loadEl.style.display = 'block';
 debounceTimerChar = setTimeout(() => {
 buscarPersonajeEnVivo(q);
 }, 450);
}

async function buscarPersonajeEnVivo(query) {
 const loadEl = document.getElementById('char-search-loading');
 const resBox = document.getElementById('char-search-results');
 if (loadEl) loadEl.style.display = 'block';
 try {
 const qEnc = encodeURIComponent(query);
 const items = [];
 const seenNames = new Set();

 const addUnique = (nom, obra, img, fuente = '') => {
 const nomNorm = String(nom || '').trim();
 if (!nomNorm) return;
 const key = nomNorm.toLowerCase();
 if (seenNames.has(key)) return;
 seenNames.add(key);
 items.push({
 nombre: nomNorm,
 obra: String(obra || tLang('Personaje de Ficción', 'Fictional Character')).trim(),
 imagen: String(img || '').trim(),
 cita: '',
 fuente
 });
 };

 // 1. Coincidencias en el catálogo curado
 const qLow = query.toLowerCase();
 PERSONAJES_CATALOGO_CURADO.forEach(p => {
 if (p.nombre.toLowerCase().includes(qLow) || p.obra.toLowerCase().includes(qLow)) {
 addUnique(p.nombre, p.obra, p.imagen, tLang('Destacado', 'Featured'));
 }
 });

 // 2. AniList GraphQL (ÚNICA Y EXCLUSIVAMENTE PERSONAJES DE FICCIÓN)
 const fetchAniList = async () => {
 try {
 const queryGql = `query ($search: String) {
 Page(page: 1, perPage: 8) {
 characters(search: $search) {
 id
 name { full userPreferred native }
 image { large medium }
 media(perPage: 1) {
 nodes {
 title { userPreferred english native }
 }
 }
 }
 }
 }`;
 const resp = await fetch('https://graphql.anilist.co', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
 body: JSON.stringify({ query: queryGql, variables: { search: query } }),
 signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(4500) : undefined
 });
 if (!resp.ok) return;
 const data = await resp.json();
 const chars = data?.data?.Page?.characters || [];
 chars.forEach(c => {
 const nom = c.name?.userPreferred || c.name?.full || '';
 const obra = c.media?.nodes?.[0]?.title?.userPreferred || c.media?.nodes?.[0]?.title?.english || 'Anime / Manga';
 const img = c.image?.large || c.image?.medium || '';
 if (nom) addUnique(nom, `${obra} · Anime`, img, 'AniList');
 });
 } catch (eAni) {}
 };

 // 3. Wikipedia API (Filtro estricto: SÓLO PERSONAJES, DESCARTAR PELÍCULAS Y ÁLBUMES)
 const fetchWikipedia = async () => {
 try {
 const isEnWiki = getLang_() === 'en';
 const wikiSub = isEnWiki ? 'en' : 'es';
 const searchSuffix = isEnWiki ? ' character' : ' personaje';
 const url = `https://${wikiSub}.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(query + searchSuffix)}&gsrlimit=8&prop=pageimages|description&piprop=thumbnail&pithumbsize=300`;
 const resp = await fetch(url, {
 signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(4500) : undefined
 });
 if (!resp.ok) return;
 const data = await resp.json();
 const pages = Object.values(data.query?.pages || {});
 pages.forEach(p => {
 const title = p.title || '';
 const desc = (p.description || '').toLowerCase();
 const titLow = title.toLowerCase();

 // Excluir si es explícitamente una película, serie completa, álbum o videojuego
 if (titLow.includes('(película') || titLow.includes('(serie') || titLow.includes('(álbum') || titLow.includes('(videojuego') || titLow.includes('(film') || titLow.includes('(album') || titLow.includes('(video game')) return;
 if (desc.includes('película de') || desc.includes('serie de televisión') || desc.includes('videojuego de') || desc.includes('film directed') || desc.includes('television series')) return;

 // Aceptar si la descripción o título es de personaje
 const esPersonaje = desc.includes('personaje') || desc.includes('superhéroe') || desc.includes('supervillano') || desc.includes('protagonista') || desc.includes('ficticio') || titLow.includes('(personaje)')
   || desc.includes('character') || desc.includes('superhero') || desc.includes('supervillain') || desc.includes('protagonist') || desc.includes('fictional') || titLow.includes('(character)');
 if (esPersonaje) {
 const nomLimpio = title.replace(/\s*\([^)]*\)/g, '').trim();
 const obraTxt = p.description || tLang('Personaje de Ficción', 'Fictional Character');
 const img = p.thumbnail?.source || '';
 addUnique(nomLimpio, obraTxt, img, 'Wikipedia');
 }
 });
 } catch (eWiki) {}
 };

 await Promise.allSettled([fetchAniList(), fetchWikipedia()]);

 window.resultadosPersonajesCache = items;
 renderizarResultadosBusquedaPersonaje(items, query);
 } catch (err) {
 if (resBox) {
 resBox.innerHTML = `<div style="text-align:center; padding:20px; color:#f87171; font-size:0.84rem; grid-column:1/-1;">${tLang('Error al buscar personajes. Puedes usar la pestaña "Crear a mi gusto" para añadirlo directamente.', 'Error searching characters. You can use the "Custom" tab to add one directly.')}</div>`;
 }
 } finally {
 if (loadEl) loadEl.style.display = 'none';
 }
}

function renderizarResultadosBusquedaPersonaje(items, query) {
 const resBox = document.getElementById('char-search-results');
 if (!resBox) return;
 if (!items || !items.length) {
 resBox.innerHTML = `
 <div style="text-align:center; padding:28px 14px; color:var(--muted); font-size:0.86rem; grid-column:1/-1;">
 ${tLang(`No se encontró ningún personaje específico para "<strong>${query}</strong>".`, `No specific character found for "<strong>${query}</strong>".`)}<br>
 <span style="font-size:0.78rem; opacity:0.8; display:inline-block; margin-top:6px;">
 ${tLang('¿No está en la lista? ¡Agrégalo tú mismo en la pestaña <strong>"Crear a mi gusto"</strong> con su foto y universo!', 'Not on the list? Add them yourself in the <strong>"Custom"</strong> tab with their photo and universe!')}
 </span>
 </div>
 `;
 return;
 }

 resBox.innerHTML = items.map((c, idx) => {
 const esImg = c.imagen && (c.imagen.startsWith('http') || c.imagen.startsWith('data:'));
 const charNom = getLang_() === 'en' ? (c.nombreEn || c.nombre) : c.nombre;
 const charObra = getLang_() === 'en' ? (c.obraEn || c.obra) : c.obra;
 return `
 <div class="char-result-card" onclick="seleccionarPersonajePorIndice(${idx})">
 <div class="char-result-avatar">
 ${esImg ? `<img src="${c.imagen}" alt="${charNom}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='';">` : `<span></span>`}
 </div>
 <div class="char-result-info">
 <strong class="char-result-name">${charNom}</strong>
 <span class="char-result-origin">${charObra}</span>
 </div>
 <button type="button" class="btn-select-char-pill">${tLang('Elegir', 'Choose')}</button>
 </div>
 `;
 }).join('');
}

function manejarSubidaFotoPersonaje(e) {
 const file = e.target.files?.[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = function(event) {
 const img = new Image();
 img.onload = function() {
 const canvas = document.createElement('canvas');
 const maxDim = 320;
 let w = img.width, h = img.height;
 if (w > h) {
 if (w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
 } else {
 if (h > maxDim) { w = Math.round(h * maxDim / h); h = maxDim; }
 }
 canvas.width = w;
 canvas.height = h;
 const ctx = canvas.getContext('2d');
 ctx.drawImage(img, 0, 0, w, h);
 const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

 const inpImg = document.getElementById('input-char-manual-imagen');
 if (inpImg) inpImg.value = dataUrl;
 actualizarPreviewPersonajeManual();
 };
 img.src = event.target.result;
 };
 reader.readAsDataURL(file);
}

function actualizarPreviewPersonajeManual() {
 const nom = document.getElementById('input-char-manual-nombre')?.value.trim();
 const obra = document.getElementById('input-char-manual-obra')?.value.trim();
 const img = document.getElementById('input-char-manual-imagen')?.value.trim();
 const cita = document.getElementById('input-char-manual-cita')?.value.trim();

 const prevName = document.getElementById('preview-char-name');
 const prevWork = document.getElementById('preview-char-work');
 const prevBox = document.getElementById('preview-char-avatar-box');
 const prevQuote = document.getElementById('preview-char-quote');

 if (prevName) prevName.textContent = nom || tLang('Nombre del Personaje', 'Character Name');
 if (prevWork) prevWork.textContent = obra || tLang('Obra o Franquicia', 'Work or Franchise');
 if (prevBox) {
 if (img && (img.startsWith('http') || img.startsWith('data:'))) {
 prevBox.innerHTML = `<img loading="lazy" decoding="async" src="${img}" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null;this.parentElement.innerHTML='';">`;
 } else {
 prevBox.innerHTML = img || '';
 }
 }
 if (prevQuote) {
 if (cita) {
 prevQuote.style.display = 'block';
 prevQuote.textContent = `"${cita}"`;
 } else {
 prevQuote.style.display = 'none';
 }
 }
}

function seleccionarPersonajePorIndice(idx) {
 if (!window.resultadosPersonajesCache || !window.resultadosPersonajesCache[idx]) return;
 const charObj = window.resultadosPersonajesCache[idx];
 asignarPersonajeFavorito(charObj);
}

function seleccionarPersonajeOnline(safeCharJson) {
 try {
 const charObj = JSON.parse(decodeURIComponent(safeCharJson));
 asignarPersonajeFavorito(charObj);
 } catch (e) {}
}

function cargarObrasParaPersonaje() {
 const box = document.getElementById('char-obras-lista');
 if (!box) return;
 filtrarMisObrasParaPersonaje('');
}

function filtrarMisObrasParaPersonaje(filtro) {
 const box = document.getElementById('char-obras-lista');
 if (!box) return;
 const q = String(filtro || '').toLowerCase().trim();
 const regs = (estado.registros || []).filter(r => {
 if (!q) return true;
 return (r.titulo && r.titulo.toLowerCase().includes(q)) || (r.creador && r.creador.toLowerCase().includes(q));
 });

 if (!regs.length) {
 box.innerHTML = `<div style="color:var(--muted); font-size:0.82rem; padding:16px; text-align:center;">${tLang('No se encontraron registros en tu historial.', 'No entries found in your history.')}</div>`;
 return;
 }

 const l = getLang_();
 box.innerHTML = regs.slice(0, 30).map(r => {
 const catLbl = (typeof traducirNombreCat === 'function') ? traducirNombreCat(r.categoria) : r.categoria;
 const subLbl = I18N[l]?.subs?.[r.subcategoria] || r.subcategoria || '';
 return `
 <div class="char-obra-row ${obraSeleccionadaParaChar?.id === r.id ? 'selected' : ''}" onclick="seleccionarObraParaPersonaje('${r.id}')">
 <div style="width:34px; height:48px; border-radius:4px; overflow:hidden; background:#1e293b; flex-shrink:0;">
 ${r.poster ? `<img loading="lazy" decoding="async" src="${r.poster}" style="width:100%; height:100%; object-fit:cover;">` : '<div style="width:100%; height:100%; display:grid; place-items:center; font-size:0.9rem;"></div>'}
 </div>
 <div style="flex:1; min-width:0;">
 <strong style="font-size:0.86rem; color:var(--text); display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.titulo}</strong>
 <span style="font-size:0.74rem; color:var(--muted);">${catLbl} • ${subLbl}</span>
 </div>
 <span style="font-size:0.8rem; color:var(--accent);"></span>
 </div>
 `;
 }).join('');
}

function seleccionarObraParaPersonaje(idReg) {
 const r = (estado.registros || []).find(x => String(x.id) === String(idReg));
 if (!r) return;
 obraSeleccionadaParaChar = r;
 document.querySelectorAll('.char-obra-row').forEach(el => el.classList.remove('selected'));

 const formBox = document.getElementById('char-obra-selected-form');
 const imgEl = document.getElementById('char-obra-selected-img');
 const catEl = document.getElementById('char-obra-selected-cat');
 const titEl = document.getElementById('char-obra-selected-title');
 const inpName = document.getElementById('input-char-from-obra-name');

 if (imgEl) imgEl.src = r.poster || '';
 if (catEl) catEl.textContent = `${r.categoria} • ${r.subcategoria || ''}`;
 if (titEl) titEl.textContent = r.titulo;
 if (inpName) {
 inpName.value = '';
 inpName.focus();
 }
 if (formBox) formBox.style.display = 'block';
}

function confirmarPersonajeDeObra() {
 if (!obraSeleccionadaParaChar) return mostrarToastPersonalizado(userPrefs.lang === 'en' ? ' Please select a title first.' : ' Por favor selecciona una obra primero.');
 const nom = document.getElementById('input-char-from-obra-name')?.value.trim();
 const cita = document.getElementById('input-char-from-obra-quote')?.value.trim();
 if (!nom) return mostrarToastPersonalizado(userPrefs.lang === 'en' ? ' Please enter the character name.' : ' Por favor escribe el nombre del personaje.');

 const charObj = {
 nombre: nom,
 obra: obraSeleccionadaParaChar.titulo,
 categoria: obraSeleccionadaParaChar.categoria,
 imagen: obraSeleccionadaParaChar.poster || '',
 cita: cita || '',
 fuente: 'obra'
 };
 asignarPersonajeFavorito(charObj);
}

function guardarPersonajeManual() {
 const nom = document.getElementById('input-char-manual-nombre')?.value.trim();
 const obra = document.getElementById('input-char-manual-obra')?.value.trim();
 const img = document.getElementById('input-char-manual-imagen')?.value.trim();
 const cita = document.getElementById('input-char-manual-cita')?.value.trim();

 if (!nom) return mostrarToastPersonalizado(userPrefs.lang === 'en' ? ' Please enter the character name.' : ' Por favor escribe el nombre del personaje.');
 if (!obra) return mostrarToastPersonalizado(userPrefs.lang === 'en' ? ' Please enter the work or franchise origin.' : ' Por favor escribe la obra o franquicia de origen.');

 const charObj = {
 nombre: nom,
 obra: obra,
 imagen: img || '',
 cita: cita || '',
 fuente: 'manual'
 };
 asignarPersonajeFavorito(charObj);
}

function asignarPersonajeFavorito(charObj) {
 if (!charObj || !charObj.nombre) return;
 perfilUsuario.personajeFavorito = charObj;
 if (!perfilUsuario.favoritos) perfilUsuario.favoritos = {};
 perfilUsuario.favoritos.personajeFavorito = charObj;
 guardarPerfilLocal();
 renderizarPersonajeFavorito();
 cerrarModalSeleccionarPersonaje();
 mostrarToastPersonalizado(userPrefs.lang === 'en' ? ` ${charObj.nombre} is now your Favorite Character!` : ` ¡${charObj.nombre} es ahora tu Personaje Favorito!`);
 if (typeof google !== 'undefined' && google.script?.run) {
 google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
 }
}

function abrirModalConfirmarQuitarPersonaje() {
 const m = document.getElementById('modal-confirmar-quitar-personaje');
 if (m) m.style.display = 'flex';
}

function cerrarModalConfirmarQuitarPersonaje() {
 const m = document.getElementById('modal-confirmar-quitar-personaje');
 if (m) m.style.display = 'none';
}

function quitarPersonajeFavorito() {
 abrirModalConfirmarQuitarPersonaje();
}

function ejecutarQuitarPersonajeFavorito() {
 cerrarModalConfirmarQuitarPersonaje();
 perfilUsuario.personajeFavorito = null;
 if (perfilUsuario.favoritos) {
 delete perfilUsuario.favoritos.personajeFavorito;
 }
 guardarPerfilLocal();
 renderizarPersonajeFavorito();
 cerrarModalSeleccionarPersonaje();
 mostrarToastPersonalizado(userPrefs.lang === 'en' ? ' Favorite character removed from profile.' : ' Personaje favorito quitado del perfil.');
 if (typeof google !== 'undefined' && google.script?.run) {
 google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
 }
}
function abrirModalEditarPerfil() {
 document.getElementById('input-perfil-nickname').value = perfilUsuario.nickname || '';
 document.getElementById('input-perfil-bio').value = perfilUsuario.bio || '';
 avatarSeleccionadoTemp = perfilUsuario.avatar || '';
 const esFoto = avatarSeleccionadoTemp.startsWith('data:image') || avatarSeleccionadoTemp.startsWith('http');
 const prevBox = document.getElementById('crop-confirmed-preview');
 const prevImg = document.getElementById('crop-confirmed-img');
 if (esFoto) {
 if (prevImg) prevImg.src = avatarSeleccionadoTemp;
 if (prevBox) prevBox.style.display = 'flex';
 } else {
 if (prevBox) prevBox.style.display = 'none';
 }
 const fInp = document.getElementById('input-perfil-avatar-file');
 if (fInp) fInp.value = '';
 const box = document.getElementById('avatar-presets-box');
 if (box) {
 box.innerHTML = '';
 AVATARES_PRESET.forEach(emo => {
 const b = document.createElement('button');
 b.type = 'button';
 b.className = `avatar-preset-btn ${(!esFoto && avatarSeleccionadoTemp === emo) ? 'selected' : ''}`;
 b.textContent = emo;
 b.onclick = () => {
 avatarSeleccionadoTemp = emo;
 if (prevBox) prevBox.style.display = 'none';
 document.querySelectorAll('#avatar-presets-box .avatar-preset-btn').forEach(x => x.classList.remove('selected'));
 b.classList.add('selected');
 };
 box.appendChild(b);
 });
 }
 document.getElementById('modal-editar-perfil').style.display = 'flex';
}
function cerrarModalEditarPerfil() {
 document.getElementById('modal-editar-perfil').style.display = 'none';
}
function guardarCambiosPerfilUsuario() {
 const nick = document.getElementById('input-perfil-nickname').value.trim() || tLang('Cinéfilo & Lector', 'Cinephile & Reader');
 const bio = document.getElementById('input-perfil-bio').value.trim() || tLang('Coleccionando historias en Mediary', 'Collecting stories on Mediary');
 perfilUsuario.nickname = nick;
 perfilUsuario.bio = bio;
 if (avatarSeleccionadoTemp) {
 perfilUsuario.avatar = avatarSeleccionadoTemp;
 }
 guardarPerfilLocal();
 registrarCuentaEnDispositivo(estado.userEmail, perfilUsuario.nickname, perfilUsuario.avatar);
 renderizarCabeceraPerfil();
 cerrarModalEditarPerfil();
 google.script.run.withSuccessHandler(() => {
 mostrarToastPersonalizado(userPrefs.lang === 'en' ? 'Profile updated in Supabase! ' : '¡Perfil actualizado en Supabase! ');
 }).guardarPerfilUsuario(perfilUsuario, estado.userEmail);
}
function obtenerTodasLasSubcategoriasFavoritos() { const lista = []; Object.keys(CONFIG).forEach(catKey => { CONFIG[catKey].subs.forEach(s => {
// Excluir Watchlists, Temporadas y Conciertos
if (!s.esWatchlist && s.id !== 'Temporadas' && s.id !== 'Conciertos') { lista.push({ cat: catKey, catNombre: CONFIG[catKey].nombre, sub: s.id, subNombre: s.nombre, emoji: s.emoji }); }
}); }); return lista; }

function abrirModalConfigurarFavoritosVisibles() {
  const modal = document.getElementById('modal-configurar-favoritos-visibles');
  const box = document.getElementById('lista-configurar-favoritos-visibles');
  if (!modal || !box) return;

  if (!perfilUsuario.favoritosOcultos) perfilUsuario.favoritosOcultos = {};
  const subs = obtenerTodasLasSubcategoriasFavoritos();
  const l = userPrefs.lang || 'es';

  box.innerHTML = '';
  subs.forEach(item => {
    const keyFav = `${item.cat}__${item.sub}`;
    const estaOculto = !!perfilUsuario.favoritosOcultos[keyFav];
    const subLabel = (I18N[l]?.subs && I18N[l].subs[item.sub]) || item.subNombre;
    const catLabel = (typeof traducirNombreCat === 'function') ? traducirNombreCat(item.cat) : (CONFIG[item.cat]?.nombre || item.cat);

    const row = document.createElement('label');
    row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:9px 12px; border-radius:6px; cursor:pointer; background:rgba(255,255,255,0.03); transition:background 0.15s ease; border:1px solid var(--border);';
    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
        <span class="emoji-dyn" style="font-size:1.1rem; flex-shrink:0;">${item.emoji}</span>
        <div style="min-width:0; flex:1;">
          <strong style="font-size:0.86rem; color:var(--text); display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${subLabel}</strong>
          <span style="font-size:0.72rem; color:var(--muted);">${catLabel}</span>
        </div>
      </div>
      <input type="checkbox" ${estaOculto ? '' : 'checked'} style="width:18px; height:18px; accent-color:var(--accent); cursor:pointer;" onchange="toggleVisibilidadFavoritoDesdeModal('${keyFav}', this.checked)">
    `;
    box.appendChild(row);
  });

  modal.style.display = 'flex';
}

function cerrarModalConfigurarFavoritosVisibles() {
  const modal = document.getElementById('modal-configurar-favoritos-visibles');
  if (modal) modal.style.display = 'none';
  renderizarFavoritosPerfil();
}

function toggleVisibilidadFavoritoDesdeModal(keyFav, isChecked) {
  if (!perfilUsuario.favoritosOcultos) perfilUsuario.favoritosOcultos = {};
  if (isChecked) {
    delete perfilUsuario.favoritosOcultos[keyFav];
  } else {
    perfilUsuario.favoritosOcultos[keyFav] = true;
  }
  guardarPerfilLocal();
  if (typeof google !== 'undefined' && google.script && google.script.run && estado.userEmail) {
    google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
  }
}

function marcarTodosFavoritosVisibles(mostrarTodas) {
  if (!perfilUsuario.favoritosOcultos) perfilUsuario.favoritosOcultos = {};
  if (mostrarTodas) {
    perfilUsuario.favoritosOcultos = {};
  }
  guardarPerfilLocal();
  if (typeof google !== 'undefined' && google.script && google.script.run && estado.userEmail) {
    google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
  }
  abrirModalConfigurarFavoritosVisibles();
}

function toggleModoConfigurarVisiblesFavs() {
  abrirModalConfigurarFavoritosVisibles();
}
function toggleMostrarFavoritoSub(keyFav) {
  if (!perfilUsuario.favoritosOcultos) perfilUsuario.favoritosOcultos = {};
  if (perfilUsuario.favoritosOcultos[keyFav]) {
    delete perfilUsuario.favoritosOcultos[keyFav];
  } else {
    perfilUsuario.favoritosOcultos[keyFav] = true;
  }
  guardarPerfilLocal();
  renderizarFavoritosPerfil();
  if (typeof google !== 'undefined' && google.script && google.script.run && estado.userEmail) {
    google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail);
  }
}
function renderizarFavoritosPerfil() {
  const grid = document.getElementById('perfil-favoritos-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!perfilUsuario.favoritosOcultos) perfilUsuario.favoritosOcultos = {};
  const subs = obtenerTodasLasSubcategoriasFavoritos();
  const l = userPrefs.lang || 'es';
  const favFrag = document.createDocumentFragment();
  subs.forEach(item => {
    const keyFav = `${item.cat}__${item.sub}`;
    const estaOculto = !!perfilUsuario.favoritosOcultos[keyFav];
    if (estaOculto) return;

    const fav = perfilUsuario.favoritos?.[keyFav] || null;
    const subLabel = I18N[l]?.subs?.[item.sub] || item.subNombre;
    const card = document.createElement('div');
    card.className = 'fav-slot-card';
    card.onclick = () => abrirSelectorFavoritoSub(item.cat, item.sub);

    card.innerHTML = `
      <div class="fav-slot-poster" title="${fav ? fav.titulo : tLang('Elegir ', 'Choose ') + subLabel}">
        ${fav ? `
          <button type="button" class="fav-slot-edit-btn" onclick="event.stopPropagation(); abrirSelectorFavoritoSub('${item.cat}', '${item.sub}')" title="${tLang('Cambiar favorito', 'Change favorite')}" aria-label="${tLang('Editar favorito', 'Edit favorite')}">
            <svg class="h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>
          </button>
        ` : ''}
        ${fav?.poster ? `<img loading="lazy" decoding="async" src="${fav.poster}" alt="${fav.titulo}">` : `
          <div class="fav-slot-empty-wrap">
            <span style="font-size:1.15rem; line-height:1; margin-bottom:2px;">${item.emoji}</span>
            <span class="fav-empty-lbl">${tLang('+ Elegir', '+ Choose')}</span>
          </div>
        `}
      </div>
      <div class="fav-slot-info">
        <div class="fav-slot-subcat" title="${subLabel}">${subLabel}</div>
        <div class="fav-slot-title" title="${fav ? fav.titulo : tLang('Sin elegir aún', 'Not chosen yet')}">${fav ? fav.titulo : `<span style="opacity:0.35;">${tLang('Sin elegir', 'Not chosen')}</span>`}</div>
        <div class="fav-slot-meta">${(fav && fav.calificacion) ? `★ ${Number(fav.calificacion).toFixed(1)}` : '&nbsp;'}</div>
      </div>
    `;
    favFrag.appendChild(card);
  });
  grid.appendChild(favFrag);
  aplicarEstilosGlobales();
}
function perteneceASub(x, cat, sub) { if (x.categoria !== cat) return false;
if (cat === 'Peliculas') return sub === 'Películas' ? (x.subcategoria === 'Películas' || x.subcategoria === 'Nuevas' || x.subcategoria === 'Rewatches') : (sub === 'Documentales' ? x.subcategoria === 'Documentales' : x.subcategoria === sub);
if (cat === 'Series') return sub === 'Temporadas' ? (x.subcategoria === 'Temporadas' || x.subcategoria.includes('Temporada')) : (sub === 'Series Completas' ? (x.subcategoria === 'Series Completas' || x.subcategoria.includes('Serie ')) : (sub === 'Series Documentales' ? x.subcategoria === 'Series Documentales' : x.subcategoria === sub));
if (cat === 'Musica') return sub === 'Discos' ? (x.subcategoria === 'Discos' || x.subcategoria === 'Disco') : (sub === 'Artistas/Grupos' ? (x.subcategoria === 'Artistas/Grupos' || x.subcategoria === 'Artistas' || x.subcategoria === 'Artista') : (sub === 'Conciertos' ? (x.subcategoria === 'Conciertos' || x.subcategoria === 'Concierto') : x.subcategoria === sub));
if (cat === 'Juegos') return sub === 'Videojuegos' ? (x.subcategoria === 'Videojuegos' || x.subcategoria === 'Juegos' || x.subcategoria === 'General') : x.subcategoria === sub;
if (cat === 'Lecturas') return sub === 'Libros' ? (x.subcategoria === 'Libros' || x.subcategoria === 'Libro') : (sub === 'Cómics' ? (x.subcategoria === 'Cómics' || x.subcategoria === 'Cómic') : (sub === 'Mangas' ? (x.subcategoria === 'Mangas' || x.subcategoria === 'Manga') : x.subcategoria === sub));
return x.subcategoria === sub; }
const obtenerRegistrosDeSubcategoria = (cat, sub, ignorarFiltroAnio = false) => { const base = (ignorarFiltroAnio || !estado.anioActivo || estado.anioActivo === 'todos') ? estado.registros : estado.registros.filter(r => extraerAnioDeRegistro(r) === estado.anioActivo); return base.filter(x => perteneceASub(x, cat, sub)); }; function abrirSelectorFavoritoSub(cat, sub) { estado.subFavEnEdicion = { cat, sub }; const keyFav = `${cat}__${sub}`;
const subLabel = I18N[getLang_()]?.subs?.[sub] || sub;
document.getElementById('titulo-modal-fav').textContent = tLang(` Favorito en ${subLabel}`, ` Favorite in ${subLabel}`); document.getElementById('input-filtro-fav').value = ''; document.getElementById('btn-quitar-fav').style.display = perfilUsuario.favoritos?.[keyFav] ? 'inline-block' : 'none';
filtrarOpcionesFavorito(''); document.getElementById('modal-seleccionar-favorito').style.display = 'flex'; }
function cerrarModalSeleccionarFavorito() { document.getElementById('modal-seleccionar-favorito').style.display = 'none'; estado.subFavEnEdicion = null; }
function filtrarOpcionesFavorito(q) { if (!estado.subFavEnEdicion) return; const { cat, sub } = estado.subFavEnEdicion; const box = document.getElementById('lista-candidatos-fav'); box.innerHTML = ''; const qNorm = (q || '').trim().toLowerCase();
const subLabel = I18N[getLang_()]?.subs?.[sub] || sub;
const propios = obtenerRegistrosDeSubcategoria(cat, sub, true) .filter(r => !qNorm || r.titulo.toLowerCase().includes(qNorm) || (r.creador || '').toLowerCase().includes(qNorm))
.sort((a, b) => (Number(b.calificacion) || 0) - (Number(a.calificacion) || 0)); const vistos = new Set(); propios.forEach(r => { const k = r.titulo.toLowerCase();
if (vistos.has(k)) return; vistos.add(k); const row = document.createElement('div'); row.className = 'result-item'; row.style.borderRadius = '8px'; row.style.border = '1px solid var(--border)'; row.innerHTML = ` <img loading="lazy" decoding="async" class="result-thumb" src="${r.poster || 'data:image/svg+xml,'}"> <div style="flex:1;"> <div style="font-weight:700; font-size:0.9rem;">${r.titulo}</div> <div style="font-size:0.78rem; color:var(--muted);">${r.creador || ''} ${r.anio ? '(' + r.anio + ')' : ''} · <span style="color:var(--star-active);"> ${Number(r.calificacion || 0).toFixed(1)}</span></div> </div> <button type="button" class="btn-wl-play" style="max-width:85px;">${tLang('Elegir', 'Choose')} </button> `;
row.onclick = () => asignarFavoritoSubcategoria({ titulo: r.titulo, creador: r.creador, anio: r.anio, poster: r.poster, calificacion: r.calificacion
}); box.appendChild(row); }); if (!propios.length && !qNorm) { box.innerHTML = `<div style="padding:14px; text-align:center; color:var(--muted); font-size:0.84rem;">${tLang(`No tienes registros aún en <strong>${subLabel}</strong>. Escribe el título arriba para buscarlo en línea y elegirlo como favorito.`, `You don't have entries in <strong>${subLabel}</strong> yet. Type a title above to search online and pick it as your favorite.`)}</div>`; }
clearTimeout(timerDebounceFav); if (qNorm.length >= 2) { const loadingMsg = document.createElement('div'); loadingMsg.style.cssText = 'padding:8px; color:var(--muted); font-size:0.78rem; text-align:center;'; loadingMsg.textContent = tLang('Buscando...', 'Searching...');
box.appendChild(loadingMsg); timerDebounceFav = setTimeout(() => { google.script.run.withSuccessHandler(items => { if (loadingMsg.parentNode) loadingMsg.remove();
(items || []).forEach(it => { const k = (it.tituloOriginal || '').toLowerCase(); if (vistos.has(k)) return; vistos.add(k); const row = document.createElement('div'); row.className = 'result-item'; row.style.borderRadius = '8px'; row.style.border = '1px dashed var(--border)'; row.innerHTML = ` <img loading="lazy" decoding="async" class="result-thumb" src="${it.poster || 'data:image/svg+xml,'}"> <div style="flex:1;"> <div style="font-weight:700; font-size:0.9rem;">${it.tituloOriginal}</div> <div style="font-size:0.78rem; color:var(--muted);">${it.creador || ''} ${it.anio ? '(' + it.anio + ')' : ''} <span style="color:var(--accent);">(${tLang('Catálogo online', 'Online catalog')})</span></div> </div> <button type="button" class="btn-wl-play" style="max-width:85px;">${tLang('Elegir', 'Choose')} </button> `;
row.onclick = () => asignarFavoritoSubcategoria({ titulo: it.tituloOriginal, creador: it.creador, anio: it.anio, poster: it.poster, calificacion: 5
}); box.appendChild(row); }); }).buscarEnServidor(q.trim(), cat, sub); }, 150); }
}
function asignarFavoritoSubcategoria(favObj) { if (!estado.subFavEnEdicion) return; const { cat, sub } = estado.subFavEnEdicion; if (!perfilUsuario.favoritos) perfilUsuario.favoritos = {}; perfilUsuario.favoritos[`${cat}__${sub}`] = favObj;
const subLabel = I18N[getLang_()]?.subs?.[sub] || sub;
guardarPerfilLocal(); renderizarFavoritosPerfil(); cerrarModalSeleccionarFavorito(); google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail); mostrarToastPersonalizado(userPrefs.lang === 'en' ? ` "${favObj.titulo}" chosen as favorite in ${subLabel}` : ` "${favObj.titulo}" elegido como favorito de ${subLabel}`); }
function quitarFavoritoSubcategoria() { if (!estado.subFavEnEdicion) return; const { cat, sub } = estado.subFavEnEdicion; if (perfilUsuario.favoritos) delete perfilUsuario.favoritos[`${cat}__${sub}`];
guardarPerfilLocal(); renderizarFavoritosPerfil(); cerrarModalSeleccionarFavorito(); google.script.run.guardarPerfilUsuario(perfilUsuario, estado.userEmail); }
// === VISTA EN GRANDE DE AVATARES / FOTOS DE PERFIL (LONG PRESS) ===
let _longPressTimer = null;
let _longPressTriggered = false;
let _longPressStartX = 0;
let _longPressStartY = 0;
let _avatarTargetInfo = null;

function abrirLightboxAvatar(avatarData, nombre = '') {
  if (!avatarData) avatarData = '🦊';
  const modal = document.getElementById('modal-lightbox-avatar');
  if (!modal) return;
  const box = document.getElementById('lightbox-avatar-content');
  const nameEl = document.getElementById('lightbox-avatar-name');
  const l = userPrefs.lang || 'es';
  if (nameEl) nameEl.textContent = nombre ? (nombre.startsWith('@') ? nombre : `${nombre}`) : '';
  
  const esImg = typeof avatarData === 'string' && (avatarData.startsWith('http') || avatarData.startsWith('data:image'));
  if (esImg) {
    box.innerHTML = `<img src="${avatarData}" alt="Avatar" class="lightbox-avatar-img">`;
  } else {
    box.innerHTML = `<div class="lightbox-avatar-emoji">${avatarData}</div>`;
  }
  modal.style.display = 'flex';
}
window.abrirLightboxAvatar = abrirLightboxAvatar;

function cerrarLightboxAvatar() {
  const modal = document.getElementById('modal-lightbox-avatar');
  if (modal) modal.style.display = 'none';
}
window.cerrarLightboxAvatar = cerrarLightboxAvatar;

function obtenerInfoAvatarDesdeElemento(el) {
  if (!el) return null;
  const target = el.closest('[data-avatar-zoom], #perfil-avatar-render, #amigo-modal-avatar, #act-modal-friend-avatar, .feed-user-avatar, .friend-avatar-wrap, .discover-friend-avatar-btn, .discover-avatar-circle, .profile-avatar-box');
  if (!target) return null;

  if (target.getAttribute('data-avatar-zoom')) {
    return {
      avatar: target.getAttribute('data-avatar-zoom'),
      name: target.getAttribute('data-avatar-name') || ''
    };
  }
  if (target.id === 'perfil-avatar-render' || target.classList.contains('profile-avatar-box')) {
    return {
      avatar: perfilUsuario.avatar || '🦊',
      name: perfilUsuario.nickname || tLang('Mi Perfil', 'My Profile')
    };
  }
  if (target.id === 'amigo-modal-avatar') {
    return {
      avatar: amigoSeleccionadoActual ? amigoSeleccionadoActual.avatar : '🦊',
      name: amigoSeleccionadoActual ? amigoSeleccionadoActual.nickname : tLang('Amigo', 'Friend')
    };
  }
  const img = target.querySelector('img');
  if (img && img.src) {
    return {
      avatar: img.src,
      name: target.getAttribute('data-avatar-name') || target.getAttribute('title') || ''
    };
  }
  const span = target.querySelector('span');
  if (span && span.textContent.trim()) {
    return {
      avatar: span.textContent.trim(),
      name: target.getAttribute('data-avatar-name') || target.getAttribute('title') || ''
    };
  }
  return null;
}

function inicializarLongPressAvatares() {
  const onStart = (clientX, clientY, target) => {
    const info = obtenerInfoAvatarDesdeElemento(target);
    if (!info) return;
    _avatarTargetInfo = info;
    _longPressTriggered = false;
    _longPressStartX = clientX;
    _longPressStartY = clientY;
    clearTimeout(_longPressTimer);
    _longPressTimer = setTimeout(() => {
      _longPressTriggered = true;
      if (window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate(40); } catch (_) {}
      }
      abrirLightboxAvatar(_avatarTargetInfo.avatar, _avatarTargetInfo.name);
    }, 450);
  };

  const onMove = (clientX, clientY) => {
    if (!_longPressTimer) return;
    if (Math.hypot(clientX - _longPressStartX, clientY - _longPressStartY) > 10) {
      clearTimeout(_longPressTimer);
      _longPressTimer = null;
    }
  };

  const onCancel = () => {
    if (_longPressTimer) {
      clearTimeout(_longPressTimer);
      _longPressTimer = null;
    }
  };

  // Touch handlers
  document.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      onStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 0) {
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (_longPressTriggered) {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => { _longPressTriggered = false; }, 350);
    }
    onCancel();
  }, { passive: false });

  document.addEventListener('touchcancel', onCancel, { passive: true });

  // Mouse handlers (Desktop)
  document.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      onStart(e.clientX, e.clientY, e.target);
    }
  });

  document.addEventListener('mousemove', (e) => {
    onMove(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', (e) => {
    if (_longPressTriggered) {
      e.stopPropagation();
      setTimeout(() => { _longPressTriggered = false; }, 350);
    }
    onCancel();
  });

  // Capture clicks to suppress triggering normal action if long press activated
  document.addEventListener('click', (e) => {
    if (_longPressTriggered) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
}

window.esPortadaImagenPersonalizada = esPortadaImagenPersonalizada;
window.obtenerPortadaActual = obtenerPortadaActual;
window.aplicarPortadaEnHeroCard = aplicarPortadaEnHeroCard;
window.abrirModalElegirPortada = abrirModalElegirPortada;
window.cerrarModalElegirPortada = cerrarModalElegirPortada;
window.procesarSubidaPortadaCustom = procesarSubidaPortadaCustom;
window.quitarPortadaPersonalizada = quitarPortadaPersonalizada;
window.renderizarOpcionesPortadas = renderizarOpcionesPortadas;
window.seleccionarPortadaPerfil = seleccionarPortadaPerfil;

