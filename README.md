# ✨ MyMediary (Mediary)

> **Español** · [English version below](#english)

Aplicación web y PWA multiusuario para llevar el registro, estadísticas, favoritos, calendario de estrenos y watchlists de **Películas, Series, Música, Videojuegos y Lecturas**, sincronizada en tiempo real con **Supabase** e integraciones externas (**Spotify, Last.fm, Steam, PlayStation, TMDB, RAWG, IGDB, OpenLibrary, Google Books, Deezer, iTunes**).

## 📂 Estructura del Proyecto

```text
MyMediary/
├── index.html                  # Shell HTML principal (PWA / GitHub Pages)
├── sw.js                       # Service Worker (precaché modular + SWR + límite de imágenes)
├── manifest.json               # Manifiesto PWA (tema claro)
├── manifest-dark.json          # Manifiesto PWA (tema oscuro)
├── .well-known/assetlinks.json # Verificación Android TWA (Play Store)
├── styles/                     # Hojas de estilo modulares
│   ├── base.css                # Tokens, reset y diseño base
│   ├── themes.css              # 8 temas canónicos (Slate, Emerald, Espresso, Dracula × Dark/Light)
│   ├── minimalist.css          # Modo Minimalista
│   ├── modern-ui.css           # Componentes modernos y micro-interacciones
│   ├── features.css            # Catálogo, tarjetas, modales y controles
│   ├── integrations.css        # Tarjetas de Spotify, Last.fm, Steam y PlayStation
│   ├── profile-stats.css       # Perfil de usuario y estadísticas avanzadas
│   ├── calendar.css            # Calendario diario y próximos estrenos
│   └── responsive.css          # Adaptación móvil y tablet
├── js/
│   ├── core/                   # Configuración, estado global, PWA y capa Supabase/APIs
│   │   ├── config.js
│   │   ├── state.js
│   │   ├── pwa.js
│   │   └── supabase-api.js
│   ├── i18n/                   # Sistema bilingüe 100% Español / Inglés
│   │   ├── es.js               # Diccionario Español
│   │   ├── en.js               # Diccionario Inglés
│   │   └── i18n.js             # Motor de traducción en vivo + Flatpickr locale
│   ├── features/               # Módulos funcionales desacoplados
│   │   ├── auth.js             # Autenticación y sesión
│   │   ├── navigation.js       # Navegación, vistas y historial
│   │   ├── home.js             # Inicio, rachas, actividad y resumen
│   │   ├── catalog.js          # Listas, búsqueda en vivo, Discover y watchlists
│   │   ├── calendar.js         # Calendario de registros y próximos estrenos
│   │   ├── profile.js          # Perfil, avatares, portadas, canción y personaje favorito
│   │   ├── stats.js            # Estadísticas generales y por categoría
│   │   ├── friends.js          # Comunidad, feed de amigos y privacidad
│   │   ├── notifications.js    # Notificaciones in-app y push
│   │   ├── roulette.js         # Ruleta de decisiones con amigos
│   │   └── settings.js         # Configuración, temas, idioma y respaldos
│   ├── integrations/           # Conectores de plataformas externas
│   │   ├── spotify.js
│   │   ├── lastfm.js
│   │   ├── steam.js
│   │   └── playstation.js
│   └── main.js                 # Punto de entrada e inicialización
├── vendor/flatpickr/           # Selector de fechas (cargado con defer)
└── scripts/
    └── verify.mjs              # Verificador automático (sintaxis JS, paridad ES/EN y assets)
```

## 🛠️ Verificación y Desarrollo

MyMediary es 100% estática (sin paso de compilación requerido) y se despliega directamente en **GitHub Pages**.

Antes de publicar cambios, ejecuta el verificador de integridad:

```bash
node scripts/verify.mjs
```

Valida automáticamente:
- Sintaxis de todos los archivos JavaScript (`js/**/*.js` y `sw.js`).
- Paridad del 100% de claves entre `js/i18n/es.js` y `js/i18n/en.js`.
- Resolución de todos los atributos `data-i18n*` en `index.html`.
- Existencia de todos los recursos locales referenciados en `index.html` y `sw.js`.

---

<a id="english"></a>

## 🌍 English

Multi-user web app and PWA to track logs, advanced statistics, favorites, release calendars, and watchlists across **Movies, Series, Music, Video Games, and Reading**, synced in real time with **Supabase** and external platforms (**Spotify, Last.fm, Steam, PlayStation, TMDB, RAWG, IGDB, OpenLibrary, Google Books, Deezer, iTunes**).

### Key Highlights
- **Modular static architecture**: Zero-build GitHub Pages deployment with clean separation across `styles/`, `js/core/`, `js/i18n/`, `js/features/`, `js/integrations/`, and `vendor/`.
- **100% Bilingual (ES / EN)**: Every label, modal, tooltip, calendar view, statistic, notification, and integration guide updates live between Spanish and English.
- **PWA & Offline-ready**: Modular precaching with Stale-While-Revalidate in `sw.js`, lazy font loading, lazy image decoding, and Android TWA support via `.well-known/assetlinks.json`.
- **Integrity check**: Run `node scripts/verify.mjs` to validate JS syntax, ES/EN dictionary parity, HTML `data-i18n*` bindings, and precached asset paths.