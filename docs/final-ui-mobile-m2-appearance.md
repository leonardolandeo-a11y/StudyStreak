# M2 — Apariencia e identidad Mobile F1/F5

14 de noviembre de 2026 · `feat/ui-ux-web-mobile` · implementación: **`76fa0038f98a218b8fd9a8d56a8bf883780daab6`**, `feat(mobile): align themes branding and navigation with web`.

## Cambios

- Cinco familias Neutral/Lavender/Sage/Amber/Sky con los valores Light/Dark de Web; System sigue al dispositivo. Nuevas preferencias: **System + Neutral + Mint**. Los cuatro acentos y Reduce Motion siguen independientes.
- Settings ofrece radios nativos con muestras clara/oscura, selección visible y atributos accesibles también en Expo Web. Restore defaults afecta solo a apariencia.
- Persistencia v2 por cuenta y guest, con archivos atómicos nativos y claves separadas en la simulación Web. La configuración v1 era global: se conserva intacta y se migra una sola vez a la primera cuenta autenticada que la encuentre. Mantiene modo/acento/Reduce Motion y adopta Lavender para conservar la identidad previa. Las siguientes cuentas empiezan con defaults; no es posible reconstruir elecciones históricas por cuenta que v1 nunca almacenó. Se serializan lecturas, reclamación de migración y escrituras entre instancias del proceso.
- Un único AppearanceProvider conoce la cuenta dentro de AuthProvider; no se cambia la lógica de autenticación ni se añade una key al router. La hidratación muestra loading antes de habilitar pantallas con preferencias de otra cuenta. Cambiar el tema no remonta el navegador/audio.
- Se eliminan las superficies lavanda forzadas de las paletas de trabajo/Dashboard. Pantallas, tarjetas, hero, formularios, modales, navegación y badges de dificultad utilizan tokens semánticos. Se conservan colores intencionales del pixel art, discos y vídeo.
- Login/Register conserva composición, teclado, SafeArea y recursos originales. Paisaje/marco permanecen fijos; tres siluetas de nubes equivalentes a Web se desplazan con copias continuas independientes de 60/75/90 s. Noche utiliza estrellas con opacidad suave. Se pausa por pérdida de foco/background, Reduce Motion o limitación de memoria, conservando el fallback existente. Sin UTEC ni nuevos recursos artísticos.
- Marca nativa con taza de 52 px en navegación, nombre monoespaciado y eslogan visible/accesible. Drawer y stacks nativos conservan sus controles existentes; no se añade otro Back/Settings. Loading sustituye el spinner por taza y espiral nativa de 3,6 s, con colores semánticos y pausa por background/Reduce Motion/hidratación.
- Validations elimina únicamente el acceso textual Member Profile y su import; se conservan pasos, selección, IDs, evidencias y operaciones.

## Verificación ejecutada

Desde `frontend-mobile`, salvo el control Git:

| Comprobación | Resultado y alcance |
| --- | --- |
| `npm run lint` | Aprobado, sin warnings al cierre. |
| `./node_modules/.bin/tsc --noEmit --pretty false` | Aprobado. |
| `node --experimental-strip-types --test tests/*.test.mjs` | **44/46 archivos aprobados**, sin skips; dos comparaciones previas pendientes, detalladas abajo. |
| Regresión final de apariencia, renderizado, escenas, marca y dificultad: seis archivos | 6/6 aprobados después de los últimos ajustes de producto. `m2Appearance.test.mjs` ampliado después: 6/6 casos aprobados. |
| `m2Appearance.test.mjs` | 80 combinaciones efectivas (cinco familias × Light/Dark/System claro/System oscuro × cuatro acentos), valores Web, contraste de texto ≥4,5, independencia del acento, migración nativa/Web, cuentas, selector, loader y eliminación del enlace del wizard. Renderizado/pruebas con mocks nativos; no dispositivo. |
| `CI=1 EXPO_OFFLINE=1 npx expo export --platform web --output-dir .expo/integration-export` | Aprobado; export del proyecto Mobile para simulación. No se compila `frontend-web` ni un binario nativo. |
| `node tests/m2Appearance.browser.mjs` | Chrome: 80 combinaciones, System con ambos esquemas, migración real en localStorage, A→B→A, restore independiente de widgets/ambientes, rutas principales y superficies de paneles, sin overflow a 320/390/768 px. API íntegramente interceptada. |
| `node tests/mobileAuthScenes.browser.mjs` | Chrome: mañana/tarde/noche, nubes con transformaciones diferentes medidas en tiempo real, estrellas, paisaje fijo, background/Reduce Motion, formularios/error/registro/login/logout simulados, foco de campos y viewport corto. Se inspeccionó además la captura de acceso de mañana generada por esta regresión. |
| `node tests/mobileNavigation.browser.mjs` | Chrome: Drawer, formularios contextuales, tabs/historial, perfiles, Back y rutas a 320–768 px. |
| `git diff --check` / staging explícito | Aprobados; solo archivos de M2 incluidos. |

Las primeras pruebas de apariencia tenían expectativas del default/formato v1; se actualizaron al contrato v2. La regresión Chrome detectó que `accessibilityState` no emitía por sí solo `aria-checked` en esta versión de Expo Web: se añadieron atributos explícitos, conservando el estado nativo. La repetición quedó aprobada.

**Dos fallos previos conservados:** `dashboardWidgets.test.mjs` compara todo el archivo de preferencias Web/Mobile, aunque Web F3 ya incluye el calendario independiente; `environmentRendering.test.mjs` exige identidad de coordenadas de ambientes que ya difieren. Sus pruebas y archivos de preferencias/escenas Mobile permanecen sin cambios respecto de HEAD previo a M2. No se implementa M3 ni se relajan esas expectativas para presentar una suite completamente verde.

## Límites

No se probaron Android/iOS físicos, lector de pantalla, teclado del SO, SecureStore real, permisos ni integración autenticada real. Chrome comprueba Expo Web con fixtures; el test del loader comprueba renderizado/política de movimiento, no certifica su rotación en dispositivo. Permanecen pendientes el recorrido físico Back/deep links/logout, reanudación, accesibilidad y percepción de animaciones. La migración v1 tiene un propietario único porque el origen no distinguía cuentas; su serialización no constituye un bloqueo distribuido entre procesos/pestañas distintos.

## Archivos y Git

Todos los archivos de código/pruebas bajo `frontend-mobile`:

- Rutas: `src/app/_layout.tsx`, `src/app/(app)/settings.tsx`, `src/app/(app)/(main)/_layout.tsx`, `src/app/(app)/(main)/(menu)/validations/index.tsx`.
- Apariencia: `src/features/appearance/theme.ts`, `src/services/appearanceStorage.ts`, `src/contexts/AppearanceProvider.tsx`, `src/components/academic/{Academic.tsx,workspacePalette.ts}`.
- Presentación: `src/components/auth/{AuthScreen.tsx,StudyScene.tsx,PixelClouds.tsx}`, `src/components/branding/StudyBrand.tsx`, `src/components/environment/StudyEnvironment.tsx`, `src/components/goals/GoalDifficulty.tsx`, `src/components/media/RoomCollaboration.tsx`, `src/components/ui/{Screen.tsx,AppLoadingScreen.tsx}`.
- Pruebas: `tests/{appearanceState.test.mjs,mobileAppearanceRendering.test.mjs,mobileAuthScenes.browser.mjs,m2Appearance.test.mjs,m2Appearance.browser.mjs}`.
- Documentación: este informe, registrado separadamente para incluir el hash definitivo de implementación.

Cambios ajenos, incluido el informe M1 sin seguimiento, preservados y fuera del staging. Sin cambios en Web, servicios API, backend, dependencias o infraestructura. Sin push, merge, reset, clean, stash ni amend. M2 finalizado; M3/M4 no iniciados.
