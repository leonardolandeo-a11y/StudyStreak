# F5 — Recuperación del paisaje original

## Recuperación selectiva desde `a91f20b`

- Login/Register vuelve a pintar íntegramente `scene.window.landscape`, como en `a91f20b`. Se retira la superposición UTEC/Barranco. Los datos del paisaje y los seis SVG/PNG de `public/auth` coinciden byte por byte con esa referencia y no se modificaron.
- `SidebarSkyline.tsx` se recupera íntegramente desde `a91f20b`, incluyendo su geometría pixel art original y colores semánticos F1. Se elimina únicamente el ajuste de escala y desplazamiento que se había añadido para el paisaje UTEC contraído.
- Se conserva el control aprobado: chevron pequeño sin texto junto a la taza; contraído, la taza expande el sidebar y recibe el foco. También se conservan marca, navegación, formularios, Validations, accesibilidad y temas de F1–F5.
- Las nubes existentes siguen separadas, recortadas al cielo y con ciclos horizontales de 60/75/90 segundos. El paisaje permanece fijo. Reduce Motion y background mantienen su prioridad.

No se revierte ningún commit completo ni se crean ilustraciones nuevas. El componente de dibujo UTEC deja de utilizarse tanto en autenticación como en el sidebar.

## Comparación visual

Se capturó el estado previo, la recuperación y el componente `StudyScene` exacto de `a91f20b`, cargado mediante un alias temporal de Vite fuera del código de entrega. La referencia histórica usa los mismos formularios/branding actuales y movimiento reducido para comparar únicamente el arte. Las nubes conservan la mejora posterior y por ello su forma/posición puede diferir de la referencia; el paisaje coincide.

[Antes Login](images/f5-original-restored/before-login.png) · [Antes sidebar](images/f5-original-restored/before-sidebar.png)

| Franja | Componente histórico | Recuperación actual |
| --- | --- | --- |
| Mañana | [a91f20b](images/f5-original-restored/after-reference-original-morning.png) | [Actual](images/f5-original-restored/after-login-morning.png) |
| Tarde | [a91f20b](images/f5-original-restored/after-reference-original-afternoon.png) | [Actual](images/f5-original-restored/after-login-afternoon.png) |
| Noche | [a91f20b](images/f5-original-restored/after-reference-original-night.png) | [Actual](images/f5-original-restored/after-login-night.png) |

[Skyline original expandido](images/f5-original-restored/after-expanded.png) · [Contraído](images/f5-original-restored/after-collapsed.png)

[Nubes 0 s](images/f5-original-restored/after-clouds-t00.png) · [10 s](images/f5-original-restored/after-clouds-t10.png) · [20 s](images/f5-original-restored/after-clouds-t20.png)

Se inspeccionaron capturas reales en Chrome. La prueba mide transformaciones con `performance.now()` durante 20 segundos reales, sin adelantar animaciones: las tres nubes se desplazan y paisaje/marco/imagen mantienen su transformación.

## Verificación

- ESLint, TypeScript (`npx tsc -b --pretty false`) y build Web: aprobados; persiste el aviso previo de chunks mayores de 500 kB.
- `node tests/authPixelHotfix.browser.mjs`: aprobado. Movimiento real, background/foreground, Reduce Motion, tres franjas, 390/768/1440/1920 px, colapso/expansión mediante teclado, foco y combinaciones de apariencia.
- `F5_CAPTURES=../../.local/f5-pixel/restored-branding/ node tests/finalBrandingNavigation.browser.mjs`: aprobado. Marca, navegación protegida, historial, logout y selección de Validations.
- `SIDEBAR_CAPTURES=../../.local/f5-pixel/restored-sidebar/ node --test --test-concurrency=1 tests/authScenes.test.mjs tests/sidebarBackground.test.mjs`: 4 pruebas aprobadas. Autenticación simulada, fallback estático, 80 combinaciones de apariencia y contraste.
- Comprobación directa contra Git: skyline y datos originales idénticos a `a91f20b`; seis recursos auth idénticos. Los 39 archivos preexistentes presentes del inventario conservan sus checksums.

Las pruebas de API son simuladas; no se escriben datos persistentes. Sin cambios en Mobile, backend ni infraestructura.

## Archivos y Git

`frontend-web/src/components/auth/StudyScene.tsx`, `frontend-web/src/components/layout/SidebarSkyline.tsx`, `frontend-web/src/components/layout/sidebar.css`; pruebas `authPixelHotfix.browser.mjs`, `finalBrandingNavigation.browser.mjs`, `sidebarBackground.test.mjs`; este informe y `docs/images/f5-original-restored/`.

Commit local aislado: `fix(web): restore original auth landscape and sidebar skyline`. Hash mediante `git log -1 --format=%h -- docs/final-ui-f5-original-restored.md`. Sin push, sin operaciones destructivas y sin iniciar F6.
