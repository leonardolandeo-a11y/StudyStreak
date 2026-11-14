# F5 Hotfix — Pixel art original

## Corrección

Se conserva la habitación original de Login/Register: escritorio, libros, taza, marco, silla y recursos SVG/PNG existentes sin modificaciones. Solo se reemplaza el exterior por formas planas de píxel grande: campus escalonado inspirado en UTEC, laderas de Barranco y puente. No se incorporan ilustraciones detalladas generadas ni recursos externos.

La misma silueta SVG simplificada ocupa la franja inferior del sidebar, conservando dimensiones y colores semánticos de Background Theme; los acentos siguen siendo independientes.

Tres nubes SVG independientes recorren horizontalmente el cielo en 60, 75 y 90 segundos. Cada silueta tiene una copia a 240 unidades para cerrar el bucle sin saltos. Un clip específico limita las nubes al cielo. Edificios, marco e imagen completa permanecen inmóviles; se retiró el antiguo parallax exterior. Se reutiliza la pausa por visibilidad y movimiento reducido existente.

Expandido: chevron izquierdo sin texto junto a la taza. Contraído: la propia taza es el botón de expansión, sin otro control independiente. Ambos tienen nombre accesible, tooltip y foco visible; el foco pasa al control equivalente al cambiar de estado.

## Verificación

- ESLint, TypeScript (`tsc -b --pretty false`) y build Web: aprobados. Persiste el aviso de tamaño del chunk de Study Rooms, fuera de este ajuste.
- `node --test --test-concurrency=1 tests/authScenes.test.mjs tests/sidebarBackground.test.mjs`: 4 pruebas aprobadas. Autenticación simulada, fallback estático, movimiento y combinaciones de temas/contraste.
- `node tests/authPixelHotfix.browser.mjs`: aprobado en Chrome. Capturas reales separadas por 10 segundos, sin adelantar la animación. En aproximadamente 20,2 segundos, las posiciones X pasaron de −1,87/−1,49/−1,24 a −82,66/−66,13/−55,11 unidades SVG. Las transformaciones de edificio, marco e imagen permanecieron constantes.
- La misma prueba comprueba pausa/background, retorno, Reduce Motion, mañana/tarde/noche, 390/768/1440/1920 px, colapso con mouse y expansión mediante Enter, transferencia de foco y 80 combinaciones de familia/modo/acento.
- `node tests/finalBrandingNavigation.browser.mjs`: aprobado; navegación, rutas protegidas, historial, logout y selección de Validations sin regresiones.
- Inspección visual de Login y sidebar expandido/contraído. Pruebas con API simulada, sin escrituras en PostgreSQL ni verificación en Android físico.

## Capturas

[Login anterior](images/f5-pixel-hotfix/before-login.png) · [Sidebar anterior](images/f5-pixel-hotfix/before-sidebar.png)

[Nubes 0 s](images/f5-pixel-hotfix/after-clouds-t00.png) · [10 s](images/f5-pixel-hotfix/after-clouds-t10.png) · [20 s](images/f5-pixel-hotfix/after-clouds-t20.png)

[Mañana](images/f5-pixel-hotfix/after-login-morning.png) · [Tarde](images/f5-pixel-hotfix/after-login-afternoon.png) · [Noche](images/f5-pixel-hotfix/after-login-night.png)

[Sidebar expandido](images/f5-pixel-hotfix/after-expanded.png) · [Contraído](images/f5-pixel-hotfix/after-collapsed.png)

## Archivos y Git

Componentes: `auth/{AuthLayout,StudyScene,PixelClouds}.tsx`, `auth/auth.css`, `branding/BarrancoSilhouette.tsx`, `layout/AppSidebar.tsx` y `layout/sidebar.css`.

Pruebas: `authPixelHotfix.browser.mjs`, `authScenes.test.mjs`, `sidebarBackground.test.mjs`, `finalBrandingNavigation.browser.mjs`. Además, este informe y `docs/images/f5-pixel-hotfix/`.

Commit local aislado con mensaje `fix(web): preserve pixel auth scenery and simplify sidebar controls`; consultar su hash con `git log -1 --format=%h -- docs/final-ui-f5-pixel-hotfix.md`.

Los 39 archivos preexistentes presentes del inventario local conservan sus checksums. No se modifican Mobile, backend, infraestructura, contratos ni lógica de autenticación. No se inicia F6.
